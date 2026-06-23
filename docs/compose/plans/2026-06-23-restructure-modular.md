# BubbleGame Modular Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure BubbleGame from a monolithic main.ts into modular, well-typed, performant code

**Architecture:** Split into core (game state, events), systems (renderer, collision, spawner, particles), entities (player, enemy, bullet, coin), ui (menu, shop, hud, gameover), and data (config, types, utils). Centralize state management, add proper types, optimize performance.

**Tech Stack:** TypeScript + Vite + Canvas 2D

---

## File Structure

```
src/
├── main.ts              ← Game loop + input (~80 lines)
├── core/
│   ├── gameState.ts     ← State machine centralizada
│   ├── eventBus.ts      ← Eventos entre módulos
│   └── constants.ts     ← Constantes hardcoded
├── systems/
│   ├── renderer.ts      ← Toda renderização canvas
│   ├── collision.ts     ← Detecção de colisão
│   ├── spawner.ts       ← Wave/phase spawner
│   └── particles.ts     ← Sistema de partículas com limite
├── entities/
│   ├── player.ts        ← Player state e lógica
│   ├── enemy.ts         ← Enemy types + comportamento
│   ├── bullet.ts        ← Bullet pool
│   └── coin.ts          ← Coin drops
├── ui/
│   ├── menu.ts          ← Tela de menu
│   ├── shop.ts          ← Loja de upgrades/armas
│   ├── hud.ts           ← HUD (health, score, wave)
│   └── gameover.ts      ← Tela de game over
├── weapons.ts           ← Sistema de armas
├── powerups.ts          ← Powerups
├── config.ts            ← Dados com tipos corretos
├── types.ts             ← Interfaces
└── utils.ts             ← Math utilities
```

---

### Task 1: Core - Game State Machine + Event Bus + Constants

**Files:**
- Create: `src/core/gameState.ts`
- Create: `src/core/eventBus.ts`
- Create: `src/core/constants.ts`

- [ ] **Step 1: Create gameState.ts**

```typescript
// src/core/gameState.ts
export type GameState = 'menu' | 'playing' | 'shop' | 'gameover';

let state: GameState = 'menu';

export function getState(): GameState {
  return state;
}

export function setState(newState: GameState): void {
  state = newState;
}
```

- [ ] **Step 2: Create eventBus.ts**

```typescript
// src/core/eventBus.ts
type EventHandler = (data: any) => void;

const handlers: Record<string, EventHandler[]> = {};

export function on(event: string, handler: EventHandler): void {
  if (!handlers[event]) handlers[event] = [];
  handlers[event].push(handler);
}

export function off(event: string, handler: EventHandler): void {
  if (!handlers[event]) return;
  handlers[event] = handlers[event].filter(h => h !== handler);
}

export function emit(event: string, data?: any): void {
  if (!handlers[event]) return;
  for (const handler of handlers[event]) {
    handler(data);
  }
}

export function clearAll(): void {
  for (const key in handlers) {
    handlers[key] = [];
  }
}
```

- [ ] **Step 3: Create constants.ts**

```typescript
// src/core/constants.ts
export const MAX_PARTICLES = 500;
export const MAX_BULLETS = 200;
export const MAX_ENEMIES = 30;
export const PLAYER_BASE_SPEED = 320;
export const PLAYER_BASE_HEALTH = 100;
export const PLAYER_RADIUS = 18;
export const COLLECT_RADIUS = 12;
export const MAGNET_RADIUS = 120;
export const MAGNET_SPEED = 400;
export const COMBO_TIMEOUT = 2;
export const INVINCIBLE_DURATION = 0.5;
export const BULLET_INVINCIBLE_DURATION = 0.3;
export const BULLET_LIFE = 2;
export const COIN_LIFE = 20;
export const POWERUP_LIFE = 12;
export const WAVE_BASE_ENEMIES = 8;
export const WAVE_ENEMIES_PER_LEVEL = 3;
export const WAVE_BASE_SPAWN_RATE = 0.8;
export const WAVE_SPAWN_RATE_DECAY = 0.05;
export const WAVE_MIN_SPAWN_RATE = 0.2;
export const WAVE_HEAL_ON_COMPLETE = 15;
export const WAVE_SCALE_PER_LEVEL = 0.1;
```

- [ ] **Step 4: Verify no errors**

Run: `npx tsc --noEmit`
Expected: No errors (these are new files, no imports yet)

- [ ] **Step 5: Commit**

```bash
git add src/core/
git commit -m "feat: add core modules - gameState, eventBus, constants"
```

---

### Task 2: Update Types + Config with Proper Types

**Files:**
- Modify: `src/types.ts`
- Modify: `src/config.ts`

- [ ] **Step 1: Update types.ts**

```typescript
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
```

- [ ] **Step 2: Update config.ts**

Replace the entire config.ts content with:

