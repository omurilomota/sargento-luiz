/**
 * src/systems/gameModes.ts
 *
 * Só existem 4 modos de verdade. Antes o menu oferecia 7 e três deles eram
 * mentira: `survival`, `missions` e `bossrush` não tinham uma única função
 * ligada — `startMission`/`updateMission`/`getMissionProgress` nunca eram
 * chamadas, e o objetivo por fase do Sprint 2 passou a cobrir esse papel.
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

/** Retorna o modo atual. */
export function getCurrentMode(): GameMode {
  return currentMode;
}

/** Define o modo de jogo. */
export function setGameMode(mode: GameMode): void {
  currentMode = mode;
}

/** Modo hardcores ativa? Usado por player.ts para cortar cura e loja. */
export function getHardcore(): boolean {
  return currentMode === 'hardcore';
}
