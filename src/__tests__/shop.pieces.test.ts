import { describe, it, expect, beforeEach } from 'vitest';
import { getShopLayout } from '../ui/shop';
import { addPieceToInventory, equipPiece, resetPieces } from '../systems/pieces';

describe('shop layout · peças', () => {
  beforeEach(() => resetPieces());

  it('expõe 2 slots de peças equipadas', () => {
    const L = getShopLayout(1280, 720);
    expect(L.equippedPieces).toHaveLength(2);
  });

  it('mochila cresce com o inventário', () => {
    addPieceToInventory('dano');
    addPieceToInventory('precisao');
    const L = getShopLayout(1280, 720);
    expect(L.pieces).toHaveLength(2);
    expect(L.pieces[1].y).toBeGreaterThan(L.pieces[0].y);
  });

  it('seção de peças não invade a seção de skins', () => {
    for (let i = 0; i < 20; i++) addPieceToInventory('dano');
    const L = getShopLayout(1280, 720);
    const lastPiece = L.pieces[L.pieces.length - 1];
    expect(lastPiece.y + lastPiece.h).toBeLessThan(L.skins[0].y);
  });
});
