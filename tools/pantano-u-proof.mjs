/**
 * O "U" DO PÂNTANO — prova do conserto (regra 16).
 *
 * O relato do playtest era "o mapa tem um bolsão que lê como letra". A
 * varredura célula-a-célula achou ZERO ∪ em parede: o "marronzinho" eram as
 * 6 faixas de LAMA (`^`) — duas pernas afastadas nas linhas 5 e 13, fechadas
 * pela faixa centrada da linha 17. Conserto (variante V1, escolha do Murilo):
 * a faixa da linha 17 andou de cols 12-18 para cols 6-12, no GERADOR
 * (`genmaps.py`), e o bloco foi revalidado (largura 30, borda fechada, BFS de
 * P até todo E/B/N).
 *
 * Esta prova fecha o que a varredura de grade não pode fechar: que o JOGO está
 * servindo a lagoa no lugar novo. A foto é tirada com a câmera lida no MESMO
 * instante (`__ashfall.camera()`), e o retângulo da lagoa nova (verde) e o da
 * antiga (vermelho) são desenhados por cima — a mancha de lama tem de cair
 * dentro do verde e fora do vermelho.
 *
 * Uso: node tools/pantano-u-proof.mjs
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase, SHOTS } from './bot.mjs';
import { join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

const FASE_PANTANO = 8;
mkdirSync(SHOTS, { recursive: true });

// retângulos em MUNDO (célula = 64px): lagoa nova (linha 17, cols 6-12) e a
// antiga (linha 17, cols 12-18)
const NOVA = { x0: 6 * 64, y0: 17 * 64, x1: 13 * 64, y1: 18 * 64 };
const ANTIGA = { x0: 12 * 64, y0: 17 * 64, x1: 19 * 64, y1: 18 * 64 };

const jogo = await abrirJogo({ chromium });
const { page, erros, fechar } = jogo;

const cfg = await irParaFase(page, FASE_PANTANO);
console.log(`fase ${FASE_PANTANO + 1}: ${cfg.fase}`);

await page.waitForTimeout(1200);

// o spawn é (15,18) ≈ (992,1184); a lagoa nova fica a oeste. Anda pra fora
// da lama antes de medir, pra a velocidade de caminhada ser a normal.
await page.keyboard.down('KeyA');
await page.waitForTimeout(1400);
await page.keyboard.up('KeyA');
await page.waitForTimeout(400);

// a posição e a câmera NO MESMO instante da foto — sem isto a conta do
// enquadramento vira palpite (o erro que o AGENTS.md já cobrou uma vez)
const estado = await page.evaluate(() => ({
  player: window.__ashfall.player(),
  camera: window.__ashfall.camera(),
}));
console.log('player:', JSON.stringify(estado.player), 'camera:', JSON.stringify(estado.camera));

const shot = join(SHOTS, 'pantano-conserto.png');
await page.screenshot({ path: shot });
writeFileSync(join(SHOTS, 'pantano-conserto.estado.json'),
  JSON.stringify({ NOVA, ANTIGA, ...estado }, null, 2));

console.log('foto:', shot);
if (erros.length) console.log('erros de página:', erros.slice(0, 5));

await fechar();
