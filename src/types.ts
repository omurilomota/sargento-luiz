export interface Vec2 { x: number; y: number; }
export interface Bullet { x: number; y: number; vx: number; vy: number; life: number; damage: number; isEnemy: boolean; color: string; pierce: boolean; }
export interface Enemy { x: number; y: number; radius: number; speed: number; health: number; maxHealth: number; damage: number; color: string; scoreValue: number; shootTimer: number; shootRate: number; canShoot: boolean; type: string; angle: number; attackTimer: number; summonTimer: number; }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; radius: number; color: string; }
export interface Coin { x: number; y: number; value: number; life: number; vx: number; vy: number; }
export interface PowerUp { x: number; y: number; type: string; life: number; }
export interface Weapon { name: string; damage: number; shootRate: number; bulletSpeed: number; bulletCount: number; spread: number; color: string; price: number; pierce: boolean; }
export interface Upgrade { name: string; effect: string; value: number; price: number; }
export interface Phase { name: string; bg: string; gridColor: string; enemyTypes: string[]; waves: number; bgColor2: string; }
export type GameState = 'menu' | 'playing' | 'shop' | 'gameover' | 'phaseComplete';
