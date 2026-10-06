# Créditos de Música

## Licença

**Gratuita com atribuição (Royalty-Free com crédito obrigatório) — Eric Matyas / soundimage.org.**
Não é CC0: a licença exige atribuir o autor. O crédito aqui e na tela de
créditos do jogo é a forma de cumprir.

## Origem

Após várias alternativas, as quatro faixas agora são as faixas originais do
autor Eric Matyas (soundimage.org), baixadas dos links diretos do site:

| Arquivo | Fonte | Página |
|---|---|---|
| `menu.ogg` | Mystical-Ocean-Puzzle-Game_v001.ogg | soundimage.org/looping-music/ |
| `combat.ogg` | Automation.ogg | soundimage.org/looping-music/ |
| `boss.ogg` | The-Darkness-Below_Looping.ogg | soundimage.org/looping-music/ |
| `shop.ogg` | Puzzle-Dreams.ogg | soundimage.org/looping-music/ |

Os 4 arquivos originais sintetizados por `tools/genmusic.py` foram preservados
em `/tmp/{menu,combat,boss,shop}_synth.ogg` durante o desenvolvimento para
fallback; o arquivo `genmusic.py` está no histórico do git e pode ser restaurado.

## Como se atribui

- Esta página: "Eric Matyas — soundimage.org — https://soundimage.org"
- Fora do game (README): idem.
- No game: a tela de créditos (`V` no menu) já lista a origem.

A licença diz que atribuição *é* a forma correta de usar: sem ela, o uso é
ilegal; com ela, o uso comercial/não-comercial é livre.

## Regenerar

```bash
# Re-baixar as quatro faixas atuais:
curl -sL -o menu.ogg "https://soundimage.org/wp-content/uploads/2025/10/Mystical-Ocean-Puzzle-Game_v001.ogg"
curl -sL -o combat.ogg "https://soundimage.org/wp-content/uploads/2025/10/Automation.ogg"
curl -sL -o boss.ogg "https://soundimage.org/wp-content/uploads/2025/10/The-Darkness-Below_Looping.ogg"
curl -sL -o shop.ogg "https://soundimage.org/wp-content/uploads/2025/10/Puzzle-Dreams.ogg"
```
