/**
 * Granadas utilitárias — espaço separado das armas.
 *
 * Cinco tipos com efeitos distintos, 3 slots simultâneos trocados por Z/X.
 * Obtidas na loja e por drop de elite/boss. Cada efeito reaproveita sistemas
 * que já existem: fogo (explosions), cegueira (flag no Enemy), fumaça (veil).
 */

import { Enemy } from '../types';
import { ENEMY_TYPES } from '../config';
import { PALETTE } from '../core/palette';
import { createExplosion } from './explosions';
import { triggerVeil } from './effects';
import { spawnParticles } from './particles';

export type GrenadeKind = 'he' | 'molotov' | 'flash' | 'smoke' | 'multihe';

export interface GrenadeDef {
  nome: string;
  desc: string;
  preco: number;
  raio: number;
  dano: number;
  cor: string;
}

export const GRENADES: Record<GrenadeKind, GrenadeDef> = {
  he:       { nome: 'HE',        desc: 'explosão de raio médio',        preco: 60,  raio: 110, dano: 55, cor: PALETTE.terracotta },
  molotov:  { nome: 'Molotov',   desc: 'fogo no chão por 5s',           preco: 75,  raio: 90,  dano: 20, cor: '#c46a3a' },
  flash:    { nome: 'Flash',     desc: 'cega inimigos por 2.5s',        preco: 90,  raio: 180, dano: 5,  cor: PALETTE.title },
  smoke:    { nome: 'Smoke',     desc: 'nuvem que bloqueia a mira',     preco: 70,  raio: 130, dano: 0,  cor: PALETTE.stone },
  multihe:  { nome: 'Multi-HE',  desc: '3 explosões em sequência',      preco: 120, raio: 80,  dano: 38, cor: PALETTE.mustard },
};

const TIPOS = Object.keys(GRENADES) as GrenadeKind[];

/** Inventário: até 3 tipos simultâneos, cada um com contagem própria. */
let slots: { tipo: GrenadeKind; qtd: number }[] = [];
let selecionado = 0;

export function resetGrenades(): void { slots = []; selecionado = 0; }

export function getGrenadeSlots(): readonly { tipo: GrenadeKind; qtd: number }[] { return slots; }
export function getGrenadeSelecionada(): number { return selecionado; }

export function trocaGrenade(delta: number): void {
  if (slots.length === 0) return;
  selecionado = (selecionado + delta + slots.length) % slots.length;
}

export function addGrenade(tipo: GrenadeKind, qtd = 1): boolean {
  const existente = slots.find(s => s.tipo === tipo);
  if (existente) { existente.qtd += qtd; return true; }
  if (slots.length >= 3) return false;
  slots.push({ tipo, qtd });
  return true;
}

export function granadaAleatoria(rand: () => number = Math.random): GrenadeKind {
  return TIPOS[Math.floor(rand() * TIPOS.length)];
}

export interface GrenadeResult {
  dano: number;
  cegos: Enemy[];
  fogo: { x: number; y: number; radius: number; duracao: number } | null;
  fumaça: { x: number; y: number; radius: number; duracao: number } | null;
}

/** Usa a granada selecionada. Devolve os efeitos para o main aplicar. */
export function usarGrenada(x: number, y: number, enemies: Enemy[]): GrenadeResult | null {
  const slot = slots[selecionado];
  if (!slot || slot.qtd <= 0) return null;
  slot.qtd--;
  const def = GRENADES[slot.tipo];
  const resultado: GrenadeResult = { dano: 0, cegos: [], fogo: null, fumaça: null };

  switch (slot.tipo) {
    case 'he':
      createExplosion(x, y, def.raio, def.dano, enemies, def.cor, true);
      break;
    case 'multihe':
      for (let i = 0; i < 3; i++) {
        const ang = (i * Math.PI * 2) / 3;
        createExplosion(x + Math.cos(ang) * 40, y + Math.sin(ang) * 40, def.raio, def.dano, enemies, def.cor, true);
      }
      break;
    case 'molotov':
      createExplosion(x, y, def.raio, def.dano, enemies, def.cor, true);
      resultado.fogo = { x, y, radius: def.raio, duracao: 5 };
      break;
    case 'flash':
      for (const e of enemies) {
        if (Math.hypot(e.x - x, e.y - y) < def.raio) {
          e.stun = 2.5;
          e.hitFlash = 0.2;
          resultado.cegos.push(e);
        }
      }
      triggerVeil('rgba(240,240,220,0.75)', 0.25);
      break;
    case 'smoke':
      resultado.fumaça = { x, y, radius: def.raio, duracao: 6 };
      triggerVeil('rgba(120,128,130,0.3)', 0.4);
      break;
  }
  spawnParticles(x, y, def.cor, 12, 160, 'muzzle');
  if (slot.qtd <= 0) {
    slots.splice(selecionado, 1);
    selecionado = Math.max(0, Math.min(selecionado, slots.length - 1));
  }
  return resultado;
}
