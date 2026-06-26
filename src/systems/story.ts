/**
 * Sistema de história e cutscenes.
 * Narração com diálogos, retratos de personagens e efeito de máquina de escrever.
 */

/** Personagens da história */
export type Character = 'narrador' | 'rios' | 'comandante' | 'cientista' | 'mensagem' | 'medico';

/** Uma fala na cutscene */
export interface DialogueLine {
  /** Quem fala */
  speaker: Character;
  /** Texto da fala */
  text: string;
  /** Opções de escolha (opcional) */
  choices?: { text: string; effect: string }[];
}

/** Uma cutscene completa */
export interface Cutscene {
  /** Título da cena */
  title: string;
  /** Cor da cena */
  color: string;
  /** Diálogos em sequência */
  lines: DialogueLine[];
}

/** Retratos dos personagens (desenhos Canvas2D) */
const PORTRAITS: Record<Character, { name: string; color: string }> = {
  narrador: { name: '', color: '#888' },
  rios: { name: 'SARGENTO RIOS', color: '#7a9a6a' },
  comandante: { name: 'COMANDANTE VALE', color: '#b07050' },
  cientista: { name: 'DRA. FERREIRA', color: '#608090' },
  mensagem: { name: 'MENSAGEM Interceptada', color: '#a08050' },
  medico: { name: 'CABO FERNANDES', color: '#9b59b6' },
};

