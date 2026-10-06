/**
 * Sistema de armas e disparo.
 * Gerencia a arma atual, multiplicadores de dano, pierce e crítico.
 * A função shoot() cria os projéteis baseados nas propriedades da arma.
 */

import { Weapon } from './types';
import { WEAPONS, QUALITIES, rollQuality } from './config';
import { PALETTE } from './core/palette';
import { hasPowerUp } from './powerups';
import { getClassReloadMult } from './systems/classes';
import { getPieceModifiers } from './systems/pieces';

/** Qualidade de cada arma possuída (índice do WEAPONS → chave em QUALITIES). */
const weaponQualities = new Map<number, string>();

export function getWeaponQuality(index: number): string {
  return weaponQualities.get(index) ?? 'normal';
}

export function setWeaponQuality(index: number, quality: string): void {
  weaponQualities.set(index, quality);
}

export function rerollWeaponQuality(index: number): string {
  const q = rollQuality();
  weaponQualities.set(index, q);
  return q;
}

/** Cadência efetiva: base × qualidade × Reflexos (power-up) */
export function getEffectiveShootRate(): number {
  const w = WEAPONS[currentWeaponIndex];
  const q = QUALITIES[getWeaponQuality(currentWeaponIndex)] ?? QUALITIES.normal;
  let rate = w.shootRate * q.cadenceMult;
  if (hasPowerUp('reflexos')) rate *= 0.5;
  return rate;
}

/** Índice da arma atualmente equipada */
let currentWeaponIndex = 0;
/** Multiplicador de dano acumulado por upgrades */
let damageMultiplier = 1;
/** Quantidade de pierce extra acumulada por upgrades */
let pierceCount = 0;
/** Chance de acerto crítico (0-1) acumulada por upgrades */
let critChance = 0;
/** Munição atual no pente */
let currentAmmo = 0;
/** Se está recarregando */
let isReloading = false;
/** Timer de recarga restante */
let reloadTimer = 0;

/**
 * Retorna a arma atualmente equipada.
 * @returns objeto Weapon com as propriedades da arma
 */
export function getCurrentWeapon(): Weapon {
  return WEAPONS[currentWeaponIndex];
}

export function getCurrentWeaponIndex(): number {
  return currentWeaponIndex;
}

/**
 * Retorna o multiplicador de dano atual.
 * @returns valor do multiplicador (> 1 significa mais dano)
 */
export function getDamageMultiplier(): number {
  return damageMultiplier;
}

/**
 * Adiciona ao multiplicador de dano.
 * @param amount - valor a adicionar (ex: 0.25 para +25%)
 */
export function addDamageMultiplier(amount: number) {
  damageMultiplier += amount;
}

/**
 * Adiciona cargas de pierce ao total.
 * @param amount - quantidade de pierce a adicionar
 */
export function addPierce(amount: number) {
  pierceCount = Math.min(pierceCount + amount, 3);
}

/**
 * Adiciona chance de crítico.
 * @param amount - valor a adicionar (ex: 0.25 para 25% de chance)
 */
export function addCrit(amount: number) {
  critChance += amount;
}

/** Multiplicador de velocidade de recarga (menor = mais rápido) */
let reloadSpeedMultiplier = 1;

/** Disparos desde o último conserto (arma quebrada) */
let shotsSinceRepair = 0;
/** True enquanto a arma quebrada está encasquilhada */
let jammed = false;
/** Tempo restante de conserto enquanto encasquilhada */
let jamTimer = 0;
const JAM_AFTER_SHOTS = 35;
const JAM_REPAIR_TIME = 1.5;

export function isJammed(): boolean { return jammed; }

export function repairCurrentWeapon(): void {
  jammed = false;
  jamTimer = 0;
  shotsSinceRepair = 0;
}
export function getJamTimer(): number { return jamTimer; }

export function getReloadSpeedMultiplier(): number {
  return reloadSpeedMultiplier;
}

/**
 * Reduz o tempo de recarga.
 * @param amount - valor a subtrair do multiplicador (ex: 0.3 = 30% mais rápido)
 */
export function addReloadSpeed(amount: number) {
  reloadSpeedMultiplier = Math.max(0.3, reloadSpeedMultiplier - amount);
}

/**
 * Retorna a quantidade de pierce extra.
 * @returns número de cargas de pierce
 */
export function getPierceCount(): number {
  return pierceCount;
}

/**
 * Retorna a chance de crítico atual.
 * @returns valor entre 0 e 1
 */
export function getCritChance(): number {
  return critChance;
}

/**
 * Reseta arma e todos os multiplicadores para os valores iniciais.
 * Usado ao reiniciar o jogo.
 */
export function resetWeapons() {
  currentWeaponIndex = 0;
  damageMultiplier = 1;
  pierceCount = 0;
  critChance = 0;
  const pieceMods0 = getPieceModifiers(0);
  currentAmmo = Math.floor(WEAPONS[0].magazineSize * pieceMods0.magazineMult);
  isReloading = false;
  reloadTimer = 0;
  reloadSpeedMultiplier = 1;
  jammed = false;
  jamTimer = 0;
  shotsSinceRepair = 0;
}

/**
 * Retorna a munição atual no pente.
 * @returns munição restante
 */
export function getCurrentAmmo(): number {
  return currentAmmo;
}

/**
 * Retorna se a arma está recarregando.
 * @returns true se recarregando
 */
