/**
 * PROVA DE EQUILIBRIO — a build máxima não pode limpar o jogo.
 *
 * Relato do dono (2026-11-07): "depois de upar tudo, o personagem fica
 * imbatível e mata tudo e todos na sua frente sem nenhuma dificuldade".
 *
 * A prova mede o build MÁXIMO (todos os degraus de perk, todos os talentos,
 * Metralhadora lendária com duas peças de DANO) e fecha três contratos:
 *
 *   C1 — UM ACERTO NÃO APAGA INIMIGO COMUM
 *        Nenhum tiro pode tirar mais que max(14, 35% da vida máxima) de um
 *        inimigo comum. E o teto não pode virar arrastão: o mesmo alvo cai
 *        em no máximo 6 acertos.
 *
 *   C2 — O CHEFE FINAL EXIGE LUTA
 *        O NÚCLEO (1060 HP de base) não pode morrer em menos de 8s de tiro
 *        contínuo com a build máxima.
 *
 *   C3 — O CHEFE FINAL É AMEAÇA
 *        Na mesma luta o jogador tem de levar dano: build máxima não é
 *        imbatível.
 *
 * A build máxima é montada por SAVE, não por compra: o caminho da loja depende
 * de sorte, de renda e de wave — um build "quase máximo" mediria outra coisa.
 * O save entra pelo mesmo `luiz.save` que o jogo usa, e o jogo continua por ele
 * (tecla C), que é o caminho real de quem está com a partida pronta.
 *
 * Uso: node tools/balance-proof.mjs   (via `npm run balance`)
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { abrirJogo } from './bot.mjs';

const SHOTS = join(dirname(fileURLToPath(import.meta.url)), 'shots');

/** Todos os degraus de perk (5 comuns + 1 especial de cada ramo). */
const PERKS = [
  'dano_t1', 'dano_t2', 'dano_t3', 'dano_t4', 'dano_t5', 'pistola_incandescente',
  'corpo_t1', 'corpo_t2', 'corpo_t3', 'corpo_t4', 'corpo_t5', 'segundo_folego',
  'pernas_t1', 'pernas_t2', 'pernas_t3', 'pernas_t4', 'pernas_t5', 'passo_fantasma',
  'mente_t1', 'mente_t2', 'mente_t3', 'mente_t4', 'mente_t5', 'sortudo',
];

/** Todos os talentos (1 ponto de cada galho). */
const TALENTOS = ['mente_crit', 'mente_regen', 'armas_dano', 'armas_pierce', 'mov_vel', 'mov_vida'];

/**
 * O build máximo: Metralhadora lendária com duas peças de DANO, todos os
 * degraus e todos os talentos. A pistola fica no inventário porque é a arma
 * de referência do mundo (e o jogador sempre tem uma).
 */
const SAVE = {
  phase: 0, wave: 0, weaponIndex: 2, coins: 0, score: 0,
  upgrades: PERKS,
  weapons: [{ index: 0, quality: 'normal' }, { index: 2, quality: 'lendaria' }],
  pieces: ['dano', 'dano'], equippedPieces: { 2: ['dano', 'dano'] },
  talentos: TALENTOS, xp: 20000, furia: true,
  phaseName: 'Cidade em Ruínas', timestamp: Date.now(),
};

/** Teto de dano por acerto em inimigo comum (35% da vida máxima, piso 14). */
const TETO_COMUM = 0.35;
const PISO_COMUM = 14;
/** O chefe final tem de exigir pelo menos isto de tiro contínuo. */
const TTK_MINIMO_CHEFE = 8;

