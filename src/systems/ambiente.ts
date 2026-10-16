/**
 * A AMBIÊNCIA SONORA dos biomas (M1, relato 2026-10-14: "Porto (gaivota,
 * água no cais), Caverna (gotejamento, eco), Fábrica/Trens (maquinário,
 * apito), Espaço (drone de vácuo, alarme da estação)").
 *
 * Formato: ONE-SHOTS periódicos em volume baixo — não uma cama de loop por
 * baixo da música. Cada som tem janela própria [min, max] sorteada por
 * disparo: o cais molha os pés do jogador com mais frequência do que o
 * alarme da estação responde, e a irregularidade é o que faz ler como
 * lugar, não como faixa de ambiente de elevador.
 *
 * Todos de arquivo (regra 14/AGENTS): Rango Mango (CC0), qubodup (CC0),
 * bart (CC0), jdagenet (CC-BY 3.0), ezduzziteh (CC0), Tsorthan Grove
 * (CC-BY 4.0) — ver public/assets/CREDITS.md.
 */
import { rand } from '../utils';

interface SomAmbiente {
  /** Chave em SFX_FILES (o arquivo real) */
  chave: string;
  /** Janela entre disparos, em segundos — sorteada a cada vez */
  min: number;
  max: number;
}

/**
 * Por NOME de fase (não índice — sobrevive a reordenação, como o save).
 * A Cidade ganha o VENTO porque o prólogo o anuncia; o tornado é o
 * evento raro que cumpre, o vento é o dia a dia que promete.
 */
export const AMBIENTE_POR_FASE: Record<string, SomAmbiente[]> = {
  'Cidade em Ruínas': [{ chave: 'vento', min: 20, max: 45 }],
  'Porto': [
    { chave: 'gaivota', min: 7, max: 20 },
    { chave: 'agua_cais', min: 5, max: 14 },
  ],
  'Caverna': [{ chave: 'gotejamento', min: 4, max: 11 }],
  'Pátio de Trens': [
    { chave: 'apito', min: 25, max: 55 },
    { chave: 'maquinario', min: 9, max: 18 },
  ],
  'Fábrica': [{ chave: 'maquinario', min: 10, max: 22 }],
  'Espaço': [
    { chave: 'drone_vazio', min: 14, max: 30 },
    { chave: 'alarme_estacao', min: 35, max: 70 },
  ],
  'NÚCLEO-CENTRAL': [{ chave: 'drone_vazio', min: 22, max: 50 }],
};

/** Agenda viva: um relógio por som da fase atual. */
let agendados: { som: SomAmbiente; resta: number }[] = [];

/**
 * Arma a ambiência da fase. Chamado no load de cada fase — a fase sem
 * entrada na tabela fica em silêncio de propósito.
 */
export function resetAmbiente(nomeDaFase: string): void {
  agendados = (AMBIENTE_POR_FASE[nomeDaFase] ?? []).map(som => ({
    som,
    // o primeiro disparo vem cedo (min/2): a ambiência é a primeira
    // impressão do lugar, não uma recompensa por esperar
    resta: rand(som.min / 2, som.min),
  }));
}

/**
 * O tick: decrementa, dispara pela porta real (o tocar vem por callback,
 * injetado pelo main — o módulo não conhece áudio, o teste não precisa
 * dele) e re-arma sorteando a janela.
 *
 * @returns as chaves que dispararam neste frame (para o main tocar)
 */
export function updateAmbiente(dt: number): string[] {
  const disparados: string[] = [];
  for (const slot of agendados) {
    slot.resta -= dt;
    if (slot.resta <= 0) {
      disparados.push(slot.som.chave);
      slot.resta = rand(slot.som.min, slot.som.max);
    }
  }
  return disparados;
}

/** A agenda da fase atual, para a prova ler (chave + quanto falta). */
export function agendaAmbiente(): { chave: string; resta: number }[] {
  return agendados.map(a => ({ chave: a.som.chave, resta: Number(a.resta.toFixed(2)) }));
}