export function getIsReloading(): boolean {
  return isReloading;
}

/**
 * Retorna o timer de recarga restante.
 * @returns segundos restantes de recarga
 */
export function getReloadTimer(): number {
  return reloadTimer;
}

/**
 * Retorna se a arma pode disparar.
 * @returns true se pode disparar (tem munição e não está recarregando)
 */
export function canShoot(): boolean {
  return (currentAmmo > 0 || hasPowerUp('municaoInfinita')) && !isReloading && !jammed;
}

/**
 * Consome uma unidade de munição.
 */
export function useAmmo(): void {
  if (currentAmmo > 0) currentAmmo--;
}

/**
 * Inicia a recarga da arma atual.
 */
export function startReload(): void {
  const pieceMods = getPieceModifiers(currentWeaponIndex);
  const maxAmmo = Math.floor(WEAPONS[currentWeaponIndex].magazineSize * pieceMods.magazineMult);
  if (isReloading || currentAmmo >= maxAmmo) return;
  isReloading = true;
  reloadTimer = WEAPONS[currentWeaponIndex].reloadTime * reloadSpeedMultiplier * getClassReloadMult() * pieceMods.reloadMult;
}

/**
 * Atualiza o timer de recarga.
 * @param dt - delta time em segundos
 */
export function updateReload(dt: number): void {
  if (jammed) {
    jamTimer -= dt;
    if (jamTimer <= 0) {
      jammed = false;
      jamTimer = 0;
      shotsSinceRepair = 0;
    }
    return;
  }
  if (!isReloading) return;
  reloadTimer -= dt;
  if (reloadTimer <= 0) {
    isReloading = false;
    const pieceMods = getPieceModifiers(currentWeaponIndex);
    currentAmmo = Math.floor(WEAPONS[currentWeaponIndex].magazineSize * pieceMods.magazineMult);
    reloadTimer = 0;
  }
}

/**
 * Define a arma equipada pelo índice e recarrega.
 * @param index - índice da arma no array WEAPONS
 */
export function setWeapon(index: number) {
  currentWeaponIndex = index;
  const pieceMods = getPieceModifiers(index);
  currentAmmo = Math.floor(WEAPONS[index].magazineSize * pieceMods.magazineMult);
  isReloading = false;
  reloadTimer = 0;
  jammed = false;
  jamTimer = 0;
  shotsSinceRepair = 0;
}

/**
 * Cria projéteis a partir da arma atual.
 * Calcula dispersão, dano com crítico e cor diferenciada para acertos críticos.
 * @param x - posição horizontal de disparo
 * @param y - posição vertical de disparo
 * @param angle - ângulo de disparo em radianos
 * @param multiShot - se true, duplica a quantidade de projéteis
 * @param skillDamageMult - multiplicador de dano de habilidades (padrão: 1)
 * @returns array de objetos de projétil a serem adicionados ao sistema
 */
export function shoot(x: number, y: number, angle: number, multiShot: boolean, skillDamageMult = 1): { x: number; y: number; vx: number; vy: number; damage: number; color: string; isCrit: boolean; pierce: boolean; explosive: boolean; explosionRadius: number }[] {
  const weapon = WEAPONS[currentWeaponIndex];
  const qualityKey = getWeaponQuality(currentWeaponIndex);
  const q = QUALITIES[qualityKey] ?? QUALITIES.normal;
  const effCrit = critChance + q.critBonus;
  const count = multiShot ? weapon.bulletCount * 2 : weapon.bulletCount;
  const newBullets: ReturnType<typeof shoot> = [];
  // qualidade Quebrada: 20% de chance de a arma falhar no disparo
  if (q.failChance > 0 && Math.random() < q.failChance) {
    currentAmmo = Math.max(0, currentAmmo - 1);
    return [];
  }
  for (let i = 0; i < count; i++) {
    const pieceMods = getPieceModifiers(currentWeaponIndex);
    const spread = count > 1 ? (i - (count - 1) / 2) * weapon.spread * pieceMods.spreadMult : 0;
    const a = angle + spread * q.spreadMult;
    const isCrit = Math.random() < Math.min(effCrit, 0.6);
    const dmg = weapon.damage * damageMultiplier * skillDamageMult * q.damageMult * (isCrit ? 1.5 : 1) * pieceMods.damageMult;
    // pierce sempre custa dano: -25% no tiro perfurante
    const piercing = weapon.pierce || pierceCount > 0 || q.pierce;
    const effDmg = piercing ? dmg * 0.75 : dmg;
    newBullets.push({
      x, y,
      vx: Math.cos(a) * weapon.bulletSpeed,
      vy: Math.sin(a) * weapon.bulletSpeed,
      damage: effDmg,
      color: isCrit ? PALETTE.crit : weapon.color,
      isCrit,
      pierce: piercing,
      explosive: weapon.explosive || false,
      explosionRadius: weapon.explosionRadius || 0,
    });
  }
  currentAmmo = Math.max(0, currentAmmo - (hasPowerUp('municaoInfinita') ? 0 : 1));
  // arma quebrada encasquilha depois de N disparos — o dono precisa consertar
  if (WEAPONS[currentWeaponIndex].broken || qualityKey === 'quebrada') {
    shotsSinceRepair++;
    if (shotsSinceRepair >= JAM_AFTER_SHOTS) {
      jammed = true;
      jamTimer = JAM_REPAIR_TIME;
    }
  }
  return newBullets;
}
