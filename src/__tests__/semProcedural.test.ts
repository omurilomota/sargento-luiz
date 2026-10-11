import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Portão de som: nenhuma função `sfx*` nasce 100% procedural.
 *
 * O áudio do jogo tem duas camadas: arquivo real primeiro (`playSfxFile` →
 * `assets/sfx/<chave>.ogg`, cobertos pelo `sfxAssets.test.ts`) e síntese de
 * Web Audio como fallback. A regra do projeto é que som é arquivo (CC0), não
 * síntese — a síntese é o fallback de quem não carregou.
 *
 * A lista abaixo é DÍVIDA DECLARADA, e está VAZIA desde 10/10: os 4 que só
 * existiam como síntese ganharam arquivo CC0 — recarga por família (pente de
 * pistola, bomba de shotgun, fuzil, rifle — cada família com o seu timbre, que
 * um arquivo único perderia), rangido de ferrugem e encaixe metálico de peça;
 * `sfxCondicao` delega para ferrugem e para o `jammed` que já estava no banco.
 * A lista fica porque o teste existe para encolher, não para sumir: débito
 * novo entra aqui com o porquê, e o diff mostra a decisão.
 */

const AUDIO = join(__dirname, '..', 'systems', 'audio.ts');

/** Débito atual — cada um com o motivo de ainda estar na síntese. */
const DEBITO: Record<string, string> = {};

/** Extrai o corpo de cada `export function sfxX(...): void { ... }` do fonte. */
function corposSfx(fonte: string): Map<string, string> {
  const corpos = new Map<string, string>();
  const abertura = /export function (sfx\w+)\s*\([^)]*\)\s*:\s*void\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = abertura.exec(fonte))) {
    let nivel = 1;
    let i = abertura.lastIndex;
    for (; i < fonte.length && nivel > 0; i++) {
      if (fonte[i] === '{') nivel++;
      else if (fonte[i] === '}') nivel--;
    }
    corpos.set(m[1], fonte.slice(abertura.lastIndex, i));
  }
  return corpos;
}

const CORPOS = corposSfx(readFileSync(AUDIO, 'utf8'));

describe('semProcedural: som nasce de arquivo, não de síntese', () => {
  it('a extração está viva (o teste morde)', () => {
    // Se o regex de extração quebrar, o mapa esvazia e o portão aprovaria tudo
    // em silêncio. O jogo tem 33 funções sfx* — o piso é folgado de propósito.
    expect(CORPOS.size).toBeGreaterThanOrEqual(30);
  });

  it('toda função sfx* tenta um arquivo antes de sintetizar', () => {
    const semArquivo = [...CORPOS.entries()]
      .filter(([, corpo]) => !corpo.includes('playSfxFile('))
      .map(([nome]) => nome)
      .sort();
    const declarado = Object.keys(DEBITO).sort();
    const novo = semArquivo.filter((n) => !declarado.includes(n));
    expect(
      novo,
      `função sem arquivo fora da lista de débito: ${novo.join(', ')}. ` +
      `Use playSfxFile (arquivo CC0) ou declare acima com o porquê — a lista ` +
      `existe para encolher, não para crescer.`,
    ).toEqual([]);
    expect(
      semArquivo,
      `débito pago? se sim, remova da lista: ${declarado.filter((n) => !semArquivo.includes(n)).join(', ')}`,
    ).toEqual(declarado);
  });

  it('cada débito declarado ainda existe no arquivo', () => {
    // Renomear uma função sem pagar o débito não pode fazer a dívida sumir.
    for (const nome of Object.keys(DEBITO)) {
      expect(CORPOS.has(nome), `débito declarado para função que não existe: ${nome}`).toBe(true);
    }
  });
});
