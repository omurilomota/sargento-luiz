/**
 * Prova do objetivo `collect` da Refinaria (frente F-D do playtest).
 *
 * O jogo prometia o combustível e não entregava: a cutscene da fase anunciava
 * "Objetivo simples: pegar gasolina" (story.ts) enquanto o config mandava um
 * `clear` qualquer. A prova fecha o contrato de ponta a ponta — a fase nasce
 * como `collect`, cada tambor encher avança o contador, o quarto cumpre o
 * objetivo e o objetivo é o que libera o chefe (main.ts `horaDoChefe`).
 *
 * Ela teleporta o jogador em cima de cada tambor (`irParaTambo`, o análogo do
 * `irParaZona`): caminhar até os quatro num harness seria flaky, e o que está
 * em questão é a coleta, não a pilotagem.
 *
 * Uso: npm run build && node tools/refinaria-combustivel-proof.mjs
 */
import { chromium } from 'playwright';
import { join } from 'path';
import { abrirJogo, irParaFase, SHOTS } from './bot.mjs';

const FASE_REFINARIA = 9;
const TAMBORES = 4;

const { page, erros, fechar } = await abrirJogo({ chromium });
const falhas = [];
const ok = (cond, msg) => {
  console.log(`${cond ? 'OK   ' : 'FALHA'} ${msg}`);
  if (!cond) falhas.push(msg);
};

try {
  const cfg = await irParaFase(page, FASE_REFINARIA);
  ok(cfg.fase === 'Refinaria', `entra na Refinaria (recebi "${cfg.fase}")`);
  ok(cfg.objetivo === 'collect', `config da fase é 'collect' (recebi "${cfg.objetivo}")`);
  ok(cfg.objetivoAtual.label === 'ENCHER OS TAMBORES', `rótulo é "${cfg.objetivoAtual.label}"`);
  ok(cfg.objetivoAtual.detail === `0/${TAMBORES}`, `começa em ${cfg.objetivoAtual.detail}`);
  ok(cfg.objetivoAtual.done === false, 'não começa cumprido');

  // Regra 15: o tambor é o tile do barril do pack. Se o tile não carregar,
  // props.ts cai no círculo procedural — o jogo passaria a ter um tambor
  // desenhado no editor de código, que é exatamente o que a regra proíbe.
  const sprites = await page.evaluate(() => [505, 506, 507, 508, 509, 510].map(n => {
    const s = window.__ashfall.spriteFor(`tile_${n}`);
    return { n, largura: s?.naturalWidth ?? 0 };
  }));
  for (const s of sprites) {
    ok(s.largura > 0, `tile_${s.n} do barril carrega (${s.largura}px)`);
  }

  await page.evaluate(() => window.__ashfall.matarTodos());
  await page.screenshot({ path: join(SHOTS, 'refinaria-combustivel-1-inicio.png') });

  for (let i = 1; i <= TAMBORES; i++) {
    await page.evaluate(() => window.__ashfall.matarTodos());
    // 90px de folga: encostado (0) o tambor some do mapa no mesmo frame e a
    // screenshot não prova nada. Com folga ele fica ao lado do jogador.
    const tambo = await page.evaluate(() => window.__ashfall.irParaTambo(90));
    ok(!!tambo, `há tambor vivo para a coleta ${i}`);
    // espera a câmera assentar no alvo novo e o tremor do `matarTodos` passar
    await page.waitForTimeout(900);
    await page.screenshot({ path: join(SHOTS, `refinaria-combustivel-2-coleta${i}.png`) });
    if (i === 1) {
      // Close-up SOBRE o tambor. O enquadramento não pode supor o centro da
      // tela: perto da borda do mapa a câmera trava no clamp e o jogador sai
      // de quadro (foi o que aconteceu numa primeira versão desta prova).
      // Lê a câmera e o ponto do tambor e recorta onde o objeto está.
      const cam = await page.evaluate(() => window.__ashfall.camera());
      const sx = Math.round(tambo.x - cam.x);
      const sy = Math.round(tambo.y - cam.y);
      await page.screenshot({
        path: join(SHOTS, 'refinaria-combustivel-4-closeup.png'),
        clip: { x: Math.max(0, sx - 110), y: Math.max(0, sy - 110), width: 220, height: 220 },
      });
    }

    await page.evaluate(() => window.__ashfall.irParaTambo(0));
    await page.waitForTimeout(260);
    const f = await page.evaluate(() => window.__ashfall.fase());
    ok(f.objetivoAtual.detail === `${i}/${TAMBORES}`,
      `coleta ${i} avança o contador (recebi ${f.objetivoAtual.detail})`);
  }

  const fim = await page.evaluate(() => window.__ashfall.fase());
  ok(fim.objetivoAtual.done === true, 'o quarto tambor cumpre o objetivo');
  ok(fim.objetivoAtual.progress === 1, `progresso chega a 1 (recebi ${fim.objetivoAtual.progress})`);

  // Fim do contrato: o objetivo é o que libera o chefe (`horaDoChefe =
  // objetivoLiberouChefe && isUltimasOndas`, e o spawn ainda exige `campoLivre`,
  // main.ts:1537-1538). Limpar o campo a cada amostra é o que o jogador faz no
  // jogo real; esperar passivo era flaky por construção — o spawner reabre a
  // última onda e o chefe ficava bloqueado enquanto houvesse um inimigo vivo.
  await page.evaluate(() => window.__ashfall.pularParaUltimaOnda());
  let chefeNasceu = false;
  for (let t = 0; t < 40 && !chefeNasceu; t++) {
    await page.evaluate(() => window.__ashfall.matarTodos());
    await page.waitForTimeout(150);
    chefeNasceu = await page.evaluate(() => window.__ashfall.fase().chefeVivo);
  }
  ok(chefeNasceu, 'objetivo cumprido libera o chefe da Refinaria');

  console.log(`\nerros de console/pageerror: ${erros.length}`);
  for (const e of [...new Set(erros)]) console.log(`  ${e}`);
  ok(erros.length === 0, 'nenhum erro de console ou pageerror');

  console.log(`\n${falhas.length === 0 ? 'PROVA VERDE' : `${falhas.length} FALHA(S)`}`);
  console.log(`screenshots em ${SHOTS.replace(process.cwd() + '/', '')}/refinaria-combustivel-*.png`);
  if (falhas.length) process.exitCode = 1;
} finally {
  await fechar();
}
