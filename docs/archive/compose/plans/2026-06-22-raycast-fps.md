# Raycast FPS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Wolfenstein 3D-style FPS game using raycasting in Canvas 2D with TypeScript, featuring simple enemies, wave-based progression, and npm execution.

**Architecture:** Modular TypeScript with Vite. Engine layer (raycasting, rendering, input), game logic layer (player, enemy, waves, weapons), UI layer (HUD, menus). Pure Canvas 2D, no external dependencies.

**Tech Stack:** TypeScript, Vite, Canvas 2D API, Web Audio API (optional)

---

## Task 1: Project Setup

**Covers:** [S3], [S10]

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`

- [ ] **Step 1: Initialize npm project**

```bash
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install -D typescript vite
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});
```

- [ ] **Step 5: Create index.html**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Raycast FPS</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="game"></canvas>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 6: Create minimal src/main.ts**

```typescript
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function gameLoop() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  requestAnimationFrame(gameLoop);
}

gameLoop();
```

- [ ] **Step 7: Add npm scripts to package.json**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 8: Verify project runs**

```bash
npm run dev
```

Expected: Browser opens with black screen

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: initial project setup with Vite and TypeScript"
```

---

## Task 2: Input System

**Covers:** [S4]

**Files:**
- Create: `src/engine/input.ts`

- [ ] **Step 1: Create input manager**

```typescript
export interface InputState {
  forward: boolean;
  backward: boolean;
  strafeLeft: boolean;
  strafeRight: boolean;
  shoot: boolean;
  mouseX: number;
  mouseY: number;
  mouseDeltaX: number;
}

const keys: Record<string, boolean> = {};
let mouseX = 0;
let mouseY = 0;
let mouseDeltaX = 0;

export function initInput(canvas: HTMLCanvasElement): void {
  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
  });

  document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    mouseDeltaX = e.movementX;
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  canvas.addEventListener('mousedown', () => {
    keys['MouseLeft'] = true;
  });

  canvas.addEventListener('mouseup', () => {
    keys['MouseLeft'] = false;
  });
}

export function getInput(): InputState {
  const state: InputState = {
    forward: keys['KeyW'] || false,
    backward: keys['KeyS'] || false,
    strafeLeft: keys['KeyA'] || false,
    strafeRight: keys['KeyD'] || false,
    shoot: keys['MouseLeft'] || false,
    mouseX,
    mouseY,
    mouseDeltaX,
  };
  mouseDeltaX = 0;
  return state;
}
```

- [ ] **Step 2: Test input in main.ts**

Update `src/main.ts`:

```typescript
import { initInput, getInput } from './engine/input';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

initInput(canvas);

function gameLoop() {
  const input = getInput();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Debug: show input state
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText(`W: ${input.forward} S: ${input.backward} A: ${input.strafeLeft} D: ${input.strafeRight}`, 10, 30);
  ctx.fillText(`Shoot: ${input.shoot} MouseX: ${input.mouseX}`, 10, 60);
  
  requestAnimationFrame(gameLoop);
}

gameLoop();
```

- [ ] **Step 3: Verify input works**

```bash
npm run dev
```

Expected: Black screen with white text showing input state. WASD and mouse should update values.

- [ ] **Step 4: Commit**

```bash
git add src/engine/input.ts src/main.ts
git commit -m "feat: add input system with keyboard and mouse"
```

---

## Task 3: Raycasting Engine

**Covers:** [S4], [S8]

**Files:**
- Create: `src/engine/raycaster.ts`

- [ ] **Step 1: Create raycaster with DDA algorithm**

