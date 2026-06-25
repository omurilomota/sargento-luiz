# Game Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the top-down shooter with 5 themed phases, coin system, and shop with weapons/upgrades.

**Architecture:** Modular game with phase manager, shop system, and weapon registry. Each phase has unique visual theme and enemy types.

**Tech Stack:** TypeScript, Canvas 2D, Vite

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/main.ts` | Game loop, input, rendering |
| `src/types.ts` | All interfaces and types |
| `src/config.ts` | Phase/wave/shop configurations |
| `src/player.ts` | Player state and movement |
| `src/enemies.ts` | Enemy types and spawning |
| `src/weapons.ts` | Weapon definitions and shooting |
| `src/shop.ts` | Shop logic and UI |
| `src/phases.ts` | Phase progression and themes |
| `src/coins.ts` | Coin drops and collection |
| `src/ui.ts` | HUD and menus |
| `index.html` | Game canvas and UI elements |

---

### Task 1: Create Types and Config

**Files:**
- Create: `src/types.ts`
- Create: `src/config.ts`

- [ ] **Step 1: Create types.ts with all interfaces**

```typescript
export interface Vec2 { x: number; y: number; }
export interface Bullet { x: number; y: number; vx: number; vy: number; life: number; damage: number; isEnemy: boolean; color: string; }
export interface Enemy { x: number; y: number; radius: number; speed: number; health: number; maxHealth: number; damage: number; color: string; scoreValue: number; shootTimer: number; shootRate: number; canShoot: boolean; type: string; }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; radius: number; color: string; }
export interface Coin { x: number; y: number; value: number; life: number; }
export interface Weapon { name: string; damage: number; shootRate: number; bulletSpeed: number; bulletCount: number; spread: number; color: string; price: number; }
export interface Upgrade { name: string; effect: string; value: number; price: number; }
export interface Phase { name: string; bg: string; gridColor: string; enemyTypes: string[]; waves: number; }
export type GameState = 'menu' | 'playing' | 'shop' | 'gameover' | 'phaseComplete';
```

- [ ] **Step 2: Create config.ts with game data**

```typescript
import { Phase, Weapon, Upgrade } from './types';

export const PHASES: Phase[] = [
  { name: 'Floresta', bg: '#1a2e1a', gridColor: 'rgba(34,139,34,0.1)', enemyTypes: ['grunt', 'runner'], waves: 3 },
  { name: 'Caverna', bg: '#1a1a2e', gridColor: 'rgba(100,100,150,0.1)', enemyTypes: ['grunt', 'runner', 'tank', 'bat'], waves: 4 },
  { name: 'Fábrica', bg: '#2e1a1a', gridColor: 'rgba(150,100,100,0.1)', enemyTypes: ['grunt', 'runner', 'tank', 'robot'], waves: 4 },
  { name: 'Pântano', bg: '#1a2e2e', gridColor: 'rgba(34,150,150,0.1)', enemyTypes: ['grunt', 'runner', 'slime'], waves: 5 },
  { name: 'Castelo', bg: '#2e2e1a', gridColor: 'rgba(150,150,100,0.1)', enemyTypes: ['grunt', 'runner', 'tank', 'shooter', 'boss'], waves: 5 },
];

export const ENEMY_TYPES: Record<string, any> = {
  grunt: { radius: 16, speed: 80, health: 20, damage: 10, color: '#e74c3c', scoreValue: 10, coinDrop: 2, canShoot: false },
  runner: { radius: 12, speed: 160, health: 10, damage: 8, color: '#e67e22', scoreValue: 15, coinDrop: 3, canShoot: false },
  tank: { radius: 26, speed: 50, health: 80, damage: 20, color: '#8e44ad', scoreValue: 30, coinDrop: 5, canShoot: false },
  shooter: { radius: 14, speed: 60, health: 30, damage: 5, color: '#2980b9', scoreValue: 25, coinDrop: 4, canShoot: true, shootRate: 2.0 },
  bat: { radius: 10, speed: 120, health: 15, damage: 6, color: '#9b59b6', scoreValue: 12, coinDrop: 2, canShoot: false },
  robot: { radius: 18, speed: 70, health: 50, damage: 12, color: '#7f8c8d', scoreValue: 35, coinDrop: 6, canShoot: true, shootRate: 1.5 },
  slime: { radius: 20, speed: 60, health: 25, damage: 8, color: '#1abc9c', scoreValue: 20, coinDrop: 3, splits: true },
  boss: { radius: 40, speed: 40, health: 300, damage: 30, color: '#c0392b', scoreValue: 100, coinDrop: 25, canShoot: true, shootRate: 1.0 },
};

