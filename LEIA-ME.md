# BoniVerso — Painel de Aprendizagem v1.6.0

## Instalação no GitHub (sem alterar os arquivos anteriores)

1. Descompacte o ZIP.
2. No repositório `EuripedesBoni/boniverso-app` (branch `main`), envie os **dois arquivos** `painel-aprendizagem.html` e `painel-aprendizagem-link.js` para a **raiz** (não envie o ZIP).
3. Abra `index.html` no GitHub e clique no lápis.
4. Antes de `</body>`, acrescente **apenas** esta linha:

```html
<script defer src="./videoteca-curso-link.js"></script>
<script defer src="./painel-aprendizagem-link.js"></script>
</body>
</html>
```

O primeiro script já existe no projeto. **Acrescente somente o segundo**; não duplique o script antigo.

5. Clique em **Commit changes** e aguarde o GitHub Pages publicar.

Link geral: https://euripedesboni.github.io/boniverso-app/painel-aprendizagem.html

Curso específico: `painel-aprendizagem.html?curso=ID_DO_CURSO` (os botões do aplicativo cuidam do ID).

## O que está pronto no Supabase

- Função `boniverso-learning` implantada.
- Indicadores com base em progresso real de vídeos do Meet, lives, aulas do catálogo, leitura de PDFs e entregas de atividades/avaliações; resumos de todos os cursos no mesmo painel.
- PDFs privados no bucket `boniverso-learning-pdfs` (15 MB, somente PDF), via URL temporária.
- Atividades discursivas com respostas salvas e visualização pelo professor.
- Avaliações de 1 a 20 questões com quatro alternativas, correção no servidor e retorno de pontuação/comentários.
- Recursos salvos inicialmente como **rascunho**, que o professor deve **publicar**.
- Matriculados veem apenas conteúdos publicados; gabaritos não são enviados antes da submissão.

## Como testar

1. Como professor, abra um curso no painel e selecione um módulo (se ainda não existir, crie-o na Videoteca do Curso).
2. Cadastre um PDF pequeno e publique-o.
3. Cadastre uma atividade discursiva e uma avaliação com uma questão; publique.
4. Entre na conta do estudante matriculado, abra os recursos, marque PDF como lido, envie uma resposta e conclua a avaliação.
5. Reabra no computador e no iPad: indicadores e histórico devem se manter.

## Definições importantes

- **Aula concluída:** flag de conclusão registrada no histórico de vídeo ou aula cadastrada.
- **Aula iniciada:** vídeo com tempo assistido > 0 sem conclusão.
- **Aula pendente:** vídeo sem tempo assistido, ou aula do catálogo ainda não concluída.
- **Progresso do curso:** itens concluídos ÷ total de vídeos/aulas publicados e recursos publicados (PDF marcado como lido, atividade entregue e avaliação realizada).
- **Certificados:** apenas **planejados**; não são emitidos nesta versão. Definir critérios de aprovação, carga horária e controle de identidade antes de implementar.
- O percentual mostra **avanço em conteúdos**, não presença acadêmica, competência demonstrada ou aprovação automática.
- Botões de download ocultos nos vídeos não impedem cópias técnicas. PDFs abertos podem ser salvos pelo estudante conforme as capacidades do visualizador.

Nenhum código secreto ou chave privada deve ir para o GitHub.
