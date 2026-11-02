/* BoniVerso — Gestão de correções v1 · 2026-11-02
 * Nova interface administrativa sobre a área de Correções.
 * Corrigir PDFs/textos usa as ações já protegidas do online-app e a Central avançada.
 * Excluir/restaurar: somente RPC administrativa; nenhuma exclusão física.
 */
(() => {
  'use strict';
  const app = document.getElementById('app');
  if (!app || !window.BONIVERSO_CONFIG?.supabaseUrl) return;
  const UUID = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;
  const pageName = 'Corrigir redações';
  let dbPromise = null;
  let mountedView = null;
  let panel = null;
  let role = null;
  let currentRows = [];
  let currentAssignments = [], currentCourses = [], currentClasses = [], currentProfiles = [];
  let activeFilter = { search:'', status:'active', course:'', classroom:'', format:'' };
  let working = false, renderScheduled = false;
  const $ = (s, root = document) => root.querySelector(s);
  const mk = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== null && text !== undefined) node.textContent = String(text);
    if (className) node.className = className;
    return node;
  };
  const fmt = date => date ? new Date(date).toLocaleString('pt-BR', {dateStyle:'short',timeStyle:'short'}) : '—';
  const norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const get = (list,id) => (list||[]).find(x=>x.id===id);
  const requireData = result => {if(result.error) throw result.error; return result.data||[];};
  const state = row => row.archived_at ? 'archived' : row.status==='graded' ? 'graded' : 'submitted';
  const label = row => ({archived:'Excluída / recuperável',graded:'Corrigida',submitted:'Aguardando correção'})[state(row)];
  const button = (name,onClick,kind='') => {
    const b=mk('button',name,'bv-corr-btn '+kind); b.type='button'; b.addEventListener('click',onClick);return b;
  };
  async function getDb() {
    if (window.BONIVERSO_DB) return window.BONIVERSO_DB;
    if (!dbPromise) dbPromise = import('https://esm.sh/@supabase/supabase-js@2.57.2').then(({createClient}) => {
      const cfg=window.BONIVERSO_CONFIG;
      return createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    });
    return dbPromise;
  }
  const css = document.createElement('style');
  css.textContent = `
    #bvCorrectionsManagerV1{border:1px solid #dbe6f4;background:#fff;border-radius:20px;padding:22px;margin:24px 0;box-shadow:0 12px 28px rgba(19,49,87,.06);color:#173253;min-width:0}
    #bvCorrectionsManagerV1 *{box-sizing:border-box}
    #bvCorrectionsManagerV1 .bv-corr-head{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}
    #bvCorrectionsManagerV1 h2{font-size:23px;line-height:1.25;margin:0 0 7px;letter-spacing:-.5px}
    #bvCorrectionsManagerV1 .bv-corr-help{color:#687e9b;font-size:13px;line-height:1.6;margin:0}
    #bvCorrectionsManagerV1 .bv-corr-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:20px 0}
    #bvCorrectionsManagerV1 .bv-corr-stat{border:1px solid #dde8f5;border-radius:13px;background:#f7faff;padding:14px;min-width:0;text-align:left;display:grid;gap:6px;cursor:pointer;color:#193d68;font:inherit}
    #bvCorrectionsManagerV1 .bv-corr-stat strong{font-size:28px;line-height:1;color:#1e4f91}
    #bvCorrectionsManagerV1 .bv-corr-stat span{font-size:12px;font-weight:750;line-height:1.3}
    #bvCorrectionsManagerV1 .bv-corr-stat:hover{border-color:#7aa3e0;background:#edf5ff}
    #bvCorrectionsManagerV1 .bv-corr-stat[aria-pressed=true]{background:#e5f0ff;border-color:#427fda}
    #bvCorrectionsManagerV1 .bv-corr-tools{display:grid;grid-template-columns:minmax(170px,1.5fr) repeat(3,minmax(125px,1fr));gap:12px;background:#f5f8fc;padding:14px;border-radius:14px}
    #bvCorrectionsManagerV1 .bv-corr-field{display:grid;gap:6px;min-width:0}
    #bvCorrectionsManagerV1 label{font-size:12px;color:#405b7b;font-weight:800}
    #bvCorrectionsManagerV1 :is(input,select){border:1px solid #cbd9eb;border-radius:10px;background:white;color:#18385d;padding:12px;width:100%;min-width:0;font:inherit;font-size:13px;min-height:44px}
    #bvCorrectionsManagerV1 .bv-corr-actions{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:14px 0}
    #bvCorrectionsManagerV1 .bv-corr-btn{border:1px solid #cbdcf3;color:#1e508e;background:#f3f8ff;font:inherit;font-weight:750;font-size:13px;min-height:42px;border-radius:10px;padding:10px 13px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;text-align:center}
    #bvCorrectionsManagerV1 .bv-corr-btn.primary{background:#326fd8;color:white;border-color:#326fd8}
    #bvCorrectionsManagerV1 .bv-corr-btn.danger{background:#fff6f5;color:#a12e31;border-color:#eec2c0}
    #bvCorrectionsManagerV1 .bv-corr-btn:disabled{opacity:.55;cursor:not-allowed}
    #bvCorrectionsManagerV1 .bv-corr-list{display:grid;gap:13px;margin-top:12px}
    #bvCorrectionsManagerV1 .bv-corr-card{border:1px solid #d9e6f4;border-left:5px solid #7ea5de;background:#fbfcff;border-radius:14px;padding:17px;display:grid;gap:11px;min-width:0}
    #bvCorrectionsManagerV1 .bv-corr-card.is-graded{border-left-color:#52ad8a}
    #bvCorrectionsManagerV1 .bv-corr-card.is-archived{border-left-color:#d39b64;background:#fffaf3}
    #bvCorrectionsManagerV1 .bv-corr-title{font-size:15px;font-weight:800;color:#142f54;line-height:1.4;overflow-wrap:anywhere}
    #bvCorrectionsManagerV1 .bv-corr-sub{color:#607692;font-size:12px;line-height:1.6;overflow-wrap:anywhere}
    #bvCorrectionsManagerV1 .bv-corr-chip{border-radius:999px;padding:6px 10px;display:inline-flex;align-items:center;background:#e8f0ff;color:#275da0;font-weight:800;font-size:11px}
    #bvCorrectionsManagerV1 .is-graded .bv-corr-chip{background:#e8f8f0;color:#1a7953}
    #bvCorrectionsManagerV1 .is-archived .bv-corr-chip{background:#fff0db;color:#955726}
    #bvCorrectionsManagerV1 .bv-corr-card-actions{display:flex;gap:9px;flex-wrap:wrap;padding-top:10px;border-top:1px solid #e2eaf5}
    #bvCorrectionsManagerV1 .bv-corr-card-actions > *{flex:1 1 150px}
    #bvCorrectionsManagerV1 .bv-corr-alert{background:#edf5ff;color:#28588e;border:1px solid #cdddf2;border-radius:11px;padding:12px;font-size:13px;line-height:1.5;margin:10px 0}
    #bvCorrectionsManagerV1 .bv-corr-alert.error{background:#fff4f1;color:#aa3f38;border-color:#efc9c3}
    #bvCorrectionsManagerV1 .bv-corr-empty{padding:25px 16px;background:#f5f8fc;border-radius:13px;color:#637995;font-size:13px;text-align:center}
    #bvCorrectionsManagerV1 :is(button,input,select,a):focus-visible{outline:3px solid #84b8ff;outline-offset:2px}
    @media(max-width:1050px){#bvCorrectionsManagerV1 .bv-corr-tools{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:700px){#bvCorrectionsManagerV1{padding:15px 12px}#bvCorrectionsManagerV1 .bv-corr-stats{grid-template-columns:repeat(2,minmax(0,1fr))}#bvCorrectionsManagerV1 .bv-corr-tools{grid-template-columns:minmax(0,1fr)}#bvCorrectionsManagerV1 .bv-corr-card-actions > *{flex:1 1 100%}}
  `;
  document.head.append(css);

  function show(msg,isError=false){
    const el=panel?.querySelector('.bv-corr-alert');if(!el)return;
    el.hidden=false;el.classList.toggle('error',isError);el.textContent=msg;
  }
  async function load(){
    const db=await getDb();
    const u=await db.auth.getUser();if(u.error||!u.data?.user)throw Error('Entre na sua conta.');
    const roleResult=await db.rpc('current_staff_role');if(roleResult.error)throw roleResult.error;
    role=roleResult.data;
    if(!['admin','teacher'].includes(role))throw Error('Esta área é exclusiva do corpo docente autorizado.');
    const [s,assignments,courses,classes] = await Promise.all([
      db.from('submissions').select('id,assignment_id,user_id,status,score,submitted_at,attachment_path,attachment_name,archived_at,archive_reason').order('submitted_at',{ascending:false}).limit(400),
      db.from('assignments').select('id,title,course_id,classroom_id,section_id,writing_genre').limit(700),
      db.from('courses').select('id,title').limit(300),
      db.from('classrooms').select('id,name').limit(300)
    ]);
    currentRows=requireData(s);currentAssignments=requireData(assignments);currentCourses=requireData(courses);currentClasses=requireData(classes);
    const ids=[...new Set(currentRows.map(x=>x.user_id).filter(x=>UUID.test(x)))];
    currentProfiles=[];
    for(let i=0;i<ids.length;i+=120){
      const r=await db.from('profiles').select('id,display_name,full_name').in('id',ids.slice(i,i+120));
      if(r.error)throw r.error;currentProfiles.push(...(r.data||[]));
    }
  }
  const assignment = row => get(currentAssignments,row.assignment_id);
  const course = row => get(currentCourses,assignment(row)?.course_id);
  const classroom = row => get(currentClasses,assignment(row)?.classroom_id);
  const studentName = row => {const p=get(currentProfiles,row.user_id);return p?.full_name||p?.display_name||'Estudante cadastrado';};
  function filtered(){
    return currentRows.filter(row=>{
      const st=state(row);
      if(activeFilter.status==='active'&&st==='archived')return false;
      if(activeFilter.status!=='active'&&activeFilter.status!=='all'&&st!==activeFilter.status)return false;
      if(activeFilter.course&&assignment(row)?.course_id!==activeFilter.course)return false;
      if(activeFilter.classroom&&assignment(row)?.classroom_id!==activeFilter.classroom)return false;
      if(activeFilter.format&&((row.attachment_path?'pdf':'text')!==activeFilter.format))return false;
      const search=norm([studentName(row),assignment(row)?.title,course(row)?.title,classroom(row)?.name,row.attachment_name].join(' '));
      return !activeFilter.search||search.includes(norm(activeFilter.search));
    });
  }
  function exportCsv(){
    const rows=[['Estudante','Proposta','Curso','Turma','Enviado em','Situação','Formato','Nota']];
    for(const r of filtered())rows.push([studentName(r),assignment(r)?.title||'',course(r)?.title||'',classroom(r)?.name||'',fmt(r.submitted_at),label(r),r.attachment_path?'PDF':'Digitada',r.score??'']);
    const csv='\uFEFF'+rows.map(r=>r.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);const a=mk('a');a.href=url;a.download='BoniVerso-Relatorio-Redacoes.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function manage(row,action){
    if(role!=='admin')return show('Somente o administrador pode excluir ou restaurar redações.',true);
    const isArchive=action==='archive';
    let reason=null;
    if(isArchive){reason=window.prompt('Por que esta redação deve ser excluída da interface? Informe ao menos 6 caracteres.\nO histórico e o PDF serão preservados.');
      if(reason===null)return; reason=reason.trim();if(reason.length<6||reason.length>400)return show('Informe uma justificativa entre 6 e 400 caracteres.',true);
    }
    const word=isArchive?'EXCLUIR':'RESTAURAR';
    const confirmation=window.prompt((isArchive?'A redação deixará de aparecer para o estudante e na fila normal.':'A redação voltará a aparecer no aplicativo.')+'\nDigite '+word+' para confirmar:');
    if(confirmation!==word)return show('Operação cancelada. A palavra de confirmação não corresponde.',true);
    if(working)return;working=true;
    panel?.querySelectorAll('button').forEach(b=>b.disabled=true);
    try{
      const db=await getDb();const r=await db.rpc('bv_admin_submission_archive_v1',{
        p_submission_id:row.id,p_action:action,p_confirmation:word,p_reason:reason
      });if(r.error)throw r.error;
      await load();render();show(isArchive?'Redação retirada da interface. PDF, nota e histórico preservados.':'Redação restaurada com sucesso.');
    }catch(e){show('Não foi possível concluir: '+(e.message||String(e)),true)}finally{working=false;panel?.querySelectorAll('button').forEach(b=>b.disabled=false)}
  }
  function addSelect(container,labelText,options,value,handler){
    const field=mk('label',null,'bv-corr-field');field.append(mk('span',labelText));
    const select=mk('select');for(const [v,t] of options)select.append(new Option(t,v));select.value=value;
    select.addEventListener('change',()=>handler(select.value));field.append(select);container.append(field);
  }
  function render(){
    if(!panel||!panel.isConnected)return;
    const active=currentRows.filter(r=>!r.archived_at);
    const pending=active.filter(r=>r.status==='submitted');const graded=active.filter(r=>r.status==='graded');const archived=currentRows.filter(r=>r.archived_at);
    panel.replaceChildren();
    const head=mk('div',null,'bv-corr-head');const title=mk('div');title.append(mk('h2','📝 Gestão de Correção de Redações'),mk('p','Acompanhe cada entrega, corrija textos, confira PDFs e mantenha o histórico protegido.','bv-corr-help'));
    const advanced=mk('a','Abrir Central de Redações completa','bv-corr-btn primary');advanced.href='./gestao-redacoes.html';head.append(title,advanced);panel.append(head);
    const stats=mk('div',null,'bv-corr-stats');
    for(const [name,count,filter] of [['Total de entregas',active.length,'active'],['Aguardando correção',pending.length,'submitted'],['Corrigidas',graded.length,'graded'],['Excluídas / recuperáveis',archived.length,'archived']]){
      const btn=mk('button',null,'bv-corr-stat');btn.type='button';btn.setAttribute('aria-pressed',String(activeFilter.status===filter));btn.append(mk('strong',count),mk('span',name));btn.addEventListener('click',()=>{activeFilter.status=filter;render()});stats.append(btn);
    }panel.append(stats);
    const tools=mk('div',null,'bv-corr-tools');
    const q=mk('label',null,'bv-corr-field');q.append(mk('span','Buscar estudante ou proposta'));
    const input=mk('input');input.type='search';input.placeholder='Nome, turma ou tema';input.value=activeFilter.search;input.maxLength=180;
    input.addEventListener('input',()=>{activeFilter.search=input.value;paintList();});q.append(input);tools.append(q);
    const statOptions=[['active','Todas, exceto excluídas'],['submitted','Aguardando correção'],['graded','Corrigidas'],['archived','Excluídas / restauráveis'],['all','Todas, inclusive excluídas']];
    addSelect(tools,'Situação',statOptions,activeFilter.status,x=>{activeFilter.status=x;render()});
    addSelect(tools,'Curso',[['','Todos os cursos'],...currentCourses.map(c=>[c.id,c.title])],activeFilter.course,x=>{activeFilter.course=x;render()});
    addSelect(tools,'Turma',[['','Todas as turmas'],...currentClasses.map(c=>[c.id,c.name])],activeFilter.classroom,x=>{activeFilter.classroom=x;render()});
    panel.append(tools);
    const row=mk('div',null,'bv-corr-actions');const count=mk('span','','bv-corr-help');count.id='bvCorrCount';
    const buttons=mk('div',null,'bv-corr-card-actions');
    buttons.append(button('Limpar filtros',()=>{activeFilter={search:'',status:'active',course:'',classroom:'',format:''};render()}));
    buttons.append(button('Baixar relatório CSV',exportCsv));row.append(count,buttons);panel.append(row);
    const list=mk('div',null,'bv-corr-list');list.id='bvCorrList';panel.append(list);
    const msg=mk('div',null,'bv-corr-alert');msg.hidden=true;msg.setAttribute('role','status');panel.append(msg);
    const hint=mk('p','Excluir do aplicativo é uma ação administrativa reversível, não uma eliminação definitiva dos registros. A correção pedagógica deve ser aprovada pelo professor.','bv-corr-help');hint.style.marginTop='15px';panel.append(hint);
    paintList();
  }
  function paintList(){
    const list=panel?.querySelector('#bvCorrList');if(!list)return;
    const matches=filtered();const count=panel.querySelector('#bvCorrCount');if(count)count.textContent=matches.length+' de '+currentRows.length+' redações encontradas';
    list.replaceChildren();if(!matches.length){list.append(mk('div','Nenhuma redação encontrada com estes filtros.','bv-corr-empty'));return;}
    for(const r of matches){
      const st=state(r);const card=mk('article',null,'bv-corr-card is-'+st);
      const head=mk('div',null,'bv-corr-head');const top=mk('div');top.append(mk('div',studentName(r),'bv-corr-title'),mk('div',assignment(r)?.title||'Proposta sem título','bv-corr-sub'));
      head.append(top,mk('span',label(r),'bv-corr-chip'));card.append(head);
      const parts=[classroom(r)?.name||'Proposta geral',course(r)?.title||'Curso não identificado',fmt(r.submitted_at),r.attachment_path?'📄 PDF':'✍️ Digitada'];
      if(r.status==='graded'&&r.score!==null)parts.push('Nota: '+r.score);
      card.append(mk('div',parts.join(' · '),'bv-corr-sub'));
      if(st==='archived'&&role==='admin')card.append(mk('div','Exclusão reversível · '+(r.archive_reason||'Sem justificativa exibida'),'bv-corr-sub'));
      const actions=mk('div',null,'bv-corr-card-actions');
      if(st!=='archived'){
        if(st==='submitted'){
          const correct=button('✍️ Corrigir agora',()=>{},'primary');correct.dataset.onlineAction='review';correct.dataset.id=r.id;actions.append(correct);
        }
        if(r.attachment_path){
          const pdf=button('📄 Abrir PDF original',()=>{});pdf.dataset.onlineAction='view-essay-pdf';pdf.dataset.id=r.id;actions.append(pdf);
        }
        const detailed=mk('a',st==='graded'?'📋 Conferir avaliação':'📋 Correção detalhada','bv-corr-btn');detailed.href='./gestao-redacoes.html';actions.append(detailed);
      }
      if(role==='admin')actions.append(button(st==='archived'?'↩ Restaurar redação':'🗑️ Excluir da interface',()=>manage(r,st==='archived'?'restore':'archive'),st==='archived'?'':'danger'));
      card.append(actions);list.append(card);
    }
  }
  function activeView(){
    const view=document.getElementById('view');if(!view)return null;
    return (view.querySelector('.page-top h1')?.textContent||'').trim()===pageName?view:null;
  }
  async function mount(view){
    if(mountedView===view&&panel?.isConnected)return;
    mountedView=view;let original=view.querySelector(':scope > .panel');
    panel=mk('section','Carregando Gestão de Correções…');panel.id='bvCorrectionsManagerV1';
    (original||view.firstElementChild)?.insertAdjacentElement('beforebegin',panel);
    try{
      await load();if(activeView()!==view||!panel.isConnected)return;
      render();if(original)original.hidden=true;
    }catch(e){
      if(original)original.hidden=false;
      if(panel?.isConnected){panel.replaceChildren(mk('h2','Gestão de correções indisponível'),mk('p',e.message||String(e),'bv-corr-help'),button('Tentar novamente',()=>{mountedView=null;panel?.remove();mount(view);}))}
    }
  }
  const observer=new MutationObserver(()=>{
    if(renderScheduled)return;renderScheduled=true;
    requestAnimationFrame(()=>{renderScheduled=false;const v=activeView();if(v&&(!panel?.isConnected||mountedView!==v))mount(v);});
  });
  observer.observe(app,{subtree:true,childList:true});
  const initial=activeView();if(initial)mount(initial);
})();
