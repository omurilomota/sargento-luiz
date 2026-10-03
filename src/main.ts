/**
 * src/main.ts — Orquestrador principal do jogo
 *
 * Arquitetura:
 * - Canvas 2D com loop via requestAnimationFrame
 * - Input por teclado (WASD/setas) e mouse (mirar + atirar)
 * - Estado global distribuído entre módulos (phases, weapons, player)
 * - Mundo maior que a tela: a câmera aplica UMA translação por frame e todo o
 *   código de entidade trabalha em coordenadas de mundo
 *
 * Fluxo: menu → cutscene → playing → (waves → shop) → ... → gameover
 */

import { normalize } from './utils';
import { PHASES, ENEMY_TYPES, POWERUP_TYPES } from './config';
import { PALETTE } from './core/palette';

// Entities
import * as player from './entities/player';
import { applyRegen, resetRegen } from './entities/player';
import { getBullets, spawnBullet, updateBullets, clearBullets } from './entities/bullet';
import { getCoins, spawnCoins, updateCoins, clearCoins, setMagnetActive, resetPermanentMagnet } from './entities/coin';

// Systems
import { spawnParticles, updateParticles, clearParticles, getParticles } from './systems/particles';
import { spawnWaveEnemies, resetSpawner, spawnEnemy, setPhaseDifficulty } from './systems/spawner';
import { checkBulletEnemyCollisions, checkEnemyPlayerCollision, checkEnemyBulletPlayerCollision, bulletHitsCircle } from './systems/collision';
import { createExplosion, updateExplosions, clearExplosions } from './systems/explosions';
import { loadMap, colAt, rowAt, charAt, isWall, hasPath, moveCircleBy, rebuildFlowField, sampleFlowDir, pushOutOfWalls, findAll } from './systems/tilemap';
import { initCamera, setViewportSize, setWorldSize, updateCamera, snapCamera, getCamX, getCamY, screenToWorld, drawVoid, isVisible, setShake } from './systems/camera';
import { initProps, getProps, updateProps, damageProp, detonateProp, getBlast, drawProps, clearProps, collapsesOnHit, Prop } from './systems/props';
import { buildTerrain, drawTerrain, clearTerrain } from './systems/terrain';
import { initObjective, updateObjective, peekObjective, endsPhaseOnDone, vipDown, markVipDown, registerObjectiveDestroyed, cellCenter, ReachZone } from './systems/objectives';
import { updateBoss, isBossTelegraphing, getBossTelegraphLabel, clearBossState } from './systems/boss';

import {
  initRenderer, drawMenu, drawCutscene, drawGameOver, drawCoins as renderCoins,
  drawPowerUps as renderPowerUps, drawParticles as renderParticles, drawBullets as renderBullets,
  drawEnemies as renderEnemies, drawPlayer as renderPlayer, drawDamageNumbers, drawPhaseTransition,
  restoreCanvas, drawNPCs, drawBots, drawPause, menuIndexAt, getPauseIndex, movePause, PAUSE_OPTIONS,
} from './systems/renderer';

// UI
import { initHud, drawHud, HudData } from './ui/hud';
import { drawShop, handleShopClick, setShopCoins, getShopCoins, addShopCoins, resetShop, updateShopAds, getPurchasedUpgrades, getPurchasedWeapons, attachShopWheelListener } from './ui/shop';

// Modules
import { shoot, getCurrentWeapon, resetWeapons, canShoot, startReload, updateReload, getCurrentAmmo, getIsReloading, getReloadTimer } from './weapons';
import { getCurrentPhase, getCurrentWave, getGameState, setGameState, nextWave, nextPhase, resetPhases, resetWave, addScore, addScoreFlat, getScore, getCombo, getComboDecay, updateCombo, resetCombo, getKillStreak, wasGameCompleted } from './phases';
import { powerups, spawnPowerUp, updatePowerUps, hasPowerUp, activePowerups } from './powerups';

import {
  initAudio, sfxPistol, sfxShotgun, sfxMachinegun, sfxSniper, sfxLaser, sfxRPG, sfxRaios, sfxGel,
  sfxGranade, sfxMina, sfxExplosion, sfxBossDeath, sfxPlayerHit, sfxCoin, sfxPowerup, sfxWaveStart,
  sfxGameOver, sfxEnemyShoot, sfxDash, sfxShield, sfxFury, sfxMenuMove, sfxMenuSelect, sfxError,
  startMusic, playMusic, setMusicEnabled, setSfxEnabled, isMusicEnabled, isSfxEnabled,
} from './systems/audio';
import { triggerScreenShake, triggerDamageFlash, triggerBossKillFlash, updateFlash, updateSlowMotion, triggerSlowMotion, triggerHitStop, updateHitStop, resetEffects, updateScreenShake, triggerBossZoom, updateBossZoom } from './systems/effects';

import { useSkill, isSkillActive, updateSkills, resetSkills, getDamageMultiplier, getDamageTakenMultiplier, getSkillCooldown, getSkillMaxCooldown, setMoveDirection } from './systems/skills';
import { updateEnvironmentEvents, resetEnvironmentEvents, getEnvironmentWarnings } from './systems/environment';
import { updateCombos, getActiveCombos, getComboDamageBonus, getComboFireRateBonus, getComboHealthBonus, resetCombos } from './systems/combos';
import { setComboHealthMultiplier } from './entities/player';
import { resetSkins } from './systems/skins';
import { resetAds } from './systems/ads';
import { saveGame, loadGame, hasSave, markGameCompleted } from './systems/saveSystem';
import { addLeaderboardEntry } from './systems/leaderboard';
import { loadAchievements, checkAchievements, resetRunCounters } from './systems/achievements';
import { loadDiary, unlockDiaryEntry } from './systems/diary';
import { startTutorial, isTutorialActive, getCurrentHint, updateTutorial } from './systems/tutorial';
import { updateBehavior, registerShot, registerHit, getPlayerTendency, resetBehavior } from './systems/dynamicDifficulty';
import { spawnNPC, updateNPCs, getNPCs, resetNPCs } from './systems/npcs';
import { getBots, createBot, updateBots, removeDeadBots, resetBots, addBot, BotDifficulty } from './systems/bots';
import { isEnabled as isLocalEnabled, initLocalMultiplayer, movePlayer2, shootPlayer2, getPlayer2, resetLocalMultiplayer, checkPlayer2EnemyCollision } from './systems/localMultiplayer';
import { showCutscene, advanceCutscene, skipCutsceneText, isShowingCutscene, updateCutscene, resetStory } from './systems/story';
import { getCurrentMode, setGameMode, GameMode, GAME_MODES } from './systems/gameModes';
import { BIOMES, CELL_SIZE } from './maps';
import { loadAllSprites } from './systems/sprites';

// ─── Canvas Setup ──────────────────────────────────────────────
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  setViewportSize(canvas.width, canvas.height);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

initRenderer(canvas, ctx);
initHud(ctx);
attachShopWheelListener();

