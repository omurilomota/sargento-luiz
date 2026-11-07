// Gerado por tools/gensite.mjs a partir de src/config.ts — não editar à mão.
window.ASHFALL = {
 "geradoEm": "2026-11-07",
 "contadores": {
  "fases": 16,
  "armas": 13,
  "chefes": 16,
  "inimigos": 40,
  "upgrades": 24
 },
 "fases": [
  {
   "indice": 0,
   "nome": "Cidade em Ruínas",
   "ondas": 3,
   "dificuldade": 0.7,
   "objetivo": "clear",
   "chefe": "vigia"
  },
  {
   "indice": 1,
   "nome": "Rodovia",
   "ondas": 4,
   "dificuldade": 0.82,
   "objetivo": "survive",
   "chefe": "pedagiario"
  },
  {
   "indice": 2,
   "nome": "Floresta",
   "ondas": 4,
   "dificuldade": 0.75,
   "objetivo": "clear",
   "chefe": "alphaWolf"
  },
  {
   "indice": 3,
   "nome": "Hospital de Campanha",
   "ondas": 5,
   "dificuldade": 0.76,
   "objetivo": "clear",
   "chefe": "cirurgiao"
  },
  {
   "indice": 4,
   "nome": "Caverna",
   "ondas": 5,
   "dificuldade": 0.81,
   "objetivo": "destroy",
   "chefe": "crystalQueen"
  },
  {
   "indice": 5,
   "nome": "Fábrica",
   "ondas": 5,
   "dificuldade": 0.93,
   "objetivo": "survive",
   "chefe": "sentinel"
  },
  {
   "indice": 6,
   "nome": "Pátio de Trens",
   "ondas": 5,
   "dificuldade": 0.93,
   "objetivo": "destroy",
   "chefe": "maquinista"
  },
  {
   "indice": 7,
   "nome": "Ponte",
   "ondas": 5,
   "dificuldade": 0.94,
   "objetivo": "reach",
   "chefe": "gargula"
  },
  {
   "indice": 8,
   "nome": "Pântano",
   "ondas": 6,
   "dificuldade": 1.15,
   "objetivo": "clear",
   "chefe": "leviathan"
  },
  {
   "indice": 9,
   "nome": "Refinaria",
   "ondas": 6,
   "dificuldade": 0.78,
   "objetivo": "collect",
   "chefe": "torre"
  },
  {
   "indice": 10,
   "nome": "Subestação",
   "ondas": 6,
   "dificuldade": 0.96,
   "objetivo": "survive",
   "chefe": "transformador"
  },
  {
   "indice": 11,
   "nome": "Vulcão",
   "ondas": 7,
   "dificuldade": 0.74,
   "objetivo": "reach",
   "chefe": "infernoPrime"
  },
  {
   "indice": 12,
   "nome": "Porto",
   "ondas": 7,
   "dificuldade": 0.92,
   "objetivo": "destroy",
   "chefe": "capitao"
  },
  {
   "indice": 13,
   "nome": "Castelo",
   "ondas": 6,
   "dificuldade": 0.95,
   "objetivo": "protect",
   "chefe": "reiMutante"
  },
  {
   "indice": 14,
   "nome": "Espaço",
   "ondas": 7,
   "dificuldade": 0.93,
   "objetivo": "clear",
   "chefe": "mothership"
  },
  {
   "indice": 15,
   "nome": "NÚCLEO-CENTRAL",
   "ondas": 8,
   "dificuldade": 0.93,
   "objetivo": "clear",
   "chefe": "nucleo"
  }
 ],
 "armas": [
  {
   "nome": "Pistola",
   "dano": 12,
   "cadencia": 0.35,
   "pente": 10,
   "desc": "10 tiros por pente, recarga em 1.2s"
  },
  {
   "nome": "Shotgun",
   "dano": 9,
   "cadencia": 0.6,
   "pente": 8,
   "desc": "Cone curto, 3 projéteis por tiro"
  },
  {
   "nome": "Metralhadora",
   "dano": 6,
   "cadencia": 0.14,
   "pente": 25,
   "desc": "25 no pente, dispersão leve"
  },
  {
   "nome": "Sniper",
   "dano": 50,
   "cadencia": 1.2,
   "pente": 4,
   "desc": "4 no pente, atravessa o primeiro alvo"
  },
  {
   "nome": "Laser",
   "dano": 2,
   "cadencia": 0.06,
   "pente": 40,
   "desc": "Cadência altíssima, dano baixo, pente de 40"
  },
  {
   "nome": "RPG",
   "dano": 70,
   "cadencia": 1.8,
   "pente": 2,
   "desc": "2 no pente, explosão de raio 140"
  },
  {
   "nome": "Raios",
   "dano": 4,
   "cadencia": 0.25,
   "pente": 15,
   "desc": "2 raios por tiro, cada um atravessa"
  },
  {
   "nome": "Gel",
   "dano": 8,
   "cadencia": 0.28,
   "pente": 20,
   "desc": "2 projéteis, dano alto, sem pierce"
  },
  {
   "nome": "Granada",
   "dano": 42,
   "cadencia": 1.4,
   "pente": 3,
   "desc": "Explosão menor que a da RPG, 3 por pente"
  },
  {
   "nome": "Mina",
   "dano": 44,
   "cadencia": 2.8,
   "pente": 2,
   "desc": "Explosão de raio 140 ao pisar em cima"
  },
  {
   "nome": "BFG",
   "dano": 38,
   "cadencia": 2,
   "pente": 1,
   "desc": "5 projéteis explosivos, 1 por recarga"
  },
  {
   "nome": "M. Quebrada",
   "dano": 5,
   "cadencia": 0.3,
   "pente": 30,
   "desc": "Alta cadência, encasquilha após 35 tiros — Reparar conserta"
  },
  {
   "nome": "Destruidor",
   "dano": 110,
   "cadencia": 1.6,
   "pente": 3,
   "desc": "O martelo do Luiz: 1 golpe, explosão de raio 260, 3 por recarga"
  }
 ],
 "inimigos": [
  {
   "tipo": "grunt",
   "vida": 20,
   "dano": 10,
   "velocidade": 80
  },
  {
   "tipo": "mutante",
   "vida": 80,
   "dano": 18,
   "velocidade": 62
  },
  {
   "tipo": "runner",
   "vida": 10,
   "dano": 8,
   "velocidade": 160
  },
  {
   "tipo": "tank",
   "vida": 80,
   "dano": 20,
   "velocidade": 50
  },
  {
   "tipo": "bat",
   "vida": 15,
   "dano": 6,
   "velocidade": 120
  },
  {
   "tipo": "robot",
   "vida": 50,
   "dano": 12,
   "velocidade": 70
  },
  {
   "tipo": "slime",
   "vida": 25,
   "dano": 8,
   "velocidade": 60
  },
  {
   "tipo": "spitter",
   "vida": 18,
   "dano": 4,
   "velocidade": 70
  },
  {
   "tipo": "crystal",
   "vida": 60,
   "dano": 15,
   "velocidade": 40
  },
  {
   "tipo": "drone",
   "vida": 12,
   "dano": 5,
   "velocidade": 100
  },
  {
   "tipo": "mosquito",
   "vida": 8,
   "dano": 4,
   "velocidade": 200
  },
  {
   "tipo": "frog",
   "vida": 22,
   "dano": 10,
   "velocidade": 90
  },
  {
   "tipo": "knight",
   "vida": 45,
   "dano": 18,
   "velocidade": 65
  },
  {
   "tipo": "archer",
   "vida": 20,
   "dano": 8,
   "velocidade": 55
  },
  {
   "tipo": "mage",
   "vida": 25,
   "dano": 12,
   "velocidade": 50
  },
  {
   "tipo": "fireElemental",
   "vida": 28,
   "dano": 12,
   "velocidade": 85
  },
  {
   "tipo": "lavaSlime",
   "vida": 35,
   "dano": 10,
   "velocidade": 45
  },
  {
   "tipo": "magmaGolem",
   "vida": 120,
   "dano": 25,
   "velocidade": 35
  },
  {
   "tipo": "inferno",
   "vida": 30,
   "dano": 8,
   "velocidade": 90
  },
  {
   "tipo": "ufo",
   "vida": 40,
   "dano": 10,
   "velocidade": 70
  },
  {
   "tipo": "asteroid",
   "vida": 100,
   "dano": 21,
   "velocidade": 30
  },
  {
   "tipo": "alien",
   "vida": 20,
   "dano": 8,
   "velocidade": 110
  },
  {
   "tipo": "biomaquina",
   "vida": 55,
   "dano": 14,
   "velocidade": 95
  },
  {
   "tipo": "vigia",
   "vida": 290,
   "dano": 18,
   "velocidade": 78
  },
  {
   "tipo": "alphaWolf",
   "vida": 380,
   "dano": 26,
   "velocidade": 95
  },
  {
   "tipo": "crystalQueen",
   "vida": 550,
   "dano": 30,
   "velocidade": 45
  },
  {
   "tipo": "sentinel",
   "vida": 360,
   "dano": 34,
   "velocidade": 38
  },
  {
   "tipo": "leviathan",
   "vida": 420,
   "dano": 36,
   "velocidade": 60
  },
  {
   "tipo": "reiMutante",
   "vida": 630,
   "dano": 38,
   "velocidade": 55
  },
  {
   "tipo": "rogerioInf",
   "vida": 520,
   "dano": 22,
   "velocidade": 72
  },
  {
   "tipo": "infernoPrime",
   "vida": 830,
   "dano": 40,
   "velocidade": 62
  },
  {
   "tipo": "mothership",
   "vida": 980,
   "dano": 44,
   "velocidade": 30
  },
  {
   "tipo": "pedagiario",
   "vida": 320,
   "dano": 20,
   "velocidade": 60
  },
  {
   "tipo": "cirurgiao",
   "vida": 460,
   "dano": 26,
   "velocidade": 76
  },
  {
   "tipo": "maquinista",
   "vida": 560,
   "dano": 30,
   "velocidade": 52
  },
  {
   "tipo": "gargula",
   "vida": 580,
   "dano": 28,
   "velocidade": 85
  },
  {
   "tipo": "torre",
   "vida": 640,
   "dano": 36,
   "velocidade": 40
  },
  {
   "tipo": "transformador",
   "vida": 720,
   "dano": 40,
   "velocidade": 50
  },
  {
   "tipo": "capitao",
   "vida": 780,
   "dano": 42,
   "velocidade": 62
  },
  {
   "tipo": "nucleo",
   "vida": 1060,
   "dano": 46,
   "velocidade": 34
  }
 ]
};
