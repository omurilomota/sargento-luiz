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
import { moveCircleBy, pushOutOfWalls, isWall, colAt, rowAt, sampleFlowDir } from './tilemap';
import { triggerScreenShake } from './effects';
import { sfxEnemyShoot, sfxSpit } from './audio';

/** Intervalo base entre ações do boss (segundos) */
const ACTION_INTERVAL = 3.4;
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
  /** Trem: ângulo travado no eixo da via (0 = para a direita) */
  railAngle: number;
  /** Cooldown até a próxima ação */
  timer: number;
  /** Tempo de recarga das minas */
  mineTimer: number;
  /** Rajada em 3 tempos: quantas ondas faltam e quando dispara a próxima */
  burstLeft: number;
  burstTimer: number;
  burstAngle: number;
  /**true enquanto o boss está em telegrafia */
  flashing: boolean;
  /** arraste da língua: força e direção aplicadas ao jogador pelo main */
  tonguePull: number;
  tongueAngle: number;
}

const runtimes = new WeakMap<Enemy, BossRuntime>();

/** Velocidade e sprite do projétil conforme o tipo do chefe (mesma regra do
 *  `shootEnemyAt`: gosma/lasca/brasa não são cartucho). */
function spriteDe(def: typeof ENEMY_TYPES[string]): string {
  return def.projectileKind === 'slime' ? 'slime_blob'
    : def.projectileKind === 'shard' ? 'shard_blob'
    : def.projectileKind === 'ember' ? 'ember_blob'
    : def.projectileKind === 'spark' ? 'spark_blob'
    : def.projectileKind === 'vomit' ? 'vomit_blob'
    : def.projectileKind === 'rad' ? 'rad_blob' : 'small_bullet';
}
function speedDe(def: typeof ENEMY_TYPES[string]): number {
  return def.bulletSpeed ?? 300;
}

/** Aleatoriedade injetável para os testes. */
let randFn: () => number = Math.random;
export function setBossRandom(fn: () => number): void {
  randFn = fn;
}

