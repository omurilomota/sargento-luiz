/**
 * Sistema de explosões para armas explosivas.
 * Gerencia dano em área e efeitos visuais de explosão.
 */

import { Enemy } from '../types';
import { dist } from '../utils';
import { spawnParticles } from './particles';
import { PALETTE } from '../core/palette';

/** Lista de explosões ativas (para renderização) */
const explosions: { x: number; y: number; radius: number; maxRadius: number; life: number }[] = [];

// ── Fogo no chão (B7: o cenário destrutivo da fase final) ──────────
// A fase do NÚCLEO pediu "explosão por todo lado" — o barril que explode,
// o chefe que cai e a biomaquina que a máquina costura deixam o chão
// QUEIMANDO. É hazard do mundo: fere quem estiver em cima, dos dois lados,
// como o barral (o `explosivos.test` já firma o contrato: arma não fere o
// dono, mundo fere).

export interface FirePatch {
  x: number;
  y: number;
  radius: number;
  /** Segundos de queima restantes. */
  life: number;
  maxLife: number;
}

const fires: FirePatch[] = [];

/** Quanto tempo o chão queima. */
export const FOGO_VIDA = 6;
/** Raio da poça de fogo. */
export const FOGO_RAIO = 44;
/** Dano por segundo de quem está com o pé no fogo. */
export const FOGO_DPS = 8;
/**
 * Teto de poças simultâneas: a fase tem que FICAR quente conforme a luta
 * anda, não virar uma tela inteira de fogo que esconde o chefe.
 */
export const FOGO_MAX = 12;

/** Acende uma poça no chão. A mais antiga sai quando o teto bate. */
export function spawnFire(x: number, y: number, radius: number = FOGO_RAIO): void {
  if (fires.length >= FOGO_MAX) fires.shift();
  fires.push({ x, y, radius, life: FOGO_VIDA, maxLife: FOGO_VIDA });
}

export function getFires(): FirePatch[] {
  return fires;
}

/** A poça em que o círculo pisa, ou null. O toque é meio raio: fogo na borda
 * não é fogo debaixo do pé. */
export function pisaEmFogo(x: number, y: number, raio: number): FirePatch | null {
  for (const f of fires) {
    if (Math.hypot(x - f.x, y - f.y) < f.radius + raio * 0.5) return f;
  }
  return null;
}

export function updateFires(dt: number): void {
  for (let i = fires.length - 1; i >= 0; i--) {
    fires[i].life -= dt;
    if (fires[i].life <= 0) fires.splice(i, 1);
  }
}

export function clearFires(): void {
  fires.length = 0;
}

/**
 * Retorna a lista de explosões ativas para renderização.

/**
 * Causa dano em área e cria efeito visual de explosão.
 */
export function createExplosion(
  x: number, y: number, radius: number, damage: number,
  enemies: Enemy[], color: string = PALETTE.terracotta
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
  spawnParticles(x, y, color, 30, 250, 'smoke');
  spawnParticles(x, y, '#fff', 10, 150, 'spark');
}

/**
 * Atualiza todas as explosões ativas.
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
