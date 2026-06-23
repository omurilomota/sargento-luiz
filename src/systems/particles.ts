import { Particle } from '../types';
import { rand } from '../utils';
import { MAX_PARTICLES } from '../core/constants';

const particles: Particle[] = [];

export function getParticles(): Particle[] {
  return particles;
}

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

export function updateParticles(dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.life -= dt;
    if (p.life <= 0) {
      particles[particles.length - 1] = p;
      particles.pop();
    }
  }
}

export function clearParticles(): void {
  particles.length = 0;
}
