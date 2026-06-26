/**
 * src/main.ts — Orquestrador principal do jogo
 *
 * Arquitetura:
 * - Canvas 2D para renderização com loop de jogo via requestAnimationFrame
 * - Input via teclado (WASD/setas) e mouse (mover + click)
 * - Estado global gerenciado por módulos separados (gameState, phases, weapons)
 * - Entidades (player, bullets, coins) mantêm arrays internos
 * - Sistemas (collision, spawner, particles) processam lógica por turno
 * - Renderer desenha tudo usando o Canvas 2D API
 * - UI composta por HTML (HUD) e Canvas (shop)
 *
 * Fluxo do jogo:
 * 1. Menu → ENTER → Jogo
 * 2. Jogando: ondas de inimigos → loja entre fases → próxima fase
 * 3. Game Over → ENTER → Menu
 */

import { dist, normalize } from './utils';
import { PHASES, ENEMY_TYPES, POWERUP_TYPES } from './config';

// Entities
import * as player from './entities/player';
import { applyRegen, resetRegen, getArmorLevel } from './entities/player';
import { getBullets, spawnBullet, updateBullets, clearBullets } from './entities/bullet';
import { getCoins, spawnCoins, updateCoins, clearCoins, setMagnetActive, resetPermanentMagnet } from './entities/coin';

// Systems
import { spawnParticles, updateParticles, clearParticles, getParticles } from './systems/particles';
import { spawnWaveEnemies, resetSpawner, spawnEnemy } from './systems/spawner';
import { checkBulletEnemyCollisions, checkEnemyPlayerCollision, checkEnemyBulletPlayerCollision } from './systems/collision';
import { createExplosion, updateExplosions, clearExplosions, getExplosions } from './systems/explosions';
import { initRenderer, drawMenu, drawCutscene, drawGameOver, drawGameBackground, drawCoins as renderCoins, drawPowerUps as renderPowerUps, drawParticles as renderParticles, drawBullets as renderBullets, drawEnemies as renderEnemies, drawPlayer as renderPlayer, drawDamageNumbers, drawCombo, drawWeaponInfo, drawActivePowerUps as renderActivePowerUps, drawPhaseTransition, restoreCanvas } from './systems/renderer';

// UI
import { initHud, updateHud, setHudVisible } from './ui/hud';
import { drawShop, handleShopClick, setShopCoins, getShopCoins, addShopCoins, resetShop, updateShopAds, getPurchasedUpgrades, getPurchasedWeapons } from './ui/shop';

// Existing modules (unchanged)
import { shoot, getCurrentWeapon, resetWeapons, canShoot, useAmmo, startReload, updateReload, getCurrentAmmo, getIsReloading, getReloadTimer } from './weapons';
import { getCurrentPhase, getCurrentWave, getGameState, setGameState, nextWave, nextPhase, resetPhases, addScore, addScoreFlat, getScore, getCombo, updateCombo, resetCombo, getKillStreak, wasGameCompleted } from './phases';
import { powerups, spawnPowerUp, updatePowerUps, hasPowerUp, activePowerups } from './powerups';

// Audio & Visual Juice
import { initAudio, sfxPistol, sfxShotgun, sfxMachinegun, sfxSniper, sfxLaser, sfxRPG, sfxRaios, sfxGel, sfxGranade, sfxMina, sfxExplosion, sfxBossDeath, sfxPlayerHit, sfxCoin, sfxPowerup, sfxLevelUp, sfxWaveStart, sfxBuy, sfxError, sfxGameOver, sfxHitStop, sfxEnemyShoot, startMusic } from './systems/audio';
import { triggerScreenShake, triggerDamageFlash, triggerLevelUpFlash, triggerBossKillFlash, updateFlash, updateSlowMotion, triggerSlowMotion, triggerHitStop, updateHitStop, resetEffects } from './systems/effects';

// Player Skills
import { useSkill, isSkillActive, updateSkills, resetSkills, getDamageMultiplier, getDamageTakenMultiplier, getSkillCooldown, getSkillMaxCooldown, isSkillOnCooldown } from './systems/skills';

// Environment Events
import { updateEnvironmentEvents, resetEnvironmentEvents, isEarthquakeActive, isStormActive } from './systems/environment';

// Combo Builds
import { updateCombos, getActiveCombos, getComboDamageBonus, getComboFireRateBonus, resetCombos } from './systems/combos';

// Skins
import { resetSkins } from './systems/skins';

// Ads
import { resetAds } from './systems/ads';

// Save/Load
import { saveGame, loadGame, hasSave, markGameCompleted } from './systems/saveSystem';

// Leaderboard
import { addLeaderboardEntry } from './systems/leaderboard';

