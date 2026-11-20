/**
 * Poças de chuva. A tempestade do `environment.ts` já existe em lógica, mas
 * não deixava marca nenhuma no chão. Aqui a poça nasce, molha o passo do
 * jogador (inércia) e seca sozinha com o tempo.
 *
 * Só dados: o desenho fica no renderer, o som no audio — regra 15.
 */

export interface Puddle {
  x: number;
  y: number;
  radius: number;
  vida: number;
  /** pegada do jogador, que some antes da poça secar */
  pegada: number;
}

const poças: Puddle[] = [];
const MAX_POÇAS = 40;
const VIDA_POÇA = 14;
const VIDA_PEGADA = 3;

export function addPuddle(x: number, y: number): void {
  if (poças.length >= MAX_POÇAS) poças.shift();
  poças.push({ x, y, radius: 26 + Math.random() * 16, vida: VIDA_POÇA, pegada: 0 });
}

export function markFootstep(x: number, y: number): void {
  let perto: Puddle | undefined;
  for (const p of poças) {
    if (p.vida <= 0) continue;
    if (Math.hypot(p.x - x, p.y - y) < p.radius) { perto = p; break; }
  }
  if (perto) perto.pegada = VIDA_PEGADA;
}

/** True se o ponto está molhado — é o que deixa o movimento escorregadio. */
export function isMolhado(x: number, y: number): boolean {
  return poças.some(p => p.vida > 0 && Math.hypot(p.x - x, p.y - y) < p.radius);
}

export function updatePuddles(dt: number): void {
  for (const p of poças) {
    p.vida -= dt;
    if (p.pegada > 0) p.pegada = Math.max(0, p.pegada - dt);
  }
  for (let i = poças.length - 1; i >= 0; i--) {
    if (poças[i].vida <= 0) poças.splice(i, 1);
  }
}

export function getPuddles(): readonly Puddle[] { return poças; }
export function clearPuddles(): void { poças.length = 0; }
