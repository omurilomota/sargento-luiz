/**
 * O bot de `npm run sessao`, extraído para módulo porque passou a ter dois
 * consumidores: a sessão longa (`session.mjs`) e a varredura das 16 fases
 * (`fases-todas.mjs`). Duplicar o laço de desvio em dois arquivos faria o mesmo
 * defeito aparecer duas vezes: corrigido num harness e esquecido no outro.

 * O bot NÃO é um jogador bom. Ele não usa dash, escudo nem fúria, não busca
 * cobertura e atira com a arma inicial. É o PISO de comparação: se uma fase
 * mata um bot que desvia de inimigo e de barril, ela mata mais um humano.
 */
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { direcaoDodge } from './dodge.mjs';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DIST = join(RAIZ, 'dist');
export const SHOTS = join(RAIZ, 'tools', 'shots');

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png',
  '.ogg': 'audio/ogg', '.md': 'text/markdown',
};

/** Raio além do qual um INIMIGO deixa de ser ameaça, em px. Política do bot. */
const RAIO_PERIGO = 150;
/**
 * Folga além do raio real da ameaça.
 *
 * O raio sozinho é o instante em que o dano acontece — tarde demais, porque o
 * bot decide a cada 200ms e o jogo roda a 60. A folga é o tempo de reação.
 */
const FOLGA = 90;

const PATRULHA = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];

/**
 * Sobe o `dist/` e abre o jogo em modo campanha, já dentro da partida.
 *
 * @param {{largura?: number, altura?: number, chromium: any}} deps
 *   `chromium` é injetado para o teste poder passar um stub.
 */
export async function abrirJogo({ chromium, largura = 1280, altura = 720 }) {
  const s = createServer(async (req, res) => {
    const url = (req.url || '/').split('?')[0];
    const p = join(DIST, url === '/' ? 'index.html' : decodeURIComponent(url));
    if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  });
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  const porta = s.address().port;
  mkdirSync(SHOTS, { recursive: true });

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage({ viewport: { width: largura, height: altura } });

  const erros = [];
  page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') erros.push(`console: ${m.text()}`); });

  await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.keyboard.press('Enter');   // menu -> cutscene
  await page.waitForTimeout(1300);
  await page.keyboard.press('Backspace'); // pula a cutscene
  await page.waitForTimeout(1000);

  return {
    page,
    erros,
    fechar: async () => { await browser.close(); s.close(); },
  };
}

/**
 * Puxa o jogador para a fase `i` sem jogar as anteriores.
 *
 * É isto que fecha o §1.4: a pergunta era "a telemetria não alcança
 * Espaço/Castelo/Bunker", e a resposta não era treinar o bot para sobreviver às
 * 7 fases anteriores — é que medir uma fase específica não exige chegar nela
 * jogando.
 */
export async function irParaFase(page, i) {
  const idx = await page.evaluate((n) => window.__ashfall.irParaFase(n), i);
  const cfg = await page.evaluate(() => window.__ashfall.fase());
  await page.waitForTimeout(900);
  return { indice: idx, ...cfg };
}

/**
 * Cria o bot preso a uma `page`.
 *
 * `medir(segundos)` roda o laço e devolve as amostras de telemetria. O mouse
 * fica apertado do começo ao fim: o atirar é contínuo, e soltar entre amostras
 * dava ao bot uma cadência de tiro artificialmente boa.
 */
