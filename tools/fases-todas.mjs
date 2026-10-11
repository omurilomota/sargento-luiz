/**
 * Mede as 9 fases de uma vez e imprime a tabela.
 *
 * É a entrega do FUTURO §1.4. O item dizia que a sessão longa "nunca mede
 * Espaço/Castelo/Bunker" porque o bot morria na Cidade — e a resposta que
 * estava errada era treinar o bot até ele atravessar a campanha. A resposta
 * certa é que **medir uma fase não exige chegar nela**: `irParaFase` abre a
 * fase direto, e o bot é o mesmo em todas — o mesmo HP, a mesma pistola, o
 * mesmo dodge. A comparação entre linhas da tabela vale porque a dificuldade
 * é a única coisa que muda.
 *
 * O bot é o PISO, não a régua de um jogador bom: ele não usa dash, escudo nem
 * fúria. Uma fase onde ele morre na onda 1 é uma fase onde um jogador casual
 * também morre, e isso é o sinal que a tabela precisa dar.
 *
 * Uso: node tools/fases-todas.mjs [--seg 45] [--so 0,3,7]
 */
import { chromium } from 'playwright';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { abrirJogo, criarBot, irParaFase, resumir, RAIZ } from './bot.mjs';

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? Number(process.argv[i + 1]) : d;
};
const SEG = arg('seg', 45);
const SO_RAW = process.argv.includes('--so') ? process.argv[process.argv.indexOf('--so') + 1] : null;
// `Number('0,7')` é NaN, então filtrar pela lista inteira nunca casava e o
// `--so` era silenciosamente ignorado — a varredura rodava as 9 fases mesmo
// quando se pedia 2, e o relatório dizia "Cidade" quando media o Bunker.
const SO = SO_RAW ? SO_RAW.split(',').map((n) => Number(n.trim())) : null;

const jogo = await abrirJogo({ chromium });
const { page, erros, fechar } = jogo;

const nomes = await page.evaluate(() => window.__ashfall.config().fases.map((f) => f.name));
const linhas = [];

for (let i = 0; i < nomes.length; i++) {
  if (SO && !SO.includes(i)) continue;
  const cfg = await irParaFase(page, i);
  const bot = criarBot(page);
  const amostras = await bot.medir(SEG, { aCada: Math.max(5, Math.round(SEG / 6)) });
  await bot.parar();
  const r = resumir(amostras, SEG);
  const linha = {
    i, fase: cfg.fase, hazard: cfg.dificuldade ?? '—', ...r,
  };
  linhas.push(linha);
  const marca = r.morreu ? `morreu em ${r.segundosSobrevividos}s` : `aguentou ${SEG}s`;
  console.log(
    `${String(i + 1).padStart(2)}. ${cfg.fase.padEnd(20)} ${String(cfg.dificuldade ?? '—').padEnd(12)} ` +
    `onda máx ${String(r.ondaMax).padStart(2)}  ${marca.padEnd(20)} ` +
    `dano ${String(r.danoTotal).padStart(4)}  principal: ${r.fontePrincipal}/${r.inimigoPrincipal}`,
  );
}

await fechar();

console.log('\n─── resumo ───');
console.log('fase'.padEnd(22) + 'sobreviveu'.padEnd(12) + 'onda'.padEnd(7) + 'quem matou');
for (const l of linhas) {
  console.log(
    l.fase.padEnd(22) +
    `${l.morreu ? l.segundosSobrevividos + 's' : l.segundosSobrevividos + 's+'}` .padEnd(12) +
    String(l.ondaMax).padEnd(7) +
    `${l.fontePrincipal} ${l.inimigoPrincipal !== '—' ? `(${l.inimigoPrincipal})` : ''}`.slice(0, 34),
  );
}

const destino = join(RAIZ, 'tools', 'fases-medidas.json');
await writeFile(destino, JSON.stringify({ quando: new Date().toISOString(), segundosPorFase: SEG, linhas }, null, 2));
console.log(`\nnúmeros em tools/fases-medidas.json`);
if (erros.length) {
  const v = [...new Set(erros)];
  console.log(`${v.length} erro(s):`);
  for (const e of v) console.log(`  ${e}`);
}