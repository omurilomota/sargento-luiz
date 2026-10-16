/**
 * Prova do Porto (regra 16): medir o piso atual antes de autorar a água.
 *
 * O Porto é areia de cais + armazém de tijolo, e a identidade de porto falta:
 * não há uma célula de água no mapa. Antes de desenhar o tile, o número que
 * decide o desenho é a LUMINÂNCIA do cais na tela — o pipeline de tint
 * (`saturation` com cinza, duas vezes) mata a matiz, então a água não pode ser
 * azul: ela precisa ser ESCURA contra a areia clara, com faixas de onda para
 * ler como água. Sem medir, o tile nasceria de palpite.
 *
 * Uso: node tools/porto-proof.mjs [--fase 13]
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

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? Number(process.argv[i + 1]) : d; };

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
const fase = arg('fase', 13);
await page.evaluate((f) => window.__ashfall.irParaFase(f), nomes.indexOf(nomes[fase]));
await page.waitForTimeout(1500);
const tiro = await page.evaluate(() => ({ pos: window.__ashfall.playerPos(), cam: window.__ashfall.camera() }));
console.log(`${nomes[fase]}: jogador (${tiro.pos.x.toFixed(0)},${tiro.pos.y.toFixed(0)}), câmera (${tiro.cam.x.toFixed(0)},${tiro.cam.y.toFixed(0)})`);

// anda um pouco para o cais aberto: a foto tem de mostrar chão, não só parede
await page.keyboard.down('d');
await page.waitForTimeout(900);
await page.keyboard.up('d');
await page.waitForTimeout(400);
const depois = await page.evaluate(() => ({ pos: window.__ashfall.playerPos(), cam: window.__ashfall.camera() }));
console.log(`depois de andar: jogador (${depois.pos.x.toFixed(0)},${depois.pos.y.toFixed(0)}), câmera (${depois.cam.x.toFixed(0)},${depois.cam.y.toFixed(0)})`);

await page.screenshot({ path: join(SHOTS, 'porto-atual.png') });
console.log('shot: tools/shots/porto-atual.png');
console.log(erros.length ? `ERROS: ${erros.join(' | ')}` : 'sem erros de console/pageerror');
await browser.close();
servidor.close();
process.exit(erros.length ? 1 : 0);
