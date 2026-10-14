/**
 * Sistema de save/load em localStorage.
 * Salva progresso do jogo: fase, onda, arma, upgrades, moedas, score.
 */

/** Dados salvos do jogo */
interface SaveData {
  /** Fase atual (índice) */
  phase: number;
  /** Onda atual */
  wave: number;
  /** Índice da arma equipada */
  weaponIndex: number;
  /** Moedas acumuladas */
  coins: number;
  /** Score total */
  score: number;
  /** Upgrades comprados */
  upgrades: string[];
  /** Armas compradas */
  weapons: { index: number; quality: string }[];
  /** Peças na mochila (ids de PieceType) */
  pieces: string[];
  /** Peças equipadas por arma: { índiceDaArma: [ids] } */
  equippedPieces: Record<string, string[]>;
  /** Ids de talento da árvore de progressão comprados */
  talentos: string[];
  /** XP total da partida (o nível é recalculado dele no load) */
  xp?: number;
  /**
   * A FÚRIA desbloqueada (H2): o gate de história da Fábrica viaja no save.
   * Ausente = travado (saves antigos começam travados — decisão do dono).
   */
  furia?: boolean;
  /** Nome da fase para exibição */
  phaseName: string;
  /** Timestamp do save */
  timestamp: number;
}

const SAVE_KEY = 'luiz.save';

/**
 * Salva o progresso do jogo no localStorage.
 */
export function saveGame(
  phase: number, wave: number, weaponIndex: number,
  coins: number, score: number, upgrades: string[], weapons: { index: number; quality: string }[], phaseName: string,
  pieces: string[] = [], equippedPieces: Record<string, string[]> = {}, talentos: string[] = [], xp = 0,
  furia = false
): void {
  const data: SaveData = {
    phase, wave, weaponIndex, coins, score, upgrades, weapons, phaseName,
    pieces, equippedPieces, talentos, xp, furia,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be full or unavailable
  }
}

/**
 * Carrega o progresso salvo.
 * @returns dados salvos ou null se não houver save
 */
export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

/**
 * Verifica se existe um save.
 */
export function hasSave(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Remove o save.
 */
export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // localStorage indisponível (modo privado)
  }
}

const COMPLETION_KEY = 'luiz.completed';

/**
 * Marca o jogo como completado.
 */
export function markGameCompleted(): void {
  try {
    localStorage.setItem(COMPLETION_KEY, 'true');
  } catch {}
}

/**
 * Verifica se o jogo já foi completado.
 */
export function isGameCompleted(): boolean {
  try {
    return localStorage.getItem(COMPLETION_KEY) === 'true';
  } catch {
    return false;
  }
}
