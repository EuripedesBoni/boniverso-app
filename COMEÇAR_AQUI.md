# BoniVerso — RSB Educação | Versão 0.3 (30/10/2026)

O BoniVerso continua com a identidade visual **aprovada** (azul, dourado, foto do Prof. Rafael). Este pacote implementa o fluxo de **autenticação + banco** para ser ativado num Supabase NOVO, separado de EstudNexa e de qualquer outro projeto. A versão anterior continua disponível em modo demonstração.

## O que há nesta versão

| Recurso | Sem configuração (demonstração) | Depois de configurar Supabase exclusivo + executar SQL |
|---|---|---|
| Interface e identidade | Sim | Sim |
| Login/cadastro por e-mail | Não | Fluxo implementado, depende de Auth configurado |
| Recuperação de senha | Não | Fluxo implementado, depende de e-mail/redirects |
| Perfil do estudante | Local | Persistência no Supabase |
| Planejamento semanal | Local | Tarefas no banco, por conta |
| Catálogo | Exemplos | Cursos cadastrados pelo professor |
| Cadastro de cursos/aulas | Local, demonstrativo | Escrita permitida só a professor autorizado |
| Atividades e redações | Local | Envio, prazos, correção e devolutiva no banco |
| Autorização de aluno/professor | Botão fictício | Políticas RLS no banco |
| Planos Básico, Plus, Prime | Exemplos | Catálogo sem cobrança |
| Pagamentos e repasses | Não | Ainda não |
| Aulas pagas em vídeo privado | Não | Ainda não |
| Upload de PDF/Word compartilhado | Apenas local na demo | Ainda não |
| App na App Store e Google Play | Não | Ainda não (PWA web) |

**Atenção:** o modo online foi desenvolvido, mas NÃO foi ligado a um Supabase real nem testado ponta a ponta, pois não foi criado um projeto exclusivo. Testes que foram executados: sintaxe de JavaScript e testes de navegação do modo de demonstração.

## Etapa 1 — publicar a demonstração pelo GitHub Pages (grátis)

1. Entre em https://github.com e crie um repositório **público** chamado `boniverso-app`, mantendo EstudNexa em seu repositório próprio.
2. Extraia este ZIP no computador; envie para o novo repositório os arquivos e pastas da raiz do projeto (`index.html`, `app.js`, `online-app.js`, `bootstrap.js`, `config.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `assets`, etc.). No GitHub web, escolha **Add file > Upload files**.
3. Abra **Settings > Pages** no repositório, selecione **Deploy from a branch**, branch `main`, pasta `/ (root)` e **Save**.
4. O GitHub exibirá a URL pública em Pages. Enquanto `config.js` estiver vazio, o site abre a demonstração.
5. Os usuários de iPhone/iPad poderão abrir no Safari e escolher **Compartilhar > Adicionar à Tela de Início**. No Chrome Android, procure **Instalar aplicativo**.

Repositório público é adequado somente ao **código público e conteúdo de demonstração**; jamais envie credenciais secretas, arquivos de alunos, vídeos pagos ou planilhas com informações pessoais.

## Etapa 2 — criar Supabase próprio do BoniVerso (plano gratuito)

1. Abra https://supabase.com/dashboard e crie **New Project** com nome `BoniVerso-RSB`, dentro da organização que você e o Prof. Rafael escolherem.
2. Mantenha **EstudNexa** e demais projetos sem alterações. Use uma região apropriada à sua operação. Anote a URL do projeto e a chave **publishable**.
3. Acesse o **SQL Editor** do projeto NOVO e execute **uma única vez** o arquivo `database/02_boniverso_online_INICIAL.sql`. Trata-se de uma migração de projeto novo e precisa de conferência de execução, além dos avisos do Supabase Security Advisor.
4. Em **Authentication > Providers**, confira se Email está habilitado e exige confirmação de e-mail. Em **Authentication > URL Configuration**, adicione a URL do GitHub Pages como **Site URL** e redirecionamento permitido (incluindo a rota da aplicação).
5. Configure envio de e-mail para produção. O serviço padrão do Supabase é de testes, com limites baixos.
6. Em `config.js` substitua somente o conteúdo das aspas de `supabaseUrl` e `supabasePublishableKey` pelos dados do projeto NOVO. Não use `secret`, `service_role`, nem senha de banco. Faça commit da mudança no GitHub.
7. Abra o site, crie uma conta com o e-mail de teste e confirme o e-mail. A conta inicial tem permissão de ALUNO.
8. Quando o Prof. Rafael tiver criado e confirmado a conta dele, um administrador do banco deve executar no SQL Editor, depois de verificar qual e-mail pertence ao professor:

```sql
insert into private.staff_members (user_id, role)
select id, 'admin'
from auth.users
where email = 'E-MAIL-VERIFICADO-DO-RAFAEL'
on conflict (user_id) do update set role=excluded.role;
```

Se a conta não existir, o comando não muda nada; se o e-mail não pertencer ao professor, NÃO conceda privilégio. O aluno nunca pode se tornar professor clicando no aplicativo. Após a concessão, entre novamente no app.

## Etapa 3 — verificar antes de convidar alunos

- Crie 2 contas distintas: professor e aluno; confirme que aluno não enxerga o editor.
- Faça o professor criar e publicar um **curso gratuito**, uma aula pública, uma atividade e publique-a.
- Confirme que apenas o aluno logado vê o próprio planejamento e as próprias redações.
- Faça uma redação de teste e corrija com a conta do professor.
- Tente abrir curso privado sem liberação: o aluno não pode visualizar aulas pela API.
- Rode o **Security Advisor** do Supabase e revise controles RLS.
- Configure termos de uso, política de privacidade/LGPD, suporte e procedimentos de exclusão de dados antes de lançamento público.

## Organização do código

- `index.html` — estrutura do layout BoniVerso.
- `styles.css` — responsividade e cores oficiais.
- `assets/*` — foto do Prof. Rafael e ícones aprovados.
- `config.js` — conexão PÚBLICA, inicialmente vazia.
- `bootstrap.js` — seleciona demonstração (sem backend) ou modo conectado.
- `app.js` — protótipo demonstrativo local.
- `online-app.js` — fluxos com autenticação e dados reais, após configurar o Supabase.
- `database/02_boniverso_online_INICIAL.sql` — banco e políticas RLS.
- `sw.js` e `manifest.webmanifest` — PWA instalável pelo navegador.
- `tests/smoke-test.cjs` — testes do modo demonstração.

## Fases seguintes

Hospedagem privada de material PDF/Word, streaming protegido, planos pagos, gateway com webhooks validados, mecanismos de liberação de compra, estatísticas avançadas, contrato de assinatura, exclusão de conta e empacotamento para lojas. **NÃO ativar cobrança em ambiente de demonstração.**

Projeto para fins de desenvolvimento. O retrato do Prof. Rafael deve ser utilizado apenas com autorização para divulgação pública. Os valores dos planos são hipóteses comerciais.