export const WEAPONS: Weapon[] = [
  { name: 'Pistola', damage: 15, shootRate: 0.12, bulletSpeed: 600, bulletCount: 1, spread: 0, color: '#2ecc71', price: 0 },
  { name: 'Shotgun', damage: 10, shootRate: 0.4, bulletSpeed: 500, bulletCount: 3, spread: 0.3, color: '#f39c12', price: 50 },
  { name: 'Metralhadora', damage: 8, shootRate: 0.05, bulletSpeed: 700, bulletCount: 1, spread: 0.1, color: '#e74c3c', price: 80 },
  { name: 'Sniper', damage: 50, shootRate: 0.8, bulletSpeed: 900, bulletCount: 1, spread: 0, color: '#3498db', price: 100 },
];

export const UPGRADES: Upgrade[] = [
  { name: 'Vida +25', effect: 'health', value: 25, price: 30 },
  { name: 'Velocidade +10%', effect: 'speed', value: 0.1, price: 40 },
  { name: 'Dano +20%', effect: 'damage', value: 0.2, price: 60 },
  { name: 'Escudo', effect: 'shield', value: 1, price: 70 },
];
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/config.ts
git commit -m "feat: add game types and configuration"
```

---

### Task 2: Create Coins System

**Files:**
- Create: `src/coins.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Create coins.ts**

```typescript
import { Coin } from './types';
import { rand } from './utils';

export const coins: Coin[] = [];

export function spawnCoins(x: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    coins.push({
      x: x + rand(-20, 20),
      y: y + rand(-20, 20),
      value: 1,
      life: 15,
    });
  }
}

export function updateCoins(dt: number, playerX: number, playerY: number, playerRadius: number, onCollect: (value: number) => void) {
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.life -= dt;
    const dx = playerX - c.x;
    const dy = playerY - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist < playerRadius + 10) {
      onCollect(c.value);
      coins.splice(i, 1);
    } else if (c.life <= 0) {
      coins.splice(i, 1);
    }
  }
}

export function drawCoins(ctx: CanvasRenderingContext2D) {
  for (const c of coins) {
    const alpha = Math.min(1, c.life / 3);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f1c40f';
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f39c12';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('$', c.x, c.y + 4);
  }
  ctx.globalAlpha = 1;
}
```

- [ ] **Step 2: Create utils.ts with shared helpers**

```typescript
export function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function normalize(v: { x: number; y: number }): { x: number; y: number } {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/coins.ts src/utils.ts
git commit -m "feat: add coin drop and collection system"
```

---

### Task 3: Create Weapon System

**Files:**
- Create: `src/weapons.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Create weapons.ts**

```typescript
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
  const bullets = [];
  for (let i = 0; i < weapon.bulletCount; i++) {
    const spread = weapon.bulletCount > 1 ? (i - (weapon.bulletCount - 1) / 2) * weapon.spread : 0;
    const a = angle + spread;
    bullets.push({
      x, y,
      vx: Math.cos(a) * weapon.bulletSpeed,
      vy: Math.sin(a) * weapon.bulletSpeed,
      damage: weapon.damage * damageMultiplier,
      color: weapon.color,
    });
  }
  return bullets;
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/weapons.ts
git commit -m "feat: add weapon system with multiple guns"
```

---

### Task 4: Create Shop System

**Files:**
- Create: `src/shop.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Create shop.ts**

