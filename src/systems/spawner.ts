/**
 * src/systems/spawner.ts
 *
 * Controle de ondas e criação de inimigos.
 *
 * Com mapa maior que a tela, o spawn não pode ser "fora do canvas": tem que
 * ser numa célula de chão aberta, fora do viewport e longe do jogador — senão
 * o inimigo nasce em cima dele.
 */

import { Enemy } from '../types';
import { ENEMY_TYPES } from '../config';
import { rand } from '../utils';
import { MAX_ENEMIES, WAVE_BASE_ENEMIES, WAVE_ENEMIES_PER_LEVEL, WAVE_BASE_SPAWN_RATE, WAVE_SPAWN_RATE_DECAY, WAVE_MIN_SPAWN_RATE, WAVE_SCALE_PER_LEVEL, WAVE_SPEED_SCALE_PER_LEVEL } from '../core/constants';
import { CELL_SIZE } from '../maps';
import { getMap, isWall } from './tilemap';
import { getSkillPressure } from './dynamicDifficulty';

/** Temporizador acumulado desde o último spawn */
let waveTimer = 0;
/** Quantidade de inimigos já criados na onda atual */
let enemiesSpawnedThisWave = 0;

/** Retorna o temporizador atual de spawn da onda. */
export function getWaveTimer(): number { return waveTimer; }

/** Retorna quantos inimigos foram gerados na onda atual. */
export function getEnemiesSpawned(): number { return enemiesSpawnedThisWave; }

/** Reseta o temporizador e contador de inimigos da onda. */
export function resetSpawner(): void {
  waveTimer = 0;
  enemiesSpawnedThisWave = 0;
}

/** Distância mínima do jogador para spawnar (px) */
const MIN_SPAWN_DISTANCE = 260;

interface SpawnRect {
  w: number;
  h: number;
  px: number;
  py: number;
  viewW: number;
  viewH: number;
}

/**
 * Sorteia uma posição válida de spawn.
 * Sem mapa, cai no retângulo da tela (fallback). Com mapa, exige célula de
 * chão fora do viewport e a uma distância mínima do jogador.
 */
function pickSpawnPosition(rect: SpawnRect): { x: number; y: number } {
  const map = getMap();
  if (!map) {
    const side = Math.floor(rand(0, 4));
    const d = 120;
    if (side === 0) return { x: -d, y: rand(0, rect.h) };
    if (side === 1) return { x: rect.w + d, y: rand(0, rect.h) };
    if (side === 2) return { x: rand(0, rect.w), y: -d };
    return { x: rand(0, rect.w), y: rect.h + d };
  }

  const cols = map.cols;
  const rows = map.rows;
  for (let attempt = 0; attempt < 40; attempt++) {
    const col = Math.floor(rand(0, cols));
    const row = Math.floor(rand(0, rows));
    if (isWall(col, row)) continue;
    const x = col * CELL_SIZE + CELL_SIZE / 2;
    const y = row * CELL_SIZE + CELL_SIZE / 2;
    const onScreen = x > rect.px - 48 && x < rect.px + rect.viewW + 48
      && y > rect.py - 48 && y < rect.py + rect.viewH + 48;
    if (onScreen) continue;
    if (Math.hypot(x - rect.px, y - rect.py) < MIN_SPAWN_DISTANCE) continue;
    return { x, y };
  }
  // fallback: qualquer célula de chão
  return { x: map.width / 2, y: map.height / 2 };
}

/**
 * Cria um inimigo de um tipo específico.
 * @param type - chave do tipo de inimigo no ENEMY_TYPES
 * @param worldWidth - largura do mundo
 * @param worldHeight - altura do mundo
 * @param currentWave - número da onda (escala de dificuldade)
 * @param forceX - X forçado (boss, invocação)
 * @param forceY - Y forçado
 * @param rect - viewport do jogador (usado para escolher posição de spawn)
 */
export function spawnEnemy(
  type: string,
  worldWidth: number,
  worldHeight: number,
  currentWave: number,
  forceX?: number,
  forceY?: number,
  rect?: SpawnRect
): Enemy | null {
  const def = ENEMY_TYPES[type];
  if (!def) return null;

  const pos = forceX !== undefined && forceY !== undefined
    ? { x: forceX, y: forceY }
    : pickSpawnPosition(rect ?? { w: worldWidth, h: worldHeight, px: 0, py: 0, viewW: worldWidth, viewH: worldHeight });

  const waveScale = 1 + currentWave * WAVE_SCALE_PER_LEVEL;
  const speedScale = 1 + currentWave * WAVE_SPEED_SCALE_PER_LEVEL;
  const variance = 0.9 + Math.random() * 0.2;

  return {
    x: pos.x, y: pos.y, radius: def.radius, speed: Math.floor(def.speed * speedScale * variance),
    health: Math.floor(def.health * waveScale * variance), maxHealth: Math.floor(def.health * waveScale * variance),
    damage: Math.floor(def.damage * waveScale), color: def.color, scoreValue: def.scoreValue,
    shootTimer: rand(0, def.shootRate || 0), shootRate: def.shootRate || 0,
    canShoot: def.canShoot || false, type, angle: rand(0, Math.PI * 2),
    attackTimer: 0, summonTimer: 0, spawnDelay: 0.5, hitFlash: 0, bossPhase: 0,
  };
}

/**
 * Atualiza o sistema de ondas.
 * @param dt - delta time em segundos
 * @param enemies - array de inimigos ativos (modificado diretamente)
 * @param currentWave - número da onda atual
 * @param currentPhaseEnemyTypes - tipos de inimigos disponíveis na fase atual
 * @param worldWidth - largura do mundo
 * @param worldHeight - altura do mundo
 * @param rect - viewport do jogador
 * @returns true quando a onda está completa (todos spawnados e derrotados)
 */
export function spawnWaveEnemies(
  dt: number,
  enemies: Enemy[],
  currentWave: number,
  currentPhaseEnemyTypes: string[],
  worldWidth: number,
  worldHeight: number,
  rect?: SpawnRect
): boolean {
  waveTimer += dt;
  const totalEnemies = WAVE_BASE_ENEMIES + currentWave * WAVE_ENEMIES_PER_LEVEL;
  const spawnRate = Math.max(WAVE_MIN_SPAWN_RATE, WAVE_BASE_SPAWN_RATE - currentWave * WAVE_SPAWN_RATE_DECAY);

  // Dinâmica de dificuldade pela acurácia: quem acerta muito sofre ondas mais
  // densas. A banda é estreita de propósito (12% no intervalo de spawn) — o
  // suficiente para o jogo sentir o jogador, sem virar um modo fácil/duro
  // escondido. Antes de 20 tiros não mexe em nada, porque a amostra é ruído.
  const pressure = getSkillPressure();
  const pressureMult = pressure === null ? 1 : 1 - pressure * 0.12;

  if (waveTimer >= spawnRate * pressureMult && enemiesSpawnedThisWave < totalEnemies && enemies.length < MAX_ENEMIES) {
    waveTimer = 0;
    const type = currentPhaseEnemyTypes[Math.floor(rand(0, currentPhaseEnemyTypes.length))];
    const enemy = spawnEnemy(type, worldWidth, worldHeight, currentWave, undefined, undefined, rect);
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
