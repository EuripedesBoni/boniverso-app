# BoniVerso Live — plano de validação de 31 a 60 estudantes

Este documento define **testes ainda não realizados**. A existência de limites contratados acima de 60 participantes não comprova estabilidade em rede real.

## Etapas de ensaio

| Etapa | Participantes na sala | Duração-alvo | Principal verificação |
|---|---:|---:|---|
| A — Base | Professor + 2 alunos | 10 min | Áudio, vídeo, chat, moderação e permissões |
| B — Intermediária | Professor + 10 alunos | 15 min | Latência de mensagens, eco, reconexão e compartilhamento de tela |
| C — Turma-alvo inicial | Professor + 31 alunos | 20 min | CPU, recepção de vídeo, perda de pacotes e volume do chat |
| D — Turma-alvo máxima | Professor + 60 alunos | 30 min | Estabilidade, taxa de entrada, capacidade do servidor e custo |

Use pessoas/contas distintas. O LiveKit usa a identidade da conta como identidade na sala; duas sessões com o mesmo usuário podem desconectar-se.

## Critérios práticos de aceite (metas de projeto, não garantias)

- Todos os participantes autorizados entram e veem o vídeo do professor.
- Cada participante recebe áudio sem cortes frequentes, eco persistente ou necessidade recorrente de atualizar a página.
- Mensagens aparecem em outros dispositivos em poucos segundos e alunos sem matrícula não conseguem acessar o chat.
- Nenhuma sessão de aluno consegue iniciar gravações nem publicar material.
- O player da biblioteca continua funcional após encerramento da aula.
- Coletar quedas, reconexões e dificuldades por rede/dispositivo; não estimar sucesso apenas pela quantidade de telas abertas.

## Fontes de monitoramento

- **LiveKit Cloud Dashboard:** participantes simultâneos, minutos, consumo de banda, qualidade/latência e falhas.
- **Supabase Dashboard > Realtime:** conexões simultâneas, erros e mensagens consumidas.
- **Chrome `chrome://webrtc-internals`:** métricas de bitrate, packet loss, RTT e jitter durante a transmissão.
- **Windows / iPad:** consumo de bateria, CPU e qualidade da conexão Wi-Fi.
- **GitHub Pages:** falhas de carregamento de scripts e cache da versão.

## Limites de referência do fornecedor (conferir no momento do ensaio)

- LiveKit Cloud Build: documentação indica limite padrão de 100 participantes simultâneos por projeto. <https://docs.livekit.io/deploy/admin/quotas-and-limits/>
- Supabase Realtime Free: documentação indica até 200 conexões simultâneas, com limite de mensagens por segundo. <https://supabase.com/docs/guides/realtime/limits>

**Custo:** verifique previamente minutos de conexão, consumo de banda, transcodificação de gravação e uso do Realtime. Evite gerar dezenas de sessões de teste automaticamente na conta gratuita sem revisar a franquia.

## Tabela de resultados para preencher após cada ensaio

| Data | Etapa | Participantes reais | Entraram | Falhas | Vídeo/áudio OK | Chat OK | Quedas | Observações |
|---|---|---:|---:|---:|---|---|---:|---|
| — | A | — | — | — | — | — | — | — |
| — | B | — | — | — | — | — | — | — |
| — | C | — | — | — | — | — | — | — |
| — | D | — | — | — | — | — | — | — |
