import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// a loja toca sfx a cada compra e não há AudioContext no node
vi.mock('../systems/audio', () => {
  const noop = () => {};
  return { sfxBuy: noop, sfxError: noop };
});
import {
  PERK_LADDER, degrausCompraveis, ofertaDePerks,
  registrarTiroPerks, acenderInimigo, tickPerks,
  checarSegundoFolego, danoPassoFantasma, limparDashFantasma,
  ativarEspecialPerk, resetPerks,
  temIncandescente, temSegundoFolego, temPassoFantasma, temSortudoAtivo,
} from '../systems/perks';
import { resetShop, getPurchasedUpgrades, getStockPerks, buyPerk, setShopCoins, getShopStock } from '../ui/shop';
import { resetWeapons } from '../weapons';
import { initPlayer, resetPlayerProgress } from '../entities/player';
import { resetStats, getStat } from '../core/stats';

describe('escada de perks', () => {
  beforeEach(() => resetPerks());

  it('4 ramos com 5 degraus + 1 especial cada', () => {
    expect(PERK_LADDER).toHaveLength(24);
    for (const ramo of ['dano', 'corpo', 'pernas', 'mente']) {
      const doRamo = PERK_LADDER.filter(t => t.ram === ramo);
      expect(doRamo).toHaveLength(6);
      expect(doRamo.filter(t => t.special)).toHaveLength(1);
    }
  });

  it('dano soma +40% nos 5 degraus', () => {
    const total = PERK_LADDER.filter(t => t.ram === 'dano' && !t.special)
      .reduce((s, t) => s + t.value, 0);
    expect(total).toBeCloseTo(0.4, 5);
  });

  it('degrau N exige o N-1', () => {
    expect(degrausCompraveis([]).map(t => t.id)).toEqual(
      expect.arrayContaining(['dano_t1', 'corpo_t1', 'pernas_t1', 'mente_t1']));
    expect(degrausCompraveis([])).toHaveLength(4);
    expect(degrausCompraveis(['dano_t1']).map(t => t.id)).toContain('dano_t2');
    expect(degrausCompraveis(['dano_t1']).map(t => t.id)).not.toContain('dano_t3');
  });

  it('oferta tem 3 e garante 1 da build atual', () => {
    const rand = () => 0;
    const oferta = ofertaDePerks(['corpo_t1', 'corpo_t2'], rand);
    expect(oferta).toHaveLength(3);
    expect(oferta.some(t => t.ram === 'corpo')).toBe(true);
  });

  it('run nova cai no dano T1', () => {
    const oferta = ofertaDePerks([], () => 0);
    expect(oferta[0].id).toBe('dano_t1');
  });

  it('incandescente acende a cada 5º tiro e queima 2/s por 3s', () => {
    ativarEspecialPerk('pistola_incandescente');
    const acesos = [1, 2, 3, 4, 5].map(() => registrarTiroPerks());
    expect(acesos).toEqual([false, false, false, false, true]);
    const alvo = {};
    acenderInimigo(alvo);
    let danoTotal = 0;
    for (let i = 0; i < 30; i++) {
      for (const t of tickPerks(0.1)) if (t.inimigo === alvo) danoTotal += t.dano;
    }
    expect(danoTotal).toBeCloseTo(6, 0);
    expect(tickPerks(0.1)).toHaveLength(0);
  });

  it('segundo fôlego dispara abaixo de 30% uma vez só', () => {
    ativarEspecialPerk('segundo_folego');
    expect(checarSegundoFolego(29, 100)).toBe(1.5);
    expect(checarSegundoFolego(10, 100)).toBe(0);
  });

  it('passo fantasma fere uma vez por dash', () => {
    ativarEspecialPerk('passo_fantasma');
    const alvo = {};
    expect(danoPassoFantasma(alvo, true)).toBe(25);
    expect(danoPassoFantasma(alvo, true)).toBe(0);
    limparDashFantasma();
    expect(danoPassoFantasma(alvo, true)).toBe(25);
    expect(danoPassoFantasma(alvo, false)).toBe(0);
  });
});

