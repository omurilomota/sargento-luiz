/**
 * Reproduz o embed do itch.io: o jogo num <iframe> + botão de fullscreen.
 *
 * O itch roda o jogo num iframe e o botão dele chama `requestFullscreen()` no
 * próprio iframe. Nenhum código do jogo pede fullscreen, então é esse botão.
 * Este harness monta a mesma página e descobre o que acontece com o ESC.
 *
 * Uso: node tools/itch-fullscreen-proof.mjs
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
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.ogg': 'audio/ogg', '.md': 'text/markdown',
};

// Página que imita o embed do itch: iframe + botão de fullscreen do jogador.
//
// O embed é servido na MESMA porta do jogo de propósito: em duas portas
// diferentes cada uma vira uma origem, o navegador bloqueia o acesso do pai
// ao `contentWindow`, e o `same-origin` do itch deixa de ser testado — que é
// justamente a configuração que importa.
const JOGO = `/index.html`;

const ARQUIVOS = createServer(async (req, res) => {
  const u = (req.url || '/').split('?')[0];
  if (u === '/embed' || u === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(EMBED);
    return;
  }
  const p = join(DIST, u === '/' ? 'index.html' : decodeURIComponent(u));
  if (!existsSync(p)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise((r) => ARQUIVOS.listen(0, '127.0.0.1', r));
const porta = ARQUIVOS.address().port;

const EMBED = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin:0; background:#202020; font-family: monospace; color:#ccc; }
  #barra { height:36px; display:flex; align-items:center; gap:12px; padding:0 12px;
           background:#111; border-bottom:1px solid #333; }
  button { background:#333; color:#ccc; border:1px solid #555; padding:6px 12px;
           cursor:pointer; font-family:monospace; }
  iframe { width:100%; height:calc(100vh - 36px); border:0; display:block; }
</style></head><body>
  <div id="barra">
    <span>SARGENTO LUIZ</span>
    <button id="fs">FULLSCREEN</button>
    <span id="estado">-</span>
  </div>
  <iframe id="jogo" src="${JOGO}"
    allow="fullscreen; autoplay; gamepad"></iframe>
<script>
  const f = document.getElementById('jogo');
  const e = document.getElementById('estado');
  document.getElementById('fs').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else f.requestFullscreen();
  });
  document.addEventListener('fullscreenchange', () => {
    e.textContent = document.fullscreenElement ? 'EM FULLSCREEN' : 'normal';
  });
</script></body></html>`;

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));

const diagnostico = [];
const registrar = (nome, valor) => { diagnostico.push(`${nome}: ${valor}`); console.log(`  ${nome}: ${valor}`); };

await page.goto(`http://127.0.0.1:${porta}/embed`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

// entra no jogo
const frame = page.frameLocator('#jogo');
await page.evaluate(() => document.getElementById('jogo').contentWindow.focus());
await page.keyboard.press('Enter');
await page.waitForTimeout(1300);
await page.keyboard.press('Backspace');
await page.waitForTimeout(900);

const estadoDoJogo = () => page.evaluate(() => {
  const f = document.getElementById('jogo');
  const w = f.contentWindow;
  const g = w.__ashfall;
  const doc = f.contentDocument;
  return {
    estado: g?.telemetria?.().estado ?? '?',
    fullscreenElement: doc?.fullscreenElement?.tagName ?? null,
    canvasW: doc?.getElementById('game')?.width,
    canvasH: doc?.getElementById('game')?.height,
    iframeW: f.clientWidth,
    iframeH: f.clientHeight,
    activeNoFrame: doc?.activeElement?.tagName ?? null,
  };
});

console.log('\n=== ANTES DO FULLSCREEN ===');
let s = await estadoDoJogo();
registrar('estado do jogo', s.estado);
registrar('canvas', `${s.canvasW}x${s.canvasH}`);
registrar('iframe', `${s.iframeW}x${s.iframeH}`);

// o botão do itch pede fullscreen no IFRAME
console.log('\n=== APÓS O BOTÃO DE FULLSCREEN DO ICH ===');
await page.click('#fs');
await page.waitForTimeout(900);
s = await estadoDoJogo();
registrar('estado do jogo', s.estado);
registrar('fullscreen dentro do iframe', s.fullscreenElement ?? 'NINGUEM');
registrar('canvas depois do resize', `${s.canvasW}x${s.canvasH}`);
registrar('iframe', `${s.iframeW}x${s.iframeH}`);

const entrouFullscreen = await page.evaluate(() => document.fullscreenElement?.id ?? null);
registrar('fullscreenElement na página PAI', entrouFullscreen ?? 'NINGUEM');

// ESC: o navegador sai do fullscreen E o jogo abre o pause ao mesmo tempo
console.log('\n=== APÓS ESC (foco fora do iframe, como fica após clicar no itch) ===');
const focadoEm = await page.evaluate(() => {
  const a = document.activeElement;
  return a?.tagName === 'IFRAME' ? 'IFRAME' : (a?.id || a?.tagName);
});
registrar('foco no pai', focadoEm);
await page.keyboard.press('Escape');
await page.waitForTimeout(700);
s = await estadoDoJogo();
registrar('estado do jogo', s.estado);
registrar('ainda fullscreen?', await page.evaluate(() => document.fullscreenElement?.id ?? 'NENHUM'));

await page.screenshot({ path: '/tmp/opencode/itch-fs-1.png' });

// O usuário real CLICA no jogo depois de entrar em fullscreen.
console.log('\n=== APÓS CLICAR DENTRO DO JOGO (o que o usuário faz) ===');
const box = await page.locator('#jogo').boundingBox();
await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
await page.waitForTimeout(300);
registrar('foco no pai depois do clique', await page.evaluate(() => {
  const a = document.activeElement;
  return a?.tagName === 'IFRAME' ? 'IFRAME' : (a?.id || a?.tagName);
}));
await page.keyboard.press('Escape');
await page.waitForTimeout(600);
s = await estadoDoJogo();
registrar('estado do jogo com foco interno', s.estado);
registrar('ainda fullscreen?', await page.evaluate(() => document.fullscreenElement?.id ?? 'NENHUM'));

// O teste decisivo: com o FOCO DENTRO do iframe, o ESC chega ao jogo?
console.log('\n=== FOCO DENTRO DO IFRAME: o ESC chega? ===');
const frameEl = page.frames()[1];
await page.evaluate(() => {
  const f = document.getElementById('jogo');
  f.contentWindow.focus();
  f.contentDocument.body.focus();
});
await page.waitForTimeout(200);
registrar('activeElement dentro do iframe', await frameEl.evaluate(() => document.activeElement?.tagName ?? 'null'));

// O jogo pede a saída ele mesmo. Pressionamos ESC de dentro do iframe, que é
// exatamente o que o jogador faz.
// ── A CAUSA ──
// O botão do itch chama requestFullscreen() no IFRAME, no documento do PAI.
// Ou seja: o elemento em fullscreen é o <iframe>, e `document.fullscreenElement`
// DENTRO do iframe é null. O jogo não tinha como saber que estava em tela
// cheia — por isso não tinha como oferecer nenhuma saída.
console.log('\n=== A CAUSA: onde está o elemento em fullscreen? ===');
registrar('pai: document.fullscreenElement', await page.evaluate(() => document.fullscreenElement?.tagName ?? 'NENHUM'));
registrar('jogo: document.fullscreenElement', await frameEl.evaluate(() => document.fullscreenElement?.tagName ?? 'NENHUM'));
registrar('jogo: ve o do pai? (mesma origem)',
  await frameEl.evaluate(() => window.parent.document.fullscreenElement?.tagName ?? 'NENHUM'));
registrar('jogo: window.parent === window?', await frameEl.evaluate(() => window.parent === window));

// ── A PROVA: o jogo real, com a tecla que o jogador pressiona ──
console.log('\n=== A PROVA: ESC no jogo de verdade, dentro do embed ===');
// Reentra em fullscreen pelo mesmo caminho do itch (o elemento é o IFRAME).
await page.evaluate(() => document.getElementById('jogo').requestFullscreen());
await page.waitForTimeout(800);
await page.evaluate(() => {
  const f = document.getElementById('jogo');
  f.contentWindow.focus();
  f.contentDocument.body.focus();
});
await page.waitForTimeout(200);
registrar('antes: pai em tela cheia?', await page.evaluate(() => document.fullscreenElement?.tagName ?? 'NENHUM'));
registrar('antes: o jogo sabe que está?', await frameEl.evaluate(() => document.fullscreenElement?.tagName ?? 'NAO SABE (é null)'));

await page.keyboard.press('Escape');           // o que o jogador faz
await page.waitForTimeout(900);

const depoisPai = await page.evaluate(() => !!document.fullscreenElement);
const depoisJogo = await estadoDoJogo();
registrar('depois: pai em tela cheia?', depoisPai ? 'SIM (BUG)' : 'NÃO');
registrar('depois: estado do jogo', depoisJogo.estado);
registrar('depois: canvas', `${depoisJogo.canvasW}x${depoisJogo.canvasH}`);

console.log('\n=== CONCLUSÃO ===');
if (depoisPai) {
  console.log('  FALHOU: o ESC do jogo não saiu da tela cheia.');
} else {
  console.log('  OK: o ESC do jogo saiu da tela cheia dentro do embed do itch.');
  if (depoisJogo.estado === 'paused') {
    console.log('  ATENÇÃO: o jogo também abriu a pausa (duas ações para uma tecla).');
  } else {
    console.log('  OK: uma tecla, uma ação — a pausa não abriu junto.');
  }
}

await page.screenshot({ path: '/tmp/opencode/itch-fs-2.png' });

await browser.close();
ARQUIVOS.close();


if (erros.length) {
  console.log('\nerros de página:');
  for (const e of [...new Set(erros)]) console.log(`  ${e}`);
}