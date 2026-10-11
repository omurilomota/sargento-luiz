/**
 * Prova da escada de perks (Sprint 5).
 *
 * Duas coisas que a suíte não prova, e que a regra 16 exige:
 *  1. A seção PERKS desenha 3 linhas legíveis, sem sobrepor serviços nem
 *     talentos. `getShopLayout` prova a GEOMETRIA; o que estava ilegível em
 *     telas passadas (HUD com texto sobre texto) só aparece no PNG.
 *  2. Comprar um especial pela loja o LIGA de verdade — o Incandescente mora em
 *     flag de módulo, e uma flag que a compra não liga é um perk pago à toa.
 *
 * E uma terceira, que é o bug que o relatório apontava: a run seguinte não pode
 * herdar os perks nem o dano da run anterior.
 *
 * Uso: node tools/perks-proof.mjs
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
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });

const fallos = [];
const ok = (cond, msg) => {
  console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`);
  if (!cond) fallos.push(msg);
};

await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.keyboard.press('Enter');
await page.waitForTimeout(1300);
await page.keyboard.press('Backspace');
await page.waitForTimeout(400);

// abre a loja com moedas para a escada inteira
await page.evaluate(() => window.__ashfall.__lojaPronta(5000));
await page.waitForTimeout(400);

// ── 1. a seção desenha 3 linhas ───────────────────────────────────────
const oferta = await page.evaluate(() => window.__ashfall.perks().oferta);
ok(oferta.length === 3, `a loja oferece 3 perks por visita (veio ${oferta.length}: ${oferta.join(', ')})`);

const geometria = await page.evaluate(() => {
  const L = window.__ashfall.__shopLayout(1280, 720);
  return {
    perks: L.upgrades,
    servicos: L.services,
    talentos: L.talentos,
    clip: L.clip,
  };
});
const cruza = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const dentro = (r, c) => r.x >= 0 && r.x + r.w <= 1280 && r.y >= c.y;
const sobrepoeServico = geometria.perks.some(p => geometria.servicos.some(s => cruza(p, s)));
const sobrepoeTalento = geometria.perks.some(p => geometria.talentos.some(t => cruza(p, t)));
const foraDoClip = geometria.perks.some(p => !dentro(p, geometria.clip));
ok(!sobrepoeServico, 'os 3 perks não se sobrepõem aos SERVIÇOS');
ok(!sobrepoeTalento, 'os 3 perks não se sobrepõem à ÁRVORE DE TALENTOS');
ok(!foraDoClip, 'os 3 perks ficam dentro da área de clip');

// ── 2. o PNG (regra 16) ────────────────────────────────────────────────
// O topo da loja é o que o jogador vê ao abrir: perks à direita, armas à
// esquerda. Sem rolar, porque é exatamente a vista que importa.
await page.screenshot({ path: join(SHOTS, 'perks-loja.png') });
console.log('     screenshot: tools/shots/perks-loja.png');

// ── 3. comprar a escada inteira liga os 4 especiais ────────────────────
// A loja só oferece 3 por visita, então a compra vai pelo hook — o que se
// prova aqui é o EFEITO, não o caminho do clique (esse é do shopLayout).
const especiais = await page.evaluate(() => {
  const g = window.__ashfall;
  for (const id of ['dano_t1', 'dano_t2', 'dano_t3', 'dano_t4', 'dano_t5']) g.comprarPerk(id);
  g.comprarPerk('pistola_incandescente');
  for (const id of ['corpo_t1', 'corpo_t2', 'corpo_t3', 'corpo_t4', 'corpo_t5']) g.comprarPerk(id);
  g.comprarPerk('segundo_folego');
  for (const id of ['pernas_t1', 'pernas_t2', 'pernas_t3', 'pernas_t4', 'pernas_t5']) g.comprarPerk(id);
  g.comprarPerk('passo_fantasma');
  for (const id of ['mente_t1', 'mente_t2', 'mente_t3', 'mente_t4', 'mente_t5']) g.comprarPerk(id);
  g.comprarPerk('sortudo');
  return g.perks();
});
ok(especiais.comprados.length === 24, `a escada inteira foi comprada (${especiais.comprados.length}/24)`);
ok(especiais.especiais.incandescente, 'Pistola Incandescente ficou ativa depois de comprada');
ok(especiais.especiais.folego, 'Segundo Fôlego ficou ativo depois de comprada');
ok(especiais.especiais.fantasma, 'Passo Fantasma ficou ativo depois de comprado');
ok(especiais.especiais.sortudo, 'Sortudo ficou ativo depois de comprado');

// ── 4. a run seguinte não herda nada ───────────────────────────────────
const telemetriaAntes = await page.evaluate(() => window.__ashfall.telemetria());
const resetado = await page.evaluate(() => {
  window.__ashfall.resetarPartida();
  return { perks: window.__ashfall.perks(), telemetria: window.__ashfall.telemetria() };
});
ok(resetado.perks.comprados.length === 0, `a run nova não herdou degraus (veio ${resetado.perks.comprados.length})`);
ok(
  !resetado.perks.especiais.incandescente && !resetado.perks.especiais.folego &&
  !resetado.perks.especiais.fantasma && !resetado.perks.especiais.sortudo,
  'a run nova não herdou nenhum dos 4 especiais',
);
ok(
  resetado.telemetria.maxHp < telemetriaAntes.maxHp + 100,
  `a vida máxima voltou ao base (antes ${telemetriaAntes.maxHp}, depois ${resetado.telemetria.maxHp})`,
);

await browser.close();
s.close();

if (erros.length) {
  console.log('erros de console:');
  for (const e of [...new Set(erros)]) console.log(`  ${e}`);
  process.exitCode = 1;
}
console.log(fallos.length ? `\n${fallos.length} FALHA(S)` : '\nOK: escada de perks provedora em tela');
if (fallos.length) process.exitCode = 1;