/**
 * Diário de bordo do Sargento Rios — uma entrada por fase completada.
 *
 * O diário é o registro dePOIS: conta o que o Rios aprendeu com a parada, e
 * não repete a cena que a cutscene acabou de mostrar. Cutscene é o momento,
 * diário é a contagem.
 */

/** Entrada do diário */
interface DiaryEntry {
  /** Fase em que foi desbloqueada (-1 nas entradas reativas, que usam `event`) */
  phase: number;
  /** Chave de evento para entradas reativas (morto de boss, NPC salvo, escolha na loja) */
  event?: string;
  /** Título da entrada */
  title: string;
  /** Texto do diário */
  text: string;
  /** Se foi desbloqueada */
  unlocked: boolean;
}

/** Entradas do diário */
/** Todos os eventos com entrada de diário. Exportado para o harness de narrativa. */
export function getDiaryEvents(): string[] {
  return DIARY_ENTRIES.filter(e => e.event !== undefined).map(e => e.event!);
}

const DIARY_ENTRIES: DiaryEntry[] = [
  {
    phase: 0,
    title: 'Dia 1',
    text: 'O quartel caiu de madrugada. Sete caras no pátio, nenhum se mexe. Cobri o rosto do mais novo com a minha farda antes de sair. Anotei a frequência do Vale, 4.7. Chegar no batalhão do norte.',
    unlocked: false,
  },
  {
    phase: 1,
    title: 'Dia 3',
    text: 'Passei pela casa do Joe. Duas xícaras na mesa, uma virada, a bebida seca. Ele plantou aquela mata e agora ela engoliu a estrada. Sentei na varanda e bebi da xícara virada. Não tinha nada dentro.',
    unlocked: false,
  },
  {
    phase: 2,
    title: 'Dia 5',
    text: 'Achei o Arthur sentado de costas pra saída, mochila cheia do lado. Tava enchendo pra ir embora e não deu tempo. Treze anos desde que ele me levou lá. Guardei o crachá dele no bolso, do lado do peito.',
    unlocked: false,
  },
  {
    phase: 3,
    title: 'Dia 7',
    // A Fábrica perdeu a morte do Fernandes na rodada 2026-10-12 do dono: ele
    // estava no Castelo ("é lá onde ele está"), e a fábrica ganhou o amigo da
    // cápsula (H2). A contagem do sacrifício ficou na entrada reativa.
    text: 'A fábrica da BioGen parou no meio do turno, peça pela metade no braço da máquina. Alguém cuspiu na placa. No fim do corredor tem uma escada descendo, e o ar que sobe é quente. Tem alguma coisa viva no subsolo. Eu vou descer saber.',
    unlocked: false,
  },
  {
    phase: 4,
    title: 'Dia 9',
    text: 'Não sei o nome desse lugar. A bússola gira sozinha. Um corpo boia de bruços com uniforme, mas o distintivo foi polido até sumir. Não é do meu batalhão. Não reconheço, e isso é pior.',
    unlocked: false,
  },
  {
    phase: 5,
    title: 'Dia 11',
    text: 'Fortaleza de pedra, torres acesas. Alguém ainda mantém a luz. Os cavaleiros do portão são montados com osso dos seus. Subi o muro pelo sobrevivente. Já enterrei gente demais pra ficar de fora vendo.',
    unlocked: false,
  },
  {
    phase: 6,
    title: 'Dia 13',
    text: 'A lava subiu três metros e não choveu. Pensei na minha irmã, na cidade quente dela. Não sei se tá viva. Meu pai aguentou trinta anos dizendo que a gente segue por teimosia. Não é coragem. É teimosia.',
    unlocked: false,
  },
  {
    phase: 7,
    title: 'Dia 15',
    text: 'A Vale chamava de MOTHERSHIP. É ela que espalha eles pro resto do mundo. Sem chão pra se cobrir, sem parede. Gritei o nome dos três. Se tão em algum lugar, que olhem.',
    unlocked: false,
  },
  // ── entradas reativas (desbloqueadas por evento, não por fase) ──
  {
    phase: -1,
    event: 'boss_kill',
    title: 'O que manda no que',
    text: 'Quando o chefe cai, os outros param de marchar. Ficam andando em círculo, sem saber pra onde. Não era o mais forte. Era quem dava as ordens. Igual ao núcleo com o resto.',
    unlocked: false,
  },
  {
    phase: -1,
    event: 'npc_saved',
    title: 'Um a um',
    text: 'Levei o CABO até a zona. Ele não disse obrigado, só respirou fundo quando a seta apareceu. Eram doze anos de equipe e ele perguntou pelo radio se eu estava bem. É assim que se conta.',
    unlocked: false,
  },
  {
    phase: -1,
    event: 'rocket_saved',
    title: 'Motor vivo',
    text: 'Protegi o foguete no pátio do castelo. Cada flecha que não chegou nele é motor que sobra. Quando ele subir, eu vou estar dentro.',
    unlocked: false,
  },
  {
    phase: -1,
    event: 'shop_choice',
    title: 'Troca justa',
    text: 'Troquei o pente do Sniper por carregador e quarenta de munição de troca. Duas horas de mapa na mão para não recarregar no meio de uma investida. Compensa.',
    unlocked: false,
  },
  {
    phase: -1,
    event: 'fernandes',
    title: 'Seis segundos',
    // Esta entrada existe porque a morte do Fernandes era o beat mais forte do
    // roteiro e não custava nada ao jogador: ele morre em cena, nunca mais é
    // citado, e não deixava registro. A cutscene do epílogo agora o menciona,
    // mas a cutscene é o momento — o diário é a contagem.
    text: 'O cabo disse que pensei que ninguém vinha. Eu mandei ele ficar atrás de mim. Era ordem. Seis segundos de porta segurada e eu estava do outro lado. Seis segundos. Ele sabia o que tava comprando e comprou assim mesmo.',
    unlocked: false,
  },
  // ── eventos aleatórios por fase (salvar pessoa / explorar casa / sorte-azar) ──
  // Um sorteado ao entrar na loja, no lugar do "SPAWN DE NPC 40%" que decidia
  // sozinho. Cada um desbloqueia uma entrada e muda uma moeda do bolso: salvar
  // gente paga, explorar casa arrisca, e o sorteio do dia pode ser bom ou ruim.
  {
    phase: -1,
    event: 'evt_resgate',
    title: 'Gente viva',
    text: 'Achei um civil atrás de um muro, contando munição que não tinha. Levei até a zona. Ele me deu o que tinha no bolso e agradeceu duas vezes. Guardei as moedas.',
    unlocked: false,
  },
  {
    phase: -1,
    event: 'evt_casa',
    title: 'Casa saqueada',
    text: 'Entrei numa casa com a porta aberta. Gaveta vazia, mas o colchão tinha coisa escondida. Não julgo quem escondeu. Sobrevivência faz isso com a gente.',
    unlocked: false,
  },
  {
    phase: -1,
    event: 'evt_sorte',
    title: 'Dia de sorte',
    text: 'Achei um pé de munição intacto, esquecido embaixo de um caminhão. Nada mudou de dono, só ninguém voltou pra buscar. Hoje é meu.',
    unlocked: false,
  },
  {
    phase: -1,
    event: 'evt_azar',
    title: 'Dia de azar',
    text: 'Pisei num fio exposto e queimei parte do equipamento. A cidade cobra até por andar. Anotei o cruzamento pra não voltar por ele.',
    unlocked: false,
  },
];

