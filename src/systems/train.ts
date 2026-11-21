/**
 * Trem do Pátio de Trens —ativo, não cenário morto.
 *
 * O `maps.ts` declara `train: [...]` mas ninguém desenhava: o trem existia só
 * como dado. Aqui a locomotiva e o vagão são desenhados POR FRAME e, quando o
 * maquinista faz `rail_charge`, o comboio desce a via junto, com fumaça tóxica
 * e fagulhas de carvão. Visual vem de sprite (regra 15).
 */

import { CELL_SIZE } from '../maps';
import { getSprite } from './sprites';
import { spawnParticles } from './particles';

let ativo = false;
let baseX = 0;
let baseY = 0;
let offset = 0;
let tempo = 0;

export interface TremConfig { col: number; row: number; sprite: string }

export function initTrain(carros: TremConfig[] | undefined): void {
  ativo = !!carros && carros.length > 0;
  offset = 0;
  tempo = 0;
  if (ativo) {
    const loco = carros!.find(c => c.sprite.includes('locomotiva')) ?? carros![0];
    baseX = loco.col * CELL_SIZE;
    baseY = loco.row * CELL_SIZE;
  }
}

export function clearTrain(): void { ativo = false; }

/** Desenha o comboio. `marcha` = distância extra que o trem andou na investida. */
export function drawTrain(ctx: CanvasRenderingContext2D, marcha: number, direcao: number): void {
  if (!ativo) return;
  tempo += 1 / 60;
  const x = baseX + offset + marcha * direcao;
  const y = baseY;

  const loco = getSprite('prop_trem_locomotiva_00');
  const vagao = getSprite('prop_trem_vagao_00');
  const escala = 1;
  const w = CELL_SIZE * 4 * escala;

  if (vagao && vagao.complete && vagao.naturalWidth > 0) {
    ctx.drawImage(vagao, x - w - 6, y, w, CELL_SIZE);
  }
  if (loco && loco.complete && loco.naturalWidth > 0) {
    ctx.drawImage(loco, x, y, w, CELL_SIZE);
  }

  // fumaça tóxica saindo da chaminé (mesmo parada, a caldeira respira)
  if (Math.random() < 0.25) {
    spawnParticles(x + w * 0.45, y - 4, '#6a7a5a', 1, 60, 'smoke');
  }
  // fagulhas de carvão quando o trem está em marcha
  if (marcha > 0 && Math.random() < 0.5) {
    spawnParticles(x + w * 0.3, y + CELL_SIZE, '#c46a3a', 1, 90, 'spark');
  }
}
