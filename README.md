# Impacto Rebelde

Jogo original de ação lateral para **computador**, inspirado no gênero run-and-gun. Arte procedural em pixel art e efeitos sonoros sintetizados, sem recursos de terceiros. Campanha solo com seis missões, seis chefões, resgate de civis, fuzil, metralhadora, escopeta, granadas, checkpoints, pausa e final.

## Jogar e publicar

Site estático, sem build ou dependências de produção. No GitHub: **Settings → Pages → Deploy from a branch → main → / (root) → Save**. Endereço previsto: https://daniel-soliz.github.io/Impacto-Rebelde/ . A configuração de Pages precisa ser ativada pelo proprietário; enviar arquivos não ativa Pages automaticamente.

Para desenvolvimento: `npm start` ou `python3 -m http.server 8080`, depois abra http://localhost:8080 . Não abra index.html diretamente como arquivo: módulos e cache offline precisam de HTTP/HTTPS.

## Controles

| Tecla | Ação |
|---|---|
| A / D ou setas | Andar |
| Espaço | Pular; soltar antes reduz a altura |
| S / seta abaixo | Agachar |
| W / seta acima | Mirar para cima |
| J (segurar) | Atirar |
| K | Granada |
| Esc / P | Pausar / continuar |

Destrua o chefão de cada missão e atravesse a bandeira à direita. Civis e caixas fornecem pontos, granadas, saúde ou armas temporárias. Sem armadilhas que exijam saltos impossíveis: o solo é contínuo e as plataformas oferecem posições alternativas. Três vidas iniciais; checkpoint a cada trecho. Ao perder as vidas, a missão pode ser reiniciada. A próxima missão concede uma vida adicional (máximo cinco).

## Offline e progresso

Depois do primeiro acesso completo em HTTPS ou localhost, o service worker armazena todos os recursos. Espere a indicação “PRONTO PARA JOGAR OFFLINE”. Abra novamente o mesmo endereço para jogar sem internet. Progresso salvo por missão em localStorage: “Continuar campanha” retoma a missão, não o ponto exato. Limpar dados do navegador remove o progresso/cache. Sem multiplayer ou servidor.

## Testes

`npm test` executa nove testes: seis mapas, saltos, aterrissagem, colisão contínua de projéteis, validação de save, controles, pausa, morte e reinício, recursos offline e progressão da campanha com combates reais simulados. A simulação da campanha usa invulnerabilidade controlada para verificar progressão, não dificuldade. O teste usa DOM/Canvas simulados em Node; não substitui validação visual em navegador. Física executada em passos fixos de 1/120 segundo; perda de foco pausa a partida. Veja `tests/engine.test.js` e `tests/campaign.test.js`. Testes automatizados não garantem ausência de todos os bugs; recomenda-se jogar a campanha completa antes de divulgação pública.

## Arquivos

- `engine.js`: mapas e física independente do navegador.
- `game.js`: campanha, controles, inimigos, chefões, HUD e renderização Canvas.
- `sw.js`: cache offline com escopo relativo, compatível com GitHub Pages.
- `style.css`, `index.html`: interface e menus.

Criado para Daniel Soliz. Personagens e cenários originais; não utiliza assets de Metal Slug. A primeira versão tem estética procedural simples e chefões com padrões de dificuldade progressiva.
