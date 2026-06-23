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

// Core
import { getState, setState } from './core/gameState';

// Entities
import * as player from './entities/player';
import { getBullets, spawnBullet, updateBullets, clearBullets } from './entities/bullet';
import { getCoins, spawnCoins, updateCoins, clearCoins, setMagnetActive } from './entities/coin';

// Systems
import { spawnParticles, updateParticles, clearParticles, getParticles } from './systems/particles';
import { spawnWaveEnemies, resetSpawner, spawnEnemy } from './systems/spawner';
import { checkBulletEnemyCollisions, checkEnemyPlayerCollision } from './systems/collision';
import { createExplosion, updateExplosions, clearExplosions, getExplosions } from './systems/explosions';
import { initRenderer, drawMenu, drawGameOver, drawGameBackground, drawPhaseTransition, drawCoins as renderCoins, drawPowerUps as renderPowerUps, drawParticles as renderParticles, drawBullets as renderBullets, drawEnemies as renderEnemies, drawPlayer as renderPlayer, drawDamageNumbers, drawCombo, drawWeaponInfo, drawActivePowerUps as renderActivePowerUps, restoreCanvas } from './systems/renderer';

// UI
import { initHud, updateHud } from './ui/hud';
import { drawShop, handleShopClick, setShopCoins, getShopCoins, addShopCoins, resetShop } from './ui/shop';

// Existing modules (unchanged)
import { shoot, getCurrentWeapon, resetWeapons } from './weapons';
import { getCurrentPhase, getCurrentWave, getGameState, setGameState, nextWave, nextPhase, resetPhases, addScore, addScoreFlat, getScore, getCombo, updateCombo, resetCombo, getKillStreak } from './phases';
import { powerups, spawnPowerUp, updatePowerUps, hasPowerUp, activePowerups } from './powerups';

// Audio & Visual Juice
import { initAudio, sfxShoot, sfxShotgun, sfxExplosion, sfxBossDeath, sfxPlayerHit, sfxCoin, sfxPowerup, sfxLevelUp, sfxWaveStart, sfxBuy, sfxError, sfxGameOver, sfxHitStop, sfxEnemyShoot, startMusic } from './systems/audio';
import { triggerScreenShake, triggerDamageFlash, triggerLevelUpFlash, triggerBossKillFlash, updateFlash, updateSlowMotion, triggerSlowMotion, triggerHitStop, updateHitStop, resetEffects } from './systems/effects';

