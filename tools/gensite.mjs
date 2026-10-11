/**
 * Gera `site/conteudo.js` a partir dos dados REAIS do jogo.
 *
 * O site não tem nenhuma lista escrita à mão: armas, fases e inimigos saem do
 * `config.ts`/`maps.ts` no build. Motivo é honestidade de dados — se o
 * balanceamento mudar, o site muda junto, e nenhum texto de marketing sobra
 * desatualizado.
 *
 * `config.ts` usa import sem extensão (sintaxe de bundler), então o Node não
 * carrega direto: o Vite carrega o módulo com a mesma resolução do build real
 * (`ssrLoadModule`), e o site lê o dado de lá.
 *
 * Uso: node tools/gensite.mjs
 */
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// `fileURLToPath`, não `pathname`: o projeto mora numa pasta com espaço, e o
// pathname vem percent-encoded ("Sargento%20Rios") — o Vite não acha nada.
const RAIZ = fileURLToPath(new URL('..', import.meta.url));

const servidor = await createServer({ root: RAIZ, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
const cfg = await servidor.ssrLoadModule('/src/config.ts');
await servidor.close();

// Campos lidos do `Weapon` real (types.ts): é `weaponClass` (pistol/machine/
// silencer), `shootRate` em SEGUNDOS entre tiros e `magazineSize`. Os nomes
// "family"/"fireRate"/"magazine" não existem, e a primeira versão do site
// imprimiu `undefined` nas duas colunas — medir contra o tipo evita isso.
const armas = cfg.WEAPONS.map((w) => ({
  nome: w.name,
  classe: w.weaponClass,
  dano: w.damage,
  cadencia: w.shootRate,
  pente: w.magazineSize ?? null,
  desc: cfg.WEAPON_DESC[w.name] ?? '',
}));

const fases = cfg.PHASES.map((f, i) => ({
  indice: i,
  nome: f.name,
  ondas: f.waves,
  dificuldade: f.difficulty ?? null,
  objetivo: f.objective,
  chefe: f.boss ?? null,
}));

const inimigos = Object.entries(cfg.ENEMY_TYPES).map(([tipo, v]) => ({
  tipo,
  vida: v.health,
  dano: v.damage,
  velocidade: v.speed,
}));

const dados = {
  geradoEm: new Date().toISOString().slice(0, 10),
  contadores: {
    fases: fases.length,
    armas: armas.length,
    chefes: fases.filter((f) => f.chefe).length,
    inimigos: inimigos.length,
    upgrades: Object.keys(cfg.UPGRADES ?? {}).length,
  },
  fases,
  armas,
  inimigos,
};

mkdirSync(join(RAIZ, 'site'), { recursive: true });
writeFileSync(
  join(RAIZ, 'site', 'conteudo.js'),
  `// Gerado por tools/gensite.mjs a partir de src/config.ts — não editar à mão.\nwindow.ASHFALL = ${JSON.stringify(dados, null, 1)};\n`,
);

console.log(`site/conteudo.js: ${dados.contadores.fases} fases, ${dados.contadores.armas} armas, ${dados.contadores.chefes} chefes, ${dados.contadores.inimigos} inimigos`);
