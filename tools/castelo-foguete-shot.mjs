// one-shot H-4: o foguete do protect renderizado no Castelo.
// A câmera segue o JOGADOR, que nasce 8 células abaixo do foguete — o
// enquadramento parado no spawn cortava o bico fora da tela e o dono não
// conseguia ver o sprite inteiro. O harness anda o jogador até o pátio do
// foguete (W ~1,2s a 320px/s, corredor da coluna 14) antes das duas fotos.
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const SHOTS = join(dirname(fileURLToPath(import.meta.url)), 'shots');
const { page, fechar } = await abrirJogo({ chromium });
await irParaFase(page, 10);
await page.keyboard.down('KeyW');
await page.waitForTimeout(1200);
await page.keyboard.up('KeyW');
await page.waitForTimeout(600); // a câmera termina o lerp
await page.screenshot({ path: join(SHOTS, 'foguete-castelo-t1.png') });
// deixa a onda chegar no foguete: os inimigos do protect caçam ELE
await page.waitForTimeout(7000);
await page.screenshot({ path: join(SHOTS, 'foguete-castelo-t8.png') });
const hud = await page.evaluate(() => window.__ashfall?.fase?.() ?? null);
console.log('hud:', JSON.stringify(hud));
await fechar();
console.log('shots ok');
