(function(){
  const BADGE_ID = 'bv-messages-badge';
  const STYLE_ID = 'bv-messages-badge-style';
  let client = null;
  let currentUserId = null;
  let pollHandle = null;

  function injectStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .bv-msg-badge-wrap{position:relative;display:inline-flex;align-items:center}
      .bv-msg-badge{position:absolute;top:-8px;right:-10px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#d93025;color:#fff;font:700 11px/18px system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.18);display:none;z-index:2}
      .bv-msg-badge.show{display:inline-block}
      [data-bv-messages-link]{position:relative}
      [data-bv-messages-link].bv-has-badge::after{content:attr(data-bv-msg-count);position:absolute;top:-4px;right:-6px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#d93025;color:#fff;font:700 11px/18px system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.18)}
    `;
    document.head.appendChild(style);
  }

  function findMessageLinks(){
    const selectors = [
      '[data-bv-messages-link]',
      'a[href*="mensagens-turma-v3.html"]',
      'a[href*="mensagens-turma-v2.html"]',
      'a[href*="mensagens-turma-v1.html"]',
      '[data-online-view="mensagens"]',
      '[data-route="mensagens"]'
    ];
    const nodes = new Set();
    selectors.forEach(sel=>document.querySelectorAll(sel).forEach(el=>nodes.add(el)));
    Array.from(document.querySelectorAll('a,button')).forEach(el=>{
      const text = (el.textContent||'').trim().toLowerCase();
      if(text === 'mensagens' || text === 'mensagem') nodes.add(el);
    });
    return Array.from(nodes);
  }

  function paintBadge(count){
    const links = findMessageLinks();
    links.forEach(el=>{
      el.setAttribute('data-bv-messages-link','true');
      if(count > 0){
        el.classList.add('bv-has-badge');
        el.setAttribute('data-bv-msg-count', count > 99 ? '99+' : String(count));
        el.setAttribute('aria-label', `Mensagens (${count} não lida${count>1?'s':''})`);
      } else {
        el.classList.remove('bv-has-badge');
        el.removeAttribute('data-bv-msg-count');
        if((el.textContent||'').trim()) el.removeAttribute('aria-label');
      }
    });
  }

  async function unreadMessageCount(){
    if(!client || !currentUserId) return 0;
    const {data:notices,error:noticesError} = await client
      .from('boniverso_notices')
      .select('id,event_type,private_message_id')
      .eq('event_type','message_new')
      .not('private_message_id','is',null)
      .order('created_at',{ascending:false})
      .limit(100);
    if(noticesError) throw noticesError;
    const ids = (notices||[]).map(n=>n.id);
    if(!ids.length) return 0;
    const {data:reads,error:readsError} = await client
      .from('boniverso_notice_reads')
      .select('notice_id')
      .eq('user_id', currentUserId)
      .in('notice_id', ids);
    if(readsError) throw readsError;
    const readSet = new Set((reads||[]).map(r=>r.notice_id));
    return ids.filter(id=>!readSet.has(id)).length;
  }

  async function refreshBadge(){
    try{
      if(!client) return;
      const {data:{user}} = await client.auth.getUser();
      currentUserId = user?.id || null;
      if(!currentUserId){ paintBadge(0); return; }
      const count = await unreadMessageCount();
      paintBadge(count);
    }catch(err){
      console.warn('Badge de mensagens indisponível:', err?.message || err);
    }
  }

  async function boot(){
    injectStyle();
    const cfg = window.BONIVERSO_CONFIG || {};
    if(!cfg.supabaseUrl || !cfg.supabasePublishableKey){
      console.warn('BONIVERSO_CONFIG ausente para badge de mensagens.');
      return;
    }
    const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2.57.2');
    client = createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
    });
    await refreshBadge();
    client.auth.onAuthStateChange(async ()=>{ await refreshBadge(); });
    document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) refreshBadge(); });
    if(pollHandle) clearInterval(pollHandle);
    pollHandle = setInterval(refreshBadge, 45000);

    const observer = new MutationObserver(()=>paintBadge(document.querySelectorAll('[data-bv-messages-link].bv-has-badge').length ? parseInt(document.querySelector('[data-bv-messages-link].bv-has-badge')?.getAttribute('data-bv-msg-count') || '0',10)||0 : 0));
    observer.observe(document.body, {childList:true,subtree:true});
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
