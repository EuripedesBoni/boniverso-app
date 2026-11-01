/* BoniVerso — Mensagens privadas: badge + prévia segura (v2).
   Reaproveita o cliente Supabase autenticado do aplicativo.
   Mostra metadados de avisos autorizados por RLS; nunca carrega o texto da conversa. */
(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const cssId='bv-messages-badge-css-v2';
  let db=null,userId=null,unread=[],poll=null,reading=false,queued=false,popup=null,anchor=null;
  const target='./mensagens-turma-v3.html';
  const validUuid=x=>/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(x||'');
  const text=(tag,content,cls)=>{const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=content;return el;};
  function style(){
    if(document.getElementById(cssId))return;
    const el=document.createElement('style');el.id=cssId;
    el.textContent=`
    .bv-messages-shortcut{position:relative!important}
    .bv-msg-unread-badge{position:absolute;top:-5px;right:-5px;min-width:19px;height:19px;box-sizing:border-box;padding:0 5px;border-radius:12px;background:#de3654;color:#fff;border:2px solid #fff;box-shadow:0 2px 7px #0819314d;font:700 11px/15px system-ui,sans-serif;text-align:center;pointer-events:none;z-index:3}
    #sideNav .bv-msg-unread-badge{top:4px;right:8px}
    .bv-msg-unread-badge[hidden]{display:none!important}
    #bv-message-preview{position:fixed;z-index:100000;background:#fff;color:#183457;width:min(350px,calc(100vw - 24px));border-radius:17px;border:1px solid #dbe4f0;box-shadow:0 20px 55px #142c5050;overflow:hidden;font:14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;}
    #bv-message-preview[hidden]{display:none!important}
    .bv-msg-preview-head{background:linear-gradient(120deg,#132844,#294c82);color:#fff;padding:17px 18px 15px;display:flex;align-items:start;justify-content:space-between;gap:12px}
    .bv-msg-preview-head strong{display:block;font-weight:800;font-size:17px;letter-spacing:-.2px}
    .bv-msg-preview-sub{display:block;color:#dfebfd;font-size:12px;margin-top:3px}
    .bv-msg-preview-close{background:#ffffff1d;color:#fff;border:1px solid #ffffff50;border-radius:9px;width:32px;height:32px;cursor:pointer;font-size:18px}
    .bv-msg-preview-list{padding:8px 10px;max-height:305px;overflow:auto}
    .bv-msg-preview-item{padding:11px 9px;border-bottom:1px solid #e9eff6;display:flex;gap:10px;align-items:center;justify-content:space-between}
    .bv-msg-preview-item:last-child{border-bottom:0}
    .bv-msg-preview-title{font-size:13px;font-weight:750;color:#15355d}
    .bv-msg-preview-date{font-size:11px;color:#5e7897;display:block;margin-top:2px}
    .bv-msg-preview-open{white-space:nowrap;border:1px solid #c4d6f2;border-radius:9px;background:#edf4ff;color:#265491;padding:7px 9px;text-decoration:none;font-size:12px;font-weight:750}
    .bv-msg-preview-empty{padding:23px 17px;text-align:center;color:#556f8b}
    .bv-msg-preview-footer{padding:12px 16px 14px;background:#f7faff;border-top:1px solid #e1eaf5}
    .bv-msg-preview-all{display:block;text-align:center;padding:10px 12px;border-radius:10px;background:#2b5cb6;color:#fff;font-size:13px;font-weight:750;text-decoration:none}
    .bv-msg-preview-privacy{font-size:11px;color:#72839b;text-align:center;margin:9px 0 0}
    `;
    document.head.append(el);
  }
  function shortcuts(){return [...document.querySelectorAll('a[data-bv-messages-link],a[data-bv-messages-top]')];}
  function renderBadge(){
    const amount=unread.length;
    for(const a of shortcuts()){
      a.classList.add('bv-messages-shortcut');
      if(!a.dataset.bvBadgeOriginalAria)a.dataset.bvBadgeOriginalAria=a.getAttribute('aria-label')||'Abrir mensagens privadas';
      let badge=a.querySelector('.bv-msg-unread-badge');
      if(!badge){badge=text('span','','bv-msg-unread-badge');badge.setAttribute('aria-hidden','true');a.append(badge)}
      const label=amount>99?'99+':String(amount);
      if(badge.textContent!==label)badge.textContent=label;
      badge.hidden=!amount;
      const aria=amount?`Mensagens: ${amount} aviso${amount===1?'':'s'} não lido${amount===1?'':'s'}`:a.dataset.bvBadgeOriginalAria;
      if(a.getAttribute('aria-label')!==aria)a.setAttribute('aria-label',aria);
    }
  }
  function position(){
    if(!popup||popup.hidden||!anchor)return;
    const r=anchor.getBoundingClientRect();
    const width=popup.getBoundingClientRect().width;
    let left=Math.min(window.innerWidth-width-12,Math.max(12,r.right-width));
    let top=r.bottom+10;
    if(top+popup.getBoundingClientRect().height>window.innerHeight-12)top=Math.max(12,r.top-popup.getBoundingClientRect().height-10);
    popup.style.left=left+'px';popup.style.top=top+'px';
  }
  function close(){if(!popup)return;popup.hidden=true;if(anchor)anchor.setAttribute('aria-expanded','false');anchor=null;}
  function renderPreview(){
    if(!popup||popup.hidden)return;
    popup.replaceChildren();
    const head=document.createElement('div');head.className='bv-msg-preview-head';
    const wrap=document.createElement('div');wrap.append(text('strong','✉ Mensagens privadas'),text('span',unread.length?(unread.length===1?'1 aviso não lido':`${unread.length} avisos não lidos`):'Nenhuma mensagem pendente','bv-msg-preview-sub'));
    const closeBtn=text('button','×','bv-msg-preview-close');closeBtn.type='button';closeBtn.setAttribute('aria-label','Fechar prévia');closeBtn.addEventListener('click',close);head.append(wrap,closeBtn);popup.append(head);
    const list=document.createElement('div');list.className='bv-msg-preview-list';
    if(!unread.length){list.append(text('p','Você está em dia com suas mensagens.','bv-msg-preview-empty'));}
    else for(const n of unread.slice(0,4)){
      const item=document.createElement('div');item.className='bv-msg-preview-item';
      const details=document.createElement('div');details.append(text('div',n.title==='Resposta do professor'?'Resposta do professor':'Nova mensagem de estudante','bv-msg-preview-title'));
      let when='Mensagem privada';try{when=new Date(n.created_at).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch{}
      details.append(text('span',when,'bv-msg-preview-date'));
      const link=text('a','Abrir','bv-msg-preview-open');link.href=target+'?aviso='+encodeURIComponent(n.id);link.addEventListener('click',close);
      item.append(details,link);list.append(item);
    }
    popup.append(list);
    const foot=document.createElement('div');foot.className='bv-msg-preview-footer';
    const all=text('a','Abrir todas as mensagens','bv-msg-preview-all');all.href=target;foot.append(all,text('p','Sem exibir o conteúdo das conversas.','bv-msg-preview-privacy'));popup.append(foot);position();
  }
  function toggle(a){
    if(!userId){window.location.href=target;return}
    if(popup&&!popup.hidden&&anchor===a){close();return}
    if(!popup){popup=document.createElement('section');popup.id='bv-message-preview';popup.hidden=true;popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Prévia de mensagens privadas');document.body.append(popup)}
    if(anchor)anchor.setAttribute('aria-expanded','false');anchor=a;a.setAttribute('aria-expanded','true');a.setAttribute('aria-controls','bv-message-preview');popup.hidden=false;
    renderPreview();refresh();
  }
  async function refresh(){
    if(!db||!userId||reading)return;
    reading=true;const uid=userId;
    try{
      const {data:items,error:e}=await db.from('boniverso_notices')
        .select('id,title,event_type,private_message_id,created_at')
        .eq('event_type','message_new').not('private_message_id','is',null)
        .order('created_at',{ascending:false}).limit(150);
      if(e)throw e;if(uid!==userId)return;
      const ids=(items||[]).filter(n=>validUuid(n.id)&&validUuid(n.private_message_id)).map(n=>n.id);
      let read=[];
      if(ids.length){const q=await db.from('boniverso_notice_reads').select('notice_id').eq('user_id',uid).in('notice_id',ids);if(q.error)throw q.error;read=q.data||[]}
      if(uid!==userId)return;
      const done=new Set(read.map(n=>n.notice_id));unread=(items||[]).filter(n=>!done.has(n.id));renderBadge();renderPreview();
    }catch(e){console.warn('Mensagens: não foi possível atualizar o contador.',e?.message||e)}
    finally{reading=false}
  }
  function clearUser(){userId=null;unread=[];renderBadge();close()}
  function changeUser(u){const id=u?.id||null;if(id===userId)return;userId=id;if(!id){clearUser();return}unread=[];renderBadge();refresh()}
  function boot(){
    if(db||!window.BONIVERSO_DB)return;
    db=window.BONIVERSO_DB;style();
    db.auth.getUser().then(({data})=>changeUser(data?.user)).catch(()=>clearUser());
    db.auth.onAuthStateChange((_,session)=>setTimeout(()=>changeUser(session?.user),0));
    poll=setInterval(()=>{if(!document.hidden)refresh()},30000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
    window.addEventListener('focus',refresh);
    window.addEventListener('storage',ev=>{if(ev.key==='bv-private-messages-read')refresh()});
    document.addEventListener('click',ev=>{
      const link=ev.target.closest('a[data-bv-messages-link],a[data-bv-messages-top]');
      if(link){ev.preventDefault();ev.stopPropagation();toggle(link);return}
      if(popup&&!popup.hidden&&!ev.target.closest('#bv-message-preview'))close();
    },true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    window.addEventListener('resize',position);
    window.addEventListener('scroll',()=>{if(popup&&!popup.hidden)position()},true);
    const root=$('#app')||document.body;
    const obs=new MutationObserver(()=>{
      if(queued)return;queued=true;queueMicrotask(()=>{queued=false;renderBadge()})
    });
    obs.observe(root,{subtree:true,childList:true});
    renderBadge();
  }
  window.addEventListener('boniverso-db-ready',boot);
  if(window.BONIVERSO_DB)boot();
})();
