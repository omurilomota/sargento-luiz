// src/types.ts
export interface Vec2 { x: number; y: number; }

export interface Bullet {
  x: number; y: number; vx: number; vy: number;
  life: number; damage: number; isEnemy: boolean;
  color: string; pierce: boolean;
}

export interface Enemy {
  x: number; y: number; radius: number; speed: number;
  health: number; maxHealth: number; damage: number;
  color: string; scoreValue: number; shootTimer: number;
  shootRate: number; canShoot: boolean; type: string;
  angle: number; attackTimer: number; summonTimer: number;
}

export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; radius: number; color: string;
}

export interface Coin {
  x: number; y: number; value: number; life: number;
  vx: number; vy: number;
}

export interface PowerUp {
  x: number; y: number; type: string; life: number;
}

export interface Weapon {
  name: string; damage: number; shootRate: number;
  bulletSpeed: number; bulletCount: number; spread: number;
  color: string; price: number; pierce: boolean;
}

export interface Upgrade {
  name: string; effect: string; value: number; price: number;
}

export interface Phase {
  name: string; bg: string; bgColor2: string; gridColor: string;
  enemyTypes: string[]; waves: number;
}

export interface EnemyType {
  radius: number; speed: number; health: number; damage: number;
  color: string; scoreValue: number; coinDrop: number;
  canShoot?: boolean; shootRate?: number; isBoss?: boolean;
  armor?: boolean; spreadShot?: boolean; splitBullet?: boolean;
  summons?: boolean; leavesFire?: boolean;
  projectileColor?: string;
}

export type GameStateType = 'menu' | 'playing' | 'shop' | 'gameover';
