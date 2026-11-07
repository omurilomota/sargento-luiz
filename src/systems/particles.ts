/**
 * Sistema de partículas.
 * Gerencia a criação, atualização e renderização de partículas visuais
 * (explosões, rastros, impactos). Limitado a MAX_PARTICLES simultâneas
 * e MAX_PARTICLES_PER_FRAME por frame.
 */

import { Particle } from '../types';
import { rand } from '../utils';
import { MAX_PARTICLES } from '../core/constants';

/** Limite de partículas criadas por frame */
const MAX_PARTICLES_PER_FRAME = 80;
/** Contador de partículas criadas no frame atual */
let spawnedThisFrame = 0;

/** Lista de partículas ativas */
const particles: Particle[] = [];

/**
 * Retorna a lista de partículas ativas para renderização.
 */
export function getParticles(): Particle[] {
  return particles;
}

/** Sprites do Kenney Particle Pack (CC0) por tipo de evento. */
const SPRITES_MUZZLE = ['muzzle_01', 'muzzle_02', 'muzzle_03', 'muzzle_04', 'muzzle_05'];
const SPRITES_SMOKE = ['smoke_01', 'smoke_02', 'smoke_03', 'smoke_04', 'smoke_05'];
const SPRITES_SPARK = ['spark_01', 'spark_02', 'spark_03', 'spark_04', 'spark_05'];

/** Conjunto de sprites que o chamador quer. */
export type ParticleStyle = 'muzzle' | 'smoke' | 'spark';

const CONJUNTOS: Record<ParticleStyle, string[]> = {
  muzzle: SPRITES_MUZZLE,
  smoke: SPRITES_SMOKE,
  spark: SPRITES_SPARK,
};

/** Quantos sprites tem cada família. Exportado para o teste de assets. */
export const CONTAGOS_POR_ESTILO: Record<ParticleStyle, number> = {
  muzzle: SPRITES_MUZZLE.length,
  smoke: SPRITES_SMOKE.length,
  spark: SPRITES_SPARK.length,
};

/**
 * Cria novas partículas em uma posição com direções aleatórias.
 * Limita a quantidade ao número de slots disponíveis (MAX_PARTICLES).
 *
 * `style` escolhe a família do sprite. Sem ele, usa faísca: o `arc` de antes
 * não distinguia muzzle de fumaça, e era exatamente essa uniformidade que
 * fazia explosão, tiro e morte de inimigo terem a mesma cara.
 */
export function spawnParticles(
  x: number, y: number, color: string, count: number, speed: number,
  style: ParticleStyle = 'spark',
): void {
  const available = MAX_PARTICLES - particles.length;
  const frameRemaining = MAX_PARTICLES_PER_FRAME - spawnedThisFrame;
  const toSpawn = Math.min(count, available, frameRemaining);
  spawnedThisFrame += toSpawn;
  const conjunto = CONJUNTOS[style];
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
      sprite: conjunto[Math.floor(rand(0, conjunto.length))],
    });
  }
}

/**
 * Clarão único no ponto do acerto. Usa o `flare_01` do Kenney Particle Pack
 * (o mesmo das poças de fogo) em vez de mais faíscas aleatórias: o olho lê
 * "acertou aqui" antes de ler o número de dano.
 */
export function spawnImpact(x: number, y: number, color: string, radius = 10): void {
  if (particles.length >= MAX_PARTICLES) return;
  particles.push({
    x, y, vx: 0, vy: 0,
    life: 0.16,
    maxLife: 0.16,
    radius,
    color,
    sprite: 'flare_01',
  });
}

/**
 * Atualiza posição e vida de todas as partículas.
 * Remove partículas cuja vida expirou.
 */
export function updateParticles(dt: number): void {
  spawnedThisFrame = 0;
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
