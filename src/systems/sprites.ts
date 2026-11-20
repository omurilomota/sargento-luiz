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
 * Corpos EXTERNOS (SpriteAttack, FreeArt Topdown Zombies, CC0) — 3 zumbis
 * top-down rasterizados em 51×43, com o mesmo pivô dos personagens Kenney.
 *
 * Eles não substituem o pack: entram na variação por bioma onde o corpo
 * genérico `zombie` já aparecia, para o jogador ver mais de 9 silhuetas no
 * jogo inteiro. As 6 poses apontam para o mesmo quadro porque o pack é de
 * corpo parado; `drawSpriteFit` gira o corpo inteiro.
 */
const EXTRA_CHARACTERS: Record<string, string> = {
  free1: 'free1',
  free2: 'free2',
  free3: 'free3',
};
const EXTRA_CHARACTER_BASE = 'assets/sprites/enemies';

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
  // J3c: cristais da Caverna (264/265), brasão do Castelo (312) e os
  // decor variados (289 entulho, 317 pedra do cais, 319 respingo de lava)
  264, 265, 289, 312, 317, 319,
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
  // barril do pack Kenney (tiles 505-510: barril com cintas) — substitui o desenho procedural
  505, 506, 507, 508, 509, 510,
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

/**
 * Materiais de piso disponíveis; a quantidade de tiles vem de DUNGEON_COUNT.
 *
 * `piso_asfalto`/`piso_faixa`/`piso_borda` são AUTORAIS (CC0), gerados por
 * `tools/gen_assets_estrada.py`: o pack não tem asfalto. Não são piso de
 * bioma — a estrada da Rodovia é desenhada por caractere do mapa (`=`, `:`,
 * `-`, `_` em `buildTerrain`), então `dungeonFloor` da Rodovia continua sendo
 * o acostamento de pedra.
 */
export const DUNGEON_FLOORS = [
  'piso_pedra', 'piso_pedra2', 'piso_terra', 'piso_terra2', 'piso_areia',
  'piso_grama', 'piso_metal', 'piso_vidro', 'piso_madeira',
  'piso_asfalto', 'piso_faixa', 'piso_borda',
  // hospital (F-C): ladrilho autoral com manchas de uso
  'piso_hospital',
] as const;

/** Materiais de parede disponíveis; a contagem vem de DUNGEON_COUNT.parede. */
export const DUNGEON_WALLS = [
  'parede_pedra', 'parede_tijolo', 'parede_concreto',
  'parede_metal', 'parede_terra', 'parede_areia',
  // casas da Cidade (F-C): prédio autoral com janelas quebradas
  'parede_predio',
  // hospital (F-C): azulejo com rodapé
  'parede_hospital',
] as const;

/**
 * Quantos tiles de cada material existem no disco.
 *
 * O autotile do pack tem exatamente UM fill puro por sheet (o tile 47 do
 * wangset: as 4 arestas e os 4 cantos no mesmo terreno — medido pela costura,
 * delta -1 da borda pro miolo, contra -38 das peças de borda que a extração
 * velha pegava). A variedade honesta vem dos sheets da família; a curadoria
 * visual derrubou o Stone_01 (0 dos 48 tiles passa o portão de costura: é
 * bloco, não piso) e o Sand_02 como piso (cinza-azulado longe de praia).
 * `piso_vidro` é o sheet Glass 1 do mesmo pack. Parede fica no mesmo lugar
 * de sempre: linhas 0+1 do sheet.
 */
