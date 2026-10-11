/**
 * Prova de fim de fase: mata o chefe com inimigos vivos na tela e verifica que
 * a fase fecha mesmo assim. Antes do fix, o fechamento dependia de
 * `waveComplete` (campo limpo + cota do spawner), então a fase só passava
 * depois de o jogador matar todo o reforço.
 *
 * Prova também que a morte vence a transição: zerar a vida com o respiro no
 * fim tem de dar game over, não loja.
 *
 * Uso: node tools/fase-proof.mjs
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

const s = createServer(async (req, res) => {
  const u = (req.url || '/').split('?')[0];
  const p = join(DIST, u === '/' ? 'index.html' : decodeURIComponent(u));
  if (!existsSync(p)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise((r) => s.listen(0, '127.0.0.1', r));
const porta = s.address().port;

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erros = [];
page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') erros.push(`console: ${m.text()}`); });

mkdirSync(SHOTS, { recursive: true });

const fase = () => page.evaluate(() => window.__ashfall.fase());
const clicarEnter = async (ms) => { await page.keyboard.press('Enter'); await page.waitForTimeout(ms); };

async function entrarNoJogo() {
  await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await clicarEnter(1300);
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(900);
}

const resultados = [];
const checar = (nome, ok, detalhe) => {
  resultados.push({ nome, ok, detalhe });
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
};

// ── CENÁRIO 1: chefe morto com reforço vivo tem de fechar a fase ──
await entrarNoJogo();

// salta para a última onda e invoca o chefe direto
await page.evaluate(() => {
  window.__ashfall.pularParaUltimaOnda();
  window.__ashfall.invocarChefe();
});
await page.waitForTimeout(400);

let f = await fase();
checar('chefe aparece na última onda', f.chefeVivo, `estado=${f.estado} onda=${f.onda}/${f.ondas}`);

// ressuscita reforço junto com o chefe: é o cenário que travava a fase
await page.evaluate(() => window.__ashfall.spawnarReforco(3));
await page.waitForTimeout(300);
f = await fase();
checar('reforço vivo na tela com o chefe', f.chefeVivo && f.inimigos > 1,
  `inimigos=${f.inimigos} chefeVivo=${f.chefeVivo}`);

await page.screenshot({ path: join(SHOTS, 'fase-01-chefe-com-reforco.png') });

const matou = await page.evaluate(() => window.__ashfall.matarChefe());
await page.waitForTimeout(300);
f = await fase();
checar('matar o chefe foi registrado', matou && f.chefeDerrotado && !f.chefeVivo,
  `derrotado=${f.chefeDerrotado} respiro=${f.respiroRestante.toFixed(1)}`);

await page.screenshot({ path: join(SHOTS, 'fase-02-chefe-morto-respiro.png') });

// o respiro tem de estar correndo mesmo com o reforço vivo
checar('respiro armou com reforço na tela', f.respiroArmado && f.respiroRestante > 0,
  `respiro=${f.respiroRestante.toFixed(1)}`);

// e a fase tem de fechar quando o respiro zera, SEM matar o reforço
await page.waitForTimeout(6200);
f = await fase();
checar('fase fecha sem matar o reforço', f.estado === 'shop',
  `estado=${f.estado} (esperado shop)`);
await page.screenshot({ path: join(SHOTS, 'fase-03-loja-apos-chefe.png') });

// ── CENÁRIO 2: morrer no fim não pode passar de fase ──
await clicarEnter(1200);           // entra na próxima fase
// A fase nova abre a cutscene, que congela o update. Sem pular, `zerarVida()`
// não chega ao bloco de morte.
await page.waitForTimeout(600);
await page.keyboard.press('Backspace');
await page.waitForTimeout(700);
await page.evaluate(() => {
  window.__ashfall.pularParaUltimaOnda();
  window.__ashfall.invocarChefe();
});
await page.waitForTimeout(400);
await page.evaluate(() => window.__ashfall.spawnarReforco(2));
await page.waitForTimeout(300);
await page.evaluate(() => window.__ashfall.matarChefe());
await page.waitForTimeout(300);

// morre com o respiro quase no fim: antes, isso abria a loja
await page.evaluate(() => window.__ashfall.zerarVida());
await page.waitForTimeout(4000);
f = await fase();
checar('morrer no fim dá game over, não loja', f.estado === 'gameover',
  `estado=${f.estado} (esperado gameover)`);
checar('jogador marcado como morto', f.jogadorMorto);
await page.screenshot({ path: join(SHOTS, 'fase-04-morte-vencendo.png') });

await browser.close();
s.close();

const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} verificações passaram`);
if (erros.length) {
  console.log('\nerros de console:');
  for (const e of [...new Set(erros)]) console.log(`  ${e}`);
}
if (falhas.length || erros.length) process.exitCode = 1;