/**
 * Prova de campanha: joga as 16 fases em sequência e grava o que aconteceu.
 *
 * Por que esta prova existe
 * -------------------------
 * As outras 4 provam UM trecho cada: a fase fecha com o chefe morto, a bala
 * sai na direção certa, o embed do itch aceita fullscreen. Nenhuma prova a
 * sequência inteira — e foi por isso que bugs de campanha passaram com 717
 * testes verdes.
 *
 * Duas passagens, em ordem deliberada:
 *
 *   A) DANO (primeiro, numa partida nova logo após o boot) — quanto cada fase
 *      cobra de quem não atira. É o que responde se o Espaço é hostil demais.
 *      Precisa ser primeiro porque é a única que depende de a vida zerar: depois
 *      de terminar a campanha o state machine passa pelo epílogo e pelo menu, e
 *      voltar disso pelo teclado é frágil (BACKSPACE na cena de fim chama
 *      `startRun()` e reinicia no meio).
 *
 *   B) ESTRUTURA (mesma partida, com cura) — ordem das 16 fases, chefe em cada
 *      uma, e se alguma fecha sem chefe.
 *
 * A passagem de dano não é um jogador: é um termômetro. Serve para comparar
 * fases entre si, não para prever se um humano sobrevive.
 *
 * Uso: node tools/campanha-proof.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');
const SHOTS = join(RAIZ, 'tools', 'shots');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.ogg': 'audio/ogg', '.md': 'text/markdown',
};

const servidor = createServer(async (req, res) => {
  const u = (req.url || '/').split('?')[0];
  const p = join(DIST, u === '/' ? 'index.html' : decodeURIComponent(u));
  if (!existsSync(p)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const porta = servidor.address().port;

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erros = [];
page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') erros.push(`console: ${m.text()}`); });

mkdirSync(SHOTS, { recursive: true });

const f = () => page.evaluate(() => window.__ashfall.fase());
const curar = () => page.evaluate(() => window.__ashfall.curar());
const matarTodos = () => page.evaluate(() => window.__ashfall.matarTodos());
const matarChefe = () => page.evaluate(() => window.__ashfall.matarChefe());
const cena = () => page.evaluate(() => window.__ashfall.cena());


const ORDEM_ESPERADA = [
  'Cidade em Ruínas', 'Rodovia', 'Floresta', 'Hospital de Campanha', 'Caverna',
  'Fábrica', 'Pátio de Trens', 'Ponte', 'Pântano', 'Refinaria',
  'Subestação', 'Vulcão', 'Porto', 'Castelo', 'Espaço', 'NÚCLEO-CENTRAL',
];

const relatorio = [];
const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };

/** Tira a cutscene se estiver na tela. */
async function limparCena() {
  const c = await cena();
  if (!c.ativa) return false;
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(600);
  return true;
}

/** Avança o diálogo até acabar. */
async function fecharCenaPorTeclas() {
  // O teto é 2 toques por linha (um completa, um avança) + margem: o epílogo
  // da Parte I tem 29 linhas e o teto antigo (40) deixava a cena aberta no
  // meio dela — a prova passava porque o epílogo não está no contrato de
  // fases, mas a cena deixava de ser atravessada de verdade.
  for (let i = 0; i < 160; i++) {
    const c = await cena();
    if (!c.ativa) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(160);
  }
}

/** Entra numa partida nova e sai do menu com o combate rolando. */
async function comecarPartida() {
  await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.keyboard.press('Enter');       // menu -> PRÓLOGO
  await page.waitForTimeout(1100);
  await page.keyboard.press('Backspace');   // skipCutscene -> startRun
  await page.waitForTimeout(900);
  await limparCena();
  return (await f()).estado;
}

async function sairDaLoja() {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
}

/**
 * Joga a fase atual até fechar.
 *
 * `forcado` marca as fases que não fecharam sozinhas e tiveram de ser
 * empurradas — isso é diagnóstico. Objetivos diferentes exigem coisas
 * diferentes (Caverna é `destroy`, Fábrica é `survive`), e esta prova não
 * satisfaz nenhum de propósito: ela mede a SEQUÊNCIA de fases, não o detalhe de
 * cada uma — esse é o `fase-proof.mjs`.
 */
