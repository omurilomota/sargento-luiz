/**
 * Sessão longa com telemetria: o harness joga por N minutos e a cada amostra
 * registra HP, onda, inimigos vivos e um screenshot.
 *
 * Existe porque "o HP cai rápido" e "a bala está deitada" sãoduas falhas que
 * `tsc` e o teste unitário não pegam: são observações de tela. O jeito de
 * parar de chutar é medir o número.
 *
 * Uso: node tools/session.mjs --min 3 [--w 1280] [--h 720]
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

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? Number(process.argv[i + 1]) : d;
};
const MINUTOS = arg('min', 3);
const LARGURA = arg('w', 1280);
const ALTURA = arg('h', 720);
const AMOSTRA_MS = arg('aCada', 10) * 1000;

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

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: LARGURA, height: ALTURA } });

const erros = [];
page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') erros.push(`console: ${m.text()}`); });

await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.keyboard.press('Enter');
await page.waitForTimeout(1300);
await page.keyboard.press('Backspace');
await page.waitForTimeout(1000);

// instala amostrador: lê estado do canvas por reflect + hook de debug
await page.evaluate(() => {
  window.__amostras = [];
  window.__amostrar = () => {
    const g = window.__ashfall;
    if (!g) return;
    window.__amostras.push({ t: Date.now(), ...(g.telemetria ? g.telemetria() : {}) });
  };
});

const amostras = [];
const t0 = Date.now();
const mouse = page.mouse;
await mouse.move(LARGURA / 2 + 300, ALTURA / 2);
await mouse.down();

const teclas = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
let n = 0;
let proxima = t0 + AMOSTRA_MS;

while (Date.now() - t0 < MINUTOS * 60000) {
  const k = teclas[Math.floor((Date.now() - t0) / 800) % teclas.length];
  await page.keyboard.down(k);
  // MIRA NO INIMIGO MAIS PROXIMO, nao na circunferencia. A mira circular
  // do harness antigo matava ZERO inimigos em 8s com 5 na tela, o que
  // parecia bug de tiro e era bug do proprio harness.
  const alvo = await page.evaluate(() => {
    const g = window.__ashfall;
    const e = g.inimigoMaisProximo();
    if (!e) return null;
    const cam = g.camera();
    return {
      x: (e.x - cam.x) + g.canvas.width / 2,
      y: (e.y - cam.y) + g.canvas.height / 2,
      tipo: e.type, hp: e.health, dist: e.dist,
    };
  });
  if (alvo) await mouse.move(alvo.x, alvo.y);
  await page.waitForTimeout(240);
  await page.keyboard.up(k);

  if (Date.now() >= proxima) {
    proxima = Date.now() + AMOSTRA_MS;
    const dados = await page.evaluate(() => {
      const g = window.__ashfall;
      return g && g.telemetria ? g.telemetria() : null;
    });
    if (dados) {
      amostras.push(dados);
      // O tempo é calculado AQUI, não pedido à telemetria: a telemetria devolve
      // estado de jogo, não relógio de sessão — e `dados.t` saía como
      // "t=undefined" no log desde sempre (FUTURO §1.5).
      const t = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(
        `t=${t}s  hp=${dados.hp}/${dados.maxHp}  onda=${dados.onda}  ` +
        `inimigos=${dados.inimigos}  balas=${dados.balas}  kills=${dados.kills}  ` +
        `estado=${dados.estado}  moedas=${dados.moedas}`,
      );
    }
    await page.screenshot({ path: join(OUT, `sess-${String(n).padStart(3, '0')}.png`) });
    n++;
  }
}
await mouse.up();

await browser.close();
s.close();

console.log(`\n${amostras.length} amostras em ${MINUTOS} min`);
const hp0 = amostras[0]?.hp;
const hpFim = amostras[amostras.length - 1]?.hp;
if (hp0 != null && hpFim != null) {
  const perdaPorMin = (hp0 - hpFim) / MINUTOS;
  console.log(`HP ${hp0} -> ${hpFim}  (${perdaPorMin.toFixed(1)} por minuto)`);
  console.log(`vida util estimada com esse ritmo: ${(hpFim / Math.max(perdaPorMin, 0.1)).toFixed(0)}s`);
}
if (erros.length) {
  const v = [...new Set(erros)];
  console.log(`\n${v.length} erro(s):`);
  for (const e of v) console.log(`  ${e}`);
}