// ─── Input ─────────────────────────────────────────────────────

/** Teclas mantidas pressionadas (movimento contínuo). */
const keys: Record<string, boolean> = {};
/**
 * Teclas apertadas NESTE frame (edge). Antes o ENTER ficava `true` para
 * sempre no estado anterior: Game Over → ENTER → menu → o próprio `keys['enter']`
 * ainda verdadeiro entrava na cutscene sozinho.
 */
let keysPressed = new Set<string>();
const mouse = { x: 0, y: 0, down: false };

/** Consome um ENTER pressionado neste frame (edge, com clear do buffer). */
function consumeEnter(): boolean {
  if (!keysPressed.has('enter')) return false;
  keysPressed.delete('enter');
  return true;
}

/** Consome uma tecla de seta/WASD para a navegação de menus. */
function consumeNav(): number {
  let delta = 0;
  if (keysPressed.has('w') || keysPressed.has('arrowup')) delta -= 1;
  if (keysPressed.has('s') || keysPressed.has('arrowdown')) delta += 1;
  if (delta !== 0) keysPressed.clear();
  return delta;
}

/** Limpa todo o estado de input (toda troca de estado chama isto). */
function resetInput(): void {
  for (const k in keys) keys[k] = false;
  keysPressed.clear();
  mouse.down = false;
}

document.addEventListener('keydown', e => {
  const key = e.key;
  const k = key.toLowerCase();
  const state = getGameState();
  if (!keysPressed.has(k)) keysPressed.add(k);

  // cutscene: escolhas e avanço
  if (isShowingCutscene()) {
    if (isWaitingForChoiceSafe()) {
      if (key === '1') selectChoiceSafe(0);
      if (key === '2') selectChoiceSafe(1);
      if (key === '3') selectChoiceSafe(2);
      return;
    }
    if (k === 'backspace' || key === 'ç') skipCutsceneText();
    keys[k] = true;
    return;
  }

  if (state === 'menu') {
    const idx = GAME_MODES.findIndex(m => m.key === key);
    if (idx >= 0) {
      if (selectedMode !== GAME_MODES[idx].mode) sfxMenuMove();
      selectedMode = GAME_MODES[idx].mode;
    }
    if (k === 'c' && hasSave()) startFromSave();
    return;
  }

  if (state === 'paused') {
    if (key === 'Escape') {
      setGameState('playing');
      return;
    }
    const nav = consumeNav();
    if (nav !== 0) {
      movePause(nav);
      sfxMenuMove();
    }
    return;
  }

  if (state !== 'playing') {
    keys[k] = true;
    return;
  }

  keys[k] = true;

  if (key === ' ') { if (useSkill('dash')) sfxDash(); }
  if (k === 'f') { if (useSkill('shield')) sfxShield(); }
  if (k === 'e') { if (useSkill('fury')) sfxFury(); }
  if (k === 'r') startReload();
  if (key === 'Escape') setGameState('paused');
});

document.addEventListener('keyup', e => {
  // sempre limpa: antes só limpava em `playing`, e a tecla ficava presa
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('mousedown', e => {
  const state = getGameState();
  if (state === 'playing') mouse.down = true;

  if (state === 'menu') {
    const rect = canvas.getBoundingClientRect();
    const idx = menuIndexAt(e.clientX - rect.left, e.clientY - rect.top, canvas.width, canvas.height);
    if (idx >= 0 && GAME_MODES[idx].mode !== selectedMode) {
      selectedMode = GAME_MODES[idx].mode;
      sfxMenuMove();
    }
  }

  if (state === 'shop') handleShopClick(e.clientX, e.clientY);
  if (state === 'paused') { /* só ENTER confirma */ }
  e.preventDefault();
});
document.addEventListener('mouseup', () => { mouse.down = false; });
document.addEventListener('contextmenu', e => e.preventDefault());
// segurar o clique na loja e voltar ao jogo não pode dar tiro automático
window.addEventListener('blur', () => { resetInput(); });

// ─── Estado ────────────────────────────────────────────────────
import { Enemy } from './types';
let enemies: Enemy[] = [];
let damageNumbers: { x: number; y: number; text: string; color: string; life: number; vy: number }[] = [];
let lastTime = 0;
let phaseTransitionTimer = 0;
let achievementNotifications: { name: string; time: number }[] = [];
let playerDied = false;
let bossZoomTriggered = false;
let currentBossZoom = 1;
let currentFlash: string | null = null;
let currentShake: { x: number; y: number } = { x: 0, y: 0 };
let selectedMode: GameMode = 'campaign';
let bossSpawned = false;
let worldW = 1280;
let worldH = 720;
/**paredes do mapa em coordenadas de mundo, para o minimapa */
let wallRects: { x: number; y: number; w: number; h: number }[] = [];
let mapDensity = 0;
let reachZones: ReachZone[] = [];

/** Importações tardias para evitar ciclo com o estado local acima. */
import { isWaitingForChoice, selectChoice } from './systems/story';

function isWaitingForChoiceSafe(): boolean { return isWaitingForChoice(); }
function selectChoiceSafe(i: number): void { selectChoice(i); }

/** Carrega mapa, terreno, props, câmera e objetivo da fase atual. */
/**
 * Acha uma célula andável a 8–12 células do spawn, para o sobrevivente do
 * objetivo `protect`.
 *
 * Distância importa: com o NPC colado no jogador, "proteger o sobrevivente" e
 * "proteger a si mesmo" viram literalmente o mesmo objetivo, e o arquiereiro
 * caçando o NPC parece indistinguishable de qualquer inimigo normal.
 */
function findVipCell(origin: { col: number; row: number }): { col: number; row: number } {
  const direcoes: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const raio of [12, 11, 10, 9, 8]) {
    for (const [dc, dr] of direcoes) {
      const col = origin.col + dc * raio;
      const row = origin.row + dr * raio;
      if (!isWall(col, row) && hasPath(origin.col, origin.row, col, row)) return { col, row };
    }
  }
  return { col: origin.col + 1, row: origin.row };
}

function loadPhaseEnvironment(): void {
  const phase = getCurrentPhase();
  const biome = BIOMES[phase.map];
  const map = loadMap(biome.rows);

  worldW = map.width;
  worldH = map.height;
  setWorldSize(worldW, worldH);

  wallRects = [];
  let wallCount = 0;
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      if (charAt(col, row) !== '#') continue;
      wallCount++;
      wallRects.push({ x: col * CELL_SIZE, y: row * CELL_SIZE, w: CELL_SIZE, h: CELL_SIZE });
    }
  }
  mapDensity = wallCount / (map.cols * map.rows);

  clearProps();
  initProps(map.cells);
  setPhaseDifficulty(phase.difficulty ?? 1);
  clearTerrain();
  buildTerrain(biome, map.cells);

  reachZones = findAll('R').map(p => ({ ...cellCenter(p.col, p.row), radius: CELL_SIZE }));
  initObjective(phase.objective, phase.objectiveTarget);

  const spawn = findAll('P')[0] ?? { col: 1, row: 1 };
  const pos = cellCenter(spawn.col, spawn.row);

  // O objetivo protect precisa de um sobrevivente determinístico: os NPCs que
  // aparecem na loja são aleatórios e podem não existir nenhum. Nasce do lado
  // do jogador, e o índice 0 é o que o objectives.ts lê.
  resetNPCs();
  if (phase.objective === 'protect') {
    const vipCell = findVipCell(spawn);
    const vip = cellCenter(vipCell.col, vipCell.row);
    spawnNPC(vip.x, vip.y, 1);
  }
  player.initPlayer(worldW, worldH);
  player.getPlayer().x = pos.x;
  player.getPlayer().y = pos.y;
  initCamera(worldW, worldH, canvas.width, canvas.height, pos.x, pos.y);
  bossSpawned = false;
}