async function jogarFase({ curarJogador, forcarApos = 12000, limite = 40000 }) {
  await limparCena();
  let s = await f();
  const registro = {
    fase: s.fase, indice: s.indice, dificuldade: s.dificuldade,
    objetivo: s.objetivo, ondas: s.ondas,
    vidaMax: s.vidaMax, vidaInicial: s.vida,
    ondasVistas: new Set(), tiposVistos: new Set(),
    chefeApareceu: false, forcado: false, fechouNaLoja: false,
    vidaMinima: s.vidaMax,
  };

  const inicio = Date.now();
  while (Date.now() - inicio < limite) {
    s = await f();
    if (s.estado === 'gameover') { registro.morreu = true; break; }
    if (s.estado === 'shop') { registro.fechouNaLoja = true; break; }
    // H2: a caixa pequena de diálogo da Fábrica congela o mundo — a prova
    // atravessa com ENTER (o mesmo que o bot faz). Sem isto, a fase nunca
    // avança de onda e o diagnóstico leria "não fechou" sem ser culpa dela.
    if (await page.evaluate(() => window.__ashfall.dialogo?.() ?? false)) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      continue;
    }

    registro.ondasVistas.add(s.onda);
    for (const t of s.tipos) registro.tiposVistos.add(t);
    if (s.vida < registro.vidaMinima) registro.vidaMinima = s.vida;

    if (s.chefeVivo) {
      registro.chefeApareceu = true;
      matarChefe();
      await page.waitForTimeout(600);
    } else {
      matarTodos();
      // Pausa deliberada: matar em loop apertado impede o spawner de fechar a
      // cota, e sem a cota preenchida o `waveComplete` nunca vem.
      await page.waitForTimeout(500);
    }
    if (curarJogador) await curar();

    if (!registro.forcado && Date.now() - inicio > forcarApos) {
      registro.forcado = true;
      await page.evaluate(() => {
        // Desde o B3 do Vulcão o fim exige o objetivo de verdade: forçar
        // última onda + chefe sem cumprir o objetivo deixava a fase aberta
        // para sempre (a campanha travava na Caverna, que tem `destroy`).
        window.__ashfall.cumprirObjetivo();
        window.__ashfall.pularParaUltimaOnda();
        window.__ashfall.invocarChefe();
      });
      await page.waitForTimeout(600);
    }
  }
  s = await f();
  registro.ultimaOndaVista = Math.max(0, ...registro.ondasVistas);
  registro.ondasVistas = [...registro.ondasVistas].sort((a, b) => a - b);
  registro.tiposVistos = [...registro.tiposVistos];
  registro.vidaFinal = s.vida;
  registro.moedas = (await page.evaluate(() => window.__ashfall.telemetria())).moedas;
  registro.estadoFinal = s.estado;
  relatorio.push(registro);
  return registro;
}

// ─── PASSAGEM A: dano na entrada de cada fase ───
//
// A simulação no navegador NÃO serve para isto. `matarTodos()` mata o inimigo
// antes do contato, e em 15 das 16 fases a vida mínima medida foi 100% — o número
// não dizia nada. Medir pelo gameplay exige um agente que não atira e não se
// mexe, que este harness não é.
//
// Então a passagem A é DETERMINÍSTICA: aplica a fórmula real do `spawner.ts` e a
// do `damageTaken()` de `main.ts`, lendo a config DELE MESMO pelo hook
// `__ashfall.config()` (uma versão anterior lia `config.ts` por regex e pegou
// 14 das 16 fases sem avisar).
//
//   danoEscalado  = floor(def.damage × waveScale × timeScale)
//   waveScale     = (1 + onda × 0.15) × difficulty      <- onda 0 = entrada da fase
//   timeScale     = 1 + min(tempo/90, 3) × 0.15         <- t0 = 1
//   danoNoJogador = floor(danoEscalado × takenMult)     <- bioma + habilidade
await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const cfg = await page.evaluate(() => window.__ashfall.config());
const takenMult = { lowGravity: 1.1, darkness: 1.1, spikes: 1.1 };

