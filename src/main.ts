import { dist, rand, normalize } from './utils';
import { coins, spawnCoins, updateCoins, drawCoins, setMagnetActive } from './coins';
import { shoot, getCurrentWeapon, resetWeapons, getPierceCount } from './weapons';
import { buyWeapon, buyUpgrade, setShopCoins, getShopCoins, addShopCoins, resetShop, drawShop, handleShopClick } from './shop';
import { getCurrentPhase, getCurrentWave, getGameState, setGameState, nextWave, nextPhase, resetPhases, addScore, getScore, getPhaseBackground, getPhaseBackground2, getPhaseGridColor, getCombo, updateCombo, resetCombo, getKillStreak } from './phases';
import { ENEMY_TYPES, POWERUP_TYPES } from './config';
import { powerups, spawnPowerUp, updatePowerUps, hasPowerUp, drawPowerUps, drawActivePowerUps } from './powerups';
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
canvas.addEventListener('mousedown', e => {
  mouse.down = true;
  if (getGameState() === 'shop') handleShopClick(e.clientX, e.clientY);
  e.preventDefault();
});
document.addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

const player = { x: canvas.width / 2, y: canvas.height / 2, radius: 18, speed: 320, health: 100, maxHealth: 100, angle: 0, shootCooldown: 0, invincible: 0, shield: 0 };

const bullets: Bullet[] = [];
const enemies: Enemy[] = [];
const particles: Particle[] = [];
const damageNumbers: { x: number; y: number; text: string; color: string; life: number; vy: number }[] = [];

let waveTimer = 0;
let enemiesSpawnedThisWave = 0;
let lastTime = 0;
let screenShake = 0;
let phaseTransition = 0;

function resetPlayer() {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.health = player.maxHealth;
  player.invincible = 0;
  player.shield = 0;
}

function spawnBullet(x: number, y: number, vx: number, vy: number, damage: number, isEnemy: boolean, color: string, pierce: boolean) {
  bullets.push({ x, y, vx, vy, life: 2, damage, isEnemy, color, pierce });
}

function spawnEnemy(type: string) {
  const def = ENEMY_TYPES[type];
  if (!def) return;
  let x = 0, y = 0;
  const side = Math.floor(rand(0, 4));
  if (side === 0) { x = -40; y = rand(0, canvas.height); }
  else if (side === 1) { x = canvas.width + 40; y = rand(0, canvas.height); }
  else if (side === 2) { x = rand(0, canvas.width); y = -40; }
  else { x = rand(0, canvas.width); y = canvas.height + 40; }
  const waveScale = 1 + getCurrentWave() * 0.1;
  enemies.push({
    x, y, radius: def.radius, speed: def.speed + rand(-10, 10),
    health: Math.floor(def.health * waveScale), maxHealth: Math.floor(def.health * waveScale),
    damage: Math.floor(def.damage * waveScale), color: def.color, scoreValue: def.scoreValue,
    shootTimer: rand(0, def.shootRate || 0), shootRate: def.shootRate || 0,
    canShoot: def.canShoot || false, type, angle: rand(0, Math.PI * 2),
    attackTimer: 0, summonTimer: 0,
  });
}

function spawnParticles(x: number, y: number, color: string, count: number, speed: number) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const spd = rand(speed * 0.3, speed);
    particles.push({ x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: rand(0.3, 0.8), maxLife: 0.8, radius: rand(2, 6), color });
  }
}

function addDamageNumber(x: number, y: number, damage: number, isCrit: boolean) {
  damageNumbers.push({
    x: x + rand(-10, 10), y: y - 20,
    text: isCrit ? `${Math.floor(damage)}!` : String(Math.floor(damage)),
    color: isCrit ? '#f1c40f' : '#fff',
    life: 1, vy: -80,
  });
}

function spawnWaveEnemies(dt: number) {
  waveTimer += dt;
  const phase = getCurrentPhase();
  const totalEnemies = 8 + getCurrentWave() * 3;
  const spawnRate = Math.max(0.2, 0.8 - getCurrentWave() * 0.05);
  if (waveTimer >= spawnRate && enemiesSpawnedThisWave < totalEnemies) {
    waveTimer = 0;
    const types = phase.enemyTypes;
    spawnEnemy(types[Math.floor(rand(0, types.length))]);
    enemiesSpawnedThisWave++;
  }
  if (enemiesSpawnedThisWave >= totalEnemies && enemies.length === 0) {
    nextWave();
    enemiesSpawnedThisWave = 0;
    waveTimer = 0;
    player.health = Math.min(player.maxHealth, player.health + 15);
    if (getGameState() !== 'shop') {
      phaseTransition = 1.5;
    }
  }
}

