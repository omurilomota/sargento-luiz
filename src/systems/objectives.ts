/**
 * src/systems/objectives.ts
 *
 * Objetivo por fase, data-driven em `Phase.objective`.
 * Tira o "só matar tudo" do jogo: cada mapa tem uma condição de vitória
 * própria, e o HUD mostra rótulo + barra de progresso.
 */

import { ObjectiveKind } from '../types';
import { CELL_SIZE } from '../maps';
import { getNPCs } from './npcs';

export interface ObjectiveProgress {
  /** Rótulo curto exibido no HUD */
  label: string;
  /** Progresso 0-1 */
  progress: number;
  /** Texto de detalhe (ex: "2/3 ninhos", "28s") */
  detail: string;
  /** true quando a condição foi cumprida */
  done: boolean;
}

let kind: ObjectiveKind = 'clear';
let target = 0;
let timer = 0;
let destroyed = 0;
let deadNpc = false;
let reached = false;
/** O objetivo `protect` latcheia isto: sem ele, a fase termina no 1o frame. */
let sawEnemies = false;

/**
 * Inicia o objetivo da fase.
 */
export function initObjective(objective: ObjectiveKind, objectiveTarget: number): void {
  kind = objective;
  target = objectiveTarget;
  timer = 0;
  destroyed = 0;
  deadNpc = false;
  reached = false;
  sawEnemies = false;
}

/** Registra a destruição de um ninho/objetivo do mapa. */
export function registerObjectiveDestroyed(): void {
  destroyed++;
}

/** Uma zona de extração em pixels. */
export type ReachZone = { x: number; y: number; radius: number };

/**
 * Monta o progresso do objetivo sem tocar em estado.
 *
 * Existe separado de `updateObjective` porque o HUD é montado dentro do `draw`
 * e uma função de leitura não pode avançar o relógio do objetivo: dependia de
 * `dt === 0` para não ter efeito colateral, o que é frágil — qualquer
 * mudança futura no update passaria a se comportar diferente dependendo de se
 * um frame desenhou antes ou depois do update.
 */
export function peekObjective(
  playerX: number, playerY: number, enemiesAlive: number, reachZones: ReachZone[]
): ObjectiveProgress {
  switch (kind) {
    case 'survive': {
      const pct = target > 0 ? timer / target : 1;
      return {
        label: 'SOBREVIVER',
        progress: Math.min(1, pct),
        detail: `${Math.ceil(Math.max(0, target - timer))}s`,
        done: timer >= target,
      };
    }
    case 'destroy': {
      const pct = target > 0 ? destroyed / target : 1;
      return {
        label: 'DESTRUIR NINHOS',
        progress: Math.min(1, pct),
        detail: `${destroyed}/${target}`,
        done: destroyed >= target,
      };
    }
    case 'protect': {
      const vip = getNPCs()[0];
      const alive = !deadNpc && !!vip && vip.alive;
      // Concluir é: o NPC sobreviveu, a área está limpa, e a luta aconteceu.
      //
      // O terceiro predicado é o que impede a fase de acabar no primeiro frame:
      // `enemiesAlive === 0` é verdade nos 0.8s antes do primeiro spawn, então
      // sem o latch uma fase de protect terminava antes de aparecer inimigo
      // nenhum. A troca: limpar a onda 0 já encerra a fase, pulando as ondas
      // seguintes e o chefe — o mesmo contrato dos outros objetivos não-clear.
      return {
        label: 'PROTEGER O SOBREVIVENTE',
        progress: alive ? 1 : 0,
        detail: alive ? (sawEnemies ? 'VIVO' : 'VIVO (aguardando)') : 'PERDIDO',
        done: alive && enemiesAlive === 0 && sawEnemies,
      };
    }
    case 'reach': {
      const dentro = reachZones.some(
        z => Math.hypot(playerX - z.x, playerY - z.y) <= z.radius,
      );
      return {
        label: 'CHEGAR À ZONA',
        progress: reached || dentro ? 1 : 0,
        detail: reached || dentro ? 'CHEGOU' : 'EM TRÂNSITO',
        done: reached || dentro,
      };
    }
    default:
      return {
        label: 'LIMPAR A ÁREA',
        progress: enemiesAlive === 0 ? 1 : 0,
        detail: enemiesAlive === 0 ? 'LIMPO' : `${enemiesAlive} hostis`,
        // `clear` é o único que main.ts filtra explicitamente do gatilho de fim
        // de fase (a fase termina pela lógica de ondas), então devolvê-lo aqui
        // seria um caminho que ninguém escuta.
        done: false,
      };
  }
}

/**
 * Atualiza o objetivo. Chamar todo frame enquanto `playing`.
 */
export function updateObjective(
  dt: number,
  playerX: number, playerY: number,
  enemiesAlive: number,
  reachZones: ReachZone[] = []
): ObjectiveProgress {
  if (enemiesAlive > 0) sawEnemies = true;
  if (kind === 'survive') timer += dt;
  if (kind === 'reach' && !reached) {
    for (const z of reachZones) {
      if (Math.hypot(playerX - z.x, playerY - z.y) <= z.radius) reached = true;
    }
  }
  return peekObjective(playerX, playerY, enemiesAlive, reachZones);
}

/** Marca o sobrevivente como morto (usado pelo npcs.ts e pelo teste no browser). */
export function markVipDown(): void {
  deadNpc = true;
}

/**
 * Cumpre o objetivo da fase sem jogá-lo — só para o harness de campanha.
 *
 * Desde o B3 do Vulcão o fim de fase exige o objetivo de verdade
 * (`chefeLiberado` no `deveFecharFase`): o objetivo libera o chefe e o chefe
 * fecha a fase. A prova de estrutura força o fim (última onda + chefe
 * invocado), e sem isto ela invocava o chefe de uma fase cujo objetivo nunca
 * foi cumprido — a fase não fechava mais e a campanha travava na Caverna.
 */
export function forceObjectiveDone(): void {
  if (kind === 'survive') timer = target;
  if (kind === 'destroy') destroyed = target;
  if (kind === 'reach') reached = true;
  sawEnemies = true;
}

/**
 * true se o sobrevivente do objetivo `protect` morreu nesta fase.
 *
 * Diferente de `vipAlive()`: isto é o latch, então é falso numa fase onde o
 * NPC nunca existiu. Reiniciar a fase quando o NPC cai não pode virar laço
 * infinito por causa de um NPC que não nasceu.
 */
export function vipDown(): boolean {
  return deadNpc;
}

/** Converte a coordenada de uma célula `N` em pixels com o centro da célula. */
export function cellCenter(col: number, row: number): { x: number; y: number } {
  return { x: col * CELL_SIZE + CELL_SIZE / 2, y: row * CELL_SIZE + CELL_SIZE / 2 };
}
