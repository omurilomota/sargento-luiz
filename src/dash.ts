import { DashState } from './types';

const dashState: DashState = {
  active: false,
  cooldown: 0,
  maxCooldown: 2,
  duration: 0.3,
  speed: 800,
  invincibleTime: 0.3,
};

export function getDashState(): DashState {
  return dashState;
}

export function activateDash(): boolean {
  if (dashState.cooldown > 0 || dashState.active) {
    return false;
  }
  dashState.active = true;
  dashState.cooldown = dashState.maxCooldown;
  return true;
}

export function updateDash(dt: number): { active: boolean; speedMultiplier: number } {
  if (dashState.cooldown > 0) {
    dashState.cooldown -= dt;
  }

  if (dashState.active) {
    dashState.duration -= dt;
    if (dashState.duration <= 0) {
      dashState.active = false;
      dashState.duration = 0.3;
    }
    return { active: true, speedMultiplier: dashState.speed / 320 };
  }

  return { active: false, speedMultiplier: 1 };
}

export function resetDash() {
  dashState.active = false;
  dashState.cooldown = 0;
  dashState.duration = 0.3;
}

export function isDashInvincible(): boolean {
  return dashState.active && dashState.duration > 0;
}
