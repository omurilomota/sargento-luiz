import { Weapon } from './types';
import { WEAPONS } from './config';

let currentWeaponIndex = 0;
let damageMultiplier = 1;
let pierceCount = 0;
let critChance = 0;

export function getCurrentWeapon(): Weapon {
  return WEAPONS[currentWeaponIndex];
}

export function setWeapon(index: number) {
  currentWeaponIndex = index;
}

export function getDamageMultiplier(): number {
  return damageMultiplier;
}

export function addDamageMultiplier(amount: number) {
  damageMultiplier += amount;
}

export function addPierce(amount: number) {
  pierceCount += amount;
}

export function addCrit(amount: number) {
  critChance += amount;
}

export function getPierceCount(): number {
  return pierceCount;
}

export function getCritChance(): number {
  return critChance;
}

export function resetWeapons() {
  currentWeaponIndex = 0;
  damageMultiplier = 1;
  pierceCount = 0;
  critChance = 0;
}

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