```typescript
export const MAP_WIDTH = 16;
export const MAP_HEIGHT = 16;

// 0 = empty, 1 = wall
export const MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,1,0,0,0,0,0,1,1,0,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,1,1,0,0,0,0,0,1,1,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export interface Ray {
  distance: number;
  wallX: number;
  side: number;
  mapX: number;
  mapY: number;
}

export function castRay(
  posX: number,
  posY: number,
  rayAngle: number
): Ray {
  const rayDirX = Math.cos(rayAngle);
  const rayDirY = Math.sin(rayAngle);

  let mapX = Math.floor(posX);
  let mapY = Math.floor(posY);

  const deltaDistX = Math.abs(1 / rayDirX);
  const deltaDistY = Math.abs(1 / rayDirY);

  let stepX: number;
  let stepY: number;
  let sideDistX: number;
  let sideDistY: number;

  if (rayDirX < 0) {
    stepX = -1;
    sideDistX = (posX - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - posX) * deltaDistX;
  }

  if (rayDirY < 0) {
    stepY = -1;
    sideDistY = (posY - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1 - posY) * deltaDistY;
  }

  let hit = false;
  let side = 0;

  while (!hit) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }

    if (MAP[mapY][mapX] > 0) {
      hit = true;
    }
  }

  let perpWallDist: number;
  if (side === 0) {
    perpWallDist = (mapX - posX + (1 - stepX) / 2) / rayDirX;
  } else {
    perpWallDist = (mapY - posY + (1 - stepY) / 2) / rayDirY;
  }

  let wallX: number;
  if (side === 0) {
    wallX = posY + perpWallDist * rayDirY;
  } else {
    wallX = posX + perpWallDist * rayDirX;
  }
  wallX -= Math.floor(wallX);

  return {
    distance: perpWallDist,
    wallX,
    side,
    mapX,
    mapY,
  };
}

export function checkCollision(posX: number, posY: number, radius: number = 0.2): boolean {
  const checks = [
    [posX - radius, posY - radius],
    [posX + radius, posY - radius],
    [posX - radius, posY + radius],
    [posX + radius, posY + radius],
  ];

  for (const [x, y] of checks) {
    const mapX = Math.floor(x);
    const mapY = Math.floor(y);
    if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT) {
      return true;
    }
    if (MAP[mapY][mapX] > 0) {
      return true;
    }
  }

  return false;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/raycaster.ts
git commit -m "feat: add DDA raycasting engine with collision detection"
```

---

## Task 4: Renderer

**Covers:** [S4], [S7]

**Files:**
- Create: `src/engine/renderer.ts`

- [ ] **Step 1: Create renderer with textures**

```typescript
import { castRay, MAP_WIDTH, MAP_HEIGHT, MAP } from './raycaster';

const FOV = Math.PI / 4; // 45 degrees
const HALF_FOV = FOV / 2;

export interface RenderState {
  playerX: number;
  playerY: number;
  playerAngle: number;
}

function generateTextures(): ImageData[] {
  const textures: ImageData[] = [];
  
  // Wall texture (brick pattern)
  const wallCanvas = document.createElement('canvas');
  wallCanvas.width = 64;
  wallCanvas.height = 64;
  const wallCtx = wallCanvas.getContext('2d')!;
  
  wallCtx.fillStyle = '#8B4513';
  wallCtx.fillRect(0, 0, 64, 64);
  
  wallCtx.strokeStyle = '#000';
  wallCtx.lineWidth = 2;
  
  // Horizontal lines
  for (let y = 0; y < 64; y += 16) {
    wallCtx.beginPath();
    wallCtx.moveTo(0, y);
    wallCtx.lineTo(64, y);
    wallCtx.stroke();
  }
  
  // Vertical lines (offset every other row)
  for (let y = 0; y < 64; y += 16) {
    const offset = (y / 16) % 2 === 0 ? 0 : 16;
    for (let x = offset; x < 64; x += 32) {
      wallCtx.beginPath();
      wallCtx.moveTo(x, y);
      wallCtx.lineTo(x, y + 16);
      wallCtx.stroke();
    }
  }
  
  textures.push(wallCtx.getImageData(0, 0, 64, 64));
  
  return textures;
}

const textures = generateTextures();

export function render(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: RenderState
): void {
  // Sky gradient
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height / 2);
  skyGradient.addColorStop(0, '#87CEEB');
  skyGradient.addColorStop(1, '#4682B4');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height / 2);
  
  // Floor
  ctx.fillStyle = '#333';
  ctx.fillRect(0, height / 2, width, height / 2);
  
  // Raycasting
  const numRays = width;
  const columnWidth = width / numRays;
  
  for (let x = 0; x < numRays; x++) {
    const rayAngle = state.playerAngle - HALF_FOV + (x / numRays) * FOV;
    const ray = castRay(state.playerX, state.playerY, rayAngle);
    
    // Fish-eye correction
    const correctedDistance = ray.distance * Math.cos(rayAngle - state.playerAngle);
    
    const wallHeight = Math.min(height * 2, height / correctedDistance);
    const wallTop = (height - wallHeight) / 2;
    
    // Wall texture
    const textureX = Math.floor(ray.wallX * 64);
    const texture = textures[0];
    
    // Simple shading based on distance and side
    const shade = ray.side === 0 ? 1.0 : 0.7;
    const distanceShade = Math.max(0.3, 1 - correctedDistance / 10);
    
    // Draw wall column
    for (let y = 0; y < wallHeight; y++) {
      const textureY = Math.floor((y / wallHeight) * 64);
      const pixelIndex = (textureY * 64 + textureX) * 4;
      
      const r = texture.data[pixelIndex] * shade * distanceShade;
      const g = texture.data[pixelIndex + 1] * shade * distanceShade;
      const b = texture.data[pixelIndex + 2] * shade * distanceShade;
      
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x * columnWidth, wallTop + y, columnWidth + 1, 1);
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/renderer.ts
git commit -m "feat: add raycasting renderer with procedural textures"
```

