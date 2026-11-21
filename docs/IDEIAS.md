# IDEIAS E CONTINUAÇÕES — SARGENTO LUIZ

> Atualizado: 2026-11-07 12:47 · HEAD `883740b`
>
> Isto é cardápio, não backlog. Nada aqui está prometido: cada ideia diz o
> ganho, o custo e do que depende. A lista do que está aberto de verdade vive
> em `docs/PENDENCIAS.md`; o histórico, em `TODO.md`.

---

## 1. Parte II — a nave e AHB-45

O fim da Parte I já tem o gancho: o Núcleo cai, os trilionários fugiram, e a
nave do Castelo é o único caminho. A Parte II troca “atravessar o país” por
“consertar a nave e sair do planeta”.

**Estrutura sugerida (6 fases, reaproveitando sistemas que já existem):**

| fase | objetivo | sistema existente |
|---|---|---|
| Ferro-velho orbital | recuperar 3 peças do motor | `collect` (Refinaria) |
| Cais de combustível | encher 4 tanques sob pressão | `collect` + hazard `lava` |
| Deserto de cinzas | atravessar até o silo | `reach` (Vulcão) |
| Estação AHB-45 | proteger a nave na decolagem | `protect` (Castelo, alvo-foguete) |
| Palácio dos trilionários | destruir 3 servidores | `destroy` (Caverna) |
| Núcleo do planeta | chefe final com o martelo | rush `NUCLEO_RUSH` |

**Ganho:** fecha o arco que o próprio epílogo promete e dá uso narrativo a
`collect`/`protect`/`reach`, que hoje só aparecem uma vez cada.
**Custo:** 6 mapas novos + 6 chefes + cutscenes; é uma expansão, não um sprint.
**Depende:** decisão de escopo do dono; a Parte I precisa estar publicada.

## 2. Combate corpo a corpo

O martelo foi pedido como corpo a corpo, mas hoje é lançador. A família melee
precisa de regras próprias:

- golpe em arco à frente, sem munição, com recarga curta;
- dano alto e alcance curto (o tradeoff é chegar perto);
- o martelo `Destruidor` vira o topo da família: onda de choque no impacto;
- a mão na tela já tem sprite (`mao_destruidor`), então o custo de arte é baixo.

**Ganho:** o martelo deixa de ser “RPG com outro nome” e o arsenal ganha uma
resposta para inimigo que encosta.
**Custo:** hitbox de arco, animação de golpe, som por família, prova de que o
melee não atravessa parede.
**Depende:** P0-4 de `PENDENCIAS.md`.

## 3. Companheiros que existem no campo

Hoje o contratado e a torreta atiram, mas a torreta é fixa e os inimigos só
olham para o jogador. Uma frente única resolve os três relatos:

- `T` move a torreta para a posição atual do jogador (com `pushOutOfWalls`);
- inimigo com aliado a menos de X px troca o alvo (o `huntsNpc` já existe no
  Castelo, é o mesmo caminho);
- contratado com vida própria, dano maior e a mesma mão armada que o jogador.

**Ganho:** os serviços da loja deixam de ser “um número que atira” e viram
decisão de posicionamento.
**Custo:** aggro + controle + telemetria; o `servicos-proof` cobre o caminho.
**Depende:** P0-3.

## 4. Moral, sorte e eventos

A ideia do documento original — ajudar um sobrevivente com dinheiro, ganhar
moral, moral virar sorte — cabe num estado `event` entre fases:

- 2–3 escolhas por evento, cada uma mexe em moral/sorte/moeda/XP;
- sorte pesa o drop e a qualidade do loot (o `luck` já existe nos stats);
- comerciante com promoção, sábio vendendo livro (perk), sobrevivente ferido;
- moral alta puxa evento bom; moral baixa puxa emboscada.

**Ganho:** dá peso às escolhas fora do combate e reusa o `luck` que já está
ligado ao loot.
**Custo:** estado novo, tela de evento, persistência no save, textos.
**Depende:** P1-4; precisa de decisão sobre quanto a sorte pode alterar a
economia (o `economia.test.ts` é o árbitro).

## 5. Diário 2.0

O diário já tem entrada por fase. O que falta é presença:

