# New Game Mechanics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar 5 novas mecânicas de jogo: Dash/Dodge, Ultimate, Crafting, Perigos Ambientais e Modificação de Armas.

**Architecture:** Sistema modular com novos tipos, configurações e lógica distribuída entre arquivos existentes e novos.

**Tech Stack:** TypeScript, Canvas 2D, Vite

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/types.ts` | Adicionar interfaces para dash, ultimate, materials, hazards, elements |
| `src/config.ts` | Adicionar configurações para novas mecânicas |
| `src/dash.ts` | Sistema de dash/dodge |
| `src/ultimate.ts` | Sistema de habilidade especial |
| `src/crafting.ts` | Sistema de crafting e materiais |
| `src/hazards.ts` | Perigos ambientais (lava, armadilhas) |
| `src/elements.ts` | Sistema de elementos (fogo, gelo, raio) |
| `src/main.ts` | Integrar todas as novas mecânicas |

---

### Task 1: Atualizar Types e Config

**Covers:** [S3, S4, S5, S7]

**Files:**
- Modify: `src/types.ts`
- Modify: `src/config.ts`

- [ ] **Step 1: Adicionar novas interfaces em types.ts**

```typescript
export interface Vec2 { x: number; y: number; }
export interface Bullet { x: number; y: number; vx: number; vy: number; life: number; damage: number; isEnemy: boolean; color: string; pierce: boolean; element?: string; }
export interface Enemy { x: number; y: number; radius: number; speed: number; health: number; maxHealth: number; damage: number; color: string; scoreValue: number; shootTimer: number; shootRate: number; canShoot: boolean; type: string; angle: number; attackTimer: number; summonTimer: number; }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; radius: number; color: string; }
export interface Coin { x: number; y: number; value: number; life: number; vx: number; vy: number; }
export interface PowerUp { x: number; y: number; type: string; life: number; }
export interface Weapon { name: string; damage: number; shootRate: number; bulletSpeed: number; bulletCount: number; spread: number; color: string; price: number; pierce: boolean; }
export interface Upgrade { name: string; effect: string; value: number; price: number; }
export interface Phase { name: string; bg: string; gridColor: string; enemyTypes: string[]; waves: number; bgColor2: string; }
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
```

- [ ] **Step 2: Adicionar configurações em config.ts**

```typescript
import { Phase, Weapon, Upgrade, Material, CraftingRecipe, Hazard, Element } from './types';

// ... configurações existentes ...

export const MATERIALS: Material[] = [
  { type: 'iron', name: 'Ferro', color: '#95a5a6', dropRate: 0.3 },
  { type: 'crystal', name: 'Cristal', color: '#3498db', dropRate: 0.2 },
  { type: 'fire', name: 'Fogo', color: '#e74c3c', dropRate: 0.25 },
];

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  { materials: ['iron', 'weapon'], result: 'weapon_upgrade', resultType: 'weapon' },
  { materials: ['crystal', 'fire'], result: 'element', resultType: 'element' },
  { materials: ['iron', 'iron', 'iron'], result: 'random_upgrade', resultType: 'upgrade' },
];

export const ELEMENTS: Element[] = [
  { type: 'fire', name: 'Fogo', color: '#e74c3c', effect: 'burn', duration: 2, damage: 5 },
  { type: 'ice', name: 'Gelo', color: '#3498db', effect: 'slow', duration: 2, damage: 0 },
  { type: 'lightning', name: 'Raio', color: '#9b59b6', effect: 'stun', duration: 0.5, damage: 0 },
];

export const HAZARD_TYPES: Record<string, Partial<Hazard>> = {
  lava: { radius: 40, damage: 5, effect: 'burn', duration: 1 },
  ice_trap: { radius: 30, damage: 0, effect: 'stun', duration: 1 },
};
```

- [ ] **Step 3: Verificar compilação**

Run: `npx tsc --noEmit`
Expected: Sem erros

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/config.ts
git commit -m "feat: add types and config for new game mechanics"
```

