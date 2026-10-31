/* BoniVerso Live 2.0 — nomes de exibição no chat v1.2.2.
 * Usa apenas nomes registrados pelo servidor na conversa autorizada da aula.
 * Não contém chaves secretas e não modifica a transmissão LiveKit. */
(async () => {
  'use strict';
  const config = window.BONIVERSO_CONFIG;
  const eventId = new URLSearchParams(location.search).get('sessao');
  const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
  if (!config?.supabaseUrl || !config?.supabasePublishableKey || !uuid.test(eventId || '')) return;
  let db;
  try {
    const sdk = await import('https://esm.sh/@supabase/supabase-js@2.57.2');
    db = sdk.createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
  } catch (e) {
    console.warn('BoniVerso: biblioteca de nomes indisponível', e);
    return;
  }
  const {data: {user}} = await db.auth.getUser();
  if (!user) return;

  let busy = false, pending = false, lastSignature = '';
  async function updateNames() {
    const log = document.getElementById('bv2-chat-log');
    if (!log || document.hidden) return;
    const messages = [...log.querySelectorAll('.bv2-chat-message')];
    if (!messages.length) return;
    if (busy) { pending = true; return; }
    busy = true;
    try {
      // Mesma ordenação, limite e segurança por matrícula da interface do chat.
      const {data, error} = await db.from('boniverso_live_chat')
        .select('id,user_id,body,is_staff,created_at,hidden_at,sender_name')
        .eq('event_id', eventId)
        .order('created_at', {ascending: false}).limit(100);
      if (error) throw error;
      const rows = (data || []).reverse();
      if (rows.length !== messages.length) return; // evita rótulos deslocados em uma atualização simultânea
      const signature = rows.map(r => r.id + ':' + r.sender_name + ':' + (r.hidden_at || '')).join('|');
      if (signature === lastSignature && messages.every((c,i) => c.dataset.bvNameId === rows[i].id)) return;
      rows.forEach((record, i) => {
        const message = messages[i];
        const body = message.querySelector('p')?.textContent || '';
        const expected = record.hidden_at ? 'Mensagem ocultada pelo professor.' : record.body;
        if (body !== expected) return;
        const author = message.querySelector('.bv2-chat-meta strong');
        if (!author) return;
        const name = (record.sender_name || '').trim() || (record.is_staff ? 'Professor' : 'Estudante');
        author.textContent = name + (record.is_staff ? ' · Professor' : record.user_id === user.id ? ' · Você' : '');
        message.dataset.bvNameId = record.id;
      });
      lastSignature = signature;
    } catch(e) {
      console.warn('BoniVerso: falha ao atualizar nomes no chat', e?.message || e);
    } finally {
      busy = false;
      if (pending) { pending = false; queueMicrotask(updateNames); }
    }
  }

  // A sala original é inicializada assincronamente. Observe até aparecer o painel do chat.
  function attach() {
    const log = document.getElementById('bv2-chat-log');
    if (!log) return false;
    const observer = new MutationObserver(() => {updateNames();});
    observer.observe(log, {childList: true});
    updateNames();
    const timer = setInterval(updateNames, 20000);
    document.addEventListener('visibilitychange', () => {if (!document.hidden) updateNames();});
    window.addEventListener('pagehide', () => {observer.disconnect();clearInterval(timer);}, {once: true});
    return true;
  }
  if (!attach()) {
    const wait = new MutationObserver(() => {if (attach()) wait.disconnect();});
    wait.observe(document.body, {childList: true, subtree: true});
    window.addEventListener('pagehide', () => wait.disconnect(), {once: true});
  }
})();
