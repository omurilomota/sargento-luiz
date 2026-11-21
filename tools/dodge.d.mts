/**
 * Tipos de `tools/dodge.mjs` para o `tsc` do build.
 *
 * O arquivo é `.mjs` de propósito — é harness, não jogo, e não entra no
 * `tsconfig` de `src`. Mas `dodgeBot.test.ts` é TypeScript e o build roda
 * `tsc` sobre `src/__tests__`, então a assinatura precisa existir em algum
 * lugar. Declarar aqui é melhor que `allowJs`: o `checkJs` ligaria a checagem
 * de todo o `tools/` e passaria a acusar os outros 8 harnesses.
 */
export interface ResultadoDodge {
  /** Teclas a apertar, em ordem estável. Até duas: o diagonal usa duas. */
  teclas: string[];
  /** Produto vetorial com "afastado do inimigo". Positivo = afasta. */
  afasta: number;
}

export function direcaoDodge(dx: number, dy: number): ResultadoDodge;
export function teclasDodge(dx: number, dy: number): string[];