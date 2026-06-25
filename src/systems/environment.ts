/**
 * Sistema de eventos de ambiente.
 * Terremoto, relâmpago, tempestades.
 * Eventos são disparados aleatoriamente durante o jogo.
 */

import { Enemy } from '../types';
import { rand } from '../utils';
import { spawnParticles } from './particles';
import { createExplosion } from './explosions';
import { triggerScreenShake, triggerDamageFlash } from './effects';

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

/**
 * Verifica se um evento está ativo.
 * @param type - tipo do evento
 * @returns true se ativo
 */
export function isEventActive(type: EnvironmentEvent): boolean {
  return events[type].active;
}

/**
 * Retorna se o terremoto está ativo (para indicador visual).
 */
export function isEarthquakeActive(): boolean {
  return earthquakeActive;
}

/**
 * Retorna se a tempestade está ativa (para indicador visual).
 */
export function isStormActive(): boolean {
  return stormActive;
}

/**
 * Retorna o timer restante de um evento.
 * @param type - tipo do evento
 * @returns segundos restantes
 */
export function getEventTimer(type: EnvironmentEvent): number {
  return events[type].timer;
}

/** Informação de dano causado por evento ambiente */
export interface EnvironmentDamage {
  /** Posição X do alvo */
  x: number;
  /** Posição Y do alvo */
  y: number;
  /** Quantidade de dano */
  damage: number;
  /** Cor da fonte de dano */
  color: string;
}

/**
 * Atualiza todos os eventos de ambiente.
 * @param dt - delta time em segundos
 * @param enemies - lista de inimigos
 * @param playerX - posição X do jogador
 * @param playerY - posição Y do jogador
 * @returns array de eventos de dano para exibir números de dano
 */
export function updateEnvironmentEvents(
  dt: number,
  enemies: Enemy[],
  playerX: number,
  playerY: number
): EnvironmentDamage[] {
  const damages: EnvironmentDamage[] = [];

  for (const type of Object.keys(events) as EnvironmentEvent[]) {
    const event = events[type];

    // Timer para próximo evento
    if (!event.active) {
      event.timer -= dt;
      if (event.timer <= 0) {
        event.active = true;
        event.duration = type === 'storm' ? 5 : type === 'earthquake' ? 3 : 0.5;
        event.timer = event.interval;

        // Efeitos visuais ao iniciar
        if (type === 'earthquake') {
          triggerScreenShake(12, 3);
          earthquakeActive = true;
        } else if (type === 'lightning') {
          triggerDamageFlash();
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
          // Dano periódico a todos os inimigos
          if (Math.random() < dt * 2) {
            for (const e of enemies) {
              e.health -= EARTHQUAKE_DAMAGE;
              damages.push({ x: e.x, y: e.y - 15, damage: EARTHQUAKE_DAMAGE, color: '#e67e22' });
              spawnParticles(e.x, e.y, '#e67e22', 2, 80);
            }
          }
          break;

        case 'lightning':
          // Relâmpago em inimigo aleatório
          if (event.duration > 0.3 && enemies.length > 0) {
            const target = enemies[Math.floor(rand(0, enemies.length))];
            createExplosion(target.x, target.y, LIGHTNING_RADIUS, LIGHTNING_DAMAGE, enemies, '#3498db');
            spawnParticles(target.x, target.y - 100, '#fff', 5, 100);
            damages.push({ x: target.x, y: target.y - 20, damage: LIGHTNING_DAMAGE, color: '#3498db' });
            event.duration = 0.3; // Só um relâmpago
          }
          break;

        case 'storm':
          // Dano periódico a todos
          if (Math.random() < dt) {
            for (const e of enemies) {
              e.health -= STORM_DAMAGE;
              damages.push({ x: e.x, y: e.y - 15, damage: STORM_DAMAGE, color: '#9b59b6' });
              spawnParticles(e.x, e.y, '#9b59b6', 1, 60);
            }
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

  return damages;
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
}
