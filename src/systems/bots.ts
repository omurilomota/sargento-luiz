/**
 * Sistema de bots para modo competitivo.
 * Bots são controlados por IA que simula jogadores experientes:
 * - Movimentação estratégica (esquiva de balas, mantém distância)
 * - Mira no jogador e dispara
 * - Diferentes níveis de dificuldade
 */

import { normalize } from '../utils';
import { moveCircleBy, sampleFlowDir, getMapWidth, getMapHeight, findFreeSpotNear } from './tilemap';
import { PALETTE } from '../core/palette';

/** Nível de dificuldade do bot */
export type BotDifficulty = 'easy' | 'medium' | 'hard';

/** Representa um bot controlado por IA */
export interface Bot {
  /** Posição horizontal */
  x: number;
  /** Posição vertical */
  y: number;
  /** Raio de colisão */
  radius: number;
  /** Velocidade de movimento */
  speed: number;
  /** Vida atual */
  health: number;
  /** Vida máxima */
  maxHealth: number;
  /** Dano por tiro */
  damage: number;
  /** Cor do bot */
  color: string;
  /** Ângulo de mira */
  angle: number;
  /** Timer de disparo */
  shootTimer: number;
  /** Intervalo entre disparos */
  shootRate: number;
  /** Nível de dificuldade */
  difficulty: BotDifficulty;
  /** Timer para mudança de direção */
  moveTimer: number;
  /** Direção de movimento atual */
  moveDirX: number;
  moveDirY: number;
  /** Timer de esquiva */
  dodgeTimer: number;
  /** Se está esquivando */
  isDodging: boolean;
  /** Pontos concedidos ao ser derrotado */
  scoreValue: number;
  /** Moedas dropadas */
  coinDrop: number;
  /** Nome exibido do bot */
  name: string;
  /** Tempo que o bot ficou preso na parede */
  stuckTimer?: number;
}

/** Configurações de dificuldade */
const DIFFICULTY_CONFIG: Record<BotDifficulty, {
  health: number;
  speed: number;
  damage: number;
  shootRate: number;
  dodgeChance: number;
  aimAccuracy: number;
  scoreValue: number;
  coinDrop: number;
}> = {
  easy: { health: 80, speed: 180, damage: 6, shootRate: 0.8, dodgeChance: 0.2, aimAccuracy: 0.15, scoreValue: 50, coinDrop: 8 },
  medium: { health: 120, speed: 220, damage: 10, shootRate: 0.5, dodgeChance: 0.5, aimAccuracy: 0.08, scoreValue: 100, coinDrop: 15 },
  hard: { health: 180, speed: 260, damage: 14, shootRate: 0.35, dodgeChance: 0.8, aimAccuracy: 0.03, scoreValue: 200, coinDrop: 25 },
};

/** Nomes possíveis para bots */
const BOT_NAMES = ['Shadow', 'Blaze', 'Viper', 'Frost', 'Storm', 'Ninja', 'Titan', 'Ghost'];

/** Lista de bots ativos */
let bots: Bot[] = [];

/**
 * Retorna a lista de bots ativos.
 */
export function getBots(): Bot[] {
  return bots;
}

/**
 * Cria um bot com a dificuldade especificada.
 *
 * @param worldWidth - largura do MAPA, não da tela
 * @param worldHeight - altura do MAPA, não da tela
 *
 * Nasce dentro do mapa, numa célula de chão perto de uma borda. Antes ia para
 * `-30` / `worldW + 30`: `main.ts` passa `worldW/worldH` (o tamanho do mapa,
 * não o do canvas) e o bot aparecia dentro do anel de parede da borda, de onde
 * o `moveCircleBy` não consegue sair — daí o "bot esbarrando em parede".
 */
export function createBot(difficulty: BotDifficulty, worldWidth: number, worldHeight: number): Bot {
  const config = DIFFICULTY_CONFIG[difficulty];
  const margin = 96;
  const x = Math.random();
  const y = Math.random();
  const bx = margin + x * (worldWidth - margin * 2);
  const by = margin + y * (worldHeight - margin * 2);
  const edge = [
    [bx, margin],
    [bx, worldHeight - margin],
    [margin, by],
    [worldWidth - margin, by],
  ][Math.floor(Math.random() * 4)];
  const spot = findFreeSpotNear(edge[0], edge[1], 16);

  return {
    x: spot.x, y: spot.y, radius: 16, speed: config.speed,
    health: config.health, maxHealth: config.health,
    damage: config.damage, color: difficulty === 'hard' ? PALETTE.danger : difficulty === 'medium' ? PALETTE.mustard : PALETTE.stone,
    angle: 0, shootTimer: 0, shootRate: config.shootRate,
    difficulty, moveTimer: 0, moveDirX: 0, moveDirY: 0,
    dodgeTimer: 0, isDodging: false,
    scoreValue: config.scoreValue, coinDrop: config.coinDrop,
    name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
  };
}

/**
 * Atualiza a IA de todos os bots.
 * @param playerX - posição X do jogador
 */
