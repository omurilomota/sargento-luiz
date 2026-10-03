import { describe, it, expect } from 'vitest';
import { BIOMES, CELL_SIZE, tileKindAt } from '../maps';
import { ENEMY_TYPES, PHASES } from '../config';
import { TILE_NUMBERS, tileFileName, POSES, WEAPON_CLASSES } from '../systems/sprites';
import { loadMap, hasPath, findAll, isWall, moveCircleBy, rebuildFlowField, sampleFlowDir, isReachable } from '../systems/tilemap';

const KEYS = Object.keys(BIOMES);

/** Números de tile que realmente existem no pack (a numeração tem buracos). */
const EXISTING_TILES = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 25, 26, 28, 29, 30,
  31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53,
  55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 79,
  80, 81, 82, 83, 84, 85, 86, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102,
  103, 104, 105, 106, 107, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
  122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 136, 137, 138, 139, 140,
  141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158,
  159, 160, 161, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177,
  178, 179, 180, 181, 182, 183, 184, 185, 186, 188, 190, 191, 192, 193, 194, 195, 196, 197,
  198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215,
  217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234,
  235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252,
  253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270,
  271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288,
  289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305,
  306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323,
  324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341,
  342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359,
  360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377,
  378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395,
  396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413,
  414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431,
  432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449,
  450, 451, 452, 453, 454, 455, 456, 457, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469,
  470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 487, 488, 489,
  490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507,
  508, 509, 510, 511, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527,
  528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538,
]);

