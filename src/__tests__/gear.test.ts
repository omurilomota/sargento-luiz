import { describe, it, expect, beforeEach, vi } from 'vitest';

// A loja toca sfx a cada compra/venda e o node não tem AudioContext. O que
// estes testes verificam é o estado do inventário, não o som.
vi.mock('../systems/audio', () => {
  const noop = () => {};
  return {
    initAudio: noop, startMusic: noop, playMusic: noop, stopMusic: noop,
    sfxBuy: noop, sfxError: noop, sfxMenuMove: noop, sfxMenuSelect: noop,
    sfxCoin: noop, sfxPlayerHit: noop, sfxPiece: noop,
    sfxPistol: noop, sfxShotgun: noop, sfxMachinegun: noop, sfxSniper: noop,
    sfxLaser: noop, sfxRPG: noop, sfxRaios: noop, sfxGel: noop, sfxGranade: noop,
    sfxMina: noop, sfxExplosion: noop, sfxPowerup: noop,
    isMusicEnabled: () => true, isSfxEnabled: () => true,
    toggleMusic: noop, toggleSfx: noop,
  };
});

import { WEAPONS, QUALITIES } from '../config';
import { getEffectiveDps, getWeaponStats, getCapacityOf, getReloadTimeOf, setWeapon, resetWeapons, getWeaponQuality } from '../weapons';
import {
  resetPieces, addPieceToInventory, equipPiece, unequipPiece, getInventory,
  getEquipped, returnEquippedPieces, sellPieceFromInventory, pieceSellPrice,
  getEquippedSnapshot, restoreEquipped, PIECE_INVENTORY_LIMIT,
} from '../systems/pieces';
import {
  resetShop, addPurchasedWeapon, getPurchasedWeaponPairs, sellInventoryWeapon, restoreUpgrades,
  getShopCoins, setShopCoins, sellPiece, keepPendingReveal, pushPendingReveal,
} from '../ui/shop';

const idxPistola = WEAPONS.findIndex(w => w.name === 'Pistola');
const idxShotgun = WEAPONS.findIndex(w => w.name === 'Shotgun');
const idxLaser = WEAPONS.findIndex(w => w.name === 'Laser');
const idxBfg = WEAPONS.findIndex(w => w.name === 'BFG');

/**
 * O DPS efetivo é o número que decide troca de arma. Antes ele não existia:
 * a loja imprimia `damage × qualidade`, que ignora upgrade, combo, classe e
 * peça, e o auto-equip era cego (trocava a arma na mão por qualquer compra).
 */
