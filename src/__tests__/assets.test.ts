import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { inflateSync } from 'zlib';
import { join } from 'path';
import { ENEMY_TYPES, PHASES, WEAPONS, SPAWN_PROPRIO, SCRIPTED_TYPES } from '../config';
import {
  characterFileExists, weaponFileExists, TILE_NUMBERS, tileFileName,
  POSES, WEAPON_CLASSES, ENEMY_CHARACTER,
  BULLET_FAMILY, WEAPON_ICON, BULLET_SPRITES, WEAPON_SPRITES,
  DUNGEON_FLOORS, DUNGEON_WALLS, DUNGEON_COUNT, PARTICLE_SPRITES, BULLET_EXTRA,
  ITEM_SPRITES,
} from '../systems/sprites';
import { BIOMES } from '../maps';
import { CONTAGOS_POR_ESTILO } from '../systems/particles';

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

  it('os itens (moeda e gemas) existem no disco', () => {
    // A moeda é o objeto mais visto do jogo: se um destes sumir, ela volta ao
    // `arc()` procedural do fallback sem ninguém perceber.
    expect(ITEM_SPRITES.length).toBeGreaterThan(0);
    for (const nome of ITEM_SPRITES) {
      const p = join('public', 'assets', 'sprites', 'items', `${nome}.png`);
      expect(existsSync(p), `${p} não existe — a moeda cai no arc procedural`).toBe(true);
    }
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

/**
 * Lê um PNG sem dependência: decodifica IHDR e o canal alfa linha a linha.
 *
 * Existe para medir a ORIENTAÇÃO da bala. A bala saiu atravessada em campo
 * (pontando de lado), e nem `tsc` nem teste unitário pegam isso: o drawImage
 * estava correto, era o `rotate(ang)` que alinhava o eixo errado. Medir que a
 * ponta está no topo (linhas estreitas) e a base embaixo (linhas largas) é o
 * que trava a regressão.
 */
function lerDimensoes(p: string): { largura: number; altura: number } {
  const buf = readFileSync(p);
  return { largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) };
}

/** Largura com alfa visível, por linha, de cima para baixo. */
function lerLarguraPorLinha(p: string): { larguraLinha: number[] } {
  const buf = readFileSync(p);
  const { largura, altura } = lerDimensoes(p);
  const posColorType = buf.readUInt8(25);
  // ct=6 é RGBA (canal alfa a cada 4 bytes); ct=3 usa paleta + tRNS
  if (posColorType !== 6) return { larguraLinha: new Array(altura).fill(largura) };

  // concatena os IDAT
  let pos = 8;
  const partes: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const tipo = buf.toString('latin1', pos + 4, pos + 8);
    if (tipo === 'IDAT') partes.push(buf.subarray(pos + 8, pos + 8 + len));
    if (tipo === 'IEND') break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(partes));

  const bytesPorPixel = 4;
  const stride = largura * bytesPorPixel;
  const larguraLinha: number[] = [];
  let anterior = Buffer.alloc(stride);
  let i = 0;
  for (let y = 0; y < altura; y++) {
    const filtro = raw[i++];
    const linha = Buffer.from(raw.subarray(i, i + stride));
    i += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bytesPorPixel ? linha[x - bytesPorPixel] : 0;
      const b = anterior[x];
      const c = x >= bytesPorPixel ? anterior[x - bytesPorPixel] : 0;
      if (filtro === 1) linha[x] = (linha[x] + a) & 255;
      else if (filtro === 2) linha[x] = (linha[x] + b) & 255;
      else if (filtro === 3) linha[x] = (linha[x] + ((a + b) >> 1)) & 255;
      else if (filtro === 4) {
        const p0 = a + b - c;
        const pa = Math.abs(p0 - a);
        const pb = Math.abs(p0 - b);
        const pc = Math.abs(p0 - c);
        const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        linha[x] = (linha[x] + pred) & 255;
      }
    }
    let visiveis = 0;
    for (let x = 0; x < largura; x++) if (linha[x * 4 + 3] > 128) visiveis++;
    larguraLinha.push(visiveis);
    anterior = linha;
  }
  return { larguraLinha };
}

/**
 * O pack de armas e de projéteis (Kay Lousberg, "2D Guns", CC0).
 *
 * O pack Kenney do jogo traz 3 sprites de arma e nenhum de projétil: as 12
 * armas colapsavam em 3 desenhos e todo tiro era um `ctx.arc()`. Estes testes
 * existem pelo mesmo motivo dos de cima — nenhum dos dois problemas é erro de
 * tipo, é caminho de arquivo, e o sintoma (bola voadora / arma errada) só
 * aparece rodando o jogo.
 */