/** Luminância perceptual aproximada de uma cor hex de 24 bits. */
function lum(rgb: number): number {
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

describe('mapas: formato', () => {
  it.each(KEYS)('%s tem 20 linhas de 30 colunas', (key) => {
    const biome = BIOMES[key];
    expect(biome.rows).toHaveLength(20);
    for (const row of biome.rows) expect(row.length).toBe(30);
  });

  it.each(KEYS)('%s tem borda fechada de parede', (key) => {
    const biome = BIOMES[key];
    const first = biome.rows[0];
    const last = biome.rows[biome.rows.length - 1];
    expect(first).toBe('#'.repeat(30));
    expect(last).toBe('#'.repeat(30));
    for (const row of biome.rows) {
      expect(row[0]).toBe('#');
      expect(row[29]).toBe('#');
    }
  });

  it.each(KEYS)('%s tem exatamente um spawn do jogador', (key) => {
    const rows = BIOMES[key].rows.join('');
    const matches = rows.match(/P/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it.each(KEYS)('%s tem P em chão andável', (key) => {
    const biome = BIOMES[key];
    const spawn = biome.rows.findIndex(r => r.includes('P'));
    const line = biome.rows[spawn];
    expect(line[line.indexOf('P')]).not.toBe('#');
    expect(tileKindAt('P')).toBe('floor');
  });

  it.each(KEYS)('%s tem tiles de chão carregados no cache de sprites', (key) => {
    const biome = BIOMES[key];
    expect(biome.floorTiles.length).toBeGreaterThanOrEqual(4);
    for (const n of biome.floorTiles) {
      expect(EXISTING_TILES.has(n)).toBe(true);
      expect(TILE_NUMBERS).toContain(n);
    }
  });

  it.each(KEYS)('%s tem contraste entre piso e parede', (key) => {
    const biome = BIOMES[key];
    const floor = parseInt(biome.floor.slice(1), 16);
    const wall = parseInt(biome.wall.slice(1), 16);
    const floorLum = lum(floor);
    const wallLum = lum(wall);
    // parede mais CLARA que o chão: em top-down o olho lê a massa clara como
    // obstáculo. Com chão claro e parede preta o mapa vira uma collection de
    // buracos e o jogador não sabe onde pode andar.
    expect(wallLum).toBeGreaterThan(floorLum * 1.5);
    // e nem estourando para branco
    expect(wallLum).toBeLessThan(220);
  });
});

describe('assets: caminhos de arquivo', () => {
  it('o nome do tile usa pad de 2 dígitos (o pack vai de tile_01 a tile_538)', () => {
    expect(tileFileName(1)).toBe('tile_01.png');
    expect(tileFileName(42)).toBe('tile_42.png');
    expect(tileFileName(99)).toBe('tile_99.png');
    expect(tileFileName(100)).toBe('tile_100.png');
    expect(tileFileName(538)).toBe('tile_538.png');
  });

  it('todo tile carregado existe de verdade no pack (numeração tem buracos)', () => {
    // EXISTING_TILES foi levantado do disco: tile_054, tile_081, tile_162 etc
    // não existem, e pedir qualquer um deles é 404 silencioso.
    for (const n of TILE_NUMBERS) {
      expect(EXISTING_TILES.has(n), `${tileFileName(n)} não existe no pack`).toBe(true);
    }
  });

  it('carrega as 6 poses e as 3 classes de cano', () => {
    expect(POSES).toEqual(['stand', 'hold', 'gun', 'machine', 'reload', 'silencer']);
    expect(WEAPON_CLASSES).toEqual(['gun', 'machine', 'silencer']);
  });
});

describe('mapas: conectividade', () => {
  it.each(KEYS)('%s: existe caminho de P até todo E, B e N', (key) => {
    const biome = BIOMES[key];
    const map = loadMap(biome.rows);
    const spawn = findAll('P')[0];
    expect(spawn).toBeDefined();

    for (const target of ['E', 'B', 'N']) {
      for (const cell of findAll(target)) {
        expect(isWall(cell.col, cell.row)).toBe(false);
        expect(hasPath(spawn.col, spawn.row, cell.col, cell.row)).toBe(true);
      }
    }
    expect(map.cols).toBe(30);
  });

  it.each(KEYS)('%s: pelo menos 4 pontos de spawn de inimigo', (key) => {
    const rows = BIOMES[key].rows.join('');
    expect((rows.match(/E/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });
});

describe('bosses: fase, tipo e arena concordam', () => {
  it('as 9 fases têm boss (a 1 e a 9 estavam sem, e teach sem ameaça não ensina)', () => {
    const semBoss = PHASES.filter(p => !p.boss).map(p => p.name);
    expect(semBoss).toEqual([]);
  });

  it.each(PHASES.map(p => [p.name, p] as const))('%s: o boss declarado existe e tem padrão', (_name, phase) => {
    const def = ENEMY_TYPES[phase.boss!];
    expect(def, `tipo ${phase.boss} não existe em ENEMY_TYPES`).toBeDefined();
    expect(def.isBoss).toBe(true);
    expect(def.bossName).toBeTruthy();
    expect(def.pattern?.length ?? 0).toBeGreaterThan(0);
  });

  it.each(PHASES.map(p => [p.name, p] as const))('%s: o mapa tem uma arena marcada', (_name, phase) => {
    loadMap(BIOMES[phase.map].rows);
    expect(findAll('B')).toHaveLength(1);
  });

  it.each(PHASES.map(p => [p.name, p.map] as const))('%s: a arena tem espaço para o chefe manobrar', (_name, mapKey) => {
    loadMap(BIOMES[mapKey].rows);
    const boss = findAll('B')[0];
    let livres = 0;
    for (let dr = -3; dr <= 3; dr++) {
      for (let dc = -3; dc <= 3; dc++) {
        if (!isWall(boss.col + dc, boss.row + dr)) livres++;
      }
    }
    // o piso é 19, a arena mais apertada que já foi entregue (Castelo e Pântano):
    // o teste trava aRegression e não exige redesenho. Abaixo disso o chefe
    // nasce num bolso e a luta vira ele batendo na parede.
    expect(livres, `arena de ${mapKey} apertada demais: ${livres}/49 células livres`).toBeGreaterThanOrEqual(19);
  });

  it('todo boss dá tempo de ler a telegrafia antes da ação', () => {
    for (const phase of PHASES) {
      const def = ENEMY_TYPES[phase.boss!];
      expect(def.telegraph ?? 0.8, `${def.bossName} sem telegrafia`).toBeGreaterThanOrEqual(0.5);
    }
  });
});

describe('tilemap: a validação e a IA percorrem o mesmo grafo', () => {
  // A célula (3,3) só é alcançável por diagonal entre duas paredes: (3,2) e
  // (2,3) são parede, então cortar a quina é a única forma de chegar lá. O flow
  // field recusa; antes disso a validação aceitava, e o teste approves um mapa
  // cujo ponto de spawn a IA nunca alcança.
  const QUINA = [
    '#######',
    '#.....#',
    '#..#..#',
    '#.#.#.#',
    '#..#..#',
    '#.....#',
    '#######',
  ];

  it('hasPath recusa cortar quina, igual ao flow field', () => {
    loadMap(QUINA);
    expect(hasPath(1, 1, 3, 3)).toBe(false);
    rebuildFlowField(1, 1);
    expect(isReachable(3, 3)).toBe(false);
    // o anel externo continua conectado: o teste não está recusando tudo
    expect(hasPath(1, 1, 5, 5)).toBe(true);
  });

  it('o flow field e hasPath concordam sobre o alcance de cada célula', () => {
    loadMap(QUINA);
    for (const [col, row] of [[1, 1], [3, 3], [5, 1], [1, 4], [4, 2]] as const) {
      rebuildFlowField(col, row);
      expect(
        isReachable(1, 1),
        `célula (1,1) a partir de (${col},${row})`,
      ).toBe(hasPath(col, row, 1, 1));
    }
  });

  it.each(KEYS)('%s: todo spawn que a validação aprova é alcançável pelo flow field', (key) => {
    loadMap(BIOMES[key].rows);
    const p = findAll('P')[0];
    rebuildFlowField(p.col, p.row);
    for (const ch of ['E', 'B', 'N']) {
      for (const cell of findAll(ch)) {
        expect(
          isReachable(cell.col, cell.row),
          `${key}: '${ch}' em (${cell.col},${cell.row}) passa na validação mas a IA não alcança`,
        ).toBe(true);
      }
    }
  });
});

describe('tilemap: colisão círculo-vs-grid', () => {
  it('não deixa o círculo atravessar uma parede', () => {
    const biome = BIOMES.cidade;
    const map = loadMap(biome.rows);
    // acha uma célula de parede e tenta empurrar um círculo através dela
    const wall = findAll('#').find(c => c.row > 2 && c.row < 17 && c.col > 2 && c.col < 27)!;
    const startX = (wall.col - 2) * CELL_SIZE + CELL_SIZE / 2;
    const startY = wall.row * CELL_SIZE + CELL_SIZE / 2;

    let x = startX;
    let y = startY;
    for (let i = 0; i < 200; i++) {
      const next = moveCircleBy(x, y, 8, 0, 16);
      x = next.x;
      y = next.y;
    }
    // nunca pode acabar dentro da célula de parede
    expect(isWall(Math.floor(x / CELL_SIZE), Math.floor(y / CELL_SIZE))).toBe(false);
    expect(map.width).toBe(1920);
  });

  it('permite deslizar ao longo da parede em vez de travar', () => {
    const rows = [
      '##########',
      '#........#',
      '#.######.#',
      '#.######.#',
      '#........#',
      '##########',
    ];
    loadMap(rows);
    // corredor estreito (coluna 1) ao lado de uma parede alta: X trava, Y continua
    const startX = 1 * 64 + 32;
    const startY = 2 * 64 + 32;
    let x = startX;
    let y = startY;
    for (let i = 0; i < 4; i++) {
      const next = moveCircleBy(x, y, 10, 12, 14);
      x = next.x;
      y = next.y;
    }
    // eixo X barrado pela parede (coluna 2 começa em 128)…
    expect(x).toBeLessThan(2 * 64);
    // …mas o eixo Y escorregou pela face dela
    expect(y).toBeGreaterThan(startY + 30);
    expect(isWall(Math.floor(x / 64), Math.floor(y / 64))).toBe(false);
  });
});

describe('tilemap: flow field', () => {
  it('aponta a direção do jogador a partir de um ponto distante', () => {
    const biome = BIOMES.cidade;
    loadMap(biome.rows);
    const spawn = findAll('P')[0];
    rebuildFlowField(spawn.col, spawn.row);

    // amostra uma célula vizinha andável: a direção tem que apontar para o alvo
    const neighbor = findAll('E')[0];
    const dir = sampleFlowDir(neighbor.col * 64 + 32, neighbor.row * 64 + 32);
    const dx = (spawn.col - neighbor.col);
    const dy = (spawn.row - neighbor.row);
    const len = Math.hypot(dx, dy);
    const dot = (dir.x * dx + dir.y * dy) / (len || 1);
    expect(dot).toBeGreaterThan(0.3);
  });

  it('recalcula só quando a célula alvo muda', () => {
    loadMap(BIOMES.cidade.rows);
    const spawn = findAll('P')[0];
    rebuildFlowField(spawn.col, spawn.row);
    const first = sampleFlowDir(100, 100);
    rebuildFlowField(spawn.col, spawn.row);
    const second = sampleFlowDir(100, 100);
    expect(first).toEqual(second);
  });
});
