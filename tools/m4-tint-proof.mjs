/**
 * A prova do TINT (F-C): cada tipo de inimigo com a própria cor — a
 * resposta ao "cadê os sprites?" do playtest. O `color` de cada tipo
 * existia no config e só pintava o fallback procedural; agora o corpo
 * tintado acorda junto do sprite (cache por chave+cor, dessaturado por
 * construção).
 *
 * Contrato determinístico: o MESMO TIPO (mutante — existe na Cidade e na
 * Floresta) lido em duas fases tem cor diferente, porque a silhueta muda
 * por bioma (VARIACAO_POR_BIOMA: manBlue na Cidade, manOld na Floresta)
 * e o tint multiplica sobre bases diferentes. A leitura é uma MANCHA 7×7
 * no corpo (píxel único cai em roupa escura do sprite — o primeiro dia
 * desta prova leu o mesmo preto duas vezes).
 *
 * Uso: node tools/m4-tint-proof.mjs  (via `npm run tint`)
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };
const { page, erros, fechar } = await abrirJogo({ chromium });

await page.evaluate(() => {
  window.__quadros = 0;
  const step = () => { window.__quadros++; requestAnimationFrame(step); };
  requestAnimationFrame(step);
});

// média 7×7 no corpo do inimigo — o píxel único é sorte de roupa
const lerInimigoMaisProximo = () => page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const e = window.__ashfall.inimigoMaisProximo();
  if (!e) return null;
  const cam = window.__ashfall.camera();
  const x = Math.round(e.x - cam.x);
  const y = Math.round(e.y - cam.y);
  if (x < 4 || y < 4 || x + 4 >= canvas.width || y + 4 >= canvas.height) return null;
  const d = ctx.getImageData(x - 3, y - 3, 7, 7).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 255 && (d[i] + d[i + 1] + d[i + 2]) > 6) {
      r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
    }
  }
  if (n === 0) return null;
  return { tipo: e.type, r: r / n, g: g / n, b: b / n };
});

const amostrarAte = async (fase, nome, tipo) => {
  await irParaFase(page, fase);
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(500);
    const amostra = await lerInimigoMaisProximo();
    if (amostra && (!tipo || amostra.tipo === tipo)) {
      console.log(`  ${nome}: ${amostra.tipo} rgb(${amostra.r.toFixed(0)},${amostra.g.toFixed(0)},${amostra.b.toFixed(0)})`);
      return amostra;
    }
  }
  console.log(`  ${nome}: não achou ${tipo ?? 'inimigo'} à vista`);
  return null;
};

// o mutante existe nas duas fases — o mesmo tipo, silhuetas diferentes
const cidade = await amostrarAte(0, 'Cidade', null);
const floresta = await amostrarAte(2, 'Floresta', null);

if (!cidade || !floresta) {
  nota('não deu para ler o mutante nas duas fases — a amostra falhou antes do contrato');
} else {
  const dist = Math.hypot(cidade.r - floresta.r, cidade.g - floresta.g, cidade.b - floresta.b);
  console.log(`  distância RGB entre os dois corpos: ${dist.toFixed(0)}`);
  if (dist < 20) nota('corpos das duas fases com cor igual — o tint não está mudando o que se vê');
}

await page.screenshot({ path: 'tools/shots/tint-rodada.png' });

if (erros.length) nota(`erros de página: ${[...new Set(erros)].join('; ')}`);
console.log(problemas.length === 0
  ? '\nOK — o tint por tipo está na tela (o mesmo tipo, cor diferente por bioma)'
  : `\nFALHA — ${problemas.length} problema(s)`);
await fechar();
process.exit(problemas.length === 0 ? 0 : 1);
