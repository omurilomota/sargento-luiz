/**
 * Sessão longa com telemetria: o harness joga por N minutos e a cada amostra
 * registra HP, onda, inimigos vivos, dano por fonte e um screenshot.
 *
 * Existe porque "o HP cai rápido" e "a bala está deitada" são duas falhas que
 * `tsc` e o teste unitário não pegam: são observações de tela. O jeito de
 * parar de chutar é medir o número.
 *
 * O bot está em `tools/bot.mjs`, compartilhado com `fases-todas.mjs`.
 *
 * Uso:
 *   node tools/session.mjs --min 3              # campanha inteira
 *   node tools/session.mjs --min 2 --fase 7     # abre direto no Espaço
 */
import { chromium } from 'playwright';
import { join } from 'path';
import { abrirJogo, criarBot, irParaFase, resumir, SHOTS } from './bot.mjs';

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? Number(process.argv[i + 1]) : d;
};
const MINUTOS = arg('min', 3);
const LARGURA = arg('w', 1280);
const ALTURA = arg('h', 720);
const AMOSTRA_S = arg('aCada', 10);
/** Começa direto nesta fase (0 = Cidade, 7 = Espaço, 8 = Bunker). `-1` = campanha. */
const FASE = arg('fase', -1);
const SEGUNDOS = MINUTOS * 60;

const jogo = await abrirJogo({ chromium, largura: LARGURA, altura: ALTURA });
const { page, erros, fechar } = jogo;

if (FASE >= 0) {
  const cfg = await irParaFase(page, FASE);
  console.log(`medindo direto: fase ${cfg.indice} — ${cfg.fase} (dificuldade ${cfg.dificuldade ?? '—'})\n`);
}

const bot = criarBot(page, { largura: LARGURA, altura: ALTURA });
const amostras = await bot.medir(SEGUNDOS, {
  aCada: AMOSTRA_S,
  screenshot: 'sess',
  onAmostra: (dados, t) => {
    const d = dados.dano;
    const fontes = d
      ? Object.entries(d.porFonte).filter(([, v]) => v > 0)
        .map(([k, v]) => `${k}:${Math.round(v)}`).join(' ')
      : '';
    console.log(
      `t=${t.toFixed(1)}s  hp=${dados.hp}/${dados.maxHp}  onda=${dados.onda}  ` +
      `inimigos=${dados.inimigos}  balas=${dados.balas}  kills=${dados.kills}  ` +
      `estado=${dados.estado}  moedas=${dados.moedas}  dano[${fontes}]`,
    );
  },
});
await bot.parar();
await fechar();

const r = resumir(amostras, SEGUNDOS);
console.log(`\n${amostras.length} amostras em ${MINUTOS} min`);
if (r) {
  console.log(`HP ${r.hp0} -> ${r.hpFim}   onda máxima ${r.ondaMax}   abates ${r.kills}`);
  console.log(`sobreviveu ${r.segundosSobrevividos}s${r.morreu ? ' (morreu)' : ' (aguentou a sessão)'}`);
  console.log(`dano por fonte (total ${r.danoTotal}):`);
  const ultimo = amostras[amostras.length - 1]?.dano;
  for (const [fonte, v] of Object.entries(ultimo?.porFonte ?? {}).sort((a, b) => b[1] - a[1])) {
    if (v > 0) console.log(`  ${fonte.padEnd(10)} ${Math.round(v)}`);
  }
  const tipos = Object.entries(ultimo?.porTipo ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (tipos.length) {
    console.log(`inimigos que mais bateram:`);
    for (const [tipo, v] of tipos) console.log(`  ${tipo.padEnd(14)} ${Math.round(v)}`);
  }
}
console.log(`screenshots: ${SHOTS}`);
if (erros.length) {
  const v = [...new Set(erros)];
  console.log(`\n${v.length} erro(s):`);
  for (const e of v) console.log(`  ${e}`);
}