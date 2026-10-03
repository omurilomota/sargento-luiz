/**
 * src/systems/boss.ts
 *
 * Executes o padrão data-driven do boss (`EnemyType.pattern`), substituindo o
 * `if (isBoss)` por faixa de HP que vivia dentro do `main.ts`.
 *
 * A troca de fase dispara uma janela de telegrafia antes da nova ação — é o que
 * faz um boss parecer "com mecânica" em vez de "com 3 números de HP".
 */

import { Enemy } from '../types';
import { ENEMY_TYPES } from '../config';
import { spawnBullet } from '../entities/bullet';
import { spawnParticles } from './particles';
import { PALETTE } from '../core/palette';
import { spawnEnemy } from './spawner';
import { detonateProp, getProps, igniteBarrel } from './props';

/** Intervalo base entre ações do boss (segundos) */
const ACTION_INTERVAL = 2.6;
/** Tempo de recarga da investida (charge) em segundos */
const CHARGE_SPEED = 620;
const CHARGE_TIME = 0.75;
/** Telegrafia padrão quando `EnemyType.telegraph` não vem definido */
const DEFAULT_TELEGRAPH = 0.8;

/** Estado de execução por inimigo (indexado por identidade do objeto) */
interface BossRuntime {
  /** Índice da etapa atual do padrão */
  step: number;
  /** Tempo restante da telegrafia antes da próxima ação */
  telegraph: number;
  /** Rótulo exibido durante a telegrafia */
  telegraphLabel: string;
  /** Tempo restante da investida (charge) */
  charge: number;
  /** Direção da investida */
  chargeAngle: number;
  /** Cooldown até a próxima ação */
  timer: number;
  /** Tempo de recarga das minas */
  mineTimer: number;
  /**true enquanto o boss está em telegrafia */
  flashing: boolean;
}

const runtimes = new WeakMap<Enemy, BossRuntime>();

/** Aleatoriedade injetável para os testes. */
let randFn: () => number = Math.random;
export function setBossRandom(fn: () => number): void {
  randFn = fn;
}

/**
 * Executa um passo de ação do boss.
 * @param e - o boss
 * @param tx - X do alvo (jogador)
 * @param ty - Y do alvo
 * @param worldW - largura do mundo
 * @param worldH - altura do mundo
 * @param elapsed - delta time do frame
 * @returns inimigos invocados durante este frame (para o main adicionarem)
 */
