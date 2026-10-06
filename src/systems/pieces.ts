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

export function addPieceToInventory(typeId: string): void {
  inventory.push({ typeId });
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
  for (const p of equipped.get(weaponIndex) ?? []) {
    const def = PIECE_TYPES.find(t => t.id === p.typeId);
    if (!def) continue;
    mods.damageMult *= def.damageMult;
    mods.reloadMult *= def.reloadMult;
    mods.magazineMult *= def.magazineMult;
    mods.spreadMult *= def.spreadMult;
  }
  return mods;
}

export function getPieceType(typeId: string): PieceType | undefined {
  return PIECE_TYPES.find(t => t.id === typeId);
}
