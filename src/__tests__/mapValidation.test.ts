import { describe, it, expect } from 'vitest';
import { BIOMES, CELL_SIZE, tileKindAt } from '../maps';
import { ENEMY_TYPES, PHASES } from '../config';
import { TILE_NUMBERS, tileFileName, POSES, WEAPON_CLASSES } from '../systems/sprites';
import { loadMap, hasPath, findAll, isWall, moveCircleBy, rebuildFlowField, sampleFlowDir, isReachable } from '../systems/tilemap';
import { initProps, getBlockingProps } from '../systems/props';

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
  it.each(KEYS)('%s: existe caminho de P até todo E, B, N, R e G', (key) => {
    const biome = BIOMES[key];
    const map = loadMap(biome.rows);
    const spawn = findAll('P')[0];
    expect(spawn).toBeDefined();

    // 'G' (tambores da Refinaria) entra porque é DESTINO DO JOGADOR: um tambor
    // fora de alcance torna o objetivo `collect` impossível de fechar, e a fase
    // nunca libera o chefe. 'B' segue sendo chefe e 'E' spawn — 'G' não é alvo
    // de IA, por isso não aparece no gate de flow field lá embaixo.
    for (const target of ['E', 'B', 'N', 'R', 'G']) {
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

describe('mapas: o tronco não sela região de spawn', () => {
  // O gate de conectividade acima usa `hasPath`, que só enxerga parede — e o
  // flow field do inimigo também. A árvore é o primeiro obstáculo do jogo que
  // existe no mundo e não na grade: ela entra em `circleOverlaps` pelo
  // `setBlockers`, o inimigo colide e desliza, mas nada no campo sabe dela.
  // Um tronco no lugar errado sela uma região inteira e os spawns dentro dela
  // fecham a onda sozinhos — o inimigo nasce, bate no tronco e a fase não
  // termina. Medido: plantar por bosques sem portão deixaria a Floresta e o
  // Pântano nesse estado; o portão do `plantar_arvores.py` (raio 30, o maior
  // inimigo comum) existe por causa deste teste.
  const VIZINHOS: readonly (readonly [number, number])[] = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];

  /** BFS igual ao do `hasPath`, com o tronco contado como parede. */
  function alcancaComTronco(rows: string[], de: { col: number; row: number }, para: { col: number; row: number }): boolean {
    const grade = loadMap(rows);
    initProps(rows.map(linha => linha.split('')));
    const tronco = new Set<number>();
    for (const p of getBlockingProps()) tronco.add(p.row * grade.cols + p.col);
    const bloqueia = (col: number, row: number) =>
      row < 0 || col < 0 || row >= grade.rows || col >= grade.cols ||
      rows[row][col] === '#' || tronco.has(row * grade.cols + col);
    const alvo = para.row * grade.cols + para.col;
    const inicio = de.row * grade.cols + de.col;
    const visto = new Set<number>([inicio]);
    const fila: number[] = [inicio];
    while (fila.length) {
      const cur = fila.shift()!;
      if (cur === alvo) return true;
      const cx = cur % grade.cols;
      const cy = (cur - cx) / grade.cols;
      for (const [dx, dy] of VIZINHOS) {
        if (bloqueia(cx + dx, cy + dy)) continue;
        // mesma regra do hasPath: diagonal não corta quina
        if (dx !== 0 && dy !== 0 && (bloqueia(cx + dx, cy) || bloqueia(cx, cy + dy))) continue;
        const ni = (cy + dy) * grade.cols + (cx + dx);
        if (visto.has(ni)) continue;
        visto.add(ni);
        fila.push(ni);
      }
    }
    return false;
  }

  it.each(KEYS)('%s: todo E, B, N e R ainda alcança o jogador com o tronco plantado', (key) => {
    const rows = BIOMES[key].rows;
    loadMap(rows);
    const spawn = findAll('P')[0];
    for (const target of ['E', 'B', 'N', 'R']) {
      for (const cell of findAll(target)) {
        expect(
          alcancaComTronco(rows, spawn, cell),
          `${key}: ${target} em (${cell.col},${cell.row}) ficou selado pelo tronco`,
        ).toBe(true);
      }
    }
  });
});

describe('rodovia: a faixa de asfalto é estrada de verdade', () => {
  // A Rodovia era piso de pedra com 77 células de ',' decoradas com o tile 260
  // do pack — uma marca laranja/cinza repetida, que lia como padrão e foi
  // escolhida por número sem nunca ser aberta. A faixa agora usa caracteres
  // próprios ('=', ':', '-', '_'), desenhados como asfalto autoral por
  // buildTerrain. O gate trava o contrato: os caracteres existem no mapa, toda
  // célula de asfalto é caminável e alcançável do spawn, e a pista não depende
  // mais do piso do bioma.
  const CHAVES_ASFALTO = '=:_-';

  it('a faixa usa os caracteres de asfalto e não sobrou vírgula', () => {
    const linhas = BIOMES.rodovia.rows.join('');
    for (const ch of CHAVES_ASFALTO) {
      expect(linhas.includes(ch), `personagem ${ch} sumiu do mapa da Rodovia`).toBe(true);
    }
    expect(linhas.includes(','), 'sobrou célula de "," na Rodovia — a faixa é asfalto, não decor').toBe(false);
  });

  it('toda célula de asfalto é caminável e alcançável do spawn', () => {
    loadMap(BIOMES.rodovia.rows);
    const spawn = findAll('P')[0];
    let celulas = 0;
    for (let row = 0; row < BIOMES.rodovia.rows.length; row++) {
      for (let col = 0; col < BIOMES.rodovia.rows[row].length; col++) {
        if (!CHAVES_ASFALTO.includes(BIOMES.rodovia.rows[row][col])) continue;
        celulas++;
        expect(isWall(col, row), `asfalto em (${col},${row}) bloqueia passagem`).toBe(false);
        expect(hasPath(spawn.col, spawn.row, col, row), `asfalto em (${col},${row}) inalcançável`).toBe(true);
      }
    }
    // a faixa entregue tem 77 células; abaixo disso o mapa encolheu a estrada
    expect(celulas).toBeGreaterThanOrEqual(60);
  });

  it('o jogador nasce na faixa de asfalto', () => {
    loadMap(BIOMES.rodovia.rows);
    const spawn = findAll('P')[0];
    // a célula do spawn guarda o 'P', então a faixa se confirma pelos vizinhos:
    // nascer fora da estrada deixaria o traço da pista fora da primeira tela
    const vizinhos = [
      BIOMES.rodovia.rows[spawn.row - 1]?.[spawn.col],
      BIOMES.rodovia.rows[spawn.row + 1]?.[spawn.col],
      BIOMES.rodovia.rows[spawn.row][spawn.col - 1],
      BIOMES.rodovia.rows[spawn.row][spawn.col + 1],
    ];
    expect(vizinhos.some(v => v && CHAVES_ASFALTO.includes(v))).toBe(true);
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
    for (const ch of ['E', 'B', 'N', 'R']) {
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

describe('objetivo reach: a zona de extração existe e é alcançável', () => {
  const reachFases = PHASES.filter(f => f.objective === 'reach');

  it('pelo menos uma fase usa reach (o objetivo existia no código sem nenhum mapa)', () => {
    expect(reachFases.length).toBeGreaterThan(0);
  });

  it.each(reachFases.map(f => [f.name, f.map] as const))(
    '%s: o mapa tem zona de extração',
    (_name, mapKey) => {
      loadMap(BIOMES[mapKey].rows);
      expect(findAll('R')).toHaveLength(1);
    },
  );

  it('toda zona de reach fica longe o bastante do spawn para ser um trajeto', () => {
    for (const fase of reachFases) {
      loadMap(BIOMES[fase.map].rows);
      const p = findAll('P')[0];
      const r = findAll('R')[0];
      const dist = Math.hypot(r.col - p.col, r.row - p.row);
      // uma zona colada no spawn não é objetivo: é um passo
      expect(dist, `${fase.name}: zona a ${dist} células do spawn`).toBeGreaterThanOrEqual(8);
    }
  });
});

describe('árvores: o tronco bloqueia passagem sem selar o mapa', () => {
  // A árvore é o único prop que segura o passo (props.ts). O QUE PODE Dar errado
  // é medido: raio de colisão 20 contra copa de 27, e o maior corpo do jogo
  // tem raio 26 (mutante/tank). Um tronco no lugar errado sela um corredor, o
  // inimigo para na folhagem, a onda nunca fecha — o mesmo travamento que a
  // parede já causou. Medido no Castelo: dois caixotes nos dois únicos vãos de
  // 1 célula fecham 116 das 375 células (31%).
  //
  // O portão é contínuo, não de grade: BFS de célula deixaria passar a árvore
  // ENCOSTADA no corredor, porque a célula do corredor continua livre — só que
  // um círculo de 30 não caberia mais por ela.
  // O raio é o do maior inimigo COMUM (magmaGolem, 30 em config.ts). Boss tem
  // `isBoss` e raio até 54 — não respeita corredor de célula: a arena dele é
  // outra conversa, e incluí-lo aqui reprovaria todo mapa do jogo.
  const RAIO = Math.max(
    ...Object.values(ENEMY_TYPES).filter(e => !e.isBoss).map(e => e.radius),
  );
  const ARVORE = 20;
  const PASSO = RAIO / 2;

  type Cel = { col: number; row: number };

  /** Um círculo de raio RAIO cabe centrado neste ponto do mundo? */
  function cabe(rows: string[], arvores: Cel[], px: number, py: number): boolean {
    const col = Math.floor(px / CELL_SIZE);
    const row = Math.floor(py / CELL_SIZE);
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (rows[r]?.[c] !== '#') continue;
        // distância do ponto ao retângulo da parede
        const dx = Math.max(c * CELL_SIZE - px, 0, px - (c + 1) * CELL_SIZE);
        const dy = Math.max(r * CELL_SIZE - py, 0, py - (r + 1) * CELL_SIZE);
        if (Math.hypot(dx, dy) < RAIO) return false;
      }
    }
    for (const a of arvores) {
      const ax = (a.col + 0.5) * CELL_SIZE;
      const ay = (a.row + 0.5) * CELL_SIZE;
      if (Math.hypot(px - ax, py - ay) < RAIO + ARVORE) return false;
    }
    return true;
  }

  /** Um círculo de raio RAIO atravessa do centro de uma célula à da vizinha? */
  function passagem(rows: string[], arvores: Cel[], a: Cel, b: Cel): boolean {
    const x1 = (a.col + 0.5) * CELL_SIZE;
    const y1 = (a.row + 0.5) * CELL_SIZE;
    const x2 = (b.col + 0.5) * CELL_SIZE;
    const y2 = (b.row + 0.5) * CELL_SIZE;
    const n = Math.max(1, Math.round(CELL_SIZE / PASSO));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      if (!cabe(rows, arvores, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
    }
    return true;
  }

  /** Quantas células do mapa o maior inimigo não alcança mais, do spawn. */
  function inalcancaveis(rows: string[], arvores: Cel[]): number {
    let inicio: Cel | undefined;
    for (let row = 0; row < rows.length; row++) {
      for (let col = 0; col < rows[row].length; col++) {
        if (rows[row][col] === 'P') inicio = { col, row };
      }
    }
    if (!inicio) return -1;
    if (!cabe(rows, arvores, (inicio.col + 0.5) * CELL_SIZE, (inicio.row + 0.5) * CELL_SIZE)) {
      return Number.MAX_SAFE_INTEGER;
    }
    const vistos = new Set<string>([`${inicio.col},${inicio.row}`]);
    const fila: Cel[] = [inicio];
    while (fila.length) {
      const { col, row } = fila.pop()!;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const b = { col: col + dc, row: row + dr };
        const chave = `${b.col},${b.row}`;
        if (vistos.has(chave)) continue;
        if (rows[b.row]?.[b.col] === undefined || rows[b.row][b.col] === '#') continue;
        if (arvores.some(a => a.col === b.col && a.row === b.row)) continue;
        if (!passagem(rows, arvores, { col, row }, b)) continue;
        vistos.add(chave);
        fila.push(b);
      }
    }
    let total = 0;
    for (let row = 0; row < rows.length; row++) {
      for (let col = 0; col < rows[row].length; col++) {
        if (rows[row][col] === '#') continue;
        if (arvores.some(a => a.col === col && a.row === row)) continue;
        total++;
      }
    }
    return total - vistos.size;
  }

  const COM_ARVORE: Record<string, string> = { floresta: 'T', pantano: 'D' };

  it('só a floresta e o pântano têm árvore, e os dois têm', () => {
    for (const [key, ch] of Object.entries(COM_ARVORE)) {
      const linhas = BIOMES[key].rows.join('');
      expect(linhas.includes(ch), `${key} ficou sem árvore`).toBe(true);
    }
    for (const key of KEYS) {
      const linhas = BIOMES[key].rows.join('');
      const dono = COM_ARVORE[key];
      for (const ch of Object.values(COM_ARVORE)) {
        if (ch === dono) continue;
        expect(linhas.includes(ch), `${key} tem ${ch}, que é de outro bioma`).toBe(false);
      }
    }
  });

  it('a árvore nasce em piso e longe do spawn', () => {
    for (const [key, ch] of Object.entries(COM_ARVORE)) {
      const rows = BIOMES[key].rows;
      const p = rows.join('').indexOf('P');
      const pCol = p % 30;
      const pRow = Math.floor(p / 30);
      let quantas = 0;
      for (let row = 0; row < rows.length; row++) {
        for (let col = 0; col < rows[row].length; col++) {
          if (rows[row][col] !== ch) continue;
          quantas++;
          // o piso embaixo é piso: a copa é prop, não parede de grid
          expect(isWall(col, row), `${key}: árvore em (${col},${row}) sobre parede`).toBe(false);
          // duas células de distância do spawn: o jogador nasce com espaço
          expect(Math.max(Math.abs(col - pCol), Math.abs(row - pRow)),
            `${key}: árvore em (${col},${row}) colada no spawn`).toBeGreaterThan(2);
          // a vizinhança imediata não é parede: tronco encostado em parede
          // não é árvore, é canto
          const vizinhos = [
            rows[row - 1]?.[col], rows[row + 1]?.[col],
            rows[row][col - 1], rows[row][col + 1],
          ];
          expect(vizinhos.some(v => v === '#'),
            `${key}: árvore em (${col},${row}) encostada em parede`).toBe(false);
        }
      }
      expect(quantas, `${key}: bosque pequeno demais`).toBeGreaterThanOrEqual(12);
    }
  });

  it('nenhuma árvore sela o mapa para o maior inimigo', () => {
    for (const [key, ch] of Object.entries(COM_ARVORE)) {
      const rows = BIOMES[key].rows;
      const arvores: Cel[] = [];
      for (let row = 0; row < rows.length; row++) {
        for (let col = 0; col < rows[row].length; col++) {
          if (rows[row][col] === ch) arvores.push({ col, row });
        }
      }
      expect(inalcancaveis(rows, arvores), `${key}: células seladas pelas árvores`).toBe(0);
    }
  });

  it('o portão morde: um tronco no corredor da direita reprova', () => {
    // contrato testemunhável, não ausência de sintoma: (28,3) é o corredor
    // vertical da borda da floresta, e a célula a leste dele (28,2) só se
    // alcança por ali. Se o portão passar a deixar essa árvore entrar, o
    // mapa selou e a trava nunca fecha.
    const rows = BIOMES.floresta.rows.map((r, i) => (i === 3 ? r.slice(0, 28) + 'T' + r.slice(29) : r));
    expect(inalcancaveis(rows, [{ col: 28, row: 3 }])).toBeGreaterThan(0);
  });
});

describe('árvores: a colisão real segura o passo (funções de produção)', () => {
  // Prova com as funções de verdade, não com a contabilidade do teste: carrega
  // o mapa, chama o `initProps` da fase e empurra um círculo de raio do
  // JOGADOR contra o tronco. Antes do registro em tilemap, `moveCircleBy` só
  // sabia de parede — o tronco era decoração e o jogador passava por cima.
  const PLAYER = 18;

  it('o corpo empurrado contra o tronco não entra nele', () => {
    loadMap(BIOMES.floresta.rows);
    initProps(BIOMES.floresta.rows.map(r => r.split('')));
    const arvore = BIOMES.floresta.rows.join('').indexOf('T');
    const col = arvore % 30;
    const row = Math.floor(arvore / 30);
    const ax = (col + 0.5) * CELL_SIZE;
    const ay = (row + 0.5) * CELL_SIZE;

    // começa a uma célula de distância e caminha 3 células na direção do tronco
    const dirs: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dc, dr] of dirs) {
      let x = ax - dc * CELL_SIZE;
      let y = ay - dr * CELL_SIZE;
      for (let passo = 0; passo < 96; passo++) {
        const next = moveCircleBy(x, y, dc * 2, dr * 2, PLAYER);
        x = next.x;
        y = next.y;
      }
      // 38px de soma de raios: o jogador para na borda da folhagem, não no
      // centro. Se ele chegasse ao centro, o registro do bloqueio não valeu.
      expect(Math.hypot(x - ax, y - ay),
        `chegou a ${Math.hypot(x - ax, y - ay).toFixed(1)}px do tronco vindo de (${dc},${dr})`)
        .toBeGreaterThan(PLAYER + 20 - 2);
    }
  });

  it('sem o registro, o mesmo caminho atravessa — é o antes do bloqueio', () => {
    // contraparte que reprova o teste de cima: o mapa carregado SEM `initProps`
    // não registra tronco nenhum, e o corpo atravessa a célula da árvore. Se os
    // dois passassem, a colisão não estaria medindo nada.
    loadMap(BIOMES.floresta.rows);
    const arvore = BIOMES.floresta.rows.join('').indexOf('T');
    const ax = ((arvore % 30) + 0.5) * CELL_SIZE;
    const ay = (Math.floor(arvore / 30) + 0.5) * CELL_SIZE;
    let x = ax - CELL_SIZE;
    for (let i = 0; i < 64; i++) x = moveCircleBy(x, ay, 2, 0, PLAYER).x;
    expect(x, 'sem tronco registrado o corpo passa reto').toBeGreaterThan(ax + 32);
  });

  it('o corpo desliza na folhagem em vez de travar nela', () => {
    // andar de frente empaca, andar de lado passa: é o deslize do `sweepAxis`
    // valendo também para prop. Sem isso o inimigo encostaria na árvore e a
    // onda nunca fecharia. Mapa sintético de 6x10 porque a Floresta tem
    // árvore entalada entre parede e tronco, que é outro caso (e o portão de
    // plantio já garante que esse caso não sela nada).
    const linhas = ['##########', '#........#', '#...T....#', '#........#', '#........#', '##########'];
    loadMap(linhas);
    initProps(linhas.map(l => l.split('')));
    let x = 160;
    let y = 96;
    for (let i = 0; i < 90; i++) {
      const next = moveCircleBy(x, y, 2, 1.2, PLAYER);
      x = next.x;
      y = next.y;
    }
    expect(Math.hypot(x - 256, y - 160), 'o corpo nunca entra no tronco').toBeGreaterThan(38);
    expect(x, 'houve escorregão: o corpo passou pela árvore').toBeGreaterThan(256);
  });

  it('por uma passagem aberta o corpo atravessa o mapa inteiro', () => {
    // o bloqueio é local, não uma parede nova: o piso em volta continua piso.
    loadMap(BIOMES.floresta.rows);
    initProps(BIOMES.floresta.rows.map(r => r.split('')));
    const arvores: { col: number; row: number }[] = [];
    BIOMES.floresta.rows.forEach((r, row) => {
      for (let col = 0; col < r.length; col++) if (r[col] === 'T') arvores.push({ col, row });
    });
    const alvo = arvores.find(a =>
      BIOMES.floresta.rows[a.row][a.col - 1] === '.' && BIOMES.floresta.rows[a.row][a.col + 1] === '.');
    const ax = (alvo!.col + 0.5) * CELL_SIZE;
    const ay = (alvo!.row + 0.5) * CELL_SIZE + 60;
    let x = ax - 96;
    for (let i = 0; i < 96; i++) x = moveCircleBy(x, ay, 2, 0, PLAYER).x;
    expect(x).toBeGreaterThan(ax + 32);
  });
});