```typescript
import { WEAPONS, UPGRADES } from './config';
import { setWeapon, addDamageMultiplier } from './weapons';

let shopCoins = 0;
let purchasedWeapons: number[] = [0];
let purchasedUpgrades: string[] = [];

export function setShopCoins(amount: number) { shopCoins = amount; }
export function getShopCoins(): number { return shopCoins; }
export function addShopCoins(amount: number) { shopCoins += amount; }

export function getPurchasedWeapons(): number[] { return purchasedWeapons; }
export function getPurchasedUpgrades(): string[] { return purchasedUpgrades; }

export function buyWeapon(index: number): boolean {
  if (purchasedWeapons.includes(index)) return false;
  if (shopCoins < WEAPONS[index].price) return false;
  shopCoins -= WEAPONS[index].price;
  purchasedWeapons.push(index);
  setWeapon(index);
  return true;
}

export function buyUpgrade(name: string): boolean {
  if (purchasedUpgrades.includes(name)) return false;
  const upgrade = UPGRADES.find(u => u.name === name);
  if (!upgrade) return false;
  if (shopCoins < upgrade.price) return false;
  shopCoins -= upgrade.price;
  purchasedUpgrades.push(name);
  applyUpgrade(upgrade.effect, upgrade.value);
  return true;
}

function applyUpgrade(effect: string, value: number) {
  if (effect === 'damage') addDamageMultiplier(value);
}

export function resetShop() {
  purchasedWeapons = [0];
  purchasedUpgrades = [];
}

export function drawShop(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`LOJA - ${shopCoins} Moedas`, width / 2, 60);

  ctx.font = '20px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText('Armas:', width / 2, 120);

  WEAPONS.forEach((w, i) => {
    const y = 160 + i * 50;
    const owned = purchasedWeapons.includes(i);
    ctx.fillStyle = owned ? '#2ecc71' : '#fff';
    ctx.fillText(`${w.name} - ${owned ? 'COMPRADO' : w.price + ' moedas'}`, width / 2, y);
  });

  ctx.fillStyle = '#fff';
  ctx.fillText('Upgrades:', width / 2, 380);

  UPGRADES.forEach((u, i) => {
    const y = 420 + i * 50;
    const owned = purchasedUpgrades.includes(u.name);
    ctx.fillStyle = owned ? '#2ecc71' : '#fff';
    ctx.fillText(`${u.name} - ${owned ? 'COMPRADO' : u.price + ' moedas'}`, width / 2, y);
  });

  ctx.fillStyle = '#2ecc71';
  ctx.fillText('Pressione ENTER para continuar', width / 2, height - 40);
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/shop.ts
git commit -m "feat: add shop system with weapons and upgrades"
```

---

### Task 5: Create Phase Manager

**Files:**
- Create: `src/phases.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Create phases.ts**

```typescript
import { PHASES } from './config';
import { GameState } from './types';

let currentPhase = 0;
let currentWave = 0;
let gameState: GameState = 'menu';
let score = 0;

export function getCurrentPhase() { return PHASES[currentPhase]; }
export function getCurrentWave() { return currentWave; }
export function getGameState() { return gameState; }
export function getScore() { return score; }
export function setGameState(state: GameState) { gameState = state; }
export function addScore(amount: number) { score += amount; }

export function nextWave() {
  currentWave++;
  if (currentWave >= PHASES[currentPhase].waves) {
    gameState = 'shop';
  }
}

export function nextPhase() {
  currentPhase++;
  currentWave = 0;
  if (currentPhase >= PHASES.length) {
    gameState = 'gameover';
  } else {
    gameState = 'playing';
  }
}

export function resetPhases() {
  currentPhase = 0;
  currentWave = 0;
  gameState = 'menu';
  score = 0;
}

export function getPhaseBackground(): string {
  return PHASES[currentPhase]?.bg || '#1a1a2e';
}

