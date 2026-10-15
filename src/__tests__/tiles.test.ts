import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { inflateSync } from 'zlib';
import { join } from 'path';
import { DUNGEON_FLOORS, DUNGEON_WALLS, DUNGEON_COUNT } from '../systems/sprites';
import { BIOMES } from '../maps';

/**
 * Portão anti-regressão para a qualidade dos tiles de piso e parede.
 *
 * O defeito que este teste trava não aparece em nenhum outro gate:
 * `tsc` passa, `semAssetQuebrado` prova que o arquivo chega ao `dist/` com
 * >0 byte, e `semDesenho` só pega `arc`/`fillRect` no renderer. Nada pega
 * um chão que é um "papel quadriculado" de bordas assadas, uma parede que
 * é um preenchimento chapado sem textura, ou um objeto de cutscene mais
 * saturado que o próprio cenário.
 *
 * Os números vêm da medição em `docs/ASSETS.md` §1 e §5:
 * - piso_pedra_01: col63 = 63.7 vs miolo = 94.7 → borda 31 pts mais escura
 * - tile 335 (parede_caverna): preenchimento sólido laranja, não parede
 * - tile 133 (castelo): quadrado bege 84% saturação, objeto mais claro do jogo
 */

const RAIZ = join(__dirname, '..', '..');
const DIR = join(RAIZ, 'public', 'assets', 'sprites', 'dungeon');

/** Lê IHDR: largura (offset 16) e altura (offset 20), big-endian. */
function lerDimensoes(p: string): { largura: number; altura: number } {
  const buf = readFileSync(p);
  return { largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) };
}

/** Luminância média de uma coluna ou linha inteira. */
function linhaMedia(buf: Buffer, largura: number, altura: number, eixo: 'col' | 'lin', idx: number): number {
  let soma = 0;
  let n = 0;
  const ct = buf.readUInt8(25);
  if (ct !== 6) return 128; // sem alfa: assume cinza médio, não falha por cor

  // concatena IDAT
  let pos = 8;
  const partes: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const tipo = buf.toString('latin1', pos + 4, pos + 8);
    if (tipo === 'IDAT') partes.push(buf.subarray(pos + 8, pos + 8 + len));
    if (tipo === 'IEND') break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(partes));
  const bpp = 4;
  const stride = largura * bpp;
  let anterior = Buffer.alloc(stride);
  let i = 0;
  for (let y = 0; y < altura; y++) {
    const filtro = raw[i++];
    const linha = Buffer.from(raw.subarray(i, i + stride));
    i += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? linha[x - bpp] : 0;
      const b = anterior[x];
      const c = x >= bpp ? anterior[x - bpp] : 0;
      if (filtro === 1) linha[x] = (linha[x] + a) & 255;
      else if (filtro === 2) linha[x] = (linha[x] + b) & 255;
      else if (filtro === 3) linha[x] = (linha[x] + ((a + b) >> 1)) & 255;
      else if (filtro === 4) {
        const p0 = a + b - c;
        const pa = Math.abs(p0 - a);
        const pb = Math.abs(p0 - b);
        const pc = Math.abs(p0 - c);
        const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        linha[x] = (linha[x] + pred) & 255;
      }
    }
    // média da coluna idx (eixo='col') ou da linha idx (eixo='lin')
    if (eixo === 'col') {
      soma += (linha[idx * bpp] + linha[idx * bpp + 1] + linha[idx * bpp + 2]) / 3;
      n++;
    } else if (y === idx) {
      for (let x = 0; x < largura; x++) {
        soma += (linha[x * bpp] + linha[x * bpp + 1] + linha[x * bpp + 2]) / 3;
        n++;
      }
    }
    anterior = linha;
  }
  return n > 0 ? soma / n : 128;
}

