const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

interface Vec2 { x: number; y: number; }

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function normalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

// --- Input ---
const keys: Record<string, boolean> = {};
const mouse = { x: 0, y: 0, down: false };

document.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('mousedown', e => { mouse.down = true; e.preventDefault(); });
canvas.addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// --- Player ---
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 18,
  speed: 320,
  health: 100,
  maxHealth: 100,
  angle: 0,
  shootCooldown: 0,
  shootRate: 0.12,
  invincible: 0,
};

function resetPlayer() {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.health = player.maxHealth;
  player.angle = 0;
  player.invincible = 0;
}

// --- Bullets ---
interface Bullet {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  damage: number;
  isEnemy: boolean;
  color: string;
}

const bullets: Bullet[] = [];

function spawnBullet(x: number, y: number, angle: number, speed: number, damage: number, isEnemy: boolean, color: string) {
  bullets.push({
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1.5,
    damage,
    isEnemy,
    color,
  });
}

// --- Enemies ---
interface Enemy {
  x: number; y: number;
  radius: number;
  speed: number;
  health: number;
  maxHealth: number;
  damage: number;
  color: string;
  scoreValue: number;
  shootTimer: number;
  shootRate: number;
  canShoot: boolean;
  type: string;
}

const enemies: Enemy[] = [];

const ENEMY_TYPES = {
  grunt: { radius: 16, speed: 80, health: 20, damage: 10, color: '#e74c3c', scoreValue: 10, canShoot: false, shootRate: 0 },
  runner: { radius: 12, speed: 160, health: 10, damage: 8, color: '#e67e22', scoreValue: 15, canShoot: false, shootRate: 0 },
  tank: { radius: 26, speed: 50, health: 80, damage: 20, color: '#8e44ad', scoreValue: 30, canShoot: false, shootRate: 0 },
  shooter: { radius: 14, speed: 60, health: 30, damage: 5, color: '#2980b9', scoreValue: 25, canShoot: true, shootRate: 2.0 },
};

type EnemyType = keyof typeof ENEMY_TYPES;

function spawnEnemy(type: EnemyType) {
  const def = ENEMY_TYPES[type];
  let x: number, y: number;
  const side = Math.floor(rand(0, 4));
  if (side === 0) { x = -30; y = rand(0, canvas.height); }
  else if (side === 1) { x = canvas.width + 30; y = rand(0, canvas.height); }
  else if (side === 2) { x = rand(0, canvas.width); y = -30; }
  else { x = rand(0, canvas.width); y = canvas.height + 30; }

  enemies.push({
    x, y,
    radius: def.radius,
    speed: def.speed + rand(-10, 10),
    health: def.health,
    maxHealth: def.health,
    damage: def.damage,
    color: def.color,
    scoreValue: def.scoreValue,
    shootTimer: rand(0, def.shootRate),
    shootRate: def.shootRate,
    canShoot: def.canShoot,
    type,
  });
}

// --- Particles ---
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
}

const particles: Particle[] = [];

function spawnParticles(x: number, y: number, color: string, count: number, speed: number) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const spd = rand(speed * 0.3, speed);
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: rand(0.3, 0.7),
      maxLife: 0.7,
      radius: rand(2, 5),
      color,
    });
  }
}

// --- Wave system ---
let wave = 1;
let waveTimer = 0;
let waveInterval = 8;
let enemiesSpawnedThisWave = 0;
let enemiesPerWave = 5;

function getWaveConfig(w: number) {
  const base = 5 + w * 2;
  const types: EnemyType[] = ['grunt'];
  if (w >= 2) types.push('runner');
  if (w >= 3) types.push('tank');
  if (w >= 4) types.push('shooter');
  return { count: base, types };
}

// --- Game state ---
let score = 0;
let gameOver = false;
let lastTime = 0;

const healthEl = document.getElementById('health')!;
const scoreEl = document.getElementById('score')!;
const waveEl = document.getElementById('wave')!;
const enemiesEl = document.getElementById('enemies')!;
const gameOverEl = document.getElementById('gameOver')!;
const finalScoreEl = document.getElementById('finalScore')!;
const finalWaveEl = document.getElementById('finalWave')!;

function startGame() {
  gameOver = false;
  score = 0;
  wave = 1;
  waveTimer = 0;
  enemiesSpawnedThisWave = 0;
  const cfg = getWaveConfig(wave);
  enemiesPerWave = cfg.count;
  bullets.length = 0;
  enemies.length = 0;
  particles.length = 0;
  resetPlayer();
  gameOverEl.style.display = 'none';
}

function spawnWaveEnemies(dt: number) {
  waveTimer += dt;
  const cfg = getWaveConfig(wave);
  const spawnRate = Math.max(0.3, 1.0 - wave * 0.05);
  if (waveTimer >= spawnRate && enemiesSpawnedThisWave < cfg.count) {
    waveTimer = 0;
    const type = cfg.types[Math.floor(rand(0, cfg.types.length))];
    spawnEnemy(type);
    enemiesSpawnedThisWave++;
  }
  if (enemiesSpawnedThisWave >= cfg.count && enemies.length === 0) {
    wave++;
    enemiesSpawnedThisWave = 0;
    waveTimer = 0;
    enemiesPerWave = getWaveConfig(wave).count;
    player.health = Math.min(player.maxHealth, player.health + 20);
  }
}

