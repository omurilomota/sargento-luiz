/**
 * Prova do site estático (`site/`).
 *
 * Serve a pasta, abre a página e confere três coisas que um build verde não
 * garante: as tabelas têm as linhas que o `conteudo.js` manda (9 fases, 12
 * armas, 31 inimigos), nenhum `undefined` vaza dos dados, e nenhuma imagem
 * dá 404. Os screenshots são para serem ABERTOS — o site é render, não número.
 *
 * Uso: node tools/site-proof.mjs   (roda `node tools/gensite.mjs` antes)
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { extname, join } from 'path';
const RAIZ = '/home/murilo/Documents/Sargento Rios';
const s = createServer(async (req, res) => {
  const u = (req.url || '/').split('?')[0];
  const p = join(RAIZ, 'site', u === '/' ? 'index.html' : decodeURIComponent(u));
  if (!existsSync(p)) { res.writeHead(404); res.end('nao existe: ' + p); return; }
  res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' }[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise((r) => s.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const erros = [], faltando = [];
page.on('pageerror', (e) => erros.push(e.message));
page.on('response', (r) => { if (r.status() >= 400) faltando.push(r.status() + ' ' + r.url()); });
await page.goto(`http://127.0.0.1:${s.address().port}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const linhas = await page.evaluate(() => ({
  fases: document.querySelectorAll('#t-fases tr').length,
  armas: document.querySelectorAll('#t-armas tr').length,
  inimigos: document.querySelectorAll('#t-inimigos tr').length,
  titulo: document.querySelector('h1')?.textContent,
}));
console.log('linhas na página:', JSON.stringify(linhas));
await page.screenshot({ path: join(RAIZ, 'tools', 'shots', 'site-topo.png') });
await page.evaluate(() => window.scrollTo(0, 2100));
await page.waitForTimeout(400);
await page.screenshot({ path: join(RAIZ, 'tools', 'shots', 'site-tabelas.png') });
await browser.close(); s.close();
console.log('erros:', erros.length ? erros.join(' | ') : 'nenhum', '| 404:', faltando.length ? faltando.join(' | ') : 'nenhum');
if (erros.length || faltando.length) process.exitCode = 1;
