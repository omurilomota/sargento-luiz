/**
 * Entidade do jogador.
 * Gerencia o estado, movimento, dano e cura do jogador.
 * Mantém um objeto Player singleton acessível por todos os módulos.
 */

import { PLAYER_BASE_SPEED, PLAYER_BASE_HEALTH, PLAYER_RADIUS, INVINCIBLE_DURATION, BULLET_INVINCIBLE_DURATION, WAVE_HEAL_ON_COMPLETE } from '../core/constants';

/** Interface que define todas as propriedades do jogador */
export interface Player {
  /** Posição horizontal */
  x: number;
  /** Posição vertical */
  y: number;
  /** Raio de colisão */
  radius: number;
  /** Velocidade base de movimento */
  speed: number;
  /** Pontos de vida atuais */
  health: number;
  /** Pontos de vida máximos */
  maxHealth: number;
  /** Ângulo de mira atual (radianos) */
  angle: number;
  /** Cooldown restante para o próximo disparo */
  shootCooldown: number;
  /** Tempo restante de invincibilidade (0 = vulnerável) */
  invincible: number;
  /** Número de cargas de escudo restantes */
  shield: number;
}

/** Instância singleton do jogador */
let player: Player;

/**
 * Inicializa o jogador com stats base na posição central do canvas.
 * @param canvasWidth - largura do canvas
 * @param canvasHeight - altura do canvas
 */
export function initPlayer(canvasWidth: number, canvasHeight: number): void {
  player = {
    x: canvasWidth / 2, y: canvasHeight / 2,
    radius: PLAYER_RADIUS, speed: PLAYER_BASE_SPEED,
    health: PLAYER_BASE_HEALTH, maxHealth: PLAYER_BASE_HEALTH,
    angle: 0, shootCooldown: 0, invincible: 0, shield: 0,
  };
}

/**
 * Retorna a referência ao objeto do jogador.
 * @returns objeto Player atual
 */
export function getPlayer(): Player {
  return player;
}

/**
 * Reseta o jogador para a posição central, vida cheia e sem buffs.
 * Usado ao iniciar nova fase.
 * @param canvasWidth - largura do canvas
 * @param canvasHeight - altura do canvas
 */
export function resetPlayer(canvasWidth: number, canvasHeight: number): void {
  player.x = canvasWidth / 2;
  player.y = canvasHeight / 2;
  player.health = player.maxHealth;
  player.invincible = 0;
  player.shield = 0;
}

/**
 * Move o jogador com base nas teclas pressionadas.
 * Normaliza diagonal e aplica limite das bordas do canvas.
 * @param keys - mapa de teclas pressionadas
 * @param dt - delta time em segundos
 * @param canvasWidth - largura do canvas
 * @param canvasHeight - altura do canvas
 * @param speedMultiplier - multiplicador de velocidade (ex: power-up de velocidade)
 */
export function movePlayer(
  keys: Record<string, boolean>,
  dt: number,
  canvasWidth: number,
  canvasHeight: number,
  speedMultiplier: number
): void {
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const spd = player.speed * speedMultiplier;
    player.x += dx * spd * dt;
    player.y += dy * spd * dt;
  }
  player.x = Math.max(player.radius, Math.min(canvasWidth - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvasHeight - player.radius, player.y));
}

/**
 * Aplica dano ao jogador causado por projéteis inimigos.
 * Escudo absorve o dano se disponível.
 * @param amount - quantidade de dano
 */
export function damagePlayer(amount: number): void {
  if (player.shield > 0) {
    player.shield--;
  } else {
    player.health -= amount;
  }
  player.invincible = BULLET_INVINCIBLE_DURATION;
}

/**
 * Aplica dano ao jogador causado por colisão direta com inimigos.
 * Escudo absorve o dano se disponível. Invincibilidade mais longa que projéteis.
 * @param enemyDamage - quantidade de dano do inimigo
 */
export function enemyCollisionDamage(enemyDamage: number): void {
  if (player.shield > 0) {
    player.shield--;
  } else {
    player.health -= enemyDamage;
  }
  player.invincible = INVINCIBLE_DURATION;
}

/**
 * Cura o jogador, limitado ao máximo de vida.
 * @param amount - quantidade de vida a restaurar
 */
export function healPlayer(amount: number): void {
  player.health = Math.min(player.maxHealth, player.health + amount);
}

/**
 * Cura o jogador ao completar uma onda.
 * Usa o valor de WAVE_HEAL_ON_COMPLETE.
 */
export function healOnWaveComplete(): void {
  player.health = Math.min(player.maxHealth, player.health + WAVE_HEAL_ON_COMPLETE);
}

/**
 * Aumenta a vida máxima do jogador e cura pela mesma quantidade.
 * @param amount - quantidade a adicionar ao máximo e à vida atual
 */
export function addMaxHealth(amount: number): void {
  player.maxHealth += amount;
  player.health += amount;
}

/**
 * Aumenta a velocidade base do jogador.
 * @param multiplier - valor percentual a adicionar (ex: 0.15 = +15%)
 */
export function addSpeed(multiplier: number): void {
  player.speed += player.speed * multiplier;
}

/**
 * Adiciona cargas de escudo ao jogador.
 * @param amount - quantidade de cargas a adicionar
 */
export function addShield(amount: number): void {
  player.shield += amount;
}

/** Se a regeneração permanente está ativa */
let regenActive = false;

/**
 * Ativa a regeneração permanente (1 vida por segundo).
 */
export function enableRegen(): void {
  regenActive = true;
}

/**
 * Retorna se a regeneração está ativa.
 */
export function isRegenActive(): boolean {
  return regenActive;
}

/**
 * Aplica regeneração se ativa.
 * @param dt - delta time em segundos
 */
export function applyRegen(dt: number): void {
  if (regenActive && player.health < player.maxHealth) {
    player.health = Math.min(player.maxHealth, player.health + dt);
  }
}

/**
 * Reseta a regeneração.
 */
export function resetRegen(): void {
  regenActive = false;
}