function resetGame() {
  resetPhases();
  loadPhaseEnvironment();
  resetWeapons();
  resetShop();
  resetSpawner();
  resetEffects();
  resetSkills();
  resetEnvironmentEvents();
  resetPermanentMagnet();
  resetCombos();
  resetBots();
  resetRegen();
  resetSkins();
  resetAds();
  resetNPCs();
  resetStory();
  bossZoomTriggered = false;
  enemies.length = 0;
  damageNumbers.length = 0;
  achievementNotifications.length = 0;
  clearBullets();
  clearCoins();
  clearParticles();
  clearExplosions();
  resetInput();
}

/** Entra no jogo a partir do save (tecla C no menu). */
function startFromSave() {
  const save = loadGame();
  if (!save) return;
  initAudio();
  startMusic();
  resetGame();
  setGameMode('campaign');
  for (let i = 0; i < save.phase; i++) nextPhase();
  loadPhaseEnvironment();
  setShopCoins(save.coins);
  addScoreFlat(save.score);
  setGameState('playing');
  loadAchievements();
  loadDiary();
  resetRunCounters();
  resetBehavior();
  resetInput();
}

// ─── Update ────────────────────────────────────────────────────

function update(dt: number) {
  const state = getGameState();

  if (state === 'menu') {
    if (isShowingCutscene()) {
      updateCutscene(dt);
      if (consumeEnter() || keys[' ']) {
        const finished = advanceCutscene();
        if (finished) startRun();
      }
    } else if (consumeEnter()) {
      initAudio();
      startMusic();
      resetGame();
      showCutscene();
      sfxMenuSelect();
    }
    return;
  }

  if (state === 'paused') {
    if (consumeEnter()) applyPauseOption();
    return;
  }

  if (state === 'gameover') {
    if (consumeEnter()) {
      resetGame();
      setGameState('menu');
      resetInput();
    }
    return;
  }

  if (state === 'shop') {
    updateShopAds(dt);
    if (consumeEnter()) leaveShop();
    return;
  }

  if (state !== 'playing') return;

  const p = player.getPlayer();
  const phase = getCurrentPhase();
  const hard = getCurrentMode() === 'hardcore';

  if (phaseTransitionTimer > 0) phaseTransitionTimer -= dt;

  // ── movimento ──
  let mx = 0;
  let my = 0;
  if (keys['w'] || keys['arrowup']) my -= 1;
  if (keys['s'] || keys['arrowdown']) my += 1;
  if (keys['a'] || keys['arrowleft']) mx -= 1;
  if (keys['d'] || keys['arrowright']) mx += 1;
  setMoveDirection(mx, my);

  const speedMult = hasPowerUp('speed') ? 1.5 : 1;
  // lama deixa o jogador lento — é o efeito mecânico do bioma Pântano
  const onMud = phase.hazard === 'mud' && charAt(colAt(p.x), rowAt(p.y)) === '^';
  player.movePlayer(keys, dt, { w: worldW, h: worldH }, speedMult * (onMud ? 0.55 : 1));

  updateSkills(dt, p, { w: worldW, h: worldH });
  p.x = pushOutOfWalls(p.x, p.y, p.radius).x;
  p.y = pushOutOfWalls(p.x, p.y, p.radius).y;

  // ── mira: mouse é de tela, mundo é maior ──
  const aim = screenToWorld(mouse.x, mouse.y);
  p.angle = Math.atan2(aim.y - p.y, aim.x - p.x);

  applyRegen(dt);
  if (hasPowerUp('invincible')) p.invincible = Math.max(p.invincible, 0.1);

  // ── flow field (IA dos inimigos) ──
  rebuildFlowField(colAt(p.x), rowAt(p.y));

  // ── local 2P ──
  if (isLocalEnabled()) {
    movePlayer2(keys, dt, worldW, worldH);
    const p2 = getPlayer2();
    if (p2 && p2.alive && keys['l']) {
      const bullet = shootPlayer2();
      if (bullet) spawnBullet(bullet.x, bullet.y, bullet.vx, bullet.vy, bullet.damage, false, bullet.color, false, false, 0, false);
    }
  }

  // ── eventos ambientais (agora com dimensões do mundo) ──
  const envResult = updateEnvironmentEvents(dt, enemies, p.x, p.y, worldW, worldH);
  for (const d of envResult.enemyDamages) {
    damageNumbers.push({ x: d.x + (Math.random() - 0.5) * 16, y: d.y, text: String(Math.floor(d.damage)), color: d.color, life: 0.8, vy: -60 });
  }
  if (envResult.playerDamage > 0 && p.invincible <= 0) {
    const dmg = Math.floor(envResult.playerDamage * getDamageTakenMultiplier());
    if (dmg > 0) {
      checkAchievements('damage_taken');
      player.enemyCollisionDamage(dmg);
      sfxPlayerHit();
      triggerDamageFlash();
    }
  }

  // ── hazard do bioma ──
  updateBiomeHazard(dt, p);

  // ── disparo ──
  p.shootCooldown -= dt;
  updateReload(dt);
  if (mouse.down && p.shootCooldown <= 0 && canShoot()) {
    const weapon = getCurrentWeapon();
    p.shootCooldown = weapon.shootRate * getComboFireRateBonus();
    const multiShot = hasPowerUp('multiShot');
    const fired = shoot(p.x, p.y, p.angle, multiShot, getDamageMultiplier() * getComboDamageBonus());
    for (const b of fired) {
      spawnBullet(b.x, b.y, b.vx, b.vy, b.damage, false, b.color, b.pierce, b.explosive, b.explosionRadius, b.isCrit);
    }
    const muzzleX = p.x + Math.cos(p.angle) * 24;
    const muzzleY = p.y + Math.sin(p.angle) * 24;
    spawnParticles(muzzleX, muzzleY, weapon.color, 4, 120);
    playWeaponSound(weapon.name);
    registerShot();
    if (getCurrentAmmo() <= 0) startReload();
  }

  if (p.invincible > 0) p.invincible -= dt;

  // ── ondas ──
  const rect = { w: worldW, h: worldH, px: getCamX(), py: getCamY(), viewW: canvas.width, viewH: canvas.height };
  const waveComplete = spawnWaveEnemies(dt, enemies, getCurrentWave(), phase.enemyTypes, worldW, worldH, rect);
  if (waveComplete) {
    nextWave();
    if (!hard) player.healOnWaveComplete();
    sfxWaveStart();
    const waveAch = checkAchievements('wave', getCurrentWave());
    if (waveAch) pushToast(waveAch.name, 3);
    if (getGameState() === 'shop') enterShop();
  }

  updateBehavior(p.x, p.y, enemies.length);

  if (!bossZoomTriggered) {
    for (const e of enemies) {
      if (ENEMY_TYPES[e.type]?.isBoss) {
        bossZoomTriggered = true;
        break;
      }
    }
  }

  // ── IA dos inimigos: flow field + separação ──
  const tendency = getPlayerTendency();
  for (const e of enemies) {
    if (e.spawnDelay > 0) {
      e.spawnDelay -= dt;
      continue;
    }
    if (e.hitFlash > 0) e.hitFlash -= dt;

    const def = ENEMY_TYPES[e.type];
    if (def?.isBoss) {
      for (const minion of updateBoss(e, p.x, p.y, worldW, worldH, dt)) enemies.push(minion);
      // boss não entra no empilhamento
      if (e.hitFlash > 0) continue;
    } else {
      // O caçador do NPC (huntsNpc) ignora o flow field, que aponta para o
      // jogador, e vai direto no sobrevivente. Sem isso o objetivo protect é só
      // "não deixe o NPC morrer", e o NPC foge de todo mundo por igual — o
      // jogador não teria nada a fazer além de limpar a fase como sempre.
      const prey = def?.huntsNpc ? getNPCs().find(n => n.alive) : undefined;
      const flow = sampleFlowDir(e.x, e.y);
      // perto do jogador o flow field é ruidoso: aí vai o seek direto
      const distToPlayer = Math.hypot(p.x - e.x, p.y - e.y);
      let seekX: number;
      let seekY: number;
      if (prey) {
        const caça = normalize({ x: prey.x - e.x, y: prey.y - e.y });
        seekX = caça.x;
        seekY = caça.y;
      } else if (distToPlayer < 140) {
        const direct = normalize({ x: p.x + tendency.h * 60 - e.x, y: p.y + tendency.v * 60 - e.y });
        seekX = direct.x;
        seekY = direct.y;
      } else if (flow.x !== 0 || flow.y !== 0) {
        seekX = flow.x;
        seekY = flow.y;
      } else {
        const direct = normalize({ x: p.x - e.x, y: p.y - e.y });
        seekX = direct.x;
        seekY = direct.y;
      }

      // separação: resolve o empilhamento sem custo de pathfinding
      let sepX = 0;
      let sepY = 0;
      for (const other of enemies) {
        if (other === e) continue;
        const d = Math.hypot(other.x - e.x, other.y - e.y);
        const minDist = e.radius + other.radius;
        if (d > 0.001 && d < minDist) {
          const push = (minDist - d) / minDist;
          sepX -= ((other.x - e.x) / d) * push;
          sepY -= ((other.y - e.y) / d) * push;
        }
      }

      const spd = e.type === 'mosquito' ? e.speed * 1.3 : e.speed;
      const gravityPush = phase.hazard === 'lowGravity' ? 1.35 : 1;
      const next = moveCircleBy(
        e.x, e.y,
        (seekX + sepX * 1.6) * spd * dt * gravityPush,
        (seekY + sepY * 1.6) * spd * dt * gravityPush,
        e.radius
      );
      e.x = next.x;
      e.y = next.y;
    }

    if (e.canShoot && !ENEMY_TYPES[e.type]?.isBoss) {
      e.shootTimer -= dt;
      // o caçador atira no sobrevivente, não no jogador
      const preyAlvo = def?.huntsNpc ? getNPCs().find(n => n.alive) : undefined;
      if (e.shootTimer <= 0) shootEnemyAt(e, preyAlvo ? preyAlvo.x : p.x, preyAlvo ? preyAlvo.y : p.y);
    }

    if (ENEMY_TYPES[e.type]?.leavesFire) {
      e.attackTimer += dt;
      if (e.attackTimer >= 0.5) {
        e.attackTimer = 0;
        spawnParticles(e.x, e.y + e.radius, '#c46a3a', 3, 50);
      }
    }
  }

  // ── bots (competitivo) ──
  if (getCurrentMode() === 'competitive') updateBotsAndCompetitors(p);

  // ── colisões ──
  const activeEnemies = enemies.filter(e => e.spawnDelay <= 0);
  checkEnemyPlayerCollision(activeEnemies, p.x, p.y, p.radius, p.invincible, (e) => {
    const baseDmg = hasPowerUp('invincible') ? 0 : e.damage;
    const dmg = Math.floor(baseDmg * getDamageTakenMultiplier());
    if (dmg > 0) {
      checkAchievements('damage_taken');
      player.enemyCollisionDamage(dmg);
      sfxPlayerHit();
      triggerDamageFlash();
    }
    // Encostar mata melee — investir num zumbi funciona e é uma decisão do
    // jogador. Chefe não: VIGIA, ALPHA WOLF e REI MUTANTE abrem o padrão com
    // investida, e se matariam sozinhos no contato, o que entregava a luta de
    // graça para quem ficasse parado. O chefe leva o dano e continua.
    if (!ENEMY_TYPES[e.type]?.isBoss) killEnemy(e, false);
  });

  const bullets = getBullets();

  checkEnemyBulletPlayerCollision(bullets, p.x, p.y, p.radius, p.invincible, (b) => {
    const dmg = Math.floor(b.damage * getDamageTakenMultiplier());
    if (dmg > 0) {
      checkAchievements('damage_taken');
      player.enemyCollisionDamage(dmg);
      sfxPlayerHit();
      triggerDamageFlash();
    }
    b.life = 0;
    spawnParticles(b.x, b.y, b.color, 3, 100);
  });

  // projétil vs prop (a bala quebra o que estiver no caminho)
  updateBulletProps(bullets);

  checkBulletEnemyCollisions(bullets, enemies, (b, e) => {
    e.hitFlash = 0.15;
    registerHit();
    // crítico vem do flag, não de comparar string de cor
    const isCrit = b.isCrit;
    if (b.explosive && b.explosionRadius) {
      createExplosion(b.x, b.y, b.explosionRadius, b.damage, enemies, b.color);
      sfxExplosion();
      triggerScreenShake(5, 0.15);
    } else {
      e.health -= b.damage;
      damageNumbers.push({
        x: e.x + (Math.random() - 0.5) * 20,
        y: e.y - 20,
        text: isCrit ? `${Math.floor(b.damage)}!` : String(Math.floor(b.damage)),
        color: isCrit ? PALETTE.crit : PALETTE.text,
        life: 1,
        vy: -80,
      });
    }
    if (isCrit) {
      triggerSlowMotion(0.15, 0.3);
      spawnParticles(b.x, b.y, PALETTE.crit, 8, 200);
    }
    if (!b.pierce) b.life = 0;
    spawnParticles(b.x, b.y, b.color, 3, 150);
    triggerHitStop(0.015);
  });

  if (getCurrentMode() === 'competitive') {
    for (const b of bullets) {
      if (b.isEnemy || b.life <= 0) continue;
      for (const bot of getBots()) {
        if (b.life <= 0) break;
        if (bulletHitsCircle(b, bot.x, bot.y, bot.radius + 5)) {
          bot.health -= b.damage;
          damageNumbers.push({
            x: bot.x + (Math.random() - 0.5) * 20,
            y: bot.y - 20,
            text: b.isCrit ? `${Math.floor(b.damage)}!` : String(Math.floor(b.damage)),
            color: b.isCrit ? PALETTE.crit : PALETTE.text,
            life: 1,
            vy: -80,
          });
          if (!b.pierce) b.life = 0;
          spawnParticles(b.x, b.y, b.color, 3, 150);
        }
      }
    }
  }

  // ── limpeza dos mortos ──
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].health <= 0) killEnemy(enemies[i], true);
  }

  updateBullets(dt, worldW, worldH);
  updateParticles(dt);
  updateExplosions(dt);
  updateBarrels(dt);
  updateDamageNumbers(dt);

  updateCombo(dt);
  updateCombos();
  setComboHealthMultiplier(getComboHealthBonus());
  updateTutorial(dt);
  setMagnetActive(hasPowerUp('magnet'));

  // `getPlayer2` não tem guard de `enabled` por dentro, então o modo é conferido
  // antes de puxar o objeto — senão o código lia estado de uma sessão local
  // anterior mesmo estando em campanha.
  const p2 = isLocalEnabled() ? getPlayer2() : null;
  if (p2) {
    for (const e of enemies) {
      if (e.health > 0 && checkPlayer2EnemyCollision(e.x, e.y, e.radius)) {
        e.health = 0;
        spawnParticles(e.x, e.y, e.color, 12, 200);
      }
    }
  }

  updateCoins(dt, p.x, p.y, p.radius, (v) => {
    addScoreFlat(v);
    addShopCoins(v);
    sfxCoin();
  });
  updatePowerUps(dt, p.x, p.y, p.radius, (type) => {
    if (type === 'health') player.healPlayer(30);
    if (type === 'shield') p.shield += 2;
    spawnParticles(p.x, p.y, POWERUP_TYPES[type].color, 15, 200);
    sfxPowerup();
  });

  updateNPCs(dt, p.x, p.y, enemies);

  // ── objetivo da fase ──
  // Em fases com objetivo ≠ clear, cumprir o objetivo encerra a fase: é o que
  // tira o "só matar tudo" e dá uso real ao mapa.
  // ── o sobrevivente do protect caiu: a fase reinicia ──
  // Um objetivo de escolta sem consequência não é escolta: o `protect` devolvia
  // `done: false` para sempre, o chefe nunca aparecia e a fase acabava normal
  // como se nada tivesse acontecido. Reiniciar a fase é mais duro que o fim de
  // fase negativo e não exige sistema de retry — reusa o que já existe para
  // carregar o mapa.
  if (vipDown()) {
    triggerScreenShake(12, 0.6);
    triggerDamageFlash();
    sfxError();
    pushToast('SOBREVIVENTE PERDIDO — RECOMEÇANDO A FASE', 4);
    resetWave();
    loadPhaseEnvironment();
    enemies.length = 0;
    clearBullets();
    return;
  }

  const objective = updateObjective(dt, p.x, p.y, enemies.length, reachZones);

  // ── chefe da fase: campo vazio da última onda, e só depois do objetivo ──
  // O objetivo não encerra a fase: ele LIBERA o chefe. Cumprir o objetivo no
  // primeiro instante encerrava a fase (a `protect` morria na onda 0 de 7, sem
  // chefe), então o objetivo virou o pivot e o chefe o clímax: a fase só acaba
  // quando o chefe cai. `reach` é a exceção e sai pelo return abaixo.
  const objetivoLiberouChefe = phase.objective === 'clear' || objective.done;
  if (!bossSpawned && phase.boss && objetivoLiberouChefe
      && getCurrentWave() === phase.waves - 1 && enemies.length === 0) {
    const cells = findAll('B');
    const pos = cells.length > 0 ? cellCenter(cells[0].col, cells[0].row) : { x: worldW / 2, y: worldH / 2 };
    const boss = spawnEnemy(phase.boss, worldW, worldH, 0, pos.x, pos.y);
    if (boss) {
      boss.spawnDelay = 0;
      boss.health = boss.maxHealth;
      enemies.push(boss);
      bossSpawned = true;
      triggerBossZoom();
      void playMusic('boss');
    }
  }

  if (phase.objective !== 'clear' && objective.done && getGameState() === 'playing'
      && endsPhaseOnDone(phase.objective)) {
    enemies.length = 0;
    clearBullets();
    triggerScreenShake(14, 0.5);
    leaveShop();
    return;
  }

  // ── morte / game over ──
  if (p.health <= 0 && p.deathTimer === 0) {
    playerDied = true;
    p.deathTimer = 1.5;
    addLeaderboardEntry('Jogador', getScore(), getCurrentWave());
    spawnParticles(p.x, p.y, PALETTE.moss, 30, 300);
    spawnParticles(p.x, p.y, PALETTE.title, 15, 200);
    triggerSlowMotion(0.3, 1.0);
    triggerScreenShake(12, 0.6);
    sfxGameOver();
  }
  if (p.deathTimer > 0) {
    p.deathTimer -= dt;
    p.deathAngle += 8 * dt;
    if (p.deathTimer <= 0) {
      setGameState('gameover');
      resetInput();
    }
  }

  if (wasGameCompleted() && !playerDied) {
    markGameCompleted();
    pushToast('FINAL SECRETO: PERFEIÇÃO', 5);
    playerDied = true;
  }

  currentFlash = updateFlash(dt);
  currentBossZoom = updateBossZoom(dt);
  currentShake = updateScreenShake(dt);
  setShake(currentShake.x, currentShake.y);
  updateCamera(dt, p.x, p.y);

  // toasts decaem com dt, não com frame rate
  for (let i = achievementNotifications.length - 1; i >= 0; i--) {
    achievementNotifications[i].time -= dt;
    if (achievementNotifications[i].time <= 0) achievementNotifications.splice(i, 1);
  }
}

