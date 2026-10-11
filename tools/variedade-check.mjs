/**
 * Ferramenta de autoria: mostra onde a tabela de variação está fraca.
 *
 * A tabela `VARIACAO_POR_BIOMA` foi escrita à mão e o `variedade.test.ts`
 * aponta a repetição de um tipo por vez — consertar caçando falha por falha é
 * lento e não termina. Esta ferramenta mede a tabela INTEIRA de uma vez e
 * sugere as trocas.
 *
 * NÃO é teste e NÃO altera arquivo: é o `rg` de antes de editar à mão, e o
 * diff da tabela mostra a decisão. As regras que ela cobra são as mesmas do
 * teste; se as duas divergirem, o teste é a verdade e esta está errada.
 *
 * Uso: node tools/variedade-check.mjs
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(RAIZ, 'src', 'systems', 'sprites.ts'), 'utf8');
const cfg = readFileSync(join(RAIZ, 'src', 'config.ts'), 'utf8');

const BIOMAS = ['cidade', 'floresta', 'caverna', 'fabrica', 'pantano', 'castelo', 'vulcao', 'espaco', 'bunker'];

// ── extrai a tabela do fonte (mesma gramática do arquivo) ──
const bloco = src.slice(src.indexOf('VARIACAO_POR_BIOMA'), src.indexOf('Personagem de um inimigo'));
const tabela = {};
for (const b of BIOMAS) {
  const m = bloco.match(new RegExp(`\\n  ${b}:\\s*\\{([^}]*)\\}`));
  tabela[b] = {};
  if (m) for (const p of m[1].matchAll(/(\w+):\s*'(\w+)'/g)) tabela[b][p[1]] = p[2];
}

// ── tipos de inimigo que aparecem nas fases ──
const CHEFES = ['vigia', 'alphaWolf', 'crystalQueen', 'sentinel', 'leviathan', 'reiMutante', 'infernoPrime', 'mothership', 'nucleo'];
const tiposDasFases = [...cfg.matchAll(/enemyTypes:\s*\[([^\]]+)\]/g)]
  .flatMap(m => [...m[1].matchAll(/'(\w+)'/g)].map(x => x[1]));
const COMUNS = [...new Set(tiposDasFases)].filter(t => !CHEFES.includes(t));

const personagens = [...new Set(Object.values(tabela).flatMap(m => Object.values(m)))]
  .concat(Object.keys(tabela).flatMap(b => Object.values(tabela[b])))
  .filter((v, i, a) => a.indexOf(v) === i).sort();

// resolve como o jogo resolve: entrada do bioma, senão o mapa geral, senão zumbi
const geral = {};
for (const m of src.slice(src.indexOf('ENEMY_CHARACTER: Record'), 4000).matchAll(/^\s+(\w+):\s*'(\w+)',/gm)) geral[m[1]] = m[2];
const resolve = (tipo, fase) =>
  (tabela[BIOMAS[fase]]?.[tipo]) || geral[tipo] || 'zombie';

console.log(`biomas: ${BIOMAS.length} · tipos comuns: ${COMUNS.length} · personagens em uso: ${personagens.length}\n`);

const NOME = Object.fromEntries(BIOMAS.map((b, i) => [b, `F${i + 1}`]));
console.log('tipo'.padEnd(16) + BIOMAS.map(b => NOME[b].padStart(9)).join(''));
console.log('-'.repeat(16 + BIOMAS.length * 9));
for (const t of COMUNS) {
  console.log(t.padEnd(16) + BIOMAS.map((b, i) => String(resolve(t, i)).padStart(9)).join(''));
}

// ── 1. estagnação: 4 fases (onde o tipo existe) com o mesmo corpo ──
// O filtro por "fases onde o tipo aparece" é o mesmo do teste: exigir que
// `ufo` varie entre fases que não têm ufo é exigir o impossível, e foi o que
// travou a primeira versão da regra.
console.log('\n── estagnação (mesmo corpo em 4 fases onde o tipo existe) ──');
const fasesDe = (tipo) => {
  const tiposDasFases = [...cfg.matchAll(/enemyTypes:\s*\[([^\]]+)\]/g)]
    .map(m => [...m[1].matchAll(/'(\w+)'/g)].map(x => x[1]));
  return tiposDasFases
    .map((lista, i) => (lista.includes(tipo) ? i : -1))
    .filter(i => i >= 0);
};
let estagnacoes = 0;
for (const t of COMUNS) {
  const fases = fasesDe(t);
  if (fases.length < 4) continue;
  for (let i = 0; i + 3 < fases.length; i++) {
    const janela = fases.slice(i, i + 4);
    const quatro = janela.map(f => resolve(t, f));
    if (quatro.every(c => c === quatro[0])) {
      estagnacoes++;
      console.log(`  ${t}: "${quatro[0]}" nas fases ${janela.map(f => f + 1).join(', ')}`);
    }
  }
}
console.log(estagnacoes ? `  ${estagnacoes} caso(s)` : '  nenhum');

// ── 2. taxa de mudança entre vizinhas ──
let mudam = 0, total = 0;
for (const t of COMUNS) for (let i = 0; i + 1 < BIOMAS.length; i++) {
  total++;
  if (resolve(t, i) !== resolve(t, i + 1)) mudam++;
}
const razao = mudam / total;
console.log(`\n── mudança entre vizinhas: ${(razao * 100).toFixed(0)}% (piso do teste: 45%) ${razao > 0.45 ? 'OK' : 'ABAIXO'} ──`);

// ── 3. biomas com elenco curto ──
console.log('\n── personagens distintos por bioma (piso: 3) ──');
for (const b of BIOMAS) {
  const distintos = new Set(Object.values(tabela[b]));
  console.log(`  ${b.padEnd(9)} ${distintos.size} ${distintos.size >= 3 ? '' : '← ABAIXO'}`);
}

// ── 4. sugestões: para cada estagnação, personagens que quebram o ciclo ──
if (estagnacoes) {
  console.log('\n── sugestão ──');
  for (const t of COMUNS) {
    const fases = fasesDe(t);
    if (fases.length < 4) continue;
    for (let i = 0; i + 3 < fases.length; i++) {
      const janela = fases.slice(i, i + 4);
      const quatro = janela.map(f => resolve(t, f));
      if (!quatro.every(c => c === quatro[0])) continue;
      const vizinhos = new Set(janela.map(f => resolve(t, f)));
      const opcoes = personagens.filter(p => !vizinhos.has(p));
      console.log(`  ${t} fases ${janela.map(f => f + 1).join(', ')}: troque para ${opcoes.slice(0, 3).join(' | ')}`);
    }
  }
}

process.exit(estagnacoes === 0 && razao > 0.45 ? 0 : 1);