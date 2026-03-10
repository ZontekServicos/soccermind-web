Objetivo

O usuário digita o nome de uma lesão e o sistema retorna uma análise objetiva sobre:

se a lesão é prejudicial para performance/carreira

nível de severidade (Leve/Moderada/Grave)

métricas resumidas de impacto (tempo médio fora, risco de recorrência, impacto na performance)

Layout

Manter o estilo atual da plataforma (dark mode, cards arredondados, visual esportivo/tecnológico, tipografia limpa).

Seção 1 — Search (principal)

Criar um campo grande central com placeholder:
“Digite a lesão (ex: ruptura de LCA, pubalgia, tendinite patelar)”
Botão ao lado: “Analisar”
Abaixo, pequenos chips de exemplos clicáveis (LCA, Pubalgia, Aquiles, Isquiotibiais).

Fluxo com IF/ELSE (estados de UI)
Estado A — Lesão encontrada (match alto)

Ao pesquisar, abrir um modal/caixinha de confirmação com texto:
“Você quis dizer: [NOME PADRONIZADO DA LESÃO]?”
Botões:

“Sim, é essa” (primary)

“Não, pesquisar de novo” (secondary)

Estado B — Não encontrado

Mostrar card com mensagem:
“Não encontramos essa lesão no banco.”
Abaixo, lista de sugestões semelhantes (3 a 6 itens) clicáveis.
Botão: “Tentar novamente”

Estado C — Resultado confirmado (após clicar “Sim, é essa”)

Exibir um card grande “Resultado” com:

Badge de severidade (Leve/Moderada/Grave)

Linha: “Prejudicial à carreira?” com resposta (Não / Parcial / Sim)

Métricas em 3 a 4 mini-cards:

Tempo médio fora (dias)

Risco de recorrência

Impacto na performance

Áreas afetadas (ex: explosão, aceleração, resistência)
Incluir um texto curto “Resumo” abaixo, estilo análise profissional.

Observações
Não incluir timeline de lesões.
Não incluir comparação com outros jogadores.
Foco apenas em consulta + confirmação + resposta.