import { describe, it, expect, beforeEach } from 'vitest';
import { BIOMES, CELL_SIZE } from '../maps';
import { loadMap, isWallAtPx, colAt, rowAt, isWall } from '../systems/tilemap';
import { spawnCoins, updateCoins, getCoins, clearCoins } from '../entities/coin';
import { spawnPowerUp, powerups } from '../powerups';
import { rollLootDrop, getLoot, clearLoot } from '../systems/loot';
import { PICKUP_RADIUS } from '../core/constants';

const KEYS = Object.keys(BIOMES);

/** Centro de uma célula do grid, em pixels de mundo. */
function cellCenterPx(col: number, row: number) {
  return { x: col * CELL_SIZE + CELL_SIZE / 2, y: row * CELL_SIZE + CELL_SIZE / 2 };
}

/**
 * Amostra de células de parede com vizinhança de chão — é o caso real do bug:
 * o inimigo morre encostado na parede, não no meio de um bloco sólido.
 */
function wallCellsTouchingFloor(key: string, limit: number) {
  const map = loadMap(BIOMES[key].rows);
  const cols = map.width / CELL_SIZE;
  const rows = map.height / CELL_SIZE;
  const out: { col: number; row: number }[] = [];
  for (let row = 1; row < rows - 1; row++) {
    for (let col = 1; col < cols - 1; col++) {
      if (!isWall(col, row)) continue;
      const nextToFloor =
        !isWall(col - 1, row) || !isWall(col + 1, row) ||
        !isWall(col, row - 1) || !isWall(col, row + 1);
      if (nextToFloor) out.push({ col, row });
    }
  }
  // amostra espaçada: cobre o mapa inteiro sem pagar o pushOutOfWalls de tudo
  const step = Math.max(1, Math.floor(out.length / limit));
  return out.filter((_, i) => i % step === 0).slice(0, limit);
}

describe('itens no chão nunca nascem dentro de parede', () => {
  beforeEach(() => {
    clearCoins();
    clearLoot();
    powerups.length = 0;
  });

  // O bug: o item nascia na posição crua do inimigo morto. Encostado na
  // parede, ele ficava lá — sem colisão no movimento, expirava intocável.
  for (const key of KEYS) {
    it(`moedas nascem andáveis em ${key}`, () => {
      const cells = wallCellsTouchingFloor(key, 40);
      expect(cells.length).toBeGreaterThan(0);
      for (const { col, row } of cells) {
        const at = cellCenterPx(col, row);
        for (let i = 0; i < 6; i++) spawnCoins(at.x, at.y, 3);
        for (const c of getCoins()) {
          expect(isWallAtPx(c.x, c.y)).toBe(false);
          expect(isWall(colAt(c.x), rowAt(c.y))).toBe(false);
        }
      }
    });
  }

  for (const key of KEYS) {
    it(`power-ups e caixas nascem andáveis em ${key}`, () => {
      const cells = wallCellsTouchingFloor(key, 40);
      expect(cells.length).toBeGreaterThan(0);
      for (const { col, row } of cells) {
        const at = cellCenterPx(col, row);
        spawnPowerUp(at.x, at.y);
        rollLootDrop(at.x, at.y, 'grunt');
      }
      for (const p of powerups) expect(isWallAtPx(p.x, p.y)).toBe(false);
      for (const b of getLoot()) expect(isWallAtPx(b.x, b.y)).toBe(false);
    });
  }

  it('o raio do item é respeitado: nenhum centro fica a menos de PICKUP_RADIUS da parede', () => {
    loadMap(BIOMES.cidade.rows);
    for (const { col, row } of wallCellsTouchingFloor('cidade', 60)) {
      const at = cellCenterPx(col, row);
      spawnPowerUp(at.x, at.y);
    }
    for (const p of powerups) {
      let touchesWall = false;
      for (let r = rowAt(p.y - PICKUP_RADIUS); r <= rowAt(p.y + PICKUP_RADIUS); r++) {
        for (let c = colAt(p.x - PICKUP_RADIUS); c <= colAt(p.x + PICKUP_RADIUS); c++) {
          if (isWall(c, r)) touchesWall = true;
        }
      }
      expect(touchesWall).toBe(false);
    }
  });
});

describe('moeda não atravessa parede quando voa', () => {
  beforeEach(() => {
    clearCoins();
  });

  it('a velocidade inicial não empurra a moeda para dentro da parede', () => {
    // chão imediatamente abaixo de uma parede, para o teste ter contra o que bater
    loadMap(BIOMES.cidade.rows);
    let spawn: { x: number; y: number } | null = null;
    for (let row = 1; row < 30 && !spawn; row++) {
      for (let col = 1; col < 29; col++) {
        if (isWall(col, row) || !isWall(col, row - 1)) continue;
        spawn = cellCenterPx(col, row);
        break;
      }
    }
    expect(spawn).not.toBeNull();

    for (let i = 0; i < 60; i++) spawnCoins(spawn!.x, spawn!.y, 1);
    // jogador longe e sem ímã: a moeda só se move pela velocidade inicial
    for (let step = 0; step < 400; step++) updateCoins(1 / 60, -10000, -10000, 18, () => {});
    expect(getCoins().length).toBeGreaterThan(0);
    for (const c of getCoins()) expect(isWallAtPx(c.x, c.y)).toBe(false);
  });
});
