/**
 * A prova da QUEDA DA PONTE (M3, relato 2026-10-14: "Ponte com multi-spawn
 * + timer de quebra") — a fala da cutscene vira mecânica testemunhável:
 *
 *   1. a queda ANDA: passados a graça e o passo, as colunas caídas crescem;
 *   2. cumprir o objetivo PAUSA a queda (a extração segura o resto);
 *   3. o terreno re-prerenderiza sem pageerror (o entulho tem tile e o
 *      prerender é a superfície que quebraria em silêncio).
 *
 * Uso: node tools/m3-ponte-proof.mjs  (via `npm run ponte`)
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };
const caidas = (q) => q?.colunasCaídas ?? 0;

const { page, erros, fechar } = await abrirJogo({ chromium });

// o Chrome headless não entrega quadros para página parada (arvore-onda)
await page.evaluate(() => {
  window.__quadros = 0;
  const step = () => { window.__quadros++; requestAnimationFrame(step); };
  requestAnimationFrame(step);
});

console.log('── 1. a queda anda ──');
await irParaFase(page, 7); // Ponte
await page.waitForTimeout(1200);

// graça de 10s + passo: espera o primeiro tombo
let queda = await page.evaluate(() => window.__ashfall.queda());
for (let i = 0; i < 45 && caidas(queda) === 0; i++) {
  await page.waitForTimeout(500);
  queda = await page.evaluate(() => window.__ashfall.queda());
}
console.log(`  após a graça: ${JSON.stringify(queda)}`);
if (caidas(queda) === 0) nota('a queda não deu passo nenhum em 22s (graça 10s + passo 6s)');
await page.screenshot({ path: 'tools/shots/ponte-caindo.png' });

// mais um passo: cresce
const antes = caidas(queda);
let depois = antes;
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(700);
  depois = caidas(await page.evaluate(() => window.__ashfall.queda()));
  if (depois > antes) break;
}
console.log(`  colunas caídas: ${antes} -> ${depois}`);
if (depois <= antes) nota('a queda empacou depois do primeiro passo');

console.log('── 2. cumprir o objetivo PAUSA a queda ──');
await page.evaluate(() => window.__ashfall.cumprirObjetivo());
await page.waitForTimeout(800);
const noObjetivo = caidas(await page.evaluate(() => window.__ashfall.queda()));
await page.waitForTimeout(5000);
const depoisDaPausa = caidas(await page.evaluate(() => window.__ashfall.queda()));
console.log(`  colunas no objetivo: ${noObjetivo} · 5s depois: ${depoisDaPausa}`);
if (depoisDaPausa !== noObjetivo) nota(`a queda não pausou com o objetivo cumprido (${noObjetivo} -> ${depoisDaPausa})`);

if (erros.length) nota(`erros de página: ${[...new Set(erros)].join('; ')}`);

console.log(problemas.length === 0
  ? '\nOK — a ponte cede em passos, o objetivo congela o que sobrou, e o prerender aguenta'
  : `\nFALHA — ${problemas.length} problema(s)`);
await fechar();
process.exit(problemas.length === 0 ? 0 : 1);