```typescript
// src/config.ts
import { Phase, Weapon, Upgrade, EnemyType } from './types';

export const PHASES: Phase[] = [
  { name: 'Floresta', bg: '#1a2e1a', bgColor2: '#0d1a0d', gridColor: 'rgba(34,139,34,0.1)', enemyTypes: ['grunt', 'runner', 'spitter'], waves: 4 },
  { name: 'Caverna', bg: '#1a1a2e', bgColor2: '#0d0d1a', gridColor: 'rgba(100,100,150,0.1)', enemyTypes: ['grunt', 'runner', 'tank', 'bat', 'crystal'], waves: 5 },
  { name: 'Fábrica', bg: '#2e1a1a', bgColor2: '#1a0d0d', gridColor: 'rgba(150,100,100,0.1)', enemyTypes: ['grunt', 'runner', 'tank', 'robot', 'drone'], waves: 5 },
  { name: 'Pântano', bg: '#1a2e2e', bgColor2: '#0d1a1a', gridColor: 'rgba(34,150,150,0.1)', enemyTypes: ['grunt', 'slime', 'mosquito', 'frog'], waves: 6 },
  { name: 'Castelo', bg: '#2e2e1a', bgColor2: '#1a1a0d', gridColor: 'rgba(150,150,100,0.1)', enemyTypes: ['knight', 'archer', 'mage', 'boss'], waves: 6 },
  { name: 'Vulcão', bg: '#2e0d0d', bgColor2: '#1a0505', gridColor: 'rgba(200,50,50,0.1)', enemyTypes: ['fireElemental', 'lavaSlime', 'magmaGolem', 'inferno'], waves: 7 },
  { name: 'Espaço', bg: '#05050d', bgColor2: '#020208', gridColor: 'rgba(100,100,200,0.05)', enemyTypes: ['ufo', 'asteroid', 'alien', 'mothership'], waves: 7 },
];

export const ENEMY_TYPES: Record<string, EnemyType> = {
  grunt: { radius: 16, speed: 80, health: 20, damage: 10, color: '#e74c3c', scoreValue: 10, coinDrop: 2 },
  runner: { radius: 12, speed: 160, health: 10, damage: 8, color: '#e67e22', scoreValue: 15, coinDrop: 3 },
  tank: { radius: 26, speed: 50, health: 80, damage: 20, color: '#8e44ad', scoreValue: 30, coinDrop: 5 },
  shooter: { radius: 14, speed: 60, health: 30, damage: 5, color: '#2980b9', scoreValue: 25, coinDrop: 4, canShoot: true, shootRate: 2.0 },
  bat: { radius: 10, speed: 120, health: 15, damage: 6, color: '#9b59b6', scoreValue: 12, coinDrop: 2 },
  robot: { radius: 18, speed: 70, health: 50, damage: 12, color: '#7f8c8d', scoreValue: 35, coinDrop: 6, canShoot: true, shootRate: 1.5 },
  slime: { radius: 20, speed: 60, health: 25, damage: 8, color: '#1abc9c', scoreValue: 20, coinDrop: 3 },
  boss: { radius: 45, speed: 35, health: 500, damage: 30, color: '#c0392b', scoreValue: 200, coinDrop: 40, canShoot: true, shootRate: 0.8, isBoss: true },
  spitter: { radius: 14, speed: 70, health: 18, damage: 4, color: '#27ae60', scoreValue: 18, coinDrop: 3, canShoot: true, shootRate: 1.5, projectileColor: '#27ae60' },
  crystal: { radius: 22, speed: 40, health: 60, damage: 15, color: '#3498db', scoreValue: 40, coinDrop: 7, canShoot: true, shootRate: 3.0, splitBullet: true },
  drone: { radius: 11, speed: 100, health: 12, damage: 5, color: '#95a5a6', scoreValue: 14, coinDrop: 2 },
  mosquito: { radius: 8, speed: 200, health: 8, damage: 4, color: '#d35400', scoreValue: 8, coinDrop: 1 },
  frog: { radius: 18, speed: 90, health: 22, damage: 10, color: '#2ecc71', scoreValue: 22, coinDrop: 3, canShoot: true, shootRate: 2.5 },
  knight: { radius: 20, speed: 65, health: 45, damage: 18, color: '#bdc3c7', scoreValue: 35, coinDrop: 5, armor: true },
  archer: { radius: 13, speed: 55, health: 20, damage: 8, color: '#e67e22', scoreValue: 28, coinDrop: 4, canShoot: true, shootRate: 1.2 },
  mage: { radius: 15, speed: 50, health: 25, damage: 12, color: '#9b59b6', scoreValue: 45, coinDrop: 8, canShoot: true, shootRate: 2.0 },
  fireElemental: { radius: 17, speed: 85, health: 28, damage: 12, color: '#e74c3c', scoreValue: 30, coinDrop: 4, canShoot: true, shootRate: 1.8, leavesFire: true },
  lavaSlime: { radius: 22, speed: 45, health: 35, damage: 10, color: '#d35400', scoreValue: 25, coinDrop: 4 },
  magmaGolem: { radius: 30, speed: 35, health: 120, damage: 25, color: '#c0392b', scoreValue: 60, coinDrop: 10, armor: true },
  inferno: { radius: 16, speed: 90, health: 30, damage: 8, color: '#f39c12', scoreValue: 35, coinDrop: 5, canShoot: true, shootRate: 0.6, spreadShot: true },
  ufo: { radius: 20, speed: 70, health: 40, damage: 10, color: '#1abc9c', scoreValue: 40, coinDrop: 6, canShoot: true, shootRate: 1.5 },
  asteroid: { radius: 28, speed: 30, health: 100, damage: 30, color: '#7f8c8d', scoreValue: 50, coinDrop: 8 },
  alien: { radius: 14, speed: 110, health: 20, damage: 8, color: '#2ecc71', scoreValue: 25, coinDrop: 4, canShoot: true, shootRate: 1.0 },
  mothership: { radius: 50, speed: 25, health: 800, damage: 40, color: '#8e44ad', scoreValue: 500, coinDrop: 80, canShoot: true, shootRate: 0.5, isBoss: true, summons: true },
};

export const WEAPONS: Weapon[] = [
  { name: 'Pistola', damage: 15, shootRate: 0.12, bulletSpeed: 600, bulletCount: 1, spread: 0, color: '#2ecc71', price: 0, pierce: false },
  { name: 'Shotgun', damage: 10, shootRate: 0.4, bulletSpeed: 500, bulletCount: 3, spread: 0.3, color: '#f39c12', price: 50, pierce: false },
  { name: 'Metralhadora', damage: 8, shootRate: 0.05, bulletSpeed: 700, bulletCount: 1, spread: 0.1, color: '#e74c3c', price: 80, pierce: false },
  { name: 'Sniper', damage: 60, shootRate: 0.8, bulletSpeed: 1000, bulletCount: 1, spread: 0, color: '#3498db', price: 120, pierce: true },
  { name: 'Laser', damage: 5, shootRate: 0.02, bulletSpeed: 1200, bulletCount: 1, spread: 0, color: '#e74c3c', price: 150, pierce: true },
  { name: 'RPG', damage: 80, shootRate: 1.2, bulletSpeed: 400, bulletCount: 1, spread: 0, color: '#e67e22', price: 200, pierce: false },
  { name: 'Raios', damage: 25, shootRate: 0.15, bulletSpeed: 800, bulletCount: 3, spread: 0.15, color: '#9b59b6', price: 180, pierce: true },
  { name: 'Gel', damage: 12, shootRate: 0.1, bulletSpeed: 550, bulletCount: 2, spread: 0.2, color: '#3498db', price: 100, pierce: false },
];

export const UPGRADES: Upgrade[] = [
  { name: 'Vida +25', effect: 'health', value: 25, price: 30 },
  { name: 'Velocidade +15%', effect: 'speed', value: 0.15, price: 45 },
  { name: 'Dano +25%', effect: 'damage', value: 0.25, price: 70 },
  { name: 'Escudo', effect: 'shield', value: 1, price: 80 },
  { name: 'Vida +50', effect: 'health', value: 50, price: 55 },
  { name: 'Magnetismo', effect: 'magnet', value: 1, price: 60 },
  { name: 'Crítico 2x', effect: 'crit', value: 0.25, price: 100 },
  { name: 'Pierce', effect: 'pierce', value: 1, price: 120 },
];

export const POWERUP_TYPES: Record<string, { color: string; symbol: string; duration: number }> = {
  health: { color: '#2ecc71', symbol: '+', duration: 0 },
  speed: { color: '#f39c12', symbol: '»', duration: 5 },
  damage: { color: '#e74c3c', symbol: '!', duration: 5 },
  shield: { color: '#3498db', symbol: 'O', duration: 0 },
  magnet: { color: '#9b59b6', symbol: 'M', duration: 8 },
  multiShot: { color: '#e67e22', symbol: 'x3', duration: 6 },
  invincible: { color: '#f1c40f', symbol: '*', duration: 4 },
};
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/config.ts
git commit -m "refactor: add EnemyType interface, remove unused enemy properties from config"
```

