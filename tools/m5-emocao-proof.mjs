/**
 * A prova da EMOÇÃO (M5, relato 2026-10-14): o grito de entrada do
 * MAQUINISTA ("YOU SHALL NOT PASS!"), a morte de chefe com câmera lenta e
 * fala, e o traje que vira conquista ao ser vestido.
 *
 * Contratos testemunháveis:
 *   1. o Maquinista invocado GRITA na barra de boss (o texto do grito, com
 *      timer contando), e o grito EXPIRA;
 *   2. morto o chefe, a FALA DE MORTE dele chega ao toast ("O último trem
 *      partiu.");
 *   3. vestir o traje do NÚCLEO destrava "Traje de Contenção".
 *
 * Uso: node tools/m5-emocao-proof.mjs  (via `npm run m5`)
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };

const { page, erros, fechar } = await abrirJogo({ chromium });

// o Chrome headless não entrega quadros parado — ver arvore-onda-proof
await page.evaluate(() => {
  window.__quadros = 0;
  const step = () => { window.__quadros++; requestAnimationFrame(step); };
  requestAnimationFrame(step);
});

// ── 1. o grito do MAQUINISTA ──
console.log('── 1. o MAQUINISTA chega gritando ──');
await irParaFase(page, 6); // Pátio de Trens
await page.evaluate(() => window.__ashfall.invocarChefe());
await page.waitForTimeout(400);
const grito = await page.evaluate(() => window.__ashfall.bossGrito());
console.log(`  grito: "${grito.texto}" (${grito.timer}s)`);
if (grito.texto !== 'YOU SHALL NOT PASS!') nota(`o grito não veio (texto: "${grito.texto}")`);
if (grito.timer <= 0) nota('o grito já expirou antes de qualquer um ver');

await page.screenshot({ path: 'tools/shots/m5-grito-maquinista.png' });

// o grito expira sozinho
await page.waitForTimeout(3200);
const gritoVelho = await page.evaluate(() => window.__ashfall.bossGrito());
console.log(`  depois de 3s: "${gritoVelho.texto}" (${gritoVelho.timer}s)`);
if (gritoVelho.timer > 0) nota('o grito não expira (fica para sempre na barra)');

// ── 2. a fala de morte + slow-mo ──
console.log('── 2. a morte do chefe com a última fala ──');
await page.evaluate(() => window.__ashfall.matarChefe());
await page.waitForTimeout(400);
const pilha = await page.evaluate(() => window.__ashfall.toasts());
console.log(`  pilha de toasts na morte: ${JSON.stringify(pilha)}`);
if (!pilha.some(t => t.includes('trem'))) nota(`a fala de morte não chegou à pilha: ${JSON.stringify(pilha)}`);

// ── 3. o traje vira conquista ──
console.log('── 3. o traje do NÚCLEO ──');
await irParaFase(page, 14); // Espaço: a loja abre o NÚCLEO
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
  estado = await page.evaluate(() => window.__ashfall.fase().estado);
  if (estado === 'shop') break;
}
if (estado !== 'shop') {
  nota(`o Espaço não chegou na loja (estado: ${estado})`);
} else {
  await page.keyboard.press('Enter'); // leaveShop → o traje espera na entrada
  await page.waitForTimeout(900);
  for (let i = 0; i < 200; i++) {
    const cena = await page.evaluate(() => window.__ashfall.cena());
    if (!cena.ativa) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  // o traje nasce a 60px à direita: anda até ele e veste
  await page.keyboard.down('d');
  await page.waitForTimeout(1400);
  await page.keyboard.up('d');
  await page.waitForTimeout(400);
  const temTraje = await page.evaluate(() => window.__ashfall.temConquista('traje'));
  console.log(`  conquista "Traje de Contenção": ${temTraje}`);
  if (!temTraje) nota('vestir o traje não destravou a conquista');
}

if (erros.length) nota(`erros de página: ${[...new Set(erros)].join('; ')}`);

console.log(problemas.length === 0
  ? '\nOK — M5: o grito entra e expira, a morte fala, e o traje é conquista'
  : `\nFALHA — ${problemas.length} problema(s)`);
await fechar();
process.exit(problemas.length === 0 ? 0 : 1);
