export interface Vec2 { x: number; y: number; }
export interface Bullet { x: number; y: number; vx: number; vy: number; life: number; damage: number; isEnemy: boolean; color: string; pierce?: boolean; element?: string; }
export interface Enemy { x: number; y: number; radius: number; speed: number; health: number; maxHealth: number; damage: number; color: string; scoreValue: number; shootTimer: number; shootRate: number; canShoot: boolean; type: string; angle?: number; attackTimer?: number; summonTimer?: number; }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; radius: number; color: string; }
export interface Coin { x: number; y: number; value: number; life: number; vx?: number; vy?: number; }
export interface PowerUp { x: number; y: number; type: string; life: number; }
export interface Weapon { name: string; damage: number; shootRate: number; bulletSpeed: number; bulletCount: number; spread: number; color: string; price: number; pierce?: boolean; }
export interface Upgrade { name: string; effect: string; value: number; price: number; }
export interface Phase { name: string; bg: string; gridColor: string; enemyTypes: string[]; waves: number; bgColor2?: string; }
export type GameState = 'menu' | 'playing' | 'shop' | 'gameover' | 'phaseComplete';

export interface DashState {
  active: boolean;
  cooldown: number;
  maxCooldown: number;
  duration: number;
  speed: number;
  invincibleTime: number;
}

export interface UltimateState {
  charge: number;
  maxCharge: number;
  cooldown: number;
  maxCooldown: number;
  active: boolean;
  radius: number;
  damage: number;
}

export interface Material {
  type: string;
  name: string;
  color: string;
  dropRate: number;
}

export interface CraftingRecipe {
  materials: string[];
  result: string;
  resultType: 'weapon' | 'upgrade' | 'element';
}

export interface Hazard {
  type: string;
  x: number;
  y: number;
  radius: number;
  damage: number;
  effect: string;
  duration: number;
}

export interface Element {
  type: string;
  name: string;
  color: string;
  effect: string;
  duration: number;
  damage: number;
}
