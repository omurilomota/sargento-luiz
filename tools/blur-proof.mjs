/**
 * "Input morto no blur da aba" — M2, relato do Murilo (2026-10-14):
 * depois de alt-tab (ou clique fora) durante o combate, o input parava de
 * responder. O blur já deveria pausar e limpar as teclas (fix de
 * 2026-10-13); este harness REPRODUZ o caminho do jogador antes de mexer:
 *
 *   1. anda para a direita (baseline: input vivo);
 *   2. segura D e o jogo perde o foco (blur com a tecla presa — o keyup
 *      nunca chega, que é o cenário real do alt-tab);
 *   3. volta o foco, sai da pausa com ESC;
 *   4. tenta andar de novo — se não anda, o input morreu no blur.
 *
 * Uso: node tools/blur-proof.mjs  (via `npm run blur`)
 */
import { chromium } from 'playwright';
import { abrirJogo } from './bot.mjs';

const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };

const { page, erros, fechar } = await abrirJogo({ chromium });

async function estado() {
  return page.evaluate(() => window.__ashfall.fase().estado);
}
async function pos() {
  return page.evaluate(() => window.__ashfall.playerPos());
}

async function andarDireita(segundos) {
  const antes = await pos();
  await page.keyboard.down('d');
  await page.waitForTimeout(segundos * 1000);
  await page.keyboard.up('d');
  const depois = await pos();
  return depois.x - antes.x;
}

// ── 1. baseline: o input está vivo ──
const dx1 = await andarDireita(0.8);
console.log(`  baseline: andou ${Math.round(dx1)}px com D`);
if (dx1 < 20) nota(`baseline morto: ${Math.round(dx1)}px — sem blur, sem desculpa`);

// ── 2. blur COM tecla presa (alt-tab segurando D) ──
await page.keyboard.down('d');
await page.evaluate(() => window.dispatchEvent(new Event('blur')));
await page.keyboard.up('d'); // keyup que o jogo NÃO vê (aba perdeu o foco)
const posBlur = await pos();

const stBlur = await estado();
console.log(`  pós-blur: estado "${stBlur}", jogador em ${Math.round(posBlur.x)}`);
if (stBlur !== 'paused') nota(`o blur não pausou o combate (estado: ${stBlur})`);

// ── 3. volta o foco e sai da pausa com ESC ──
await page.mouse.click(640, 360);
await page.waitForTimeout(200);
const stVolta = await estado();
if (stVolta === 'paused') {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}
const stDepoisEsc = await estado();
console.log(`  pós-ESC: estado "${stDepoisEsc}"`);
if (stDepoisEsc !== 'playing') nota(`ESC não devolveu o jogo (estado: ${stDepoisEsc})`);

// ── 4. o input sobreviveu? ──
const dx2 = await andarDireita(0.8);
console.log(`  pós-blur: andou ${Math.round(dx2)}px com D`);
if (Math.abs(dx2) < 20) nota(`input morto após blur+ESC: ${Math.round(dx2)}px de deslocamento`);

// ── variante: blur sem tecla nenhuma, direto no playing ──
await page.evaluate(() => window.dispatchEvent(new Event('blur')));
await page.waitForTimeout(100);
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
const dx3 = await andarDireita(0.8);
console.log(`  variante simples: andou ${Math.round(dx3)}px com D`);
if (Math.abs(dx3) < 20) nota(`input morto no blur simples: ${Math.round(dx3)}px`);

if (erros.length) nota(`erros de página: ${[...new Set(erros)].join('; ')}`);

console.log(problemas.length === 0
  ? '\nOK — o input sobrevive ao blur (não reproduz; se o relato persistir, é do foco do navegador, não do jogo)'
  : `\nFALHA — ${problemas.length} problema(s)`);
await fechar();
process.exit(problemas.length === 0 ? 0 : 1);