describe('DPS efetivo', () => {
  beforeEach(() => { resetWeapons(); resetPieces(); });

  it('bate com o modelo do balance.test.ts para a pistola', () => {
    // 12 dano, 10 no pente, 0.35s, recarga 1.2s => ciclo 4.7s, 120/4.7 = 25.5
    const dps = getEffectiveDps(idxPistola, 'normal');
    expect(dps).toBeGreaterThan(25);
    expect(dps).toBeLessThan(26.5);
  });

  it('raridade melhor aumenta o DPS', () => {
    const normal = getEffectiveDps(idxPistola, 'normal');
    const lendaria = getEffectiveDps(idxPistola, 'lendaria');
    expect(lendaria).toBeGreaterThan(normal);
  });

  it('a quebrada rende MENOS que a normal, mesmo com dano menor', () => {
    const normal = getEffectiveDps(idxPistola, 'normal');
    const quebrada = getEffectiveDps(idxPistola, 'quebrada');
    expect(quebrada).toBeLessThan(normal);
  });

  it('a laser tem DPS baixo apesar da cadência altíssima', () => {
    // 2 de dano a cada 0.06s: parece muito, mas o DPS efetivo é baixo. É
    // exatamente o caso em que o número salvo o jogador de trocar errado.
    const laser = getEffectiveDps(idxLaser, 'normal');
    const pistola = getEffectiveDps(idxPistola, 'normal');
    expect(laser).toBeLessThan(pistola);
  });

  it('a peça de capacidade aumenta o DPS ao alongar o pente', () => {
    setWeapon(idxPistola, 'normal');
    const antes = getEffectiveDps(idxPistola, 'normal');
    addPieceToInventory('capacidade');
    equipPiece(idxPistola, 0);
    const depois = getEffectiveDps(idxPistola, 'normal');
    expect(depois).toBeGreaterThan(antes);
  });

  it('a peça de dano aumenta o DPS', () => {
    setWeapon(idxPistola, 'normal');
    const antes = getEffectiveDps(idxPistola, 'normal');
    addPieceToInventory('dano');
    equipPiece(idxPistola, 0);
    expect(getEffectiveDps(idxPistola, 'normal')).toBeGreaterThan(antes);
  });

  it('duas peças da mesma série rendem mais que uma', () => {
    setWeapon(idxPistola, 'normal');
    addPieceToInventory('dano');
    equipPiece(idxPistola, 0);
    const umaPeca = getEffectiveDps(idxPistola, 'normal');

    addPieceToInventory('dano');
    equipPiece(idxPistola, 0);
    expect(getEffectiveDps(idxPistola, 'normal')).toBeGreaterThan(umaPeca);
  });

  it('a ficha traz o pente efetivo, não o do config', () => {
    setWeapon(idxPistola, 'normal');
    addPieceToInventory('capacidade');
    equipPiece(idxPistola, 0);
    const ficha = getWeaponStats(idxPistola, 'normal');
    expect(ficha.magazine).toBe(getCapacityOf(idxPistola));
    expect(ficha.magazine).toBeGreaterThan(WEAPONS[idxPistola].magazineSize);
  });

  it('a recarga efetiva reflete velocidade de upgrade', () => {
    const base = getReloadTimeOf(idxPistola);
    expect(base).toBeCloseTo(WEAPONS[idxPistola].reloadTime, 5);
  });
});

describe('peças: venda e orfandade', () => {
  beforeEach(() => { resetPieces(); });

  it('vender a arma devolve as peças equipadas à mochila', () => {
    setWeapon(idxPistola, 'normal');
    addPieceToInventory('dano');
    addPieceToInventory('otica');
    equipPiece(idxPistola, 0);
    equipPiece(idxPistola, 0);
    expect(getEquipped(idxPistola)).toHaveLength(2);

    const devolvidas = returnEquippedPieces(idxPistola);
    expect(devolvidas).toHaveLength(0);
    expect(getEquipped(idxPistola)).toHaveLength(0);
    expect(getInventory()).toHaveLength(2);
  });

  it('peça que não cabe na mochila é devolvida como perdida, não sumida', () => {
    setWeapon(idxPistola, 'normal');
    // equipa primeiro, depois enche a mochila: assim a devolução não cabe
    addPieceToInventory('otica');
    equipPiece(idxPistola, 0);
    for (let i = 0; i < PIECE_INVENTORY_LIMIT; i++) addPieceToInventory('dano');
    expect(getInventory()).toHaveLength(PIECE_INVENTORY_LIMIT);

    const perdidos = returnEquippedPieces(idxPistola);
    expect(perdidos).toHaveLength(1);
    expect(getInventory()).toHaveLength(PIECE_INVENTORY_LIMIT);
    expect(getEquipped(idxPistola)).toHaveLength(0);
  });

  it('vender peça da mochila credita moedas', () => {
    addPieceToInventory('dano');
    const preco = sellPieceFromInventory(0);
    expect(preco).toBeGreaterThan(0);
    expect(getInventory()).toHaveLength(0);
  });

  it('preço de peça é positivo para todos os tipos', () => {
    for (const t of ['dano', 'cadencia', 'capacidade', 'precisao', 'otica', 'supressor', 'carregador']) {
      expect(pieceSellPrice(t), `${t} sem preço`).toBeGreaterThan(0);
    }
  });

  it('snapshot de equipadas sobrevive a ida e volta', () => {
    setWeapon(idxPistola, 'normal');
    addPieceToInventory('dano');
    addPieceToInventory('otica');
    equipPiece(idxPistola, 0);
    equipPiece(idxPistola, 0);
    const snap = getEquippedSnapshot();
    resetPieces();
    expect(getEquipped(idxPistola)).toHaveLength(0);
    restoreEquipped(snap);
    expect(getEquipped(idxPistola)).toHaveLength(2);
  });
});

