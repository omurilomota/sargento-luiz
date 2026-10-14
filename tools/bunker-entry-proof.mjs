/**
 * A porta do Game Over "ao entrar no Bunker Central" — o relato do Murilo,
 * 2026-10-13 ("Erroneamente deu Game Over novamente quando fui entrar na
 * fase do Bunker Central, patético!"), segunda ocorrência.
 *
 * A causa: o índice de cutscene, DEPOIS de terminar a abertura da fase final,
 * pousa EM CIMA do epílogo — e o main perguntava "era o epílogo?" depois de
 * avançar, respondendo true para a abertura. O jogador que passava a
 * cutscene com ENTER ganhava o fim de campanha.
 *
 * A prova faz o caminho do jogador: chega na loja da fase 8, sai, e
 * atravessa a abertura do NÚCLEO-CENTRAL tecla por tecla. O campanha-proof
 * antigo era cego para isso — pulava as cenas com BACKSPACE.
 *
 * Uso: node tools/bunker-entry-proof.mjs
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const { page, erros, fechar } = await abrirJogo({ chromium });
await irParaFase(page, 7); // Espaço: a fase cuja loja abre a final

// fecha a fase 8 pelo caminho curto: objetivo + chefe + campo limpo
await page.evaluate(() => {
  window.__ashfall.cumprirObjetivo();
  window.__ashfall.matarTodos();
  window.__ashfall.pularParaUltimaOnda();
  window.__ashfall.invocarChefe();
});
await page.waitForTimeout(400);
await page.evaluate(() => window.__ashfall.matarChefe());

// respiro (5s) até a loja abrir
let estado = null;
for (let i = 0; i < 24; i++) {
  await page.waitForTimeout(400);
  estado = (await page.evaluate(() => window.__ashfall.fase().estado));
  if (estado === 'shop') break;
}
if (estado !== 'shop') {
  console.log(`FALHA: a fase 8 não chegou na loja (estado: ${estado})`);
  await fechar();
  process.exit(1);
}

// sai da loja: a abertura do NÚCLEO-CENTRAL tem que abrir
await page.keyboard.press('Enter');
await page.waitForTimeout(900);
let cena = await page.evaluate(() => window.__ashfall.cena());
if (!cena.ativa) {
  console.log(`FALHA: a abertura da fase final nem abriu (estado: ${estado})`);
  await fechar();
  process.exit(1);
}

// atravessa a abertura COM ENTER — o caminho que dava o fim de campanha
for (let i = 0; i < 200; i++) {
  cena = await page.evaluate(() => window.__ashfall.cena());
  if (!cena.ativa) break;
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
}

const s = await page.evaluate(() => window.__ashfall.fase());
const ok = s.estado === 'playing';
console.log(ok
  ? 'OK — a abertura da fase final termina em combate'
  : `FALHA — passar a abertura com ENTER terminou em "${s.estado}" (fim de campanha na entrada)`);
if (erros.length) console.log('erros de página:', [...new Set(erros)]);
await fechar();
process.exit(ok ? 0 : 1);
