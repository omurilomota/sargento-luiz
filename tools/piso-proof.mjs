/**
 * Prova do piso sem costura (regra 16).
 *
 * A extração velha fatiava a linha 0 do autotile (peças de borda com molde
 * escuro assado) e a grade de 64px aparecia no chão — medido: borda 38
 * pontos mais escura que o miolo. A extração nova sai do tile 47, o único
 * fill puro do wangset do tsx (arestas e cantos no mesmo terreno). Esta
 * prova salta de fase em fase e fotografa o chão de cada material, para a
 * costura ser vista (ou não) com os olhos, não com a palavra do commit.
 *
 * Uso: npm run build && node tools/piso-proof.mjs
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
  const u = (req.url || '/').split('?')[0];
  const p = join(DIST, u === '/' ? 'index.html' : decodeURIComponent(u));
  if (!existsSync(p)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const porta = servidor.address().port;
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });

await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.keyboard.press('Enter');
await page.waitForTimeout(1000);
await page.keyboard.press('Backspace');
await page.waitForTimeout(600);
const c = await page.evaluate(() => window.__ashfall.cena());
if (c.ativa) { await page.keyboard.press('Backspace'); await page.waitForTimeout(600); }

const nomes = await page.evaluate(() => window.__ashfall.config().fases.map((f) => f.name));

for (let i = 0; i < nomes.length; i++) {
  await page.evaluate((f) => window.__ashfall.irParaFase(f), i);
  await page.waitForTimeout(700);
  const cen = await page.evaluate(() => window.__ashfall.cena());
  if (cen.ativa) { await page.keyboard.press('Backspace'); await page.waitForTimeout(600); }
  await page.waitForTimeout(900);
  await page.screenshot({ path: join(SHOTS, `piso-fase-${String(i + 1).padStart(2, '0')}.png`) });
  console.log(`fase ${i + 1}: ${nomes[i]}`);
}

console.log(erros.length ? `ERROS: ${erros.join(' | ')}` : 'sem erros de console/pageerror');
await browser.close();
servidor.close();
process.exit(erros.length ? 1 : 0);
