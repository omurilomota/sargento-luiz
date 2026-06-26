/**
 * Sistema de explosões para armas explosivas.
 * Gerencia dano em área e efeitos visuais de explosão.
 */

import { Enemy } from '../types';
import { dist } from '../utils';
import { spawnParticles } from './particles';

/** Lista de explosões ativas (para renderização) */
const explosions: { x: number; y: number; radius: number; maxRadius: number; life: number }[] = [];

/**
 * Retorna a lista de explosões ativas para renderização.
 * @returns array de explosões
 */
export function getExplosions(): typeof explosions {
  return explosions;
}

/**
 * Causa dano em área e cria efeito visual de explosão.
 * @param x - centro da explosão
 * @param y - centro da explosão
 * @param radius - raio da explosão
 * @param damage - dano causado a cada inimigo no raio
 * @param enemies - lista de inimigos
 * @param color - cor da explosão
 */
export function createExplosion(
  x: number, y: number, radius: number, damage: number,
  enemies: Enemy[], color = '#f39c12'
): void {
  // Dano em área
  for (const e of enemies) {
    const d = dist({ x, y }, e);
    if (d < radius) {
      // Dano diminui com a distância
      const falloff = 1 - (d / radius);
      e.health -= Math.floor(damage * (0.5 + falloff * 0.5));
      e.hitFlash = 0.15;
    }
  }

  // Efeito visual
  explosions.push({ x, y, radius: 0, maxRadius: radius, life: 0.3 });

  // Partículas de explosão
  spawnParticles(x, y, color, 30, 250);
  spawnParticles(x, y, '#fff', 10, 150);
}

/**
 * Atualiza todas as explosões ativas.
 * @param dt - delta time em segundos
 */
export function updateExplosions(dt: number): void {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
    e.life -= dt;
    e.radius = e.maxRadius * (1 - e.life / 0.3);
    if (e.life <= 0) {
      explosions.splice(i, 1);
    }
  }
}

/**
 * Reseta todas as explosões.
 */
export function clearExplosions(): void {
  explosions.length = 0;
}
