/**
 * src/systems/sprites.ts
 *
 * Cache de sprites do pack Kenney Top-down Shooter (CC0).
 *
 * Os personagens têm 6 poses (`stand`/`hold`/`gun`/`machine`/`reload`/
 * `silencer`) e as armas têm 3 classes visuais de cano. Os tiles do pack têm
 * numeração com buracos (não existem tile_054, tile_081, tile_162…), então só
 * os números realmente existentes e curados visualmente são carregados.
 */

/** Cache de sprites carregadas */
const spriteCache: Map<string, HTMLImageElement> = new Map();

/** Se o sistema de sprites está habilitado */
let spritesEnabled = false;

/** Tipos de pose disponíveis */
export type Pose = 'stand' | 'hold' | 'gun' | 'machine' | 'reload' | 'silencer';

/** Prefixo de arquivo de cada personagem */
const CHARACTERS: Record<string, string> = {
  survivor: 'Survivor 1/survivor1',
  manBlue: 'Man Blue/manBlue',
  manBrown: 'Man Brown/manBrown',
  manOld: 'Man Old/manOld',
  hitman: 'Hitman 1/hitman1',
  soldier: 'Soldier 1/soldier1',
  robot: 'Robot 1/robot1',
  woman: 'Woman Green/womanGreen',
  zombie: 'Zombie 1/zoimbie1',
};

/**
 * Centro do corpo dentro da sprite, em pixels do arquivo.
 * Medido nos arquivos: o corpo ocupa x≈1..32 e o cano vai até x≈49, então
 * pivotar pela imagem inteira faria o personagem girar em volta do cano.
 */
const BODY_PIVOT_X = 17;
const BODY_PIVOT_Y = 21;

/** Tiles do Kenney que realmente existem e servem de chão (curadoria visual) */
export const TILE_NUMBERS = [
  1, 2, 3, 4, 13, 15, 17, 18, 19, 20, 31, 32, 35, 36, 37, 40, 41, 58, 59, 62, 63, 64, 67, 68, 76, 77, 79, 80, 86, 89, 90, 91, 92, 93, 95, 169, 178, 334, 340, 349, 350, 361, 362, 363, 376, 377, 398,
  // objetos de decoração (copas, folhas, pedras) usados nas paredes/decor do bioma
  134, 181, 209, 238, 239, 316,
  // superfícies de parede por bioma (WALL_TILES em terrain.ts)
  43, 44, 45, 46, 96, 97, 98, 99, 110, 111, 112, 113,
  163, 164, 165, 166, 172, 173, 174, 175, 335, 336, 337,
  415, 416, 417, 418, 489, 490, 491, 492,
  // decor de chão por bioma (spriteFor em drawDecor)
  129, 133, 180, 292, 333,
  // objetos de hazard (HAZARD_SPRITES em terrain.ts)
  260, 265, 316, 319, 320, 264, 268,
  // Sprint 3 (opção A): tábua+faca p/ spikes, anel+aviso p/ electric
  197, 198, 267, 268, 511,
  // sprites de prop (PROP_SPRITES em props.ts)
  130, 156, 157, 158, 182, 183,
  // copas e arbusto do fundo de cutscene (CENAS_CUTSCENE em terrain.ts):
  // 208/209 são as duas metades da mesma copa, 186 é a de outono
  186, 208,
];

const BASE = 'assets/sprites/topdown-shooter/PNG';

/**
 * Tiles de piso e parede com textura real (Screaming Brain Studios,
 * "Top Down Dungeon Pack", CC0).
 *
 * O pack Kenney do jogo é de personagem, não de terreno: medido, 453 dos 520
 * tiles são completamente chapados, e é essa chapada que produz a costura de
 * 64px visível no chão e a "treliça de emendas" da capa do menu. Este pack é
 * 64x64 nativo (o do Kenney Roguelike era 16px e viraria borrão no upscale),
 * seamless, com 8 variações por material.
 *
 * Fatiado por `tools/extract_tiles.py`.
 */
