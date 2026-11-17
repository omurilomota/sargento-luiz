/**
 * As correções da rodada 2026-11-17 (P0-2, P0-4 e P1-13).
 *
 * Cada teste aqui trava um contrato que o relato do playtest cobrava:
 * o martelo é corpo a corpo, a Ponte declara spawn em grupo e a loja não
 * exibe moedas negativas.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PHASES, WEAPONS } from '../config';
import { addShopCoins, getShopCoins, resetShop } from '../ui/shop';

describe('P0-4: o martelo é corpo a corpo', () => {
  const martelo = WEAPONS.find(w => w.name === 'Destruidor')!;

  it('tem arco curto e não voa como projétil', () => {
    expect(martelo.melee).toBe(true);
    expect(martelo.meleeRange).toBeGreaterThan(0);
    expect(martelo.meleeRange!).toBeLessThan(160);
    expect(martelo.meleeArc).toBeGreaterThan(1);
    expect(martelo.bulletSpeed).toBe(0);
  });
});

describe('P0-2: a Ponte declara spawn em grupo', () => {
  it('a Ponte entra em bloco e as outras fases seguem um por vez', () => {
    const ponte = PHASES.find(f => f.name === 'Ponte')!;
    expect(ponte.spawnGroup ?? 1).toBeGreaterThanOrEqual(2);
    for (const fase of PHASES) {
      if (fase.name !== 'Ponte') expect(fase.spawnGroup ?? 1).toBe(1);
    }
  });
});

describe('P1-13: moedas nunca ficam negativas', () => {
  beforeEach(() => resetShop());

  it('o evento de azar (-10) para no zero', () => {
    expect(getShopCoins()).toBe(0);
    addShopCoins(-10);
    expect(getShopCoins()).toBe(0);
    addShopCoins(15);
    addShopCoins(-40);
    expect(getShopCoins()).toBe(0);
  });
});
