import { describe, it, expect, beforeEach } from 'vitest';
import {
  initObjective, updateObjective, peekObjective, registerObjectiveDestroyed,
  registerVipDown, cellCenter, ReachZone,
} from '../systems/objectives';
import { resetNPCs, spawnNPC } from '../systems/npcs';

const ZONA: ReachZone[] = [{ x: 500, y: 500, radius: 60 }];

describe('objectives: peekObjective é leitura pura', () => {
  beforeEach(() => {
    resetNPCs();
    initObjective('clear', 0);
  });

  it('não avança o relógio do survive', () => {
    initObjective('survive', 10);
    for (let i = 0; i < 60; i++) peekObjective(0, 0, 0, ZONA);
    expect(peekObjective(0, 0, 0, ZONA).detail).toBe('10s');
    // só o update avança
    updateObjective(2, 0, 0, 0, ZONA);
    expect(peekObjective(0, 0, 0, ZONA).detail).toBe('8s');
  });

  it('peek não latcheia a conclusão: peek não grava o que viu', () => {
    initObjective('reach', 0);
    // peek reporta o que está vendo ao vivo, mas não grava: sair da zona volta
    // a "em trânsito". Se gravasse, um frame de draw com o jogador na borda da
    // zona concluiria a fase para sempre.
    expect(peekObjective(500, 500, 0, ZONA).done).toBe(true);
    expect(peekObjective(0, 0, 0, ZONA).done).toBe(false);
    expect(peekObjective(0, 0, 0, ZONA).detail).toBe('EM TRÂNSITO');
    // o update grava de verdade
    expect(updateObjective(0, 500, 500, 0, ZONA).done).toBe(true);
    expect(peekObjective(0, 0, 0, ZONA).detail).toBe('CHEGOU');
  });

  it('devolve o mesmo rótulo e detalhe que o update', () => {
    initObjective('destroy', 3);
    registerObjectiveDestroyed();
    const peek = peekObjective(0, 0, 5, ZONA);
    const upd = updateObjective(1 / 60, 0, 0, 5, ZONA);
    expect(peek.label).toBe(upd.label);
    expect(peek.detail).toBe(upd.detail);
    expect(peek.done).toBe(upd.done);
  });
});

describe('objectives: cada tipo sabe quando termina', () => {
  beforeEach(() => resetNPCs());

  it('survive conclui quando o tempo bate o alvo', () => {
    initObjective('survive', 5);
    expect(updateObjective(4, 0, 0, 3, ZONA).done).toBe(false);
    expect(updateObjective(1.5, 0, 0, 3, ZONA).done).toBe(true);
  });

  it('destroy conclui quando os ninhos caem', () => {
    initObjective('destroy', 2);
    expect(updateObjective(0.016, 0, 0, 3, ZONA).done).toBe(false);
    registerObjectiveDestroyed();
    registerObjectiveDestroyed();
    const r = updateObjective(0.016, 0, 0, 3, ZONA);
    expect(r.done).toBe(true);
    expect(r.detail).toBe('2/2');
  });

  it('reach conclui ao entrar na zona e só uma vez', () => {
    initObjective('reach', 0);
    expect(updateObjective(0, 0, 0, 0, ZONA).done).toBe(false);
    expect(updateObjective(0, 520, 480, 0, ZONA).done).toBe(true);
    expect(updateObjective(0, 0, 0, 0, ZONA).detail).toBe('CHEGOU');
  });

  it('protect conclui com o NPC vivo E a área limpa', () => {
    initObjective('protect', 0);
    spawnNPC(400, 400, 0);
    // NPC vivo mas inimigos em campo: ainda não é o fim da fase
    expect(updateObjective(0, 0, 0, 4, ZONA).done).toBe(false);
    expect(updateObjective(0, 0, 0, 0, ZONA).done).toBe(true);
  });

  it('protect NÃO conclui com o NPC morto, mesmo com a área limpa', () => {
    initObjective('protect', 0);
    spawnNPC(400, 400, 0);
    registerVipDown();
    const r = updateObjective(0, 0, 0, 0, ZONA);
    expect(r.done).toBe(false);
    expect(r.detail).toBe('PERDIDO');
  });

  it('clear nunca se auto-conclui: o fim da fase é da lógica de ondas', () => {
    initObjective('clear', 0);
    const r = updateObjective(0, 0, 0, 0, ZONA);
    expect(r.progress).toBe(1);
    expect(r.done).toBe(false);
  });
});

describe('objectives: initObjective zera o estado do objetivo anterior', () => {
  it('trocar de fase não herda progresso', () => {
    initObjective('survive', 30);
    updateObjective(10, 0, 0, 0, ZONA);
    initObjective('destroy', 3);
    expect(peekObjective(0, 0, 0, ZONA).detail).toBe('0/3');
    initObjective('reach', 0);
    expect(peekObjective(0, 0, 0, ZONA).detail).toBe('EM TRÂNSITO');
  });
});

describe('objectives: cellCenter', () => {
  it('devolve o centro da célula, não o canto', () => {
    expect(cellCenter(0, 0)).toEqual({ x: 32, y: 32 });
    expect(cellCenter(15, 22)).toEqual({ x: 992, y: 1440 });
  });
});