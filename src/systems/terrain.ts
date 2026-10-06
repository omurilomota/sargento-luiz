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
        case '^': drawHazard(c, px, py, biome, (col * 7 + row * 13) % 4); break;
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

  // decor de chão por bioma: um objeto do pack que resume o lugar —
  // entulho na Cidade, sucata na Fábrica, pedra no Castelo, placa no Espaço
  // e caixa no Bunker. Os outros 4 biomas já tinham objeto próprio.
  const spriteFor: Record<string, number> = {
    floresta: 134,
    caverna: 238,
    pantano: 209,
    vulcao: 316,
    cidade: 292,
    fabrica: 180,
    castelo: 133,
    espaco: 333,
    bunker: 129,
  };
  const n = spriteFor[biome.key];
  if (n !== undefined) {
    const img = getSprite(`tile_${n}`);
    if (img) {
      const s = CELL_SIZE * (0.5 + (variant % 2) * 0.2);
      c.drawImage(img, px + (CELL_SIZE - s) / 2, py + (CELL_SIZE - s) / 2, s, s);
      return;
    }
  }

  const tone = variant % 2 === 0 ? shade(biome.floor, 0.09) : shade(biome.floor, -0.09);
  c.fillStyle = tone;
  c.beginPath();
  c.ellipse(px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE * 0.44, CELL_SIZE * 0.36, 0, 0, Math.PI * 2);
  c.fill();
}

/** Mancha irregular com seed: mesma célula sempre gera a mesma forma. */
function blobPath(c: CanvasRenderingContext2D, px: number, py: number, variant: number, rx: number, ry: number): void {
  const cx = px + CELL_SIZE / 2;
  const cy = py + CELL_SIZE / 2;
  c.beginPath();
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const jitter = 0.72 + ((variant * 31 + i * 17) % 10) / 25;
    const x = cx + Math.cos(a) * rx * jitter;
    const y = cy + Math.sin(a) * ry * jitter;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.closePath();
}

/**
 * Sprite de hazard por tipo. Mesmo padrão das paredes: o tile cobre a célula
 * inteira e a cor continua vindo do `applyTint` do bioma. Por isso o mesmo
 * `320` serve tanto para névoa quanto para lama — o que separa é o piso de
 * baixo (floresta verde, pântano escuro), não o objeto. Quem nunca divide:
 * os tiles de debris (292/265/260) são entulho legível, e lava (316/319)
 * são os únicos discos incandescentes do pack.
 *
 * `spikes` e `electric` ficam de fora porque o pack não tem espinho, raio
 * nem fogo (524 tiles inspecionados). Eles usam o pack Tower Defense CC0
 * baixado, e não o fallback procedural.
 */
