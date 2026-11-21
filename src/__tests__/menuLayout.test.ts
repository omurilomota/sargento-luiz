import { describe, it, expect } from 'vitest';
import { getMenuLayout, getMenuFooterLayout, getMenuFooterTop, menuIndexAt } from '../systems/renderer';
import { GAME_MODES } from '../systems/gameModes';

const SIZES: [number, number][] = [
  [1920, 1080],
  [1280, 720],
  [1024, 600],
  [800, 480],
];

/** Altura aproximada da linha acima do baseline, por fonte. */
function alturaDaFonte(fonte: string): number {
  return parseInt(fonte, 10);
}

describe('getMenuLayout: hitbox do menu = layout desenhado', () => {
  it('cria um item por modo real do jogo', () => {
    for (const [w, h] of SIZES) {
      expect(getMenuLayout(w, h).items).toHaveLength(GAME_MODES.length);
    }
  });

  it('os itens não se sobrepõem', () => {
    for (const [w, h] of SIZES) {
      const { items } = getMenuLayout(w, h);
      for (let i = 1; i < items.length; i++) {
        expect(items[i].y).toBeGreaterThanOrEqual(items[i - 1].y + items[i - 1].h);
      }
    }
  });

  it('tudo cabe na tela, inclusive em 800x480', () => {
    for (const [w, h] of SIZES) {
      const { items } = getMenuLayout(w, h);
      for (const r of items) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(w);
        expect(r.y + r.h).toBeLessThanOrEqual(h);
      }
    }
  });

  it('o centro de cada item devolve o índice certo (bug B2)', () => {
    for (const [w, h] of SIZES) {
      const { items } = getMenuLayout(w, h);
      items.forEach((r, i) => {
        expect(menuIndexAt(r.x + r.w / 2, r.y + r.h / 2, w, h)).toBe(i);
      });
    }
  });

  it('clicar fora dos itens devolve -1', () => {
    expect(menuIndexAt(5, 5, 1280, 720)).toBe(-1);
    expect(menuIndexAt(1275, 715, 1280, 720)).toBe(-1);
  });

  it('o vão entre dois itens não seleciona nenhum modo', () => {
    const w = 1280;
    const h = 720;
    const { items } = getMenuLayout(w, h);
    const a = items[1];
    const b = items[2];
    const gapY = a.y + a.h + (b.y - (a.y + a.h)) / 2;
    expect(menuIndexAt(a.x + 10, gapY, w, h)).toBe(-1);
  });

  it('o título fica acima da lista de modos', () => {
    for (const [w, h] of SIZES) {
      const L = getMenuLayout(w, h);
      expect(L.titleY).toBeLessThan(L.items[0].y);
    }
  });
});

describe('rodapé do menu: as linhas não se sobrepõem', () => {
  // Bug real: as linhas de controle avançavam 14px a partir de h*0.88 e o aviso
  // de save era desenhado em h*0.94 - 18. O vão real é h*0.06, e em 720p o
  // "V: Créditos" (y=675.6) caía ACIMA do "C: Continuar jogo salvo" (y=658.8).
  for (const [w, h] of SIZES) {
    for (const temSave of [false, true]) {
      it(`linhas separadas e em ordem em ${w}x${h} (save=${temSave})`, () => {
        const linhas = getMenuFooterLayout(h, temSave);
        expect(linhas.length).toBe(temSave ? 6 : 5);
        for (let i = 1; i < linhas.length; i++) {
          const acima = linhas[i - 1];
          const abaixo = linhas[i];
          // a de baixo precisa começar depois de a de cima terminar
          expect(abaixo.y - alturaDaFonte(acima.fonte)).toBeGreaterThanOrEqual(acima.y);
          expect(abaixo.y).toBeGreaterThan(acima.y);
        }
      });

      it(`limpa o crédito de licença em ${w}x${h} (save=${temSave})`, () => {
        const linhas = getMenuFooterLayout(h, temSave);
        const ultima = linhas[linhas.length - 1];
        expect(ultima.y).toBeLessThan(h - 12);
      });
    }
  }

  it('o aviso de save só aparece quando existe save', () => {
    const comSave = getMenuFooterLayout(1080, true).map(l => l.texto);
    const semSave = getMenuFooterLayout(1080, false).map(l => l.texto);
    expect(comSave).toContain('C: Continuar jogo salvo');
    expect(semSave).not.toContain('C: Continuar jogo salvo');
  });

  it('a row de configurações some quando não cabe acima do rodapé', () => {
    for (const [w, h] of SIZES) {
      const L = getMenuLayout(w, h);
      if (L.settingsRow) {
        expect(L.settingsRow.y + L.settingsRow.h).toBeLessThanOrEqual(getMenuFooterTop(h, false));
      }
    }
  });

  it('em 720p com save o rodapé ainda cabe inteiro na tela', () => {
    const topo = getMenuFooterTop(720, true);
    expect(topo).toBeGreaterThan(0);
    const linhas = getMenuFooterLayout(720, true);
    const ultima = linhas[linhas.length - 1];
    expect(ultima.y).toBeLessThan(720 - 12);
  });
});