const STORAGE_KEY = 'rios.diary';

/**
 * Carrega entradas desbloqueadas do diário.
 */
export function loadDiary(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as (number | string)[];
      for (const entry of DIARY_ENTRIES) {
        entry.unlocked = entry.event ? saved.includes(entry.event) : saved.includes(entry.phase);
      }
    }
  } catch {}
}

/**
 * Salva entradas do diário no localStorage.
 * Fase vira número, evento vira a chave string — formato misto no mesmo array.
 */
function saveDiary(): void {
  try {
    const unlocked: (number | string)[] = DIARY_ENTRIES
      .filter(e => e.unlocked)
      .map(e => e.event ?? e.phase);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
  } catch {}
}

/**
 * Desbloqueia a entrada de uma fase.
 */
export function unlockDiaryEntry(phase: number): void {
  const entry = DIARY_ENTRIES.find(e => e.event === undefined && e.phase === phase);
  if (entry && !entry.unlocked) {
    entry.unlocked = true;
    saveDiary();
  }
}

/**
 * Desbloqueia uma entrada reativa (boss morto, NPC salvo, escolha na loja).
 * @returns true se uma entrada nova foi desbloqueada (para o caller dar feedback)
 */
export function unlockDiaryEvent(event: string): boolean {
  const entry = DIARY_ENTRIES.find(e => e.event === event);
  if (!entry || entry.unlocked) return false;
  entry.unlocked = true;
  saveDiary();
  return true;
}

