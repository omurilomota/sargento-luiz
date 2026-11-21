/**
 * Portão do dodge do bot (`tools/dodge.mjs`).
 *
 * Existe porque o dodge estava ERRADO e nada pegou: o `tsc` passa, o harness
 * antigo rodava sem reclamar, e a tabela do `sessao-diagnostico.mjs` mostrou
 * que em 6 das 8 posições testadas a tecla escolhida não afastava — em 2 delas
 * andava na direção do inimigo.
 *
 * A regra é uma frase: **para TODO ângulo, a direção escolhida aumenta a
 * distância para o inimigo**. Se amanhã alguém "simplificar" a soma de vetores
 * voltando a pegar a perpendicular pura, esta trava acusa.
 */
import { describe, it, expect } from 'vitest';
import { direcaoDodge } from '../../tools/dodge.mjs';

/** Vetor unitário das teclas escolhidas, como o `movePlayer` interpreta. */
function vetorDasTeclas(teclas: string[]): [number, number] {
  let dx = 0;
  let dy = 0;
  if (teclas.includes('KeyA')) dx -= 1;
  if (teclas.includes('KeyD')) dx += 1;
  if (teclas.includes('KeyW')) dy -= 1;
  if (teclas.includes('KeyS')) dy += 1;
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
}

describe('direcaoDodge', () => {
  it('aumenta a distância para o inimigo em todos os 360 graus', () => {
    const falha: string[] = [];
    for (let grau = 0; grau < 360; grau++) {
      const rad = (grau * Math.PI) / 180;
      const dx = Math.cos(rad) * 200;
      const dy = Math.sin(rad) * 200;
      const { teclas, afasta } = direcaoDodge(dx, dy);
      if (afasta <= 0) falha.push(`${grau}° dot=${afasta.toFixed(3)} teclas=${teclas.join('+')}`);
    }
    expect(falha).toEqual([]);
  });

  it('o que o jogo realmente moveria também afasta (teclas, não vetor ideal)', () => {
    // A invariante acima usa o vetor ideal de kite. Esta usa o que o
    // `movePlayer` faz com as teclas: normaliza o que apertar. É aqui que a
    // versão anterior falhava — o vetor era bom, a tecla é que não.
    const falha: string[] = [];
    for (let grau = 0; grau < 360; grau++) {
      const rad = (grau * Math.PI) / 180;
      const dx = Math.cos(rad) * 200;
      const dy = Math.sin(rad) * 200;
      const teclas = direcaoDodge(dx, dy).teclas;
      const [mx, my] = vetorDasTeclas(teclas);
      const d = Math.hypot(dx, dy);
      const dot = (mx * -dx + my * -dy) / d;
      if (dot <= 0) falha.push(`${grau}° dot=${dot.toFixed(3)} teclas=${teclas.join('+')}`);
    }
    expect(falha).toEqual([]);
  });

  it('inimigo nos 4 eixos cardeais: afasta e usa duas teclas', () => {
    // Os 4 casos em que a perpendicular pura daria dot=0 exato.
    for (const [dx, dy] of [[200, 0], [-200, 0], [0, 200], [0, -200]] as const) {
      const { teclas, afasta } = direcaoDodge(dx, dy);
      expect(afasta).toBeGreaterThan(0.5);
      expect(teclas.length, `inimigo em [${dx},${dy}]`).toBe(2);
    }
  });

  it('inimigo na diagonal não vira tecla na direção dele', () => {
    // Os 2 casos em que a versão anterior apertava a tecla ERRADA com dot=+0.71.
    for (const [dx, dy] of [[70, 70], [-70, -70]] as const) {
      const { afasta } = direcaoDodge(dx, dy);
      expect(afasta, `inimigo em [${dx},${dy}]`).toBeGreaterThan(0);
    }
  });

  it('inimigo em cima do jogador não gera NaN nem tecla nenhuma', () => {
    const { teclas } = direcaoDodge(0, 0);
    expect(teclas.length).toBeGreaterThan(0);
    expect(teclas.every((t: string) => t.startsWith('Key'))).toBe(true);
    const perto = direcaoDodge(1e-9, -1e-9);
    expect(perto.teclas.length).toBeGreaterThan(0);
  });

  it('nunca aperta dois eixos opostos ao mesmo tempo', () => {
    for (let grau = 0; grau < 360; grau += 7) {
      const rad = (grau * Math.PI) / 180;
      const { teclas } = direcaoDodge(Math.cos(rad) * 300, Math.sin(rad) * 300);
      expect(teclas.includes('KeyA') && teclas.includes('KeyD')).toBe(false);
      expect(teclas.includes('KeyW') && teclas.includes('KeyS')).toBe(false);
    }
  });

  it('só usa teclas que o jogo lê', () => {
    const Lidas = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);
    for (let grau = 0; grau < 360; grau += 3) {
      const rad = (grau * Math.PI) / 180;
      for (const t of direcaoDodge(Math.cos(rad), Math.sin(rad)).teclas) {
        expect(Lidas.has(t as string)).toBe(true);
      }
    }
  });
});