/** Hazard do bioma, aplicado sobre o tile onde o jogador está. */
function updateBiomeHazard(dt: number, p: ReturnType<typeof player.getPlayer>): void {
  const phase = getCurrentPhase();
  const ch = charAt(colAt(p.x), rowAt(p.y));
  const onHazard = ch === '^';
  if (!onHazard || phase.hazard === 'none') return;

  const dmg = phase.hazard === 'lava' ? 12 : phase.hazard === 'spikes' ? 8 : phase.hazard === 'electric' ? 14 : 0;
  if (dmg > 0 && p.invincible <= 0) {
    const total = Math.floor(dmg * getDamageTakenMultiplier());
    if (total > 0) {
      player.enemyCollisionDamage(total);
      sfxPlayerHit();
      triggerDamageFlash();
    }
  }
  if (phase.hazard === 'mud') {
    // dano por segundo parado na lama
    p.health = Math.max(0, p.health - 4 * dt);
  }
  if (phase.hazard === 'electric') {
    p.invincible = Math.max(p.invincible, 0.35);
    if (Math.random() < dt * 6) spawnParticles(p.x, p.y, '#c8b890', 2, 90);
  }
}

/**
 * Detona os barris cujo pavio acabou de queimar.
 *
 * O pavio é contado em `updateProps`, que devolve quem expirou. Antes esta
 * função fazia `if (fuse <= 0) continue; fuse = Math.min(fuse, 0)` — que zera o
 * pavio no ato e detona no frame seguinte à ignitação, então os 0.9s de pavio
 * nunca passavam e a faísca do barril era só decoração.
 */
