/**
 * Entidade do jogador.
 * Gerencia o estado, movimento, dano e cura do jogador.
 * Mantém um objeto Player singleton acessível por todos os módulos.
 */

import { PLAYER_BASE_SPEED, PLAYER_BASE_HEALTH, PLAYER_RADIUS, INVINCIBLE_DURATION, BULLET_INVINCIBLE_DURATION, WAVE_HEAL_ON_COMPLETE } from '../core/constants';
import { getStat, applyStat, resetStat } from '../core/stats';
import { getHardcore } from '../systems/gameModes';
import { registrarDano, type FonteDano } from '../systems/danoTelemetria';
import { moveCircleBy } from '../systems/tilemap';

/** Interface que define todas as propriedades do jogador */
export interface Player {
  x: number;
  y: number;
  radius: number;
  speed: number;
  health: number;
  maxHealth: number;
  angle: number;
  shootCooldown: number;
  invincible: number;
  shield: number;
  hitFlash: number;
  deathTimer: number;
  deathAngle: number;
}

/** Instância singleton do jogador */
let player: Player;

/**
 * Inicializa o jogador com stats base na posição central do canvas.
 * Só no boot e em partida nova — ver `resetPlayerProgress`.
 */
export function initPlayer(canvasWidth: number, canvasHeight: number): void {
  player = {
    x: canvasWidth / 2, y: canvasHeight / 2,
    radius: PLAYER_RADIUS, speed: PLAYER_BASE_SPEED,
    health: PLAYER_BASE_HEALTH, maxHealth: PLAYER_BASE_HEALTH,
    angle: 0, shootCooldown: 0, invincible: 0, shield: 0, hitFlash: 0,
    deathTimer: 0, deathAngle: 0,
  };
}

/**
 * Coloca o jogador no ponto de entrada de uma fase nova, curado.
 *
 * Não toca em `maxHealth`, armadura nem medkits: comprar "Vida +100" e chegar
 * na fase seguinte com 100 era o bug de `initPlayer` rodando aqui.
 */
export function placePlayer(x: number, y: number): void {
  if (!player) {
    initPlayer(x, y);
    return;
  }
  player.x = x;
  player.y = y;
  player.health = player.maxHealth;
  player.angle = 0;
  player.shootCooldown = 0;
  player.invincible = 0;
  player.shield = 0;
  player.hitFlash = 0;
  player.deathTimer = 0;
  player.deathAngle = 0;
}

/** Zera a progressão acumulada. Só na partida nova, nunca na troca de fase. */
export function resetPlayerProgress(): void {
  if (player) {
    player.maxHealth = PLAYER_BASE_HEALTH;
    player.health = PLAYER_BASE_HEALTH;
  }
  resetStat('armor');
  medkits = 0;
  comboHealthMultiplier = 1;
}

/**
 * Retorna a referência ao objeto do jogador.
 */
export function getPlayer(): Player {
  return player;
}

/**
 * Move o jogador com base nas teclas pressionadas.
 * Normaliza a diagonal e resolve a colisão contra o grid (deslize por eixo),
 * em coordenadas de mundo — não mais contra as bordas do canvas.
 * @param bounds - limites do mundo em pixels
 * @param speedMultiplier - multiplicador de velocidade (ex: power-up de velocidade)
 */
export function movePlayer(
  keys: Record<string, boolean>,
  dt: number,
  bounds: { w: number; h: number },
  speedMultiplier: number
): void {
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const spd = player.speed * speedMultiplier;
    const moved = moveCircleBy(player.x, player.y, dx * spd * dt, dy * spd * dt, player.radius);
    player.x = moved.x;
    player.y = moved.y;
  }
  player.x = Math.max(player.radius, Math.min(bounds.w - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(bounds.h - player.radius, player.y));
}

/**
 * De onde veio o dano, para a telemetria de `npm run sessao`.
 *
 * `fonte` tem padrão por função (projétil → `projetil`, contato → `contato`) e
 * só o chamador que sabe de outro lugar precisa dizer: hazard de bioma, explosão
 * de caixote e bot do competitivo.
 */
export interface DanoCtx {
  fonte?: FonteDano;
  /** Tipo do inimigo que causou — `grunt`, `ufo`, … Só para atribuição fina. */
  tipo?: string;
}

/**
 * Aplica dano ao jogador causado por projéteis inimigos.
 *
 * A armadura passa a valer aqui também. Antes ela era só placa contra corpo a
 * corpo — declaro isso no próprio código, e o jogador lia "Armadura +5%" como
 * se fosse defesa geral. 17 dos 31 tipos de inimigo atiram, então mais da metade
 * do dano que chega ao jogador ignorava o eixo CORPO inteiro.
 *
 * O registro da telemetria mora AQUI, e não em cada chamador de `main.ts`: são
 * 6 caminhos que tiram HP (projétil, contato, hazard de bioma, explosão de
 * caixote, bot, explosão) e, registrado na ponta, 3 deles entravam por baixo
 * da régua. O `sessao` media 20 de 130 de dano — e uma régua que mede um terço
 * do que acontece não serve para calibrar nada.
 */
