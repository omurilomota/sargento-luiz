/**
 * Prova de progressão de ondas.
 *
 * Nenhum outro harness cobria isto. `fase-proof.mjs` **força** a última onda com
 * `pularParaUltimaOnda()` e `invocarChefe()` — os dois ganchos existem só para
 * encurtar o caminho até o chefe. Isso significa que a prova nunca exercitava a
 * fase de verdade, e foi por isso que o bug "toda fase começa com chefe" passou
 * com 713 testes verdes.
 *
 * Esta prova faz o contrário: joga a fase como um jogador jogaria. Ela nunca
 * chama os ganchos de atalho, e confere a progressão onda a onda.
 *
 *   CENÁRIO 1  30s de jogo natural — a fase tem de ficar na onda 1
 *   CENÁRIO 2  campo limpo uma vez → onda 2, e SEM chefe
 *   CENÁRIO 3  campo limpo outra vez → onda 3, e agora SIM o chefe
 *
 * Uso: node tools/onda-proof.mjs
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
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.ogg': 'audio/ogg', '.md': 'text/markdown',
};

const servidor = createServer(async (req, res) => {
  const u = (req.url || '/').split('?')[0];
  const p = join(DIST, u === '/' ? 'index.html' : decodeURIComponent(u));
  if (!existsSync(p)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const porta = servidor.address().port;

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erros = [];
page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') erros.push(`console: ${m.text()}`); });

mkdirSync(SHOTS, { recursive: true });

const f = () => page.evaluate(() => window.__ashfall.fase());
const curar = () => page.evaluate(() => window.__ashfall.curar());
const matarTodos = () => page.evaluate(() => window.__ashfall.matarTodos());

/**
 * Avança limpando o campo em ciclo até a onda alvo.
 *
 * Não dá para limpar uma vez e esperar: a onda só termina quando a cota do
 * spawner inteira foi preenchida E o campo está vazio. Limpar logo no começo
 * da onda mata só os 2 primeiros inimigos e a cota ainda tem o resto pela
 * frente — o `matarTodos` seguinte pega os próximos. Por isso o ciclo.
 */
async function limparAte(ondaAlvo, timeoutMs = 20000) {
  const t0 = Date.now();
  let s = await f();
  while (s.onda < ondaAlvo && Date.now() - t0 < timeoutMs) {
    await curar();
    await matarTodos();
    await page.waitForTimeout(350);
    s = await f();
  }
  return s;
}

const resultados = [];
const checar = (nome, ok, detalhe) => {
  resultados.push({ nome, ok });
  console.log(`${ok ? 'OK   ' : 'FALHA'} ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
};

// ── entrada no jogo, sem atalho nenhum ──
await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.keyboard.press('Enter');        // menu → prólogo
await page.waitForTimeout(1200);
await page.keyboard.press('Backspace');    // pula o prólogo
await page.waitForTimeout(900);

// ── CENÁRIO 1: 30s de fase natural ──
// O contrato é "a onda só avança depois que o campo esvazia DE VERDADE" —
// testemunhado por uma amostra de campo vazio no ciclo de polls. O bug do
// Sprint 0 avançava as ondas em 2 frames SEM campo vazio nenhum; é isso que
// este cenário tem que pegar.
//
// A checagem ANTIGA ("30s sem pular de onda") codificava uma assunção que
// só era verdade enquanto os inimigos TRAVAVAM nas portas: melee que
// encosta num jogador que se cura morre na briga de contato (design de
// 2026-10-05 — quem não atira apanha metade do próprio dano por toque), e
// com o passoDeCelula os inimigos passaram a CHEGAR. A onda 1 completou
// sozinha, legitimamente, com o jogador parado — medido em 2026-10-13.
console.log('\n=== CENÁRIO 1: a onda só avança com o campo vazio ===');
const inicial = await f();
checar('começa na onda 1', inicial.onda === 1, `onda=${inicial.onda}/${inicial.ondas}`);
checar('não começa com chefe', inicial.chefeVivo === false, `chefeVivo=${inicial.chefeVivo}`);

let maxOnda = 1;
let viuInimigo = false;
let pollsDesdeVazio = 99;   // polls desde a última amostra de campo vazio
let avancosSemVazio = 0;
for (let i = 0; i < 100; i++) {
  await curar();                            // segura o jogador vivo: o teste é
  await page.waitForTimeout(300);           // sobre ondas, não sobre sobrevivência
  const s = await f();
  if (s.inimigos > 0) viuInimigo = true;
  if (s.inimigos === 0) pollsDesdeVazio = 0; else pollsDesdeVazio++;
  if (s.onda > maxOnda) {
    // avançou: precisa ter visto campo vazio há pouco (a onda nova leva
    // >=1,2s para nascer o primeiro inimigo — 4 polls de folga; 6 é margem)
    if (pollsDesdeVazio > 6) avancosSemVazio++;
    maxOnda = s.onda;
  }
  if (s.estado !== 'playing') break;
}

const depois = await f();
checar('a onda do spawner rodou', viuInimigo, `inimigos=${depois.inimigos}`);
checar('nenhum avanço de onda sem campo vazio', avancosSemVazio === 0, `${avancosSemVazio} pulo(s) sem vazio; maior onda vista=${maxOnda}`);
checar('nenhum chefe apareceu', depois.chefeVivo === false, `chefeVivo=${depois.chefeVivo}`);
checar('ainda jogando, não foi para a loja', depois.estado === 'playing', `estado=${depois.estado}`);

await page.screenshot({ path: join(SHOTS, 'onda-01-onda1.png') });

// ── CENÁRIO 2: limpar o campo avança UMA onda por vez ──
console.log('\n=== CENÁRIO 2: limpar o campo leva à onda 2 ===');
const s2 = await limparAte(2);
checar('vai para a onda 2', s2.onda === 2, `onda=${s2.onda}/${s2.ondas}`);
checar('ainda sem chefe na onda 2', s2.chefeVivo === false, `chefeVivo=${s2.chefeVivo}`);

// ── CENÁRIO 3: a última onda é a única que libera o chefe ──
console.log('\n=== CENÁRIO 3: limpar de novo chega na última onda ===');
const s3 = await limparAte(3);
checar('vai para a onda 3 (a última)', s3.onda === 3 && s3.ondas === 3, `onda=${s3.onda}/${s3.ondas}`);
checar('o chefe nasce SÓ na última onda', s3.chefeVivo === true, `chefeVivo=${s3.chefeVivo}`);

await page.screenshot({ path: join(SHOTS, 'onda-02-ultima-com-chefe.png') });

await browser.close();
servidor.close();

const passou = resultados.filter((r) => r.ok).length;
console.log(`\n${passou}/${resultados.length} verificações passaram`);

if (erros.length) {
  console.log('\nerros de página:');
  for (const e of [...new Set(erros)]) console.log(`  ${e}`);
}
if (passou !== resultados.length) process.exit(1);