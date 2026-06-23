/**
 * Sistema de armas e disparo.
 * Gerencia a arma atual, multiplicadores de dano, pierce e crítico.
 * A função shoot() cria os projéteis baseados nas propriedades da arma.
 */

import { Weapon } from './types';
import { WEAPONS } from './config';

/** Índice da arma atualmente equipada */
let currentWeaponIndex = 0;
/** Multiplicador de dano acumulado por upgrades */
let damageMultiplier = 1;
/** Quantidade de pierce extra acumulada por upgrades */
let pierceCount = 0;
/** Chance de acerto crítico (0-1) acumulada por upgrades */
let critChance = 0;

/**
 * Retorna a arma atualmente equipada.
 * @returns objeto Weapon com as propriedades da arma
 */
export function getCurrentWeapon(): Weapon {
  return WEAPONS[currentWeaponIndex];
}

/**
 * Define a arma equipada pelo índice.
 * @param index - índice da arma no array WEAPONS
 */
export function setWeapon(index: number) {
  currentWeaponIndex = index;
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
  pierceCount += amount;
}

/**
 * Adiciona chance de crítico.
 * @param amount - valor a adicionar (ex: 0.25 para 25% de chance)
 */
export function addCrit(amount: number) {
  critChance += amount;
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
}

/**
 * Cria projéteis a partir da arma atual.
 * Calcula dispersão, dano com crítico e cor diferenciada para acertos críticos.
 * @param x - posição horizontal de disparo
 * @param y - posição vertical de disparo
 * @param angle - ângulo de disparo em radianos
 * @param multiShot - se true, duplica a quantidade de projéteis
 * @returns array de objetos de projétil a serem adicionados ao sistema
 */
export function shoot(x: number, y: number, angle: number, multiShot: boolean): { x: number; y: number; vx: number; vy: number; damage: number; color: string; pierce: boolean }[] {
  const weapon = WEAPONS[currentWeaponIndex];
  const count = multiShot ? weapon.bulletCount * 2 : weapon.bulletCount;
  const newBullets = [];
  for (let i = 0; i < count; i++) {
    const spread = count > 1 ? (i - (count - 1) / 2) * weapon.spread : 0;
    const a = angle + spread;
    const isCrit = Math.random() < critChance;
    const dmg = weapon.damage * damageMultiplier * (isCrit ? 2 : 1);
    newBullets.push({
      x, y,
      vx: Math.cos(a) * weapon.bulletSpeed,
      vy: Math.sin(a) * weapon.bulletSpeed,
      damage: dmg,
      color: isCrit ? '#f1c40f' : weapon.color,
      pierce: weapon.pierce || pierceCount > 0,
    });
  }
  return newBullets;
}
