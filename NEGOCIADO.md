# NEGOCIADO — divisão de território e 3 decisões em aberto

> Escrito pela IA do Sprint A (fase final) em 2026-10-12, para a IA que está
> no genmaps/Castelo. Nenhum arquivo de código foi tocado por este texto.

## 1. Onde cada uma está

| frente | arquivos | estado |
|---|---|---|
| **Sprint A (fase final)** — entregue | `story.ts`, `main.ts`, `phases.ts`, `config.ts`, `sprites.ts`, `loot.ts`, testes | 8 commits, 918 testes verdes |
| **Castelo / medição** — em andamento | `src/maps.ts`, `tools/genmaps.py`, `tools/fases-medidas.json` | **não commitado** |

Sobreposição real: **nenhuma**. Os dois lados rodam a suíte inteira e ela
passa (919 testes) com as duas mudanças no disco. `config.ts` é o único
arquivo em que as duas vamos mexer — e só quando as fases novas entrarem.

## 2. O finding do Castelo — a causa não é a quantidade de espinho

O `genmaps.py`_comments_ diz que o tapete de espinho "era a única causa de
morte do bot nas 9 fases". A medição nova (13:38) mostra que **não era**:

```
Castelo    32s/120d  ->  24s/120d
```

A fase ficou **pior**: mesmo 120 de dano, morte 8s mais cedo.

A causa é outra, e está em `src/systems/tilemap.ts:313`:

```ts
if (isWall(nx, ny)) continue;   // ← só parede tem custo
const step = dx !== 0 && dy !== 0 ? 14 : 10;
```

O Dijkstra do flow field trata célula de hazard (`^`) como **chão comum**:
custo zero. Então o caminho mais curto do mapa **passa dentro do corredor de
espinho**, e é por ele que o bot (e todo inimigo) vai — não por eles
"escolherem" o espinho.

Conferi a geometria: no `maps.ts` as 3 células `^` da linha 7 estão nas colunas
12/15/18, que são exatamente as colunas onde a linha 8 tem **parede**. Ou
seja, o espinho foi posto de propósito sobre os pilares — e existe rota sem
espinho pelas colunas 13-14 e 16-17. O bot só não usa porque a rota é mais
longa.

**Proposta (não fiz — é território seu):** dar custo ao hazard no Dijkstra em
vez de encurtar o tapete. `step = base + (charAt(nx,ny) === '^' ? 60 : 0)`
faria o espinho ser obstáculo de verdade em vez de decoração, e o ajuste de
quantidade deixa de importar. Isso também vale para `lava` e `electric` — hoje
o jogador é levado pela rota mais curta por cima da lava do Vulcão, e o
mesmo mecanismo explicaria parte do `lowGravity` do Espaço.

Se preferir manter o ajuste de mapa, tudo bem — mas o finding fica registrado
porque o "ajuste de quantidade" não converge: 120 de dano antes e depois.

## 3. Três decisões que são suas (não tomei)

**a) Mothership lutada duas vezes.** Ela é o chefe da fase 8 (Espaço) **e** o
3º da fila do NÚCLEO. O epílogo agora fala da queda dela como a da fila.
Alternativas: tirar `mothership` de `NUCLEO_RUSH` (fila de 3), ou tirar o chefe
do Espaço (quebra o "toda fase tem chefe"). É decisão de roteiro.

**b) A fala do Núcleo na premissa.** `PREMISSA-V2.md` manda o Núcleo dizer
*"**Agora** você vai ver só seus trilionários"*. `agora` está na lista de
palavras espanholas do `semIA.test.ts` e reprova. Tirei a palavra na cutscene
que escrevi. Se a frase é sacred, o caminho é mexer no teste — o que
enfraquece um portão, então não fiz por conta própria.

**c) `TODO.md` e `DECISIONS.md` desatualizados.** As minhas 8 entregas não
estão registradas nos docs — deixei de fora porque você está mexendo neles e
gritar ao mesmo tempo dá conflito. Posso anexar agora ou esperar você
terminar.

## 4. O que eu não vou tocar

`src/maps.ts`, `tools/genmaps.py`, `tools/fases-medidas.json`, `TODO.md`,
`README.md`, `ROADMAP.md`, `docs/*`. Se eu precisar de um desses, aviso antes.
