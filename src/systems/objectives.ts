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
  playerX: number,
  playerY: number,
  enemiesAlive: number,
  reachZones: { x: number; y: number; radius: number }[] = []
): ObjectiveProgress {
  switch (kind) {
    case 'survive': {
      timer += dt;
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
      const npcs = getNPCs();
      const vip = npcs[0];
      const alive = !deadNpc && !!vip && vip.alive;
      return {
        label: 'PROTEGER O SOBREVIVENTE',
        progress: alive ? 1 : 0,
        detail: alive ? 'VIVO' : 'PERDIDO',
        done: false,
      };
    }
    case 'reach': {
      if (!reached && reachZones.length > 0) {
        for (const z of reachZones) {
          if (Math.hypot(playerX - z.x, playerY - z.y) <= z.radius) {
            reached = true;
          }
        }
      }
      return {
        label: 'CHEGAR À ZONA',
        progress: reached ? 1 : 0,
        detail: reached ? 'CHEGOU' : 'EM TRÂNSITO',
        done: reached,
      };
    }
    default:
      return {
        label: 'LIMPAR A ÁREA',
        progress: enemiesAlive === 0 ? 1 : 0,
        detail: enemiesAlive === 0 ? 'LIMPO' : `${enemiesAlive} hostis`,
        done: false,
      };
  }
}

/** Registra que o NPC protegido morreu. */
export function registerVipDown(): void {
  deadNpc = true;
}

/** Converte a coordenada de uma célula `N` em pixels com o centro da célula. */
export function cellCenter(col: number, row: number): { x: number; y: number } {
  return { x: col * CELL_SIZE + CELL_SIZE / 2, y: row * CELL_SIZE + CELL_SIZE / 2 };
}