export const HAZARD_SPRITES: Record<string, number[]> = {
  debris: [292, 265, 260],
  fog: [320],
  mud: [320],
  lava: [316, 319],
  electric: [264],
  spikes: [268],
};
function drawHazard(c: CanvasRenderingContext2D, px: number, py: number, biome: Biome, variant: number): void {
  c.fillStyle = biome.floor;
  c.fillRect(px, py, CELL_SIZE, CELL_SIZE);

  // objeto do pack antes de qualquer forma procedural, na mesma escala das
  // paredes: cobre ~0.85 da célula, como a mancha antiga. O tile não carrega
  // em produção (fora de TILE_NUMBERS) cai no desenho de baixo.
  const hazardTiles = HAZARD_SPRITES[biome.hazard];
  if (hazardTiles) {
    const img = getSprite(`tile_${hazardTiles[variant % hazardTiles.length]}`);
    if (img) {
      const s = CELL_SIZE * 0.85;
      c.drawImage(img, px + (CELL_SIZE - s) / 2, py + (CELL_SIZE - s) / 2, s, s);
      return;
    }
  }

  const color = biome.hazardColor;
  switch (biome.hazard) {
    case 'spikes': {
      c.fillStyle = shade(color, -0.1);
      for (let i = 0; i < 4; i++) {
        const bx = px + 10 + i * 14;
        c.beginPath();
        c.moveTo(bx, py + CELL_SIZE - 12);
        c.lineTo(bx + 6, py + 14 + (variant % 2) * 6);
        c.lineTo(bx + 12, py + CELL_SIZE - 12);
        c.closePath();
        c.fill();
      }
      break;
    }
    case 'electric': {
      c.strokeStyle = color;
      c.lineWidth = 3;
      c.globalAlpha = 0.75;
      for (let i = 0; i < 2; i++) {
        const ox = px + 12 + i * 24 + (variant % 2) * 6;
        c.beginPath();
        c.moveTo(ox, py + 10);
        c.lineTo(ox - 6 + (variant % 3) * 4, py + CELL_SIZE / 2);
        c.lineTo(ox + 6, py + CELL_SIZE / 2 + 4);
        c.lineTo(ox, py + CELL_SIZE - 10);
        c.stroke();
      }
      c.globalAlpha = 1;
      break;
    }
    case 'lava': {
      c.fillStyle = shade(color, -0.35);
      blobPath(c, px, py, variant, CELL_SIZE * 0.42, CELL_SIZE * 0.34);
      c.fill();
      c.strokeStyle = color;
      c.lineWidth = 3;
      c.globalAlpha = 0.9;
      c.beginPath();
      c.moveTo(px + 10, py + CELL_SIZE / 2);
      c.lineTo(px + CELL_SIZE / 2 - 6, py + CELL_SIZE / 2 + (variant % 3) * 6 - 6);
      c.lineTo(px + CELL_SIZE / 2 + 8, py + CELL_SIZE / 2 - 4);
      c.lineTo(px + CELL_SIZE - 10, py + CELL_SIZE / 2 + 2);
      c.stroke();
      c.globalAlpha = 1;
      break;
    }
    case 'debris': {
      c.fillStyle = color;
      c.globalAlpha = 0.55;
      blobPath(c, px, py, variant, CELL_SIZE * 0.4, CELL_SIZE * 0.32);
      c.fill();
      c.globalAlpha = 1;
      c.fillStyle = shade(color, -0.3);
      for (let i = 0; i < 4; i++) {
        c.fillRect(px + ((variant * 13 + i * 11) % 44) + 8, py + ((variant * 7 + i * 17) % 40) + 10, 5, 4);
      }
      break;
    }
    case 'fog': {
      c.fillStyle = color;
      c.globalAlpha = 0.16;
      blobPath(c, px, py, variant, CELL_SIZE * 0.46, CELL_SIZE * 0.38);
      c.fill();
      c.globalAlpha = 0.1;
      blobPath(c, px, py, variant + 3, CELL_SIZE * 0.3, CELL_SIZE * 0.26);
      c.fill();
      c.globalAlpha = 1;
      break;
    }
    case 'mud': {
      c.fillStyle = shade(color, -0.35);
      c.globalAlpha = 0.7;
      blobPath(c, px, py, variant, CELL_SIZE * 0.44, CELL_SIZE * 0.36);
      c.fill();
      c.globalAlpha = 1;
      break;
    }
    case 'darkness':
    case 'lowGravity':
    case 'none':
      // caverna/espaco/bunker não têm marcação no chão: o overlay e a física
      // de baixa gravidade cuidam disso
      break;
    default: {
      c.fillStyle = color;
      c.globalAlpha = 0.5;
      blobPath(c, px, py, variant, CELL_SIZE * 0.42, CELL_SIZE * 0.34);
      c.fill();
      c.globalAlpha = 1;
    }
  }
}

/**
 * Parede: laje sólida e escura, com uma "face" iluminada no topo quando o
 * vizinho de cima é chão e contorno preto em todo contato com o chão.
 *
 * A leitura "isto bloqueia" precisa acontecer num relance, então a parede é
 * sempre bem mais escura que o piso e tem uma silhueta fechada — sem isso o
 * mapa vira um código de barras e o jogador não sabe onde pode andar.
 */
