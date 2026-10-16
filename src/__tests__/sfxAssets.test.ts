import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { SFX_FILES } from '../systems/audio';

/**
 * Este arquivo existe pela mesma razão de `assets.test.ts`: o caminho
 * do asset é contrato, não tipo. `SFX_FILES` declara 42 chaves que o
 * jogo busca em `assets/sfx/<chave>.ogg` (as 29 originais + as 9 de 10/10:
 * 7 recargas por família, ferrugem e peça — as que zeraram o `semProcedural`); se o arquivo não existe, o
 * jogo cai no procedural sem avisar — o som "funciona", mas a campanha
 * de assets regrediu silenciosamente. `tsc` não pega arquivo faltando.
 *
 * `process.cwd()` é a raiz do projeto no vitest.
 */

const SFX_DIR = 'public/assets/sfx';

describe('sfx: toda chave de SFX_FILES tem arquivo no disco', () => {
  it('as 50 chaves declaram arquivo em assets/sfx/ (43-50ª: a ambiência M1)', () => {
    const chaves = Object.keys(SFX_FILES);
    expect(chaves).toHaveLength(50);
    for (const chave of chaves) {
      const arquivo = SFX_FILES[chave].file;
      expect(arquivo, `${chave} declara caminho fora de assets/sfx/`).toBe(`assets/sfx/${chave}.ogg`);
      expect(existsSync(join('public', arquivo)),
        `arquivo faltando: ${arquivo} (chave ${chave})`).toBe(true);
    }
  });

  it('nenhum arquivo em assets/sfx/ está órfão (sem chave)', () => {
    const chaves = new Set(Object.keys(SFX_FILES));
    const noDisco = readdirSync(SFX_DIR).filter(f => f.endsWith('.ogg'));
    const orfaos = noDisco.map(f => f.replace(/\.ogg$/, '')).filter(f => !chaves.has(f));
    expect(orfaos, `arquivo sem chave em SFX_FILES: ${orfaos.join(', ')}`).toEqual([]);
  });

  it('cada arquivo é um OGG Vorbis decodificável (não vazio)', () => {
    for (const chave of Object.keys(SFX_FILES)) {
      const caminho = join(SFX_DIR, `${chave}.ogg`);
      // OGG Vorbis começa com a captura pattern "OggS"
      const cabeca = readFileSync(caminho).subarray(0, 4).toString('latin1');
      expect(cabeca, `${chave}.ogg não é um OGG (cabeçalho ${cabeca})`).toBe('OggS');
    }
  });
});
