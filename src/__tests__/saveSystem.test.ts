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
import { getLeaderboard } from '../systems/leaderboard';
import { ACHIEVEMENTS, loadAchievements } from '../systems/achievements';
import {
  resetShop, getPurchasedWeapons, getPurchasedUpgrades, restoreUpgrades, buyPerk,
  getStockPerks, setShopCoins, addPurchasedWeapon, getShopLayout, SHOP_SERVICES,
} from '../ui/shop';
import { PERK_LADDER, PERK_LEGADO, resetPerks, temIncandescente, temSortudoAtivo } from '../systems/perks';
import { resetStats, getStat } from '../core/stats';
import { resetWeapons, getDamageMultiplier, getPierceCount } from '../weapons';
import { initPlayer, resetPlayerProgress, getPlayer } from '../entities/player';
import { restoreXp, restoreTalentos, resetProgress, getXp, getNivel, getPontosLivres, nivelDeXp } from '../systems/progress';

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

  it('devolve o XP; save sem XP explícito carrega como 0', () => {
    saveGame(3, 0, 0, 0, 0, [], [], 'Caverna', [], {}, [], 2180);
    expect(loadGame()!.xp).toBe(2180);
    // save gravado antes da migração não tem o campo; startFromSave usa `?? 0`
    saveGame(1, 0, 0, 0, 0, [], [], 'Cidade');
    expect(loadGame()!.xp ?? 0).toBe(0);
  });

  it('restoreXp recalcula nível do total e pontos livres = níveis - talentos', () => {
    resetProgress();
    restoreTalentos(['mente_crit', 'armas_dano']);
    restoreXp(2180);
    expect(getXp()).toBe(2180);
    expect(getNivel()).toBe(nivelDeXp(2180));
    expect(getPontosLivres()).toBe(getNivel() - 2);
    restoreTalentos([]);
    restoreXp(0);
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
    localStorage.setItem('rios.save', '{ nao é json');
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
    addPurchasedWeapon(2, 'normal');
    addPurchasedWeapon(4, 'normal');
    expect(getPurchasedWeapons()).toEqual([0, 2, 4]);
    resetShop();
    expect(getPurchasedWeapons()).toEqual([0]);
  });

  it('restoreUpgrades devolve exatamente o que foi salvo', () => {
    // O save grava o ID, não o nome. Nome é texto de exibição e já mudou
    // durante o desenvolvimento; com o nome, um combo que checava
    // `u.includes('Dano +25%')` morria em silêncio numa renomeação.
    const saved = ['dano_t2', 'corpo_t1', 'pernas_t3'];
    restoreUpgrades(saved);
    expect(getPurchasedUpgrades()).toEqual(saved);
  });

  it('restoreUpgrades ainda aceita save antigo gravado com o nome', () => {
    restoreUpgrades(['Vida +25', 'Dano +50%']);
    expect(getPurchasedUpgrades()).toEqual(['vida25', 'dano50']);
  });

  it('restoreUpgrades reproduz o mesmo multiplicador que a compra normal', () => {
    buyPerk('dano_t1');
    buyPerk('dano_t2');
    const danoPorCompra = getDamageMultiplier();
    resetShop();
    resetWeapons();
    restoreUpgrades(['dano_t1', 'dano_t2']);
    expect(getDamageMultiplier()).toBeCloseTo(danoPorCompra, 5);
  });
});

/**
 * Os 4 especiais vivem em flag de módulo (`ativarEspecialPerk`), não em stat.
 * Se o continue voltasse por outro caminho que não a compra, o jogador pagava
 * 400 moedas e ficava sem o efeito — e nenhum teste de número pegaria, porque
 * o dano do Incandescente, do Fôlego e do Fantasma não é um multiplicador.
 */
