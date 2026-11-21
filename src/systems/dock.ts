/**
 * Porto vivo: água que balança, barcos que derivam e garças que andam.
 *
 * O `buildTerrain` é pré-renderizado (roda uma vez por fase), então água e
 * barcos desenhados lá ficam estáticos para sempre. Este módulo desenha a
 * camada animada POR FRAME, em cima do terreno, só quando a fase é o Porto.
 * Visual vem de sprite (regra 15) — o movimento é só translate/offset.
 */

import { CELL_SIZE } from '../maps';
import { getSprite } from './sprites';

export interface DockCell { col: number; row: number; char: string }

let celulas: DockCell[] = [];
let tempo = 0;

/** Chamado no load da fase com as células '~', 'S' e 'g' do mapa. */
export function initDock(rows: string[]): void {
  celulas = [];
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      const ch = rows[row][col];
      if (ch === '~' || ch === 'S' || ch === 'g') celulas.push({ col, row, char: ch });
    }
  }
  tempo = 0;
}

export function clearDock(): void { celulas = []; }

function desenhaSprite(ctx: CanvasRenderingContext2D, chave: string, px: number, py: number, w: number, h: number): void {
  const img = getSprite(chave);
  if (img && img.complete && img.naturalWidth > 0) ctx.drawImage(img, px, py, w, h);
}

/** Desenha a camada viva do cais. Chamado depois do drawTerrain. */
export function drawDock(ctx: CanvasRenderingContext2D): void {
  if (celulas.length === 0) return;
  tempo += 1 / 60;

  for (const c of celulas) {
    const px = c.col * CELL_SIZE;
    const py = c.row * CELL_SIZE;
    // água: dois tiles com offset senoidal defasado — o balanço é o deslocamento
    if (c.char === '~' || c.char === 'S' || c.char === 'g') {
      const onda = Math.sin(tempo * 1.6 + c.col * 0.5 + c.row * 0.7);
      const dy = onda * 2.5;
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, CELL_SIZE, CELL_SIZE);
      ctx.clip();
      const img = getSprite((c.col + c.row) % 2 === 0 ? 'tile_19' : 'tile_20');
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, px - 3 + dy, py - 3 + dy, CELL_SIZE + 6, CELL_SIZE + 6);
      }
      // brilho da crista andando
      ctx.globalAlpha = 0.12 + 0.08 * Math.sin(tempo * 2 + c.col);
      ctx.fillStyle = '#b8d0d8';
      ctx.fillRect(px, py + CELL_SIZE * 0.4 + dy, CELL_SIZE, 3);
      ctx.restore();
    }

    if (c.char === 'S') {
      // barco: balanço vertical + deriva horizontal pequena
      const bob = Math.sin(tempo * 1.2 + c.col) * 3;
      const deriva = Math.sin(tempo * 0.45 + c.row) * 5;
      ctx.save();
      ctx.translate(deriva, bob);
      ctx.rotate(Math.sin(tempo * 0.9 + c.col) * 0.035);
      desenhaSprite(ctx, (c.col % 2 === 0) ? 'prop_barco1' : 'prop_barco2', px, py - CELL_SIZE * 0.5, CELL_SIZE * 1.2, CELL_SIZE * 2);
      ctx.restore();
    }

    if (c.char === 'g') {
      // garça: caminha de um lado pro outro com passo curto e inclina o corpo
      const passo = Math.sin(tempo * 0.8 + c.col * 2);
      const x = px + passo * CELL_SIZE * 0.4;
      const passoY = Math.abs(Math.sin(tempo * 6 + c.col)) * 2;
      ctx.save();
      ctx.translate(x, py - passoY);
      ctx.scale(passo >= 0 ? 1 : -1, 1); // olha na direção em que anda
      desenhaSprite(ctx, 'prop_garca', px - x + 2, py - CELL_SIZE * 0.55, CELL_SIZE * 0.6, CELL_SIZE * 0.6);
      ctx.restore();
    }
  }
}
