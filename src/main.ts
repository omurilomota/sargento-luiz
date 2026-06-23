import { dist, rand, normalize } from './utils';
import { coins, spawnCoins, updateCoins, drawCoins } from './coins';
import { shoot, getCurrentWeapon, resetWeapons } from './weapons';
import { buyWeapon, buyUpgrade, setShopCoins, getShopCoins, resetShop, drawShop } from './shop';
import { getCurrentPhase, getCurrentWave, getGameState, setGameState, nextWave, nextPhase, resetPhases, addScore, getScore, getPhaseBackground, getPhaseGridColor } from './phases';
import { ENEMY_TYPES } from './config';
import { Enemy, Bullet, Particle } from './types';
import { getDashState, activateDash, updateDash, resetDash, isDashInvincible } from './dash';
import { getUltimateState, addUltimateCharge, activateUltimate, updateUltimate, resetUltimate, isUltimateReady, getUltimateChargePercent } from './ultimate';

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
  resetDash();
  resetUltimate();
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
  } else if (dx || dy) {
    const n = normalize({ x: dx, y: dy });
    player.x += n.x * player.speed * dt;
    player.y += n.y * player.speed * dt;
  }
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  if (keys['e'] && isUltimateReady()) {
    activateUltimate();
  }

  const ultimateResult = updateUltimate(dt);
  if (ultimateResult.active) {
    for (const e of enemies) {
      if (dist(e, player) < ultimateResult.radius) {
        e.health -= ultimateResult.damage;
        spawnParticles(e.x, e.y, '#f1c40f', 10, 200);
      }
    }
    spawnParticles(player.x, player.y, '#f1c40f', 30, 300);
  }

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

    if (dist(e, player) < e.radius + player.radius && player.invincible <= 0 && !isDashInvincible()) {
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
      addUltimateCharge(10);
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

  if (getDashState().active) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(player.x - Math.cos(player.angle) * 20, player.y - Math.sin(player.angle) * 20, player.radius * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

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
}

function loop(time: number) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(time => { lastTime = time; loop(time); });
