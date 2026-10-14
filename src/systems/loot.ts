/**
 * src/systems/loot.ts
 *
 * Caixas de loot com raridade. Inimigos comuns dropam com chance baixa;
 * o boss sempre deixa uma caixa ESPECIAL — essa revela a recompensa na hora.
 *
 * Caixas comuns coletadas vão para a NOVIDADES da loja: o jogador só aprende
 * o que era ao abrir a loja depois da fase (arma com qualidade), e decide
 * Manter (entra no inventário, limite 3+equipada) ou Vender. Power-ups da
 * caixa valem na hora.
 */

import { spawnParticles } from './particles';
import { PALETTE } from '../core/palette';
import { WEAPONS, POWERUP_TYPES, rollQuality } from '../config';
import { pushOutOfWalls } from './tilemap';
import { PICKUP_RADIUS } from '../core/constants';
import { getStat } from '../core/stats';

export type LootTier = 'sucata' | 'usavel' | 'militar' | 'prototipo';

export interface LootBox {
  x: number;
  y: number;
  tier: LootTier;
  especial: boolean;
  life: number;
}

const TIER_COLOR: Record<LootTier, string> = {
  sucata: '#6a6a6a',
  usavel: PALETTE.moss,
  militar: PALETTE.stone,
  prototipo: PALETTE.mustard,
};

/** Recompensa concreta da caixa, já resolvida no momento da coleta */
export type LootReward =
  | { kind: 'powerup'; type: string }
  | { kind: 'weapon'; index: number; quality: string }
  | { kind: 'medkit' };

let boxes: LootBox[] = [];

export function getLoot(): LootBox[] { return boxes; }
export function clearLoot(): void { boxes = []; }

const POWERUP_KEYS = Object.keys(POWERUP_TYPES);

function randomPowerup(): string {
  return POWERUP_KEYS[Math.floor(Math.random() * POWERUP_KEYS.length)];
}

