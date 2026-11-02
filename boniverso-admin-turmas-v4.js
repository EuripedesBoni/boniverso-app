/* BoniVerso — Gestão administrativa de turmas v4
   Matrículas por e-mail confirmado, desmatrícula, exclusão lógica com histórico,
   restauração. Permissões verificadas em RPCs do Supabase (AAL2).
   Não substitui a gestão pedagógica de anos/turmas já existente. */
(async () => {
  'use strict';
  const staffHost = document.getElementById('staff-view');
  const cfg = window.BONIVERSO_CONFIG || {};
  if (!staffHost || !cfg.supabaseUrl || !cfg.supabasePublishableKey) return;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.2');
  const db = createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
    auth: {persistSession:true, autoRefreshToken:true, detectSessionInUrl:false}
  });
  const {data:{user},error:authError} = await db.auth.getUser();
  if (authError || !user) return;
  const {data:role,error:roleError} = await db.rpc('current_staff_role');
  if (roleError || role !== 'admin') return;
  if (document.getElementById('bvAdminManagerV4')) return;

  const panel = document.createElement('section');
  panel.className = 'card spaced';
  panel.id = 'bvAdminManagerV4';
  panel.innerHTML = `
  <style>
    #bvAdminManagerV4 {border:2px solid #bdd1ee;box-shadow:0 10px 28px #203b6e0f}
    #bvAdminManagerV4 .adm-title{margin:0;color:#132947;font-size:1.34rem}
    #bvAdminManagerV4 .adm-sub{margin:6px 0 15px;color:#58718e;font-size:.92rem;line-height:1.5}
    #bvAdminManagerV4 .adm-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 15px}
    #bvAdminManagerV4 .adm-tab{border:1px solid #cbd9eb;border-radius:12px;background:#fff;color:#294c83;font-weight:750;padding:9px 13px;min-height:43px}
    #bvAdminManagerV4 .adm-tab[aria-pressed=true]{background:#2455a0;color:#fff;border-color:#2455a0}
    #bvAdminManagerV4 .adm-box{border:1px solid #d9e4f2;background:#f9fbff;border-radius:16px;padding:15px;margin:14px 0}
    #bvAdminManagerV4 label{display:block;font-size:.84rem;font-weight:750;color:#244366;margin:0 0 7px}
    #bvAdminManagerV4 input:not([type=checkbox]),#bvAdminManagerV4 select{width:100%;min-width:0;min-height:43px;padding:9px 12px;border:1px solid #cddbef;border-radius:11px;background:#fff;color:#183452;font:inherit}
    #bvAdminManagerV4 .adm-fields{display:grid;grid-template-columns:minmax(210px,2fr) minmax(160px,1fr);gap:12px;align-items:end}
    #bvAdminManagerV4 .adm-actions{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:12px 0 4px}
    #bvAdminManagerV4 .adm-btn{border:1px solid #b7cbea;border-radius:11px;color:#23508f;background:#fff;font-weight:760;padding:9px 13px;min-height:42px;cursor:pointer}
    #bvAdminManagerV4 .adm-btn.primary{background:#2b64cf;border-color:#2b64cf;color:#fff}
    #bvAdminManagerV4 .adm-btn.warn{color:#9d561c;border-color:#edbf8c;background:#fff8f1}
    #bvAdminManagerV4 .adm-btn.danger{color:#a82d38;border-color:#e9b3b7;background:#fff7f6}
    #bvAdminManagerV4 .adm-btn:disabled{opacity:.55;cursor:wait}
    #bvAdminManagerV4 .adm-members{display:grid;gap:9px;margin-top:14px}
    #bvAdminManagerV4 .adm-member{background:#fff;border:1px solid #dce5f2;border-radius:12px;padding:11px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
    #bvAdminManagerV4 .adm-member strong{color:#193451;overflow-wrap:anywhere}
    #bvAdminManagerV4 .adm-member small{display:block;color:#6a7890;font-size:.78rem;margin-top:3px}
    #bvAdminManagerV4 .adm-member .adm-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    #bvAdminManagerV4 .adm-member .adm-controls select{min-width:150px;max-width:220px}
    #bvAdminManagerV4 .adm-status{background:#eaf2fe;color:#2b537b;border:1px solid #cbdcf2;border-radius:11px;padding:10px 13px;margin-top:15px;line-height:1.5}
    #bvAdminManagerV4 .adm-status.error{background:#fff0ef;color:#a52d35;border-color:#edc4c0}
    #bvAdminManagerV4 .adm-status.ok{background:#eaf7ee;color:#21633b;border-color:#bcdcc8}
    #bvAdminManagerV4 .adm-small{font-size:.81rem;color:#5f7087;line-height:1.5}
    #bvAdminManagerV4 .adm-red{color:#9f2935}
    #bvAdminManagerV4 .adm-check{display:flex;gap:9px;align-items:flex-start;font-size:.84rem;font-weight:500;margin:12px 0}
    #bvAdminManagerV4 .adm-check input{width:18px;height:18px;flex:none}
    #bvAdminManagerV4 .adm-row{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center}
    @media(max-width:640px){#bvAdminManagerV4 .adm-fields{grid-template-columns:1fr}#bvAdminManagerV4 .adm-member .adm-controls{width:100%}#bvAdminManagerV4 .adm-btn{flex:1}#bvAdminManagerV4 .adm-member .adm-controls select{max-width:none;flex:1}}
  </style>
  <h2 class="adm-title">🔐 Gestão administrativa de matrículas e turmas</h2>
  <p class="adm-sub">Somente administrador com verificação em duas etapas. Matricule por e-mail confirmado, retire acessos por turma e exclua turmas da interface sem perder notas, redações ou histórico.</p>
  <div class="adm-tabs" role="group" aria-label="Situação das turmas">
    <button class="adm-tab" type="button" data-mode="active" aria-pressed="true">Ativas</button>
    <button class="adm-tab" type="button" data-mode="archived" aria-pressed="false">Arquivadas</button>
    <button class="adm-tab" type="button" data-mode="excluded" aria-pressed="false">Excluídas (restauráveis)</button>
  </div>
  <div class="adm-fields"><div><label for="bvAdminClassSelect">Turma</label><select id="bvAdminClassSelect"></select></div>
    <button class="adm-btn" type="button" id="bvAdminRefresh">Atualizar turmas</button></div>
  <div id="bvAdminSummary" class="adm-small" aria-live="polite"></div>
  <div id="bvAdminWork"></div>
  <div class="adm-status" id="bvAdminStatus" role="status" aria-live="polite">Carregando as turmas…</div>
  `;
  const old = document.getElementById('bvClassManager');
  if (old) old.after(panel); else {
    const report = document.getElementById('report-panel');
    if (report) report.before(panel); else staffHost.append(panel);
  }
  const $ = id => panel.querySelector('#'+id);
  const el = (tag, text, cls) => {const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;};
  const add = (root, ...nodes) => {for(const n of nodes)root.append(n);return root;};
  const button = (text, kind, click) => {const b=el('button',text,'adm-btn '+(kind||''));b.type='button';b.addEventListener('click',click);return b;};
  const textStatus = (msg, kind) => {const x=$('bvAdminStatus');x.textContent=msg;x.className='adm-status '+(kind||'');};
  const req = async call => {const r=await call;if(r.error)throw r.error;return r.data;};
  let classes=[],sections=[],members=[],profiles=[],mode='active',selected='',busy=false;
  const chosen = ()=>classes.find(c=>c.id===selected);
  const visible = ()=>classes.filter(c=>mode==='excluded'?!!c.deleted_at:mode==='archived'?!c.is_active&&!c.deleted_at:c.is_active&&!c.deleted_at);
  const gradeName = section =>section.label || section.grade_code;
  const activeSections = c=>sections.filter(s=>s.classroom_id===c.id&&s.is_active);
  const nameOf=id=>{const p=profiles.find(p=>p.id===id);return p?.full_name||p?.display_name||'Estudante cadastrado';};

  // Oculta exclusivamente os comandos antigos que usam `inactive` ou exclusão sem histórico.
  // A edição dos anos, códigos e descrições continua no gestor principal.
  function removeLegacyConflicts(){
    const root=document.getElementById('bvClassManager');if(!root)return;
    for(const b of root.querySelectorAll('button')){
      const txt=(b.textContent||'').trim();
      if(txt==='Desativar matrícula'||txt==='Reativar matrícula'||txt.includes('Excluir turma')){
        b.hidden=true;b.style.display='none';b.setAttribute('aria-hidden','true');
      }
    }
    // Turmas excluídas com histórico só são apresentadas na aba própria
    // do painel administrativo; não continuam na lista antiga de arquivadas.
    for(const card of root.querySelectorAll('.bv-turma')){
      const shownName=(card.querySelector('.bv-title')?.textContent||'').trim();
      const removed=classes.some(c=>!!c.deleted_at && c.name===shownName);
      card.hidden=removed;
      card.style.display=removed?'none':'';
    }
  }
  removeLegacyConflicts();
  const ob=new MutationObserver(removeLegacyConflicts);
  if(document.getElementById('bvClassManager')) ob.observe(document.getElementById('bvClassManager'),{childList:true,subtree:true});
  else {
    const temp=new MutationObserver(()=>{const m=document.getElementById('bvClassManager');if(m){m.after(panel);removeLegacyConflicts();ob.observe(m,{childList:true,subtree:true});temp.disconnect();}});
    temp.observe(staffHost,{childList:true,subtree:true});
  }

  async function load(prefer){
    if(busy)return;
    busy=true;$('bvAdminRefresh').disabled=true;
    try{
      [classes,sections,members,profiles]=await Promise.all([
        req(db.from('classrooms').select('id,name,enrollment_type,is_active,paid_course_id,deleted_at').order('name')),
        req(db.from('classroom_sections').select('id,classroom_id,label,grade_code,is_active')),
        req(db.from('classroom_memberships').select('id,classroom_id,user_id,section_id,status,joined_at')),
        req(db.from('profiles').select('id,display_name,full_name'))
      ]);
      const candidates=visible();
      const desire=prefer||selected;
      selected=candidates.some(c=>c.id===desire)?desire:(candidates[0]?.id||'');
      render();
      textStatus('Dados atualizados. Nenhuma matrícula foi alterada.','ok');
    }catch(e){textStatus('Falha na consulta: '+(e.message||String(e)),'error');}
    finally{busy=false;$('bvAdminRefresh').disabled=false;}
  }
  async function change(call, success, keepId){
    if(busy)return;
    busy=true;panel.querySelectorAll('button').forEach(b=>b.disabled=true);
    textStatus('Salvando a alteração…');
    try{await req(call);busy=false;panel.querySelectorAll('button').forEach(b=>b.disabled=false);
      await load(keepId);textStatus(success,'ok');removeLegacyConflicts();
    }catch(e){textStatus('Não foi possível concluir: '+(e.message||String(e)),'error');}
    finally{busy=false;panel.querySelectorAll('button').forEach(b=>b.disabled=false);}
  }
  function render(){
    for(const b of panel.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===mode));
    const sel=$('bvAdminClassSelect'), candidates=visible();
    sel.replaceChildren();
    if(!candidates.length)sel.append(new Option('Nenhuma turma nesta categoria',''));
    else candidates.forEach(c=>sel.append(new Option(c.name,c.id)));
    sel.value=selected;
    const zone=$('bvAdminWork');zone.replaceChildren();
    const c=chosen();
    if(!c){$('bvAdminSummary').textContent='Nenhuma turma encontrada nesta categoria.';return;}
    const count=members.filter(m=>m.classroom_id===c.id&&m.status==='active').length;
    $('bvAdminSummary').textContent=`${c.name} · ${count} matrícula(s) ativa(s) · ${c.enrollment_type==='paid_invite'?'acesso por e-mail':'matrícula por ano/série'}`;
    const area=el('div',undefined,'adm-box');
    const heading=el('div',undefined,'adm-row');add(heading,el('strong','Gestão da turma'));
    if(c.deleted_at){
      add(heading,button('↩ Restaurar turma','primary',()=>{
        if(!confirm('Restaurar a turma e liberar novamente o acesso às matrículas ativas?'))return;
        change(db.rpc('bv_admin_restore_classroom_v4',{p_classroom_id:c.id}),'Turma restaurada; o histórico foi preservado.');
      }));
      add(area,heading,el('p','Turma removida das áreas normais do aplicativo. Acesso dos alunos suspenso, com matrículas e histórico guardados para restauração.','adm-small'));
      zone.append(area);return;
    }
    add(heading,button('Excluir do aplicativo','danger',()=>{
      if(!confirm('Excluir esta turma do aplicativo, mesmo havendo histórico? Redações, notas e mensagens serão preservadas e a turma poderá ser restaurada.'))return;
      const typed=prompt('Digite exatamente o nome da turma para confirmar:\n'+c.name);
      if(typed!==c.name){textStatus('Exclusão cancelada: o nome informado não corresponde.','error');return;}
      change(db.rpc('bv_admin_exclude_classroom_v4',{p_classroom_id:c.id,p_confirm_name:typed}),
        'Turma excluída da interface. Histórico preservado e restauração disponível na aba Excluídas.');
    }));
    add(area,heading,el('p','Excluir do aplicativo oculta a turma e suspende temporariamente o acesso dos estudantes, restaurando as matrículas quando a turma for restaurada. Não apaga notas, redações, mensagens, arquivos nem pagamentos. Para guardar uma turma sem marcá-la como excluída, utilize Arquivar no gestor principal.','adm-small'));
    zone.append(area);
    if(!c.is_active){zone.append(el('p','Turma arquivada: reative-a na Gestão de turmas para liberar matrículas.','adm-status'));return;}

    const box=el('div',undefined,'adm-box');add(box,el('h3','➕ Matricular estudante por e-mail'));
    const form=el('form');const flds=el('div',undefined,'adm-fields');
    const first=el('div');const emailLab=el('label','E-mail cadastrado e confirmado');emailLab.htmlFor='bvAdmEmail';const email=el('input');email.id='bvAdmEmail';email.type='email';email.autocomplete='off';email.placeholder='aluno@exemplo.com';email.required=true;add(first,emailLab,email);
    const second=el('div');const secLab=el('label','Ano/série escolar');const secSelect=el('select');
    const secs=activeSections(c);
    if(c.enrollment_type==='free_code'){
      secSelect.id='bvAdmSection';secSelect.required=true;
      if(!secs.length)secSelect.append(new Option('Nenhum ano ativo',''));
      secs.forEach(s=>secSelect.append(new Option(gradeName(s),s.id)));
      add(second,secLab,secSelect);
    }else{add(second,el('p','Acesso por convite: não exige ano/série.','adm-small'));}
    add(flds,first,second);form.append(flds);
    const ack=el('label',undefined,'adm-check');
    const tick=el('input');tick.type='checkbox';tick.required=true;ack.append(tick,el('span',c.enrollment_type==='paid_invite'
      ?'Confirmo que este estudante possui matrícula anterior ou que seu acesso ao curso foi autorizado. Não haverá cobrança automática.'
      :'Confirmo que este estudante deve fazer parte desta turma.'));
    form.append(ack);
    const submit=el('button','Matricular aluno','adm-btn primary');submit.type='submit';form.append(submit);
    form.addEventListener('submit',ev=>{
      ev.preventDefault();if(!tick.checked)return;
      const address=email.value.trim();if(!address)return;
      const sid=c.enrollment_type==='free_code'?secSelect.value:null;
      if(c.enrollment_type==='free_code'&&!sid){textStatus('Selecione um ano/série ativo.','error');return;}
      if(!confirm('Conceder acesso à turma '+c.name+' para a conta de '+address+'?'))return;
      change(db.rpc('bv_admin_manage_enrollment_v4',{p_classroom_id:c.id,p_student_email:address,p_action:'enroll',p_section_id:sid}),
        'Matrícula realizada. O estudante já pode acessar esta turma.',c.id);
    });add(box,form,el('p','O aluno precisa criar a própria conta e confirmar o e-mail antes da liberação. O administrador nunca deve solicitar a senha do estudante.','adm-small'));
    zone.append(box);

    const list=el('div',undefined,'adm-box');const relevant=members.filter(m=>m.classroom_id===c.id);
    add(list,el('h3',`👥 Matrículas existentes (${relevant.length})`));
    if(!relevant.length)list.append(el('p','Nenhum estudante matriculado.','adm-small'));
    const stack=el('div',undefined,'adm-members');
    for(const m of relevant){
      const card=el('div',undefined,'adm-member');const name=el('div');name.append(el('strong',nameOf(m.user_id)));
      const sec=sections.find(s=>s.id===m.section_id);
      name.append(el('small',`${m.status==='active'?'Matrícula ativa':'Desmatriculado'}${sec?' · '+gradeName(sec):''}`));
      const controls=el('div',undefined,'adm-controls');
      let newYear=null;
      if(c.enrollment_type==='free_code'&&m.status!=='active'){
        newYear=el('select');newYear.append(new Option('Escolha ano ativo',''));
        secs.forEach(s=>newYear.append(new Option(gradeName(s),s.id)));
        if(sec&&sec.is_active)newYear.value=m.section_id;
        else newYear.value='';
        newYear.setAttribute('aria-label','Ano para reativar a matrícula');controls.append(newYear);
      }
      controls.append(button(m.status==='active'?'Desmatricular':'Reativar matrícula',m.status==='active'?'warn':'primary',()=>{
        const action=m.status==='active'?'revoke':'enroll';
        const secId=newYear?newYear.value:null;
        if(action==='enroll'&&c.enrollment_type==='free_code'&&!secId){textStatus('Escolha um ano ativo para reativar o aluno.','error');return;}
        if(!confirm(action==='revoke'
          ?'Retirar o acesso de '+nameOf(m.user_id)+' a esta turma? Redações, notas e histórico serão preservados.'
          :'Reativar a matrícula de '+nameOf(m.user_id)+' nesta turma?'))return;
        change(db.rpc('bv_admin_toggle_membership_v4',{p_membership_id:m.id,p_action:action,p_section_id:secId}),
          action==='revoke'?'Matrícula desativada nesta turma. Histórico preservado.':'Matrícula reativada.',c.id);
      }));
      add(card,name,controls);stack.append(card);
    }
    list.append(stack);zone.append(list);
  }
  $('bvAdminClassSelect').addEventListener('change',e=>{selected=e.target.value;render();});
  $('bvAdminRefresh').addEventListener('click',()=>load(selected));
  for(const b of panel.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>{mode=b.dataset.mode;selected='';const s=visible();selected=s[0]?.id||'';render();});
  await load();
})();
