import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Portão nº 6 — save fantasma.
 *
 * A família de defeito: `try { JSON.parse(localStorage.getItem(K)) } catch {}`
 * que engole o erro e deixa o JSON corrompido no storage. O `hasSave()` continua
 * true, o menu oferece "Continuar", e toda leitura falha em silêncio. O jogador
 * perde dados sem saber por quê e sem jeito de limpar.
 *
 * O portão lê o CÓDIGO FONTE dos módulos de persistência e exige que todo
 * `catch` que segue um `JSON.parse` chame `removeItem` da chave correspondente.
 * É o mesmo modelo dos outros portões: pega a classe, não o caso.
 */

const MODULOS = [
  // saveSystem chama deleteSave() (que por sua vez chama removeItem)
  { arquivo: 'saveSystem.ts', chave: 'deleteSave()' },
  { arquivo: 'diary.ts', chave: 'STORAGE_KEY' },
  { arquivo: 'achievements.ts', chave: 'STORAGE_KEY' },
  { arquivo: 'skins.ts', chave: "'luiz.skins_unlocked'" },
  { arquivo: 'leaderboard.ts', chave: 'STORAGE_KEY' },
];

function corpoAteCatch(fonte: string, indiceParse: number): string {
  // pega da linha do JSON.parse até o fim do catch seguinte
  const fim = fonte.indexOf('} catch', indiceParse);
  if (fim < 0) return '';
  const abertura = fonte.indexOf('{', fim);
  const fechamento = fonte.indexOf('}', abertura);
  return fonte.slice(fim, fechamento + 1);
}

describe('semSaveFantasma: JSON corrompido é apagado, não engolido', () => {
  for (const { arquivo, chave } of MODULOS) {
    it(`${arquivo}: catch de leitura chama removeItem`, () => {
      const fonte = readFileSync(join(__dirname, '..', 'systems', arquivo), 'utf8');
      const indiceParse = fonte.indexOf('JSON.parse');
      expect(indiceParse, `${arquivo} não faz JSON.parse`).toBeGreaterThan(-1);
      const catchDoParse = corpoAteCatch(fonte, indiceParse);
      const limpa = catchDoParse.includes('removeItem') || catchDoParse.includes('deleteSave()');
      expect(limpa, `${arquivo}: catch do JSON.parse não limpa o storage`).toBe(true);
      expect(catchDoParse, `${arquivo}: removeItem deve usar a chave do módulo`).toContain(chave);
    });
  }
});