export function getPhaseGridColor(): string {
  return PHASES[currentPhase]?.gridColor || 'rgba(255,255,255,0.03)';
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/phases.ts
git commit -m "feat: add phase management system"
```

---

### Task 6: Refactor main.ts to Use New Systems

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Update imports and integrate systems**

Replace the entire `main.ts` with:

```typescript
import { dist, rand, normalize } from './utils';
import { coins, spawnCoins, updateCoins, drawCoins } from './coins';
import { shoot, getCurrentWeapon, getDamageMultiplier, resetWeapons } from './weapons';
import { buyWeapon, buyUpgrade, setShopCoins, getShopCoins, resetShop, getPurchasedWeapons, getPurchasedUpgrades, drawShop } from './shop';
import { getCurrentPhase, getCurrentWave, getGameState, setGameState, nextWave, nextPhase, resetPhases, addScore, getScore, getPhaseBackground, getPhaseGridColor } from './phases';
import { ENEMY_TYPES, WEAPONS, UPGRADES } from './config';
import { Enemy, Bullet, Particle } from './types';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

const keys: Record<string, boolean> = {};
const mouse = { x: 0, y: 0, down: false };
document.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('mousedown', e => { mouse.down = true; e.preventDefault(); });
document.addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

const player = { x: canvas.width / 2, y: canvas.height / 2, radius: 18, speed: 320, health: 100, maxHealth: 100, angle: 0, shootCooldown: 0, invincible: 0, shield: 0 };

const bullets: Bullet[] = [];
const enemies: Enemy[] = [];
const particles: Particle[] = [];

let waveTimer = 0;
let enemiesSpawnedThisWave = 0;
let lastTime = 0;

function resetPlayer() {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.health = player.maxHealth;
  player.invincible = 0;
  player.shield = 0;
}

function spawnBullet(x: number, y: number, vx: number, vy: number, damage: number, isEnemy: boolean, color: string) {
  bullets.push({ x, y, vx, vy, life: 1.5, damage, isEnemy, color });
}

function spawnEnemy(type: string) {
  const def = ENEMY_TYPES[type];
  if (!def) return;
  let x = 0, y = 0;
  const side = Math.floor(rand(0, 4));
  if (side === 0) { x = -30; y = rand(0, canvas.height); }
  else if (side === 1) { x = canvas.width + 30; y = rand(0, canvas.height); }
  else if (side === 2) { x = rand(0, canvas.width); y = -30; }
  else { x = rand(0, canvas.width); y = canvas.height + 30; }
  enemies.push({ x, y, radius: def.radius, speed: def.speed + rand(-10, 10), health: def.health, maxHealth: def.health, damage: def.damage, color: def.color, scoreValue: def.scoreValue, shootTimer: rand(0, def.shootRate || 0), shootRate: def.shootRate || 0, canShoot: def.canShoot || false, type });
}

function spawnParticles(x: number, y: number, color: string, count: number, speed: number) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const spd = rand(speed * 0.3, speed);
    particles.push({ x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: rand(0.3, 0.7), maxLife: 0.7, radius: rand(2, 5), color });
  }
}

function spawnWaveEnemies(dt: number) {
  waveTimer += dt;
  const phase = getCurrentPhase();
  const spawnRate = Math.max(0.3, 1.0 - getCurrentWave() * 0.05);
  if (waveTimer >= spawnRate && enemiesSpawnedThisWave < 5 + getCurrentWave() * 2) {
    waveTimer = 0;
    const types = phase.enemyTypes;
    spawnEnemy(types[Math.floor(rand(0, types.length))]);
    enemiesSpawnedThisWave++;
  }
  if (enemiesSpawnedThisWave >= 5 + getCurrentWave() * 2 && enemies.length === 0) {
    nextWave();
    enemiesSpawnedThisWave = 0;
    waveTimer = 0;
    player.health = Math.min(player.maxHealth, player.health + 20);
  }
}