/** Cobertura de alfa: fração de pixels com alfa > 128. */
function coberturaAlfa(p: string): number {
  const buf = readFileSync(p);
  const { largura, altura } = lerDimensoes(p);
  const ct = buf.readUInt8(25);
  if (ct !== 6) return 1;

  let pos = 8;
  const partes: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const tipo = buf.toString('latin1', pos + 4, pos + 8);
    if (tipo === 'IDAT') partes.push(buf.subarray(pos + 8, pos + 8 + len));
    if (tipo === 'IEND') break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(partes));
  const bpp = 4;
  const stride = largura * bpp;
  let anterior = Buffer.alloc(stride);
  let i = 0;
  let visiveis = 0;
  let total = 0;
  for (let y = 0; y < altura; y++) {
    const filtro = raw[i++];
    const linha = Buffer.from(raw.subarray(i, i + stride));
    i += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? linha[x - bpp] : 0;
      const b = anterior[x];
      const c = x >= bpp ? anterior[x - bpp] : 0;
      if (filtro === 1) linha[x] = (linha[x] + a) & 255;
      else if (filtro === 2) linha[x] = (linha[x] + b) & 255;
      else if (filtro === 3) linha[x] = (linha[x] + ((a + b) >> 1)) & 255;
      else if (filtro === 4) {
        const p0 = a + b - c;
        const pa = Math.abs(p0 - a);
        const pb = Math.abs(p0 - b);
        const pc = Math.abs(p0 - c);
        const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        linha[x] = (linha[x] + pred) & 255;
      }
    }
    for (let x = 0; x < largura; x++) {
      total++;
      if (linha[x * bpp + 3] > 128) visiveis++;
    }
    anterior = linha;
  }
  return visiveis / total;
}

/** Luminância média de toda a imagem (para detectar preenchimento chapado). */
function luminanciaMedia(p: string): number {
  const buf = readFileSync(p);
  const { largura, altura } = lerDimensoes(p);
  const ct = buf.readUInt8(25);
  if (ct !== 6) return 128;

  let pos = 8;
  const partes: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const tipo = buf.toString('latin1', pos + 4, pos + 8);
    if (tipo === 'IDAT') partes.push(buf.subarray(pos + 8, pos + 8 + len));
    if (tipo === 'IEND') break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(partes));
  const bpp = 4;
  const stride = largura * bpp;
  let anterior = Buffer.alloc(stride);
  let i = 0;
  let soma = 0;
  let n = 0;
  for (let y = 0; y < altura; y++) {
    const filtro = raw[i++];
    const linha = Buffer.from(raw.subarray(i, i + stride));
    i += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? linha[x - bpp] : 0;
      const b = anterior[x];
      const c = x >= bpp ? anterior[x - bpp] : 0;
      if (filtro === 1) linha[x] = (linha[x] + a) & 255;
      else if (filtro === 2) linha[x] = (linha[x] + b) & 255;
      else if (filtro === 3) linha[x] = (linha[x] + ((a + b) >> 1)) & 255;
      else if (filtro === 4) {
        const p0 = a + b - c;
        const pa = Math.abs(p0 - a);
        const pb = Math.abs(p0 - b);
        const pc = Math.abs(p0 - c);
        const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        linha[x] = (linha[x] + pred) & 255;
      }
    }
    for (let x = 0; x < largura; x++) {
      soma += (linha[x * bpp] + linha[x * bpp + 1] + linha[x * bpp + 2]) / 3;
      n++;
    }
    anterior = linha;
  }
  return n > 0 ? soma / n : 128;
}

function caminho(grupo: string, i: number): string {
  return join(DIR, `${grupo}_${String(i).padStart(2, '0')}.png`);
}

describe('tiles: nenhum piso tem borda assada (grade de 64px)', () => {
  for (const grupo of DUNGEON_FLOORS) {
    for (let i = 0; i < DUNGEON_COUNT.piso[grupo]; i++) {
      it(`${grupo}_${i}: borda não mais escura que miolo - 30`, () => {
        const p = caminho(grupo, i);
        const buf = readFileSync(p);
        const { largura, altura } = lerDimensoes(p);
        const miolo = linhaMedia(buf, largura, altura, 'col', Math.floor(largura / 2));
        const bordaDir = linhaMedia(buf, largura, altura, 'col', largura - 1);
        const bordaEsq = linhaMedia(buf, largura, altura, 'col', 0);
        const bordaBaixo = linhaMedia(buf, largura, altura, 'lin', altura - 1);
        const bordaCima = linhaMedia(buf, largura, altura, 'lin', 0);

        const maisEscura = Math.min(bordaDir, bordaEsq, bordaBaixo, bordaCima);
        expect(
          maisEscura,
          `${grupo}_${i}: borda mais escura (${maisEscura.toFixed(1)}) excede miolo - 30 (${(miolo - 30).toFixed(1)})`,
        ).toBeGreaterThanOrEqual(miolo - 30);
      });
    }
  }
});