// Achievements
import { loadAchievements, checkAchievements, resetRunCounters, getAllAchievements } from './systems/achievements';

// Diary
import { loadDiary, unlockDiaryEntry, getUnlockedDiary } from './systems/diary';

// Tutorial
import { startTutorial, isTutorialActive, getCurrentHint, updateTutorial } from './systems/tutorial';

// Dynamic Difficulty
import { updateBehavior, registerShot, registerHit, getPlayerTendency, resetBehavior } from './systems/dynamicDifficulty';

// Bots (Competitive Mode)
import { getBots, createBot, updateBots, removeDeadBots, resetBots, addBot, BotDifficulty } from './systems/bots';

// Local Multiplayer
import { isEnabled as isLocalEnabled, initLocalMultiplayer, movePlayer2, shootPlayer2, damagePlayer2, getPlayer2, resetLocalMultiplayer, isGameOver as isLocalGameOver, getWinner as getLocalWinner, checkPlayer2EnemyCollision } from './systems/localMultiplayer';

// Story & Game Modes
import { showCutscene, advanceCutscene, skipCutsceneText, isShowingCutscene, updateCutscene, getCurrentCutscene, nextCutscene, resetStory, isLineComplete, isWaitingForChoice, selectChoice } from './systems/story';
import { getCurrentMode, setGameMode, GameMode } from './systems/gameModes';

// ─── Canvas Setup ──────────────────────────────────────────────
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

initRenderer(canvas, ctx);
initHud();

// ─── Input ─────────────────────────────────────────────────────
const keys: Record<string, boolean> = {};
const mouse = { x: 0, y: 0, down: false };
document.addEventListener('keydown', e => {
  const key = e.key;
  const state = getGameState();

  // Cutscene choice selection
  if (isShowingCutscene() && isWaitingForChoice()) {
    if (key === '1') selectChoice(0);
    if (key === '2') selectChoice(1);
    if (key === '3') selectChoice(2);
    keys[key.toLowerCase()] = true;
    return;
  }

  // Mode selection in menu (number keys)
  if (state === 'menu' && !isShowingCutscene()) {
    if (key === '1') selectedMode = 'campaign';
    if (key === '2') selectedMode = 'survival';
    if (key === '3') selectedMode = 'missions';
    if (key === '4') selectedMode = 'bossrush';
    if (key === '5') selectedMode = 'competitive';
    if (key === '6') selectedMode = 'local';
    if (key === '7') selectedMode = 'hardcore';
    // Continue saved game
    if (key.toLowerCase() === 'c' && hasSave()) {
      const save = loadGame();
      if (save) {
        initAudio();
        startMusic();
        resetGame();
        setGameMode('campaign');
        setGameState('playing');
        for (const k in keys) keys[k] = false;
        // Restore state from save
        for (let i = 0; i < save.phase; i++) nextPhase();
        setShopCoins(save.coins);
        addScoreFlat(save.score);
      }
    }
    keys[key.toLowerCase()] = true;
    return;
  }

  // Don't register game keys in menu/shop/gameover
  if (state !== 'playing' && state !== 'paused') {
    keys[key.toLowerCase()] = true;
    return;
  }

  // Pause toggle
  if (key === 'Escape') {
    if (state === 'playing') {
      setGameState('paused');
      return;
    }
    if (state === 'paused') {
      setGameState('playing');
      return;
    }
  }

  // Don't register game keys while paused
  if (state === 'paused') return;

  keys[key.toLowerCase()] = true;

  // Skill keys (only during gameplay)
  if (key === ' ' && useSkill('dash')) sfxPowerup();
  if (key.toLowerCase() === 'f' && useSkill('shield')) sfxPowerup();
  if (key.toLowerCase() === 'e' && useSkill('fury')) sfxLevelUp();
  if (key.toLowerCase() === 'r') startReload();
});
document.addEventListener('keyup', e => {
  if (getGameState() === 'playing') {
    keys[e.key.toLowerCase()] = false;
  }
});
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('mousedown', e => {
  mouse.down = true;

  // Mode selection via click in menu
  if (getGameState() === 'menu' && !isShowingCutscene()) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const modes: { key: string; mode: GameMode }[] = [
      { key: '1', mode: 'campaign' },
      { key: '2', mode: 'survival' },
      { key: '3', mode: 'missions' },
      { key: '4', mode: 'bossrush' },
      { key: '5', mode: 'competitive' },
      { key: '6', mode: 'local' },
      { key: '7', mode: 'hardcore' },
    ];
    modes.forEach(({ mode }, i) => {
      const y = canvas.height / 2 + i * 50;
      if (clickX >= canvas.width / 2 - 200 && clickX <= canvas.width / 2 + 200 &&
          clickY >= y - 15 && clickY <= y + 25) {
        selectedMode = mode;
      }
    });
  }

  if (getGameState() === 'shop') handleShopClick(e.clientX, e.clientY);
  e.preventDefault();
});
document.addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ─── Game State ────────────────────────────────────────────────
import { Enemy } from './types';
let enemies: Enemy[] = [];
let damageNumbers: { x: number; y: number; text: string; color: string; life: number; vy: number }[] = [];
let lastTime = 0;
let debugLog: { time: number; source: string; damage: number }[] = [];
let phaseTransitionTimer = 0;
let achievementNotifications: { name: string; time: number }[] = [];
let playerDied = false;

