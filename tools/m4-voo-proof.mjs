/**
 * A prova do VOO (M4): o respiro do Castelo é a sequência de decolagem —
 * o relato de 2026-10-14 pediu "sequência de voo no lugar do countdown de
 * 5s (céu azul, vista de baixo, azul e preto, chegada na estação)".
 *
 * O contrato testemunhável: morto o rei mutante com o foguete de pé, o
 * relógio do voo ARMA junto do respiro, conta os 5 segundos e devolve o
 * jogo para a loja. O ASPECTO do céu (bandas, foguete subindo) é pixel —
 * shot para leitura do Murilo (regra 16), o relógio é o que se prova aqui.
 *
 * Uso: node tools/m4-voo-proof.mjs  (via `npm run voo`)
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };

const { page, erros, fechar } = await abrirJogo({ chromium });

// O Chrome headless não entrega quadros para página parada (o achado do
// arvore-onda-proof): sem este laço, o jogo congela e o relógio do voo
// NUNCA conta — a primeira versão desta prova passou sem ter provado nada.
await page.evaluate(() => {
  window.__quadros = 0;
  const step = () => { window.__quadros++; requestAnimationFrame(step); };
  requestAnimationFrame(step);
});

await irParaFase(page, 13); // M4: o Castelo agora é a fase 14 (índice 13)

// fecha o protect pelo caminho curto: objetivo + última onda + chefe
await page.evaluate(() => {
  window.__ashfall.cumprirObjetivo();
  window.__ashfall.matarTodos();
  window.__ashfall.pularParaUltimaOnda();
  window.__ashfall.invocarChefe();
});
await page.waitForTimeout(400);
await page.evaluate(() => window.__ashfall.matarChefe());

// O pós-missão do Castelo abre a CAIXA (o conserto e o lançamento, com os
// sons H5): o mundo congela por linha e o relógio do voo só conta DEPOIS
// que ela fecha — no jogo e na prova. Atravessa antes de amostrar.
for (let i = 0; i < 60; i++) {
  const aberta = await page.evaluate(() => window.__ashfall.dialogo());
  if (!aberta) break;
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
}

// o respiro abre: o voo arma junto
let voo = 0;
for (let i = 0; i < 30 && voo === 0; i++) {
  await page.waitForTimeout(200);
  voo = await page.evaluate(() => window.__ashfall.voo());
}
console.log(`  voo armado: ${voo.toFixed(1)}s restantes`);
if (voo <= 0) nota('o voo não armou no respiro do Castelo');

await page.screenshot({ path: 'tools/shots/voo-inicio.png' });

// conta os 5 segundos e devolve para a loja
let estado = '';
let chegouNaLoja = false;
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(300);
  voo = await page.evaluate(() => window.__ashfall.voo());
  estado = await page.evaluate(() => window.__ashfall.fase().estado);
  if (estado === 'shop') { chegouNaLoja = true; break; }
}
console.log(`  fim do voo: relógio ${voo.toFixed(1)}s, estado "${estado}"`);
await page.screenshot({ path: 'tools/shots/voo-fim.png' });
if (!chegouNaLoja) nota(`o voo não entregou a loja (relógio ${voo.toFixed(1)}s, estado ${estado})`);
if (voo > 0 && chegouNaLoja) nota(`chegou na loja com o relógio do voo em ${voo.toFixed(1)}s (não contou até o fim)`);

// o respiro de OUTRA fase não é voo — a decolagem é do Castelo apenas
await page.keyboard.press('Enter');
await page.waitForTimeout(600);
await irParaFase(page, 0); // Cidade
await page.evaluate(() => {
  window.__ashfall.cumprirObjetivo();
  window.__ashfall.matarTodos();
  window.__ashfall.pularParaUltimaOnda();
  window.__ashfall.invocarChefe();
});
await page.waitForTimeout(400);
await page.evaluate(() => window.__ashfall.matarChefe());
let vooCidade = 0;
for (let i = 0; i < 25; i++) {
  await page.waitForTimeout(200);
  vooCidade = await page.evaluate(() => window.__ashfall.voo());
  if (vooCidade > 0) break;
}
console.log(`  voo na Cidade (tem que ser 0): ${vooCidade}`);
if (vooCidade > 0) nota('o voo armou numa fase que não é o Castelo');

if (erros.length) nota(`erros de página: ${[...new Set(erros)].join('; ')}`);

console.log(problemas.length === 0
  ? '\nOK — o respiro do Castelo é o voo: arma, conta 5s e entrega a loja; fora do Castelo, respiro normal'
  : `\nFALHA — ${problemas.length} problema(s)`);
await fechar();
process.exit(problemas.length === 0 ? 0 : 1);
