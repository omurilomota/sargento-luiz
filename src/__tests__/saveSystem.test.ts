import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// O áudio é o único ponto do fluxo testado que fala com a Web Audio API, e não
// existe AudioContext no node. O shop toca sfx a cada compra, então o módulo
// inteiro é mockado: o que o teste verifica é o estado, não o som.
vi.mock('../systems/audio', () => {
  const noop = () => {};
  return {
    initAudio: noop, startMusic: noop, playMusic: noop, stopMusic: noop,
    sfxBuy: noop, sfxError: noop, sfxMenuMove: noop, sfxCoin: noop, sfxPlayerHit: noop,
    sfxPistol: noop, sfxShotgun: noop, sfxMachinegun: noop, sfxSniper: noop,
    sfxLaser: noop, sfxRPG: noop, sfxRaios: noop, sfxGel: noop, sfxGranade: noop,
    sfxMina: noop, sfxExplosion: noop, sfxPowerup: noop, isMusicEnabled: () => true,
    isSfxEnabled: () => true, toggleMusic: noop, toggleSfx: noop,
  };
});

import { saveGame, loadGame, hasSave, deleteSave, markGameCompleted, isGameCompleted } from '../systems/saveSystem';
import {
  resetShop, getPurchasedWeapons, getPurchasedUpgrades, restoreUpgrades,
  buyUpgrade, setShopCoins, addPurchasedWeapon, getShopLayout, SHOP_SERVICES,
} from '../ui/shop';
import { UPGRADES } from '../config';
import { resetWeapons, getDamageMultiplier, getPierceCount } from '../weapons';
import { initPlayer, resetPlayer } from '../entities/player';

// O ambiente de teste é node, e o saveSystem só funciona na fronteira: ele
// chama `localStorage` direto e engole exceção. Um stub em memória cobre o
// contrato sem trazer jsdom como dependência.
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
}
const storage = new MemoryStorage();
(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = storage;


/**
 * Save/load tinha a ilusão de funcionar: `saveGame` gravava inventário,
 * qualidades e upgrades, mas `startFromSave` chamava `resetGame()` (que zera
 * `purchasedWeapons` para `[0]`) e nunca reaplicava nada do save. O jogador
 * voltava com a pistola e zero upgrades, sem erro nenhum no console.
 *
 * Aqui a trava é o round-trip: o que entra tem que voltar igual.
 */
describe('saveGame/loadGame: o round-trip', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('devolve fase, onda, moedas, score e nome da fase', () => {
    saveGame(3, 2, 1, 250, 9000, [], [], 'Caverna');
    const s = loadGame();
    expect(s).not.toBeNull();
    expect(s!.phase).toBe(3);
    expect(s!.wave).toBe(2);
    expect(s!.weaponIndex).toBe(1);
    expect(s!.coins).toBe(250);
    expect(s!.score).toBe(9000);
    expect(s!.phaseName).toBe('Caverna');
  });

  it('preserva o inventário com a qualidade de cada arma', () => {
    const weapons = [
      { index: 0, quality: 'normal' },
      { index: 3, quality: 'militar' },
      { index: 7, quality: 'quebrada' },
    ];
    saveGame(1, 0, 3, 0, 0, [], weapons, 'Floresta');
    expect(loadGame()!.weapons).toEqual(weapons);
  });

  it('preserva a lista de upgrades comprados', () => {
    const upgrades = ['Vida +25', 'Dano +50%', 'Armadura'];
    saveGame(1, 0, 0, 0, 0, upgrades, [], 'Floresta');
    expect(loadGame()!.upgrades).toEqual(upgrades);
  });

  it('hasSave() reflete a existência do save e some no delete', () => {
    expect(hasSave()).toBe(false);
    saveGame(0, 0, 0, 0, 0, [], [], 'Cidade');
    expect(hasSave()).toBe(true);
    deleteSave();
    expect(hasSave()).toBe(false);
  });

  it('devolve null em vez de estourar quando o JSON está corrompido', () => {
    localStorage.setItem('bubbleShooter_save', '{ nao é json');
    expect(loadGame()).toBeNull();
  });

  it('marca o jogo como completado de forma independente do save', () => {
    deleteSave();
    expect(isGameCompleted()).toBe(false);
    markGameCompleted();
    expect(isGameCompleted()).toBe(true);
    expect(hasSave()).toBe(false);
  });
});

