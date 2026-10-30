# BoniVerso — RSB Educação

**Primeira versão funcional demonstrativa (MVP local)** da plataforma do Prof. Rafael Bonifácio (Rafa Boni). Interface mobile e desktop com identidade visual azul-marinho, azul e dourado e foto fornecida do professor com retoque discreto.

## O que já funciona nesta demonstração

- Catálogo de cursos de redação, português, literatura e interpretação, com filtros e busca.
- Perfis de demonstração de **aluno** e **professor**, alternáveis no rodapé do menu lateral (sem controle de acesso real).
- Planos **Básico, Plus e Prime**, com seleção demonstrativa (sem cobranças reais ou autorização segura de conteúdo).
- Planejamento com cadastro de tarefas, prazos, conclusão e indicadores de desempenho.
- Banco de seis questões demonstrativas, com simulados, notas e gabarito comentado.
- Oficina de redação com envio de textos, atribuição de nota de 0 a 1000 e feedback no painel do professor.
- Painel do professor para cadastrar cursos e aulas: videoaulas por link HTTPS e upload demonstrativo de materiais PDF/Word de até 15 MB, guardados apenas neste navegador.
- Personalização de nome e e-mail exibidos localmente, além de instalação PWA em navegadores compatíveis após publicação HTTPS.

**Importante:** este é um **protótipo de demonstração**, e não a plataforma comercial pronta. As informações ficam neste navegador via `localStorage`; anexos são salvos no `IndexedDB` do dispositivo. Não existe sincronização entre aparelhos; o professor não recebe redações de alunos externos, mesmo quando a prévia é publicada. Não há login real com e-mail/senha, autorização segura de professor, cobrança de cartão/Pix ou armazenamento de vídeos em servidor. Não inserir informações sensíveis de alunos nesta demonstração. As aulas textuais iniciais são exemplos de navegação, não videoaulas gravadas pelo professor.

## Como visualizar sem pagar

### Opção A — HTML único

Abra `BoniVerso_DEMO.html`, disponibilizado separadamente, no navegador de um computador (não requer instalação). Em alguns dispositivos Apple, é melhor publicar o arquivo, pois o visualizador do app Arquivos pode não executar JavaScript.

### Opção B — projeto PWA (recomendado)

1. Extraia o arquivo ZIP: os arquivos `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest` e a pasta `assets` devem permanecer juntos.
2. Abra `https://app.netlify.com/drop` e envie a pasta do aplicativo ou o ZIP (verifique que `index.html` está na raiz do projeto enviado).
3. A hospedagem gera uma URL HTTPS. Abra-a no celular/tablet ou computador.
4. No Android, use **Instalar app / Adicionar à tela inicial** no Chrome. No iPhone/iPad, abra no Safari e use **Compartilhar → Adicionar à Tela de Início**. No computador, use a opção de instalação do navegador compatível.

**Atenção ao publicar:** o site de demonstração ficará visível para quem tiver a URL. Ainda não há autenticação real, então compartilhe somente com pessoas de confiança, sem dados reais nem conteúdos licenciados exclusivos. Se quiser testar privadamente, use um ambiente com proteção de acesso.

### Opção C — servidor local

Na pasta do projeto, com Python 3 instalado, rode:

```sh
python -m http.server 8000
```

Abra `http://localhost:8000` no navegador. A PWA exige HTTPS ou `localhost` para instalação e service worker.

## Como testar

- Comece no **Início** e clique em **Explorar cursos**.
- Em **Planos**, altere entre Básico, Plus e Prime: isso apenas simula acesso.
- Marque tarefas concluídas em **Plano de estudos**; as estatísticas serão atualizadas.
- Faça o quiz em **Atividades e questões**.
- Crie uma redação na **Oficina de redação**.
- Vá a **Meu perfil → Ver como professor**; abra **Corrigir redações** para registrar nota e devolutiva; volte a **Ver como aluno** para conferir.
- No painel do professor, cadastre um curso e uma aula. Arquivos PDF/Word de até 15 MB ficam armazenados *somente no navegador*.

## Próxima fase — plataforma real para alunos

1. Criar um projeto **Supabase separado** do ESTUDNEXA, com banco e autenticação. Evitar usar um projeto compartilhado sem separação de dados.
2. Definir funções aluno / professor / equipe por autorização **no servidor**, protegida por RLS (Row Level Security).
3. Criar tabelas `profiles`, `courses`, `lessons`, `course_access`, `study_tasks`, `assignments`, `submissions`, `grades`, `quiz_attempts`, `subscriptions` e `payment_events`.
4. Armazenar arquivos e vídeos por serviço protegido, respeitando capacidade, direitos autorais e controle de acesso.
5. Integrar pagamento seguro na web, com gateway compatível com Pix e cartão. Compras em apps nativos precisarão seguir as regras da App Store e Google Play aplicáveis.
6. Publicar política de privacidade, contratos, consentimentos e medidas LGPD, além de fluxos de recuperação de senha e exclusão de conta.
7. Validar recursos e segurança em ambiente de testes antes de aceitar alunos pagantes.
8. Preparar versões nativas iOS e Android e realizar testes/publicação nas lojas, conforme políticas atualizadas.

## Arquivos do projeto

- `index.html` — estrutura da interface
- `styles.css` — layout responsivo e cores da marca
- `app.js` — navegação, dados locais e interações
- `sw.js` — cache básico offline dos arquivos da interface
- `manifest.webmanifest` — nome, ícone e configurações PWA
- `assets/` — foto do Prof. Rafael e ícones derivados da identidade aprovada

### Uso de imagem

O retrato do professor foi disponibilizado pelo solicitante para esta montagem. O projeto deve ser publicado apenas com a autorização correspondente do titular dos direitos da imagem e dos arquivos utilizados.
