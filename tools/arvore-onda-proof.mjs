/**
 * Prova de que a árvore não sela a onda (Item 2, regra 16).
 *
 * Duas fases ganharam tronco que bloqueia: Floresta (`T`) e Pântano (`D`). O
 * risco que a árvore traz é o EMPERRAMENTO — o flow field é só de parede, o
 * inimigo não sabe do tronco e bate nele. Se um bosque fechar uma passagem, a
 * fase nunca fecha: inimigo vivo na lista, onda que não avança, jogo travado
 * numa fase que o jogador não consegue matar nem ver.
 *
 * O contrato é testemunhável e não é a ausência de um sintoma: **com o
 * jogador PARADO, a onda encosta**. O spawner enche a fase e o inimigo mais
 * próximo reduz a distância até o jogador — ou já o tocou (HP caiu). Um bosque
 * mal plantado reprova: o inimigo fica longe, a distância sobe ou empaca, e a
 * contagem de inimigos não cresce.
 *
 * ATENÇÃO ao método, que foi um achado de 2026-10-15: o Chrome headless NÃO
 * entrega quadros para uma página parada. Sem tecla e sem um
 * `requestAnimationFrame` pedido, o laço do jogo congela, o `spawnDelay` para
 * no meio e a telemetria lida ali é mentira — foi assim que um diagnóstico
 * "viu" um inimigo imóvel por 30s numa fase sem nenhuma árvore. Este probe
 * mantém um laço de rAC vivo (`manterMundoVivo`) e confere os quadros por
 * segundo na mesma amostra: abaixo de 30, a amostra não vale.
 *
 * Uso: node tools/arvore-onda-proof.mjs [--fases 2,8] [--segundos 40]
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');
const SHOTS = join(RAIZ, 'tools', 'shots');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ogg': 'audio/ogg' };

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? (n === 'fases' ? process.argv[i + 1].split(',').map(Number) : Number(process.argv[i + 1])) : d;
};
const FASES = arg('fases', [2, 8]);
const SEGUNDOS = arg('segundos', 40);
const QUADROS_MINIMOS = 30;

const servidor = createServer(async (req, res) => {
  const u = (req.url || '').split('?')[0];
  const p = join(DIST, u === '/' ? '/index.html' : decodeURIComponent(u));
  if (!existsSync(p)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const porta = servidor.address().port;
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });

await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.keyboard.press('Enter');
await page.waitForTimeout(1000);
await page.keyboard.press('Backspace');
await page.waitForTimeout(400);
const cena = await page.evaluate(() => window.__ashfall.cena());
if (cena.ativa) { await page.keyboard.press('Backspace'); await page.waitForTimeout(400); }

const nomes = await page.evaluate(() => window.__ashfall.config().fases.map((f) => f.name));

/**
 * Um laço de rAF que NUNCA morre: é o que faz o compositor headless entregar
 * quadros e, com eles, o laço do jogo. Sem isso a prova mede um mundo parado.
 */
await page.evaluate(() => {
  window.__quadros = 0;
  const step = () => { window.__quadros++; requestAnimationFrame(step); };
  requestAnimationFrame(step);
});

const amostra = () => page.evaluate(() => {
  const q0 = window.__quadros;
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const t = window.__ashfall.telemetria();
      const e = window.__ashfall.inimigoMaisProximo();
      resolve({
        quadros: window.__quadros - q0,
        hp: t.hp, maxHp: t.maxHp, vivos: t.inimigos, onda: t.onda,
        perto: e,
      });
    }));
  });
});

let falhas = 0;
for (const fase of FASES) {
  const nome = nomes[fase];
  await page.evaluate((f) => window.__ashfall.irParaFase(f), nomes.indexOf(nome));
  await page.waitForTimeout(1500);
  console.log(`\n${nome}: jogador PARADO por ${SEGUNDOS}s`);

  const trilha = [];
  let encerrou = '';
  for (let t = 0; t < SEGUNDOS; t += 5) {
    // TEMPO REAL: o "t=5s" desta prova já foi fictício — as amostras rodavam
    // back-to-back e 8 amostras viam ~0,3s de jogo. O inimigo "imóvel" era o
    // mundo quase parado, a armadilha que o cabeçalho desta prova documenta.
    // Cada amostra agora espera 5s DE VERDADE e conta os quadros que o
    // compositor entregou neles: abaixo de 30/s, a amostra não vale (a
    // regra do QUADROS_MINIMOS, que existia e ninguém aplicava).
    const q0 = await page.evaluate(() => window.__quadros);
    await page.waitForTimeout(5000);
    const a = await amostra();
    const entregues = await page.evaluate((base) => window.__quadros - base, q0);
    const fpsReais = entregues / 5;
    if (fpsReais < QUADROS_MINIMOS) {
      console.log(`  t=${String(t).padStart(3)}s — ${fpsReais.toFixed(0)} quadros/s: AMOSTRA DESCARTADA (mínimo ${QUADROS_MINIMOS}/s)`);
      continue;
    }
    const d = a.perto;
    const linha = `  t=${String(t).padStart(3)}s ${fpsReais.toFixed(0).padStart(3)}q/s hp=${String(a.hp).padStart(3)} onda=${a.onda} vivos=${a.vivos} ` +
      (d ? `perto=${d.type} (${d.x.toFixed(0)},${d.y.toFixed(0)}) dist=${d.dist.toFixed(0)}` : 'perto=nenhum');
    console.log(linha);
    if (d) trilha.push({ t, dist: d.dist, x: d.x, y: d.y, vivos: a.vivos, hp: a.hp });
    if (a.hp < a.maxHp) { encerrou = `o inimigo encostou no jogador (hp ${a.maxHp} -> ${a.hp})`; break; }
    if (a.vivos === 0) { encerrou = 'o campo esvaziou'; break; }
  }

  if (encerrou) console.log(`  ${encerrou} — a onda chegou.`);
  else {
    const primeiro = trilha[0];
    const ultimo = trilha[trilha.length - 1];
    if (!primeiro || !ultimo) {
      console.log('  FALHA: nenhum inimigo ativo na tela em ' + SEGUNDOS + 's');
      falhas++;
    } else {
      const andou = Math.hypot(ultimo.x - primeiro.x, ultimo.y - primeiro.y);
      const fechou = primeiro.dist - ultimo.dist;
      console.log(`  o inimigo mais próximo andou ${andou.toFixed(0)}px e fechou ${fechou.toFixed(0)}px de distância; vivos ${primeiro.vivos} -> ${ultimo.vivos}`);
      if (andou < 60 || fechou < 40 || ultimo.vivos <= primeiro.vivos) {
        console.log('  FALHA: a onda não encosta — bosque plantado no lugar errado?');
        falhas++;
      } else {
        console.log('  OK: a onda caminha até o jogador.');
      }
    }
  }
  await page.screenshot({ path: join(SHOTS, `arvore-onda-${nome}.png`) });
}

console.log(erros.length ? `\nERROS: ${erros.join(' | ')}` : '\nsem erros de console/pageerror');
console.log(falhas ? `\nPROVA REPROVADA (${falhas})` : '\nPROVA APROVADA: nas duas fases a onda encosta no jogador parado.');
await browser.close();
servidor.close();
process.exit(falhas || erros.length ? 1 : 0);
