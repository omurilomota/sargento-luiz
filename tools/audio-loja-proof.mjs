/** Prova: M/S/O funcionam na loja e o overlay desenha. */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.png':'image/png', '.ogg':'audio/ogg' };
const s = createServer(async (req,res)=>{ const u=(req.url||'/').split('?')[0]; const p=join(DIST,u==='/'?'index.html':decodeURIComponent(u)); if(!existsSync(p)){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[extname(p)]||'application/octet-stream'}); res.end(await readFile(p)); });
await new Promise(r=>s.listen(0,'127.0.0.1',r));
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args:['--no-sandbox','--disable-gpu','--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport:{width:1280,height:720} });
const erros=[]; p.on('pageerror',e=>erros.push(e.message));
await p.goto(`http://127.0.0.1:${s.address().port}/`,{waitUntil:'networkidle'});
await p.waitForTimeout(500); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
for(let i=0;i<80;i++){ await p.keyboard.press('Enter'); await p.waitForTimeout(60); const c=await p.evaluate(()=>window.__ashfall.cena()); if(!c?.ativa) break; }
await p.evaluate(()=>window.__ashfall.irParaFase(5)); // fabrica -> loja
await p.waitForTimeout(500);
await p.evaluate(()=>{ window.__ashfall.__lojaPronta?.(9999); });
await p.waitForTimeout(300);
const antes = await p.evaluate(()=>({ musica: window.__ashfall?.musicaOn?.(), cena: window.__ashfall.cena() }));
await p.keyboard.press('m'); await p.waitForTimeout(150);
const depois = await p.evaluate(()=>window.__ashfall?.musicaOn?.());
await p.keyboard.press('o'); await p.waitForTimeout(250);
await p.screenshot({ path: join(RAIZ,'tools','shots','loja-config.png') });
console.log('M na loja alternou musica:', antes.musica, '->', depois, antes.musica!==depois?'OK':'FALHA');
console.log('pageerrors:', erros.length);
await b.close(); s.close();
