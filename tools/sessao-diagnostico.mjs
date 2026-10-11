/**
 * Diagnóstico do bot do `session.mjs` e da fase do Bunker.
 *
 * Responde a três perguntas que o log sozinho não responde:
 *
 * 1. A direção de dodge afasta? A primeira versão do bot usava perpendicular
 *    pura com UMA tecla, que aproximava o jogador do inimigo em metade dos
 *    ângulos. `tools/dodge.mjs` conserta e `dodgeBot.test.ts` trava; aqui
 *    conferimos com a regra real, no navegador.
 *
 * 2. Algum inimigo trava DENTRO de parede? Foi o bug que não se via: no Bunker
 *    a fase não acabava, o log mostrava 4 hostis e 0 abates, e o inimigo estava
 *    em `y=1264` — dentro da fileira 19, que é parede sólida. Com
 *    `flowDist === -1` e `moveCircleBy` recusando todo passo, ele ficava
 *    congelado para sempre.
 *
 * 3. As fases têm dificuldade crescente? Uma varredura curta, só para o
 *    sintoma de "todo mundo é igual" aparecer.
 *
 * Uso: node tools/sessao-diagnostico.mjs [--seg 30]
 */
import { chromium } from 'playwright';
import { abrirJogo, criarBot, irParaFase } from './bot.mjs';
import { direcaoDodge } from './dodge.mjs';

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? Number(process.argv[i + 1]) : d;
};
const SEG = arg('seg', 25);

const jogo = await abrirJogo({ chromium });
const { page, erros, fechar } = jogo;

console.log('── 1. a direção de dodge afasta? ──');
let aproxima = 0;
const ameacas = [];
for (let grau = 0; grau < 360; grau += 5) {
  const rad = (grau * Math.PI) / 180;
  ameacas.push({ dx: Math.cos(rad) * 200, dy: Math.sin(rad) * 200 });
}
for (const { dx, dy } of ameacas) {
  const { teclas, afasta } = direcaoDodge(dx, dy);
  // o que o jogo FAZ: `movePlayer` normaliza as teclas apertadas
  let mx = 0;
  let my = 0;
  if (teclas.includes('KeyA')) mx -= 1;
  if (teclas.includes('KeyD')) mx += 1;
  if (teclas.includes('KeyW')) my -= 1;
  if (teclas.includes('KeyS')) my += 1;
  const len = Math.hypot(mx, my) || 1;
  const d = Math.hypot(dx, dy);
  const dotReal = (mx / len) * -dx / d + (my / len) * -dy / d;
  if (dotReal <= 0 || afasta <= 0) aproxima++;
}
console.log(`  ${ameacas.length} direções testadas · ${aproxima} aproximam o jogador do inimigo`);
if (aproxima) console.log('  ❌ o dodge tem ângulo que aproxima');

console.log('\n── 2. algum inimigo trava dentro de parede? ──');
const presoPorFase = [];
for (let fase = 0; fase < 9; fase++) {
  const cfg = await irParaFase(page, fase);
  const bot = criarBot(page);
  await bot.medir(SEG, { aCada: Math.max(5, Math.round(SEG / 5)) });
  await bot.parar();

  // "imóvel" só é defeito em três condições: estar perto do jogador, estar no
  // chão E já ter passado o `spawnDelay` (senão é um inimigo que ainda nem
  // nasceu andando). Medir sem as três acusava 6 fases com problema quando não
  // havia nenhum — a primeira versão deste arquivo fez exatamente isso.
  let dentroParede = 0;
  const historico = new Map();
  for (let k = 0; k < 5; k++) {
    const dados = await page.evaluate(() => {
      const g = window.__ashfall;
      const p = g.playerPos();
      return g.diagnosticoInimigos().map((e) => ({
        ...e,
        dist: Math.round(Math.hypot(e.x - p.x, e.y - p.y)),
      }));
    });
    for (const e of dados) {
      if (e.dentroDaParede) dentroParede++;
      const chave = `${e.tipo}:${e.x},${e.y}`;
      const anterior = historico.get(chave);
      if (anterior) {
        anterior.dist = Math.min(anterior.dist, e.dist);
        anterior.spawnDelay = Math.max(anterior.spawnDelay, e.spawnDelay);
      } else {
        historico.set(chave, { dist: e.dist, tipo: e.tipo, spawnDelay: e.spawnDelay });
      }
    }
    await page.waitForTimeout(500);
  }
  const colados = [...historico.values()].filter((n) => n.dist < 320 && n.spawnDelay <= 0);
  const t = await page.evaluate(() => window.__ashfall.telemetria());
  presoPorFase.push({
    fase: cfg.fase,
    dentroParede,
    colados: colados.length,
    hp: t.hp,
    kills: t.kills,
  });
  const problemas = [];
  if (dentroParede) problemas.push(`${dentroParede} leitura(s) dentro de parede`);
  if (colados.length) {
    const amostra = colados.slice(0, 3).map((n) => `${n.tipo}@${n.dist}px`).join(', ');
    problemas.push(`${colados.length} imóvel(is) perto: ${amostra}`);
  }
  console.log(
    `  ${String(fase + 1).padStart(2)}. ${cfg.fase.padEnd(20)} ` +
    `dentro=${String(dentroParede).padStart(3)}  colados=${String(colados.length).padStart(3)}  ` +
    `hp=${String(t.hp).padStart(4)}  abates=${String(t.kills).padStart(3)}  ` +
    (problemas.length ? `❌ ${problemas.join('; ')}` : 'ok'),
  );
}

const comProblema = presoPorFase.filter((f) => f.dentroParede > 0 || f.colados > 0);
console.log(
  `\n${comProblema.length} fase(s) com problema${comProblema.length ? ': ' + comProblema.map((f) => f.fase).join(', ') : ''}`,
);

await fechar();
const v = [...new Set(erros)];
if (v.length) {
  console.log(`\n${v.length} erro(s) de página:`);
  for (const e of v) console.log(`  ${e}`);
}