export const DUNGEON_COUNT: {
  piso: Record<string, number>;
  parede: Record<string, number>;
} = {
  piso: {
    // Contagem no disco, conferida pelo gate de contagem em tiles.test.ts. O
    // extrador pode derrubar um material para 1 tile (a faixa de luminância
    // das variantes rejeita o 2o quando ele sai de ±60 do 1o) e o jogo
    // carregaria arquivo inexistente sem esse teste.
    piso_pedra: 1, piso_pedra2: 1, piso_terra: 2, piso_terra2: 2,
    piso_areia: 2, piso_grama: 1, piso_metal: 1, piso_vidro: 1, piso_madeira: 1,
    // autorais (gerados): asfalto liso 3 variantes + rachado, faixa e bordas
    piso_asfalto: 4, piso_faixa: 1, piso_borda: 2,
    // hospital (F-C): ladrilho autoral com manchas de uso
    piso_hospital: 2,
  },
  // parede por material: o predio autoral (F-C, casas da Cidade) tem 3
  // variantes; os do pack, 16
  parede: {
    parede_pedra: 16, parede_tijolo: 16, parede_concreto: 16,
    parede_metal: 16, parede_terra: 16, parede_areia: 16,
    parede_predio: 3,
    // hospital (F-C): azulejo com rodapé
    parede_hospital: 2,
  },
};

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
/** Arma na mão por NOME de arma (F-C): vista de cima, autoral CC0. */
const HAND_BASE = 'assets/sprites/hand';

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

/**
 * Props com sprite próprio (não vem do tileset): o foguete do Castelo e as
 * árvores autorais da Floresta e do Pântano (o pack não tem vegetação — os
 * 185 tiles-objeto dele são caixa e cilindro).
 */
export const PROP_EXTRA = ['barco1', 'barco2', 'garca', 'garca_clara', 'foguete', 'arvore_00', 'arvore_01', 'arvore_morta_00', 'carro_00', 'carro_01', 'carro_02', 'tocha_00', 'tocha_01', 'painel_00', 'berco_00', 'trilho_h_00', 'trilho_h_01', 'trem_locomotiva_00', 'trem_vagao_00', 'combustivel_00'];

/**
 * Sprite de arma por nome, para a loja e o HUD. 6 famílias para 12 armas: as
 * armas de mesma família compartilham desenho, que é honesto — RPG e Granada
 * são o mesmo cano com munição diferente.
 */
/** Um desenho por arma — antes 7 ícones serviam 13 armas, e Laser/RPG/BFG/
 *  Destruidor apareciam todos como o mesmo fuzil. Os 13 sprites do pack são
 *  perfil (vitrine da loja, não o mundo top-down — DECISIONS #91). */
export const WEAPON_ICON: Record<string, string> = {
  Pistola: 'pistol',
  Shotgun: 'shotgun',
  Metralhadora: 'smg',
  Sniper: 'sniper',
  Laser: 'assaultrifle2',   // emissor alongado / mira
  Raios: 'revolver2',       // emissor duplo
  Gel: 'pistol2',           // cartucho pressurizado
  Granada: 'grenade',
  Mina: 'grenade2',         // variante escura da granada (mina)
  RPG: 'shotgun2',          // tubo largo de lança
  BFG: 'smg2',              // corpo grande, cano duplo
  'M. Quebrada': 'revolver',// revólver desgastado
  Destruidor: 'assaultrifle',// arma pesada de uma mão só
};

/** Cartuchos do pack + 3 projéteis orgânicos recortados de assets do jogo
 *  (gosma do gemGreen, lasca do tile de cristal, brasa do tile de lava). */
export const BULLET_SPRITES = [
  'small_bullet', 'medium_bullet', 'large_bullet',
  'slime_blob', 'shard_blob', 'ember_blob', 'spark_blob', 'vomit_blob', 'rad_blob',
] as const;

/** Chefes com silhueta própria (CC0, dessaturados para a paleta do jogo).
 *  Sem isto, 16 chefes dividiam os 9 corpos do pack com os inimigos comuns —
 *  o chefe só se distinguia pelo tamanho. Os restantes continuam no mapa
 *  antigo até ganharem arte própria. */
export const BOSS_SPRITES: Record<string, string> = {
  reiMutante: 'reiMutante', leviathan: 'leviathan', infernoPrime: 'infernoPrime',
  crystalQueen: 'crystalQueen', alphaWolf: 'alphaWolf', nucleo: 'nucleo',
  torre: 'torre', transformador: 'transformador',
};
const BOSS_BASE = 'assets/sprites/bosses';

