/**
 * Sistema de história e cutscenes.
 * Gerencia a narrativa pós-apocalíptica do jogo.
 */

/** Dados de uma cutscene */
export interface Cutscene {
  /** Título da cutscene */
  title: string;
  /** Texto narrativo */
  text: string;
  /** Cor de destaque */
  color: string;
}

/** Cutscenes entre fases */
export const CUTSCENES: Cutscene[] = [
  {
    title: 'PRÓLOGO',
    text: '2087. Uma pandemia transformou 80% da humanidade em mutantes.\n\nVocê é o Sargento Rios, último sobrevivente do esquadrão Alpha.\nSua missão: atravessar os territórios infestados até o Bunker Central.\nLá, cientistas trabalham na cura.\n\nMas antes... você precisa sobreviver.',
    color: '#e74c3c',
  },
  {
    title: 'FLORESTA',
    text: 'A floresta silenciosa... mas não vazia.\n\nOs primeiros mutantes aparecem entre as árvores.\nEles eram humanos, uma vez.\nAgora são apenas fome e raiva.\n\nVocê avança. Não há volta.',
    color: '#2ecc71',
  },
  {
    title: 'CAVERNA',
    text: 'No escuro, eles são mais rápidos.\n\nA caverna ecoa com sons estranhos.\nMorcegos mutados voam nas trevas.\nKrystals brilham com energia estranha.\n\nContinue. O Bunker não está longe.',
    color: '#3498db',
  },
  {
    title: 'FÁBRICA',
    text: 'A fábrica abandonada... onde tudo começou.\n\nOs primeiros experimentos foram aqui.\nRobôs de segurança foram contaminados.\nAgora patrulham os corredores,\nprotegendo segredos que deveriam ter sido enterrados.',
    color: '#7f8c8d',
  },
  {
    title: 'PÂNTANO',
    text: 'A zona tóxica. Nada sobrevive aqui.\n\nMas os mutantes se adaptaram.\nSlimes venenosos, mosquitos gigantes,\nfrog que escaldam com toque.\n\nO ar é pesado. Cada respiração custa.',
    color: '#1abc9c',
  },
  {
    title: 'CASTELO',
    text: 'A fortaleza dos mutantes.\n\nCavaleiros de ossos, arqueiros mortos,\nmagos que comandam exércitos.\nE no topo... o Rei.\n\nDerrote-o para avançar.',
    color: '#9b59b6',
  },
  {
    title: 'VULCÃO',
    text: 'A zona industrial em chamas.\n\nElementais de fogo, golems de magma,\na própria terra queima sob seus pés.\n\nO Bunker está além desta fumaça.\nSegure a respiração.',
    color: '#e74c3c',
  },
  {
    title: 'ESPAÇO',
    text: 'A estação orbital. Último obstáculo.\n\nOVNs patrulham, alienígenas invadem,\na Mãe-Nave espera no centro.\n\nDestrua-a. Salve a humanidade.',
    color: '#8e44ad',
  },
  {
    title: 'EPÍLOGO',
    text: 'A Mãe-Nave caiu.\n\nOs mutantes começam a enfraquecer.\nA cura está próxima.\n\nVocê fez o impossível, Sargento Rios.\nA humanidade sobreviverá.\n\nObrigado por jogar.',
    color: '#f1c40f',
  },
];

/** Estado da narrativa atual */
let currentCutsceneIndex = 0;
let showingCutscene = false;
let cutsceneTimer = 0;

/**
 * Retorna a cutscene atual.
 */
export function getCurrentCutscene(): Cutscene {
  return CUTSCENES[currentCutsceneIndex] || CUTSCENES[0];
}

/**
 * Verifica se está mostrando cutscene.
 */
export function isShowingCutscene(): boolean {
  return showingCutscene;
}

/**
 * Avança para próxima cutscene.
 */
export function nextCutscene(): void {
  if (currentCutsceneIndex < CUTSCENES.length - 1) {
    currentCutsceneIndex++;
  }
}

/**
 * Reseta para primeira cutscene.
 */
export function resetStory(): void {
  currentCutsceneIndex = 0;
  showingCutscene = false;
  cutsceneTimer = 0;
}

/**
 * Mostra uma cutscene.
 */
export function showCutscene(): void {
  showingCutscene = true;
  cutsceneTimer = 0;
}

/**
 * Esconde a cutscene atual.
 */
export function hideCutscene(): void {
  showingCutscene = false;
  currentCutsceneIndex++;
}

/**
 * Atualiza o timer da cutscene.
 */
export function updateCutscene(dt: number): void {
  if (showingCutscene) {
    cutsceneTimer += dt;
  }
}

/**
 * Retorna o timer da cutscene.
 */
export function getCutsceneTimer(): number {
  return cutsceneTimer;
}