export function criarBot(page, { largura = 1280, altura = 720, atirar = true } = {}) {
  const mouse = page.mouse;
  let teclasSoltas = new Set();
  let atirando = false;

  async function soltarTeclas() {
    for (const k of [...teclasSoltas]) await page.keyboard.up(k);
    teclasSoltas.clear();
  }

  /** Aperta exatamente `teclas`; solta o resto (o input do jogo é booleano). */
  async function andarPara(teclas) {
    const alvo = new Set(teclas);
    for (const k of [...teclasSoltas]) {
      if (!alvo.has(k)) { await page.keyboard.up(k); teclasSoltas.delete(k); }
    }
    for (const k of teclas) {
      if (!teclasSoltas.has(k)) { await page.keyboard.down(k); teclasSoltas.add(k); }
    }
  }

  /** Vetor jogador→ameaça, ou null. Inimigo E barril entram na mesma conta. */
  async function vetorDaAmeaca() {
    return page.evaluate(({ perigo, folga }) => {
      const g = window.__ashfall;
      const a = g.ameacaMaisProxima();
      if (!a) return null;
      if (a.dist > a.raio + folga) return null;
      if (a.origem === 'inimigo' && a.dist > perigo + a.raio) return null;
      return { dx: a.dx, dy: a.dy, tipo: a.tipo, origem: a.origem, dist: a.dist };
    }, { perigo: RAIO_PERIGO, folga: FOLGA });
  }

  /** Mira no inimigo mais próximo — em tela, não em circunferência. */
  async function mirar() {
    const alvo = await page.evaluate(() => {
      const g = window.__ashfall;
      const e = g.inimigoMaisProximo();
      if (!e) return null;
      const cam = g.camera();
      return {
        x: (e.x - cam.x) + g.canvas.width / 2,
        y: (e.y - cam.y) + g.canvas.height / 2,
      };
    });
    if (alvo) await mouse.move(alvo.x, alvo.y);
    return alvo;
  }

  return {
    async medir(segundos, { aCada = 10, onAmostra, screenshot = null } = {}) {
      const amostras = [];
      if (atirar && !atirando) {
        await mouse.move(largura / 2 + 300, altura / 2);
        await mouse.down();
        atirando = true;
      }
      const t0 = Date.now();
      let proxima = t0 + aCada * 1000;
      let n = 0;

      while (Date.now() - t0 < segundos * 1000) {
        // H2: a caixa pequena de diálogo da Fábrica congela o mundo — o bot
        // atravessa com ENTER (o auto-avanço de 10s resolveria, mas 10s por
        // linha destruiria a janela da medição).
        const dialogo = await page.evaluate(() => window.__ashfall.dialogo?.() ?? false);
        if (dialogo) {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(200);
          continue;
        }
        const ameaca = await vetorDaAmeaca();
        if (ameaca) {
          await andarPara(direcaoDodge(ameaca.dx, ameaca.dy).teclas);
        } else {
          // longe de perigo: patrulha em ciclo, para não ficar parado num canto
          const i = Math.floor((Date.now() - t0) / 800) % PATRULHA.length;
          await andarPara([PATRULHA[i]]);
        }
        if (atirar) await mirar();

        await page.waitForTimeout(200);

        if (Date.now() >= proxima) {
          proxima = Date.now() + aCada * 1000;
          const dados = await page.evaluate(() => {
            const g = window.__ashfall;
            return g && g.telemetria ? g.telemetria() : null;
          });
          if (dados) {
            // o relógio é do HARNESS: a telemetria devolve estado de jogo, não
            // tempo de sessão, e `dados.t` saía "undefined" no log
            amostras.push({ ...dados, t: (Date.now() - t0) / 1000 });
            if (onAmostra) await onAmostra(dados, (Date.now() - t0) / 1000);
          }
          if (screenshot) {
            const arq = `${screenshot}-${String(n).padStart(3, '0')}.png`;
            await page.screenshot({ path: join(SHOTS, arq) });
          }
          n++;
        }
      }
      return amostras;
    },

    async parar() {
      await soltarTeclas();
      if (atirando) await mouse.up();
      atirando = false;
    },
  };
}

/** Reduz as amostras ao que responde "esta fase é jogável". */
export function resumir(amostras, segundos) {
  if (!amostras.length) return null;
  const primeiro = amostras[0];
  const ultimo = amostras[amostras.length - 1];
  const dano = ultimo.dano ?? { porFonte: {}, porTipo: {}, total: 0 };
  const ondaMax = Math.max(...amostras.map((a) => a.onda ?? 0));
  const morreu = ultimo.estado === 'gameover';
  // onde morreu, se morreu
  const ultimoVivo = morto_em(amostras);
  const principal = Object.entries(dano.porTipo ?? {}).sort((a, b) => b[1] - a[1])[0];
  const fontePrincipal = Object.entries(dano.porFonte ?? {}).sort((a, b) => b[1] - a[1])[0];
  // com tudo zerado, o sort devolve a primeira chave alfabética e a linha lia
  // "dano 0 · principal: contato", que é uma resposta que não existe
  const temDano = (dano.total ?? 0) > 0;
  return {
    hp0: primeiro.hp,
    hpFim: ultimo.hp,
    danoTotal: Math.round(dano.total ?? 0),
    ondaMax,
    morreu,
    segundosSobrevividos: ultimoVivo ? Math.round(ultimoVivo.t) : segundos,
    fontePrincipal: temDano && fontePrincipal ? fontePrincipal[0] : '—',
    danoDaFontePrincipal: fontePrincipal ? Math.round(fontePrincipal[1]) : 0,
    inimigoPrincipal: temDano && principal ? principal[0] : '—',
    danoDoInimigoPrincipal: principal ? Math.round(principal[1]) : 0,
    kills: ultimo.kills ?? 0,
  };
}

function morto_em(amostras) {
  for (let i = amostras.length - 1; i > 0; i--) {
    if (amostras[i].estado === 'gameover' && amostras[i - 1].estado !== 'gameover') return amostras[i];
  }
  return null;
}