/** As 6 armas do pack, uma por família. `weapon2` é a cor alternativa. */
export const WEAPON_SPRITES = [
  'pistol', 'pistol2', 'revolver', 'revolver2', 'shotgun', 'shotgun2',
  'sniper', 'sniper2', 'smg', 'smg2', 'assaultrifle', 'assaultrifle2', 'grenade', 'grenade2',
] as const;

/** A arma-na-mão por nome de arma (F-C): vista de cima, autoral CC0 —
 *  ver tools/gen_assets_mao.py pelo porquê (o pack é perfil, o jogo é
 *  top-down; a DECISIONS #91 rejeitou o perfil para o corpo). */
export const HAND_SPRITES: Record<string, string> = {
  Pistola: 'mao_pistola',
  Shotgun: 'mao_shotgun',
  Metralhadora: 'mao_metralhadora',
  Sniper: 'mao_sniper',
  Laser: 'mao_laser',
  RPG: 'mao_rpg',
  Raios: 'mao_raios',
  Gel: 'mao_gel',
  Granada: 'mao_granada',
  Mina: 'mao_mina',
  BFG: 'mao_bfg',
  'M. Quebrada': 'mao_quebrada',
  Destruidor: 'mao_destruidor',
};

/**
 * Os 9 personagens do pack, em nome curto.
 *
 * Consumido pelo `variedade.test.ts` para garantir que toda entrada da tabela
 * por bioma aponta para um personagem REAL: um erro de digitação ali seria um
 * 404 silencioso com o inimigo sumindo da tela (`getSprite` devolve `null` e o
 * `drawEnemyShape` cai no círculo de fallback — some a silhueta, não o corpo).
 */
export const CHARACTER_NAMES = [...Object.keys(CHARACTERS), ...Object.keys(EXTRA_CHARACTERS)];

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
  grunt: 'free1',
  // Recusantes usam só os corpos deformados; agentes, os corpos vivos do pack
  // (a mesma divisão de VARIACAO_POR_BIOMA, sem fase).
  mutante: 'free2',
  runner: 'free3',
  tank: 'soldier',
  bat: 'zombie',
  robot: 'robot',
  drone: 'robot',
  slime: 'free1',
  lavaSlime: 'free2',
  mosquito: 'free3',
  knight: 'soldier',
  archer: 'hitman',
  mage: 'woman',
  fireElemental: 'free1',
  magmaGolem: 'free3',
  inferno: 'zombie',
  ufo: 'robot',
  asteroid: 'manOld',
  alien: 'free2',
  frog: 'free3',
  crystal: 'woman',
  spitter: 'free1',

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
  // TORRE da Refinária (playtest: "PORQUE A TORRE É A MERDA DE UM
  // ZUMBI?"): corpo industrial — robot é o vocabulário da Fábrica/Refinaria
  torre: 'robot',
  transformador: 'robot',
  capitao: 'soldier',
};

