/**
 * Instrumento de quadro: o mundo está avançando de verdade?
 *
 * Achado de 2026-10-15, e ele é do HARNESS, não do jogo.
 *
 * Uma prova mediava o Pântano com o jogador parado e via o mesmo sintoma em
 * toda amostra: 1 inimigo vivo, pixel imutável por 30s, nenhum spawn novo,
 * `spawnDelay` que nunca zerava. Tudo que se podia imaginar foi reprovado com
 * as funções reais — o instrumento menor (`tilemap.ts` importado em Node)
 * anda 100px em 60 frames a partir do MESMO pixel; o inimigo criado por
 * `spawnarInimigo`, pela mesma `spawnEnemy` e com a mesma conta de `speed`,
 * caminha 375px e encosta no jogador; a Cidade, que não tem nenhuma árvore,
 * congelava igual. Sobrou a única explicação fora do jogo: o Chrome headless
 * não estava entregando quadros.
 *
 * E é exatamente isso. Sem tecla e sem nenhum `requestAnimationFrame` pedido
 * pela página, o compositor headless não produz BeginFrame: o laço do jogo
 * para, o mundo congela e a telemetria lida naquele estado é uma mentira —
 * `spawnDelay` parado no meio, contagem de inimigos velha, HP congelado.
 * Com UM laço de rAF vivo na página (o que este probe faz), o jogo volta a
 * marcar 61-62 quadros por segundo, o inimigo caminha, a onda enche.
 *
 * Regra que nasce daqui: **harness que espera no Page tem que manter um rAF
 * vivo**, ou a amostra mede um jogo parado. `bot.mjs` escapava porque tecla o
 * tempo todo; `visual.mjs` e as provas de screenshot escapam porque o tiro
 * força o quadro. Prova que fica parada lendo telemetria precisa deste
 * instrumento.
 *
 * Uso: node tools/frames-proof.mjs [--fase 8]
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');
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

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));

await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.keyboard.press('Enter');
await page.waitForTimeout(1000);
await page.keyboard.press('Backspace');
await page.waitForTimeout(400);
const cena = await page.evaluate(() => window.__ashfall.cena());
if (cena.ativa) { await page.keyboard.press('Backspace'); await page.waitForTimeout(400); }

const nomes = await page.evaluate(() => window.__ashfall.config().fases.map((f) => f.name));
const fase = arg('fase', 8);
await page.evaluate((f) => window.__ashfall.irParaFase(f), nomes.indexOf(nomes[fase]));
await page.waitForTimeout(1500);

/** Conta callbacks de rAF em 1s. Manter um vivo É o que faz o jogo rodar. */
const contarFrames = () => page.evaluate(() => new Promise((resolve) => {
  let n = 0;
  const t0 = performance.now();
  const step = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(step); else resolve(n); };
  requestAnimationFrame(step);
}));

const amostra = () => page.evaluate(() => {
  const t = window.__ashfall.telemetria();
  const e = window.__ashfall.inimigoMaisProximo();
  return { hp: t.hp, vivos: t.inimigos, onda: t.onda, perto: e };
});

console.log(`${nomes[fase]}: quadros por segundo, sem tecla\n`);
for (let i = 0; i < 3; i++) {
  const f = await contarFrames();
  const a = await amostra();
  const d = a.perto;
  console.log(`${String(f).padStart(3)} quadros | hp=${a.hp} onda=${a.onda} vivos=${a.vivos} ` +
    (d ? `perto=${d.type} (${d.x.toFixed(0)},${d.y.toFixed(0)}) dist=${d.dist.toFixed(0)}` : 'perto=nenhum'));
}

console.log(erros.length ? `ERROS: ${erros.join(' | ')}` : 'sem pageerror');
await browser.close();
servidor.close();
