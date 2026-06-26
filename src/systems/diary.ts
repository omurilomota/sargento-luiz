/**
 * Sistema de diário de bordo do Sargento Rios.
 * Entradas desbloqueadas a cada fase completada.
 * Lore opcional que expande a história do jogo.
 */

/** Entrada do diário */
interface DiaryEntry {
  /** Fase em que foi desbloqueada */
  phase: number;
  /** Título da entrada */
  title: string;
  /** Texto do diário */
  text: string;
  /** Se foi desbloqueada */
  unlocked: boolean;
}

/** Entradas do diário */
const DIARY_ENTRIES: DiaryEntry[] = [
  {
    phase: 0,
    title: 'Dia 1 — O Início',
    text: 'Acordei no escombros do quartel. O cheiro de fumaça e ferro velho. Meu rádio só captura estática. O esquadrão... não sobrou ninguém. Preciso encontrar o Bunker. Se existe alguma cura, é lá que vai estar.',
    unlocked: false,
  },
  {
    phase: 1,
    title: 'Dia 3 — A Floresta',
    text: 'A floresta era bonita, uma vez. Agora é um cemitério verde. Encontrei ossos humanos misturados com cascos de bala. Alguém esteve aqui antes de mim. Não sobrou nada além de marcas na casca das árvores.',
    unlocked: false,
  },
  {
    phase: 2,
    title: 'Dia 5 — A Caverna',
    text: 'No escuro, a mente joga contra você. Cada som parece um passo. Os cristais brilham com uma energia que não deveria existir. Será que eles são a causa? Ou apenas mais um sintoma?',
    unlocked: false,
  },
  {
    phase: 3,
    title: 'Dia 7 — A Fábrica',
    text: 'BioGen Corp. Aqui tudo começou. Encontrei registros: o Projeto Genesis não era uma cura. Era uma arma biológica. Eles queriam controlar a mutação, não impedi-la. Os robôs de segurança ainda patrulham. Protegendo segredos que deveriam ter sido enterrados.',
    unlocked: false,
  },
  {
    phase: 4,
    title: 'Dia 9 — O Pântano',
    text: 'O ar é tão denso que parece água. Cada respiração é uma luta. Os mutantes aqui são diferentes — se adaptaram ao veneno. Evoluíram. Se eles estão ficando mais fortes, o que dizer do que está no Bunker?',
    unlocked: false,
  },
  {
    phase: 5,
    title: 'Dia 11 — O Castelo',
    text: 'Construíram uma fortaleza. Organização. Hierarquia. Isso não é instinto — é inteligência. O Rei no topo não é só o mais forte. É o mais antigo. O primeiro mutado. E ele sabe que estou vindo.',
    unlocked: false,
  },
  {
    phase: 6,
    title: 'Dia 13 — O Vulcão',
    text: 'A terra treme. Não é o vulcão. É algo maior. A Mãe-Nave está se aproximando. Se eu não chegar ao Bunker agora, não vai existir mais ninguém para chegar.',
    unlocked: false,
  },
  {
    phase: 7,
    title: 'Dia 15 — O Espaço',
    text: 'Estou na órbita. Não sei como cheguei aqui. A estação Erebus é a última barreira. A Mãe-Nave me espera. Se eu destruí-la, a cura se espalha. Se eu falhar... bem, pelo menos tentei.',
    unlocked: false,
  },
];

const STORAGE_KEY = 'bubbleShooter_diary';

/**
 * Carrega entradas desbloqueadas do diário.
 */
export function loadDiary(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as number[];
      for (const entry of DIARY_ENTRIES) {
        entry.unlocked = saved.includes(entry.phase);
      }
    }
  } catch {}
}

/**
 * Salva entradas do diário no localStorage.
 */
function saveDiary(): void {
  try {
    const unlocked = DIARY_ENTRIES.filter(e => e.unlocked).map(e => e.phase);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
  } catch {}
}

/**
 * Desbloqueia a entrada de uma fase.
 * @param phase - número da fase completada
 */
export function unlockDiaryEntry(phase: number): void {
  const entry = DIARY_ENTRIES.find(e => e.phase === phase);
  if (entry && !entry.unlocked) {
    entry.unlocked = true;
    saveDiary();
  }
}

/**
 * Retorna todas as entradas do diário.
 */
export function getAllDiaryEntries(): DiaryEntry[] {
  return DIARY_ENTRIES;
}

/**
 * Retorna entradas desbloqueadas.
 */
export function getUnlockedDiary(): DiaryEntry[] {
  return DIARY_ENTRIES.filter(e => e.unlocked);
}
