import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resetWeapons, addPierce, getPierceCount, addCrit, getDamageMultiplier,
  repairCurrentWeapon, isJammed, getJamTimer, shoot, setWeapon, getCurrentAmmo,
  setWeaponQuality, canShoot, useAmmo, startReload, updateReload,
} from '../weapons';
import { initPlayer, resetPlayerProgress, useMedkit, addMedkits, getMedkits, getPlayer, addArmor, getArmorLevel, enemyCollisionDamage } from '../entities/player';
import { WEAPONS, QUALITIES, rollQuality } from '../config';

vi.mock('../systems/audio', () => {
  const noop = () => {};
  return { initAudio: noop, sfxPistol: noop, sfxBuy: noop, sfxError: noop };
});

/**
 * Balanceamento do plano anterior: pierce era somado sem teto, o crítico
 * multiplicava por 2 sem teto de chance, e o tiro perfurante não custava nada.
 * Empilhar "Pierce Duplo" com o BFG dava tiro que atravessava a tela inteira
 * sem perder força.
 */
describe('pierce tem teto e custo', () => {
  beforeEach(() => resetWeapons());

  it('addPierce nunca passa de 3 cargas', () => {
    addPierce(1);
    addPierce(2);
    expect(getPierceCount()).toBe(3);
    addPierce(5);
    expect(getPierceCount()).toBe(3);
  });

  it('tiro perfurante perde 25% do dano', () => {
    setWeapon(WEAPONS.findIndex(w => w.name === 'Metralhadora'));
    const semPierce = shoot(0, 0, 0, false)[0];
    addPierce(1);
    const comPierce = shoot(0, 0, 0, false)[0];
    expect(comPierce.pierce).toBe(true);
    expect(comPierce.damage).toBeCloseTo(semPierce.damage * 0.75, 5);
  });

  it('arma com pierce nativo também paga o custo', () => {
    setWeapon(WEAPONS.findIndex(w => w.name === 'Sniper'));
    const b = shoot(0, 0, 0, false)[0];
    expect(b.pierce).toBe(true);
    expect(b.damage).toBeCloseTo(50 * 0.75, 5);
  });
});

describe('crítico é ×1.5 com chance limitada a 60%', () => {
  beforeEach(() => {
    resetWeapons();
    initPlayer(1280, 720);
  });

  it('o multiplicador é 1.5, não 2', () => {
    setWeapon(WEAPONS.findIndex(w => w.name === 'Pistola'));
    addCrit(1);
    let critShot: number | null = null;
    let normalShot: number | null = null;
    for (let i = 0; i < 400; i++) {
      const b = shoot(0, 0, 0, false)[0];
      if (b.isCrit && critShot === null) critShot = b.damage;
      else if (!b.isCrit && normalShot === null) normalShot = b.damage;
    }
    expect(critShot).not.toBeNull();
    expect(normalShot).not.toBeNull();
    expect(critShot! / normalShot!).toBeCloseTo(1.5, 2);
  });

  it('a chance efetiva nunca passa de 60% mesmo com crit altíssimo', () => {
    setWeapon(WEAPONS.findIndex(w => w.name === 'Pistola'));
    addCrit(0.4);
    addCrit(0.4);
    addCrit(0.4);
    let crits = 0;
    const N = 3000;
    for (let i = 0; i < N; i++) {
      if (shoot(0, 0, 0, false)[0].isCrit) crits++;
      if (getCurrentAmmo() <= 0) useAmmo();
    }
    expect(crits / N).toBeLessThan(0.7);
  });
});

