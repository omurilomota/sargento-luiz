/**
 * src/systems/pieces.ts
 *
 * Peças de arma (upgrades modulares). Elas dropam de elites/bosses,
 * ficam no inventário e podem ser equipadas na arma atual pela loja.
 * Cada arma tem 2 slots de peça.
 */

import { PIECE_TYPES, PieceType } from '../config';

export interface Piece {
  typeId: string;
}

/** Inventário de peças do jogador (peças não equipadas) */
let inventory: Piece[] = [];

/** Peças equipadas por arma (índice do WEAPONS → peças) */
let equipped: Map<number, Piece[]> = new Map();

export function getInventory(): Piece[] { return inventory; }
export function getEquipped(weaponIndex: number): Piece[] { return equipped.get(weaponIndex) ?? []; }

/** Limite da mochila de peças (Faixa C §8): sem teto o inventário virava lista infinita. */
export const PIECE_INVENTORY_LIMIT = 8;

/** Série de uma peça: base (dano/cadencia/capacidade/precisao) ou acessório (otica/supressor/carregador). */
export function getPieceSeries(typeId: string): 'base' | 'acessorio' {
  return typeId === 'otica' || typeId === 'supressor' || typeId === 'carregador' ? 'acessorio' : 'base';
}

export function addPieceToInventory(typeId: string): boolean {
  if (inventory.length >= PIECE_INVENTORY_LIMIT) return false;
  inventory.push({ typeId });
  return true;
}

export function removePieceFromInventory(index: number): Piece | null {
  if (index < 0 || index >= inventory.length) return null;
  return inventory.splice(index, 1)[0];
}

export function equipPiece(weaponIndex: number, pieceIndex: number): boolean {
  const piece = removePieceFromInventory(pieceIndex);
  if (!piece) return false;
  const current = equipped.get(weaponIndex) ?? [];
  if (current.length >= 2) {
    // já tem 2 peças: devolve a mais antiga pro inventário
    const removed = current.shift()!;
    inventory.push(removed);
  }
  current.push(piece);
  equipped.set(weaponIndex, current);
  return true;
}

export function unequipPiece(weaponIndex: number, slot: number): boolean {
  const current = equipped.get(weaponIndex) ?? [];
  if (slot < 0 || slot >= current.length) return false;
  const [removed] = current.splice(slot, 1);
  inventory.push(removed);
  equipped.set(weaponIndex, current);
  return true;
}

export function resetPieces(): void {
  inventory = [];
  equipped = new Map();
}

/** Multiplicadores totais das peças equipadas numa arma */
export function getPieceModifiers(weaponIndex: number): { damageMult: number; reloadMult: number; magazineMult: number; spreadMult: number } {
  const mods = { damageMult: 1, reloadMult: 1, magazineMult: 1, spreadMult: 1 };
  const list = equipped.get(weaponIndex) ?? [];
  for (const p of list) {
    const def = PIECE_TYPES.find(t => t.id === p.typeId);
    if (!def) continue;
    mods.damageMult *= def.damageMult;
    mods.reloadMult *= def.reloadMult;
    mods.magazineMult *= def.magazineMult;
    mods.spreadMult *= def.spreadMult;
  }
  // sinergia (Faixa C §8): 2 peças da mesma série na arma = +10% dano.
  // 2 slots por arma, então a condição é "ambas da mesma série".
  if (list.length === 2 && getPieceSeries(list[0].typeId) === getPieceSeries(list[1].typeId)) {
    mods.damageMult *= 1.1;
  }
  return mods;
}

/** true se a arma tem a sinergia ativa (para o HUD/loja exibirem). */
export function hasPieceSynergy(weaponIndex: number): boolean {
  const list = equipped.get(weaponIndex) ?? [];
  return list.length === 2 && getPieceSeries(list[0].typeId) === getPieceSeries(list[1].typeId);
}

export function getPieceType(typeId: string): PieceType | undefined {
  return PIECE_TYPES.find(t => t.id === typeId);
}
