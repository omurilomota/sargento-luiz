/**
 * Prerender do terreno com tint por bioma.
 *
 * Desenhar 30×20 tiles por frame seria ~600 `drawImage`/frame. Aqui o terreno
 * inteiro é desenhado UMA vez num canvas offscreen do tamanho do mapa, recebe
 * uma dessaturação + `multiply` com a cor do bioma e um leve `overlay` de
 * granulação, e por frame o jogo faz um único `drawImage` deslocado pela câmera.
 *
 * Paredes e hazards são desenhados proceduralmente: tile do Kenney com borda
 * direcional não serve como geometria legível, e é aqui que o jogador precisa
 * ler "isto bloqueia" num relance.
 */

import { Biome, CELL_SIZE } from '../maps';
import { getSprite } from './sprites';

/** Canvas offscreen do terreno já tintado (null antes do primeiro build) */
let prerendered: HTMLCanvasElement | null = null;
/** Chave do bioma do terrain Currently prerenderizado */
let prerenderedKey = '';

/** Cache de tiles já dessaturados e tingidos, por (número do Kenney, cor do bioma) */
const floorTileCache = new Map<string, HTMLCanvasElement>();

/** Desenha o mapa inteiro num offscreen e aplica o tint do bioma. */
export function buildTerrain(biome: Biome, cells: string[][]): HTMLCanvasElement {
  const cols = cells[0]?.length ?? 0;
  const rows = cells.length;
  const off = document.createElement('canvas');
  off.width = cols * CELL_SIZE;
  off.height = rows * CELL_SIZE;
  const c = off.getContext('2d')!;

  // base
  c.fillStyle = biome.floor;
  c.fillRect(0, 0, off.width, off.height);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ch = cells[row][col];
      const px = col * CELL_SIZE;
      const py = row * CELL_SIZE;
      switch (ch) {
        case '#': drawWall(c, px, py, biome, cells, col, row); break;
        case ',': drawDecor(c, px, py, biome, (col * 7 + row * 13) % 4); break;
        case '^': drawHazard(c, px, py, biome); break;
        default: drawFloor(c, px, py, biome, (col * 31 + row * 17) % biome.floorTiles.length); break;
      }
    }
  }

  applyTint(c, off, biome);
  prerendered = off;
  prerenderedKey = biome.key;
  return off;
}

/**
 * Piso: tile do Kenney dessaturado e multiplicado pela cor do bioma.
 *
 * O multiply pela cor do chão é o que resolve o conflito "pack saturated e
 * claro" × "paleta sóbria": o tile continua dando textura, mas o valor e o tom
 * saem do bioma. Sem ele, o chão do Kenney brilha e o jogador lê o piso como
 * objeto em vez de espaço.
 */
function drawFloor(c: CanvasRenderingContext2D, px: number, py: number, biome: Biome, variant: number): void {
  const n = biome.floorTiles[variant % biome.floorTiles.length];
  const tile = getFloorTile(n, biome.floor);
  if (tile) {
    c.drawImage(tile, px, py, CELL_SIZE, CELL_SIZE);
    return;
  }
  // fallback sem tile carregado: mesmo tom, com variação de valor
  c.fillStyle = biome.floor;
  c.fillRect(px, py, CELL_SIZE, CELL_SIZE);
  if ((variant % 3) === 0) {
    c.fillStyle = shade(biome.floor, 0.12);
    c.fillRect(px + 8, py + 12, 20, 14);
  }
}

/**
 * Chão decorativo: manchas largas de terra batida.
 * Sprite do Kenney aqui virava lixo espalhado — lê como entulho aleatório e
 * suja o gameplay. É variação de tom, não objeto.
 */
function drawDecor(c: CanvasRenderingContext2D, px: number, py: number, biome: Biome, variant: number): void {
  c.fillStyle = biome.floor;
  c.fillRect(px, py, CELL_SIZE, CELL_SIZE);
  const tone = variant % 2 === 0 ? shade(biome.floor, 0.09) : shade(biome.floor, -0.09);
  c.fillStyle = tone;
  c.beginPath();
  c.ellipse(px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE * 0.44, CELL_SIZE * 0.36, 0, 0, Math.PI * 2);
  c.fill();
}