describe('continue devolve os especiais que o jogador comprou', () => {
  beforeEach(() => {
    initPlayer(1280, 720);
    resetShop();
    resetWeapons();
    resetPerks();
    resetStats();
    setShopCoins(99999);
  });
  afterEach(() => { resetShop(); resetWeapons(); resetPerks(); resetStats(); });

  it('restaura um especial comprado (Pistola Incandescente)', () => {
    for (const id of ['dano_t1', 'dano_t2', 'dano_t3', 'dano_t4', 'dano_t5']) buyPerk(id);
    expect(buyPerk('pistola_incandescente')).toBe(true);
    expect(temIncandescente()).toBe(true);

    resetShop();
    resetPerks();
    expect(temIncandescente(), 'o perk sobreviveu ao reset porque ninguém o limpou').toBe(false);

    restoreUpgrades(['dano_t1', 'dano_t2', 'dano_t3', 'dano_t4', 'dano_t5', 'pistola_incandescente']);
    expect(temIncandescente(), 'o especial foi pago e não voltou no continue').toBe(true);
  });

  it('restaura o Sortudo com os pontos de sorte que ele dava', () => {
    for (const id of ['mente_t1', 'mente_t2', 'mente_t3', 'mente_t4', 'mente_t5']) buyPerk(id);
    buyPerk('sortudo');
    const sorteComprada = getStat('luck');
    // mente_t3 já deu +1 de sorte; o Sortudo dá mais 2
    expect(sorteComprada).toBeCloseTo(3, 5);

    resetShop();
    resetPerks();
    resetStats();
    restoreUpgrades(['mente_t1', 'mente_t2', 'mente_t3', 'mente_t4', 'mente_t5', 'sortudo']);
    expect(temSortudoAtivo()).toBe(true);
    expect(getStat('luck'), 'o Sortudo voltou ligado mas sem a sorte').toBeCloseTo(sorteComprada, 5);
  });
});

/**
 * A porta única (`aplicarPerk`) só vale se as duas metades concordarem. Se a
 * compra e o restore tivessem corpos separados, o special voltaria desligado e
 * nenhum `expect` de número acusaria — por isso a comparação é de estado, não
 * de valor.
 */
describe('compra e restore produzem o mesmo estado', () => {
  beforeEach(() => {
    initPlayer(1280, 720);
    resetShop();
    resetWeapons();
    resetPerks();
    resetStats();
    setShopCoins(99999);
  });
  afterEach(() => { resetShop(); resetWeapons(); resetPerks(); resetStats(); });

  it('os 4 specials ficam ativos dos dois jeitos', () => {
    const cadeia = {
      pistola_incandescente: ['dano_t1', 'dano_t2', 'dano_t3', 'dano_t4', 'dano_t5'],
      segundo_folego: ['corpo_t1', 'corpo_t2', 'corpo_t3', 'corpo_t4', 'corpo_t5'],
      passo_fantasma: ['pernas_t1', 'pernas_t2', 'pernas_t3', 'pernas_t4', 'pernas_t5'],
      sortudo: ['mente_t1', 'mente_t2', 'mente_t3', 'mente_t4', 'mente_t5'],
    };
    for (const [especial, degraus] of Object.entries(cadeia)) {
      for (const id of degraus) buyPerk(id);
      expect(buyPerk(especial), `não conseguiu comprar ${especial}`).toBe(true);
    }
    const comprados = getPurchasedUpgrades();
    resetShop();
    resetPerks();
    resetStats();
    restoreUpgrades(comprados);
    expect(temIncandescente()).toBe(true);
    expect(temSortudoAtivo()).toBe(true);
    // mente_t3 dá +1 e o Sortudo mais 2 — o restore tem de devolver os dois
    expect(getStat('luck')).toBeCloseTo(3, 5);
  });
});

/**
 * O save anterior à escada guarda compras que a escada não tem degrau (crítico,
 * pierce, recarga, magnetismo). Quem jogou antes não pode perder isso no
 * continue, e não pode pagar duas vezes pelo mesmo efeito.
 */
