import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Portão de texto: o roteiro não pode soar como IA.
 *
 * O mandato do projeto é "nada pode parecer ou entregar como IA" — mas até
 * aqui isso era promessa, não contrato: uma sessão inteira foi perdida com
 * textos que soavam a fórmula e ninguém tinha como acusar sem reler tudo.
 *
 * Os padrões abaixo são os tics de escrita gerada, apurados contra o conteúdo
 * atual (zero falsos positivos: se o detector chiasse com prosa legítima,
 * ninguém o escutaria). Eles pegam a FORMA, não a qualidade — um texto pode
 * passar em tudo e ainda ser fraco; mas não passa quem precisa da fórmula.
 *
 * Se uma frase precisa do tic para funcionar, ela não está pronta. Não é para
 * contornar o detector: é para não escrever a fórmula.
 */

const ARQUIVOS = [
  join(__dirname, '..', 'systems', 'story.ts'),
  join(__dirname, '..', 'systems', 'diary.ts'),
  // quando os eventos aleatórios existirem (SPRINT 7 do TODO.md), entram aqui.
];

interface Tic {
  nome: string;
  padrao: RegExp;
}

const TICS: Tic[] = [
  { nome: 'tríade (A, B e C)', padrao: /\p{L}+,\s+\p{L}+\s+e\s+\p{L}+/u },
  { nome: '"não X, mas Y"', padrao: /não\s+\p{L}+[^,]{0,45},\s+mas\b/iu },
  { nome: 'onda/langadouro de X', padrao: /\b(?:uma?\s+onda|um\s+langadouro|uma\s+enxurrada|uma\s+fonte)\s+de\s+\p{L}+/iu },
  { nome: 'corpo clichê', padrao: /\b(?:cora[çc][aã]o\s+(?:acelerou|bateu|disparou)|olhos\s+se\s+arregalaram|mand[ií]bula\s+travou|arrepios?|arrepiar)\b/iu },
  { nome: 'etiqueta de fala', padrao: /\b(?:murmurou|sussurrou|bal[cç]ou|raspou|intimou|meditou|razorou)\b/iu },
  // Etiqueta de voz-emoção: "com a voz carregada de", "voz tingida de". O
  // adjetivo faz o trabalho que a fala deveria fazer — é o tell nº1 de diálogo
  // de IA que a pesquisa apurou (aistoryhub). A fala É a emoção, não o rótulo.
  { nome: 'rótulo de emoção na voz', padrao: /\bvoz\s+(?:carregada|tingida|lacrada|cheia|cheio)\s+d[ae]\b/iu },
  // Compreensão não-dita: "algo passou entre eles", "um silêncio que dizia".
  // Anunciar que houve subtexto é o oposto de subtexto — confie no buraco.
  { nome: 'subtexto anunciado', padrao: /\b(?:algo\s+passou\s+entre|um\s+entendimento\s+n[ãa]o\s+dito|sem\s+precisar\s+dizer|mais\s+que\s+as?\s+palavras?|dizia\s+mais\s+que)\b/iu },
  // Fala-terapia: "você está bem?", "eu entendo como você se sente". Ninguém
  // fala isso no meio do conflito — pessoa responde com ação, silêncio ou
  // muda de assunto (aistoryhub).
  { nome: 'fala-terapia', padrao: /\b(?:voc[êe]\s+est[áa]\s+bem|eu\s+entendo\s+como\s+voc[êe]\s+se\s+sente|vamos\s+passar\s+por\s+isso\s+juntos)\b/iu },
  { nome: 'adjetivo vazio', padrao: /\b(?:sil[eê]ncio\s+pesado|olhar\s+penetrante|sabedoria\s+antiga|brisa\s+suave)\b/iu },
  { nome: 'narração repetindo a UI', padrao: /\b(?:cinco|seis|sete|\d+)\s+ondas\b/iu },
  // Espanhol que vaza na prosa em português. Aconteceu duas vezes de verdade
  // ("recibir" no EPÍLOGO e um "mejor" que saiu no FUTURO), sempre em texto
  // reescrito às pressas — o mesmo modo de falha do tic de fórmula.
  {
    // O `\b` do JS é ASCII: depois de vogal acentuada ("recibió,", "aquí.")
    // ele não vê fronteira, e o tic passaria batido. Por isso o fim usa
    // lookahead Unicode em vez de `\b` — e por isso é "aquí" com acento, não
    // `aqu[íi]`, que acusava o "aqui" português de estar em espanhol.
    nome: 'palavra em espanhol',
    padrao: /\b(?:recibir|recibi[óo]|mejor|tambi[ée]n|adem[áa]s|ahora|siempre|adi[óo]s|gracias|despu[ée]s|mientras|aquí)(?![\p{L}\p{N}])/iu,
  },
];

