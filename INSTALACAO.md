# BoniVerso Live — base v1.1.4 (pré-produção)

**Status:** pacote preparado, NÃO publicado nem testado em aula real.

1. Criar conta/projeto LiveKit Cloud. Obter URL `wss://...`, API key e API secret. **Nunca colocar API secret no GitHub**.
2. No Supabase BoniVerso-RSB, executar `boniverso-live.sql` no SQL Editor. Revisar permissões e testar com contas distintas.
3. Nas configurações de Edge Function Secrets adicionar `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.
4. Publicar a Edge Function `boniverso-live-token` de `supabase/functions/boniverso-live-token/index.ts`, com autenticação habilitada. Se a sua chave publishable não passar na verificação automática JWT no gateway, configurar verificação no corpo da função e validar individualmente o JWT via `auth.getUser()`; jamais dispensar esta validação.
5. Enviar `live.html` para a raiz de `EuripedesBoni/boniverso-app`.
6. Para conectar a sala existente: em Aparecida, marcar uma sessão como `live` e usar link `./live.html?sessao=<UUID-da-sessao>`. Recomenda-se acrescentar botão na tela de Aparecida após os testes.
7. Validar: professor, aluno matriculado e usuário não matriculado; envio/aprovação de pedidos; Safari iPad; Android; desktop; reconexão e revogação.

## Cuidados antes de produção
- O formulário existente de Aparecida foi criado para Meet/Zoom/Teams; o pacote NÃO altera automaticamente o formulário nem a navegação existente.
- **Autorização dinâmica:** a API LiveKit controla `canPublish` no servidor. O código do aluno busca novo token a cada atualização, porém o servidor LiveKit NÃO muda as permissões de uma conexão já estabelecida apenas pela emissão de token novo. Para liberação imediata sem reconectar, implementar chamada administrativa `RoomServiceClient.updateParticipant` em Edge Function separada. Até lá, o aluno deve sair e entrar novamente na sala após ser autorizado.
- A revogação também exige atualização de permissão do participante conectado. Este pacote é apenas base funcional para teste controlado, não produção com menores.
- Conferir isolamento de sala, LGPD, consentimento para gravação e permissões de acesso. **Gravação não implementada**; requer Egress, bucket privado e links assinados.
- Testar capacidade simultânea com 60 alunos e prever custo de minutos de conexão multiplicados por participantes.
