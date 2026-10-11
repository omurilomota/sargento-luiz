# Publicar no itch.io

## Resposta curta

**Existe CLI do itch: sim.** É o `itchio` (Go, binário único).

```bash
# install
# Linux: baixe o binário em https://itch.io/docs/creators/cli e ponha no PATH
itchio login                      # abre o navegador pra autorizar
itchio push SEU_USUARIO ashfall ./dist    # envia build direto
```

Mas **para este projeto eu recomendo subir o zip pela interface web**, não pelo CLI:

- o `itch push` exige um token de API e que o jogo já exista com o slug criado
- você vai querer trocar `SUPPORT_URL` e as imagens antes de publicar
- o CLI não deixa você ver a página antes de ir ao ar

O zip já está pronto: **`ashfall.zip`** (8,6 MB, 658 arquivos), gerado por `npm run package`.

---

## O HTML

O jogo é **HTML5 puro**: um `index.html` que carrega um bundle JS. Não é nativo, não precisa de servidor.

- **Origem:** `npm run build` gera `dist/` a partir de `index.html` + `src/main.ts`
- **Artefato:** `dist/index.html` (626 bytes) + `dist/assets/` (o resto)
- **Pra rodar na web:** qualquer servidor HTTP estático serve. Não precisa de Node no servidor.

Testado servindo em subpath (`/itch/html/xyz/`), que é como o itch hospeda — todos os assets em 200.

### Rodar local pra testar

```bash
npm run dev            # com hot reload, em :5173
# ou testar o build de verdade:
npm run package && cd dist && python3 -m http.server 8000
```

`file://` **não funciona** — o navegador bloqueia `fetch` de arquivos locais. Use sempre servidor.

---

## Passo a passo no itch.io

1. Crie a conta em itch.io
2. **New Project** → tipo **HTML5**
3. Upload do `ashfall.zip`
4. Em **Embed options** — atenção, é aqui que dá pra estragar:
   - **Embed: `Click to launch in fullscreen`**, NÃO "Embed in page".
     "Embed in page" com tamanho manual 640x360 cria um iframe minúsculo —
     e o jogo é canvas responsivo que se ajusta à janela, então fica
     injogável na página.
   - **Fullscreen button: ON**
   - **Mobile friendly: DESLIGADO** — o jogo não tem nenhum evento de touch
   - **Automatically start on page load: DESLIGADO** — 12 MB não devem
     carregar sozinhos ao abrir a página
5. **Pricing**: **$0 or donate** (é a única opção em HTML5; não aceita compra).
   Suggested donation: **$1.00** é baixo demais — para jogo do tamanho do seu,
   $3 ou $5 lê como "vale o meu tempo" e não como "café". O valor é sugerido,
   quem quiser mais paga mais.

5b. **Public access settings**: **desmarque "Disable new downloads &
   purchases"**. Marcado, o jogo não aparece na busca e ninguém consegue doar —
   as doações ficam bloqueadas junto com os downloads.
6. Preencha a descrição (abaixo), tags, e suba a capa 630×500
7. **Publicar**

### Depois de publicar

- Troque `SUPPORT_URL` em `src/config.ts` pela URL real do seu projeto e republicue
- itch **Payouts**: entrevista fiscal com seu CPF, saque por PayPal/Payoneer. Sem CNPJ

---

## Texto para a página

### Short description (limite de 120 caracteres)

O erro `expected text between 1 and 120 characters` **não é bug do itch** — é o
validador recusando o campo. Acontece quando o texto colado passa de 120. A
descrição longa (o bloco "Descrição longa" abaixo) é para o campo **Description**,
que é outro campo e não tem esse limite.

**Não é pixel art.** Os sprites do Kenney têm 183–246 cores distintas cada, com
anti-aliasing e gradiente — pixel art costuma ter 8 a 64. É arte vetorial
estilizada, e descrever como pixel art atrai o público errado.

Use esta (104 caracteres):

> Top-down roguelite: 9 fases, 9 chefes, 12 armas e uma loja entre cada uma. Feito em TypeScript + Canvas.

Alternativas:

> Roguelite top-down de sobrevivência. Nove fases, nove chefes, doze armas e loja a cada uma. Sem engine. (103)
> Nove fases, nove chefes, doze armas. Você não limpa corredores: você luta por terreno, mapa por mapa. (101)
> Sobreviva a nove fases e nove chefes num mapa maior que a tela. Doze armas, loja entre cada uma. (96)
> Roguelite top-down: nove fases com mapa próprio, nove chefes, doze armas e loja entre uma e outra. (98)

