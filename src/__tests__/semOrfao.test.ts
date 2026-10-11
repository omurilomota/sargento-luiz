import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * PORTA Nº 5 DO PORTÃO ANTI-IA — "todo sistema tem chamador".
 *
 * Os outros 4 portões pegam FORMA: `arc()` em `renderer.ts`, tics em `story.ts`,
 * `sfx*` sem arquivo, asset quebrado no `dist/`. Este pega SUBSTÂNCIA — código
 * que existe, é vendido ao jogador, e não faz nada.
 *
 * Não é teoria. Em 2026-10-11 o sweep que gerou este arquivo accuseu:
 *   - `mente_t3` "Sorte +1" vendia `luck`, e `luck` não tinha LEITOR nenhum:
 *     o jogador pagava 150 moedas por nada;
 *   - `critMult` estava no registro de stats e o crítico estava hardcoded 1.5
 *     no `shoot()` — mexer no stat era inócuo em silêncio;
 *   - `armorMax` era lido por `applyStat` e escrito por NINGUÉM, então o teto
 *     de armadura 0.5 nunca abria;
 *   - os 8 combos checavam ids que a escada nunca produzia (7 dos 8 só
 *     disparavam em save antigo);
 *   - `ordenarEventosPorSorte`, `temSortudo` (duplicata), `sfxHitStop`,
 *     `setPlayer2Health` e `checkEnemyBulletNpcCollision` não tinham chamador.
 *
 * Nenhum deles aparece em `tsc`, em teste de geometria, nem num PNG.
 *
 * ── A regra, e por que ela é essa ──────────────────────────────────────
 * Um export é órfão quando NÃO é citado: em outro arquivo de produção, dentro
 * do próprio módulo (fora da linha `export`), nem em teste. Testes contam como
 * chamador porque a superfície de observação deles é legítima — `getPierceCount`
 * só o teste lê, e é exatamente para isso que ele existe.
 *
 * `__tests__` fica fora da contagem de "produção" de propósito: se o próprio
 * teste contasse como uso, o portão aprovaria tudo que só ele exercita — que é
 * o defeito que ele existe para pegar.
 */

const SRC = join(__dirname, '..');
const SUBDIR = ['', 'entities', 'systems', 'ui', 'core'];

function arquivosDeProducao(): string[] {
  const out: string[] = [];
  for (const sub of SUBDIR) {
    const pasta = sub ? join(SRC, sub) : SRC;
    for (const nome of readdirSync(pasta)) {
      if (!nome.endsWith('.ts') || nome.endsWith('.d.ts')) continue;
      const rel = sub ? `${sub}/${nome}` : nome;
      if (rel.includes('__tests__')) continue;
      out.push(rel);
    }
  }
  return out.filter(rel => statSync(join(SRC, rel)).isFile());
}

const FONTES = arquivosDeProducao().map(rel => ({ rel, texto: readFileSync(join(SRC, rel), 'utf8') }));
const CONTEUDO = FONTES.map(f => f.texto).join('\n');
const TESTES = readdirSync(join(SRC, '__tests__'))
  .filter(n => n.endsWith('.ts'))
  .map(n => readFileSync(join(SRC, '__tests__', n), 'utf8'))
  .join('\n');

/**
 * Exports que hoje só o teste toca, com o motivo. Não é dívida: é a superfície
 * de observação dos testes (ler um contador, injetar `Math.random`, ler uma
 * geometria). Entrar aqui é uma decisão; a lista não cresce sem motivo escrito.
 */
