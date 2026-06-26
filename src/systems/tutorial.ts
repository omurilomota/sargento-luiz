/**
 * Sistema de tutorial interativo.
 * Mostra dicas durante a primeira fase para novos jogadores.
 */

/** Dica do tutorial */
interface TutorialHint {
  /** Texto da dica */
  text: string;
  /** Tecla associada */
  key: string;
  /** Condição para mostrar (true = mostrar) */
  condition: () => boolean;
  /** Se já foi mostrada */
  shown: boolean;
}

/** Dicas do tutorial */
const hints: TutorialHint[] = [
  { text: 'WASD para mover', key: 'WASD', condition: () => true, shown: false },
  { text: 'Mouse para mirar, Click para atirar', key: 'MOUSE', condition: () => true, shown: false },
  { text: 'R para recarregar', key: 'R', condition: () => true, shown: false },
  { text: 'Espaço: Dash (esquiva rápida)', key: 'SPACE', condition: () => true, shown: false },
  { text: 'F: Escudo (bloqueia dano)', key: 'F', condition: () => true, shown: false },
  { text: 'E: Fúria (dano 2x)', key: 'E', condition: () => true, shown: false },
];

/** Se o tutorial está ativo */
let tutorialActive = false;
/** Índice da dica atual */
let currentHint = 0;
/** Timer para mostrar a próxima dica */
let hintTimer = 0;

/**
 * Ativa o tutorial.
 */
export function startTutorial(): void {
  tutorialActive = true;
  currentHint = 0;
  hintTimer = 2;
  for (const h of hints) h.shown = false;
}

/**
 * Desativa o tutorial.
 */
export function endTutorial(): void {
  tutorialActive = false;
}

/**
 * Verifica se o tutorial está ativo.
 */
export function isTutorialActive(): boolean {
  return tutorialActive;
}

/**
 * Retorna a dica atual.
 */
export function getCurrentHint(): TutorialHint | null {
  if (!tutorialActive || currentHint >= hints.length) return null;
  return hints[currentHint];
}

/**
 * Avança para a próxima dica.
 */
export function advanceHint(): void {
  if (currentHint < hints.length) {
    hints[currentHint].shown = true;
    currentHint++;
    hintTimer = 3;
  }
  if (currentHint >= hints.length) {
    tutorialActive = false;
  }
}

/**
 * Atualiza o timer do tutorial.
 * @param dt - delta time
 */
export function updateTutorial(dt: number): void {
  if (!tutorialActive) return;
  hintTimer -= dt;
  if (hintTimer <= 0 && currentHint < hints.length) {
    hints[currentHint].shown = true;
    currentHint++;
    hintTimer = 4;
  }
  if (currentHint >= hints.length) {
    tutorialActive = false;
  }
}
