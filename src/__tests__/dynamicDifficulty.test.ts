import { describe, it, expect, beforeEach } from 'vitest';
import { registerShot, registerHit, resetBehavior, getSkillPressure, getPlayerAccuracy, getPlayerTendency, updateBehavior } from '../systems/dynamicDifficulty';
import { resetSpawner, spawnWaveEnemies } from '../systems/spawner';
import { WAVE_BASE_SPAWN_RATE } from '../core/constants';
import { Enemy } from '../types';

describe('dynamicDifficulty: a pressão só vale com amostra suficiente', () => {
  beforeEach(() => resetBehavior());

  it('não diz nada nos primeiros tiros (amostra é ruído)', () => {
    for (let i = 0; i < 19; i++) registerShot();
    expect(getSkillPressure()).toBeNull();
    registerShot();
    expect(getSkillPressure()).not.toBeNull();
  });

  it('quem nunca acerta tem pressão 0 e quem acerta tudo tem 1', () => {
    for (let i = 0; i < 40; i++) registerShot();
    expect(getPlayerAccuracy()).toBe(0);
    expect(getSkillPressure()).toBe(0);

    resetBehavior();
    for (let i = 0; i < 40; i++) { registerShot(); registerHit(); }
    expect(getSkillPressure()).toBe(1);
  });

  it('a pressão fica dentro de 0..1 mesmo com acerto impossível', () => {
    resetBehavior();
    for (let i = 0; i < 60; i++) { registerShot(); if (i % 3 === 0) registerHit(); }
    const p = getSkillPressure();
    expect(p).not.toBeNull();
    expect(p!).toBeGreaterThanOrEqual(0);
    expect(p!).toBeLessThanOrEqual(1);
  });

  it('resetBehavior limpa a amostra', () => {
    for (let i = 0; i < 40; i++) { registerShot(); registerHit(); }
    expect(getSkillPressure()).toBe(1);
    resetBehavior();
    expect(getSkillPressure()).toBeNull();
  });

  it('a tendência de posição continua sendo prevista (o que já funcionava)', () => {
    updateBehavior(100, 100, 5);
    for (let i = 0; i < 20; i++) updateBehavior(100 + i * 30, 100, 5);
    expect(getPlayerTendency().h).toBeGreaterThan(0);
  });
});

describe('spawner: a acurácia muda o ritmo da onda, não os stats', () => {
  beforeEach(() => { resetBehavior(); resetSpawner(); });

  /** Roda o relógio até o primeiro inimigo nascer e devolve quanto dt levou. */
  function intervaloAteProximoSpawn(): number {
    resetSpawner();
    const enemies: Enemy[] = [];
    let dt = 0;
    for (let i = 0; i < 4000; i++) {
      spawnWaveEnemies(1 / 240, enemies, 0, ['grunt'], 1920, 1280);
      dt += 1 / 240;
      if (enemies.length > 0) return dt;
    }
    return -1;
  }

  it('quem erra muito tem o intervalo de spawn inteiro', () => {
    for (let i = 0; i < 40; i++) registerShot();
    const devagar = intervaloAteProximoSpawn();
    expect(devagar).toBeGreaterThan(0);
    expect(devagar).toBeCloseTo(WAVE_BASE_SPAWN_RATE, 1);
  });

  it('quem acerta tudo tem a onda mais densa, dentro da banda de 12%', () => {
    for (let i = 0; i < 40; i++) { registerShot(); registerHit(); }
    const rapido = intervaloAteProximoSpawn();
    const esperado = WAVE_BASE_SPAWN_RATE * 0.88;
    expect(rapido).toBeGreaterThan(0);
    expect(rapido).toBeCloseTo(esperado, 1);
  });
});