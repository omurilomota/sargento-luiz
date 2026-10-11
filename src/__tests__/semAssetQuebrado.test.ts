import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Portão de asset quebrado: a ÁRVORE INTEIRA chega ao build.
 *
 * Divisão de trabalho com os vizinhos: `assets.test.ts` e `sfxAssets.test.ts`
 * provam que todo nome que o CÓDIGO pede existe no disco; `distBuild.test.ts`
 * prova que o build está íntegro em amostras. O buraco que sobra é o inverso:
 * um arquivo que está em `public/assets/` e não chega a `dist/assets/` (pasta
 * nova, cópia parcial), ou que chegou truncado (0 byte). Os dois já
 * aconteceram nesta base — o sintoma é 404 só em produção.
 *
 * O inventário do Vite é `public/` → raiz do `dist/`: `public/assets/x/y.png`
 * vira `dist/assets/x/y.png`.
 */

const RAIZ = join(__dirname, '..', '..');
const PUBLIC = join(RAIZ, 'public', 'assets');
const DIST = join(RAIZ, 'dist');

function arquivosDe(dir: string): string[] {
  const arquivos: string[] = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) arquivos.push(...arquivosDe(caminho));
    else arquivos.push(caminho);
  }
  return arquivos;
}

const ARQUIVOS = arquivosDe(PUBLIC);
const TEM_DIST = existsSync(join(DIST, 'index.html'));

describe('semAssetQuebrado: a árvore inteira chega ao build', () => {
  it('a árvore não está vazia (o teste morde)', () => {
    expect(ARQUIVOS.length).toBeGreaterThan(200);
  });

  it('o build foi gerado (rode `npm run build` antes)', () => {
    expect(TEM_DIST, 'dist/index.html não existe — rode `npm run build`').toBe(true);
  });

  it.skipIf(!TEM_DIST)('todo arquivo de public/assets existe em dist/assets', () => {
    const faltando = ARQUIVOS
      .filter((f) => !existsSync(join(DIST, 'assets', relative(PUBLIC, f))))
      .map((f) => relative(RAIZ, f));
    expect(
      faltando,
      `${faltando.length} arquivo(s) não chegaram ao dist. Primeiros: ` +
      `${faltando.slice(0, 5).join(', ')}${faltando.length > 5 ? '…' : ''}`,
    ).toEqual([]);
  });

  it.skipIf(!TEM_DIST)('nenhum arquivo do dist está truncado (0 byte)', () => {
    const vazios = ARQUIVOS
      .filter((f) => statSync(f).size === 0)
      .map((f) => relative(RAIZ, f));
    expect(vazios, `arquivos de 0 byte: ${vazios.join(', ')}`).toEqual([]);
  });
});