console.log('\n═══ PASSAGEM A — DANO NA ENTRADA DA FASE (determinístico) ═══\n');
console.log(`  dano de 1 inimigo na onda 1, jogador parado e sem escudo (vida base ${cfg.vidaBase})\n`);
console.log('  ' + 'fase'.padEnd(18) + 'dif'.padEnd(9) + 'bioma'.padEnd(13) + 'pior inimigo'.padEnd(17) + 'dano'.padEnd(6) + 'hits');
console.log('  ' + '-'.repeat(70));

const tabelaDano = [];
for (const ph of cfg.fases) {
  const dif = ph.difficulty ?? 1;                 // resetSpawner: 1 quando ausente
  const tm = takenMult[ph.hazard] ?? 1;
  let pior = null;
  for (const t of ph.enemyTypes) {
    const d = cfg.inimigos[t];
    if (!d) continue;
    const esc = Math.floor(d.damage * dif);      // onda 0, tempo 0
    const noJogador = Math.floor(esc * tm);
    if (!pior || noJogador > pior.noJogador) pior = { tipo: t, base: d.damage, noJogador };
  }
  if (!pior) continue;
  const hits = Math.ceil(cfg.vidaBase / pior.noJogador);
  tabelaDano.push({ fase: ph.name, dif: ph.difficulty, hazard: ph.hazard, ...pior, hits });
  console.log(
    '  ' + ph.name.padEnd(18) +
    (ph.difficulty !== null ? String(ph.difficulty) : 'AUSENTE').padEnd(9) +
    (ph.hazard + (tm > 1 ? '×' + tm : '')).padEnd(13) +
    (pior.tipo + '(' + pior.base + ')').padEnd(17) +
    String(pior.noJogador).padEnd(6) + hits
  );
}

const semDifDano = tabelaDano.filter((t) => t.dif === null);
const comDif = tabelaDano.filter((t) => t.dif !== null);
if (semDifDano.length) {
  console.log('\n  Fases SEM difficulty declarado: ' + semDifDano.map((t) => t.fase).join(', '));
  console.log('  → difficulty ausente cai no 1 de resetSpawner, ACIMA da média do resto:');
  console.log('    declarada vai de ' + Math.min(...comDif.map((t) => t.dif)) + ' a ' + Math.max(...comDif.map((t) => t.dif)));
}
const maisBrutais = [...tabelaDano].sort((a, b) => a.hits - b.hits).slice(0, 3);
console.log('\n  Fases mais brutais (hits p/ matar a partir da vida base):');
for (const t of maisBrutais) {
  console.log(`    ${t.hits} hits — ${t.fase} (${t.tipo}, ${t.noJogador} de dano, dif ${t.dif ?? 'AUSENTE'})`);
}

// ─── PASSAGEM B: estrutura (partida nova, com cura) ───
console.log('\n═══ PASSAGEM B — ESTRUTURA DA CAMPANHA (com cura) ═══\n');
console.log('  estado inicial:', await comecarPartida());

