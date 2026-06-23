/**
 * Utilitários matemáticos genéricos usados em todo o jogo.
 * Funções puras para cálculos de distância, números aleatórios e normalização.
 */

/**
 * Calcula a distância euclidiana entre dois pontos.
 * @param a - primeiro ponto
 * @param b - segundo ponto
 * @returns distância entre os dois pontos
 */
export function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Gera um número aleatório uniforme entre min e max.
 * @param - limite inferior (inclusivo)
 * @param max - limite superior (inclusivo)
 * @returns número aleatório no intervalo [min, max]
 */
export function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Normaliza um vetor para comprimento unitário.
 * Se o vetor for zero, retorna {x: 1, y: 1} para evitar divisão por zero.
 * @param v - vetor a ser normalizado
 * @returns vetor unitário na mesma direção
 */
export function normalize(v: { x: number; y: number }): { x: number; y: number } {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}
