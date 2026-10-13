/**
 * Sistema de história e cutscenes.
 * Narração com diálogos, retratos de personagens e efeito de máquina de escrever.
 */

import { PALETTE } from '../core/palette';

/** Personagens da história */
export type Character = 'narrador' | 'rios' | 'comandante' | 'cientista' | 'mensagem' | 'medico' | 'bot' | 'viajante';

/** Uma fala na cutscene */
export interface DialogueLine {
  /** Quem fala */
  speaker: Character;
  /** Texto da fala */
  text: string;
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
  bot: { name: 'BOT #89', color: PALETTE.stone, sprite: 'robot_hold' },
  viajante: { name: 'VIAJANTE #23', color: '#a08050', sprite: 'manOld_hold' },
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
      { speaker: 'narrador', text: 'Mais pro fundo tem uma cabana que ninguém visitava. Os meninos falavam que era de bruxa.' },
      { speaker: 'rios', text: 'O Joe jurava que era mentira. Certeza que era mentira. Ele é que não deixava ninguém chegar perto.' },
      { speaker: 'rios', text: 'As trilhas daqui não levavam a nada. A gente seguia do mesmo jeito, atrás do riacho.' },
      { speaker: 'rios', text: 'O balanço dele ainda tá pendurado na árvore. Criança criava mundo do nada aqui. Agora só tem zumbis.' },
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
      { speaker: 'rios', text: 'Os zumbis estão evoluindo rapidamente. O Arthur tava aqui embaixo quando isso começou.' },
      { speaker: 'narrador', text: 'Grr… vem do túnel de baixo. Perto.' },
      { speaker: 'rios', text: 'Você ficou com o lugar. Eu levo o crachá.' },
      { speaker: 'narrador', text: 'Guarda no bolso da farda, do lado de dentro. Do lado do peito.' },
    ],
  },
  {
    title: 'FÁBRICA',
    color: '#999',
    lines: [
      { speaker: 'rios', text: 'BioGen Corp. A placa ainda está na entrada. Alguém cuspiu no nome.' },
      { speaker: 'narrador', text: 'Linha de montagem parada. O braço da máquina segura uma peça pela metade.' },
      { speaker: 'rios', text: 'Pararam no meio do turno. Ninguém sai no meio do turno por bem.' },
      { speaker: 'narrador', text: 'No fim do corredor, uma escada desce. O ar que sobe é quente, com cheiro de remédio.' },
      { speaker: 'narrador', text: 'Tem alguma coisa no subsolo. Não é motor. Motor não bate assim.' },
      { speaker: 'rios', text: 'Ouvi. Já vou descer.' },
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
      { speaker: 'rios', text: 'Nada mais me surpreende. Daqui a pouco estão saindo do chão.' },
      { speaker: 'narrador', text: 'A lama estala e cede meio palmo sob a bota. O barulho vem antes do tombo.' },
      { speaker: 'rios', text: 'Ohoa…! Quase engoliu a bota junto.' },
      { speaker: 'rios', text: 'Tenho que tomar cuidado com o que falo nesse lugar.' },
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
      { speaker: 'narrador', text: 'Na ameia, um vivo. Farda de batalhão. A arqueira no alto não tira o olho dele.' },
      { speaker: 'medico', text: 'Sargento! Cabo Fernandes, esquadrão Beta. Sobrevivi ao ataque e me tranquei aqui dentro.' },
      { speaker: 'rios', text: 'Fernandes? O comandante enterrou o Beta inteiro no relatório.' },
      { speaker: 'medico', text: 'Quase, senhor. Conheço as galerias. Posso te levar ao topo.' },
      { speaker: 'medico', text: 'De acordo com a coordenada daquela cápsula, o antigo abrigo deles era aqui.' },
      { speaker: 'medico', text: 'E tem mais: no pátio interno tem um foguete de pé. O rei guarda ele como troféu. É a saída daqui.' },
      { speaker: 'rios', text: 'Então o foguete fica inteiro. Quem encostar nele encontra comigo.' },
      { speaker: 'rios', text: 'Fica atrás de mim, cabo. É ordem.' },
      { speaker: 'medico', text: 'Sim, senhor. ...Obrigado por vir. Pensei que ninguém vinha.' },
      { speaker: 'narrador', text: 'O portão do pátio range sozinho. Um cavaleiro de quatro metros desce da ameia, espada de osso em riste.' },
      { speaker: 'medico', text: 'Vai, senhor! Eu seguro ele! VAI!' },
      { speaker: 'narrador', text: 'Fernandes avança. Metal contra osso. Quando Rios olha de volta, o cabo está junto ao portão, de olhos abertos.' },
      { speaker: 'rios', text: '...Cabo. Cabo, não. Não era obrigado.' },
      { speaker: 'narrador', text: 'Rios fica olhando o portão. Ele ainda treme nas dobradiças.' },
      { speaker: 'narrador', text: '---' },
      { speaker: 'rios', text: 'Fernandes.' },
      { speaker: 'narrador', text: 'Nada. Hoje ninguém reacende as torres.' },
      { speaker: 'narrador', text: 'No muro principal, algo grande se levanta. O REI MUTANTE tava esperando.' },
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
      { speaker: 'rios', text: 'Continua em frente, pra manter o legado. É o que ele deixou pra eu fazer.' },
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
      { speaker: 'bot', text: 'INIMIGO DETECTADO! ATIRAR PROJÉTEIS.' },
      { speaker: 'rios', text: 'Não tão antes que eu já estou aqui!' },
      { speaker: 'narrador', text: 'A primeira salva raspa o casco. A explosão de trás joga Rios contra a parede do corredor.' },
      { speaker: 'rios', text: 'Joe. Arthur. Fernandes. Se vocês tão em algum lugar, olha.' },
      { speaker: 'narrador', text: 'O casco central abre a porta de carga. Não pra receber. Pra descer.' },
      { speaker: 'rios', text: 'Última esperança. Eu não posso decepcionar.' },
    ],
  },
  {
    title: 'NÚCLEO-CENTRAL',
    color: '#8b4040',
    lines: [
      { speaker: 'narrador', text: 'O pátio do batalhão do norte está vazio. As tendas continuam montadas.' },
      { speaker: 'rios', text: 'Vale. Tô chegando. Quantos?' },
      { speaker: 'narrador', text: 'O rádio devolve estática. Ninguém responde.' },
      { speaker: 'narrador', text: 'No centro do pátio, uma cratera de doze metros. A borda está vítrea.' },
      { speaker: 'narrador', text: 'No fundo, a máquina. Quatro andares de metal pulsando.' },
      { speaker: 'narrador', text: 'O mesmo pulso do cristal que o Arthur carregava na mochila.' },
      { speaker: 'mensagem', text: '[ FONTE LOCAL — O PAINEL DA MÁQUINA ]' },
      { speaker: 'mensagem', text: 'Você vai ver só seus trilionários. Vocês estão fudidos.' },
      { speaker: 'rios', text: 'Eles pilharam o país e fugiram. A máquina ficou ligada.' },
      { speaker: 'narrador', text: 'Um homem sai do galpão pela porta dos fundos. Mochila de viajante, crachá número vinte e três.' },
      { speaker: 'viajante', text: 'Calma, sargento. Eu entrei pela porta dos fundos, como todo mundo que ainda vive por aqui.' },
      { speaker: 'viajante', text: 'Tem um traje de contenção aí e um martelo. O martelo é AI-ON. Os dois foram deixados de propósito.' },
      { speaker: 'rios', text: 'E você? Quem te mandou?' },
      { speaker: 'viajante', text: 'Ninguém me manda desde 2087. Vai primeiro, sargento. Eu fecho a porta.' },
      { speaker: 'mensagem', text: '[ NÚCLEO — INTRUSO AVISTADO! MODO NEUTRALIZADOR ATIVO ]' },
      { speaker: 'rios', text: 'Então é aqui. É tudo que sobrou.' },
    ],
  },
  {
    title: 'EPÍLOGO',
    color: '#a08050',
    lines: [
      { speaker: 'narrador', text: 'O NÚCLEO para de pulsar. O metal esfria de fora pra dentro e leva quatro minutos.' },
      { speaker: 'mensagem', text: '[ INSTABILIDADE REGISTRADA… MODO CRÍ-CRÍ-CRÍ-TICOOOOO ]' },
      { speaker: 'narrador', text: 'A risada sai do painel antes do silêncio. Metálica, curta, sem dono nenhum.' },
      { speaker: 'mensagem', text: '[ OS RESPONSÁVEIS AINDA PRECISAM TER UMA CONVERSA COMIGO ]' },
      { speaker: 'narrador', text: 'O MOTHERSHIP cai a três quilômetros dali. A luz do rompimento desce por quarenta minutos e depois some.' },
      { speaker: 'narrador', text: 'O céu fica quieto. É a primeira noite limpa desde que o quartel caiu.' },
      { speaker: 'narrador', text: 'Rios abre o painel de manutenção. O registro continua na tela.' },
      { speaker: 'mensagem', text: '[ REGISTRO — MEGACORP 2089 — TESTES EM HUMANOS — APROVADO SEM PARECER ]' },
      { speaker: 'rios', text: 'Gente rica. Rodaram o país inteiro e não ficaram pra ver o resultado.' },
      { speaker: 'narrador', text: 'Outra linha no painel. Destino. Fora da Terra.' },
      { speaker: 'mensagem', text: '[ EVACUAÇÃO DA DIRETORIA — PLANETA HABITÁVEL — COORDENADAS SELADAS ]' },
      { speaker: 'rios', text: 'Eles pilharam a Terra e venderam a máquina. Depois fugiram do mundo.' },
      { speaker: 'narrador', text: 'Rios encosta a mão no metal. Ainda morno.' },
      { speaker: 'rios', text: 'Joe. Arthur. Fernandes. Eu desliguei. Por vocês.' },
      { speaker: 'narrador', text: 'Ele acha um galpão nos fundos. Uma nave quebrada. Dava pra consertar. Dava.' },
      { speaker: 'rios', text: 'Um dia eu alcanço vocês. Um dia.' },
      { speaker: 'narrador', text: 'O canal do Vale fica aberto. O silêncio do outro lado não pergunta.' },
      { speaker: 'narrador', text: 'Rios desce a rampa com o registro no bolso e o Bunker nas costas.' },
      { speaker: 'narrador', text: 'A jornada passa na cabeça dele enquanto anda.' },
      { speaker: 'narrador', text: 'O quartel da Cidade, que caiu primeiro. A cabana do Joe na Floresta, com o balanço parado na varanda.' },
      { speaker: 'narrador', text: 'A Caverna onde o Arthur ficou. A Fábrica com a cápsula vaga. O Pântano que engolia sem pressa.' },
      { speaker: 'narrador', text: 'O portão do Castelo onde o Cabo Fernandes segurou a linha pra ele passar.' },
      { speaker: 'narrador', text: 'O Vulcão, a estação no Espaço. E o Núcleo, que agora é metal frio.' },
      { speaker: 'narrador', text: 'O Ferreira ainda transmite pela 4.7. O Vale responde quando pode.' },
      { speaker: 'rios', text: 'Deu. Chegamos até aqui e ainda tem gente no rádio.' },
      { speaker: 'narrador', text: 'Na tela do painel, antes de sair, o destino piscava devagar.' },
      { speaker: 'mensagem', text: '[ DESTINO DA DIRETORIA — PLANETA AHB-45 — VERIFICAÇÃO PENDENTE ]' },
      { speaker: 'rios', text: 'AHB-45. Anota aí, Vale. Um dia a gente vai até eles.' },
      { speaker: 'narrador', text: 'FIM DA PARTE I.' },
      { speaker: 'mensagem', text: '[ PART II EM BREVE — AHB-45 ]' },
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
}

/**
 * Índice da cutscene que abre a fase.
 *
 * `showCutscene()` é chamado em 2 lugares, ambos no menu, então só o PRÓLOGO
 * jogava: 62 das 69 linhas escritas eram conteúdo morto, e com elas os 3 finais
 * do epílogo. Este mapa liga cada fase à sua cena.
 *
 * Fase 0 abre o PRÓLOGO. A fase 8 (Bunker Central) abre a NÚCLEO-CENTRAL, e
 * a resolução é o EPÍLOGO, que vem depois do chefe final.
 *
 * Antes a fase 8 apontava para o EPÍLOGO: as duas eram a MESMA cena (`8: 8`),
 * então o jogador lia o fim antes de lutar e lia de novo no fim — e a primeira
 * linha do epíLOGO era "O MOTHERSHIP cai", sendo que a MOTHERSHIP é a 3ª da
 * fila do NÚCLEO (`NUCLEO_RUSH`). A abertura passou a ser cena própria e a
 * linha da MOTHERSHIP foi para o meio do epíLOGO, onde a coisa aconteceu.
 *
 * O EPÍLOGO é o ÚLTIMO índice da lista, e essa ordem é contrato:
 * `skipCutscene` só encerra o jogo na última. `cutscene.test.ts` cobre.
 * O epílogo não tem mais escolhas: a reescrita de 2026-10-13 (DECISIONS
 * #174) trocou os 3 finais por NARRADOR + créditos da jornada + teaser
 * AHB-45, e a maquinaria de escolhas saiu junto (semOrfao limpo).
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
  8: 8,   // Bunker -> NÚCLEO-CENTRAL (o EPÍLOGO fecha depois do chefe final)
};

export const EPILOGUE_CUTSCENE = 9;

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
 */
export function skipCutscene(): boolean {
  if (!showingCutscene) return false;
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