describe('qualidade da arma e o conserto do jam', () => {
  beforeEach(() => {
    resetWeapons();
    initPlayer(1280, 720);
  });

  it('toda qualidade tem damageMult, failChance e color', () => {
    for (const [k, q] of Object.entries(QUALITIES)) {
      expect(typeof q.damageMult, k).toBe('number');
      expect(typeof q.failChance, k).toBe('number');
      expect(typeof q.color, k).toBe('string');
      expect(q.damageMult).toBeGreaterThan(0);
    }
  });

  it('Quebrada derruba o dano pela metade e pode falhar o disparo', () => {
    const idx = WEAPONS.findIndex(w => w.name === 'Metralhadora');
    setWeapon(idx);
    setWeapon(idx, 'normal');
    const bom = shoot(0, 0, 0, false)[0];
    setWeaponQuality('quebrada');
    let falhou = false;
    let danoQuebrado: number | null = null;
    for (let i = 0; i < 200; i++) {
      const r = shoot(0, 0, 0, false);
      if (r.length === 0) { falhou = true; continue; }
      if (danoQuebrado === null) danoQuebrado = r[0].damage;
    }
    expect(falhou).toBe(true);
    expect(danoQuebrado!).toBeCloseTo(bom.damage * 0.5, 5);
  });

  it('rollQuality devolve sempre uma chave que existe em QUALITIES', () => {
    for (let i = 0; i < 300; i++) {
      const q = rollQuality(2);
      expect(QUALITIES[q], `qualidade inválida: ${q}`).toBeDefined();
    }
  });

  it('a arma quebrada encasquilha depois de N disparos e o Reparo limpa', () => {
    const idx = WEAPONS.findIndex(w => w.broken);
    expect(idx, 'nenhuma arma com broken: true no config').toBeGreaterThanOrEqual(0);
    setWeapon(idx);
    setWeapon(idx, 'normal');

    // o pente tem 30 e o jam chega em 35: precisa recarregar no meio. Cuidado
    // para não chamar updateReload depois de encasquilhar, porque o próprio
    // reload conserta o jam e o teste passaria sem nunca ter visto o estado.
    for (let i = 0; i < 60 && !isJammed(); i++) {
      if (getCurrentAmmo() <= 0) {
        startReload();
        updateReload(5);
      }
      if (canShoot()) shoot(0, 0, 0, false);
    }
    expect(isJammed()).toBe(true);
    expect(getJamTimer()).toBeGreaterThan(0);
    expect(canShoot()).toBe(false);

    repairCurrentWeapon();
    expect(isJammed()).toBe(false);
    expect(getJamTimer()).toBe(0);
    expect(canShoot()).toBe(true);
  });
});

describe('medkit: usa com H, respeita vida cheia e não vira negativo', () => {
  beforeEach(() => {
    initPlayer(1280, 720);
    resetPlayerProgress();
  });

  it('não gasta medkit com a vida cheia', () => {
    addMedkits(2);
    useMedkit();
    expect(getMedkits()).toBe(2);
    expect(getPlayer().health).toBe(getPlayer().maxHealth);
  });

  it('não gasta medkit quando não tem nenhum', () => {
    const p = getPlayer();
    p.health = 10;
    useMedkit();
    expect(getMedkits()).toBe(0);
    expect(p.health).toBe(10);
  });

  it('cura 50 de vida e consome 1', () => {
    const p = getPlayer();
    p.health = 10;
    addMedkits(1);
    useMedkit();
    expect(getMedkits()).toBe(0);
    expect(p.health).toBe(60);
  });

  it('nunca passa da vida máxima', () => {
    const p = getPlayer();
    p.health = p.maxHealth - 10;
    addMedkits(1);
    useMedkit();
    expect(p.health).toBe(p.maxHealth);
  });

  it('o inventário de medkits é limitado a 9', () => {
    addMedkits(30);
    expect(getMedkits()).toBe(9);
  });

  it('resetPlayerProgress zera os medkits', () => {
    addMedkits(3);
    resetPlayerProgress();
    expect(getMedkits()).toBe(0);
  });
});

describe('armadura absorve dano de colisão sem zerar', () => {
  beforeEach(() => {
    initPlayer(1280, 720);
    resetPlayerProgress();
  });

  it('50% de armadura corta o dano pela metade', () => {
    const p = getPlayer();
    addArmor(0.5);
    expect(getArmorLevel()).toBeCloseTo(0.5, 5);
    const antes = p.health;
    enemyCollisionDamage(20);
    expect(antes - p.health).toBe(10);
  });

  it('armadura tem teto de 50%', () => {
    addArmor(0.9);
    expect(getArmorLevel()).toBeCloseTo(0.5, 5);
  });

  it('o dano nunca chega a zero por armadura', () => {
    const p = getPlayer();
    addArmor(0.5);
    const antes = p.health;
    enemyCollisionDamage(1);
    expect(antes - p.health).toBeGreaterThanOrEqual(1);
  });
});
