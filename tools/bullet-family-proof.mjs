/**
 * Prova de projétil por arma.
 *
 * `BULLET_FAMILY` mapeava 12 armas em 3 cartuchos: a RPG atirava o mesmo
 * projétil da Pistola, e o tiro não dizia o que a arma fazia. Este harness
 * spawna um projétil de cada família e confere que a sprite usada é a da arma.
 *
 * Uso: node tools/bullet-proof.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');
const SHOTS = join(RAIZ, 'tools', 'shots');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.ogg': 'audio/ogg' };

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
page.on('pageerror', (e) => erros.push(e.message));

await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
// entra na partida: sem isto o screenshot sai no menu e não prova nada
await page.keyboard.press('Enter');
await page.waitForTimeout(1300);
await page.keyboard.press('Backspace');
await page.waitForTimeout(900);
await page.evaluate(() => window.__ashfall.curar());

// cada par [nomeDaArma, spriteEsperada]
const ESPERADO = [
  ['Pistola', 'small_bullet'],
  ['Shotgun', 'estilhaco'],
  ['Metralhadora', 'small_bullet'],
  ['Sniper', 'large_bullet'],
  ['Laser', 'feixe'],
  ['RPG', 'foguete'],
  ['Raios', 'plasma'],
  ['Gel', 'orbe'],
  ['Granada', 'estilhaco'],
  ['Mina', 'orbe'],
  ['BFG', 'plasma'],
];

const achados = await page.evaluate((pares) => {
  const g = window.__ashfall;
  g.curar();
  const saida = [];
  for (const [arma, sprite] of pares) {
    g.clearBullets();
    const b = g.tiroDe(arma);
    saida.push({ arma, spriteEsperada: sprite, spriteReal: b ? b.bulletSprite : null });
  }
  return saida;
}, ESPERADO);

let falhas = 0;
console.log('projétil por arma:');
for (const r of achados) {
  const ok = r.spriteReal === r.spriteEsperada;
  if (!ok) falhas++;
  console.log(`  ${ok ? 'OK  ' : 'FALHA'} ${r.arma.padEnd(14)} esperado=${r.spriteEsperada} real=${r.spriteReal}`);
}

// spawna um de cada, em linha, para o screenshot
await page.evaluate((pares) => {
  const g = window.__ashfall;
  g.clearBullets();
  pares.forEach(([arma], i) => {
    g.tiroDe(arma, 190 + i * 90, 400);
  });
  g.pausarTiros(true);
}, ESPERADO);
await page.waitForTimeout(300);
await page.screenshot({ path: join(SHOTS, 'projeteis.png') });

await browser.close();
s.close();

console.log(`${achados.length - falhas}/${achados.length} projéteis corretos`);
if (erros.length) {
  console.log('erros:');
  for (const e of [...new Set(erros)]) console.log(`  ${e}`);
}
if (falhas || erros.length) process.exitCode = 1;