- notificação real na loja (“nova página”);
- inspeção da página com o que aquela fase custou/rendeu (moedas, abates, dano);
- uma página por chefe derrotado, não só por fase;
- o diário como recompensa de lore: a página do Júlio, a do Fernando, a do Joe.

**Ganho:** transforma o diário de tela secundária em memória da run.
**Custo:** UI de loja + TAB, snapshot de telemetria por fase.
**Depende:** P0-5.

## 6. Biomas com identidade

O maior salto visual não é mais um efeito: é o mapa contar onde você está.

- **Cidade:** casas de verdade (telhado, porta, janela), não blocos;
- **Hospital:** salas, macas, azulejo (o chão claro já entrou);
- **Floresta:** a cabana do Joe, o balanço;
- **Caverna:** cristais e a lanterna do Arthur;
- **Fábrica:** esteira, engrenagem, a torre que hoje é chefe;
- **Pátio de Trens:** trem andando e despejando zumbis;
- **Ponte:** multi-spawn nos cabos e nas torres;
- **Porto:** linha de produção que o jogador destrói.

**Regra:** cada item é asset CC0 do pack ou autoral; nada de `arc`/`fillRect`
como visual pretendido (regra 15).
**Ganho:** é o que mais muda a leitura de “jogo de IA” para “jogo”.
**Custo:** curadoria de asset por bioma + colisão/props; alto.
**Depende:** P0-2 (Ponte) e a lista de assets em `docs/ASSETS.md`.

## 7. Chefes com mecânica, não só vida

- **Rei mutante** escala por ano (a fala do Júlio já promete isso);
- **Maquinista** luta em cima de um trem que atravessa a arena;
- **Gárgula** alterna entre o cabo de aço e o chão;
- **Núcleo** com o traje de contenção e o martelo, como o desfile atual.

**Ganho:** cada chefe vira uma pergunta diferente, não um saco de HP.
**Custo:** padrões novos no `boss.ts` + prova por chefe.
**Depende:** P2 de conteúdo; o `NUCLEO_RUSH` já é o modelo.

## 8. Arsenal e armadura

- 13 → 20 armas, uma por família (não 20 variações da mesma pistola);
- armadura com peso × velocidade (o `speed` do jogador já é stat);
- slots de skill: dash, escudo e fúria competem por espaço;
- peças com tradeoff visível (dano × recuo, pente × recarga).

**Ganho:** build com escolha real, que é o que sustenta a rejogabilidade.
**Custo:** balanceamento medido; cada arma precisa de som, projétil e pose.
**Depende:** P1-5 e o teste de economia.

## 9. Modos e rejogabilidade

- **Hardcore** já existe; falta uma tabela de recordes separada por modo;
- **Competitivo** com bots: medir antes de chamar de “apelão”;
- **Local 2P**: as setas acabaram de ser separadas; falta uma arena simétrica;
- **Desafio diário**: mesma seed, mesmo mapa, pontuação no leaderboard local.

**Ganho:** dá motivo para voltar depois da campanha.
**Custo:** seed determinística no spawner/loot + tela de recordes por modo.
**Depende:** P1-7; online continua adiado.

## 10. Apresentação e áudio

- playlist com faixa por bioma e tema de chefe (hoje são 5 com crossfade);
- camadas de música (exploração/combate) em vez de troca seca;
- SFX por material (parede de pedra × metal × madeira);
- ícone/logo do site: o favicon entrou; falta uma marca com o nome.

**Ganho:** o jogo deixa de soar “uma faixa para tudo”.
**Custo:** curadoria CC0 + ganchos no `audio.ts`.
**Depende:** T2 do roadmap.

---

## Ordem sugerida (se ninguém decidir nada)

1. **Fechar o que o jogador sente:** P0-1 (Vulcão), P0-2 (Ponte), P0-3
   (torreta/contratado). São relatos de playtest, não features.
2. **Melee + martelo** (P0-4): é a promessa de arma que o dono já fez.
3. **Diário + dicas + missões** (P0-5): barato, melhora a leitura da run.
4. **Cenografia por bioma** (item 6): o maior retorno visual por esforço.
5. **Moral/sorte/eventos** (item 4): o maior retorno de rejogabilidade.
6. **Parte II** (item 1): só depois da Parte I publicada e estável.
