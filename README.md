# Impacto Rebelde

Jogo original de ação lateral para **computador e celular**, inspirado no gênero run-and-gun. Arte procedural em pixel art e efeitos sonoros sintetizados, sem recursos de terceiros. Campanha solo com nove missões, nove chefões, resgate de civis, fuzil, metralhadora, escopeta, granadas, checkpoints, pausa e final.

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

Destrua o chefão de cada missão e atravesse a bandeira à direita. Civis e caixas fornecem pontos, granadas, saúde ou armas temporárias. O solo é contínuo, mas perigos periódicos exigem pular ou esperar; a luz amarela e o símbolo ! avisam antes da ativação. Plataformas oferecem rotas alternativas. Inimigos tornam-se mais numerosos e resistentes e chefões aceleram os ataques ao longo da campanha. Três vidas iniciais; checkpoint a cada trecho. Ao perder as vidas, a missão pode ser reiniciada. A próxima missão concede uma vida adicional (máximo cinco).

## Offline e progresso

Depois do primeiro acesso completo em HTTPS ou localhost, o service worker armazena todos os recursos. Espere a indicação “PRONTO PARA JOGAR OFFLINE”. Abra novamente o mesmo endereço para jogar sem internet. Progresso salvo por missão em localStorage: “Continuar campanha” retoma a missão, não o ponto exato. Limpar dados do navegador remove o progresso/cache. Sem multiplayer ou servidor.

## Testes

`npm test` executa 12 testes: nove mapas, saltos, aterrissagem, colisão contínua de projéteis, validação de save, controles, pausa, morte e reinício, recursos offline e progressão da campanha com combates reais simulados. A simulação da campanha usa invulnerabilidade controlada para verificar progressão, não dificuldade. O teste usa DOM/Canvas simulados em Node; não substitui validação visual em navegador. Física executada em passos fixos de 1/120 segundo; perda de foco pausa a partida. Veja `tests/engine.test.js` e `tests/campaign.test.js`. Testes automatizados não garantem ausência de todos os bugs; recomenda-se jogar a campanha completa antes de divulgação pública.

## Arquivos

- `engine.js`: mapas e física independente do navegador.
- `game.js`: campanha, controles, inimigos, chefões, HUD e renderização Canvas.
- `sw.js`: cache offline com escopo relativo, compatível com GitHub Pages.
- `style.css`, `index.html`: interface e menus.

Criado para Daniel Soliz. Personagens e cenários originais; não utiliza assets de Metal Slug. A versão 2 inclui personagens com armaduras, pernas articuladas, armas sombreadas e três classes de soldados; nove conjuntos de plataformas e cenários; minas, gelo, fio, chamas e energia com aviso; chefões com rajadas crescentes, tiros rasteiros e projéteis em arco. Mapas novos: Deserto de Vidro, Porto da Tempestade e Cidade Suspensa.

## Jogar no celular

Controles de toque aparecem automaticamente em dispositivos com ponteiro de toque. O botão CONTROLES permite alternar manualmente entre toque e teclado. Use as setas para andar, mirar acima e agachar; PULAR, ATIRAR e GRANADA executam as ações. Segure ATIRAR para disparo contínuo e combine os botões com vários dedos. PAUSA abre a tela de retomada.

O layout funciona em pé e deitado; em paisagem, a área do jogo e os controles cabem na altura disponível. Tela cheia inclui os controles quando o navegador suporta Fullscreen API. Em navegadores sem suporte, use o modo paisagem. Girar ou sair da página pausa o jogo e libera comandos para evitar movimento preso. Atualização de cache v3-mobile mantém os controles disponíveis offline.

Ao iniciar no celular, o site ativa a apresentação horizontal automaticamente. Tenta tela cheia e bloqueio de orientação quando suportados; se o navegador recusar, gira a interface com CSS. MENU retorna à página e libera a orientação. O navegador pode exigir o toque em INICIAR para permitir tela cheia.