---

## Task 5: Player System

**Covers:** [S4]

**Files:**
- Create: `src/game/player.ts`

- [ ] **Step 1: Create player module**

```typescript
import { InputState } from '../engine/input';
import { checkCollision } from '../engine/raycaster';

export interface Player {
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  score: number;
  lastShotTime: number;
  fireRate: number;
}

const MOVE_SPEED = 0.05;
const ROTATION_SPEED = 0.003;
const PLAYER_RADIUS = 0.2;

export function createPlayer(x: number, y: number): Player {
  return {
    x,
    y,
    angle: 0,
    health: 100,
    maxHealth: 100,
    ammo: 30,
    maxAmmo: 30,
    reserveAmmo: 90,
    score: 0,
    lastShotTime: 0,
    fireRate: 100, // ms between shots
  };
}

export function updatePlayer(
  player: Player,
  input: InputState,
  deltaTime: number
): void {
  // Rotation
  player.angle += input.mouseDeltaX * ROTATION_SPEED;
  
  // Movement
  let moveX = 0;
  let moveY = 0;
  
  if (input.forward) {
    moveX += Math.cos(player.angle) * MOVE_SPEED;
    moveY += Math.sin(player.angle) * MOVE_SPEED;
  }
  if (input.backward) {
    moveX -= Math.cos(player.angle) * MOVE_SPEED;
    moveY -= Math.sin(player.angle) * MOVE_SPEED;
  }
  if (input.strafeLeft) {
    moveX += Math.cos(player.angle - Math.PI / 2) * MOVE_SPEED;
    moveY += Math.sin(player.angle - Math.PI / 2) * MOVE_SPEED;
  }
  if (input.strafeRight) {
    moveX += Math.cos(player.angle + Math.PI / 2) * MOVE_SPEED;
    moveY += Math.sin(player.angle + Math.PI / 2) * MOVE_SPEED;
  }
  
  // Collision detection
  const newX = player.x + moveX;
  const newY = player.y + moveY;
  
  if (!checkCollision(newX, player.y, PLAYER_RADIUS)) {
    player.x = newX;
  }
  if (!checkCollision(player.x, newY, PLAYER_RADIUS)) {
    player.y = newY;
  }
  
  // Health regeneration
  if (player.health < player.maxHealth) {
    player.health += deltaTime * 0.001; // 1 HP per second
    player.health = Math.min(player.health, player.maxHealth);
  }
}

export function canShoot(player: Player, currentTime: number): boolean {
  return (
    player.ammo > 0 &&
    currentTime - player.lastShotTime >= player.fireRate
  );
}

export function shoot(player: Player, currentTime: number): void {
  player.ammo--;
  player.lastShotTime = currentTime;
  
  if (player.ammo === 0 && player.reserveAmmo > 0) {
    player.ammo = player.maxAmmo;
    player.reserveAmmo -= player.maxAmmo;
  }
}

export function takeDamage(player: Player, amount: number): void {
  player.health -= amount;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/player.ts
git commit -m "feat: add player with movement, health, and shooting"
```