export const DUNGEON_BASE = 'assets/sprites/dungeon';

/** Materiais de piso disponíveis, 8 tiles cada. */
export const DUNGEON_FLOORS = [
  'piso_pedra', 'piso_pedra2', 'piso_terra', 'piso_terra2', 'piso_areia',
  'piso_grama', 'piso_metal', 'piso_madeira',
] as const;

/** Materiais de parede disponíveis, 16 tiles cada. */
export const DUNGEON_WALLS = [
  'parede_pedra', 'parede_tijolo', 'parede_concreto',
  'parede_metal', 'parede_terra', 'parede_areia',
] as const;

/** Quantos tiles cada material tem no disco. */
export const DUNGEON_COUNT = { piso: 8, parede: 16 } as const;

/**
 * Partículas (Kenney Particle Pack, CC0) para tiro, muzzle flash, fumaça e
 * faísca. Enquanto estes sprites não existed, todo projétil era um
 * `ctx.arc()` em `renderer.ts` — 30 arcos por frame numa tela cheia de tiro.
 */
export const PARTICLE_BASE = 'assets/sprites/particles';

export const PARTICLE_SPRITES = [
  'muzzle_01', 'muzzle_02', 'muzzle_03', 'muzzle_04', 'muzzle_05',
  'spark_01', 'spark_02', 'spark_03', 'spark_04', 'spark_05',
  'smoke_01', 'smoke_02', 'smoke_03', 'smoke_04', 'smoke_05',
  'flare_01', 'scorch_01', 'scratch_01', 'slash_01',
] as const;

/**
 * Base do pack de armas (Kay Lousberg, "2D Guns", CC0).
 *
 * O pack Kenney do jogo tem 3 sprites de arma e 12 armas no jogo, então 4
 * armas por desenho. Este pack tem 6 tipos + 3 tamanhos de bala, o que dá as
 * 6 famílias de arma do design. Estilo é o ponto de atenção: é cartoon
 * vetorial escuro, e o pack Kenney é mais suave — por isso `assets.test.ts`
 * trava que todo arquivo existe, mas o resto é conferido em jogo.
 */
const WEAPON_BASE = 'assets/sprites/weapons';

/**
 * Projétil por arma.
 *
 * `BULLET_FAMILY` (abaixo) mapeia 12 armas em 3 cartuchos do Kay Lousberg,
 * então a RPG atirava o mesmo projétil da Pistola — o tiro não dizia o que a
 * arma fazia. Agora cada arma dispara o projétil que ela de fato usa: foguete,
 * feixe de plasma, orbe geloso, feixe concentrado e estilhaço.
 *
 * A chave continua sendo o NOME da arma em `WEAPONS`, porque `Weapon` não tem
 * campo de projétil e adicionar um só para isto seria um campo usado uma vez.
 *
 * Os sprites `plasma`/`orbe`/`feixe`/`estilhaco` saíram do Kenney Particle Pack
 * (CC0), o mesmo autor do pack de personagens. `foguete` é o único desenhado:
 * nenhum dos dois packs tem foguete, e RPG/Granada sem foguete lê como pistola
 * de dano alto.
 */
export const BULLET_FAMILY: Record<string, string> = {
  Pistola: 'small_bullet',
  Shotgun: 'estilhaco',
  Metralhadora: 'small_bullet',
  Sniper: 'large_bullet',
  Laser: 'feixe',
  RPG: 'foguete',
  Raios: 'plasma',
  Gel: 'orbe',
  Granada: 'estilhaco',
  Mina: 'orbe',
  BFG: 'plasma',
  'M. Quebrada': 'small_bullet',
  Destruidor: 'estilhaco',
};

/** Base dos projéteis que não são do pack de armas. */
const BULLET_EXTRA_BASE = 'assets/sprites/bullets';
const PROP_BASE = 'assets/sprites/props';

