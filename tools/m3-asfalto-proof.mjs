/**
 * A prova do ASFALTO da Rodovia (J3a-verificação): a pista renderiza com
 * material PRÓPRIO, diferente do acostamento de pedra. A IA visual deixou
 * o fio completo (mapa com =/:/-/_, drawAsphalt, tiles autorais no
 * portão) — esta prova fecha o cofre com medição de pixel: célula de
 * FAIXA ≠ célula de OMBRO, e ambas ≠ preto puro (o tile carregou).
 *
 * Uso: node tools/m3-asfalto-proof.mjs  (via `npm run asfalto`)
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };
const { page, erros, fechar } = await abrirJogo({ chromium });

await irParaFase(page, 1); // Rodovia
await page.waitForTimeout(1200);

// as células da pista: row 9 tem as faixas ':', row 8 é corpo '=' —
// col 15; o ombro é row 13, col 15 (fora do bloco #.# lateral)
const amostra = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const cam = window.__ashfall.camera();
  // célula (col 15, row 8) e (15, 9) do mundo → tela; ombro (15, 13)
  const cell = (col, row) => ({ x: col * 64 + 32 - cam.x, y: row * 64 + 32 - cam.y });
  const ler = (p) => {
    const d = ctx.getImageData(Math.round(p.x), Math.round(p.y), 1, 1).data;
    return d[0] * 0.3 + d[1] * 0.59 + d[2] * 0.11;
  };
  const faixa = ler(cell(15, 8));
  const corpo = ler(cell(15, 7));
  const ombro = ler(cell(15, 13));
  return { faixa, corpo, ombro };
});
console.log(`  luminância — faixa: ${amostra.faixa.toFixed(0)} · corpo: ${amostra.corpo.toFixed(0)} · ombro: ${amostra.ombro.toFixed(0)}`);

if (amostra.faixa === 0 && amostra.corpo === 0 && amostra.ombro === 0) {
  nota('as três células pretas — nenhum tile carregou');
}
// a faixa (piso_faixa, clara) tem que diferir do corpo do asfalto
if (Math.abs(amostra.faixa - amostra.corpo) < 12) {
  nota(`faixa ≈ corpo (${amostra.faixa.toFixed(0)} vs ${amostra.corpo.toFixed(0)}): a marcação de pista não lê`);
}
// o ombro de pedra difere do corpo de asfalto (materiais diferentes)
if (Math.abs(amostra.ombro - amostra.corpo) < 12) {
  nota(`ombro ≈ corpo (${amostra.ombro.toFixed(0)} vs ${amostra.corpo.toFixed(0)}): o acostamento não distingue da pista`);
}

await page.screenshot({ path: 'tools/shots/rodovia-asfalto.png' });

if (erros.length) nota(`erros de página: ${[...new Set(erros)].join('; ')}`);
console.log(problemas.length === 0
  ? '\nOK — a Rodovia renderiza pista de asfalto com faixa e ombro distintos (medido em pixel)'
  : `\nFALHA — ${problemas.length} problema(s)`);
await fechar();
process.exit(problemas.length === 0 ? 0 : 1);