describe('save anterior à escada', () => {
  beforeEach(() => {
    initPlayer(1280, 720);
    resetShop();
    resetWeapons();
    resetPerks();
    resetStats();
    setShopCoins(99999);
  });
  afterEach(() => { resetShop(); resetWeapons(); resetPerks(); resetStats(); });

  it('PERK_LEGADO conhece todas as compras por id e por nome', () => {
    // o mapa tem 2 chaves por compra (id e nome de exibição), então a
    // contagem de valores únicos é a das 19 compras do catálogo antigo
    const ids = [...new Set(Object.values(PERK_LEGADO).map(c => c.id))];
    expect(ids.length, 'as compras do catálogo antigo, sem repetição').toBe(19);
    for (const c of Object.values(PERK_LEGADO)) {
      expect(PERK_LEGADO[c.id], `a compra ${c.id} não é acessível pelo próprio id`).toStrictEqual(c);
    }
  });

  it('todo efeito legado é reconhecido por applyUpgrade', () => {
    // efeito novo na tabela = compra antiga aceita que não dá nada
    const reconhecidos = new Set(['damage', 'pierce', 'crit', 'health', 'speed', 'shield', 'magnet', 'regen', 'reloadSpeed', 'armor']);
    for (const c of Object.values(PERK_LEGADO)) {
      expect(reconhecidos.has(c.effect), `efeito desconhecido: ${c.effect} (${c.id})`).toBe(true);
    }
  });

  it('nenhum id legado colide com um id de degrau', () => {
    const degraus = new Set(PERK_LADDER.map(t => t.id));
    for (const c of Object.values(PERK_LEGADO)) {
      expect(degraus.has(c.id), `${c.id} existe na escada: o restore não saberia qual dos dois é`).toBe(false);
    }
  });

  it('restaura compra que a escada não tem degrau (pierce, magnetismo)', () => {
    restoreUpgrades(['pierce', 'magnetismo']);
    expect(getPurchasedUpgrades()).toEqual(['pierce', 'magnetismo']);
    expect(getPierceCount()).toBe(1);
  });

  it('duas compras do mesmo efeito no save valem a maior, não a soma', () => {
    // vida25 (+25) + vida50 (+50) = +50. Somar daria +75, que é o bug do
    // "upgrades sobrepostos" que o catálogo antigo já tinha.
    const base = getPlayer().maxHealth;
    restoreUpgrades(['vida25', 'vida50']);
    const comAsDuas = getPlayer().maxHealth - base;
    resetShop();
    resetWeapons();
    resetPlayerProgress();
    restoreUpgrades(['vida50']);
    const soOMaior = getPlayer().maxHealth - base;
    expect(comAsDuas, 'somou as duas compras do mesmo efeito').toBe(soOMaior);
    expect(comAsDuas).toBe(50);
  });

  it('o nome de exibição volta gravado como id, para o próximo save ser limpo', () => {
    restoreUpgrades(['Vida +25', 'Crítico 2x']);
    expect(getPurchasedUpgrades()).toEqual(['vida25', 'crit2']);
  });

  it('id desconhecido é ignorado sem inventar nada', () => {
    restoreUpgrades(['dano_t1', 'upgrade_do_futuro', 'vida50']);
    expect(getPurchasedUpgrades()).toEqual(['dano_t1', 'vida50']);
  });
});

/**
 * A escada tem contrato diferente do catálogo antigo, e o teste precisa dizer
 * qual: degraus do MESMO ramo SOMAM (+8% por degrau, +40% no fim do ramo), e
 * só o próximo degrau pode ser comprado.
 *
 * O "não empilham" valia para o catálogo de 19 upgrades, onde "Vida +25" e
 * "Vida +50" competiam pelo mesmo efeito. Na escada não há competição: o
 * degrau 4 pressupõe que você comprou o 3.
 */
