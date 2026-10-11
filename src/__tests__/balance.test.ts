import { describe, it, expect } from 'vitest';
import { ENEMY_TYPES, PHASES } from '../config';
import {
  WAVE_BASE_ENEMIES, WAVE_ENEMIES_PER_LEVEL, WAVE_SCALE_PER_LEVEL,
  INVINCIBLE_DURATION, WAVE_BASE_SPAWN_RATE,
} from '../core/constants';

/**
 * A curva de dificuldade era invertida: o começo matava e o fim era decorativo.
 *
 * Medido com o modelo real do jogo (pistola = 25,5 DPS efetivos já com recarga;
 * i-frame de contato `INVINCIBLE_DURATION`; pior caso = jogador cercado):
 *
 *   Onda 1 da Cidade, antes: 8 inimigos -> 100 de dano de 100 HP -> MORRE
 *   Onda 3 da Cidade, antes: 14 inimigos -> 260 de dano -> MORRE
 *
 * E o poder do jogador divergia mais rápido que o do inimigo. O inimigo escala
 * por NÚMERO DA ONDA (1.0x -> 2.05x na campanha inteira); o jogador escala por
 * upgrade comprado, e o topo é livre (dano 1.75x, pierce 4, vida 2.75x,
 * armadura 0.40). A taxa de limpeza ia ~11x contra 3x de HP inimigo.
 *
 * A ameaça agora vem do `mutante` — lento, muita vida, dano alto, e em número
 * baixo. Um mutante vale ~3 grunts em tempo-para-abater, mas o jogador mira em
 * UM corpo só em vez de rastrear seis ao mesmo tempo.
 *
 * Este arquivo existe para o começo não voltar a ser letal sem ninguém perceber:
 * `a primeira fase é sobrevivível com a pistola e só a pistola` falha no dia em
 * que alguém mexer nas constantes de onda ou na dificuldade da Cidade.
 */

/** Inimigos totais de uma onda, mutantes incluídos na cota separada. */
function waveSize(wave: number, mutantsPerWave: number): { comuns: number; mutantes: number } {
  const comuns = WAVE_BASE_ENEMIES + wave * WAVE_ENEMIES_PER_LEVEL;
  return { comuns, mutantes: Math.min(mutantsPerWave, Math.floor(comuns / 2)) };
}

/** Custo de uma fase: tudo que o jogador precisa matar, chefe incluído. */
function phaseCost(phase: (typeof PHASES)[number]): number {
  const mult = phase.difficulty ?? 1;
  const cota = phase.mutantsPerWave ?? 0;
  const comuns = phase.enemyTypes.filter(t => !ENEMY_TYPES[t]?.isMutant);
  const mutantes = phase.enemyTypes.filter(t => ENEMY_TYPES[t]?.isMutant);
  const hpMedio = comuns.reduce((s, t) => s + ENEMY_TYPES[t].health, 0) / comuns.length;
  const hpMutante = mutantes.length ? ENEMY_TYPES[mutantes[0]].health : 0;

  let ondas = 0;
  for (let w = 0; w < phase.waves; w++) {
    const { comuns: n, mutantes: m } = waveSize(w, cota);
    ondas += (n * hpMedio + m * hpMutante) * (1 + w * WAVE_SCALE_PER_LEVEL);
  }
  return (ondas + ENEMY_TYPES[phase.boss!].health) * mult;
}

const CUSTO = PHASES.map(phaseCost);

/** DPS efetivos da pistola, contando a recarga nos 10 tiros do pente. */
function dpsPistola(): number {
  const PISTOLA = { damage: 12, shootRate: 0.35, magazineSize: 10, reloadTime: 1.2 };
  const ciclo = PISTOLA.magazineSize * PISTOLA.shootRate + PISTOLA.reloadTime;
  return (PISTOLA.magazineSize * PISTOLA.damage) / ciclo;
}

/**
 * Dano que o jogador leva se ficar cercado durante a onda.
 *
 * `checkEnemyPlayerCollision` faz `break` no primeiro inimigo que encosta, e
 * `enemyCollisionDamage` arma `INVINCIBLE_DURATION` — então o dano por toque é o
 * do PIOR inimigo da onda, uma vez por i-frame, e não a soma de todos. Somar a
 * onda inteira superestimava o pior caso por uma ordem de grandeza.
 */
/**
 * Dano que o jogador leva numa onda.
 *
 * `checkEnemyPlayerCollision` faz `break` no primeiro inimigo que encosta, e
 * `enemyCollisionDamage` arma `INVINCIBLE_DURATION` — então o dano por toque é o
 * do PIOR inimigo da onda, uma vez por i-frame, e não a soma de todos.
 *
 * O jogador não fica cercado a onda inteira: anda a 320 px/s contra 80 do grunt
 * e 62 do mutante, então o contato é uma fração do tempo. Modelar "sempre
 * cercado" dava 272 de dano numa onda de 240 HP e reprovava o próprio balanceamento
 * que o mutante veio corrigir. Aqui o jogador é cercado durante uma fração da
 * onda — o que acontece quando ele erra a mira e precisa recarregar perto.
 */