---

## Task 6: Enemy System

**Covers:** [S5]

**Files:**
- Create: `src/game/enemy.ts`

- [ ] **Step 1: Create enemy module**

```typescript
import { castRay, MAP } from '../engine/raycaster';

export interface Enemy {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  isAlive: boolean;
  lastDamageTime: number;
}

const ENEMY_RADIUS = 0.3;
const CONTACT_DAMAGE = 10;
const CONTACT_COOLDOWN = 1000; // ms

export function createEnemy(
  x: number,
  y: number,
  health: number = 50,
  speed: number = 0.03
): Enemy {
  return {
    x,
    y,
    health,
    maxHealth: health,
    speed,
    damage: CONTACT_DAMAGE,
    isAlive: true,
    lastDamageTime: 0,
  };
}

export function updateEnemy(
  enemy: Enemy,
  playerX: number,
  playerY: number,
  playerAngle: number,
  deltaTime: number
): boolean {
  if (!enemy.isAlive) return false;
  
  // Check if enemy is in player's FOV
  const dx = playerX - enemy.x;
  const dy = playerY - enemy.y;
  const distToPlayer = Math.sqrt(dx * dx + dy * dy);
  
  const angleToPlayer = Math.atan2(dy, dx);
  const angleDiff = Math.abs(angleToPlayer - playerAngle);
  const normalizedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
  const inFOV = normalizedDiff < Math.PI / 4; // 45 degree FOV
  
  if (!inFOV) return false;
  
  // Line of sight check
  const rayAngle = Math.atan2(enemy.y - playerY, enemy.x - playerX);
  const ray = castRay(playerX, playerY, rayAngle);
  const distToWall = ray.distance;
  
  if (distToPlayer < distToWall) {
    // Move towards player
    const moveX = (dx / distToPlayer) * enemy.speed;
    const moveY = (dy / distToPlayer) * enemy.speed;
    
    const newX = enemy.x + moveX;
    const newY = enemy.y + moveY;
    
    // Simple collision check
    if (MAP[Math.floor(newY)][Math.floor(newX)] === 0) {
      enemy.x = newX;
      enemy.y = newY;
    }
  }
  
  // Check contact damage
  const currentTime = Date.now();
  if (distToPlayer < ENEMY_RADIUS + 0.2) {
    if (currentTime - enemy.lastDamageTime > CONTACT_COOLDOWN) {
      enemy.lastDamageTime = currentTime;
      return true; // Indicates damage should be applied
    }
  }
  
  return false;
}

export function damageEnemy(enemy: Enemy, amount: number): void {
  enemy.health -= amount;
  if (enemy.health <= 0) {
    enemy.isAlive = false;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/enemy.ts
git commit -m "feat: add enemy with AI behavior and collision"
```

---

## Task 7: Wave System

**Covers:** [S6]

**Files:**
- Create: `src/game/waves.ts`

- [ ] **Step 1: Create wave system**

