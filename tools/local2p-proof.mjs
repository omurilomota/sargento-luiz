/**
 * Prova da tela de fim do versus local 2P (regra 16).
 *
 * O módulo de 2P tinha vida, dano e `getWinner` desde outubro de 2026, e o fim
 * de partida era um TOAST de 4 segundos com a partida seguindo. A tela nova
 * (`drawFimLocal`) cobre três situações que nenhum teste de número enxerga,
 * porque as três são desenho — e as três estavam quebradas por motivos
 * diferentes:
 *
 *   1. P2 caiu e a partida CONTINUA em `playing` (só o P1 cair muda o estado).
 *      Sem o early-return do draw, o jogador atirava num campo vazio com um
 *      toast sumindo no canto.
 *   2. ENTER é REVANCHE, não "voltar ao menu". A revanche zera a partida, não
 *      a campanha — o P1 não perde arma, moedas e nível entre dois rounds.
 *   3. P1 caiu: o jogo vai para `gameover`, e o ramo `'p2'` de `getWinner`
 *      (inalcançável antes, porque `p1Vivo` era constante) precisa desenhar
 *      "P2 VENCEU" em vez do GAME OVER de campanha com recorde.
 *
 * Uso: node tools/local2p-proof.mjs   (requer `npm run build` antes)
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
const LARGURA = 1280;
const ALTURA = 720;
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.ogg': 'audio/ogg',
};

const servidor = createServer(async (req, res) => {
  const u = (req.url || '').split('?')[0];
  const p = join(DIST, u === '/' ? 'index.html' : decodeURIComponent(u));
  if (!existsSync(p)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const porta = servidor.address().port;
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage({ viewport: { width: LARGURA, height: ALTURA } });
const problemas = [];
const erros = [];
page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') erros.push(`console: ${m.text()}`); });

const g = () => page.evaluate(() => window.__ashfall);
const esperar = (ms) => page.waitForTimeout(ms);
const checar = (rotulo, ok, detalhe = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FALHA'} ${rotulo}${detalhe ? ` — ${detalhe}` : ''}`);
  if (!ok) problemas.push(rotulo);
};

await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await esperar(700);

// ─── entra no versus pelo caminho do jogador: tecla 3 + clique na linha ───
// A mesma geometria de `getMenuLayout` (renderer.ts:112). O canvas não é
// escalado por CSS (`canvas.width = innerWidth`), então o clique em coordenadas
// de tela é clique em coordenadas de canvas.
const spacing = Math.min(46, (ALTURA * 0.5) / 4);
const boxW = Math.min(340, LARGURA * 0.7);
const linhaLocal = {
  x: LARGURA / 2 - boxW / 2,
  y: ALTURA * 0.3 + 2 * spacing,
  w: boxW,
  h: Math.min(32, spacing - 6),
};

await page.keyboard.press('3');
await esperar(200);
// segundo toque na mesma linha inicia a partida (main.ts:418)
await page.mouse.click(linhaLocal.x + linhaLocal.w / 2, linhaLocal.y + linhaLocal.h / 2);
await esperar(900);

console.log('── início do versus ──');
for (let i = 0; i < 6; i++) {
  const c = await page.evaluate(() => window.__ashfall.cena());
  if (!c.ativa) break;
  await page.keyboard.press('Backspace');
  await esperar(500);
}
const inicio = await page.evaluate(() => {
  const a = window.__ashfall;
  return { estado: a.fase().estado, placar: a.placarLocal(), cena: a.cena() };
});
checar('o modo local inicia com os dois jogadores',
  inicio.estado === 'playing' && inicio.placar.length === 2 && inicio.placar[1].vivo,
  `estado=${inicio.estado} · ${inicio.placar.map((j) => `${j.nome} ${j.vida}/${j.vidaMax}`).join(' · ')}`);

// ─── 1. a partida rolando, com os dois vivos ───
await page.mouse.move(LARGURA * 0.75, ALTURA * 0.4);
await page.mouse.down();
await esperar(2500);
await page.mouse.up();
await page.screenshot({ path: join(SHOTS, 'local-2p-jogo.png') });
const emJogo = await page.evaluate(() => {
  const a = window.__ashfall;
  return { placar: a.placarLocal(), fim: a.fimLocal(), t: a.telemetria() };
});
checar('durante a partida não há tela de fim', emJogo.fim === null,
  `P1 ${emJogo.placar[0].vida} · P2 ${emJogo.placar[1].vida}`);

// ─── 2. o P2 cai: a partida continua, a tela aparece ───
await page.evaluate(() => window.__ashfall.abaterP2());
await esperar(400);
const fimP1 = await page.evaluate(() => {
  const a = window.__ashfall;
  return { estado: a.fase().estado, fim: a.fimLocal(), placar: a.placarLocal() };
});
await page.screenshot({ path: join(SHOTS, 'local-2p-fim.png') });
checar('P2 caído: a tela de fim aparece e diz que o P1 ganhou',
  fimP1.fim?.vencedor === 'p1' && fimP1.placar[1].vivo === false && fimP1.placar[1].vida === 0,
  `vencedor=${fimP1.fim?.vencedor} · placar P2 ${fimP1.placar[1].vida}/${fimP1.placar[1].vidaMax}`);
checar('a partida não volta para o menu quando o P2 cai',
  fimP1.estado === 'playing', `estado=${fimP1.estado}`);

// ─── 3. ENTER é revanche: mesma fase, os dois de pé ───
await page.keyboard.press('Enter');
await esperar(700);
const revanche = await page.evaluate(() => {
  const a = window.__ashfall;
  return { estado: a.fase().estado, placar: a.placarLocal(), fim: a.fimLocal(), fase: a.fase().fase };
});
checar('ENTER faz a revanche: os dois de pé e sem tela de fim',
  revanche.estado === 'playing' && revanche.placar.every((j) => j.vivo) && revanche.fim === null,
  `${revanche.fase} · ${revanche.placar.map((j) => `${j.nome} ${j.vida}/${j.vidaMax}`).join(' · ')}`);

// ─── 4. o P1 cai: quem ganha é o P2, e a tela é a do versus ───
// campo limpo primeiro: inimigo nascendo durante a medição poderia derrubar o
// P2 e inverter o vencedor. Só quando ainda há ondas pela frente — na última,
// limpar o campo fecharia a fase e a medição passaria a olhar a loja.
const antes = await page.evaluate(() => {
  const a = window.__ashfall;
  return { onda: a.fase().onda, ondas: a.fase().ondas, inimigos: a.fase().inimigos };
});
if (antes.onda < antes.ondas && antes.inimigos > 0) {
  await page.evaluate(() => window.__ashfall.matarTodos());
  await esperar(200);
}
await page.evaluate(() => window.__ashfall.zerarVida());
// a morte tem 1.5s de animação antes do `gameover` (main.ts:1130)
await esperar(2600);
const fimP2 = await page.evaluate(() => {
  const a = window.__ashfall;
  return { estado: a.fase().estado, fim: a.fimLocal(), placar: a.placarLocal() };
});
await page.screenshot({ path: join(SHOTS, 'local-2p-fim-p2.png') });
checar('P1 caído: a tela do versus diz P2 VENCEU',
  fimP2.estado === 'gameover' && fimP2.fim?.vencedor === 'p2' && fimP2.placar[0].vivo === false,
  `estado=${fimP2.estado} · vencedor=${fimP2.fim?.vencedor} · P1 ${fimP2.placar[0].vida}`);

// ─── 5. na tela de fim, ENTER começa outra partida (não volta ao menu) ───
await page.keyboard.press('Enter');
await esperar(900);
const depois = await page.evaluate(() => {
  const a = window.__ashfall;
  return { estado: a.fase().estado, placar: a.placarLocal(), fim: a.fimLocal() };
});
checar('ENTER na tela de fim do versus começa outra partida',
  depois.estado === 'playing' && depois.placar.every((j) => j.vivo) && depois.fim === null,
  `estado=${depois.estado}`);

console.log('─'.repeat(46));
if (problemas.length) {
  console.log(problemas.map((p) => `FALHA ${p}`).join('\n'));
} else {
  console.log('OK — o versus local tem tela de fim, revanche e vencedor nos dois sentidos.');
}
if (erros.length) { console.log('erros:'); for (const e of [...new Set(erros)]) console.log(`  ${e}`); }
console.log('screenshots: tools/shots/local-2p-{jogo,fim,fim-p2}.png');

await browser.close();
servidor.close();
process.exit(problemas.length === 0 && erros.length === 0 ? 0 : 1);