/** Nomes de todos os tics declarados — usado para exigir controle de cada um. */
const NOMES_DOS_TICS = TICS.map((t) => t.nome);

/** Todas as palavras que o tic de espanhol precisa acusar, uma por alternativa. */
const AMOSTRAS_ESPANHOL = [
  'recibir', 'recibió', 'mejor', 'también', 'además', 'ahora',
  'siempre', 'adiós', 'gracias', 'después', 'mientras', 'aquí',
];

/**
 * Frases portuguesas legítimas que o tic de espanhol NÃO pode acusar.
 *
 * "aqui" sem acento, "recebeu", "melhor", "também" — a primeira versão do
 * regex acusou "aqui é Vale" de espanhol, e um portão que chia com prosa
 * correta é um portão que ninguém escuta.
 */
const CONTROLES_NEGATIVOS_ESPANHOL = [
  'Alpha-1, aqui é Vale. Você recebeu?',
  'Aqui não tem chão para se cobrir.',
  'Estou... por aqui, comandante.',
  'Melhor assim, e também mais rápido.',
];

/** Só o texto de fala interessa — código, chaves e comentários não são prosa. */
function textosDaLinha(linha: string): string[] {
  const textos: string[] = [];
  const re = /text:\s*'((?:[^'\\]|\\.)*)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(linha))) textos.push(m[1]);
  return textos;
}

/** Nomes dos tics presentes num texto. */
function ticsDe(texto: string): string[] {
  return TICS.filter((t) => t.padrao.test(texto)).map((t) => t.nome);
}

describe('semIA: o roteiro não pode soar como IA', () => {
  it('o detector morde — cada tic tem frase de controle que ele acusa', () => {
    // Sem isto, um regex quebrado (ou reescrito errado) viraria um portão que
    // aprova tudo em silêncio — o pior tipo de teste.
    const controles: [string, string][] = [
      ['tríade (A, B e C)', 'Na mochila: corda, faca e lampião.'],
      ['"não X, mas Y"', 'Ele não correu, mas voltou.'],
      ['onda/langadouro de X', 'Uma onda de calor atravessou a rua.'],
      ['corpo clichê', 'O coração acelerou quando a porta abriu.'],
      ['etiqueta de fala', 'Ele murmurou algo para ninguém.'],
      ['rótulo de emoção na voz', 'Você sabia, disse ela, com a voz carregada de fúria.'],
      ['subtexto anunciado', 'Algo passou entre eles, e nenhum precisou dizer.'],
      ['fala-terapia', 'Você está bem? Eu entendo como você se sente.'],
      ['adjetivo vazio', 'O silêncio pesado ficou depois da explosão.'],
      ['narração repetindo a UI', 'Cinco ondas. Os ninhos importam.'],
      ['palavra em espanhol', 'Não para recibir. Aquí, mejor assim.'],
    ];
    // Tic declarado sem controle é tic que ninguém provou que morde — a lista
    // dos dois lados tem que bater, senão o portão aprova em silêncio.
    expect(controles.map((c) => c[0]).sort()).toEqual([...NOMES_DOS_TICS].sort());
    for (const [nome, frase] of controles) {
      expect(ticsDe(frase), `o tic "${nome}" não acusou o próprio controle`).toContain(nome);
    }
    // Cada alternativa do tic de espanhol, uma por uma: um `\b` errado no fim
    // já deixou passar "aquí" uma vez, e só se descobre testando palavra a palavra.
    const escaparam = AMOSTRAS_ESPANHOL.filter((p) => !ticsDe(p).includes('palavra em espanhol'));
    expect(escaparam, `alternativas em espanhol que o tic não acusou: ${escaparam.join(', ')}`).toEqual([]);
    // E o outro lado: português correto não pode ser chamado de espanhol.
    const acusados = CONTROLES_NEGATIVOS_ESPANHOL.filter((p) => ticsDe(p).includes('palavra em espanhol'));
    expect(acusados, `português acusado de espanhol: ${acusados.join(' | ')}`).toEqual([]);
  });

  it('nenhum texto de story.ts e diary.ts carrega tic', () => {
    const violacoes: string[] = [];
    for (const arquivo of ARQUIVOS) {
      const linhas = readFileSync(arquivo, 'utf8').split('\n');
      linhas.forEach((linha, i) => {
        for (const texto of textosDaLinha(linha)) {
          for (const tic of ticsDe(texto)) {
            violacoes.push(`${arquivo}:${i + 1} [${tic}] ${texto.slice(0, 90)}`);
          }
        }
      });
    }
    expect(violacoes, `tics encontrados:\n${violacoes.join('\n')}`).toEqual([]);
  });
});