function update(dt: number) {
  const state = getGameState();

  if (state === 'menu') {
    if (keys['enter']) {
      resetPhases(); resetPlayer(); resetWeapons(); resetShop();
      setGameState('playing');
      enemies.length = 0; bullets.length = 0; particles.length = 0; coins.length = 0; powerups.length = 0;
    }
    return;
  }

  if (state === 'gameover') {
    if (keys['enter']) {
      resetPhases(); resetPlayer(); resetWeapons(); resetShop();
      setGameState('menu');
    }
    return;
  }

  if (state === 'shop') {
    if (keys['enter']) {
      nextPhase(); resetPlayer();
      enemies.length = 0; bullets.length = 0; particles.length = 0; coins.length = 0; powerups.length = 0;
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

  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;
  if (dx || dy) {
    const n = normalize({ x: dx, y: dy });
    const spd = player.speed * (hasPowerUp('speed') ? 1.5 : 1);
    player.x += n.x * spd * dt;
    player.y += n.y * spd * dt;
  }
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  player.shootCooldown -= dt;
  if (mouse.down && player.shootCooldown <= 0) {
    const weapon = getCurrentWeapon();
    player.shootCooldown = weapon.shootRate;
    const multiShot = hasPowerUp('multiShot');
    const newBullets = shoot(player.x, player.y, player.angle, multiShot);
    newBullets.forEach(b => spawnBullet(b.x, b.y, b.vx, b.vy, b.damage, false, b.color, b.pierce));
    const muzzleX = player.x + Math.cos(player.angle) * 24;
    const muzzleY = player.y + Math.sin(player.angle) * 24;
    spawnParticles(muzzleX, muzzleY, weapon.color, 4, 120);
    screenShake = 0.05;
  }

  if (player.invincible > 0) player.invincible -= dt;

  spawnWaveEnemies(dt);

  for (const e of enemies) {
    e.angle += dt * 2;
    const dir = normalize({ x: player.x - e.x, y: player.y - e.y });
    const spd = e.type === 'mosquito' ? e.speed * 1.3 : e.speed;
    e.x += dir.x * spd * dt;
    e.y += dir.y * spd * dt;

    if (e.canShoot) {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = e.shootRate;
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
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
        spawnEnemy(summonTypes[Math.floor(rand(0, summonTypes.length))]);
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

    if (dist(e, player) < e.radius + player.radius && player.invincible <= 0) {
      const dmg = hasPowerUp('invincible') ? 0 : e.damage;
      if (dmg > 0) {
        if (player.shield > 0) { player.shield--; }
        else { player.health -= dmg; }
      }
      player.invincible = 0.5;
      e.health = 0;
      spawnParticles(e.x, e.y, e.color, 12, 200);
      screenShake = 0.15;
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
      if (e.health <= 0) continue;
      if (dist(b, e) < e.radius + 5) {
        e.health -= b.damage;
        addDamageNumber(e.x, e.y, b.damage, b.color === '#f1c40f');
        if (!b.pierce) b.life = 0;
        spawnParticles(b.x, b.y, b.color, 3, 150);
        screenShake = 0.03;
        break;
      }
    }
  }

  for (const b of bullets) {
    if (!b.isEnemy) continue;
    if (dist(b, player) < player.radius + 5 && player.invincible <= 0) {
      const dmg = hasPowerUp('invincible') ? 0 : b.damage;
      if (dmg > 0) {
        if (player.shield > 0) { player.shield--; }
        else { player.health -= dmg; }
      }
      player.invincible = 0.3;
      b.life = 0;
      spawnParticles(b.x, b.y, '#e74c3c', 3, 150);
      screenShake = 0.1;
    }
  }

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
      enemies.splice(i, 1);
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (b.life <= 0 || b.x < -50 || b.x > canvas.width + 50 || b.y < -50 || b.y > canvas.height + 50) {
      bullets.splice(i, 1);
    }
  }

  for (const p of particles) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.94; p.vy *= 0.94;
    p.life -= dt;
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0) particles.splice(i, 1);
  }

  for (const d of damageNumbers) {
    d.y += d.vy * dt;
    d.vy += 100 * dt;
    d.life -= dt;
  }
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    if (damageNumbers[i].life <= 0) damageNumbers.splice(i, 1);
  }

  updateCoins(dt, player.x, player.y, player.radius, (v) => {
    addScore(v);
    addShopCoins(v);
  });
  updatePowerUps(dt, player.x, player.y, player.radius, (type) => {
    if (type === 'health') player.health = Math.min(player.maxHealth, player.health + 30);
    if (type === 'shield') player.shield += 2;
    spawnParticles(player.x, player.y, POWERUP_TYPES[type].color, 15, 200);
  });

  if (screenShake > 0) screenShake -= dt;

  if (player.health <= 0) {
    setGameState('gameover');
  }

  document.getElementById('health')!.textContent = String(Math.max(0, Math.ceil(player.health)));
  document.getElementById('score')!.textContent = String(getScore());
  document.getElementById('coins')!.textContent = String(getShopCoins());
  document.getElementById('wave')!.textContent = String(getCurrentWave() + 1);
  document.getElementById('enemies')!.textContent = String(enemies.length);
  document.getElementById('phase')!.textContent = getCurrentPhase()?.name || '1';
}