function update(dt: number) {
  if (gameOver) {
    if (keys['enter']) startGame();
    return;
  }

  // Player movement
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

  // Player angle
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  // Player shooting
  player.shootCooldown -= dt;
  if (mouse.down && player.shootCooldown <= 0) {
    player.shootCooldown = player.shootRate;
    spawnBullet(player.x, player.y, player.angle, 600, 15, false, '#2ecc71');
    spawnParticles(player.x + Math.cos(player.angle) * 20, player.y + Math.sin(player.angle) * 20, '#2ecc71', 3, 100);
  }

  // Invincibility
  if (player.invincible > 0) player.invincible -= dt;

  // Wave spawning
  spawnWaveEnemies(dt);

  // Update enemies
  for (const e of enemies) {
    const dir = normalize({ x: player.x - e.x, y: player.y - e.y });
    e.x += dir.x * e.speed * dt;
    e.y += dir.y * e.speed * dt;

    // Shooter logic
    if (e.canShoot) {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = e.shootRate;
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        spawnBullet(e.x, e.y, angle, 300, e.damage, true, '#3498db');
      }
    }

    // Collision with player
    if (dist(e, player) < e.radius + player.radius && player.invincible <= 0) {
      player.health -= e.damage;
      player.invincible = 0.5;
      e.health = 0;
      spawnParticles(e.x, e.y, e.color, 10, 200);
      if (player.health <= 0) {
        gameOver = true;
        finalScoreEl.textContent = String(score);
        finalWaveEl.textContent = String(wave);
        gameOverEl.style.display = 'block';
      }
    }
  }

  // Update bullets
  for (const b of bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }

  // Bullet-enemy collision
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

  // Bullet-player collision
  for (const b of bullets) {
    if (!b.isEnemy) continue;
    if (dist(b, player) < player.radius + 4 && player.invincible <= 0) {
      player.health -= b.damage;
      player.invincible = 0.3;
      b.life = 0;
      spawnParticles(b.x, b.y, '#e74c3c', 3, 150);
      if (player.health <= 0) {
        gameOver = true;
        finalScoreEl.textContent = String(score);
        finalWaveEl.textContent = String(wave);
        gameOverEl.style.display = 'block';
      }
    }
  }

  // Remove dead
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].health <= 0) {
      score += enemies[i].scoreValue;
      spawnParticles(enemies[i].x, enemies[i].y, enemies[i].color, 15, 250);
      enemies.splice(i, 1);
    }
  }
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].life <= 0) bullets.splice(i, 1);
  }

  // Update particles
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

  // UI
  healthEl.textContent = String(Math.max(0, Math.ceil(player.health)));
  scoreEl.textContent = String(score);
  waveEl.textContent = String(wave);
  enemiesEl.textContent = String(enemies.length);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // Draw particles
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Draw bullets
  for (const b of bullets) {
    ctx.fillStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Draw enemies
  for (const e of enemies) {
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Health bar
    if (e.health < e.maxHealth) {
      const barW = e.radius * 2;
      const barH = 4;
      const bx = e.x - barW / 2;
      const by = e.y - e.radius - 10;
      ctx.fillStyle = '#333';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(bx, by, barW * (e.health / e.maxHealth), barH);
    }

    // Eyes
    const eyeAngle = Math.atan2(player.y - e.y, player.x - e.x);
    const eyeOffset = e.radius * 0.35;
    const eyeR = e.radius * 0.2;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(e.x + Math.cos(eyeAngle - 0.4) * eyeOffset, e.y + Math.sin(eyeAngle - 0.4) * eyeOffset, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e.x + Math.cos(eyeAngle + 0.4) * eyeOffset, e.y + Math.sin(eyeAngle + 0.4) * eyeOffset, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(e.x + Math.cos(eyeAngle - 0.4) * eyeOffset * 1.1, e.y + Math.sin(eyeAngle - 0.4) * eyeOffset * 1.1, eyeR * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e.x + Math.cos(eyeAngle + 0.4) * eyeOffset * 1.1, e.y + Math.sin(eyeAngle + 0.4) * eyeOffset * 1.1, eyeR * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw player
  if (!gameOver) {
    const flash = player.invincible > 0 && Math.floor(player.invincible * 20) % 2;
    if (!flash) {
      ctx.fillStyle = '#2ecc71';
      ctx.shadowColor = '#2ecc71';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Gun
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.x + Math.cos(player.angle) * 28, player.y + Math.sin(player.angle) * 28);
      ctx.stroke();

      // Eyes on player
      const eOff = player.radius * 0.3;
      const eR = player.radius * 0.22;
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
}

function loop(time: number) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

startGame();
requestAnimationFrame(time => { lastTime = time; loop(time); });
