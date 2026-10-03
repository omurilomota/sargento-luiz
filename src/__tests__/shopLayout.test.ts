import { describe, it, expect } from 'vitest';
import { getShopLayout, Rect } from '../ui/shop';
import { WEAPONS, UPGRADES } from '../config';

const W = 1280;
const H = 720;

function hits(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

describe('getShopLayout: geometria única', () => {
  const L = getShopLayout(W, H);

  it('cria um retângulo por arma e por upgrade, na ordem do config', () => {
    expect(L.weapons).toHaveLength(WEAPONS.length);
    expect(L.upgrades).toHaveLength(UPGRADES.length);
  });

  it('as linhas não se sobrepõem dentro de cada coluna', () => {
    for (const list of [L.weapons, L.upgrades]) {
      for (let i = 1; i < list.length; i++) {
        expect(list[i].y).toBeGreaterThanOrEqual(list[i - 1].y + list[i - 1].h);
      }
    }
  });

  it('arma e upgrade ficam em colunas separadas', () => {
    for (let i = 0; i < L.weapons.length; i++) {
      expect(overlaps(L.weapons[i], L.upgrades[i])).toBe(false);
    }
  });

  it('nada dentro da área de clip vaza para fora dela', () => {
    for (const list of [L.weapons, L.upgrades, L.skins, [L.ad]]) {
      for (const r of list) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(W);
        expect(r.y).toBeGreaterThan(L.clip.y);
      }
    }
  });

  it('skins não se sobrepõem entre si', () => {
    for (let i = 0; i < L.skins.length; i++) {
      for (let j = i + 1; j < L.skins.length; j++) {
        expect(overlaps(L.skins[i], L.skins[j])).toBe(false);
      }
    }
  });

  it('nenhum item da coluna esquerda cai em cima da direita', () => {
    const left = [...L.weapons, ...L.skins, L.ad];
    for (const a of left) {
      for (const b of L.upgrades) {
        expect(overlaps(a, b)).toBe(false);
      }
    }
  });
});

describe('getShopLayout: o hit-test bate com o desenho', () => {
  const L = getShopLayout(W, H);

  it('o centro de cada arma está dentro do próprio retângulo e de nenhum outro', () => {
    for (let i = 0; i < L.weapons.length; i++) {
      const r = L.weapons[i];
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      expect(hits(r, cx, cy)).toBe(true);
      for (let j = 0; j < L.weapons.length; j++) {
        if (j === i) continue;
        expect(hits(L.weapons[j], cx, cy)).toBe(false);
      }
    }
  });

  it('o centro de cada upgrade não cai em cima de nenhuma arma', () => {
    for (let i = 0; i < L.upgrades.length; i++) {
      const r = L.upgrades[i];
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      for (const w of L.weapons) {
        expect(hits(w, cx, cy)).toBe(false);
      }
    }
  });

  it('a coluna direita começa depois de width/2 (onde a clicada antiga errava)', () => {
    // o bug B3: o draw usava leftX=40/colW=w/2-60 e o clique leftX=20/colW=w/2-40
    for (const r of L.upgrades) {
      expect(r.x).toBeGreaterThanOrEqual(W / 2);
    }
    for (const r of L.weapons) {
      expect(r.x + r.w).toBeLessThanOrEqual(W / 2);
    }
  });

  it('o layout responde à largura da tela (bug B3 não pode voltar)', () => {
    const narrow = getShopLayout(1024, 600);
    for (const w of narrow.weapons) {
      for (const u of narrow.upgrades) {
        expect(overlaps(w, u)).toBe(false);
      }
    }
    // a coluna direita continua começando depois da metade da tela
    for (const u of narrow.upgrades) {
      expect(u.x).toBeGreaterThanOrEqual(1024 / 2);
    }
  });

  it('maxScroll nunca deixa o conteúdo passar do fim da lista', () => {
    expect(L.maxScroll).toBeGreaterThan(0);
    expect(L.contentHeight).toBeGreaterThan(0);
  });
});
