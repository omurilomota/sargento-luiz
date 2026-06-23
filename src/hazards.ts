import { Hazard } from './types';
import { HAZARD_TYPES } from './config';
import { rand } from './utils';

let hazards: Hazard[] = [];

export function spawnHazards(canvasWidth: number, canvasHeight: number) {
  hazards = [];

  for (let i = 0; i < 3; i++) {
    const def = HAZARD_TYPES.lava;
    hazards.push({
      type: 'lava',
      x: rand(100, canvasWidth - 100),
      y: rand(100, canvasHeight - 100),
      radius: def.radius || 40,
      damage: def.damage || 5,
      effect: def.effect || 'burn',
      duration: def.duration || 1,
    });
  }

  for (let i = 0; i < 4; i++) {
    const def = HAZARD_TYPES.ice_trap;
    hazards.push({
      type: 'ice_trap',
      x: rand(100, canvasWidth - 100),
      y: rand(100, canvasHeight - 100),
      radius: def.radius || 30,
      damage: def.damage || 0,
      effect: def.effect || 'stun',
      duration: def.duration || 1,
    });
  }
}

export function getHazards(): Hazard[] {
  return hazards;
}

export function checkHazardCollision(playerX: number, playerY: number, playerRadius: number): { hit: boolean; effect: string; damage: number; duration: number } {
  for (const h of hazards) {
    const dist = Math.hypot(playerX - h.x, playerY - h.y);
    if (dist < h.radius + playerRadius) {
      return { hit: true, effect: h.effect, damage: h.damage, duration: h.duration };
    }
  }
  return { hit: false, effect: '', damage: 0, duration: 0 };
}

export function drawHazards(ctx: CanvasRenderingContext2D, time: number) {
  for (const h of hazards) {
    if (h.type === 'lava') {
      const pulse = Math.sin(time / 500) * 5;
      ctx.fillStyle = `rgba(231, 76, 60, ${0.6 + Math.sin(time / 300) * 0.2})`;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (h.type === 'ice_trap') {
      ctx.fillStyle = 'rgba(52, 152, 219, 0.4)';
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

export function resetHazards() {
  hazards = [];
}
