/**
 * src/maps.ts — dados puros dos mapas.
 *
 * Cada mapa é uma grade de 30 colunas × 20 linhas de 64px (1920×1280 px),
 * maior que a tela em quase todo monitor. O jogo desenha o terreno uma vez
 * num canvas offscreen e só faz um `drawImage` por frame.
 *
 * Legenda:
 *   `#` parede · `.` chão · `,` chão decorativo · `^` hazard
 *   `c` caixote (destrutível) · `b` barril (explosivo)
 *   `P` spawn do jogador · `E` zona de spawn de inimigo
 *   `B` spawn de boss · `N` ninho/objetivo · `R` zona de extração (reach)
 *
 * Convenção obrigatória: borda fechada de `#` em volta de tudo. O teste
 * `mapValidation.test.ts` falha se alguma linha tiver tamanho diferente,
 * se `P` estiver em parede, ou se não existir caminho de `P` até todo `B`/`N`.
 */

import { HazardKind } from './types';

/** Tamanho de uma célula do mapa em pixels */
export const CELL_SIZE = 64;

/** Tipos de tile que o tilemap entende */
export type TileKind = 'wall' | 'floor' | 'decor' | 'hazard' | 'crate' | 'barrel';

/** Material do piso, do pack Top Down Dungeon (Screaming Brain, CC0). */
export type DungeonFloor =
  | 'piso_pedra' | 'piso_pedra2' | 'piso_terra' | 'piso_terra2'
  | 'piso_areia' | 'piso_grama' | 'piso_metal' | 'piso_vidro' | 'piso_madeira'
  | 'piso_asfalto' | 'piso_faixa' | 'piso_borda' | 'piso_hospital';

/** Material da parede, do mesmo pack. */
export type DungeonWall =
  | 'parede_pedra' | 'parede_tijolo' | 'parede_concreto'
  | 'parede_metal' | 'parede_terra' | 'parede_areia'
  | 'parede_predio' | 'parede_hospital';

export interface MapDef {
  /** Linhas do mapa (30 × 20) */
  rows: string[];
  /** Cor base do chão antes do tint */
  floor: string;
  /** Cor da parede (desenhada proceduralmente) */
  wall: string;
  /** Cor de acento do bioma (usada no tint, props e HUD) */
  accent: string;
  /** Cor aplicada como `multiply` no prerender (tinta do bioma) */
  tint: string;
  /** Tiles de chão do Kenney curtados visualmente (números existentes) */
  floorTiles: number[];
  /**
   * Material do chão com textura real. Os `floorTiles` do Kenney são 87%
   * chapados (medido: 453 de 520 sem nenhuma textura), e é daí que vem a
   * costura de 64px visível no chão. Estes têm rejunte, mancha e grão.
   */
  dungeonFloor: DungeonFloor;
  /** Material da parede com textura real. */
  dungeonWall: DungeonWall;
  /** Corpo do caixote. Sem isto todo bioma repete o mesmo caixote bege. */
  propCrate: string;
  /** Tampa e cinta do barril */
  propBarrel: string;
  /** Cor da granulação de desgaste sobreposta no prerender */
  grain: string;
  /** Densidade da granulação (0 = sem granulação) */
  grainAlpha: number;
  /** Cor de fundo fora dos limites do mapa (o "void") */
  void: string;
}

export interface Biome extends MapDef {
  key: string;
  name: string;
  hazard: HazardKind;
  /** Cor do hazard quando ativo */
  hazardColor: string;
}

