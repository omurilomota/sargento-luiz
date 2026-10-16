# SARGENTO LUIZ — Status Geral do Projeto

> Atualizado: 2026-10-15 · branch `develop` · 1376 testes em 62 arquivos ·
> `tsc` limpo · build ok.
> (antes: SARGENTO RIOS, e antes disso ASHFALL — o jogo trocou de nome duas
> vezes e o save migra as duas gerações de prefixo)

## Verificação atual

```
npm test           # 1307 passando em 61 arquivos
npx tsc --noEmit   # 0 erros
npm run build      # ok
npm run visual     # 8 screenshots, sem 404/pageerror
npm run servicos   # os 3 serviços da loja: aliado/torreta nascem, botas 1.3, tiro em campo
npm run blur       # o input sobrevive ao blur (veredito: não reproduz no HEAD)
npm run m2fluxo    # M2: anúncio diferido, martelo forçado no NÚCLEO, tela de vitória
npm run perks      # 13/13 — escada de perks na loja
npm run hud        # 4 resoluções, texto cabe na caixa
npm run loja       # 3 scrolls, texto e seções sem sobreposição
npm run local2p    # 8 checagens — tela de fim, revanche, P2 na MESMA tela
npm run protect    # 2 cenários — chefe morto/vivo × alvo cai: sem onda pós-boss
npm run foguete    # o protect do Castelo defende o FOGUETE: HUD e ondas no alvo
npm run vulcao     # B3: o countdown não arma com objetivo pendente; loja só após a luta
npm run variedade  # personagem de inimigo muda por fase (57% entre vizinhas)
npm run fases      # MEDE as 16 fases — número por fase (FUTURO §1.4 ✅)
npm run diagnostico# nenhum inimigo dentro de parede, dodge afasta em 360°
npm run espaco     # reproduz, MAS só contra jogador que não desvia (ver §1.4)
npm run sessao     # sessão longa com telemetria de dano por fonte
npm run campanha   # (node tools/campanha-proof.mjs) 16/16 — e TODA fase começa na onda 1
```

### O que o `npm run fases` mede

O bot desvia de inimigo e de barril, atira, e não usa dash, escudo nem fúria.
É o **piso**: fase onde ele morre é fase onde jogador casual também morre.

| fase | sobrevive | onda | principal dano |
|---|---|---|---|
| Cidade em Ruínas | 45s+ | 2 | contato (grunt) |
| Floresta | 45s+ | 3 | contato (runner) |
| Caverna | 45s+ | 1 | contato (crystal) |
| Fábrica | 45s+ | 1 | bioma (robot) |
| Pântano | 45s+ | 3 | contato (frog) |
| Castelo | 45s+ | 1 | bioma |
| Vulcão | 45s+ | 1 | projetil (inferno) |
| Espaço | 45s+ | 2 | projetil (ufo) |
| NÚCLEO-CENTRAL | 45s+ | 1 | — |

Medição pós-`passoDeCelula` (2026-10-13, noite): as ondas avançam mais
 nas fases de contato — o melee agora CHEGA no bot parado e morre na briga
 de contato, limpando a onda de verdade (o onda-proof registra o contrato
 novo). Pântano: 1 morte em 3 amostras (40s, frog); as outras duas em 45s+.
 Castelo: o bot sobrevive — a nota de instrumento do protect continua
 valendo (o bot não defende o alvo).

Com o TITÃ (T1) e o fogo (B7), a régua de 2026-10-13 21:33: três amostras
 sub-45 (Floresta 32s/Castelo 24s/Vulcão 32s) e TODAS re-amostradas a 45s+
 (Floresta 3/3, Castelo 2/2, Vulcão 2/2) — ruído de espinho/lava em bot
 que não lê o chão, com as mortes na onda 1, antes de qualquer titã
 existir. O NÚCLEO segue 45s+ com o fogo no chão: quem se mexe não paga.

Números crus em `tools/fases-medidas.json`. A linha da fase final acompanha a
reescrita em andamento (desfile desde a entrada, biomaquina) — medir de novo
quando pousar.

A tabela acima é 1 amostra por fase. Amostras repetidas em 2026-10-12, com o
custo de hazard no flow: **Castelo 3/3 sessões de 45s**, e em 2 de 3 o
espinho deixou de ser a fonte principal (o raio do evento passou a doer mais
que o chão). **Espaço 3/3** — a morte da amostra única não se repetiu (a fase nem
tem tile de hazard). **Vulcão: 1 morte em 3**, com o dano liderado por lava:
o inimigo agora contorna a lava, e o bot — que não lê o chão — foi empurrado
para o tile visível. É o mesmo caso do `espaco-proof`: jogador que não desvia
não é régua de balanceamento. Se o bot aprender a evitar piso de hazard, a
régua fecha; é decisão de instrumento, registrada para o dono.

**2026-10-13, mundo do foguete:** a linha do Castelo acima é 1 amostra da
suíte em que o bot passou 16s sobre espinho (120 de dano, zero de inimigo) —
não se reproduz isolado: **3/3 amostras de 45s** entrando com 100 HP, dano de
bioma entre 8 e 31. O bot não lê o chão E não entende "proteger o alvo": a
linha do Castelo mede patrulha, não a fase. Na amostra em que um inimigo
achou o caminho, o foguete sem defesa caiu em ~28s (1 encostado × 12 DPS);
nas outras duas o alvo ficou intacto 41s com inimigos vivos — o caçador
travava na parede a caminho do foguete. CONsertado na mesma noite (ver a
entrega "o caçador chega", abaixo): `npm run cacador` 3/3.

O Castelo foi consertado em duas camadas, cada uma com sua causa:

1. **Mapa** (`ed9a7e0`): o tapete de 12 espinhos nas duas lanes centrais
   virou 6 espinhos guardando a base da cobertura (pilares 12/15/18 das
   linhas 7 e 12). No tapete antigo o bot morria nas 2 medições registradas
   (32s); no mapa novo, 4 de 5 sessões chegavam aos 45s.
2. **Flow field** (`26a485a`): o Dijkstra tratava célula de hazard como
   chão de custo zero, então o caminho mais curto — o que todo inimigo
   segue — atravessava o corredor que fere, e o combate acontecia em cima
   do tile. Custo 60 ao passo que entra em `^` (finding da IA do Sprint A,
   `NEGOCIADO.md` §2): o inimigo desvia quando existe rota e atravessa
   quando não existe. Com as duas camadas, 3/3 sessões de 45s.

O resíduo do Castelo depois do foguete: `danoTotal` ainda acumula entre
reinícios (confirmado na amostra isolada de 2026-10-13: 8 → 18 com a cura
do restart no meio) e o bot ainda orbita cobertura com espinho na base.
O desenho de verdade da fase estava no §1.1 do FUTURO — decidido pelo dono
(2026-10-12) e entregue (2026-10-13): o alvo é o FOGUETE.

## Portão Anti-IA — 5 testes

| teste | pega |
|---|---|
| `semIA` | 11 tics de texto em `story.ts`/`diary.ts` |
| `semDesenho` | desenho em código no renderer (58 sites auditados, 3 de débito) |
| `semProcedural` | `sfx*` que nasce 100% sintético (débito vazio) |
| `semAssetQuebrado` | asset de `public/` que não chega ao `dist/` |
| `semOrfao` | **código que existe e não faz nada** (export sem chamador, stat sem leitor/escritor) |

Direção do jogo: [`docs/DESIGN.md`](docs/DESIGN.md) ·
pendências: [`TODO.md`](TODO.md) ·
decisões autônomas: [`docs/DECISIONS.md`](docs/DECISIONS.md) ·
ordem das frentes: [`ROADMAP.md`](ROADMAP.md)

---

## Entrega: F0 — o voo da sessão anterior fechado (2026-10-15 20:0x, `develop`)

A sessão de 2026-10-14 deixou trabalho pela metade em 5 arquivos não
commitados; esta entrega o fecha com efeito REAL e prova em navegador.

- **"Onda 2 na entrada" (M2) — consertado e varrido nas 16.** A cota parcial
  da última onda da fase anterior vinha junto no spawner, e o primeiro frame
  da fase nova lia "cota cheia + campo vazio" como onda completa: a fase
  começava na onda 2. `resetSpawner` agora roda no TOPO de TODO
  `loadPhaseEnvironment` — e parou de apagar a dificuldade da fase (o WIP o
  chamava DEPOIS do `setPhaseDifficulty`; irmão pré-existente: o `resetGame`
  fazia a Cidade valer 1.0 em toda partida nova). Trava dupla:
  `entradaDeFase.test.ts` (4, com mordida provada: o clobber injetado
  reprova `expected 20 to be 14`) e o campanha-proof ganhou "a fase começou
  na onda 1" — 16/16 verdes na primeira rodada com o fix.