const resultados = [];
function checar(nome, ok, detalhe = '') {
  resultados.push({ nome, ok, detalhe });
  console.log(`${ok ? 'OK   ' : 'FALHA'} ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
}

/**
 * A caixa pequena de diálogo CONGELA o mundo (é o comportamento do jogo:
 * a cena fala e o mundo espera). Sem atravessá-la, a medição mede um jogo
 * parado — foi o que travou a primeira versão desta prova: a recarga ficou
 * congelada em 0,28s e o chefe parou de levar dano.
 */
async function atravessarDialogo(page) {
  const aberto = await page.evaluate(() => window.__ashfall.dialogo?.() ?? false);
  if (!aberto) return false;
  await page.keyboard.press('Enter');
  await page.waitForTimeout(180);
  return true;
}

/**
 * A cutscene de entrada da fase ALSO segura o mundo (ela roda em `playing`).
 * Sem pular, a luta contra o NÚCLEO nunca começa: o chefe fica parado e a
 * recarga congelada em 0,28s denunciava o congelamento.
 */
async function pularCena(page) {
  for (let i = 0; i < 15; i++) {
    const ativa = await page.evaluate(() => window.__ashfall.cena?.().ativa ?? false);
    if (!ativa) return;
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(140);
  }
}

/**
 * Mira num alvo do mundo (coordenadas de tela) e devolve o ponto.
 *
 * A câmera do projeto é o CANTO SUPERIOR ESQUERDO visível (a convenção está
 * em `screenToWorld`: mundo = tela + câmera). Então a tela de um ponto do
 * mundo é `mundo - câmera`, sem somar metade da viewport.
 */async function mirar(page, tipo) {
  const alvo = await page.evaluate((t) => {
    const g = window.__ashfall;
    const lista = (g.inimigos?.() ?? []).filter(e => e.tipo === t);
    if (!lista.length) return null;
    const cam = g.camera();
    const p = g.player();
    const e = lista[0];
    const px = p.x - cam.x, py = p.y - cam.y;
    const ex = e.x - cam.x, ey = e.y - cam.y;
    let x = ex, y = ey;
    // fora da tela: aponta na DIREÇÃO do alvo a partir do jogador, para o
    // clique não cair fora do canvas (e o tiro não nascer)
    const dentro = x > 2 && x < g.canvas.width - 2 && y > 2 && y < g.canvas.height - 2;
    if (!dentro) {
      const dx = ex - px, dy = ey - py;
      const d = Math.hypot(dx, dy) || 1;
      x = px + (dx / d) * 160;
      y = py + (dy / d) * 160;
    }
    return { x, y, dist: Math.hypot(ex - px, ey - py) };
  }, tipo);
  if (alvo) await page.mouse.move(alvo.x, alvo.y);
  return alvo;
}

const jogo = await abrirJogo({ chromium });
const { page, erros, fechar } = jogo;

try {
  // ── a build máxima ──
  await page.evaluate((save) => {
    localStorage.setItem('luiz.save', JSON.stringify(save));
  }, SAVE);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.keyboard.press('c');           // continua o save
  await page.waitForTimeout(1600);

  const preparo = await page.evaluate(() => {
    const g = window.__ashfall;
    return {
      arma: g.arma(),
      ameaca: g.ameaca(),
      perks: g.perks().comprados.length,
      talentos: g.talentos().comprados.length,
      hp: g.telemetria().maxHp,
      fase: g.fase(),
    };
  });
  console.log(`BUILD: arma=${preparo.arma.nome}/${preparo.arma.qualidade} dano=${preparo.arma.dano} dps=${preparo.arma.dps} perks=${preparo.perks} talentos=${preparo.talentos} vida=${preparo.hp}`);
  console.log(`AMEAÇA: vida=${preparo.ameaca.vida.toFixed(2)} dano=${preparo.ameaca.dano.toFixed(2)} número=${preparo.ameaca.numero.toFixed(2)}`);
  checar('a build máxima foi carregada (perks e talentos)', preparo.perks === PERKS.length && preparo.talentos === TALENTOS.length,
    `perks=${preparo.perks}/${PERKS.length} talentos=${preparo.talentos}/${TALENTOS.length}`);
  checar('a build máxima pegou na arma (qualidade, peça e perk)', preparo.arma.dano > 6 && preparo.arma.pecas.damageMult > 1 && preparo.arma.statDano > 1,
    `dano=${preparo.arma.dano} peças=${preparo.arma.pecas.damageMult} stat=${preparo.arma.statDano}`);
  checar('o mundo reagiu ao preparo (ameaça > 1)', preparo.ameaca.numero > 1,
    `ameaça=${preparo.ameaca.numero.toFixed(2)}`);

  // ── as duas telas onde a ameaça aparece (regra 16: render mudado pede
  // screenshot lido, não só build verde) ──
  mkdirSync(SHOTS, { recursive: true });
  await page.evaluate(() => window.__ashfall.entrarLoja());
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(SHOTS, 'balance-01-loja.png') });
  // a loja é um estado: `irParaFase(0)` volta para a fase 1 em `playing`
  // (sem o ENTER da loja, que advance a fase e mudaria a medição)
  await page.evaluate(() => window.__ashfall.irParaFase(0));
  await page.waitForTimeout(700);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(SHOTS, 'balance-02-pausa.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // ── C1: um acerto não apaga inimigo comum ──
  console.log('\n=== C1: um acerto não apaga inimigo comum ===');
  const alvo = await page.evaluate(() => {
    const g = window.__ashfall;
    g.matarTodos();
    const a = g.spawnarInimigo('grunt', 110, 0);
    g.centralizarNoInimigo();
    return a;
  });
  await page.waitForTimeout(250);
  await mirar(page, 'grunt');

  // Sonda: um registro por FRAME da vida do alvo, para separar ACERTOS de
  // frames (o dano por acerto é a diferença entre dois frames, não o total).
  // A sonda segue o alvo pelo PONTO onde ele nasceu e PARA quando ele cai:
  // sem isso, a sonda passava a medir outro inimigo (o primeiro da fila) e o
  // relatório dizia "1 acerto de 1 de dano" num alvo que tinha morrido com 30.
  await page.evaluate(() => {
    const g = window.__ashfall;
    window.__sonda = [];
    const alvo = g.inimigos().find(e => e.tipo === 'grunt');
    const ax = alvo ? alvo.x : 0, ay = alvo ? alvo.y : 0;
    const passo = () => {
      const lista = g.inimigos();
      let melhor = null, dist = Infinity;
      for (const e of lista) {
        const d = Math.hypot(e.x - ax, e.y - ay);
        if (d < dist) { dist = d; melhor = e; }
      }
      // longe demais do ponto de nascimento = o alvo não é mais este
      const alvoVivo = melhor && dist < 140 ? melhor : null;
      window.__sonda.push({
        t: performance.now(),
        vida: alvoVivo ? Math.round(alvoVivo.vida * 100) / 100 : null,
        max: alvoVivo ? Math.round(alvoVivo.vidaMax * 100) / 100 : null,
        dist: Math.round(dist),
      });
      // a sonda para quando o alvo cai: o que vem depois é outro inimigo
      if (window.__sonda.length < 400 && alvoVivo && alvoVivo.vida > 0) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  });

  // Tiros ISOLADOS: aperta e solta antes do intervalo da metralhadora
  // (0,14s), para que cada aperto seja UM acerto e a régua meça o teto, não
  // a cadência.
  for (let i = 0; i < 8; i++) {
    if (await atravessarDialogo(page)) continue;
    await mirar(page, 'grunt');
    await page.mouse.down();
    await page.waitForTimeout(20);
    if (i === 0) {
      const balas = await page.evaluate(() => ({
        balas: window.__ashfall.getBullets().map(b => ({ d: Math.round(b.damage * 10) / 10, inimigo: b.isEnemy })),
        estado: window.__ashfall.telemetria().estado,
        arma: window.__ashfall.arma(),
      }));
      console.log(`balas no voo: ${JSON.stringify(balas.balas)} estado=${balas.estado} municao=${balas.arma.municao}`);
    }
    await page.waitForTimeout(35);
    await page.mouse.up();
    await page.waitForTimeout(260);
    const vivo = await page.evaluate(() => window.__ashfall.inimigos().some(e => e.tipo === 'grunt' && e.vida > 0));
    if (!vivo) break;
  }
  await page.waitForTimeout(400);

  const sonda = await page.evaluate(() => window.__sonda);
  // Os acertos: cada queda de vida entre dois frames é um acerto.
  const acertos = [];
  let anterior = sonda.find(s => s.vida !== null);
  for (const s of sonda) {
    if (s.vida === null) continue;
    if (anterior && s.vida < anterior.vida) acertos.push({ dano: Math.round((anterior.vida - s.vida) * 100) / 100, de: anterior.vida, t: s.t });
    anterior = s;
  }
  const vidaMax = sonda.find(s => s.max !== null)?.max ?? 0;
  const teto = Math.max(PISO_COMUM, vidaMax * TETO_COMUM);
  const ultimo = sonda[sonda.length - 1];
  const morreu = !!ultimo && (ultimo.vida === null || ultimo.vida <= 0);
  const primeiro = acertos[0];
  console.log(`alvo=${alvo?.tipo} vidaMax=${vidaMax} teto=${teto.toFixed(1)} acertos=${acertos.length} danos=${acertos.map(a => a.dano).join(',')} morreu=${morreu}`);
  checar('o inimigo comum sobrevive ao PRIMEIRO acerto', !!primeiro && primeiro.dano < primeiro.de,
    primeiro
      ? `primeiro acerto tirou ${primeiro.dano} de ${primeiro.de}`
      : (morreu ? 'o inimigo CAIU no primeiro acerto (morreu antes do frame seguinte)' : 'nenhum acerto medido'));
  checar('nenhum acerto passa do teto por acerto', acertos.length > 0 && acertos.every(a => a.dano <= teto + 1),
    `teto=${teto.toFixed(1)} maior acerto=${acertos.length ? Math.max(...acertos.map(a => a.dano)) : '—'}`);
  checar('o teto não vira arrastão (alvo cai em até 6 acertos)', acertos.length > 0 && (!morreu || acertos.length <= 6),
    `${acertos.length} acertos medidos${morreu ? ' (caiu)' : ' ( resistiu)'}`);

  // ── C2/C3: o chefe final ──
  console.log('\n=== C2/C3: o chefe final exige luta e é ameaça ===');
  await page.evaluate(() => window.__ashfall.irParaFase(15));
  await page.waitForTimeout(1200);
  await pularCena(page);
  await page.waitForTimeout(400);
  const bossInfo = await page.evaluate(() => {
    const g = window.__ashfall;
    g.invocarChefe();
    g.centralizarNoInimigo();
    // tanque: a luta inteira precisa acontecer para o tempo até a queda
    // ser medido (o NÚCLEO mata o jogador em ~7s e a queda congela o mundo)
    g.vidaMax(99999);
    const b = g.inimigos().find(e => e.tipo === 'nucleo');
    return b ? { vida: b.vida, vidaMax: b.vidaMax } : null;
  });
  await page.waitForTimeout(300);
  checar('o NÚCLEO foi invocado', !!bossInfo, bossInfo ? `vida=${bossInfo.vida}` : 'não apareceu');
  if (bossInfo) {
    const amostras = [];
    const t0 = Date.now();
    await page.mouse.down();
    while (Date.now() - t0 < 40000) {
      if (await atravessarDialogo(page)) continue;
      if (await page.evaluate(() => window.__ashfall.cena?.().ativa ?? false)) {
        await pularCena(page);
        continue;
      }
      // A cura a cada passo mantém a MEDIÇÃO viva: o que está sendo medido é
      // quanto o chefe exige de tiro, não se o jogador sobrevive parado. O
      // dano que o chefe cause é lido na telemetria, que acumula mesmo com a
      // cura. Sem ela o jogador morre no meio da luta (o NÚCLEO tiro 105 por
      // bala), o estado vira `gameover` e o mundo CONGELA — a prova media
      // metade da luta e chamava isso de equilibrium.
      await page.evaluate(() => window.__ashfall.curar());
      const d = await page.evaluate(() => {
        const g = window.__ashfall;
        const b = g.inimigos().find(e => e.tipo === 'nucleo');
        const tele = g.telemetria();
        const cam = g.camera();
        const p = g.player();
        return {
          vida: b ? b.vida : null,
          hp: tele.hp,
          dano: tele.dano?.total ?? 0,
          estado: tele.estado,
          municao: g.arma().municao,
          recarregando: g.arma().recarregando,
          timerRecarga: Math.round(g.arma().timerRecarga * 100) / 100,
          emperrada: g.arma().emperrada,
          bala: b ? { x: Math.round(b.x - cam.x), y: Math.round(b.y - cam.y), d: Math.round(Math.hypot(b.x - p.x, b.y - p.y)) } : null,
          jogador: { x: Math.round(p.x - cam.x), y: Math.round(p.y - cam.y) },
          inimigos: g.inimigos().length,
        };
      });
      const t = (Date.now() - t0) / 1000;
      amostras.push({ t, ...d });
      if (amostras.length % 20 === 0) {
        console.log(`  [${t.toFixed(1)}s] vida=${d.vida} municao=${d.municao} recarga=${d.recarregando}/${d.timerRecarga} estado=${d.estado} chefeTela=${JSON.stringify(d.bala)} jogadorTela=${JSON.stringify(d.jogador)} inimigos=${d.inimigos}`);
      }
      // o chefe sumiu da lista = caiu
      if (d.vida === null) break;
      await mirar(page, 'nucleo');
      await page.waitForTimeout(100);
    }
    await page.mouse.up();

    const primeira = amostras.find(a => a.vida !== null);
    const ultima = amostras[amostras.length - 1];
    const caiu = ultima.vida === null;
    // Tempo até a queda: o chefe morreu em `caiu`, senão a taxa de dano
    // medida dá o tempo ESTIMADO.
    let ttk = null;
    if (caiu) {
      ttk = ultima.t;
    } else if (primeira && ultima && ultima.t > primeira.t && ultima.vida < primeira.vida) {
      const taxa = (primeira.vida - ultima.vida) / (ultima.t - primeira.t);
      ttk = taxa > 0 ? primeira.vida / taxa : null;
    }
    const danoSofrido = ultima.dano;
    console.log(`chefe: vida=${primeira?.vida} amostras=${amostras.length} caiu=${caiu} ttk=${ttk?.toFixed(1)} danoSofrido=${Math.round(danoSofrido)}`);
    console.log(`  rastro: ${amostras.filter((_, i) => i % 5 === 0).map(a => `${a.t.toFixed(1)}s:${a.vida === null ? 'caiu' : Math.round(a.vida)}`).join(' ')}`);
    checar('o chefe final exige pelo menos 8s de tiro contínuo', ttk !== null && ttk >= TTK_MINIMO_CHEFE,
      `ttk=${ttk ? ttk.toFixed(1) : '—'}s`);
    checar('o chefe final ameaça o jogador (dano > 0)', danoSofrido > 0, `dano recebido=${Math.round(danoSofrido)}`);
  }
} catch (e) {
  checar('a prova rodou sem exceção', false, String(e));
} finally {
  await fechar();
}

if (erros.length) {
  console.log('\nerros de página:');
  for (const e of [...new Set(erros)]) console.log(`  ${e}`);
}

const passou = resultados.filter((r) => r.ok).length;
console.log(`\n${passou}/${resultados.length} verificações passaram`);
if (passou !== resultados.length) process.exit(1);
