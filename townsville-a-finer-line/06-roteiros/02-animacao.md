# Filme de scroll / The line that reveals

## Abertura
A primeira cena já contém nome, headline e CTA: nunca exigir scroll para descobrir o contato. Intro opcional até 900ms: o arco do símbolo se desenha, sem tela de carregamento bloqueante.

## Sequência desktop
Trecho de aproximadamente 220svh com palco sticky de 100svh. Timeline reversível, baseada em progresso normalizado.

| Progresso | Cena | Comportamento | Asset |
|---|---|---|---|
| 0–0.16 | O fio | Linha champagne desenha arco. Macro visível, escala 1.10→1.05. | thread-path.svg + macro-brow-thread |
| 0.16–0.40 | O olhar | Arco amplia uma máscara; retrato aparece por crossfade. Não morphar rostos. | macro + hero-portrait |
| 0.40–0.62 | A presença | Fundo recua 2%; retrato alpha entra em discreto paralaxe. Título A finer line. mantém o grid. | portrait-alpha |
| 0.62–0.86 | A precisão | Arco desloca à esquerda e abre três janelas. Macro, cera e detalhe de atendimento se revelam. | três imagens de serviços |
| 0.86–1 | A entrega | Painéis alcançam suas posições reais na seção seguinte; retirar sticky sem salto. | grade de serviços |

A montagem não representa uma aplicação clínica do fio. Não animar movimentos invasivos sobre os olhos. Um fio SVG é um gesto visual, não uma simulação de depilação.

## Câmera e ritmo
Movimento de escala máximo 10%, rotação máxima 2°, deslocamento vertical 24px. Curva suave ease-in-out, sem elasticidade. Crossfade 300–500ms nas versões temporizadas. Contraste e nitidez do retrato constantes. Nenhum cabelo cresce ou desaparece por IA.

## Seções
Our craft: linha conecta a legenda à foto, desenho 500ms. Treatments: revelar imagens por máscara vertical com diferença de 70ms entre cartões. Hair & beauty: fade simples; disponibilidade deve ser consultada. Real work: imagens reais em grade estática e opcional comparação com controle de teclado. Visit us: arco termina numa linha sob o botão WhatsApp.

## Mobile e acessibilidade
Trecho máximo 150svh; apenas macro→retrato, painel de serviços segue em fluxo. Sem microtexto ou parallax de corpo. prefers-reduced-motion: hero estático, todos os conteúdos visíveis e sem pin prolongado. Teclado, foco e leitores de tela usam conteúdo HTML independente do palco. Não impedir scroll nativo.

## Limites
Os PNGs permitem máscaras e paralaxe 2D; não permitem rotação 3D real nem fio fisicamente simulado. Um filme com câmera orbitando exigiria cena 3D ou sequência de frames consistente. O estudo offline ilustra composição e timing, não pretende entregar essa etapa de produção adicional.