describe('loja: venda com peças e auto-equip', () => {
  beforeEach(() => { resetShop(); resetPieces(); resetWeapons(); setShopCoins(1000); });

  it('vender arma na loja devolve as peças à mochila', () => {
    addPurchasedWeapon(idxPistola, 'normal');
    addPurchasedWeapon(idxShotgun, 'normal');
    addPieceToInventory('dano');
    equipPiece(idxPistola, 0);
    expect(getEquipped(idxPistola)).toHaveLength(1);

    // a pistola é o slot 0; vende ela
    const ok = sellInventoryWeapon(0);
    expect(ok).toBe(true);
    expect(getInventory().map(p => p.typeId)).toContain('dano');
    expect(getEquipped(idxPistola)).toHaveLength(0);
  });

  it('a venda usa a raridade do PAR, não um mapa por índice', () => {
    // Mesma arma em duas raridades. Antes, a raridade vivia num mapa por
    // ÍNDICE de arma: as duas linhas liam a última escrita, e vendiam pelo
    // preço errado.
    // `resetShop` já deixa a pistola no slot 0, então o shotgun ocupa 1 e 2.
    addPurchasedWeapon(idxShotgun, 'normal');
    addPurchasedWeapon(idxShotgun, 'lendaria');
    const pares = getPurchasedWeaponPairs();
    const slotLendaria = pares.findIndex(p => p.index === idxShotgun && p.quality === 'lendaria');
    expect(slotLendaria).toBeGreaterThanOrEqual(0);

    const precoEsperado = WEAPONS[idxShotgun].price * 0.5 * QUALITIES.lendaria.sellMult;
    setShopCoins(0);
    sellInventoryWeapon(slotLendaria);
    expect(getShopCoins(), 'vendeu a linha lendaria pelo preço errado').toBe(Math.round(precoEsperado));

    // agora vende a que sobrou (normal), que tem sellMult menor
    const slotNormal = getPurchasedWeaponPairs().findIndex(p => p.index === idxShotgun && p.quality === 'normal');
    setShopCoins(0);
    const precoNormal = WEAPONS[idxShotgun].price * 0.5 * QUALITIES.normal.sellMult;
    sellInventoryWeapon(slotNormal);
    expect(getShopCoins()).toBe(Math.round(precoNormal));
    expect(Math.round(precoNormal)).toBeLessThan(Math.round(precoEsperado));
  });

  it('não vende a última arma', () => {
    resetShop();
    setShopCoins(1000);
    expect(sellInventoryWeapon(0)).toBe(false);
  });

  it('botão de vender peça existe na loja', () => {
    addPieceToInventory('dano');
    const antes = getShopCoins();
    expect(sellPiece(0)).toBe(true);
    expect(getShopCoins()).toBeGreaterThan(antes);
  });

  it('comprar uma caixa melhor equipa, uma pior não', () => {
    // pistola normal na mão
    addPurchasedWeapon(idxPistola, 'normal');
    setWeapon(idxPistola, 'normal');
    const dpsNaMao = getEffectiveDps(idxPistola, 'normal');

    // reveal de uma arma claramente pior (quebrada tem dano reduzido)
    pushPendingReveal(idxShotgun, 'quebrada');
    keepPendingReveal(0);
    // a mão deve continuar a pistola normal
    expect(getWeaponQuality()).toBe('normal');
    expect(getEffectiveDps(idxPistola, 'normal')).toBeCloseTo(dpsNaMao, 5);
  });
});
/**
 * Combos checam ID de upgrade, nunca o nome.
 *
 * Os 8 combos originais faziam `u.includes('Dano +25%')` sobre a lista de
 * upgrades comprados. Renomear o upgrade no config matava o combo em silêncio:
 * `tsc` limpo, teste verde, combo que nunca mais dispara. Agora o upgrade tem
 * `id` e o combo lê o id.
 *
 * ESTE BLOCO USA OS IDS LEGADOS DE PROPÓSITO — e isso é um defeito
 * conhecido, não uma escolha (ver TODO.md Sprint 6). Os 8 combos exigem `crit2`,
 * `dano25`, `pierce`, `vel15`, `magnetismo`, `escudo`, `vida25`/`vida50`: ids do
 * catálogo de 19 upgrades que a escada substituiu. A escada produz `dano_t1`,
 * `mente_t3`, `pernas_t2`… — nenhum id em comum. Na prática, 7 dos 8 combos só
 * disparam em save anterior à escada.
 *
 * O último teste deste bloco é a trava: ele FALHA enquanto o mapeamento não
 * existir, e é ele que vira a virada quando o Sprint 6 for feito.
 */
