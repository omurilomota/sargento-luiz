/**
 * Migração das chaves de save do ASHFALL para SARGENTO RIOS.
 *
 * O jogo foi publicado como "ASHFALL", que colide com pelo menos 8 jogos no
 * itch.io — vários marcados "AI Disclosure: AI Assisted", e um "Ashfall City"
 * que é o mesmo gênero. O prefixo das 12 chaves de localStorage mudou de
 * `ashfall.*` para `rios.*`.
 *
 * Sem isto, quem já jogou perde save, conquistas, diário, recordes, skins,
 * classe e preferências de volume. Roda uma vez no boot e é idempotente.
 */

const PREFIXO_ANTIGO = 'ashfall.';
const PREFIXO_NOVO = 'rios.';

/** Sufixos das chagens que o jogo usa. */
export const CHAVES_MIGRADAS = [
  'save', 'completed', 'achievements', 'diary', 'leaderboard',
  'skins_unlocked', 'class', 'musicOn', 'sfxOn', 'volMaster', 'volMusic', 'volSfx',
];

/**
 * Copia cada `ashfall.<chave>` para `rios.<chave>` e apaga a antiga.
 *
 * @returns quantas chaves foram migradas (0 se não havia nada antigo)
 */
export function migrarChavesDeSave(): number {
  try {
    let movidas = 0;
    for (const sufixo of CHAVES_MIGRADAS) {
      const antiga = PREFIXO_ANTIGO + sufixo;
      const valor = localStorage.getItem(antiga);
      if (valor === null) continue;
      // não sobrescreve um save novo que já exista
      const nova = PREFIXO_NOVO + sufixo;
      if (localStorage.getItem(nova) === null) {
        localStorage.setItem(nova, valor);
      }
      localStorage.removeItem(antiga);
      movidas++;
    }
    return movidas;
  } catch {
    // modo privado / storage bloqueado: o jogo continua, só sem save antigo
    return 0;
  }
}