describe('assets: projéteis e armas do pack CC0', () => {
  const WEAPON_DIR = 'public/assets/sprites/weapons';

  it('toda sprite de projétil existe no disco', () => {
    for (const b of BULLET_SPRITES) {
      const p = join(WEAPON_DIR, `${b}.png`);
      expect(existsSync(p), `${p} não existe — a bala cai no arc procedural`).toBe(true);
    }
  });

  it('toda sprite de arma existe no disco', () => {
    for (const w of WEAPON_SPRITES) {
      const p = join(WEAPON_DIR, `${w}.png`);
      expect(existsSync(p), `${p} não existe`).toBe(true);
    }
  });

  it('toda arma do jogo tem família de projétil', () => {
    const semFamilia = WEAPONS.map(w => w.name).filter(n => !BULLET_FAMILY[n]);
    expect(semFamilia, `sem sprite de bala: ${semFamilia.join(', ')}`).toEqual([]);
  });

  it('toda arma do jogo tem ícone', () => {
    const semIcone = WEAPONS.map(w => w.name).filter(n => !WEAPON_ICON[n]);
    expect(semIcone, `sem ícone: ${semIcone.join(', ')}`).toEqual([]);
  });

it('nenhuma família aponta para sprite que não existe no pack', () => {
    for (const [arma, familia] of Object.entries(BULLET_FAMILY)) {
      const existe = (BULLET_SPRITES as readonly string[]).includes(familia) || BULLET_EXTRA.includes(familia);
      expect(existe, `${arma} pede "${familia}", que não é uma bala de nenhum pack`).toBe(true);
    }
  });

  it('toda família nova de projétil tem arquivo no disco', () => {
    for (const b of BULLET_EXTRA) {
      expect(existsSync(join(__dirname, '..', '..', 'public', 'assets', 'sprites', 'bullets', `${b}.png`)),
        `projétil sem arquivo: ${b}`).toBe(true);
    }
  });

  it('nenhum ícone aponta para arma que não existe no pack', () => {
    for (const [arma, icone] of Object.entries(WEAPON_ICON)) {
      expect(WEAPON_SPRITES, `${arma} pede ícone "${icone}"`).toContain(icone);
    }
  });

  it('as 12 armas não colapsam nas 3 classes do Kenney', () => {
    // A contagem de projéteis distintos é o que prova que o tiro deixou de
    // ser o mesmo em toda arma: com `weaponClass` seriam 3, com o nome da
    // arma são 7. E nenhum par de armas com mecânica diferente compartilha
    // projétil — a RPG precisa de foguete, não de cartucho.
    const familias = new Set(Object.values(BULLET_FAMILY));
    expect(familias.size).toBeGreaterThanOrEqual(5);
    expect(BULLET_FAMILY['RPG'], 'RPG sem foguete').not.toBe(BULLET_FAMILY['Pistola']);
    expect(BULLET_FAMILY['Laser'], 'Laser sem feixe').not.toBe(BULLET_FAMILY['Metralhadora']);
    expect(BULLET_FAMILY['Gel'], 'Gel sem orbe').not.toBe(BULLET_FAMILY['Shotgun']);
  });

  it('a bala é mais alta que larga (cartucho vertical, ponta em cima)', () => {
    // Se o asset viesse deitado, a rotação de +90° alinharia o lado chato com
    // a velocidade e a bala entraria de lado no inimigo.
    for (const b of BULLET_SPRITES) {
      const { largura, altura } = lerDimensoes(join(WEAPON_DIR, `${b}.png`));
      expect(altura, `${b} tem ${largura}x${altura}: cartucho tem de ser vertical`)
        .toBeGreaterThan(largura);
    }
  });

  it('a ponta da bala fica no topo da sprite, não na lateral', () => {
    // A bala saiu atravessada em campo porque o `rotate(ang)` alinhava o EIXO
    // do sprite com a velocidade. O pack desenha o cartucho vertical, ponta em
    // -y: as primeiras linhas são estreitas e a base é chata e larga. Medir é
    // a única forma de travar isso, porque o build e o teste unitário passam
    // com a bala deitada.
    for (const b of BULLET_SPRITES) {
      const p = join(WEAPON_DIR, `${b}.png`);
      const { larguraLinha } = lerLarguraPorLinha(p);
      const topo = larguraLinha.slice(0, 4).reduce((s, v) => s + v, 0) / 4;
      const base = larguraLinha.slice(-4).reduce((s, v) => s + v, 0) / 4;
      expect(
        base, `${b}: base (${base.toFixed(1)}px) deve ser mais larga que a ponta (${topo.toFixed(1)}px)`,
      ).toBeGreaterThan(topo);
    }
  });

  it('a bala desenhada cabe num raio de colisão de 18px', () => {
    // A 20px de altura o small_bullet sai com 8px de largura. Forçar 2.4:1
    // deixava com 43px, maior que o próprio inimigo.
    const b = 'small_bullet';
    const { largura, altura } = lerDimensoes(join(WEAPON_DIR, `${b}.png`));
    const alturaDesenhada = 20;
    const larguraDesenhada = alturaDesenhada * largura / altura;
    expect(larguraDesenhada).toBeLessThan(12);
  });

  it('o pacote de fx do Kenney Particle foi descartado', () => {
    // Eram masks 512x512 em escala de cinza (spark/muzzle/light), not sprites:
    // ct=3 palette with tRNS, drawn as near-black. Keeping them would add
    // 1.2MB of assets that render as black squares.
    expect(existsSync('public/assets/sprites/fx')).toBe(false);
  });
});

