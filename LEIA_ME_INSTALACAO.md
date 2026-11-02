# BoniVerso — Gestão de Vídeos v1

## Arquivos deste pacote

- `gestao-videos.html`: nova central administrativa unificada para vídeos importados do Google Meet e gravações das aulas ao vivo.
- `biblioteca-gestao-videos-link-v1.js`: transforma o link **Gerenciar gravações** da biblioteca em **Gerenciar todos os vídeos**, respeitando a exibição reservada aos docentes.

## Instalar no GitHub pelo iPad

1. Abra `https://github.com/EuripedesBoni/boniverso-app` e entre na branch `main`.
2. Envie os DOIS arquivos acima para a pasta principal do repositório, não para uma subpasta.
3. Abra **`biblioteca-live.html`**, clique no lápis (**Edit**), e encontre a linha próxima ao final:

```html
<script defer src="./biblioteca-meet.js"></script>
```

4. Imediatamente abaixo, acrescente esta linha, sem remover a anterior:

```html
<script defer src="./biblioteca-gestao-videos-link-v1.js?v=1"></script>
```

5. Salve em **Commit changes**. Aguarde a publicação do GitHub Actions terminar com sucesso.
6. Entre no BoniVerso como administrador com 2FA e abra `https://euripedesboni.github.io/boniverso-app/biblioteca-live.html`.
7. Toque em **⚙️ Gerenciar todos os vídeos**. O endereço direto também será:

`https://euripedesboni.github.io/boniverso-app/gestao-videos.html`

## Recursos

- Pesquisa por título e descrição, origem (Meet / Live), curso ou turma e situação.
- Indicadores: vídeos ativos, publicados, ocultos, na lixeira.
- Edição: título e destino (ambos); descrição nos vídeos importados.
- Prévia por link temporário, com matrícula e permissões validadas no servidor.
- Publicar/ocultar vídeo do aluno (sem apagá-lo).
- Transferir para outro curso/turma: o vídeo é ocultado até nova publicação.
- Enviar à lixeira / restaurar: disponível ao administrador; não apaga MP4.
- Exportar inventário CSV com metadados, sem informações de estudantes.
- Links às áreas existentes de importação e gerenciamento avançado de gravações.

## Segurança e limites

- Operações reais são autorizadas no backend do Supabase, não apenas por botões visuais.
- O painel não altera matrículas e não libera vídeo a outras turmas por padrão.
- `boniverso-course-videos` foi atualizado para aceitar `archive` e `restore`, com arquivos preservados. Por compatibilidade, a ação legada `delete` também passa a **arquivar**, não excluir permanentemente.
- O **formulário antigo** `importar-videos.html` ainda pode mostrar um aviso antigo sobre exclusão permanente. **Não utilize o botão de exclusão antigo:** administre a lixeira no painel novo. Atualizaremos a redação desse aviso em uma revisão futura.
- A central anterior `painel-gravacoes.html` continua disponível para operações avançadas com gravações ao vivo. A função de exclusão definitiva foi desabilitada no servidor para preservar os arquivos; use a lixeira restaurável. O painel antigo ainda poderá mostrar um botão legadamente, mas a operação será recusada.
- Não é possível impedir integralmente gravação ou captura de tela por usuários autorizados.
- Não execute SQL manualmente. As alterações do Supabase já foram aplicadas e validadas.

## Verificações de qualidade

- JavaScript validado com `node --check`; estrutura HTML conferida.
- Interface prevista para computador, iPad e celular; validação final deve acontecer no aparelho após a publicação.
- Arquivamento não remove o MP4 original do armazenamento.
- O acesso de professores e administradores é confirmado pela sessão e pela função de papel do Supabase.

## Teste recomendado

1. Confira as duas aulas de teste (*AULA teste* e *aula teste*).
2. Filtre pela origem e pelo curso de Aparecida.
3. Abra **Editar** em um vídeo, altere o título e salve; confira o novo título depois de Atualizar.
4. Confirme que **Ocultar** retira a publicação sem apagar o arquivo.
5. Não altere o destino ou envie à lixeira antes de checar com o Prof. Rafael o uso do vídeo no piloto.

**Não foram alterados os dois registros de vídeos de teste durante a instalação do backend.**
