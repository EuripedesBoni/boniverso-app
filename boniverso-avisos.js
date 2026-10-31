/* BoniVerso v1.0.3 — avisos persistentes e recibos de redação.
   Cliente público compartilhado com bootstrap.js; nunca usa chave secreta.
   Avisos in-app: checados a cada minuto enquanto a página estiver aberta. */
(() => {
  'use strict';
  const $ = (selector, root=document) => root.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validUuid = value => /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value || '');
  const when = iso => { try { return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Cuiaba'}).format(new Date(iso)); } catch { return '—'; } };
  let client, userId=null, staff=false, notices=[], readIds=new Set(), receipts=[], titles=new Map();
  let started=false, busy=false, firstLoad=true, lastNoticeIds=new Set(), lastPageTitle=null, receiptsLoading=false;

  const receiptHref = id => './recibo.html?entrega=' + encodeURIComponent(id);
  const announcementForm = () => staff ? `<form class="bv-announce" id="bv-announce-form"><h3>Enviar aviso geral aos estudantes</h3><p class="bv-note-sub">Para atualizações do BoniVerso e comunicados oficiais. Visível a todos os usuários autenticados.</p><label for="bv-notice-title">Assunto</label><input id="bv-notice-title" name="title" required maxlength="120" placeholder="Ex.: Novidade na plataforma"/><label for="bv-notice-message">Mensagem</label><textarea id="bv-notice-message" name="body" required maxlength="1500" rows="3" placeholder="Escreva o comunicado."></textarea><button class="bv-button" type="submit">Publicar aviso geral</button></form>` : '';
  function unreadCount(){return notices.filter(n=>!readIds.has(n.id)).length;}
  function makeRoot(){
    if($('#bv-notices-root'))return;
    const root=document.createElement('div');root.id='bv-notices-root';root.className='bv-overlay';root.hidden=true;
    root.innerHTML='<section class="bv-window" role="dialog" aria-modal="true" aria-labelledby="bv-notices-heading"><header class="bv-notice-head"><div><div class="bv-note-sub">BONIVERSO · RSB EDUCAÇÃO</div><h2 id="bv-notices-heading">Notificações</h2><div class="bv-note-sub">Novas propostas, comunicados e correções liberadas.</div></div><button type="button" class="bv-close" data-bv-close aria-label="Fechar notificações">✕</button></header><div class="bv-notice-body" id="bv-notices-list"></div></section>';
    document.body.appendChild(root);
  }
  function setBadge(){
    const badge=$('#bv-notices-badge');const navCount=$('#bv-notices-nav-count');const count=unreadCount();
    if(badge){const label=count>99?'99+':String(count);if(badge.textContent!==label)badge.textContent=label;badge.hidden=!count;}
    if(navCount){const label=count?String(count):'';if(navCount.textContent!==label)navCount.textContent=label;navCount.hidden=!count;}
  }
  function mountShell(){
    if(!userId)return;
    const bell=$('#notifications');if(bell){
      bell.title='Central de notificações';bell.setAttribute('aria-label','Abrir notificações');
      if(!$('#bv-notices-badge',bell)){const badge=document.createElement('span');badge.id='bv-notices-badge';badge.className='bv-badge';badge.hidden=true;bell.appendChild(badge);}
    }
    const nav=$('#sideNav');if(nav&&!$('#bv-notices-nav',nav)){
      const btn=document.createElement('button');btn.type='button';btn.className='nav-link bv-notice-nav';btn.id='bv-notices-nav';btn.setAttribute('data-bv-open-notices','');
      btn.innerHTML='<span aria-hidden="true" style="font-size:21px;width:19px;text-align:center">🔔</span><span>Notificações</span><small class="bv-count-small" id="bv-notices-nav-count" hidden></small>';
      const profile=nav.querySelector('[data-id="profile"]');if(profile)nav.insertBefore(btn,profile);else nav.appendChild(btn);
    }
    setBadge();
    const header=$('#view .page-top h1');
    if(header!==lastPageTitle){
      lastPageTitle=header;
      if(header&&header.textContent.includes('Oficina de redação')){
        renderReceiptPanel();loadReceipts();
      }
    }
    decorateSentModal();
  }
  function decorateSentModal(){
    const dialog=$('#dialog');if(!dialog?.open)return;
    const area=$('#dialogContents');if(!area||area.querySelector('[data-bv-receipt-modal]'))return;
    if(!/Enviada com sucesso|Corrigida/.test(area.textContent||''))return;
    const heading=area.querySelector('h2')?.textContent?.trim()||'';
    const target=receipts.find(r=>titles.get(r.assignment_id)===heading);
    if(!target)return;
    const link=document.createElement('a');link.href=receiptHref(target.id);link.target='_blank';link.rel='noopener noreferrer';
    link.className='bv-button secondary bv-receipt-link';link.setAttribute('data-bv-receipt-modal','');link.textContent='🧾 Ver comprovante de envio';
    area.querySelector('.dialog-inner')?.appendChild(link);
  }
  function renderReceiptPanel(){
    if(!userId)return;
    const view=$('#view');const title=$('#view .page-top h1');
    if(!view||!title?.textContent?.includes('Oficina de redação'))return;
    let panel=$('#bv-receipt-panel',view);
    if(!panel){panel=document.createElement('section');panel.id='bv-receipt-panel';panel.className='bv-receipts';view.appendChild(panel);}
    panel.innerHTML=`<h2>🧾 Meus comprovantes de envio</h2><p class="bv-note-sub">Um comprovante permanente para cada redação que você enviou. Use Imprimir / Salvar como PDF no recibo.</p>${receipts.length?receipts.map(s=>`<div class="bv-receipt-item"><div><strong>${esc(titles.get(s.assignment_id)||'Redação enviada')}</strong><div class="bv-note-sub">Enviada em ${esc(when(s.submitted_at))} · ${s.attachment_name?'PDF anexado':'Texto digitado'} · ${s.status==='graded'?'Corrigida':'Aguardando correção'}</div></div><a class="bv-button secondary" href="${receiptHref(s.id)}" target="_blank" rel="noopener noreferrer">Ver recibo</a></div>`).join(''):'<p class="bv-empty">Ainda não há entregas registradas nesta conta.</p>'}<div class="bv-row-actions"><button class="bv-button secondary" type="button" data-bv-refresh-receipts>Atualizar comprovantes</button></div>`;
  }
  async function loadReceipts(){
    if(!userId||receiptsLoading)return;receiptsLoading=true;const expectedUser=userId;
    try{
      const {data,error}=await client.from('submissions')
        .select('id,assignment_id,submitted_at,status,attachment_name').eq('user_id',expectedUser)
        .order('submitted_at',{ascending:false}).limit(100);
      if(error)throw error;
      if(expectedUser!==userId)return;
      receipts=data||[];
      const ids=[...new Set(receipts.map(x=>x.assignment_id).filter(validUuid))];
      if(ids.length){const {data:as}=await client.from('assignments').select('id,title').in('id',ids);titles=new Map((as||[]).map(x=>[x.id,x.title]));}
      renderReceiptPanel();decorateSentModal();
    }catch(err){console.warn('Comprovantes não disponíveis no momento:',err);}
    finally{receiptsLoading=false;}
  }
  function noticeItems(){
    if(!notices.length)return '<p class="bv-empty">Nenhuma notificação disponível para sua conta.</p>';
    return notices.map(n=>{
      const unread=!readIds.has(n.id);
      const goto=validUuid(n.assignment_id) ? `<button class="bv-button" data-bv-open-notice="${esc(n.id)}" type="button">Abrir redação</button>` : '';
      const mark=unread?`<button class="bv-button secondary" data-bv-read="${esc(n.id)}" type="button">Marcar como lida</button>`:'';
      return `<article class="bv-notice-item ${unread?'unread':''}"><div class="bv-dot" aria-hidden="true"></div><div><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p><time>${esc(when(n.created_at))}</time><div class="bv-row-actions">${goto}${mark}</div></div></article>`;
    }).join('');
  }
  function renderOverlay(){
    const list=$('#bv-notices-list');if(!list)return;
    if(list.querySelector('form:focus-within'))return;
    list.innerHTML=`${announcementForm()}<div class="bv-row-actions" style="margin-bottom:16px"><span class="bv-note-sub">${unreadCount()} aviso(s) não lido(s)</span><button class="bv-button secondary" type="button" data-bv-refresh>Atualizar avisos</button>${unreadCount()?'<button class="bv-button secondary" type="button" data-bv-read-all>Marcar todos como lidos</button>':''}</div>${noticeItems()}`;
  }
  async function loadNotices(showNewToast=false){
    if(!userId||busy)return;busy=true;const expectedUser=userId;
    try{
      const {data,error}=await client.from('boniverso_notices')
        .select('id,event_type,title,body,assignment_id,submission_id,created_at')
        .order('created_at',{ascending:false}).limit(100);
      if(error)throw error;
      if(expectedUser!==userId)return;
      const list=data||[];
      const ids=list.map(n=>n.id);
      let reads=[];
      if(ids.length){const result=await client.from('boniverso_notice_reads').select('notice_id')
        .eq('user_id',expectedUser).in('notice_id',ids);if(result.error)throw result.error;reads=result.data||[];}
      if(expectedUser!==userId)return;
      const incoming=list.filter(n=>!lastNoticeIds.has(n.id));
      if(showNewToast&&!firstLoad&&incoming.length&&$('#toasts')){
        const toast=document.createElement('div');toast.className='toast';toast.textContent=`Você tem ${incoming.length} novo(s) aviso(s) no BoniVerso.`;
        $('#toasts').appendChild(toast);setTimeout(()=>toast.remove(),5000);
      }
      firstLoad=false;lastNoticeIds=new Set(ids);notices=list;readIds=new Set(reads.map(r=>r.notice_id));
      mountShell();if(!$('#bv-notices-root')?.hidden)renderOverlay();
    }catch(err){console.warn('Notificações indisponíveis:',err);}
    finally{busy=false;}
  }
  async function markRead(id){
    if(!userId||!validUuid(id)||readIds.has(id))return;
    const {error}=await client.from('boniverso_notice_reads').upsert({notice_id:id,user_id:userId},{onConflict:'notice_id,user_id',ignoreDuplicates:true});
    if(error)throw error;readIds.add(id);setBadge();
  }
  function openPane(){if(!userId)return;makeRoot();$('#bv-notices-root').hidden=false;document.body.style.overflow='hidden';renderOverlay();loadNotices();}
  function closePane(){const root=$('#bv-notices-root');if(root)root.hidden=true;document.body.style.overflow='';}
  document.addEventListener('click',async event=>{
    const target=event.target.closest('#notifications,[data-bv-open-notices]');
    if(target&&userId){event.preventDefault();event.stopPropagation();openPane();return;}
    if(event.target.matches('#bv-notices-root')||event.target.closest('[data-bv-close]')){event.preventDefault();closePane();return;}
    if(!userId)return;
    const readBtn=event.target.closest('[data-bv-read]');
    if(readBtn){try{await markRead(readBtn.dataset.bvRead);renderOverlay();}catch(e){alert('Não foi possível marcar o aviso como lido.');}return;}
    const openBtn=event.target.closest('[data-bv-open-notice]');
    if(openBtn){const id=openBtn.dataset.bvOpenNotice;const n=notices.find(x=>x.id===id);if(!n)return;
      try{await markRead(n.id);}catch(e){console.warn('Aviso não marcado:',e);}
      closePane();location.href=n.assignment_id?`./?pagina=redacoes&atividade=${encodeURIComponent(n.assignment_id)}`:'./?pagina=redacoes';return;
    }
    if(event.target.closest('[data-bv-refresh]')){await loadNotices();renderOverlay();return;}
    if(event.target.closest('[data-bv-refresh-receipts]')){await loadReceipts();return;}
    if(event.target.closest('[data-bv-read-all]')){
      try{for(const n of notices.filter(n=>!readIds.has(n.id)))await markRead(n.id);renderOverlay();}
      catch(e){alert('Não foi possível concluir a marcação.');}return;
    }
  },true);
  document.addEventListener('submit',async event=>{
    const form=event.target;if(form.id!=='bv-announce-form')return;
    event.preventDefault();if(!staff||!userId)return;
    const submit=form.querySelector('button[type=submit]');submit.disabled=true;
    try{const title=form.elements.title.value.trim(),body=form.elements.body.value.trim();
      if(title.length<4||body.length<5)throw new Error('Preencha assunto e mensagem.');
      const {error}=await client.from('boniverso_notices').insert({event_type:'announcement',audience:'global',title,body});
      if(error)throw error;
      await loadNotices();renderOverlay();
    }catch(err){alert(err.message||'Não foi possível publicar o comunicado.');}
    finally{submit.disabled=false;}
  },true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closePane();});
  function clearAuth(){userId=null;notices=[];readIds=new Set();receipts=[];titles=new Map();firstLoad=true;lastNoticeIds=new Set();lastPageTitle=null;closePane();$('#bv-notices-nav')?.remove();$('#bv-notices-badge')?.remove();}
  async function setUser(user){
    if(!user?.id){clearAuth();return;}
    if(userId===user.id)return;
    userId=user.id;firstLoad=true;lastNoticeIds=new Set();
    try{const {data}=await client.rpc('current_staff_role');staff=Boolean(data);}catch{staff=false;}
    mountShell();await Promise.all([loadNotices(),loadReceipts()]);
  }
  async function init(){
    if(started||!window.BONIVERSO_DB)return;
    started=true;client=window.BONIVERSO_DB;
    makeRoot();
    const {data:{subscription}}=client.auth.onAuthStateChange((_,session)=>{setTimeout(()=>setUser(session?.user),0);});
    const {data}=await client.auth.getUser();await setUser(data?.user);
    const app=$('#app');if(app){const observer=new MutationObserver(()=>mountShell());observer.observe(app,{subtree:true,childList:true});}
    const dialogContents=$('#dialogContents');if(dialogContents){const modalObserver=new MutationObserver(()=>decorateSentModal());modalObserver.observe(dialogContents,{childList:true,subtree:true});}
    setInterval(()=>{if(userId&&!document.hidden)loadNotices(true);},60000);
    document.addEventListener('visibilitychange',()=>{if(userId&&!document.hidden){loadNotices(true);loadReceipts();}});
    window.addEventListener('beforeunload',()=>subscription?.unsubscribe());
  }
  window.addEventListener('boniverso-db-ready',init);
  if(window.BONIVERSO_DB)init();
})();