/**
 * Itens (Kenney "Platformer Art Deluxe", CC0): moeda e gemas de power-up.
 *
 * A moeda era um `ctx.arc()` mostarda com um "$" desenhado por cima, e o item
 * de power-up um círculo com o símbolo — arte de programador no objeto mais
 * visto do jogo. As gemas cobrem as 4 famílias de tom da paleta; o símbolo
 * continua na frente porque ele é texto de UI (distigue `botas` de `reflexos`),
 * não desenho.
 */
const ITEM_BASE = 'assets/sprites/items';

export const ITEM_SPRITES = ['coinGold', 'gemRed', 'gemGreen', 'gemBlue', 'gemYellow'] as const;

/** Projéteis fora do pack Kay Lousberg. */
export const BULLET_EXTRA = ['foguete', 'plasma', 'orbe', 'feixe', 'estilhaco'];

/** Props com sprite próprio (não vem do tileset): hoje só o foguete do Castelo. */
export const PROP_EXTRA = ['foguete'];

/**
 * Sprite de arma por nome, para a loja e o HUD. 6 famílias para 12 armas: as
 * armas de mesma família compartilham desenho, que é honesto — RPG e Granada
 * são o mesmo cano com munição diferente.
 */
export const WEAPON_ICON: Record<string, string> = {
  Pistola: 'pistol',
  Shotgun: 'shotgun',
  Metralhadora: 'smg',
  Sniper: 'sniper',
  Laser: 'assaultrifle',
  RPG: 'assaultrifle',
  Raios: 'revolver',
  Gel: 'revolver',
  Granada: 'grenade',
  Mina: 'grenade',
  BFG: 'assaultrifle',
  'M. Quebrada': 'pistol',
  Destruidor: 'assaultrifle',
};

/** As 3 famílias de projétil que existem no pack. */
export const BULLET_SPRITES = ['small_bullet', 'medium_bullet', 'large_bullet'] as const;

/** As 6 armas do pack, uma por família. `weapon2` é a cor alternativa. */
export const WEAPON_SPRITES = [
  'pistol', 'revolver', 'shotgun', 'sniper', 'smg', 'assaultrifle', 'grenade',
] as const;

/**
 * Os 9 personagens do pack, em nome curto.
 *
 * Consumido pelo `variedade.test.ts` para garantir que toda entrada da tabela
 * por bioma aponta para um personagem REAL: um erro de digitação ali seria um
 * 404 silencioso com o inimigo sumindo da tela (`getSprite` devolve `null` e o
 * `drawEnemyShape` cai no círculo de fallback — some a silhueta, não o corpo).
 */
export const CHARACTER_NAMES = Object.keys(CHARACTERS);

/** As 6 poses que o pack tem por personagem */
export const POSES: Pose[] = ['stand', 'hold', 'gun', 'machine', 'reload', 'silencer'];

/** As 3 classes visuais de cano */
export const WEAPON_CLASSES = ['gun', 'machine', 'silencer'] as const;

/**
 * Nome do arquivo de tile no pack Kenney.
 * O pad é de 2 dígitos, não 3: `tile_01.png` até `tile_99.png` e `tile_100.png`
 * em diante. Com pad 3 todo tile de 1 a 99 dá 404 e o chão cai no fallback —
 * exatamente o que aconteceu antes deste teste existir.
 */
export function tileFileName(n: number): string {
  return `tile_${String(n).padStart(2, '0')}.png`;
}

/**
 * Mapeamento de tipos de inimigo para o personagem do pack.
 * Exportado para o teste de asset: um tipo sem entrada aqui aparece com o sprite
 * do zumbi, sem aviso — foi assim que os 9 chefes viraram zumbis.
 *
 * Este é o mapa de REFERÊNCIA (sem fase). O que o jogo usa é
 * `getEnemyCharacter(tipo, fase)`, que consulta `VARIACAO_POR_BIOMA` primeiro e
 * cai aqui. Este mapa continua exportado porque o teste de asset precisa da
 * lista completa de tipos → algum personagem.
 */