---

### Task 2: Implementar Sistema de Dash

**Covers:** [S3]

**Files:**
- Create: `src/dash.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Criar dash.ts**

```typescript
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
```

- [ ] **Step 2: Integrar dash no main.ts**

Adicionar no início do arquivo:
```typescript
import { getDashState, activateDash, updateDash, resetDash, isDashInvincible } from './dash';
```

Na função `update(dt)`, após movimentação:
```typescript
// Dash input
if (keys['shift'] && dx === 0 && dy === 0) {
  const dashDir = { x: Math.cos(player.angle), y: Math.sin(player.angle) };
  dx = dashDir.x;
  dy = dashDir.y;
}

if (keys['shift']) {
  activateDash();
}

const dashState = updateDash(dt);
if (dashState.active) {
  const n = normalize({ x: dx, y: dy });
  player.x += n.x * player.speed * dashState.speedMultiplier * dt;
  player.y += n.y * player.speed * dashState.speedMultiplier * dt;
}
```

Na colisão com inimigos, verificar invincibilidade do dash:
```typescript
if (dist(e, player) < e.radius + player.radius && player.invincible <= 0 && !isDashInvincible()) {
```

- [ ] **Step 3: Adicionar efeito visual do dash**

Na função `draw()`, após desenhar o jogador:
```typescript
if (getDashState().active) {
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#2ecc71';
  ctx.beginPath();
  ctx.arc(player.x - Math.cos(player.angle) * 20, player.y - Math.sin(player.angle) * 20, player.radius * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
```

- [ ] **Step 4: Verificar compilação**

Run: `npx tsc --noEmit`
Expected: Sem erros

- [ ] **Step 5: Commit**

```bash
git add src/dash.ts src/main.ts
git commit -m "feat: add dash/dodge mechanic"
```

---

### Task 3: Implementar Sistema de Ultimate

**Covers:** [S4]

**Files:**
- Create: `src/ultimate.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Criar ultimate.ts**

```typescript
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
```

- [ ] **Step 2: Integrar ultimate no main.ts**

Adicionar no início do arquivo:
```typescript
import { getUltimateState, addUltimateCharge, activateUltimate, updateUltimate, resetUltimate, isUltimateReady } from './ultimate';
```

Na função `update(dt)`, no início:
```typescript
// Ultimate input
if (keys['e'] && isUltimateReady()) {
  activateUltimate();
}

const ultimateResult = updateUltimate(dt);
if (ultimateResult.active) {
  // Dano em área
  for (const e of enemies) {
    if (dist(e, player) < ultimateResult.radius) {
      e.health -= ultimateResult.damage;
      spawnParticles(e.x, e.y, '#f1c40f', 10, 200);
    }
  }
  spawnParticles(player.x, player.y, '#f1c40f', 30, 300);
  screenShake = 0.5;
}
```

Ao matar inimigos:
```typescript
if (enemies[i].health <= 0) {
  addScore(enemies[i].scoreValue);
  addUltimateCharge(10);
  // ... resto do código existente
}
```

Na função `resetPlayer()`:
```typescript
resetUltimate();
```

- [ ] **Step 3: Adicionar barra de ultimate na UI**

Na função `draw()`, após HUD existente:
```typescript
// Barra de Ultimate
const ultCharge = getUltimateChargePercent();
const barWidth = 200;
const barHeight = 20;
const barX = canvas.width / 2 - barWidth / 2;
const barY = 20;

ctx.fillStyle = '#333';
ctx.fillRect(barX, barY, barWidth, barHeight);
ctx.fillStyle = isUltimateReady() ? '#f1c40f' : '#9b59b6';
ctx.fillRect(barX, barY, barWidth * (ultCharge / 100), barHeight);
ctx.strokeStyle = '#fff';
ctx.strokeRect(barX, barY, barWidth, barHeight);

ctx.fillStyle = '#fff';
ctx.font = '12px monospace';
ctx.textAlign = 'center';
ctx.fillText('ULTIMATE [E]', canvas.width / 2, barY + 14);
```

- [ ] **Step 4: Verificar compilação**

Run: `npx tsc --noEmit`
Expected: Sem erros

- [ ] **Step 5: Commit**

```bash
git add src/ultimate.ts src/main.ts
git commit -m "feat: add ultimate ability system"
```

---

### Task 4: Implementar Sistema de Crafting

**Covers:** [S5]

**Files:**
- Create: `src/crafting.ts`
- Modify: `src/shop.ts`

- [ ] **Step 1: Criar crafting.ts**

```typescript
import { MATERIALS, CRAFTING_RECIPES } from './config';

let inventory: Record<string, number> = {};

export function addMaterial(type: string) {
  inventory[type] = (inventory[type] || 0) + 1;
}

export function getInventory(): Record<string, number> {
  return inventory;
}

export function canCraft(recipeIndex: number): boolean {
  const recipe = CRAFTING_RECIPES[recipeIndex];
  if (!recipe) return false;

  const materialCounts: Record<string, number> = {};
  for (const mat of recipe.materials) {
    if (mat !== 'weapon' && mat !== 'upgrade') {
      materialCounts[mat] = (materialCounts[mat] || 0) + 1;
    }
  }

  for (const [mat, count] of Object.entries(materialCounts)) {
    if ((inventory[mat] || 0) < count) {
      return false;
    }
  }

  return true;
}

export function craft(recipeIndex: number): { success: boolean; result: string; type: string } {
  if (!canCraft(recipeIndex)) {
    return { success: false, result: '', type: '' };
  }

  const recipe = CRAFTING_RECIPES[recipeIndex];

  // Consumir materiais
  for (const mat of recipe.materials) {
    if (mat !== 'weapon' && mat !== 'upgrade') {
      inventory[mat]--;
    }
  }

  return { success: true, result: recipe.result, type: recipe.resultType };
}

export function resetCrafting() {
  inventory = {};
}

export function drawCraftingMenu(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, mouseX: number, mouseY: number) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CRAFTING', x + width / 2, y + 25);

  // Inventário
  ctx.fillStyle = '#aaa';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Materiais:', x + 10, y + 50);

  let matY = y + 70;
  for (const mat of MATERIALS) {
    const count = inventory[mat.type] || 0;
    ctx.fillStyle = mat.color;
    ctx.fillText(`${mat.name}: ${count}`, x + 10, matY);
    matY += 20;
  }

  // Receitas
  ctx.fillStyle = '#aaa';
  ctx.fillText('Receitas:', x + 10, matY + 10);

  let recY = matY + 30;
  CRAFTING_RECIPES.forEach((recipe, i) => {
    const canMake = canCraft(i);
    ctx.fillStyle = canMake ? '#2ecc71' : '#666';
    const text = `${recipe.materials.join(' + ')} = ${recipe.result}`;
    ctx.fillText(text, x + 10, recY);

    if (canMake && mouseX >= x + 10 && mouseX <= x + width - 10 && mouseY >= recY - 12 && mouseY <= recY + 4) {
      ctx.strokeStyle = '#f1c40f';
      ctx.strokeRect(x + 8, recY - 14, width - 16, 18);
    }

    recY += 25;
  });
}

export function handleCraftingClick(mouseX: number, mouseY: number, menuX: number, menuY: number, menuWidth: number, menuHeight: number): boolean {
  if (mouseX < menuX || mouseX > menuX + menuWidth || mouseY < menuY || mouseY > menuY + menuHeight) {
    return false;
  }

  // Calcular posição das receitas
  const matCount = MATERIALS.length;
  const recStartY = menuY + 70 + matCount * 20 + 30;

  for (let i = 0; i < CRAFTING_RECIPES.length; i++) {
    const recY = recStartY + i * 25;
    if (mouseY >= recY - 12 && mouseY <= recY + 4) {
      const result = craft(i);
      return result.success;
    }
  }

  return false;
}
```

- [ ] **Step 2: Integrar crafting no shop.ts**

Adicionar no início do arquivo:
```typescript
import { drawCraftingMenu, handleCraftingClick, resetCrafting } from './crafting';
```

Na função `drawShop()`, adicionar seção de crafting:
```typescript
// Seção de crafting
const craftMenuWidth = width - 40;
const craftMenuHeight = 200;
const craftMenuX = 20;
const craftMenuY = height - craftMenuHeight - 50;

drawCraftingMenu(ctx, craftMenuX, craftMenuY, craftMenuWidth, craftMenuHeight, mouseX, mouseY);
```

Na função `handleShopClick()`, adicionar:
```typescript
handleCraftingClick(mouseX, mouseY, 20, window.innerHeight - 250, window.innerWidth - 40, 200);
```

Na função `resetShop()`, adicionar:
```typescript
resetCrafting();
```

- [ ] **Step 3: Dropar materiais ao matar inimigos**

No `main.ts`, ao matar inimigos:
```typescript
if (enemies[i].health <= 0) {
  // ... código existente

  // Dropar materiais
  const dropChance = Math.random();
  if (dropChance < 0.3) addMaterial('iron');
  else if (dropChance < 0.5) addMaterial('crystal');
  else if (dropChance < 0.75) addMaterial('fire');
}
```

- [ ] **Step 4: Verificar compilação**

Run: `npx tsc --noEmit`
Expected: Sem erros

- [ ] **Step 5: Commit**

```bash
git add src/crafting.ts src/shop.ts src/main.ts
git commit -m "feat: add crafting system with materials"
```

---

### Task 5: Implementar Perigos Ambientais

**Covers:** [S6]

**Files:**
- Create: `src/hazards.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Criar hazards.ts**

```typescript
import { Hazard } from './types';
import { HAZARD_TYPES } from './config';
import { rand } from './utils';

let hazards: Hazard[] = [];

export function spawnHazards(canvasWidth: number, canvasHeight: number) {
  hazards = [];

  // Spawn lagoas de lava
  for (let i = 0; i < 3; i++) {
    const def = HAZARD_TYPES.lava;
    hazards.push({
      type: 'lava',
      x: rand(100, canvasWidth - 100),
      y: rand(100, canvasHeight - 100),
      radius: def.radius || 40,
      damage: def.damage || 5,
      effect: def.effect || 'burn',
      duration: def.duration || 1,
    });
  }

  // Spawn armadilhas de gelo
  for (let i = 0; i < 4; i++) {
    const def = HAZARD_TYPES.ice_trap;
    hazards.push({
      type: 'ice_trap',
      x: rand(100, canvasWidth - 100),
      y: rand(100, canvasHeight - 100),
      radius: def.radius || 30,
      damage: def.damage || 0,
      effect: def.effect || 'stun',
      duration: def.duration || 1,
    });
  }
}

export function getHazards(): Hazard[] {
  return hazards;
}

export function checkHazardCollision(playerX: number, playerY: number, playerRadius: number): { hit: boolean; effect: string; damage: number; duration: number } {
  for (const h of hazards) {
    const dist = Math.hypot(playerX - h.x, playerY - h.y);
    if (dist < h.radius + playerRadius) {
      return { hit: true, effect: h.effect, damage: h.damage, duration: h.duration };
    }
  }
  return { hit: false, effect: '', damage: 0, duration: 0 };
}

export function drawHazards(ctx: CanvasRenderingContext2D, time: number) {
  for (const h of hazards) {
    if (h.type === 'lava') {
      // Lava com animação
      const pulse = Math.sin(time / 500) * 5;
      ctx.fillStyle = `rgba(231, 76, 60, ${0.6 + Math.sin(time / 300) * 0.2})`;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (h.type === 'ice_trap') {
      // Armadilha de gelo
      ctx.fillStyle = 'rgba(52, 152, 219, 0.4)';
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

export function resetHazards() {
  hazards = [];
}
```

- [ ] **Step 2: Integrar hazards no main.ts**

Adicionar no início do arquivo:
```typescript
import { spawnHazards, checkHazardCollision, drawHazards, resetHazards } from './hazards';
```

No início do jogo (quando state === 'playing'):
```typescript
if (state === 'playing' && enemies.length === 0 && bullets.length === 0) {
  spawnHazards(canvas.width, canvas.height);
}
```

Na função `update(dt)`, após movimentação:
```typescript
// Verificar colisão com hazards
const hazardResult = checkHazardCollision(player.x, player.y, player.radius);
if (hazardResult.hit && player.invincible <= 0) {
  if (hazardResult.effect === 'stun') {
    // Stun: impedir movimento por 1 segundo
    player.invincible = hazardResult.duration;
  } else if (hazardResult.effect === 'burn') {
    // Burn: dano ao longo do tempo
    player.health -= hazardResult.damage;
    spawnParticles(player.x, player.y, '#e74c3c', 3, 100);
  }
}
```

Na função `draw()`, antes de desenhar entidades:
```typescript
drawHazards(ctx, Date.now());
```

Na função `resetPlayer()`:
```typescript
resetHazards();
```

- [ ] **Step 3: Verificar compilação**

Run: `npx tsc --noEmit`
Expected: Sem erros

- [ ] **Step 4: Commit**

```bash
git add src/hazards.ts src/main.ts
git commit -m "feat: add environmental hazards (lava, ice traps)"
```

---

### Task 6: Implementar Sistema de Elementos

**Covers:** [S7]

**Files:**
- Create: `src/elements.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Criar elements.ts**

```typescript
import { Element } from './types';
import { ELEMENTS } from './config';

let currentElement: Element | null = null;
let elementDuration: number = 0;

export function getCurrentElement(): Element | null {
  return currentElement;
}

export function applyElement(elementType: string) {
  const element = ELEMENTS.find(e => e.type === elementType);
  if (element) {
    currentElement = element;
    elementDuration = element.duration;
  }
}

export function updateElements(dt: number): { active: boolean; effect: string; damage: number } {
  if (currentElement && elementDuration > 0) {
    elementDuration -= dt;
    if (elementDuration <= 0) {
      currentElement = null;
      return { active: false, effect: '', damage: 0 };
    }
    return { active: true, effect: currentElement.effect, damage: currentElement.damage };
  }
  return { active: false, effect: '', damage: 0 };
}

export function resetElements() {
  currentElement = null;
  elementDuration = 0;
}

export function getBulletElement(): string | null {
  return currentElement?.type || null;
}

export function getBulletElementColor(): string | null {
  return currentElement?.color || null;
}

export function drawElementIndicator(ctx: CanvasRenderingContext2D, x: number, y: number) {
  if (currentElement) {
    ctx.fillStyle = currentElement.color;
    ctx.beginPath();
    ctx.arc(x, y - 30, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(currentElement.name.charAt(0), x, y - 27);
  }
}
```

- [ ] **Step 2: Integrar elementos no main.ts**

Adicionar no início do arquivo:
```typescript
import { applyElement, updateElements, resetElements, getBulletElement, getBulletElementColor, drawElementIndicator } from './elements';
```

Na função `spawnBullet()`, adicionar parâmetro element:
```typescript
function spawnBullet(x: number, y: number, vx: number, vy: number, damage: number, isEnemy: boolean, color: string, pierce: boolean, element?: string) {
  bullets.push({ x, y, vx, vy, life: 2, damage, isEnemy, color, pierce, element });
}
```

Ao atirar:
```typescript
const element = getBulletElement();
const elementColor = getBulletElementColor();
newBullets.forEach(b => spawnBullet(b.x, b.y, b.vx, b.vy, b.damage, false, b.color, b.pierce, element || undefined));
```

Ao colidir com inimigos:
```typescript
if (dist(b, e) < e.radius + 5) {
  e.health -= b.damage;

  // Aplicar efeito elemental
  if (b.element) {
    const elementResult = updateElements(dt);
    if (elementResult.active) {
      if (elementResult.effect === 'slow') {
        e.speed *= 0.5;
        setTimeout(() => { e.speed /= 0.5; }, 2000);
      } else if (elementResult.effect === 'stun') {
        e.speed = 0;
        setTimeout(() => { e.speed = ENEMY_TYPES[e.type]?.speed || 80; }, 500);
      } else if (elementResult.effect === 'burn') {
        e.health -= elementResult.damage;
      }
    }
  }

  // ... resto do código existente
}
```

Ao aplicar crafting de elemento:
```typescript
// No crafting.ts, quando result type é 'element'
if (result.type === 'element') {
  const elementTypes = ['fire', 'ice', 'lightning'];
  applyElement(elementTypes[Math.floor(Math.random() * elementTypes.length)]);
}
```

Na função `draw()`, após desenhar jogador:
```typescript
drawElementIndicator(ctx, player.x, player.y);
```

Na função `resetPlayer()`:
```typescript
resetElements();
```

- [ ] **Step 3: Verificar compilação**

Run: `npx tsc --noEmit`
Expected: Sem erros

- [ ] **Step 4: Commit**

```bash
git add src/elements.ts src/main.ts
git commit -m "feat: add elemental weapon system (fire, ice, lightning)"
```

---

### Task 7: Integração Final e Testes

**Covers:** [S8]

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Adicionar reset de todas as mecânicas**

Na função `resetPlayer()`, garantir que todas as mecânicas sejam resetadas:
```typescript
function resetPlayer() {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.health = player.maxHealth;
  player.invincible = 0;
  player.shield = 0;
  resetDash();
  resetUltimate();
  resetElements();
  resetHazards();
}
```

- [ ] **Step 2: Atualizar HUD com novas informações**

Na função `draw()`, adicionar indicadores:
```typescript
// Indicador de dash
const dashState = getDashState();
if (dashState.cooldown > 0) {
  ctx.fillStyle = '#666';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`DASH: ${dashState.cooldown.toFixed(1)}s`, 20, canvas.height - 60);
} else {
  ctx.fillStyle = '#2ecc71';
  ctx.fillText('DASH: PRONTO [SHIFT]', 20, canvas.height - 60);
}
```

- [ ] **Step 3: Verificar compilação final**

Run: `npx tsc --noEmit`
Expected: Sem erros

- [ ] **Step 4: Testar o jogo**

Run: `npm run dev`
Expected: Jogo inicia com todas as novas mecânicas funcionando

- [ ] **Step 5: Commit final**

```bash
git add src/main.ts
git commit -m "feat: integrate all new game mechanics"
```

---

### Task 8: Merge para Develop

- [ ] **Step 1: Trocar para develop**

```bash
git checkout develop
```

- [ ] **Step 2: Merge feature branch**

```bash
git merge feature/new-game-mechanics
```

- [ ] **Step 3: Verificar compilação**

Run: `npx tsc --noEmit`
Expected: Sem erros

- [ ] **Step 4: Commit se necessário**

```bash
git add .
git commit -m "chore: merge feature/new-game-mechanics into develop"
```

---

### Task 9: Merge para Main

- [ ] **Step 1: Trocar para main**

```bash
git checkout main
```

- [ ] **Step 2: Merge develop**

```bash
git merge develop
```

- [ ] **Step 3: Verificar compilação final**

Run: `npx tsc --noEmit`
Expected: Sem erros

- [ ] **Step 4: Push para GitHub**

```bash
git push origin main
```
