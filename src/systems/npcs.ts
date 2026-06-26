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

let npcs: NPC[] = [];

const NPC_DEFS = [
  { name: 'Cientista', color: '#608090', health: 30, radius: 14, speed: 60, message: 'Encontrei uma cura...' },
  { name: 'Soldado', color: '#7a9a6a', health: 50, radius: 16, speed: 70, message: 'Vou te cobrir!' },
  { name: 'Civil', color: '#a08050', health: 15, radius: 12, speed: 50, message: 'Me ajuda!' },
];

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

    if (nearestDist < 150) {
      const len = Math.hypot(nx, ny) || 1;
      npc.x += (nx / len) * npc.speed * dt;
      npc.y += (ny / len) * npc.speed * dt;
    } else {
      // Follow player loosely
      const dx = playerX - npc.x;
      const dy = playerY - npc.y;
      const d = Math.hypot(dx, dy);
      if (d > 120) {
        npc.x += (dx / d) * npc.speed * 0.5 * dt;
        npc.y += (dy / d) * npc.speed * 0.5 * dt;
      }
    }

    // Enemy collision damage
    for (const e of enemies) {
      if (e.health <= 0) continue;
      const d = Math.hypot(e.x - npc.x, e.y - npc.y);
      if (d < npc.radius + e.radius) {
        npc.health -= 10;
        if (npc.health <= 0) {
          npc.alive = false;
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
