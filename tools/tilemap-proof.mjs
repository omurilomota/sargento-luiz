/**
 * Prova visual de um tile: desenha o tile N vezes num padrao 5x5, lado a lado
 * com o que o jogo usa hoje. Serve para provar se o tile aguenta repeticao —
 * um tile com textura so funciona no chao se as bordas nao denunciam a grade.
 *
 * Uso: node tools/tilemap-proof.mjs 289 262 264 293
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
const OUT = join(RAIZ, 'tools', 'shots');
const nums = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
if (nums.length === 0) { console.log('uso: node tools/tilemap-proof.mjs 289 262 264'); process.exit(1); }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.ogg': 'audio/ogg', '.md': 'text/markdown' };
const s = createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];
  const p = join(DIST, url === '/' ? 'index.html' : decodeURIComponent(url));
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise((r) => s.listen(0, '127.0.0.1', r));
const porta = s.address().port;

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-gpu'] });
const page = await b.newPage({ viewport: { width: 1000, height: 700 } });
await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.keyboard.press('Enter');
await page.waitForTimeout(1100);
await page.keyboard.press('Backspace');
await page.waitForTimeout(900);

// Trava o rAF: sem isso o loop do jogo redesenha por cima da prova antes do
// screenshot, e a imagem sai com o mundo em vez do grid de tiles.
await page.evaluate(() => {
  window.__raf = window.requestAnimationFrame;
  window.requestAnimationFrame = () => 0;
  window.cancelAnimationFrame(() => {});
});
await page.waitForTimeout(120);

const CELL = 64;
await page.evaluate(({ nums, CELL }) => {
  const g = window.__ashfall;
  const ctx = g.ctx;
  const W = g.canvas.width, H = g.canvas.height;
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, W, H);
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  const cols = Math.min(nums.length, 3);
  nums.forEach((n, i) => {
    const img = g.spriteFor(`tile_${n}`);
    const bx = (i % cols) * (5 * CELL) + 10;
    const by = Math.floor(i / cols) * (5 * CELL + 26) + 10;
    // fundo claro: tile escuro nao aparece sobre preto
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(bx, by, 5 * CELL, 5 * CELL);
    if (!img) {
      ctx.fillStyle = '#c66';
      ctx.fillText(`tile_${n} AUSENTE`, bx + 5 * CELL / 2, by + 5 * CELL / 2);
      return;
    }
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      ctx.drawImage(img, bx + c * CELL, by + r * CELL, CELL, CELL);
    }
    // marca as costuras da grade
    ctx.strokeStyle = 'rgba(255,80,80,0.25)';
    ctx.lineWidth = 1;
    for (let c = 1; c < 5; c++) {
      ctx.beginPath(); ctx.moveTo(bx + c * CELL, by); ctx.lineTo(bx + c * CELL, by + 5 * CELL); ctx.stroke();
    }
    for (let r = 1; r < 5; r++) {
      ctx.beginPath(); ctx.moveTo(bx, by + r * CELL); ctx.lineTo(bx + 5 * CELL, by + r * CELL); ctx.stroke();
    }
    ctx.fillStyle = '#c8b890';
    ctx.fillText(`tile_${n}  5x5`, bx + 5 * CELL / 2, by + 5 * CELL + 17);
  });
}, { nums, CELL });

await page.waitForTimeout(80);
await page.screenshot({ path: join(OUT, 'tilemap-prova.png'), clip: { x: 0, y: 0, width: 1000, height: 700 } });
console.log('tools/shots/tilemap-prova.png');
await b.close();
s.close();
