/* BoniVerso · Caixa de Entrada do Estudante v1
 * Arquivo exclusivo para mensagens-turma-v3.html.
 * Cliente publicavel + permissoes RLS existentes; nenhum segredo no navegador.
 * A lista nunca carrega texto, apenas metadados autorizados das conversas.
 */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const htmlStyle=`
  #bv-student-inbox[hidden]{display:none!important}
  #bv-student-inbox{margin:18px 0;padding:21px;background:#fff;border:1px solid #d9e4f1;border-radius:18px;box-shadow:0 6px 18px #10274709;color:#1c3454}
  #bv-student-inbox *{box-sizing:border-box}
  .bv-si-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
  .bv-si-heading h2{margin:0;font-size:clamp(20px,3vw,25px);color:#173557}
  .bv-si-heading button{border:1px solid #bfcee4;border-radius:10px;background:#edf3ff;color:#24538c;padding:10px 14px;font:700 13px system-ui;min-height:43px}
  .bv-si-description{color:#61758f;font-size:13px;line-height:1.6;margin:9px 0 15px}
  .bv-si-toolbar{display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin-bottom:13px}
  .bv-si-search{flex:1 1 210px;display:block;font-size:13px;font-weight:750;color:#264462}
  .bv-si-search input{margin-top:5px;display:block;width:100%;padding:11px 13px;border:1px solid #bacce1;border-radius:11px;font:inherit;color:#193558;background:#fff;min-height:44px}
  .bv-si-check{display:flex;gap:8px;align-items:center;min-height:44px;cursor:pointer;font-size:13px;font-weight:700;color:#365579}
  .bv-si-check input{width:18px;height:18px;accent-color:#3865c3}
  .bv-si-counter{font-size:12px;color:#5d7390;margin:4px 0 13px}
  .bv-si-list{display:grid;gap:10px}
  button.bv-si-card{font:inherit;display:flex;gap:12px;align-items:center;width:100%;padding:14px 15px;min-height:83px;text-align:left;border:1px solid #d9e4f3;background:#f8faff;color:#1b385e;border-radius:14px;cursor:pointer;box-shadow:none}
  button.bv-si-card:hover,button.bv-si-card:focus-visible{background:#ecf4ff;border-color:#88b0eb;outline-offset:2px}
  button.bv-si-card.bv-si-unread{background:#eaf1ff;border-color:#8fafe4}
  .bv-si-icon{display:flex;align-items:center;justify-content:center;flex:none;width:41px;height:41px;border-radius:13px;background:#dce9ff;color:#315da8;font-size:22px}
  .bv-si-card-main{min-width:0;flex:1;display:block}
  .bv-si-card-title{display:block;font-size:14px;font-weight:850;overflow-wrap:anywhere;color:#1b3658}
  .bv-si-card-sub{display:block;color:#617891;font-size:12px;margin-top:4px}
  .bv-si-card-side{display:flex;align-items:end;gap:7px;flex-direction:column;flex:none}
  .bv-si-time{font-size:11px;color:#6b7e96;white-space:nowrap}
  .bv-si-pill{font-size:11px;font-weight:800;background:#2d61c0;color:white;border-radius:999px;min-width:22px;height:22px;padding:2px 7px;text-align:center}
  .bv-si-arrow{font-size:20px;color:#4771ae}
  .bv-si-empty{color:#6b7d94;text-align:center;padding:25px 12px;border:1px dashed #d4e0ee;border-radius:12px;font-size:13px}
  .bv-si-status{font-size:12px;color:#58728f;min-height:15px;margin:0 0 10px}
  .bv-si-status.error{color:#ae3b37}
  .bv-si-privacy{color:#6c7d95;font-size:11px;margin:12px 0 0}
  @media(max-width:640px){#bv-student-inbox{padding:16px}.bv-si-toolbar{align-items:stretch}.bv-si-search{flex-basis:100%}.bv-si-time{font-size:10px}button.bv-si-card{padding:11px}.bv-si-icon{width:36px;height:36px}}
  `;
  const fmt=t=>{try{return new Date(t).toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}catch{return ''}};
  const truncateCount=n=>n>99?'99+':String(n);
  const node=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
  let db=null,uid=null,cards=[],loading=false,lastLoad=0;
  function mount(){
    if($('bv-student-inbox'))return;
    const main=document.querySelector('main');if(!main)return;
    const panel=node('section');panel.id='bv-student-inbox';panel.hidden=true;
    panel.setAttribute('aria-labelledby','bv-si-title');
    const heading=node('div','bv-si-heading');
    heading.append(node('h2','', '📨 Minhas conversas'));
    heading.querySelector('h2').id='bv-si-title';
    const reload=node('button','','Atualizar');reload.type='button';reload.id='bv-si-reload';heading.append(reload);panel.append(heading);
    panel.append(node('p','bv-si-description','Escolha uma turma para conversar com seu professor. Aqui você encontra as respostas recebidas e os atendimentos mais recentes.'));
    const toolbar=node('div','bv-si-toolbar');
    const search=node('label','bv-si-search','Buscar turma');
    const input=node('input');input.type='search';input.id='bv-si-search';input.autocomplete='off';input.placeholder='Nome da turma';search.append(input);toolbar.append(search);
    const check=node('label','bv-si-check');const cb=node('input');cb.type='checkbox';cb.id='bv-si-unread';check.append(cb,node('span','','Somente respostas não lidas'));toolbar.append(check);panel.append(toolbar);
    const status=node('p','bv-si-status','Carregando suas turmas…');status.id='bv-si-status';status.setAttribute('role','status');panel.append(status);
    const summary=node('p','bv-si-counter');summary.id='bv-si-summary';panel.append(summary);
    const list=node('div','bv-si-list');list.id='bv-si-list';panel.append(list);
    panel.append(node('p','bv-si-privacy','🔒 Privado: somente você e o professor designado podem acessar a conversa. Nenhum texto de mensagem aparece nesta lista.'));
    const anchor=$('teacherInbox')||main.querySelector('section.panel');
    if(anchor)main.insertBefore(panel,anchor);else main.prepend(panel);
    reload.addEventListener('click',()=>refresh(true));
    input.addEventListener('input',render);
    cb.addEventListener('change',render);
  }
  function status(msg,error=false){const e=$('bv-si-status');if(e){e.textContent=msg;e.className='bv-si-status'+(error?' error':'')}}
  function render(){
    const panel=$('bv-student-inbox');if(!panel||panel.hidden)return;
    const query=($('bv-si-search')?.value||'').trim().toLocaleLowerCase('pt-BR');
    const onlyUnread=Boolean($('bv-si-unread')?.checked);
    const filtered=cards.filter(c=>(!onlyUnread||c.unread>0)&&(!query||c.name.toLocaleLowerCase('pt-BR').includes(query)));
    const sum=cards.reduce((n,c)=>n+c.unread,0);
    $('bv-si-summary').textContent=`${cards.length} turma(s) · ${sum} resposta(s) não lida(s)`;
    const root=$('bv-si-list');root.replaceChildren();
    if(!filtered.length){root.append(node('div','bv-si-empty',cards.length?'Nenhuma turma corresponde à pesquisa ou ao filtro.':'Você ainda não possui matrícula ativa em turmas.'));return}
    for(const c of filtered){
      const button=node('button','bv-si-card'+(c.unread?' bv-si-unread':''));button.type='button';button.dataset.classroomId=c.id;
      button.setAttribute('aria-label',`Abrir conversa da turma ${c.name}${c.unread?', '+c.unread+' respostas não lidas':''}`);
      button.append(node('span','bv-si-icon',c.unread?'✉':'📘'));
      const body=node('span','bv-si-card-main');
      body.append(node('strong','bv-si-card-title',c.name));
      const detail=!c.last?'Iniciar conversa com o professor':c.last.sender_kind==='staff'?'Última mensagem: professor':'Última mensagem: você';
      body.append(node('span','bv-si-card-sub',detail));button.append(body);
      const side=node('span','bv-si-card-side');if(c.last)side.append(node('time','bv-si-time',fmt(c.last.created_at)));
      side.append(node('span',c.unread?'bv-si-pill':'bv-si-arrow',c.unread?truncateCount(c.unread):'›'));button.append(side);
      button.addEventListener('click',()=>openClass(c.id,button));root.append(button);
    }
  }
  async function openClass(classroomId,button){
    button.disabled=true;
    try{
      const selector=$('classroom');
      if(!selector||selector.disabled||![...selector.options].some(o=>o.value===classroomId))throw Error('A seleção da turma ainda não está disponível. Atualize a página e tente novamente.');
      selector.value=classroomId;selector.dispatchEvent(new Event('change',{bubbles:true}));
      const history=$('messages');if(history)history.scrollIntoView({behavior:'smooth',block:'center'});
      // A página principal marca como lidos os avisos da conversa ao carregar.
      window.setTimeout(()=>refresh(true),1200);
    }catch(err){status(err?.message||'Não foi possível abrir a conversa.',true)}finally{button.disabled=false}
  }
  async function fetchData(){
    const {data:members,error:me}=await db.from('classroom_memberships').select('classroom_id').eq('user_id',uid).eq('status','active').limit(100);
    if(me)throw me;
    const ids=[...new Set((members||[]).map(m=>m.classroom_id))];
    if(!ids.length)return [];
    const {data:classes,error:ce}=await db.from('classrooms').select('id,name').eq('is_active',true).in('id',ids).order('name');if(ce)throw ce;
    const all=(classes||[]).map(c=>({id:c.id,name:c.name,last:null,unread:0}));const byId=new Map(all.map(c=>[c.id,c]));
    if(!all.length)return all;
    const {data:messages,error:mse}=await db.from('bv_student_teacher_messages')
      .select('id,classroom_id,sender_kind,created_at').eq('student_id',uid).in('classroom_id',all.map(c=>c.id))
      .order('created_at',{ascending:false}).limit(500);
    if(mse)throw mse;
    const messageClass=new Map();
    for(const m of messages||[]){if(!byId.has(m.classroom_id))continue;messageClass.set(m.id,m.classroom_id);const c=byId.get(m.classroom_id);if(!c.last)c.last=m;}
    const {data:notices,error:ne}=await db.from('boniverso_notices')
      .select('id,private_message_id').eq('event_type','message_new').eq('recipient_user',uid)
      .not('private_message_id','is',null).order('created_at',{ascending:false}).limit(200);
    if(ne)throw ne;
    const notificationIds=(notices||[]).map(n=>n.id);
    if(notificationIds.length){
      const {data:reads,error:re}=await db.from('boniverso_notice_reads')
        .select('notice_id').eq('user_id',uid).in('notice_id',notificationIds);
      if(re)throw re;
      const readIds=new Set((reads||[]).map(r=>r.notice_id));
      const missing=[...new Set((notices||[]).filter(n=>!readIds.has(n.id)&&!messageClass.has(n.private_message_id)).map(n=>n.private_message_id))].filter(Boolean);
      for(let k=0;k<missing.length;k+=100){const {data:extra,error:e}=await db.from('bv_student_teacher_messages').select('id,classroom_id').in('id',missing.slice(k,k+100));if(e)throw e;for(const m of extra||[])messageClass.set(m.id,m.classroom_id)}
      for(const n of notices||[]){if(readIds.has(n.id))continue;const id=messageClass.get(n.private_message_id);if(byId.has(id))byId.get(id).unread++}
    }
    all.sort((a,b)=>(b.last?.created_at||'').localeCompare(a.last?.created_at||'')||a.name.localeCompare(b.name,'pt-BR'));
    return all;
  }
  async function refresh(force=false){
    if(!db||!uid||loading||document.hidden)return;
    if(!force&&Date.now()-lastLoad<25000)return;
    const expected=uid;loading=true;status('Atualizando suas conversas…');
    try{
      const newCards=await fetchData();if(expected!==uid)return;
      cards=newCards;lastLoad=Date.now();render();status('Conversas atualizadas.');
    }catch(err){status('Não foi possível atualizar: '+String(err?.message||err),true)}
    finally{loading=false}
  }
  async function boot(){
    try{
      const cfg=window.BONIVERSO_CONFIG||{};
      if(!cfg.supabaseUrl||!cfg.supabasePublishableKey)return;
      const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.2');
      db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const {data:auth,error:ae}=await db.auth.getUser();if(ae||!auth.user)return;
      uid=auth.user.id;
      const {data:staff,error:se}=await db.rpc('current_staff_role');if(se)throw se;
      if(staff==='teacher'||staff==='admin')return;
      mount();const p=$('bv-student-inbox');if(!p)return;p.hidden=false;
      await refresh(true);
      window.addEventListener('focus',()=>refresh());
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
      window.addEventListener('storage',ev=>{if(ev.key==='bv-private-messages-read')refresh(true)});
      window.setInterval(()=>refresh(),45000);
    }catch(err){console.warn('Caixa de Entrada do Estudante:',err?.message||err)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
