import { describe, it, expect } from 'vitest';
import { getHudCenterLayout, getHudHintsLayout } from '../ui/hud';

/**
 * Distância do baseline até o topo VISÍVEL do texto.
 *
 * Não é a altura da fonte: o canvas mede a caixa da fonte, mas o que aparece é
 * a altura de caixa alta (caps e dígitos não têm descida), ~0.72em. Medir pela
 * altura cheia dava folga falsa e reprovava layout correto.
 */
function capHeight(px: number): number {
  return Math.ceil(px * 0.72);
}

/** Altura de fonte de cada elemento da coluna central. */
const F = {
  phase: capHeight(14),
  waveLabel: capHeight(13),
  score: capHeight(16),
  combo: capHeight(13),
  objective: capHeight(13),
  detail: capHeight(12),
};

describe('getHudCenterLayout: nenhum elemento invade o seguinte', () => {
  // Bug real: o score era desenhado em `waveBarY + 26` e o rótulo de onda em
  // `waveBarY + 18`. O topo dos dígitos do score ficava 3px acima do fim do
  // "ONDA x/y". Como as duas posições são absolutas, o overlap era constante.
  for (const hasCombo of [false, true]) {
    it(`score não invade o rótulo de onda (combo=${hasCombo})`, () => {
      const L = getHudCenterLayout(hasCombo);
      expect(L.scoreY - F.score).toBeGreaterThanOrEqual(L.waveLabelY);
    });

    it(`rótulo de onda não invade a barra (combo=${hasCombo})`, () => {
      const L = getHudCenterLayout(hasCombo);
      expect(L.waveLabelY - F.waveLabel).toBeGreaterThanOrEqual(L.waveBarY + 6);
    });

    it(`fase não invade a barra de onda (combo=${hasCombo})`, () => {
      const L = getHudCenterLayout(hasCombo);
      expect(L.waveBarY - 6).toBeGreaterThanOrEqual(L.phaseY);
    });

    it(`detalhe do objetivo não invade o rótulo (combo=${hasCombo})`, () => {
      const L = getHudCenterLayout(hasCombo);
      expect(L.objectiveDetailY - F.detail).toBeGreaterThanOrEqual(L.objectiveY + 4);
    });

    it(`barra de boss começa abaixo de tudo (combo=${hasCombo})`, () => {
      const L = getHudCenterLayout(hasCombo);
      expect(L.nextY).toBeGreaterThanOrEqual(L.objectiveDetailY);
    });

    it(`tudo começa dentro da tela (combo=${hasCombo})`, () => {
      const L = getHudCenterLayout(hasCombo);
      expect(L.phaseY - F.phase).toBeGreaterThanOrEqual(0);
    });
  }

  it('sem combo não existe linha de combo nem barra', () => {
    const L = getHudCenterLayout(false);
    expect(L.comboY).toBeNull();
    expect(L.comboBarY).toBeNull();
  });

  it('com combo existe, e a barra não invade o rótulo do objetivo', () => {
    const L = getHudCenterLayout(true);
    expect(L.comboY).not.toBeNull();
    expect(L.comboBarY).not.toBeNull();
    expect(L.objectiveY - F.objective).toBeGreaterThanOrEqual(L.comboBarY! + 3);
  });

  it('o objetivo desce quando o combo existe, nunca sobe', () => {
    const semCombo = getHudCenterLayout(false);
    const comCombo = getHudCenterLayout(true);
    expect(comCombo.objectiveY).toBeGreaterThan(semCombo.objectiveY);
    expect(comCombo.nextY).toBeGreaterThan(semCombo.nextY);
  });
});

describe('getHudHintsLayout: a barra de XP não invade a vida nem as skills', () => {
  // A barra de XP entrou entre o número de vida (baseline INSET+28) e as
  // skills. Sem geometria compartilhada ela voltaria a imprimir "100/100",
  // "NV 3" e "SPC F E" um por cima do outro — o mesmo bug da coluna central.
  const F = { hp: capHeight(13), xpLabel: capHeight(11), skillName: capHeight(11) };

  it('barra de XP fica abaixo do número de vida', () => {
    const L = getHudHintsLayout();
    const hpBaseline = 10 + 12 + 16; // INSET + segH + 16, igual ao drawTopLeft
    expect(L.xpBarY).toBeGreaterThanOrEqual(hpBaseline - F.hp + 4);
  });

  it('rótulo NV cabe entre a vida e as skills (ao lado da barra, não sobre ela)', () => {
    const L = getHudHintsLayout();
    const hpBaseline = 10 + 12 + 16;
    // o rótulo é desenhado em x e a barra em x+40: eles dividem a MESMA linha,
    // então a restrição é com a vida acima e com as skills abaixo
    expect(L.xpLabelY - F.xpLabel).toBeGreaterThanOrEqual(hpBaseline);
    expect(L.skillY).toBeGreaterThanOrEqual(L.xpLabelY);
  });

  it('skills e dicas seguem sem sobrepor', () => {
    const L = getHudHintsLayout();
    expect(L.skillLabelY - F.skillName).toBeGreaterThanOrEqual(L.skillY + 22);
    expect(L.hintsY - F.skillName).toBeGreaterThanOrEqual(L.skillLabelY);
  });
});
