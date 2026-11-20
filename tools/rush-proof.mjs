/**
 * Prova do boss rush do NÚCLEO (fase 9): a fila `NUCLEO_RUSH` entra em
 * sequência — infernoPrime → reiMutante → mothership → nucleo — e só o
 * ÚLTIMO fecha a fase.
 *
 * Por que esta prova existe
 * -------------------------
 * O spawn natural do rush depende de uma cadeia de predicados em frames
 * diferentes (`bossSpawned` + `bossKilled` + índice + campo vazio). Uma
 * quebra em qualquer termo entrega um dos dois defeitos silenciosos: a fila
 * trava no primeiro chefe (o jogador mata o Núcleo e a fase nunca fecha), ou
 * a fase fecha cedo com o rush incompleto. Os 756 testes de unidade cobrem os
 * dados; esta prova cobre a máquina de estados rodando.
 *
 * O caminho até a fase 9 usa o hook `__ashfall.irParaFase(8)` — não joga as
 * 8 fases anteriores.
 *
 * Uso: node tools/rush-proof.mjs   (requer `npm run build` antes)
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');
const SHOTS = join(RAIZ, 'tools', 'shots');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.ogg': 'audio/ogg', '.md': 'text/markdown',
};

const servidor = createServer(async (req, res) => {
  const u = (req.url || '/').split('?')[0];
  const p = join(DIST, u === '/' ? 'index.html' : decodeURIComponent(u));
  if (!existsSync(p)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const porta = servidor.address().port;

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erros = [];
page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') erros.push(`console: ${m.text()}`); });

mkdirSync(SHOTS, { recursive: true });

const f = () => page.evaluate(() => window.__ashfall.fase());

// Partida nova: menu → PRÓLOGO → startRun.
await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
// Fila esperada, lida do próprio jogo para não duplicar a fonte de verdade.
const FILA_ESPERADA = await page.evaluate(() => window.__ashfall.config().nucleoRush);
console.log(`── rush do NÚCLEO (fila: ${FILA_ESPERADA.join(' → ')}) ──`);
await page.keyboard.press('Enter');
await page.waitForTimeout(1100);
await page.keyboard.press('Backspace');
await page.waitForTimeout(900);
// cutscene da fase 1, se houver
const c = await page.evaluate(() => window.__ashfall.cena());
if (c.ativa) { await page.keyboard.press('Backspace'); await page.waitForTimeout(600); }

// Direto ao Bunker Central e à última onda: o spawn natural do rush nasce
// daí em diante, um chefe por campo vazio.
await page.evaluate(() => window.__ashfall.irParaFase(8));
await page.waitForTimeout(800);
const antes = await f();
console.log(`fase atual: ${antes.fase} (índice ${antes.indice})`);
// SEM `pularParaUltimaOnda`: a fase 9 não tem onda comum, a fila começa na
// entrada (DECISIONS #169). Pular para a última onda seria medir uma fase que
// o jogador nunca vê — e foi exatamente esse pulo que escondia o B6.
await page.waitForTimeout(500);
const naEntrada = await f();
if (naEntrada.chefeVivo) {
  const t0 = naEntrada.tipos.find(t => FILA_ESPERADA.includes(t));
  console.log(`chefe na ENTRADA (sem pular onda): ${t0}`);
} else {
  console.log(`ATENÇÃO: a fase abriu sem chefe (inimigos=${naEntrada.inimigos})`);
}

const chefeVistos = [];
let fechou = false;
let morreu = false;
const inicio = Date.now();
while (Date.now() - inicio < 45000) {
  const s = await f();
  if (s.estado === 'shop') { fechou = true; break; }
  if (s.estado === 'gameover') { morreu = true; break; }
  if (s.chefeVivo) {
    // o tipo que está na tela é a prova de qual posição da fila entrou
    const tipo = s.tipos.find(t => FILA_ESPERADA.includes(t));
    if (tipo && chefeVistos[chefeVistos.length - 1] !== tipo) {
      chefeVistos.push(tipo);
      console.log(`  chefe ${chefeVistos.length}/${FILA_ESPERADA.length}: ${tipo}`);
      if (chefeVistos.length === 1 || tipo === 'nucleo') {
        await page.screenshot({ path: join(SHOTS, `nucleo-rush${chefeVistos.length}.png`) });
      }
      await page.evaluate(() => window.__ashfall.matarChefe());
      await page.waitForTimeout(700);
    }
  } else {
    // campo esvazindo: o próximo da fila nasce sozinho no update
    await page.evaluate(() => window.__ashfall.matarTodos());
    await page.waitForTimeout(400);
  }
  await page.evaluate(() => window.__ashfall.curar());
}

const fim = await f();
console.log(`─`.repeat(46));
console.log(`fila vista:     ${chefeVistos.join(' → ')}`);
console.log(`fila esperada:  ${FILA_ESPERADA.join(' → ')}`);
console.log(`estado final:   ${fim.estado}`);
console.log(`chefeDerrotado: ${fim.chefeDerrotado} · respiroArmado: ${fim.respiroArmado}`);

const problemas = [];
if (chefeVistos.join('>') !== FILA_ESPERADA.join('>')) {
  problemas.push(`fila errada: vi ${chefeVistos.join(' → ')}`);
}
if (!fechou) problemas.push(`a fase não foi para a loja (estado: ${fim.estado}${morreu ? ', morreu' : ''})`);
if (erros.length > 0) problemas.push(...erros);

console.log(problemas.length === 0
  ? 'OK — a fila entrou na ordem e só o último fechou a fase.'
  : problemas.map(p => `FALHA ${p}`).join('\n'));

await browser.close();
servidor.close();
process.exit(problemas.length === 0 ? 0 : 1);
