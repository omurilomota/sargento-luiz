/**
 * Sistema de multiplayer local (2 jogadores no mesmo teclado).
 * P1: WASD + mouse (atira com mouse)
 * P2: Setas + L (atira na direção que olha)
 * Último em pé vence.
 */

import { PLAYER_RADIUS, PLAYER_BASE_SPEED, PLAYER_BASE_HEALTH } from '../core/constants';
import { PALETTE } from '../core/palette';

/** Estado do segundo jogador */
export interface LocalPlayer {
  x: number;
  y: number;
  radius: number;
  speed: number;
  health: number;
  maxHealth: number;
  angle: number;
  shootCooldown: number;
  invincible: number;
  color: string;
  name: string;
  alive: boolean;
}

/** Estado do multiplayer local */
let enabled = false;
let player2: LocalPlayer | null = null;
let gameOver = false;
let winner: 1 | 2 | null = null;

/**
 * Retorna se o modo multiplayer local está ativo.
 */
export function isEnabled(): boolean {
  return enabled;
}

/**
 * Retorna o segundo jogador.
 */
export function getPlayer2(): LocalPlayer | null {
  return player2;
}

/**
 * Retorna se o jogo acabou.
 */
export function isGameOver(): boolean {
  return gameOver;
}

/**
 * Retorna o vencedor (1 ou 2).
 */
export function getWinner(): 1 | 2 | null {
  return winner;
}

/**
 * Inicializa o modo multiplayer local.
 * @param canvasWidth - largura do canvas
 * @param canvasHeight - altura do canvas
 */
export function initLocalMultiplayer(canvasWidth: number, canvasHeight: number): void {
  enabled = true;
  gameOver = false;
  winner = null;
  player2 = {
    x: canvasWidth * 0.75,
    y: canvasHeight / 2,
    radius: PLAYER_RADIUS,
    speed: PLAYER_BASE_SPEED,
    health: PLAYER_BASE_HEALTH,
    maxHealth: PLAYER_BASE_HEALTH,
    angle: Math.PI,
    shootCooldown: 0,
    invincible: 0,
    color: PALETTE.stone,
    name: 'P2',
    alive: true,
  };
}

/**
 * Move o segundo jogador com as setas.
 * @param keys - mapa de teclas pressionadas
 * @param dt - delta time
 * @param canvasWidth - largura do canvas
 * @param canvasHeight - altura do canvas
 */
export function movePlayer2(
  keys: Record<string, boolean>,
  dt: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  if (!player2 || !player2.alive) return;

  let dx = 0, dy = 0;
  if (keys['arrowup']) dy -= 1;
  if (keys['arrowdown']) dy += 1;
  if (keys['arrowleft']) dx -= 1;
  if (keys['arrowright']) dx += 1;

  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    player2.x += dx * player2.speed * dt;
    player2.y += dy * player2.speed * dt;
  }

  player2.x = Math.max(player2.radius, Math.min(canvasWidth - player2.radius, player2.x));
  player2.y = Math.max(player2.radius, Math.min(canvasHeight - player2.radius, player2.y));

  // Aim toward arrow keys direction
  if (dx || dy) {
    player2.angle = Math.atan2(dy, dx);
  }

  if (player2.invincible > 0) player2.invincible -= dt;
  player2.shootCooldown -= dt;
}

/**
 * Dispara do segundo jogador (tecla L).
 * @returns dados do projétil ou null
 */
export function shootPlayer2(): { x: number; y: number; vx: number; vy: number; damage: number; color: string; isEnemy: boolean } | null {
  if (!player2 || !player2.alive || player2.shootCooldown > 0) return null;
  player2.shootCooldown = 0.3;
  const speed = 600;
  return {
    x: player2.x + Math.cos(player2.angle) * 20,
    y: player2.y + Math.sin(player2.angle) * 20,
    vx: Math.cos(player2.angle) * speed,
    vy: Math.sin(player2.angle) * speed,
    damage: 12,
    color: PALETTE.stone,
    isEnemy: false,
  };
}

/**
 * Aplica dano ao segundo jogador.
 * @param amount - quantidade de dano
 */
export function damagePlayer2(amount: number): void {
  if (!player2 || !player2.alive || player2.invincible > 0) return;
  player2.health -= amount;
  player2.invincible = 0.5;
  if (player2.health <= 0) {
    player2.health = 0;
    player2.alive = false;
    gameOver = true;
    winner = 1;
  }
}

/**
 * Verifica se o segundo jogador colidiu com um inimigo.
 * @param enemyX - posição X do inimigo
 * @param enemyY - posição Y do inimigo
 * @param enemyRadius - raio do inimigo
 * @returns true se colidiu
 */
export function checkPlayer2EnemyCollision(enemyX: number, enemyY: number, enemyRadius: number): boolean {
  if (!player2 || !player2.alive) return false;
  const dist = Math.hypot(player2.x - enemyX, player2.y - enemyY);
  return dist < player2.radius + enemyRadius;
}

/**
 * Reseta o multiplayer local.
 */
export function resetLocalMultiplayer(): void {
  enabled = false;
  player2 = null;
  gameOver = false;
  winner = null;
}
