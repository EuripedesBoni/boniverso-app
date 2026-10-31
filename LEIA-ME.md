# BoniVerso Live — Participantes e Frequência v1.2.3

## Instalação
1. Envie `painel-participantes.html` e `boniverso-presenca-menu.js` para a raiz do repositório `EuripedesBoni/boniverso-app` na branch `main`.
2. Edite `live-room.html` e acrescente, antes de `</body>`:

```html
<script defer src="./boniverso-presenca-menu.js"></script>
```

3. Salve e confirme em GitHub Actions que o deploy terminou com sucesso.
4. Abra a sala como professor. Clique em **Participantes e presença**.

## Ativar presença histórica com webhook
Os controles e a lista de presentes dependem apenas de LiveKit e Supabase e já podem funcionar sem o webhook. Para o registro automático de entrada e saída, no **LiveKit Cloud > Settings > Webhooks > Create new webhook**:

- Nome: `boniverso-presenca`.
- URL: `https://opzchnufngyegggkpdcn.supabase.co/functions/v1/boniverso-live-webhook`
- **Signing API Key**: selecione a mesma API Key configurada nos Secrets do Supabase para `LIVEKIT_API_KEY`.
- Salve e use **Send a test event**, sem enviar chaves aqui na conversa.

O receptor valida a assinatura e o conteúdo bruto de cada evento. Eventos de entrada e saída anteriores à configuração do webhook não são recuperados.

## Testes recomendados
- Abrir a sala com duas contas distintas; conferir nomes e quantidade conectada.
- Autorizar pedido de palavra, solicitar ao aluno atualizar a permissão.
- Testar silenciar e remover somente contas de demonstração.
- Entrar e sair de novo, conferir lista de frequência e exportar CSV.
- Comparar horários de entrada e saída, lembrando que o envio do webhook pode atrasar ou falhar.

## Cuidados
- Remover um participante não revoga a matrícula. Um estudante pode voltar à sala.
- Silenciar microfone é temporário se o aluno mantiver permissão de publicação.
- A contagem de presença é uma medida de conexão técnica, não prova atenção.
- Não compartilhar relatório CSV com terceiros sem autorização e política adequada de privacidade.
- Não instalar uma API Key ou Secret no GitHub. Nunca enviar credenciais por mensagem.