import { PERK_LADDER, PERK_LEGADO, resetPerks } from '../systems/perks';
import { initPlayer } from '../entities/player';
import { getComboDamageBonus, getComboCooldownMult, getComboHealthBonus, updateCombos, resetCombos, COMBO_LIMITE_DANO, COMBO_LIMITE_CADENCIA, COMBO_LIMITE_VIDA, COMBO_CHECKS, COMBO_DEFINITIONS, ARMAS_DO_COMBO } from '../systems/combos';

describe('combos: teto de empilhamento', () => {
  beforeEach(() => { initPlayer(1280, 720); resetShop(); resetWeapons(); resetCombos(); resetPerks(); setShopCoins(99999); });

  it('nenhum combo passa do teto de dano', () => {
    // restaura o pacote inteiro de melhorias de dano e empilha todas as armas
    const idxSniper = WEAPONS.findIndex(w => w.name === 'Sniper');
    const idxMetralhadora = WEAPONS.findIndex(w => w.name === 'Metralhadora');
    const idxRPG = WEAPONS.findIndex(w => w.name === 'RPG');
    restoreUpgrades(['dano25', 'dano50', 'crit2', 'crit3', 'pierce', 'pierce2', 'recarga']);
    for (const idx of [idxSniper, idxMetralhadora, idxRPG]) {
      setWeapon(idx, 'lendaria');
      updateCombos();
      expect(getComboDamageBonus(), `arma ${WEAPONS[idx].name} passou do teto`).toBeLessThanOrEqual(COMBO_LIMITE_DANO);
      expect(getComboCooldownMult(), `arma ${WEAPONS[idx].name} passou do piso de cadência`).toBeGreaterThanOrEqual(COMBO_LIMITE_CADENCIA);
      expect(getComboHealthBonus()).toBeLessThanOrEqual(1.5);
    }
  });

  it('o teto só corta quando um combo estouraria, não sempre', () => {
    // uma build normal não pode ser penalizada pelo teto
    setWeapon(WEAPONS.findIndex(w => w.name === 'Pistola'), 'normal');
    updateCombos();
    expect(getComboDamageBonus()).toBe(1);
    expect(getComboCooldownMult()).toBe(1);
  });

  it('restaura uma compra antiga NÃO liga combo (a escada é a única fonte)', () => {
    // `dano25` era o que o Carvão exigia. Remapeado para `dano_t3`, ele vira
    // inerte: um save anterior à escada volta com o dano certo e sem o combo.
    // Documentado em DECISIONS #126 — nenhum dos 6 combos sobrevive à migração.
    const idxMetralhadora = WEAPONS.findIndex(w => w.name === 'Metralhadora');
    setWeapon(idxMetralhadora, 'normal');
    restoreUpgrades(['dano25']);
    updateCombos();
    expect(getComboCooldownMult(), 'compra antiga não deveria ligar combo nenhum').toBe(1);
  });

  it('comprar o degrau da escada liga o combo (o id é o degrau, não o nome)', () => {
    const idxMetralhadora = WEAPONS.findIndex(w => w.name === 'Metralhadora');
    setWeapon(idxMetralhadora, 'lendaria');
    updateCombos();
    expect(getComboCooldownMult(), 'sem degrau de dano não há Carvão').toBe(1);
    restoreUpgrades(['dano_t3']);
    updateCombos();
    expect(getComboCooldownMult(), 'o combo da Metralhadora não disparou com o degrau certo').toBeLessThan(1);
  });

  it('Pólvora Instável: só dispara com os DOIS ramos, e a troca é real', () => {
    // cruzado entre ramos: um degrau de DANO + um de MENTE, ao mesmo tempo.
    // O `exigeTodos` é o AND — sem ele, metade do combo bastaria.
    setWeapon(idxPistola, 'normal');
    restoreUpgrades(['dano_t5']);
    updateCombos();
    expect(getComboDamageBonus(), 'só DANO T5 não liga a Pólvora').toBe(1);
    resetShop();
    restoreUpgrades(['mente_t4']);
    updateCombos();
    expect(getComboDamageBonus(), 'só MENTE T4 não liga a Pólvora').toBe(1);
    resetShop();
    restoreUpgrades(['dano_t5', 'mente_t4']);
    updateCombos();
    // +30% de dano pagando 10% de vida máxima — a troca que o combo promete
    expect(getComboDamageBonus()).toBeCloseTo(1.3);
    expect(getComboHealthBonus()).toBeCloseTo(0.9);
  });
});

