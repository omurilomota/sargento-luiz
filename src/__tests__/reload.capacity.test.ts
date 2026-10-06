import { describe, it, expect, beforeEach } from 'vitest';
import { resetWeapons, startReload, getCurrentAmmo, useAmmo, updateReload, getIsReloading } from '../weapons';
import { addPieceToInventory, equipPiece, resetPieces } from '../systems/pieces';

describe('reload com peça CAPACIDADE', () => {
  beforeEach(() => { resetWeapons(); resetPieces(); });

  it('recarrega até o pente expandido', () => {
    addPieceToInventory('capacidade');
    equipPiece(0, 0); // Pistola: magazine 10 → 15
    resetWeapons();
    // dispara 5 (sobra 10 = magazineSize puro, mas < 15)
    for (let i = 0; i < 5; i++) useAmmo();
    startReload();
    expect(getIsReloading()).toBe(true);
    updateReload(2);
    expect(getCurrentAmmo()).toBe(15);
  });
});