function logDamage(source: string, damage: number) {
  const entry = { time: performance.now(), source, damage };
  debugLog.push(entry);
  if (debugLog.length > 20) debugLog.shift();
  console.log(`[DANO] ${source}: ${damage}`);
}
let currentFlash: string | null = null;
let selectedMode: GameMode = 'campaign';

/**
 * Reseta todo o estado do jogo para o início.
 * Chamado ao iniciar nova partida ou voltar ao menu.
 */
function resetGame() {
  resetPhases();
  player.initPlayer(canvas.width, canvas.height);
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
  enemies.length = 0;
  damageNumbers.length = 0;
  clearBullets();
  clearCoins();
  clearParticles();
  clearExplosions();
}

// ─── Update ────────────────────────────────────────────────────
/**
 * Atualiza toda a lógica do jogo por frame.
 * Processa input, movimentação, disparo, IA, colisões e coleta.
 * @param dt - delta time em segundos (limitado a 0.05)
 */
function update(dt: number) {
  const state = getGameState();

  if (state === 'menu') {
    if (isShowingCutscene()) {
      updateCutscene(dt);
      if (keys['backspace']) {
        skipCutsceneText();
      }
      if (keys['enter'] || keys[' ']) {
        const sceneFinished = advanceCutscene();
        if (sceneFinished) {
          setGameMode(selectedMode);
          setGameState('playing');
          loadAchievements();
          loadDiary();
          resetRunCounters();
          resetBehavior();
          playerDied = false;
          if (selectedMode === 'campaign') startTutorial();
          for (const k in keys) keys[k] = false;
          if (selectedMode === 'local') {
            initLocalMultiplayer(canvas.width, canvas.height);
          }
        }
      }
    } else {
      if (keys['enter']) {
        initAudio();
        startMusic();
        resetGame();
        showCutscene();
      }
    }
    return;
  }

  if (state === 'paused') {
    setHudVisible(false);
    if (keys['enter']) {
      resetGame();
      setGameState('menu');
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
    setHudVisible(false);
    updateShopAds(dt);
    if (keys['enter']) {
      setHudVisible(true);
      nextPhase();
      player.initPlayer(canvas.width, canvas.height);
      enemies.length = 0;
      clearBullets();
      clearCoins();
      clearParticles();
      resetCombo();
      phaseTransitionTimer = 2.0;
    }
    return;
  }

  if (state !== 'playing') return;

  if (phaseTransitionTimer > 0) {
    phaseTransitionTimer -= dt;
  }

  updateCombo(dt);
  updateCombos();
  updateTutorial(dt);
  const comboAch = checkAchievements('combo', getCombo());
  if (comboAch) achievementNotifications.push({ name: comboAch.name, time: 3 });
  setMagnetActive(hasPowerUp('magnet'));

  const p = player.getPlayer();
  const speedMult = hasPowerUp('speed') ? 1.5 : 1;
  player.movePlayer(keys, dt, canvas.width, canvas.height, speedMult);
  p.angle = Math.atan2(mouse.y - p.y, mouse.x - p.x);
  
  updateSkills(dt, p);
  applyRegen(dt);

  // Local multiplayer - player 2
  if (isLocalEnabled()) {
    movePlayer2(keys, dt, canvas.width, canvas.height);
    const p2 = getPlayer2();
    if (p2 && p2.alive && keys['l']) {
      const bullet = shootPlayer2();
      if (bullet) {
        spawnBullet(bullet.x, bullet.y, bullet.vx, bullet.vy, bullet.damage, bullet.isEnemy, bullet.color, false);
      }
    }
  }

  const envResult = updateEnvironmentEvents(dt, enemies, p.x, p.y);
  for (const d of envResult.enemyDamages) {
    damageNumbers.push({
      x: d.x + (Math.random() - 0.5) * 16,
      y: d.y,
      text: String(Math.floor(d.damage)),
      color: d.color,
      life: 0.8,
      vy: -60,
    });
  }
  if (envResult.playerDamage > 0 && p.invincible <= 0) {
    const dmg = Math.floor(envResult.playerDamage * getDamageTakenMultiplier());
    if (dmg > 0) {
      logDamage(`EVENTO_AMBIENTAL`, dmg);
      checkAchievements('damage_taken');
      player.enemyCollisionDamage(dmg);
      sfxPlayerHit();
      triggerDamageFlash();
    }
  }

  // Shooting
  p.shootCooldown -= dt;
  updateReload(dt);
  if (mouse.down && p.shootCooldown <= 0 && canShoot()) {
    const weapon = getCurrentWeapon();
    p.shootCooldown = weapon.shootRate * getComboFireRateBonus();
    const multiShot = hasPowerUp('multiShot');
    const newBullets = shoot(p.x, p.y, p.angle, multiShot, getDamageMultiplier() * getComboDamageBonus());
    newBullets.forEach(b => spawnBullet(b.x, b.y, b.vx, b.vy, b.damage, false, b.color, b.pierce, b.explosive, b.explosionRadius));
    const muzzleX = p.x + Math.cos(p.angle) * 24;
    const muzzleY = p.y + Math.sin(p.angle) * 24;
    spawnParticles(muzzleX, muzzleY, weapon.color, 4, 120);
    const weaponSounds: Record<string, () => void> = {
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
    (weaponSounds[weapon.name] || sfxPistol)();
    registerShot();
    if (getCurrentAmmo() <= 0) startReload();
  }

  if (p.invincible > 0) p.invincible -= dt;

  // Wave spawning
  const phase = getCurrentPhase();
  const waveComplete = spawnWaveEnemies(dt, enemies, getCurrentWave(), phase.enemyTypes, canvas.width, canvas.height);
  if (waveComplete) {
    const isHardcore = getCurrentMode() === 'hardcore';
    nextWave();
    if (!isHardcore) {
      player.healOnWaveComplete();
    }
    sfxWaveStart();
    const waveAch = checkAchievements('wave', getCurrentWave());
    if (waveAch) achievementNotifications.push({ name: waveAch.name, time: 3 });
    // Skip shop in hardcore mode
    if (isHardcore && getGameState() === 'shop') {
      setHudVisible(true);
      nextPhase();
      player.initPlayer(canvas.width, canvas.height);
      enemies.length = 0;
      clearBullets();
      clearCoins();
      clearParticles();
      resetCombo();
      phaseTransitionTimer = 2.0;
    } else if (getGameState() === 'shop') {
      // Unlock diary entry for completed phase
      const phaseIdx = getCurrentPhase()?.name ? PHASES.indexOf(getCurrentPhase()!) : 0;
      unlockDiaryEntry(phaseIdx);

      // Auto-save when entering shop
      saveGame(
        getCurrentPhase()?.name ? PHASES.indexOf(getCurrentPhase()!) : 0,
        getCurrentWave(),
        0,
        getShopCoins(),
        getScore(),
        getPurchasedUpgrades(),
        getPurchasedWeapons(),
        getCurrentPhase()?.name || ''
      );
    }
  }

  // Update dynamic difficulty
  updateBehavior(p.x, p.y, dt, enemies.length, 0);

  // Enemy AI
  const tendency = getPlayerTendency();
  for (const e of enemies) {
    e.angle += dt * 2;
    if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e.spawnDelay > 0) {
      e.spawnDelay -= dt;
      continue;
    }
    // Predict player position based on movement tendency
    const predictX = p.x + tendency.h * 80;
    const predictY = p.y + tendency.v * 80;
    const dir = normalize({ x: predictX - e.x, y: predictY - e.y });
    const spd = e.type === 'mosquito' ? e.speed * 1.3 : e.speed;
    e.x += dir.x * spd * dt;
    e.y += dir.y * spd * dt;

    if (e.canShoot) {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        const angle = Math.atan2(p.y - e.y, p.x - e.x);
        const bColor = ENEMY_TYPES[e.type]?.projectileColor || '#3498db';
        const isBoss = ENEMY_TYPES[e.type]?.isBoss;
        const hpPct = e.health / e.maxHealth;

        if (isBoss) {
          // Boss attack phases based on HP
          if (hpPct > 0.6) {
            // Phase 1: normal shots
            e.shootTimer = e.shootRate;
            spawnBullet(e.x, e.y, Math.cos(angle) * 300, Math.sin(angle) * 300, e.damage, true, bColor, false);
          } else if (hpPct > 0.3) {
            // Phase 2: spread shots
            e.shootTimer = e.shootRate * 0.8;
            for (let s = -2; s <= 2; s++) {
              spawnBullet(e.x, e.y, Math.cos(angle + s * 0.2) * 350, Math.sin(angle + s * 0.2) * 350, e.damage, true, bColor, false);
            }
          } else {
            // Phase 3: frenzy - all directions + faster
            e.shootTimer = e.shootRate * 0.5;
            for (let s = 0; s < 8; s++) {
              const a = angle + (s * Math.PI / 4);
              spawnBullet(e.x, e.y, Math.cos(a) * 400, Math.sin(a) * 400, e.damage, true, bColor, false);
            }
          }
        } else if (ENEMY_TYPES[e.type]?.spreadShot) {
          e.shootTimer = e.shootRate;
          for (let s = -1; s <= 1; s++) {
            spawnBullet(e.x, e.y, Math.cos(angle + s * 0.3) * 250, Math.sin(angle + s * 0.3) * 250, e.damage, true, bColor, false);
          }
        } else if (ENEMY_TYPES[e.type]?.splitBullet) {
          e.shootTimer = e.shootRate;
          for (let s = 0; s < 4; s++) {
            const a = angle + (s * Math.PI / 2);
            spawnBullet(e.x, e.y, Math.cos(a) * 200, Math.sin(a) * 200, e.damage, true, bColor, false);
          }
        } else {
          e.shootTimer = e.shootRate;
          spawnBullet(e.x, e.y, Math.cos(angle) * 300, Math.sin(angle) * 300, e.damage, true, bColor, false);
        }
        sfxEnemyShoot();
      }
    }

    if (ENEMY_TYPES[e.type]?.summons) {
      e.summonTimer += dt;
      if (e.summonTimer >= 5 && enemies.length < 20) {
        e.summonTimer = 0;
        const summonTypes = ['grunt', 'runner', 'drone'];
        const type = summonTypes[Math.floor(Math.random() * summonTypes.length)] as string;
        const summoned = spawnEnemy(type, canvas.width, canvas.height, getCurrentWave());
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

  // Competitive mode - Bot logic
  if (getCurrentMode() === 'competitive') {
    const botList = getBots();
    // Spawn bots periodically
    if (botList.length < 3 && Math.random() < dt * 0.5) {
      const difficulties: BotDifficulty[] = ['easy', 'medium', 'hard'];
      const diff = difficulties[Math.floor(Math.random() * 3)];
      addBot(createBot(diff, canvas.width, canvas.height));
    }
    // Update bot AI
    const bullets = getBullets();
    const botBullets = updateBots(dt, p.x, p.y, bullets, canvas.width, canvas.height);
    for (const b of botBullets) {
      spawnBullet(b.x, b.y, b.vx, b.vy, b.damage, true, b.color, false);
    }
    // Bot-player collision
    for (const bot of botList) {
      const dist = Math.hypot(p.x - bot.x, p.y - bot.y);
      if (dist < p.radius + bot.radius && p.invincible <= 0) {
        const dmg = Math.floor(bot.damage * getDamageTakenMultiplier());
        if (dmg > 0) {
          logDamage(`BOT_COMPETITIVO`, dmg);
          player.enemyCollisionDamage(dmg);
          sfxPlayerHit();
          triggerDamageFlash();
        }
        bot.health = 0;
        spawnParticles(bot.x, bot.y, bot.color, 12, 200);
      }
    }
    // Remove dead bots
    const deadBots = removeDeadBots();
    for (const bot of deadBots) {
      addScore(bot.scoreValue);
      spawnCoins(bot.x, bot.y, bot.coinDrop);
      spawnParticles(bot.x, bot.y, bot.color, 20, 300);
      sfxExplosion();
    }
  }

  // Collision (skip enemies still in spawn delay)
  const activeEnemies = enemies.filter(e => e.spawnDelay <= 0);
  checkEnemyPlayerCollision(activeEnemies, p.x, p.y, p.radius, p.invincible, (e) => {
    const baseDmg = hasPowerUp('invincible') ? 0 : e.damage;
    const dmg = Math.floor(baseDmg * getDamageTakenMultiplier());
    if (dmg > 0) {
      logDamage(`CORPO_INIMIGO (tipo:${e.type})`, dmg);
      checkAchievements('damage_taken');
      player.enemyCollisionDamage(dmg);
      sfxPlayerHit();
      triggerDamageFlash();
    }
    e.health = 0;
    spawnParticles(e.x, e.y, e.color, 12, 200);
  });

  const bullets = getBullets();

  // Enemy bullets vs player
  checkEnemyBulletPlayerCollision(bullets, p.x, p.y, p.radius, p.invincible, (b) => {
    const dmg = Math.floor(b.damage * getDamageTakenMultiplier());
    if (dmg > 0) {
      logDamage(`PROJETIL_INIMIGO (cor:${b.color})`, dmg);
      checkAchievements('damage_taken');
      player.enemyCollisionDamage(dmg);
      sfxPlayerHit();
      triggerDamageFlash();
    }
    b.life = 0;
    spawnParticles(b.x, b.y, b.color, 3, 100);
  });

  checkBulletEnemyCollisions(bullets, enemies, (b, e) => {
    e.hitFlash = 0.15;
    registerHit();
    const isCrit = b.color === '#f1c40f';
    // Explosive bullets create area damage
    if (b.explosive && b.explosionRadius) {
      createExplosion(b.x, b.y, b.explosionRadius, b.damage, enemies, b.color);
      sfxExplosion();
      triggerScreenShake(8, 0.2);
    } else {
      e.health -= b.damage;
      damageNumbers.push({
        x: e.x + (Math.random() - 0.5) * 20, y: e.y - 20,
        text: isCrit ? `${Math.floor(b.damage)}!` : String(Math.floor(b.damage)),
        color: isCrit ? '#f1c40f' : '#fff',
        life: 1, vy: -80,
      });
    }
    // Crit visual: slow motion + extra particles
    if (isCrit) {
      triggerSlowMotion(0.15, 0.3);
      spawnParticles(b.x, b.y, '#f1c40f', 8, 200);
    }
    if (!b.pierce) b.life = 0;
    spawnParticles(b.x, b.y, b.color, 3, 150);
    triggerHitStop(0.015);
  });

  // Bullet-Bot collision (competitive mode)
  if (getCurrentMode() === 'competitive') {
    for (const b of bullets) {
      if (b.isEnemy) continue;
      for (const bot of getBots()) {
        if (b.life <= 0) break;
        const dist = Math.hypot(b.x - bot.x, b.y - bot.y);
        if (dist < bot.radius + 5) {
          bot.health -= b.damage;
          damageNumbers.push({
            x: bot.x + (Math.random() - 0.5) * 20, y: bot.y - 20,
            text: b.color === '#f1c40f' ? `${Math.floor(b.damage)}!` : String(Math.floor(b.damage)),
            color: b.color === '#f1c40f' ? '#f1c40f' : '#fff',
            life: 1, vy: -80,
          });
          if (!b.pierce) b.life = 0;
          spawnParticles(b.x, b.y, b.color, 3, 150);
          triggerHitStop(0.015);
        }
      }
    }
  }

  // Remove dead enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].health <= 0) {
      addScore(enemies[i].scoreValue);
      const def = ENEMY_TYPES[enemies[i].type];
      if (def?.coinDrop) spawnCoins(enemies[i].x, enemies[i].y, def.coinDrop);
      spawnParticles(enemies[i].x, enemies[i].y, enemies[i].color, 20, 300);
      sfxExplosion();
      const killAch = checkAchievements('kill');
      if (killAch) achievementNotifications.push({ name: killAch.name, time: 3 });
      const scoreAch = checkAchievements('score', getScore());
      if (scoreAch) achievementNotifications.push({ name: scoreAch.name, time: 3 });
      if (def?.isBoss) {
        const bossAch = checkAchievements('boss_kill');
        if (bossAch) achievementNotifications.push({ name: bossAch.name, time: 3 });
        spawnParticles(enemies[i].x, enemies[i].y, '#f1c40f', 50, 400);
        triggerSlowMotion(0.3, 0.8);
        triggerBossKillFlash();
        sfxBossDeath();
        spawnPowerUp(enemies[i].x, enemies[i].y);
        spawnPowerUp(enemies[i].x - 20, enemies[i].y + 20);
      } else if (Math.random() < 0.15) {
        spawnPowerUp(enemies[i].x, enemies[i].y);
      }
      enemies[i] = enemies[enemies.length - 1];
      enemies.pop();
    }
  }

  // Update systems
  updateBullets(dt, canvas.width, canvas.height);
  updateParticles(dt);
  updateExplosions(dt);

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

  if (p.health <= 0) {
    playerDied = true;
    addLeaderboardEntry('Jogador', getScore(), getCurrentWave());
    // Death animation particles
    spawnParticles(p.x, p.y, '#7a9a6a', 30, 300);
    spawnParticles(p.x, p.y, '#fff', 15, 200);
    triggerSlowMotion(0.5, 0.5);
    setGameState('gameover');
    sfxGameOver();
  }

  // Check if game was completed (all phases beaten)
  if (wasGameCompleted()) {
    markGameCompleted();
    if (!playerDied) {
      // Secret ending - player completed game without dying
      achievementNotifications.push({ name: 'FINAL SECRETO: PERFEIÇÃO', time: 5 });
    }
  }

  currentFlash = updateFlash(dt);

  updateHud({
    phase: getCurrentPhase()?.name || '1',
    health: p.health,
    maxHealth: p.maxHealth,
    score: getScore(),
    coins: getShopCoins(),
    wave: getCurrentWave(),
    maxWave: getCurrentPhase()?.waves || 1,
    enemies: enemies.length,
    weapon: getCurrentWeapon().name,
    combo: getCombo(),
    ammo: getCurrentAmmo(),
    maxAmmo: getCurrentWeapon().magazineSize,
    reloading: getIsReloading(),
  });
}

// ─── Draw ──────────────────────────────────────────────────────
/**
 * Desenha todos os elementos visuais do jogo.
 * Chamado após update() a cada frame.
 */
function draw() {
  const state = getGameState();

  if (state === 'menu') {
    if (isShowingCutscene()) {
      drawCutscene();
    } else {
      drawMenu(selectedMode);
    }
    return;
  }
  if (state === 'shop') {
    drawShop(ctx, canvas.width, canvas.height, mouse.x, mouse.y);
    return;
  }
  if (state === 'gameover') { drawGameOver(getScore(), getKillStreak()); return; }

  if (state === 'paused') {
    // Draw game scene frozen
    const bg = getCurrentPhase();
    drawGameBackground(bg?.bg || '#1a1a2e', bg?.gridColor || 'rgba(255,255,255,0.03)', { x: 0, y: 0 });
    renderEnemies(enemies, player.getPlayer().x, player.getPlayer().y);
    renderPlayer(player.getPlayer());
    restoreCanvas();
    // Pause overlay
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ccc';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSADO', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillStyle = '#666';
    ctx.font = '13px monospace';
    ctx.fillText('ESC para continuar', canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('ENTER para voltar ao menu', canvas.width / 2, canvas.height / 2 + 30);
    return;
  }

  const bg = getCurrentPhase();
  drawGameBackground(bg?.bg || '#1a1a2e', bg?.gridColor || 'rgba(255,255,255,0.03)', { x: 0, y: 0 });
  renderCoins(getCoins());
  renderPowerUps(powerups);
  renderParticles(getParticles());
  renderBullets(getBullets());
  renderEnemies(enemies, player.getPlayer().x, player.getPlayer().y);

  // Render bots (competitive mode)
  if (getCurrentMode() === 'competitive') {
    for (const bot of getBots()) {
      // Bot body
      ctx.fillStyle = bot.color;
      ctx.beginPath();
      ctx.arc(bot.x, bot.y, bot.radius, 0, Math.PI * 2);
      ctx.fill();
      // Bot direction indicator
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bot.x, bot.y);
      ctx.lineTo(bot.x + Math.cos(bot.angle) * bot.radius, bot.y + Math.sin(bot.angle) * bot.radius);
      ctx.stroke();
      // Health bar
      const barW = 32;
      const barH = 4;
      const barX = bot.x - barW / 2;
      const barY = bot.y - bot.radius - 10;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = bot.color;
      ctx.fillRect(barX, barY, barW * (bot.health / bot.maxHealth), barH);
      // Name
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(bot.name, bot.x, barY - 4);
    }
  }

  renderPlayer(player.getPlayer());
  drawDamageNumbers(damageNumbers);
  restoreCanvas();

  // Phase transition overlay
  if (phaseTransitionTimer > 0) {
    drawPhaseTransition(phaseTransitionTimer, getCurrentWave(), getCurrentPhase()?.name);
  }

  // Flash overlay
  if (currentFlash) {
    ctx.fillStyle = currentFlash;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Environment event indicators (top-center, below score)
  if (isEarthquakeActive()) {
    ctx.fillStyle = 'rgba(176,112,80,0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#b07050';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TERREMOTO', canvas.width / 2, 40);
    ctx.textAlign = 'left';
  }
  if (isStormActive()) {
    ctx.fillStyle = 'rgba(96,128,144,0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#608090';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TEMPESTADE', canvas.width / 2, 40);
    ctx.textAlign = 'left';
  }

  drawCombo(getCombo());
  drawWeaponInfo(getCurrentWeapon().name);
  renderActivePowerUps(activePowerups);

  // Skill cooldown indicators (top-left, below phase name)
  const skillData: { key: string; name: string; color: string; type: 'dash' | 'shield' | 'fury' }[] = [
    { key: 'SPACE', name: 'Dash', color: '#608090', type: 'dash' },
    { key: 'F', name: 'Escudo', color: '#608090', type: 'shield' },
    { key: 'E', name: 'Furia', color: '#608090', type: 'fury' },
  ];
  let skillY = 50;
  for (const s of skillData) {
    const cd = getSkillCooldown(s.type);
    const maxCd = getSkillMaxCooldown(s.type);
    const ready = cd <= 0 && !isSkillActive(s.type);
    const active = isSkillActive(s.type);

    // Background
    ctx.fillStyle = active ? 'rgba(122,154,106,0.3)' : 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(10, skillY, 100, 22, 3);
    ctx.fill();

    // Cooldown fill
    if (cd > 0) {
      const pct = 1 - cd / maxCd;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(10, skillY, 100 * pct, 22);
    }

    // Border
    ctx.strokeStyle = active ? '#7a9a6a' : ready ? 'rgba(122,154,106,0.4)' : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text
    ctx.fillStyle = active ? '#7a9a6a' : ready ? '#999' : '#555';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    const label = active ? `${s.name} ATIVO` : cd > 0 ? `${s.name} ${Math.ceil(cd)}s` : `${s.key}: ${s.name}`;
    ctx.fillText(label, 16, skillY + 15);
    skillY -= 26;
  }

  // Debug damage log (bottom-right)
  const now = performance.now();
  const recentLogs = debugLog.filter(l => now - l.time < 3000);
  if (recentLogs.length > 0) {
    let logY = canvas.height - 50;
    ctx.textAlign = 'right';
    for (let i = recentLogs.length - 1; i >= 0 && i >= recentLogs.length - 5; i--) {
      const l = recentLogs[i];
      const age = (now - l.time) / 3000;
      ctx.globalAlpha = 1 - age;
      ctx.fillStyle = '#e74c3c';
      ctx.font = '10px monospace';
      ctx.fillText(`[DANO] ${l.source}: ${l.damage}`, canvas.width - 15, logY);
      logY -= 14;
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  // Tutorial hints (bottom-center)
  if (isTutorialActive()) {
    const hint = getCurrentHint();
    if (hint) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.roundRect(canvas.width / 2 - 150, canvas.height - 80, 300, 30, 5);
      ctx.fill();
      ctx.fillStyle = '#a08050';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${hint.key}: ${hint.text}`, canvas.width / 2, canvas.height - 62);
      ctx.textAlign = 'left';
    }
  }

  // Combo build indicators
  const combos = getActiveCombos();
  if (combos.length > 0) {
    let comboY = canvas.height - 100;
    for (const c of combos) {
      ctx.fillStyle = c.color;
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'right';
      ctx.globalAlpha = 0.8;
      ctx.fillText(`⚡ ${c.name}`, canvas.width - 15, comboY);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#ccc';
      ctx.fillText(c.description, canvas.width - 15, comboY + 14);
      ctx.globalAlpha = 1;
      comboY -= 32;
    }
  }

  // Minimap (top-right corner)
  const mmW = 120;
  const mmH = 80;
  const mmX = canvas.width - mmW - 12;
  const mmY = 12;
  const scaleX = mmW / canvas.width;
  const scaleY = mmH / canvas.height;
  const pp = player.getPlayer();

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(mmX, mmY, mmW, mmH);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(mmX, mmY, mmW, mmH);

  // Player dot
  ctx.fillStyle = '#7a9a6a';
  ctx.beginPath();
  ctx.arc(mmX + pp.x * scaleX, mmY + pp.y * scaleY, 2, 0, Math.PI * 2);
  ctx.fill();

  // Enemy dots
  ctx.fillStyle = '#b07050';
  for (const e of enemies) {
    ctx.beginPath();
    ctx.arc(mmX + e.x * scaleX, mmY + e.y * scaleY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Achievement notifications (top-center)
  let achY = 60;
  for (let i = achievementNotifications.length - 1; i >= 0; i--) {
    const n = achievementNotifications[i];
    n.time -= 1 / 60;
    if (n.time <= 0) {
      achievementNotifications.splice(i, 1);
      continue;
    }
    const alpha = Math.min(1, n.time);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#a08050';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`ACHIEVEMENT: ${n.name}`, canvas.width / 2, achY);
    achY += 18;
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// ─── Game Loop ─────────────────────────────────────────────────
/**
 * Loop principal do jogo.
 * Calcula delta time, atualiza lógica e renderiza.
 * @param time - timestamp do frame em milissegundos
 */
function loop(time: number) {
  const rawDt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  // Hit stop freezes the game
  if (!updateHitStop(rawDt)) {
    // Slow motion scales dt
    const dt = updateSlowMotion(rawDt);
    update(dt);
  }

  draw();
  requestAnimationFrame(loop);
}

// Load sprites and start game
import { loadAllSprites } from './systems/sprites';

async function init() {
  await loadAllSprites();
  requestAnimationFrame(time => { lastTime = time; loop(time); });
}

init();
