import { describe, it, expect } from 'vitest';
import { ENEMY_TYPES, PHASES } from '../config';
import {
  characterFileExists, weaponFileExists, TILE_NUMBERS, tileFileName,
  POSES, WEAPON_CLASSES, ENEMY_CHARACTER,
} from '../systems/sprites';

/**
 * Este arquivo existe porque a sessão anterior perdeu um dia inteiro nisso: os
 * assets estavam em `assets/` na raiz, que o Vite não copia para `dist/`, e o
 * nome dos tiles usa pad de 2 dígitos (`tile_01.png`), não 3. Resultado: nenhuma
 * sprite chegava ao jogo e todo tile de 1 a 99 dava 404 — o terreno inteiro caía
 * no fallback procedural. `tsc` não pega nenhum dos dois, porque nenhum dos dois
 * é erro de tipo: é caminho de arquivo.
 */

/** Os 9 personagens do pack, com o prefixo de arquivo de cada um. */
const PERSONAGENS = [
  'Survivor 1/survivor1', 'Man Blue/manBlue', 'Man Brown/manBrown',
  'Man Old/manOld', 'Hitman 1/hitman1', 'Soldier 1/soldier1',
  'Robot 1/robot1', 'Woman Green/womanGreen', 'Zombie 1/zoimbie1',
];

describe('assets: os nomes de arquivo que o jogo pede', () => {
  it('cada personagem é pedido nas 6 poses', () => {
    const esperado = PERSONAGENS.flatMap(p => POSES.map(pose => `${p}_${pose}.png`));
    const real = characterFileExists().sort();
    expect(real).toEqual(esperado.sort());
    expect(real).toHaveLength(PERSONAGENS.length * POSES.length);
  });

  it('cada arma é pedida uma vez, nas 3 classes', () => {
    const esperado = WEAPON_CLASSES.map(w => `weapon_${w}.png`).sort();
    expect(weaponFileExists().sort()).toEqual(esperado);
  });

  it('o pad do nome de tile tem 2 dígitos, não 3', () => {
    // com pad 3, tile_01.png vira tile_001.png e dá 404
    expect(tileFileName(1)).toBe('tile_01.png');
    expect(tileFileName(9)).toBe('tile_09.png');
    expect(tileFileName(99)).toBe('tile_99.png');
    expect(tileFileName(100)).toBe('tile_100.png');
    expect(tileFileName(538)).toBe('tile_538.png');
  });

  it('toda tile carregada tem número dentro da faixa curada', () => {
    // os buracos da numeração do Kenney (54, 81, 162...) fazem um range
    // posicional apontar para arquivo inexistente
    for (const n of TILE_NUMBERS) {
      expect(n).toBeGreaterThan(0);
      expect(n).toBeLessThan(600);
      expect(TILE_NUMBERS).toContain(n);
    }
    expect(TILE_NUMBERS.length).toBeGreaterThanOrEqual(40);
  });
});

describe('conteúdo: nenhum tipo de inimigo fica órfão', () => {
  it('todo tipo em ENEMY_TYPES é usado por alguma fase, por onda ou como boss', () => {
    // 'shooter' ficou definido meses sem nenhuma fase citar: um inimigo que
    // existe no código e não existe no jogo. Todo tipo que sobra é lixo com
    // stats para balancear.
    const usados = new Set(PHASES.flatMap(f => [...f.enemyTypes, ...(f.boss ? [f.boss] : [])]));
    const orfaos = Object.keys(ENEMY_TYPES).filter(t => !usados.has(t));
    expect(orfaos, `tipo definido e nunca usado: ${orfaos.join(', ')}`).toEqual([]);
  });

  it('toda fase cita pelo menos um tipo que existe', () => {
    for (const fase of PHASES) {
      const inexistentes = fase.enemyTypes.filter(t => !ENEMY_TYPES[t]);
      expect(inexistentes, `${fase.name} cita tipo inexistente: ${inexistentes.join(', ')}`).toEqual([]);
    }
  });

  it('toda fase tem ao menos um atirador, exceto a Cidade (tutorial)', () => {
    // a fase 1 é a única sem atirador por decisão: ela ensina a ler o campo com
    // um tipo só, e é a única que os props seguram tiro de inimigo.
    const semAtirador = PHASES.filter(
      f => !f.enemyTypes.some(t => ENEMY_TYPES[t].canShoot),
    ).map(f => f.name);
    expect(semAtirador).toEqual(['Cidade em Ruínas']);
  });
});

describe('assets: nenhum tipo de inimigo fica sem personagem', () => {
  /** As 9 chaves do mapa de personagens do pack. */
  const CHAVES = ['survivor', 'manBlue', 'manBrown', 'manOld', 'hitman', 'soldier', 'robot', 'woman', 'zombie'];

  it('todo tipo de ENEMY_TYPES tem entrada no mapa de sprite', () => {
    // getEnemyCharacter cai em 'zombie' quando a chave não existe, e o fallback
    // é silencioso: o inimigo aparece com o sprite errado e nada avisa. Foi
    // exatamente assim que os 9 chefes viraram zumbi genérico.
    const semMapa = Object.keys(ENEMY_TYPES).filter(t => !ENEMY_CHARACTER[t]);
    expect(semMapa, `sem sprite mapeado (caem no fallback 'zombie'): ${semMapa.join(', ')}`).toEqual([]);
  });

  it('todo tipo mapeado aponta para um personagem que existe no pack', () => {
    const invalidos = Object.entries(ENEMY_CHARACTER)
      .filter(([, char]) => !CHAVES.includes(char))
      .map(([tipo, char]) => `${tipo} -> ${char}`);
    expect(invalidos, `personagem inexistente: ${invalidos.join(', ')}`).toEqual([]);
  });

  it('o jogador não é personagem de nenhum inimigo', () => {
    // 'survivor' é o sprite do jogador. Um inimigo com o mesmo sprite faz o
    // jogador ler a si mesmo como alvo.
    const comSurvivor = Object.entries(ENEMY_CHARACTER)
      .filter(([, char]) => char === 'survivor')
      .map(([tipo]) => tipo);
    expect(comSurvivor).toEqual([]);
  });
});