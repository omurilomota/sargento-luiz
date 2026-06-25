# Raycast FPS - Design Specification

## [S1] Problem
Criar um jogo FPS estilo Wolfenstein 3D usando raycasting em Canvas 2D com TypeScript. O jogo deve ter inimigos simples, sistema de ondas progressivas, e ser executável com npm.

## [S2] Solution Overview
Jogo browser-based com raycasting manual em Canvas 2D. Stack: TypeScript puro + Vite. Sem dependências externas. Arquitetura modular com engine (raycasting, rendering, input), game logic (player, enemy, waves, weapons), e UI (HUD, menu).

## [S3] Architecture

### Stack
- TypeScript puro com Canvas 2D API
- Vite para build e dev server
- Nenhuma dependência externa

### File Structure
```
src/
  main.ts          - Entry point, game loop
  engine/
    raycaster.ts   - DDA raycasting algorithm
    renderer.ts    - Canvas rendering, textures
    input.ts       - Keyboard/mouse handling
  game/
    player.ts      - Player state, movement, shooting
    enemy.ts       - Enemy class, AI behavior
    waves.ts       - Wave progression system
    weapons.ts     - Weapon definitions, damage
  ui/
    hud.ts         - Health, ammo, wave info overlay
    menu.ts        - Start screen, game over screen
```

### Game Loop
- requestAnimationFrame-based (60 FPS target)
- Update phase: input → player → enemies → waves → collisions
- Render phase: raycasting → sprites → HUD

## [S4] Game Mechanics

### Player
- Movement: WASD (forward, backward, strafe left/right)
- Look: Mouse rotation (45° Field of View)
- Health: 100 HP, regenerates 1 HP/sec (max 100)
- Weapon: Automatic fire (10 shots/sec, 30 ammo per magazine)

### Raycasting Engine
- Map: 16x16 tile grid (walls, floor, ceiling)
- Rendering: Column-by-column DDA algorithm
- Textures: Procedurally generated (brick, stone patterns)
- Performance: Optimized with lookup tables

### Shooting
- Ray from camera center in look direction
- Hit detection via raycasting against enemy sprites
- Damage: 25 per hit (2 shots to kill basic enemy)
- Visual feedback: Muzzle flash, ammo counter update

## [S5] Enemy System

### Enemy Type: Grunt
- Appearance: 2D sprite (procedurally generated, 64x64)
- Health: 50 HP
- Speed: 60% of player speed
- Damage: 10 per contact (melee)
- Behavior: Chase when visible, patrol when not
- Spawn: 3-5 enemies per wave

### Visibility System
- Enemies only move when in player's field of view
- Out of FOV: enemies stand still
- Line-of-sight check via raycasting

### Sprite Animation
- 4 directional sprites (front, back, left, right)
- Changes based on relative position to player

## [S6] Wave System

### Progression
- Wave 1: 3 enemies (HP 25, 1-shot kill)
- Wave 2: 4 enemies (HP 50, normal)
- Wave 3: 5 enemies (+20% speed)
- Wave 4+: +1 enemy per wave, +10 HP per wave

### Logic
- New wave starts 3 seconds after killing all enemies
- "Wave Complete" message displays during delay
- Enemy counter shows remaining count

### Scoring
- Points: 100 × enemy HP × wave number
- High score tracked in session (localStorage optional)

## [S7] UI/HUD

### HUD Elements
- Health bar: Top-left (red, decreases with damage)
- Ammo counter: Bottom-left ("30/90" current/reserve)
- Wave indicator: Top-center ("WAVE 3")
- Enemy counter: Top-right ("5 remaining")
- Score: Bottom-right (increments with kills)

### Menu System
- Start Screen:
  - Title: "RAYCAST FPS"
  - Instructions: "WASD = move, Mouse = look, Click = shoot"
  - START button (begins wave 1)

- Game Over Screen:
  - Title: "GAME OVER"
  - Final score display
  - RESTART button (resets to wave 1)

### Visual Style
- Sky: Gradient (light blue to dark blue)
- Floor: Dark gray with texture
- Weapon: Simple gun sprite in bottom-center
- Enemies: Red-tinted sprites

## [S8] Technical Implementation

### Raycasting Algorithm
- DDA (Digital Differential Analyzer) for ray-wall intersection
- Column-by-column rendering for performance
- Fish-eye correction for proper perspective

### Collision Detection
- Player-wall: Grid-based collision
- Player-enemy: Distance-based (1.5 tiles)
- Bullet-enemy: Ray-sprite intersection

### Audio (Optional Phase)
- Web Audio API for simple sounds
- Gunshot: White noise burst
- Enemy death: Low frequency thump
- Wave complete: Short jingle

## [S9] Testing Strategy

### Unit Tests
- Raycasting math functions
- Collision detection algorithms
- Wave progression logic

### Integration Tests
- Game state transitions
- Enemy spawning and behavior
- Score calculation

### Manual Testing
- Performance on different browsers
- Input responsiveness
- Visual correctness

## [S10] Build & Run

### Commands
```bash
npm install        # Install Vite
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build
```

### Browser Support
- Modern browsers (Chrome, Firefox, Edge, Safari)
- WebGL not required (Canvas 2D only)
- Responsive canvas sizing
