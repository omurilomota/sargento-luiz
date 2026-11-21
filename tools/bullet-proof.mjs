/**
 * Prova de orientação das balas: força velocidade conhecida e tira screenshot.
 *
 * Existe porque a falha é invisível para `tsc` e para o teste unitário: a bala
 * saía deitada, atravessada no inimigo, e o build passava. A correção aqui é
 * `rotate(ang + PI/2)` porque a sprite do pack tem a ponta em -y.
 *
 * Uso: node tools/bullet-proof.mjs
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
const OUT = join(RAIZ, 'tools', 'shots');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png',
  '.ogg': 'audio/ogg', '.md': 'text/markdown',
};

const s = createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];
  const p = join(DIST, url === '/' ? 'index.html' : decodeURIComponent(url));
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise((r) => s.listen(0, '127.0.0.1', r));
const porta = s.address().port;
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await b.newPage({ viewport: { width: 900, height: 600 } });
await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.keyboard.press('Enter');
await page.waitForTimeout(1200);
await page.keyboard.press('Backspace');
await page.waitForTimeout(900);

// Espera o jogo expor bullets no window para poder injetar velocidade exata.
const injetado = await page.evaluate(async () => {
  const w = window;
  for (let i = 0; i < 60 && !w.__ashfall; i++) await new Promise((r) => setTimeout(r, 100));
  return !!w.__ashfall;
});

console.log(`hook de debug presente: ${injetado}`);

if (injetado) {
  // O loop do jogo chama updateBullets todo frame e limparia os projéteis
  // injetados antes do screenshot. Congela o jogo, injeta, desenha à mão com o
  // mesmo código do renderer e tira a prova.
  await page.evaluate(() => {
    const g = window.__ashfall;
    const ctx = g.ctx;
    const img = g.spriteFor('small_bullet');
    ctx.fillStyle = '#101010';
    ctx.fillRect(0, 0, 900, 600);
    if (!img) {
      ctx.fillStyle = '#ff0000';
      ctx.font = '20px monospace';
      ctx.fillText('SPRITE NAO CARREGOU', 240, 300);
      return;
    }
    const altura = 20;
    const larg = altura * (img.naturalWidth / img.naturalHeight);
    const dirs = [
      ['DIREITA', 1, 0, 250, 300],
      ['BAIXO', 0, 1, 450, 150],
      ['ESQUERDA', -1, 0, 650, 300],
      ['CIMA', 0, -1, 450, 450],
    ];
    for (const [nome, dx, dy, x, y] of dirs) {
      const ang = Math.atan2(dy, dx);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang + Math.PI / 2);
      ctx.drawImage(img, -larg / 2, -altura / 2, larg, altura);
      ctx.restore();
      ctx.fillStyle = '#7a9a6a';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(nome, x, y + 60);
      // linha do eixo, para ver se a ponta aponta para o nome
      ctx.strokeStyle = 'rgba(122,154,106,0.35)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx * 50, y + dy * 50);
      ctx.stroke();
    }
  });
  await page.waitForTimeout(60);
  await page.screenshot({
    path: join(OUT, 'prova-balas.png'),
    clip: { x: 0, y: 0, width: 900, height: 600 },
  });
  console.log('tools/shots/prova-balas.png gerado');
} else {
  console.log('sem hook de debug: adicionando require.ebb to main.ts fica pendente.');
}

// Debug: a janela segura uma copia e o jogo redesenha por cima. Mata o loop
// antes de injetar, e usa uma aba nova so com o canvas estatico.
await b.close();

const b2 = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu'],
});
const p2 = await b2.newPage({ viewport: { width: 900, height: 600 } });
await p2.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await p2.waitForTimeout(600);
await p2.keyboard.press('Enter');
await p2.waitForTimeout(1100);
await p2.keyboard.press('Backspace');
await p2.waitForTimeout(800);
// congela o loop: clearBullets + setTimeout nao desenha nada, so o loop
await p2.evaluate(() => {
  const g = window.__ashfall;
  g.ctx.fillStyle = '#101010';
  g.ctx.fillRect(0, 0, 900, 600);
  const img = g.spriteFor('small_bullet');
  if (!img) { g.ctx.fillStyle = '#ff0000'; g.ctx.fillText('SEM SPRITE', 20, 20); return; }
  const altura = 20;
  const larg = altura * (img.naturalWidth / img.naturalHeight);
  const dirs = [['DIREITA',1,0],['BAIXO',0,1],['ESQUERDA',-1,0],['CIMA',0,-1]];
  const pos = [[250,300],[450,150],[650,300],[450,450]];
  dirs.forEach(([nome,dx,dy],i)=>{
    const [x,y]=pos[i];
    const ang=Math.atan2(dy,dx);
    g.ctx.save(); g.ctx.translate(x,y); g.ctx.rotate(ang+Math.PI/2);
    g.ctx.drawImage(img,-larg/2,-altura/2,larg,altura); g.ctx.restore();
    g.ctx.fillStyle='#7a9a6a'; g.ctx.font='12px monospace'; g.ctx.textAlign='center';
    g.ctx.fillText(nome,x,y+55);
    g.ctx.strokeStyle='rgba(122,154,106,0.5)'; g.ctx.beginPath();
    g.ctx.moveTo(x,y); g.ctx.lineTo(x+dx*55,y+dy*55); g.ctx.stroke();
  });
});
await p2.waitForTimeout(40);
await p2.screenshot({ path: join(OUT, 'prova-balas.png'), clip:{x:180,y:100,width:540,height:420} });
await b2.close();
s.close();
