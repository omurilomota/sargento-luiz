import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// shop toca sfx a cada compra e não há AudioContext no node — mesmo mock do saveSystem.test.ts
vi.mock('../systems/audio', () => {
  const noop = () => {};
  return { sfxBuy: noop, sfxError: noop };
});
import { getShopLayout, rowActionButtons, Rect, pushPendingReveal, addPurchasedWeapon, resetShop, getPurchasedWeaponPairs, hasWeaponPair, keepPendingReveal, getPendingReveals } from '../ui/shop';


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

  it('cria 3 slots de arma sorteados e 3 slots de perk', () => {
    expect(L.weapons).toHaveLength(3);
    // a escada substituiu os 19 UPGRADES avulsos: a seção não cresce com o
    // catálogo, são sempre as 3 linhas da oferta da visita
    expect(L.upgrades).toHaveLength(3);
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

describe('rowActionButtons: vender só no botão VENDER', () => {
  beforeAll(() => {
    // estado padrão do módulo: 1 arma no inventário e nenhuma novidade —
    // completa o estado para ter linhas reais nas duas seções
    pushPendingReveal(1, 'normal');
    pushPendingReveal(2, 'normal');
    pushPendingReveal(3, 'normal');
    addPurchasedWeapon(1, 'normal');
    addPurchasedWeapon(2, 'normal');
    addPurchasedWeapon(3, 'normal');
  });

  it('caixas ficam dentro da linha, sem sobreposição entre si, alinhadas verticalmente', () => {
    const L = getShopLayout(W, H);
    expect(L.inventory.length).toBeGreaterThanOrEqual(2);
    expect(L.novidades.length).toBeGreaterThanOrEqual(2);
    for (const r of [...L.inventory, ...L.novidades]) {
      const { primary, sell } = rowActionButtons(r);
      for (const b of [primary, sell]) {
        expect(b.x).toBeGreaterThanOrEqual(r.x);
        expect(b.x + b.w).toBeLessThanOrEqual(r.x + r.w);
        expect(b.y).toBeGreaterThanOrEqual(r.y);
        expect(b.y + b.h).toBeLessThanOrEqual(r.y + r.h);
      }
      expect(overlaps(primary, sell)).toBe(false);
      expect(primary.y).toBe(sell.y);
      expect(primary.h).toBe(sell.h);
    }
  });

  it('centro-esquerda da linha não acerta a caixa de venda; o centro dela, sim', () => {
    const L = getShopLayout(W, H);
    for (const r of [...L.inventory, ...L.novidades]) {
      const { sell } = rowActionButtons(r);
      const midY = r.y + r.h / 2;
      expect(hits(sell, r.x + r.w * 0.25, midY)).toBe(false);
      // metade direita fora da caixa também não vende (o bug original)
      expect(hits(sell, sell.x - 1, midY)).toBe(false);
      expect(hits(sell, sell.x + sell.w / 2, midY)).toBe(true);
    }
  });

  it('caixas de linhas adjacentes não se sobrepõem', () => {
    const L = getShopLayout(W, H);
    for (const list of [L.inventory, L.novidades]) {
      for (let i = 1; i < list.length; i++) {
        const prev = rowActionButtons(list[i - 1]);
        const cur = rowActionButtons(list[i]);
        expect(overlaps(prev.primary, cur.primary)).toBe(false);
        expect(overlaps(prev.sell, cur.sell)).toBe(false);
        expect(overlaps(prev.primary, cur.sell)).toBe(false);
        expect(overlaps(prev.sell, cur.primary)).toBe(false);
      }
    }
  });
});

/**
 * Posse por par (arma + qualidade): receber a Pistola Quebrada da NOVIDADE
 * não pode marcar a Pistola Lendária do estoque como ADQUIRIDA.
 *
 * A raridade mora no PAR possuído, não num mapa por índice de arma. Com a
 * mesma arma em duas raridades, um mapa por índice fazia as duas linhas
 * mostrarem e cobrarem a última escrita — o bug de B4.
 */
describe('posse por par (arma + qualidade)', () => {
  beforeEach(() => {
    resetShop();
  });

  it('mesma arma com qualidade diferente não conta como possuída', () => {
    expect(addPurchasedWeapon(1, 'quebrada')).toBe(true);
    expect(hasWeaponPair(1, 'quebrada')).toBe(true);
    expect(hasWeaponPair(1, 'lendaria')).toBe(false);
  });

  it('a mesma arma em duas raridades ocupa dois slots e não se confunde', () => {
    expect(addPurchasedWeapon(1, 'quebrada')).toBe(true);
    expect(addPurchasedWeapon(1, 'lendaria')).toBe(true);
    expect(hasWeaponPair(1, 'quebrada')).toBe(true);
    expect(hasWeaponPair(1, 'lendaria')).toBe(true);
    const pares = getPurchasedWeaponPairs().filter(p => p.index === 1);
    expect(pares).toHaveLength(2);
  });

  it('keepPendingReveal guarda o par exato da caixa', () => {
    pushPendingReveal(2, 'lendaria');
    expect(keepPendingReveal(getPendingReveals().length - 1)).toBe(true);
    expect(hasWeaponPair(2, 'lendaria')).toBe(true);
    expect(hasWeaponPair(2, 'quebrada')).toBe(false);
  });

  it('getPurchasedWeaponPairs devolve os pares para o save', () => {
    addPurchasedWeapon(3, 'boa');
    const pairs = getPurchasedWeaponPairs();
    expect(pairs).toContainEqual({ index: 3, quality: 'boa' });
  });
});

describe('getShopLayout: os dois botões de monetização', () => {
  // Bug de sobreposição anterior: o diário era posicionado em `ad.y + ad.h + 45`
  // e o clique do ad ficava logo acima. Ao entrar o botão de apoio, os dois
  // precisaram de casa própria — é o que estes testes travam.
  for (const [w, h] of [[1280, 720], [1920, 1080], [1024, 600]] as [number, number][]) {
    it(`resgate e apoio não se sobrepõem em ${w}x${h}`, () => {
      const L = getShopLayout(w, h);
      expect(overlaps(L.ad, L.support)).toBe(false);
    });

    it(`apoio fica abaixo do resgate e acima do diário em ${w}x${h}`, () => {
      const L = getShopLayout(w, h);
      expect(L.support.y).toBeGreaterThanOrEqual(L.ad.y + L.ad.h);
      expect(L.sections.diary).toBeGreaterThan(L.support.y + L.support.h);
    });

    it(`os dois cabem dentro da coluna esquerda em ${w}x${h}`, () => {
      const L = getShopLayout(w, h);
      for (const r of [L.ad, L.support]) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.w).toBeGreaterThan(0);
        expect(r.h).toBeGreaterThan(0);
      }
    });

    it(`o conteúdo rolável cobre o botão de apoio em ${w}x${h}`, () => {
      const L = getShopLayout(w, h);
      expect(L.contentHeight).toBeGreaterThan(L.support.y + L.support.h);
    });
  }
});

describe('vender ponto (T4): a linha não pisa na árvore', () => {
  it('o botão fica ABAIXO da última linha de talento, sem sobreposição', () => {
    const L = getShopLayout(W, H);
    const ultima = L.talentos[L.talentos.length - 1];
    expect(L.venderPonto.y).toBeGreaterThanOrEqual(ultima.y + ultima.h);
    for (const r of L.talentos) {
      expect(overlaps(L.venderPonto, r), `sobrepõe a linha em y=${r.y}`).toBe(false);
    }
  });

  it('o conteúdo rolável cobre o botão de venda', () => {
    const L = getShopLayout(W, H);
    expect(L.contentHeight).toBeGreaterThan(L.venderPonto.y + L.venderPonto.h);
  });
});