O campo é estreito e o texto rola conforme digita — isso é normal, não trunca de
verdade. Só salva mesmo assim.

### Descrição longa

> **Você não limpa corredores. Você luta por terreno.**
>
> Nove biomas, cada um com mapa próprio de 30×20 células — maior que a tela, com
> paredes, cobertura, barris e hazards que mudam a leitura de cada tiro. Onde você
> fica é a decisão.
>
> **O que tem dentro:**
>
> - **9 fases**, da cidade em ruínas à estação orbital, cada uma com hazard
>   e objetivo próprios: limpar, sobreviver, destruir ninhos, proteger um
>   sobrevivente, chegar na zona
> - **9 chefes** com padrão de ataque próprio e telegrafia — você vê o que vem
>   antes de vir
> - **12 armas** com pente e recarga reais, e peças que mudam o
>   comportamento de cada uma
> - **24 conquistas**, diário de bordo com 11 entradas que reagem ao seu
>   desempenho, e 8 sinergias entre arma e upgrade
> - **4 modos**: campanha, competitivo contra bots, 2 jogadores local, e
>   hardcore (uma vida, sem loja)
>
> **Sobre:** projeto solo, escrito em TypeScript sobre Canvas 2D puro. Sem engine,
> sem framework, sem asset pago. Toda a arte é do Kenney Top-down Shooter (CC0).
> Trilha por faixas originais do projeto e efeitos por Kenney/OpenGameArt.
>
> **Controles:** WASD mover · mouse mirar · click atirar · espaço dash · F escudo
> · E fúria · R recarregar · 1-9 trocar arma · ESC pausa

**Cuidado com o Local 2P:** o segundo jogador se move, atira e mata inimigo por
contato, mas **não leva dano e não existe condição de vitória**. Anunciar como
"2 jogadores local" está correto; anunciar como-versus com quem se joga, não.
Ou você conserta antes de publicar, ou deixa a descrição do modo no itch mais
franca. Está anotado no `TODO.md`.

### Tags

`top-down`, `roguelite`, `survivor`, `shooter`, `singleplayer`, `action`,
`bullet-hell`, `post-apocalyptic`, `top-down-shooter`, `co-op`

**Sem `pixel-art` na tag.** A arte é vetorial estilizada (anti-aliasing, 183–246
cores por sprite). Quem busca por `pixel-art` chega esperando outra coisa e sai
na primeira partida.

**`co-op` está no limite.** O Local 2P existe mas o segundo jogador não leva dano
e não há condição de vitória — se não corrigir isso antes, troque por
`local-multiplayer`, que descreve o que o jogo realmente faz.

### AI generation disclosure — o que marcar de verdade

O itch aceita "Yes / No" e, se Yes, o **tipo** de conteúdo. Marcar errado nos
dois sentidos prejudica: declarar o que não é gera tag de filtro que afasta
jogador, e omitir o que é viola a regra.

| Categoria | Marcar | Por quê |
|---|---|---|
| Graphics | **NÃO** | Toda a arte é o pack Kenney Top-down Shooter (CC0). Nenhuma imagem gerada. O procedural é só fallback de asset que não carregou |
| Sounds | **NÃO** | 4 faixas reais (Eric Matyas / soundimage.org, Juhani Junkala / OpenGameArt) e 29 SFX de Kenney + OpenGameArt. Nada sintetizado no build |
| Text & Dialog | **SIM** | Cutscenes, diário, conquistas e barks de NPC foram escritos com assistente |
| Code | **SIM** | O jogo inteiro é TypeScript escrito com assistente |

### Avisos que você precisa preencher

- **Pricing**: No payment / donate only (HTML5 no itch não aceita compra)
- **Credits**: a página tem campo próprio. Além do que já está no jogo, o
  itch exibe créditos de asset:

  - Sprites: Kenney — Top-down Shooter — CC0 — kenney.nl
  - Música: faixas originais do projeto (CC0) + Eric Matyas / soundimage.org
    (atribuição obrigatória)
  - SFX: Kenney (CC0) + OpenGameArt (CC0/CC-BY 3.0)

O jogo já tem a tela de créditos no menu (tecla **V**) e o
`public/assets/CREDITS.md`. A atribuição do Eric Matyas tem que aparecer
**também** na página, não só dentro do jogo.
