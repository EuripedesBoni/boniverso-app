/* BoniVerso · Minhas Conversas — v3.0 (iPhone/mobile first)
   Arquivo novo/versionado para evitar a reutilização do JavaScript antigo em cache.
   Apenas metadados de conversas autorizadas via RLS; nunca carrega conteúdo das mensagens.
   Exclusivo da pagina mensagens-turma-v3.html.
*/
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const create=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el;};
 const fmt=t=>{if(!t)return '';const d=new Date(t);return Number.isNaN(d.getTime())?'':d.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});};
 const css=`
 #bv-student-inbox[hidden]{display:none!important}
 #bv-student-inbox,#bv-student-inbox *{box-sizing:border-box!important}
 #bv-student-inbox{display:block!important;margin:18px 0 22px!important;padding:20px!important;min-width:0!important;
  border:1px solid #dbe4f2!important;border-radius:19px!important;background:#fff!important;color:#203b60!important;
  font-family:system-ui,-apple-system,'Segoe UI',sans-serif!important;font-size:15px!important;line-height:1.5!important;
  box-shadow:0 5px 20px rgba(22,52,94,.04)!important;}
 #bv-student-inbox .bvsi-heading{display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:10px!important;margin-bottom:12px!important}
 #bv-student-inbox .bvsi-heading h2{margin:0!important;font-size:clamp(20px,4.4vw,25px)!important;font-weight:800!important;color:#173557!important;line-height:1.25!important}
 #bv-student-inbox .bvsi-refresh{min-height:42px!important;padding:9px 13px!important;border-radius:10px!important;border:1px solid #bfd1e8!important;background:#edf4ff!important;color:#275184!important;font-size:13px!important;font-weight:700!important;width:auto!important;box-shadow:none!important}
 #bv-student-inbox .bvsi-description{margin:0 0 18px!important;font-size:13px!important;color:#5f748f!important;line-height:1.55!important}
 #bv-student-inbox .bvsi-controls{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:12px!important;align-items:end!important;margin-bottom:16px!important}
 #bv-student-inbox .bvsi-search{display:block!important;min-width:0!important;font-size:13px!important;font-weight:750!important;color:#284665!important}
 #bv-student-inbox .bvsi-search input{display:block!important;width:100%!important;min-width:0!important;margin-top:5px!important;padding:10px 12px!important;min-height:44px!important;border:1px solid #c6d5e8!important;border-radius:11px!important;background:#fff!important;color:#173557!important;font:inherit!important;font-weight:450!important;text-align:left!important}
 #bv-student-inbox .bvsi-check{display:flex!important;align-items:center!important;gap:8px!important;min-height:44px!important;font-size:13px!important;font-weight:650!important;color:#314d6e!important;white-space:normal!important;cursor:pointer!important}
 #bv-student-inbox .bvsi-check input{appearance:auto!important;flex:none!important;width:18px!important;height:18px!important;margin:0!important;accent-color:#3567c3!important}
 #bv-student-inbox .bvsi-status{margin:4px 0 7px!important;min-height:18px!important;font-size:12px!important;color:#647b94!important}
 #bv-student-inbox .bvsi-status.error{color:#aa3435!important}
 #bv-student-inbox .bvsi-summary{margin:0 0 15px!important;font-size:13px!important;font-weight:750!important;color:#345677!important}
 #bv-student-inbox .bvsi-list{display:flex!important;flex-direction:column!important;gap:14px!important;margin:0!important;padding:0!important;min-width:0!important}
 #bv-student-inbox button.bvsi-card{appearance:none!important;-webkit-appearance:none!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:initial!important;gap:0!important;
  width:100%!important;min-width:0!important;height:auto!important;min-height:0!important;margin:0!important;padding:16px!important;
  background:#f9fbff!important;color:#203b60!important;text-align:left!important;
  border:1px solid #d9e5f4!important;border-left:4px solid #8badde!important;border-radius:15px!important;
  box-shadow:0 3px 12px rgba(15,45,85,.055)!important;font:inherit!important;white-space:normal!important;line-height:1.45!important;cursor:pointer!important;overflow:visible!important}
 #bv-student-inbox button.bvsi-card.bvsi-unread{background:#f0f6ff!important;border-left-color:#3167c8!important;border-color:#bad0ef!important}
 #bv-student-inbox button.bvsi-card.bvsi-selected{border-color:#5d88d5!important;border-left-color:#2358ba!important;box-shadow:0 0 0 2px rgba(54,105,205,.14)!important}
 #bv-student-inbox button.bvsi-card:focus-visible{outline:3px solid #7fa5e5!important;outline-offset:2px!important}
 #bv-student-inbox .bvsi-top{display:flex!important;gap:11px!important;align-items:flex-start!important;justify-content:space-between!important;margin:0 0 9px!important}
 #bv-student-inbox .bvsi-label{display:flex!important;align-items:flex-start!important;gap:9px!important;min-width:0!important;flex:1!important}
 #bv-student-inbox .bvsi-icon{display:flex!important;align-items:center!important;justify-content:center!important;width:33px!important;height:33px!important;flex:none!important;border-radius:10px!important;background:#e5efff!important;color:#315caa!important;font-size:19px!important;line-height:33px!important}
 #bv-student-inbox .bvsi-title{display:block!important;flex:1!important;min-width:0!important;color:#173658!important;font-size:15px!important;font-weight:800!important;line-height:1.4!important;overflow-wrap:anywhere!important;word-break:normal!important;white-space:normal!important;text-align:left!important}
 #bv-student-inbox .bvsi-pill{flex:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:23px!important;height:23px!important;padding:2px 7px!important;background:#315fbe!important;color:white!important;border-radius:999px!important;font-weight:800!important;font-size:11px!important}
 #bv-student-inbox .bvsi-meta{display:block!important;margin:0 0 12px 42px!important;color:#61758f!important;font-size:12px!important;font-weight:500!important;line-height:1.5!important;white-space:normal!important}
 #bv-student-inbox .bvsi-bottom{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;margin:0!important;padding:11px 0 0!important;border-top:1px solid #e2eaf5!important}
 #bv-student-inbox .bvsi-action{display:block!important;color:#2d5fb4!important;font-size:13px!important;font-weight:800!important;white-space:normal!important}
 #bv-student-inbox .bvsi-chevron{display:block!important;font-size:19px!important;color:#3867b6!important;line-height:1!important}
 #bv-student-inbox .bvsi-empty{padding:22px 14px!important;background:#f8fbff!important;border:1px dashed #cddbed!important;border-radius:12px!important;font-size:13px!important;color:#647992!important;text-align:center!important}
 #bv-student-inbox .bvsi-privacy{margin:16px 0 0!important;font-size:11px!important;color:#73879c!important;line-height:1.55!important}
 @media(max-width:700px){
  #bv-student-inbox{padding:16px!important;margin:16px 0!important}
  #bv-student-inbox .bvsi-controls{grid-template-columns:1fr!important;gap:10px!important}
  #bv-student-inbox .bvsi-check{width:100%!important;min-height:34px!important}
  #bv-student-inbox button.bvsi-card{padding:14px!important}
  #bv-student-inbox .bvsi-list{gap:13px!important}
  #bv-student-inbox .bvsi-title{font-size:14px!important}
  #bv-student-inbox .bvsi-meta{margin-left:42px!important}
 }
 @media(prefers-reduced-motion:reduce){#bv-student-inbox button.bvsi-card{transition:none!important}}
 `;
 let db=null,uid=null,threads=[],selectedId='',loading=false,started=false,lastFetch=0;
 function mount(){
   if($('bv-student-inbox'))return;
   const main=document.querySelector('main');if(!main)return;
   if(!$('bvsi-v3-styles')){const st=create('style');st.id='bvsi-v3-styles';st.textContent=css;document.head.append(st);}
   const panel=create('section');panel.id='bv-student-inbox';panel.hidden=true;panel.setAttribute('aria-labelledby','bvsi-title');
   const head=create('div','bvsi-heading');const title=create('h2',null,'✉ Minhas conversas');title.id='bvsi-title';head.append(title);
   const reload=create('button','bvsi-refresh','Atualizar');reload.type='button';head.append(reload);panel.append(head);
   panel.append(create('p','bvsi-description','Escolha uma turma para conversar com seu professor. As respostas recentes aparecem aqui, sem revelar o conteúdo privado.'));
   const toolbar=create('div','bvsi-controls');
   const label=create('label','bvsi-search','Buscar turma');const search=create('input');search.type='search';search.placeholder='Nome da turma';search.id='bvsi-search';search.autocomplete='off';label.append(search);
   const unreadLabel=create('label','bvsi-check');const cb=create('input');cb.type='checkbox';cb.id='bvsi-unread';unreadLabel.append(cb,create('span',null,'Somente respostas não lidas'));
   toolbar.append(label,unreadLabel);panel.append(toolbar);
   const status=create('p','bvsi-status','Carregando conversas…');status.id='bvsi-status';status.setAttribute('role','status');panel.append(status);
   const summary=create('p','bvsi-summary');summary.id='bvsi-summary';panel.append(summary);
   const list=create('div','bvsi-list');list.id='bvsi-list';panel.append(list);
   panel.append(create('p','bvsi-privacy','🔒 Apenas você e o professor responsável podem ver o conteúdo. Esta lista não mostra textos privados.'));
   const before=$('teacherInbox')||main.querySelector('section.panel');if(before)main.insertBefore(panel,before);else main.prepend(panel);
   reload.addEventListener('click',()=>refresh(true));search.addEventListener('input',render);cb.addEventListener('change',render);
 }
 function setStatus(s,err=false){const el=$('bvsi-status');if(el){el.textContent=s;el.className='bvsi-status'+(err?' error':'');}}
 function render(){const panel=$('bv-student-inbox');if(!panel||panel.hidden)return;
   const term=($('bvsi-search')?.value||'').trim().toLocaleLowerCase('pt-BR');const unreadOnly=!!$('bvsi-unread')?.checked;
   const filtered=threads.filter(x=>(!unreadOnly||x.unread>0)&&(!term||x.name.toLocaleLowerCase('pt-BR').includes(term)));
   $('bvsi-summary').textContent=`${threads.length} turma(s) · ${threads.reduce((n,x)=>n+x.unread,0)} resposta(s) não lida(s)`;
   const root=$('bvsi-list');root.replaceChildren();if(!filtered.length){root.append(create('div','bvsi-empty',threads.length?'Nenhuma turma corresponde ao filtro.':'Você ainda não possui turma ativa.'));return;}
   for(const t of filtered){const card=create('button','bvsi-card'+(t.unread?' bvsi-unread':'')+(t.id===selectedId?' bvsi-selected':''));card.type='button';
     card.setAttribute('aria-label','Abrir conversa da turma '+t.name+(t.unread?' — '+t.unread+' resposta(s) não lida(s)':''));
     const top=create('div','bvsi-top');const label=create('div','bvsi-label');label.append(create('span','bvsi-icon','📘'),create('strong','bvsi-title',t.name));top.append(label);
     if(t.unread)top.append(create('span','bvsi-pill',t.unread>99?'99+':String(t.unread)));card.append(top);
     const detail=t.last?(t.last.sender_kind==='staff'?'Última mensagem: professor':'Última mensagem: você')+' · '+fmt(t.last.created_at):'Nenhuma mensagem enviada nesta turma';
     card.append(create('div','bvsi-meta',detail));const bottom=create('div','bvsi-bottom');bottom.append(create('span','bvsi-action',t.last?'Abrir conversa':'Iniciar conversa'),create('span','bvsi-chevron','›'));card.append(bottom);
     card.addEventListener('click',()=>openConversation(t.id,card));root.append(card);
   }
 }
 async function openConversation(id,button){button.disabled=true;try{
   const select=$('classroom');if(!select||select.disabled||![...select.options].some(x=>x.value===id))throw Error('Turma não disponível. Atualize a página e tente novamente.');
   selectedId=id;select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));render();
   setTimeout(()=>{$('messages')?.scrollIntoView({behavior:'smooth',block:'center'});refresh(true);},550);
  }catch(e){setStatus(e?.message||'Falha ao abrir conversa.',true);}finally{button.disabled=false;}}
 async function fetchThreads(){
   const {data:members,error:me}=await db.from('classroom_memberships').select('classroom_id').eq('user_id',uid).eq('status','active').limit(100);if(me)throw me;
   const ids=[...new Set((members||[]).map(x=>x.classroom_id))];if(!ids.length)return [];
   const {data:classes,error:ce}=await db.from('classrooms').select('id,name').eq('is_active',true).in('id',ids).order('name');if(ce)throw ce;
   const items=(classes||[]).map(c=>({id:c.id,name:c.name,last:null,unread:0}));if(!items.length)return [];
   const byId=new Map(items.map(x=>[x.id,x]));
   const {data:msgs,error:msgErr}=await db.from('bv_student_teacher_messages').select('id,classroom_id,sender_kind,created_at').eq('student_id',uid).in('classroom_id',items.map(x=>x.id)).order('created_at',{ascending:false}).limit(500);if(msgErr)throw msgErr;
   const msgToClass=new Map();for(const m of msgs||[]){msgToClass.set(m.id,m.classroom_id);const item=byId.get(m.classroom_id);if(item&&!item.last)item.last=m;}
   const {data:notices,error:ne}=await db.from('boniverso_notices').select('id,private_message_id').eq('event_type','message_new').eq('recipient_user',uid).not('private_message_id','is',null).order('created_at',{ascending:false}).limit(200);if(ne)throw ne;
   const noticeIds=(notices||[]).map(x=>x.id);if(noticeIds.length){
     const {data:reads,error:re}=await db.from('boniverso_notice_reads').select('notice_id').eq('user_id',uid).in('notice_id',noticeIds);if(re)throw re;
     const seen=new Set((reads||[]).map(x=>x.notice_id));
     const missing=[...new Set((notices||[]).filter(n=>!seen.has(n.id)&&!msgToClass.has(n.private_message_id)).map(n=>n.private_message_id))].filter(Boolean);
     for(let k=0;k<missing.length;k+=100){const {data:more,error:e}=await db.from('bv_student_teacher_messages').select('id,classroom_id').in('id',missing.slice(k,k+100));if(e)throw e;for(const m of more||[])msgToClass.set(m.id,m.classroom_id);}
     for(const n of notices||[]){if(seen.has(n.id))continue;const item=byId.get(msgToClass.get(n.private_message_id));if(item)item.unread++;}
   }
   items.sort((a,b)=>(b.last?.created_at||'').localeCompare(a.last?.created_at||'')||a.name.localeCompare(b.name,'pt-BR'));return items;
 }
 async function refresh(force=false){if(!db||!uid||loading||document.hidden)return;if(!force&&Date.now()-lastFetch<20000)return;const original=uid;loading=true;setStatus('Atualizando conversas…');try{const data=await fetchThreads();if(original!==uid)return;threads=data;lastFetch=Date.now();render();setStatus('Conversas atualizadas.');}catch(e){setStatus('Não foi possível atualizar as conversas: '+(e?.message||e),true);}finally{loading=false;}}
 async function boot(){if(started)return;started=true;try{
   const cfg=window.BONIVERSO_CONFIG||{};if(!cfg.supabaseUrl||!cfg.supabasePublishableKey)return;
   const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.2');
   db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
   const {data:auth,error:ae}=await db.auth.getUser();if(ae||!auth?.user)return;uid=auth.user.id;
   const {data:role,error:re}=await db.rpc('current_staff_role');if(re)throw re;if(role==='teacher'||role==='admin')return;
   mount();$('bv-student-inbox').hidden=false;await refresh(true);
   document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh(true)});window.addEventListener('focus',()=>refresh());
   window.addEventListener('storage',event=>{if(event.key==='bv-private-messages-read')refresh(true)});
   setInterval(()=>{if(!document.hidden)refresh()},45000);
  }catch(err){console.warn('BoniVerso student inbox v3:',err?.message||err);}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
