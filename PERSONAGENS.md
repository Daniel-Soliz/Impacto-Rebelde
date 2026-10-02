# Personagens de Impacto Rebelde

A imagem original foi redesenhada com oito identidades próprias. A arte criada está em `assets/characters-v12.webp`, com transparência, 2171 × 724 pixels. O jogo usa a própria arte, não uma tentativa de reproduzi-la com retângulos.

| Índice | Personagem | Design | Uso |
|---|---|---|---|
| 0 | Rebelde Cobalto | Cabelo prateado, visor ciano, jaqueta azul, lenço laranja e botas claras | Protagonista exclusivo |
| 1 | Infantaria | Capacete escuro, uniforme oliva e lenço vermelho | Soldado |
| 2 | Atirador das Dunas | Capuz e capa de areia, roupa marrom e rifle longo | Sniper |
| 3 | Blindado | Armadura grafite, ombreiras laranja e visor âmbar | Heavy |
| 4 | Comando Urbano | Jaqueta roxa, máscara escura e detalhes turquesa | Soldado |
| 5 | Patrulha Polar | Casaco claro, gola de pelo, cinza e verde azulado | Soldado |
| 6 | Oficial Carmesim | Casaco vermelho, quepe e detalhes dourados | Soldado |
| 7 | Androide | Metal escuro, ombros claros, núcleo ciano e sensores laranja | Soldado |

## 1. Carregamento da imagem — game.js

```js
const characterAtlas = typeof Image === 'undefined' ? null : new Image();
if (characterAtlas) characterAtlas.src = './assets/characters-v12.webp';
```

`Image` carrega a textura uma vez. O teste de `complete` e `naturalWidth` garante que o desenho só usa a imagem quando há pixels disponíveis. Enquanto ela carrega, o desenho anterior serve de alternativa. Não existe dependência de servidor de imagens externo.

## 2. Regiões de cada personagem

```js
const CHARACTER_REGIONS = [
  {name: 'Rebelde Cobalto', x: 0, w: 261},
  {name: 'Infantaria', x: 261, w: 229},
  {name: 'Atirador das Dunas', x: 490, w: 293},
  {name: 'Blindado', x: 783, w: 289},
  {name: 'Comando Urbano', x: 1072, w: 271},
  {name: 'Patrulha Polar', x: 1343, w: 267},
  {name: 'Oficial Carmesim', x: 1610, w: 281},
  {name: 'Androide', x: 1891, w: 280}
];
```

`x` inicia o recorte horizontal; `w` define a largura. A faixa vertical usada começa em `125` e tem altura `523`. Esses números pertencem a esta imagem: se a arte for substituída, é necessário atualizar as regiões. A composição possui pequenos contatos entre armas e figuras vizinhas; não é uma folha de sprites desenhada com células isoladas.

## 3. Escolha de aparência

```js
const index = friendly ? 0
  : role === 'heavy' ? 3
  : role === 'sniper' ? 2
  : variant ?? 1;
```

O protagonista sempre recebe a aparência 0. Blindados e snipers mantêm aparência identificável. Em `engine.js`, os outros soldados recebem:

```js
skin: [1, 4, 5, 6, 7][(n + index) % 5]
```

`n` é o número do inimigo e `index` é a fase. Isso alterna as roupas sem mudar dano, posição ou comportamento. Drones, torretas e chefes continuam com seus desenhos mecânicos; civis resgatáveis mantêm o desenho anterior para não parecerem combatentes.

## 4. Tamanho e alinhamento com o chão

```js
const height = friendly ? 62 : 58;
const width = height * region.w / sourceH;
const feet = y + (friendly ? 48 : 42);
ctx.translate(x + 14, feet);
ctx.scale(face < 0 ? -1 : 1, 1);
```

O desenho fica maior que a caixa de colisão, mas seus pés acompanham a base do corpo. A largura preserva a proporção da arte. A escala negativa espelha o personagem quando olha para a esquerda. As caixas de colisão anteriores continuam funcionando para pulo, plataformas e tiros.

## 5. Caminhada e movimento corporal

```js
const step = Math.sin(walk);
const bob = moving ? Math.abs(step) * 1.1 : Math.sin(time * 2) * .25;
const split = Math.floor(sourceH * .66);
```

A imagem é dividida na altura do quadril. O tronco sobe e desce levemente. A região inferior é dividida em duas metades, deslocadas e giradas em sentidos opostos:

```js
const dy = moving ? (leg === 0 ? step : -step) * 2.2 : 0;
ctx.rotate(moving ? (leg === 0 ? step : -step) * .09 : 0);
ctx.drawImage(characterAtlas, sourceX, sourceY, sourceWidth, sourceHeight,
              destinationX, destinationY, destinationWidth, destinationHeight);
```

Os quatro primeiros números de `drawImage` recortam a textura; os quatro últimos posicionam e dimensionam os pixels na tela. `save` e `restore` impedem que a rotação de uma perna afete o restante do jogo.

Esta é animação por deformação de uma pose ilustrada. Não é uma sequência de desenhos exclusivos para cada passada; pode haver pequenas emendas na separação das pernas.

## 6. Agachamento, salto e tiro

- Agachamento: escala vertical `.68` e horizontal `1.12`, mantendo os pés no chão.
- Salto: o desenho acompanha `p.y`, calculado pela física existente.
- Tiro: o tronco recua `1.7` unidades enquanto o temporizador `p.shot` está ativo.
- Clarão: um pequeno polígono amarelo aparece junto à arma ao disparar.
- Mira para cima: um cano adicional indica a direção vertical. A arma desenhada na pose original permanece na textura; uma pose vertical completa exigiria outro quadro de arte.
- Granada: o lançamento, consumo de munição e explosão continuam usando a física existente. Não foi criada uma pose exclusiva de braço arremessando.

## 7. Suavização e transparência

`ctx.imageSmoothingEnabled = true` reduz serrilhado ao diminuir a imagem detalhada. O estado é restaurado após cada personagem para preservar o restante do estilo do jogo. A textura WebP preserva o fundo transparente e reduz o tamanho do download.

## 8. Uso offline e atualização

`sw.js` inclui `./assets/characters-v12.webp` na lista de arquivos offline. O cache e os links de CSS/JavaScript foram atualizados para a versão `characters12`.

## 9. Validação

Os testes automatizados de campanha executam o caminho do novo renderizador com uma imagem simulada, além de verificar movimento, salto, tiros, granadas, controles por toque, colisões e avanço pelas nove fases. Isso não substitui avaliação visual e de desempenho em um celular real.

Para animação quadro a quadro completa, o próximo trabalho artístico é uma folha com células isoladas para parado, corrida, salto, agachamento, tiro horizontal, tiro vertical e arremesso, em cada aparência.