/** Hazard: mancha de hazard tingida com a cor do bioma. */
function drawHazard(c: CanvasRenderingContext2D, px: number, py: number, biome: Biome): void {
  c.fillStyle = biome.floor;
  c.fillRect(px, py, CELL_SIZE, CELL_SIZE);
  c.fillStyle = biome.hazardColor;
  c.globalAlpha = 0.5;
  c.beginPath();
  c.ellipse(px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE * 0.42, CELL_SIZE * 0.34, 0, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 0.8;
  c.strokeStyle = shade(biome.hazardColor, -0.25);
  c.lineWidth = 3;
  c.stroke();
  c.globalAlpha = 1;
}

/**
 * Parede: laje sólida e escura, com uma "face" iluminada no topo quando o
 * vizinho de cima é chão e contorno preto em todo contato com o chão.
 *
 * A leitura "isto bloqueia" precisa acontecer num relance, então a parede é
 * sempre bem mais escura que o piso e tem uma silhueta fechada — sem isso o
 * mapa vira um código de barras e o jogador não sabe onde pode andar.
 */
function drawWall(
  c: CanvasRenderingContext2D,
  px: number, py: number,
  biome: Biome,
  cells: string[][],
  col: number, row: number
): void {
  const isWall = (cc: number, rr: number): boolean =>
    rr < 0 || cc < 0 || rr >= cells.length || cc >= cells[0].length || cells[rr][cc] === '#';

  c.fillStyle = biome.wall;
  c.fillRect(px, py, CELL_SIZE, CELL_SIZE);

  // textura de laje: uma placa por célula, com argamassa visível
  c.strokeStyle = 'rgba(0,0,0,0.28)';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(px, py + 32);
  c.lineTo(px + CELL_SIZE, py + 32);
  c.moveTo(px + 32, py);
  c.lineTo(px + 32, py + 32);
  c.stroke();
  c.strokeStyle = shade(biome.wall, 0.22);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(px, py + 34);
  c.lineTo(px + CELL_SIZE, py + 34);
  c.moveTo(px + 34, py);
  c.lineTo(px + 34, py + 32);
  c.stroke();

  // face superior mais clara: dá volume e separa a parede do chão
  if (!isWall(col, row - 1)) {
    c.fillStyle = shade(biome.wall, 0.42);
    c.fillRect(px, py, CELL_SIZE, 16);
    c.fillStyle = shade(biome.accent, -0.15);
    c.fillRect(px, py + 16, CELL_SIZE, 3);
  }

  // contorno fechado onde encosta em chão andável
  c.strokeStyle = 'rgba(0,0,0,0.75)';
  c.lineWidth = 3;
  c.beginPath();
  if (!isWall(col, row - 1)) { c.moveTo(px - 1.5, py - 1.5); c.lineTo(px + CELL_SIZE + 1.5, py - 1.5); }
  if (!isWall(col, row + 1)) { c.moveTo(px - 1.5, py + CELL_SIZE + 1.5); c.lineTo(px + CELL_SIZE + 1.5, py + CELL_SIZE + 1.5); }
  if (!isWall(col - 1, row)) { c.moveTo(px - 1.5, py - 1.5); c.lineTo(px - 1.5, py + CELL_SIZE + 1.5); }
  if (!isWall(col + 1, row)) { c.moveTo(px + CELL_SIZE + 1.5, py - 1.5); c.lineTo(px + CELL_SIZE + 1.5, py + CELL_SIZE + 1.5); }
  c.stroke();
}

/**
 * Aplica o tint do bioma: multiply com a cor + overlay de granulação.
 * É o que resolve o conflito "Kenney flat e saturado" × "paleta sóbria".
 */
function applyTint(c: CanvasRenderingContext2D, off: HTMLCanvasElement, biome: Biome): void {
  c.save();
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = '#808080';
  c.fillRect(0, 0, off.width, off.height);

  c.globalCompositeOperation = 'multiply';
  c.fillStyle = biome.tint;
  c.fillRect(0, 0, off.width, off.height);

  c.globalCompositeOperation = 'overlay';
  c.globalAlpha = biome.grainAlpha;
  c.fillStyle = biome.grain;
  c.fillRect(0, 0, off.width, off.height);

  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.restore();
}

/** Cacheia a versão dessaturada e tingida de um tile do Kenney. */
function getFloorTile(n: number, biomeColor: string): HTMLCanvasElement | null {
  const key = `${n}:${biomeColor}`;
  const cached = floorTileCache.get(key);
  if (cached) return cached;
  const img = getSprite(`tile_${n}`);
  if (!img) return null;
  const off = document.createElement('canvas');
  off.width = CELL_SIZE;
  off.height = CELL_SIZE;
  const c = off.getContext('2d')!;
  c.drawImage(img, 0, 0, CELL_SIZE, CELL_SIZE);
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = '#808080';
  c.fillRect(0, 0, CELL_SIZE, CELL_SIZE);
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = biomeColor;
  c.fillRect(0, 0, CELL_SIZE, CELL_SIZE);
  c.globalCompositeOperation = 'source-over';
  floorTileCache.set(key, off);
  return off;
}

/**
 * Desenha o terreno já tintado.
 * Chamado de dentro do espaço transladado pela câmera: o destino é a própria
 * coordenada de mundo e o canvas recorta o que cai fora da viewport.
 *
 * Não centraliza nada aqui. A câmera já centraliza quando o mundo é menor que
 * a viewport (`clampToWorld` devolve um valor negativo), então centralizar
 * também aqui aplicava o offset duas vezes: numa janela de 2560px o mapa de
 * 1920px aparecia deslocado 320px para a direita, com a borda esquerda vazia e
 * a direita cortada.
 * @param ctx - contexto 2D principal
 */
export function drawTerrain(ctx: CanvasRenderingContext2D): void {
  if (!prerendered) return;
  ctx.drawImage(prerendered, 0, 0);
}

/** Invalida o terreno prerenderizado (troca de fase). */
export function clearTerrain(): void {
  prerendered = null;
  prerenderedKey = '';
}

/** Bioma do terreno atual prerenderizado. */
export function getTerrainKey(): string {
  return prerenderedKey;
}

/** Escurece ou clareia uma cor hex em `amount` (-1..1). */
export function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  if (amount >= 0) {
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);
  } else {
    const k = 1 + amount;
    r = Math.round(r * k);
    g = Math.round(g * k);
    b = Math.round(b * k);
  }
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
