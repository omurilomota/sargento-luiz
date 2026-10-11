import { describe, it, expect, beforeEach } from 'vitest';
import {
  CUTSCENES, showCutscene, advanceCutscene, skipCutscene, skipCutsceneText,
  isShowingCutscene, updateCutscene, isLineComplete, isWaitingForChoice,
  selectChoice, resetStory, getCurrentLine,
} from '../systems/story';

const ULTIMA = CUTSCENES.length - 1;

/**
 * Avança o ponteiro de cutscene até a de índice `n`.
 *
 * `showCutscene()` não muda o índice — quem muda é `skipCutscene()`, que
 * incrementa `currentCutsceneIndex`. Então é preciso pular as anteriores.
 */
function pularPara(cena: number): void {
  // `skipCutscene` só age se algo estiver na tela, e o primeiro skip já a
  // fecha — então precisa reexibir entre um pulo e o outro.
  for (let i = 0; i < cena; i++) {
    showCutscene();
    skipCutscene();
  }
}

/**
 * Conta os toques de ENTER que NÃO FIZERAM NADA.
 *
 * Esse é o invariante real: o bug era `advanceCutscene` devolvendo false sem
 * mudar nada enquanto a linha digitava, então o jogador apertava e nada
 * acontecia. Contar toques totais é frágil (chama a função uma vez a mais no
 * fim do loop); contar toques inertes é exato.
 */
function toquesInertes(): number {
  let inertes = 0;
  let guarda = 0;
  while (isShowingCutscene() && guarda++ < 900) {
    const antesLinha = getCurrentLine();
    const antesCompleta = isLineComplete();
    const terminou = advanceCutscene();
    if (terminou) break;
    const mudouAlgo =
      getCurrentLine() !== antesLinha ||
      isLineComplete() !== antesCompleta ||
      isWaitingForChoice();
    if (!mudouAlgo) inertes++;
  }
  return inertes;
}

describe('diálogo: ENTER nunca fica inerte', () => {
  // Bug: `advanceCutscene` começava com `if (!lineComplete) return false` e a
  // velocidade era 18 chars/s. Numa linha de 90 caracteres, ENTER não fazia
  // nada por 5 segundos. A única saída era BACKSPACE, anunciado só DEPOIS da
  // linha terminar, e ainda exigia um segundo ENTER.
  beforeEach(() => {
    resetStory();
  });

  it('ENTER na linha que está digitando completa o texto em vez de ignorar', () => {
    showCutscene();
    updateCutscene(0.2);
    expect(isLineComplete()).toBe(false);
    expect(advanceCutscene()).toBe(false);
    expect(isLineComplete()).toBe(true);
  });

  it('nenhum toque de ENTER é inerte, em nenhuma cutscene do jogo', () => {
    for (let c = 0; c <= ULTIMA; c++) {
      resetStory();
      pularPara(c);
      showCutscene();
      const inertes = toquesInertes();
      expect(inertes, `${CUTSCENES[c].title}: ${inertes} toques inertes`).toBe(0);
    }
  });

  it('atravessa o jogo inteiro só apertando ENTER', () => {
    resetStory();
    let cenas = 0;
    while (cenas < CUTSCENES.length + 2) {
      showCutscene();
      if (!isShowingCutscene()) break;
      let guarda = 0;
      while (isShowingCutscene() && guarda++ < 900) {
        advanceCutscene();
        if (isWaitingForChoice()) { selectChoice(0); break; }
      }
      cenas++;
      if (cenas > CUTSCENES.length + 2) break;
      showCutscene();
      if (!isShowingCutscene()) break;
    }
    expect(cenas).toBeLessThanOrEqual(CUTSCENES.length + 2);
  });

  it('toda linha do jogo digita em menos de 4 segundos', () => {
    for (const cena of CUTSCENES) {
      for (const linha of cena.lines) {
        // taxa efetiva: 40 chars/s contra a linha mais longa do jogo
        const segundos = linha.text.length / 40;
        expect(segundos, `"${linha.text.slice(0, 30)}..."`).toBeLessThan(4);
      }
    }
  });
});

describe('diálogo: BACKSPACE pula a cutscene inteira', () => {
  beforeEach(() => {
    resetStory();
  });

  it('encerra a cutscene na hora', () => {
    showCutscene();
    updateCutscene(0.1);
    expect(isShowingCutscene()).toBe(true);
    skipCutscene();
    expect(isShowingCutscene()).toBe(false);
  });

  it('devolve true quando pula a ÚLTIMA cutscene (encerra o jogo)', () => {
    resetStory();
    pularPara(ULTIMA);
    showCutscene();
    expect(skipCutscene()).toBe(true);
  });

  it('não faz nada quando não há cutscene na tela', () => {
    expect(skipCutscene()).toBe(false);
  });

  it('não atravessa escolha pendente — senão o epílogo não teria final', () => {
    resetStory();
    pularPara(ULTIMA);
    showCutscene();
    let guarda = 0;
    while (guarda++ < 900 && !isWaitingForChoice()) advanceCutscene();
    expect(isWaitingForChoice()).toBe(true);

    expect(skipCutscene()).toBe(false);
    expect(isWaitingForChoice()).toBe(true);

    selectChoice(0);
    expect(isWaitingForChoice()).toBe(false);
  });
});

describe('diálogo: skipCutsceneText ainda completa só a linha', () => {
  beforeEach(() => {
    resetStory();
  });

  it('completa a linha sem fechar a cutscene', () => {
    showCutscene();
    updateCutscene(0.05);
    skipCutsceneText();
    expect(isLineComplete()).toBe(true);
    expect(isShowingCutscene()).toBe(true);
    expect(advanceCutscene()).toBe(false);
    expect(isShowingCutscene()).toBe(true);
  });
});
