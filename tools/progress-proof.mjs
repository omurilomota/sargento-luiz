/**
 * Prova da árvore de talentos (progressão de XP).
 *
 * A regra 16 exige ABRIR o PNG quando o render muda — e a loja ganhou uma seção
 * nova (ÁRVORE DE TALENTOS). Este harness entra no jogo, dá XP de uma vez pelo
 * hook `entrarLoja`, tira o screenshot da loja e confere o nível/pontos pelo
 * hook `talentos`. Sem ele, a seção nova entraria sem prova de tela.
 *
 * Uso: node tools/progress-proof.mjs
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
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ogg': 'audio/ogg' };

const s = createServer(async (req, res) => {
  const u = (req.url || '/').split('?')[0];
  const p = join(DIST, u === '/' ? 'index.html' : decodeURIComponent(u));
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise((r) => s.listen(0, '127.0.0.1', r));
const porta = s.address().port;
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });

await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.keyboard.press('Enter');     // inicia a partida (prólogo)
await page.waitForTimeout(1300);
await page.keyboard.press('Backspace'); // pula o prólogo → playing
await page.waitForTimeout(400);

// tela vermelha de remorso: ativa a fúria e fotografa o mundo com a vinheta.
await page.evaluate(() => window.__ashfall.ativarFuria());
await page.waitForTimeout(300);
const furia = await page.evaluate(() => window.__ashfall.talentos());
await page.screenshot({ path: join(SHOTS, 'nucleo-furia.png') });
console.log(`fúria ativa=${furia.ativa !== false ? 'sim' : 'nao'} → screenshot: tools/shots/nucleo-furia.png`);
await page.evaluate(() => window.__ashfall.entrarLoja(2180));
await page.waitForTimeout(500);

// rola até a ÁRVORE DE TALENTOS (fica abaixo dos 19 upgrades). O scroll da loja
// é por wheel: cada evento soma deltaY*0.5 ao offset. Sem isto o print pega só o
// topo e a seção nova passaria sem prova de tela (regra 16).
for (let i = 0; i < 12; i++) {
  await page.mouse.move(640, 400);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(60);
}
await page.waitForTimeout(300);

const estado = await page.evaluate(() => window.__ashfall.talentos());
await page.screenshot({ path: join(SHOTS, 'progress-loja.png') });

await browser.close();
s.close();

console.log(`nível=${estado.nivel} xp=${estado.xp} pontos=${estado.pontos}`);
console.log(`screenshot: tools/shots/progress-loja.png`);
const ok = estado.nivel >= 3 && estado.pontos >= 3;
console.log(ok ? 'OK: XP virou nível e pontos de talento' : 'FALHA: progressão não subiu como esperado');
if (erros.length) {
  console.log('erros de console:');
  for (const e of [...new Set(erros)]) console.log(`  ${e}`);
  process.exitCode = 1;
}
if (!ok) process.exitCode = 1;
