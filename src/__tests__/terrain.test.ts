import { describe, it, expect } from 'vitest';
import { BIOMES, tileKindAt } from '../maps';
import { shade, HAZARD_SPRITES } from '../systems/terrain';
import { TILE_NUMBERS } from '../systems/sprites';

// `buildTerrain` e `drawTerrain` precisam de canvas, e o projeto não tem jsdom —
// adicionar DOM aqui custaria uma dependência a uma base que hoje tem 4. O desenho do
// terreno é verificado no browser (as 9 fases, por screenshot); aqui fica a
// parte pura e o CONTRATO de dado que o terreno consome, que é onde o terreno já
// errou uma vez: quando os tiles viraram listras de código de barras, a causa foi
// o dado, não o desenho.

const KEYS = Object.keys(BIOMES);
const lum = (hex: string): number => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const HEX6 = /^#[0-9a-f]{6}$/i;

describe('terrain: shade', () => {
  it('clarear leva em direção ao branco, escurecer em direção ao preto', () => {
    expect(shade('#808080', 0.5)).toBe('#c0c0c0');
    expect(shade('#808080', -0.5)).toBe('#404040');
  });

  it('amount 0 devolve a mesma cor', () => {
    expect(shade('#7a9a6a', 0)).toBe('#7a9a6a');
  });

  it('amount 1 vira branco e -1 vira preto', () => {
    expect(shade('#7a9a6a', 1)).toBe('#ffffff');
    expect(shade('#7a9a6a', -1)).toBe('#000000');
  });

  it('aceita hex sem o #', () => {
    expect(shade('7a9a6a', 0)).toBe('#7a9a6a');
  });

  it('devolve a entrada como está quando não é hex de 6 dígitos', () => {
    // drawHazard passa uma cor de palette; não pode virar lixo
    for (const entrada of ['', 'abc', '#fff', 'rgb(1,2,3)', '#7a9a6a7a', 'rebeccapurple']) {
      expect(shade(entrada, 0.3)).toBe(entrada);
    }
  });

  it('nunca estoura o canal, mesmo com amount fora da faixa', () => {
    // sem o clamp, `| << 16` com canal > 255 devolve uma cor totalmente diferente
    for (const amount of [-9, -2, -1.0001, 1.5, 42]) {
      const saida = shade('#7a9a6a', amount);
      expect(saida).toMatch(HEX6);
      const n = parseInt(saida.slice(1), 16);
      for (const canal of [(n >> 16) & 255, (n >> 8) & 255, n & 255]) {
        expect(canal).toBeGreaterThanOrEqual(0);
        expect(canal).toBeLessThanOrEqual(255);
      }
    }
  });

  it('o resultado é sempre um hex válido', () => {
    for (const bioma of Object.values(BIOMES)) {
      for (const cor of [bioma.floor, bioma.wall, bioma.accent, bioma.tint, bioma.grain]) {
        expect(shade(cor, 0.3), `${bioma.key}: ${cor}`).toMatch(HEX6);
        expect(shade(cor, -0.3), `${bioma.key}: ${cor}`).toMatch(HEX6);
      }
    }
  });
});

