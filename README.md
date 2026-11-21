# Etapa — MVP (protótipo v0.2)

Plataforma web para organização de trabalhos acadêmicos em grupo.
Projeto da disciplina Tópicos Especiais II e III — Pós-Graduação em Gestão de Projetos e Negócios (IFRJ, 2026.2).

> "Etapa" é um nome provisório. Para trocar, altere a constante `APP_NAME` no início de `js/app.js`.

## Problema
Grupos de estudantes coordenam trabalhos por WhatsApp e e-mail. Arquivos se perdem, conversas ficam fragmentadas e, quando as etapas dependem umas das outras, o atraso de uma recai sobre quem vem depois (10 entrevistas com estudantes de Engenharia, Medicina, Odontologia, Arquitetura e Direito).

## Funcionalidades do MVP
- **Visão geral:** progresso, prazo final, alertas de atraso e responsabilidades de cada integrante.
- **Etapas e tarefas:** sequência com responsável e prazo; quando uma etapa atrasa, quem vem depois é avisado.
- **Arquivos:** histórico de versões (R1, R2, R3...) com autor, data e o que mudou.
- **Dúvidas:** canal do grupo com respostas registradas; dúvidas para o professor ficam com o representante.
- **Equipe:** participação visível de cada integrante; definição do representante com o professor.
- Vários trabalhos e simulação de integrantes ("Você é...") para demonstração.

## Estrutura
```
index.html      estrutura da página
css/style.css   estilos
js/app.js       funcionalidades e dados de exemplo
```

## Como executar
Abra `index.html` no navegador. Não precisa de instalação, servidor nem internet.

Para publicar: crie um repositório no GitHub com estes arquivos e ative o **GitHub Pages** (branch principal, pasta raiz).

## Limites do protótipo
- Os dados ficam no `localStorage`, ou seja, apenas no navegador usado. Não há login nem sincronização entre integrantes.
- O envio de arquivos é simulado: só o nome e a versão são registrados.
- O trabalho de exemplo ("Artigo científico em grupo") é ilustrativo e pode ser restaurado pelo botão "Restaurar exemplo".

## Próximas versões
Contas de usuário e banco de dados compartilhado, upload real de arquivos, notificações por e-mail/WhatsApp, entregas parciais com feedback do professor, área de referências e modelos de trabalhos.
