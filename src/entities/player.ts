/**
 * Entidade do jogador.
 * Gerencia o estado, movimento, dano e cura do jogador.
 * Mantém um objeto Player singleton acessível por todos os módulos.
 */

import { PLAYER_BASE_SPEED, PLAYER_BASE_HEALTH, PLAYER_RADIUS, INVINCIBLE_DURATION, BULLET_INVINCIBLE_DURATION, WAVE_HEAL_ON_COMPLETE } from '../core/constants';
import { getHardcore } from '../systems/gameModes';

/** Interface que define todas as propriedades do jogador */
export interface Player {
  x: number;
  y: number;
  radius: number;
  speed: number;
  health: number;
  maxHealth: number;
  angle: number;
  shootCooldown: number;
  invincible: number;
  shield: number;
  hitFlash: number;
  deathTimer: number;
  deathAngle: number;
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
    angle: 0, shootCooldown: 0, invincible: 0, shield: 0, hitFlash: 0,
    deathTimer: 0, deathAngle: 0,
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
  player.hitFlash = 0;
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
    const reduced = Math.floor(enemyDamage * (1 - armorLevel));
    player.health -= Math.max(1, reduced);
  }
  player.hitFlash = 0.2;
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
  if (getHardcore()) return;
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

let comboHealthMultiplier = 1;

/**
 * Define o multiplicador de vida dos combos.
 * @param multiplier - multiplicador (ex: 1.25 = +25% vida)
 */
export function setComboHealthMultiplier(multiplier: number): void {
  const oldMax = getEffectiveMaxHealth();
  comboHealthMultiplier = multiplier;
  const newMax = getEffectiveMaxHealth();
  player.maxHealth += (newMax - oldMax);
  player.health = Math.min(player.health, player.maxHealth);
}

/**
 * Retorna a vida máxima efetiva (base + combo bonus).
 */
export function getEffectiveMaxHealth(): number {
  return Math.floor(player.maxHealth * comboHealthMultiplier);
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

/** Nível de regeneração (0 = inativo, 1+ = HP/s) */
let regenLevel = 0;
/** Nível de armadura (0-1, reduz dano recebido) */
let armorLevel = 0;

/**
 * Ativa/regeneração permanente. Stacking: cada compra aumenta o nível.
 * @param value - HP por segundo a adicionar (ex: 1 para Regeneração, 2 para Regen Avançada)
 */
export function enableRegen(value: number = 1): void {
  regenLevel += value;
}

/**
 * Adiciona armadura ao jogador.
 * @param value - nível de armadura (0-1, ex: 0.15 = 15% redução)
 */
export function addArmor(value: number): void {
  armorLevel = Math.min(0.5, armorLevel + value);
}

/**
 * Retorna o nível de armadura.
 * @returns valor entre 0 e 0.5
 */
export function getArmorLevel(): number {
  return armorLevel;
}

/**
 * Retorna se a regeneração está ativa.
 */
export function isRegenActive(): boolean {
  return regenLevel > 0;
}

/**
 * Aplica regeneração se ativa.
 * @param dt - delta time em segundos
 */
export function applyRegen(dt: number): void {
  if (getHardcore()) return;
  if (player.health < player.maxHealth && regenLevel > 0) {
    player.health = Math.min(player.maxHealth, player.health + regenLevel * dt);
  }
}

/**
 * Reseta a regeneração.
 */
export function resetRegen(): void {
  regenLevel = 0;
}
