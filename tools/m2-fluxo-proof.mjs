/**
 * A prova dos bugs de FLUXO (M2, relato de 2026-10-14) — os três que
 * sobreviveram à análise:
 *
 *   1. ANÚNCIO DE ONDA SOB A CAIXA DE DIÁLOGO: no Hospital (e Fábrica/
 *      Castelo) a onda 2 nasce na mesma frame do encontro — o som tocava
 *      debaixo do mundo congelado e o jogador nunca ouvia. Agora o
 *      anúncio fica PENDENTE e toca quando a caixa fecha.
 *   2. O MARTELO FORÇADO NO NÚCLEO: o Destruidor vem na MÃO e as teclas
 *      1-9/Q ficam caladas — a fase final é só ele.
 *   3. A TELA DE VITÓRIA: quem zerou a campanha vê "MUITO BEM, SOLDADO!",
 *      não GAME OVER (o markGameCompleted agora roda no caminho natural,
 *      não só no FINAL SECRETO "PERFEIÇÃO").
 *
 * O item "input morto no blur da aba" NÃO REPRODUZ no HEAD — verificado no
 * `tools/blur-proof.mjs` (256px de movimento pós-blur nas duas variantes):
 * o relato é do build publicado, anterior ao fix de 2026-10-13.
 *
 * Uso: node tools/m2-fluxo-proof.mjs  (via `npm run m2fluxo`)
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };
const f = (page) => page.evaluate(() => window.__ashfall.fase());

const { page, erros, fechar } = await abrirJogo({ chromium });

// ══ 1. o anúncio de onda espera a caixa do Hospital fechar ══
console.log('── 1. Hospital: o anúncio de onda sob a caixa ──');
await irParaFase(page, 3); // Hospital de Campanha

// esvazia a onda 1 de verdade: cota preenchida + campo vazio (o contrato
// do waveComplete — matar sem deixar a cota nascer não avança onda)
let s = await f(page);
let guard = 0;
while (s.estado === 'playing' && !(await page.evaluate(() => window.__ashfall.dialogo())) && guard++ < 120) {
  await page.evaluate(() => window.__ashfall.matarTodos());
  await page.waitForTimeout(350);
  s = await f(page);
}
const caixaAberta = await page.evaluate(() => window.__ashfall.dialogo());
if (!caixaAberta) {
  nota('a caixa do doutor não abriu (a onda 1 não fechou no tempo da prova)');
} else {
  const pendente = await page.evaluate(() => window.__ashfall.ondaPendente());
  console.log(`  caixa aberta, anúncio pendente: ${pendente}`);
  if (!pendente) nota('a caixa abriu sem armar o anúncio pendente — o som tocou debaixo do mundo congelado');

  // atravessa a caixa: o anúncio toca no fechamento
  for (let i = 0; i < 40; i++) {
    const fechou = !(await page.evaluate(() => window.__ashfall.dialogo()));
    if (fechou) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
  }
  const pendentePos = await page.evaluate(() => window.__ashfall.ondaPendente());
  console.log(`  caixa fechada, anúncio consumido: ${!pendentePos}`);
  if (pendentePos) nota('o anúncio ficou pendente mesmo com a caixa fechada (nunca toca)');
}

// ══ 2. o martelo forçado no NÚCLEO ══
console.log('── 2. NÚCLEO: o Destruidor na mão e as teclas caladas ──');
// O martelo vem no leaveShop da loja do Espaço — o caminho do jogador. O
// atalho `irParaFase(15)` pula o leaveShop e a prova não exercitaria nada.
await irParaFase(page, 14); // Espaço: a fase cuja loja abre o NÚCLEO
await page.evaluate(() => {
  window.__ashfall.cumprirObjetivo();
  window.__ashfall.matarTodos();
  window.__ashfall.pularParaUltimaOnda();
  window.__ashfall.invocarChefe();
});
await page.waitForTimeout(400);
await page.evaluate(() => window.__ashfall.matarChefe());
let estadoLoja = null;
for (let i = 0; i < 24; i++) {
  await page.waitForTimeout(400);
  estadoLoja = (await page.evaluate(() => window.__ashfall.fase().estado));
  if (estadoLoja === 'shop') break;
}
if (estadoLoja !== 'shop') {
  nota(`o Espaço não chegou na loja (estado: ${estadoLoja})`);
} else {
  await page.keyboard.press('Enter'); // leaveShop → abertura do NÚCLEO
  await page.waitForTimeout(900);
  // a abertura da fase final atravessa com ENTER
  for (let i = 0; i < 200; i++) {
    const cena = await page.evaluate(() => window.__ashfall.cena());
    if (!cena.ativa) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(800);
  const arma = await page.evaluate(() => window.__ashfall.armaAtual());
  console.log(`  arma na entrada do NÚCLEO: ${arma}`);
  if (arma !== 'Destruidor') nota(`o martelo não veio forçado (arma: ${arma})`);

  await page.keyboard.press('2'); // tecla de troca
  await page.waitForTimeout(300);
  const armaPosTecla = await page.evaluate(() => window.__ashfall.armaAtual());
  console.log(`  arma depois da tecla 2: ${armaPosTecla}`);
  if (armaPosTecla !== 'Destruidor') nota(`a tecla 2 trocou a arma do NÚCLEO (agora: ${armaPosTecla})`);
}

// ══ 3. o fim da campanha: a tela de vitória ══
console.log('── 3. O fim: MUITO BEM, SOLDADO! ──');
// esvazia o desfile: mata os 4 chefes do rush pelo caminho natural
const FILA = ['infernoPrime', 'reiMutante', 'mothership', 'nucleo'];
const vistos = [];
let fechouFase = false;
const t0 = Date.now();
while (Date.now() - t0 < 45000) {
  s = await f(page);
  if (s.estado === 'shop') { fechouFase = true; break; }
  if (s.estado === 'gameover') break;
  if (s.chefeVivo) {
    const tipo = s.tipos.find(t => FILA.includes(t));
    if (tipo && vistos[vistos.length - 1] !== tipo) {
      vistos.push(tipo);
      await page.evaluate(() => window.__ashfall.matarChefe());
      await page.waitForTimeout(700);
    }
  } else {
    await page.evaluate(() => window.__ashfall.matarTodos());
    await page.waitForTimeout(400);
  }
  await page.evaluate(() => window.__ashfall.curar());
}
console.log(`  rush visto: ${vistos.join(' → ')} (estado: ${s.estado})`);
if (!fechouFase && s.estado !== 'gameover') nota(`o desfile não terminou (estado: ${s.estado})`);

if (s.estado === 'shop') {
  await page.keyboard.press('Enter'); // leaveShop → epílogo
  await page.waitForTimeout(900);
  for (let i = 0; i < 260; i++) {
    const cena = await page.evaluate(() => window.__ashfall.cena());
    if (!cena.ativa) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
}
const fim = await f(page);
const tela = await page.evaluate(() => window.__ashfall.telaDeFim());
console.log(`  estado final: ${fim.estado} · tela desenhada: ${tela}`);
if (fim.estado === 'gameover' && tela !== 'vitoria') {
  nota(`o fim da campanha vencida desenhou "${tela}" — era para ser "vitoria"`);
}

if (erros.length) nota(`erros de página: ${[...new Set(erros)].join('; ')}`);

console.log(problemas.length === 0
  ? '\nOK — M2: anúncio diferido, martelo forçado e a vitória de "Muito bem, soldado!"'
  : `\nFALHA — ${problemas.length} problema(s)`);
await fechar();
process.exit(problemas.length === 0 ? 0 : 1);
