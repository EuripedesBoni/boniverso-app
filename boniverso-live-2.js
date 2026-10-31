/* BoniVerso Live 2.0 v1.2.1 — layout e chat por aula.
   Arquivo público: NÃO colocar API keys privadas aqui.
   Preserva o LiveKit e os controles de gravação existentes. */
(async () => {
  'use strict';
  const cfg = window.BONIVERSO_CONFIG;
  const eventId = new URLSearchParams(location.search).get('sessao');
  const validId = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
  const videoRoot = document.getElementById('videos');
  const videoSection = videoRoot?.closest('section');
  const main = document.querySelector('main');
  if (!cfg?.supabaseUrl || !cfg?.supabasePublishableKey || !main || !videoRoot || !videoSection || !validId.test(eventId || '')) return;

  const style = document.createElement('style');
  style.textContent = `
    :root{color-scheme:dark}
    body{background:radial-gradient(circle at 65% -20%,#203d66 0%,#0b1527 46%,#091121 100%);color:#f2f6fd}
    body>header{padding:18px clamp(16px,3vw,42px);background:#0d1d35e8;border-bottom:1px solid #ffffff15;box-shadow:0 5px 25px #0002}
    main{max-width:1660px;padding:25px clamp(14px,3vw,45px) 70px}
    main>h1{font-size:clamp(24px,3.5vw,36px);letter-spacing:-.04em;margin:0 0 16px}
    main>.msg{background:#17284190;border:1px solid #4b678d;border-radius:16px;padding:15px 18px}
    main>.controls{padding:14px;border-radius:16px;border:1px solid #ffffff20;background:#101f36c9;box-shadow:0 12px 28px #0002;margin-top:14px}
    main button{border-radius:11px;transition:background .15s ease,transform .15s ease}
    main button:not(:disabled):hover{background:#416ca3}
    main button:focus-visible,.bv2-focus:focus-visible,.bv2-chat input:focus-visible,.bv2-chat textarea:focus-visible{outline:3px solid #f5cc83;outline-offset:2px}
    #micStatus{margin:12px 3px 7px;color:#cad6ea}
    .bv2-badge{display:inline-flex;align-items:center;gap:8px;border:1px solid #45638a;border-radius:999px;padding:5px 11px;background:#173353;color:#cfe0fa;font-size:12px;font-weight:700;letter-spacing:.03em}
    .bv2-badge-dot{height:8px;width:8px;border-radius:50%;background:#e9b55e;display:inline-block}
    .bv2-badge.bv2-connected .bv2-badge-dot{background:#40c99a}
    .bv2-topline{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:5px 0 16px}
    .bv2-broadcast-note{font-size:13px;color:#aebfd6;margin:0}
    .bv2-workspace{display:grid;grid-template-columns:minmax(0,2.25fr) minmax(305px,1fr);gap:18px;align-items:start;margin-top:14px}
    .bv2-media-section{min-width:0;margin:0!important;padding:16px;background:#101e34b8;border:1px solid #304566;border-radius:19px}
    .bv2-media-heading{display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap;margin-bottom:13px}
    .bv2-media-heading h2{font-size:18px;margin:0;letter-spacing:-.015em}
    .bv2-help{font-size:12px;color:#a8bad6}
    .bv2-videos{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:10px;margin:0;align-items:start}
    .bv2-videos .tile{min-width:0;min-height:0;border-color:#314e74;border-radius:13px;background:#0a1528;position:relative;cursor:pointer;transition:border-color .15s,box-shadow .15s}
    .bv2-videos .tile:hover{border-color:#75a6de}
    .bv2-videos .tile.bv2-featured{grid-column:1/-1;order:-1;border-color:#9db4da;box-shadow:0 12px 32px #0004}
    .bv2-videos .tile video{width:100%;max-height:190px;object-fit:contain;background:#050d1d;display:block}
    .bv2-videos .tile.bv2-featured video{height:min(55vh,630px);max-height:630px;min-height:210px;object-fit:contain}
    .bv2-videos .tile .person-label{font-size:12px;font-weight:600;color:#d6e5fb;margin:0;padding:9px 11px;background:#142945}
    .bv2-videos .tile.bv2-featured .person-label:before{content:'★ EM DESTAQUE · ';color:#efcb88}
    .bv2-videos .tile[hidden]{display:none!important}
    .bv2-chat{margin:0;min-height:380px;display:flex;flex-direction:column;border:1px solid #304566;border-radius:19px;overflow:hidden;background:#11233b;box-shadow:0 16px 32px #0002}
    .bv2-chat-head{padding:15px 17px;border-bottom:1px solid #355072;display:flex;gap:10px;justify-content:space-between;align-items:center;background:#1a3252}
    .bv2-chat-head strong{font-size:17px}
    .bv2-chat-head small{display:block;color:#b7cbe5;font-size:12px;margin-top:2px}
    .bv2-chat-log{height:min(48vh,470px);min-height:240px;overflow-y:auto;overscroll-behavior:contain;padding:13px 14px;display:flex;flex-direction:column;gap:10px}
    .bv2-chat-empty{text-align:center;color:#a8bbd7;padding:22px 13px;line-height:1.6;font-size:13px}
    .bv2-chat-message{padding:11px 12px;background:#1c3555;border-radius:13px;border:1px solid #325174;max-width:96%;overflow-wrap:anywhere}
    .bv2-chat-message.bv2-self{background:#244365;border-color:#52749d;align-self:flex-end}
    .bv2-chat-meta{font-size:11px;color:#b7cce7;display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap;margin-bottom:4px}
    .bv2-chat-message p{font-size:14px;white-space:pre-wrap;margin:0}
    .bv2-chat-message.bv2-hidden p{opacity:.75;font-style:italic}
    .bv2-chat-hide{font-size:11px!important;padding:3px 8px!important;min-height:24px!important;margin-top:6px;background:#6d3142!important;border-color:#ac6679!important}
    .bv2-chat-form{padding:13px;border-top:1px solid #355072;background:#172b47;display:grid;gap:8px}
    .bv2-chat-form textarea{width:100%;resize:vertical;min-height:66px;max-height:150px;padding:11px 12px;border:1px solid #537092;border-radius:11px;background:#0c1b32;color:#fff;font:14px/1.5 system-ui}
    .bv2-chat-form textarea::placeholder{color:#9dacc2}
    .bv2-chat-form button{background:#d4b479;color:#132644;font-weight:800;border-color:#d4b479}
    .bv2-chat-form button:not(:disabled):hover{background:#f0cc8d}
    .bv2-chat-foot{font-size:11px;color:#b9c9de;min-height:14px;line-height:1.4}
    .bv2-toggle-chat{font-size:12px!important;min-height:34px!important;padding:6px 11px!important}
    .bv2-workspace.bv2-hide-chat{grid-template-columns:minmax(0,1fr)}
    .bv2-workspace.bv2-hide-chat>.bv2-chat{display:none}
    #teacher{border:1px solid #385276;background:#12233a;padding:18px;border-radius:16px}
    #teacher h2{font-size:19px}
    .bv2-late-note{margin-top:12px;color:#b5c7df;font-size:12px}
    @media(max-width:1050px){.bv2-workspace{grid-template-columns:minmax(0,1fr)}.bv2-chat-log{height:310px;min-height:180px}.bv2-media-section{padding:12px}}
    @media(max-width:600px){main{padding:17px 11px 50px}.bv2-videos .tile.bv2-featured video{height:48vw;min-height:210px}main>.controls{padding:10px;gap:7px}.bv2-videos{grid-template-columns:repeat(auto-fit,minmax(min(100%,145px),1fr))}.bv2-chat-head{padding:12px}}
    @media(prefers-reduced-motion:reduce){main button,.bv2-videos .tile{transition:none}}
  `;
  document.head.append(style);

  const $ = id => document.getElementById(id);
  const el = (tag, text, className) => {
    const n = document.createElement(tag);
    if (text !== null && text !== undefined) n.textContent = String(text);
    if (className) n.className = className;
    return n;
  };
  const title = main.querySelector('h1');
  if (title) title.textContent = 'Sala de aula · BoniVerso Live';
  const top = el('div', null, 'bv2-topline');
  const badge = el('span', null, 'bv2-badge');
  const dot = el('span', null, 'bv2-badge-dot');
  const badgeText = el('span', 'Conectando à aula…');
  badge.append(dot, badgeText);
  const hint = el('p', 'Áudio, vídeo e compartilhamento com acesso por matrícula.', 'bv2-broadcast-note');
  top.append(badge, hint);
  if (title) title.after(top); else main.prepend(top);

  const msg = $('message');
  function statusBadge() {
    const t = msg?.textContent || '';
    const joined = /conectad[oa]|transmitindo|espectador/i.test(t) && !/encerrad|falha|erro/i.test(t);
    badge.classList.toggle('bv2-connected', joined);
    badgeText.textContent = joined ? 'CONECTADO AO VIVO' : 'AGUARDANDO CONEXÃO';
  }
  if (msg) new MutationObserver(statusBadge).observe(msg, {childList:true, characterData:true, subtree:true});
  statusBadge();

  const mediaHeading = videoSection.querySelector('h2');
  const head = el('div', null, 'bv2-media-heading');
  const mediaTitle = el('h2', 'Transmissão e participantes');
  const count = el('span', 'Nenhum vídeo ativo', 'bv2-help');
  const toggle = el('button', 'Ocultar chat', 'bv2-toggle-chat');
  toggle.type = 'button'; toggle.setAttribute('aria-expanded', 'true');
  head.append(mediaTitle, count, toggle);
  mediaHeading?.replaceWith(head);
  videoSection.classList.add('bv2-media-section');
  videoRoot.classList.add('bv2-videos');

  const workspace = el('div', null, 'bv2-workspace');
  videoSection.before(workspace);
  workspace.append(videoSection);

  const chat = el('aside', null, 'bv2-chat');
  chat.setAttribute('aria-label', 'Chat da aula');
  const chatHead = el('div', null, 'bv2-chat-head');
  const chatHeading = el('div');
  chatHeading.append(el('strong', '💬 Chat da aula'));
  const chatState = el('small', 'Verificando acesso...');
  chatHeading.append(chatState);
  chatHead.append(chatHeading);
  const chatLog = el('div', null, 'bv2-chat-log');
  chatLog.id = 'bv2-chat-log';
  chatLog.setAttribute('role','log');
  chatLog.setAttribute('aria-label','Mensagens da aula');
  chatLog.setAttribute('aria-live','polite');
  chatLog.append(el('p','O chat aparecerá aqui assim que a conexão for autorizada.','bv2-chat-empty'));
  const chatForm = el('form', null, 'bv2-chat-form');
  const input = el('textarea');
  input.maxLength = 1000;
  input.rows = 2;
  input.placeholder = 'Escreva uma pergunta para a turma…';
  input.setAttribute('aria-label','Sua mensagem para o chat');
  input.disabled = true;
  const send = el('button', 'Enviar mensagem');
  send.type = 'submit'; send.disabled = true;
  const chatFoot = el('span', 'Somente participantes autorizados podem conversar.', 'bv2-chat-foot');
  chatForm.append(input, send, chatFoot);
  chat.append(chatHead, chatLog, chatForm);
  workspace.append(chat);
  toggle.onclick = () => {
    const hide = !workspace.classList.contains('bv2-hide-chat');
    workspace.classList.toggle('bv2-hide-chat', hide);
    toggle.textContent = hide ? 'Mostrar chat' : 'Ocultar chat';
    toggle.setAttribute('aria-expanded', String(!hide));
  };

  let featuredId = null;
  function updateTiles() {
    const cards = [...videoRoot.querySelectorAll('.tile')].filter(c => !c.hidden && c.querySelector('video'));
    if (featuredId && !cards.some(c => c.id === featuredId)) featuredId = null;
    if (!featuredId && cards.length) featuredId = cards[0].id;
    for (const card of cards) {
      card.classList.toggle('bv2-featured', card.id === featuredId);
      if (!card.dataset.bv2Ready) {
        card.dataset.bv2Ready = 'yes';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', 'Colocar vídeo em destaque');
        const select = () => { featuredId = card.id; updateTiles(); };
        card.addEventListener('click', e => { if (!e.target.closest('button,video[controls]')) select(); });
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();select();} });
      }
      card.setAttribute('aria-pressed', String(card.id === featuredId));
    }
    count.textContent = cards.length ? `${cards.length} vídeo(s) ativo(s) · Toque para destacar` : 'Aguardando vídeo do professor';
  }
  const mo = new MutationObserver(() => queueMicrotask(updateTiles));
  mo.observe(videoRoot, {childList: true, subtree: true});
  updateTiles();

  const outdated = [...main.querySelectorAll('small')].find(n => n.textContent?.includes('Gravação e moderação em tempo real serão incluídas'));
  if (outdated) outdated.textContent = 'Use uma conta diferente por participante. Avisos de gravação e moderação estão disponíveis; não utilize gravações de alunos sem as autorizações necessárias.';

  let createClient;
  try {
    ({createClient} = await import('https://esm.sh/@supabase/supabase-js@2.57.2'));
  } catch (error) {
    chatState.textContent = 'Chat temporariamente indisponível';
    chatFoot.textContent = 'Não foi possível carregar a conexão do chat. Atualize a página.';
    return;
  }
  const db = createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, { auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:false } });
  let user = null, isStaff = false, lessonLive = false, lastSentAt = 0;
  let subscription = null, loadingMessages = false, reloadRequested = false, lastMessages = '';

  async function fetchMessages() {
    if (!user || loadingMessages || document.hidden) return;
    loadingMessages = true;
    try {
      const nearBottom = chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 90;
      const {data, error} = await db.from('boniverso_live_chat')
        .select('id,user_id,body,is_staff,created_at,hidden_at')
        .eq('event_id',eventId).order('created_at',{ascending:false}).limit(100);
      if (error) throw error;
      const sorted = (data || []).reverse();
      const signature = sorted.map(m => m.id + ':' + (m.hidden_at || '')).join('|');
      if (signature !== lastMessages) {
        lastMessages = signature;
        chatLog.replaceChildren();
        if (!sorted.length) chatLog.append(el('p', 'Seja a primeira pessoa a enviar uma mensagem nesta aula.', 'bv2-chat-empty'));
        for (const m of sorted) {
          const own = m.user_id === user.id;
          const card = el('article', null, 'bv2-chat-message' + (own?' bv2-self':'') + (m.hidden_at?' bv2-hidden':''));
          const meta = el('div', null, 'bv2-chat-meta');
          const author = m.is_staff ? 'Professor' : own ? 'Você' : 'Estudante ' + m.user_id.slice(0,6);
          const date = new Date(m.created_at);
          const time = Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
          meta.append(el('strong',author),el('span',time));
          card.append(meta,el('p',m.hidden_at?'Mensagem ocultada pelo professor.':m.body));
          if (isStaff && !m.hidden_at) {
            const hide = el('button','Ocultar mensagem','bv2-chat-hide');
            hide.type='button';
            hide.addEventListener('click',async() => {
              if (!window.confirm('Ocultar esta mensagem da turma?')) return;
              hide.disabled=true;
              try {
                const {error:e}=await db.from('boniverso_live_chat')
                  .update({hidden_at:new Date().toISOString()}).eq('id',m.id).eq('event_id',eventId);
                if (e) throw e;
                lastMessages=''; await fetchMessages();
              } catch(e) { chatFoot.textContent = 'Não foi possível ocultar: ' + e.message; }
              finally { hide.disabled=false; }
            });
            card.append(hide);
          }
          chatLog.append(card);
        }
        if (nearBottom) chatLog.scrollTop=chatLog.scrollHeight;
      }
      chatState.textContent = lessonLive ? 'Mensagens ao vivo · somente turma autorizada' : 'Aula não está ao vivo · histórico disponível';
    } catch(e) {
      chatState.textContent='Não foi possível carregar o chat';
      chatFoot.textContent='Erro ao consultar mensagens: ' + e.message;
    } finally {
      loadingMessages = false;
      if (reloadRequested) {reloadRequested=false;fetchMessages();}
    }
  }
  function askReload() {
    if (loadingMessages) {reloadRequested=true;return;}
    fetchMessages();
  }
  async function refreshStatus(){
    if(!user) return;
    const {data,error} = await db.from('boniverso_live_events').select('status').eq('id',eventId).maybeSingle();
    if (error || !data) { lessonLive=false;chatState.textContent='Aula indisponível'; }
    else lessonLive=data.status==='live';
    input.disabled=!lessonLive;
    send.disabled=!lessonLive;
    if(!lessonLive) chatFoot.textContent='O chat só recebe novas mensagens durante a aula ao vivo.';
  }
  chatForm.addEventListener('submit', async(e) => {
    e.preventDefault();
    if (!user || !lessonLive || send.disabled) return;
    const body = input.value.trim();
    if (!body) return;
    if (body.length>1000) {chatFoot.textContent='Limite de 1.000 caracteres.';return;}
    if (Date.now()-lastSentAt < 3000) {chatFoot.textContent='Aguarde 3 segundos entre mensagens.';return;}
    send.disabled=true; chatFoot.textContent='Enviando…';
    try {
      const {error} = await db.from('boniverso_live_chat').insert({event_id:eventId,user_id:user.id,body,is_staff:isStaff});
      if (error) throw error;
      lastSentAt=Date.now();input.value='';chatFoot.textContent='Enviado para os participantes da aula.';
      await fetchMessages();
    } catch(err){ chatFoot.textContent='Não foi possível enviar: ' + err.message; }
    finally {send.disabled=!lessonLive;}
  });

  try {
    const {data:{user:current},error:authError}=await db.auth.getUser();
    if (authError || !current) throw Error('Entre na sua conta do BoniVerso para usar o chat.');
    user=current;
    const [{data:access,error:accessError},{data:role,error:roleError}] = await Promise.all([
      db.rpc('boniverso_live_access',{p_event:eventId}),
      db.rpc('current_staff_role')
    ]);
    if (accessError || !access) throw Error('Acesso não autorizado à conversa desta aula.');
    if (roleError) throw roleError;
    isStaff=['teacher','admin'].includes(role);
    await refreshStatus();
    await fetchMessages();
    subscription=db.channel('bv2-chat-'+eventId)
      .on('postgres_changes',{event:'*',schema:'public',table:'boniverso_live_chat',filter:'event_id=eq.'+eventId},askReload)
      .subscribe((status)=>{
        if(status==='SUBSCRIBED')chatState.textContent='Chat ao vivo conectado';
        else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')chatState.textContent='Reconectando chat…';
      });
    setInterval(() => {
      if (document.hidden) return;
      fetchMessages();
    },15000);
    setInterval(() => {if(!document.hidden)refreshStatus();},30000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshStatus();askReload();}});
    window.addEventListener('pagehide',()=>{if(subscription)db.removeChannel(subscription);},{once:true});
  } catch(e) {
    chatState.textContent='Chat indisponível';
    chatFoot.textContent=e.message || 'Faça login para conversar.';
    chatLog.replaceChildren(el('p',chatFoot.textContent,'bv2-chat-empty'));
  }
})();