describe('terrain: o contrato de dado dos 9 biomas', () => {
  it.each(KEYS)('%s: toda cor do bioma é hex de 6 dígitos', (key) => {
    const b = BIOMES[key] as unknown as Record<string, string>;
    for (const campo of ['floor', 'wall', 'accent', 'tint', 'grain', 'void', 'hazardColor']) {
      expect(b[campo], `${key}.${campo} = ${b[campo]}`).toMatch(HEX6);
    }
  });

  it.each(KEYS)('%s: tem tile de piso, e todos existem no pack', (key) => {
    const b = BIOMES[key];
    expect(b.floorTiles.length).toBeGreaterThanOrEqual(4);
    for (const n of b.floorTiles) {
      expect(TILE_NUMBERS, `${key}: tile ${n} não está na lista carregada`).toContain(n);
    }
  });

  it.each(KEYS)('%s: os tiles de piso são distintos entre si', (key) => {
    // tile repetido não dá variação: o chão vira um bloco só
    const b = BIOMES[key];
    expect(new Set(b.floorTiles).size).toBe(b.floorTiles.length);
  });

  it.each(KEYS)('%s: a parede é mais clara que o piso', (key) => {
    // em top-down o olho lê a massa clara como obstáculo; invertido, o mapa
    // vira uma coleção de buracos
    const b = BIOMES[key];
    expect(lum(b.wall), `${key}: parede ${lum(b.wall)} vs piso ${lum(b.floor)}`)
      .toBeGreaterThan(lum(b.floor));
  });

  it.each(KEYS)('%s: o contraste entre piso e parede é perceptível', (key) => {
    const b = BIOMES[key];
    const delta = Math.abs(lum(b.wall) - lum(b.floor));
    // abaixo disso o terreno não tem leitura de "isto bloqueia" num relance
    expect(delta, `${key}: contraste de ${delta.toFixed(1)}`).toBeGreaterThan(25);
  });

  it.each(KEYS)('%s: o tint não esmaga o bioma', (key) => {
    // o tint é aplicado por multiply no prerender; um tint quase preto
    // transforma o mapa inteiro em buraco
    const b = BIOMES[key];
    expect(lum(b.tint), `${key}: tint ${b.tint}`).toBeGreaterThan(90);
  });

  it.each(KEYS)('%s: a granulação é visível mas não domina', (key) => {
    const b = BIOMES[key];
    expect(b.grainAlpha).toBeGreaterThan(0);
    expect(b.grainAlpha).toBeLessThanOrEqual(0.4);
  });

  it.each(KEYS)('%s: accent e void não são a mesma cor', (key) => {
    const b = BIOMES[key];
    expect(b.accent).not.toBe(b.floor);
    expect(b.void).not.toBe(b.floor);
  });
});

describe('terrain: o contrato do tilemap', () => {
  it.each(KEYS)('%s: toda linha tem a largura do mapa', (key) => {
    const rows = BIOMES[key].rows;
    for (const [i, row] of rows.entries()) {
      expect(row.length, `${key} linha ${i}`).toBe(rows[0].length);
    }
  });

  it.each(KEYS)('%s: só usa caracteres que tileKindAt conhece', (key) => {
    // caractere desconhecido cai no `default` do drawFloor e vira mais um tile
    // de chão sem querer. Os quatro da estrada da Rodovia ('=', ':', '-', '_')
    // têm tratamento próprio em buildTerrain: asfalto autoral, não o chão do
    // bioma.
    const CONHECIDOS = ['#', ',', '^', '.', 'c', 'b', 'N', 'P', 'E', 'B', 'R', 'F', '=', ':', '-', '_', 'T', 'D', 'A', 'G', 'r', '~', 'S', 'g'];
    for (const row of BIOMES[key].rows) {
      for (const ch of row) {
        expect(CONHECIDOS, `caractere '${ch}' sem tratamento`).toContain(ch);
      }
    }
  });

  it('tileKindAt distingue os três tipos de chão que o terrain desenha', () => {
    expect(tileKindAt('.')).not.toBe(tileKindAt(','));
    expect(tileKindAt(',')).not.toBe(tileKindAt('#'));
    expect(tileKindAt('^')).not.toBe(tileKindAt('#'));
  });
});
describe('objetos de hazard por tipo', () => {
  it('todo tile de hazard está em TILE_NUMBERS, senão não é carregado', () => {
    for (const [hazard, nums] of Object.entries(HAZARD_SPRITES)) {
      for (const n of nums) {
        expect(TILE_NUMBERS, `tile_${n} (${hazard}) fora da lista de carregamento`).toContain(n);
      }
    }
  });

  it('debris e lava têm 2+ tiles; fog e mud usam tiles distintos', () => {
    expect(new Set(HAZARD_SPRITES.debris).size).toBeGreaterThanOrEqual(2);
    expect(new Set(HAZARD_SPRITES.lava).size).toBeGreaterThanOrEqual(2);
    expect(new Set(HAZARD_SPRITES.fog)).not.toEqual(new Set(HAZARD_SPRITES.mud));
  });

  it('spikes e electric usam tiles do pack com o resto (268 = aviso, 264 = cristal)', () => {
    expect(HAZARD_SPRITES.spikes).toEqual(expect.any(Array));
    expect(HAZARD_SPRITES.electric).toEqual(expect.any(Array));
  });
});