/**
 * Executa um passo de ação do boss.
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
      // step começa fora de qualquer faixa: se valer 0, `step.index !== rt.step`
      // é falso no primeiro frame e o chefe nunca telegrafa a PRIMEIRA ação —
      // ele fica 2.6s em silêncio e ataca sem aviso. -1 força a entrada na
      // faixa 0 com janela de leitura, que é o que o padrão promete.
      step: -1,
      telegraph: 0,
      telegraphLabel: '',
      charge: 0,
      chargeAngle: 0,
      railAngle: 0,
      timer: ACTION_INTERVAL,
      mineTimer: 0,
      burstLeft: 0,
      burstTimer: 0,
      burstAngle: 0,
      flashing: false,
      tonguePull: 0,
      tongueAngle: 0,
    };
    runtimes.set(e, rt);
  }

  const hpPct = e.health / e.maxHealth;
  const step = currentStep(def.pattern, hpPct);
  if (step.index !== rt.step) {
    rt.step = step.index;
    // telegrafia 0.2s menor: mantém a leitura mas cobra punho rápido
    rt.telegraph = Math.max(0.4, (def.telegraph ?? DEFAULT_TELEGRAPH) - 0.2);
    rt.telegraphLabel = step.step.telegraph ?? '';
    rt.flashing = true;
    rt.timer = ACTION_INTERVAL;
  }

  if (rt.flashing) {
    rt.telegraph -= elapsed;
    // durante a telegrafia o boss recua: dá espaço para o jogador ler a ação.
    // Precisa resolver contra o grid — recuar sem colisão enterrava o boss na
    // parede e ele ficava congelado ali para sempre.
    const away = Math.atan2(e.y - ty, e.x - tx);
    const recuo = def.speed * 0.3 * elapsed;
    const moved = moveCircleBy(
      e.x, e.y,
      Math.cos(away) * recuo,
      Math.sin(away) * recuo,
      e.radius,
    );
    e.x = moved.x;
    e.y = moved.y;
    if (rt.telegraph <= 0) {
      rt.flashing = false;
      rt.timer = ACTION_INTERVAL * 0.4;
    }
    return spawned;
  }

  if (rt.charge > 0) {
    rt.charge -= elapsed;
    // resolve contra o grid como o jogador: sem isso o chefe atravessa parede
    // e a arena deixa de existir. Na Cidade a praça é cercada e o VIGIA
    // atravessava a parede no primeiro ataque — exatamente o momento em que o
    // jogador está sendo ensinado a usar cobertura.
    const next = moveCircleBy(
      e.x, e.y,
      Math.cos(rt.chargeAngle) * CHARGE_SPEED * elapsed,
      Math.sin(rt.chargeAngle) * CHARGE_SPEED * elapsed,
      e.radius,
    );
    e.x = next.x;
    e.y = next.y;
    if (rt.charge <= 0) {
      rt.charge = 0;
      const out = pushOutOfWalls(e.x, e.y, e.radius);
      e.x = out.x;
      e.y = out.y;
    }
    return spawned;
  }

  // rajada em 3 tempos: dispara uma onda, espera 0.35s, dispara outra. O
  // ângulo é travado no início para as três ondas formarem um corredor, não
  // um leque giratório — é isso que a distingue do `spread` de uma vez só.
  if (rt.burstLeft > 0) {
    rt.burstTimer -= elapsed;
    if (rt.burstTimer <= 0) {
      rt.burstTimer = 0.35;
      rt.burstLeft--;
      for (let s = -2; s <= 2; s++) {
        const a = rt.burstAngle + s * 0.12;
        spawnBullet(e.x, e.y, Math.cos(a) * speedDe(def), Math.sin(a) * speedDe(def),
          e.damage * 0.8, true, def.projectileColor ?? PALETTE.terracotta, false, false, 0, false, spriteDe(def));
      }
    }
    return spawned;
  }

  // entre ações o boss persegue o jogador pelo flow field — antes ele ficava
  // estático todo o intervalo do timer, como um espantalho
  const flow = sampleFlowDir(e.x, e.y);
  const distToPlayer = Math.hypot(tx - e.x, ty - e.y);
  let seekX = 0;
  let seekY = 0;
  if (distToPlayer < 140) {
    const len = distToPlayer || 1;
    seekX = (tx - e.x) / len;
    seekY = (ty - e.y) / len;
  } else if (flow.x !== 0 || flow.y !== 0) {
    seekX = flow.x;
    seekY = flow.y;
  } else {
    const len = distToPlayer || 1;
    seekX = (tx - e.x) / len;
    seekY = (ty - e.y) / len;
  }
  if (seekX !== 0 || seekY !== 0) {
    const passo = def.speed * 0.9 * elapsed; // antes 0.6 — o chefe parecia arrastar
    const antesX = e.x, antesY = e.y;
    const next = moveCircleBy(e.x, e.y, seekX * passo, seekY * passo, e.radius);
    e.x = next.x;
    e.y = next.y;
    // SEPRESO NA PAREDE: se o vetor direto não andou (raio grande perto de
    // canto), testa 4 direções e fica com a que mais andou — o mesmo resgate
    // dos inimigos comuns. Sem isto o chefe grudava no canto para sempre.
    if (Math.hypot(e.x - antesX, e.y - antesY) < passo * 0.2) {
      const tentativa = passo * 3;
      let bx = e.x, by = e.y, melhor = -1;
      for (const [cx, cy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const t = moveCircleBy(antesX, antesY, cx * tentativa, cy * tentativa, e.radius);
        const d = Math.hypot(t.x - antesX, t.y - antesY);
        if (d > melhor) { melhor = d; bx = t.x; by = t.y; }
      }
      if (melhor > 0) { e.x = bx; e.y = by; }
    }
  }

  if (rt.tonguePull > 0) rt.tonguePull = Math.max(0, rt.tonguePull - elapsed);

  rt.timer -= elapsed;
  if (rt.timer > 0) return spawned;
  rt.timer = ACTION_INTERVAL;

  const action = step.step.action;
  const angle = Math.atan2(ty - e.y, tx - e.x);
  const speed = def.bulletSpeed ?? 300;
  const color = def.projectileColor ?? PALETTE.terracotta;
  const dmg = e.damage * 1.3;

  switch (action) {
    case 'spread':
      for (let s = -2; s <= 2; s++) {
        const a = angle + s * 0.14;
        spawnBullet(e.x, e.y, Math.cos(a) * speed * 1.1, Math.sin(a) * speed * 1.1, dmg, true, color, false, false, 0, false, spriteDe(def));
      }
      break;
    case 'ring':
      // 8 tiros a cada 30° deixavam um setor cego de 120° fixo (o e.angle só
      // é definido no spawn e nunca muda): a promessa do NÚCLEO era "nenhuma
      // diagonal é segura" — 12 tiros fecham o círculo inteiro
      for (let s = 0; s < 12; s++) {
        const a = (s * Math.PI * 2) / 12 + e.angle;
        spawnBullet(e.x, e.y, Math.cos(a) * speed, Math.sin(a) * speed, dmg * 0.7, true, color, false, false, 0, false, spriteDe(def));
      }
      break;
    case 'spray':
      // glândula/respingo: arco curto de 7 gotas, mais aberto que o `spread`
      // de 5 retas. A gota não gira no render — é respingo, não metralhadora.
      for (let s = -3; s <= 3; s++) {
        const a = angle + s * 0.16;
        spawnBullet(e.x, e.y, Math.cos(a) * speed * 0.85, Math.sin(a) * speed * 0.85,
          dmg * 0.6, true, color, false, false, 0, false, spriteDe(def));
      }
      break;
    case 'burst':
      rt.burstLeft = 3;
      rt.burstTimer = 0;
      rt.burstAngle = angle;
      break;
    case 'lob':
      // 3 gotas caem perto do jogador, não miram nele: cria uma área que
      // obriga a sair do lugar em vez de só desviar da linha reta.
      for (let s = -1; s <= 1; s++) {
        const a = angle + s * 0.5;
        const alcance = Math.min(220, distToPlayer || 180);
        const alvoX = e.x + Math.cos(a) * alcance;
        const alvoY = e.y + Math.sin(a) * alcance;
        const livre = pushOutOfWalls(alvoX, alvoY, 12);
        spawnBullet(livre.x, livre.y, 0, 0, dmg * 0.5, true, color, false, false, 0, false, spriteDe(def));
      }
      break;
    case 'sweep': {
      const dir = randFn() > 0.5 ? 1 : -1;
      for (let s = 0; s < 9; s++) {
        const a = angle + s * 0.09 * dir;
        spawnBullet(e.x, e.y, Math.cos(a) * speed * 0.9, Math.sin(a) * speed * 0.9, dmg * 0.6, true, color, false, false, 0, false, spriteDe(def));
      }
      break;
    }
    case 'charge':
      rt.charge = CHARGE_TIME;
      rt.chargeAngle = angle;
      break;
    case 'rail_charge':
      // O maquinista É a locomotiva: não carga na direção do jogador, desce
      // o trilho em linha reta (eixo x do mapa do Pátio). Mais longa e mais
      // lenta que a investida normal, com tremor continuo — é o trem passando.
      rt.charge = CHARGE_TIME * 2.4;
      rt.railAngle = angle >= -Math.PI / 2 && angle <= Math.PI / 2 ? 0 : Math.PI;
      rt.chargeAngle = rt.railAngle;
      triggerScreenShake(6, CHARGE_TIME * 2.4);
      // fumaça de vapor saindo da chaminé
      spawnParticles(e.x, e.y, '#8a7a60', 14, 200);
      break;
    case 'tongue': {
      // Pale Crocodile: língua longa que acerta e ARRASTA o jogador para perto.
      // O arraste é lido pelo main (getBossPull) e aplicado com moveCircleBy.
      const pe = Math.cos(angle), pe2 = Math.sin(angle);
      spawnBullet(e.x, e.y, pe * speed * 1.4, pe2 * speed * 1.4, dmg, true, color, false, false, 0, false, 'tongue_blob');
      rt.tonguePull = 1.4;
      rt.tongueAngle = angle;
      sfxSpit();
      break;
    }
    case 'summon': {
      for (let i = 0; i < 2; i++) {
        // offset fixo caía dentro de prédio e o minion ficava preso: valida
        // contra o grid e cai para a célula livre mais próxima do boss
        let mx = e.x + (i - 1) * 40;
        let my = e.y + 40;
        if (isWall(colAt(mx), rowAt(my))) {
          const out = pushOutOfWalls(mx, my, 16);
          mx = out.x;
          my = out.y;
        }
        const minion = spawnEnemy(
          randFn() > 0.5 ? 'runner' : 'drone',
          worldW, worldH, 3,
          mx, my
        );
        if (minion) {
          const out = pushOutOfWalls(minion.x, minion.y, minion.radius);
          minion.x = out.x;
          minion.y = out.y;
          spawned.push(minion);
        }
      }
      spawnParticles(e.x, e.y, color, 14, 180);
      break;
    }
    case 'mines':
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        spawnBullet(e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40,
          Math.cos(a) * 90, Math.sin(a) * 90, dmg * 0.5, true, color, false, false, 0, false, spriteDe(def));
      }
      for (const p of getProps()) {
        if (p.kind === 'barrel' && p.health > 0) igniteBarrel(p);
      }
      break;
    case 'split':
      for (let i = 0; i < 3; i++) {
        const a = angle + (i * Math.PI) / 2;
        spawnBullet(e.x, e.y, Math.cos(a) * speed * 0.8, Math.sin(a) * speed * 0.8, dmg * 0.8, true, color, false, false, 0, false, spriteDe(def));
      }
      break;
  }

  // Som do disparo segue o projétil: gosma cospe, lasca/faísca estala.
  if (action === 'spread' || action === 'ring' || action === 'sweep'
    || action === 'spray' || action === 'lob' || action === 'split' || action === 'mines') {
    if (def.projectileKind === 'slime' || def.projectileKind === 'ember'
      || def.projectileKind === 'vomit' || def.projectileKind === 'rad') sfxSpit();
    else sfxEnemyShoot();
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

/** Texto da ação que vem a seguir, para a barra de boss. */
export function getBossTelegraphLabel(e: Enemy): string {
  const rt = runtimes.get(e);
  return rt?.flashing ? rt.telegraphLabel : '';
}

/** Força e direção do arraste da língua do Pale Crocodile (0 se não ativo). */
export function getBossPull(e: Enemy): { forca: number; angle: number } {
  const rt = runtimes.get(e);
  return rt ? { forca: rt.tonguePull, angle: rt.tongueAngle } : { forca: 0, angle: 0 };
}
