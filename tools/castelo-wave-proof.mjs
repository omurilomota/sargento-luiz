/**
 * Prova do relato do dono (2026-10-12): "Na fase do castelo teve wave
 * pós-boss, o que não deveria acontecer em motivo nenhum."
 *
 * Causa raiz: o reinício do `protect` (vipDown → resetWave) não distinguia
 * fase decidida de fase em andamento, e não zerava o estado de chefe.
 * - Com o chefe MORTO, o reinício devolvia as ondas com `bossSpawned` ainda
 *   true — a wave pós-boss do relato.
 * - Com o chefe VIVO, o reinício herdava o flag e o chefe nunca voltava a
 *   nascer: a fase renascia sem a luta que o mapa promete.
 *
 * Cenário A — chefe morto, sobrevivente cai na janela do respiro: nenhuma
 *   onda pode nascer, e a fase vai para a loja.
 * Cenário B — chefe vivo, sobrevivente cai na luta: a fase renasce da onda 1
 *   e o chefe volta a nascer pelo caminho NATURAL na última onda — sem
 *   `invocarChefe`, que o flag herdado impediria.
 *
 * Uso: node tools/castelo-wave-proof.mjs
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const jogo = await abrirJogo({ chromium });
const { page, erros, fechar } = jogo;

const f = () => page.evaluate(() => window.__ashfall.fase());
const falhas = [];
const ok = (cond, msg) => {
  console.log(`${cond ? 'ok: ' : 'FALHA: '}${msg}`);
  if (!cond) falhas.push(msg);
};

// ─── Cenário A ───────────────────────────────────────────────
const cfg = await irParaFase(page, 5);
console.log(`\n── Cenário A: chefe morto, sobrevivente cai no respiro (${cfg.fase}) ──`);
await page.evaluate(() => {
  window.__ashfall.cumprirObjetivo();
  window.__ashfall.matarTodos();
  window.__ashfall.pularParaUltimaOnda();
  window.__ashfall.invocarChefe();
});
await page.waitForTimeout(300);
const antes = await f();
ok(antes.chefeVivo, 'chefe em campo antes da prova');
await page.evaluate(() => window.__ashfall.matarChefe());
await page.waitForTimeout(250);
await page.evaluate(() => window.__ashfall.matarVip());

let ondaPosBoss = false;
let estadoFim = null;
let ondaAntes = antes.onda;
for (let i = 0; i < 22; i++) {
  await page.waitForTimeout(400);
  const s = await f();
  // o sintoma do relato é a ONDA voltando depois do chefe morto (o reinício
  // re-armava a fase); residual de quota da última onda não é este bug.
  if (s.onda < ondaAntes) ondaPosBoss = true;
  ondaAntes = s.onda;
  if (s.estado === 'shop' || s.estado === 'gameover') { estadoFim = s.estado; break; }
}
ok(estadoFim === 'shop', `a fase foi para a loja (estado: ${estadoFim})`);
ok(!ondaPosBoss, 'nenhuma onda renasceu depois do chefe morto');

// ─── Cenário B ───────────────────────────────────────────────
console.log('\n── Cenário B: chefe vivo, sobrevivente cai na luta ──');
await irParaFase(page, 5);
await page.evaluate(() => {
  window.__ashfall.cumprirObjetivo();
  window.__ashfall.matarTodos();
  window.__ashfall.pularParaUltimaOnda();
  window.__ashfall.invocarChefe();
});
await page.waitForTimeout(300);
const comChefe = await f();
ok(comChefe.chefeVivo, 'chefe em campo antes do reinício');

await page.evaluate(() => window.__ashfall.matarVip());
await page.waitForTimeout(700);
const renasceu = await f();
ok(!renasceu.chefeVivo, 'o reinício limpa o chefe da tela');
ok(renasceu.onda === 1, `a fase renasce da onda 1 (onda: ${renasceu.onda})`);
ok(renasceu.estado === 'playing', `de volta ao combate (estado: ${renasceu.estado})`);

// A caminhada natural até o chefe voltar: onda a onda, sem invocarChefe.
// O archer pode derrubar o VIP de novo no caminho — o reinício é o
// comportamento correto; a prova segue andando até o chefe nascer.
let chefeVoltou = false;
let reinicios = 0;
let ondaAnterior = renasceu.onda;
const fimB = Date.now() + 90000;
while (Date.now() < fimB) {
  const s = await f();
  if (s.chefeVivo) { chefeVoltou = true; break; }
  if (s.estado !== 'playing') break;
  if (s.onda < ondaAnterior) reinicios++;
  ondaAnterior = s.onda;
  await page.evaluate(() => {
    window.__ashfall.cumprirObjetivo();
    if (window.__ashfall.fase().inimigos > 0) window.__ashfall.matarTodos();
  });
  await page.waitForTimeout(500);
}
ok(chefeVoltou, `o chefe volta a nascer pelo caminho natural (${reinicios} reinício(s) no caminho)`);

await fechar();
console.log(`\n${falhas.length === 0 ? 'PROVA VERDE — os dois cenários passaram' : `${falhas.length} falha(s)`}`);
if (erros.length) console.log('erros de página:', [...new Set(erros)]);
process.exit(falhas.length === 0 ? 0 : 1);
