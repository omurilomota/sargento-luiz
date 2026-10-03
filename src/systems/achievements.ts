/**
 * Sistema de achievements/badges.
 * Desbloqueia conquistas baseado em ações do jogador.
 */

/** Definição de um achievement */
interface Achievement {
  /** ID único */
  id: string;
  /** Nome exibido */
  name: string;
  /** Descrição */
  desc: string;
  /** Se foi desbloqueado */
  unlocked: boolean;
}

/** Lista de achievements */
const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_kill', name: 'Primeiro Abate', desc: 'Mate seu primeiro inimigo', unlocked: false },
  { id: 'wave_5', name: 'Sobrevivente', desc: 'Alcance a onda 5', unlocked: false },
  { id: 'wave_10', name: 'Veterano', desc: 'Alcance a onda 10', unlocked: false },
  { id: 'wave_20', name: 'Lenda', desc: 'Alcance a onda 20', unlocked: false },
  { id: 'kill_100', name: 'Matador', desc: 'Mate 100 inimigos em uma partida', unlocked: false },
  { id: 'kill_500', name: 'Exterminador', desc: 'Mate 500 inimigos em uma partida', unlocked: false },
  { id: 'score_5000', name: 'Rico', desc: 'Alcance 5000 pontos', unlocked: false },
  { id: 'score_20000', name: 'Milionario', desc: 'Alcance 20000 pontos', unlocked: false },
  { id: 'no_damage_wave', name: 'Intocavel', desc: 'Complete uma onda sem tomar dano', unlocked: false },
  { id: 'boss_kill', name: 'Caçador de Chefes', desc: 'Derrote seu primeiro boss', unlocked: false },
  { id: 'all_weapons', name: 'Colecionador', desc: 'Compre todas as armas', unlocked: false },
  { id: 'combo_10', name: 'Em Combinação', desc: 'Alcance combo x10', unlocked: false },
  { id: 'combo_25', name: 'Imparável', desc: 'Alcance combo x25', unlocked: false },
];

const STORAGE_KEY = 'bubbleShooter_achievements';

/** Contadores temporários da partida */
let killsThisRun = 0;
let waveDamageTaken = false;

/**
 * Carrega achievements salvos.
 */
export function loadAchievements(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as string[];
      for (const a of ACHIEVEMENTS) {
        a.unlocked = saved.includes(a.id);
      }
    }
  } catch {}
}

/**
 * Salva achievements no localStorage.
 */
function saveAchievements(): void {
  try {
    const ids = ACHIEVEMENTS.filter(a => a.unlocked).map(a => a.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

/**
 * Verifica e desbloqueia achievements.
 * Chamar a cada evento relevante.
 */
export function checkAchievements(event: string, value?: number): { id: string; name: string } | null {
  const unlock = (id: string): { id: string; name: string } | null => {
    const a = ACHIEVEMENTS.find(a => a.id === id);
    if (a && !a.unlocked) {
      a.unlocked = true;
      saveAchievements();
      return { id: a.id, name: a.name };
    }
    return null;
  };

  switch (event) {
    case 'kill':
      killsThisRun++;
      if (killsThisRun >= 100) unlock('kill_100');
      if (killsThisRun >= 500) unlock('kill_500');
      if (killsThisRun === 1) return unlock('first_kill');
      break;
    case 'wave':
      if (value && value >= 5) unlock('wave_5');
      if (value && value >= 10) unlock('wave_10');
      if (value && value >= 20) unlock('wave_20');
      if (!waveDamageTaken) {
        const result = unlock('no_damage_wave');
        waveDamageTaken = false;
        return result;
      }
      break;
    case 'damage_taken':
      waveDamageTaken = true;
      break;
    case 'score':
      if (value && value >= 5000) unlock('score_5000');
      if (value && value >= 20000) unlock('score_20000');
      break;
    case 'boss_kill':
      return unlock('boss_kill');
    case 'combo':
      if (value && value >= 10) unlock('combo_10');
      if (value && value >= 25) unlock('combo_25');
      break;
  }
  return null;
}

/**
 * Reseta contadores da partida.
 */
export function resetRunCounters(): void {
  killsThisRun = 0;
  waveDamageTaken = false;
}

/**
 * Retorna todos os achievements.
 */
export function getAllAchievements(): Achievement[] {
  return ACHIEVEMENTS;
}