/**
 * O save só vale se o `startFromSave` conseguir reconstituir o estado. Ele não é
 * testável aqui (é o orquestrador com DOM), então o teste trava o segundo
 * passo da sequência: `resetShop` limpa tudo, e a restauração tem que devolver
 * inventário e upgrades ao lugar.
 */
describe('restauração depois do resetShop', () => {
  beforeEach(() => {
    initPlayer(1280, 720);
    resetShop();
    resetWeapons();
    setShopCoins(99999);
  });
  afterEach(() => {
    resetShop();
    resetWeapons();
  });

  it('resetShop zera o inventário de volta para a pistola só', () => {
    addPurchasedWeapon(2);
    addPurchasedWeapon(4);
    expect(getPurchasedWeapons()).toEqual([0, 2, 4]);
    resetShop();
    expect(getPurchasedWeapons()).toEqual([0]);
  });

  it('restoreUpgrades devolve exatamente o que foi salvo', () => {
    const saved = ['Vida +25', 'Dano +50%', 'Armadura'];
    restoreUpgrades(saved);
    expect(getPurchasedUpgrades()).toEqual(saved);
  });

  it('restoreUpgrades reproduz o mesmo multiplicador que a compra normal', () => {
    buyUpgrade('Dano +25%');
    const danoPorCompra = getDamageMultiplier();
    resetShop();
    resetWeapons();
    restoreUpgrades(['Dano +25%']);
    expect(getDamageMultiplier()).toBeCloseTo(danoPorCompra, 5);
  });
});

/**
 * Upgrades do mesmo efeito não podem empilhar. "Vida +25" e "Vida +50" no
 * mesmo efeito significam 50, não 75: o segundo substitui o primeiro e cobra só
 * a diferença. Sem isso o jogador compra "Dano +25%" e "Dano +50%" e recebe um
 * multiplicador de 1.75, que era o complaint de "upgrades sobrepostos".
 */
describe('upgrades do mesmo efeito substituem, não empilham', () => {
  beforeEach(() => {
    initPlayer(1280, 720);
    resetShop();
    resetWeapons();
    setShopCoins(99999);
  });
  afterEach(() => {
    resetShop();
    resetWeapons();
  });

  it('rejeita comprar um valor menor ou igual ao que já tem do mesmo efeito', () => {
    expect(buyUpgrade('Dano +50%')).toBe(true);
    const antes = getDamageMultiplier();
    expect(buyUpgrade('Dano +25%')).toBe(false);
    expect(getDamageMultiplier()).toBe(antes);
  });

  it('aplica só a diferença ao comprar um valor maior do mesmo efeito', () => {
    buyUpgrade('Dano +25%');
    const com25 = getDamageMultiplier();
    expect(buyUpgrade('Dano +50%')).toBe(true);
    // 1 + 0.25 + (0.50 - 0.25) = 1.5, e não 1.75
    expect(getDamageMultiplier()).toBeCloseTo(com25 + 0.25, 5);
  });

  it('cada efeito é independente: dano não afeta pierce', () => {
    buyUpgrade('Pierce');
    expect(getPierceCount()).toBe(1);
    buyUpgrade('Dano +25%');
    expect(getPierceCount()).toBe(1);
  });

  it('as duas compras do mesmo efeito ficam registradas pelo nome', () => {
    buyUpgrade('Vida +25');
    buyUpgrade('Vida +50');
    expect(getPurchasedUpgrades()).toEqual(['Vida +25', 'Vida +50']);
  });

  it('todo upgrade do config tem um effect reconhecido por applyUpgrade', () => {
    // effect novo esquecido no applyUpgrade = compra aceita que não dá nada
    const known = new Set(['damage', 'pierce', 'crit', 'health', 'speed', 'shield', 'magnet', 'regen', 'reloadSpeed', 'armor']);
    for (const u of UPGRADES) {
      expect(known.has(u.effect), `effect desconhecido: ${u.effect} (${u.name})`).toBe(true);
    }
  });
});

describe('getShopLayout cobre os serviços atuais', () => {
  it('cria um retângulo por serviço, incluindo o Reparo', () => {
    const L = getShopLayout(1280, 720);
    expect(L.services).toHaveLength(SHOP_SERVICES.length);
    expect(SHOP_SERVICES.map(s => s.id)).toContain('repair');
  });
});