export const BIOMES: Record<string, Biome> = {
  cidade: {
    key: 'cidade', name: 'Cidade em Ruínas', hazard: 'debris', hazardColor: '#8a7a60',
    floor: '#2a2521', wall: '#5d5340', accent: '#a08050', tint: '#e8e0d4',
    floorTiles: [13, 15, 349, 350, 376, 377],
    // F-C: os blocos da Cidade são CASAS — parede_predio (autoral CC0,
    // telhado com janelas quebradas). "casas não parecem ser casas" era do
    // playtest; o concreto de dungeon era o vocabulário errado pro lugar.
    dungeonFloor: 'piso_pedra2', dungeonWall: 'parede_predio',
    propCrate: '#6a5a48', propBarrel: '#5a4a3a',
    grain: '#1a1714', grainAlpha: 0.18, void: '#08080a',
    rows: ['##############################',
      '#......E.,..........E........#',
      '#..####...####...####........#',
      '#..####...####...####.b####..#',
      '#..####...####...####..####..#',
      '#..####..........####..####.,#',
      '#...c,...........####,.####E.#',
      '#.....c.A............A.####..#',
      '#..####...###..#####.,,......#',
      '#..####...###..#####....E..,.#',
      '#,.####...###..#####..#####..#',
      '#..####...###..#####..#####..#',
      '#....b....###..Eb............#',
      '#b........A..b.c...##.A..##..#',
      '#..######......P.............#',
      '#..######.c#####......B......#',
      '#..######b.#####...##....##..#',
      '#..######..#####c............#',
      '#.......E....................#',
      '##############################'
    ],
  },

  floresta: {
    key: 'floresta', name: 'Floresta', hazard: 'fog', hazardColor: '#8a9a8a',
    floor: '#1e2718', wall: '#42502e', accent: '#7a9a6a', tint: '#e0e8d4',
    floorTiles: [1, 2, 3, 4, 17, 18],
    dungeonFloor: 'piso_grama', dungeonWall: 'parede_terra',
    propCrate: '#5a4c34', propBarrel: '#4a3f2a',
    grain: '#141c10', grainAlpha: 0.22, void: '#060806',
    rows: [
      '##############################',
      '#cE..............,..b....###E#',
      '#...###,T..###cT...###...###.#',
      '#,T.###.bT.###....#####..###.#',
      '#..,###.T..###.TT.#####.b....#',
      '#..###..b.....E...#####...c..#',
      '#.#####.......###..###..###..#',
      '#.#####..,.T.#####......###..#',
      '#.#####.c..T.#####..,...###..#',
      '#..###....T..#####.TTT.......#',
      '#............####.....,....E.#',
      '#.E...###..........,.....###.#',
      '#....#####........###.,..###.#',
      '#....#####.......#####...###.#',
      '#..c.#####..,....#####.......#',
      '#,..B.###........#####,...TT.#',
      '#..###,...T.###...###.###.cE.#',
      '#..###c..TT.###..c....###.T..#',
      '#..###N.....###P......###N...#',
      '##############################',
    ],
  },

  caverna: {
    key: 'caverna', name: 'Caverna', hazard: 'darkness', hazardColor: '#608090',
    floor: '#1b1d26', wall: '#3d4350', accent: '#608090', tint: '#dde4f0',
    floorTiles: [31, 32, 58, 59, 169, 178],
    dungeonFloor: 'piso_pedra', dungeonWall: 'parede_pedra',
    propCrate: '#4a4a52', propBarrel: '#3e3e46',
    grain: '#0e1016', grainAlpha: 0.3, void: '#05050a',
    rows: [
      '##############################',
      '#.....E.....,...c.......Ec...#',
      '#.#.#####.#####.#####.######.#',
      '#.#.#####.#####.#####.######.#',
      '#....#.....#.....#c....#.c...#',
      '#....#....b#N....#.....#.....#',
      '#.#.#####.#####E#####,######.#',
      '#.#.#####.#####.#####.######.#',
      '#...,#.....#....b#c....#...,.#',
      '#....#E....#....,#..N..#.....#',
      '#.#.#####.#####.#####.######.#',
      '#.#.#####.#####.#####.######.#',
      '#...,#.....#.....#..c..#.....#',
      '#....#....N#.....#.....#E....#',
      '#.#.#####.#####.#####.######.#',
      '#.#.#####.#####.#####.######.#',
      '#....#.....#b....#.....#.....#',
      '#....#E....#....,#....,#B....#',
      '#..............P.,.......,...#',
      '##############################',
    ],
  },

  fabrica: {
    key: 'fabrica', name: 'Fábrica', hazard: 'electric', hazardColor: '#b07050',
    floor: '#241f1d', wall: '#524840', accent: '#a08050', tint: '#ece2d8',
    floorTiles: [35, 36, 37, 62, 63, 64],
    dungeonFloor: 'piso_metal', dungeonWall: 'parede_metal',
    propCrate: '#5a5450', propBarrel: '#48433f',
    grain: '#181210', grainAlpha: 0.2, void: '#070707',
    rows: [
      '##############################',
      '#...E..........c.,.......c...#',
      '#.....#...,............#..E..#',
      '#.....#.^#..#..#..#.^#.#.....#',
      '#b....#..#..#.E#..#..#b#.....#',
      '#.....#........,.......#.....#',
      '#.....##^###########^###.....#',
      '#.....#................#.....#',
      '#....b#..#..#..#..#..#c#.....#',
      '#.E...#.^#..#c.#..#.^#.#.....#',
      '#.....#...........c....#.....#',
      '#.....#................#.....#',
      '#.....##^###########^###.....#',
      '#.....#....c.......c...#.....#',
      '#.b...#..#..#..#..#,.#.#...E.#',
      '#.....#.^#..#..#..#.^#.#.....#',
      '#.....#.............,..#.....#',
      '#...E.#................#.....#',
      '#..b....B......P.........,...#',
      '##############################',
    ],
  },

  pantano: {
    key: 'pantano', name: 'Pântano', hazard: 'mud', hazardColor: '#5a7a5a',
    floor: '#18231e', wall: '#37483c', accent: '#5a7a5a', tint: '#dcece2',
    floorTiles: [19, 20, 76, 77],
    // Curadoria de identidade (2026-10-15): a parede sai do tijolo (5 das 16
    // fases em concreto/metal repetido) e vem da terra — o pântano é lama,
    // e o par (piso_terra2, parede_terra) fica único entre as 16 fases.
    dungeonFloor: 'piso_terra2', dungeonWall: 'parede_terra',
    propCrate: '#4a4436', propBarrel: '#3c382c',
    grain: '#0e1512', grainAlpha: 0.26, void: '#050807',
    rows: [
      '##############################',
      '#..E......................E.,#',
      '#..###,.###.,..DDD.###..###..#',
      '#..###..###........###..###..#',
      '#..###..###........###..###..#',
      '#..,.,..^^^^^^^...^^^^^^.....#',
      '#.......c...b..E..........b..#',
      '#.DD.###,...###,.....###..DD.#',
      '#..D.###....###,.....###.D.c.#',
      '#.b..###..^^^^^^^....###.....#',
      '#.....E......................#',
      '#..###...,......###c...###...#',
      '#..###.......cb.###....###...#',
      '#.,###^^^^^^^...##^^^^^###...#',
      '#.............D.........E..b.#',
      '#..DD..###..DD.....###..c....#',
      '#....D.###.........###.,..DD.#',
      '#..E...###..^^^^^^^###.,..D..#',
      '#.......Bc.....P.c...........#',
      '##############################',
    ],
  },

  castelo: {
    key: 'castelo', name: 'Castelo', hazard: 'spikes', hazardColor: '#8a8a7a',
    floor: '#24231a', wall: '#524f33', accent: '#a08050', tint: '#f0e8c8',
    floorTiles: [89, 90, 91, 92, 95, 334],
    // Curadoria de identidade: arenito (parede_areia era o único sheet do pack
    // sem nenhuma fase) sobre piso de pedra — castelo de pedra, não de tijolo.
    dungeonFloor: 'piso_pedra', dungeonWall: 'parede_areia',
    propCrate: '#6a625a', propBarrel: '#565048',
    grain: '#16150f', grainAlpha: 0.22, void: '#070706',
    rows: [
      '##############################',
      '#...............c............#',
      '#.##########################.#',
      '#..,...#.....cE.......#....,.#',
      '#......#....#..#..#...#......#',
      '#......#...,#..#..#...#......#',
      '#b.b...#######.########......#',
      '#......#..,.^..^..^...#......#',
      '#...E..#.,..#..#..#...#......#',
      '#......#....#..#..#..b#......#',
      '#......#.,...F........#....,.#',
      '#......#######.########...c..#',
      '#.....b#....^..^..^...#......#',
      '#......#....#..#..#...#..E...#',
      '#......#....#..#..#...#......#',
      '#......#...c...,......#......#',
      '#..E..c#..............#...E..#',
      '#.############.#############.#',
      '#.....Bc..E...P..............#',
      '##############################',
    ],
  },

  vulcao: {
    key: 'vulcao', name: 'Vulcão', hazard: 'lava', hazardColor: '#c46a3a',
    floor: '#271915', wall: '#57362b', accent: '#c46a3a', tint: '#f0d8c0',
    floorTiles: [77, 79, 80, 398],
    // Curadoria de identidade: cinza vulcânica (areia) sobre basalto (pedra) —
    // a rocha vulcânica é literalmente pedra escura, e o tijolo volta a ser
    // só do Porto (armazém velho), que era onde ele fazia sentido.
    dungeonFloor: 'piso_areia', dungeonWall: 'parede_pedra',
    propCrate: '#4e3630', propBarrel: '#402c26',
    grain: '#180a06', grainAlpha: 0.24, void: '#0a0403',
    rows: [
      '##############################',
      '#....E...c.............bE....#',
      '#............................#',
      '#......c........,.........b..#',
      '#...^^^^.....................#',
      '#.....^.^^^............b...c.#',
      '#....###.^.^^^.E.....###.....#',
      '#....###.c..^.^^^^...###.....#',
      '#....###.......^..^^^###.....#',
      '#..E,..........^^^^..^^^.....#',
      '#..........^^^^....,.^..^^...#',
      '#.....^^^^^......c......^....#',
      '#.........b..................#',
      '#....b...........,........E..#',
      '#......###..........###......#',
      '#......###..........###......#',
      '#......###..........###......#',
      '#..R..E,........,............#',
      '#........B.....P....b........#',
      '##############################',
    ],
  },

  espaco: {
    key: 'espaco', name: 'Espaço', hazard: 'lowGravity', hazardColor: '#7a6a8a',
    floor: '#15181f', wall: '#31374a', accent: '#7a6a8a', tint: '#d8e0f4',
    floorTiles: [86, 93, 340, 361, 362, 363],
    dungeonFloor: 'piso_madeira', dungeonWall: 'parede_metal',
    propCrate: '#3e4a52', propBarrel: '#333d45',
    grain: '#080a10', grainAlpha: 0.28, void: '#040408',
    rows: [
      '##############################',
      '#...E.c....c.............E...#',
      '#.,...........b..............#',
      '#..###........###.......###,.#',
      '#..###........###.......###..#',
      '#..###.......,###.......###..#',
      '#.........,....E......b...b..#',
      '#......,...#.................#',
      '#............................#',
      '#.E...b###..........###......#',
      '#......###..........###.c..b.#',
      '#......###..........###......#',
      '#.......c....................#',
      '#...............c#.........E.#',
      '#..###...................###.#',
      '#..###.....c.............###.#',
      '#..###...........b.......###,#',
      '#............#.E...........c.#',
      '#..P......B.......c..........#',
      '##############################',
    ],
  },

  bunker: {
    key: 'bunker', name: 'Bunker Central', hazard: 'none', hazardColor: '#a08050',
    floor: '#1d1f24', wall: '#4a4d57', accent: '#a08050', tint: '#e8eaf0',
    floorTiles: [40, 41, 67, 68, 86, 93],
    // Curadoria de identidade: o bunker ganha o piso de terra (Dirt 1/2) para
    // não repetir o par do Pântano; a parede de concreto é a dele.
    dungeonFloor: 'piso_terra', dungeonWall: 'parede_concreto',
    propCrate: '#52565a', propBarrel: '#43474b',
    grain: '#101216', grainAlpha: 0.16, void: '#060607',
    rows: [
      '##############################',
      '#............................#',
      '#.##########################.#',
      '#...E..#....,.#....c..#......#',
      '#..............E...b.........#',
      '#.....,#......#.......#......#',
      '#..##.######.######,####.##b.#',
      '#......#......#.....c.#......#',
      '#............................#',
      '#.............##......#...b..#',
      '#..##.........##.##...##.##..#',
      '#..##......B...E.##...#......#',
      '#......##....................#',
      '#......##.............#......#',
      '#..##.######.######.####.##..#',
      '#......#......#c......#....cc#',
      '#...E..............,.........#',
      '#.##########################.#',
      '#..E,.........PE..b..........#',
      '##############################',
    ],
  },

  // ─── OS 7 BIOMAS NOVOS (2026-10-14, Unidade A) ────────────────

  rodovia: {
    key: 'rodovia', name: 'Rodovia', hazard: 'debris', hazardColor: '#7a6a50',
    floor: '#282420', wall: '#4a4038', accent: '#9a8860', tint: '#d8d0c4',
    floorTiles: [13, 15, 349, 350, 376, 377],
    dungeonFloor: 'piso_pedra', dungeonWall: 'parede_concreto',
    propCrate: '#4a3a2a', propBarrel: '#3a3020',
    grain: '#1a1814', grainAlpha: 0.14, void: '#0a0908',
    rows: ['##############################',
      '#............................#',
      '#...E..........E..........E..#',
      '#............................#',
      '#............................#',
      '#.#........................#.#',
      '#.#....----------------....#.#',
      '#.#....AA==P========A==....#.#',
      '#.#....:=:=:=:B:AA=:=:=....#.#',
      '#.#....===A============....#.#',
      '#.#....______Ac____A___....#.#',
      '#.#........................#.#',
      '#.#........................#.#',
      '#.#........................#.#',
      '#............................#',
      '#............................#',
      '#...E..........E..........E..#',
      '#............................#',
      '#............................#',
      '##############################'
    ],
  },
  hospital: {
    key: 'hospital', name: 'Hospital de Campanha', hazard: 'fog', hazardColor: '#8aaa9a',
    // O floor do hospital é CLARO de propósito: o drawFloor lava cada tile
    // com 62% desta cor (a lavada que acalma o rejunte do pack), e com o
    // escuro antigo (#20282a) o ladrilho autoral morria em ~75 de
    // luminância — igual a qualquer outro bioma, zero identidade. Um
    // teal-cinza claro deixa o ladrilho lendo ~100: o único piso claro do
    // jogo, "hospital abandonado" no relance.
    // A PAREDE sobe junto (#b4c4c6): a regra do projeto é parede mais
    // clara que o piso (o olho lê a massa clara como obstáculo — invertido
    // o mapa vira buracos, ver terrain.test). Hospital branco encardido:
    // parede ~125 na tela contra piso ~90.
    floor: '#4c5c5e', wall: '#b4c4c6', accent: '#8a9a9a', tint: '#d8e4e4',
    floorTiles: [31, 32, 58, 59, 169, 178],
    // Curadoria de identidade: hospital ganha o sheet Glass 1 do mesmo pack
    // (piso_vidro) — cerâmica de enfermaria, o único piso claro do jogo. O
    // sheet existia no pack e não tinha nenhuma fase usando.
    // F-C: o hospital com cara de HOSPITAL — ladrilho com manchas de
    // uso no chão, azulejo com rodapé na parede ("não tem chão de
    // hospital, não tem salas" era do playtest)
    dungeonFloor: 'piso_hospital', dungeonWall: 'parede_hospital',
    propCrate: '#5a4a3a', propBarrel: '#4a3a2a',
    grain: '#141a1a', grainAlpha: 0.12, void: '#0a0d0d',
    rows: [
      '##############################',
      '#...............c............#',
      '#....E.........E........E....#',
      '#............................#',
      '#....^.........B........^....#',
      '#............................#',
      '#..b.........................#',
      '#............................#',
      '#.###..#######.b#######..###.#',
      '#............................#',
      '#.....................b......#',
      '#.###..#######..#######..###.#',
      '#...........c................#',
      '#............................#',
      '#....^.........^........^....#',
      '#............................#',
      '#.....c......................#',
      '#....E.........P........E....#',
      '#......c.....................#',
      '##############################',
    ],
  },
  trens: {
    key: 'trens', name: 'Pátio de Trens', hazard: 'electric', hazardColor: '#8a9a6a',
    floor: '#2a2018', wall: '#4a3828', accent: '#8a7a5a', tint: '#d8ccc0',
    floorTiles: [35, 36, 37, 62, 63, 64],
    dungeonFloor: 'piso_areia', dungeonWall: 'parede_metal',
    propCrate: '#5a3a2a', propBarrel: '#4a2a1a',
    grain: '#1a140e', grainAlpha: 0.16, void: '#0a0806',
    rows: [
      '##############################',
      '#...............cc...........#',
      '#....E........E.......E....B.#',
      '#............c...............#',
      '#.^^.N..^^^....^^^....^^^....#',
      '#..####...####...####...####.#',
      '#b.####...####...####...####.#',
      '#..####...####...####...####.#',
      '#..............b.............#',
      '#............................#',
      '#...........N.........b......#',
      '#..####...####...####...####.#',
      '#..####...####...####...####.#',
      '#..####...####...####...####.#',
      '#.^^....^^^.....^^.N....^....#',
      '#..####...####...####...####.#',
      '#..####E..####...####...####.#',
      '#..####...####...####...####.#',
      '#......c.......P.............#',
      '##############################',
    ],
  },
  ponte: {
    key: 'ponte', name: 'Ponte', hazard: 'lowGravity', hazardColor: '#6a7a8a',
    floor: '#1a1c22', wall: '#4e5a68', accent: '#7a8a9a', tint: '#d0d8e0',
    floorTiles: [13, 15, 349, 350, 376, 377],
    dungeonFloor: 'piso_pedra2', dungeonWall: 'parede_metal',
    propCrate: '#4a3a2a', propBarrel: '#3a3020',
    grain: '#12141a', grainAlpha: 0.10, void: '#060a10',
    rows: [
      '##############################',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
      '#.###.####.####.####.####.##.#',
      '#.....##..............##.....#',
      '#.....##.......b......##.....#',
      '#.RE........E...B..........P.#',
      '#..E........E.........b......#',
      '#.....##..c...........##..c..#',
      '#.....##....c.........##.....#',
      '#.....##..............##.....#',
      '#.###.####.####.####.####.##.#',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
    ],
  },
  refinaria: {
    key: 'refinaria', name: 'Refinaria', hazard: 'lava', hazardColor: '#c46a3a',
    floor: '#1a120a', wall: '#5a3a20', accent: '#c46a3a', tint: '#d8c8b8',
    floorTiles: [35, 36, 37, 62, 63, 64],
    dungeonFloor: 'piso_terra', dungeonWall: 'parede_metal',
    propCrate: '#5a3a1a', propBarrel: '#4a2a0a',
    grain: '#1a100a', grainAlpha: 0.18, void: '#0a0503',
    rows: [
      '##############################',
      '#...............c............#',
      '#....E.........E.........E...#',
      '#..,.........,.............,.#',
      '#..............^.............#',
      '#.......#......^.............#',
      '#..b..#####...B#.............#',
      '#.....#####...###............#',
      '#....#######.#####...........#',
      '#.....#####...###............#',
      '#.....#####....#......b....,.#',
      '#.......#.c.^^............c..#',
      '#.....b..................^...#',
      '#..............#.............#',
      '#.............###............#',
      '#............#####...........#',
      '#.....c.......###.....,......#',
      '#.....b........#.............#',
      '#....E.c^^.....P.............#',
      '##############################',
    ],
  },
  subestacao: {
    key: 'subestacao', name: 'Subestação', hazard: 'electric', hazardColor: '#6a8aaa',
    floor: '#1a1e2e', wall: '#2e3a4e', accent: '#7a9aaa', tint: '#c8d8e8',
    floorTiles: [35, 36, 37, 62, 63, 64],
    dungeonFloor: 'piso_metal', dungeonWall: 'parede_concreto',
    propCrate: '#3a4a5a', propBarrel: '#2a3a4a',
    grain: '#0e121a', grainAlpha: 0.14, void: '#05080d',
    rows: [
      '##############################',
      '#...............c............#',
      '#....E.........E.........E...#',
      '#..##....##....##....##...##.#',
      '#..##....##....##....##...##.#',
      '#............................#',
      '#^.^^^.^^^^^.^^^^^.^^^^^.^^^.#',
      '#............................#',
      '#..##....##....##....##...##.#',
      '#..##....##....##....##...##.#',
      '#.....................b......#',
      '#^.^^^.^^^^^.^^^^^.^^^^^.^^^.#',
      '#.....b.....c................#',
      '#..##....##....##....##...##.#',
      '#..##....##....##....##...##.#',
      '#............................#',
      '#.....cE.....................#',
      '#.....b........B.............#',
      '#......c.......P.............#',
      '##############################',
    ],
  },
  porto: {
    key: 'porto', name: 'Porto', hazard: 'fog', hazardColor: '#6a8a9a',
    floor: '#1a1e22', wall: '#2e3a40', accent: '#6a8a9a', tint: '#c8d0d8',
    floorTiles: [31, 32, 58, 59, 169, 178],
    // Curadoria de identidade: areia (Sand 2) no cais, tijolo dos armazéns
    // velhos — para não repetir o par (piso_terra, concreto) do Bunker. A
    // água de verdade entra como asset autoral no item 3.
    dungeonFloor: 'piso_areia', dungeonWall: 'parede_tijolo',
    propCrate: '#3a4a3a', propBarrel: '#2a3a2a',
    grain: '#0e1214', grainAlpha: 0.15, void: '#05070a',
    rows: [
      '##############################',
      '#...............cc...........#',
      '#..E###..####..E###..####E...#',
      '#..#N##..####c.####..####....#',
      '#..#.##..####..####..####....#',
      '#............................#',
      '#b.####..####..####..####....#',
      '#..####..#N##..####..####....#',
      '#..####..#.##..####..####....#',
      '#....................b.......#',
      '#..####...###.#..##.##b....B.#',
      '#..####...###.#..#N.##....c..#',
      '#..####...###.#..##.##.......#',
      '#..E.....................E...#',
      '#............................#',
      '###.####.######.######.##.####',
      '#########################.####',
      '#########################.####',
      '#......c.......P.............#',
      '##############################',
    ],
  },
};

/**
 * Converte um caractere da legenda no tipo de tile correspondente.
 * `P`, `E`, `B`, `N`, `R` e `F` são chão andável por cima do seu conteúdo
 * (`F` é o pad do foguete que o protect do Castelo defende).
 */
export function tileKindAt(ch: string): TileKind {
  switch (ch) {
    case '#': return 'wall';
    case ',': return 'decor';
    case '^': return 'hazard';
    case 'c': return 'crate';
    case 'b': return 'barrel';
    // estrada da Rodovia: asfalto autoral, todo ele caminável
    case '=': case ':': case '-': case '_': return 'floor';
    // árvore: o terreno embaixo é piso (a copa é prop, não parede de grid)
    case 'T': case 'D': return 'floor';
    // carro abandonado: idem árvore — a carcaça bloqueia como prop
    case 'A': return 'floor';
    default: return 'floor';
  }
}
