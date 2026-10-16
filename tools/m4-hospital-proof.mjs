/**
 * A prova do HOSPITAL com identidade (F-C-resto): ladrilho autoral no chão
 * (manchas de uso, rejunte 32px) e azulejo com rodapé na parede — antes era
 * `piso_vidro`/`parede_concreto`, "não tem chão de hospital" do playtest.
 *
 * Contrato mensurável: o piso do hospital lê CLARO (o tint do bioma é
 * #d8e4e4 — o único piso claro do jogo) e tem TEXTURA (variância de
 * luminância no trecho — rejunte e manchas; mancha chapada seria o tile
 * flat). O PNG final é a prova de olho da regra 16: a métrica é filtro,
 * o olho decide.
 *
 * Uso: node tools/m4-hospital-proof.mjs  (via `npm run hospital`)
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };
const { page, erros, fechar } = await abrirJogo({ chromium });

await page.evaluate(() => {
  window.__quadros = 0;
  const step = () => { window.__quadros++; requestAnimationFrame(step); };
  requestAnimationFrame(step);
});

// fase 3 = Hospital de Campanha (Cidade, Rodovia, Floresta, Hospital — a
// ordem é a do array em config.ts, contada no arquivo, não no resumo)
await irParaFase(page, 3);
await page.waitForTimeout(9000); // inimigos chegam: o tint também aparece no shot

// o piso se lê NO ANEL ao redor do jogador (o corpo está EM cima de piso —
// o jogador não anda em parede). Oito pontos num círculo de raio 56, MEDIANA
// da luminância: o mediano mata canto de parede que caia no anel. Com a
// parede branca do hospital (~125) mais clara que o piso (~90, regra do
// projeto: massa clara = obstáculo), o patch mais claro da tela é PAREDE —
// por isso a leitura do piso é no anel, não no máximo global.
const leitura = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const cam = window.__ashfall.camera();
  const p = window.__ashfall.player();
  const cx = Math.round(p.x - cam.x), cy = Math.round(p.y - cam.y);
  const amostras = [];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const x = Math.round(cx + Math.cos(a) * 56), y = Math.round(cy + Math.sin(a) * 56);
    if (x < 6 || y < 6 || x + 6 > canvas.width || y + 6 > canvas.height) continue;
    const d = ctx.getImageData(x - 5, y - 5, 10, 10).data;
    const lum = [];
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 255) lum.push(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
    }
    if (lum.length < 30) continue;
    const media = lum.reduce((s, v) => s + v, 0) / lum.length;
    const desvio = Math.sqrt(lum.reduce((s, v) => s + (v - media) ** 2, 0) / lum.length);
    amostras.push({ media, desvio });
  }
  amostras.sort((a, b) => a.media - b.media);
  const mediana = amostras[Math.floor(amostras.length / 2)];
  // o desvio da TEXTURA é o maior do anel: o rejunte vem a cada 32px, e um
  // patch 10×10 no meio do ladrilho não cruza linha nenhuma — o anel inteiro
  // tem sempre algum patch em cima da junta
  const piorDesvio = Math.max(...amostras.map((s) => s.desvio));
  return { ...mediana, desvioMax: piorDesvio, n: amostras.length };
});

console.log(`  piso: luminância mediana ${leitura.media.toFixed(0)} · desvio máximo ${leitura.desvioMax.toFixed(1)} (${leitura.n} amostras no anel)`);
if (leitura.media < 70) nota(`o piso sob o jogador lê ${leitura.media.toFixed(0)} — ladrilho claro ausente (lavada escura ou tile fora)`);
if (leitura.desvioMax < 2) nota('piso chapado (desvio < 2 em todo o anel) — rejunte e manchas não aparecem');

await page.screenshot({ path: 'tools/shots/hospital-identidade.png' });

if (erros.length) nota(`erros de página: ${[...new Set(erros)].join('; ')}`);
console.log(problemas.length === 0
  ? '\nOK — o hospital tem chão de hospital (ladrilho claro medido em pixel)'
  : `\nFALHA — ${problemas.length} problema(s)`);
await fechar();
process.exit(problemas.length === 0 ? 0 : 1);