const SO_DE_TESTE: Record<string, string> = {
  resetPowerUps: 'zera os power-ups do chão; só o teste usa',
  getJamTimer: 'leitura do timer de engasgo; superfície de teste',
  getPierceCount: 'leitura do pierce efetivo; superfície de teste',
  useAmmo: 'gasta munição fora do tiro; usado para simular no teste',
  getArmorLevel: 'leitura da armadura efetiva; superfície de teste',
  getBlockingProps: 'consulta de cobertura; superfície de teste',
  getNests: 'consulta dos ninhos; superfície de teste',
  isReachable: 'checagem de alcançabilidade do grid; superfície de teste',
  CONTAGOS_POR_ESTILO: 'contrato de tamanho de sprite por família; assets.test',
  COMBO_LIMITE_DANO: 'teto de dano exportado SÓ para o teste travar o limite',
  COMBO_LIMITE_CADENCIA: 'piso de cadência exportado SÓ para o teste travar o limite',
  getAllAchievements: 'estado de desbloqueio; achievements.test conta os marcados',
  getEquippedSnapshot: 'peças equipadas por arma, para o save; gravado no enterShop',
  restoreEquipped: 'reidrata as peças equipadas no round-trip do save',
  getInventorySnapshot: 'mochila de peças, para o save; gravado no enterShop',
  restoreInventory: 'reidrata a mochila de peças no round-trip do save',
  deleteSave: 'apaga o save; usado no teste de "sem save" e na tela de menu',
  characterFileExists: 'checagem de arquivo de personagem; assets.test',
  weaponFileExists: 'checagem de arquivo de arma; assets.test',
  skipCutsceneText: 'pula a fala atual da cutscene; só o teste encurta a cena',
  setBossRandom: 'injeta Math.random no boss; usado só por boss.test',
  getPendingReveals: 'leitura das caixas reveladas; superfície de teste',
  matarPlayer2: 'derruba o P2 na hora; harness de 2P prova o fim de partida',
  restoreUpgrades: 'reidrata os degraus no continue; chamado por startFromSave',
  resetDiaryForTest: 'zera os desbloqueios do diário; só o teste da sorte usa',
};

/** Extrai `export function N` e `export const N` do fonte. */
function exportsDe(texto: string): string[] {
  const nomes = new Set<string>();
  for (const m of texto.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)) nomes.add(m[1]);
  for (const m of texto.matchAll(/export\s+const\s+(\w+)/g)) nomes.add(m[1]);
  return [...nomes];
}

const RE = (nome: string) => new RegExp(`\\b${nome}\\b`, 'g');

interface Caso { nome: string; rel: string; usoInterno: number; usoOutros: number; usoTeste: number }

const CASOS: Caso[] = FONTES.flatMap(f => exportsDe(f.texto).map(nome => {
  const outros = FONTES.filter(o => o.rel !== f.rel).map(o => o.texto).join('\n');
  return {
    nome,
    rel: f.rel,
    // a própria declaração conta 1; mais que isso é uso de verdade
    usoInterno: (f.texto.match(RE(nome)) ?? []).length - 1,
    usoOutros: (outros.match(RE(nome)) ?? []).length,
    usoTeste: (TESTES.match(RE(nome)) ?? []).length,
  };
}));

describe('semOrfao: todo sistema tem chamador', () => {
  it('a extração está viva (o teste morde)', () => {
    // Se o regex de export quebrar, a lista esvazia e o portão aprova tudo em
    // silêncio — foi assim que 62 linhas de diálogo ficaram mortas.
    expect(CASOS.length, 'exports extraídos').toBeGreaterThan(200);
    expect(new Set(CASOS.map(c => c.nome)).size).toBeGreaterThan(150);
  });

  it('a lista SO_DE_TESTE bate com o que existe', () => {
    // Anchor que aponta para código removido é dívida que ninguém mais vê.
    const nomes = new Set(CASOS.map(c => c.nome));
    for (const [nome, motivo] of Object.entries(SO_DE_TESTE)) {
      expect(motivo.length, `âncora "${nome}" sem motivo`).toBeGreaterThan(10);
      expect(nomes.has(nome), `âncora "${nome}" não existe mais`).toBe(true);
    }
  });

  it('nenhum export de produção está órfão', () => {
    const orfaos = CASOS
      .filter(c => c.usoInterno === 0 && c.usoOutros === 0 && c.usoTeste === 0)
      .map(c => `${c.nome} (${c.rel})`);
    expect(
      orfaos,
      'export sem nenhum chamador. Ligue o chamador, remova o código, ou ' +
      'declare em SO_DE_TESTE com o motivo.',
    ).toEqual([]);
  });

  it('todo export citado só por teste está declarado', () => {
    // Um item novo nesta lista é uma decisão: o diff mostra. O teste impede que
    // alguém simply declare o problema.
    const naoDeclarados = CASOS
      .filter(c => c.usoInterno === 0 && c.usoOutros === 0 && c.usoTeste > 0)
      .filter(c => !SO_DE_TESTE[c.nome])
      .map(c => `${c.nome} (${c.rel})`);
    expect(naoDeclarados, 'export só de teste e não declarado em SO_DE_TESTE').toEqual([]);
  });

  it('o portão morde: ele enxerga código que TEM chamador', () => {
    // Prova de que a contagem funciona, no padrão dos outros 4 portões. Se
    // `usoOutros` parasse de contar, tudo cairia no "órfão" e este teste — e
    // só ele — denunciaria.
    const caso = CASOS.find(c => c.nome === 'getShopLayout');
    expect(caso, 'getShopLayout sumiu da extração').toBeTruthy();
    expect(caso!.usoOutros + caso!.usoInterno, 'getShopLayout tem chamador de verdade').toBeGreaterThan(0);
    const drawShop = CASOS.find(c => c.nome === 'drawShop');
    expect(drawShop!.usoOutros, 'drawShop é chamado pelo main').toBeGreaterThan(0);
  });
});