export const ENEMY_CHARACTER: Record<string, string> = {
  grunt: 'zombie',
  // O único personagem do pack que só aparece num chefe (MOTHERSHIP, fase 8).
  // O mutante vive nas fases 1-2, então os dois nunca coexistem na tela.
  mutante: 'manBlue',
  runner: 'manBrown',
  tank: 'manOld',
  bat: 'zombie',
  robot: 'robot',
  drone: 'robot',
  slime: 'zombie',
  lavaSlime: 'zombie',
  mosquito: 'zombie',
  knight: 'soldier',
  archer: 'hitman',
  mage: 'woman',
  fireElemental: 'manBrown',
  magmaGolem: 'manOld',
  inferno: 'hitman',
  ufo: 'robot',
  asteroid: 'manOld',
  alien: 'zombie',
  frog: 'zombie',
  crystal: 'woman',
  spitter: 'zombie',

  // Os 9 chefes. Antes nenhum estava aqui, então os 9 caíam no fallback
  // 'zombie' e todo chefe do jogo era desenhado como um zumbi genérico — o
  // mesmo sprite do grunt, só maior. `survivor` é o jogador e nunca entra
  // aqui; sobram 7 personagens para 9 chefes, então dois compartilham.
  vigia: 'soldier',            // guarda de cidade em pé numa cidade que caiu
  alphaWolf: 'manBrown',       // a fera mais terrosa do pack
  crystalQueen: 'woman',       // mesma persona do cristal da Caverna
  sentinel: 'robot',           // a máquina da fábrica
  leviathan: 'manOld',         // criatura grande e velha do pântano
  reiMutante: 'hitman',        // o rei encapuzado
  infernoPrime: 'zombie',      // elemental apodrecido: verde e queimado
  mothership: 'manBlue',       // aço frio do vácuo
  nucleo: 'soldier',           // comando militar do bunker
  // A biomaquina é gente costurada com peça: o `robot` do Bunker. A entrada
  // aqui é obrigatória — sem ela o `assets.test.ts` acusa tipo sem sprite, e
  // sem sprite ela cai no fallback `zombie`, que é o zumbi que ela deveria
  // parecer ter costurado.
  biomaquina: 'robot',
  // O ROGÉRIO INFECTADO (H2): o corpo é o DELE — manBrown, o mesmo que
  // nas ondas vira `runner` — porque a batalha é contra o amigo, e o jogador
  // precisa reconhecer quem está matando.
  rogerioInf: 'manBrown',
  // Os 7 chefes das fases novas (2026-10-14): cada um com silhueta própria
  pedagiario: 'hitman',
  cirurgiao: 'manOld',
  maquinista: 'zombie',
  gargula: 'robot',
  torre: 'zombie',
  transformador: 'robot',
  capitao: 'soldier',
};

/** Os 9 biomas, na ordem das fases. */
export const BIOMAS = [
  'cidade', 'rodovia', 'floresta', 'hospital', 'caverna', 'fabrica',
  'trens', 'ponte', 'pantano', 'refinaria', 'castelo', 'subestacao',
  'vulcao', 'porto', 'espaco', 'bunker',
] as const;
export type Bioma = typeof BIOMAS[number];

/**
 * Personagem de cada tipo de inimigo, POR BIOMA.
 *
 * Por que isto existe: o pack tem 9 personagens e o jogo tem 24 tipos de
 * inimigo + 9 chefes. No mapa único, `zombie` atendia 9 inimigos e `robot`
 * outros 4 — o jogo anunciava 33 inimigos e desenhava 9 silhuetas. Trocar de
 * fase mantinha o zumbi na tela, e a variação que o jogador sente ("lugar
 * novo") não existia.
 *
 * A regra de composição: cada bioma tem 3-4 personagens "de casa" e o resto é
 * sorteado do elenco restante pelo PRÓPRIO TIPO, de forma estável (hash), então
 * o mesmo tipo no mesmo bioma sempre dá o mesmo personagem — sem `Math.random`,
 * que faria a tela piscar entre quadros. `variedade.test.ts` trava as duas
 * propriedades: nenhum par vizinho de bioma repete personagem, e o mesmo tipo
 * em fases diferentes não sai com o mesmo corpo.
 *
 * Só dado: nenhuma linha aqui desenha, então o débito do `semDesenho` não
 * cresce (regra 15).
 */
