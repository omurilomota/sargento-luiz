# Créditos de Música

## Licença

**Mista:**
- `menu.ogg` — **CC0** (domínio público; crédito é cortesia, não obrigação)
- `combat.ogg`, `boss.ogg`, `shop.ogg`, `epilogo.ogg` — **Royalty-Free com atribuição obrigatória** — Eric Matyas / soundimage.org

## Origem

| Arquivo | Fonte | Página | Licença |
|---|---|---|---|
| `menu.ogg` | Post Apocalyptic Wastelands [Loop Ready] | opengameart.org/content/horror-atmosphere | CC0 |
| `combat.ogg` | Automation.ogg | soundimage.org/looping-music/ | RF com atribuição |
| `boss.ogg` | The-Darkness-Below_Looping.ogg | soundimage.org/looping-music/ | RF com atribuição |
| `shop.ogg` | Puzzle-Dreams.ogg | soundimage.org/looping-music/ | RF com atribuição |
| `epilogo.ogg` | Autumn-Changes_Looping.mp3 (transcodado MP3→OGG, libvorbis q5) | soundimage.org/introspective/ | RF com atribuição |
| `combat_ruinas.ogg` | Dystopic-Mayhem.ogg | soundimage.org/looping-music/ | RF com atribuição |
| `combat_industrial.ogg` | And-the-Machines-Came-at-Midnight.ogg | soundimage.org/looping-music/ | RF com atribuição |
| `combat_terminal.ogg` | 80s-Space-Game-Loop_v002.ogg | soundimage.org/looping-music/ | RF com atribuição |

As três novas faixas de combate tocam por FAMÍLIA DE BIOMA, não por fase:
ruínas (Cidade, Rodovia, Floresta, Hospital, Pântano), indústria (Fábrica,
Pátio de Trens, Refinaria, Subestação, Porto) e terminal (Vulcão, Castelo,
Espaço, Bunker). A seleção mora em `MUSICA_POR_BIOMA` no `src/main.ts`.

`menu.ogg` é "Post Apocalyptic Wastelands [Loop Ready]" de
Juhani Junkala / SubspaceAudio, da página "Horror Atmosphere"
do OpenGameArt — CC0, loop perfeito de 5:23, temática pós-apocalíptica.

`epilogo.ogg` é "Autumn Changes (Looping)" de Eric Matyas — a faixa
nostálgica do epílogo reescrito (DECISIONS #174): "as the chilly autumn
wind whisks summer away, a chapter closes in our lives as another one
begins". 1:46 de loop, tocada no epílogo e sob a tela de fim.

Os 4 arquivos originais sintetizados por `tools/genmusic.py` foram preservados
em `/tmp/{menu,combat,boss,shop}_synth.ogg` durante o desenvolvimento para
fallback; o arquivo `genmusic.py` está no histórico do git e pode ser restaurado.

## Como se atribui

- `menu.ogg`: "Juhani Junkala / SubspaceAudio — Post Apocalyptic Wastelands — opengameart.org/content/horror-atmosphere — CC0"
- As outras (boss, shop, epílogo e as três de bioma): "Eric Matyas — soundimage.org — https://soundimage.org"
- No game: a tela de créditos (`V` no menu) já lista a origem.

A licença do soundimage.org diz que atribuição *é* a forma correta de usar:
sem ela, o uso é ilegal; com ela, o uso comercial/não-comercial é livre.

## Regenerar

```bash
# Re-baixar as quatro faixas atuais:
curl -sL -o menu.ogg "https://opengameart.org/sites/default/files/Juhani%20Junkala%20-%20Post%20Apocalyptic%20Wastelands%20%5BLoop%20Ready%5D.ogg"
curl -sL -o combat.ogg "https://soundimage.org/wp-content/uploads/2025/10/Automation.ogg"
curl -sL -o boss.ogg "https://soundimage.org/wp-content/uploads/2025/10/The-Darkness-Below_Looping.ogg"
curl -sL -o shop.ogg "https://soundimage.org/wp-content/uploads/2025/10/Puzzle-Dreams.ogg"
```
