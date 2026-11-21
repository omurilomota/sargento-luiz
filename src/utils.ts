/**
 * Utilitários matemáticos genéricos usados em todo o jogo.
 * Funções puras para cálculos de distância, números aleatórios e normalização.
 */

/**
 * Calcula a distância euclidiana entre dois pontos.
 */
export function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Gera um número aleatório uniforme entre min e max.
 * @param max - limite superior (inclusivo)
 * @returns número aleatório no intervalo [min, max]
 */
export function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Normaliza um vetor para comprimento unitário.
 * Se o vetor for zero, retorna {x: 1, y: 1} para evitar divisão por zero.
 */
export function normalize(v: { x: number; y: number }): { x: number; y: number } {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}