export const VARIACAO_POR_BIOMA: Record<Bioma, Record<string, string>> = {
  // 1 CIDADE — predominantemente `zombie`, com o metal do que restou da cidade
  cidade: {
    grunt: 'zombie', runner: 'manBrown', bat: 'zombie', slime: 'zombie',
    drone: 'robot', mosquito: 'zombie', robot: 'soldier', spitter: 'zombie',
    mutante: 'manBlue', tank: 'manOld', alien: 'zombie', crystal: 'woman',
    frog: 'manBrown',
  },
  // 2 RODOVIA — quem ficou preso no trânsito
  rodovia: {
    grunt: 'manOld', runner: 'hitman', bat: 'woman',
    tank: 'soldier', spitter: 'manBrown', mutante: 'manBlue',
  },
  // 3 FLORESTA — madeira e o corpo de quem trabalhava na roça: `manBrown` domina
  floresta: {
    grunt: 'manBrown', runner: 'soldier', bat: 'manBrown', slime: 'zombie',
    mosquito: 'woman', alien: 'manBrown', tank: 'manOld', spitter: 'woman',
    mutante: 'manOld', crystal: 'manBrown', lavaSlime: 'manBrown', drone: 'robot',
  },
  // 4 HOSPITAL — o que a medicina não curou: `woman` (enfermeira) e `manOld` (paciente)
  hospital: {
    grunt: 'woman', spitter: 'manOld', tank: 'hitman', slime: 'zombie',
    bat: 'woman', mutante: 'manBlue',
  },
  // 5 CAVERNA — pedra e escuro: `manOld` e o que desceu da superfície
  caverna: {
    grunt: 'manOld', runner: 'zombie', bat: 'zombie', slime: 'woman',
    crystal: 'woman', mosquito: 'manOld', drone: 'soldier', robot: 'robot',
    mutante: 'manBlue', tank: 'soldier', spitter: 'zombie', alien: 'manOld',
  },
  // 4 FÁBRICA — a máquina que ainda anda: metal domina
  fabrica: {
    grunt: 'robot', robot: 'manBlue', drone: 'manBlue', tank: 'soldier',
    spitter: 'manBlue', bat: 'robot', runner: 'robot', slime: 'soldier',
    mutante: 'manBlue', alien: 'robot', mosquito: 'robot', crystal: 'woman',
  },
  // 7 PÁTIO DE TRENS — ferrugem e ferro-velho
  trens: {
    grunt: 'hitman', robot: 'zombie', drone: 'manBlue', mutante: 'soldier',
    bat: 'robot', tank: 'manOld',
  },
  // 8 PONTE — o que anda no cabo de aço
  ponte: {
    bat: 'hitman', spitter: 'soldier', crystal: 'robot',
    grunt: 'woman', mutante: 'zombie',
  },
  // 9 PÂNTANO — o que afunde e o que não afunde
  pantano: {
    grunt: 'zombie', slime: 'zombie', frog: 'manBrown', bat: 'woman',
    mosquito: 'manOld', tank: 'manBrown', alien: 'manOld', spitter: 'manBrown',
    mutante: 'manBrown', drone: 'soldier', robot: 'manBlue', crystal: 'manOld',
  },
  // 10 REFINARIA — fogo industrial
  refinaria: {
    grunt: 'manOld', fireElemental: 'hitman', magmaGolem: 'soldier',
    runner: 'zombie', tank: 'woman', bat: 'manBrown',
    lavaSlime: 'manBrown', inferno: 'zombie',
  },
  // 11 CASTELO — guarda de muro: `soldier` e `hitman`
  castelo: {
    grunt: 'soldier', runner: 'hitman', knight: 'soldier', tank: 'manOld',
    archer: 'hitman', bat: 'manBrown', spitter: 'hitman', mosquito: 'zombie',
    mutante: 'manBlue', slime: 'soldier', alien: 'zombie', drone: 'soldier',
    robot: 'hitman',
  },
  // 12 SUBESTAÇÃO — faísca e metal: `robot` domina
  subestacao: {
    drone: 'manBlue', crystal: 'hitman', ufo: 'zombie',
    grunt: 'robot', tank: 'soldier', mutante: 'woman',
  },
  // 13 VULCÃO — queimado: o pack não tem vermelho, então quem desceu é
  // `manBrown` (lama) e `manOld` (ressecado)
  vulcao: {
    grunt: 'manBrown', tank: 'manOld', magmaGolem: 'manOld', alien: 'woman',
    runner: 'soldier', bat: 'zombie', spitter: 'manBrown', slime: 'manBlue',
    mutante: 'manOld', fireElemental: 'manBrown', inferno: 'soldier',
    mosquito: 'zombie', drone: 'robot', robot: 'soldier',
  },
  // 14 PORTO — o que desembarcou: `manBlue` (marinheiro) e `soldier` (porto)
  porto: {
    slime: 'manBlue', ufo: 'hitman', fireElemental: 'soldier',
    grunt: 'zombie', bat: 'manOld', mutante: 'manBrown', tank: 'soldier',
  },
  // 15 ESPAÇO — nada orgânico: `robot`/`manBlue` (aço frio do vácuo)
  espaco: {
    grunt: 'manBlue', ufo: 'robot', drone: 'robot', alien: 'soldier',
    runner: 'robot', tank: 'manBlue', asteroid: 'soldier', spitter: 'robot',
    mutante: 'manBlue', bat: 'manBrown', mosquito: 'robot', crystal: 'manBlue',
    robot: 'soldier',
  },
  // 16 BUNKER — comando militar cercado
  bunker: {
    grunt: 'soldier', robot: 'robot', drone: 'hitman', tank: 'manOld',
    runner: 'zombie', bat: 'soldier', spitter: 'soldier', alien: 'woman',
    mutante: 'manBlue', slime: 'soldier', mosquito: 'soldier', crystal: 'woman',
    // A biomaquina é gente costurada com peça: o `robot` do próprio bioma,
    // que já é a silhueta de máquina do Bunker.
    biomaquina: 'robot',
  },
};

