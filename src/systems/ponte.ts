/**
 * A QUEDA DA PONTE (M3, relato 2026-10-14: "Ponte com multi-spawn + timer
 * de quebra") — a fala da cutscene vira mecânica: "Atravessa ou morre
 * tentando".
 *
 * O tabuleiro cai uma coluna por vez, de LESTE para OESTE (o jogador nasce
 * no lado leste e atravessa para a zona a oeste): a queda persegue o
 * jogador pelas costas. Cada passo tem DUAS fases:
 *
 *   1. a FRENTEx (coluna atual) vira entulho '^' — em pé nela dói
 *      (10/s, o aviso é o piso mudar de cara);
 *   2. no passo seguinte ela SELA em parede e a frente avança.
 *
 * O MULTI-SPAWN é a quebra acordando o que aninhava embaixo: a cada
 * coluna que cai, quem estava nos cabos cai junto no tabuleiro —
 * posições devolvidas para o main spawnar do pool da fase.
 *
 * A queda PAUSA quando o objetivo `reach` cumpre: a extração segura o que
 * sobrou, e a luta do chefe acontece na ponte que o jogador deixou viva —
 * quem atravessa rápido luta com espaço; quem demora, apertado.
 * O avanço tem PISO: a coluna 3 — a zona de extração (coluna 2) não cai,
 * senão o objetivo vira impossível.
 */
import { CELL_SIZE } from '../maps';

/** Segundos entre colunas (a fase tem ~60s de ponte viva pela frente toda) */
export const PONTE_PASSO = 6;
/** Segundos de graça: o jogador lê o aviso antes do primeiro tombo */
export const PONTE_GRACA = 10;
/** A coluna onde a frente PARA (a zona de extração é a 2) */
export const PONTE_COLUNA_MINIMA = 3;
/** Dano por segundo para quem fica em pé na frente que cede */
export const PONTE_DANO = 10;
/** Onde a frente começa (a borda leste do tabuleiro) */
const COLUNA_INICIAL = 28;
/** As linhas da fatia que cai: guarda-alto, tabuleiro e guarda-baixo */
const LINHAS_DA_FATIA = [6, 7, 8, 9, 10, 11, 12, 13, 14];

let armada = false;
let pausada = false;
let frente = COLUNA_INICIAL;
let relogio = 0;
let colunasCaídas = 0;

export function armarQuedaDaPonte(): void {
  armada = true;
  pausada = false;
  frente = COLUNA_INICIAL;
  relogio = PONTE_GRACA;
  colunasCaídas = 0;
}

export function resetQuedaDaPonte(): void {
  armada = false;
  pausada = false;
  frente = COLUNA_INICIAL;
  relogio = 0;
  colunasCaídas = 0;
}

/** A queda para quando o objetivo cumpre (a extração segura o resto). */
export function pausarQueda(): void {
  pausada = true;
}

export function quedaAtiva(): boolean {
  return armada && !pausada;
}

export function estadoDaQueda(): { frente: number; colunasCaídas: number; proximoPasso: number } {
  return { frente, colunasCaídas, proximoPasso: Math.max(0, relogio) };
}

export interface ResultadoDaQueda {
  /** Células que viraram entulho neste passo ({col, row} em células) */
  entulho: { col: number; row: number }[];
  /** Células que selaram em parede neste passo */
  seladas: { col: number; row: number }[];
  /** Onde acordaram inimigos (px de mundo) — o main spawna do pool da fase */
  acordados: { x: number; y: number }[];
  /** Segundos até o próximo passo (para o HUD) — 0 quando não armada */
  resta: number;
  /** Dano que o jogador leva neste frame por estar na fatia que cede */
  dano: number;
}

/**
 * O tick da queda. `aplicaCelula` é injetado (o tilemap é do chamador —
 * aqui não existe mapa, só a coreografia); `danoEmPe` devolve o dano que
 * o jogador leva por estar em pé na fatia que cede neste frame.
 */
export function updateQuedaDaPonte(
  dt: number,
  jogadorCol: number,
  jogadorRow: number,
  aplicaCelula: (col: number, row: number, ch: string) => void,
): ResultadoDaQueda {
  const resultado: ResultadoDaQueda = { entulho: [], seladas: [], acordados: [], resta: 0, dano: 0 };
  if (!armada || pausada) return resultado;

  resultado.resta = Math.max(0, relogio);
  relogio -= dt;
  if (relogio <= 0 && frente >= PONTE_COLUNA_MINIMA) {
    // 1. sela a frente anterior em parede
    if (colunasCaídas > 0) {
      for (const row of LINHAS_DA_FATIA) {
        aplicaCelula(frente + 1, row, '#');
        resultado.seladas.push({ col: frente + 1, row });
      }
    }
    // 2. a nova frente cede: entulho
    for (const row of LINHAS_DA_FATIA) {
      aplicaCelula(frente, row, '^');
      resultado.entulho.push({ col: frente, row });
    }
    // 3. a queda acorda quem aninhava: dois caem no tabuleiro
    for (let i = 0; i < 2; i++) {
      const row = LINHAS_DA_FATIA[2 + Math.floor(Math.random() * 5)];
      resultado.acordados.push({ x: frente * CELL_SIZE + CELL_SIZE / 2, y: row * CELL_SIZE + CELL_SIZE / 2 });
    }
    frente--;
    colunasCaídas++;
    relogio = PONTE_PASSO;
    resultado.resta = PONTE_PASSO;
  }

  // dano para quem fica em pé na fatia que cede: a frente que virou
  // entulho (e a que selou, no frame em que sela) — sair da rota é a defesa
  const naFatia = jogadorRow >= LINHAS_DA_FATIA[0] && jogadorRow <= LINHAS_DA_FATIA[LINHAS_DA_FATIA.length - 1];
  if (naFatia && (jogadorCol === frente || jogadorCol === frente + 1)) {
    resultado.dano = PONTE_DANO * dt;
  }
  return resultado;
}
