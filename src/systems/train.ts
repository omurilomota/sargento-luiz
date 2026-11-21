/**
 * Trem do Pátio de Trens — entidade, não cenário.
 *
 * A locomotiva e o vagão têm posição própria e viajam JUNTOS (acoplados).
 * Na investida do maquinista o comboio desce a via, causa dano de contato
 * e deixa uma nuvem de fumaça tóxica que persiste e machuca quem entra.
 * Visual vem de sprite (regra 15); o dano é lido pelo main via getTrainHit().
 */

import { CELL_SIZE } from '../maps';
import { getSprite } from './sprites';
import { spawnParticles } from './particles';

export interface TremCarro { x: number; y: number; w: number; h: number; tipo: 'loco' | 'vagao' }
export interface Fumaca { x: number; y: number; radius: number; vida: number }

let ativo = false;
let baseX = 0;
let baseY = 0;
let marcha = 0;
let tempo = 0;
let carros: TremCarro[] = [];
let nuvens: Fumaca[] = [];

export interface TremConfig { col: number; row: number; sprite: string }

const W = CELL_SIZE * 4;
const H = CELL_SIZE;

export function initTrain(carrosCfg: TremConfig[] | undefined): void {
  ativo = !!carrosCfg && carrosCfg.length > 0;
  marcha = 0;
  tempo = 0;
  nuvens = [];
  carros = [];
  if (!ativo) return;
  const loco = carrosCfg!.find(c => c.sprite.includes('locomotiva')) ?? carrosCfg![0];
  baseX = loco.col * CELL_SIZE;
  baseY = loco.row * CELL_SIZE;
  // vagão ACOPLADO: sempre atrás da locomotiva, mesma marcha
  carros = [
    { x: baseX, y: baseY, w: W, h: H, tipo: 'loco' },
    { x: baseX - W - 6, y: baseY, w: W, h: H, tipo: 'vagao' },
  ];
}

export function clearTrain(): void { ativo = false; carros = []; nuvens = []; }

export function avancaTrem(dt: number, emMarcha: boolean, direcao: number): void {
  if (!ativo) return;
  tempo += dt;
  if (emMarcha) marcha += 140 * dt;
  else marcha = Math.max(0, marcha - 30 * dt);
  for (const c of carros) {
    c.x = (c.tipo === 'loco' ? baseX : baseX - W - 6) + marcha * direcao;
  }
  // fumaça tóxica: sai da chaminé e fica no ar por ~4s
  if (emMarcha && Math.random() < dt * 12) {
    nuvens.push({
      x: carros[0].x + W * 0.5 + (Math.random() - 0.5) * 30,
      y: carros[0].y - 10,
      radius: 34 + Math.random() * 16,
      vida: 4,
    });
  }
  for (const n of nuvens) n.vida -= dt;
  nuvens = nuvens.filter(n => n.vida > 0);
}

/** Dano ao jogador neste frame (locomotiva/vagão + fumaça). */
export function getTrainHit(px: number, py: number, pr: number): number {
  if (!ativo) return 0;
  let dano = 0;
  for (const c of carros) {
    // retângulo do casco: testa círculo-vs-retângulo simples
    const cx = Math.max(c.x, Math.min(px, c.x + c.w));
    const cy = Math.max(c.y, Math.min(py, c.y + c.h));
    if (Math.hypot(px - cx, py - cy) < pr) dano = Math.max(dano, 18);
  }
  for (const n of nuvens) {
    if (Math.hypot(px - n.x, py - n.y) < n.radius + pr) dano = Math.max(dano, 6);
  }
  return dano;
}

/** Empurra o jogador para fora do casco do trem. */
export function pushOutOfTrain(px: number, py: number, pr: number): { x: number; y: number } {
  for (const c of carros) {
    const cx = Math.max(c.x, Math.min(px, c.x + c.w));
    const cy = Math.max(c.y, Math.min(py, c.y + c.h));
    const d = Math.hypot(px - cx, py - cy);
    if (d >= pr) continue;
    const nx = (px - cx) / (d || 1);
    const ny = (py - cy) / (d || 1);
    return { x: cx + nx * (pr + 1), y: cy + ny * (pr + 1) };
  }
  return { x: px, y: py };
}

export function marchaTrem(): number { return Math.round(marcha); }

export function drawTrain(ctx: CanvasRenderingContext2D): void {
  if (!ativo) return;
  // nuvens tóxicas primeiro, atrás do comboio
  for (const n of nuvens) {
    ctx.globalAlpha = Math.min(0.4, n.vida / 4 * 0.4);
    ctx.fillStyle = '#6a7a5a';
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const c of carros) {
    const chave = c.tipo === 'loco' ? 'prop_trem_locomotiva_00' : 'prop_trem_vagao_00';
    const img = getSprite(chave);
    if (!img || !img.complete || !img.naturalWidth) continue;
    ctx.save();
    if (c.tipo === 'loco') {
      ctx.translate(c.x + c.w / 2, c.y + c.h / 2 + Math.sin(tempo * 1.2) * 2);
      ctx.drawImage(img, -c.w / 2, -c.h / 2, c.w, c.h);
    } else {
      ctx.drawImage(img, c.x, c.y, c.w, c.h);
    }
    ctx.restore();
  }
  // fagulhas de carvão em marcha
  if (marcha > 0 && Math.random() < 0.5) {
    spawnParticles(carros[0].x + W * 0.3, carros[0].y + H, '#c46a3a', 1, 90, 'spark');
  }
}