/**
 * Personagem de um inimigo, por bioma.
 *
 * `tipo` que não tem entrada no bioma cai no `ENEMY_CHARACTER` (o mapa de
 * referência) e, no fim, no `zombie`. `fase` fora de 0..8 cai no mapa de
 * referência — um índice errado não pode apagar a silhueta do inimigo.
 */
export function getEnemyCharacter(enemyType: string, fase = -1): string {
  const bioma = BIOMAS[fase];
  if (bioma) {
    const doBioma = VARIACAO_POR_BIOMA[bioma][enemyType];
    // a checagem no `CHARACTER_NAMES` é o que impede um erro de digitação na
    // tabela de virar 404 silencioso: sem ela, `getSprite` devolveria `null` e
    // o inimigo cairia no círculo de fallback, sumindo a silhueta sem aviso.
    if (doBioma && CHARACTER_NAMES.includes(doBioma)) return doBioma;
  }
  const geral = ENEMY_CHARACTER[enemyType];
  return geral && CHARACTER_NAMES.includes(geral) ? geral : 'zombie';
}

/**
 * Monta a lista de caminhos a carregar.
 */
function buildSpriteList(): [string, string][] {
  const out: [string, string][] = [];
  for (const [charKey, prefix] of Object.entries(CHARACTERS)) {
    for (const pose of POSES) {
      out.push([`${charKey}_${pose}`, `${BASE}/${prefix}_${pose}.png`]);
    }
  }
  for (const w of WEAPON_CLASSES) {
    out.push([`weapon_${w}`, `${BASE}/weapon_${w}.png`]);
  }
  for (const b of BULLET_SPRITES) {
    out.push([`bullet_${b}`, `${WEAPON_BASE}/${b}.png`]);
  }
  for (const b of BULLET_EXTRA) {
    out.push([`bullet_${b}`, `${BULLET_EXTRA_BASE}/${b}.png`]);
  }
  for (const pr of PROP_EXTRA) {
    out.push([`prop_${pr}`, `${PROP_BASE}/${pr}.png`]);
  }
  for (const w of WEAPON_SPRITES) {
    out.push([`gun_${w}`, `${WEAPON_BASE}/${w}.png`]);
  }
  for (const n of TILE_NUMBERS) {
    out.push([`tile_${n}`, `${BASE}/Tiles/${tileFileName(n)}`]);
  }
  for (const grupo of DUNGEON_FLOORS) {
    for (let i = 0; i < DUNGEON_COUNT.piso; i++) {
      out.push([`dngeon_${grupo}_${i}`, `${DUNGEON_BASE}/${grupo}_${String(i).padStart(2, '0')}.png`]);
    }
  }
  for (const grupo of DUNGEON_WALLS) {
    for (let i = 0; i < DUNGEON_COUNT.parede; i++) {
      out.push([`dngeon_${grupo}_${i}`, `${DUNGEON_BASE}/${grupo}_${String(i).padStart(2, '0')}.png`]);
    }
  }
  for (const p of PARTICLE_SPRITES) {
    out.push([`fx_${p}`, `${PARTICLE_BASE}/${p}.png`]);
  }
  for (const it of ITEM_SPRITES) {
    out.push([`item_${it}`, `${ITEM_BASE}/${it}.png`]);
  }
  return out;
}

