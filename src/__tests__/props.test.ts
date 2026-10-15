import { describe, it, expect, beforeEach } from 'vitest';
import { TILE_NUMBERS } from '../systems/sprites';
import {
  initProps, clearProps, getProps, getNests, getBlockingProps, getBlast,
  damageProp, igniteBarrel, detonateProp, updateProps, collapsesOnHit, PROP_SPRITES,
  getRocket, getAnyRocket,
} from '../systems/props';
import { CELL_SIZE, BIOMES } from '../maps';
import { PHASES } from '../config';

/** Constrói uma grade de células com os caracteres pedidos. */
function mapa(caracteres: Record<string, [number, number]>): string[][] {
  const cells = Array.from({ length: 20 }, () => Array<string>(30).fill('.'));
  for (const [ch, [col, row]] of Object.entries(caracteres)) cells[row][col] = ch;
  return cells;
}

const em = (col: number, row: number) => ({ x: col * CELL_SIZE + 32, y: row * CELL_SIZE + 32 });

beforeEach(() => clearProps());

describe('props: os três tipos nascem com vida e raio distintos', () => {
  it('caixote, barril e ninho são lidos de c, b e N', () => {
    initProps(mapa({ c: [3, 3], b: [5, 3], N: [7, 3] }));
    const [caixa, barril, ninho] = getProps();
    expect(caixa.kind).toBe('crate');
    expect(barril.kind).toBe('barrel');
    expect(ninho.kind).toBe('nest');
  });

  it('cada tipo tem vida e raio próprios', () => {
    initProps(mapa({ c: [3, 3], b: [5, 3], N: [7, 3] }));
    const [caixa, barril, ninho] = getProps();
    const vidas = [caixa.health, barril.health, ninho.health];
    const raios = [caixa.radius, barril.radius, ninho.radius];
    expect(new Set(vidas).size).toBe(3);   // todos diferentes
    expect(new Set(raios).size).toBe(3);
    // o ninho é o mais resistente: é objetivo de fase
    expect(ninho.health).toBeGreaterThan(caixa.health);
    expect(ninho.health).toBeGreaterThan(barril.health);
  });

  it('o prop nasce no centro da célula, não no canto', () => {
    initProps(mapa({ b: [5, 3] }));
    expect(getProps()[0].x).toBe(em(5, 3).x);
    expect(getProps()[0].y).toBe(em(5, 3).y);
  });

  it('células comuns não viram prop', () => {
    initProps(mapa({ '.': [1, 1] }));
    expect(getProps()).toHaveLength(0);
  });
});

describe('props: dano', () => {
  it('damageProp só devolve true quando destruiu', () => {
    initProps(mapa({ c: [3, 3] }));
    const caixa = getProps()[0];
    expect(damageProp(caixa, caixa.maxHealth - 1)).toBe(false);
    expect(caixa.health).toBe(1);
    expect(damageProp(caixa, 1)).toBe(true);
  });

  it('a vida não fica negativa', () => {
    initProps(mapa({ c: [3, 3] }));
    const caixa = getProps()[0];
    damageProp(caixa, 9999);
    expect(caixa.health).toBe(0);
  });

  it('todo dano acende o flash', () => {
    initProps(mapa({ c: [3, 3] }));
    const caixa = getProps()[0];
    expect(caixa.hitFlash).toBe(0);
    damageProp(caixa, 1);
    expect(caixa.hitFlash).toBeGreaterThan(0);
  });

  it('getBlockingProps esconde o que já morreu, getNests só ninho vivo', () => {
    initProps(mapa({ c: [3, 3], b: [5, 3], N: [7, 3] }));
    const ninho = getNests()[0];
    damageProp(ninho, ninho.maxHealth);
    expect(getBlockingProps()).toHaveLength(2);
    expect(getNests()).toHaveLength(0);
  });
});

