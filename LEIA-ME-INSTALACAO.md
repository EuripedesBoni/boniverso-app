# BoniVerso v1.8.0 — Repertório Semanal por Turma

## Objetivo

Permitir ao Prof. Rafa Boni publicar arquivos PDF semanais destinados a turmas específicas (ou séries/grupos de uma turma) e permitir que os estudantes autorizados baixem os materiais.

## Instalação no GitHub

Repositório: https://github.com/EuripedesBoni/boniverso-app

1. Descompacte este ZIP no aplicativo Arquivos do iPad/iPhone ou no computador.
2. Abra a pasta **ENVIAR-PARA-GITHUB**.
3. No GitHub, entre no repositório, no branch **main**.
4. Em **Add file → Upload files**, selecione **os três arquivos da pasta**:
    - `index.html` (atualiza o atual, sem remover as integrações existentes);
    - `repertorios-semanais.html` (nova tela responsiva);
    - `boniverso-repertorios-menu-v180.js` (atalho no menu lateral e na página inicial).
5. Escolha **Commit changes**.
6. Confira a publicação no menu **Actions** do GitHub; aguarde que ela seja concluída com êxito.
7. Acesse a nova página: https://euripedesboni.github.io/boniverso-app/repertorios-semanais.html?v=180

**Não envie ao GitHub as credenciais privadas do Supabase.** Os arquivos utilizam o `config.js` público que já está no BoniVerso.

## Como o professor publica

1. Entre no BoniVerso com a conta de professor.
2. Abra **Repertório semanal** no menu.
3. Selecione a turma e, opcionalmente, uma série/grupo; por padrão, destina-se à turma inteira.
4. Escolha a semana de referência e digite título e orientações de estudo.
5. Anexe um PDF de até 10 MB e clique em **Salvar repertório como rascunho**.
6. Confira o arquivo pelo botão **Baixar PDF**.
7. Clique em **Publicar para a turma**, confirmando a publicação.

## Como os alunos baixam

1. Entrar no BoniVerso com a própria conta.
2. Abrir **Repertório semanal** no menu ou pelo atalho da página inicial.
3. Usar os filtros de turma, semana e assunto.
4. Clicar em **Baixar PDF**. O servidor emite um link de download temporário, válido por 2 minutos.

## Regras de acesso e armazenamento

- O armazenamento `boniverso-weekly-repertoires` é privado e limitado a 10 MB por PDF.
- Os materiais só aparecem para os integrantes autorizados da turma, da série quando escolhida, e respeitam cursos pagos associados.
- O professor pode revisar PDFs em rascunho, publicar e ocultar materiais. A conta do aluno não pode criar nem publicar arquivos.
- O backend e as regras de acesso já foram criados no Supabase. Não é necessário executar SQL manualmente.
- A funcionalidade **não envia notificações push** nesta etapa; essa é a etapa 5 do plano.

## Primeiro teste

Publicar um PDF simples para a turma **Aparecida de Goiânia — Prof. Rafa Boni**, como rascunho, depois publicar e verificar o download com uma conta matriculada. A publicação não cria nem altera matrículas.

## Se algo não aparecer

- Abra a página com `?v=180` para atualizar o cache.
- Confira se os três arquivos estão na **raiz do repositório** e se o GitHub Actions terminou em Success.
- Se a conta do estudante não estiver matriculada na turma, ela não verá materiais dessa turma; isso é esperado.
- Se houver erro ao baixar, confirme se o professor publicou o material e se a matrícula/assinatura continua válida.

## Verificações realizadas antes do pacote

- Foi criada tabela `public.boniverso_weekly_repertoires` com Row Level Security ativado.
- Conta anônima não tem SELECT na tabela; usuário autenticado não tem INSERT/UPDATE/DELETE diretamente.
- Função `boniverso-weekly-repertoires` ativa no Supabase, com verificação de login e papel docente.
- Layout testado em 320, 375, 390, 768 e 1280 pixels, sem rolagem lateral indevida.
- JavaScript verificado quanto a erros de sintaxe com `node --check`.
- O `index.html` do ZIP foi comparado pelo hash do conteúdo original do GitHub e recebeu somente a nova linha de integração.

Esta versão é **BoniVerso v1.8.0** — etapa 3 das melhorias solicitadas.
