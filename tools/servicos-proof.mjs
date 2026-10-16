/**
 * A prova dos serviços da loja (M3) — o contrato "quem paga, recebe".
 *
 * A rodada de 2026-10-14 vendeu torreta (240) e botas (120) que não faziam
 * nada no jogo. A prova faz o caminho do jogador:
 *
 *   1. fecha a Cidade e abre a loja;
 *   2. paga os três serviços (contratado, torreta, botas) pela mesma porta
 *      do clique (`comprarServico` → `buyService`);
 *   3. sai da loja e atravessa a cutscene da Rodovia;
 *   4. NA ENTRADA da fase: os dois aliados existem, a velocidade do
 *      jogador carrega o +30% das botas;
 *   5. espera os inimigos chegarem: os aliados ATIRAM (contador > 0).
 *
 * Uso: node tools/servicos-proof.mjs  (via `npm run servicos`)
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const SHOT = (nome) => `tools/shots/servicos-${nome}.png`;
const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };

const { page, erros, fechar } = await abrirJogo({ chromium });
await irParaFase(page, 0); // Cidade em Ruínas

// ── 1. fecha a fase e abre a loja ──
await page.evaluate(() => {
  window.__ashfall.cumprirObjetivo();
  window.__ashfall.matarTodos();
  window.__ashfall.pularParaUltimaOnda();
  window.__ashfall.invocarChefe();
});
await page.waitForTimeout(400);
await page.evaluate(() => window.__ashfall.matarChefe());
let estado = null;
for (let i = 0; i < 24; i++) {
  await page.waitForTimeout(400);
  estado = (await page.evaluate(() => window.__ashfall.fase().estado));
  if (estado === 'shop') break;
}
if (estado !== 'shop') {
  console.log(`FALHA: a Cidade não chegou na loja (estado: ${estado})`);
  await fechar();
  process.exit(1);
}

// ── 2. paga os três serviços pela porta da compra ──
await page.evaluate(() => window.__ashfall.__setShopCoins(1000));
await page.evaluate(() => {
  window.__ashfall.comprarServico('turret');
  window.__ashfall.comprarServico('hire');
});
await page.waitForTimeout(300);
await page.screenshot({ path: SHOT('loja') });

// ── 3. sai da loja e atravessa a cutscene da Rodovia ──
await page.keyboard.press('Enter');
await page.waitForTimeout(900);
for (let i = 0; i < 200; i++) {
  const cena = await page.evaluate(() => window.__ashfall.cena());
  if (!cena.ativa) break;
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
}

// ── 4. na entrada da fase: aliados vivos e a velocidade das botas ──
await page.waitForTimeout(1500);
const aliados = await page.evaluate(() => window.__ashfall.aliados());
console.log('  aliados na entrada:', JSON.stringify(aliados));
const modos = aliados.map(a => a.modo).sort();
if (!modos.includes('contratado')) nota('o contratado pago não nasceu na fase');
if (!modos.includes('torreta')) nota('a torreta paga não nasceu na fase');
if (aliados.some(a => !a.vivo)) nota('aliado nasceu morto');

const tel = await page.evaluate(() => window.__ashfall.telemetria());
console.log(`  velocidade na entrada: ${tel.velocidade} (padrão — as botas saíram, playtest 2026-10-16)`);
if (tel.velocidade > 1.05) nota(`velocidade fora do padrão sem power-up: ${tel.velocidade}`);

await page.screenshot({ path: SHOT('entrada') });

// ── 5. inimigos chegam: os aliados atiram ──
let tiros = 0;
for (let i = 0; i < 40 && tiros === 0; i++) {
  await page.waitForTimeout(500);
  tiros = await page.evaluate(() => window.__ashfall.tirosDeAliado());
}
console.log(`  tiros de aliado na fase: ${tiros}`);
if (tiros === 0) nota('nenhum aliado atirou em 20s de fase (comprados e vivos, sem tiro = serviço vazio)');

const vivosNoFim = await page.evaluate(() => window.__ashfall.aliados().filter(a => a.vivo).length);
console.log(`  aliados vivos ao fim: ${vivosNoFim}`);
await page.screenshot({ path: SHOT('combate') });

if (erros.length) nota(`erros de página: ${[...new Set(erros)].join('; ')}`);

console.log(problemas.length === 0
  ? '\nOK — quem paga recebe: contratado e torreta nascem e atiram; a velocidade segue o padrão'
  : `\nFALHA — ${problemas.length} problema(s)`);
await fechar();
process.exit(problemas.length === 0 ? 0 : 1);
