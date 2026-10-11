/**
 * src/systems/gameModes.ts
 *
 * Os 4 modos reais. Cada um precisa ter regra própria ligada em `main.ts` —
 * um modo no menu sem efeito é pior que um modo a menos.
 */

/** Tipos de modo de jogo */
export type GameMode = 'campaign' | 'competitive' | 'local' | 'hardcore';

/** Ordem de exibição no menu */
export const GAME_MODES: { key: string; mode: GameMode; name: string; desc: string; color: string }[] = [
  { key: '1', mode: 'campaign', name: 'CAMPANHA', desc: 'História com cutscenes', color: '#7a9a6a' },
  { key: '2', mode: 'competitive', name: 'COMPETITIVO', desc: 'Contra bots de IA', color: '#608090' },
  { key: '3', mode: 'local', name: 'LOCAL 2P', desc: 'Mesmo teclado', color: '#b07050' },
  { key: '4', mode: 'hardcore', name: 'HARDCORE', desc: 'Sem loja, sem cura', color: '#8b4040' },
];

/** Estado do modo atual */
let currentMode: GameMode = 'campaign';

export function getCurrentMode(): GameMode {
  return currentMode;
}

export function setGameMode(mode: GameMode): void {
  currentMode = mode;
}

/** Modo hardcores ativa? Usado por player.ts para cortar cura e loja. */
export function getHardcore(): boolean {
  return currentMode === 'hardcore';
}