```typescript
import { Enemy, createEnemy } from './enemy';
import { MAP, MAP_WIDTH, MAP_HEIGHT } from '../engine/raycaster';

export interface WaveState {
  currentWave: number;
  enemies: Enemy[];
  enemiesRemaining: number;
  waveCompleteTime: number;
  isTransitioning: boolean;
}

const WAVE_DELAY = 3000; // 3 seconds between waves

function getSpawnPosition(): { x: number; y: number } {
  let x: number, y: number;
  do {
    x = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
    y = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
  } while (MAP[y][x] !== 0);
  
  return { x: x + 0.5, y: y + 0.5 };
}

function getWaveConfig(wave: number) {
  let enemyCount: number;
  let enemyHealth: number;
  let enemySpeed: number;
  
  if (wave === 1) {
    enemyCount = 3;
    enemyHealth = 25;
    enemySpeed = 0.03;
  } else if (wave === 2) {
    enemyCount = 4;
    enemyHealth = 50;
    enemySpeed = 0.03;
  } else if (wave === 3) {
    enemyCount = 5;
    enemyHealth = 50;
    enemySpeed = 0.036; // +20% speed
  } else {
    enemyCount = 5 + (wave - 3);
    enemyHealth = 50 + (wave - 3) * 10;
    enemySpeed = 0.036 + (wave - 3) * 0.003;
  }
  
  return { enemyCount, enemyHealth, enemySpeed };
}

export function createWaveState(): WaveState {
  return {
    currentWave: 0,
    enemies: [],
    enemiesRemaining: 0,
    waveCompleteTime: 0,
    isTransitioning: false,
  };
}

export function startWave(state: WaveState): void {
  state.currentWave++;
  const config = getWaveConfig(state.currentWave);
  state.enemies = [];
  
  for (let i = 0; i < config.enemyCount; i++) {
    const pos = getSpawnPosition();
    state.enemies.push(
      createEnemy(pos.x, pos.y, config.enemyHealth, config.enemySpeed)
    );
  }
  
  state.enemiesRemaining = config.enemyCount;
  state.isTransitioning = false;
}

export function updateWaves(
  state: WaveState,
  currentTime: number
): boolean {
  if (state.enemiesRemaining === 0 && !state.isTransitioning) {
    state.waveCompleteTime = currentTime;
    state.isTransitioning = true;
    return false;
  }
  
  if (
    state.isTransitioning &&
    currentTime - state.waveCompleteTime >= WAVE_DELAY
  ) {
    startWave(state);
    return true; // New wave started
  }
  
  return false;
}

export function onEnemyKilled(state: WaveState): number {
  state.enemiesRemaining--;
  return 100 * state.enemies[0]?.maxHealth * state.currentWave || 100;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/waves.ts
git commit -m "feat: add wave progression system"
```

---

## Task 8: HUD System

**Covers:** [S7]

**Files:**
- Create: `src/ui/hud.ts`

- [ ] **Step 1: Create HUD renderer**

```typescript
import { Player } from '../game/player';
import { WaveState } from '../game/waves';

export function renderHUD(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  player: Player,
  waveState: WaveState,
  waveComplete: boolean
): void {
  const padding = 20;
  const barHeight = 20;
  const barWidth = 150;
  
  // Health bar
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(padding, padding, barWidth, barHeight);
  
  const healthPercent = player.health / player.maxHealth;
  ctx.fillStyle = healthPercent > 0.3 ? '#ff0000' : '#ff6600';
  ctx.fillRect(padding, padding, barWidth * healthPercent, barHeight);
  
  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  ctx.fillText(`HP: ${Math.floor(player.health)}`, padding + 5, padding + 15);
  
  // Ammo counter
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(padding, height - padding - barHeight, barWidth, barHeight);
  
  ctx.fillStyle = '#fff';
  ctx.fillText(
    `${player.ammo}/${player.reserveAmmo}`,
    padding + 5,
    height - padding - 5
  );
  
  // Wave indicator
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  const waveText = `WAVE ${waveState.currentWave}`;
  const waveTextWidth = ctx.measureText(waveText).width;
  ctx.fillRect(
    width / 2 - waveTextWidth / 2 - 10,
    padding,
    waveTextWidth + 20,
    barHeight
  );
  
  ctx.fillStyle = '#fff';
  ctx.fillText(waveText, width / 2 - waveTextWidth / 2, padding + 15);
  
  // Enemy counter
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  const enemyText = `${waveState.enemiesRemaining} remaining`;
  const enemyTextWidth = ctx.measureText(enemyText).width;
  ctx.fillRect(
    width - padding - enemyTextWidth - 20,
    padding,
    enemyTextWidth + 20,
    barHeight
  );
  
  ctx.fillStyle = '#fff';
  ctx.fillText(
    enemyText,
    width - padding - enemyTextWidth - 10,
    padding + 15
  );
  
  // Score
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  const scoreText = `SCORE: ${player.score}`;
  const scoreTextWidth = ctx.measureText(scoreText).width;
  ctx.fillRect(
    width - padding - scoreTextWidth - 20,
    height - padding - barHeight,
    scoreTextWidth + 20,
    barHeight
  );
  
  ctx.fillStyle = '#fff';
  ctx.fillText(
    scoreText,
    width - padding - scoreTextWidth - 10,
    height - padding - 5
  );
  
  // Wave complete message
  if (waveComplete) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(width / 2 - 150, height / 2 - 30, 300, 60);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('WAVE COMPLETE!', width / 2 - 100, height / 2 + 5);
  }
  
  // Crosshair
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 10, height / 2);
  ctx.lineTo(width / 2 + 10, height / 2);
  ctx.moveTo(width / 2, height / 2 - 10);
  ctx.lineTo(width / 2, height / 2 + 10);
  ctx.stroke();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/hud.ts
git commit -m "feat: add HUD with health, ammo, wave, and score"
```

