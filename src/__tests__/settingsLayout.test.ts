import { describe, it, expect } from 'vitest';
import {
  getSettingsLayout, settingsRowAt, settingsButtonAt,
  getMenuLayout, menuIndexAt,
} from '../systems/renderer';

const SIZES: [number, number][] = [
  [1920, 1080],
  [1280, 720],
  [1024, 600],
  [800, 480],
];

describe('getSettingsLayout: hitbox do painel = layout desenhado', () => {
  it('cria 5 linhas (3 volumes + 2 toggles)', () => {
    for (const [w, h] of SIZES) {
      expect(getSettingsLayout(w, h).rows).toHaveLength(5);
    }
  });

  it('as linhas não se sobrepõem', () => {
    for (const [w, h] of SIZES) {
      const { rows } = getSettingsLayout(w, h);
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i].y).toBeGreaterThanOrEqual(rows[i - 1].y + rows[i - 1].h);
      }
    }
  });

  it('tudo cabe na tela e dentro da box', () => {
    for (const [w, h] of SIZES) {
      const L = getSettingsLayout(w, h);
      expect(L.x).toBeGreaterThanOrEqual(0);
      expect(L.y).toBeGreaterThanOrEqual(0);
      expect(L.x + L.w).toBeLessThanOrEqual(w);
      expect(L.y + L.h).toBeLessThanOrEqual(h);
      for (const r of L.rows) {
        expect(r.x).toBeGreaterThanOrEqual(L.x);
        expect(r.y).toBeGreaterThanOrEqual(L.y);
        expect(r.x + r.w).toBeLessThanOrEqual(L.x + L.w);
        expect(r.y + r.h).toBeLessThanOrEqual(L.y + L.h);
        if (r.minus && r.plus) {
          expect(r.minus.x).toBeGreaterThanOrEqual(L.x);
          expect(r.plus.x + r.plus.w).toBeLessThanOrEqual(L.x + L.w);
          // botões não invadem a barra de volume (barra: r.x+130, 100px)
          expect(r.minus.x).toBeGreaterThan(r.x + 130 + 100);
        }
      }
    }
  });

  it('o centro de cada linha devolve o índice certo', () => {
    for (const [w, h] of SIZES) {
      const { rows } = getSettingsLayout(w, h);
      rows.forEach((r, i) => {
        expect(settingsRowAt(r.x + r.w / 2, r.y + r.h / 2, w, h)).toBe(i);
      });
    }
  });

  it('o centro dos botões devolve o botão certo', () => {
    for (const [w, h] of SIZES) {
      const { rows } = getSettingsLayout(w, h);
      rows.forEach((r, i) => {
        if (!r.minus || !r.plus) return;
        expect(settingsButtonAt(r.minus.x + r.minus.w / 2, r.minus.y + r.minus.h / 2, w, h))
          .toEqual({ row: i, dir: -1 });
        expect(settingsButtonAt(r.plus.x + r.plus.w / 2, r.plus.y + r.plus.h / 2, w, h))
          .toEqual({ row: i, dir: 1 });
      });
    }
  });

  it('clicar fora do painel devolve -1 / null', () => {
    expect(settingsRowAt(5, 5, 1280, 720)).toBe(-1);
    expect(settingsButtonAt(5, 5, 1280, 720)).toBeNull();
    expect(settingsRowAt(1275, 715, 1280, 720)).toBe(-1);
    expect(settingsButtonAt(1275, 715, 1280, 720)).toBeNull();
  });

  it('linhas de toggle não têm botões de volume', () => {
    const { rows } = getSettingsLayout(1280, 720);
    expect(rows[0].kind).toBe('volume');
    expect(rows[1].kind).toBe('volume');
    expect(rows[2].kind).toBe('volume');
    expect(rows[3].kind).toBe('toggle');
    expect(rows[4].kind).toBe('toggle');
    for (const r of rows.slice(0, 3)) {
      expect(r.minus).not.toBeNull();
      expect(r.plus).not.toBeNull();
    }
    for (const r of rows.slice(3)) {
      expect(r.minus).toBeNull();
      expect(r.plus).toBeNull();
    }
  });

  it('o vão entre duas linhas não seleciona nenhuma', () => {
    const w = 1280;
    const h = 720;
    const { rows } = getSettingsLayout(w, h);
    const a = rows[0];
    const b = rows[1];
    const gapY = a.y + a.h + (b.y - (a.y + a.h)) / 2;
    expect(settingsRowAt(a.x + 10, gapY, w, h)).toBe(-1);
  });
});

describe('getMenuLayout: row de configurações', () => {
  it('é non-null em telas grandes (1280x720, 1920x1080)', () => {
    expect(getMenuLayout(1280, 720).settingsRow).not.toBeNull();
    expect(getMenuLayout(1920, 1080).settingsRow).not.toBeNull();
  });

  it('é null em 800x480 (não cabe acima do rodapé)', () => {
    expect(getMenuLayout(800, 480).settingsRow).toBeNull();
  });

  it('o centro da row devolve o sentinela 200 quando existe', () => {
    const w = 1280;
    const h = 720;
    const row = getMenuLayout(w, h).settingsRow!;
    expect(menuIndexAt(row.x + row.w / 2, row.y + row.h / 2, w, h)).toBe(200);
  });

  it('a row não se sobrepõe às classes nem aos modos', () => {
    const w = 1280;
    const h = 720;
    const L = getMenuLayout(w, h);
    const row = L.settingsRow!;
    const lastClass = L.classItems[L.classItems.length - 1];
    expect(row.y).toBeGreaterThanOrEqual(lastClass.y + lastClass.h);
    for (const item of L.items) {
      expect(row.y).toBeGreaterThanOrEqual(item.y + item.h);
    }
  });

  it('a row cabe na tela quando existe', () => {
    for (const [w, h] of SIZES) {
      const row = getMenuLayout(w, h).settingsRow;
      if (!row) continue;
      expect(row.x).toBeGreaterThanOrEqual(0);
      expect(row.y).toBeGreaterThanOrEqual(0);
      expect(row.x + row.w).toBeLessThanOrEqual(w);
      expect(row.y + row.h).toBeLessThanOrEqual(h * 0.88);
    }
  });
});
