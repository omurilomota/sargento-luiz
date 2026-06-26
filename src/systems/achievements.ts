const STORAGE_KEY = 'bubbleShooter_achievements';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const DEFINITIONS: Achievement[] = [
  { id: 'first_kill', name: 'Primeiro Abate', description: 'Derrote seu primeiro inimigo', icon: '💀' },
  { id: 'kill_50', name: 'Matador', description: 'Derrote 50 inimigos em uma partida', icon: '⚔️' },
  { id: 'kill_100', name: 'Caçador', description: 'Derrote 100 inimigos em uma partida', icon: '🗡️' },
  { id: 'wave_5', name: 'Sobrevivente', description: 'Alcance a onda 5', icon: '🛡️' },
  { id: 'wave_10', name: 'Veterano', description: 'Alcance a onda 10', icon: '🏅' },
  { id: 'wave_20', name: 'Lenda', description: 'Alcance a onda 20', icon: '👑' },
  { id: 'score_5000', name: 'Pontuador', description: 'Alcance 5000 pontos', icon: '⭐' },
  { id: 'score_20000', name: 'Mestre', description: 'Alcance 20000 pontos', icon: '🌟' },
  { id: 'combo_10', name: 'Em Combos', description: 'Alcance combo x10', icon: '🔥' },
  { id: 'combo_25', name: 'Imparável', description: 'Alcance combo x25', icon: '💥' },
  { id: 'no_damage_wave', name: 'Intocável', description: 'Complete uma onda sem tomar dano', icon: '✨' },
  { id: 'all_phases', name: 'Finalizador', description: 'Complete todas as 7 fases', icon: '🏆' },
  { id: 'secret_ending', name: 'Lenda Suprema', description: 'Complete o jogo sem morrer', icon: '👑' },
];

let unlocked: Set<string> = new Set();
let unlockQueue: Achievement[] = [];
let currentToast: { achievement: Achievement; timer: number } | null = null;
const TOAST_DURATION = 3;
let hasDiedThisRun = false;

function loadUnlocked(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      unlocked = new Set(JSON.parse(raw));
    }
  } catch {
    unlocked = new Set();
  }
}

function saveUnlocked(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]));
}

export function initAchievements(): void {
  loadUnlocked();
  hasDiedThisRun = false;
}

export function markDeath(): void {
  hasDiedThisRun = true;
}

export function checkSecretEnding(): void {
  if (!hasDiedThisRun) {
    unlock('secret_ending');
  }
}

export function unlock(id: string): boolean {
  if (unlocked.has(id)) return false;
  unlocked.add(id);
  saveUnlocked();
  const def = DEFINITIONS.find(a => a.id === id);
  if (def) unlockQueue.push(def);
  return true;
}

export function updateAchievementToast(dt: number): void {
  if (currentToast) {
    currentToast.timer -= dt;
    if (currentToast.timer <= 0) currentToast = null;
  }
  if (!currentToast && unlockQueue.length > 0) {
    currentToast = { achievement: unlockQueue.shift()!, timer: TOAST_DURATION };
  }
}

export function getCurrentToast(): { achievement: Achievement; timer: number } | null {
  return currentToast;
}

export function isUnlocked(id: string): boolean {
  return unlocked.has(id);
}

export function getAllAchievements(): (Achievement & { unlocked: boolean })[] {
  return DEFINITIONS.map(a => ({ ...a, unlocked: unlocked.has(a.id) }));
}
