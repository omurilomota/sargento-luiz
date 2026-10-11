/**
 * Sistema de eventos de ambiente.
 * Terremoto, relâmpago, tempestades.
 * Eventos são disparados aleatoriamente durante o jogo.
 */

import { Enemy, HazardKind } from '../types';
import { rand } from '../utils';
import { spawnParticles } from './particles';
import { createExplosion } from './explosions';
import { triggerScreenShake } from './effects';
import { PALETTE } from '../core/palette';

/** Tipos de evento ambiente */
export type EnvironmentEvent = 'earthquake' | 'lightning' | 'storm';

/** Estado de um evento ativo */
interface EventState {
  /** Se o evento está ativo */
  active: boolean;
  /** Duração restante em segundos */
  duration: number;
  /** Timer para o próximo evento */
  timer: number;
  /** Intervalo entre eventos em segundos */
  interval: number;
}

/** Estado dos eventos */
const events: Record<EnvironmentEvent, EventState> = {
  earthquake: { active: false, duration: 0, timer: 30, interval: 45 },
  lightning: { active: false, duration: 0, timer: 20, interval: 30 },
  storm: { active: false, duration: 0, timer: 60, interval: 90 },
};

const WARNING_TIME = 5;

export interface EnvironmentWarning {
  type: EnvironmentEvent;
  timeLeft: number;
}

let warnings: EnvironmentWarning[] = [];

/** Dano do terremoto por segundo */
const EARTHQUAKE_DAMAGE = 5;
/** Dano do relâmpago */
const LIGHTNING_DAMAGE = 40;
/** Dano da tempestade por segundo */
const STORM_DAMAGE = 3;
/** Raio do relâmpago */
const LIGHTNING_RADIUS = 60;
/** Se o terremoto está ativo (para indicador visual) */
let earthquakeActive = false;
/** Se a tempestade está ativa (para indicador visual) */
let stormActive = false;

export interface EnvironmentDamage {
  x: number;
  y: number;
  damage: number;
  color: string;
}

export interface EnvironmentResult {
  enemyDamages: EnvironmentDamage[];
  playerDamage: number;
}

/**
 * Atualiza todos os eventos de ambiente.
 * @param playerX - posição X do jogador
 */
export function updateEnvironmentEvents(
  dt: number,
  enemies: Enemy[],
  playerX: number,
  playerY: number,
  worldWidth: number = 1000,
  worldHeight: number = 700,
  hazard?: HazardKind
): EnvironmentResult {
  const enemyDamages: EnvironmentDamage[] = [];
  let playerDamage = 0;

  // eventos por bioma — evita terremoto em floresta, tempestade no espaço etc.
  const allowed: Record<HazardKind, EnvironmentEvent[]> = {
    debris: ['earthquake'],
    fog: ['storm'],
    darkness: [],
    electric: ['lightning'],
    mud: ['storm'],
    spikes: ['earthquake'],
    lava: ['earthquake'],
    lowGravity: [],
    none: [],
  };
  const permitido = hazard ? allowed[hazard] : [];

  warnings = [];
  for (const type of Object.keys(events) as EnvironmentEvent[]) {
    const event = events[type];

    // evento fora da lista do bioma não desperta nem emite aviso
    if (hazard && !permitido.includes(type)) {
      event.active = false;
      event.duration = 0;
      continue;
    }

    // Timer para próximo evento
    if (!event.active) {
      event.timer -= dt;
      if (event.timer <= WARNING_TIME && event.timer > 0) {
        warnings.push({ type, timeLeft: event.timer });
      }
      if (event.timer <= 0) {
        event.active = true;
        event.duration = type === 'storm' ? 5 : type === 'earthquake' ? 3 : 0.5;
        event.timer = event.interval;

        // Efeitos visuais ao iniciar
        if (type === 'earthquake') {
          triggerScreenShake(3, 1.5);
          earthquakeActive = true;
        } else if (type === 'lightning') {
          triggerScreenShake(2, 0.2);
        } else if (type === 'storm') {
          stormActive = true;
        }
      }
    }

    // Evento ativo
    if (event.active) {
      event.duration -= dt;

      switch (type) {
        case 'earthquake':
          if (Math.random() < dt * 2) {
            for (const e of enemies) {
              e.health -= EARTHQUAKE_DAMAGE;
              e.hitFlash = 0.15;
              enemyDamages.push({ x: e.x, y: e.y - 15, damage: EARTHQUAKE_DAMAGE, color: PALETTE.mustard });
              spawnParticles(e.x, e.y, PALETTE.mustard, 2, 80, 'muzzle');
            }
            playerDamage += EARTHQUAKE_DAMAGE;
          }
          // Poeira no chão durante terremoto
          if (Math.random() < dt * 8) {
            const px = Math.random() * worldWidth;
            const py = Math.random() * worldHeight;
            spawnParticles(px, py, '#8a7a60', 5, 60, 'smoke');
            spawnParticles(px, py, '#6a5a40', 2, 30, 'smoke');
          }
          break;

        case 'lightning':
          if (event.duration > 0.3) {
            if (enemies.length > 0) {
              const target = enemies[Math.floor(rand(0, enemies.length))];
              createExplosion(target.x, target.y, LIGHTNING_RADIUS, LIGHTNING_DAMAGE, enemies, PALETTE.stone);
              spawnParticles(target.x, target.y - 100, '#ddd', 5, 100, 'spark');
              enemyDamages.push({ x: target.x, y: target.y - 20, damage: LIGHTNING_DAMAGE, color: PALETTE.stone });
              const distToPlayer = Math.hypot(target.x - playerX, target.y - playerY);
              if (distToPlayer < LIGHTNING_RADIUS * 2) {
                playerDamage += LIGHTNING_DAMAGE;
              }
            }
            event.duration = 0.3;
          }
          break;

        case 'storm':
          if (Math.random() < dt) {
            for (const e of enemies) {
              e.health -= STORM_DAMAGE;
              e.hitFlash = 0.15;
              enemyDamages.push({ x: e.x, y: e.y - 15, damage: STORM_DAMAGE, color: PALETTE.stone });
              spawnParticles(e.x, e.y, PALETTE.stone, 1, 60, 'smoke');
            }
          }
          // Chuva visual
          if (Math.random() < dt * 15) {
            const rx = Math.random() * worldWidth;
            spawnParticles(rx, -10, PALETTE.stone, 1, 300, 'smoke');
          }
          break;
      }

      if (event.duration <= 0) {
        event.active = false;
        if (type === 'earthquake') earthquakeActive = false;
        if (type === 'storm') stormActive = false;
      }
    }
  }

  return { enemyDamages, playerDamage };
}

export function getEnvironmentWarnings(): EnvironmentWarning[] {
  return warnings;
}

/**
 * Reseta todos os eventos.
 */
export function resetEnvironmentEvents(): void {
  for (const type of Object.keys(events) as EnvironmentEvent[]) {
    events[type].active = false;
    events[type].duration = 0;
  }
  events.earthquake.timer = 30;
  events.lightning.timer = 20;
  events.storm.timer = 60;
  earthquakeActive = false;
  stormActive = false;
  warnings = [];
}