/** Os 9 biomas, na ordem das fases. */
// M4 (2026-10-15): a ordem ACOMPANHA a de PHASES — Castelo depois do Porto
// (o foguete enche tanque antes do conserto). Este array é indexado por
// FASE: se divergir de config, o inimigo errado veste a roupa do bioma
// errado e o variedade.test acusa.
export const BIOMAS = [
  'cidade', 'rodovia', 'floresta', 'hospital', 'caverna', 'fabrica',
  'trens', 'ponte', 'pantano', 'refinaria', 'subestacao',
  'vulcao', 'porto', 'castelo', 'espaco', 'bunker',
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
// A lore nova (PREMISSA-V2) separa os inimigos em dois lotes, e o visual tem
// que contar isso sem uma fala: AGENTE aceitou o implante, veste uniforme e
// obedece ao chefe de fase; RECUSANTE foi transformado à força, saiu do
// controle e usa os corpos deformados (os 3 zumbis SpriteAttack + o da Kenney).
// A rotação por bioma é estável (hash do tipo) e preserva a variedade que o
// variedade.test.ts trava — nenhum par de fases vizinhas repete silhueta.
const AGENTES = ['soldier', 'hitman', 'manBlue', 'robot', 'manOld', 'manBrown', 'woman'];
const RECUSANTES = ['free1', 'free2', 'free3', 'zombie'];

export const PAPEL_POR_TIPO: Record<string, 'agente' | 'recusante'> = {
  grunt: 'recusante', runner: 'recusante', bat: 'recusante', slime: 'recusante',
  lavaSlime: 'recusante', mosquito: 'recusante', inferno: 'recusante',
  fireElemental: 'recusante', magmaGolem: 'recusante', alien: 'recusante',
  frog: 'recusante', crystal: 'recusante', spitter: 'recusante',
  mutante: 'recusante', asteroid: 'recusante',
  tank: 'agente', robot: 'agente', drone: 'agente', ufo: 'agente',
  knight: 'agente', archer: 'agente', mage: 'agente', biomaquina: 'agente',
};

function corpoPorBioma(tipo: string, indiceBioma: number): string {
  const elenco = PAPEL_POR_TIPO[tipo] === 'agente' ? AGENTES : RECUSANTES;
  let hash = 0;
  for (let i = 0; i < tipo.length; i++) hash = (hash * 31 + tipo.charCodeAt(i)) >>> 0;
  return elenco[(indiceBioma + hash) % elenco.length];
}

export const VARIACAO_POR_BIOMA: Record<Bioma, Record<string, string>> = Object.fromEntries(
  BIOMAS.map((bioma, indice) => [
    bioma,
    Object.fromEntries(Object.keys(PAPEL_POR_TIPO).map((tipo) => [tipo, corpoPorBioma(tipo, indice)])),
  ]),
) as Record<Bioma, Record<string, string>>;

/**
 * Personagem de um inimigo, por bioma.
 *
 * `tipo` que não tem entrada no bioma cai no `ENEMY_CHARACTER` (o mapa de
 * referência) e, no fim, no `zombie`. `fase` fora de 0..8 cai no mapa de
 * referência — um índice errado não pode apagar a silhueta do inimigo.
 */
export function isExtraCharacter(char: string): boolean {
  return char in EXTRA_CHARACTERS;
}

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
  for (const [charKey, prefix] of Object.entries(EXTRA_CHARACTERS)) {
    for (const pose of POSES) {
      out.push([`${charKey}_${pose}`, `${EXTRA_CHARACTER_BASE}/${prefix}_${pose}.png`]);
    }
  }
  for (const chave of Object.values(BOSS_SPRITES)) {
    out.push([`boss_${chave}`, `${BOSS_BASE}/${chave}.png`]);
  }
  // O cachorro de guarda (pardal) é sprite próprio, não personagem de inimigo:
  // uma só imagem top-down, girada pelo renderer como os corpos externos.
  out.push(['pardal', `${EXTRA_CHARACTER_BASE}/pardal.png`]);
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
  for (const mao of Object.values(HAND_SPRITES)) {
    out.push([`mao_${mao}`, `${HAND_BASE}/${mao}.png`]);
  }
  for (const n of TILE_NUMBERS) {
    out.push([`tile_${n}`, `${BASE}/Tiles/${tileFileName(n)}`]);
  }
  for (const grupo of DUNGEON_FLOORS) {
    for (let i = 0; i < DUNGEON_COUNT.piso[grupo]; i++) {
      out.push([`dngeon_${grupo}_${i}`, `${DUNGEON_BASE}/${grupo}_${String(i).padStart(2, '0')}.png`]);
    }
  }
  for (const grupo of DUNGEON_WALLS) {
    for (let i = 0; i < DUNGEON_COUNT.parede[grupo]; i++) {
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