export function updateBots(
  dt: number,
  playerX: number,
  playerY: number,
  bullets: { x: number; y: number; vx: number; vy: number; isEnemy: boolean }[],
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; vx: number; vy: number; damage: number; color: string }[] {
  const newBullets: { x: number; y: number; vx: number; vy: number; damage: number; color: string }[] = [];

  for (const bot of bots) {
    const config = DIFFICULTY_CONFIG[bot.difficulty];
    const distToPlayer = Math.hypot(playerX - bot.x, playerY - bot.y);

    // --- Movement AI ---
    bot.moveTimer -= dt;
    if (bot.moveTimer <= 0) {
      bot.moveTimer = 0.5 + Math.random() * 1.0;
      const dir = normalize({ x: playerX - bot.x, y: playerY - bot.y });
      // Mantém distância ideal (200-350px)
      if (distToPlayer < 200) {
        bot.moveDirX = -dir.x;
        bot.moveDirY = -dir.y;
      } else if (distToPlayer > 350) {
        // usa o flow field: seek direto fazia o bot da IA esbarrar nos cantos
        const flow = sampleFlowDir(bot.x, bot.y);
        if (flow.x !== 0 || flow.y !== 0) {
          bot.moveDirX = flow.x;
          bot.moveDirY = flow.y;
        } else {
          bot.moveDirX = dir.x;
          bot.moveDirY = dir.y;
        }
      } else {
        // Strafe perpendicular
        bot.moveDirX = -dir.y * (Math.random() > 0.5 ? 1 : -1);
        bot.moveDirY = dir.x * (Math.random() > 0.5 ? 1 : -1);
      }
    }

    // Aplica movimento
    const len = Math.hypot(bot.moveDirX, bot.moveDirY) || 1;
    const ox = bot.x;
    const oy = bot.y;
    const moved = moveCircleBy(
      bot.x, bot.y,
      (bot.moveDirX / len) * bot.speed * dt,
      (bot.moveDirY / len) * bot.speed * dt,
      bot.radius,
    );
    bot.x = moved.x;
    bot.y = moved.y;
    const movido = Math.hypot(bot.x - ox, bot.y - oy);
    if (movido < bot.speed * dt * 0.2) {
      bot.stuckTimer = (bot.stuckTimer ?? 0) + dt;
      if (bot.stuckTimer > 1) {
        // escape validado: testa 4 direcoes via moveCircleBy e fica com a que
        // mais andou. Sortear 1 direcao cega podia mandar pra mesma parede.
        const step = bot.speed * dt * 4;
        const cands: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        let best: [number, number] = cands[Math.floor(Math.random() * 4)];
        let bestDist = -1;
        for (const [cx, cy] of cands) {
          const t = moveCircleBy(bot.x, bot.y, cx * step, cy * step, bot.radius);
          const dd = Math.hypot(t.x - bot.x, t.y - bot.y);
          if (dd > bestDist) { bestDist = dd; best = [cx, cy]; }
        }
        bot.moveDirX = best[0];
        bot.moveDirY = best[1];
        bot.moveTimer = 0.4;
        bot.stuckTimer = 0;
      }
    } else {
      bot.stuckTimer = 0;
    }

    // limites do MUNDO (tilemap ja da clamp), nao da tela: o mundo e maior
    // que o canvas e o clamp de tela prendia o bot na borda visivel
    const mw = getMapWidth();
    const mh = getMapHeight();
    if (mw > 0) bot.x = Math.max(bot.radius, Math.min(mw - bot.radius, bot.x));
    else bot.x = Math.max(bot.radius, Math.min(canvasWidth - bot.radius, bot.x));
    if (mh > 0) bot.y = Math.max(bot.radius, Math.min(mh - bot.radius, bot.y));
    else bot.y = Math.max(bot.radius, Math.min(canvasHeight - bot.radius, bot.y));

    // --- Dodge AI ---
    bot.dodgeTimer -= dt;
    if (bot.dodgeTimer <= 0 && !bot.isDodging) {
      // Verifica projéteis próximos
      for (const b of bullets) {
        if (b.isEnemy) continue;
        const distToBullet = Math.hypot(b.x - bot.x, b.y - bot.y);
        if (distToBullet < 80 && Math.random() < config.dodgeChance) {
          bot.isDodging = true;
          bot.dodgeTimer = 0.3;
          const dodgeDir = normalize({ x: b.vy, y: -b.vx });
          bot.moveDirX = dodgeDir.x;
          bot.moveDirY = dodgeDir.y;
          bot.moveTimer = 0.3;
          break;
        }
      }
    }
    if (bot.isDodging) {
      bot.dodgeTimer -= dt;
      if (bot.dodgeTimer <= 0) bot.isDodging = false;
    }

    // --- Aim & Shoot AI ---
    bot.angle = Math.atan2(playerY - bot.y, playerX - bot.x);
    bot.shootTimer -= dt;
    if (bot.shootTimer <= 0 && distToPlayer < 500) {
      bot.shootTimer = bot.shootRate;
      const inaccuracy = (Math.random() - 0.5) * config.aimAccuracy;
      const shootAngle = bot.angle + inaccuracy;
      newBullets.push({
        x: bot.x, y: bot.y,
        vx: Math.cos(shootAngle) * 400,
        vy: Math.sin(shootAngle) * 400,
        damage: bot.damage,
        color: bot.color,
      });
    }
  }

  return newBullets;
}

/**
 * Remove bots mortos (health <= 0).
 */
export function removeDeadBots(): Bot[] {
  const dead: Bot[] = [];
  for (let i = bots.length - 1; i >= 0; i--) {
    if (bots[i].health <= 0) {
      dead.push(bots[i]);
      bots[i] = bots[bots.length - 1];
      bots.pop();
    }
  }
  return dead;
}

/**
 * Reseta todos os bots.
 */
export function resetBots(): void {
  bots.length = 0;
}

/**
 * Adiciona um bot à lista.
 */
export function addBot(bot: Bot): void {
  bots.push(bot);
}
