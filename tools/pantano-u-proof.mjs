/**
 * O "U" DO PÂNTANO (F-B, relato do playtest 2026-10-16) — a fase tem um
 * bolsão que lê como letra.
 *
 * A nota do F-B diz que o bolsão "precisa do olho" do jogador pra apontar
 * qual. Este harness produz a IMAGEM que esse olho precisa: abre a fase e
 * fotografa a tela cheia com o MINIMAPA (que mostra o mapa inteiro) e uma
 * sequência de telas andadas, para que o relato possa apontar o bolsão.
 *
 * A análise de grid (u-pantano.mjs) rodou antes e NÃO achou ∪ célula-a-célula:
 * os candidatos são alcovas abertas. A foto decide qual delas é a que lê como
 * letra — não o meu palpite.
 *
 * Uso: node tools/pantano-u-proof.mjs
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase, SHOTS } from './bot.mjs';
import { join } from 'path';
import { mkdirSync } from 'fs';

const FASE_PANTANO = 8;
mkdirSync(SHOTS, { recursive: true });

const jogo = await abrirJogo({ chromium });
const { page, erros, fechar } = jogo;

const cfg = await irParaFase(page, FASE_PANTANO);
console.log(`fase ${FASE_PANTANO + 1}: ${cfg.fase}`);

// 1) a tela inicial da fase (minimapa visível no canto)
await page.waitForTimeout(1500);
const tela = join(SHOTS, 'pantano-tela.png');
await page.screenshot({ path: tela });
console.log('foto:', tela);

// 2) o minimapa em close: o canvas inteiro já o contém; um segundo shot com
//    um deslocamento do jogador mostra que a forma é do MAPA, não do spawn
await page.keyboard.down('KeyD');
await page.waitForTimeout(900);
await page.keyboard.up('KeyD');
const tela2 = join(SHOTS, 'pantano-tela-andado.png');
await page.screenshot({ path: tela2 });
console.log('foto:', tela2);

const pos = await page.evaluate(() => {
  const p = window.__ashfall.player();
  return { x: Math.round(p.x), y: Math.round(p.y), hp: p.hp };
});
console.log('jogador após andar:', JSON.stringify(pos));
if (erros.length) console.log('erros de página:', erros.slice(0, 5));

await fechar();
