/**
 * Verificação do build de produção.
 *
 * Roda contra `dist/`, não contra `public/`: o que quebra na hora de subir é o
 * arquivo que o Vite não copiou, não o que está na origem. O projeto já teve
 * 404 de tile por pad de dígito e assets que funcionavam em `npm run dev` e
 * sumiam no build, então a checagem é do artefato, não da fonte.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(__dirname, '..', '..', 'dist');

let distExists = false;
let indexHtml = '';
let bundle = '';

beforeAll(() => {
  distExists = existsSync(join(DIST, 'index.html'));
  if (!distExists) return;
  indexHtml = readFileSync(join(DIST, 'index.html'), 'utf8');
  const m = indexHtml.match(/src="\.\/([^"]+\.js)"/);
  if (m) bundle = readFileSync(join(DIST, m[1]), 'utf8');
});

/** Só roda a checagem se o build existe; senão o teste falharia por ordem. */
describe('dist: build de produção íntegro', () => {
  it('o build foi gerado (rode `npm run build` antes)', () => {
    expect(
      distExists,
      'dist/index.html não existe — rode `npm run build`',
    ).toBe(true);
  });

  it('o index.html aponta para o bundle com caminho relativo', () => {
    // Com `base` absoluto o jogo não abre dentro do iframe do itch.io.
    expect(indexHtml).toMatch(/src="\.\/assets\/[^"]+\.js"/);
    expect(indexHtml).not.toMatch(/src="\/assets\//);
    expect(indexHtml).not.toMatch(/src="http/);
  });

  it('o bundle foi emitido e não está vazio', () => {
    expect(bundle.length).toBeGreaterThan(1000);
  });

  it('nenhuma referência a asset usa caminho absoluto', () => {
    // `'/assets/...'` em qualquer string de fetch/img/src quebra em subpath.
    expect(bundle).not.toMatch(/["']\/assets\//);
  });

  it('o build não contém TypeScript em modo debug', () => {
    expect(bundle).not.toContain('bubbleShooter_');
    expect(bundle).not.toContain('bubble.');
  });

  it('a música e os efeitos foram copiados', () => {
    for (const f of ['menu', 'combat', 'boss', 'shop', 'epilogo',
      'combat_ruinas', 'combat_industrial', 'combat_terminal']) {
      expect(existsSync(join(DIST, 'assets', 'music', `${f}.ogg`)), `música ${f}`).toBe(true);
    }
    expect(existsSync(join(DIST, 'assets', 'sfx', 'pistol.ogg'))).toBe(true);
  });

  it('o pack de sprites foi copiado', () => {
    expect(existsSync(join(DIST, 'assets', 'sprites', 'topdown-shooter', 'PNG', 'Tiles', 'tile_01.png'))).toBe(true);
    expect(
      existsSync(join(DIST, 'assets', 'sprites', 'topdown-shooter', 'PNG', 'Survivor 1', 'survivor1_gun.png')),
    ).toBe(true);
    expect(existsSync(join(DIST, 'assets', 'sprites', 'enemies', 'pardal.png'))).toBe(true);
  });

  it('o crédito de licença dos assets está no build', () => {
    // O CC-BY dos tiros e a atribuição da música são obrigatórios.
    expect(existsSync(join(DIST, 'assets', 'CREDITS.md'))).toBe(true);
    expect(existsSync(join(DIST, 'assets', 'music', 'CREDITS.md'))).toBe(true);
  });

  it('o jogo se identifica como SARGENTO LUIZ, não como nenhum dos nomes antigos', () => {
    expect(indexHtml).toContain('SARGENTO LUIZ');
    expect(bundle).not.toContain('Bubble Shooter');
    // "ASHFALL" colide com 8+ jogos no itch.io e vários são marcados como
    // "AI Assisted". Nenhum vestígio do nome antigo pode sobrar no build.
    expect(bundle, 'o bundle ainda contém ASHFALL').not.toContain('ASHFALL');
    expect(indexHtml, 'o index.html ainda contém ASHFALL').not.toContain('ASHFALL');
  });

  it('o zip do package sai com o nome novo', () => {
    const pkg = JSON.parse(readFileSync(join(DIST, '..', 'package.json'), 'utf8'));
    expect(pkg.name).toBe('sargento-luiz');
  });
});