describe('escada: degraus somam e são sequenciais', () => {
  beforeEach(() => {
    initPlayer(1280, 720);
    resetShop();
    resetWeapons();
    resetPerks();
    resetStats();
    setShopCoins(99999);
  });
  afterEach(() => { resetShop(); resetWeapons(); resetPerks(); resetStats(); });

  it('bloqueia o degrau N se o N-1 não foi comprado', () => {
    expect(buyPerk('dano_t3'), 'comprou o 3 pulando o 1 e o 2').toBe(false);
    expect(getPurchasedUpgrades()).toEqual([]);
  });

  it('cada degrau do ramo soma ao anterior', () => {
    expect(buyPerk('dano_t1')).toBe(true);
    const comUm = getDamageMultiplier();
    expect(buyPerk('dano_t2')).toBe(true);
    const comDois = getDamageMultiplier();
    expect(buyPerk('dano_t3')).toBe(true);
    // os três degraus valem o mesmo passo: 1 + 0.08 por degrau
    expect(comUm).toBeCloseTo(1.08, 5);
    expect(comDois - comUm).toBeCloseTo(comUm - 1, 5);
    expect(getDamageMultiplier()).toBeCloseTo(comDois + 0.08, 5);
  });

  it('o ramo inteiro soma +40% de dano', () => {
    for (const id of ['dano_t1', 'dano_t2', 'dano_t3', 'dano_t4', 'dano_t5']) buyPerk(id);
    expect(getDamageMultiplier()).toBeCloseTo(1.40, 5);
  });

  it('não deixa comprar o mesmo degrau duas vezes', () => {
    expect(buyPerk('corpo_t1')).toBe(true);
    expect(buyPerk('corpo_t1')).toBe(false);
    expect(getPurchasedUpgrades()).toEqual(['corpo_t1']);
  });

  it('cada ramo é independente: DANO não compra nada em PERNAS', () => {
    buyPerk('dano_t1');
    buyPerk('dano_t2');
    expect(buyPerk('pernas_t1'), 'PERNAS t1 não é degrau seguinte de DANO t2').toBe(true);
    expect(getPurchasedUpgrades()).toEqual(['dano_t1', 'dano_t2', 'pernas_t1']);
  });

  it('a oferta da visita troca o degrau comprado pelo próximo do ramo', () => {
    // A oferta é curadoria, não um catálogo: ela perde o que foi comprado e
    // puxa o próximo degrau do MESMO ramo. Sem isso a run trava no degrau 1
    // quando os 3 sorteados são de outros ramos.
    buyPerk('dano_t1');
    buyPerk('dano_t2');
    expect(getPurchasedUpgrades()).toContain('dano_t2');
    const oferta = getStockPerks();
    expect(oferta, 'a oferta ainda oferece o degrau já comprado').not.toContain('dano_t1');
    expect(oferta, 'a oferta não oferece o mesmo degrau duas vezes').not.toContain('dano_t2');
    // comprar o que não estava na oferta tem de funcionar igual
    expect(buyPerk('dano_t3')).toBe(true);
  });
});

describe('getShopLayout cobre os serviços atuais', () => {
  it('cria um retângulo por serviço, incluindo o Reparo', () => {
    const L = getShopLayout(1280, 720);
    expect(L.services).toHaveLength(SHOP_SERVICES.length);
    expect(SHOP_SERVICES.map(s => s.id)).toContain('repair');
  });
});

describe('fronteiras de localStorage: parse válido ≠ forma válida', () => {
  it('leaderboard corrompido (JSON de objeto) devolve [] em vez de explodir no .map', () => {
    localStorage.setItem('luiz.leaderboard', '{"velho": true}');
    const lb = getLeaderboard();
    expect(Array.isArray(lb)).toBe(true);
    expect(lb).toEqual([]);
  });

  it('save de formato antigo (sem arrays) é descartado limpo, não meia-carga', () => {
    localStorage.setItem('luiz.save', JSON.stringify({ coins: 99 }));
    const save = loadGame();
    expect(save).toBeNull();
    expect(hasSave()).toBe(false);
  });

  it('achievements corrompido (string JSON) não trava o load', () => {
    localStorage.setItem('luiz.achievements', '"texto-solto"');
    loadAchievements();
    expect(ACHIEVEMENTS[0].unlocked).toBe(false);
  });
});