function update(dt: number) {
  const state = getGameState();

  if (state === 'menu') {
    if (keys['enter']) {
      resetPhases();
      resetPlayer();
      resetWeapons();
      resetShop();
      setGameState('playing');
      enemies.length = 0;
      bullets.length = 0;
      particles.length = 0;
      coins.length = 0;
    }
    return;
  }

  if (state === 'gameover') {
    if (keys['enter']) {
      resetPhases();
      resetPlayer();
      resetWeapons();
      resetShop();
      setGameState('menu');
    }
    return;
  }

  if (state === 'shop') {
    if (keys['enter']) {
      nextPhase();
      resetPlayer();
      enemies.length = 0;
      bullets.length = 0;
      particles.length = 0;
      coins.length = 0;
    }
    return;
  }

  if (state !== 'playing') return;

  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;
  if (dx || dy) {
    const n = normalize({ x: dx, y: dy });
    player.x += n.x * player.speed * dt;
    player.y += n.y * player.speed * dt;
  }
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  player.shootCooldown -= dt;
  if (mouse.down && player.shootCooldown <= 0) {
    const weapon = getCurrentWeapon();
    player.shootCooldown = weapon.shootRate;
    const newBullets = shoot(player.x, player.y, player.angle);
    newBullets.forEach(b => spawnBullet(b.x, b.y, b.vx, b.vy, b.damage, false, b.color));
    spawnParticles(player.x + Math.cos(player.angle) * 20, player.y + Math.sin(player.angle) * 20, '#2ecc71', 3, 100);
  }

  if (player.invincible > 0) player.invincible -= dt;

  spawnWaveEnemies(dt);

  for (const e of enemies) {
    const dir = normalize({ x: player.x - e.x, y: player.y - e.y });
    e.x += dir.x * e.speed * dt;
    e.y += dir.y * e.speed * dt;

    if (e.canShoot) {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = e.shootRate;
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        spawnBullet(e.x, e.y, Math.cos(angle) * 300, Math.sin(angle) * 300, e.damage, true, '#3498db');
      }
    }

    if (dist(e, player) < e.radius + player.radius && player.invincible <= 0) {
      if (player.shield > 0) {
        player.shield--;
      } else {
        player.health -= e.damage;
      }
      player.invincible = 0.5;
      e.health = 0;
      spawnParticles(e.x, e.y, e.color, 10, 200);
    }
  }

  for (const b of bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }

  for (const b of bullets) {
    if (b.isEnemy) continue;
    for (const e of enemies) {
      if (dist(b, e) < e.radius + 4) {
        e.health -= b.damage;
        b.life = 0;
        spawnParticles(b.x, b.y, '#fff', 3, 150);
        break;
      }
    }
  }

  for (const b of bullets) {
    if (!b.isEnemy) continue;
    if (dist(b, player) < player.radius + 4 && player.invincible <= 0) {
      if (player.shield > 0) {
        player.shield--;
      } else {
        player.health -= b.damage;
      }
      player.invincible = 0.3;
      b.life = 0;
      spawnParticles(b.x, b.y, '#e74c3c', 3, 150);
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].health <= 0) {
      addScore(enemies[i].scoreValue);
      const def = ENEMY_TYPES[enemies[i].type];
      if (def?.coinDrop) spawnCoins(enemies[i].x, enemies[i].y, def.coinDrop);
      spawnParticles(enemies[i].x, enemies[i].y, enemies[i].color, 15, 250);
      enemies.splice(i, 1);
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].life <= 0) bullets.splice(i, 1);
  }

  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life -= dt;
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0) particles.splice(i, 1);
  }

  updateCoins(dt, player.x, player.y, player.radius, (v) => addScore(v));

  if (player.health <= 0) {
    setGameState('gameover');
  }

  document.getElementById('health')!.textContent = String(Math.max(0, Math.ceil(player.health)));
  document.getElementById('score')!.textContent = String(getScore());
  document.getElementById('wave')!.textContent = String(getCurrentWave() + 1);
  document.getElementById('enemies')!.textContent = String(enemies.length);
}

function draw() {
  const state = getGameState();

  if (state === 'menu') {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BUBBLE SHOOTER', canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Pressione ENTER para jogar', canvas.width / 2, canvas.height / 2 + 20);
    return;
  }

  if (state === 'shop') {
    drawShop(ctx, canvas.width, canvas.height);
    return;
  }

  if (state === 'gameover') {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`Pontos: ${getScore()}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('Pressione ENTER para reiniciar', canvas.width / 2, canvas.height / 2 + 50);
    return;
  }

  ctx.fillStyle = getPhaseBackground();
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = getPhaseGridColor();
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  drawCoins(ctx);

  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const b of bullets) {
    ctx.fillStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  for (const e of enemies) {
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (e.health < e.maxHealth) {
      const barW = e.radius * 2;
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x - barW / 2, e.y - e.radius - 10, barW, 4);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(e.x - barW / 2, e.y - e.radius - 10, barW * (e.health / e.maxHealth), 4);
    }
  }

  const flash = player.invincible > 0 && Math.floor(player.invincible * 20) % 2;
  if (!flash) {
    ctx.fillStyle = player.shield > 0 ? '#3498db' : '#2ecc71';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.angle) * 28, player.y + Math.sin(player.angle) * 28);
    ctx.stroke();
  }
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

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: integrate all game systems into main loop"
```

---

### Task 7: Final Verification and Push

- [ ] **Step 1: Run the game**

Run: `npm run dev`
Expected: Game starts in browser with menu screen

- [ ] **Step 2: Test gameplay**

1. Press ENTER to start
2. Kill enemies to collect coins
3. Complete 3 waves to enter shop
4. Buy weapons/upgrades
5. Continue to next phase
6. Verify different backgrounds per phase

- [ ] **Step 3: Merge to develop**

```bash
git checkout develop
git merge feature/game-expansion
```

- [ ] **Step 4: Merge to main**

```bash
git checkout main
git merge develop
```

- [ ] **Step 5: Push to GitHub**

```bash
git push origin main
```