/**
 * Tiles do Kenney usados como superfície de parede, por bioma.
 *
 * O pack tem textura de tijolo, placa metálica e rocha; o que separa parede
 * de piso é o desenho do tile (junta, painel, camada) mais as bordas que
 * `drawWallEdges` põe em cima. Verificado visualmente: cada tile passado por
 * `saturation` + `multiply` do `applyTint` vira a cor do bioma e mantém só a
 * variação de valor, que é o que dá a leitura.
 *
 * Floresta fica de fora de propósito: a copa (181/209) é desenhada MAIOR que
 * a célula, e mover isso para cá perderia o efeito de vegetação que invade o
 * corredor — ela já é desenho por sprite, não procedural.
 *
 * Sem o número em `TILE_NUMBERS` (sprites.ts) o sprite não carrega e o jogo
 * cai silenciosamente no desenho procedural de baixo.
 */
export const WALL_TILES: Record<string, number[]> = {
  cidade: [96, 97, 98, 99],
  castelo: [43, 44, 45, 46],
  fabrica: [110, 111, 112, 113],
  espaco: [489, 490, 491, 492],
  bunker: [415, 416, 417, 418],
  caverna: [334, 335, 336, 337],
  pantano: [172, 173, 174, 175],
  vulcao: [163, 164, 165, 166],
};

