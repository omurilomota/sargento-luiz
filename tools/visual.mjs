/**
 * Harness visual: abre o jogo num Chrome headless, joga some segundos e tira
 * screenshots. Existe porque nenhuma falha de render que o `npm test` pega é de
 * render: sprite de lado, tamanho errado, cor lavada. `tsc` passa, teste passa,
 * e o tiro sai girado 90°.
 *
 * Uso: node tools/visual.mjs [--shots N] [--w 1280] [--h 720]
 * Salva em tools/shots/*.png e imprime o que encontrou no console.
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join as pjoin } from 'path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = pjoin(RAIZ, 'dist');
const SHOTS = pjoin(RAIZ, 'tools', 'shots');

const arg = (nome, padrao) => {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? Number(process.argv[i + 1]) : padrao;
};

const LARGURA = arg('w', 1280);
const ALTURA = arg('h', 720);
const SHOT_A_CADA = arg('aCada', 2.5) * 1000;
const TOTAL = arg('total', 10) * 1000;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.ogg': 'audio/ogg', '.json': 'application/json',
  '.md': 'text/markdown',
};

function servir() {
  return new Promise((resolve) => {
    const s = createServer(async (req, res) => {
      const url = (req.url || '/').split('?')[0];
      let p = pjoin(DIST, url === '/' ? 'index.html' : decodeURIComponent(url));
      if (!existsSync(p)) { res.writeHead(404); res.end('404'); return; }
      try {
        const buf = await readFile(p);
        res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
        res.end(buf);
      } catch {
        res.writeHead(500); res.end('500');
      }
    });
    s.listen(0, '127.0.0.1', () => resolve(s));
  });
}

const KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'];

async function main() {
  if (!existsSync(DIST)) {
    console.error('dist/ não existe — rode `npm run build` antes.');
    process.exit(1);
  }
  mkdirSync(SHOTS, { recursive: true });

  const server = await servir();
  const porta = server.address().port;
  console.log(`servindo dist/ em http://127.0.0.1:${porta}`);
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage({ viewport: { width: LARGURA, height: ALTURA } });

  const problemas = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problemas.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => problemas.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (u.includes('assets/sprites') || u.includes('assets/music') || u.includes('assets/sfx')) {
      problemas.push(`404: ${u.replace(`http://127.0.0.1:${porta}`, '')}`);
    }
  });

  await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);

  const shots = [];
  const tirar = async (nome) => {
    const arq = pjoin(SHOTS, `${nome}.png`);
    await page.screenshot({ path: arq });
    shots.push(arq);
  };

  await tirar('01-menu');

  // Entra no jogo: o menu responde a ENTER.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1400);
  await tirar('02-cutscene');

  // Pula a cutscene e começa a atirar.
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(1200);

  // Anda e atira por um tempo, movendo o mouse para o lado para ver o tiro.
  const t0 = Date.now();
  let proximo = t0 + SHOT_A_CADA;
  let n = 3;
  const mouse = page.mouse;
  await mouse.move(LARGURA * 0.75, ALTURA * 0.4);
  await mouse.down();

  while (Date.now() - t0 < TOTAL) {
    const k = KEYS[Math.floor((Date.now() - t0) / 900) % KEYS.length];
    await page.keyboard.down(k);
    const ang = ((Date.now() - t0) / 1000) * 1.1;
    await mouse.move(
      LARGURA / 2 + Math.cos(ang) * 320,
      ALTURA / 2 + Math.sin(ang) * 240,
    );
    // Este harness existe para ver RENDER, não para medir balanceamento — quem
    // mede é o `sessao.mjs`. Sem a cura o jogador morre no meio do percurso e
    // todos os screenshots depois viram tela de game over.
    await page.evaluate(() => window.__ashfall.curar());
    await page.waitForTimeout(260);
    await page.keyboard.up(k);

    if (Date.now() >= proximo) {
      proximo = Date.now() + SHOT_A_CADA;
      await tirar(`${String(n).padStart(2, '0')}-jogando`);
      n++;
    }
  }
  await mouse.up();

  // TAB: ficha da arma + mapa grande. É a única tela do jogo que mostra DPS
  // real, então ela precisa entrar no harness.
  await page.evaluate(() => window.__ashfall.curar());
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  await tirar(`${String(n).padStart(2, '0')}-ficha`);
  n++;
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);

  // Abre a loja, que é onde os ícones de arma aparecem.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await tirar(`${String(n).padStart(2, '0')}-pausa`);
  n++;

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.keyboard.press('KeyO');
  await page.waitForTimeout(500);
  await tirar(`${String(n).padStart(2, '0')}-config`);
  n++;

  // A LOJA: é onde a AMEAÇA aparece (e onde o jogador decide a compra).
  // Sem este print, uma mudança no cabeçalho da loja passava sem ninguém
  // ver — a regra 16 vale para a loja tanto quanto para o pause.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__ashfall.entrarLoja());
  await page.waitForTimeout(600);
  await tirar(`${String(n).padStart(2, '0')}-loja`);
  n++;

  const estado = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return { canvas: !!c, w: c?.width, h: c?.height, dpr: window.devicePixelRatio };
  });

  await browser.close();
  server.close();

  console.log(`\n${shots.length} screenshots em tools/shots/:`);
  for (const s of shots) console.log(`  ${s.replace(RAIZ + '/', '')}`);
  console.log(`\ncanvas: ${estado.w}x${estado.h} dpr=${estado.dpr}`);
  if (problemas.length) {
    console.log(`\n${problemas.length} PROBLEMA(S):`);
    const vistos = new Set();
    for (const p of problemas) {
      if (vistos.has(p)) continue;
      vistos.add(p);
      console.log(`  ${p}`);
    }
    process.exitCode = 1;
  } else {
    console.log('\nnenhum erro de console, pageerror ou 404 de asset.');
  }
}

main();
