# BoniVerso — vídeos do Google Meet + lives v1.4.0

## Instalação

Na raiz do repositório GitHub `EuripedesBoni/boniverso-app`, envie:

- `importar-videos.html`
- `biblioteca-meet.js`

No fim de `biblioteca-live.html`, logo antes de `</body>` (e depois de `</script>` do bloco da biblioteca), acrescente:

```html
<script defer src="./biblioteca-meet.js"></script>
```

O professor acessa a Biblioteca, escolhe **⬆ Importar vídeos Meet**, baixa o MP4 no Google Drive e importa o arquivo local na turma ou curso. O arquivo só aparece aos estudantes após clicar em **Publicar**.

## Cloudflare R2: CORS obrigatório para upload no navegador

Bucket privado: `boniverso-live-videos`. No Cloudflare: R2 > buckets > boniverso-live-videos > Settings > CORS Policy, defina:

```json
[
  {
    "AllowedOrigins": ["https://euripedesboni.github.io"],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["Content-Type", "Range", "*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Accept-Ranges"],
    "MaxAgeSeconds": 3600
  }
]
```

Se já houver política CORS, preserve as origens/métodos necessários ao projeto e adicione PUT e ETag. Mantenha **Public Access desabilitado**. A API usa o token R2 existente somente no Supabase, sem exibir credenciais ao navegador.

## Sobre a biblioteca e restrição de download

- Gravações da live (LiveKit) continuam na biblioteca e no painel de gravações.
- Vídeos do Meet são armazenados em uma tabela distinta, no mesmo bucket privado, e aparecem na biblioteca por curso/turma.
- O acesso do aluno depende de matrícula ativa, publicação e uma URL assinada temporária.
- Só professores e administradores podem publicar, editar, mudar o destino ou excluir vídeos Meet. O painel de gravações anterior mantém as exclusões das lives.
- O botão de download é ocultado do player; entretanto URLs temporárias podem ser copiadas por usuários autorizados e nenhuma solução web impede totalmente captura de tela ou cópia. Para DRM real, é necessário serviço profissional de streaming com proteção de licenças.
- A exclusão dos vídeos importados remove o arquivo do R2, mas **não** remove o original do Google Drive.

## Primeiro teste

Faça o teste com um MP4 pequeno e descartável antes de importar aulas reais. Verifique: upload → prévia do professor → publicação → reprodução na conta matriculada → acesso negado em conta não matriculada → ocultação → exclusão.

A transferência é multipart em partes de 16 MiB, com limite inicial de 4 GiB por arquivo. Em redes móveis instáveis, um upload interrompido deverá ser reiniciado. Há custos de armazenamento e operações no R2 conforme consumo.

## Lembrete do Diário de Classe

O lembrete foi solicitado, mas ainda não há dia e horário informados. A programação será combinada separadamente, sem interferir no módulo de vídeos.