function drawWall(
  c: CanvasRenderingContext2D,
  px: number, py: number,
  biome: Biome,
  cells: string[][],
  col: number, row: number
): void {
  const isWall = (cc: number, rr: number): boolean =>
    rr < 0 || cc < 0 || rr >= cells.length || cc >= cells[0].length || cells[rr][cc] === '#';

  // sombra projetada no chão logo abaixo: separa o prédio do piso
  if (!isWall(col, row + 1)) {
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(px + 4, py + CELL_SIZE, CELL_SIZE, 7);
  }

  // tom base por estilo de bioma, com variação de célula p/ não virar laje
  const v = (col * 13 + row * 7) % 3;
  const baseWall = biome.key === 'vulcao' ? shade(biome.wall, -0.12) : biome.wall;
  c.fillStyle = v === 0 ? baseWall : shade(baseWall, v === 1 ? 0.08 : -0.08);
  c.fillRect(px, py, CELL_SIZE, CELL_SIZE);

  // superfície de tile: substitui a textura procedural inteira, mas o beiral
  // e a cumeeira continuam vindo embaixo porque são o que diz "isto é parede"
  const wallTiles = WALL_TILES[biome.key];
  if (wallTiles) {
    const img = getSprite(`tile_${wallTiles[(col * 5 + row * 3) % wallTiles.length]}`);
    if (img) {
      c.drawImage(img, px, py, CELL_SIZE, CELL_SIZE);
      drawWallEdges(c, px, py, biome, cells, col, row, isWall);
      return;
    }
  }

  // textura específica do bioma (substitui a argamassa genérica)
  c.lineWidth = 2;
  switch (biome.key) {
    case 'caverna':
      // rocha irregular: poucos traços diagonais
      c.strokeStyle = 'rgba(0,0,0,0.3)';
      c.beginPath();
      c.moveTo(px + 6, py + 20 + (v * 6)); c.lineTo(px + 26, py + 34);
      c.moveTo(px + 34, py + 8 + (v * 5)); c.lineTo(px + 58, py + 26);
      c.stroke();
      break;
    case 'fabrica':
      // painel metálico: grade rígida + parafusos se houver borda de chão
      c.strokeStyle = 'rgba(0,0,0,0.25)';
      c.beginPath();
      c.moveTo(px, py + CELL_SIZE / 2); c.lineTo(px + CELL_SIZE, py + CELL_SIZE / 2);
      c.moveTo(px + CELL_SIZE / 2, py); c.lineTo(px + CELL_SIZE / 2, py + CELL_SIZE);
      c.stroke();
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.fillRect(px + 4, py + 4, 3, 3); c.fillRect(px + CELL_SIZE - 7, py + 4, 3, 3);
      c.fillRect(px + 4, py + CELL_SIZE - 7, 3, 3); c.fillRect(px + CELL_SIZE - 7, py + CELL_SIZE - 7, 3, 3);
      break;
    case 'pantano':
      // ripas verticais de madeira podre
      c.strokeStyle = 'rgba(0,0,0,0.28)';
      c.beginPath();
      for (let i = 1; i < 4; i++) {
        c.moveTo(px + i * 16, py); c.lineTo(px + i * 16, py + CELL_SIZE);
      }
      c.stroke();
      break;
    case 'castelo':
      // pedra grande: bloco único com rejunte central
      c.strokeStyle = 'rgba(0,0,0,0.25)';
      c.beginPath();
      c.moveTo(px, py + CELL_SIZE / 2); c.lineTo(px + CELL_SIZE, py + CELL_SIZE / 2);
      c.moveTo(px + CELL_SIZE / 2, py); c.lineTo(px + CELL_SIZE / 2, py + CELL_SIZE / 2);
      c.stroke();
      break;
    case 'vulcao':
      // basalto: poucas rachaduras quentes
      c.strokeStyle = 'rgba(200,90,40,0.35)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(px + 8, py + 24); c.lineTo(px + 30, py + 30); c.lineTo(px + 44, py + 18);
      c.stroke();
      c.lineWidth = 2;
      break;
    case 'espaco':
      // painel com listra horizontal de alerta
      c.strokeStyle = 'rgba(0,0,0,0.25)';
      c.beginPath();
      c.moveTo(px, py + CELL_SIZE / 2); c.lineTo(px + CELL_SIZE, py + CELL_SIZE / 2);
      c.stroke();
      c.fillStyle = 'rgba(200,184,120,0.18)';
      c.fillRect(px, py + CELL_SIZE / 2 - 3, CELL_SIZE, 6);
      break;
    case 'bunker':
      // concreto com faixa de alerta no contato com chão
      c.strokeStyle = 'rgba(0,0,0,0.25)';
      c.beginPath();
      c.moveTo(px, py + 20); c.lineTo(px + CELL_SIZE, py + 20);
      c.moveTo(px, py + 44); c.lineTo(px + CELL_SIZE, py + 44);
      c.stroke();
      break;
    case 'floresta': {
      // copa de árvore: o bloco deixa de ser parede de madeira e vira vegetação densa
      const canopySeed = (col * 3 + row * 5) % 2 === 0 ? 181 : 209;
      const canopy = getSprite(`tile_${canopySeed}`);
      if (canopy) {
        c.drawImage(canopy, px - 6, py - 6, CELL_SIZE + 12, CELL_SIZE + 12);
      } else {
        c.strokeStyle = 'rgba(0,0,0,0.28)';
        c.beginPath();
        for (let i = 1; i < 4; i++) {
          c.moveTo(px + i * 16, py); c.lineTo(px + i * 16, py + CELL_SIZE);
        }
        c.stroke();
      }
      c.fillStyle = 'rgba(70,90,50,0.35)';
      c.fillRect(px, py, CELL_SIZE, 5);
      break;
    }
    default:
      // cidade: textura de telha (lajes horizontais)
      c.strokeStyle = 'rgba(0,0,0,0.22)';
      c.beginPath();
      for (let i = 1; i < 4; i++) {
        const yy = py + i * 16;
        c.moveTo(px, yy);
        c.lineTo(px + CELL_SIZE, yy);
      }
      c.stroke();
      c.strokeStyle = shade(biome.wall, 0.2);
      c.lineWidth = 1;
      c.beginPath();
      for (let i = 1; i < 4; i++) {
        const yy = py + i * 16 + 2;
        c.moveTo(px, yy);
        c.lineTo(px + CELL_SIZE, yy);
      }
      c.stroke();
  }

  drawWallEdges(c, px, py, biome, cells, col, row, isWall);
}

