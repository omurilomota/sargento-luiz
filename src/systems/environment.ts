/**
 * Sistema de eventos de ambiente.
 * Terremoto, relâmpago, tempestades.
 * Eventos são disparados aleatoriamente durante o jogo.
 */

import { Enemy, HazardKind } from '../types';
import { rand } from '../utils';
import { moveCircleBy } from './tilemap';
import { sfxTornado } from './audio';
import { spawnParticles } from './particles';
import { createExplosion } from './explosions';
import { triggerScreenShake, triggerFlash } from './effects';
import { sfxChuva, sfxTrovao } from './audio';
import { PALETTE } from '../core/palette';

/** Tipos de evento ambiente */
export type EnvironmentEvent = 'earthquake' | 'lightning' | 'storm' | 'tornado' | 'ash' | 'freeze';

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
  // o showpiece é RARO de propósito: o uivo tem que ser evento, não móvel
  tornado: { active: false, duration: 0, timer: 70, interval: 110 },
  // Novos: cinzas no fogo, frio no vácuo/castelo
  ash: { active: false, duration: 0, timer: 45, interval: 75 },
  freeze: { active: false, duration: 0, timer: 55, interval: 90 },
};

/**
 * Cinemática do tornado: um vórtice que nasce numa borda e atravessa o
 * mapa. O centro anda em linha reta — a assinatura dele é o EMPURRÃO
 * radial (M1, relato 2026-10-14: "empurrão em jogador e zumbi"), não dano.
 */
let tornadoX = 0;
let tornadoY = 0;
let tornadoVX = 0;
let tornadoVY = 0;
/** Raio do empurrão (px) */
export const TORNADO_RAIO = 260;
/** Empurrão máximo no centro do vórtice (px/s) */
export const TORNADO_EMPURRAO = 480;
/** Dano por segundo para quem fica DENTRO do funil (90px) */
const TORNADO_DANO = 4;

/**
 * O empurrão do tornado sobre algo a (dx, dy) do centro do vórtice — puro
 * para o teste: a força cai linearmente até zero no raio.
 */
export function empurraDoTornado(dx: number, dy: number): { x: number; y: number } {
  const dist = Math.hypot(dx, dy);
  if (dist >= TORNADO_RAIO || dist === 0) return { x: 0, y: 0 };
  const forca = TORNADO_EMPURRAO * (1 - dist / TORNADO_RAIO);
  return { x: (dx / dist) * forca, y: (dy / dist) * forca };
}

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
  /** Deslocamento do jogador por causa do evento NESTE frame (px) — o
   * tornado empurra, e o main aplica com colisão via moveCircleBy. */
  playerPush: { x: number; y: number };
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
  const playerPush = { x: 0, y: 0 };

  // eventos por bioma — evita terremoto em floresta, tempestade no espaço etc.
  const allowed: Record<HazardKind, EnvironmentEvent[]> = {
    // o tornado é da CIDADE: o prólogo já fecha o céu "do lado do mar" —
    // o evento cumpre o que a fala prometeu
    debris: ['earthquake', 'tornado', 'ash'],
    fog: ['storm'],
    darkness: [],
    electric: ['lightning', 'freeze'],
    mud: ['storm'],
    spikes: ['earthquake', 'freeze'],
    lava: ['earthquake', 'ash'],
    lowGravity: ['freeze'],
    none: [],
  };
  const permitido = hazard ? allowed[hazard] : [];

  warnings = [];
  for (const type of Object.keys(events) as EnvironmentEvent[]) {
    const event = events[type];
    // chuva traz relâmpago: durante a tempestade o raio cai com mais frequência
    if (type === 'lightning' && stormActive && !event.active) {
      event.timer = Math.min(event.timer, 2.5);
    }

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
        event.duration = type === 'storm' ? 5 : type === 'earthquake' ? 3
          : type === 'tornado' ? 6.5 : type === 'ash' ? 6 : type === 'freeze' ? 5 : 0.5;
        event.timer = event.interval;

        // Efeitos visuais ao iniciar
        if (type === 'earthquake') {
          triggerScreenShake(3, 1.5);
          earthquakeActive = true;
        } else if (type === 'lightning') {
          sfxTrovao();
          triggerFlash('#dfe8f0', 0.22);
          triggerScreenShake(4, 0.35);
        } else if (type === 'storm') {
          stormActive = true;
          sfxChuva(); // a chuva agora se ouve, não só aparece
        } else if (type === 'tornado') {
          // nasce numa borda aleatória e atravessa: o uivo vem junto
          const lado = Math.floor(rand(0, 4));
          if (lado === 0) { tornadoX = -80; tornadoY = rand(0, worldHeight); tornadoVX = 130; tornadoVY = rand(-40, 40); }
          else if (lado === 1) { tornadoX = worldWidth + 80; tornadoY = rand(0, worldHeight); tornadoVX = -130; tornadoVY = rand(-40, 40); }
          else if (lado === 2) { tornadoX = rand(0, worldWidth); tornadoY = -80; tornadoVY = 130; tornadoVX = rand(-40, 40); }
          else { tornadoX = rand(0, worldWidth); tornadoY = worldHeight + 80; tornadoVY = -130; tornadoVX = rand(-40, 40); }
          sfxTornado();
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
            // clarão e trovão no momento do impacto — a chuva pede o trovão
            sfxTrovao();
            triggerFlash('#dfe8f0', 0.18);
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

        case 'ash': {
          // chuva de cinzas: o céu fecha, o ar arranha. Dano leve e contínuo,
          // partículas cinzentas cobrindo a arena — é o inferno que resolve
          // o combate por desgaste, não por um raio.
          if (Math.random() < dt * 3) {
            for (const e of enemies) {
              e.health -= 3;
              e.hitFlash = 0.1;
              enemyDamages.push({ x: e.x, y: e.y - 15, damage: 3, color: '#8a8078' });
            }
            playerDamage += 3;
          }
          if (Math.random() < dt * 20) {
            spawnParticles(rand(0, worldWidth), -10, '#7a7268', 1, 120, 'smoke');
          }
          break;
        }
        case 'freeze':
          // frio extremo: tudo fica lento. Os multiplicadores são lidos pelo
          // main/getVelocidade — o evento só marca a duração ativa.
          if (Math.random() < dt * 6) {
            spawnParticles(rand(0, worldWidth), rand(0, worldHeight), '#9ab0c0', 1, 40, 'spark');
          }
          if (Math.random() < dt) playerDamage += 2;
          break;
        case 'tornado': {
          // o vórtice anda; tudo perto dele é EMPURRADO para longe do centro
          tornadoX += tornadoVX * dt;
          tornadoY += tornadoVY * dt;
          for (const e of enemies) {
            const emp = empurraDoTornado(e.x - tornadoX, e.y - tornadoY);
            if (emp.x !== 0 || emp.y !== 0) {
              const movido = moveCircleBy(e.x, e.y, emp.x * dt, emp.y * dt, e.radius);
              e.x = movido.x;
              e.y = movido.y;
              e.hitFlash = Math.max(e.hitFlash, 0.05);
            }
          }
          const empJogador = empurraDoTornado(playerX - tornadoX, playerY - tornadoY);
          playerPush.x += empJogador.x * dt;
          playerPush.y += empJogador.y * dt;
          // quem fica DENTRO do funil apanha do vento — o empurrão é a
          // defesa: sair da rota
          const dJogador = Math.hypot(playerX - tornadoX, playerY - tornadoY);
          if (dJogador < 90) playerDamage += TORNADO_DANO * dt;
          // o funil em partículas de sprite: fumaça espiralando + poeira na base
          if (Math.random() < dt * 30) {
            const ang = rand(0, Math.PI * 2);
            const raioOrbital = rand(20, 90);
            spawnParticles(tornadoX + Math.cos(ang) * raioOrbital, tornadoY + Math.sin(ang) * raioOrbital, '#8a8a80', 1, 90, 'smoke');
          }
          if (Math.random() < dt * 20) {
            spawnParticles(tornadoX + rand(-60, 60), tornadoY + rand(-14, 14), '#6a5f48', 2, 120, 'muzzle');
          }
          break;
        }
      }

      if (event.duration <= 0) {
        event.active = false;
        if (type === 'earthquake') earthquakeActive = false;
        if (type === 'storm') stormActive = false;
      }
    }
  }

  return { enemyDamages, playerDamage, playerPush };
}

