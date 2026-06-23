export type GameState = 'menu' | 'playing' | 'shop' | 'gameover';

let state: GameState = 'menu';

export function getState(): GameState {
  return state;
}

export function setState(newState: GameState): void {
  state = newState;
}