---

### Task 3: Systems - Particles + Collision + Spawner

**Files:**
- Create: `src/systems/particles.ts`
- Create: `src/systems/collision.ts`
- Create: `src/systems/spawner.ts`

- [ ] **Step 1: Create particles.ts**

```typescript
// src/systems/particles.ts
import { Particle } from '../types';
import { rand } from '../utils';
import { MAX_PARTICLES } from '../core/constants';

const particles: Particle[] = [];

export function getParticles(): Particle[] {
  return particles;
}

export function spawnParticles(x: number, y: number, color: string, count: number, speed: number): void {
  const available = MAX_PARTICLES - particles.length;
  const toSpawn = Math.min(count, available);
  for (let i = 0; i < toSpawn; i++) {
    const angle = rand(0, Math.PI * 2);
    const spd = rand(speed * 0.3, speed);
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: rand(0.3, 0.8),
      maxLife: 0.8,
      radius: rand(2, 6),
      color,
    });
  }
}

export function updateParticles(dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.life -= dt;
    if (p.life <= 0) {
      particles[particles.length - 1] = p;
      particles.pop();
    }
  }
}

export function clearParticles(): void {
  particles.length = 0;
}
```

- [ ] **Step 2: Create collision.ts**

```typescript
// src/systems/collision.ts
import { Bullet, Enemy } from '../types';
import { dist } from '../utils';

export function checkBulletEnemyCollisions(
  bullets: Bullet[],
  enemies: Enemy[],
  onHit: (bullet: Bullet, enemy: Enemy) => void
): void {
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    if (b.isEnemy) continue;
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      if (e.health <= 0) continue;
      if (dist(b, e) < e.radius + 5) {
        onHit(b, e);
        break;
      }
    }
  }
}

export function checkEnemyBulletPlayerCollision(
  bullets: Bullet[],
  playerX: number,
  playerY: number,
  playerRadius: number,
  invincible: number,
  onHit: (bullet: Bullet) => void
): void {
  for (const b of bullets) {
    if (!b.isEnemy) continue;
    if (invincible <= 0 && dist(b, { x: playerX, y: playerY }) < playerRadius + 5) {
      onHit(b);
    }
  }
}

export function checkEnemyPlayerCollision(
  enemies: Enemy[],
  playerX: number,
  playerY: number,
  playerRadius: number,
  invincible: number,
  onHit: (enemy: Enemy) => void
): void {
  for (const e of enemies) {
    if (dist(e, { x: playerX, y: playerY }) < e.radius + playerRadius && invincible <= 0) {
      onHit(e);
    }
  }
}
```

- [ ] **Step 3: Create spawner.ts**

```typescript
// src/systems/spawner.ts';
import { Enemy } from '../types';
import { ENEMY_TYPES, PHASES } from '../config';
import { rand } from '../utils';
import { WAVE_BASE_ENEMIES, WAVE_ENEMIES_PER_LEVEL, WAVE_BASE_SPAWN_RATE, WAVE_SPAWN_RATE_DECAY, WAVE_MIN_SPAWN_RATE, WAVE_SCALE_PER_LEVEL } from '../core/constants';

let waveTimer = 0;
let enemiesSpawnedThisWave = 0;

export function getWaveTimer(): number { return waveTimer; }
export function getEnemiesSpawned(): number { return enemiesSpawnedThisWave; }

export function resetSpawner(): void {
  waveTimer = 0;
  enemiesSpawnedThisWave = 0;
}

export function spawnEnemy(type: string, canvasWidth: number, canvasHeight: number, currentWave: number): Enemy | null {
  const def = ENEMY_TYPES[type];
  if (!def) return null;

  let x = 0, y = 0;
  const side = Math.floor(rand(0, 4));
  if (side === 0) { x = -40; y = rand(0, canvasHeight); }
  else if (side === 1) { x = canvasWidth + 40; y = rand(0, canvasHeight); }
  else if (side === 2) { x = rand(0, canvasWidth); y = -40; }
  else { x = rand(0, canvasWidth); y = canvasHeight + 40; }

  const waveScale = 1 + currentWave * WAVE_SCALE_PER_LEVEL;

  return {
    x, y, radius: def.radius, speed: def.speed + rand(-10, 10),
    health: Math.floor(def.health * waveScale), maxHealth: Math.floor(def.health * waveScale),
    damage: Math.floor(def.damage * waveScale), color: def.color, scoreValue: def.scoreValue,
    shootTimer: rand(0, def.shootRate || 0), shootRate: def.shootRate || 0,
    canShoot: def.canShoot || false, type, angle: rand(0, Math.PI * 2),
    attackTimer: 0, summonTimer: 0,
  };
}

export function spawnWaveEnemies(
  dt: number,
  enemies: Enemy[],
  currentWave: number,
  currentPhaseEnemyTypes: string[],
  canvasWidth: number,
  canvasHeight: number
): boolean {
  waveTimer += dt;
  const totalEnemies = WAVE_BASE_ENEMIES + currentWave * WAVE_ENEMIES_PER_LEVEL;
  const spawnRate = Math.max(WAVE_MIN_SPAWN_RATE, WAVE_BASE_SPAWN_RATE - currentWave * WAVE_SPAWN_RATE_DECAY);

  if (waveTimer >= spawnRate && enemiesSpawnedThisWave < totalEnemies) {
    waveTimer = 0;
    const type = currentPhaseEnemyTypes[Math.floor(rand(0, currentPhaseEnemyTypes.length))];
    const enemy = spawnEnemy(type, canvasWidth, canvasHeight, currentWave);
    if (enemy) enemies.push(enemy);
    enemiesSpawnedThisWave++;
  }

  if (enemiesSpawnedThisWave >= totalEnemies && enemies.length === 0) {
    enemiesSpawnedThisWave = 0;
    waveTimer = 0;
    return true;
  }
  return false;
}
```