/** Cutscenes do jogo */
export const CUTSCENES: Cutscene[] = [
  {
    title: 'PRÓLOGO',
    color: '#b07050',
    lines: [
      { speaker: 'mensagem', text: '[ TRANSMISSÃO INTERCEPTADA — 12/03/2087 ]' },
      { speaker: 'comandante', text: 'Alpha-1, aqui é Vale. Você recebeu?' },
      { speaker: 'rios', text: 'Recebi, comandante. Mas não vou gostar disso.' },
      { speaker: 'comandante', text: 'A pandemia se espalhou. 80% da população transformada.' },
      { speaker: 'comandante', text: 'Seu esquadrão foi designado para chegar ao Bunker Central.' },
      { speaker: 'rios', text: 'Meu esquadrão? Comandante, sobrou eu e o silêncio.' },
      { speaker: 'comandante', text: '...Lamento, Rios. Mas a Dra. Ferreira tem uma hipótese.' },
      { speaker: 'comandante', text: 'Se você chegar lá, pode haver uma cura. Pode.' },
      { speaker: 'rios', text: '"Pode." Ótimo. Só preciso atravessar meio mundo infestado.' },
      { speaker: 'comandante', text: 'Você é o último, Rios. Não temos outra opção.' },
      { speaker: 'rios', text: 'Entendido. Saindo agora.' },
    ],
  },
  {
    title: 'FLORESTA',
    color: '#7a9a6a',
    lines: [
      { speaker: 'narrador', text: 'A floresta ao norte da cidade. Onde tudo parou.' },
      { speaker: 'rios', text: 'Silêncio demais. Isso é pior que barulho.' },
      { speaker: 'narrador', text: 'Entre as árvores, figuras se movem. Devagar. Com fome.' },
      { speaker: 'rios', text: 'Eles... ainda usam roupas. Eram pessoas.' },
      { speaker: 'rios', text: 'Não olho para trás. Não posso.' },
      { speaker: 'narrador', text: 'Os primeiros mutantes. Fracos, mas numerosos.' },
      { speaker: 'rios', text: 'Se isso é o começo, o que vem depois?' },
    ],
  },
  {
    title: 'CAVERNA',
    color: '#608090',
    lines: [
      { speaker: 'narrador', text: 'A caverna de crystal. Ninguém volta de lá.' },
      { speaker: 'rios', text: 'Escuro total. Perfeito para morrer.' },
      { speaker: 'narrador', text: 'Brilhos estranhos nas paredes. Energia pura.' },
      { speaker: 'rios', text: 'Os morcegos... eles voam em formação. Isso não é normal.' },
      { speaker: 'narrador', text: 'Os mutantes aqui são mais rápidos. Mais inteligentes.' },
      { speaker: 'rios', text: 'Algo está dirigindo eles. Não é instinto.' },
    ],
  },
  {
    title: 'FÁBRICA',
    color: '#999',
    lines: [
      { speaker: 'rios', text: 'A BioGen Corp. Onde tudo começou.' },
      { speaker: 'narrador', text: 'Placa na entrada: "PROJETO GENESIS — NÃO AUTORIZADO."' },
      { speaker: 'rios', text: 'Genesis. Eles chamaram isso de progresso.' },
      { speaker: 'medico', text: 'Sargento! Eu sou o Cabo Fernandes. Sobrevivi ao ataque.' },
      { speaker: 'rios', text: 'Fernandes? Você era do esquadrão Beta.' },
      { speaker: 'medico', text: 'Era. Agora sou o que sobrou. Posso ajudar. Conheço a layout desta fábrica.' },
      { speaker: 'rios', text: 'Preciso dos registros do Projeto Genesis. A Dra. Ferreira precisa saber.' },
      { speaker: 'medico', text: 'Os registros estão no subsolo. Mas os robôs... eles não dormem.' },
      { speaker: 'narrador', text: 'Avançam juntos pelos corredores escuros.' },
      { speaker: 'medico', text: 'Sargento, à frente! Robô de segurança!' },
      { speaker: 'narrador', text: 'Um robô emerge das sombras. Fernandes empurra Rios para trás.' },
      { speaker: 'medico', text: 'Vai! Eu seguro eles! Pega os registros!' },
      { speaker: 'narrador', text: 'Fernandes avança contra o robô. O som de metal contra metal ecoa.' },
      { speaker: 'narrador', text: 'Quando Rios volta, Fernandes está no chão. Os olhos abertos. Sem expressão.' },
      { speaker: 'rios', text: '...Fernandes. Obrigado, cabo.' },
      { speaker: 'narrador', text: 'Rios pega os registros e segue em frente. Sozinho, de novo.' },
    ],
  },
  {
    title: 'PÂNTANO',
    color: '#5a8a7a',
    lines: [
      { speaker: 'narrador', text: 'A zona tóxica. O ar queima os pulmões.' },
      { speaker: 'rios', text: 'Cada respiração é um pedaço de mim que vai embora.' },
      { speaker: 'narrador', text: 'Slimes venenosos. Mosquitos do tamanho de cachorros.' },
      { speaker: 'rios', text: 'O pantano não quer me ver passar. Concordo com ele.' },
      { speaker: 'rios', text: 'Mas o Bunker está do outro lado. Não posso parar.' },
    ],
  },
  {
    title: 'CASTELO',
    color: '#8070a0',
    lines: [
      { speaker: 'narrador', text: 'A fortaleza. Onde os mutantes se organizam.' },
      { speaker: 'rios', text: 'Eles constuíram algo. Não é caos. É sociedade.' },
      { speaker: 'narrador', text: 'Cavaleiros de ossos guardam os portões.' },
      { speaker: 'rios', text: 'E no topo... o Rei. O primeiro mutante. O mais forte.' },
      { speaker: 'rios', text: 'Se eu passar dele, o caminho fica aberto.' },
      { speaker: 'rios', text: 'Se eu não passar... bem, pelo menos tentei.' },
    ],
  },
  {
    title: 'VULCÃO',
    color: '#b07050',
    lines: [
      { speaker: 'narrador', text: 'A zona industrial em chamas. O calor é insuportável.' },
      { speaker: 'rios', text: 'A terra treme. Não é terremoto. É raiva.' },
      { speaker: 'narrador', text: 'Elementais de fogo surgem da lava.' },
      { speaker: 'rios', text: 'O Bunker está além dessa fumaça. Eu sinto.' },
      { speaker: 'rios', text: 'Mais um passo. Só mais um.' },
    ],
  },
  {
    title: 'ESPAÇO',
    color: '#8070a0',
    lines: [
      { speaker: 'mensagem', text: '[ TRANSMISSÃO — ESTAÇÃO ORBITAL EREBUS ]' },
      { speaker: 'rios', text: 'Uma estação orbital? Como chegou aqui em cima?' },
      { speaker: 'narrador', text: 'OVNs patrulham o espaço. A Mãe-Nave espera no centro.' },
      { speaker: 'rios', text: 'Tudo que eu passei... foi pra chegar aqui.' },
      { speaker: 'rios', text: 'Vou destruir essa porra. Pela Terra. Pelos que ficaram.' },
    ],
  },
  {
    title: 'EPÍLOGO',
    color: '#a08050',
    lines: [
      { speaker: 'narrador', text: 'A Mãe-Nave caiu. Os mutantes enfraquecem.' },
      { speaker: 'comandante', text: 'Rios? RIOS! Você está aí?' },
      { speaker: 'rios', text: 'Estou... por aqui, comandante.' },
      { speaker: 'comandante', text: 'A cura está a caminho. Você conseguiu.' },
      { speaker: 'rios', text: 'Não fui só eu. Foram todos que caíram no caminho.' },
      { speaker: 'comandante', text: 'A humanidade não vai esquecer, Rios.' },
      {
        speaker: 'rios', text: 'O que você faria agora, comandante?',
        choices: [
          { text: 'Voltar para casa', effect: 'home' },
          { text: 'Ajudar a reconstruir', effect: 'rebuild' },
          { text: 'Encontrar outros sobreviventes', effect: 'search' },
        ],
      },
      { speaker: 'narrador', text: 'FIM.' },
    ],
  },
];

