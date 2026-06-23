import { Enemy } from '../types';
import { ENEMY_TYPES, PHASES } from '../config';
import { rand } from '../utils';
import { WAVE_BASE_ENEMIES, WAVE_ENEMIES_PER_LEVEL, WAVE_BASE_SPAWN_RATE, WAVE_SPAWN_RATE_DECAY, WAVE_MIN_SPAWN_RATE, WAVE_SCALE_PER_LEVEL } from '../core/constants';

let waveTimer = 0;
let enemiesSpawnedThisWave = 0;

export function getWaveTimer(): number { return waveTimer; }
export function getEnemiesSpawned(): number { return enemiesSpawnedThisWave; }

export function resetSpawner(): void {
  waveTimer = 0;
  enemiesSpawnedThisWave = 0;
}

export function spawnEnemy(type: string, canvasWidth: number, canvasHeight: number, currentWave: number): Enemy | null {
  const def = ENEMY_TYPES[type];
  if (!def) return null;

  let x = 0, y = 0;
  const side = Math.floor(rand(0, 4));
  if (side === 0) { x = -40; y = rand(0, canvasHeight); }
  else if (side === 1) { x = canvasWidth + 40; y = rand(0, canvasHeight); }
  else if (side === 2) { x = rand(0, canvasWidth); y = -40; }
  else { x = rand(0, canvasWidth); y = canvasHeight + 40; }

  const waveScale = 1 + currentWave * WAVE_SCALE_PER_LEVEL;

  return {
    x, y, radius: def.radius, speed: def.speed + rand(-10, 10),
    health: Math.floor(def.health * waveScale), maxHealth: Math.floor(def.health * waveScale),
    damage: Math.floor(def.damage * waveScale), color: def.color, scoreValue: def.scoreValue,
    shootTimer: rand(0, def.shootRate || 0), shootRate: def.shootRate || 0,
    canShoot: def.canShoot || false, type, angle: rand(0, Math.PI * 2),
    attackTimer: 0, summonTimer: 0,
  };
}

export function spawnWaveEnemies(
  dt: number,
  enemies: Enemy[],
  currentWave: number,
  currentPhaseEnemyTypes: string[],
  canvasWidth: number,
  canvasHeight: number
): boolean {
  waveTimer += dt;
  const totalEnemies = WAVE_BASE_ENEMIES + currentWave * WAVE_ENEMIES_PER_LEVEL;
  const spawnRate = Math.max(WAVE_MIN_SPAWN_RATE, WAVE_BASE_SPAWN_RATE - currentWave * WAVE_SPAWN_RATE_DECAY);

  if (waveTimer >= spawnRate && enemiesSpawnedThisWave < totalEnemies) {
    waveTimer = 0;
    const type = currentPhaseEnemyTypes[Math.floor(rand(0, currentPhaseEnemyTypes.length))];
    const enemy = spawnEnemy(type, canvasWidth, canvasHeight, currentWave);
    if (enemy) enemies.push(enemy);
    enemiesSpawnedThisWave++;
  }

  if (enemiesSpawnedThisWave >= totalEnemies && enemies.length === 0) {
    enemiesSpawnedThisWave = 0;
    waveTimer = 0;
    return true;
  }
  return false;
}