- [ ] **Step 4: Verify no errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/systems/
git commit -m "feat: add systems - particles, collision, spawner"
```

---

### Task 4: Entities - Player + Enemy + Bullet + Coin

**Files:**
- Create: `src/entities/player.ts`
- Create: `src/entities/bullet.ts`
- Create: `src/entities/coin.ts`
- Modify: `src/weapons.ts`

- [ ] **Step 1: Create player.ts**

```typescript
// src/entities/player.ts
import { PLAYER_BASE_SPEED, PLAYER_BASE_HEALTH, PLAYER_RADIUS, INVINCIBLE_DURATION, BULLET_INVINCIBLE_DURATION, WAVE_HEAL_ON_COMPLETE } from '../core/constants';
import { GameState } from '../types';

export interface Player {
  x: number; y: number; radius: number; speed: number;
  health: number; maxHealth: number; angle: number;
  shootCooldown: number; invincible: number; shield: number;
}

let player: Player;

export function initPlayer(canvasWidth: number, canvasHeight: number): void {
  player = {
    x: canvasWidth / 2, y: canvasHeight / 2,
    radius: PLAYER_RADIUS, speed: PLAYER_BASE_SPEED,
    health: PLAYER_BASE_HEALTH, maxHealth: PLAYER_BASE_HEALTH,
    angle: 0, shootCooldown: 0, invincible: 0, shield: 0,
  };
}

export function getPlayer(): Player {
  return player;
}

export function resetPlayer(canvasWidth: number, canvasHeight: number): void {
  player.x = canvasWidth / 2;
  player.y = canvasHeight / 2;
  player.health = player.maxHealth;
  player.invincible = 0;
  player.shield = 0;
}

export function movePlayer(
  keys: Record<string, boolean>,
  dt: number,
  canvasWidth: number,
  canvasHeight: number,
  speedMultiplier: number
): void {
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const spd = player.speed * speedMultiplier;
    player.x += dx * spd * dt;
    player.y += dy * spd * dt;
  }
  player.x = Math.max(player.radius, Math.min(canvasWidth - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvasHeight - player.radius, player.y));
}

export function damagePlayer(amount: number): void {
  if (player.shield > 0) {
    player.shield--;
  } else {
    player.health -= amount;
  }
  player.invincible = BULLET_INVINCIBLE_DURATION;
}

export function enemyCollisionDamage(enemyDamage: number): void {
  if (player.shield > 0) {
    player.shield--;
  } else {
    player.health -= enemyDamage;
  }
  player.invincible = INVINCIBLE_DURATION;
}

export function healPlayer(amount: number): void {
  player.health = Math.min(player.maxHealth, player.health + amount);
}

export function healOnWaveComplete(): void {
  player.health = Math.min(player.maxHealth, player.health + WAVE_HEAL_ON_COMPLETE);
}
```

- [ ] **Step 2: Create bullet.ts**

```typescript
// src/entities/bullet.ts';
import { Bullet } from '../types';
import { BULLET_LIFE } from '../core/constants';

const bullets: Bullet[] = [];

export function getBullets(): Bullet[] {
  return bullets;
}

export function spawnBullet(
  x: number, y: number, vx: number, vy: number,
  damage: number, isEnemy: boolean, color: string, pierce: boolean
): void {
  bullets.push({ x, y, vx, vy, life: BULLET_LIFE, damage, isEnemy, color, pierce });
}

export function updateBullets(dt: number, canvasWidth: number, canvasHeight: number): void {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < -50 || b.x > canvasWidth + 50 || b.y < -50 || b.y > canvasHeight + 50) {
      bullets[bullets.length - 1] = b;
      bullets.pop();
    }
  }
}

export function clearBullets(): void {
  bullets.length = 0;
}
```

- [ ] **Step 3: Create coin.ts**

```typescript
// src/entities/coin.ts
import { Coin } from '../types';
import { rand } from '../utils';
import { COIN_LIFE, COLLECT_RADIUS, MAGNET_RADIUS, MAGNET_SPEED } from '../core/constants';

const coinList: Coin[] = [];
let magnetActive = false;

export function getCoins(): Coin[] { return coinList; }
export function setMagnetActive(active: boolean): void { magnetActive = active; }

export function spawnCoins(x: number, y: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const spd = rand(50, 150);
    coinList.push({
      x: x + rand(-10, 10), y: y + rand(-10, 10),
      value: 1, life: COIN_LIFE,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
    });
  }
}

export function updateCoins(
  dt: number,
  playerX: number,
  playerY: number,
  playerRadius: number,
  onCollect: (value: number) => void
): void {
  for (let i = coinList.length - 1; i >= 0; i--) {
    const c = coinList[i];
    c.life -= dt;
    c.vx *= 0.95;
    c.vy *= 0.95;
    c.x += c.vx * dt;
    c.y += c.vy * dt;

    const dx = playerX - c.x;
    const dy = playerY - c.y;
    const dist = Math.hypot(dx, dy);
    const collectRadius = magnetActive ? MAGNET_RADIUS : playerRadius + COLLECT_RADIUS;

    if (dist < collectRadius) {
      const speed = magnetActive ? MAGNET_SPEED : 200;
      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);
      c.x += nx * speed * dt;
      c.y += ny * speed * dt;
    }

    if (dist < playerRadius + 8) {
      onCollect(c.value);
      coinList[coinList.length - 1] = c;
      coinList.pop();
    } else if (c.life <= 0) {
      coinList[coinList.length - 1] = c;
      coinList.pop();
    }
  }
}

