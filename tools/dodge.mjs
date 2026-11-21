/**
 * Direção de desvio do bot do `session.mjs`.
 *
 * Isolada em função pura e sem qualquer DOM porque ela é a parte que estava
 * ERRADA, e a tabela de `sessao-diagnostico.mjs` provou isso caso a caso:
 *
 *   inimigo em [100,0] → S   dot=0     ❌ não aumenta distância nenhuma
 *   inimigo em [70,70] → S   dot=+0.71 ❌ ANDA NA DIREÇÃO DO INIMIGO
 *
 * A versão anterior escolhia a perpendicular e apertava o eixo de maior
 * componente. Com input digital de 1 tecla isso erra nos dois sentidos: quando o
 * inimigo está no eixo, a perpendicular é o outro eixo e não foge (dot=0);
 * quando está na diagonal, o eixo escolhido pode ser exatamente na direção dele.
 *
 * A correção é o KITE: soma de "afastado" + "perpendicular", o que dá 45° e
 * `dot = cos(45°) = 0.707` para TODO ângulo — sempre afastando, nunca
 * aproximando. E a direção é expressa em até DUAS teclas porque o `movePlayer`
 * normaliza o diagonal (`movePlayer` em `entities/player.ts:107`): apertar duas
 * teclas dá velocidade cheia na diagonal, uma só dá a mesma velocidade num eixo
 * cardinal.
 */

/** Abaixo disso o componente é ruído de ponto flutuante e apertar a tecla é só jitter. */
const EPS = 0.2;

/**
 * @param {number} dx componente X do vetor jogador → inimigo
 * @param {number} dy componente Y do vetor jogador → inimigo
 * @returns {{ teclas: string[], afasta: number }} `teclas` é a direção de kite;
 *   `afasta` é o produto vetorial com "afastado do inimigo" — positivo é
 *   afastar, e é a invariante que `__tests__/dodgeBot.test.ts` trava.
 */
export function direcaoDodge(dx, dy) {
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return { teclas: ['KeyD'], afasta: 0 };

  const ax = -dx / d; // "afastado": do inimigo para o jogador
  const ay = -dy / d;
  // perpendicular de (ax, ay) em 90°
  const px = -ay;
  const py = ax;

  let mx = ax + px;
  let my = ay + py;
  const m = Math.hypot(mx, my) || 1;
  mx /= m;
  my /= m;

  const teclas = [];
  if (Math.abs(mx) > EPS) teclas.push(mx > 0 ? 'KeyD' : 'KeyA');
  if (Math.abs(my) > EPS) teclas.push(my > 0 ? 'KeyS' : 'KeyW');

  return { teclas, afasta: mx * ax + my * ay };
}

/**
 * Mesma direção, mas como `set` de teclas para o `page.keyboard` do harness.
 * Array porque a ordem é estável e o teste compara por conteúdo.
 */
export function teclasDodge(dx, dy) {
  return direcaoDodge(dx, dy).teclas;
}