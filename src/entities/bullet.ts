/**
 * Entidade de projéteis.
 * Gerencia a criação, atualização e limpeza de projéteis.
 * Suporta projéteis do jogador e inimigos no mesmo array.
 */

import { Bullet } from '../types';
import { BULLET_LIFE } from '../core/constants';

/** Lista de projéteis ativos */
const bullets: Bullet[] = [];

/**
 * Retorna a lista de projéteis ativos para renderização e colisão.
 * @returns array de projéteis
 */
export function getBullets(): Bullet[] {
  return bullets;
}

/**
 * Cria um novo projétil e adiciona à lista.
 * @param x - posição horizontal inicial
 * @param y - posição vertical inicial
 * @param vx - velocidade horizontal
 * @param vy - velocidade vertical
 * @param damage - dano causado ao atingir um alvo
 * @param isEnemy - true se o projétil foi disparado por um inimigo
 * @param color - cor do projétil
 * @param pierce - true se atravessa múltiplos alvos
 */
export function spawnBullet(
  x: number, y: number, vx: number, vy: number,
  damage: number, isEnemy: boolean, color: string, pierce: boolean
): void {
  bullets.push({ x, y, vx, vy, life: BULLET_LIFE, damage, isEnemy, color, pierce });
}

/**
 * Atualiza posição e vida de todos os projéteis.
 * Remove projéteis que expiraram ou saíram dos limites do canvas.
 * @param dt - delta time em segundos
 * @param canvasWidth - largura do canvas
 * @param canvasHeight - altura do canvas
 */
export function updateBullets(dt: number, canvasWidth: number, canvasHeight: number): void {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < -50 || b.x > canvasWidth + 50 || b.y < -50 || b.y > canvasHeight + 50) {
      bullets[bullets.length - 1] = b;
      bullets.pop();
    }
  }
}

/**
 * Remove todos os projéteis ativos.
 */
export function clearBullets(): void {
  bullets.length = 0;
}
