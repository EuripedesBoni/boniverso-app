/* BoniVerso · Caixa de Entrada do Estudante — layout responsivo v2.1
   Substitui o modulo v1 sem alterar a pagina, banco ou permissoes.
   Somente metadados permitidos pela RLS; nenhum texto privado na listagem. */
(()=>{
  'use strict';
  const $ = id => document.getElementById(id);
  const STYLE_ID = 'bv-student-inbox-styles-v2';
  const STALE_MS = 25000;
  const REFRESH_MS = 45000;
  const node = (tag,cls,content) => {
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(content!==undefined)el.textContent=String(content);
    return el;
  };
  const dateLabel = value => {
    if(!value)return '';
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return '';
    return d.toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
  };
  const countLabel = n => n>99?'99+':String(n);
  let db=null,uid=null,cards=[],loading=false,lastLoad=0,selectedClassId=null,booted=false;

  function installStyles(){
    if($(STYLE_ID))return;
    const style=node('style');style.id=STYLE_ID;
    style.textContent=`
    #bv-student-inbox[hidden]{display:none!important}
    #bv-student-inbox,
    #bv-student-inbox *{box-sizing:border-box}
    #bv-student-inbox{margin:20px 0;padding:22px;background:#fff;color:#193452;
      border:1px solid #dce6f2;border-radius:20px;box-shadow:0 8px 28px rgba(17,42,81,.055);
      font:15px/1.55 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-width:0}
    #bv-student-inbox .bv-si-heading{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
    #bv-student-inbox .bv-si-heading h2{margin:0;color:#193452;font-size:clamp(20px,3vw,25px);font-weight:800;line-height:1.3}
    #bv-student-inbox #bv-si-reload{border:1px solid #cbdcf3!important;border-radius:11px;
      background:#ebf2fe!important;color:#245397!important;padding:10px 16px;
      font:700 13px/1.3 system-ui,sans-serif;min-height:43px;cursor:pointer;box-shadow:none!important}
    #bv-student-inbox #bv-si-reload:focus-visible{outline:3px solid #6593df;outline-offset:2px}
    #bv-student-inbox .bv-si-description{color:#5d7088;font-size:14px;line-height:1.6;margin:11px 0 19px}
    #bv-student-inbox .bv-si-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto;
      align-items:end;column-gap:20px;row-gap:13px;margin:0 0 13px;min-width:0}
    #bv-student-inbox .bv-si-search{display:block;min-width:0;color:#294766;font-size:13px;font-weight:750}
    #bv-student-inbox #bv-si-search{display:block;width:100%;margin:6px 0 0;padding:11px 13px;
      min-height:44px;border:1px solid #bdcfe5!important;border-radius:11px;
      background:#fff!important;color:#1c3655!important;box-shadow:none!important;
      font:400 15px/1.4 system-ui,sans-serif;appearance:none}
    #bv-student-inbox #bv-si-search:focus-visible{outline:3px solid #9bb8ec;outline-offset:1px}
    #bv-student-inbox .bv-si-check{display:flex;gap:9px;align-items:center;min-height:44px;
      cursor:pointer;font-size:13px;font-weight:650;color:#36577b}
    #bv-student-inbox #bv-si-unread{flex:none;width:18px;height:18px;margin:0;accent-color:#3464b8}
    #bv-student-inbox .bv-si-status{font-size:12px;color:#667c96;margin:0 0 6px;min-height:18px}
    #bv-student-inbox .bv-si-status.error{color:#a93636}
    #bv-student-inbox .bv-si-counter{font-size:13px;font-weight:700;color:#355777;margin:0 0 15px}
    #bv-student-inbox #bv-si-list{display:flex!important;flex-direction:column!important;
      gap:14px!important;min-width:0}
    #bv-student-inbox button.bv-si-card{display:flex!important;flex-direction:column!important;align-items:stretch!important;
      justify-content:flex-start!important;gap:0!important;width:100%!important;min-width:0!important;
      margin:0!important;padding:17px 18px!important;min-height:0!important;
      border:1px solid #d9e5f3!important;border-left:4px solid #8bade2!important;
      border-radius:16px!important;background:#fff!important;color:#213b59!important;
      text-align:left!important;white-space:normal!important;box-shadow:0 3px 12px rgba(21,48,88,.055)!important;
      font:400 14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;
      cursor:pointer!important;appearance:none!important;overflow:visible!important;
      transition:background-color .15s,border-color .15s,box-shadow .15s}
    #bv-student-inbox button.bv-si-card:hover{background:#f5f9ff!important;border-color:#9cbae6!important;
      box-shadow:0 5px 18px rgba(21,48,88,.09)!important}
    #bv-student-inbox button.bv-si-card:focus-visible{outline:3px solid #5589dd!important;outline-offset:2px}
    #bv-student-inbox button.bv-si-card.bv-si-unread{border-left-color:#316bd2!important;background:#f5f9ff!important}
    #bv-student-inbox button.bv-si-card.bv-si-active{border-color:#5d89d7!important;
      border-left-color:#245eb7!important;box-shadow:0 0 0 2px #d2e2ff!important}
    #bv-student-inbox .bv-si-card-header{display:flex!important;align-items:flex-start!important;
      gap:12px!important;width:100%;min-width:0}
    #bv-student-inbox .bv-si-icon{display:flex;align-items:center;justify-content:center;flex:none;
      width:43px;height:43px;border-radius:12px;background:#e9f1fd;color:#315da6;font-size:20px}
    #bv-student-inbox .bv-si-card-main{display:block;flex:1;min-width:0}
    #bv-student-inbox .bv-si-card-title{display:block;color:#193756;font-size:15px;font-weight:800;
      line-height:1.4;overflow-wrap:anywhere;white-space:normal}
    #bv-student-inbox .bv-si-card-sub{display:block;color:#60758d;margin-top:6px;
      font-size:12.5px;font-weight:500;line-height:1.55;overflow-wrap:anywhere;white-space:normal}
    #bv-student-inbox .bv-si-pill{display:inline-flex;align-items:center;justify-content:center;
      flex:none;min-width:25px;height:25px;margin-left:auto;padding:1px 7px;
      border-radius:99px;background:#2d60c2;color:#fff;font-size:12px;font-weight:800}
    #bv-student-inbox .bv-si-card-footer{display:flex;justify-content:space-between;align-items:center;
      gap:12px;width:100%;border-top:1px solid #e7edf6;margin-top:14px;padding-top:12px}
    #bv-student-inbox .bv-si-card-action{display:flex;gap:7px;align-items:center;color:#2c5eaa;
      font-size:13px;font-weight:800;white-space:normal;overflow-wrap:anywhere}
    #bv-student-inbox .bv-si-card-action-arrow{font-size:20px;line-height:1;color:#2d61b8}
    #bv-student-inbox .bv-si-empty{padding:25px 14px;background:#f8fafd;color:#5f7289;
      border:1px dashed #d4e2ef;border-radius:14px;text-align:center;font-size:13px}
    #bv-student-inbox .bv-si-privacy{margin:18px 0 0;color:#728198;font-size:12px;line-height:1.55}
    @media(max-width:680px){
      #bv-student-inbox{padding:16px;margin:15px 0;border-radius:17px}
      #bv-student-inbox .bv-si-heading{align-items:flex-start}
      #bv-student-inbox .bv-si-toolbar{grid-template-columns:minmax(0,1fr);row-gap:11px}
      #bv-student-inbox .bv-si-check{align-items:center;min-height:31px;line-height:1.4}
      #bv-student-inbox button.bv-si-card{padding:14px!important;border-radius:14px!important}
      #bv-student-inbox .bv-si-card-header{gap:10px!important}
      #bv-student-inbox .bv-si-icon{width:38px;height:38px;font-size:19px}
      #bv-student-inbox .bv-si-card-title{font-size:14px}
      #bv-student-inbox #bv-si-list{gap:13px!important}
    }
    @media(prefers-reduced-motion:reduce){#bv-student-inbox button.bv-si-card{transition:none}}
    `;
    document.head.append(style);
  }

  function mount(){
    if($('bv-student-inbox'))return;
    installStyles();
    const main=document.querySelector('main');if(!main)return;
    const panel=node('section');panel.id='bv-student-inbox';panel.hidden=true;
    panel.setAttribute('aria-labelledby','bv-si-title');
    const heading=node('div','bv-si-heading');
    const title=node('h2','', '✉ Minhas conversas');title.id='bv-si-title';heading.append(title);
    const reload=node('button','','Atualizar');reload.type='button';reload.id='bv-si-reload';heading.append(reload);panel.append(heading);
    panel.append(node('p','bv-si-description','Escolha uma turma para conversar com seu professor. Veja os atendimentos recentes e as respostas recebidas.'));
    const toolbar=node('div','bv-si-toolbar');
    const search=node('label','bv-si-search','Buscar turma');
    const input=node('input');input.id='bv-si-search';input.type='search';input.autocomplete='off';input.placeholder='Nome da turma';
    search.append(input);toolbar.append(search);
    const check=node('label','bv-si-check');const cb=node('input');cb.type='checkbox';cb.id='bv-si-unread';
    check.append(cb,node('span','','Somente respostas não lidas'));toolbar.append(check);panel.append(toolbar);
    const status=node('p','bv-si-status','Carregando suas turmas…');status.id='bv-si-status';status.setAttribute('role','status');panel.append(status);
    const summary=node('p','bv-si-counter');summary.id='bv-si-summary';panel.append(summary);
    const list=node('div');list.id='bv-si-list';panel.append(list);
    panel.append(node('p','bv-si-privacy','🔒 Privado: somente você e o professor responsável têm acesso às mensagens. Não mostramos o conteúdo nesta lista.'));
    const anchor=$('teacherInbox')||main.querySelector('section.panel');
    if(anchor)main.insertBefore(panel,anchor);else main.prepend(panel);
    reload.addEventListener('click',()=>refresh(true));
    input.addEventListener('input',render);
    cb.addEventListener('change',render);
    $('classroom')?.addEventListener('change',()=>{selectedClassId=$('classroom').value;render()});
  }
  function setStatus(message,error=false){const el=$('bv-si-status');if(el){el.textContent=message;el.className='bv-si-status'+(error?' error':'')}}
  function render(){
    const panel=$('bv-student-inbox');if(!panel||panel.hidden)return;
    const q=($('bv-si-search')?.value||'').trim().toLocaleLowerCase('pt-BR');
    const unreadOnly=!!$('bv-si-unread')?.checked;
    const filtered=cards.filter(c=>(!unreadOnly||c.unread>0)&&(!q||c.name.toLocaleLowerCase('pt-BR').includes(q)));
    const total=cards.reduce((sum,c)=>sum+c.unread,0);
    $('bv-si-summary').textContent=`${cards.length} turma(s) · ${total} resposta(s) não lida(s)`;
    const root=$('bv-si-list');root.replaceChildren();
    if(!filtered.length){
      root.append(node('div','bv-si-empty',cards.length?'Nenhuma turma corresponde à pesquisa ou ao filtro.':'Você ainda não possui matrícula ativa em turmas.'));
      return;
    }
    for(const c of filtered){
      const selected=selectedClassId===c.id;
      const button=node('button','bv-si-card'+(c.unread?' bv-si-unread':'')+(selected?' bv-si-active':''));
      button.type='button';button.dataset.classroomId=c.id;
      button.setAttribute('aria-label',`${c.last?'Abrir':'Iniciar'} conversa da turma ${c.name}${c.unread?', '+c.unread+' resposta(s) não lida(s)':''}`);
      const head=node('span','bv-si-card-header');
      const ico=node('span','bv-si-icon',c.unread?'✉':'📘');ico.setAttribute('aria-hidden','true');head.append(ico);
      const main=node('span','bv-si-card-main');
      main.append(node('strong','bv-si-card-title',c.name));
      const detail=c.last ? (c.last.sender_kind==='staff'?'Última mensagem: professor':'Última mensagem: você')+' · '+dateLabel(c.last.created_at) : 'Nenhuma mensagem ainda';
      main.append(node('span','bv-si-card-sub',detail));head.append(main);
      if(c.unread){const count=node('span','bv-si-pill',countLabel(c.unread));count.setAttribute('aria-label',`${c.unread} respostas não lidas`);head.append(count)}
      button.append(head);
      const foot=node('span','bv-si-card-footer');foot.append(node('span','bv-si-card-action',c.last?'Abrir conversa':'Iniciar conversa'));
      const arrow=node('span','bv-si-card-action-arrow','›');arrow.setAttribute('aria-hidden','true');foot.append(arrow);button.append(foot);
      button.addEventListener('click',()=>openClass(c.id,button));root.append(button);
    }
  }
  async function openClass(classroomId,button){
    button.disabled=true;
    try{
      const selector=$('classroom');
      if(!selector||selector.disabled||![...selector.options].some(o=>o.value===classroomId))throw Error('A turma ainda não está disponível. Atualize a página e tente novamente.');
      selectedClassId=classroomId;
      selector.value=classroomId;selector.dispatchEvent(new Event('change',{bubbles:true}));
      render();
      const history=$('messages');if(history)history.scrollIntoView({behavior:'smooth',block:'start'});
      window.setTimeout(()=>refresh(true),1300);
    }catch(err){setStatus(err?.message||'Não foi possível abrir a conversa.',true)}
    finally{button.disabled=false}
  }
  async function fetchData(){
    const {data:members,error:me}=await db.from('classroom_memberships')
      .select('classroom_id').eq('user_id',uid).eq('status','active').limit(100);
    if(me)throw me;
    const ids=[...new Set((members||[]).map(m=>m.classroom_id))];
    if(!ids.length)return [];
    const {data:classes,error:ce}=await db.from('classrooms')
      .select('id,name').eq('is_active',true).in('id',ids).order('name');
    if(ce)throw ce;
    const all=(classes||[]).map(c=>({id:c.id,name:c.name,last:null,unread:0}));
    const byId=new Map(all.map(c=>[c.id,c]));
    if(!all.length)return all;
    const {data:messages,error:mse}=await db.from('bv_student_teacher_messages')
      .select('id,classroom_id,sender_kind,created_at').eq('student_id',uid)
      .in('classroom_id',all.map(c=>c.id)).order('created_at',{ascending:false}).limit(500);
    if(mse)throw mse;
    const messageClass=new Map();
    for(const m of messages||[]){
      if(!byId.has(m.classroom_id))continue;
      messageClass.set(m.id,m.classroom_id);
      const c=byId.get(m.classroom_id);if(!c.last)c.last=m;
    }
    const {data:notices,error:ne}=await db.from('boniverso_notices')
      .select('id,private_message_id').eq('event_type','message_new').eq('recipient_user',uid)
      .not('private_message_id','is',null).order('created_at',{ascending:false}).limit(200);
    if(ne)throw ne;
    const noticeIds=(notices||[]).map(n=>n.id);
    if(noticeIds.length){
      const {data:reads,error:re}=await db.from('boniverso_notice_reads')
        .select('notice_id').eq('user_id',uid).in('notice_id',noticeIds);
      if(re)throw re;
      const readIds=new Set((reads||[]).map(r=>r.notice_id));
      const missing=[...new Set((notices||[]).filter(n=>!readIds.has(n.id)&&!messageClass.has(n.private_message_id))
        .map(n=>n.private_message_id))].filter(Boolean);
      for(let k=0;k<missing.length;k+=100){
        const {data:extra,error:e}=await db.from('bv_student_teacher_messages')
          .select('id,classroom_id').in('id',missing.slice(k,k+100));
        if(e)throw e;
        for(const m of extra||[])messageClass.set(m.id,m.classroom_id);
      }
      for(const n of notices||[]){
        if(readIds.has(n.id))continue;
        const classId=messageClass.get(n.private_message_id);
        if(byId.has(classId))byId.get(classId).unread++;
      }
    }
    all.sort((a,b)=>(b.last?.created_at||'').localeCompare(a.last?.created_at||'')||a.name.localeCompare(b.name,'pt-BR'));
    return all;
  }
  async function refresh(force=false){
    if(!db||!uid||loading||document.hidden)return;
    if(!force&&Date.now()-lastLoad<STALE_MS)return;
    const expectedUid=uid;loading=true;setStatus('Atualizando suas conversas…');
    try{
      const nextCards=await fetchData();if(expectedUid!==uid)return;
      cards=nextCards;lastLoad=Date.now();render();setStatus('Conversas atualizadas.');
    }catch(err){setStatus('Não foi possível atualizar: '+String(err?.message||err),true)}
    finally{loading=false}
  }
  async function boot(){
    if(booted)return;booted=true;
    try{
      const cfg=window.BONIVERSO_CONFIG||{};
      if(!cfg.supabaseUrl||!cfg.supabasePublishableKey)return;
      const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.2');
      db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,
        {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const {data:auth,error:ae}=await db.auth.getUser();
      if(ae||!auth.user)return;
      uid=auth.user.id;
      const {data:staff,error:se}=await db.rpc('current_staff_role');if(se)throw se;
      if(staff==='teacher'||staff==='admin')return;
      mount();const panel=$('bv-student-inbox');if(!panel)return;
      panel.hidden=false;selectedClassId=$('classroom')?.value||null;
      await refresh(true);
      window.addEventListener('focus',()=>refresh());
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
      window.addEventListener('storage',ev=>{if(ev.key==='bv-private-messages-read')refresh(true)});
      window.setInterval(()=>refresh(),REFRESH_MS);
    }catch(err){console.warn('Caixa de Entrada do Estudante:',err?.message||err)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
