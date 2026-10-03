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

/**
 * Inicia o objetivo da fase.
 * @param objective - tipo de objetivo
 * @param objectiveTarget - alvo numérico
 */
export function initObjective(objective: ObjectiveKind, objectiveTarget: number): void {
  kind = objective;
  target = objectiveTarget;
  timer = 0;
  destroyed = 0;
  deadNpc = false;
  reached = false;
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
 * @param playerX - X do jogador no mundo
 * @param playerY - Y do jogador no mundo
 * @param enemiesAlive - quantidade de inimigos vivos
 * @param reachZones - zonas de extração (células) quando o objetivo é `reach`
 * @param target - alvo numérico do objetivo
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
      // Concluir é: o NPC sobreviveu E a fase acabou. `enemiesAlive === 0`
      // sozinho nunca bastava — sem isso o objetivo era impossível de fechar
      // em qualquer fase, porque nunca devolvia `done: true`.
      return {
        label: 'PROTEGER O SOBREVIVENTE',
        progress: alive ? 1 : 0,
        detail: alive ? 'VIVO' : 'PERDIDO',
        done: alive && enemiesAlive === 0,
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
 * @param dt - delta time em segundos
 * @param playerX - X do jogador no mundo
 * @param playerY - Y do jogador no mundo
 * @param enemiesAlive - quantidade de inimigos vivos
 * @param reachZones - zonas de extração (células) quando o objetivo é `reach`
 */
export function updateObjective(
  dt: number,
  playerX: number, playerY: number,
  enemiesAlive: number,
  reachZones: ReachZone[] = []
): ObjectiveProgress {
  if (kind === 'survive') timer += dt;
  if (kind === 'reach' && !reached) {
    for (const z of reachZones) {
      if (Math.hypot(playerX - z.x, playerY - z.y) <= z.radius) reached = true;
    }
  }
  return peekObjective(playerX, playerY, enemiesAlive, reachZones);
}

/** Registra que o NPC protegido morreu. */
export function registerVipDown(): void {
  deadNpc = true;
}

/** Converte a coordenada de uma célula `N` em pixels com o centro da célula. */
export function cellCenter(col: number, row: number): { x: number; y: number } {
  return { x: col * CELL_SIZE + CELL_SIZE / 2, y: row * CELL_SIZE + CELL_SIZE / 2 };
}
