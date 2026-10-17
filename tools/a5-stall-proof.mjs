/**
 * O INSTRUMENTO DE STALL do A5 — "o jogador para de se mover do nada em
 * certos mapas".
 *
 * A repro em Node (`a5-enterrado.test.ts`) já refutou a família "enterrado
 * em parede": nenhum ponto dos 16 mapas bloqueia as 4 direções de
 * `moveCircleBy`, porque `pushOutOfWalls` (com fallback `primeiroChaoLivre`)
 * resgata todo frame. Restava a hipótese do TODO: "empurrão (tornado/ponte)
 * prendendo contra parede + input = net zero" — um freeze de LÓGICA, não de
 * geometria, que só aparece jogando.
 *
 * Este harness joga de verdade e separa os dois casos com um PROBE:
 *
 *   - O bot anda num ciclo de direções, amostrando a posição a cada 150ms.
 *   - Quando a posição não muda por >1,2s com tecla premida (e vivo, sem
 *     diálogo), dispara o probe: tenta as 4 direções por 350ms cada.
 *   - Se UMA direção move → era só encostar em parede (falso-positivo).
 *   - Se as QUATRO ficam zeradas → FREEZE REAL (o A5), e a fase entra na
 *     lista. O teste Node garante que isto não pode ser geometria.
 *
 * Uso: npm run build && node tools/a5-stall-proof.mjs [--seg 30] [--so 0,7]
 */
import { chromium } from 'playwright';
import { abrirJogo, criarBot, irParaFase, RAIZ, SHOTS } from './bot.mjs';
import { join } from 'path';
import { mkdirSync } from 'fs';

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? Number(process.argv[i + 1]) : d;
};
const SEG = arg('seg', 30);
const SO_RAW = process.argv.includes('--so') ? process.argv[process.argv.indexOf('--so') + 1] : null;
const SO = SO_RAW ? SO_RAW.split(',').map((n) => Number(n.trim())) : null;

const LIMIAR_STALL_MS = 1200;   // sem mover por isto, com tecla premida, = suspeito
const PROBE_MS = 350;           // tempo que cada direção do probe tenta andar
const DESLOC_MINIMO = 3;        // px que conta como "moveu" no probe

const DIRECOES = [
  { tecla: 'KeyD', dx: 1, dy: 0, nome: 'leste' },
  { tecla: 'KeyA', dx: -1, dy: 0, nome: 'oeste' },
  { tecla: 'KeyS', dx: 0, dy: 1, nome: 'sul' },
  { tecla: 'KeyW', dx: 0, dy: -1, nome: 'norte' },
];

const jogo = await abrirJogo({ chromium });
const { page, erros, fechar } = jogo;
mkdirSync(SHOTS, { recursive: true });

const nomes = await page.evaluate(() => window.__ashfall.config().fases.map((f) => f.name));
const congelados = [];

async function posicao() {
  return page.evaluate(() => {
    const g = window.__ashfall;
    const p = g.player();
    return { x: p.x, y: p.y, hp: p.hp };
  });
}
async function estado() {
  return page.evaluate(() => {
    const g = window.__ashfall;
    return {
      estado: g.telemetria?.().estado ?? g.estado?.() ?? '?',
      dialogo: g.dialogo?.() ?? false,
      cena: g.cena?.().ativa ?? false,
    };
  });
}

/** Tenta mover em UMA direção por PROBE_MS e devolve o deslocamento real. */
async function probeDirecao(dir) {
  const antes = await posicao();
  await page.keyboard.down(dir.tecla);
  await page.waitForTimeout(PROBE_MS);
  await page.keyboard.up(dir.tecla);
  const depois = await posicao();
  return Math.hypot(depois.x - antes.x, depois.y - antes.y);
}

/**
 * O probe completo: das 4 direções, quantas conseguem deslocar o corpo.
 * Zero direções = freeze real (o teste Node prova que não é geometria).
 */
