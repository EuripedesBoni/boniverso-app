# BoniVerso — RSB Educação

Versão 0.3 da plataforma educacional do Prof. Rafa Boni.

**Comece por [`COMEÇAR_AQUI.md`](./COMEÇAR_AQUI.md)** para instalar a demonstração no GitHub Pages, criar um Supabase exclusivo, executar a migração RLS e ativar login/cadastro. Sem preencher `config.js`, a versão local de demonstração continua operando normalmente.

## Desenvolvimento local

Execute `python -m http.server 8000` na raiz e abra `http://localhost:8000`. Não abra diretamente `index.html` no app Arquivos do iPhone/iPad: módulos JS e PWA podem ser bloqueados pelo protocolo `file://`.

Teste a demonstração: `node tests/smoke-test.cjs`.

## Segurança

Não expor chave secreta no navegador. A interface não determina quem é professor nem quem pagou. As permissões reais residem nas políticas SQL/RLS. A migração foi preparada para **um novo projeto** e ainda não foi aplicada ou testada em uma instância Supabase.

© 2026 Instituto RSB Educação. Proposta em desenvolvimento.