describe('conteúdo: nenhum tipo de inimigo fica órfão', () => {
  it('todo tipo em ENEMY_TYPES é usado por alguma fase, por onda ou como boss', () => {
    // 'shooter' ficou definido meses sem nenhuma fase citar: um inimigo que
    // existe no código e não existe no jogo. Todo tipo que sobra é lixo com
    // stats para balancear.
    //
    // `SPAWN_PROPRIO` é o quarto caminho: tipo que NÃO entra no pool de onda e
    // mesmo assim existe no jogo porque uma máquina específica o costura. Sem
    // ele na conta, a única forma de satisfazer este teste seria pôr a
    // biomaquina em `enemyTypes` — e o spawner a jogaria na onda, que é
    // justamente o que a decisão do jogador proíbe (ela nasce do NÚCLEO,
    // enquanto ele estiver vivo, e não no ritmo da onda).
    //
    // `SCRIPTED_TYPES` é o quinto: o Rogério infectado (H2) nasce do script
    // da Fábrica — ele é a virada pós-sentinel, não onda e não boss da fase.
    const usados = new Set([
      ...PHASES.flatMap(f => [...f.enemyTypes, ...(f.boss ? [f.boss] : [])]),
      ...SPAWN_PROPRIO,
      ...SCRIPTED_TYPES,
    ]);
    const orfaos = Object.keys(ENEMY_TYPES).filter(t => !usados.has(t));
    expect(orfaos, `tipo definido e nunca usado: ${orfaos.join(', ')}`).toEqual([]);
  });

  it('todo tipo de SPAWN_PROPRIO existe em ENEMY_TYPES', () => {
    // A lista é um nome solto se ninguém conferir: ela entraria na conta do
    // órfão e apagaria um tipo que ninguém consome.
    for (const tipo of SPAWN_PROPRIO) {
      expect(ENEMY_TYPES[tipo], `SPAWN_PROPRIO cita tipo inexistente: ${tipo}`).toBeDefined();
    }
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
/**
 * Pack Top Down Dungeon (Screaming Brain Studios, CC0) e Particle Pack (Kenney,
 * CC0).
 *
 * O ganho do dungeon é a textura de chão e parede com rejunte real. O motivo
 * está medido em `README`/`CREDITS.md`: 453 dos 520 tiles do pack Kenney são
 * 100% chapados, e a costura de 64px daí resultante é o principal sintoma de
 * "cara de IA" no chão.
 */
describe('assets: pack Top Down Dungeon (chão e parede com textura)', () => {
  const RAIZ = join(__dirname, '..', '..');
  const DIR = join(RAIZ, 'public', 'assets', 'sprites', 'dungeon');

  it('todo material de chão tem os tiles de miolo que o jogo pede', () => {
    for (const grupo of DUNGEON_FLOORS) {
      for (let i = 0; i < DUNGEON_COUNT.piso[grupo]; i++) {
        const arq = join(DIR, `${grupo}_${String(i).padStart(2, '0')}.png`);
        expect(existsSync(arq), `piso faltando: ${grupo}_${i}`).toBe(true);
      }
    }
  });

  it('todo material de parede tem os 16 tiles que o jogo pede', () => {
    for (const grupo of DUNGEON_WALLS) {
      for (let i = 0; i < DUNGEON_COUNT.parede[grupo]; i++) {
        const arq = join(DIR, `${grupo}_${String(i).padStart(2, '0')}.png`);
        expect(existsSync(arq), `parede faltando: ${grupo}_${i}`).toBe(true);
      }
    }
  });

  it('os 9 biomas apontam para materiais que existem no disco', () => {
    const pisos = new Set<string>(DUNGEON_FLOORS);
    const paredes = new Set<string>(DUNGEON_WALLS);
    for (const b of Object.values(BIOMES)) {
      expect(pisos.has(b.dungeonFloor), `${b.key}: piso "${b.dungeonFloor}" não existe`).toBe(true);
      expect(paredes.has(b.dungeonWall), `${b.key}: parede "${b.dungeonWall}" não existe`).toBe(true);
    }
  });
});

describe('assets: pack de partículas (Kenney Particle Pack)', () => {
  const RAIZ = join(__dirname, '..', '..');
  const DIR = join(RAIZ, 'public', 'assets', 'sprites', 'particles');

  it('toda partícula declarada existe no disco', () => {
    for (const p of PARTICLE_SPRITES) {
      expect(existsSync(join(DIR, `${p}.png`)), `partícula faltando: ${p}`).toBe(true);
    }
  });

  it('as três famílias (muzzle, smoke, spark) têm pelo menos 3 sprites', () => {
    // Sem variedade dentro da familia, todas as partículas de tiro ficam com a
    // mesma cara — que é o defeito que o arco uniforme tinha.
    for (const estilo of ['muzzle', 'smoke', 'spark'] as const) {
      const tamanho = CONTAGOS_POR_ESTILO[estilo];
      expect(tamanho, `familia ${estilo} com ${tamanho} sprites`).toBeGreaterThanOrEqual(3);
    }
  });
});