async function probeQuatroDirecoes() {
  const movimentos = [];
  for (const dir of DIRECOES) {
    const d = await probeDirecao(dir);
    movimentos.push({ nome: dir.nome, desloc: Math.round(d * 10) / 10 });
    await page.waitForTimeout(80);
  }
  return movimentos;
}

for (let i = 0; i < nomes.length; i++) {
  if (SO && !SO.includes(i)) continue;
  const cfg = await irParaFase(page, i);
  const bot = criarBot(page, { atirar: true });

  let ultimoX = null, ultimoY = null, ultimoMoveMs = Date.now();
  let suspeitos = 0;
  const t0 = Date.now();

  // anda num ciclo fixo de direções; a rotação garante que qualquer canto
  // seja testado de todas as faces (o dodge puro mudava de direção ruidoso)
  let passo = 0;
  let teclaAtual = null;

  while (Date.now() - t0 < SEG * 1000) {
    const est = await estado();
    if (est.cena) { await page.keyboard.press('Backspace'); await page.waitForTimeout(300); continue; }
    if (est.dialogo) { await page.keyboard.press('Enter'); await page.waitForTimeout(200); continue; }
    if (est.estado === 'gameover') break;

    // ciclo de direção: troca a cada ~700ms
    if (Date.now() - t0 > passo * 700) {
      const dir = DIRECOES[Math.floor(passo / 1) % DIRECOES.length];
      if (teclaAtual && teclaAtual !== dir.tecla) await page.keyboard.up(teclaAtual);
      await page.keyboard.down(dir.tecla);
      teclaAtual = dir.tecla;
      passo++;
    }

    const p = await posicao();
    if (ultimoX !== null) {
      const desloc = Math.hypot(p.x - ultimoX, p.y - ultimoY);
      if (desloc > DESLOC_MINIMO) {
        ultimoMoveMs = Date.now();
      } else if (Date.now() - ultimoMoveMs > LIMIAR_STALL_MS) {
        // suspeito: solta a tecla e probe as 4 direções
        if (teclaAtual) { await page.keyboard.up(teclaAtual); teclaAtual = null; }
        suspeitos++;
        const movimentos = await probeQuatroDirecoes();
        const queMovem = movimentos.filter((m) => m.desloc > DESLOC_MINIMO);
        if (queMovem.length === 0) {
          const shot = join(SHOTS, `a5-congelado-fase${i}.png`);
          await page.screenshot({ path: shot });
          congelados.push({ i, fase: cfg.fase, hp: p.hp, movimentos, shot });
          console.log(`❄️  FASE ${i + 1} ${cfg.fase}: FREEZE REAL — as 4 direções zeradas. ${JSON.stringify(movimentos)}`);
        } else {
          // falso-positivo: encostado em parede, mas anda se muda de direção
          console.log(`   fase ${i + 1} ${cfg.fase}: suspeito resolvido pelo probe (${queMovem.length}/4 movem — parede)`);
        }
        ultimoMoveMs = Date.now();
      }
    }
    ultimoX = p.x; ultimoY = p.y;
    await page.waitForTimeout(150);
  }

  if (teclaAtual) await page.keyboard.up(teclaAtual);
  await bot.parar();
  console.log(`${String(i + 1).padStart(2)}/${nomes.length} ${cfg.fase.padEnd(20)} stalls suspeitos: ${suspeitos}`);
}

console.log('\n──── VEREDITO A5 ────');
if (congelados.length === 0) {
  console.log(`NENHUM freeze real em ${SO ? SO.length : nomes.length} fases (${SEG}s cada). O A5 não se reproduz no HEAD: todo "para de parede" é encostar em muro, resolvido mudando de direção.`);
} else {
  console.log(`${congelados.length} fase(s) com FREEZE REAL:`);
  for (const c of congelados) console.log(`  - fase ${c.i + 1} ${c.fase} (hp ${c.hp}) — ${c.shot}`);
}
if (erros.length) console.log('\nerros de página:', erros.slice(0, 5));

await fechar();
process.exit(congelados.length > 0 ? 1 : 0);
