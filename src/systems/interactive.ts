/**
 * B2 — portas e alavancas do mapa.
 *
 * Alavanca abre porta. Porta fecha a passagem até a alavanca ser acionada.
 * Dados em runtime, sem mexer no maps.ts (o gerador regera e apagaria).
 */

import { setWallOverride } from './tilemap';
import { paredeCaiu } from './destruction';

export interface Alavanca { x: number; y: number; ativada: boolean; portaId: string }
export interface Porta { id: string; col: number; row: number; aberta: boolean }

let alavancas: Alavanca[] = [];
let portas: Porta[] = [];
let ativo = false;

export function initInteractive(): void {
  alavancas = [];
  portas = [];
  ativo = false;
}

export function addPorta(id: string, col: number, row: number): void {
  portas.push({ id, col, row, aberta: false });
  ativo = true;
}

export function addAlavanca(px: number, py: number, portaId: string): void {
  alavancas.push({ x: px, y: py, ativada: false, portaId });
  ativo = true;
}

export function getAlavancas(): readonly Alavanca[] { return alavancas; }

/** Aciona a alavanca mais perto do jogador. Devolve o id da porta aberta. */
export function acionarAlavanca(px: number, py: number, raio: number): string | null {
  for (const a of alavancas) {
    if (a.ativada || Math.hypot(a.x - px, a.y - py) > raio + 16) continue;
    a.ativada = true;
    const porta = portas.find(p => p.id === a.portaId);
    if (porta) {
      porta.aberta = true;
      setWallOverride((c, r) => {
        if (portas.some(p => p.aberta && p.col === c && p.row === r)) return false;
        return paredeCaiu(c, r) ? false : null;
      });
      return porta.id;
    }
  }
  return null;
}

export function temInteractive(): boolean { return ativo; }