describe('props: o foguete do protect (Castelo)', () => {
  it('é lido do caractere F, com HP próprio e centro da célula', () => {
    initProps(mapa({ F: [13, 10] }));
    const foguete = getRocket()!;
    expect(foguete.kind).toBe('rocket');
    expect(foguete.maxHealth).toBe(300);
    expect(foguete.x).toBe(em(13, 10).x);
    expect(foguete.y).toBe(em(13, 10).y);
  });

  it('getRocket some quando ele cai; getAnyRocket continua achando (o HUD não troca de rótulo)', () => {
    initProps(mapa({ F: [13, 10] }));
    damageProp(getProps()[0], 9999);
    expect(getRocket()).toBeUndefined();
    expect(getAnyRocket()?.health).toBe(0);
  });

  it('o foguete não explode: a onda que o ataca não ganha explosão de graça', () => {
    initProps(mapa({ F: [13, 10] }));
    expect(getBlast(getProps()[0]).radius).toBe(0);
  });
});

describe('props: o barril explode em cadeia', () => {
  it('um barril isolado só derruba o que está no raio', () => {
    initProps(mapa({ b: [5, 3], c: [6, 3] }));  // caindo: 64px < raio
    const [barril, caixa] = getProps();
    const destruidos = detonateProp(barril);
    expect(destruidos).toContain(barril);
    expect(destruidos).toContain(caixa);
    expect(caixa.health).toBe(0);
  });

  it('a cadeia percorre a fileira inteira de barris', () => {
    // 4 barris em linha, 64px de distância: cada um entra no raio do anterior
    const cells = mapa({});
    for (const col of [5, 6, 7, 8]) cells[5][col] = 'b';
    initProps(cells);

    const barris = getProps();
    expect(barris).toHaveLength(4);
    const destruidos = detonateProp(barris[0]);
    expect(destruidos).toHaveLength(4);
    for (const b of barris) expect(b.health).toBe(0);
  });

  it('a cadeia não propaga se não encadeia: 3 células de distância não entra', () => {
    // raio de blast é 96px; 3 células = 192px, então o terceiro fica de fora
    const cells = mapa({});
    for (const col of [5, 6, 8]) cells[5][col] = 'b';
    initProps(cells);
    const barris = getProps();
    const destruidos = detonateProp(barris[0]);
    expect(destruidos).toHaveLength(2);
    expect(barris[2].health).toBeGreaterThan(0);
  });

  it('caixote não propaga: só barril tem raio', () => {
    const cells = mapa({});
    cells[5][5] = 'c';
    cells[5][6] = 'c';
    initProps(cells);
    const [caixa, vizinho] = getProps();
    const destruidos = detonateProp(caixa);
    expect(destruidos).toHaveLength(1);
    expect(vizinho.health).toBeGreaterThan(0);
  });

  it('prop já morto não explode de novo', () => {
    initProps(mapa({ b: [5, 3] }));
    const barril = getProps()[0];
    detonateProp(barril);
    expect(detonateProp(barril)).toHaveLength(1);
  });

  it('cada prop destruído aparece uma vez só', () => {
    const cells = mapa({});
    cells[5][5] = 'b'; cells[5][6] = 'b'; cells[5][7] = 'b';
    initProps(cells);
    const destruidos = detonateProp(getProps()[0]);
    expect(new Set(destruidos).size).toBe(destruidos.length);
  });

  it('só barril tem blast; caixote e ninho devolvem zero', () => {
    initProps(mapa({ c: [3, 3], b: [5, 3], N: [7, 3] }));
    const [caixa, barril, ninho] = getProps();
    expect(getBlast(barril).radius).toBeGreaterThan(0);
    expect(getBlast(barril).damage).toBeGreaterThan(0);
    expect(getBlast(caixa)).toEqual({ radius: 0, damage: 0 });
    expect(getBlast(ninho)).toEqual({ radius: 0, damage: 0 });
  });
});

