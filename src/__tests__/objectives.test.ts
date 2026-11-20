import { describe, it, expect, beforeEach } from 'vitest';
import {
  initObjective, updateObjective, peekObjective, registerObjectiveDestroyed,
  registerFuelCollected, markVipDown, cellCenter, ReachZone,
} from '../systems/objectives';
import { resetNPCs, spawnNPC, getNPCs, updateNPCs } from '../systems/npcs';
import { initProps, clearProps, getProps, damageProp } from '../systems/props';
import { PHASES } from '../config';

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
  // o protect agora lê o mundo de props (o foguete): sem zerar os dois, um
  // teste deixa um alvo morto vazando para o seguinte
  beforeEach(() => { resetNPCs(); clearProps(); });

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

  it('collect conclui quando todos os tambores são enchidos', () => {
    initObjective('collect', 4);
    expect(updateObjective(0.016, 0, 0, 3, ZONA).done).toBe(false);
    registerFuelCollected();
    registerFuelCollected();
    const meio = updateObjective(0.016, 0, 0, 3, ZONA);
    expect(meio.done).toBe(false);
    expect(meio.detail).toBe('2/4');
    expect(meio.label).toBe('ENCHER OS TAMBORES');
    registerFuelCollected();
    registerFuelCollected();
    const r = updateObjective(0.016, 0, 0, 3, ZONA);
    expect(r.done).toBe(true);
    expect(r.detail).toBe('4/4');
  });

  it('collect é leitura pura e zera entre fases', () => {
    // sem o reset no init, os tambores da Refinaria vazariam para a fase
    // seguinte e o chefe nasceria com o contador de uma fase já vencida
    initObjective('collect', 2);
    registerFuelCollected();
    expect(peekObjective(0, 0, 0, ZONA).done).toBe(false);   // 1 de 2
    registerFuelCollected();
    expect(peekObjective(0, 0, 0, ZONA).done).toBe(true);
    initObjective('collect', 2);
    expect(peekObjective(0, 0, 0, ZONA).detail).toBe('0/2');
    expect(peekObjective(0, 0, 0, ZONA).done).toBe(false);
    // e o peek não grava nada (contrato do módulo)
    peekObjective(0, 0, 0, ZONA);
    expect(peekObjective(0, 0, 0, ZONA).detail).toBe('0/2');
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
    markVipDown();
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
describe('objectives: protect com o foguete como alvo (Castelo)', () => {
  // O alvo do protect no Castelo é o foguete (`F` no mapa), decisão do dono de
  // 2026-10-12: "as ondas atacam o foguete, não uma escolta". O contrato do
  // objetivo não muda: barra = HP do alvo, conclui de pé + área limpa.
  const COM_FOGUETE = () => {
    const cells = Array.from({ length: 20 }, () => Array<string>(30).fill('.'));
    cells[10][13] = 'F';
    initProps(cells);
  };

  beforeEach(() => {
    clearProps();
    resetNPCs();
    initObjective('protect', 0);
    COM_FOGUETE();
  });

  it('o rótulo e a barra vêm do foguete, não de um NPC inexistente', () => {
    const r = peekObjective(0, 0, 3, ZONA);
    expect(r.label).toBe('PROTEGER O FOGUETE');
    expect(r.detail).toBe('300/300');
    expect(r.progress).toBe(1);
    expect(getNPCs()).toHaveLength(0);
  });

  it('a barra acompanha o HP do foguete em tempo real', () => {
    damageProp(getProps()[0], 180);
    const r = peekObjective(0, 0, 3, ZONA);
    expect(r.progress).toBeCloseTo(120 / 300);
    expect(r.detail).toBe('120/300');
    expect(r.done).toBe(false);
  });

  it('conclui com o foguete de pé, a área limpa e a luta acontecida', () => {
    updateObjective(0, 0, 0, 3, ZONA);
    expect(updateObjective(0, 0, 0, 0, ZONA).done).toBe(true);
  });

  it('o foguete caído trava a conclusão MESMO com a área limpa — e o rótulo não muda', () => {
    updateObjective(0, 0, 0, 3, ZONA);
    damageProp(getProps()[0], 9999);
    markVipDown();
    const r = peekObjective(0, 0, 0, ZONA);
    expect(r.done).toBe(false);
    expect(r.detail).toBe('PERDIDO');
    expect(r.label).toBe('PROTEGER O FOGUETE');
  });
});

describe('objectives: protect não termina antes da luta começar', () => {
  // o protect lê o mundo de props (o foguete) além do NPC: os dois zram aqui
  beforeEach(() => { resetNPCs(); clearProps(); });

  it('com a área limpa no primeiro frame, a fase NÃO encerra', () => {
    // `enemiesAlive === 0` é verdade nos 0.8s antes do primeiro spawn: sem o
    // latch a fase de protect acabava antes de aparecer inimigo nenhum.
    initObjective('protect', 0);
    spawnNPC(400, 400, 1);
    const r = peekObjective(0, 0, 0, ZONA);
    expect(r.done).toBe(false);
    // o detalhe agora é a vida do alvo — a barra do HUD é o HP em tempo real
    expect(r.detail).toBe('50/50');
    expect(r.progress).toBe(1);
  });

  it('o progresso é a vida do alvo, não 0/1 — a barra acompanha o dano', () => {
    // o relato do dono: "a barra de vida do sobrevivente não está
    // sincronizada com a do sobrevivente mesmo na fase". O progresso 0/1
    // só dizia vivo/morto; o HP dá a leitura de verdade para o jogador
    // decidir se dá para continuar na frente do sobrevivente.
    initObjective('protect', 0);
    spawnNPC(400, 400, 1);
    getNPCs()[0].health = 20;
    const r = peekObjective(0, 0, 3, ZONA);
    expect(r.progress).toBeCloseTo(0.4);
    expect(r.detail).toBe('20/50');
    expect(r.done).toBe(false);
  });

  it('conclui quando o NPC sobrevive, a área limpa e houve luta', () => {
    initObjective('protect', 0);
    spawnNPC(400, 400, 1);
    updateObjective(0, 0, 0, 3, ZONA);   // houve inimigo em campo
    expect(updateObjective(0, 0, 0, 0, ZONA).done).toBe(true);
  });

  it('o latch zera na troca de fase', () => {
    initObjective('protect', 0);
    spawnNPC(400, 400, 1);
    updateObjective(0, 0, 0, 3, ZONA);
    initObjective('protect', 0);
    spawnNPC(400, 400, 1);
    expect(peekObjective(0, 0, 0, ZONA).done).toBe(false);
  });
});

describe('npcs: o dano por contato é por segundo, não por frame', () => {
  beforeEach(() => resetNPCs());

  it('15 DPS no vip independe do frame rate', () => {
    // a 10 frames de 1/60 e a 10 frames de 1/30 o NPC perde o mesmo
    resetNPCs(); spawnNPC(400, 400, 2);   // Civil: 15 de vida
    const npc1 = getNPCs()[0];
    const alvo1 = npc1.health;
    updateNPCs(1 / 60, 0, 0, [{ x: 400, y: 400, radius: 40, health: 10 }]);

    resetNPCs(); spawnNPC(400, 400, 2);
    const npc2 = getNPCs()[0];
    const alvo2 = npc2.health;
    updateNPCs(1 / 30, 0, 0, [{ x: 400, y: 400, radius: 40, health: 10 }]);

    // O vip leva 15 DPS (o aliado pago leva 30). 15 × 1/60 = 0.25 por frame
    // contra 15 × 1/30 = 0.5: o dobro de dano no dobro de tempo. O que não
    // pode é o comportamento antigo de 10 por frame.
    const dano1 = alvo1 - npc1.health;
    const dano2 = alvo2 - npc2.health;
    expect(dano1).toBeCloseTo(0.25, 1);
    expect(dano2).toBeCloseTo(0.5, 1);
    expect(dano1).toBeLessThan(10);
  });
});

describe('objectives: o objetivo não encerra mais a fase, ele libera o chefe', () => {
  it('toda fase com objetivo != clear tem chefe para fechar a fase', () => {
    for (const fase of PHASES) {
      expect(fase.boss, `${fase.name}: objetivo ${fase.objective} sem chefe`).toBeTruthy();
    }
  });

  it('as fases que seguram o campo usam só os tipos que não chegam na zona', () => {
    // destroy/survive/protect/collect são o campo: a condição vira dentro do
    // pátio (ninhos, tempo, sobrevivente, tambores) e nenhuma consulta
    // `reachZones` — só `reach` tem zona de extração, e `clear` nem checa
    // objetivo (main.ts filtra a parte). `collect` entra aqui pela mesma
    // razão técnica: os tambores são objetos espalhados no mapa, não uma
    // zona de saída. O contrato é sobre os TIPOS usados, não a contagem.
    const tiposUsados = [...new Set(
      PHASES.filter(f => f.objective !== 'clear' && f.objective !== 'reach')
        .map(f => f.objective),
    )].sort();
    expect(tiposUsados).toEqual(['collect', 'destroy', 'protect', 'survive']);
    // e nenhum outro tipo inventado existe no jogo
    const tiposValidos = new Set(['clear', 'reach', 'destroy', 'protect', 'survive', 'collect']);
    for (const f of PHASES) expect(tiposValidos.has(f.objective)).toBe(true);
  });
});