---

## Task 9: Menu System

**Covers:** [S7]

**Files:**
- Create: `src/ui/menu.ts`

- [ ] **Step 1: Create menu renderer**

```typescript
export type GameState = 'menu' | 'playing' | 'gameover';

export function renderMenu(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);
  
  // Title
  ctx.fillStyle = '#e94560';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('RAYCAST FPS', width / 2, height / 3);
  
  // Instructions
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText('WASD = move | Mouse = look | Click = shoot', width / 2, height / 2);
  
  // Start button
  const buttonWidth = 200;
  const buttonHeight = 50;
  const buttonX = width / 2 - buttonWidth / 2;
  const buttonY = height * 0.65;
  
  ctx.fillStyle = '#0f3460';
  ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
  
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 2;
  ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
  
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('START', width / 2, buttonY + 32);
  
  ctx.textAlign = 'start';
}

export function isStartButtonClicked(
  mouseX: number,
  mouseY: number,
  width: number,
  height: number
): boolean {
  const buttonWidth = 200;
  const buttonHeight = 50;
  const buttonX = width / 2 - buttonWidth / 2;
  const buttonY = height * 0.65;
  
  return (
    mouseX >= buttonX &&
    mouseX <= buttonX + buttonWidth &&
    mouseY >= buttonY &&
    mouseY <= buttonY + buttonHeight
  );
}

export function renderGameOver(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  score: number
): void {
  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);
  
  // Title
  ctx.fillStyle = '#e94560';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', width / 2, height / 3);
  
  // Score
  ctx.fillStyle = '#fff';
  ctx.font = '24px monospace';
  ctx.fillText(`Final Score: ${score}`, width / 2, height / 2);
  
  // Restart button
  const buttonWidth = 200;
  const buttonHeight = 50;
  const buttonX = width / 2 - buttonWidth / 2;
  const buttonY = height * 0.65;
  
  ctx.fillStyle = '#0f3460';
  ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
  
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 2;
  ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
  
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('RESTART', width / 2, buttonY + 32);
  
  ctx.textAlign = 'start';
}

export function isRestartButtonClicked(
  mouseX: number,
  mouseY: number,
  width: number,
  height: number
): boolean {
  const buttonWidth = 200;
  const buttonHeight = 50;
  const buttonX = width / 2 - buttonWidth / 2;
  const buttonY = height * 0.65;
  
  return (
    mouseX >= buttonX &&
    mouseX <= buttonX + buttonWidth &&
    mouseY >= buttonY &&
    mouseY <= buttonY + buttonHeight
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/menu.ts
git commit -m "feat: add start and game over menu screens"
```

---

## Task 10: Main Game Loop

**Covers:** [S3], [S4], [S6], [S7]

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Create complete game loop**

