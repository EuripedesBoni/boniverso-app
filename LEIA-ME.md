# BoniVerso v1.5.0 — Videoteca integrada a cada curso

## Instalação no GitHub

1. Envie **curso-videos.html** e **videoteca-curso-link.js** para a raiz do repositório `EuripedesBoni/boniverso-app` (branch `main`).
2. Edite o arquivo `index.html`, que contém a página inicial, e ANTES de `</body>` acrescente exatamente:

   `<script defer src="./videoteca-curso-link.js"></script>`

3. Salve com Commit changes. Confirme que a ação de publicação GitHub Pages terminou com status success.
4. Abra a página inicial do BoniVerso, atualize e clique em **Cursos**. Cada curso permitido deverá ter o atalho **Videoteca do curso**, também disponível dentro dos detalhes do curso.
5. Use a conta do professor para testar criação e organização de módulos, e depois a conta do estudante para testar reprodução e "Continuar assistindo".

## O que mudou

- O novo endereço de um curso é `curso-videos.html?curso=ID_DO_CURSO` (o link é preenchido automaticamente pelos cartões).
- A página lista tanto gravações de LiveKit quanto gravações importadas do Meet do curso.
- O painel do professor permite criar, renomear, reordenar e excluir módulos sem apagar vídeos, e vincular vídeos a módulos.
- Cada aluno salva seu progresso de reprodução **na própria conta**, sincronizado entre dispositivos.
- URLs de reprodução são temporárias e exigem autorização validada pelo servidor. O player oculta o download, mas não pode impedir capturas de tela nem a cópia técnica de fluxos recebidos no navegador.
- Gerenciamento de exclusão, publicação e movimentação dos arquivos continua reservado aos painéis do professor (gravações de lives e vídeos Meet).

## Cuidados e testes

- **Não exclua** arquivos JavaScript antigos de transmissão e gravação.
- Teste com duas contas distintas: professor e aluno com matrícula ativa.
- Se uma aula for transferida para outro curso, reorganize-a no módulo correto no destino.
- O tempo salvo é aproximado; o indicador "concluído" se refere ao vídeo, **não** equivale a presença escolar comprovada.
- Uma URL de reprodução temporária pode ser usada até expirar, mesmo após alteração de permissão. Para bloqueio forte contra cópia seria necessário streaming com DRM e outra infraestrutura.
