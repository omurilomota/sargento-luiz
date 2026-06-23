/**
 * Sistema de power-ups.
 * Gerencia a criação, atualização, coleta e duração de power-ups.
 * Power-ups são dropados aleatoriamente ao derrotar inimigos.
 */

import { PowerUp } from './types';
import { POWERUP_TYPES } from './config';
import { rand } from './utils';

/** Lista de power-ups ativos no campo de batalha */
export const powerups: PowerUp[] = [];
/** Mapa de power-ups temporários ativos e seus tempos restantes (segundos) */
export const activePowerups: Record<string, number> = {};

/**
 * Cria um power-up aleatório na posição especificada.
 * O tipo é escolhido aleatoriamente entre todos os tipos disponíveis.
 * @param x - posição horizontal
 * @param y - posição vertical
 */
export function spawnPowerUp(x: number, y: number) {
  const types = Object.keys(POWERUP_TYPES);
  const type = types[Math.floor(rand(0, types.length))];
  powerups.push({ x, y, type, life: 12 });
}

/**
 * Atualiza duração dos power-ups ativos e verifica coleta pelo jogador.
 * Remove power-ups que expiraram ou foram coletados.
 * @param dt - delta time em segundos
 * @param playerX - posição horizontal do jogador
 * @param playerY - posição vertical do jogador
 * @param playerRadius - raio de colisão do jogador
 * @param onCollect - callback chamado ao coletar um power-up (recebe o tipo)
 */
export function updatePowerUps(dt: number, playerX: number, playerY: number, playerRadius: number, onCollect: (type: string) => void) {
  for (const key in activePowerups) {
    activePowerups[key] -= dt;
    if (activePowerups[key] <= 0) delete activePowerups[key];
  }

  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.life -= dt;
    const dx = playerX - p.x;
    const dy = playerY - p.y;
    const distance = Math.hypot(dx, dy);
    if (distance < playerRadius + 15) {
      onCollect(p.type);
      const def = POWERUP_TYPES[p.type];
      if (def.duration > 0) activePowerups[p.type] = def.duration;
      powerups.splice(i, 1);
    } else if (p.life <= 0) {
      powerups.splice(i, 1);
    }
  }
}

/**
 * Verifica se um power-up temporal está ativo.
 * @param type - tipo do power-up a verificar
 * @returns true se o power-up está ativo
 */
export function hasPowerUp(type: string): boolean {
  return !!activePowerups[type];
}

/**
 * Desenha todos os power-ups no campo de batalha com efeito de flutuação.
 * @param ctx - contexto 2D do canvas
 */
export function drawPowerUps(ctx: CanvasRenderingContext2D) {
  for (const p of powerups) {
    const def = POWERUP_TYPES[p.type];
    const bob = Math.sin(Date.now() / 200 + p.x) * 3;
    const alpha = Math.min(1, p.life / 2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = def.color;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.symbol, p.x, p.y + bob);
  }
  ctx.globalAlpha = 1;
}

/**
 * Desenha os ícones dos power-ups ativos com tempo restante.
 * Posicionados no canto superior direito da tela.
 * @param ctx - contexto 2D do canvas
 * @param width - largura do canvas
 */
export function drawActivePowerUps(ctx: CanvasRenderingContext2D, width: number) {
  let x = width - 20;
  for (const key in activePowerups) {
    const def = POWERUP_TYPES[key];
    const remaining = activePowerups[key];
    ctx.fillStyle = def.color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(x, 30, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.symbol, x, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(remaining.toFixed(1), x, 52);
    x -= 35;
  }
  ctx.globalAlpha = 1;
}