export function getEnvironmentWarnings(): EnvironmentWarning[] {
  return warnings;
}

/** Se o tornado está na tela (a prova lê para saber quando acaba). */
export function tempestadeAtiva(): boolean { return stormActive; }
export function frioAtivo(): boolean { return events.freeze.active; }
export function cinzasAtivas(): boolean { return events.ash.active; }

export function tornadoNoAr(): boolean {
  return events.tornado.active;
}

/**
 * Força um evento ambiente a começar AGORA — a ponte de prova usa isto
 * para não esperar o timer aleatório. O tornado nasce perto de (x, y)
 * quando o ponto vem: a prova precisa de determinismo (o caminho natural
 * sorteia borda). Fora do bioma permitido não faz NADA — permissão não é
 * atalho.
 */
export function forcarEventoAmbiente(type: EnvironmentEvent, x?: number, y?: number, worldWidth?: number, worldHeight?: number): boolean {
  const event = events[type];
  if (!event || event.active) return false;
  event.active = true;
  event.duration = type === 'storm' ? 5 : type === 'earthquake' ? 3 : type === 'tornado' ? 6.5 : 0.5;
  if (type === 'tornado') {
    // nasce a ~200px do ponto dado, atravessando por ele: alvo garantido
    const ang = rand(0, Math.PI * 2);
    tornadoX = (x ?? 0) - Math.cos(ang) * 200;
    tornadoY = (y ?? 0) - Math.sin(ang) * 200;
    const len = Math.hypot((x ?? 0) - tornadoX, (y ?? 0) - tornadoY) || 1;
    tornadoVX = ((x ?? 0) - tornadoX) / len * 130;
    tornadoVY = ((y ?? 0) - tornadoY) / len * 130;
    sfxTornado();
  } else if (type === 'earthquake') {
    triggerScreenShake(3, 1.5);
    earthquakeActive = true;
  } else if (type === 'storm') {
    stormActive = true;
  }
  return true;
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
  events.ash.timer = 45;
  events.freeze.timer = 55;
  earthquakeActive = false;
  stormActive = false;
  warnings = [];
}
