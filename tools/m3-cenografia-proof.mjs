/**
 * A prova da CENOGRAFIA AUTORAL (J3c-remainder + J3d): tochas no Castelo,
 * painel da estação no Espaço e berço no NÚCLEO — tudo de geração própria
 * (gen_assets_cenografia.py), porque o pack não tem (auditado: os 185
 * objetos são caixa ou cilindro) e a caça externa não achou pack 2D.
 *
 * Contrato testemunhável: o sprite autoral RENDERIZA na fase dele — a
 * célula de decor mais perto do spawn difere do piso ao redor (pixel
 * medido), e o PNG entra na fila de leitura do Murilo (regra 16).
 *
 * Uso: node tools/m3-cenografia-proof.mjs  (via `npm run cenografia`)
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };
const { page, erros, fechar } = await abrirJogo({ chromium });

// célula de decor mais perto do spawn (pré-computada de src/maps.ts)
const ALVOS = [
  { fase: 13, nome: 'Castelo', decor: { row: 15, col: 15 } },
  { fase: 14, nome: 'Espaço', decor: { row: 7, col: 7 } },
  { fase: 15, nome: 'NÚCLEO', decor: { row: 16, col: 19 } },
];

for (const { fase, nome, decor } of ALVOS) {
  console.log(`── ${nome} ──`);
  await irParaFase(page, fase);
  await page.waitForTimeout(900);

  // anda até a célula de decor (o teclado, como o foguete-proof: a câmera
  // segue o jogador e o shot prova o OBJETO, não o spawn)
  const pos = await page.evaluate(() => window.__ashfall.playerPos());
  const alvoX = decor.col * 64 + 32;
  const alvoY = decor.row * 64 + 32;
  const dx = alvoX - pos.x, dy = alvoY - pos.y;
  const teclaX = dx > 24 ? 'KeyD' : dx < -24 ? 'KeyA' : null;
  const teclaY = dy > 24 ? 'KeyS' : dy < -24 ? 'KeyW' : null;
  const passosX = Math.min(20, Math.ceil(Math.abs(dx) / 200));
  const passosY = Math.min(20, Math.ceil(Math.abs(dy) / 200));
  if (teclaX) { await page.keyboard.down(teclaX); await page.waitForTimeout(passosX * 250); await page.keyboard.up(teclaX); }
  await page.waitForTimeout(300);
  if (teclaY) { await page.keyboard.down(teclaY); await page.waitForTimeout(passosY * 250); await page.keyboard.up(teclaY); }
  await page.waitForTimeout(300);

  const amostra = await page.evaluate((dc) => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const cam = window.__ashfall.camera();
    const ler = (col, row) => {
      const x = Math.round(col * 64 + 32 - cam.x);
      const y = Math.round(row * 64 + 32 - cam.y);
      const d = ctx.getImageData(x, y, 1, 1).data;
      return d[0] * 0.3 + d[1] * 0.59 + d[2] * 0.11;
    };
    return { decor: ler(dc.col, dc.row), piso: ler(dc.col + (dc.col > 15 ? -2 : 2), dc.row) };
  }, decor);
  console.log(`  luminância: decor ${amostra.decor.toFixed(0)} · piso ${amostra.piso.toFixed(0)}`);
  if (Math.abs(amostra.decor - amostra.piso) < 8) nota(`${nome}: o decor não lê sobre o piso (${amostra.decor.toFixed(0)} vs ${amostra.piso.toFixed(0)})`);
  await page.screenshot({ path: `tools/shots/cenografia-${nome}.png` });
}

if (erros.length) nota(`erros de página: ${[...new Set(erros)].join('; ')}`);
console.log(problemas.length === 0
  ? '\nOK — tocha, painel e berço renderizam nas fases deles (pixel medido)'
  : `\nFALHA — ${problemas.length} problema(s)`);
await fechar();
process.exit(problemas.length === 0 ? 0 : 1);