describe('props: ignição e decaimento', () => {
  it('igniteBarrel só acende barril', () => {
    initProps(mapa({ c: [3, 3], b: [5, 3], N: [7, 3] }));
    const [caixa, barril, ninho] = getProps();
    igniteBarrel(caixa);
    igniteBarrel(ninho);
    expect(caixa.fuse).toBe(0);
    expect(ninho.fuse).toBe(0);
    igniteBarrel(barril);
    expect(barril.fuse).toBeGreaterThan(0);
  });

  it('igniteBarrel não reacende um pavio já aceso', () => {
    initProps(mapa({ b: [5, 3] }));
    const barril = getProps()[0];
    igniteBarrel(barril);
    const primeiro = barril.fuse;
    igniteBarrel(barril);
    expect(barril.fuse).toBe(primeiro);
  });

  it('igniteBarrel não reacende um barril morto', () => {
    initProps(mapa({ b: [5, 3] }));
    const barril = getProps()[0];
    damageProp(barril, barril.maxHealth);
    igniteBarrel(barril);
    expect(barril.fuse).toBe(0);
  });

  it('updateProps consome pavio e flash, e não passa de zero', () => {
    initProps(mapa({ b: [5, 3] }));
    const barril = getProps()[0];
    igniteBarrel(barril);
    damageProp(barril, 1);
    for (let i = 0; i < 200; i++) updateProps(0.1);
    expect(barril.fuse).toBe(0);
    expect(barril.hitFlash).toBe(0);
  });

  it('o pavio realmente demora a queimar: só expira depois de BARREL_FUSE', () => {
    // o bug antigo era `if (fuse <= 0) continue; fuse = min(fuse, 0)`, que
    // zerava o pavio e detonia no frame seguinte à ignição
    initProps(mapa({ b: [5, 3] }));
    const barril = getProps()[0];
    expect(updateProps(0.1)).toHaveLength(0);   // nunca acendeu: nada expira

    igniteBarrel(barril);
    let expirou = false;
    let frames = 0;
    for (; frames < 100; frames++) {
      const expirados = updateProps(0.1);
      if (expirados.length > 0) {
        expect(expirados).toEqual([barril]);
        expirou = true;
        break;
      }
    }
    expect(expirou, 'o pavio nunca zerou').toBe(true);
    expect(frames, 'pavio de 0.9s a 0.1s por frame').toBe(9);
    expect(barril.fuse).toBe(0);
    expect(updateProps(0.1)).toHaveLength(0);   // não expira duas vezes
  });
});

describe('props: contagem e reinicialização', () => {
  it('initProps com mapa vazio não cria nada', () => {
    initProps(mapa({}));
    expect(getProps()).toHaveLength(0);
  });

  it('clearProps limpa tudo', () => {
    initProps(mapa({ b: [5, 3], c: [6, 3] }));
    expect(getProps().length).toBeGreaterThan(0);
    clearProps();
    expect(getProps()).toHaveLength(0);
    expect(getBlockingProps()).toHaveLength(0);
  });

  it('recontar o mapa não duplica props', () => {
    initProps(mapa({ b: [5, 3], c: [6, 3] }));
    initProps(mapa({ b: [5, 3], c: [6, 3] }));
    expect(getProps()).toHaveLength(2);
  });

  it('toda prop nasce com o pavio inerte', () => {
    initProps(mapa({ b: [5, 3], c: [6, 3], N: [7, 3] }));
    for (const p of getProps()) expect(p.fuse).toBe(0);
  });
});

// O tipo precisa continuar exportado: o main.ts usa na assinatura de explodeProp

describe('props: o desmoronamento é exclusivo do entulho', () => {
  it('só a Cidade em Ruínas tem prop que desmorona com o primeiro tiro', () => {
    const comDesmoronamento = PHASES.filter(f => collapsesOnHit(f.hazard)).map(f => f.name);
    expect(comDesmoronamento).toEqual(['Cidade em Ruínas']);
  });

  it('toda fase tem props no mapa para servirem de cobertura', () => {
    // cobertura só é decisão de rota se existir; um mapa sem caixote nem barril
    // não tem cobertura nenhuma, com hazard ou não
    for (const fase of PHASES) {
      const rows = BIOMES[fase.map].rows.join('');
      const props = (rows.match(/[cb]/g) ?? []).length;
      expect(props, `${fase.name} não tem nenhum prop`).toBeGreaterThan(0);
    }
  });
});

describe('props: sprites de caixote e ninho', () => {
  it('todo tile de prop está em TILE_NUMBERS, senão não é carregado', () => {
    for (const [kind, nums] of Object.entries(PROP_SPRITES)) {
      for (const n of nums) {
        expect(TILE_NUMBERS, `tile_${n} (${kind}) fora da lista de carregamento`).toContain(n);
      }
    }
  });

  it('barril tem sprite no pacote (tiles 505-510) — substitui o desenho procedural', () => {
    expect(PROP_SPRITES.barrel).toEqual([505, 506, 507, 508, 509, 510]);
    for (const n of PROP_SPRITES.barrel) {
      expect(TILE_NUMBERS, `tile_${n} do barril não está em TILE_NUMBERS`).toContain(n);
    }
  });
});