export function updateBoss(
  e: Enemy,
  tx: number,
  ty: number,
  worldW: number,
  worldH: number,
  elapsed: number
): Enemy[] {
  const spawned: Enemy[] = [];
  const def = ENEMY_TYPES[e.type];
  if (!def?.pattern || def.pattern.length === 0) return spawned;

  let rt = runtimes.get(e);
  if (!rt) {
    rt = {
      step: 0,
      telegraph: 0,
      telegraphLabel: '',
      charge: 0,
      chargeAngle: 0,
      timer: ACTION_INTERVAL,
      mineTimer: 0,
      flashing: false,
    };
    runtimes.set(e, rt);
  }

  const hpPct = e.health / e.maxHealth;
  const step = currentStep(def.pattern, hpPct);
  if (step.index !== rt.step) {
    rt.step = step.index;
    rt.telegraph = def.telegraph ?? DEFAULT_TELEGRAPH;
    rt.telegraphLabel = step.step.telegraph ?? '';
    rt.flashing = true;
    rt.timer = ACTION_INTERVAL;
  }

  if (rt.flashing) {
    rt.telegraph -= elapsed;
    // durante a telegrafia o boss recua: dá espaço para o jogador ler a ação
    const away = Math.atan2(e.y - ty, e.x - tx);
    e.x += Math.cos(away) * def.speed * 0.5 * elapsed;
    e.y += Math.sin(away) * def.speed * 0.5 * elapsed;
    if (rt.telegraph <= 0) {
      rt.flashing = false;
      rt.timer = ACTION_INTERVAL * 0.4;
    }
    return spawned;
  }

  if (rt.charge > 0) {
    rt.charge -= elapsed;
    e.x += Math.cos(rt.chargeAngle) * CHARGE_SPEED * elapsed;
    e.y += Math.sin(rt.chargeAngle) * CHARGE_SPEED * elapsed;
    if (rt.charge <= 0) rt.charge = 0;
    return spawned;
  }

  rt.timer -= elapsed;
  if (rt.timer > 0) return spawned;
  rt.timer = ACTION_INTERVAL;

  const action = step.step.action;
  const angle = Math.atan2(ty - e.y, tx - e.x);
  const speed = def.bulletSpeed ?? 300;
  const color = def.projectileColor ?? PALETTE.terracotta;
  const dmg = e.damage;

  switch (action) {
    case 'spread':
      for (let s = -3; s <= 3; s++) {
        const a = angle + s * 0.14;
        spawnBullet(e.x, e.y, Math.cos(a) * speed * 1.1, Math.sin(a) * speed * 1.1, dmg, true, color, false);
      }
      break;
    case 'ring':
      for (let s = 0; s < 12; s++) {
        const a = (s * Math.PI * 2) / 12 + e.angle;
        spawnBullet(e.x, e.y, Math.cos(a) * speed, Math.sin(a) * speed, dmg * 0.7, true, color, false);
      }
      break;
    case 'sweep': {
      const dir = randFn() > 0.5 ? 1 : -1;
      for (let s = 0; s < 14; s++) {
        const a = angle + s * 0.09 * dir;
        spawnBullet(e.x, e.y, Math.cos(a) * speed * 0.9, Math.sin(a) * speed * 0.9, dmg * 0.6, true, color, false);
      }
      break;
    }
    case 'charge':
      rt.charge = CHARGE_TIME;
      rt.chargeAngle = angle;
      break;
    case 'summon':
      for (let i = 0; i < 3; i++) {
        const minion = spawnEnemy(
          randFn() > 0.5 ? 'runner' : 'drone',
          worldW, worldH, 3,
          e.x + (i - 1) * 40, e.y + 40
        );
        if (minion) spawned.push(minion);
      }
      spawnParticles(e.x, e.y, color, 14, 180);
      break;
    case 'mines':
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        spawnBullet(e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40,
          Math.cos(a) * 90, Math.sin(a) * 90, dmg * 0.5, true, color, false);
      }
      for (const p of getProps()) {
        if (p.kind === 'barrel' && p.health > 0) igniteBarrel(p);
      }
      break;
    case 'split':
      for (let i = 0; i < 4; i++) {
        const a = angle + (i * Math.PI) / 2;
        spawnBullet(e.x, e.y, Math.cos(a) * speed * 0.8, Math.sin(a) * speed * 0.8, dmg * 0.8, true, color, false);
      }
      break;
  }

  // 'mines' também funde props próximos ao boss — a arena fica combustível
  if (action === 'mines' || action === 'charge') {
    for (const p of getProps()) {
      if (p.kind === 'barrel' && p.health > 0 && Math.hypot(p.x - e.x, p.y - e.y) < e.radius + 40) {
        detonateProp(p);
      }
    }
  }

  return spawned;
}

function currentStep(pattern: { atHp: number; action: string; telegraph?: string }[], hpPct: number) {
  let index = 0;
  for (let i = 0; i < pattern.length; i++) {
    if (hpPct <= pattern[i].atHp) index = i;
  }
  const step = pattern[Math.min(index, pattern.length - 1)];
  return { index: Math.min(index, pattern.length - 1), step: step as { atHp: number; action: string; telegraph?: string } };
}

/** Limpa o estado de um boss (usado quando ele morre). */
export function clearBossState(e: Enemy): void {
  runtimes.delete(e);
}

/**
 * Retorna se o boss está em janela de telegrafia (para o HUD piscar).
 */
export function isBossTelegraphing(e: Enemy): boolean {
  return runtimes.get(e)?.flashing ?? false;
}