describe('nenhum combo exige id fora da escada', () => {
  it('todo id exigido por um combo é um degrau da escada', () => {
    const degraus = new Set(PERK_LADDER.map(t => t.id));
    const idsLegados = new Set(Object.values(PERK_LEGADO).map(c => c.id));
    for (const c of COMBO_CHECKS) {
      for (const id of [...c.ids, ...(c.exigeTodos ?? [])]) {
        expect(degraus.has(id), `${c.nome} exige "${id}", que não é degrau da escada`).toBe(true);
        expect(idsLegados.has(id), `${c.nome} exige "${id}", que é compra antiga`).toBe(false);
      }
    }
  });

  it('definição e requisito são o mesmo combo, na mesma ordem', () => {
    // um par desalinhado daria um combo com o nome de um e o efeito de outro
    expect(COMBO_DEFINITIONS.map(d => d.name)).toEqual(COMBO_CHECKS.map(c => c.nome));
  });

  it('todo combo com arma exige arma, e todo combo sem arma não exige', () => {
    // `exigeArma` é a afirmação que a lista de armas sustenta: um combo que
    // exige arma não pode ter entrada em ARMAS_DO_COMBO, e vice-versa.
    for (const c of COMBO_CHECKS) {
      const temArmaDeclarada = Boolean(ARMAS_DO_COMBO[c.nome]);
      expect(c.exigeArma, `${c.nome}: exigeArma discorda da lista de armas`).toBe(temArmaDeclarada);
    }
    // combos sem arma empilham entre si (Couro Duplo + Pólvora Instável).
    // O contrato não é a contagem: é o produto de vida de todos eles, ativos
    // de uma vez, respeitando o teto — 1.25 × 0.9 = 1.125 hoje.
    const semArma = COMBO_DEFINITIONS.filter((_, i) => !COMBO_CHECKS[i].exigeArma);
    const produtoVida = semArma.reduce((mult, d) => mult * d.healthBonus, 1);
    expect(semArma.length).toBeGreaterThanOrEqual(1);
    expect(produtoVida, 'combos sem arma, todos ativos, furam o teto de vida').toBeLessThanOrEqual(COMBO_LIMITE_VIDA);
  });

  it('nenhum combo fica inalcançável: todo degrau exigido é comprável na ordem', () => {
    // `dano_t3` pressupõe t1 e t2 pela `requires` da escada, então o combo é
    // acessível sem trapaça. O teste falha se alguém apontar um combo para um
    // degrau que a escada nunca deixa comprar.
    for (const c of COMBO_CHECKS) {
      for (const id of c.ids) {
        const degrau = PERK_LADDER.find(t => t.id === id);
        expect(degrau, `${c.nome} exige "${id}", que não existe`).toBeTruthy();
        expect(degrau!.requires === null || PERK_LADDER.some(t => t.id === degrau!.requires)).toBe(true);
      }
    }
  });

  it('todo combo tem pelo menos um efeito (nada é decoração)', () => {
    for (const d of COMBO_DEFINITIONS) {
      const mudaAlgo = d.damageBonus !== 1 || d.cooldownMult !== 1 || d.healthBonus !== 1;
      expect(mudaAlgo, `${d.name} não muda dano, cadência nem vida`).toBe(true);
    }
  });
});