/** Estado da narrativa */
let currentCutsceneIndex = 0;
let currentLineIndex = 0;
let showingCutscene = false;
let cutsceneTimer = 0;
let textProgress = 0;
let lineComplete = false;
let fadeAlpha = 0;
let fadingIn = true;
let waitingForChoice = false;
let selectedChoice = -1;
let storyChoices: Record<string, string> = {};

/** Velocidade do texto (caracteres por segundo) */
const TEXT_SPEED = 18;

export function getCurrentCutscene(): Cutscene {
  return CUTSCENES[currentCutsceneIndex] || CUTSCENES[0];
}

export function getCurrentLine(): DialogueLine {
  const scene = getCurrentCutscene();
  return scene.lines[currentLineIndex] || { speaker: 'narrador', text: '' };
}

export function isShowingCutscene(): boolean {
  return showingCutscene;
}

export function isLineComplete(): boolean {
  return lineComplete;
}

export function getTextProgress(): number {
  return textProgress;
}

export function getFadeAlpha(): number {
  return fadeAlpha;
}

export function nextCutscene(): void {
  if (currentCutsceneIndex < CUTSCENES.length - 1) {
    currentCutsceneIndex++;
  }
}

export function resetStory(): void {
  currentCutsceneIndex = 0;
  currentLineIndex = 0;
  showingCutscene = false;
  cutsceneTimer = 0;
  textProgress = 0;
  lineComplete = false;
  fadeAlpha = 0;
  fadingIn = true;
}

export function showCutscene(): void {
  showingCutscene = true;
  cutsceneTimer = 0;
  currentLineIndex = 0;
  textProgress = 0;
  lineComplete = false;
  fadeAlpha = 0;
  fadingIn = true;
  waitingForChoice = false;
  selectedChoice = -1;
}

export function isWaitingForChoice(): boolean {
  return waitingForChoice;
}

export function selectChoice(index: number): void {
  if (!waitingForChoice) return;
  const line = getCurrentLine();
  if (line.choices && index < line.choices.length) {
    selectedChoice = index;
    storyChoices[`scene_${currentCutsceneIndex}_line_${currentLineIndex}`] = line.choices[index].effect;
    waitingForChoice = false;
    currentLineIndex++;
    textProgress = 0;
    lineComplete = false;
  }
}

export function getStoryChoice(key: string): string | undefined {
  return storyChoices[key];
}

export function advanceCutscene(): boolean {
  if (!showingCutscene) return false;

  if (!lineComplete) return false;

  const line = getCurrentLine();
  if (line.choices && line.choices.length > 0) {
    waitingForChoice = true;
    return false;
  }

  const scene = getCurrentCutscene();
  if (currentLineIndex < scene.lines.length - 1) {
    currentLineIndex++;
    textProgress = 0;
    lineComplete = false;
    return false;
  }

  showingCutscene = false;
  currentCutsceneIndex++;
  currentLineIndex = 0;
  return true;
}

export function skipCutsceneText(): void {
  if (!showingCutscene || lineComplete) return;
  lineComplete = true;
  textProgress = getCurrentLine().text.length;
}

export function updateCutscene(dt: number): void {
  if (!showingCutscene) return;
  cutsceneTimer += dt;

  if (fadingIn) {
    fadeAlpha = Math.min(1, fadeAlpha + dt * 2);
    if (fadeAlpha >= 1) fadingIn = false;
  }

  if (!lineComplete) {
    const line = getCurrentLine();
    textProgress = Math.min(line.text.length, textProgress + TEXT_SPEED * dt);
    if (textProgress >= line.text.length) {
      lineComplete = true;
    }
  }
}

export function getCutsceneTimer(): number {
  return cutsceneTimer;
}

export function getPortraitInfo(speaker: Character): { name: string; color: string } {
  return PORTRAITS[speaker];
}
