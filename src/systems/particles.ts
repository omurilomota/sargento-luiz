/**
 * Sistema de partículas.
 * Gerencia a criação, atualização e renderização de partículas visuais
 * (explosões, rastros, impactos). Limitado a MAX_PARTICLES simultâneas.
 */

import { Particle } from '../types';
import { rand } from '../utils';
import { MAX_PARTICLES } from '../core/constants';

/** Lista de partículas ativas */
const particles: Particle[] = [];

/**
 * Retorna a lista de partículas ativas para renderização.
 * @returns array de partículas
 */
export function getParticles(): Particle[] {
  return particles;
}

/**
 * Cria novas partículas em uma posição com direções aleatórias.
 * Limita a quantidade ao número de slots disponíveis (MAX_PARTICLES).
 * @param x - posição horizontal de origem
 * @param y - posição vertical de origem
 * @param color - cor das partículas
 * @param count - quantidade desejada de partículas
 * @param speed - velocidade base das partículas
 */
export function spawnParticles(x: number, y: number, color: string, count: number, speed: number): void {
  const available = MAX_PARTICLES - particles.length;
  const toSpawn = Math.min(count, available);
  for (let i = 0; i < toSpawn; i++) {
    const angle = rand(0, Math.PI * 2);
    const spd = rand(speed * 0.3, speed);
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: rand(0.3, 0.8),
      maxLife: 0.8,
      radius: rand(2, 6),
      color,
    });
  }
}

/**
 * Atualiza posição e vida de todas as partículas.
 * Remove partículas cuja vida expirou.
 * @param dt - delta time em segundos
 */
export function updateParticles(dt: number): void {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.life -= dt;
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}

/**
 * Remove todas as partículas ativas.
 */
export function clearParticles(): void {
  particles.length = 0;
}
