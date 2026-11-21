import { describe, it, expect, beforeAll } from 'vitest';
import { BIOMES, CELL_SIZE } from '../maps';
import { loadMap, isWall, isWallAtPx, circleOverlaps } from '../systems/tilemap';
import { createBot } from '../systems/bots';

// Bug: `createBot` nascia em `-30` / `worldW + 30`, e `main.ts` passava
// `worldW/worldH` (tamanho do MAPA, não do canvas) nos parâmetros que se
// chamavam canvasWidth/Height. O bot ficava dentro do anel de parede da borda.
describe('bot nasce dentro do mapa, em chão livre', () => {
  const KEYS = Object.keys(BIOMES);

  for (const key of KEYS) {
    it(`nasce andável em ${key} (200 tentativas)`, () => {
      const map = loadMap(BIOMES[key].rows);
      for (let i = 0; i < 200; i++) {
        const bot = createBot('easy', map.width, map.height);
        expect(bot.x).toBeGreaterThan(0);
        expect(bot.y).toBeGreaterThan(0);
        expect(bot.x).toBeLessThan(map.width);
        expect(bot.y).toBeLessThan(map.height);
        expect(isWallAtPx(bot.x, bot.y)).toBe(false);
        // o círculo inteiro precisa caber, não só o centro
        expect(circleOverlaps(bot.x, bot.y, bot.radius)).toBe(false);
      }
    });
  }

  it('o mapa não carregado não quebra a criação', () => {
    loadMap(BIOMES.cidade.rows);
    const bot = createBot('medium', 1920, 1280);
    expect(bot.radius).toBe(16);
    expect(Number.isFinite(bot.x)).toBe(true);
    expect(Number.isFinite(bot.y)).toBe(true);
  });

  it('nunca nasce em cima do jogador novo (jogador entra no centro)', () => {
    const map = loadMap(BIOMES.cidade.rows);
    const px = map.width / 2;
    const py = map.height / 2;
    let colisoes = 0;
    for (let i = 0; i < 300; i++) {
      const bot = createBot('easy', map.width, map.height);
      if (Math.hypot(bot.x - px, bot.y - py) < 200) colisoes++;
    }
    expect(colisoes).toBe(0);
  });
});
