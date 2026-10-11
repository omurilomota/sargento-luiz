/**
 * Sistema de power-ups.
 * Gerencia a criação, atualização, coleta e duração de power-ups.
 * Power-ups são dropados aleatoriamente ao derrotar inimigos.
 */

import { PowerUp } from './types';
import { POWERUP_TYPES } from './config';
import { rand } from './utils';
import { pushOutOfWalls } from './systems/tilemap';
import { PICKUP_RADIUS, POWERUP_LIFE } from './core/constants';

/** Lista de power-ups ativos no campo de batalha */
export const powerups: PowerUp[] = [];
/** Mapa de power-ups temporários ativos e seus tempos restantes (segundos) */
export const activePowerups: Record<string, number> = {};

/** Limpa o campo e os power-ups ativos. Usado no reset de partida. */
export function resetPowerUps(): void {
  powerups.length = 0;
  for (const k in activePowerups) delete activePowerups[k];
}

/**
 * Power-ups que NÃO entram no sorteio do drop comum.
 *
 * `invincible` dá 4s de imunidade total — tiro, contato, hazard, tudo — e um
 * inimigo comum sorteado entre 12 tipos o entregava sem esforço. Tirar do
 * sorteio não remove a mecânica: o chefe ainda pode dropar (ver `spawnPowerUpDeChefe`).
 */
const SEM_SORTEIO = ['invincible'];
// trajeNucleo também fica fora do sorteio comum: é exclusivo da fase do NÚCLEO,
// entregue por spawn direto — nunca por queda de inimigo aleatório.
SEM_SORTEIO.push('trajeNucleo');

/**
 * Cria um power-up aleatório na posição especificada.
 * O tipo é escolhido aleatoriamente entre todos os tipos disponíveis.
 */
export function spawnPowerUp(x: number, y: number) {
  const tipos = Object.keys(POWERUP_TYPES).filter(t => !SEM_SORTEIO.includes(t));
  const type = tipos[Math.floor(rand(0, tipos.length))];
  const at = pushOutOfWalls(x, y, PICKUP_RADIUS);
  powerups.push({ x: at.x, y: at.y, type, life: POWERUP_LIFE });
}

/**
 * Spawna um power-up de um tipo específico (não sorteado).
 * Usado pelo traje de contenção da fase do NÚCLEO: um item de roteiro, não uma
 * queda aleatória. Ainda passa pelo `pushOutOfWalls` — não pode nascer dentro
 * de uma parede.
 */
export function spawnPowerUpDeTipo(x: number, y: number, type: string) {
  const def = POWERUP_TYPES[type];
  if (!def) return;
  const at = pushOutOfWalls(x, y, PICKUP_RADIUS);
  powerups.push({ x: at.x, y: at.y, type, life: POWERUP_LIFE });
}

/**
 * Power-up de chefe: aqui o sorteio inclui `invincible`, porque o chefe já é
 * a recompensa por limpar a fase.
 */
export function spawnPowerUpDeChefe(x: number, y: number) {
  const tipos = Object.keys(POWERUP_TYPES);
  const type = tipos[Math.floor(rand(0, tipos.length))];
  const at = pushOutOfWalls(x, y, PICKUP_RADIUS);
  powerups.push({ x: at.x, y: at.y, type, life: POWERUP_LIFE });
}

/**
 * Atualiza duração dos power-ups ativos e verifica coleta pelo jogador.
 * Remove power-ups que expiraram ou foram coletados.
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
 * @returns true se o power-up está ativo
 */
export function hasPowerUp(type: string): boolean {
  return !!activePowerups[type];
}
