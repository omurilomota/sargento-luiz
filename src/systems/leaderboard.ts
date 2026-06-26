const STORAGE_KEY = 'bubbleShooter_leaderboard';
const MAX_ENTRIES = 5;

export interface LeaderboardEntry {
  score: number;
  kills: number;
  phase: string;
  mode: string;
  date: string;
}

let cachedEntries: LeaderboardEntry[] = [];

function loadEntries(): LeaderboardEntry[] {
  if (cachedEntries.length > 0 || localStorage.getItem(STORAGE_KEY) === null) return cachedEntries;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cachedEntries = raw ? JSON.parse(raw) : [];
  } catch {
    cachedEntries = [];
  }
  return cachedEntries;
}

function saveEntries(entries: LeaderboardEntry[]): void {
  cachedEntries = entries;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function submitScore(score: number, kills: number, phase: string, mode: string): boolean {
  const entries = loadEntries();
  const entry: LeaderboardEntry = {
    score,
    kills,
    phase,
    mode,
    date: new Date().toLocaleDateString('pt-BR'),
  };
  entries.push(entry);
  entries.sort((a, b) => b.score - a.score);
  const trimmed = entries.slice(0, MAX_ENTRIES);
  saveEntries(trimmed);
  return trimmed[0]?.score === score;
}

export function getLeaderboard(): LeaderboardEntry[] {
  return loadEntries().slice(0, MAX_ENTRIES);
}

export function isHighScore(score: number): boolean {
  const entries = loadEntries();
  if (entries.length < MAX_ENTRIES) return true;
  return score > entries[entries.length - 1].score;
}

export function clearLeaderboard(): void {
  cachedEntries = [];
  localStorage.removeItem(STORAGE_KEY);
}
