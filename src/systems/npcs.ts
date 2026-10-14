export interface NPC {
  x: number;
  y: number;
  name: string;
  color: string;
  health: number;
  maxHealth: number;
  radius: number;
  speed: number;
  alive: boolean;
  message: string;
  messageTimer: number;
  /** Personagem do pack (sprite) — sem isto TODO NPC vestia a roupa do jogador. */
  character: string;
}

import { markVipDown } from './objectives';
import { getAnyRocket } from './props';
import { moveCircleBy } from './tilemap';
import { bulletHitsCircle } from './collision';
import { Bullet } from '../types';

let npcMorreuNoFrame = false;

/** O NPC que caiu é o ALVO da fase, ou só um acompanhante (Castelo: Júlio)? */
function morteDeAlvo(): void {
  // Com foguete em campo o alvo do `protect` é ele (decisão 2026-10-12); o
  // NPC é bônus — a morte dele custa a recompensa (sala 4B, diário), não a
  // fase. Sem isto, o Júlio morto por zumbi reiniciava a fase pra onda 1,
  // o glitch que o Murilo reportou no Castelo.
  npcMorreuNoFrame = true;
  if (getAnyRocket()) return;
  markVipDown();
}

/**
 * Consome a morte de NPC deste frame. O script do Castelo usa para abrir a
 * fala da perda do Júlio sem depender do array (o corpo sai da lista 3s
 * depois da mensagem de morte).
 */
export function consumeNpcDeath(): boolean {
  const morreu = npcMorreuNoFrame;
  npcMorreuNoFrame = false;
  return morreu;
}

let npcFollow = true;

export function toggleNpcFollow(): boolean {
  npcFollow = !npcFollow;
  return npcFollow;
}

/** Se o NPC está seguindo o jogador (para o HUD mostrar a tecla J). */
export function isNpcFollowing(): boolean { return npcFollow; }

/** Dano por segundo do NPC enquanto um inimigo encosta nele. */
const NPC_CONTACT_DPS = 30;

let npcs: NPC[] = [];

const NPC_DEFS = [
  { name: 'Cientista', color: '#608090', health: 30, radius: 14, speed: 60, message: 'Encontrei uma cura...', character: 'woman' },
  { name: 'Soldado', color: '#7a9a6a', health: 50, radius: 16, speed: 70, message: 'Vou te cobrir!', character: 'soldier' },
  { name: 'Civil', color: '#a08050', health: 15, radius: 12, speed: 50, message: 'Me ajuda!', character: 'manOld' },
];

/**
 * Falas soltas entre ondas, por classe.
 *
 * Separadas por classe porque elas são a única coisa que distingue um NPC do
 * outro: a voz precisa dizer o que aquela pessoa sabe, não repetir "cuidado".
 */
const NPC_BARKS: Record<string, string[]> = {
  Cientista: [
    'Se a energia voltar, eu consigo ler o cristal.',
    'Estou contando os segundos desde o último sinal.',
    'A amostra é de 2071. Ninguém pediu isso a mim.',
  ],
  Soldado: [
    'Recarrega. Eu seguro.',
    'Se vier mais um, eu peço.',
    'Se cair, eu não te levanto. Não!',
  ],
  Civil: [
    'Eu sei atirar. Não sei mirar.',
    'Meu irmão estava no turno da noite.',
    'Fica perto de mim, por favor.',
  ],
};

/**
 * Sorteia uma fala para um NPC vivo. Chamado no fim de cada onda.
 * Se não há NPC vivo, não faz nada (a fala é detalhe, não sistema).
 */
export function npcBark(): void {
  const alive = npcs.filter(n => n.alive);
  if (alive.length === 0) return;
  const npc = alive[Math.floor(Math.random() * alive.length)];
  const falas = NPC_BARKS[npc.name] ?? NPC_BARKS.Civil;
  npc.message = falas[Math.floor(Math.random() * falas.length)];
  npc.messageTimer = 3;
}

export function spawnNPC(x: number, y: number, defIndex: number, character?: string): void {
  const def = NPC_DEFS[defIndex % NPC_DEFS.length];
  npcs.push({
    x, y,
    name: def.name,
    color: def.color,
    health: def.health,
    maxHealth: def.health,
    radius: def.radius,
    speed: def.speed,
    alive: true,
    message: def.message,
    messageTimer: 3,
    // O script de fase decide o rosto: Rogério (manBrown), Júlio (manBlue),
    // o doutor Fernando (hitman). Sem override, o def escolhe.
    character: character ?? def.character,
  });
}

