/**
 * A repro do pause-trava-onda (playtest 2026-10-16): "Pausar o jogo e
 * voltar depois da cena de subestação pro vulcão, impede de dar progresso
 * nas ondas".
 *
 * O caminho real: fecha a Subestação → loja → ENTER → a cutscene do Vulcão
 * abre → ESC pausa DURANTE a cutscene → ESC despausa → atravessa a cena →
 * e as ondas do Vulcão têm que andar (a prova testemunha a onda subir ou
 * o campo encher de inimigos).
 *
 * Uso: node tools/m4-pausa-proof.mjs
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };
const { page, erros, fechar } = await abrirJogueSafe();

async function abrirJogueSafe() {
  try {
    return await abrirJogo({ chromium });
  } catch (e) {
    console.log('FALHA ao abrir o jogo:', e.message);
    process.exit(1);
  }
}

await irParaFase(page, 10); // Subestação
await page.evaluate(() => {
  window.__ashfall.cumprirObjetivo();
  window.__ashfall.matarTodos();
  window.__ashfall.pularParaUltimaOnda();
  window.__ashfall.invocarChefe();
});
await page.waitForTimeout(400);
await page.evaluate(() => window.__ashfall.matarChefe());
let estado = null;
for (let i = 0; i < 24; i++) {
  await page.waitForTimeout(400);
  estado = await page.evaluate(() => window.__ashfall.fase().estado);
  if (estado === 'shop') break;
}
if (estado !== 'shop') {
  nota(`a Subestação não chegou na loja (estado: ${estado})`);
} else {
  await page.keyboard.press('Enter'); // leaveShop → cutscene do Vulcão
  await page.waitForTimeout(900);
  const cena = await page.evaluate(() => window.__ashfall.cena());
  console.log(`  cutscene do Vulcão aberta: ${cena.ativa}`);

  // atravessa a cutscene PRIMEIRO (o ESC dentro dela é inerte — medido)
  for (let i = 0; i < 260; i++) {
    const c = await page.evaluate(() => window.__ashfall.cena());
    if (!c.ativa) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
  }

  // O CONTRATO (playtest 2026-10-16): ESC pausa NA PRIMEIRA tecla —
  // antes, em tela cheia o ESC saía do fullscreen (a pausa vinha só na
  // segunda) e no primeiro minuto ele dispensava o tutorial sem pausar:
  // a máquina de pause dessincronizada por um era o "pausar e voltar
  // não progride" do relato.
  await page.waitForTimeout(4000); // além do véu de transição (2s)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const pausado = await page.evaluate(() => window.__ashfall.fase().estado);
  console.log(`  ESC #1: "${pausado}"`);
  if (pausado !== 'paused') nota(`ESC #1 não pausou (estado: ${pausado})`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const voltou = await page.evaluate(() => window.__ashfall.fase().estado);
  console.log(`  ESC #2 (voltar): "${voltou}"`);
  if (voltou !== 'playing') nota(`ESC #2 não retomou (estado: ${voltou})`);

  // 12s de jogo: as ondas têm que andar
  const amostras = [];
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(1000);
    const st = await page.evaluate(() => window.__ashfall.fase());
    amostras.push(st);
  }
  const primeira = amostras[0];
  const ultima = amostras[amostras.length - 1];
  const maxInimigos = Math.max(...amostras.map(s => s.inimigos));
  console.log(`  estado: ${ultima.estado} · inimigos max: ${maxInimigos} · onda ${primeira.onda} -> ${ultima.onda}`);
  if (ultima.estado !== 'playing') nota(`voltou da pausa para "${ultima.estado}" (não playing)`);
  if (maxInimigos === 0) nota('nenhum inimigo nasceu em 12s — as ondas não progridem');
}

if (erros.length) nota(`erros de página: ${[...new Set(erros)].join('; ')}`);
console.log(problemas.length === 0
  ? '\nOK — o pause na cutscene não trava as ondas do Vulcão'
  : `\nFALHA — ${problemas.length} problema(s)`);
await fechar();
process.exit(problemas.length === 0 ? 0 : 1);
