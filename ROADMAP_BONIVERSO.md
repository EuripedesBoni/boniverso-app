# BoniVerso — Roteiro de desenvolvimento em etapas (31/10/2026)

**Critério:** concluir uma etapa somente após testes reais com conta de aluno e professor.

| Etapa | Funcionalidade | Situação |
|---|---|---|
| 1 | Segurança: alteração e recuperação de senha | **Concluída** — usuário validou recuperação |
| 2 | Perfil de estudante: foto e dados escolares | **Concluída** — foto e dados registrados e confirmados no Supabase |
| 3 | Turmas gratuitas Jaó/Areião com séries, convites, propostas e relatórios | **v1.0 preparada: banco ativo, frontend aguardando publicação/teste** |
| 4 | Aparecida de Goiânia: membros pagantes e aula ao vivo | **Urgente, não implementada** — usar reunião externa restrita como contingência para aula de hoje |
| 5 | Teste ponta a ponta de redação em PDF | **Pendente**, recursos disponíveis para teste |

## Etapa 3: estrutura aprovada

- Escolas principais: **Integrado Jaó** e **Integrado Areião**.
- Cada escola: 6º, 7º, 8º e 9º anos do EF; 1ª, 2ª e 3ª séries do EM (total **14 subdivisões**).
- Professor autorizado pode administrar escolas e séries (arquivamento reversível), gerar código de matrícula específico de cada série (código anterior é invalidado), criar propostas por série e gênero, consultar participantes, exportar CSV de resultados e imprimir/salvar em PDF.
- Estudantes autenticados entram somente pelo código de sua série, gratuitamente. Uma inscrição em outra série da mesma escola substitui a matrícula da série anterior.
- Atividades e seus PDFs são protegidos por políticas RLS e só são acessíveis a alunos matriculados na série, além da equipe autorizada.
- A IA atual foi calibrada para **dissertação ENEM**, portanto o backend rejeita pré-correção automática de outros gêneros; para cartas, resenhas, artigos etc, Rafael corrige manualmente até termos rubricas específicas. **Nenhuma IA publica notas sem validação humana.**
- O relatório é reservado ao professor e registra apenas as notas de correções aprovadas; não expor CSV para alunos.
- Dados pessoais de menores: minimizar coleta, respeitar LGPD e trabalhar com autorização da instituição/responsáveis conforme aplicável.

## Etapa 4 — prioridade operacional de hoje

Para a aula já anunciada, providenciar **uma sala externa com vídeo e chat (Meet/Zoom/Teams)**, compartilhar convite apenas aos alunos pagantes e testar câmera, microfone, compartilhamento de tela, duração e número de participantes. O link **não deve ser publicado em página aberta** ou em repositório público. O controle de matrículas e a aula integrada serão desenvolvidos depois.

## Publicação da v1.0

Enviar `index.html`, `sw.js`, `turmas.html`, `turmas-link.js`, `ROADMAP_BONIVERSO.md` à raiz de `EuripedesBoni/boniverso-app` e confirmar GitHub Pages. Não alterar chaves, `config.js`, dados, `online-app.js` ou outra aplicação.

## Testes após publicação

1. Login do Rafael: menu **Turmas e séries** abre e exibe 14 subdivisões.
2. Rafael gera **um código de teste para uma série** e o compartilha em privado com um aluno de teste.
3. Aluno entra em **Minhas turmas**, cola o código e visualiza somente a série correta.
4. Rafael cria proposta ENEM para aquela série. Aluno vê somente a proposta correspondente em **Redações**.
5. Aluno envia redação (texto ou PDF); Rafael valida correção, e relatório exibe nota.
6. Tentar acesso a outra série por outro aluno não matriculado; proposta deve ser invisível.
7. Confirmar exportação CSV e salvar impressão em PDF.