function updateBarrels(dt: number): void {
  for (const prop of updateProps(dt)) explodeProp(prop);
}

function explodeProp(prop: Prop): void {
  const { radius, damage } = getBlast(prop);
  if (radius > 0) {
    createExplosion(prop.x, prop.y, radius, damage, enemies, PALETTE.terracotta);
    spawnParticles(prop.x, prop.y, PALETTE.terracotta, 14, 220);
    sfxExplosion();
    triggerScreenShake(6, 0.25);
  }
  const p = player.getPlayer();
  if (Math.hypot(p.x - prop.x, p.y - prop.y) < radius && p.invincible <= 0) {
    player.enemyCollisionDamage(Math.floor(damage * getDamageTakenMultiplier()));
    sfxPlayerHit();
    triggerDamageFlash();
  }
  for (const destroyed of detonateProp(prop)) {
    if (destroyed !== prop) {
      spawnParticles(destroyed.x, destroyed.y, PALETTE.mustard, 6, 140);
      if (destroyed.kind === 'crate' && Math.random() < 0.5) {
        spawnCoins(destroyed.x, destroyed.y, 1);
      }
    }
  }
}

/**
 * Projéteis quebram props, do jogador e do inimigo.
 *
 * Cobertura que não protege é enfeite: quando o tiro dos inimigos atravessava o
 * caixote, os props das 8 fases sem entulho eram só decoração destruível. Cover
 * agora funciona em todo o jogo, e o que decide a rota é onde o prop está.
 *
 * O que continua exclusivo da Cidade é o desmoronamento: entulho não aguenta
 * tiro e cai inteiro com o primeiro. Isso dá à Cidade a identidade de "a
 * cobertura aqui também é perecível", e cria a tensão de o barril explodido pelo
 * tiro do inimigo explodir em cadeia — a cobertura do jogador virando o
 * problema dele.
 */
