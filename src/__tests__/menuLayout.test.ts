import { describe, it, expect } from 'vitest';
import { getMenuLayout, menuIndexAt } from '../systems/renderer';
import { GAME_MODES } from '../systems/gameModes';

const SIZES: [number, number][] = [
  [1920, 1080],
  [1280, 720],
  [1024, 600],
  [800, 480],
];

describe('getMenuLayout: hitbox do menu = layout desenhado', () => {
  it('cria um item por modo real do jogo', () => {
    for (const [w, h] of SIZES) {
      expect(getMenuLayout(w, h).items).toHaveLength(GAME_MODES.length);
    }
  });

  it('os itens não se sobrepõem', () => {
    for (const [w, h] of SIZES) {
      const { items } = getMenuLayout(w, h);
      for (let i = 1; i < items.length; i++) {
        expect(items[i].y).toBeGreaterThanOrEqual(items[i - 1].y + items[i - 1].h);
      }
    }
  });

  it('tudo cabe na tela, inclusive em 800x480', () => {
    for (const [w, h] of SIZES) {
      const { items } = getMenuLayout(w, h);
      for (const r of items) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(w);
        expect(r.y + r.h).toBeLessThanOrEqual(h);
      }
    }
  });

  it('o centro de cada item devolve o índice certo (bug B2)', () => {
    for (const [w, h] of SIZES) {
      const { items } = getMenuLayout(w, h);
      items.forEach((r, i) => {
        expect(menuIndexAt(r.x + r.w / 2, r.y + r.h / 2, w, h)).toBe(i);
      });
    }
  });

  it('clicar fora dos itens devolve -1', () => {
    expect(menuIndexAt(5, 5, 1280, 720)).toBe(-1);
    expect(menuIndexAt(1275, 715, 1280, 720)).toBe(-1);
  });

  it('o vão entre dois itens não seleciona nenhum modo', () => {
    const w = 1280;
    const h = 720;
    const { items } = getMenuLayout(w, h);
    const a = items[1];
    const b = items[2];
    const gapY = a.y + a.h + (b.y - (a.y + a.h)) / 2;
    expect(menuIndexAt(a.x + 10, gapY, w, h)).toBe(-1);
  });

  it('o título fica acima da lista de modos', () => {
    for (const [w, h] of SIZES) {
      const L = getMenuLayout(w, h);
      expect(L.titleY).toBeLessThan(L.items[0].y);
    }
  });
});
