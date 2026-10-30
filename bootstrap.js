// Dois modos: demonstração local sem servidor ou aplicação online autenticada.
const conf = window.BONIVERSO_CONFIG || {};
const ready = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(conf.supabaseUrl || '') &&
  /^(sb_publishable_|eyJ)/.test(conf.supabasePublishableKey || '');
if (!ready) {
  const tag = document.createElement('script');
  tag.src = './app.js';
  tag.defer = true;
  tag.onerror = () => { document.getElementById('view').textContent = 'Não foi possível abrir a demonstração.'; };
  document.body.appendChild(tag);
} else {
  try {
    // Versão EXATA da dependência. Não expor segredos no navegador.
    const lib = await import('https://esm.sh/@supabase/supabase-js@2.57.2');
    const sb = lib.createClient(conf.supabaseUrl.replace(/\/$/, ''), conf.supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    const online = await import('./online-app.js');
    await online.startBoniVerso(sb);
  } catch (err) {
    document.getElementById('view').innerHTML = '<div class="panel"><h2>Não foi possível iniciar a conexão segura</h2><p>Verifique a internet, a URL e a chave pública do projeto Supabase. Nenhum dado foi enviado.</p></div>';
    console.error('BoniVerso backend initialization:', err);
  }
}