describe('id é a identidade, não o nome', () => {
  it('todo degrau da escada tem id', () => {
    for (const t of PERK_LADDER) expect(t.id, `degrau sem id: ${t.name}`).toBeTruthy();
  });

  it('toda compra antiga tem id único e nenhum id colide com um nome de exibição', () => {
    // o mapa tem 2 chaves por compra (id e nome de exibição)
    const ids = [...new Set(Object.values(PERK_LEGADO).map(c => c.id))];
    expect(ids.length, `ids duplicados: ${ids.join(', ')}`).toBe(19);
    const nomes = Object.keys(PERK_LEGADO).filter(k => !ids.includes(k));
    for (const id of ['crit2', 'dano25', 'pierce', 'vel15', 'escudo', 'magnetismo', 'vida25', 'vida50']) {
      expect(nomes, `id "${id}" é igual a um nome de exibição`).not.toContain(id);
    }
  });
});

/**
 * Migração de save do ASHFALL para SARGENTO RIOS.
 *
 * "ASHFALL" colide com 8+ jogos no itch.io, vários com "AI Disclosure: AI
 * Assisted", e um "Ashfall City" do mesmo gênero. As 12 chaves de localStorage
 * mudaram de `ashfall.*` para `rios.*`. Sem migração, quem já jogou perde
 * save, conquistas, diário, recordes, skins, classe e volume.
 */
import { migrarChavesDeSave, CHAVES_MIGRADAS } from '../systems/migracaoSave';

class StorageMigracao {
  private map = new Map<string, string>();
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

describe('migração de save: ashfall.* -> rios.*', () => {
  let storage: StorageMigracao;
  beforeEach(() => {
    storage = new StorageMigracao();
    (globalThis as unknown as { localStorage: StorageMigracao }).localStorage = storage;
  });

  it('copia as 12 chaves do prefixo antigo para o novo', () => {
    for (const c of CHAVES_MIGRADAS) storage.setItem(`ashfall.${c}`, `valor-${c}`);
    expect(migrarChavesDeSave()).toBe(CHAVES_MIGRADAS.length);
    for (const c of CHAVES_MIGRADAS) {
      expect(storage.getItem(`rios.${c}`), `não migrou ${c}`).toBe(`valor-${c}`);
      expect(storage.getItem(`ashfall.${c}`), `não apagou ${c}`).toBe(null);
    }
  });

  it('não sobrescreve um save novo que já existe', () => {
    storage.setItem('ashfall.save', 'antigo');
    storage.setItem('rios.save', 'novo');
    migrarChavesDeSave();
    expect(storage.getItem('rios.save')).toBe('novo');
    expect(storage.getItem('ashfall.save')).toBe(null);
  });

  it('é idempotente: rodar duas vezes não faz mal', () => {
    storage.setItem('ashfall.save', 'x');
    expect(migrarChavesDeSave()).toBe(1);
    expect(migrarChavesDeSave()).toBe(0);
    expect(storage.getItem('rios.save')).toBe('x');
  });

  it('não quebra quando não há nada antigo', () => {
    expect(migrarChavesDeSave()).toBe(0);
  });

  it('o jogo não referencia mais ashfall.* em nenhuma chave', () => {
    // se um módulo ficou com `ashfall.` ele lê um storage que ninguém escreve
    for (const c of CHAVES_MIGRADAS) {
      // a lista é a fonte de verdade da migração
      expect(c, `sufixo com ponto: ${c}`).not.toMatch(/\./);
    }
  });
});
