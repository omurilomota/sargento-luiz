import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../systems/audio', () => ({ sfxEnemyShoot: () => {}, sfxSpit: () => {} }));

import { updateBoss, clearBossState, getBossPull, setBossRandom } from '../systems/boss';
import { spawnEnemy } from '../systems/spawner';
import { getBullets, clearBullets } from '../entities/bullet';
import { clearPuddles, getPuddles } from '../systems/puddles';
import { clearFires, getFires } from '../systems/explosions';
import { ENEMY_TYPES } from '../config';
import { BIOMES } from '../maps';
import { loadMap } from '../systems/tilemap';
import { Enemy } from '../types';

const W = 1920;
const H = 1280;

function chefe(chave: string): Enemy {
  const e = spawnEnemy(chave, W, H, 0, 1000, 640)!;
  e.spawnDelay = 0;
  e.health = e.maxHealth; // sem fúria: queremos testar a assinatura, não o rage
  return e;
}

/** Roda frames até o predicado ver o efeito ou o tempo acabar. */
function ateEfeito(e: Enemy, viu: () => boolean): boolean {
  for (let i = 0; i < 9 * 60; i++) {
    updateBoss(e, 1100, 640, W, H, 1 / 60);
    if (viu()) return true;
  }
  return false;
}

describe('bosses híbridos: assinatura própria nos cinco chefes', () => {
  beforeEach(() => {
    clearBullets();
    clearPuddles();
    clearFires();
    setBossRandom(() => 0.5);
    loadMap(BIOMES.cidade.rows);
  });

  it('VIGIA chama reforços', () => {
    const e = chefe('vigia');
    let minions = 0;
    for (let i = 0; i < 9 * 60; i++) minions += updateBoss(e, 1100, 640, W, H, 1 / 60).length;
    expect(minions).toBeGreaterThan(0);
    clearBossState(e);
  });

  it('CRYSTAL QUEEN solta anel de lascas', () => {
    const e = chefe('crystalQueen');
    expect(ateEfeito(e, () => getBullets().length >= 8)).toBe(true);
    clearBossState(e);
  });

  it('LEVIATHAN deixa poças de lama', () => {
    const e = chefe('leviathan');
    expect(ateEfeito(e, () => getPuddles().length >= 3)).toBe(true);
    clearBossState(e);
  });

  it('INFERNO PRIME acende focos de fogo', () => {
    const e = chefe('infernoPrime');
    expect(ateEfeito(e, () => getFires().length >= 3)).toBe(true);
    clearBossState(e);
  });

  it('NÚCLEO puxa o jogador com o pulso', () => {
    const e = chefe('nucleo');
    expect(ateEfeito(e, () => getBossPull(e).forca > 0)).toBe(true);
    clearBossState(e);
  });

  it('os outros 14 chefes não ganham assinatura — só a fúria', () => {
    const assinados = ['vigia', 'crystalQueen', 'leviathan', 'infernoPrime', 'nucleo'];
    const todos = Object.entries(ENEMY_TYPES).filter(([, d]) => d.isBoss).map(([k]) => k);
    expect(todos.length).toBeGreaterThan(15);
    expect(todos.filter(k => !assinados.includes(k)).length).toBe(todos.length - 5);
  });
});