export function clearCoins(): void {
  coinList.length = 0;
}
```

- [ ] **Step 4: Verify no errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/entities/
git commit -m "feat: add entities - player, bullet, coin"
```

---

### Task 5: Systems - Renderer (Largest Task)

**Files:**
- Create: `src/systems/renderer.ts`

- [ ] **Step 1: Create renderer.ts**

This is the largest file. It extracts all canvas drawing code from main.ts. The renderer receives all data it needs as parameters (no imports of game state).

```typescript
// src/systems/renderer.ts
import { Enemy, Bullet, Particle, Coin, PowerUp } from '../types';
import { ENEMY_TYPES, POWERUP_TYPES } from '../config';
import { Player } from '../entities/player';
import { hasPowerUp } from '../powerups';

let ctx: CanvasRenderingContext2D;
let canvas: HTMLCanvasElement;

export function initRenderer(canvasEl: HTMLCanvasElement, ctxEl: CanvasRenderingContext2D): void {
  canvas = canvasEl;
  ctx = ctxEl;
}

export function drawMenu(): void {
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 50; i++) {
    const x = (i * 73 + Date.now() / 20) % canvas.width;
    const y = (i * 47 + Date.now() / 30) % canvas.height;
    ctx.fillStyle = `rgba(46,204,113,${0.2 + Math.sin(Date.now() / 500 + i) * 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, 2 + Math.sin(Date.now() / 1000 + i) * 1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#2ecc71';
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#2ecc71';
  ctx.shadowBlur = 30;
  ctx.fillText('BUBBLE SHOOTER', canvas.width / 2, canvas.height / 2 - 60);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#aaa';
  ctx.font = '16px monospace';
  ctx.fillText('WASD para mover | Mouse para mirar | Click para atirar', canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = '#fff';
  ctx.font = '22px monospace';
  const pulse = 0.7 + Math.sin(Date.now() / 400) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillText('Pressione ENTER para jogar', canvas.width / 2, canvas.height / 2 + 50);
  ctx.globalAlpha = 1;
}

export function drawGameOver(score: number, killStreak: number): void {
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 30; i++) {
    const x = (i * 100 + Date.now() / 40) % canvas.width;
    const y = (i * 80 + Date.now() / 50) % canvas.height;
    ctx.fillStyle = `rgba(231,76,60,${0.15 + Math.sin(Date.now() / 800 + i) * 0.05})`;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 56px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#e74c3c';
  ctx.shadowBlur = 30;
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 70);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText(`Pontos: ${score}`, canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillText(`Kills: ${killStreak}`, canvas.width / 2, canvas.height / 2 + 20);
  const pulse = 0.7 + Math.sin(Date.now() / 400) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillText('Pressione ENTER para reiniciar', canvas.width / 2, canvas.height / 2 + 70);
  ctx.globalAlpha = 1;
}

export function drawGameBackground(bg: string, gridColor: string, screenShake: number): void {
  const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 20 : 0;
  const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 20 : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);

  ctx.fillStyle = bg;
  ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);

  const gridSize = 50;
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
}

export function drawPhaseTransition(
  phaseTransition: number,
  currentWave: number,
  phaseName: string | undefined
): void {
  if (phaseTransition > 0) {
    const alpha = Math.min(1, phaseTransition / 1.5);
    ctx.fillStyle = `rgba(0,0,0,${alpha * 0.5})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Onda ${currentWave + 1}`, canvas.width / 2, canvas.height / 2);
    if (phaseName) {
      ctx.font = '24px monospace';
      ctx.fillText(phaseName, canvas.width / 2, canvas.height / 2 + 40);
    }
  }
}

