/**
 * Porto vivo: água que balança, barcos que derivam e garças queandam.
 *
 * O `buildTerrain` é pré-renderizado (roda uma vez por fase), então água e
 * barcos desenhados lá ficam estáticos. Este módulo desenha a camada animada
 * POR FRAME e guarda entidades com posição/raio para colisão.
 *
 * Visual vem de sprite (regra 15). O movimento é limitado à faixa de água:
 * barco nunca cruza parede e nunca é coberto pela água (duas passagens).
 */

import { CELL_SIZE } from '../maps';
import { getSprite } from './sprites';

export interface DockCell { col: number; row: number; char: string }
export interface DockEntity {
  x: number;
  y: number;
  radius: number;
  tipo: 'barco' | 'garca';
  hp: number;
  fase: number;
}

let celulas: DockCell[] = [];
let entidades: DockEntity[] = [];
let tempo = 0;
let minX = 0, minY = 0, maxX = 0, maxY = 0;

export function initDock(rows: string[]): void {
  celulas = [];
  entidades = [];
  tempo = 0;
  minX = Infinity; minY = Infinity; maxX = 0; maxY = 0;
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      const ch = rows[row][col];
      if (ch !== '~' && ch !== 'S' && ch !== 'g') continue;
      celulas.push({ col, row, char: ch });
      minX = Math.min(minX, col * CELL_SIZE);
      minY = Math.min(minY, row * CELL_SIZE);
      maxX = Math.max(maxX, (col + 1) * CELL_SIZE);
      maxY = Math.max(maxY, (row + 1) * CELL_SIZE);
      if (ch === 'S') entidades.push({
        x: col * CELL_SIZE + CELL_SIZE / 2,
        y: row * CELL_SIZE + CELL_SIZE / 2,
        radius: 22, tipo: 'barco', hp: 60, fase: (col + row) * 0.7,
      });
      if (ch === 'g') entidades.push({
        x: col * CELL_SIZE + CELL_SIZE / 2,
        y: row * CELL_SIZE + CELL_SIZE / 2,
        radius: 8, tipo: 'garca', hp: 1, fase: col * 2,
      });
    }
  }
}

export function clearDock(): void { celulas = []; entidades = []; }

export function getDockEntities(): readonly DockEntity[] { return entidades; }

/** Dano a uma entidade do cais. Devolve true se morreu (barco afundou). */
export function damageDockEntity(e: DockEntity, dano: number): boolean {
  if (e.tipo !== 'barco') return false;
  e.hp -= dano;
  return e.hp <= 0;
}

/** Garça foge do jogador; barco só balança dentro da faixa. */
export function updateDock(dt: number, playerX: number, playerY: number): void {
  tempo += dt;
  for (const e of entidades) {
    if (e.tipo === 'garca') {
      const d = Math.hypot(playerX - e.x, playerY - e.y);
      if (d < 90 && d > 0) e.x -= ((playerX - e.x) / d) * 30 * dt;
      else e.x += Math.sin(tempo * 0.8 + e.fase) * 12 * dt;
      e.x = Math.max(minX + 10, Math.min(maxX - 10, e.x));
    } else {
      e.x += Math.sin(tempo * 0.45 + e.fase) * 2 * dt;
      e.x = Math.max(minX + e.radius, Math.min(maxX - e.radius, e.x));
    }
  }
  entidades = entidades.filter(e => e.tipo === 'garca' || e.hp > 0);
}

function desenhaSprite(ctx: CanvasRenderingContext2D, chave: string, px: number, py: number, w: number, h: number): void {
  const img = getSprite(chave);
  if (img && img.complete && img.naturalWidth > 0) ctx.drawImage(img, px, py, w, h);
}

/** Duas passagens: primeiro TODA a água, depois TODOS os barcos/garças.
 *  Assim a água da célula seguinte nunca cobre o barco da anterior. */
export function drawDock(ctx: CanvasRenderingContext2D): void {
  if (celulas.length === 0) return;

  // PASSAGEM 1 — água
  for (const c of celulas) {
    const px = c.col * CELL_SIZE;
    const py = c.row * CELL_SIZE;
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
    ctx.globalAlpha = 0.12 + 0.08 * Math.sin(tempo * 2 + c.col);
    ctx.fillStyle = '#b8d0d8';
    ctx.fillRect(px, py + CELL_SIZE * 0.4 + dy, CELL_SIZE, 3);
    ctx.restore();
  }

  // PASSAGEM 2 — entidades, com clip na faixa de água (nunca cruzam parede)
  ctx.save();
  ctx.beginPath();
  ctx.rect(minX, minY - CELL_SIZE * 0.5, maxX - minX, maxY - minY + CELL_SIZE * 0.5);
  ctx.clip();
  for (const e of entidades) {
    if (e.tipo === 'barco') {
      const bob = Math.sin(tempo * 1.2 + e.fase) * 3;
      ctx.save();
      ctx.translate(e.x, e.y + bob);
      ctx.rotate(Math.sin(tempo * 0.9 + e.fase) * 0.035);
      // ~1.4× a célula: lê como barco sem invadir o armazém
      const w = CELL_SIZE * 1.4;
      const h = CELL_SIZE * 0.9;
      desenhaSprite(ctx, e.fase % 2 < 1 ? 'prop_barco1' : 'prop_barco2', -w / 2, -h / 2, w, h);
      ctx.restore();
    } else {
      const passoY = Math.abs(Math.sin(tempo * 6 + e.fase)) * 2;
      ctx.save();
      ctx.translate(e.x, e.y - passoY);
      const s = CELL_SIZE * 0.5;
      desenhaSprite(ctx, 'prop_garca', -s / 2, -s / 2, s, s);
      ctx.restore();
    }
  }
  ctx.restore();
}
