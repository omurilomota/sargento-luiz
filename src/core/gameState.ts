/**
 * Gerenciamento de estado do jogo.
 * Mantém um estado global simples (menu, jogando, loja, game over)
 * acessível por qualquer módulo.
 */

/** Estados possíveis do ciclo de vida do jogo */
export type GameState = 'menu' | 'playing' | 'shop' | 'gameover';

/** Estado atual do jogo */
let state: GameState = 'menu';

/**
 * Retorna o estado atual do jogo.
 * @returns o estado corrente
 */
export function getState(): GameState {
  return state;
}

/**
 * Define o estado do jogo.
 * @param newState - novo estado a ser aplicado
 */
export function setState(newState: GameState): void {
  state = newState;
}
