/**
 * Sistema de leaderboard local.
 * Salva e carrega high scores do modo survival.
 */

/** Entrada do leaderboard */
interface LeaderboardEntry {
  /** Nome do jogador */
  name: string;
  /** Score alcançado */
  score: number;
  /** Ondas sobrevividas */
  waves: number;
  /** Data do recorde */
  date: string;
}

const STORAGE_KEY = 'luiz.leaderboard';
const MAX_ENTRIES = 10;

/**
 * Retorna o leaderboard salvo.
 */
export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const dado = JSON.parse(raw);
    // parse válido ≠ FORMA válida: um localStorage de formato antigo ou
    // corrompido parseia (catch não pega) e devolve não-array — o .map do
    // fim de campanha explodia depois (relato do playtest 2026-10-16).
    // A fronteira é o único lugar de validação: dentro do jogo se confia.
    if (!Array.isArray(dado)) return [];
    return dado as LeaderboardEntry[];
  } catch {
    return [];
  }
}

/**
 * Adiciona uma entrada ao leaderboard.
 * @returns true se é um novo recorde
 */
export function addLeaderboardEntry(name: string, score: number, waves: number): boolean {
  const entries = getLeaderboard();
  const newEntry: LeaderboardEntry = {
    name,
    score,
    waves,
    date: new Date().toLocaleDateString('pt-BR'),
  };

  entries.push(newEntry);
  entries.sort((a, b) => b.score - a.score);
  const trimmed = entries.slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage may be full
  }

  return trimmed[0]?.score === score && trimmed[0]?.name === name;
}

