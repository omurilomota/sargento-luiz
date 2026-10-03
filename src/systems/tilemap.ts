/**
 * src/systems/tilemap.ts
 *
 * Grid do mapa, colisão círculo-vs-grid com deslize por eixo e flow field.
 *
 * O flow field (Dijkstra a partir da célula do jogador) substitui o A* por
 * inimigo: 600 células são triviais, o custo por inimigo é zero e de brinde
 * resolve o empilhamento — todos os inimigos leem a mesma direção de descida.
 */

import { CELL_SIZE, tileKindAt } from '../maps';

/** Uma malha carregada de um mapa */
export interface Tilemap {
  cols: number;
  rows: number;
  /** Matriz de caracteres (rows × cols) */
  cells: string[][];
  /** Largura do mundo em pixels */
  width: number;
  /** Altura do mundo em pixels */
  height: number;
}

/** Mapa atualmente carregado (null antes do primeiro loadMap) */
let map: Tilemap | null = null;
/** Custo (em décimos de célula) até a célula alvo do flow field */
let flowDist: Int32Array | null = null;
/** Direção de descida por célula (dx, dy normalizado) */
let flowDir: Float32Array | null = null;
/** Célula de destino usada no último cálculo */
let flowTargetCol = -1;
let flowTargetRow = -1;

const NEIGHBORS: readonly (readonly [number, number])[] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

/**
 * Carrega um mapa a partir das linhas de string.
 * @param rows - linhas do mapa, todas do mesmo tamanho
 */
export function loadMap(rows: string[]): Tilemap {
  const r = rows.length;
  const c = rows[0]?.length ?? 0;
  const cells = rows.map(line => line.split(''));
  map = { cols: c, rows: r, cells, width: c * CELL_SIZE, height: r * CELL_SIZE };
  flowDist = new Int32Array(c * r);
  flowDir = new Float32Array(c * r * 2);
  flowTargetCol = -1;
  flowTargetRow = -1;
  return map;
}

/** Retorna o mapa carregado ou null. */
export function getMap(): Tilemap | null {
  return map;
}

/** Retorna a largura do mundo em pixels (ou 0 se não há mapa). */
export function getMapWidth(): number { return map ? map.width : 0; }

/** Retorna a altura do mundo em pixels (ou 0 se não há mapa). */
export function getMapHeight(): number { return map ? map.height : 0; }

/** Converte pixel X em índice de coluna, com clamp. */
export function colAt(px: number): number {
  if (!map) return 0;
  return Math.max(0, Math.min(map.cols - 1, Math.floor(px / CELL_SIZE)));
}

/** Converte pixel Y em índice de linha, com clamp. */
export function rowAt(py: number): number {
  if (!map) return 0;
  return Math.max(0, Math.min(map.rows - 1, Math.floor(py / CELL_SIZE)));
}

/**
 * Retorna o caractere de uma célula. Fora do mapa é parede (não andável),
 * o que impede o jogador de sair andando pela borda sem clamp explícito.
 */
export function charAt(col: number, row: number): string {
  if (!map) return '#';
  if (col < 0 || row < 0 || col >= map.cols || row >= map.rows) return '#';
  return map.cells[row][col];
}

/** Retorna o tipo de tile de uma célula. */
export function kindAt(col: number, row: number) {
  return tileKindAt(charAt(col, row));
}

/** Verifica se a célula é parede (bloqueia movimento). */
export function isWall(col: number, row: number): boolean {
  return charAt(col, row) === '#';
}

/** Verifica se um ponto em pixels está sobre uma parede. */
export function isWallAtPx(px: number, py: number): boolean {
  return isWall(colAt(px), rowAt(py));
}

/** Verifica se um círculo sobrepõe qualquer parede próxima. */
function circleOverlaps(x: number, y: number, r: number): boolean {
  if (!map) return false;
  const minCol = colAt(x - r);
  const maxCol = colAt(x + r);
  const minRow = rowAt(y - r);
  const maxRow = rowAt(y + r);
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (!isWall(col, row)) continue;
      const nx = Math.max(col * CELL_SIZE, Math.min(x, (col + 1) * CELL_SIZE));
      const ny = Math.max(row * CELL_SIZE, Math.min(y, (row + 1) * CELL_SIZE));
      const dx = x - nx;
      const dy = y - ny;
      if (dx * dx + dy * dy < r * r) return true;
    }
  }
  return false;
}

