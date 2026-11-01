# BoniVerso · Diário de Classe Digital v1.3.0

## O que está implementado no servidor

As seguintes alterações já foram realizadas no Supabase do BoniVerso:

- Tabela `public.boniverso_class_diary`, com RLS e leitura restrita a professores/administradores autenticados.
- Edge Function `boniverso-class-diary` com ações `catalog`, `load`, `save` e `delete`.
- Integração com os cadastros existentes de `courses`, `classrooms`, `classroom_sections`, `enrollments`, `classroom_memberships`, `profiles`, `boniverso_live_events` e `boniverso_live_attendance`.
- Nenhum cadastro duplicado de aluno, matrícula ou turma.

## Instalação no GitHub Pages

1. Abra https://github.com/EuripedesBoni/boniverso-app e selecione a branch `main`.
2. Use **Add file > Upload files** e envie **somente** `diario-classe.html` à pasta raiz do repositório.
3. Clique em **Commit changes**.
4. Abra `live-central.html` e, dentro do elemento `<nav>` do cabeçalho, acrescente o link:

   `<a href="./diario-classe.html">📘 Diário de Classe</a>`

5. Salve com **Commit changes** e aguarde a publicação do GitHub Pages.
6. Acesse https://euripedesboni.github.io/boniverso-app/diario-classe.html

## Primeiro teste

1. Entre no BoniVerso com a conta do professor.
2. Escolha o curso em que está cadastrada a **AULA teste**.
3. Confirme que ela aparece no histórico sem precisar de novo cadastro.
4. Clique em **Registrar conteúdo** e preencha um resumo de teste (salve como rascunho).
5. Consulte a aba **Frequência acumulada**; a conexão registrada pelo LiveKit aparecerá no curso correspondente.
6. Teste **Relatório PDF** e **CSV**. O PDF é gerado no navegador ao clicar no botão, usando `jsPDF` carregado de `esm.sh`.
7. Se desejar registrar aula presencial, use **+ Registrar aula**. Esse lançamento não registra presença automática.

## Privacidade e interpretação

- Apenas as contas reconhecidas pelo servidor como professor ou administrador podem consultar o diário.
- Não há alteração do sistema existente de vídeo, chat, gravação ou matrículas.
- **Conexão no LiveKit não equivale a frequência acadêmica oficial.** O percentual exibido considera aulas ao vivo que tenham pelo menos um registro de conexão no webhook.
- Aulas sem evento do webhook **não são contadas como faltas**.
- Reconexões do mesmo aluno dentro de uma aula são consolidadas; intervalos simultâneos não duplicam minutos.
- Os relatórios contêm nomes de estudantes; compartilhe-os apenas com profissionais autorizados.
- Se o navegador bloquear downloads ou o acesso à biblioteca externa de PDF, use o CSV ou tente novamente com conexão ativa.
- A primeira validação do servidor foi feita pela implantação e inspeção da tabela, função e segurança. O fluxo completo de preenchimento e exportação deve ser validado com a conta do professor após a publicação.

## Próxima evolução sugerida

Definir regras formais de frequência, faltas justificadas, calendário letivo e vinculação dos conteúdos aos objetivos curriculares; isso depende da política da instituição de ensino e não será inferido automaticamente dos minutos de conexão.