function updateBulletProps(bullets: ReturnType<typeof getBullets>): void {
  const collapsing = collapsesOnHit(getCurrentPhase().hazard);
  for (const b of bullets) {
    if (b.life <= 0) continue;
    const fromPlayer = !b.isEnemy;
    for (const prop of getProps()) {
      if (prop.health <= 0) continue;
      if (!bulletHitsCircle(b, prop.x, prop.y, prop.radius)) continue;
      let destroyed: boolean;
      if (collapsing) {
        detonateProp(prop);
        destroyed = true;
      } else {
        destroyed = damageProp(prop, b.damage);
      }
      spawnParticles(b.x, b.y, PALETTE.mustard, 3, 120);
      // só o jogador credita ninho e moeda: tiro de inimigo não pode concluir a
      // fase nem encher o bolso do jogador
      if (fromPlayer && destroyed && prop.kind === 'nest') {
        registerObjectiveDestroyed();
        spawnParticles(prop.x, prop.y, PALETTE.terracotta, 26, 320);
        sfxExplosion();
        triggerScreenShake(8, 0.3);
      }
      if (destroyed) {
        if (prop.kind === 'barrel') {
          explodeProp(prop);
        } else if (fromPlayer) {
          spawnParticles(prop.x, prop.y, PALETTE.mustard, 8, 160);
          if (Math.random() < 0.5) spawnCoins(prop.x, prop.y, 1);
          triggerScreenShake(2, 0.08);
        }
      }
      if (!b.pierce) b.life = 0;
      break;
    }
  }
}

function updateDamageNumbers(dt: number): void {
  for (const d of damageNumbers) {
    d.y += d.vy * dt;
    d.vy += 100 * dt;
    d.life -= dt;
  }
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    if (damageNumbers[i].life <= 0) damageNumbers.splice(i, 1);
  }
}

function shootEnemyAt(e: Enemy, tx: number, ty: number): void {
  const def = ENEMY_TYPES[e.type];
  const angle = Math.atan2(ty - e.y, tx - e.x);
  const speed = def?.bulletSpeed || 300;
  const color = def?.projectileColor || PALETTE.terracotta;
  e.shootTimer = e.shootRate || 2;
  if (def?.spreadShot) {
    for (let s = -1; s <= 1; s++) {
      const a = angle + s * 0.3;
      spawnBullet(e.x, e.y, Math.cos(a) * speed * 0.83, Math.sin(a) * speed * 0.83, e.damage, true, color, false);
    }
  } else if (def?.splitBullet) {
    for (let s = 0; s < 4; s++) {
      const a = angle + (s * Math.PI) / 2;
      spawnBullet(e.x, e.y, Math.cos(a) * speed * 0.67, Math.sin(a) * speed * 0.67, e.damage, true, color, false);
    }
  } else {
    spawnBullet(e.x, e.y, Math.cos(angle) * speed, Math.sin(angle) * speed, e.damage, true, color, false);
  }
  sfxEnemyShoot();
}

/** Aplica dano/morte a um inimigo e credita score, moedas e conquistas. */
function killEnemy(e: Enemy, award: boolean): void {
  const def = ENEMY_TYPES[e.type];
  const idx = enemies.indexOf(e);
  if (idx >= 0) enemies.splice(idx, 1);

  if (award) {
    addScore(e.scoreValue);
    if (def?.coinDrop) spawnCoins(e.x, e.y, def.coinDrop);
    spawnParticles(e.x, e.y, e.color, 20, 300);
    sfxExplosion();
    const killAch = checkAchievements('kill');
    if (killAch) pushToast(killAch.name, 3);
    const scoreAch = checkAchievements('score', getScore());
    if (scoreAch) pushToast(scoreAch.name, 3);
  }

  if (def?.isBoss) {
    clearBossState(e);
    const bossAch = checkAchievements('boss_kill');
    if (bossAch) pushToast(bossAch.name, 3);
    spawnParticles(e.x, e.y, PALETTE.crit, 50, 400);
    triggerSlowMotion(0.3, 0.8);
    triggerBossKillFlash();
    triggerScreenShake(18, 0.8);
    sfxBossDeath();
    spawnPowerUp(e.x, e.y);
    spawnPowerUp(e.x - 20, e.y + 20);
    void playMusic('combat');
  } else if (award && Math.random() < 0.15) {
    spawnPowerUp(e.x, e.y);
  }
}

