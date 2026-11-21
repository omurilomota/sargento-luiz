/** Prova das skins de chefe: fotografa 6 chefes com silhueta própria. */
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
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.ogg': 'audio/ogg' };
const s = createServer(async (req, res) => {
  const u = (req.url || '/').split('?')[0];
  const p = join(DIST, u === '/' ? 'index.html' : decodeURIComponent(u));
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise(r => s.listen(0, '127.0.0.1', r));
const porta = s.address().port;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox','--disable-gpu','--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erros = [];
page.on('pageerror', e => erros.push(e.message));
mkdirSync(SHOTS, { recursive: true });
await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
// pula o PRÓLOGO (a cutscene da fase 0 abre antes do combate)
for (let i = 0; i < 80; i++) {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(60);
  const cena = await page.evaluate(() => window.__ashfall.cena());
  if (!cena?.ativa) break;
}

const fases = [
  [0, 'vigia'], [2, 'alphaWolf'], [4, 'crystalQueen'], [7, 'leviathan'], [11, 'infernoPrime'], [15, 'nucleo'],
];
for (const [idx, nome] of fases) {
  await page.evaluate(i => window.__ashfall.irParaFase(i), idx);
  await page.waitForTimeout(300);
  await page.evaluate(() => { while (window.__ashfall.dialogo()) window.__ashfall.pularProximaFase?.() ?? window.__ashfall.dialogo(); });
  await page.evaluate(() => window.__ashfall.invocarChefe());
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__ashfall.centralizarNoInimigo());
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(SHOTS, `boss-${nome}.png`) });
  console.log('foto', nome);
}
console.log('pageerrors:', erros.length);
await browser.close(); s.close();