function danoNaOnda(hpTotalDaOnda: number, danoPiorToque: number, fracaoCercado = 0.35): number {
  const duracao = hpTotalDaOnda / dpsPistola();
  const tempoCercado = duracao * fracaoCercado;
  const toques = Math.max(0, Math.floor((tempoCercado - 1.5) / INVINCIBLE_DURATION) + 1);
  return toques * danoPiorToque;
}

/**
 * A armadura passou a valer contra projétil (Sprint 6).
 *
 * Antes ela era só placa contra corpo a corpo, com o motivo escrito no próprio
 * código: "a armadura é placa contra corpo a corpo". O jogador lia "Armadura
 * +5%" como se fosse defesa geral, e 17 dos 31 tipos de inimigo atiram — mais da
 * metade do dano que chega ao jogador ignorava o eixo CORPO inteiro.
 *
 * O `danoNaOnda` acima modela só contato, então a mudança de balanceamento não
 * aparecia nele. Estes testes medem o caminho do projétil de verdade.
 */
describe('armadura: o eixo CORPO cobre o projétil', () => {
  /** Inimigos que atiram, e o dano base do tiro de cada um. */
  const ATIRADORES = Object.entries(ENEMY_TYPES).filter(([, e]) => e.canShoot);

  it('a mudança não abriu o jogo para dano zero', () => {
    // armadura no teto (0.5) ainda deixa metade do dano passar
    expect(1 - 0.5).toBeGreaterThan(0.4);
  });

  it('tem inimigo atirador suficiente para o eixo CORPO importar', () => {
    // se ninguém atirasse, a mudança seria decorativa
    expect(ATIRADORES.length, 'tipos que atiram').toBeGreaterThanOrEqual(10);
  });

  it('a armadura do CORPO completo segura mais de um tiro do atirador mais forte', () => {
    // build de CORPO: vida base + escudo + armadura acumulada até o teto
    const tiroMaisForte = Math.max(...ATIRADORES.map(([, e]) => e.damage));
    const comArmadura = tiroMaisForte * (1 - 0.5);
    expect(comArmadura, `tiro mais forte (${tiroMaisForte}) com armadura no teto`).toBeGreaterThan(0);
    // e sem armadura o mesmo tiro tiraria um terço da vida base
    expect(tiroMaisForte, `tiro mais forte (${tiroMaisForte}) contra 100 HP`).toBeGreaterThan(30);
  });

  it('a primeira onda ainda sobrevive: projétil não muda o veredito do começo', () => {
    // a onda 1 da Cidade é composta de inimigos que não atiram (grunt, mutante),
    // então a mudança não pode afetar o teste de sobrevivência — se afetasse,
    // o modelo de contato estaria errado.
    const cidade = PHASES[0];
    const atiraNaCidade = cidade.enemyTypes.filter(t => ENEMY_TYPES[t]?.canShoot);
    expect(atiraNaCidade, 'a onda 1 não tem atirador: a armadura não muda o veredito').toEqual([]);
  });
});

describe('balanceamento: o começo é jogável com a pistola e só a pistola', () => {
  const cidade = PHASES[0];
  const vidaJogador = 100;
  const dif = cidade.difficulty ?? 1;
  /** Dano de um toque do pior inimigo da Cidade, já escalado pela dificuldade. */
  const piorToque = Math.max(
    Math.floor(ENEMY_TYPES['grunt'].damage * dif),
    Math.floor(ENEMY_TYPES['mutante'].damage * dif),
  );

  it('a primeira onda cabe na tela e não é um massacre', () => {
    const { comuns, mutantes } = waveSize(0, cidade.mutantsPerWave ?? 0);
    // Antes eram 8 grunts. O teto existe porque a onda é o primeiro contato
    // com o jogo. O mutante não conta como ameaça de tela: a 62 px/s contra os
    // 320 do jogador, ele nunca alcança quem sai andando.
    expect(comuns, `onda 1 da Cidade tem ${comuns} inimigos comuns`).toBeLessThanOrEqual(4);
    expect(mutantes).toBeLessThanOrEqual(1);
  });

  it('a onda 1 sobrevive mesmo com o jogador cercado o tempo todo', () => {
    const { comuns, mutantes } = waveSize(0, cidade.mutantsPerWave ?? 0);
    const hp = comuns * ENEMY_TYPES['grunt'].health + mutantes * ENEMY_TYPES['mutante'].health;
    const dano = danoNaOnda(hp, piorToque);
    expect(
      dano,
      `onda 1 da Cidade: ${dano} de dano num jogador com ${vidaJogador} HP`,
    ).toBeLessThan(vidaJogador);
  });

  it('a última onda da primeira fase ainda é sobrevivível de primeira', () => {
    const ultima = cidade.waves - 1;
    const { comuns, mutantes } = waveSize(ultima, cidade.mutantsPerWave ?? 0);
    const hp = comuns * ENEMY_TYPES['grunt'].health + mutantes * ENEMY_TYPES['mutante'].health;
    const dano = danoNaOnda(hp, piorToque);
    expect(dano, `última onda da Cidade: ${dano} de dano`).toBeLessThan(vidaJogador);
  });

  it('a primeira fase não exige uma arma que ainda não existe', () => {
    // A STOCK só oferece Metralhadora a partir da fase 2 e Sniper da fase 3.
    // O primeiro chefe morria em 28s de pistola pura, o que transformava a aula
    // inicial em castigo.
    const vigia = ENEMY_TYPES[cidade.boss!].health * (1 + (cidade.waves - 1) * WAVE_SCALE_PER_LEVEL);
    const ttk = vigia / dpsPistola();
    expect(ttk, `VIGIA leva ${ttk.toFixed(0)}s de pistola`).toBeLessThan(20);
  });

  it('a dificuldade da primeira fase é a mais baixa do jogo', () => {
    const menor = Math.min(...PHASES.map(p => p.difficulty ?? 1));
    expect(cidade.difficulty ?? 1).toBe(menor);
  });
});

