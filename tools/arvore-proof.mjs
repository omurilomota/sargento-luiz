/**
 * Prova da árvore que bloqueia (regra 16).
 *
 * Duas coisas precisam ser vistas juntas: a árvore NA TELA e o jogador PARANDO
 * nela. A prova anda o jogador até o tronco e fotografa, em vez de sortear um
 * frame e torcer para a copa entrar no enquadramento.
 *
 * O instrumento é a posição final: o jogador só para de andar se algo segurou,
 * e nas duas rotas abaixo o ÚNICO obstáculo no caminho é a árvore.
 *
 * Pântano: nasce em (15,18) e sobe a coluna 15 inteira — (15,17) é hazard de
 * lama, (15,11)-(15,16) piso, (15,10) hazard, (15,8)-(15,9) decoração — e o
 * primeiro que para é a morte em (15,2). Sem o registro do bloqueio ele
 * subiria até a parede (15,0) e pararia a 190px do tronco.
 *
 * Floresta: subindo a coluna 15 ele bate na parede de (15,10); daí é ir pela
 * esquerda até a coluna 10 (linha 11 inteiramente limpa entre as colunas 9 e
 * 16) e subir contra a árvore de (10,9) — (10,10) é piso, nada mais no caminho.
 *
 * Uso: npm run build && node tools/arvore-proof.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath, URL } from 'url';
import { dirname } from 'path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');
const SHOTS = join(RAIZ, 'tools', 'shots');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ogg': 'audio/ogg' };

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

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });

const pos = () => page.evaluate(() => window.__ashfall.playerPos());

/** Segura a tecla até o jogador parar de andar (ou estourar o tempo). */
async function andarAteParar(tecla, limiteMs = 12000) {
  await page.keyboard.down(tecla);
  let ultimo = null;
  let parado = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < limiteMs) {
    await page.waitForTimeout(180);
    const p = await pos();
    if (ultimo && Math.hypot(p.x - ultimo.x, p.y - ultimo.y) < 0.6) {
      parado += 1;
      if (parado >= 2) break;
    } else {
      parado = 0;
    }
    ultimo = p;
  }
  await page.keyboard.up(tecla);
  return pos();
}

/** Segura a tecla até o jogador cruzar uma coordenada de mundo. */
async function andarAteCruzar(tecla, eixo, alvo, limiteMs = 9000) {
  await page.keyboard.down(tecla);
  const t0 = Date.now();
  while (Date.now() - t0 < limiteMs) {
    await page.waitForTimeout(180);
    const p = await pos();
    if (eixo === 'x' ? p.x <= alvo : p.y <= alvo) break;
  }
  await page.keyboard.up(tecla);
  return pos();
}

await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.keyboard.press('Enter');
await page.waitForTimeout(1000);
await page.keyboard.press('Backspace');
await page.waitForTimeout(600);
const cena = await page.evaluate(() => window.__ashfall.cena());
if (cena.ativa) { await page.keyboard.press('Backspace'); await page.waitForTimeout(600); }

const nomes = await page.evaluate(() => window.__ashfall.config().fases.map((f) => f.name));
let ok = true;

/** Confere que o passo parou na borda da colisão do tronco. */
function conferir(rotulo, fim, centro, raioJogador) {
  const dist = Math.hypot(fim.x - centro.x, fim.y - centro.y);
  const soma = raioJogador + 20;
  console.log(`  ${rotulo}: parou em (${fim.x.toFixed(0)},${fim.y.toFixed(0)}), ${dist.toFixed(1)}px do tronco (a colisão para em ${soma}px)`);
  const bom = dist < soma + 6 && dist > soma - 8;
  console.log(bom ? '  OK: o passo parou na borda da colisão da árvore' : '  FALHA: não parou no tronco');
  return bom;
}

/**
 * Onde o tronco cai na tela — a prova de que a copa está no lugar da colisão.
 * Lê posição e câmera na MESMA volta: a câmera está em lerp e uma leitura
 * separada tirava a foto de um lugar que o jogo já tinha saído.
 */
async function ondeNaTela(centro) {
  const tiro = await page.evaluate(() => ({
    pos: window.__ashfall.playerPos(),
    cam: window.__ashfall.camera(),
  }));
  const tela = { x: Math.round(centro.x - tiro.cam.x), y: Math.round(centro.y - tiro.cam.y) };
  console.log(`  câmera (${tiro.cam.x.toFixed(0)},${tiro.cam.y.toFixed(0)}), jogador (${tiro.pos.x.toFixed(0)},${tiro.pos.y.toFixed(0)})`);
  console.log(`  tronco na tela em (${tela.x},${tela.y}), caixa de 64px: x ${tela.x - 32}-${tela.x + 32}, y ${tela.y - 32}-${tela.y + 32}`);
  return tela;
}

// ─── Pântano: sobe a coluna 15 até a morte de (15,2) ──────────────────────
const iPan = nomes.indexOf('Pântano');
if (iPan < 0) { console.log('FALHA: fase Pântano não encontrada'); process.exit(1); }
await page.evaluate((f) => window.__ashfall.irParaFase(f), iPan);
await page.waitForTimeout(1000);
const fimPan = await andarAteParar('ArrowUp');
await page.waitForTimeout(900);
ok = conferir('Pântano', fimPan, { x: 15.5 * 64, y: 2.5 * 64 }, fimPan.raio) && ok;
await ondeNaTela({ x: 15.5 * 64, y: 2.5 * 64 });
await page.screenshot({ path: join(SHOTS, 'arvore-pantano.png') });
console.log('  shot: tools/shots/arvore-pantano.png');

// ─── Floresta: parede de (15,10), esquerda até a coluna 10, sobe até (10,9) ─
const iFlo = nomes.indexOf('Floresta');
if (iFlo < 0) { console.log('FALHA: fase Floresta não encontrada'); process.exit(1); }
await page.evaluate((f) => window.__ashfall.irParaFase(f), iFlo);
await page.waitForTimeout(1000);
const parede = await andarAteParar('ArrowUp');
console.log(`  Floresta, perna 1: pará na parede de (15,10) em y=${parede.y.toFixed(0)}`);
await andarAteCruzar('ArrowLeft', 'x', 696);
const fimFlo = await andarAteParar('ArrowUp');
await page.waitForTimeout(900);
ok = conferir('Floresta', fimFlo, { x: 10.5 * 64, y: 9.5 * 64 }, fimFlo.raio) && ok;
await ondeNaTela({ x: 10.5 * 64, y: 9.5 * 64 });
await page.screenshot({ path: join(SHOTS, 'arvore-floresta.png') });
console.log('  shot: tools/shots/arvore-floresta.png');

console.log(erros.length ? `ERROS: ${erros.join(' | ')}` : 'sem erros de console/pageerror');
await browser.close();
servidor.close();
process.exit(ok && !erros.length ? 0 : 1);