export function drawCoins(coins: Coin[]): void {
  for (const c of coins) {
    const pulse = 1 + Math.sin(Date.now() / 300 + c.x) * 0.15;
    const alpha = Math.min(1, c.life / 3);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f1c40f';
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 7 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#d4ac0d';
    ctx.beginPath();
    ctx.arc(c.x - 1, c.y - 1, 4 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', c.x, c.y + 1);
  }
  ctx.globalAlpha = 1;
}

export function drawPowerUps(powerups: PowerUp[]): void {
  for (const p of powerups) {
    const def = POWERUP_TYPES[p.type];
    const bob = Math.sin(Date.now() / 200 + p.x) * 3;
    const alpha = Math.min(1, p.life / 2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = def.color;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.symbol, p.x, p.y + bob);
  }
  ctx.globalAlpha = 1;
}

export function drawParticles(particles: Particle[]): void {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawBullets(bullets: Bullet[]): void {
  for (const b of bullets) {
    ctx.fillStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 10;
    const trailLen = b.isEnemy ? 8 : 12;
    const speed = Math.hypot(b.vx, b.vy) || 1;
    const tx = b.x - (b.vx / speed) * trailLen;
    const ty = b.y - (b.vy / speed) * trailLen;
    const grad = ctx.createLinearGradient(tx, ty, b.x, b.y);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, b.color);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.isEnemy ? 3 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export function drawEnemies(enemies: Enemy[], playerX: number, playerY: number): void {
  for (const e of enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);

    const def = ENEMY_TYPES[e.type];
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.color;

    if (def?.armor) {
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = e.angle + (i * Math.PI * 2) / 6;
        const r = e.radius * (i % 2 === 0 ? 1 : 0.8);
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (def?.isBoss) {
      ctx.shadowBlur = 20;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = e.angle + (i * Math.PI * 2) / 8;
        const r = e.radius * (i % 2 === 0 ? 1 : 0.7);
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (e.health < e.maxHealth) {
      const barW = e.radius * 2;
      ctx.fillStyle = '#333';
      ctx.fillRect(-barW / 2, -e.radius - 12, barW, 5);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(-barW / 2, -e.radius - 12, barW * (e.health / e.maxHealth), 5);
    }

    const eyeAngle = Math.atan2(playerY - e.y, playerX - e.x) - e.angle;
    const eyeOff = e.radius * 0.35;
    const eyeR = e.radius * 0.18;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(Math.cos(eyeAngle - 0.4) * eyeOff, Math.sin(eyeAngle - 0.4) * eyeOff, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(Math.cos(eyeAngle + 0.4) * eyeOff, Math.sin(eyeAngle + 0.4) * eyeOff, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(Math.cos(eyeAngle - 0.4) * eyeOff * 1.2, Math.sin(eyeAngle - 0.4) * eyeOff * 1.2, eyeR * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(Math.cos(eyeAngle + 0.4) * eyeOff * 1.2, Math.sin(eyeAngle + 0.4) * eyeOff * 1.2, eyeR * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export function drawPlayer(player: Player, damageNumbers: any[]): void {
  const flash = player.invincible > 0 && Math.floor(player.invincible * 25) % 2;
  if (!flash) {
    ctx.fillStyle = hasPowerUp('invincible') ? '#f1c40f' : player.shield > 0 ? '#3498db' : '#2ecc71';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (hasPowerUp('invincible')) {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 5 + Math.sin(Date.now() / 100) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (player.shield > 0) {
      ctx.strokeStyle = 'rgba(52,152,219,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.angle) * 28, player.y + Math.sin(player.angle) * 28);
    ctx.stroke();

    const eOff = player.radius * 0.3;
    const eR = player.radius * 0.2;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x + Math.cos(player.angle - 0.5) * eOff, player.y + Math.sin(player.angle - 0.5) * eOff, eR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + Math.cos(player.angle + 0.5) * eOff, player.y + Math.sin(player.angle + 0.5) * eOff, eR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(player.x + Math.cos(player.angle - 0.5) * eOff * 1.1, player.y + Math.sin(player.angle - 0.5) * eOff * 1.1, eR * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + Math.cos(player.angle + 0.5) * eOff * 1.1, player.y + Math.sin(player.angle + 0.5) * eOff * 1.1, eR * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawDamageNumbers(damageNumbers: { x: number; y: number; text: string; color: string; life: number; vy: number }[]): void {
  for (const d of damageNumbers) {
    const alpha = Math.min(1, d.life / 0.5);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = d.color;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(d.text, d.x, d.y);
  }
  ctx.globalAlpha = 1;
}

export function drawCombo(combo: number): void {
  if (combo > 1) {
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 10;
    ctx.fillText(`COMBO x${combo}`, canvas.width / 2, 40);
    ctx.shadowBlur = 0;
  }
}

export function drawWeaponInfo(weaponName: string): void {
  ctx.fillStyle = '#aaa';
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(weaponName, 20, canvas.height - 20);
}

export function drawActivePowerUps(activePowerups: Record<string, number>): void {
  let x = canvas.width - 20;
  for (const key in activePowerups) {
    const def = POWERUP_TYPES[key];
    const remaining = activePowerups[key];
    ctx.fillStyle = def.color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(x, 30, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.symbol, x, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(remaining.toFixed(1), x, 52);
    x -= 35;
  }
  ctx.globalAlpha = 1;
}

export function restoreCanvas(): void {
  ctx.restore();
}
```

- [ ] **Step 2: Verify no errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/systems/renderer.ts
git commit -m "feat: add renderer system - all canvas drawing extracted"
```

---

### Task 6: UI - Menu + Shop + HUD + Game Over

**Files:**
- Create: `src/ui/menu.ts`
- Modify: `src/shop.ts` → `src/ui/shop.ts`
- Create: `src/ui/hud.ts`
- Create: `src/ui/gameover.ts`

- [ ] **Step 1: Create menu.ts (stub - already in renderer)**

Menu rendering is handled by `renderer.drawMenu()`. This file is a placeholder for future menu logic.

```typescript
// src/ui/menu.ts
// Menu logic handled by renderer.drawMenu()
// Add menu-specific logic here if needed in future
export {}
```

- [ ] **Step 2: Move shop.ts to ui/shop.ts**

Move the existing `src/shop.ts` content to `src/ui/shop.ts` and update imports.

```bash
mv src/shop.ts src/ui/shop.ts
```

- [ ] **Step 3: Create hud.ts**

```typescript
// src/ui/hud.ts
export interface HudData {
  phase: string;
  health: number;
  score: number;
  coins: number;
  wave: number;
  enemies: number;
}

let elements: Record<string, HTMLElement> = {};

export function initHud(): void {
  elements = {
    phase: document.getElementById('phase')!,
    health: document.getElementById('health')!,
    score: document.getElementById('score')!,
    coins: document.getElementById('coins')!,
    wave: document.getElementById('wave')!,
    enemies: document.getElementById('enemies')!,
  };
}

export function updateHud(data: HudData): void {
  elements.phase.textContent = data.phase;
  elements.health.textContent = String(Math.max(0, Math.ceil(data.health)));
  elements.score.textContent = String(data.score);
  elements.coins.textContent = String(data.coins);
  elements.wave.textContent = String(data.wave + 1);
  elements.enemies.textContent = String(data.enemies);
}
```

- [ ] **Step 4: Create gameover.ts (stub)**

Game over rendering is handled by `renderer.drawGameOver()`. This file is a placeholder.

```typescript
// src/ui/gameover.ts
// Game over logic handled by renderer.drawGameOver()
export {}
```

- [ ] **Step 5: Verify no errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/ui/
git commit -m "feat: add UI modules - hud (cached DOM), move shop to ui/"
```

---

### Task 7: Rewrite main.ts as Thin Orchestrator

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Rewrite main.ts**

This is the final integration step. main.ts becomes a thin orchestrator (~200 lines) that ties everything together.

```typescript
// src/main.ts
import { getState, setState } from './core/gameState';
import { on, emit, clearAll } from './core/eventBus';
import { normalize } from './utils';
import { PHASES, ENEMY_TYPES, POWERUP_TYPES } from './config';
import * as player from './entities/player';
import { getBullets, spawnBullet, updateBullets, clearBullets } from './entities/bullet';
import { spawnCoins, updateCoins, clearCoins, setMagnetActive, getCoins } from './entities/coin';
import { shoot, getCurrentWeapon, resetWeapons } from './weapons';
import { buyWeapon, buyUpgrade, setShopCoins, getShopCoins, addShopCoins, resetShop } from './ui/shop';
import { getCurrentPhase, getCurrentWave, getGameState, setGameState, nextWave, nextPhase, resetPhases, addScore, getScore, getCombo, updateCombo, resetCombo, getKillStreak } from './phases';
import { powerups, spawnPowerUp, updatePowerUps, hasPowerUp, drawActivePowerUps } from './powerups';
import { spawnParticles, updateParticles, clearParticles, getParticles } from './systems/particles';
import { spawnWaveEnemies, resetSpawner } from './systems/spawner';
import { checkBulletEnemyCollisions, checkEnemyBulletPlayerCollision, checkEnemyPlayerCollision } from './systems/collision';
import { initRenderer, drawMenu, drawGameOver, drawGameBackground, drawPhaseTransition, drawCoins, drawPowerUps, drawParticles, drawBullets, drawEnemies, drawPlayer, drawDamageNumbers, drawCombo, drawWeaponInfo, drawActivePowerUps as drawActivePowerUpsUI, restoreCanvas } from './systems/renderer';
import { initHud, updateHud } from './ui/hud';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

initRenderer(canvas, ctx);
initHud();

const keys: Record<string, boolean> = {};
const mouse = { x: 0, y: 0, down: false };
document.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('mousedown', e => {
  mouse.down = true;
  if (getGameState() === 'shop') handleShopClick(e.clientX, e.clientY);
  e.preventDefault();
});
document.addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Delegated from shop module
function handleShopClick(x: number, y: number) {
  // This calls into shop's handleShopClick - we need to import it
  // But we moved shop to ui/shop.ts, so we need to re-export
}

let enemies: any[] = [];
let damageNumbers: any[] = [];
let waveComplete = false;
let screenShake = 0;
let phaseTransition = 0;
let lastTime = 0;

function resetGame() {
  resetPhases();
  player.initPlayer(canvas.width, canvas.height);
  resetWeapons();
  resetShop();
  resetSpawner();
  enemies.length = 0;
  damageNumbers.length = 0;
  clearBullets();
  clearCoins();
  clearParticles();
}

function update(dt: number) {
  const state = getGameState();

  if (state === 'menu') {
    if (keys['enter']) {
      resetGame();
      setGameState('playing');
    }
    return;
  }

  if (state === 'gameover') {
    if (keys['enter']) {
      resetGame();
      setGameState('menu');
    }
    return;
  }

  if (state === 'shop') {
    if (keys['enter']) {
      nextPhase();
      player.initPlayer(canvas.width, canvas.height);
      enemies.length = 0;
      clearBullets();
      clearCoins();
      clearParticles();
      resetCombo();
    }
    return;
  }

  if (state !== 'playing') return;

  updateCombo(dt);
  setMagnetActive(hasPowerUp('magnet'));

  if (phaseTransition > 0) {
    phaseTransition -= dt;
    return;
  }

  const p = player.getPlayer();
  const speedMult = hasPowerUp('speed') ? 1.5 : 1;
  player.movePlayer(keys, dt, canvas.width, canvas.height, speedMult);

  p.angle = Math.atan2(mouse.y - p.y, mouse.x - p.x);

  p.shootCooldown -= dt;
  if (mouse.down && p.shootCooldown <= 0) {
    const weapon = getCurrentWeapon();
    p.shootCooldown = weapon.shootRate;
    const multiShot = hasPowerUp('multiShot');
    const newBullets = shoot(p.x, p.y, p.angle, multiShot);
    newBullets.forEach(b => spawnBullet(b.x, b.y, b.vx, b.vy, b.damage, false, b.color, b.pierce));
    const muzzleX = p.x + Math.cos(p.angle) * 24;
    const muzzleY = p.y + Math.sin(p.angle) * 24;
    spawnParticles(muzzleX, muzzleY, weapon.color, 4, 120);
    screenShake = 0.05;
  }

  if (p.invincible > 0) p.invincible -= dt;

  const phase = getCurrentPhase();
  waveComplete = spawnWaveEnemies(dt, enemies, getCurrentWave(), phase.enemyTypes, canvas.width, canvas.height);
  if (waveComplete) {
    nextWave();
    player.healOnWaveComplete();
    if (getGameState() !== 'shop') {
      phaseTransition = 1.5;
    }
  }

  for (const e of enemies) {
    e.angle += dt * 2;
    const dir = normalize({ x: p.x - e.x, y: p.y - e.y });
    const spd = e.type === 'mosquito' ? e.speed * 1.3 : e.speed;
    e.x += dir.x * spd * dt;
    e.y += dir.y * spd * dt;

    if (e.canShoot) {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = e.shootRate;
        const angle = Math.atan2(p.y - e.y, p.x - e.x);
        const bColor = ENEMY_TYPES[e.type]?.projectileColor || '#3498db';
        if (ENEMY_TYPES[e.type]?.spreadShot) {
          for (let s = -1; s <= 1; s++) {
            spawnBullet(e.x, e.y, Math.cos(angle + s * 0.3) * 250, Math.sin(angle + s * 0.3) * 250, e.damage, true, bColor, false);
          }
        } else if (ENEMY_TYPES[e.type]?.splitBullet) {
          for (let s = 0; s < 4; s++) {
            const a = angle + (s * Math.PI / 2);
            spawnBullet(e.x, e.y, Math.cos(a) * 200, Math.sin(a) * 200, e.damage, true, bColor, false);
          }
        } else {
          spawnBullet(e.x, e.y, Math.cos(angle) * 300, Math.sin(angle) * 300, e.damage, true, bColor, false);
        }
      }
    }

    if (ENEMY_TYPES[e.type]?.summons) {
      e.summonTimer += dt;
      if (e.summonTimer >= 5 && enemies.length < 20) {
        e.summonTimer = 0;
        const summonTypes = ['grunt', 'runner', 'drone'];
        const type = summonTypes[Math.floor(Math.random() * summonTypes.length)];
        const summoned = spawnEnemyFromSpawner(type);
        if (summoned) enemies.push(summoned);
        spawnParticles(e.x, e.y, '#9b59b6', 8, 150);
      }
    }

    if (ENEMY_TYPES[e.type]?.leavesFire) {
      e.attackTimer += dt;
      if (e.attackTimer >= 0.5) {
        e.attackTimer = 0;
        spawnParticles(e.x, e.y + e.radius, '#e74c3c', 3, 50);
      }
    }
  }

  const bullets = getBullets();
  checkEnemyPlayerCollision(enemies, p.x, p.y, p.radius, p.invincible, (e) => {
    const dmg = hasPowerUp('invincible') ? 0 : e.damage;
    if (dmg > 0) {
      player.enemyCollisionDamage(dmg);
    }
    e.health = 0;
    spawnParticles(e.x, e.y, e.color, 12, 200);
    screenShake = 0.15;
  });

  checkBulletEnemyCollisions(bullets, enemies, (b, e) => {
    e.health -= b.damage;
    damageNumbers.push({
      x: e.x + (Math.random() - 0.5) * 20, y: e.y - 20,
      text: b.color === '#f1c40f' ? `${Math.floor(b.damage)}!` : String(Math.floor(b.damage)),
      color: b.color === '#f1c40f' ? '#f1c40f' : '#fff',
      life: 1, vy: -80,
    });
    if (!b.pierce) b.life = 0;
    spawnParticles(b.x, b.y, b.color, 3, 150);
    screenShake = 0.03;
  });

  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].health <= 0) {
      addScore(enemies[i].scoreValue);
      const def = ENEMY_TYPES[enemies[i].type];
      if (def?.coinDrop) spawnCoins(enemies[i].x, enemies[i].y, def.coinDrop);
      spawnParticles(enemies[i].x, enemies[i].y, enemies[i].color, 20, 300);
      if (def?.isBoss) {
        spawnParticles(enemies[i].x, enemies[i].y, '#f1c40f', 50, 400);
        screenShake = 0.5;
      }
      if (Math.random() < 0.08) spawnPowerUp(enemies[i].x, enemies[i].y);
      enemies[i] = enemies[enemies.length - 1];
      enemies.pop();
    }
  }

  updateBullets(dt, canvas.width, canvas.height);
  updateParticles(dt);

  for (const d of damageNumbers) {
    d.y += d.vy * dt;
    d.vy += 100 * dt;
    d.life -= dt;
  }
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    if (damageNumbers[i].life <= 0) {
      damageNumbers[i] = damageNumbers[damageNumbers.length - 1];
      damageNumbers.pop();
    }
  }

  updateCoins(dt, p.x, p.y, p.radius, (v) => {
    addScore(v);
    addShopCoins(v);
  });
  updatePowerUps(dt, p.x, p.y, p.radius, (type) => {
    if (type === 'health') player.healPlayer(30);
    if (type === 'shield') p.shield += 2;
    spawnParticles(p.x, p.y, POWERUP_TYPES[type].color, 15, 200);
  });

  if (screenShake > 0) screenShake -= dt;

  if (p.health <= 0) {
    setGameState('gameover');
  }

  updateHud({
    phase: getCurrentPhase()?.name || '1',
    health: p.health,
    score: getScore(),
    coins: getShopCoins(),
    wave: getCurrentWave(),
    enemies: enemies.length,
  });
}

function draw() {
  const state = getGameState();

  if (state === 'menu') {
    drawMenu();
    return;
  }

  if (state === 'shop') {
    // Shop handles its own rendering
    const { drawShop } = require('./ui/shop');
    drawShop(ctx, canvas.width, canvas.height, mouse.x, mouse.y);
    return;
  }

  if (state === 'gameover') {
    drawGameOver(getScore(), getKillStreak());
    return;
  }

  const bg = getCurrentPhase();
  drawGameBackground(bg?.bg || '#1a1a2e', bg?.gridColor || 'rgba(255,255,255,0.03)', screenShake);
  drawPhaseTransition(phaseTransition, getCurrentWave(), bg?.name);
  drawCoins(getCoins());
  drawPowerUps(powerups);
  drawParticles(getParticles());
  drawBullets(getBullets());
  drawEnemies(enemies, player.getPlayer().x, player.getPlayer().y);
  drawPlayer(player.getPlayer(), damageNumbers);
  restoreCanvas();
  drawCombo(getCombo());
  drawWeaponInfo(getCurrentWeapon().name);
  drawActivePowerUpsUI(powerups);
}

function loop(time: number) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(time => { lastTime = time; loop(time); });
```

- [ ] **Step 2: Fix the require() for shop - update to proper import**

The `require('./ui/shop')` in the draw function needs to be a proper import. Update main.ts to import drawShop at the top:

```typescript
import { drawShop } from './ui/shop';
```

And replace the require line with just `drawShop(ctx, canvas.width, canvas.height, mouse.x, mouse.y);`

- [ ] **Step 3: Fix the handleShopClick - import from ui/shop**

```typescript
import { handleShopClick as shopHandleClick } from './ui/shop';
```

And update the mousedown handler to use `shopHandleClick`.

- [ ] **Step 4: Fix the summonEnemyFromSpawner reference**

The summon code calls `spawnEnemyFromSpawner` which doesn't exist. Import from spawner:

```typescript
import { spawnEnemy } from './systems/spawner';
```

And replace `spawnEnemyFromSpawner(type)` with `spawnEnemy(type, canvas.width, canvas.height, getCurrentWave())`.

- [ ] **Step 5: Verify no errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Test the game works**

Run: `npm run dev`
Expected: Game loads, menu appears, gameplay works

- [ ] **Step 7: Commit**

```bash
git add src/main.ts
git commit -m "refactor: rewrite main.ts as thin orchestrator, ~250 lines"
```

---

### Task 8: Remove Old Files + Final Cleanup

**Files:**
- Delete: `src/shop.ts` (moved to ui/shop.ts)
- Delete: `src/coins.ts` (replaced by entities/coin.ts)
- Delete: `src/weapons.ts` (keep, but update imports)
- Modify: `src/weapons.ts` (update exports if needed)

- [ ] **Step 1: Remove old coins.ts**

```bash
rm src/coins.ts
```

- [ ] **Step 2: Verify all imports updated**

Check that no file imports from `./coins` or the old `./shop`.

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Final test**

Run: `npm run dev`
Expected: Game works correctly

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old files, final cleanup"
```

---

### Task 9: Verify Build + Performance Check

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run Vite build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Check bundle size**

Run: `ls -la dist/assets/`
Expected: Similar or smaller than before

- [ ] **Step 4: Final commit if needed**

```bash
git add -A
git commit -m "chore: verify build, final checks"
```
