import { Weapon } from './types';
import { WEAPONS } from './config';

let currentWeaponIndex = 0;
let damageMultiplier = 1;

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

export function resetWeapons() {
  currentWeaponIndex = 0;
  damageMultiplier = 1;
}

export function shoot(x: number, y: number, angle: number): { x: number; y: number; vx: number; vy: number; damage: number; color: string }[] {
  const weapon = WEAPONS[currentWeaponIndex];
  const newBullets = [];
  for (let i = 0; i < weapon.bulletCount; i++) {
    const spread = weapon.bulletCount > 1 ? (i - (weapon.bulletCount - 1) / 2) * weapon.spread : 0;
    const a = angle + spread;
    newBullets.push({
      x, y,
      vx: Math.cos(a) * weapon.bulletSpeed,
      vy: Math.sin(a) * weapon.bulletSpeed,
      damage: weapon.damage * damageMultiplier,
      color: weapon.color,
    });
  }
  return newBullets;
}
