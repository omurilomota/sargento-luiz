import { describe, it, expect, beforeEach } from 'vitest';
import { rollDiaryEvent, getDiaryEvents } from '../systems/diary';

describe('eventos aleatórios do diário', () => {
  it('sorteia um evento novo de cada vez e esgota sem repetir', () => {
    const vistos: string[] = [];
    // rand determinístico: sempre devolve 0 → pega o primeiro que resta.
    // Sem reinjeção, um rand real poderia repetir e o teste viraria loteria.
    for (let i = 0; i < 8; i++) {
      const e = rollDiaryEvent(() => 0);
      if (e) vistos.push(e.event);
    }
    const aleatorios = vistos.filter((v) => v.startsWith('evt_'));
    // os 4 eventos aleatórios saem, e nenhum repete (o set não deixa).
    expect(new Set(aleatorios).size).toBe(aleatorios.length);
    expect(aleatorios).toContain('evt_resgate');
    expect(aleatorios).toContain('evt_casa');
    expect(aleatorios).toContain('evt_sorte');
    expect(aleatorios).toContain('evt_azar');
  });

  it('devolve null quando todos os eventos aleatórios já saíram', () => {
    for (let i = 0; i < 8; i++) rollDiaryEvent(() => 0);
    // nesta altura só sobraria null: toda entrada foi desbloqueada
    expect(rollDiaryEvent(() => 0)).toBeNull();
  });

  it('os eventos aleatórios estão entre os eventos do diário', () => {
    const eventos = getDiaryEvents();
    for (const e of ['evt_resgate', 'evt_casa', 'evt_sorte', 'evt_azar']) {
      expect(eventos).toContain(e);
    }
  });
});