/**
 * Percorre um eixo do `start` até o `target` devolvendo a primeira posição
 * livre. É o que dá o deslize: ao bater na parede o eixo travado para, mas
 * o outro continua, e o corpo escorrega ao longo da face em vez de travar.
 */
function sweepAxis(fixed: number, start: number, target: number, radius: number, horizontal: boolean): number {
  const delta = target - start;
  if (delta === 0) return start;
  const steps = Math.max(1, Math.ceil(Math.abs(delta) / 3));
  for (let s = steps; s >= 0; s--) {
    const candidate = start + delta * (s / steps);
    const px = horizontal ? candidate : fixed;
    const py = horizontal ? fixed : candidate;
    if (!circleOverlaps(px, py, radius)) return candidate;
  }
  return start;
}

/**
 * Move um círculo pelo grid resolvendo X e Y separadamente.
 * @param x - X atual
 * @param y - Y atual
 * @param dx - deslocamento X desejado
 * @param dy - deslocamento Y desejado
 * @param radius - raio do círculo
 * @returns nova posição com o deslize aplicado
 */
export function moveCircleBy(x: number, y: number, dx: number, dy: number, radius: number): { x: number; y: number } {
  if (!map) return { x: x + dx, y: y + dy };
  const minX = radius;
  const maxX = map.width - radius;
  const minY = radius;
  const maxY = map.height - radius;

  const clampedTargetX = Math.max(minX, Math.min(maxX, x + dx));
  let nx = sweepAxis(y, x, clampedTargetX, radius, true);
  nx = Math.max(minX, Math.min(maxX, nx));

  const clampedTargetY = Math.max(minY, Math.min(maxY, y + dy));
  let ny = sweepAxis(nx, y, clampedTargetY, radius, false);
  ny = Math.max(minY, Math.min(maxY, ny));

  return { x: nx, y: ny };
}

/**
 * Empurra um círculo para fora de paredes em que já está (usado depois de
 * explosões e teleports, quando não há deslocamento varrido).
 * @param x - X atual
 * @param y - Y atual
 * @param radius - raio do círculo
 */
export function pushOutOfWalls(x: number, y: number, radius: number): { x: number; y: number } {
  if (!map || !circleOverlaps(x, y, radius)) return { x, y };
  const step = CELL_SIZE / 2;
  for (let d = step; d <= CELL_SIZE * 3; d += step) {
    const tries: [number, number][] = [
      [x + d, y], [x - d, y], [x, y + d], [x, y - d],
      [x + d, y + d], [x - d, y + d], [x + d, y - d], [x - d, y - d],
    ];
    for (const [tx, ty] of tries) {
      const cx = Math.max(radius, Math.min(map.width - radius, tx));
      const cy = Math.max(radius, Math.min(map.height - radius, ty));
      if (!circleOverlaps(cx, cy, radius)) return { x: cx, y: cy };
    }
  }
  return { x, y };
}

/**
 * Verifica se um segmento de linha cruza alguma parede (linha de tiro).
 */
export function segmentHitsWall(x0: number, y0: number, x1: number, y1: number): boolean {
  if (!map) return false;
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (CELL_SIZE * 0.4));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    if (isWallAtPx(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return true;
  }
  return false;
}

// ─── Flow field ───────────────────────────────────────────────

/**
 * Recalcula o flow field a partir de uma célula alvo. Só refaz o trabalho
 * quando a célula alvo muda, então o custo real é desprezível.
 */
