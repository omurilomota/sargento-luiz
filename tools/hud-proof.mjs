/**
 * Prova de legibilidade do HUD (regra 16).
 *
 * A regra diz que mudar `hud.ts` exige abrir o PNG. O que o PNG do jogador
 * mostrou foi a barra de vida colada na de XP e o rótulo `DASH` encostando em
 * `1-9: trocar arma`. As duas posições saem de `getHudHintsLayout`, que é
 * geométrica — mas ela só provava que as seções não se sobrepõem entre si, não
 * que o texto CABE.
 *
 * Aqui a medição é de pixel: o script mede a largura real de cada string com o
 * canvas do jogo e compara com a caixa que a contém. Fonte monospace de 11px
 * mede ~6.6px por caractere, e um rótulo 3px mais largo que a coluna invade a
 * layer vizinha sem nenhum teste de geometria accusing.
 *
 * As resoluções são as que a doc usa (menuLayout mede em 4) mais uma 720p
 * baixa, que é onde o HUD fica apertado.
 *
 * Uso: node tools/hud-proof.mjs   (requer `npm run build` antes)
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
  '.png': 'image/png', '.ogg': 'audio/ogg',
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
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu'],
});

const RESOLUCOES = [
  { w: 1280, h: 720 },
  { w: 1920, h: 1080 },
  { w: 1024, h: 640 },
  { w: 2560, h: 1440 },
];

const problemas = [];
let mexeu = false;

for (const { w, h } of RESOLUCOES) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(400);
  const c = await page.evaluate(() => window.__ashfall.cena());
  if (c.ativa) { await page.keyboard.press('Backspace'); await page.waitForTimeout(500); }

  // um estado de verdade: vida alta (barra cheia), nível com XP, skills com
  // rótulo, dica de tecla e power-up ativo. É o estado da imagem do usuário.
  const medidas = await page.evaluate(() => window.__ashfall.hudMedir());

  for (const m of medidas) {
    if (m.largura > m.caixa) {
      problemas.push(`${w}x${h}: "${m.texto}" mede ${Math.round(m.largura)}px e a caixa tem ${m.caixa}px (${m.caixaNome})`);
    }
  }

  // As camadas da coluna esquerda não podem se sobrepor. A régua é o TOPO REAL
  // do glifo, não a caixa inteira da fonte: em monospace de 11px o topo fica
  // ~9px acima do baseline (a caixa de 11px é toda linha de altura). Exigir 11px
  // de folga entre baselines empurraria o layout 2px sem necessidade e reprovar
  // um HUD que está legível.
  const TOPO_GLIFO = (px) => px * 0.82;
  const camadas = ['vidaFim', 'xpRotuloY', 'skillRotuloY', 'hintsY'];
  for (let i = 1; i < camadas.length; i++) {
    const anterior = medidas.find(m => m.camada === camadas[i - 1]);
    const atual = medidas.find(m => m.camada === camadas[i]);
    if (!anterior || !atual) continue;
    const folga = atual.camadaY - anterior.camadaFim;
    if (folga < TOPO_GLIFO(atual.alturaFonte)) {
      problemas.push(
        `${w}x${h}: ${camadas[i - 1]} termina em ${anterior.camadaFim} e ` +
        `${camadas[i]} começa em ${atual.camadaY} — folga de ${folga}px para glifo de ${Math.round(TOPO_GLIFO(atual.alturaFonte))}px`,
      );
    }
  }

  await page.screenshot({ path: join(SHOTS, `hud-${w}x${h}.png`) });
  console.log(`${w}x${h}: ${medidas.length} medidas, ${medidas.filter(m => m.largura > m.caixa).length} estouro(s)`);
  await page.close();
  mexeu = true;
}

await browser.close();
servidor.close();

console.log('─'.repeat(52));
if (problemas.length === 0) {
  console.log('OK — nada estoura a caixa e as camadas da coluna esquerda têm folga.');
} else {
  for (const p of problemas) console.log(`FALHA ${p}`);
}
console.log(mexeu ? `screenshots: tools/shots/hud-*.png (${RESOLUCOES.length})` : '');
process.exit(problemas.length === 0 ? 0 : 1);