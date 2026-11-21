import { describe, it, expect, beforeEach } from 'vitest';
import { BIOMES, CELL_SIZE } from '../maps';
import { loadMap, findFreeSpotNear, isWall, isWallAtPx, circleOverlaps } from '../systems/tilemap';

const KEYS = Object.keys(BIOMES);

/** Raio de colisão de qualquer boss do jogo (o maior é o NÚCLEO). */
const RAIO_BOSS = 46;

function centroDoMapa(): { col: number; row: number } {
  // largura 30 x altura 20 -> centro na célula (15, 10)
  return { col: 15, row: 10 };
}

describe('boss nasce em chão livre em todos os biomas', () => {
  // Bug: o boss nascia em `worldW/2, worldH/2` com `forceX/forceY`, que pula a
  // validação de spawn do spawner. O centro do mapa é '#' em cidade, floresta
  // e bunker — o boss ficava dentro da parede, congelado, porque o
  // `moveCircleBy` não consegue tirar um círculo que já começa sobreposto.
  beforeEach(() => {
    loadMap(BIOMES.cidade.rows);
  });

  it('o centro do mapa é parede em pelo menos um bioma (o bug existia)', () => {
    const centrosParede: string[] = [];
    for (const key of KEYS) {
      const map = loadMap(BIOMES[key].rows);
      const c = centroDoMapa();
      if (c.col >= map.width / CELL_SIZE || c.row >= map.height / CELL_SIZE) continue;
      if (isWall(c.col, c.row)) centrosParede.push(key);
    }
    // se isso ficar vazio, o teste abaixo não está mais testando nada real
    expect(centrosParede.length).toBeGreaterThan(0);
  });

  for (const key of KEYS) {
    it(`o ponto de spawn do boss é chão livre em ${key}`, () => {
      const map = loadMap(BIOMES[key].rows);
      const spot = findFreeSpotNear(map.width / 2, map.height / 2, RAIO_BOSS);

      expect(isWallAtPx(spot.x, spot.y)).toBe(false);
      // e o círculo inteiro precisa caber, não só o centro
      expect(circleOverlaps(spot.x, spot.y, RAIO_BOSS)).toBe(false);
    });
  }

  for (const key of KEYS) {
    it(`o chefe aparece perto do centro em ${key}`, () => {
      // buscar só centro de célula jogava o chefe a 600px do centro na caverna,
      // porque raio 46 não cabe numa célula de 64
      const map = loadMap(BIOMES[key].rows);
      const spot = findFreeSpotNear(map.width / 2, map.height / 2, RAIO_BOSS);
      const dist = Math.hypot(spot.x - map.width / 2, spot.y - map.height / 2);
      expect(dist).toBeLessThan(CELL_SIZE * 3);
    });
  }

  it('o ponto de spawn fica dentro dos limites do mapa', () => {
    for (const key of KEYS) {
      const map = loadMap(BIOMES[key].rows);
      const spot = findFreeSpotNear(map.width / 2, map.height / 2, RAIO_BOSS);
      expect(spot.x).toBeGreaterThan(RAIO_BOSS);
      expect(spot.y).toBeGreaterThan(RAIO_BOSS);
      expect(spot.x).toBeLessThan(map.width - RAIO_BOSS);
      expect(spot.y).toBeLessThan(map.height - RAIO_BOSS);
    }
  });
});