function draw() {
  const state = getGameState();

  if (state === 'menu') {
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
    return;
  }

  if (state === 'shop') {
    drawShop(ctx, canvas.width, canvas.height, mouse.x, mouse.y);
    return;
  }

  if (state === 'gameover') {
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
    ctx.fillText(`Pontos: ${getScore()}`, canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText(`Kills: ${getKillStreak()}`, canvas.width / 2, canvas.height / 2 + 20);
    const pulse = 0.7 + Math.sin(Date.now() / 400) * 0.3;
    ctx.globalAlpha = pulse;
    ctx.fillText('Pressione ENTER para reiniciar', canvas.width / 2, canvas.height / 2 + 70);
    ctx.globalAlpha = 1;
    return;
  }

  const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 20 : 0;
  const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 20 : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);

  ctx.fillStyle = getPhaseBackground();
  ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);

  const gridSize = 50;
  ctx.strokeStyle = getPhaseGridColor();
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  if (phaseTransition > 0) {
    const alpha = Math.min(1, phaseTransition / 1.5);
    ctx.fillStyle = `rgba(0,0,0,${alpha * 0.5})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Onda ${getCurrentWave() + 1}`, canvas.width / 2, canvas.height / 2);
    const phaseName = getCurrentPhase()?.name;
    if (phaseName) {
      ctx.font = '24px monospace';
      ctx.fillText(phaseName, canvas.width / 2, canvas.height / 2 + 40);
    }
  }

  drawCoins(ctx);
  drawPowerUps(ctx);

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
    ctx.shadowBlur = 10;
    const trailLen = b.isEnemy ? 8 : 12;
    const tx = b.x - (b.vx / Math.hypot(b.vx, b.vy)) * trailLen;
    const ty = b.y - (b.vy / Math.hypot(b.vx, b.vy)) * trailLen;
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

  for (const e of enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);

    if (ENEMY_TYPES[e.type]?.armor) {
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
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
    } else if (ENEMY_TYPES[e.type]?.isBoss) {
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
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
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
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

    const eyeAngle = Math.atan2(player.y - e.y, player.x - e.x) - e.angle;
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

  for (const d of damageNumbers) {
    const alpha = Math.min(1, d.life / 0.5);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = d.color;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(d.text, d.x, d.y);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  const combo = getCombo();
  if (combo > 1) {
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 10;
    ctx.fillText(`COMBO x${combo}`, canvas.width / 2, 40);
    ctx.shadowBlur = 0;
  }

  const weapon = getCurrentWeapon();
  ctx.fillStyle = '#aaa';
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${weapon.name}`, 20, canvas.height - 20);

  drawActivePowerUps(ctx, canvas.width);
}

function loop(time: number) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(time => { lastTime = time; loop(time); });
