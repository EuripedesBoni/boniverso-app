# BoniVerso — Instituto RSB Educação

Primeira versão demonstrativa do aplicativo do Prof. Rafael Bonifácio, baseada na identidade aprovada.

## O que funciona agora

- Visual responsivo para celular, tablet e computador, usando a foto real do Prof. Rafael.
- Instalação como *web app* (PWA) quando hospedado em HTTPS compatível.
- Navegação entre início, cursos, plano de estudos, questões, redações, desempenho, planos e perfil.
- Conclusão de aulas, inscrição em cursos de demonstração e acompanhamento do progresso.
- Plano semanal: criar tarefas, marcar como feitas e acompanhar andamento.
- Quizzes corrigidos com gabarito comentado e histórico.
- Envio de redação em texto e correção com cinco competências e feedback pelo painel do professor simulado.
- Alternância entre visão do aluno e visão do professor para testar o protótipo.
- Painel do professor: criar cursos, registrar aulas/links de vídeos, cadastrar atividades e anexar PDFs/Word ao navegador.
- Três planos ilustrativos: Básico, Plus e Prime. Nenhuma cobrança é feita.

## Limitações importantes

**É uma demonstração funcional, não uma plataforma pronta para vender cursos.**

- Não existem cadastro/login reais, identidade verificada, controle de permissões por assinatura, autenticação nem sincronização entre dispositivos.
- Alterações são guardadas no armazenamento LOCAL deste navegador; materiais enviados ao painel são guardados no IndexedDB local. Não são enviados aos alunos ou a nenhum servidor.
- Os vídeos introdutórios são cadastros ilustrativos; o professor pode cadastrar links de HTTPS/YouTube/Vimeo na prévia, mas não existe proteção de acesso aos vídeos pagos.
- Não existem checkout, dados de cartão, Pix, cobrança recorrente ou repasses bancários.
- A área de professor é um modo de TESTE, sem controle de acesso real; não deve ser divulgada como serviço comercial.
- Não armazene redações reais de estudantes nem dados pessoais sensíveis nesta prévia.
- Uma versão em loja iOS/Android exigirá adaptação, testes, políticas de privacidade, contas das lojas e aprovação.

## Experimentar sem instalar nada

Abra **BoniVerso_DEMO.html** (arquivo separado na entrega) em um navegador moderno de computador. É uma versão de arquivo único, útil para explorar a interface. Alguns navegadores restringem acesso a arquivos locais.

## Publicar a demonstração gratuitamente na web

1. Extraia o ZIP `BoniVerso_Projeto_Web.zip`.
2. Acesse o painel da Cloudflare e abra **Workers & Pages**.
3. Crie um projeto de **Pages**, na opção de **Direct Upload**.
4. Envie a pasta do site **com `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `sw.js` e `assets/` na raiz** (ou o ZIP preparado somente com esses arquivos).
5. Clique em **Deploy**. A URL `*.pages.dev` permitirá testar a versão na internet via HTTPS.
6. No Chrome/Android, use a opção de instalar o aplicativo. No Safari/iOS, use Compartilhar > Adicionar à Tela de Início, quando a página permitir.

**Atenção:** a demonstração publicada continua usando apenas armazenamento LOCAL por usuário. Publicar o site não o transforma em sistema multiusuário. Não compartilhe esta prévia como se houvesse controle de acesso a cursos pagos.

Fonte do método de publicação: https://developers.cloudflare.com/pages/get-started/direct-upload/

## Arquivos

- `index.html`: estrutura geral do aplicativo.
- `styles.css`: identidade azul-marinho/dourado, layout responsivo.
- `app.js`: navegação e funções demonstrativas.
- `assets/`: ícones, foto e recorte profissional do Prof. Rafael.
- `manifest.webmanifest` e `sw.js`: estrutura de PWA e cache de recursos estáticos.
- `database/01_supabase_schema_PREPARACAO.sql`: rascunho **não executado** de banco de dados Supabase com RLS.

## Próxima versão de produção

1. Criar projeto Supabase exclusivamente para o BoniVerso e autenticação real com email e senha, validação de e-mail, recuperação de conta e permissões de editor.
2. Testar e aplicar uma migração de banco com perfis, cursos, aulas, materiais, redações, assinaturas e permissões RLS.
3. Migrar a gravação local para a API protegida do Supabase; disponibilizar materiais privativamente e vídeos com controle de acesso.
4. Implementar correções, avaliações e publicação do professor para alunos reais; testes de segurança, backup e LGPD.
5. Integrar pagamentos com provedor, webhook verificado, Pix/cartão quando aplicável, regras das lojas e liberação automática.
6. Publicar versão web de produção; implementar/empacotar aplicativos nativos, testar nas lojas e lançar.

## Custos desta etapa

Código do protótipo: **sem contratação de serviços pagos**. Hospedagem da demonstração pode usar faixa gratuita. Publicação nas lojas e operação de videoaulas/pagamentos terão custos adicionais.

© 2026 BoniVerso — uma plataforma RSB Educação. Protótipo demonstrativo.
