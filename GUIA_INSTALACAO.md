# BoniVerso Live 2.0 — Instalação v1.2.1

## O que já está pronto

- Banco do chat e regras de acesso por matrícula no Supabase.
- Sincronização em tempo real pelo Supabase Realtime, com atualização periódica de apoio.
- Arquivo de interface `boniverso-live-2.js`: vídeo em destaque, layout responsivo, mensagens e moderação.

## Instalar pelo GitHub (uma única linha no HTML)

1. Abra o repositório `EuripedesBoni/boniverso-app`, na branch `main`.
2. Envie **somente** `boniverso-live-2.js` para a raiz do repositório, não a pasta inteira.
3. Abra `live-room.html` no editor do GitHub.
4. Antes de `</body>`, e **fora** de qualquer outro `<script>`, adicione:

```html
<script defer src="./boniverso-live-2.js"></script>
```

5. O final do HTML deve ficar assim:

```html
</script>
<script defer src="live-room-media-fix.js"></script>
<script defer src="live-recording-controls.js"></script>
<script defer src="./boniverso-live-2.js"></script>
</body>
</html>
```

6. Salve em **Commit changes** e confira se GitHub Actions > Pages concluiu com êxito.
7. Atualize a sala no computador (Ctrl + Shift + R) e no Safari (recarregar a página).

**Não altere** `config.js`, LiveKit, Supabase Secrets, `live-room-media-fix.js` nem `live-recording-controls.js`.

## Teste com duas contas distintas

- Professor: entre na sala, ative microfone e câmera, envie uma mensagem no chat.
- Aluno matriculado: entre na mesma aula com outra conta e outro navegador/dispositivo.
- Confira que o aluno recebe a imagem e a voz, visualiza a mensagem do professor e consegue responder.
- Professor: use **Ocultar mensagem** e confira que ela deixa de aparecer para o aluno.
- Clique em outra miniatura de vídeo para colocá-la em destaque.
- Teste em computador e celular e confira o botão **Ocultar chat / Mostrar chat**.
- Entre com uma conta não matriculada: ela **não** deve acessar as mensagens nem enviar ao chat.
- Não inclua alunos menores de idade nem dados pessoais nos testes preliminares.

A melhoria visual não altera os privilégios do LiveKit nem as gravações. Para produção, será necessário revisar a retenção de mensagens, moderação e os termos de privacidade.
