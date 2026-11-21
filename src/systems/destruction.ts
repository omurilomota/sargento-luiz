/**
 * B0 — paredes destrutíveis.
 *
 * O grid do tilemap continua imutável na origem (`maps.ts`); aqui guardamos um
 * Map esparso de células que já caíram. `isWallViva()` é a nova fronteira:
 * o tilemap continua sólido, mas uma parede derrubada deixa de bloquear.
 *
 * A borda do mapa NUNCA cai — o validador genmaps exige borda fechada e
 * deixar o jogador sair do mundo é pior que qualquer tiro.
 */

import { CELL_SIZE } from '../maps';
import { colAt, rowAt, getMap } from './tilemap';

interface ParedeCaída { col: number; row: number }

const caídas = new Map<string, ParedeCaída>();
const HP_PAREDE = 90;
const HP_PAREDE_FRACA = 45;
let hp: Map<string, number> = new Map();

function chave(col: number, row: number): string { return `${col},${row}`; }

export function initDestruction(): void {
  caídas.clear();
  hp = new Map();
}

export function getParedesCaídas(): readonly ParedeCaída[] { return [...caídas.values()]; }

export function paredeCaiu(col: number, row: number): boolean {
  return caídas.has(chave(col, row));
}

/** Borda do mapa é sagrada. */
function naBorda(col: number, row: number): boolean {
  const map = getMap();
  if (!map) return true; // sem mapa carregado, trate como protegido
  return row <= 0 || col <= 0 || row >= map.rows - 1 || col >= map.cols - 1;
}

export function ehParedeFraca(col: number, row: number): boolean {
  return (col * 7 + row * 13) % 4 === 0;
}

/**
 * Aplica dano a uma parede. Devolve:
 *  - 'caiu' quando a parede foi derrubada (o chamador refaz o flow field)
 *  - 'danificou' quando ainda está de pé
 *  - null quando o tiro não era contra parede ou a célula é protegida
 */
export function danoParede(px: number, py: number, dano: number): 'caiu' | 'danificou' | null {
  const col = colAt(px), row = rowAt(py);
  if (naBorda(col, row)) return null;
  const map = getMap();
  if (!map || map.cells[row][col] !== '#') return null;
  const k = chave(col, row);
  if (caídas.has(k)) return null;
  const max = ehParedeFraca(col, row) ? HP_PAREDE_FRACA : HP_PAREDE;
  const atual = (hp.get(k) ?? max) - dano;
  if (atual <= 0) {
    hp.delete(k);
    caídas.set(k, { col, row });
    return 'caiu';
  }
  hp.set(k, atual);
  return 'danificou';
}

/** Centro da célula caída, para partículas. */
export function centroParede(col: number, row: number) {
  return { x: col * CELL_SIZE + CELL_SIZE / 2, y: row * CELL_SIZE + CELL_SIZE / 2 };
}
