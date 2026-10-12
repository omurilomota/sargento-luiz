import { describe, it, expect, beforeEach } from 'vitest';
import {
  CUTSCENES, showCutscene, advanceCutscene, skipCutscene, skipCutsceneText,
  isShowingCutscene, updateCutscene, isLineComplete, isWaitingForChoice,
  selectChoice, resetStory, getCurrentLine, cutsceneForPhase,
  EPILOGUE_CUTSCENE, isEpilogueScene,
} from '../systems/story';
import { PHASES } from '../config';

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

describe('a fase final não abre o epílogo', () => {
  /**
   * Bug do jogador: a abertura da fase 9 e o EPÍLOGO eram a MESMA cena.
   *
   * `FASE_PARA_CUTSCENE[8]` e `EPILOGUE_CUTSCENE` davam 8, então quem jogava
   * lia "O MOTHERSHIP cai" ao entrar no Bunker e lia tudo de novo no fim. A
   * MOTHERSHIP é a 3ª da fila do NÚCLEO, ou seja: a linha da cena de abertura
   * falava de uma morte que ainda não tinha acontecido.
   *
   * A trava é sobre o ÍNDICE, não sobre o texto: reescrever a cena sem
   * desindexar as duas deixaria o bug voltar com outra frase.
   */
  const FASE_FINAL = PHASES.length - 1;

  it('a última fase abre uma cena própria, diferente do epílogo', () => {
    const abertura = cutsceneForPhase(FASE_FINAL);
    expect(abertura).toBeGreaterThanOrEqual(0);
    expect(abertura).not.toBe(EPILOGUE_CUTSCENE);
  });

  it('a cena de abertura da fase final não é a última da lista', () => {
    expect(cutsceneForPhase(FASE_FINAL)).toBeLessThan(CUTSCENES.length - 1);
  });

  it('o epílogo continua sendo a ÚLTIMA cena (o final depende disso)', () => {
    // `selectChoice` insere as linhas do final na cena corrente e
    // `skipCutscene` só encerra o jogo na última: se o epílogo não for o
    // último, os 3 finais somem.
    expect(EPILOGUE_CUTSCENE).toBe(CUTSCENES.length - 1);
    expect(CUTSCENES[EPILOGUE_CUTSCENE].title).toBe('EPÍLOGO');
  });

  it('cada uma das 9 fases abre uma cena, e nenhuma é o epílogo', () => {
    for (let f = 0; f < PHASES.length; f++) {
      const idx = cutsceneForPhase(f);
      expect(idx, `fase ${f} (${PHASES[f].name}) sem cena de abertura`).toBeGreaterThanOrEqual(0);
      expect(idx, `fase ${f} (${PHASES[f].name}) abre o epílogo`).not.toBe(EPILOGUE_CUTSCENE);
    }
  });

  it('a fala da MOTHERSHIP não é a primeira linha do epílogo', () => {
    // A MOTHERSIP é a 3ª da fila: ela morre NO MEIO da luta, então no roteiro
    // dela a queda vem depois do NÚCLEO parar — nunca abre a cena.
    const primeira = CUTSCENES[EPILOGUE_CUTSCENE].lines[0].text;
    expect(primeira).not.toMatch(/MOTHERSHIP cai/i);
  });

  it('isEpilogueScene só reconhece a cena do epílogo', () => {
    resetStory();
    pularPara(EPILOGUE_CUTSCENE);
    showCutscene();
    expect(isEpilogueScene()).toBe(true);
    resetStory();
    pularPara(cutsceneForPhase(FASE_FINAL));
    showCutscene();
    expect(isEpilogueScene()).toBe(false);
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
