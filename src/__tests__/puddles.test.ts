import { describe, it, expect, beforeEach } from 'vitest';
import {
  addPuddle, markFootstep, isMolhado, updatePuddles, getPuddles, clearPuddles,
} from '../systems/puddles';

describe('chuva: poças molham o chão e secam', () => {
  beforeEach(() => clearPuddles());

  it('uma poça deixa o ponto molhado', () => {
    addPuddle(500, 300);
    expect(isMolhado(500, 300)).toBe(true);
    expect(isMolhado(900, 300)).toBe(false);
  });

  it('a poça seca e deixa de molhar', () => {
    addPuddle(500, 300);
    updatePuddles(15);
    expect(isMolhado(500, 300)).toBe(false);
    expect(getPuddles()).toHaveLength(0);
  });

  it('a pegada some antes da poça secar', () => {
    addPuddle(500, 300);
    markFootstep(500, 300);
    expect(getPuddles()[0].pegada).toBeGreaterThan(0);
    updatePuddles(4);
    expect(getPuddles()[0].pegada).toBe(0);
    expect(isMolhado(500, 300)).toBe(true);
  });
});
