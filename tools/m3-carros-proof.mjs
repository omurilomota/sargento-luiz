/**
 * A prova das CARCAÇAS (J3b): o carro abandonado existe em jogo — na
 * Rodovia (fila nas faixas) e na Cidade (ruas). Contratos:
 *
 *   1. o mapa tem carros (o char 'A' virou prop bloqueador — o BFS do
 *      mapValidation já travou conectividade; aqui é o RENDER);
 *   2. o pixel do carro difere do asfalto embaixo (o sprite carregou);
 *   3. a câmera anda até um carro e fotografa (a leitura de pixel é para
 *      o cofre; o PNG é para o olho do Murilo).
 *
 * Uso: node tools/m3-carros-proof.mjs  (via `npm run carros`)
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };
const { page, erros, fechar } = await abrirJogo({ chromium });

// ── Rodovia: carro na faixa ──
await irParaFase(page, 1);
await page.waitForTimeout(1000);
const amostra = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const cam = window.__ashfall.camera();
  const ler = (col, row) => {
    const x = Math.round(col * 64 + 32 - cam.x);
    const y = Math.round(row * 64 + 32 - cam.y);
    const d = ctx.getImageData(x, y, 1, 1).data;
    return d[0] * 0.3 + d[1] * 0.59 + d[2] * 0.11;
  };
  return { carro: ler(7, 7), asfalto: ler(12, 9), faixa: ler(7, 8) };
});
console.log(`  rodovia — luminância: carro ${amostra.carro.toFixed(0)} · asfalto ${amostra.asfalto.toFixed(0)} · faixa ${amostra.faixa.toFixed(0)}`);
if (Math.abs(amostra.carro - amostra.asfalto) < 10) nota(`o carro não lê sobre o asfalto (${amostra.carro.toFixed(0)} vs ${amostra.asfalto.toFixed(0)})`);
// A1 (playtest: "os carros somem com um tiro?"): balas DIRETO na
// carcaça — o colisor absorve, a bala morre, o carro fica de pé
const antesDoTiro = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const cam = window.__ashfall.camera();
  const d = ctx.getImageData(Math.round(7 * 64 + 32 - cam.x), Math.round(7 * 64 + 32 - cam.y), 1, 1).data;
  return d[0] * 0.3 + d[1] * 0.59 + d[2] * 0.11;
});
for (let i = 0; i < 12; i++) {
  await page.evaluate(() => {
    const cam = window.__ashfall.camera();
    const cx = 7 * 64 + 32, cy = 7 * 64 + 32;
    const ang = Math.atan2(cy - cam.y - 360, cx - cam.x - 640);
    window.__ashfall.spawnBullet(640 + cam.x - 0, 360 + cam.y - 0, Math.cos(ang) * 700, Math.sin(ang) * 700, 50, false, '#fff', false);
  });
  await page.waitForTimeout(120);
}
await page.waitForTimeout(600);
const depoisDoTiro = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const cam = window.__ashfall.camera();
  const d = ctx.getImageData(Math.round(7 * 64 + 32 - cam.x), Math.round(7 * 64 + 32 - cam.y), 1, 1).data;
  return d[0] * 0.3 + d[1] * 0.59 + d[2] * 0.11;
});
console.log(`  bala no carro: pixel ${antesDoTiro.toFixed(0)} -> ${depoisDoTiro.toFixed(0)}`);
if (Math.abs(depoisDoTiro - antesDoTiro) > 25) nota('o carro sumiu com o tiro (o pixel virou piso)');
await page.screenshot({ path: 'tools/shots/carros-rodovia.png' });

// ── Cidade: carcaça na rua ──
await irParaFase(page, 0);
await page.waitForTimeout(900);
const cidade = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const cam = window.__ashfall.camera();
  const ler = (col, row) => {
    const x = Math.round(col * 64 + 32 - cam.x);
    const y = Math.round(row * 64 + 32 - cam.y);
    const d = ctx.getImageData(x, y, 1, 1).data;
    return d[0] * 0.3 + d[1] * 0.59 + d[2] * 0.11;
  };
  // o carro (7,8) está fora do enquadramento do spawn: amostra o (13,10),
  // que a câmera pega (a regra 16 da armadilha do enquadramento)
  return { carro: ler(10, 13), rua: ler(13, 13) };
});
console.log(`  cidade — luminância: carro ${cidade.carro.toFixed(0)} · rua ${cidade.rua.toFixed(0)}`);
if (Math.abs(cidade.carro - cidade.rua) < 10) nota(`o carro da cidade não lê sobre a rua (${cidade.carro.toFixed(0)} vs ${cidade.rua.toFixed(0)})`);
await page.screenshot({ path: 'tools/shots/carros-cidade.png' });

if (erros.length) nota(`erros de página: ${[...new Set(erros)].join('; ')}`);
console.log(problemas.length === 0
  ? '\nOK — as carcaças renderizam na Rodovia e na Cidade (pixel medido)'
  : `\nFALHA — ${problemas.length} problema(s)`);
await fechar();
process.exit(problemas.length === 0 ? 0 : 1);
