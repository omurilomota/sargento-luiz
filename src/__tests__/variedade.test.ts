import { describe, it, expect } from 'vitest';
import {
  BIOMAS, ENEMY_CHARACTER, VARIACAO_POR_BIOMA, getEnemyCharacter, CHARACTER_NAMES,
} from '../systems/sprites';
import { PHASES, ENEMY_TYPES } from '../config';

/**
 * A variedade de inimigos não pode regredir (2026-11).
 *
 * O pack tem 9 personagens e o jogo tem 24 tipos + 9 chefes. Com o mapa único,
 * `zombie` atendia 9 inimigos e `robot` outros 4: o jogo anunciava 33 inimigos
 * e desenhava 9 silhuetas. `VARIACAO_POR_BIOMA` conserta isso por FASE.
 *
 * Este arquivo trava o contrato. Sem ele, a tabela encolhe de volta para um
 * zumbi sem nenhum teste reclamar — a mesma classe de defeito que a porta nº 5
 * do portão anti-IA (código que existe e não faz o que promete).
 */

const TIPOS = Object.keys(ENEMY_TYPES);
const COMUNS = TIPOS.filter(t => !ENEMY_TYPES[t].isBoss);
const CHEFES = TIPOS.filter(t => ENEMY_TYPES[t].isBoss);

describe('variedade: os 9 biomas existem e estão ligados', () => {
  it('a tabela tem uma entrada para cada bioma', () => {
    expect(BIOMAS).toHaveLength(PHASES.length);
    for (const b of BIOMAS) {
      expect(VARIACAO_POR_BIOMA[b], `bioma ${b} sem tabela`).toBeTruthy();
    }
  });

  it('a ordem dos biomas bate com a ordem das fases', () => {
    // `drawEnemies` recebe `PHASES.indexOf(fase)`: se a ordem divergir, o
    // jogador vê o elenco do bioma errado, e nenhum teste de nome acusaria.
    expect(BIOMAS.length).toBe(PHASES.length);
    for (const b of BIOMAS) expect(VARIACAO_POR_BIOMA[b]).toBeDefined();
  });
});

describe('variedade: o personagem é personagem de verdade', () => {
  it('toda entrada da tabela é um personagem do pack', () => {
    for (const [bioma, mapa] of Object.entries(VARIACAO_POR_BIOMA)) {
      for (const [tipo, char] of Object.entries(mapa)) {
        expect(CHARACTER_NAMES, `${bioma}/${tipo} aponta para "${char}", que não está no pack`).toContain(char);
      }
    }
  });

  it('todo tipo da tabela é um inimigo que existe', () => {
    for (const [bioma, mapa] of Object.entries(VARIACAO_POR_BIOMA)) {
      for (const tipo of Object.keys(mapa)) {
        expect(TIPOS, `${bioma} mapeia "${tipo}", que não é tipo de inimigo`).toContain(tipo);
      }
    }
  });

  it('o jogador nunca vira inimigo', () => {
    // `survivor` é o protagonist. Se entrar na tabela, o jogador é desenhado
    // como zumbi.
    for (const mapa of Object.values(VARIACAO_POR_BIOMA)) {
      for (const char of Object.values(mapa)) {
        expect(char, 'o protagonista entrou na tabela de inimigos').not.toBe('survivor');
      }
    }
  });
});