/**
 * A run nova tem de começar do zero.
 *
 * `resetPerks` e `resetStats` estavam importados em `main.ts` e nunca chamados,
 * e `resetShop` não zerava a oferta: a segunda partida do mesmo dia abria com
 * os 4 especiais da primeira, o `damageMult` já multiplicado e a loja
 * oferecendo degraus que o jogador não podia mais comprar. Nenhum desses três
 * é alcançável pelo `resetShop`/`resetPlayerProgress`, então o teste monta a
 * mesma sequência do `resetGame`.
 */
describe('reset de partida', () => {
  beforeEach(() => {
    initPlayer(1280, 720);
    resetShop();
    resetWeapons();
    resetPerks();
    resetStats();
    setShopCoins(99999);
  });
  afterEach(() => { resetShop(); resetWeapons(); resetPerks(); resetStats(); });

  /** A mesma sequência que o `resetGame` de `main.ts` roda. */
  function resetDePartida(): void {
    resetPlayerProgress();
    resetWeapons();
    resetShop();
    resetPerks();
    resetStats();
  }

  it('a run seguinte não herda os 4 especiais', () => {
    for (const especial of ['pistola_incandescente', 'segundo_folego', 'passo_fantasma', 'sortudo']) {
      ativarEspecialPerk(especial);
    }
    expect([temIncandescente(), temSegundoFolego(), temPassoFantasma(), temSortudoAtivo()])
      .toEqual([true, true, true, true]);

    resetDePartida();
    expect([temIncandescente(), temSegundoFolego(), temPassoFantasma(), temSortudoAtivo()])
      .toEqual([false, false, false, false]);
  });

  it('a run seguinte não herda o dano comprado', () => {
    resetDePartida();
    buyPerk('dano_t1');
    buyPerk('dano_t2');
    expect(getStat('damageMult')).toBeCloseTo(1.16, 5);

    resetDePartida();
    expect(getStat('damageMult'), 'o dano da run anterior sobrou para a próxima').toBeCloseTo(1, 5);
  });

  it('a run seguinte não herda os degraus comprados', () => {
    buyPerk('dano_t1');
    buyPerk('dano_t2');
    expect(getPurchasedUpgrades()).toEqual(['dano_t1', 'dano_t2']);
    getShopStock();
    expect(getStockPerks().length, 'a oferta da visita ficou vazia').toBeGreaterThan(0);

    resetDePartida();
    expect(getPurchasedUpgrades()).toEqual([]);
    // o reset zera a oferta; a próxima visita sorteia de novo, e com a escada
    // zerada o sorteio tem de oferecer o primeiro degrau, não os degraus 3-5
    expect(getStockPerks(), 'a run nova abriu a loja com a oferta da run anterior').toEqual([]);
    getShopStock();
    expect(getStockPerks(), 'a run nova tem de poder comprar o primeiro degrau de novo').toContain('dano_t1');
  });

  it('a run seguinte começa com a escada inteira comprável de novo', () => {
    for (const t of PERK_LADDER) buyPerk(t.id);
    expect(getPurchasedUpgrades()).toHaveLength(24);

    resetDePartida();
    expect(degrausCompraveis(getPurchasedUpgrades()).map(t => t.id))
      .toEqual(['dano_t1', 'corpo_t1', 'pernas_t1', 'mente_t1']);
  });

  it('resetPerks limpa a queimadura do incandescente, não só a flag', () => {
    ativarEspecialPerk('pistola_incandescente');
    const alvo = {};
    acenderInimigo(alvo);
    expect(tickPerks(0.1)).toHaveLength(1);

    resetPerks();
    expect(tickPerks(0.1), 'a queimadura sobreviveu ao reset').toHaveLength(0);
  });

  it('resetPerks devolve o 2º fôlego e a lista de acertos do dash', () => {
    ativarEspecialPerk('segundo_folego');
    expect(checarSegundoFolego(20, 100)).toBe(1.5);
    ativarEspecialPerk('passo_fantasma');
    const alvo = {};
    expect(danoPassoFantasma(alvo, true)).toBe(25);

    resetPerks();
    ativarEspecialPerk('segundo_folego');
    ativarEspecialPerk('passo_fantasma');
    expect(checarSegundoFolego(20, 100), 'o 2º fôlego foi gasto na run anterior').toBe(1.5);
    expect(danoPassoFantasma(alvo, true), 'o dash já tinha acertado esse inimigo').toBe(25);
  });
});