function updateBotsAndCompetitors(p: ReturnType<typeof player.getPlayer>): void {
  const botList = getBots();
  if (botList.length < 3 && Math.random() < 0.5 * (1 / 60)) {
    const difficulties: BotDifficulty[] = ['easy', 'medium', 'hard'];
    addBot(createBot(difficulties[Math.floor(Math.random() * 3)], worldW, worldH));
  }
  const botBullets = updateBots(1 / 60, p.x, p.y, getBullets(), worldW, worldH);
  for (const b of botBullets) {
    spawnBullet(b.x, b.y, b.vx, b.vy, b.damage, true, b.color, false);
  }
  for (const bot of botList) {
    if (Math.hypot(p.x - bot.x, p.y - bot.y) < p.radius + bot.radius && p.invincible <= 0) {
      const dmg = Math.floor(bot.damage * getDamageTakenMultiplier());
      if (dmg > 0) {
        player.enemyCollisionDamage(dmg);
        sfxPlayerHit();
        triggerDamageFlash();
      }
      bot.health = 0;
      spawnParticles(bot.x, bot.y, bot.color, 12, 200);
    }
  }
  for (const bot of removeDeadBots()) {
    addScore(bot.scoreValue);
    spawnCoins(bot.x, bot.y, bot.coinDrop);
    spawnParticles(bot.x, bot.y, bot.color, 20, 300);
    sfxExplosion();
  }
}

const WEAPON_SOUNDS: Record<string, () => void> = {
  'Pistola': sfxPistol,
  'Shotgun': sfxShotgun,
  'Metralhadora': sfxMachinegun,
  'Sniper': sfxSniper,
  'Laser': sfxLaser,
  'RPG': sfxRPG,
  'Raios': sfxRaios,
  'Gel': sfxGel,
  'Granada': sfxGranade,
  'Mina': sfxMina,
};

function playWeaponSound(name: string): void {
  (WEAPON_SOUNDS[name] || sfxPistol)();
}

function pushToast(name: string, time: number): void {
  // empilha no máximo 3: mais que isso vira parede de texto no canto
  achievementNotifications.push({ name, time });
  while (achievementNotifications.length > 3) achievementNotifications.shift();
}

/** Entra na loja: salva, inventa NPC e troca a música. */
function enterShop(): void {
  if (getCurrentMode() === 'hardcore') {
    leaveShop();
    return;
  }
  const phaseIdx = PHASES.indexOf(getCurrentPhase());
  unlockDiaryEntry(Math.max(0, phaseIdx));
  if (Math.random() < 0.4) spawnNpcAtEdge();
  saveGame(
    phaseIdx,
    0,
    0,
    getShopCoins(),
    getScore(),
    getPurchasedUpgrades(),
    getPurchasedWeapons(),
    getCurrentPhase()?.name || ''
  );
  void playMusic('shop');
}

function spawnNpcAtEdge(): void {
  const side = Math.floor(Math.random() * 4);
  let nx = 0;
  let ny = 0;
  if (side === 0) { nx = Math.random() * worldW; ny = CELL_SIZE * 1.5; }
  else if (side === 1) { nx = worldW - CELL_SIZE * 1.5; ny = Math.random() * worldH; }
  else if (side === 2) { nx = Math.random() * worldW; ny = worldH - CELL_SIZE * 1.5; }
  else { nx = CELL_SIZE * 1.5; ny = Math.random() * worldH; }
  spawnNPC(nx, ny, Math.floor(Math.random() * 3));
}

function leaveShop(): void {
  nextPhase();
  loadPhaseEnvironment();
  enemies.length = 0;
  clearBullets();
  clearCoins();
  clearParticles();
  damageNumbers.length = 0;
  resetCombo();
  // resetNPCs fica em loadPhaseEnvironment: ele monta o estado por fase (props,
  // terreno, objetivo, NPC). Resetar aqui depois apagaria o sobrevivente que o
  // objetivo protect acabou de criar.
  bossZoomTriggered = false;
  phaseTransitionTimer = 2.0;
  resetInput();
  if (getGameState() === 'playing') void playMusic('combat');
}

function startRun(): void {
  setGameMode(selectedMode);
  loadAchievements();
  loadDiary();
  resetRunCounters();
  resetBehavior();
  playerDied = false;
  if (selectedMode === 'campaign') startTutorial();
  // O 2P local precisa ser desligado explicitamente: `enabled` só voltava a
  // false em resetLocalMultiplayer(), que não era chamada em lugar nenhum. Então
  // jogar uma partida local e depois iniciar uma campanha deixava o P2 fantasma
  // ativo — e ele mata qualquer inimigo que encoste nele.
  if (selectedMode === 'local') initLocalMultiplayer(worldW, worldH);
  else resetLocalMultiplayer();
  resetInput();
  setGameState('playing');
  void playMusic('combat');
}

function applyPauseOption(): void {
  switch (PAUSE_OPTIONS[getPauseIndex()].id) {
    case 'resume':
      setGameState('playing');
      break;
    case 'music':
      setMusicEnabled(!isMusicEnabled());
      break;
    case 'sfx':
      setSfxEnabled(!isSfxEnabled());
      break;
    case 'menu':
      resetGame();
      setGameState('menu');
      break;
  }
  sfxMenuSelect();
  resetInput();
}

// ─── Draw ──────────────────────────────────────────────────────