for (let i = 0; i < ORDEM_ESPERADA.length; i++) {
  const r = await jogarFase({ curarJogador: true });
  console.log(
    `  ${String(i + 1).padStart(2)}. ${r.fase.padEnd(18)} ` +
    `dif=${String(r.dificuldade ?? 'AUSENTE').padEnd(8)} ` +
    `obj=${String(r.objetivo).padEnd(8)} ` +
    `ondas=[${r.ondasVistas.join(',')}]/${r.ondas} ` +
    `chefe=${r.chefeApareceu ? 'sim ' : 'NÃO '} ` +
    `${r.forcado ? 'empurrada' : 'sozinha '} ` +
    `loja=${r.fechouNaLoja ? 'sim' : 'NÃO'}`
  );
  if (r.fase !== ORDEM_ESPERADA[i]) {
    nota(`fase ${i + 1} é "${r.fase}", esperava "${ORDEM_ESPERADA[i]}"`);
  }
  if (!r.fechouNaLoja && !r.morreu) nota(`${r.fase}: não fechou nem na loja nem morrendo`);
  // o sintoma reportado: a fase fecha e o chefe nunca entrou em cena
  if (r.fechouNaLoja && !r.chefeApareceu) nota(`${r.fase}: FECHOU SEM O CHEFE`);
  // A fase final é o desfile (NUCLEO_RUSH desde a entrada): não existe onda
  // comum ali — o que encerra a fase é o último chefe da fila, não a última
  // onda, então "viu todas as ondas" não se aplica a ela.
  if (r.ultimaOndaVista !== r.ondas && i < ORDEM_ESPERADA.length - 1) {
    nota(`${r.fase}: viu só até a onda ${r.ultimaOndaVista} de ${r.ondas}`);
  }
  // O "onda 2 na entrada" (relato 2026-10-14): a cota parcial da fase
  // anterior fazia o primeiro frame pular a onda 1. A fase tem que COMEÇAR
  // na onda 1 — sem isto, o que se mede depois é uma fase pela metade.
  if (!r.ondasVistas.includes(1) && i < ORDEM_ESPERADA.length - 1) {
    nota(`${r.fase}: começou na onda ${r.ondasVistas[0] ?? '?'} — a onda 1 foi pulada na entrada`);
  }
  if (r.estadoFinal === 'shop') await sairDaLoja();
  const st = await f();
  if (st.estado === 'gameover' && i < ORDEM_ESPERADA.length - 1) {
    nota(`campanha TERMINOU na fase ${i + 1} — faltavam ${ORDEM_ESPERADA.length - i - 1}`);
    break;
  }
  if (st.indice === r.indice && i < ORDEM_ESPERADA.length - 1) {
    nota(`não avançou de ${r.fase}: o índice continua ${st.indice}`);
    break;
  }

  // A porta do bug do Murilo (2026-10-13): a abertura da fase final termina
  // com o índice EM CIMA do epílogo — o jogador que passava a cutscene com
  // ENTER ganhava o fim de campanha na entrada do Bunker. A prova terminava
  // as cenas com BACKSPACE e era cega para isso. Agora ela atravessa a
  // abertura do NÚCLEO-CENTRAL com a tecla de verdade e exige o combate.
  if (i === ORDEM_ESPERADA.length - 2 && st.estado === 'playing') {
    await fecharCenaPorTeclas();
    const depois = await f();
    if (depois.estado !== 'playing') {
      nota(`a abertura da fase final terminou em "${depois.estado}" — fim de campanha por passar a cutscene`);
    }
  }
}

await page.screenshot({ path: join(SHOTS, 'campanha-final.png') });
await browser.close();
servidor.close();

console.log('\n═══ DIAGNÓSTICO ESTRUTURAL ═══');
console.log('  Inimigos que realmente entraram em cada fase (medido, não do config):');
const vistos = new Map();
for (const r of relatorio) {
  if (!r.tiposVistos?.length) continue;
  if (!vistos.has(r.fase)) vistos.set(r.fase, new Set());
  for (const t of r.tiposVistos) vistos.get(r.fase).add(t);
}
for (const [fase, tipos] of vistos) {
  console.log(`    ${fase.padEnd(18)} ${[...tipos].sort().join(', ')}`);
}
const chefes = relatorio.filter(r => r.indice !== undefined).map(r => r.chefeApareceu);
console.log(`\n  Chefes vistos: ${chefes.filter(Boolean).length}/${chefes.length} fases`);

console.log(`\n${problemas.length === 0 ? 'Nenhum problema estrutural.' : `${problemas.length} problema(s) estrutural(is).`}`);
if (erros.length) {
  console.log('\nerros de página:');
  for (const e of [...new Set(erros)]) console.log(`  ${e}`);
}
if (problemas.length) process.exit(1);