- **Serviços da loja (M3): quem paga, recebe.** O WIP vendia Torreta (240)
  e Botas (120) que não faziam NADA; o "cachorro" spawnava um NPC humano
  genérico; e um aliado morrendo disparava o latch do `protect` — comprar
  reforço reiniciava a fase. Agora: **Contratado** (140) segue e atira no
  inimigo visível; **Torreta** (240) fixa na entrada, 150 HP, sprite do
  Kenney Tower Defense Top-Down (CC0, tile 277, cano recomposto para LESTE e
  pivô no pixel do `drawSpriteFit`); **Botas de Campo** (120) = +30% de
  velocidade na fase (o efeito do power-up `botas`, por flag de fase).
  **Cachorro de guarda FORA da loja**: os únicos cães CC0 são de perfil
  (perspectiva mista — a regra que rejeitou as armas laterais, #91) ou
  pixel 16×16 (borrão, #93). DECISIONS #213–#216.
- **`genmaps.py` com um único `__main__`:** o visualizador ASCII do WIP
  tinha declarado um SEGUNDO entrypoint com lista própria que esquecia
  floresta/caverna/fabrica. Fundidos: sem argumento regenera e valida as 16
  (o modo de sempre); `genmaps.py porto` desenha um mapa no terminal.
- **Economia limpa:** os testes-tautologia do WIP (`expect(true).toBe(true)`)
  saíram; a sentença medida do árbitro (2,61× na banda 2,5–4,5×) ficou
  documentada no teste real. `spawnNpcAtEdge` removido como inerte (os NPCs
  nasciam na loja e morriam no reset do próximo load).
- **Gates:** tsc limpo, **1307 testes em 61 arquivos**, build ok,
  `npm run servicos` novo (verde na primeira), loja-proof verde (descs novas
  cabem nas caixas), campanha-proof 16/16 com o check de onda,
  `npm run visual` sem 404/pageerror.
- **Pendências declaradas:** os PNGs desta rodada (`visual` 8 +
  `servicos-{loja,entrada,combate}` + `loja-*`) foram gerados sem erro mas
  **não foram lidos por este modelo** (sem leitura de imagem neste
  ambiente) — a IA multimodal da frente visual e o Murilo cobrem a regra 16
  por aqui. O enquadramento da torreta em jogo é o primeiro a conferir.

---

## Entrega: F6 — M5, a emoção e as conquistas (2026-10-16 01:25, `develop`)

- **O MAQUINISTA chega gritando**: `entryShout: 'YOU SHALL NOT PASS!'` — a
  barra de boss mostra o grito por 2,6s antes da primeira telegrafia. Só
  dele: grito coletivo seria outdoor.
- **O chefe cai em câmera lenta e fala**: `deathLine` nos 17 chefes (do
  "A cidade cai comigo." do VIGIA ao "INSTABILIDADE REGISTRADA." do
  NÚCLEO), slow-mo 0,3/0,9s, e a fala flutua ONDE ele caiu. A prova m5
  mordeu: o toast da fala era comido pelo cap de 3 (Caçador/Diário/Onda
  Limpa entravam depois) — agora entra por ÚLTIMO (DECISIONS #230).
- **Cinco conquistas**: 'Pistoleiro Leal'/'Uma Arma Só' (10/50 abates com
  a mesma arma), 'Intocável' (fase inteira sem dano — o nome histórico de
  volta), 'Rasante' (20 balas passando na banda de 6-30px, uma vez por
  bala), 'Pirotecnista' (10 abates por barril — contados POST-explosão,
  sem estimativa de falloff) e 'Traje de Contenção'.
- **Gates**: tsc, 1388 testes em 62 (achievements 15→24), `npm run m5`
  verde nos 3 contratos, visual sem 404. PNG `m5-grito-maquinista.png` com
  pendência de leitura (regra 16).

## Entrega: J1 — a ambiência sonora dos biomas (2026-10-16 17:20, `develop`)

O M1 fecha completo: **o lugar soa como o lugar.**

- **Agendador de ambiência** (`systems/ambiente.ts`): one-shots periódicos
  por FASE, janelas irregulares (gaivota 7-20s, apito 25-55s, alarme
  35-70s) — o primeiro disparo vem na janela curta, a ambiência é a
  primeira impressão. Sem cama de loop: a irregularidade é o que lê como
  mundo.
- **8 arquivos de gravação real** (SFX_FILES 42→50): vento na Cidade (a
  promessa do prólogo, do dia a dia — o tornado é o evento raro),
  gaivota (Rango Mango, CC0) + água do cais (qubodup, CC0) no Porto,
  gotejamento na Caverna (qubodup, CC0), apito de vapor (bart, CC0) +
  maquinário elétrico (bart, CC-BY 3.0) no Pátio de Trens, maquinário na
  Fábrica, drone (jdagenet, CC-BY 3.0) + alarme (ezduzziteh, CC0) no
  Espaço, drone no NÚCLEO. O Hospital silencia — sem mar, caverna nem
  estação, o silêncio é de projeto.
- **sfxAmbiente sem fallback**: som de ambiente que faltou é silêncio, não
  síntese imitando gaivota (DECISIONS #241).
- **Gates**: tsc, **1403 testes** (ambiente 7), `npm run ambiente` verde
  nas 6 fases com seus contratos, sfxAssets 50 chaves.

## Entrega: I — o tornado da Cidade (M1, 2026-10-16 16:40, `develop`)

O evento que o PRÓLOGO promete ("o céu fecha pesado do lado do mar") existe
em jogo:

- **A mecânica é o empurrão**: vórtice que nasce numa borda e atravessa o
  mapa; tudo a menos de 260px é empurrado radialmente para longe do centro
  (480 px/s no centro, caindo a zero na borda). Jogador via canal novo
  (`playerPush`) com `moveCircleBy` — vento não fura parede. Inimigos
  idem, com `moveCircleBy` cada um. Dano só para quem fica DENTRO do
  funil (90px, 4/s): o empurrão é a defesa, sair da rota.
- **Visual 100% asset**: fumaça em espiral + poeira na base, partículas de
  sprite do pack Kenney — nenhum desenho novo no renderer.
- **Som de verdade**: "Storm Arwen 2022" (Tsorthan Grove, **CC-BY 4.0**) —
  gravação de campo da tempestade de recorde no Reino Unido; trecho mais
  forte medido (pico −17,3 dB) e cortado em 7s. O portão `sfxAssets`
  mordeu a chave não registrada e o contador 41→42 — o diff consciente
  que ele exige.
- **Permissão por bioma**: só na Cidade (debris). O gancho de prova
  (`forcarEventoAmbiente`) força timing e posição, mas NÃO a permissão —
  no Espaço o update mata o evento no primeiro frame (DECISIONS #239).
- **Trava dupla**: `tornado.test` (6 — o empurrão puro cai a zero no raio,
  radial, o canal chega no resultado) + `npm run tornado` (174px de
  empurrão no jogador; termina sozinho; Espaço nega).
- **Resta no M1**: a ambiência sonora dos biomas (gaivota, gotejamento,
  apito, drone/alarme) — documentada no TODO, caça CC0 um a um.

## Entrega: H — M3, o dinheiro e o desafio (2026-10-16 15:10, `develop`)

A economia medida **achou as torneiras de verdade** — e o árbitro mandou
repor a escada:

- **O modelo ganhou fonte única** (`src/systems/economia.ts`): o teste e o
  bridge leem da mesma fórmula (o molde do getShopLayout contra o drift).
  Ele enxergou as duas torneiras que entraram no jogo DEPOIS dele — os
  TITÃS (3× moedas) e a COLETA da Fábrica: **renda verdadeira 2.896, não
  2.492**. A razão tinha caído a 2,25, ABAIXO do piso do árbitro.
- **Escada repostada**: t2 140 · t3 230 · t4 320 · t5 450 · especiais 900
  (t1 60 segue — toda fase paga o 1º degrau). 8.400/2.896 = **2,90×**,
  meio da banda. Resgates: 20,7% da média (guarda de 25% ok).
- **A medição em navegador** (`npm run m3economia`): a 1ª versão media a
  carteira do bot — e o bot de dodge nunca volta pela moeda (0 em 45s:
  instrumento, não jogo). A v2 lê o lado do SPAWN (gerado/abate vs
  modelo) e documentou as folgas reais: o `floor()` da moeda pequena
  (coinDrop 3 paga 1, não 1,8) e o stomp sem prêmio — 0,3-0,5× é folga,
  não vazamento (DECISIONS #236).
- **Chefe tem placa contra explosão** (0,75): RPG, BFG e cadeia de barril
  não resolvem mais o pico da fase por atalho — o Destruidor segue
  sendo a fantasia do NÚCLEO (medido).
- **Munição Incandescente**: o efeito sempre valeu para qualquer arma —
  agora o nome e a desc dizem (id preservado pela chave do save).
- **"Encostou, vira alvo"**: caçador a 90px arma o mesmo aggro de 4s de
  quem leva tiro. Cacador re-medido: 9/12 pré vs 8/12 pós — a variância
  de spawn documentada (6-34s) domina, sem regressão.
- **Ponte (multi-spawn + timer de quebra)**: o único resto do M3 — fica
  para a próxima sessão com o porquê no TODO (mexer grid em runtime
  puxa prerender do terreno e flow field juntos).
- **Gates**: tsc, 1390 testes (economia no módulo, explosivos +2),
  `m3economia` verde com as folgas documentadas, loja-proof verde,
  cacador sem regressão. CI do Actions verde a cada push.

## Entrega: G — GitHub decorado + Actions (2026-10-16 14:20, `9a73d4f`)

- **Repo renomeado**: `BubbleGame` → [`github.com/omurilomota/sargento-luiz`](https://github.com/omurilomota/sargento-luiz) — description e 7 topics (jogo, canvas, roguelite, top-down-shooter, typescript, vite, cc0-assets); remote local atualizado; GitHub redireciona as URLs antigas.
- **CI no Actions** (`.github/workflows/ci.yml`): `tsc --noEmit` → build →
  suíte inteira a cada push/PR em develop e main. A primeira rodada
  **reprovou e mordiu**: a suíte assume o `dist/` construído
  (distBuild + semAssetQuebrado) e o workflow testava antes de buildar —
  repro local provado com `rm -rf dist && npm test` (8 falhas). Ordem
  corrigida; run `38914800998` **verde**.
- **README na era atual**: título SARGENTO **LUIZ** (era RIOS), tabela das
  16 fases na ordem M4, pistola custa 30, a fúria saiu da lista de teclas
  (é segredo), provas novas na lista, contagens 9→16.
- **Push do develop** (17 commits desta e das sessões anteriores) — o
  remote estava 15+ commits atrás desde o rename LUIZ.

## Deploy: o Vercel no build de G+H+I (2026-10-16 12:33)

Segunda atualização do dia, no HEAD de `03ece4b` (GitHub decorado + M3 +
tornado): production **Ready**. Verificado ao vivo: bundle servido
`index-BfYK-PGk.js` = o build local; `assets/sfx/tornado.ogg` responde
200/audio-ogg/62.896b (byte-exato); as strings da sessão no JS do ar.
Aliases: `sargento-luiz.vercel.app` e o URL estável.

## Deploy: o Vercel no build desta sessão (2026-10-16 01:58)

`vercel deploy dist --prod` no HEAD de `080d804` — target **production**,
status **Ready**, 21s. Aliases: `sargento-luiz.vercel.app` e o URL estável
`sargento-luiz-murilohenriquemota935-1958s-projects.vercel.app`
(título ao vivo: "SARGENTO LUIZ — Pós-Apocalíptico").

Verificação ao vivo (não o afirmo pelo exit do CLI): o bundle servido é
o `index-D-LzR4pc.js` recém-buildado; `assets/sprites/props/torreta.png`
responde 200/PNG/398b; as strings desta sessão ("MUITO BEM, SOLDADO",
"YOU SHALL NOT PASS", "APROXIMANDO DA ESTAÇÃO") estão no JS do ar. O item
FINAL do plano M está pago — o zip do itch segue sendo ação do Murilo.

## Entrega: F4 — M4, a ordem e o voo (2026-10-16 00:50, `develop`)

A campanha reordenada pela narrativa e a decolagem visível:

- **A ordem nova (M4)**: Pântano 8 → Refinaria 9 → Subestação 10 → Vulcão
  11 → Porto 12 → **Castelo 13** → Espaço 14 → NÚCLEO 15 — o foguete enche
  TANQUE no Porto antes de ser CONCERTADO no Castelo. Prova: campanha-proof
  **16/16 na ordem nova, toda fase começando na onda 1**.
- **O respiro do Castelo é o VOO**: `drawVoo` — céu em 3 bandas chapadas
  (azul → azul e preto → chegada), o foguete subindo e encolhendo (vista de
  baixo), "APROXIMANDO DA ESTAÇÃO" no fim. Arma pelos DOIS caminhos de
  respiro (`armarRespiro`) e conta os mesmos 5s — `npm run voo` verde:
  arma, conta, entrega a loja; fora do Castelo, respiro comum. semDesenho
  teto 72→75 com porquê no diff.
- **Falas**: o PRÓLOGO ganha o setup de clima (o céu fecha do lado do mar —
  o tornado do M1 nasce anunciado); a Caverna lembra o hospital que agora
  a precede; as verbatim duplicadas do Pântano saíram (bug de costura do
  H3). semIA + cutscene + story-proof **37/37** verdes.
- **Consequências cuidadas**: o save resolve fase por NOME (reordenar não
  puxa o jogador para outra fase — DECISIONS #226); BIOMAS,
  FASE_PARA_CUTSCENE e as provas re-indexadas; o balance ganhou o FORMATO
  M4 (subida em todo passo MENOS o respiro declarado do Castelo — o custo
  dele cai −43% e a cauda RECUPOA acima do pré-dip: 5091→2864→5306→6447,
  medido antes de mover); variedade ganhou a guarda `BIOMAS[i] ==
  PHASES[i].map` (a divergência quase passou — foi o fireElemental que
  delatou).
- **Gates**: tsc limpo, 1379 testes, campanha 16/16, story 37/37, protect
  2/2, foguete-shot verde (índice 13), cacador 3/3 (com a variância de
  spawn conhecida: chegadas históricas de 6s a 34s), voo verde.
- **Pendências**: os PNGs do voo (`voo-inicio/fim.png`) e os shots das
  fases reordenadas seguem com a leitura pendente (regra 16) — sem leitor
  de imagem nesta sessão, é fila do Murilo.

## Entrega: F1 — os bugs de fluxo do M2 (2026-10-15 23:25, `9df5f18`)

O relato de 2026-10-14 virou cinco vereditos, cada um com prova:

- **Anúncio de onda sob a caixa de diálogo**: nos encontros da Fábrica/
  Hospital/Castelo a onda 2 nascia na mesma frame da caixa e o som tocava
  debaixo do mundo congelado. Agora arma PENDENTE e toca quando a caixa
  fecha — `m2fluxo-proof` testemunha o flag armar na abertura e consumir no
  fechamento.
- **Tela de vitória "MUITO BEM, SOLDADO!"**: `markGameCompleted` entra no
  caminho natural de encerramento — antes só o FINAL SECRETO "PERFEIÇÃO"
  marcava, e quem zerou morrendo no caminho via GAME OVER no fim vencido.
  O subtítulo mantém o fato ("O NÚCLEO CAIU — A CAMPANHA ACABOU").
- **Martelo forçado no NÚCLEO**: o Destruidor vem NA MÃO e 1-9/Q respondem
  com aviso, não trocam — a fase final é o desfile dele. Prova: arma
  "Destruidor" na entrada (pela loja do Espaço, o caminho do jogador) e a
  tecla 2 não troca.
- **Gate da fúria no powerup**: a gema "F" não dropa de comum, nem de
  chefe, e não entra no estoque da loja enquanto a Fábrica não abriu a
  tecla E — o segredo da H2 não vaza pelo chão. `gateFuria.test` (5).
- **Input morto no blur: NÃO REPRODUZ no HEAD** (`blur-proof`: 256px de
  movimento pós-blur+ESC nas duas variantes). O relato é do build
  publicado, anterior ao fix de 2026-10-13; ação = republicar o zip.

Gates: tsc limpo, 1376 testes, `m2fluxo` 3/3, build ok.

## Entrega: a frente visual resgatada (2026-10-15 23:20, `8ff3ac5`)

A IA multimodal foi removida pelo Murilo em 2026-10-15 ("bugou") com a
frente em voo. O trabalho era real e foi commitado com crédito — árvores
autorais CC0 (nenhum pack do projeto tem vegetação — medido), asfalto e
faixas para a Rodovia, piso de vidro, curadoria de parede por bioma
(Pântano em terra, Castelo em arenito), contagens re-mediadas, o T8 (tiles
órfãos de `sprites/tiles/` removidos) e o T2 (a parede com altura
duplicada — `drawWallEdges` agora é só contorno).

Três consertos para fechar (DECISIONS #222–224): o erro de tipo do
`initProps` (1 linha), **o flow field cego às árvores** (célula com tronco
é parede para a IA — sem isto o inimigo esbarrava no bosque e a onda
empacava) e **o relógio fictício do arvore-onda-proof** (as amostras
rodavam back-to-back: ~0,3s de jogo lidos como "40s"; a armadilha que o
próprio cabeçalho da prova documentava). Com tempo real e fps checado
(QUADROS_MINIMOS aplicado), **a onda encosta nas duas fases** (hp 100→82
Floresta, 100→84 Pântano em <10s).

**O canal AIchat.md** fica no repositório como protocolo para as próximas
IAs que dividirem a árvore (DECISIONS #220/#221).

**Merge**: a `feature/tilesets-curadoria-visual` foi integrada ao develop
(fast-forward, `9df5f18`) — 69 arquivos, +4.557/−504.

## Entrega: 16 fases, SARGENTO LUIZ, e os encontros em jogo (2026-10-14 15:13, `ab4c7b0`)

A atualização que o Murilo trouxe: a história com nome de gente, a ordem das
fases mantida, e os bugs do relato. A campanha dobra (9 → 16 fases) com as 7
que ele aprovou — Rodovia, Hospital, Pátio de Trens, Ponte, Refinaria,
Subestação, Porto — cada uma com mapa validado no `genmaps.py`, bioma no pack,
cutscene com as falas dele e chefe na curva.

- **Rename RIOS → LUIZ em tudo** (título, chaves, falas, site, itch). A
  migração de save cobre as DUAS gerações: `ashfall.*` e `rios.*` → `luiz.*`,
  a mais recente vence.
- **O Castelo sem sacrifício fixo**: o Júlio (ex-Fernandes) é bônus — o
  `protect` defende o FOGUETE. A morte dele não reinicia a fase (o glitch
  "onda 1/6"); sobreviver paga a chave do quarto 4B e o diário dele.
- **O Hospital do doutor Fernando**: a conversa do Zombonic-24 na onda 1, o
  Nando-01 na virada (o doutor É o chefe — FERNANDO INFECTADO, buffado), o
  mapa da região no abate.
- **A cápsula existe desde o início da Fábrica**: cobre tiro sem quebrar, o
  estouro é no lugar dela, o véu verde de radiação dura 14s e 5 zumbis saem.
- **Bugs do relato**: a bala nunca sai mais lenta que quem atira (medido:
  744px/s de corrida contra balas de 400); a caixa anda com clique do mouse;
  cada NPC veste o PRÓPRIO sprite (todos eram `survivor`); o foguete degrada
  com dano (inclina + fumaça do pack).
- **Balance recalibrado para 16 fases**: a curva de custo é monotônica com
  salto < 110%; a escada de perks subiu nos degraus altos (4.520 → 6.510) —
  o árbitro de economia volta à banda 2,5-4,5× a renda de abate.
- **Provas**: story-proof 37/37 (joga as ondas de verdade — o check da
  Fábrica passava por coincidência do acumulador do spawner, DECISIONS #203);
  campanha 16/16 com os 7 chefes novos; castelo-wave PROVA VERDE; cacador
  3/3; vulcao ok. Fases medidas: 13/16 aguentam 45s+, Pântano era ruído de
  amostra, Refinaria re-calibrada (0.90 → 0.80: o inferno matava em 2/2).

Pendências para a IA de imagens revisar: os PNGs de `tools/shots/` (visual +
as 16 cenas + encontro-júlio/encontro-doutor + foguete t1/t8) e os picks de
tile das 7 cenas novas (`CENAS_CUTSCENE` — âncoras semânticas, não curadoria
final).

O itch precisa da página nova: `sargento-luiz` (o link do site e do
SUPPORT_URL apontam para ela).

Calibração pós-push (`db0992b`, 15:44): medição do bot em 3 rodadas — a
Rodovia redesenhada e o Trens com 2 trilhos aguentam 45s+; a Refinaria
calibrou em 0.78 com mix (runner, lavaSlime, robot) a 3/5 amostras, a
mesma faixa do Vulcão (o limite aceito). Pântano/Vulcão/Espaço seguem
borderline por projeto — o "sofrida" que o Murilo pediu no fim da campanha.

---

## Entregas em paralelo (2026-10-12, frente de bugs/balance/dívidas)

Enquanto a rodada da fase final (B1–B8, T1–T6) corria em `main.ts`/`loot.ts`
nos commits dela, esta frente trabalhou fora do voo desses arquivos:

- **Docs reconciliados**: README (tabela de fases com VIGIA/NÚCLEO e os
  objetivos reais de `protect`/`reach`, números reais das 13 armas, licença
  de SFX/música) e ROADMAP (era "BubbleGame", com métrica da v1.3 e 210
  testes; agora carrega as frentes aprovadas e o estado real).
- **Espinho do Castelo**: tapete de 12 tiles nas lanes → 6 tiles guardando a
  base da cobertura (`genmaps.py` + `maps.ts`, idempotente com o gerador).
  Medido acima. As 3 linhas que mudam no mapa: 7, 12 e 15 (a moeda pulou de
  célula porque o scatter pula hazard).
- **Custo de hazard no flow field** (`tilemap.ts`): o caminho mais curto
  atravessava espinho, lava e elétrico de graça; hoje custa 60 desviar quando
  existe rota. Fila do Dijkstra em array dinâmico (typed array fixo descartava
  re-enfileiramento em silêncio). Trava: `flowHazard.test.ts` (3).
- **Pólvora Instável** (`combos.ts`): o primeiro combo cruzado entre ramos —
  DANO T5 + MENTE T4, +30% de dano por −10% de vida máxima. `exigeTodos` é o
  AND entre ramos; a trava de combos sem arma virou o contrato do produto de
  vida dentro do teto.
- **Toast com rótulo honesto**: `kind: 'aviso'` sem prefixo. O reinício do
  `protect`, os avisos de diário e o "SEM MEDKIT" renderizavam como
  "CONQUISTA:"/"EQUIPADA:" — o rótulo mentia sobre o que aconteceu.
- **Rodada de bugs do dono (2026-10-12, tarde)** — os 5 bugs verificados,
  cada um com o veredito no `TODO.md` (seção RODADA 2026-10-12):
  - Game Over no Bunker: **não reproduz no HEAD** — campanha 9/9 verde
    (`campanha-proof`), o repro é do build publicado, anterior aos fixes
    B1/B2/B6. Ação: republicar o zip.
  - Wave pós-boss no Castelo (`5e85e90`): reinício do protect não
    distinguia fase decidida de em andamento, e `chefeLiberado` era re-check
    vivo em vez de latch. Prova: `npm run protect` (2 cenários).
  - Barra do alvo = HP em tempo real (`a89922f`): o progress do protect era
    0/1, só vivo/morto. **Visto em jogo** (`castelo-000.png`): "PROTEGER O
    SOBREVIVENTE" com barra cheia e detalhe `50/50`, arqueiro caçando o
    Soldado com flecha em voo.
  - Som de recarga: correto no HEAD (7 famílias, arquivos distintos
    medidos); o relato é do fallback sintetizado do build velho.
  - Tab com `preventDefault`: página de jogo é o canvas.
- **Regra 16 cumprida com olhos (2026-10-12, fim de sessão)**: os PNGs
  pendentes foram abertos — Castelo (mapa coerente, espinhos nas bases dos
  pilares, HUD limpo), hud-1280x720 (zero sobreposição, bate com o
  hud-proof), 03-jogando (bala com sprite de cartucho, muzzle flash) e
  06-ficha (TAB: mapa + ficha com DPS efetivo). Nota de direção de arte
  para o dono: o espinho (tábua+faca, tile 268) fica SUTIL no piso escuro
  do Castelo — se quiser marcação mais visível, é decisão de arte, não bug.
- **Conquista `Escolta Perdida`** (`vip_lost`): o espelho de `vip_saved`,
  concedida no latch do `vipDown` junto do aviso de reinício.
- **Pendência declarada**: os PNGs de `tools/shots/castelo-*.png` e os 8 do
  `npm run visual` foram gerados sem erro, mas não foram abertos por leitor
  de imagem nesta sessão (o modelo não suporta imagem). Quem tiver olho,
  abra antes de fechar a entrega.

---

## Entrega: o protect do Castelo defende o foguete (2026-10-13 16:40, `21d0cce`)

A 4ª opção do §1.1, decidida pelo dono em 2026-10-12 ("as ondas atacam o
foguete, não uma escolta"), em código:

- **O alvo** (`props.ts`): o char `F` do mapa vira o prop `rocket` — 300 HP,
  parado na câmara do meio, colado às portas da coluna 14 (gerador
  idempotente, `genmaps.py` com assert da célula). Sprite Saturn V (CC-BY
  3.0, commit `6090b8f`), **sem tint** — o alvo não pode mudar de cara com o
  bioma. Barra de vida acima da ponta, não no meio do corpo.
- **O contrato** (`objectives.ts`): rótulo `PROTEGER O FOGUETE`, barra = HP
  em tempo real (`300/300`), conclui de pé + área limpa + luta havida. Com
  `getAnyRocket` o rótulo não vira "SOBREVIVENTE" no frame em que ele cai.
  Sem foguete no mapa, cai no sobrevivente legado — o contrato é do alvo.
- **A luta** (`main.ts`): todo inimigo da fase caça o alvo (foguete
  primeiro); flecha/bala inimiga o fere, tiro do jogador só faz fagulha —
  derrubar a própria proteção puniria a mira, não a defesa; cada inimigo
  encostado tira 12 DPS. Caiu: o latch do `vipDown` reinicia a fase (o
  mesmo do sobrevivente — `npm run protect` prova os 2 cenários no mundo
  novo).
- **Narrativa**: a cutscene do Castelo ganhou o anúncio do foguete
  (Fernandes: "no pátio interno tem um foguete de pé... É a saída daqui") e
  o diário ganhou "Motor vivo" (`rocket_saved`). Conquistas
  `vip_saved`/`vip_lost` descrevem "o alvo", não o sobrevivente.
- **Provas**: 931 testes (8 novos: objectives ×4, props ×3, mapa ×1);
  `npm run foguete` (script novo) mostra o HUD `300/300` e as ondas
  chegando; `npm run protect` 2/2; `npm run fases` — Castelo na nota de
  instrumento acima.
- **Regra 16 pegou de verdade — em três olhadas do dono**: (1) fundo branco
  atrás do sprite; (2) foguete "torto" no bico e no rabo; (3) cauda cortada
  na direita e bico fora da tela. Causa raiz das duas primeiras: o asset do
  commit `6090b8f` era a CENA DE LANÇAMENTO inteira reduzida (445×1641 →
  104×384, mesma proporção) — o "corpo" era um prédio da torre em primeiro
  plano e o bico era só a agulha no topo; o recorte "fundo preto" anotado
  lá nunca existiu. A terceira: a janela do recorte era estreita demais
  para a saia (que vai até x=315) e misturava as pernas da torre — e o
  "bico alto" era o ENQUADRAMENTO da prova: a câmera segue o jogador, que
  nasce 8 células abaixo do foguete, e o screenshot parado no spawn cortava
  o topo do sprite fora da tela. Corrigido: recorte só do foguete
  (x 100-320, y 48-452 → 220×404, saia simétrica em torno do eixo) +
  flood-fill que preenche a silhueta selada pelos contornos, e o harness
  `npm run foguete` anda o jogador até o pátio do foguete antes das fotos.
  O dono avaliou o estilo do asset como **placeholder** — ele desenha o
  foguete próprio e troca (registrado no TODO/H6).
- **Achado registrado** (não é do voo): o caçador do alvo trava na parede
  em 2 de 3 amostras — pendência medida no `TODO.md`.

---

## Entrega: bugs B3 e B4 da rodada 2026-11 (2026-10-13 17:18, `0d754d2`)

- **B3 — Vulcão, countdown sem chefe: REPRODUZIDO no HEAD e consertado.** O
  relato do dono ("horda 7: o countdown disparou sem chefe, veio outra
  horda, e matar o último foi direto pra loja") reproduziu com 3 falhas na
  prova nova: o respiro de 5s armava na limpeza da última onda **sem checar
  o objetivo**. O Vulcão é `reach`: com o jogador fora da zona de extração,
  o countdown expirava com o chefe proibido de existir, o spawner
  reabastecia a cota (a "outra horda"), e pisar na zona depois fechava a
  fase no primeiro frame liberado — `!chefeVivo` é verdade por vacuidade,
  o chefe nasce no bloco que roda depois do fechamento. **Fix**: o
  armamento do respiro exige `objetivoLiberouChefe` (a declaração subiu
  para antes do bloco de onda). Prova: `npm run vulcao` — cenário A: o
  countdown não arma com o objetivo pendente; cenário B: o chefe nasce ao
  liberar e a loja vem depois da luta. Regressão verde: campanha 9/9,
  onda 10/10, protect 2/2, rush em ordem, 931 testes.
- **B4 — última fase "abriu já sem nada": NÃO REPRODUZ.** Medido no
  navegador nos dois caminhos (salto e playthrough), as 9 fases abrem com 0
  inimigos, onda 1/N, respiro false — `02e7733`, com teste. O "onda=2" da
  suspeita era artefato do harness (media 1,3s após a entrada, quando o
  `clear` já avançava).
- **Zip novo pronto (2026-10-13, fim da sessão)**: `npm run package` no HEAD
  de `0d754d2` (foguete + B3) → `sargento-rios.zip`, 11MB, 904 arquivos,
  `index.html` na raiz, foguete novo conferido por md5 dentro do zip,
  `npm run visual` sem 404/pageerror no build final. Os vereditos "não
  reproduz no HEAD" (B1, B4, som de recarga) passam a valer no jogo
  publicado a partir daqui. Subir no itch é ação do dono.

## Entrega: medições §1.9 e do barril (2026-10-13 18:58, `4519a5f`)

Os dois "medir antes de mexer" do TODO, respondidos com número e porta:

- **§1.9 — chefe de raio 46 × corredor de 1 célula: NÃO MEXER.** Nenhum
  dos 4 chefes do rush cabe (raios 46-54 > meia célula, por projeto #158) e
  o corredor de baixo do Bunker é reto: os 4 atiram com linha limpa até um
  acampado e a biomaquina entra. `rushCorredor.test.ts` trava as duas
  propriedades — um rebalanceamento que esvazie o corredor ou desarme o
  chefe acusa no `npm test` (DECISIONS #180).
- **Barril 45/96: ACEITAR ASSIM.** `session.mjs --fase 0` (180s na Cidade):
  o piso que desvia de barril aceso tomou **zero** de dano de barril — os
  40 da sessão vieram do raio do evento, e o barril nunca foi fonte
  principal nas 9 fases. O pavio de 0,9s é o aviso; nerf tiraria do barril
  o papel de limpar `grunt` de uma vez (DECISIONS #181). Reabrir só com
  relato de dano de barril em jogo real.

## Entrega: o caçador chega — flow field do alvo + passo de célula (2026-10-13 19:19, `c6230e1`)

A pendência medida de manhã ("2 de 3 amostras com o foguete intacto 41s")
fechou em DUAS camadas, cada uma com sua causa:

- **Flow field do alvo** (`tilemap.ts`): o mesmo Dijkstra do jogador
  (hazard caro, descida por gradiente), apontado para a célula do foguete.
  O alvo é estático: um campo por fase, e o cache por célula faz as
  chamadas por frame valerem uma comparação. `flowAlvo.test.ts` (6): a
  descida chega ao foguete dos 4 cantos do Castelo sem pisar em hazard, e
  o campo do alvo não é o do jogador (na porta da câmara, um sobe e o
  outro desce).
- **Passo de célula** (`main.ts`, `passoDeCelula`): com o campo pronto, a
  prova `cacador` AINDA falhava 3/3 — o vetor por célula não carrega o
  alinhamento sub-célula que porta de 1 célula exige. Reproduzido em Node
  puro com as funções reais (`cacadorPorta.test.ts`): um archer
  **1800/1800 frames** parado na lateral da porta norte, e outro 994
  frames espetado no canto da parede do corredor sul. Mirar no CENTRO da
  próxima célula da descida realinha o corpo com o vão — aplicado aos
  DOIS campos (jogador e alvo), é a mesma família de trava que os inimigos
  comuns sofriam.
- **Lição da prova** (`onda-proof.mjs`): a checagem antiga ("30s parado =
  onda não avança") só era verde POR CAUSA da trava — melee que encosta
  num jogador que se cura morre na briga de contato (design de
  2026-10-05), e com o passo de célula os inimigos passaram a CHEGAR: a
  onda 1 completou sozinha, legitimamente. A checagem nova testemunha o
  campo vazio e pega o pulo-do-Sprint-0 (avanço sem vazio) sem acusar a
  briga legítima. 10/10.
- **Provas**: `npm run cacador` 3/3 (6s/34s/8s; antes 3/3 intactos);
  campanha 9/9; protect 2/2; onda 10/10; 942 testes; `npm run fases`
  re-medido (Pântano: 1 morte em 3 amostras, as outras duas a 45s+).

## Entrega: o epílogo da Parte I (H4, 2026-10-13 19:34, `00ac94e`)

Decidido pelo dono no planejamento (DECISIONS #174) e entregue:

- **O epílogo reescrito**: mantém a abertura forte (o NÚCLEO esfriando, a
  MOTHERSHIP caindo no meio, o registro da MegaCorp 2089) e troca a
  ESCOLHA dos 3 finais pelo **roll da jornada** — o quartel da Cidade, a
  cabana do Joe, a Caverna do Arthur, a cápsula, o portão onde o Fernandes
  segurou a linha, Ferreira e Vale no rádio — fechando com
  `[ PART II EM BREVE — AHB-45 ]`, plantado no destino selado que o painel
  já mostrava.
- **A maquinaria de escolhas saiu junto** (senão o semOrfao reprova):
  `selectChoice`/`isWaitingForChoice`/`ENDINGS`/`storyChoices`, as teclas
  1-3, o render das opções e o campo `esperandoEscolha` do hook. O
  `cutscene.test` ganhou os contratos novos: o roll cita os nomes, o
  teaser existe, e a cena atravessa só com ENTER.
- **Música nostálgica**: "Autumn Changes (Looping)" de Eric Matyas
  (soundimage.org) — a mesma fonte das outras 3 faixas, tese literal do
  fim da Parte I; toca no epílogo e sob a tela de fim (DECISIONS #184).
  `MusicTrack` ganhou 'epilogo'; 1:46 de loop, 1,6MB.
- **Atribuição corrigida nos créditos**: a linha do jogo dizia "faixas
  originais do projeto (CC0)" — falso (só o menu é CC0; as demais são RF
  com atribuição obrigatória). As duas telas agora dizem a verdade, e a
  lista ganhou Autumn Changes.
- **Gates**: 943 testes (semIA verde no texto novo, semOrfao limpo nas
  remoções), tsc limpo, story-proof e campanha-proof verdes. PNGs do
  `visual` com pendência de leitura declarada (regra 16).

## Entrega: as falas do dono por fase (H3) + vender ponto (T4a) — 2026-10-13 19:59

- **H3 — as falas verbatim suas, costuradas nas cenas que já existiam**:
  Floresta ganha a cabana da bruxa ("certeza que era mentira"), as trilhas
  que não levavam a nada, o balanço e o "agora só tem zumbis"; Caverna, o
  "Os zumbis estão evoluindo rapidamente" e o "Grr…" do túnel; Pântano, as
  três verbatim ("Nada mais me surpreende…", "Ohoa…", "tenho que tomar
  cuidado com o que falo"); Vulcão, o "continua em frente pra manter o
  legado"; Espaço, o **Bot #89** (retrato novo) com "INIMIGO DETECTADO!
  ATIRAR PROJÉTEIS", o "Não tão antes que eu já estou aqui!", a explosão e
  a **tela vermelha dos 5s iniciais** (vinheta de alarme, mesmo molde da
  fúria); NÚCLEO-CENTRAL, o **Viajante #23** entregando o martelo pela
  porta dos fundos + o NÚCLEO "INTRUSO AVISTADO! MODO NEUTRALIZADOR
  ATIVO"; e o pós-morte no epílogo: "INSTABILIDADE REGISTRADA… MODO
  CRÍ-CRÍ-CRÍ-TICOOOOO" + "OS RESPONSÁVEIS AINDA PRECISAM TER UMA CONVERSA
  COMIGO". Castelo: a coordenada da cápsula. Pendências de ARTE: o voo do
  foguete pós-missão (espera a arte própria do dono) e a risada (asset do
  H5).
- **T4a — vender ponto de talento por moedas** (decisão sua: "por moedas"):
  linha "VENDER PONTO" colada abaixo da árvore, 1 ponto = 100 moedas
  (pesa mais que qualquer serviço, na faixa do 1º degrau da escada);
  sem ponto livre, a linha fica cinza com "SEM PONTO". Talento comprado
  continua permanente. O preço é arbitrável pelo teste de economia.
- **Gates**: 948 testes (semIA verde nas verbatim + nas linhas de costura;
  5 testes novos), story-proof 19/19, campanha 9/9, loja-proof verde
  (nenhum texto estoura, o botão novo incluso), tsc limpo. PNGs do visual
  com pendência de leitura declarada (regra 16).

## Entrega: o teste de economia (o árbitro) + T5 — 2026-10-13 20:12

O instrumento que faltava para as decisões pendentes de economia
(`economia.test.ts`, 4 portas):

- **O modelo**: renda esperada de abate por fase, determinística do
  `config` — cota de onda × coinDrop médio dos tipos (mutante com cota
  própria) × 0,6 + chefe. Fases 0..7: a 9 não tem loja depois nem onda
  comum, fica fora por construção.
- **O achado**: a escada de perks custa **328% da renda de abate de uma
  campanha** (4.520 × 1.377). Lido como o roguelite que o jogo é — o
  `restoreUpgrades` do save continua os degraus entre partidas — a banda
  travada é **2,5× a 4,5×**: menos devolve a queixa antiga ("a fase 4 já
  comprava tudo"), mais esconde os 4 especiais para sempre.
- **As outras sentenças**: toda fase paga pelo menos o 1º degrau (60
  moedas — a Cidade rende 61+30 de resgate); e os resgates ficam em no
  máximo 25% da renda média por fase.
- **T5 arbitrado**: resgate de moedas **15 → 20** — o valor máximo que a
  guarda de 25% permite (2×20 = 40 ≈ 23% da média de 172). O dono pediu
  mais por anúncio; a sentença diz quanto mais sem reabrir a faucet do
  Sprint 0.
- Isso **destrava** a decisão das 7 fases novas (PREMISSA-V2) e a poda da
  árvore: qualquer mudança de preço/renda agora acusa no `npm test`.

Gates: 952 testes em 55 arquivos, tsc limpo.

## Entrega: tutorial de perks + condição sempre visível — 2026-10-13 20:26

As duas dívidas de UX da rodada do dono:

- **Os 4 especiais da escada agora se explicam**: a linha do perk (que
  dizia "RAMO DANO T6" — inútil para um especial) vira a descrição do
  efeito: "a cada 5 tiros, um incendeia" (Pistola Incandescente),
  "abaixo de 30% de vida: 1,5s invulnerável" (Segundo Fôlego), "o dash
  fere quem você atravessa" (Passo Fantasma), "sorte pesa eventos e
  drops" (Sortudo). O rótulo da seção PERKS ensina a regra da escada:
  "degraus na ordem, o T2 pede o T1 · 3 ofertas por visita". Os degraus
  comuns já se explicavam ("Dano +8%").
- **A condição da arma aparece no HUD para toda qualidade exceto
  normal**: antes só as NEGATIVAS tinham adjetivo — a LENDÁRIA jogava
  invisível e o dono não via o que a loja vendeu caro. A cor é a da
  própria qualidade (mostarda para lendária, musgo para boa).
- Colateral: `ehNegativa` ficou sem chamador e o semOrfao mordeu — a
  função foi REMOVIDA, não aposentada (regra 4).
- Gates: 952 testes, loja-proof + hud-proof verdes (nada estoura a
  caixa), tsc limpo. PNGs com pendência de leitura (regra 16).

## Entrega: o cenário destrutivo da fase final (B7) — 2026-10-13 21:04
"Quer explosão por todo lado" — em três camadas que usam o que já existia:

- **Barril estourando sozinho**: a máquina instável acende um barril vivo ao
  acaso a cada ~11s, a fase inteira — o pavio de 0,9s que já existe é o
  aviso, a cadeia que já existe faz o resto.
- **Fogo no chão** (`explosions.ts`): poças de fogo (vida 6s, raio 44,
  DPS 8, teto 12) nascem onde o barril explodiu, onde o chefe caiu, no
  berço de cada biomaquina e no impacto de tiro explosivo — hazard do
  mundo que fere os DOIS lados: inimigo direto no HP; jogador 4 a cada
  0,5s na fonte `bioma`, respeitando escudo/invincible. Visual 100%
  asset: `scorch_01` (a marca de queimado) + `flare_01` (a brasa
  pulsando), do pack de partículas — nenhum desenho de código.
- **Parede rachada**: PENDÊNCIA DE ARTE — o dungeon pack tem 96 variantes
  de parede e escolher a rachada é curadoria de olho (DECISIONS #188);
  o dono redesenha os assets da fase de qualquer forma.
- Só na fase do NÚCLEO: o pedido é do cenário final, as outras 8 fases
  seguem com o mundo de sempre.
- **Gates**: 957 testes (fogo.test.ts +5), rush-proof verde (a fila corre
  com o fogo), `npm run fases` re-medido — a fase 9 segue 45s+ (o fogo
  não pegou o bot, que se mexe; quem acampa paga). PNGs com pendência de
  leitura (regra 16).

## Entrega: o titã da onda (T1) — 2026-10-13 21:33

O que faltava entre o "pré-titã" (`ELITE_TYPES`, que só melhorava loot) e
o pedido do dono ("mais vida/dano/raio que o tipo comum, visual maior"):

- **Um inimigo comum do tipo da fase nasce GRANDE a partir da segunda
  onda** — exatamente 1 por onda, e ele ABRE a onda: 3× vida (em cima do
  escalão de onda), 1,5× dano, raio 1,35× (o sprite desenha pelo raio — o
  corpo cresce de verdade), 0,85× velocidade, 3× moedas.
- **Leitura instantânea**: anel mostarda no chão (o vocabulário do anel de
  chefe, uma escala abaixo — chefe é terracota) + barra de vida — 3× a
  vida não pode ser invisível. `semDesenho` TOTAL 67 → 70, a decisão no
  diff da porta.
- **Loot elite via flag**: o titã é variante de tipo comum — a taxa de 15%
  e os 25% de peça direta seguem o CORPO, não o nome (o
  `rollLootDrop` ganhou o flag).
- **Portas**: `tita.test.ts` (4 — o contrato do spawn: primeira onda sem
  titã, exatamente 1 abrindo as seguintes, raio 1,35× exato, vida 3×
  inteira); campanha 9/9, protect 2/2, onda 10/10 com titãs nas ondas;
  régua re-medicda — as três sub-45 eram ruído re-amostrado a 45s+.

## Entrega: os cinco bugs do segundo relato do Murilo — 2026-10-13 22:12

1. **Game Over ao entrar no Bunker (2ª vez)** — causa raiz: o índice de
   cutscene, depois do fim da abertura da fase final, pousa EM CIMA do
   epílogo; perguntar "era o epílogo?" depois de avançar respondia `true`
   para a abertura. Fix: capturar antes. Portas: `npm run bunker`
   (**mordida provada**: linha antiga → "gameover" na entrada; fix →
   combate), o campanha-proof atravessa a abertura com ENTER agora
   (era cego: só BACKSPACE), `gameCompleted` zera no reset (a vitória na
   segunda campanha + o "PERFEIÇÃO" solo eram o mesmo vazamento), e o
   BACKSPACE de cutscene de fase não chama mais `startRun`.
2. **Balas no bico do cano** — o tiro nascia no centro do peito, 24px
   atrás do flash; agora bala e flash nascem juntos na direção da mira.
3. **Atiradores com sentido** — linha de visão para o tiro (parede na
   frente = calado até ter visão) e faixa de combate (300/200): aproxima,
   recua, mas não encosta mais em quem já sabia onde estava.
4. **Desfocar pausa** — blur da janela em combate → pausa automática.
5. **Caçador que reage a bala** — 4s de aggro em quem atira nele, depois
   volta ao foguete (decisão do Murilo: troca temporária).
- Gates: 963 testes (gameCompleted + a armadilha do índice travados),
  campanha 9/9 com a porta nova, `npm run bunker` verde com mordida,
  fases re-medido (Floresta 40s em 1 amostra → re-amostra em curso).
- Registrado/adiado (instrução do Murilo): modo 2P (setas movem os dois,
  P2 atravessa paredes — sessão dedicada), modo competitivo (bots como
  personagens jogáveis), linguagem dev na tela, limpeza dos arquivos.

## Entrega: o carinho nos detalhes — textos, sons H5 e a raiz limpa — 2026-10-14 01:08

A maior crítica do Murilo ("a falta de carinho nos detalhes") recebeu a
resposta — cada cena realinhada ao texto dele, verbatim, na caixa que ele
pediu:

- **O Castelo reescrito** (decisão dele: o Fernandes morre em jogo): a
  cutscene encolheu para as 6 linhas verbatim; o CABO FERNANDES é NPC
  real — chega na onda 2 (a caixa pequena conta quem ele é e anuncia o
  foguete), o sacrifício acontece quando o REI MUTANTE levanta (o
  fechamento da caixa tira o NPC e registra o diário "Seis Segundos" —
  o gatilho migrou da cutscene), e o pós-missão conta o conserto + o voo
  com os sons.
- **Floresta/Caverna verbatim completos**: "Saudades daqui, gostava de
  brincar no balanço…", "Vou destruir todos!", "Finalmente saí da
  floresta… Pelo menos aqui na caverna não deve ter nenhum!", "O que é
  isso? Ah não…"
- **Bunker**: "Ei, você! Pegue isto!" + o "O universo está a meu favo-"
  cortado pela explosão.
- **Epílogo**: a risada corrigida — é do RIOS ("HAHAHAHA! Acabei com
  você, maldição!"), não do painel da máquina. O fecho narrador ganha as
  perguntas dele ("Será que ele vai conseguir? Como ele vai fazer isso?").
- **H5 — sons narrativos caçados e ligados**: risada.ogg (Supergeek,
  CC0), ferramenta.ogg (BMacZero, CC0), foguete_lancamento.ogg (dklon,
  CC-BY 3.0). A explosão da cápsula usa o explosion.ogg existente.
- **Linguagem amigável ao jogador**: os créditos citavam caminhos de
  arquivo ("assets/CREDITS.md", "29 efeitos em assets/sfx/") — quem joga
  não é dev. Reescrito.
- **A raiz limpa** (lista aprovada): session-*.md, RELATORIO*.md,
  freebuff-chat-*.md, NEGOCIADO.md, bugs.md, plano*.md, ashfall.zip —
  descartados. Restam AGENTS.md, PUBLISHING.md, README.md, ROADMAP.md,
  STATUS.md, TODO.md.
- **Vulcão 0,79 → 0,74**: o +0,05 da compensação da coleta não coube nele
  (3 mortes em 5 amostras a 32s, dano de inferno 108-126, contra 45s+
  consistentes a 0,74) — DECISIONS #194.
- Gates: 969 testes, story-proof 19/19 (a Fábrica pela caixa + o Castelo
  curto), campanha 9/9 (o Castelo atravessa as 3 sequências em jogo),
  bunker OK, fases re-medido, visual sem 404.

---

## Auditoria de assets e tilesets — 2026-10-14, árvore de trabalho sobre `develop` @ `51be5c2`

Entrega de **documento**, não de código: `docs/ASSETS.md`. Nada foi alterado em
`src/` — é o inventário do que está errado, com a medição que sustenta cada
linha, para o trabalho ser feito com a imagem aberta.

O pedido foi revisar as imagens de assets/tilesets porque **a IA que fez esta
base não é multimodal**: ela curou tile por número, sem olhar. O resultado é um
tileset que nenhum gate pega — `tsc` limpo, 969 testes verdes, `npm run visual`
sem 404, e o chão é um papel quadriculado.

**Achados, por gravidade:**

- **P0 — piso com costura.** `sprites.ts:74` diz que o pack é *"seamless"*.
  Medido: os 64 tiles têm faixa escura assada de ~2px em 2+ lados
  (`piso_pedra_01` tem `col63 = 0.0`, preto puro, contra miolo 128).
  Ladrilhado, vira grade de 64px. Causa: `extract_tiles.py:26` fatia
  `LINHAS_PISO = (0,)`, que no pack é a faixa de BORDA do autotile, não o
  miolo.
- **P0 — parede com altura duplicada.** Os 96 tiles são blocos 3D com topo e
  frente assados, e `drawWallEdges` desenha cumeeira + claraboia + beiral +
  face de 14px por cima. No `castelo-000.png` isso vira barra cinza
  atravessando o mapa.
- **P1 — a Rodovia não parece uma rodovia** (relato do dono). Medido em
  `docs/ASSETS.md` §4: (a) `rodovia` é `cidade` byte-idêntico em piso, parede
  e tiles, mudando só o tint em 4% — o bloco foi escrito hoje ("Unidade A",
  `maps.ts:357`) copiando o da cidade, linha `floorTiles` inclusive; (b) os 6
  tiles que ela declara são laje terracota e preenchimento laranja — **nenhum é
  asfalto**; (c) o mapa é labirinto de salas, sem pista contínua. E o pack **já
  tem** asfalto, eixo amarelo, eixo branco, guarda-corpo e carro abandonado —
  nenhum carregado.
- **P1 — 16 biomas, 8 pisos, 6 paredes.** `piso_metal` em 5 biomas,
  `parede_concreto` em 7, tijolo vermelho em pântano e castelo. Cidade e
  rodovia saem idênticas; fábrica e trens também.
- **P1 — saturação invertida.** Cenário 55-84%, personagens 22-57%, terreno
  9-30%. A coisa mais saturada da tela é o fundo. E o objeto mais claro do
  jogo é o quadrado bege `133` (84%), usado de decor no castelo.
- **P2 — 4 tabelas apontam para o tile errado.** `WALL_TILES` (6 de 8
  conjuntos são cantos em L laranja ou frestas; e o caminho é inalcançável —
  órfão com consumidor só de teste), `spriteFor` (floresta = avião de papel),
  `HAZARD_SPRITES` (fog e mud dividem uma mancha cinza; electric = cristal),
  `CENAS_CUTSCENE`.
- **P2 — cutscene vazia por construção.** 85% da tela é preto puro, o
  "retrato" é um anel vazio desenhado por `arc`.
- **P3 — dívida.** `public/assets/sprites/tiles/` com zero chamadores;
  `biome.floorTiles` apontando para verde `#00c020` e laranja neon.

**Nenhuma correção foi aplicada.** O backlog T1-T9 foi para o `TODO.md`,
começando pelo portão `tiles.test.ts` (T3) — que pega sozinho a costura, o tile
de papel errado e a saturação fora de hierarquia, e é o que falta para o
próximo ciclo não repetir este.

Evidência visual em `/tmp/opencode/assets-audit/` (efêmero; §0 do doc traz o
script de reprodução).

---

## Versão anterior: v1.3 (geometria + HUD)

A v1.2 tinha 7 fases, 11 armas, 19 upgrades, 3 habilidades e 4 modos — e era
chato, porque **o campo de batalha era um retângulo vazio**: `collision.ts` só
tinha circle-circle, não existia parede, obstáculo, cobertura ou hazard em
nenhum lugar do código, e todo inimigo fazia seek direto no jogador. A v1.3
ataca isso primeiro.

## ✅ ENTREGUE NESTA VERSÃO

### Geometria (o que faltava de verdade)

- **Tilemap** 30×20 (1920×1280 px) com colisão círculo-vs-grid e **deslize por
  eixo** — sem isso o jogador trava na quina da parede
- **Flow field** (Dijkstra da célula do jogador) no lugar do seek direto: custo
  zero por inimigo e o empilhamento desaparece de brinde
- **Câmera** com follow/clamp e `screenToWorld` — sem ela a arma atira na
  direção errada quando o mapa é maior que a tela
- **Terreno prerenderizado** com tint por bioma: 1 `drawImage` por frame em vez
  de ~600 `drawImage`
- **Props destrutíveis**: caixote (moeda), barril com pavio de 0.9s e explosão
  em **cadeia de verdade** (cada barril alcançado também explode), ninho
  (objetivo de fase) — e com a paleta do bioma
- **9 mapas autorais**, cada um com hazard e objetivo próprios
- **9 hazards com efeito mecânico**: os 9 biomas têm efeito próprio, inclusive
  os dois que antes eram só número (`fog` e `debris`)
- **Objetivos de fase**: `clear` · `survive` · `destroy` · `protect` · `reach`,
  cada um com fase própria. O objetivo não encerra mais a fase: ele **libera o
  chefe**, e é o chefe que fecha a fase. Se o sobrevivente do `protect` cai, a
  fase reinicia
- **Cobertura real nas 9 fases**: o tiro de inimigo para em prop. Só o entulho da
  Cidade desmorona com o primeiro tiro
- **Boss data-driven**: **9 bosses** com padrão declarativo e telegrafia, cada
  um com sprite do seu bioma (antes os 9 caíam no fallback `zombie`) e com um
  anel no chão que o distingue do trash

### Bugs corrigidos

- Screen shake existia mas **nunca era aplicado** no `draw()` (offset fixo `{0,0}`)
- **ENTER cascateava estado**: `keys['enter']` ficava `true` no estado
  seguinte, então Game Over → ENTER → menu entrava na cutscene sozinho
- **Laser atravessava inimigos** (ponto-ponto a 1200px/s); agora a colisão de
  projétil é *swept*, por distância ponto-segmento
- **A loja comprava a linha de cima**: o draw usava `leftX=40, colW=w/2-60` e o
  clique usava `leftX=20, colW=w/2-40`. Agora ambos consomem `getShopLayout`
- **Menu: clicar num modo selecionava outro** — `height/2+i*50` no clique vs
  `H*0.28+i*modeSpacing` no draw. Agora ambos usam `getMenuLayout`
- **Assets não chegavam ao build**: `assets/` na raiz do projeto não é copiado
  pelo Vite, então as sprites funcionavam em `npm run dev` e davam 404 em
  produção. Movido para `public/`
- **Tiles nunca carregavam**: o nome usa pad de 2 dígitos (`tile_01.png`), não 3
- **Dash ia para onde a arma aponta**; agora segue a direção do movimento
- Log `[DANO]` pintado em tela durante o combate, removido
- **Telegrafia de boss nunca era exibida**: os 9 chefes declaravam um texto em
  `pattern[].telegraph` e a barra mostrava um "PREPARANDO..." fixo
- **Chefe não telegrafava a primeira ação**: `step` do runtime começava em `0`, o
  que fazia `step.index !== rt.step` ser falso no primeiro frame — o chefe
  ficava 2.6s em silêncio e atacava sem aviso
- **O game loop rodava duas vezes por frame**: `init()` estava escrito duas vezes
  no fim do main.ts, e cada chamada agenda o seu `requestAnimationFrame`
- **O objetivo encerrava a fase antes da fase existir**: o `protect` do Castelo
  terminava na onda 0 de 7 e o `survive` da Fábrica na onda 1 de 6, sem chefe
- **A curva de dificuldade não era uma curva**: as três últimas fases ficavam
  progressivamente mais baratas, e a final custava 24% a menos que a sétima
- **O pavio do barril não existia**: `updateBarrels` zerava o timer e detonava no
  frame seguinte à ignitação, e a cadeia de barril não encadeava — o barril
  alcançado morria sem explodir
- **A Intocável era impossível depois da primeira leva de dano**: o flag era
  zerado só quando já estava limpo, então gruda até o fim da partida
- **O terreno deslocava em tela larga**: a câmera já centraliza o mundo quando
  ele é menor que a viewport, e `drawTerrain` centralizava de novo — numa janela
  de 2560px o mapa de 1920px aparecia 320px à direita, com a borda cortada
- **A lanterna da Caverna ficava fora de lugar**: o overlay transladava a câmera
  duas vezes, então o furo do cone saía deslocado de (camX, camY). Só coincidia
  no canto do mapa, onde `camX` é 0
- **O protagonista só segurava a arma quando atirava**: a pose de parado era
  `stand`, que é uma das duas poses do pack sem arma. Além disso a sprite
  `weapon_*` desenhada na ponta duplicava o cano da pose e ficava sempre na
  horizontal (o `rotate(-angle)` anulava o `rotate(angle)` do corpo), e a linha
  branca de mira passava por cima da arma
- **Inimigo atirador aparecia desarmado fora do disparo**: `enemyPose` só usava
  pose armada nos 0.2s antes do tiro
- **Investida de chefe atravessava parede**: `updateBoss` escrevia em `e.x`/`e.y`
  direto, sem passar por `moveCircleBy`. Os quatro blocos de cobertura da praça
  do VIGIA eram inúteis porque o chefe saía da arena pela parede
- Relâmpago tirava 40 de dano sem nenhum feedback visual
- Tiro do Laser na cor errada (o `isCrit` agora é flag, não comparação de string)
- Chave presa ao voltar para a janela (`keyup` só era tratado em `playing`)
- `saveGame` gravava uma onda que o resume nunca lia

### HUD e layout

- **HUD 100% canvas** em grade de 3 colunas. Antes era metade HTML e metade
  desenhada, e as duas se sobrepunham: score no DOM em y≈16 sobre o minimapa em
  y=12..92, rodapé de 28px sobre o nome da arma em `height-20`
- 4 layers disputando os mesmos pixels foram para `ui/hud.ts`
- Faixa de aviso de evento ambiental (destrava o relâmpago invisível)

### Conteúdo

- Música procedural de 12 notas trocada por **4 faixas OGG** com crossfade
- Som distinto por habilidade (antes as três usavam `sfxPowerup`)
- Toggle de música/SFX no pause, com persistência
- 9 bosses com padrão data-driven, incluindo VIGIA (fase 1) e NÚCLEO (fase 9)
- Modos cortados de 7 para 4 (`survival`, `missions` e `bossrush` não tinham
  uma única função ligada)
- Créditos reais em `public/assets/CREDITS.md`

### Ferramentas

- `tools/genmaps.py` — gera e valida os 9 mapas (largura, borda fechada, P
  único, BFS até todo E/B/N)
- `tools/genmusic.py` — sintetiza as 4 faixas OGG a partir de uma semente fixa
- `tools/bot.mjs` — o bot de medição, compartilhado pelos dois harnesses
- `tools/dodge.mjs` — a direção do dodge, função pura com porta própria
- `tools/session.mjs` — sessão longa com telemetria (`--fase N` abre a fase)
- `tools/fases-todas.mjs` — varre as 9 fases e grava `fases-medidas.json`
- `tools/sessao-diagnostico.mjs` — o dodge afasta? algum inimigo travou?

## Testes

**874 em 49 arquivos.** A lista completa por arquivo está em
`src/__tests__/`; o que este status registra é a cobertura que não é óbvia pelo
nome:

| Arquivo | Cobre |
|---|---|
| `semIA` · `semDesenho` · `semProcedural` · `semAssetQuebrado` · `semOrfao` | os 5 portões anti-IA (ver tabela acima) |
| `balance.test.ts` | a primeira fase é sobrevivível com a pistola e só a pistola; a armadura cobre projétil |
| `dodgeBot.test.ts` | a direção do dodge afasta em TODOS os 360°, e o que o `movePlayer` faz com as teclas também |
| `presoNaParede.test.ts` | nenhum corpo que invade parede fica sem saída, para todo raio de inimigo, nos 9 mapas |
| `variedade.test.ts` | o personagem de inimigo muda por fase (57% entre vizinhas, zero estagnação) |
| `perkLadder.test.ts` | a run nova não herda especial, dano, degrau nem oferta |
| `weaponAmmo.test.ts` | `refillAmmo` enche sem estourar a build nem consertar a quebrada |
| `phaseEnd.test.ts` | o fim de fase não fecha no meio (60 chamadas com a onda em andamento) |
| `saveSystem.test.ts` | round-trip com degraus, especiais e o save anterior à escada |
| `gear.test.ts` | teto dos combos empilhados; combo exige degrau, não id morto |
| `explosivos.test.ts` | o explosivo detona uma vez e não fere o jogador |
| `immortality.test.ts` | o P2 tem vida, dano, i-frame e vencedor |

```
npm test            # 856 passando
npx tsc --noEmit    # 0 erros
npm run build       # ok
```

## ⏳ NÃO ENTREGUE (está no `TODO.md`)

- Modo competitivo online (adiado por decisão de 2026-10-10)
- **Sem touch** — nenhum `pointerdown`/`touch` no código. Fecha a porta de
  CrazyGames/Poki, onde jogo indie vive
- **Sem preset de loadout** (`FUTURO §1.8`) — com 24 degraus + 12 armas + peças,
  o jogador refaz a mesma arrumação 9 vezes por campanha
- **Árvore de talentos inútil quando lotada** — quais dos 24 degraus não valem o
  preço. Medir antes de podar
- **Tutorial de perks** — o jogador não sabe se uma compra vale (24 degraus, 4
  ramos, nenhuma explicação em tela)
- A curva de dificuldade é **monotônica, mas não uniforme**: os passos vão de
  +2% a +106%. Monotônico é o contrato que `balance.test.ts` trava
- `main.ts` com 2.452 linhas é a próxima fonte da família de defeitos "existe
  e não é chamado" (o `resetPerks` ficou 3 sprints importado sem uso). Não é
  refactor agora — não há bug à frente — mas é onde a próxima omissão mora

Ver `TODO.md` para a lista completa e `docs/FUTURO.md` para o cardápio.