/**
 * Registro central de stats do jogador.
 *
 * Antes, cada stat acumulável era um `let` solto no módulo que o usava
 * (damageMultiplier, pierceCount, critChance e reloadSpeedMultiplier em
 * weapons.ts; armorLevel e regenLevel em player.ts) e cada perk novo nascia
 * como um addX() a mais espalhado. Aqui o perk fala `applyStat('damageMult',
 * 0.08)` e o clamp mora num lugar só.
 *
 * O que NÃO mora aqui, de propósito:
 * - `maxHealth` e `speed`: estado da entidade Player. O combo de vida grava o
 *   delta direto no `player.maxHealth` (baking em setComboHealthMultiplier);
 *   mover a autoridade para cá mudaria o comportamento do combo.
 * - Escudo vivo: `player.shield` decrementa ao bloquear. `shieldCharges` entra
 *   aqui quando a escada de perks (Sprint 5) definir o teto de cargas.
 * - Medkits: inventário, não stat.
 */

export type StatId =
  | 'damageMult'
  | 'critChance'
  | 'critMult'
  | 'pierce'
  | 'reloadSpeed'
  | 'armor'
  | 'armorMax'
  | 'regen'
  | 'coinMult'
  | 'xpMult'
  | 'luck'
  | 'dashCooldown';

interface StatDef {
  /** Valor em partida nova */
  initial: number;
  /** Clamp superior (ausente = sem teto) */
  max?: number;
  /** Clamp inferior (ausente = sem piso) */
  min?: number;
}

const STAT_DEFS: Record<StatId, StatDef> = {
  // os 6 de antes, com os mesmos clamps que os add* faziam à mão
  damageMult:  { initial: 1 },
  critChance:  { initial: 0, max: 0.6 },
  pierce:      { initial: 0, max: 3 },
  reloadSpeed: { initial: 1, min: 0.3 },
  armor:       { initial: 0 },
  regen:       { initial: 0 },
  // os próximos: a escada de perks (5), os combos (6) e a moral/sorte (7)
  critMult:    { initial: 1.5 },
  armorMax:    { initial: 0.5 },
  coinMult:    { initial: 1 },
  xpMult:      { initial: 1 },
  luck:        { initial: 0 },
  dashCooldown: { initial: 1, min: 0.5 },
};

const stats: Record<StatId, number> = Object.fromEntries(
  (Object.keys(STAT_DEFS) as StatId[]).map(id => [id, STAT_DEFS[id].initial])
) as Record<StatId, number>;

export function getStat(id: StatId): number {
  return stats[id];
}

/**
 * Aplica `value` ao stat e devolve o valor final já com clamp.
 * `armor` usa o teto vivo de `armorMax` — um perk pode levantar o teto.
 */
export function applyStat(id: StatId, value: number): number {
  stats[id] += value;
  const max = id === 'armor' ? stats.armorMax : (STAT_DEFS[id].max ?? Infinity);
  const min = STAT_DEFS[id].min ?? -Infinity;
  stats[id] = Math.min(Math.max(stats[id], min), max);
  return stats[id];
}

/** Volta um stat ao valor de partida nova. */
export function resetStat(id: StatId): void {
  stats[id] = STAT_DEFS[id].initial;
}

/** Zera o registro inteiro. Partida nova. */
export function resetStats(): void {
  for (const id of Object.keys(stats) as StatId[]) resetStat(id);
}
