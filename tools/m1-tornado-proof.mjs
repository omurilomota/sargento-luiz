/**
 * A prova do TORNADO (M1): o showpiece da Cidade — "visual + som +
 * empurrão em jogador e zumbi" (relato 2026-10-14). O PRÓLOGO já fecha o
 * céu "do lado do mar"; esta é a promessa cumprida em jogo.
 *
 * Contratos testemunháveis:
 *   1. forçado na Cidade, o tornado empurra O JOGADOR (deslocamento real
 *      medido pelo playerPos) e termina sozinho (~6,5s);
 *   2. na fase errada (Espaço, lowGravity) o evento MORRE no primeiro
 *      update — a permissão é do bioma, não do gancho de prova.
 *
 * Uso: node tools/m1-tornado-proof.mjs  (via `npm run tornado`)
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };

const { page, erros, fechar } = await abrirJogo({ chromium });

// o Chrome headless não entrega quadros para página parada (arvore-onda)
await page.evaluate(() => {
  window.__quadros = 0;
  const step = () => { window.__quadros++; requestAnimationFrame(step); };
  requestAnimationFrame(step);
});

// ── 1. a Cidade: o tornado empurra o jogador ──
console.log('── 1. a Cidade: o tornado empurra o jogador ──');
await irParaFase(page, 0);
const posAntes = await page.evaluate(() => window.__ashfall.playerPos());
const forcou = await page.evaluate(([x, y]) => window.__ashfall.forcarEvento('tornado', x, y), [posAntes.x, posAntes.y]);
if (!forcou) nota('o forcarEvento não armou o tornado na Cidade');

await page.waitForTimeout(2500); // metade da vida do evento: empurrão acumulado
const posMeio = await page.evaluate(() => window.__ashfall.playerPos());
const voando = await page.evaluate(() => window.__ashfall.tornadoAtivo());
await page.screenshot({ path: 'tools/shots/tornado-cidade.png' });

const deslocou = Math.hypot(posMeio.x - posAntes.x, posMeio.y - posAntes.y);
console.log(`  jogador: (${Math.round(posAntes.x)},${Math.round(posAntes.y)}) -> (${Math.round(posMeio.x)},${Math.round(posMeio.y)}) = ${Math.round(deslocou)}px de empurrão`);
if (deslocou < 60) nota(`o jogador foi empurrado só ${Math.round(deslocou)}px em 2,5s de tornado em cima dele`);
if (!voando) nota('o tornado terminou antes da metade (duração curta demais)');

// termina sozinho
let ativo = true;
for (let i = 0; i < 40 && ativo; i++) {
  await page.waitForTimeout(400);
  ativo = await page.evaluate(() => window.__ashfall.tornadoAtivo());
}
console.log(`  evento terminou sozinho: ${!ativo}`);
if (ativo) nota('o tornado não terminou (o evento gruda)');

// ── 2. no Espaço, a permissão mata o evento no primeiro update ──
console.log('── 2. no Espaço, o tornado não tem vez ──');
await irParaFase(page, 14); // Espaço (lowGravity): sem tornado por bioma
await page.evaluate(() => {
  const p = window.__ashfall.playerPos();
  window.__ashfall.forcarEvento('tornado', p.x, p.y);
});
await page.waitForTimeout(800);
const ativoNoEspaco = await page.evaluate(() => window.__ashfall.tornadoAtivo());
console.log(`  tornado no Espaço após 0,8s: ${ativoNoEspaco}`);
if (ativoNoEspaco) nota('o tornado sobreviveu no Espaço — a permissão por bioma não vale para o gancho');

if (erros.length) nota(`erros de página: ${[...new Set(erros)].join('; ')}`);

console.log(problemas.length === 0
  ? '\nOK — o tornado empurra o jogador, termina sozinho e só existe na Cidade'
  : `\nFALHA — ${problemas.length} problema(s)`);
await fechar();
process.exit(problemas.length === 0 ? 0 : 1);