// Player Skills
import { useSkill, isSkillActive, updateSkills, resetSkills, getDamageMultiplier, getDamageTakenMultiplier } from './systems/skills';

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
  const key = e.key.toLowerCase();
  keys[key] = true;
  
  // Skill keys (only during gameplay)
  if (getGameState() === 'playing') {
    if (key === 'q') useSkill('dash');
    if (key === 'w' && !keys['shift']) useSkill('shield');
    if (key === 'e') useSkill('fury');
  }
});
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('mousedown', e => {
  mouse.down = true;
  if (getGameState() === 'shop') handleShopClick(e.clientX, e.clientY);
  e.preventDefault();
});
document.addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ─── Game State ────────────────────────────────────────────────
import { Enemy } from './types';
let enemies: Enemy[] = [];
let damageNumbers: { x: number; y: number; text: string; color: string; life: number; vy: number }[] = [];
let phaseTransition = 0;
let lastTime = 0;
let currentFlash: string | null = null;

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
    if (keys['enter']) {
      initAudio();
      startMusic();
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
  
  updateSkills(dt, p);

  // Shooting
  p.shootCooldown -= dt;
  if (mouse.down && p.shootCooldown <= 0) {
    const weapon = getCurrentWeapon();
    p.shootCooldown = weapon.shootRate;
    const multiShot = hasPowerUp('multiShot');
    const newBullets = shoot(p.x, p.y, p.angle, multiShot, getDamageMultiplier());
    newBullets.forEach(b => spawnBullet(b.x, b.y, b.vx, b.vy, b.damage, false, b.color, b.pierce, b.explosive, b.explosionRadius));
    const muzzleX = p.x + Math.cos(p.angle) * 24;
    const muzzleY = p.y + Math.sin(p.angle) * 24;
    spawnParticles(muzzleX, muzzleY, weapon.color, 4, 120);
    if (weapon.name === 'Shotgun') sfxShotgun(); else sfxShoot();
  }

  if (p.invincible > 0) p.invincible -= dt;

  // Wave spawning
  const phase = getCurrentPhase();
  const waveComplete = spawnWaveEnemies(dt, enemies, getCurrentWave(), phase.enemyTypes, canvas.width, canvas.height);
  if (waveComplete) {
    nextWave();
    player.healOnWaveComplete();
    sfxWaveStart();
    if (getGameState() !== 'shop') {
      phaseTransition = 1.5;
    }
  }

  // Enemy AI
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

  // Collision
  checkEnemyPlayerCollision(enemies, p.x, p.y, p.radius, p.invincible, (e) => {
    const baseDmg = hasPowerUp('invincible') ? 0 : e.damage;
    const dmg = Math.floor(baseDmg * getDamageTakenMultiplier());
    if (dmg > 0) {
      player.enemyCollisionDamage(dmg);
      sfxPlayerHit();
      triggerDamageFlash();
    }
    e.health = 0;
    spawnParticles(e.x, e.y, e.color, 12, 200);
  });

  const bullets = getBullets();
  checkBulletEnemyCollisions(bullets, enemies, (b, e) => {
    // Explosive bullets create area damage
    if (b.explosive && b.explosionRadius) {
      createExplosion(b.x, b.y, b.explosionRadius, b.damage, enemies, b.color);
      sfxExplosion();
      triggerScreenShake(8, 0.2);
    } else {
      e.health -= b.damage;
      damageNumbers.push({
        x: e.x + (Math.random() - 0.5) * 20, y: e.y - 20,
        text: b.color === '#f1c40f' ? `${Math.floor(b.damage)}!` : String(Math.floor(b.damage)),
        color: b.color === '#f1c40f' ? '#f1c40f' : '#fff',
        life: 1, vy: -80,
      });
    }
    if (!b.pierce) b.life = 0;
    spawnParticles(b.x, b.y, b.color, 3, 150);
    triggerHitStop(0.015);
  });

  // Remove dead enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].health <= 0) {
      addScore(enemies[i].scoreValue);
      const def = ENEMY_TYPES[enemies[i].type];
      if (def?.coinDrop) spawnCoins(enemies[i].x, enemies[i].y, def.coinDrop);
      spawnParticles(enemies[i].x, enemies[i].y, enemies[i].color, 20, 300);
      sfxExplosion();
      if (def?.isBoss) {
        spawnParticles(enemies[i].x, enemies[i].y, '#f1c40f', 50, 400);
        triggerSlowMotion(0.3, 0.8);
        triggerBossKillFlash();
        sfxBossDeath();
      }
      if (Math.random() < 0.08) spawnPowerUp(enemies[i].x, enemies[i].y);
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
    setGameState('gameover');
    sfxGameOver();
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
  });
}

// ─── Draw ──────────────────────────────────────────────────────
/**
 * Desenha todos os elementos visuais do jogo.
 * Chamado após update() a cada frame.
 */
function draw() {
  const state = getGameState();

  if (state === 'menu') { drawMenu(); return; }
  if (state === 'shop') {
    drawShop(ctx, canvas.width, canvas.height, mouse.x, mouse.y);
    return;
  }
  if (state === 'gameover') { drawGameOver(getScore(), getKillStreak()); return; }

  const bg = getCurrentPhase();
  drawGameBackground(bg?.bg || '#1a1a2e', bg?.gridColor || 'rgba(255,255,255,0.03)', { x: 0, y: 0 });
  drawPhaseTransition(phaseTransition, getCurrentWave(), bg?.name);
  renderCoins(getCoins());
  renderPowerUps(powerups);
  renderParticles(getParticles());
  renderBullets(getBullets());
  renderEnemies(enemies, player.getPlayer().x, player.getPlayer().y);
  renderPlayer(player.getPlayer());
  restoreCanvas();

  // Flash overlay
  if (currentFlash) {
    ctx.fillStyle = currentFlash;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawCombo(getCombo());
  drawWeaponInfo(getCurrentWeapon().name);
  renderActivePowerUps(activePowerups);
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

requestAnimationFrame(time => { lastTime = time; loop(time); });
