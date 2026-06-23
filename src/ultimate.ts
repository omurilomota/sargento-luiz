import { UltimateState } from './types';

const ultimateState: UltimateState = {
  charge: 0,
  maxCharge: 100,
  cooldown: 0,
  maxCooldown: 30,
  active: false,
  radius: 150,
  damage: 100,
};

export function getUltimateState(): UltimateState {
  return ultimateState;
}

export function addUltimateCharge(amount: number) {
  if (ultimateState.cooldown <= 0) {
    ultimateState.charge = Math.min(ultimateState.maxCharge, ultimateState.charge + amount);
  }
}

export function activateUltimate(): boolean {
  if (ultimateState.charge < ultimateState.maxCharge || ultimateState.cooldown > 0) {
    return false;
  }
  ultimateState.active = true;
  ultimateState.charge = 0;
  ultimateState.cooldown = ultimateState.maxCooldown;
  return true;
}

export function updateUltimate(dt: number): { active: boolean; radius: number; damage: number } {
  if (ultimateState.cooldown > 0) {
    ultimateState.cooldown -= dt;
  }

  if (ultimateState.active) {
    ultimateState.active = false;
    return { active: true, radius: ultimateState.radius, damage: ultimateState.damage };
  }

  return { active: false, radius: 0, damage: 0 };
}

export function resetUltimate() {
  ultimateState.charge = 0;
  ultimateState.cooldown = 0;
  ultimateState.active = false;
}

export function getUltimateChargePercent(): number {
  return (ultimateState.charge / ultimateState.maxCharge) * 100;
}

export function isUltimateReady(): boolean {
  return ultimateState.charge >= ultimateState.maxCharge && ultimateState.cooldown <= 0;
}
