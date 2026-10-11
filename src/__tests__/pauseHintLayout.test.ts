import { describe, it, expect } from 'vitest';
import { getHintWidth, getHintLines } from '../systems/renderer';

/**
 * O rodapé de tecla da pausa transbordava o box.
 *
 * O box tem 280px e o texto era uma linha só:
 * 'W/S escolher · ENTER confirmar · ESC continuar' mede ~304px a 11px
 * monospace, ou seja, 24px fora dos dois lados. O das configurações
 * ('W/S escolher · A/D ajustar · ENTER alternar · ESC voltar') estourava 90px.
 *
 * A correção quebra o texto em linhas curtas. Este arquivo trava a largura,
 * porque a falha é invisível no código: o `fillText` centralizado só vaza
 * quando alguém rodar o jogo.
 */

/** Largura do box do pause, em renderer.ts. */
const BOX_W = 280;
/** Margem lateral deixada dentro do box (borda + respiro). */
const BOX_PADDING = 20;

describe('rodapé de tecla da pausa cabe no box', () => {
  it('a medição bate com o que o canvas faz', () => {
    // 11px monospace anda ~0.6em por caractere. Se a estimativa subestimar,
    // o texto volta a vazar e o teste passa sem ver o problema.
    expect(getHintWidth('W/S escolher', 11)).toBeGreaterThan(11 * 12 * 0.6);
    expect(getHintWidth('W/S escolher', 11)).toBeLessThan(11 * 12 * 0.6 + 8);
  });

  it('nenhuma linha devolvida passa da largura útil do box', () => {
    for (const linhas of [
      ['W/S escolher · ENTER confirmar', 'ESC continuar'],
      ['W/S escolher · A/D ajustar', 'ENTER alternar · ESC voltar'],
    ]) {
      for (const linha of getHintLines(linhas, BOX_W - BOX_PADDING)) {
        expect(
          getHintWidth(linha, 11),
          `"${linha}" mede ${getHintWidth(linha, 11)}px e o box útil é ${BOX_W - BOX_PADDING}px`,
        ).toBeLessThanOrEqual(BOX_W - BOX_PADDING);
      }
    }
  });

  it('uma linha que já cabe não é quebrada', () => {
    expect(getHintLines(['ESC voltar'])).toEqual(['ESC voltar']);
  });

  it('quebra no separador, sem partir uma instrução ao meio', () => {
    const linhas = getHintLines(['W/S escolher · ENTER confirmar · ESC voltar']);
    expect(linhas.length).toBeGreaterThan(1);
    for (const linha of linhas) {
      expect(linha.endsWith(' ·'), `"${linha}" termina no separador`).toBe(false);
    }
  });

  it('preserva todas as instruções da linha original', () => {
    const original = 'W/S escolher · ENTER confirmar · ESC voltar';
    const saida = getHintLines([original]).join(' · ');
    expect(saida).toBe(original);
  });

  it('uma instrução maior que o box inteiro não se perde', () => {
    const gigante = 'A'.repeat(400);
    const saida = getHintLines([gigante]);
    expect(saida.join('')).toBe(gigante);
  });

  it('linhas vazias não quebram o desenho', () => {
    expect(getHintLines([''])).toEqual(['']);
    expect(getHintLines([])).toEqual([]);
  });
});