/**
 * Atualiza os NPCs.
 *
 * `@param bullets` projéteis inimigos: o sobrevivente precisa levar tiro, não
 * só contato — o arqueiro do Castelo mira nele e a bala passava direto.
 */
export function updateNPCs(
  dt: number,
  playerX: number,
  playerY: number,
  enemies: { x: number; y: number; radius: number; health: number }[],
  bullets: Bullet[] = [],
): void {
  // tiro inimigo: dano por projétil, não por frame
  for (const b of bullets) {
    if (!b.isEnemy || b.life <= 0) continue;
    for (const npc of npcs) {
      if (!npc.alive) continue;
      if (!bulletHitsCircle(b, npc.x, npc.y, npc.radius + 5)) continue;
      b.life = 0;
      npc.health -= b.damage;
      if (npc.health <= 0) {
        npc.health = 0;
        npc.alive = false;
        morteDeAlvo();
      }
      break;
    }
  }

  for (const npc of npcs) {
    if (!npc.alive) continue;

    // foge do inimigo mais próximo
    let nearestDist = Infinity;
    let nx = 0, ny = 0;
    for (const e of enemies) {
      const d = Math.hypot(e.x - npc.x, e.y - npc.y);
      if (d < nearestDist) {
        nearestDist = d;
        nx = npc.x - e.x;
        ny = npc.y - e.y;
      }
    }

    const ox = npc.x;
    const oy = npc.y;
    if (nearestDist < 150) {
      const len = Math.hypot(nx, ny) || 1;
      const moved = moveCircleBy(npc.x, npc.y, (nx / len) * npc.speed * dt, (ny / len) * npc.speed * dt, npc.radius);
      npc.x = moved.x;
      npc.y = moved.y;
    } else if (npcFollow) {
      // segue o jogador de longe
      const dx = playerX - npc.x;
      const dy = playerY - npc.y;
      const d = Math.hypot(dx, dy);
      if (d > 120) {
        const moved = moveCircleBy(npc.x, npc.y, (dx / d) * npc.speed * 0.5 * dt, (dy / d) * npc.speed * 0.5 * dt, npc.radius);
        npc.x = moved.x;
        npc.y = moved.y;
      }
    }
    // escape validado igual ao bot: se o vetor direto nao andou (parede),
    // testa 4 direcoes e fica com a que mais andou em vez de moer a parede
    if (Math.hypot(npc.x - ox, npc.y - oy) < npc.speed * dt * 0.2 && (nearestDist < 150 || npcFollow)) {
      const step = npc.speed * dt * 4;
      const cands: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      let bx = npc.x;
      let by = npc.y;
      let bestDist = -1;
      for (const [cx, cy] of cands) {
        const t = moveCircleBy(npc.x, npc.y, cx * step, cy * step, npc.radius);
        const dd = Math.hypot(t.x - npc.x, t.y - npc.y);
        if (dd > bestDist) { bestDist = dd; bx = t.x; by = t.y; }
      }
      if (bestDist > 0) { npc.x = bx; npc.y = by; }
    }

    // dano por contato com inimigo
    for (const e of enemies) {
      if (e.health <= 0) continue;
      const d = Math.hypot(e.x - npc.x, e.y - npc.y);
      if (d < npc.radius + e.radius) {
        // dano por segundo, não por frame: `health -= 10` dentro do loop dava
        // 600 HP/s a 60fps e 300 a 30fps, e matava o sobrevivente em 5 frames
        npc.health -= NPC_CONTACT_DPS * dt;
        if (npc.health <= 0) {
          npc.alive = false;
          // avisa o objetivo: sem isso `deadNpc` ficava false para sempre e o
          // objetivo protect dependia só de vip.alive, que deixa de funcionar
          // quando o NPC sai da lista depois do messageTimer
          morteDeAlvo();
        }
        break;
      }
    }

    if (npc.messageTimer > 0) npc.messageTimer -= dt;
  }

  npcs = npcs.filter(n => n.alive || n.messageTimer > 0);
}

export function getNPCs(): NPC[] {
  return npcs;
}

export function resetNPCs(): void {
  npcs = [];
}