```typescript
import { initInput, getInput } from './engine/input';
import { render, RenderState } from './engine/renderer';
import { createPlayer, updatePlayer, canShoot, shoot, takeDamage } from './game/player';
import { updateEnemy, damageEnemy } from './game/enemy';
import { createWaveState, updateWaves, onEnemyKilled } from './game/waves';
import { renderHUD } from './ui/hud';
import {
  GameState,
  renderMenu,
  renderGameOver,
  isStartButtonClicked,
  isRestartButtonClicked,
} from './ui/menu';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

initInput(canvas);

let gameState: GameState = 'menu';
let player = createPlayer(8, 8);
let waveState = createWaveState();
let lastTime = 0;
let waveComplete = false;

canvas.addEventListener('click', () => {
  if (gameState === 'menu') {
    const input = getInput();
    if (isStartButtonClicked(input.mouseX, input.mouseY, canvas.width, canvas.height)) {
      gameState = 'playing';
      player = createPlayer(8, 8);
      waveState = createWaveState();
      updateWaves(waveState, Date.now());
      canvas.requestPointerLock();
    }
  } else if (gameState === 'gameover') {
    const input = getInput();
    if (isRestartButtonClicked(input.mouseX, input.mouseY, canvas.width, canvas.height)) {
      gameState = 'playing';
      player = createPlayer(8, 8);
      waveState = createWaveState();
      updateWaves(waveState, Date.now());
      canvas.requestPointerLock();
    }
  }
});

function gameLoop(currentTime: number) {
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if (gameState === 'menu') {
    renderMenu(ctx, canvas.width, canvas.height);
  } else if (gameState === 'playing') {
    const input = getInput();
    
    // Update player
    updatePlayer(player, input, deltaTime);
    
    // Update waves
    const newWave = updateWaves(waveState, currentTime);
    if (newWave) {
      waveComplete = false;
    }
    
    // Update enemies
    for (const enemy of waveState.enemies) {
      if (enemy.isAlive) {
        const damagePlayer = updateEnemy(
          enemy,
          player.x,
          player.y,
          player.angle,
          deltaTime
        );
        
        if (damagePlayer) {
          takeDamage(player, enemy.damage);
        }
      }
    }
    
    // Check player death
    if (player.health <= 0) {
      gameState = 'gameover';
      document.exitPointerLock();
    }
    
    // Shooting
    if (input.shoot && canShoot(player, currentTime)) {
      shoot(player, currentTime);
      
      // Check enemy hits
      for (const enemy of waveState.enemies) {
        if (enemy.isAlive) {
          const dx = enemy.x - player.x;
          const dy = enemy.y - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angleToEnemy = Math.atan2(dy, dx);
          const angleDiff = Math.abs(angleToEnemy - player.angle);
          const normalizedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
          
          if (normalizedDiff < 0.1 && dist < 10) {
            damageEnemy(enemy, 25);
            if (!enemy.isAlive) {
              player.score += onEnemyKilled(waveState);
            }
            break;
          }
        }
      }
    }
    
    // Check wave complete
    if (waveState.enemiesRemaining === 0 && !waveState.isTransitioning) {
      waveComplete = true;
    }
    
    // Render
    const renderState: RenderState = {
      playerX: player.x,
      playerY: player.y,
      playerAngle: player.angle,
    };
    
    render(ctx, canvas.width, canvas.height, renderState);
    
    // Render enemies as sprites
    for (const enemy of waveState.enemies) {
      if (enemy.isAlive) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 10) {
          const screenX = canvas.width / 2 + (dx / dist) * canvas.width * 0.3;
          const spriteHeight = Math.min(200, canvas.height / dist);
          const spriteWidth = spriteHeight;
          
          ctx.fillStyle = `rgba(200, 50, 50, ${1 - dist / 10})`;
          ctx.fillRect(
            screenX - spriteWidth / 2,
            canvas.height / 2 - spriteHeight / 2,
            spriteWidth,
            spriteHeight
          );
        }
      }
    }
    
    renderHUD(ctx, canvas.width, canvas.height, player, waveState, waveComplete);
  } else if (gameState === 'gameover') {
    renderGameOver(ctx, canvas.width, canvas.height, player.score);
  }
  
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

- [ ] **Step 2: Verify game runs**

```bash
npm run dev
```

Expected: Menu screen appears. Click START to play. WASD to move, mouse to look, click to shoot. Enemies spawn in waves.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: complete game loop with all systems integrated"
```

---

## Task 11: Final Testing

**Covers:** [S9], [S10]

**Files:**
- None (verification only)

- [ ] **Step 1: Test dev server**

```bash
npm run dev
```

Expected: Game runs without errors in browser

- [ ] **Step 2: Test production build**

```bash
npm run build
```

Expected: Builds successfully to dist/ folder

- [ ] **Step 3: Test preview**

```bash
npm run preview
```

Expected: Production build runs correctly

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: final testing and verification"
```

---

## Summary

This plan creates a complete FPS game with:
- Raycasting engine (DDA algorithm)
- Player movement and shooting
- Enemy AI with line-of-sight
- Wave-based progression
- Full HUD and menu system
- TypeScript with Vite

**Total Tasks:** 11
**Estimated Time:** 1-2 hours