export function damagePlayer(amount: number, ctx: DanoCtx = {}): void {
  if (player.shield > 0) {
    player.shield--;
  } else {
    const reduced = Math.max(1, Math.floor(amount * (1 - getStat('armor'))));
    player.health -= reduced;
    registrarDano(ctx.fonte ?? 'projetil', reduced, ctx.tipo ?? '');
  }
  player.hitFlash = 0.2;
  player.invincible = BULLET_INVINCIBLE_DURATION;
}

/**
 * Aplica dano ao jogador causado por colisão direta com inimigos.
 * Escudo absorve o dano se disponível. Invencibilidade mais longa que projéteis.
 *
 * Mesma porta da telemetria de `damagePlayer`: registra aqui, não no chamador.
 */
export function enemyCollisionDamage(enemyDamage: number, ctx: DanoCtx = {}): void {
  if (player.shield > 0) {
    player.shield--;
  } else {
    const reduced = Math.max(1, Math.floor(enemyDamage * (1 - getStat('armor'))));
    player.health -= reduced;
    registrarDano(ctx.fonte ?? 'contato', reduced, ctx.tipo ?? '');
  }
  player.hitFlash = 0.2;
  player.invincible = INVINCIBLE_DURATION;
}

/**
 * Cura o jogador, limitado ao máximo de vida.
 */
export function useMedkit(): void {
  if (medkits <= 0 || player.health >= player.maxHealth) return;
  medkits--;
  player.health = Math.min(player.maxHealth, player.health + 50);
  player.hitFlash = 0.1;
}

export function addMedkits(n: number): void {
  medkits = Math.min(medkits + n, 9);
}

export function getMedkits(): number {
  return medkits;
}

let medkits = 0;

export function healPlayer(amount: number): void {
  player.health = Math.min(player.maxHealth, player.health + amount);
}

/**
 * Cura o jogador ao completar uma onda.
 * Usa o valor de WAVE_HEAL_ON_COMPLETE.
 */
export function healOnWaveComplete(): void {
  if (getHardcore()) return;
  player.health = Math.min(player.maxHealth, player.health + WAVE_HEAL_ON_COMPLETE);
}

/**
 * Aumenta a vida máxima do jogador e cura pela mesma quantidade.
 * @param amount - quantidade a adicionar ao máximo e à vida atual
 */
export function addMaxHealth(amount: number): void {
  player.maxHealth += amount;
  player.health += amount;
}

let comboHealthMultiplier = 1;

/**
 * Define o multiplicador de vida dos combos.
 * @param multiplier - multiplicador (ex: 1.25 = +25% vida)
 */
export function setComboHealthMultiplier(multiplier: number): void {
  const oldMax = getEffectiveMaxHealth();
  comboHealthMultiplier = multiplier;
  const newMax = getEffectiveMaxHealth();
  player.maxHealth += (newMax - oldMax);
  player.health = Math.min(player.health, player.maxHealth);
}

/**
 * Retorna a vida máxima efetiva (base + combo bonus).
 */
export function getEffectiveMaxHealth(): number {
  return Math.floor(player.maxHealth * comboHealthMultiplier);
}

/**
 * Aumenta a velocidade base do jogador.
 * @param multiplier - valor percentual a adicionar (ex: 0.15 = +15%)
 */
export function addSpeed(multiplier: number): void {
  player.speed += player.speed * multiplier;
}

/**
 * Adiciona cargas de escudo ao jogador.
 */
export function addShield(amount: number): void {
  player.shield += amount;
}

/**
 * Aplica regeneração se ativa.
 */
export function applyRegen(dt: number): void {
  if (getHardcore()) return;
  const regen = getStat('regen');
  if (player.health < player.maxHealth && regen > 0) {
    player.health = Math.min(player.maxHealth, player.health + regen * dt);
  }
}

/**
 * Reseta a regeneração.
 */
export function resetRegen(): void {
  resetStat('regen');
}

/**
 * Ativa/regeneração permanente. Stacking: cada compra aumenta o nível.
 * @param value - HP por segundo a adicionar (ex: 1 para Regeneração, 2 para Regen Avançada)
 */
export function enableRegen(value: number = 1): void {
  applyStat('regen', value);
}

/**
 * Adiciona armadura ao jogador.
 * @param value - nível de armadura (0-1, ex: 0.15 = 15% redução)
 */
export function addArmor(value: number): void {
  applyStat('armor', value);
}

/**
 * Retorna o nível de armadura.
 */
export function getArmorLevel(): number {
  return getStat('armor');
}