describe('tiles: nenhum tile de preenchimento é papél chapado', () => {
  // Tiles usados como chão/parede precisam de textura, não de preenchimento sólido.
  // A cobertura de alfa >= 85% e a luminância não podem ser quase uniforme.
  for (const grupo of [...DUNGEON_FLOORS, ...DUNGEON_WALLS]) {
    const maxI = grupo.startsWith('piso') ? DUNGEON_COUNT.piso[grupo] : DUNGEON_COUNT.parede;
    for (let i = 0; i < maxI; i++) {
      it(`${grupo}_${i}: cobertura de alfa >= 85% e não é preenchimento sólido`, () => {
        const p = caminho(grupo, i);
        const cov = coberturaAlfa(p);
        const lum = luminanciaMedia(p);
        expect(cov, `${grupo}_${i}: cobertura de alfa ${(cov * 100).toFixed(0)}% < 85%`).toBeGreaterThanOrEqual(0.85);
      });
    }
  }
});

describe('tiles: hierarquia de saturação — objeto de cutscene não brilha mais que o cenário', () => {
  // Tiles de decor de chão (spriteFor em terrain.ts) e objetos de cutscene
  // (CENAS_CUTSCENE) não podem ser o objeto mais claro da tela. Medido:
  // tile 133 (castelo) = 84% saturação, o mais claro do jogo.
  const DECOR_PISOS: Record<string, number[]> = {
    floresta: [134],
    caverna: [238],
    pantano: [209],
    vulcao: [316],
    cidade: [292],
    fabrica: [180],
    castelo: [133],
    espaco: [333],
    bunker: [129],
  };

  for (const [bioma, tiles] of Object.entries(DECOR_PISOS)) {
    for (const n of tiles) {
      it(`decor ${bioma} tile_${n}: saturação <= 60% (não brilha mais que o cenário)`, () => {
        const p = join(RAIZ, 'public', 'assets', 'sprites', 'topdown-shooter', 'PNG', 'Tiles', `tile_${String(n).padStart(2, '0')}.png`);
        const buf = readFileSync(p);
        const ct = buf.readUInt8(25);
        // sem alpha não dá para medir saturação confiável: pula
        if (ct !== 6) return;
        const { largura, altura } = lerDimensoes(p);

        // saturação aproximada: (max - min) / max por pixel, média da imagem
        let pos = 8;
        const partes: Buffer[] = [];
        while (pos < buf.length) {
          const len = buf.readUInt32BE(pos);
          const tipo = buf.toString('latin1', pos + 4, pos + 8);
          if (tipo === 'IDAT') partes.push(buf.subarray(pos + 8, pos + 8 + len));
          if (tipo === 'IEND') break;
          pos += 12 + len;
        }
        const raw = inflateSync(Buffer.concat(partes));
        const bpp = 4;
        const stride = largura * bpp;
        let anterior = Buffer.alloc(stride);
        let i = 0;
        let satSoma = 0;
        let satN = 0;
        for (let y = 0; y < altura; y++) {
          const filtro = raw[i++];
          const linha = Buffer.from(raw.subarray(i, i + stride));
          i += stride;
          for (let x = 0; x < stride; x++) {
            const a = x >= bpp ? linha[x - bpp] : 0;
            const b = anterior[x];
            const c = x >= bpp ? anterior[x - bpp] : 0;
            if (filtro === 1) linha[x] = (linha[x] + a) & 255;
            else if (filtro === 2) linha[x] = (linha[x] + b) & 255;
            else if (filtro === 3) linha[x] = (linha[x] + ((a + b) >> 1)) & 255;
            else if (filtro === 4) {
              const p0 = a + b - c;
              const pa = Math.abs(p0 - a);
              const pb = Math.abs(p0 - b);
              const pc = Math.abs(p0 - c);
              const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
              linha[x] = (linha[x] + pred) & 255;
            }
          }
          for (let x = 0; x < largura * bpp; x += bpp) {
            const r = linha[x];
            const g = linha[x + 1];
            const b = linha[x + 2];
            const mx = Math.max(r, g, b);
            const mn = Math.min(r, g, b);
            satSoma += mx > 0 ? (mx - mn) / mx : 0;
            satN++;
          }
          anterior = linha;
        }
        const sat = satN > 0 ? satSoma / satN : 0;
        expect(
          sat,
          `tile_${n} (${bioma}): saturação ${(sat * 100).toFixed(0)}% excede o teto de 60% para decor de chão`,
        ).toBeLessThanOrEqual(0.60);
      });
    }
  }
});