function randomWeaponIndex(): number {
  // evita a pistola padrão e o BFG secreto
  const candidates = WEAPONS.map((_, i) => i).filter(i => i !== 0 && !WEAPONS[i].secret);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Resolve o conteúdo de uma caixa pelo tier */
function rollLoot(tier: LootTier): LootReward {
  const r = Math.random();
  const weaponChance = tier === 'sucata' ? 0 : tier === 'usavel' ? 0.1 : tier === 'militar' ? 0.3 : 0.9;
  const boost = tier === 'prototipo' ? 2 : tier === 'militar' ? 1 : 0;
  if (r < weaponChance) {
    return { kind: 'weapon', index: randomWeaponIndex(), quality: rollQuality(boost, Math.round(getStat('luck'))) };
  }
  if (Math.random() < 0.08) return { kind: 'medkit' };
  return { kind: 'powerup', type: randomPowerup() };
}

export const ELITE_TYPES = new Set(['tank', 'magmaGolem', 'crystal', 'knight', 'drone']);

/**
 * Tenta dropar loot de um inimigo comum morto.
 *
 * `isElite` estende o tratamento de `ELITE_TYPES` para o TITÃ da onda (T1):
 * o titã é uma VARIANTE de um tipo comum, então o nome do tipo não diz nada
 * — quem paga a taxa elite de 15% (e as peças de tiers altos) é o corpo
 * grande, não o nome dele.
 */
export function rollLootDrop(x: number, y: number, type?: string, isElite = false, boostDeFase = 1): void {
  const elite = isElite || (type !== undefined && ELITE_TYPES.has(type));
  const r = Math.random();
  let tier: LootTier | null = null;
  const eliteRate = 0.15 * boostDeFase;
  const commonRate = 0.05 * boostDeFase;
  if (elite) {
    if (r < eliteRate * 0.12) tier = 'prototipo';
    else if (r < eliteRate * 0.4) tier = 'militar';
    else if (r < eliteRate * 0.75) tier = 'usavel';
    else if (r < eliteRate) tier = 'sucata';
  } else {
    if (r < commonRate * 0.12) tier = 'prototipo';
    else if (r < commonRate * 0.4) tier = 'militar';
    else if (r < commonRate * 0.75) tier = 'usavel';
    else if (r < commonRate) tier = 'sucata';
  }
  if (!tier) return;
  const at = pushOutOfWalls(x, y, PICKUP_RADIUS);
  boxes.push({ x: at.x, y: at.y, tier, especial: false, life: 14 });
}

/** Caixa especial do boss: conteúdo resolvido imediatamente */
export function spawnBossLoot(x: number, y: number): { kind: 'weapon'; index: number; quality: string; x: number; y: number } {
  // O Destruidor NÃO sai daqui. Ele é entregue na ENTRADA da fase 9, junto com
  // o traje de contenção: a arma da vingança entrava como caixa sorteada
  // depois da luta, quando o NÚCLEO já estava no chão — ou seja, quando não
  // havia mais o que usar. Nos outros chefes o Destruidor segue fora do pool
  // (é `secret`), então esta caixa sorteia entre as armas comuns.
  const r = Math.random();
  if (r < 0.25) {
    return { kind: 'weapon', index: WEAPONS.findIndex(w => w.name === 'M. Quebrada'), quality: 'quebrada', x, y };
  }
  if (r < 0.5) {
    return { kind: 'weapon', index: WEAPONS.findIndex(w => w.name === 'RPG'), quality: 'boa', x, y };
  }
  if (r < 0.75) {
    return { kind: 'weapon', index: WEAPONS.findIndex(w => w.name === 'BFG'), quality: 'ascendente', x, y };
  }
  // O `secret` fica fora do sorteio: o Destruidor é entregue na entrada da
  // fase 9, e uma caixa que o sorteia de novo devolveria o bug que este
  // conserto tirou — só que agora com "lendária" em cima, o que é pior.
  const pool = WEAPONS.map((_, i) => i).filter(i => i !== 0 && !WEAPONS[i].secret);
  return { kind: 'weapon', index: pool[Math.floor(Math.random() * pool.length)], quality: 'lendaria', x, y };
}

/**
 * Atualiza caixas (vida) e coleta por proximidade.
 * @returns recompensa coletada neste frame (para UI/loja) ou null
 */
export function updateLoot(dt: number, px: number, py: number, pr: number): LootReward | null {
  let got: LootReward | null = null;
  for (let i = boxes.length - 1; i >= 0; i--) {
    const b = boxes[i];
    b.life -= dt;
    if (b.life <= 0) { boxes.splice(i, 1); continue; }
    if (Math.hypot(px - b.x, py - b.y) < pr + 16) {
      boxes.splice(i, 1);
      spawnParticles(b.x, b.y, b.especial ? PALETTE.mustard : TIER_COLOR[b.tier], 12, 180, 'muzzle');
      got = rollLoot(b.tier);
    }
  }
  return got;
}

export function drawLoot(
  boxes: LootBox[],
  ctx: CanvasRenderingContext2D,
  isVisible: (x: number, y: number, r: number) => boolean,
): void {
  for (const b of boxes) {
    if (!isVisible(b.x, b.y, 30)) continue;
    const color = b.especial ? PALETTE.mustard : TIER_COLOR[b.tier];
    const s = b.especial ? 13 : 10;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y + s * 0.7, s, s * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(b.x - s, b.y - s, s * 2, s * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x - s, b.y - s, s * 2, s * 2);
    ctx.beginPath();
    ctx.moveTo(b.x - s, b.y); ctx.lineTo(b.x + s, b.y);
    ctx.moveTo(b.x, b.y - s); ctx.lineTo(b.x, b.y + s);
    ctx.stroke();
    if (b.especial) {
      ctx.strokeStyle = PALETTE.mustard;
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 300) * 0.3;
      ctx.strokeRect(b.x - s - 4, b.y - s - 4, s * 2 + 8, s * 2 + 8);
      ctx.globalAlpha = 1;
    }
  }
}

/** Rótulo do tipo de power-up, para feedback de coleta */
export function powerupLabel(type: string): string {
  const labels: Record<string, string> = {
    health: 'VIDA +30', speed: 'VELOCIDADE', damage: 'DANO +50%', shield: 'ESCUDO',
    magnet: 'ÍMÃ', multiShot: 'TIRO DUPLO', invincible: 'INVENCÍVEL', furia: 'FÚRIA',
    peleDePedra: 'PELE DE PEDRA', botas: 'BOTAS ALADAS', municaoInfinita: 'MUNIÇÃO INF.',
    reflexos: 'REFLEXOS',
    trajeNucleo: 'TRAJE DE CONTENÇÃO',
  };
  return labels[type] ?? type;
}