/**
 * Borda da parede: cumeeira, claraboia, beiral, face superior e contorno.
 *
 * Saiu de `drawWall` porque agora há dois caminhos de preenchimento (tile do
 * pack e textura procedural) e as bordas são idênticas nos dois — sem esta
 * separação, a superfície de tile ficava sem contorno e a parede deixava de
 * ser legível contra o chão.
 */
function drawWallEdges(
  c: CanvasRenderingContext2D,
  px: number, py: number,
  biome: Biome,
  cells: string[][],
  col: number, row: number,
  isWall: (cc: number, rr: number) => boolean
): void {
  const baseWall = biome.key === 'vulcao' ? shade(biome.wall, -0.12) : biome.wall;
  // cumeeira só onde faz sentido (não em rocha nem teto)
  if (biome.key !== 'caverna' && (isWall(col - 1, row) || isWall(col + 1, row))) {
    c.strokeStyle = shade(baseWall, 0.35);
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(px, py + CELL_SIZE / 2);
    c.lineTo(px + CELL_SIZE, py + CELL_SIZE / 2);
    c.stroke();
  }

  // claraboia: não em rocha nem teto
  if (biome.key !== 'caverna' && biome.key !== 'espaco' && (col * 7 + row * 11) % 5 === 0) {
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(px + CELL_SIZE / 2 - 7, py + CELL_SIZE / 2 - 5, 14, 10);
    c.strokeStyle = shade(baseWall, 0.3);
    c.lineWidth = 1;
    c.strokeRect(px + CELL_SIZE / 2 - 7, py + CELL_SIZE / 2 - 5, 14, 10);
  }

  // beiral: borda escura interna em todo contato com o chão
  c.strokeStyle = 'rgba(0,0,0,0.4)';
  c.lineWidth = 6;
  c.beginPath();
  if (!isWall(col, row - 1)) { c.moveTo(px, py + 3); c.lineTo(px + CELL_SIZE, py + 3); }
  if (!isWall(col, row + 1)) { c.moveTo(px, py + CELL_SIZE - 3); c.lineTo(px + CELL_SIZE, py + CELL_SIZE - 3); }
  if (!isWall(col - 1, row)) { c.moveTo(px + 3, py); c.lineTo(px + 3, py + CELL_SIZE); }
  if (!isWall(col + 1, row)) { c.moveTo(px + CELL_SIZE - 3, py); c.lineTo(px + CELL_SIZE - 3, py + CELL_SIZE); }
  c.stroke();

  // face superior mais clara: dá volume e separa a parede do chão
  if (!isWall(col, row - 1)) {
    c.fillStyle = shade(biome.wall, 0.42);
    c.fillRect(px, py, CELL_SIZE, 14);
    c.fillStyle = shade(biome.accent, -0.15);
    c.fillRect(px, py + 14, CELL_SIZE, 3);
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

/**
 * Escurece ou clareia uma cor hex em `amount` (-1..1).
 *
 * O resultado é limitado a 0..255 por canal: sem isso, um `amount` fora da faixa
 * (ninguém chama hoje, mas é uma função compartilhada) estoura o canal e o
 * `| << 16` devolve uma cor completamente diferente em vez de uma cor extrema.
 */
export function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  if (amount >= 0) {
    r = r + (255 - r) * amount;
    g = g + (255 - g) * amount;
    b = b + (255 - b) * amount;
  } else {
    const k = 1 + amount;
    r = r * k;
    g = g * k;
    b = b * k;
  }
  const limita = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  r = limita(r);
  g = limita(g);
  b = limita(b);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