export function isSpritesEnabled(): boolean {
  return spritesEnabled;
}

/**
 * Carrega uma imagem como sprite.
 * @returns Promise que resolve quando carregada
 */
export async function loadSprite(key: string, url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      spriteCache.set(key, img);
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Carrega todos os sprites do jogo.
 * @returns Promise que resolve quando todos carregados
 */
export async function loadAllSprites(): Promise<void> {
  const list = buildSpriteList();
  await Promise.all(list.map(([key, path]) => loadSprite(key, path)));
  spritesEnabled = spriteCache.size > 0;
}

export function getSprite(key: string): HTMLImageElement | null {
  return spriteCache.get(key) || null;
}

/** Lista os caminhos de personagem referenciados pelo jogo (para teste de asset). */
export function characterFileExists(): string[] {
  const out: string[] = [];
  for (const prefix of Object.values(CHARACTERS)) {
    for (const pose of POSES) out.push(`${prefix}_${pose}.png`);
  }
  return out;
}

/** Lista os caminhos de arma referenciados pelo jogo (para teste de asset). */
export function weaponFileExists(): string[] {
  return WEAPON_CLASSES.map(w => `weapon_${w}.png`);
}

/** Chave completa da sprite de um personagem numa pose. */
export function poseKey(character: string, pose: Pose): string {
  return `${character}_${pose}`;
}

/**
 * Desenha uma sprite mantendo o aspect ratio real, pivotada pelo centro do
 * corpo e girada para a direção de mira.
 *
 * Forçar um quadrado (`radius*2` × `radius*2`) em uma imagem de 51×43 achata o
 * personagem — foi o que deixou inimigos e player "esmagados" até aqui.
 *
 * @param bodySize - altura desejada do corpo em pixels
 * @param angle - ângulo de mira em radianos
 */
export function drawSpriteFit(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  cx: number,
  cy: number,
  bodySize: number,
  angle: number
): void {
  const iw = (img as HTMLImageElement).naturalWidth || (img as HTMLImageElement).width;
  const ih = (img as HTMLImageElement).naturalHeight || (img as HTMLImageElement).height;
  if (!iw || !ih) return;
  const scale = bodySize / ih;
  const w = iw * scale;
  const h = ih * scale;
  const px = (BODY_PIVOT_X / iw) * w;
  const py = (BODY_PIVOT_Y / ih) * h;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.drawImage(img, -px, -py, w, h);
  ctx.restore();
}

