# BoniVerso — Roteiro de implantação | 30/10/2026

**Objetivo:** avançar em uma etapa por vez, somente marcar como concluída após teste com contas reais do aluno e professor.

| Etapa | Escopo | Estado | Critério de aceite |
|---|---|---|---|
| 1 | Segurança da conta: alteração de senha, esqueci senha, recuperação por e-mail | Código pronto; aguardando publicação e testes | Troca funciona, nova senha permite login, recuperação por e-mail retorna ao aplicativo e conclui atualização |
| 2 | Perfil do estudante com foto e dados essenciais | Não iniciada | Foto privada/editável, dados com consentimento e campos obrigatórios mínimos, acesso limitado por RLS |
| 3 | Turmas Jaó e Areião gratuitas | Não iniciada | Professor cria/arquiva turmas; alunos recebem convite/código; redações por proposta e gênero; pré-correção IA, avaliação final Rafael; relatório de estudantes e notas |
| 4 | Turma Aparecida de Goiânia, pagantes e aula ao vivo | **Urgente: aula 31/10/2026** | Cadastros individuais sem compartilhar senhas; membros pagantes autorizados; transmissão testada com vídeo, áudio e perguntas/chat; plano alternativo pronto |
| 5 | Teste do PDF | Atualização v0.7 publicada; teste end-to-end pendente | Aluno anexa PDF legível de até 5 MB, professor abre, IA sugere correção, Rafael aprova, aluno consulta devolutiva |

## Prioridade operacional: aula de amanhã (31/10/2026)

A Etapa 4 precisa de uma contingência antes do desenvolvimento completo. Para **a aula já anunciada**, a opção mais confiável é uma sala de reunião existente (ex.: Google Meet) com o link distribuído apenas à lista de alunos que pagaram; vídeo e chat ocorrem no próprio serviço externo. O link privado não deve ser exposto no GitHub público nem em conteúdo visível a não matriculados. Atenção: em uma conta pessoal gratuita do Google Meet, reuniões com 3 ou mais participantes têm limite de 60 minutos. Se a aula for mais longa, escolher antes uma opção compatível com a duração e o tamanho da turma. Testar câmera, microfone, áudio, compartilhamento de tela e o acesso de um aluno convidado. A integração dentro do BoniVerso será uma etapa posterior, quando turmas e permissões de matrícula estiverem prontas.

## Notas de privacidade

Não criar senhas em planilhas nem enviá-las por mensagens. Cada aluno deve ativar sua própria conta por e-mail. Para estudantes menores, aplicar coleta mínima, transparência e medidas apropriadas de consentimento. A IA produz rascunho privado e o professor valida a correção antes da publicação. As rubricas de gêneros textuais não devem aplicar automaticamente a matriz de dissertação ENEM a todos os gêneros.