function draw() {
  const state = getGameState();

  if (state === 'menu') {
    if (isShowingCutscene()) drawCutscene();
    else drawMenu(selectedMode);
    return;
  }
  if (state === 'shop') {
    drawShop(ctx, canvas.width, canvas.height, mouse.x, mouse.y);
    return;
  }
  if (state === 'gameover') {
    drawGameOver(getScore(), getKillStreak());
    return;
  }
  if (state === 'paused') {
    drawFrozenWorld();
    drawPause(isMusicEnabled(), isSfxEnabled());
    return;
  }

  drawWorld();

  if (phaseTransitionTimer > 0) {
    drawPhaseTransition(phaseTransitionTimer, getCurrentWave(), getCurrentPhase()?.name);
  }
  if (currentFlash) {
    ctx.fillStyle = currentFlash;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  drawHud(buildHudData());
}

/** Desenha o mundo dentro da translação da câmera (uma vez por frame). */
function drawWorld(): void {
  const shake = currentShake;
  const camX = getCamX();
  const camY = getCamY();
  const phase = getCurrentPhase();
  const p = player.getPlayer();

  ctx.save();
  if (currentBossZoom !== 1) {
    ctx.translate(camX + canvas.width / 2, camY + canvas.height / 2);
    ctx.scale(currentBossZoom, currentBossZoom);
    ctx.translate(-(camX + canvas.width / 2), -(camY + canvas.height / 2));
  }
  ctx.translate(-camX + shake.x, -camY + shake.y);

  drawVoid(ctx);
  drawTerrain(ctx);
  drawProps(
    ctx,
    (x, y, r) => isVisible(x, y, r, r),
    { crate: BIOMES[phase.map].propCrate, barrel: BIOMES[phase.map].propBarrel },
  );
  renderCoins(getCoins());
  renderPowerUps(powerups);
  renderParticles(getParticles());
  renderEnemies(enemies, p.x, p.y, (e) => Math.atan2(p.y - e.y, p.x - e.x));
  drawNPCs(getNPCs());
  if (getCurrentMode() === 'competitive') drawBots(getBots());
  renderBullets(getBullets());
  renderPlayer(p, getCurrentWeapon().weaponClass || 'pistol');
  drawDamageNumbers(damageNumbers);
  if (phase.hazard === 'darkness') drawFlashlightOverlay(p);
  else if (phase.hazard === 'fog') drawFogOverlay(p);

  restoreCanvas();
}

/**
 * Overlay de escuridão da Caverna com o cone da lanterna.
 *
 * Chamado de dentro do espaço que `drawWorld` já transladou pela câmera, então
 * as coordenadas são de mundo e não podem ser transladadas de novo: o bloco
 * fazia `translate(-camX, -camY)` sobre uma matriz que já tinha `-camX`, e o
 * furo do cone saía deslocado de (camX, camY) em relação à viewport. Como
 * `camX` é 0 só no canto do mapa, a Caverna ficava com a lanterna fora de
 * lugar no resto do mapa.
 */
function drawFlashlightOverlay(p: ReturnType<typeof player.getPlayer>): void {
  const camX = getCamX();
  const camY = getCamY();
  const shake = currentShake;
  ctx.save();
  ctx.beginPath();
  ctx.rect(camX - shake.x, camY - shake.y, canvas.width, canvas.height);
  ctx.arc(p.x, p.y, 240, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.001)';
  ctx.fill();
  ctx.restore();

  const grad = ctx.createRadialGradient(p.x, p.y, 30, p.x, p.y, 240);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.82)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Névoa da Floresta: vinheta macia centrada no jogador.
 *
 * Não é a lanterna da Caverna outro dia mais fraca. A escuridão tem cone e
 * corta o resto da tela de uma vez; a névoa é larga e gradual — você continua
 * lendo a forma das coisas, só não vê o que está longe. Verde morto do
 * bioma, sem o preto fechado da caverna.
 */
function drawFogOverlay(p: ReturnType<typeof player.getPlayer>): void {
  const camX = getCamX();
  const camY = getCamY();
  const cx = p.x - camX;
  const cy = p.y - camY;
  const grad = ctx.createRadialGradient(cx, cy, 130, cx, cy, 470);
  grad.addColorStop(0, 'rgba(30, 40, 30, 0)');
  grad.addColorStop(0.5, 'rgba(28, 38, 28, 0.44)');
  grad.addColorStop(1, 'rgba(22, 32, 22, 0.82)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/** Cena congelada durante a pausa. */
function drawFrozenWorld(): void {
  drawWorld();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function buildHudData(): HudData {
  const p = player.getPlayer();
  const phase = getCurrentPhase();
  const weapon = getCurrentWeapon();
  const reloadTime = weapon.reloadTime;

  const boss = enemies.find(e => ENEMY_TYPES[e.type]?.isBoss);

  return {
    phase: phase.name,
    health: p.health,
    maxHealth: p.maxHealth,
    shield: p.shield,
    score: getScore(),
    coins: getShopCoins(),
    wave: getCurrentWave(),
    maxWave: phase.waves,
    enemies: enemies.length,
    weapon: weapon.name,
    ammo: getCurrentAmmo(),
    maxAmmo: weapon.magazineSize,
    reloading: getIsReloading(),
    reloadProgress: reloadTime > 0 ? 1 - Math.max(0, getReloadTimer()) / reloadTime : 1,
    combo: getCombo(),
    comboDecay: getComboDecay(),
    skills: [
      { key: 'SPC', name: 'Dash', cooldown: getSkillCooldown('dash'), maxCooldown: getSkillMaxCooldown('dash'), active: isSkillActive('dash') },
      { key: 'F', name: 'Escudo', cooldown: getSkillCooldown('shield'), maxCooldown: getSkillMaxCooldown('shield'), active: isSkillActive('shield') },
      { key: 'E', name: 'Furia', cooldown: getSkillCooldown('fury'), maxCooldown: getSkillMaxCooldown('fury'), active: isSkillActive('fury') },
    ],
    activePowerups,
    powerupMeta: Object.fromEntries(Object.entries(POWERUP_TYPES).map(([k, v]) => [k, { color: v.color, symbol: v.symbol }])),
    worldSize: { w: worldW, h: worldH },
    minimap: { walls: wallRects, density: mapDensity },
    player: { x: p.x, y: p.y },
    enemyDots: enemies.map(e => ({ x: e.x, y: e.y, boss: !!ENEMY_TYPES[e.type]?.isBoss })),
    propDots: getProps().filter(pr => pr.health > 0).map(pr => ({ x: pr.x, y: pr.y, barrel: pr.kind === 'barrel' })),
    boss: boss && ENEMY_TYPES[boss.type]?.bossName
      ? {
        name: ENEMY_TYPES[boss.type]!.bossName!,
        health: boss.health,
        maxHealth: boss.maxHealth,
        telegraphing: isBossTelegraphing(boss),
        telegraphLabel: getBossTelegraphLabel(boss),
      }
      : null,
    objective: peekObjective(p.x, p.y, enemies.length, reachZones),
    warnings: getEnvironmentWarnings(),
    combos: getActiveCombos().map(c => ({ name: c.name, description: c.description, color: c.color })),
    hint: isTutorialActive() ? getCurrentHint() : null,
    toasts: achievementNotifications,
  };
}

// ─── Game Loop ─────────────────────────────────────────────────

function loop(time: number) {
  const rawDt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  if (!updateHitStop(rawDt)) {
    const dt = updateSlowMotion(rawDt);
    update(dt);
  }

  // o screen shake é consumido dentro do draw (uma vez por frame)
  draw();
  keysPressed.clear();
  requestAnimationFrame(loop);
}

// ─── Boot ──────────────────────────────────────────────────────

async function init() {
  await loadAllSprites();
  const phase = PHASES[0];
  loadPhaseEnvironment();
  initCamera(worldW, worldH, canvas.width, canvas.height, player.getPlayer().x, player.getPlayer().y);
  snapCamera(player.getPlayer().x, player.getPlayer().y);
  initObjective(phase.objective, phase.objectiveTarget);
  requestAnimationFrame((time) => {
    lastTime = time;
    loop(time);
  });
}


init();
init();
