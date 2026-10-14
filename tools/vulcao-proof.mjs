/**
 * Prova do relato do dono (2026-11): "No Vulcão, horda 7: o countdown
 * disparou SEM chefe, veio outra horda, e matar o último foi direto pra
 * loja."
 *
 * O Vulcão é `reach`: o chefe (infernoPrime) só é liberado quando o jogador
 * entra na zona de extração. O furo: o respiro de 5s armava na limpeza da
 * última onda SEM checar o objetivo — o countdown corria com o chefe
 * proibido de existir. Se o countdown expirasse e o jogador entrasse na
 * zona depois, a fase fechava no primeiro frame liberado: `!chefeVivo` é
 * verdade por vacuidade (o chefe nasce no bloco que roda DEPOIS do
 * fechamento) e o jogador ia para a loja sem a luta que o mapa promete.
 *
 * Cenário A — o countdown NÃO arma com o objetivo pendente: limpa a última
 * onda sem entrar na zona; `respiroArmado` tem que continuar false.
 * Cenário B — o objetivo completa DEPOIS: o chefe tem que NASCER antes de
 * qualquer loja; a fase só fecha quando ele cai.
 *
 * Uso: node tools/vulcao-proof.mjs
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

const cfg = await irParaFase(page, 12);
ok(cfg.fase === 'Vulcão', `fase certa (${cfg.fase})`);
ok(cfg.objetivo === 'reach', `objetivo reach (${cfg.objetivo})`);

// ─── Cenário A: última onda limpa, jogador FORA da zona ─────────
await page.evaluate(() => {
  window.__ashfall.pularParaUltimaOnda();
  window.__ashfall.matarTodos();
});

// esvazia a cota da última onda: o spawner precisa zerar o próprio Refil
// para o `waveComplete` ser de verdade, e não um `matarTodos` cosmético
let estadoA = null;
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    if (window.__ashfall.fase().inimigos > 0) window.__ashfall.matarTodos();
  });
  const s = await f();
  if (i % 8 === 0) console.log(`  t=${(i * 0.4).toFixed(0)}s onda ${s.onda}/${s.ondas} inimigos ${s.inimigos} respiro ${s.respiroArmado ? 'ARMADO' : 'livre'} objetivo ${s.objetivoAtual.detail}`);
  if (s.respiroArmado || s.estado !== 'playing') { estadoA = s; break; }
}
if (!estadoA) estadoA = await f();

const objetivoPendentes = estadoA.objetivoAtual.done === false;
ok(objetivoPendentes, 'o objetivo segue pendente (jogador fora da zona)');
ok(estadoA.respiroArmado === false, 'o countdown NÃO arma com o objetivo pendente');
ok(estadoA.estado === 'playing', `a fase não fechou sozinha (estado: ${estadoA.estado})`);

// ─── Cenário B: o objetivo completa DEPOIS da janela ────────────
// O furo completo precisa do countdown EXPIRADO: se o jogador entrar na
// zona dentro dos 5s, o chefe nasce na janela e a fase se salva. O relato
// do dono é o outro caso — chegar depois.
if (estadoA.respiroArmado) {
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(400);
    const s = await f();
    if (s.respiroRestante <= 0) break;
  }
  const expirado = await f();
  console.log(`  countdown: restante ${expirado.respiroRestante.toFixed?.(1) ?? expirado.respiroRestante}s, objetivo ${expirado.objetivoAtual.detail}`);
}
// `cumprirObjetivo` é o instante em que o jogador pisa na zona: o que
// importa é a ORDEM — objetivo depois do countdown.
await page.evaluate(() => window.__ashfall.cumprirObjetivo());
// Limpa o campo e vê quem vence a corrida: com o furo, a loja fechava a
// fase no primeiro frame de campo vazio (`!chefeVivo` por vacuidade — o
// chefe só nasceria no bloco que roda DEPOIS do fechamento).
let chefeNasceu = false;
let lojaSemLuta = false;
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(400);
  const s = await f();
  if (s.chefeVivo) { chefeNasceu = true; break; }
  if (s.estado === 'shop' || s.estado === 'gameover') { lojaSemLuta = true; break; }
  await page.evaluate(() => {
    if (window.__ashfall.fase().inimigos > 0) window.__ashfall.matarTodos();
  });
}
ok(chefeNasceu, 'o chefe NASCE quando o objetivo libera — a loja não vence a corrida');
ok(!lojaSemLuta, 'a fase não foi para a loja sem luta');

// a fase só fecha quando o chefe cai — o contrato que o mapa promete
if (chefeNasceu) {
  await page.evaluate(() => window.__ashfall.matarChefe());
}
let estadoFim = null;
for (let i = 0; i < 22; i++) {
  await page.waitForTimeout(400);
  const s = await f();
  if (s.estado === 'shop' || s.estado === 'gameover') { estadoFim = s.estado; break; }
}
ok(estadoFim === 'shop', `a fase foi para a loja DEPOIS da luta (estado: ${estadoFim})`);

await fechar();
console.log(`\n${falhas.length === 0 ? 'PROVA VERDE — o countdown respeita o objetivo' : `${falhas.length} falha(s)`}`);
if (erros.length) console.log('erros de página:', [...new Set(erros)]);
process.exit(falhas.length === 0 ? 0 : 1);
