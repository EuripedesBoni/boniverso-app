# BoniVerso Live — roteiro de estabilidade para turmas de 31 a 60 estudantes

## Pré-requisitos
- Confirme que os webhooks de presença estão funcionando e que cada participante usa uma conta distinta, matriculada.
- Use uma aula de teste e voluntários; não publique gravações sem avisos e autorizações adequadas.
- No LiveKit Cloud verifique quotas de usuários, minutos e limites do seu plano. No Supabase verifique conexões Realtime e banco.
- Teste com a configuração típica: somente professor com câmera e microfone ativos, alunos apenas assistindo.
- Registre métricas reais do LiveKit Cloud e dos dispositivos. Uma contagem conectada não prova qualidade de vídeo ou áudio.

## Rodadas de carga
| Rodada | Participantes | Duração sugerida | Validação |
|---|---:|---:|---|
| Piloto | 5 | 10 min | Entrada, áudio, vídeo e chat |
| Intermediária | 15 | 15 min | Reconexão, moderação e registro de presença |
| Turma mínima | 31 | 20 min | Estabilidade, consumo, latência e acesso por matrícula |
| Turma-alvo | 60 | 20–30 min | Estabilidade, custo estimado, moderação e recuperação após falhas |

## Registrar em cada rodada
- Quantidade autorizada, quantidade conectada, sucesso e tempo de entrada.
- Falhas para iniciar câmera/microfone, qualidade percebida em iPad/Android/Windows.
- Interrupções de áudio ou vídeo, atraso médio do chat, mensagens duplicadas.
- Taxas de reconexão, atrasos de webhook, nomes e tempos no relatório CSV.
- Consumo de minutos e dados no painel do LiveKit Cloud e limites do Supabase.
- Falhas do Egress se a gravação estiver ativa; verificação do MP4 no R2.

## Critérios de avanço
Só passar para a rodada seguinte depois de resolver falhas de segurança, vazamento entre turmas, perda recorrente de áudio, problemas de matrícula e ausência de medição de presença. Evite rodar 60 abas no mesmo aparelho: isso não representa 60 dispositivos reais e distorce o resultado.

## Observações
Os webhooks são assinados e enviados com tentativas de repetição, porém não há garantia de entrega. A lista do painel consulta o LiveKit no momento; a frequência histórica depende dos eventos recebidos. Desconectar não equivale a revogar acesso: alunos matriculados podem retornar. Silenciar é temporário quando o aluno mantém a permissão de microfone.