/**
 * Stat sem leitor: `applyStat('luck', ...)` escrevia num número que ninguém
 * consultava. Foi o buraco de 150 moedas do `mente_t3`.
 */
describe('semOrfao: todo stat tem leitor e escritor', () => {
  const FONTE_STATS = readFileSync(join(SRC, 'core', 'stats.ts'), 'utf8');
  // a união é `| 'id'` até o penúltimo e `| 'id';` no fim — as duas formas
// entram, senão o último stat do registro escapava do portão.
const CORPO_UNIAO = FONTE_STATS.slice(FONTE_STATS.indexOf('export type StatId'));
const IDS: string[] = [...CORPO_UNIAO.slice(0, CORPO_UNIAO.indexOf(';')).matchAll(/'(\w+)'/g)].map(m => m[1]);

  it('a lista de StatId foi extraída', () => {
    // 12 ids: damageMult, critChance, critMult, pierce, reloadSpeed, armor,
    // armorMax, regen, coinMult, xpMult, luck, dashCooldown.
    expect(IDS.length, 'ids no registro de stats').toBe(12);
  });

  it('todo StatId tem leitor em produção', () => {
    // `armorMax` não é lido por `getStat('armorMax')`: ele é o TETO, lido pelo
    // clamp de `applyStat` (`stats.armorMax`). A regra aceita as duas formas de
    // ler, senão o próprio teto vira falso positivo.
    const semLeitor = IDS.filter(id =>
      !new RegExp(`getStat\\('${id}'\\)`).test(CONTEUDO)
      && !new RegExp(`stats\\.${id}\\b`).test(FONTE_STATS)
    );
    expect(
      semLeitor,
      'stat escrito e nunca lido: o perk cobra por um número que o jogo ignora',
    ).toEqual([]);
  });

  it('todo StatId tem caminho de escrita', () => {
    // A escada escreve por variável (`applyStat(t.statId, ...)`), então a
    // chamada genérica conta; o que não pode é um stat que NENHUMA das duas
    // formas alcança — é assim que `armorMax` passou: lido no clamp, escrito
    // por ninguém.
    const temGenerico = /applyStat\(\s*\w+\.statId/.test(CONTEUDO);
    const semEscritor = IDS.filter(id =>
      !new RegExp(`applyStat\\('${id}'`).test(CONTEUDO) && !temGenerico
    );
    expect(semEscritor, 'stat lido mas nunca escrito: fica parado no valor inicial').toEqual([]);
  });

  it('armorMax tem escritor de verdade (o teto que nunca abria)', () => {
    // Trava específica do defeito de 2026-10-11: o teto de armadura era lido
    // por `applyStat` e escrito por ninguém, então os 50% eram o máximo
    // absoluto. Se `corpo_t5` voltar a ser vida, este teste acusa.
    expect(
      new RegExp(`statId: 'armorMax'`).test(readFileSync(join(SRC, 'systems', 'perks.ts'), 'utf8')),
      'nenhum degrau escreve armorMax — o teto de 0.5 nunca abre',
    ).toBe(true);
  });
});