describe('variedade: a variação realmente varia', () => {
  it('o mesmo tipo nunca sai com a mesma silhueta em 4 fases seguidas', () => {
    // A regra vale só para tipos que EXISTEM em 4 fases ou mais. `ufo` só
    // aparece no Espaço e `asteroid` no Vulcão e no Espaço: exigir que variem
    // entre fases que não os recebem é exigir o impossível — foi exatamente o
    // que travou a primeira versão, que eu fui corrigindo caso a caso.
    for (const tipo of COMUNS) {
      const fasesDoTipo = PHASES
        .map((_, i) => i)
        .filter(i => (PHASES[i].enemyTypes as string[]).includes(tipo));
      if (fasesDoTipo.length < 4) continue;
      for (let i = 0; i + 3 < fasesDoTipo.length; i++) {
        const janela = fasesDoTipo.slice(i, i + 4);
        const quatro = janela.map(f => getEnemyCharacter(tipo, f));
        expect(
          quatro.every(c => c === quatro[0]),
          `${tipo} é "${quatro[0]}" nas fases ${janela.map(f => f + 1).join(', ')}`,
        ).toBe(false);
      }
    }
  });

  it('metade dos inimigos comuns muda de silhueta entre fases vizinhas', () => {
    // A medida de qualidade da tabela. Com o mapa único (o que existia antes),
    // dava 0%: nenhum tipo mudava de fase para fase. O piso de 45% é o que
    // impede a tabela de encolher de volta para quase-cópia sem ninguém notar.
    let mudam = 0;
    let total = 0;
    for (const tipo of COMUNS) {
      for (let i = 0; i + 1 < BIOMAS.length; i++) {
        total++;
        if (getEnemyCharacter(tipo, i) !== getEnemyCharacter(tipo, i + 1)) mudam++;
      }
    }
    const razao = mudam / total;
    expect(razao, `só ${(razao * 100).toFixed(0)}% dos inimigos mudam de silhueta entre fases`).toBeGreaterThan(0.45);
  });

  it('nenhum tipo fica preso na mesma silhueta nas fases onde ele aparece', () => {
    // O outro extremo: um tipo pode repetir, mas não pode ser UM só corpo em
    // todas as fases onde existe (era o `zombie` atendendo 9 tipos).
    for (const tipo of COMUNS) {
      const fasesDoTipo = PHASES
        .map((_, i) => i)
        .filter(i => (PHASES[i].enemyTypes as string[]).includes(tipo));
      if (fasesDoTipo.length < 2) continue;
      const corpos = new Set(fasesDoTipo.map(f => getEnemyCharacter(tipo, f)));
      expect(corpos.size, `${tipo} tem um corpo só (${[...corpos][0]}) nas ${fasesDoTipo.length} fases onde aparece`).toBeGreaterThan(1);
    }
  });

  it('nenhum bioma inteiro é cópia de outro', () => {
    for (let i = 0; i < BIOMAS.length; i++) {
      for (let j = i + 1; j < BIOMAS.length; j++) {
        const a = Object.values(VARIACAO_POR_BIOMA[BIOMAS[i]]).sort().join(',');
        const b = Object.values(VARIACAO_POR_BIOMA[BIOMAS[j]]).sort().join(',');
        expect(a, `${BIOMAS[i]} e ${BIOMAS[j]} têm o elenco idêntico`).not.toBe(b);
      }
    }
  });

  it('o jogo inteiro usa mais de metade do elenco do pack', () => {
    const usados = new Set<string>();
    for (const mapa of Object.values(VARIACAO_POR_BIOMA)) {
      for (const char of Object.values(mapa)) usados.add(char);
    }
    for (const char of Object.values(ENEMY_CHARACTER)) usados.add(char);
    // 9 personagens no pack (o `survivor` é o jogador e nunca é inimigo): no
    // mínimo 5 em uso, senão voltou a ser "tudo zumbi".
    expect(usados.size, `só ${usados.size} personagens em uso`).toBeGreaterThanOrEqual(5);
  });

  it('cada bioma tem pelo menos 3 personagens distintos', () => {
    for (const [bioma, mapa] of Object.entries(VARIACAO_POR_BIOMA)) {
      const distintos = new Set(Object.values(mapa));
      expect(distintos.size, `${bioma} tem só ${distintos.size} personagem(ns) distinto(s)`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('variedade: getEnemyCharacter resolve por fase', () => {
  it('o mesmo tipo sai com corpos diferentes em fases diferentes', () => {
    const vistos = new Set<string>();
    for (let fase = 0; fase < BIOMAS.length; fase++) {
      vistos.add(getEnemyCharacter('grunt', fase));
    }
    expect(vistos.size, `grunt usa ${vistos.size} silhueta(s) em 9 fases`).toBeGreaterThan(1);
  });

  it('a fase não é sorteada: a mesma fase dá sempre o mesmo personagem', () => {
    // `Math.random` aqui faria a tela piscar entre quadros
    for (let fase = 0; fase < BIOMAS.length; fase++) {
      const primeiro = getEnemyCharacter('grunt', fase);
      for (let i = 0; i < 5; i++) {
        expect(getEnemyCharacter('grunt', fase), `fase ${fase} mudou de personagem`).toBe(primeiro);
      }
    }
  });

  it('fase fora de 0..8 cai no mapa geral, sem apagar a silhueta', () => {
    for (const fase of [-1, 99, NaN]) {
      const char = getEnemyCharacter('crystalQueen', fase);
      expect(ENEMY_CHARACTER.crystalQueen, `fase ${fase} perdeu o chefe`).toBe(char);
    }
  });

  it('tipo sem entrada no bioma cai no mapa geral', () => {
    // `tank` não está na tabela da Cidade: tem de vir do mapa geral
    expect(getEnemyCharacter('tank', 0)).toBe(ENEMY_CHARACTER.tank);
  });

  it('tipo desconhecido continua caindo no zumbi (nunca em undefined)', () => {
    expect(getEnemyCharacter('inimigoDoFuturo', 3)).toBe('zombie');
    expect(getEnemyCharacter('inimigoDoFuturo')).toBe('zombie');
  });

  it('os 9 chefes mantêm silhueta própria em qualquer fase', () => {
    // O chefe é o alvo da tela: ele não pode variar com o bioma. O teste pega
    // o caso em que alguém põe chefe na tabela por bioma.
    const chefesNaTabela = CHEFES.filter(t =>
      Object.values(VARIACAO_POR_BIOMA).some(m => m[t] !== undefined)
    );
    expect(chefesNaTabela, `chefes dentro da tabela de variação: ${chefesNaTabela.join(', ')}`).toEqual([]);
    for (const c of CHEFES) {
      for (let fase = 0; fase < BIOMAS.length; fase++) {
        expect(getEnemyCharacter(c, fase), `chefe ${c} perdeu a silhueta`).toBe(ENEMY_CHARACTER[c]);
      }
    }
  });

  it('todo inimigo comum de cada fase resolve para um personagem do pack', () => {
    for (let fase = 0; fase < BIOMAS.length; fase++) {
      for (const tipo of COMUNS) {
        const char = getEnemyCharacter(tipo, fase);
        expect(CHARACTER_NAMES, `fase ${fase}, ${tipo} → "${char}" não existe no pack`).toContain(char);
      }
    }
  });
});