export function rebuildFlowField(targetCol: number, targetRow: number): void {
  if (!map || !flowDist || !flowDir) return;
  if (targetCol === flowTargetCol && targetRow === flowTargetRow) return;

  let tc = targetCol;
  let tr = targetRow;
  if (isWall(tc, tr)) {
    let found = false;
    for (let d = 1; d <= 4 && !found; d++) {
      for (let dy = -d; dy <= d && !found; dy++) {
        for (let dx = -d; dx <= d && !found; dx++) {
          if (!isWall(tc + dx, tr + dy)) {
            tc += dx; tr += dy;
            found = true;
          }
        }
      }
    }
    if (!found) return;
  }
  flowTargetCol = tc;
  flowTargetRow = tr;

  const n = map.cols * map.rows;
  flowDist.fill(-1);
  flowDir.fill(0);

  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;
  flowDist[tr * map.cols + tc] = 0;
  queue[tail++] = tr * map.cols + tc;

  while (head < tail) {
    const cur = queue[head++];
    const cx = cur % map.cols;
    const cy = (cur - cx) / map.cols;
    const cd = flowDist[cur];
    for (const [dx, dy] of NEIGHBORS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= map.cols || ny >= map.rows) continue;
      if (isWall(nx, ny)) continue;
      // não cortar quina: as duas ortogonais adjacentes precisam estar livres
      if (dx !== 0 && dy !== 0 && (isWall(cx + dx, cy) || isWall(cx, cy + dy))) continue;
      const ni = ny * map.cols + nx;
      const step = dx !== 0 && dy !== 0 ? 14 : 10;
      const nd = cd + step;
      if (flowDist[ni] === -1 || nd < flowDist[ni]) {
        flowDist[ni] = nd;
        queue[tail++] = ni;
      }
    }
  }

  // direção de descida: vizinha de menor custo
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      const i = row * map.cols + col;
      if (flowDist[i] === -1) continue;
      let best = flowDist[i];
      let bx = 0;
      let by = 0;
      for (const [dx, dy] of NEIGHBORS) {
        const nx = col + dx;
        const ny = row + dy;
        if (nx < 0 || ny < 0 || nx >= map.cols || ny >= map.rows) continue;
        const ni = ny * map.cols + nx;
        if (flowDist[ni] === -1 || flowDist[ni] >= best) continue;
        best = flowDist[ni];
        bx = dx;
        by = dy;
      }
      if (bx === 0 && by === 0) continue;
      const len = Math.hypot(bx, by) || 1;
      flowDir[i * 2] = bx / len;
      flowDir[i * 2 + 1] = by / len;
    }
  }
}

/**
 * Retorna a direção de descida do flow field numa posição em pixels.
 * Retorna {x:0,y:0} quando não há mapa ou a célula é inalcançável.
 */
export function sampleFlowDir(px: number, py: number): { x: number; y: number } {
  if (!map || !flowDir) return { x: 0, y: 0 };
  const i = rowAt(py) * map.cols + colAt(px);
  return { x: flowDir[i * 2], y: flowDir[i * 2 + 1] };
}

/** Verifica se uma célula é alcançável a partir do alvo do flow field. */
export function isReachable(col: number, row: number): boolean {
  if (!map || !flowDist) return false;
  if (col < 0 || row < 0 || col >= map.cols || row >= map.rows) return false;
  return flowDist[row * map.cols + col] !== -1;
}

/**
 * Verifica se existe caminho andável entre duas células (BFS).
 * Usado pelos testes de validação de mapa.
 *
 * Aplica a mesma regra de `rebuildFlowField`: diagonal não corta quina. Sem
 * isso o teste dizia que um mapa era válido por um caminho que o flow field
 * recusa, e o ponto de spawn ficava `flowDist === -1` — inimigo que não
 * consegue pathar até o jogador, sem nenhum aviso.
 */
export function hasPath(fromCol: number, fromRow: number, toCol: number, toRow: number): boolean {
  if (!map) return false;
  if (isWall(toCol, toRow)) return false;
  if (isWall(fromCol, fromRow)) return false;
  const start = fromRow * map.cols + fromCol;
  const seen = new Set<number>([start]);
  const queue: number[] = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    const cx = cur % map.cols;
    const cy = (cur - cx) / map.cols;
    if (cx === toCol && cy === toRow) return true;
    for (const [dx, dy] of NEIGHBORS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (isWall(nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (isWall(cx + dx, cy) || isWall(cx, cy + dy))) continue;
      const ni = ny * map.cols + nx;
      if (seen.has(ni)) continue;
      seen.add(ni);
      queue.push(ni);
    }
  }
  return false;
}

/** Lista todas as coordenadas com um dado caractere. */
export function findAll(ch: string): { col: number; row: number }[] {
  const out: { col: number; row: number }[] = [];
  if (!map) return out;
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      if (map.cells[row][col] === ch) out.push({ col, row });
    }
  }
  return out;
}

/** Lista todas as células com hazard. */
export function findHazards(): { col: number; row: number }[] {
  return findAll('^');
}
