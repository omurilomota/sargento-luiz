/**
 * Prova visual dos assets do Pátio de Trens, dos 3 corpos externos de zumbi e
 * do galão de combustível da Refinaria.
 *
 * A regra 16 vale aqui: `npm test` prova que os arquivos existem, não que o
 * trilho cobre a célula certa, que o trem está na linha 8, que o zumbi gira na
 * direção da perseguição ou que o galão aparece acima do tambor. Esta prova
 * abre o jogo, caminha até o trem, invoca cada corpo e fotografa o objeto.
 *
 * Uso: npm run build && node tools/trens-assets-proof.mjs
 */
import { chromium } from 'playwright';
import { join } from 'path';
import { abrirJogo, irParaFase, SHOTS } from './bot.mjs';

const { page, erros, fechar } = await abrirJogo({ chromium });
const falhas = [];
const ok = (cond, msg) => {
  console.log(`${cond ? 'OK   ' : 'FALHA'} ${msg}`);
  if (!cond) falhas.push(msg);
};

const spriteLargura = (chave) => page.evaluate((k) => {
  const s = window.__ashfall.spriteFor(k);
  return s?.naturalWidth ?? 0;
}, chave);

try {
  // ── 1. Os arquivos que a cena nova pede carregaram de verdade ──
  for (const chave of [
    'prop_trilho_h_00', 'prop_trilho_h_01',
    'prop_trem_locomotiva_00', 'prop_trem_vagao_00',
    'prop_combustivel_00',
    'free1_stand', 'free2_stand', 'free3_stand',
  ]) {
    const largura = await spriteLargura(chave);
    ok(largura > 0, `${chave} carregou (${largura}px)`);
  }

  // ── 2. Pátio: caminhar até a via e fotografar o trem ──
  const patio = await irParaFase(page, 6);
  ok(patio.fase === 'Pátio de Trens', `entra no Pátio (recebi "${patio.fase}")`);
  const cena = await page.evaluate(() => window.__ashfall.cena());
  if (cena.ativa) {
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(700);
  }
  await page.evaluate(() => { window.__ashfall.matarTodos(); window.__ashfall.curar(); });
  await page.waitForTimeout(300);

  // Sobe até a linha 9 (uma célula abaixo do trem) e desloca para a direita
  // até a câmera enquadrar os dois carros. O caminho é livre: a coluna do
  // spawn é o vão entre os blocos de parede do pátio.
  for (let i = 0; i < 18; i++) {
    const p = await page.evaluate(() => window.__ashfall.player());
    if (p.y <= 615) break;
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyW');
  }
  for (let i = 0; i < 10; i++) {
    const p = await page.evaluate(() => window.__ashfall.player());
    if (p.x >= 1260) break;
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyD');
  }
  await page.evaluate(() => { window.__ashfall.matarTodos(); window.__ashfall.curar(); });
  await page.waitForTimeout(500);

  const p = await page.evaluate(() => window.__ashfall.player());
  const cam = await page.evaluate(() => window.__ashfall.camera());
  console.log(`  jogador em (${p.x.toFixed(0)}, ${p.y.toFixed(0)}) · câmera (${cam.x.toFixed(0)}, ${cam.y.toFixed(0)})`);
  // O trem ocupa as células 18..25 da linha 8 (x 1152..1664, y 512..576).
  const tremX = Math.max(0, 1152 - cam.x - 24);
  const tremY = Math.max(0, 512 - cam.y - 24);
  const tremW = Math.min(560, 1280 - tremX);
  const tremH = Math.min(150, 720 - tremY);
  await page.screenshot({ path: join(SHOTS, 'trens-01-patio.png') });
  await page.screenshot({
    path: join(SHOTS, 'trens-02-trilho-trem.png'),
    clip: { x: tremX, y: tremY, width: tremW, height: tremH },
  });

  // ── 3. Um corpo de cada vez, no centro do recorte ──
  const corpos = [
    { fase: 0, tipo: 'grunt', char: 'free1', nome: 'cidade' },
    { fase: 6, tipo: 'grunt', char: 'free2', nome: 'patio' },
    { fase: 2, tipo: 'slime', char: 'free3', nome: 'floresta' },
  ];
  for (const c of corpos) {
    const cfg = await irParaFase(page, c.fase);
    const cen = await page.evaluate(() => window.__ashfall.cena());
    if (cen.ativa) {
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(600);
    }
    await page.evaluate(() => { window.__ashfall.matarTodos(); window.__ashfall.curar(); });
    const nasceu = await page.evaluate((t) => window.__ashfall.spawnarInimigo(t, 100, 0), c.tipo);
    ok(!!nasceu, `${c.nome}: spawn de ${c.tipo}`);
    await page.waitForTimeout(800);
    await page.evaluate(() => window.__ashfall.centralizarNoInimigo());
    await page.evaluate(() => window.__ashfall.curar());
    await page.waitForTimeout(300);

    const naTela = await page.evaluate(() => window.__ashfall.personagensNaTela());
    ok(naTela.includes(c.char), `${c.nome}: ${c.tipo} desenha ${c.char} (tela: [${naTela.join(', ')}])`);

    const alvo = await page.evaluate(() => window.__ashfall.inimigoMaisProximo());
    const cam2 = await page.evaluate(() => window.__ashfall.camera());
    if (alvo) {
      const sx = alvo.x - cam2.x;
      const sy = alvo.y - cam2.y;
      await page.screenshot({
        path: join(SHOTS, `trens-03-inimigo-${c.char}.png`),
        clip: {
          x: Math.max(0, sx - 110), y: Math.max(0, sy - 110),
          width: 220, height: 220,
        },
      });
    }
    console.log(`  ${c.nome}: ${cfg.fase}, corpo ${naTela.join(', ')}`);
  }

  // ── 4. Refinaria: o galão precisa aparecer acima do tambor ──
  const ref = await irParaFase(page, 9);
  ok(ref.fase === 'Refinaria', `entra na Refinaria (recebi "${ref.fase}")`);
  const cenRef = await page.evaluate(() => window.__ashfall.cena());
  if (cenRef.ativa) {
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(600);
  }
  await page.evaluate(() => { window.__ashfall.matarTodos(); window.__ashfall.curar(); });
  const tambo = await page.evaluate(() => window.__ashfall.irParaTambo(90));
  ok(!!tambo, 'há tambor de combustível para fotografar');
  await page.waitForTimeout(700);
  if (tambo) {
    const cam3 = await page.evaluate(() => window.__ashfall.camera());
    await page.screenshot({
      path: join(SHOTS, 'trens-04-combustivel-galao.png'),
      clip: {
        x: Math.max(0, tambo.x - cam3.x - 110), y: Math.max(0, tambo.y - cam3.y - 130),
        width: 220, height: 240,
      },
    });
  }

  console.log(`\nerros de console/pageerror: ${erros.length}`);
  for (const e of [...new Set(erros)]) console.log(`  ${e}`);
  ok(erros.length === 0, 'nenhum erro de console ou pageerror');
  console.log(`\n${falhas.length === 0 ? 'PROVA VERDE' : `${falhas.length} FALHA(S)`}`);
  console.log(`screenshots em ${SHOTS.replace(process.cwd() + '/', '')}/trens-*.png`);
  if (falhas.length) process.exitCode = 1;
} finally {
  await fechar();
}
