/**
 * Sistema de história e cutscenes.
 * Narração com diálogos, retratos de personagens e efeito de máquina de escrever.
 */

import { PALETTE } from '../core/palette';

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

/** Retratos dos personagens. `sprite` é a pose do pack Kenney usada no
 * desenho da cutscene (Regra 15: visual vem de asset, nunca de código).
 * Vazio (narrador/mensagem) é entidade sem forma física — o renderer cai no
 * fallback procedural quando o asset não carregou. */
const PORTRAITS: Record<Character, { name: string; color: string; sprite: string }> = {
  narrador: { name: '', color: '#888', sprite: '' },
  rios: { name: 'SARGENTO RIOS', color: '#7a9a6a', sprite: 'survivor_hold' },
  comandante: { name: 'COMANDANTE VALE', color: '#b07050', sprite: 'soldier_hold' },
  cientista: { name: 'DRA. FERREIRA', color: '#608090', sprite: 'woman_hold' },
  mensagem: { name: 'MENSAGEM INTERCEPTADA', color: '#a08050', sprite: '' },
  medico: { name: 'CABO FERNANDES', color: PALETTE.stone, sprite: 'manBlue_hold' },
};

/**
 * Cutscenes do jogo.
 *
 * Cada bloco declara um fato concreto da fase que ele abre, para o texto
 * concordar com `PHASES` em `config.ts`. Premissa V2: Rios vai reagrupar no
 * batalhão do norte, e o Núcleo (fase 9) é a máquina que gera os zumbis — a
 * MegaCorp 2089 (trilionários) a ligou e fugiu do planeta. A cutscene não
 * repete o que o diário já conta sobre a mesma parada.
 */
