import { PLAYER_BASE_SPEED, PLAYER_BASE_HEALTH, PLAYER_RADIUS, INVINCIBLE_DURATION, BULLET_INVINCIBLE_DURATION, WAVE_HEAL_ON_COMPLETE } from '../core/constants';

export interface Player {
  x: number; y: number; radius: number; speed: number;
  health: number; maxHealth: number; angle: number;
  shootCooldown: number; invincible: number; shield: number;
}

let player: Player;

export function initPlayer(canvasWidth: number, canvasHeight: number): void {
  player = {
    x: canvasWidth / 2, y: canvasHeight / 2,
    radius: PLAYER_RADIUS, speed: PLAYER_BASE_SPEED,
    health: PLAYER_BASE_HEALTH, maxHealth: PLAYER_BASE_HEALTH,
    angle: 0, shootCooldown: 0, invincible: 0, shield: 0,
  };
}

export function getPlayer(): Player {
  return player;
}

export function resetPlayer(canvasWidth: number, canvasHeight: number): void {
  player.x = canvasWidth / 2;
  player.y = canvasHeight / 2;
  player.health = player.maxHealth;
  player.invincible = 0;
  player.shield = 0;
}

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

export function damagePlayer(amount: number): void {
  if (player.shield > 0) {
    player.shield--;
  } else {
    player.health -= amount;
  }
  player.invincible = BULLET_INVINCIBLE_DURATION;
}

export function enemyCollisionDamage(enemyDamage: number): void {
  if (player.shield > 0) {
    player.shield--;
  } else {
    player.health -= enemyDamage;
  }
  player.invincible = INVINCIBLE_DURATION;
}

export function healPlayer(amount: number): void {
  player.health = Math.min(player.maxHealth, player.health + amount);
}

export function healOnWaveComplete(): void {
  player.health = Math.min(player.maxHealth, player.health + WAVE_HEAL_ON_COMPLETE);
}
