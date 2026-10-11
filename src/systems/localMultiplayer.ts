/**
 * Sistema de multiplayer local (2 jogadores no mesmo teclado).
 * P1: WASD + mouse (atira com mouse)
 * P2: Setas + L (atira na direção que olha)
 * Último em pé vence.
 */

import { PLAYER_RADIUS, PLAYER_BASE_SPEED, PLAYER_BASE_HEALTH, BULLET_INVINCIBLE_DURATION } from '../core/constants';
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
 * Inicializa o modo multiplayer local.
 */
export function initLocalMultiplayer(canvasWidth: number, canvasHeight: number): void {
  enabled = true;
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

  // mira na direção das setas
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
 * Verifica se o segundo jogador colidiu com um inimigo.
 * @param enemyX - posição X do inimigo
 * @returns true se colidiu
 */
export function checkPlayer2EnemyCollision(enemyX: number, enemyY: number, enemyRadius: number): boolean {
  if (!player2 || !player2.alive) return false;
  const dist = Math.hypot(player2.x - enemyX, player2.y - enemyY);
  return dist < player2.radius + enemyRadius;
}

/**
 * Aplica dano ao segundo jogador, com i-frame.
 *
 * O módulo tinha isto e `getWinner`, e os dois foram removidos como código
 * morto porque nada os chamava. Mas sem dano o P2 nunca morre, e "LOCAL 2P"
 * na página do itch promete versus: precisa de vida e de fim de partida.
 */
export function damagePlayer2(damage: number): void {
  if (!player2 || !player2.alive) return;
  if (player2.invincible > 0) return;
  player2.invincible = BULLET_INVINCIBLE_DURATION;
  player2.health = Math.max(0, player2.health - damage);
  if (player2.health <= 0) player2.alive = false;
}

/**
 * Mata o P2 na hora (usado pelo harness de 2P para provar o fim de partida).
 * Não é setter de vida: quem escreve a vida é `damagePlayer2`, e um setter
 * público que nada chamava era porta aberta para o P2 virar invencível por
 * engano — a mesma classe de bug que a armadura ignorada.
 */
export function matarPlayer2(): boolean {
  if (!player2 || !player2.alive) return false;
  player2.health = 0;
  player2.alive = false;
  return true;
}

/**
 * Condição de vitória: um jogador em pé e o outro não.
 * `null` enquanto os dois estão de pé (partida em andamento) ou os dois caíram.
 */
export function getWinner(): 'p1' | 'p2' | null {
  if (!player2) return null;
  const p1Vivo = true;
  if (player2.alive === p1Vivo) return null;
  return player2.alive ? 'p2' : 'p1';
}

/** Reposiciona e revive o P2 para uma nova partida. */
export function resetPlayer2(canvasWidth: number, canvasHeight: number): void {
  if (!player2) return;
  player2.x = canvasWidth * 0.75;
  player2.y = canvasHeight / 2;
  player2.health = player2.maxHealth;
  player2.alive = true;
  player2.invincible = 0;
  player2.angle = Math.PI;
}

/**
 * Reseta o multiplayer local.
 */
export function resetLocalMultiplayer(): void {
  enabled = false;
  player2 = null;
}
