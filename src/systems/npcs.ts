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
}

import { markVipDown } from './objectives';
import { moveCircleBy } from './tilemap';

let npcFollow = true;

export function toggleNpcFollow(): boolean {
  npcFollow = !npcFollow;
  return npcFollow;
}

export function isNpcFollowing(): boolean {
  return npcFollow;
}

/** Dano por segundo do NPC enquanto um inimigo encosta nele. */
const NPC_CONTACT_DPS = 30;

let npcs: NPC[] = [];

const NPC_DEFS = [
  { name: 'Cientista', color: '#608090', health: 30, radius: 14, speed: 60, message: 'Encontrei uma cura...' },
  { name: 'Soldado', color: '#7a9a6a', health: 50, radius: 16, speed: 70, message: 'Vou te cobrir!' },
  { name: 'Civil', color: '#a08050', health: 15, radius: 12, speed: 50, message: 'Me ajuda!' },
];

/** Falas curtas soltas entre ondas — o NPC não é decoração muda. */
const NPC_BARKS = [
  'Ouviu isso também?',
  'Não gosto desse silêncio.',
  'Recarrega, eu seguro.',
  'Fica perto de mim.',
  'Aquele barulho vem do subsolo.',
  'Já faz dias que não durmo.',
  'Se cair, eu não te levanto. Não!',
  'Aquele último quase me pegou.',
  'Ainda tem mais vindo.',
  'Cheiro de fumaça... de novo.',
];

/**
 * Sorteia uma fala para um NPC vivo. Chamado no fim de cada onda.
 * Se não há NPC vivo, não faz nada (a fala é detalhe, não sistema).
 */
export function npcBark(): void {
  const alive = npcs.filter(n => n.alive);
  if (alive.length === 0) return;
  const npc = alive[Math.floor(Math.random() * alive.length)];
  npc.message = NPC_BARKS[Math.floor(Math.random() * NPC_BARKS.length)];
  npc.messageTimer = 3;
}

export function spawnNPC(x: number, y: number, defIndex: number): void {
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
  });
}

export function updateNPCs(dt: number, playerX: number, playerY: number, enemies: { x: number; y: number; radius: number; health: number }[]): void {
  for (const npc of npcs) {
    if (!npc.alive) continue;

    // Flee from nearest enemy
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
      // Follow player loosely
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

    // Enemy collision damage
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
          markVipDown();
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