/**
 * Retorna todas as entradas do diário.

/**
 * Retorna entradas desbloqueadas.
 */
export function getUnlockedDiary(): DiaryEntry[] {
  return DIARY_ENTRIES.filter(e => e.unlocked);
}

/**
 * Zera os desbloqueios sem tocar no save.
 *
 * Existe para o teste da sorte: `rollDiaryEvent` marca o evento sorteado como
 * visto, e medir a taxa de "puxou o melhor" exige várias rolagens independentes
 * — sem isto a segunda chamada só poderia devolver outro evento.
 */
export function resetDiaryForTest(): void {
  for (const e of DIARY_ENTRIES) e.unlocked = false;
}

/** Os eventos aleatórios e o efeito de cada um no bolso do jogador. */
const EVENTOS_ALEATORIOS: { event: string; moedas: number }[] = [
  { event: 'evt_resgate', moedas: 25 },
  { event: 'evt_casa', moedas: 15 },
  { event: 'evt_sorte', moedas: 20 },
  { event: 'evt_azar', moedas: -10 },
];

/**
 * Sorteia um evento aleatório de fase que ainda não jogou, desbloqueia a entrada
 * do diário e devolve o efeito. Devolve `null` se todos já saíram.
 *
 * A sorte é PESO, não interruptor: cada ponto dobra a chance de o melhor evento
 * restante sair. Assim `mente_t3` (Sorte +1, 150 moedas) já paga alguma coisa,
 * e o SORTUDO (+3 no total, 400 moedas) pega o melhor de vez — que é o que o
 * especial promete. Antes a sorte era só o booleano do especial, e o degrau 3
 * do MENTE não fazia nada.
 *
 * @param rand - injetável para o teste (padrão Math.random).
 * @param sorte - pontos de sorte (0 = sorteio uniforme).
 */
export function rollDiaryEvent(rand: () => number = Math.random, sorte = 0): { event: string; moedas: number } | null {
  const restam = EVENTOS_ALEATORIOS.filter((e) => !DIARY_ENTRIES.find((d) => d.event === e.event)?.unlocked);
  if (restam.length === 0) return null;
  // o melhor está sempre em primeiro: com sorte 0 ele é só mais um do sorteio
  const melhor = restam.reduce((a, b) => (b.moedas > a.moedas ? b : a));
  const chanceDoMelhor = Math.min(1, sorte / restam.length);
  const sorteado = rand() < chanceDoMelhor
    ? melhor
    : restam[Math.floor(rand() * restam.length)];
  const entry = DIARY_ENTRIES.find((d) => d.event === sorteado.event);
  if (entry) entry.unlocked = true;
  saveDiary();
  return sorteado;
}