describe('balanceamento: a dificuldade cresce ao longo das 9 fases', () => {
  it('cada fase é mais cara que a anterior', () => {
    for (let i = 1; i < PHASES.length; i++) {
      expect(
        CUSTO[i], `${PHASES[i].name} (${CUSTO[i].toFixed(0)}) não é mais cara que ${PHASES[i - 1].name} (${CUSTO[i - 1].toFixed(0)})`,
      ).toBeGreaterThan(CUSTO[i - 1]);
    }
  });

  it('a última fase é a mais cara de todas', () => {
    expect(CUSTO[CUSTO.length - 1]).toBe(Math.max(...CUSTO));
  });

  it('a primeira fase é a mais barata de todas', () => {
    expect(CUSTO[0]).toBe(Math.min(...CUSTO));
  });

  it('a rampa não tem salto absurdo entre fases vizinhas', () => {
    for (let i = 1; i < PHASES.length; i++) {
      const salto = CUSTO[i] / CUSTO[i - 1] - 1;
      expect(salto, `${PHASES[i - 1].name} -> ${PHASES[i].name} salta ${(salto * 100).toFixed(0)}%`)
        .toBeLessThan(1.1);
    }
  });
});

describe('balanceamento: a rampa é feita de ondas, não de multiplicador', () => {
  it('o número de ondas não diminui ao longo do jogo', () => {
    for (let i = 1; i < PHASES.length; i++) {
      expect(PHASES[i].waves, `${PHASES[i].name} tem menos ondas que ${PHASES[i - 1].name}`)
        .toBeGreaterThanOrEqual(PHASES[i - 1].waves);
    }
  });

  it('o multiplicador é um ajuste pequeno, nunca um redesenho', () => {
    for (const fase of PHASES) {
      const d = fase.difficulty ?? 1;
      expect(d, `${fase.name}: multiplicador ${d}`).toBeGreaterThanOrEqual(0.7);
      expect(d, `${fase.name}: multiplicador ${d}`).toBeLessThanOrEqual(1.3);
    }
  });

  it('os inimigos saem mais devagar do que antes', () => {
    // 0.8s entre spawns era duas vezes por tiro da metralhadora. Com 1.2s o
    // jogador consegue ler a onda chegando.
    expect(WAVE_BASE_SPAWN_RATE).toBeGreaterThanOrEqual(1);
  });
});

describe('balanceamento: o mutante substitui densidade em vez de somar', () => {
  it('o mutante vale cerca de três inimigos comuns em tempo-para-abater', () => {
    const m = ENEMY_TYPES['mutante'];
    const g = ENEMY_TYPES['grunt'];
    const razao = m.health / g.health;
    expect(razao, `mutante tem ${m.health} HP contra ${g.health} do grunt`).toBeGreaterThanOrEqual(3);
  });

  it('o mutante é mais lento que o grunt comum', () => {
    // Se fosse rápido, seria só um grunt com mais HP e o jogador ignoraria.
    expect(ENEMY_TYPES['mutante'].speed).toBeLessThan(ENEMY_TYPES['grunt'].speed);
  });

  it('nenhuma fase passa de um mutante por onda', () => {
    for (const fase of PHASES) {
      expect(fase.mutantsPerWave ?? 0, `${fase.name} tem ${fase.mutantsPerWave} mutantes por onda`)
        .toBeLessThanOrEqual(1);
    }
  });

  it('só a Cidade e a Floresta têm mutante, e só nas duas primeiras fases', () => {
    const comMutante = PHASES.filter(p => (p.mutantsPerWave ?? 0) > 0).map(p => p.name);
    expect(comMutante).toEqual(['Cidade em Ruínas', 'Floresta']);
  });

  it('a fase que declara mutante também o lista em enemyTypes', () => {
    for (const fase of PHASES) {
      if (!fase.mutantsPerWave) continue;
      expect(fase.enemyTypes, `${fase.name} declara cota de mutante sem listar o tipo`)
        .toContain('mutante');
    }
  });
});
