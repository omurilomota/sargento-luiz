/**
 * Prova do caçador do alvo: as ondas do protect CHEGAM ao foguete.
 *
 * Medido em 2026-10-13 (sonda isolada, pre-fix): o seek direto contra a
 * câmara do meio deslizava na parede — 2 de 3 amostras terminaram com o
 * foguete intacto 41s a fio e inimigos vivos. A ameaça da fase era loteria
 * de spawn: quando um nascia do lado certo, derrubava o alvo em ~28s; os
 * outros travavam do lado de fora.
 *
 * O contrato: em CADA amostra, algum caçador chega (o HP do foguete sai de
 * 300) dentro da janela. O jogador é afastado da porta da coluna 14 antes
 * da medição — ele não defende nada, e parado no caminho do funil vira
 * dano de passagem que não é objeto desta prova.
 *
 * Uso: node tools/cacador-proof.mjs [amostras]
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const AMOSTRAS = Number(process.argv[2] ?? 3);
const SEG = 35;
const falhas = [];
const ok = (cond, msg) => {
  console.log(`${cond ? 'ok: ' : 'FALHA: '}${msg}`);
  if (!cond) falhas.push(msg);
};

for (let a = 1; a <= AMOSTRAS; a++) {
  const { page, erros, fechar } = await abrirJogo({ chromium });
  await irParaFase(page, 10);
  // afasta o jogador do funil da porta: 1,2s de D ≈ 6 células a leste
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1200);
  await page.keyboard.up('KeyD');

  let hp = 300;
  let t = 0;
  for (t = 0; t < SEG; t += 2) {
    await page.waitForTimeout(2000);
    // O encontro do Júlio abre na onda 1 e congela o campo: sem atravessar,
    // o caçador não anda e o foguete chega aos 35s sem um arranhão.
    const caixaAberta = await page.evaluate(() => window.__ashfall.dialogo?.() ?? false);
    if (caixaAberta) {
      for (let k = 0; k < 12; k++) {
        const aberta = await page.evaluate(() => window.__ashfall.dialogo?.() ?? false);
        if (!aberta) break;
        await page.keyboard.press('Enter');
        await page.waitForTimeout(250);
      }
    }
    const s = await page.evaluate(() => window.__ashfall.fase());
    if (s.estado !== 'playing') break;
    hp = Number(s.objetivoAtual.detail.split('/')[0]);
    if (hp < 300) break;
  }
  ok(hp < 300, `amostra ${a}: o caçador chegou (HP ${hp}/300 aos ${t}s)`);
  await fechar();
}

console.log(`\n${falhas.length === 0 ? `PROVA VERDE — ${AMOSTRAS}/${AMOSTRAS} caçadores chegaram` : `${falhas.length} falha(s)`}`);
process.exit(falhas.length === 0 ? 0 : 1);