export const CUTSCENES: Cutscene[] = [
  {
    title: 'PRÓLOGO',
    color: '#b07050',
    lines: [
      { speaker: 'narrador', text: 'O quartel caiu de madrugada. Rios acorda debaixo de uma viga, com o rádio chiando no bolso.' },
      { speaker: 'narrador', text: 'Sete caras do esquadrão no pátio. Nenhum se mexe. O cheiro vem antes da luz.' },
      { speaker: 'mensagem', text: '[ TRANSMISSÃO INTERCEPTADA — 12/03/2087 ]' },
      { speaker: 'comandante', text: 'Alpha-1, aqui é Vale. Se você tá me ouvindo, você é o que sobrou.' },
      { speaker: 'rios', text: 'Ouvi, comandante. Sete no pátio. Todos meus.' },
      { speaker: 'comandante', text: '...Porra. Rios, escuta. O batalhão do norte ainda marca ponto no mapa.' },
      { speaker: 'rios', text: 'O norte. Isso é atravessar o país inteiro.' },
      { speaker: 'comandante', text: 'Atravessa. É a única ordem que me resta. Chegue no outro batalhão, Rios.' },
      { speaker: 'rios', text: 'E se não tiver ninguém lá?' },
      { speaker: 'comandante', text: 'Aí você para. Me conta. Mas você vai. Vai por eles.' },
      { speaker: 'narrador', text: 'Ele cobre o rosto do mais novo com a própria farda antes de sair. A farda fica pesada de terra.' },
    ],
  },
  {
    title: 'FLORESTA',
    color: '#7a9a6a',
    lines: [
      { speaker: 'rios', text: 'Passei por essa estrada cem vezes. Levava o Joe pescar no riacho, atrás do morro.' },
      { speaker: 'narrador', text: 'A floresta começa onde o asfalto acaba. Panos de roupa presos nos galhos, na altura de um segundo andar.' },
      { speaker: 'rios', text: 'Nenhum pássaro. Nem vento. Só o meu passo voltando.' },
      { speaker: 'narrador', text: 'A casa do Joe ainda está de pé. A porta aberta, batendo devagar.' },
      { speaker: 'rios', text: 'Joe. Seu velho teimoso. Você plantou essas árvores e agora elas te enterraram.' },
      { speaker: 'narrador', text: 'Duas xícaras na mesa da cozinha. Uma virada, a bebida secou faz tempo.' },
      { speaker: 'rios', text: 'Duas xícaras. Você tava esperando alguém, Joe.' },
      { speaker: 'narrador', text: 'Movimento entre os troncos. Sempre a uns quarenta metros, sempre parando quando ele para.' },
      { speaker: 'rios', text: 'Eles ainda usam roupa. Eram gente. Gente como o Joe.' },
      { speaker: 'narrador', text: 'Ele senta na varanda e bebe da xícara virada. Não tem nada dentro. Fica assim um tempo.' },
    ],
  },
  {
    title: 'CAVERNA',
    color: '#608090',
    lines: [
      { speaker: 'rios', text: 'Arthur escavava cristal aqui. Fazia lente pra BioGen, antes de tudo.' },
      { speaker: 'narrador', text: 'A lanterna dele está no chão, virada pra parede. A luz morreu faz tempo.' },
      { speaker: 'narrador', text: 'Ele está sentado de costas pra saída, como quem esperava alguém descer pelo túnel.' },
      { speaker: 'rios', text: '...Arthur.' },
      { speaker: 'narrador', text: 'A mochila do lado está cheia. Ele tava enchendo pra levar embora. Não deu tempo.' },
      { speaker: 'rios', text: 'Treze anos. Você me trouxe aqui e falou que aqui embaixo ninguém mandava na gente.' },
      { speaker: 'narrador', text: 'Três pontos de luz pulsam no fundo, no mesmo ritmo. Não é mineral. Tá se reproduzindo.' },
      { speaker: 'rios', text: 'Você ficou com o lugar. Eu levo o crachá.' },
      { speaker: 'narrador', text: 'Guarda no bolso da farda, do lado de dentro. Do lado do peito.' },
    ],
  },
  {
    title: 'FÁBRICA',
    color: '#999',
    lines: [
      { speaker: 'rios', text: 'BioGen Corp. A placa ainda está na entrada. Alguém cuspiu no nome.' },
      { speaker: 'medico', text: 'Sargento! Eu sou o Cabo Fernandes. Do esquadrão Beta. Sobrevivi ao ataque.' },
      { speaker: 'rios', text: 'Fernandes? O comandante disse que o Beta tinha caído.' },
      { speaker: 'medico', text: 'Quase. Tranco no subsolo. Conheço a planta inteira, posso te levar.' },
      { speaker: 'rios', text: 'Fica atrás de mim, cabo. É ordem.' },
      { speaker: 'medico', text: 'Sim, senhor. ...Sargento, obrigado por vir. Pensei que ninguém vinha.' },
      { speaker: 'narrador', text: 'Um robô emerge da sombra do corredor. Fernandes empurra Rios pra dentro do vão.' },
      { speaker: 'medico', text: 'Vai! Eu seguro ele! VAI!' },
      { speaker: 'narrador', text: 'Fernandes avança. Metal contra metal. Quando Rios olha de volta, o cabo está no chão, de olhos abertos.' },
      { speaker: 'rios', text: '...Cabo. Cabo, não. Não era obrigado.' },
      { speaker: 'narrador', text: 'Rios fica olhando o painel. A porta do subsolo ainda vibra.' },
      { speaker: 'narrador', text: '---' },
      { speaker: 'rios', text: 'Fernandes.' },
      { speaker: 'narrador', text: 'Nada. Só a luz vermelha do painel, piscando.' },
    ],
  },
  {
    title: 'PÂNTANO',
    color: '#5a8a7a',
    lines: [
      { speaker: 'narrador', text: 'Névoa baixa, amarela, com cheiro de PVC. A bússola gira sem parar.' },
      { speaker: 'rios', text: 'Aqui eu não conheço nada. Nem o nome do lugar.' },
      { speaker: 'narrador', text: 'A lama sobe até o joelho depois de vinte metros. E gruda.' },
      { speaker: 'rios', text: 'Só quero sair. Só quero sair desse buraco.' },
      { speaker: 'narrador', text: 'Um corpo boia de bruços, de uniforme. O distintivo foi polido até sumir.' },
      { speaker: 'rios', text: '...Não é do meu batalhão. Não reconheço. Isso é pior.' },
      { speaker: 'narrador', text: 'A água sobe mais um palmo sem que tenha chovido.' },
      { speaker: 'rios', text: 'Esse lugar tá engolindo gente. E eu tô no meio.' },
    ],
  },
  {
    title: 'CASTELO',
    color: '#8070a0',
    lines: [
      { speaker: 'narrador', text: 'Muros de pedra, portões de ferro, torres com luz em cima. Alguém ainda acende as torres.' },
      { speaker: 'rios', text: 'Eles ergueram isso. Não é bando. É governo.' },
      { speaker: 'narrador', text: 'Os cavaleiros dos portões são montados com osso.' },
      { speaker: 'rios', text: 'Osso de gente. Dos seus. Transformaram o povo em muro.' },
      { speaker: 'narrador', text: 'Um sobrevivente aparece na ameia. A arqueira de elite não tira o olho dele.' },
      { speaker: 'rios', text: 'Tão usando ele de isca. Se eu entrar, ela atira.' },
      { speaker: 'narrador', text: 'Ele aponta pra dentro do muro. A arqueira no alto acompanha o gesto.' },
      { speaker: 'rios', text: 'Se eu deixar você aí, você morre. Já enterrei gente demais pra ficar de fora.' },
      { speaker: 'narrador', text: 'No alto dos muros, algo grande se levanta. O REI MUTANTE tava esperando.' },
    ],
  },
  {
    title: 'VULCÃO',
    color: '#b07050',
    lines: [
      { speaker: 'narrador', text: 'O calor levanta o asfalto. O concreto estala e levanta em placas.' },
      { speaker: 'rios', text: 'Se me contassem que eu ia morrer num vulcão, eu ria. E olha eu aqui.' },
      { speaker: 'narrador', text: 'A lava subiu três metros desde a última vez que ele passou.' },
      { speaker: 'rios', text: 'Minha irmã morava numa cidade quente assim. Dizia que o calor era vida.' },
      { speaker: 'rios', text: 'Não sei se ela tá viva. Não sei faz meses. E eu sigo.' },
      { speaker: 'narrador', text: 'Elementais de fogo sobem do chão junto com a brasa.' },
      { speaker: 'rios', text: 'Meu pai foi sargento. Aguentou trinta anos sem reclamar. Dizia que a gente segue por teimosia.' },
      { speaker: 'rios', text: 'Não é coragem. É teimosia. É o que me trouxe até aqui.' },
      { speaker: 'narrador', text: 'No fim do corredor, o INFERNO PRIME se levanta do magma.' },
      { speaker: 'rios', text: 'A zona fica do outro lado. Eu não limpo. Eu passo.' },
    ],
  },
  {
    title: 'ESPAÇO',
    color: '#8070a0',
    lines: [
      { speaker: 'mensagem', text: '[ TRANSMISSÃO — ESTAÇÃO ORBITAL EREBUS ]' },
      { speaker: 'rios', text: 'A placa do casco diz MONTAGEM 2079. Trinta anos em órbita e o chão ainda tá molhado.' },
      { speaker: 'narrador', text: 'Cinco discos em formação apertada. No centro, ancorada com a porta de carga aberta.' },
      { speaker: 'rios', text: 'MOTHERSHIP. A Vale usava esse nome. É ela que espalha eles pro resto do mundo.' },
      { speaker: 'rios', text: 'O núcleo faz. Ela joga longe. Enquanto ela voar, não adianta eu ter chegado.' },
      { speaker: 'narrador', text: 'Aqui não tem chão pra se cobrir. Nenhuma parede pra parar tiro.' },
      { speaker: 'rios', text: 'Joe. Arthur. Fernandes. Se vocês tão em algum lugar, olha.' },
      { speaker: 'narrador', text: 'O casco central abre a porta de carga. Não pra receber. Pra descer.' },
      { speaker: 'rios', text: 'Última esperança. Eu não posso decepcionar.' },
    ],
  },
  {
    title: 'EPÍLOGO',
    color: '#a08050',
    lines: [
      { speaker: 'narrador', text: 'O MOTHERSHIP cai. A luz do rompimento desce por quarenta minutos e depois some.' },
      { speaker: 'narrador', text: 'Onde ela estava, não sobra nada. O céu fica quieto pela primeira vez em meses.' },
      { speaker: 'narrador', text: 'Rios chega no outro batalhão. Não tem batalhão. Tem um buraco no chão e uma máquina dentro.' },
      { speaker: 'rios', text: 'O núcleo. É você. Você faz eles. Todo zumbi desse país saiu daqui.' },
      { speaker: 'narrador', text: 'A máquina pulsa. O mesmo pulso do cristal da caverna do Arthur. Só que grande.' },
      { speaker: 'narrador', text: 'Um painel pisca. Registro de compra, assinatura, data de 2071.' },
      { speaker: 'mensagem', text: '[ REGISTRO — MEGACORP 2089 — TESTES EM HUMANOS — APROVADO SEM PARECER ]' },
      { speaker: 'rios', text: 'Gente rica. Fizeram isso com o país. E a máquina não parou.' },
      { speaker: 'narrador', text: 'Outra linha. Destino. Fora da Terra.' },
      { speaker: 'mensagem', text: '[ EVACUAÇÃO DA DIRETORIA — PLANETA HABITÁVEL — COORDENADAS SELADAS ]' },
      { speaker: 'rios', text: 'A MegaCorp fugiu. Deixou a máquina ligada e foi embora do mundo.' },
      { speaker: 'narrador', text: 'Rios encosta a mão no metal. Está quente. Pulsa como coisa viva.' },
      { speaker: 'rios', text: 'Joe. Arthur. Fernandes. Eu vou desligar. Por vocês.' },
      { speaker: 'narrador', text: 'Ele acha um galpão nos fundos. Uma nave, quebrada. Dava pra consertar. Dava.' },
      { speaker: 'rios', text: 'Um dia eu alcanço vocês. Um dia.' },
      {
        speaker: 'narrador', text: 'O canal do Vale fica aberto. O silêncio do outro lado não pergunta.',
        choices: [
          { text: 'Cortar o canal. Ficar com o que sobrou.', effect: 'home' },
          { text: 'Contar tudo. Cada nome, cada rosto.', effect: 'search' },
          { text: 'Pedir mais uma missão. Ainda tem nave pra construir.', effect: 'rebuild' },
        ],
      },
      { speaker: 'narrador', text: 'FIM DA PARTE I.' },
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
/** Tempo restante do beat de silêncio (linha "---"). */
let holdingBeat = 0;
let waitingForChoice = false;
let storyChoices: Record<string, string> = {};

/** Velocidade do texto (caracteres por segundo) */
const TEXT_SPEED = 40;

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
}

/**
 * Índice da cutscene que abre a fase.
 *
 * `showCutscene()` é chamado em 2 lugares, ambos no menu, então só o PRÓLOGO
 * jogava: 62 das 69 linhas escritas eram conteúdo morto, e com elas os 3 finais
 * do epílogo. Este mapa liga cada fase à sua cena.
 *
 * Fase 0 abre o PRÓLOGO. Fase 8 (Bunker Central) não tem cena própria: é a
 * chegada, e a resolução é o EPÍLOGO, que vem depois do chefe final.
 * O índice do EPÍLOGO é o último da lista.
 */
const FASE_PARA_CUTSCENE: Record<number, number> = {
  0: 0,   // Cidade -> PRÓLOGO
  1: 1,   // Floresta
  2: 2,   // Caverna
  3: 3,   // Fábrica
  4: 4,   // Pântano
  5: 5,   // Castelo
  6: 6,   // Vulcão
  7: 7,   // Espaço
  8: 8,   // Bunker -> o EPÍLOGO fecha depois do chefe final
};

export const EPILOGUE_CUTSCENE = 8;

/** Índice da cutscene que abre a fase, ou -1 se essa fase não abre uma. */
export function cutsceneForPhase(phaseIndex: number): number {
  const idx = FASE_PARA_CUTSCENE[phaseIndex];
  return idx === undefined ? -1 : idx;
}

/**
 * Abre a cutscene de uma cena específica.
 *
 * `showCutscene()` não mexe em `currentCutsceneIndex` de propósito — ele é
 * advanced por `advanceCutscene`, e mexer aqui quebraria o prólogo.
 */
export function showCutsceneAt(index: number): void {
  currentCutsceneIndex = Math.max(0, Math.min(index, CUTSCENES.length - 1));
  showCutscene();
}

/** True quando a cena é a do epílogo (que devolve o jogador ao menu). */
export function isEpilogueScene(): boolean {
  return currentCutsceneIndex === EPILOGUE_CUTSCENE;
}

export function isWaitingForChoice(): boolean {
  return waitingForChoice;
}

export function selectChoice(index: number): void {
  if (!waitingForChoice) return;
  const line = getCurrentLine();
  if (line.choices && index < line.choices.length) {
    const effect = line.choices[index].effect;
    storyChoices[`scene_${currentCutsceneIndex}_line_${currentLineIndex}`] = effect;
    waitingForChoice = false;

    // linhas do final conforme a escolha
    const scene = getCurrentCutscene();
    const endingLines = ENDINGS[effect];
    if (endingLines) {
      const insertAt = currentLineIndex + 1;
      for (let i = endingLines.length - 1; i >= 0; i--) {
        scene.lines.splice(insertAt, 0, { speaker: 'narrador', text: endingLines[i] });
      }
    }

    currentLineIndex++;
    textProgress = 0;
    lineComplete = false;
  }
}

export function advanceCutscene(): boolean {
  if (!showingCutscene) return false;

  // ENTER tem dois estados: se a linha ainda está digitando, ele completa o
  // texto; só depois avança. Antes o guard `if (!lineComplete) return false`
  // deixava ENTER inerte durante ~5s por linha e o jogador precisava apertar
  // BACKSPACE (que só era anunciado DEPOIS da linha terminar) para destravar.
  if (!lineComplete) {
    lineComplete = true;
    textProgress = getCurrentLine().text.length;
    return false;
  }

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

/** Completa a linha atual sem avançar. */
export function skipCutsceneText(): void {
  if (!showingCutscene || lineComplete) return;
  lineComplete = true;
  textProgress = getCurrentLine().text.length;
}

/**
 * Pula a cutscene inteira.
 *
 * @returns true se isso encerrou o jogo (última cutscene)
 *
 * Não atravessa escolha pendente: pular o epílogo deixaria o jogador sem
 * final nenhum.
 */
export function skipCutscene(): boolean {
  if (!showingCutscene || waitingForChoice) return false;
  showingCutscene = false;
  currentCutsceneIndex++;
  currentLineIndex = 0;
  textProgress = 0;
  lineComplete = false;
  return true;
}

export function updateCutscene(dt: number): void {
  if (!showingCutscene) return;
  cutsceneTimer += dt;

  if (fadingIn) {
    fadeAlpha = Math.min(1, fadeAlpha + dt * 2);
    if (fadeAlpha >= 1) fadingIn = false;
  }

  // Beat de silêncio: a linha "---" segura a tela sem texto. Sem isso a morte
  // do Fernandes passou como mais uma linha de diálogo, e ela é o momento que
  // sustenta o resto da história.
  if (holdingBeat > 0) {
    holdingBeat -= dt;
    lineComplete = holdingBeat <= 0;
    return;
  }

  if (!lineComplete) {
    const line = getCurrentLine();
    if (line.text.trim() === '---') {
      holdingBeat = BEAT_SILENCIO;
      return;
    }
    textProgress = Math.min(line.text.length, textProgress + TEXT_SPEED * dt);
    if (textProgress >= line.text.length) {
      lineComplete = true;
    }
  }
}

/** Quanto tempo o beat "---" segura a tela, em segundos. */
export const BEAT_SILENCIO = 1.8;

/** Tempo restante do beat de silêncio, para o renderer poder esmaecer. */
export function getBeatRestante(): number {
  return holdingBeat;
}

export function getPortraitInfo(speaker: Character): { name: string; color: string; sprite: string } {
  return PORTRAITS[speaker];
}

const ENDINGS: Record<string, string[]> = {
  home: [
    'Rios desligou o núcleo e voltou pela estrada, sem pressa.',
    'O céu ficou quieto. Nenhum deles descia mais do alto.',
    'Ele achou a casa do Joe no caminho. A porta ainda abria. Sentou na varanda.',
    'Duas xícaras. Dessa vez ele encheu as duas.',
  ],
  rebuild: [
    'Rios ficou no buraco onde estava o batalhão. Não tinha mais ninguém.',
    'Ele começou a juntar as peças da nave. Sem pressa. Peça por peça.',
    'A nave não voa, mas o casco segura o vento. Dá pra dormir dentro.',
    'O rádio chia na 4.7. Ele deixa ligado, por via das dúvidas.',
  ],
  search: [
    'Rios seguiu sozinho, atrás de boato de gente.',
    'Meses depois achou um acampamento: doze almas que não desistiam.',
    'Ele contou da MegaCorp 2089. Cada nome, cada rosto que perdeu.',
    'A nave quebrada ainda está no galpão. Quando tiver peça, eles vão atrás deles.',
  ],
};
