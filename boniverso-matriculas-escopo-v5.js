/* BoniVerso v5 - Matrícula por e-mail vinculada EXPLICITAMENTE a curso OU turma.
   Exige perfil admin + MFA e valida tudo novamente nas RPCs do Supabase.
   Mantém a administração de matrículas/exclusões da versão 4.
*/
(async () => {
  'use strict';
  const staff = document.getElementById('staff-view');
  const cfg = window.BONIVERSO_CONFIG || {};
  if (!staff || !cfg.supabaseUrl || !cfg.supabasePublishableKey) return;
  const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2.57.2');
  const db = createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
    auth: {persistSession:true, autoRefreshToken:true, detectSessionInUrl:false}
  });
  const {data:{user},error:authError} = await db.auth.getUser();
  if (authError || !user) return;
  const {data:role,error:roleError} = await db.rpc('current_staff_role');
  if (roleError || role !== 'admin') return;
  if (document.getElementById('bvScopedEnrollV5')) return;

  const elt = (tag, text, className) => {
    const item=document.createElement(tag);
    if (text !== undefined) item.textContent=text;
    if (className) item.className=className;
    return item;
  };
  const field = (label, control) => {
    const container=elt('div');
    const lab=elt('label',label);lab.htmlFor=control.id;
    container.append(lab,control);return container;
  };
  const req = async call => {
    const response=await call;
    if (response.error) throw response.error;
    return response.data;
  };
  let classes=[],courses=[],sections=[],enrollments=[],profiles=[],saving=false;
  const panel=elt('section',undefined,'card spaced');panel.id='bvScopedEnrollV5';
  panel.innerHTML=`<style>
    #bvScopedEnrollV5{border:2px solid #c5d6ef;border-radius:17px;padding:18px;margin:17px 0;background:linear-gradient(180deg,#ffffff,#f7faff)}
    #bvScopedEnrollV5 h2{margin:0 0 8px;font-size:1.25rem;color:#17365c}
    #bvScopedEnrollV5 p{color:#56708f;font-size:.9rem;line-height:1.55;margin:8px 0 14px}
    #bvScopedEnrollV5 .bv-sc-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin:13px 0}
    #bvScopedEnrollV5 label{display:block;color:#264568;font-size:.9rem;font-weight:750;margin-bottom:6px}
    #bvScopedEnrollV5 input[type=email],#bvScopedEnrollV5 select{display:block;width:100%;min-width:0;min-height:46px;border:1px solid #c9d8ec;border-radius:11px;background:white;color:#163555;font:inherit;padding:10px 12px}
    #bvScopedEnrollV5 .bv-sc-note{background:#edf5ff;border:1px solid #d0e0fa;padding:12px 13px;border-radius:11px;color:#2a4c76;font-size:.87rem;line-height:1.5;margin:12px 0}
    #bvScopedEnrollV5 .bv-sc-confirm{display:flex;align-items:flex-start;gap:10px;font-weight:500;line-height:1.4;margin-top:13px}
    #bvScopedEnrollV5 .bv-sc-confirm input{width:20px;height:20px;flex:none;margin-top:2px}
    #bvScopedEnrollV5 .bv-sc-buttons{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:14px}
    #bvScopedEnrollV5 button{border:1px solid #b9ceea;border-radius:11px;background:white;color:#23538d;min-height:43px;padding:9px 14px;font:inherit;font-weight:750;cursor:pointer}
    #bvScopedEnrollV5 button.primary{background:#2965ca;border-color:#2965ca;color:white}
    #bvScopedEnrollV5 button.danger{background:#fff7f5;border-color:#e5b5b3;color:#a43d34}
    #bvScopedEnrollV5 button:disabled{opacity:.6;cursor:wait}
    #bvScopedEnrollV5 .bv-sc-result{background:#eaf7ee;border:1px solid #badbc8;color:#246042;padding:10px 12px;border-radius:11px;margin:14px 0}
    #bvScopedEnrollV5 .bv-sc-result.error{background:#fff0ef;color:#ac3938;border-color:#eac4c2}
    #bvScopedEnrollV5 .bv-sc-members{display:grid;gap:9px;margin-top:12px}
    #bvScopedEnrollV5 .bv-sc-member{border:1px solid #d9e4f1;background:white;border-radius:11px;padding:11px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
    #bvScopedEnrollV5 .bv-sc-member small{color:#657c91;display:block;margin-top:4px}
    #bvScopedEnrollV5 .bv-sc-heading{margin:19px 0 9px;color:#1c3c63;font-weight:800}
    @media(max-width:680px){#bvScopedEnrollV5 .bv-sc-grid{grid-template-columns:1fr}#bvScopedEnrollV5 .bv-sc-member button{width:100%}}
    </style>`;
  panel.append(elt('h2','🎓 Matricular por e-mail — escolher curso ou turma'));
  panel.append(elt('p','Cada matrícula concede acesso apenas ao destino escolhido. Uma turma com curso associado libera também esse curso. O estudante deve ter uma conta com e-mail confirmado.'));
  const form=elt('form');
  const grid=elt('div',undefined,'bv-sc-grid');
  const email=elt('input');email.id='bvScopeStudentEmail';email.type='email';email.placeholder='aluno@exemplo.com';email.autocomplete='off';email.required=true;
  const destination=elt('select');destination.id='bvScopeDestination';destination.required=true;
  grid.append(field('E-mail cadastrado e confirmado',email),field('Curso ou turma de destino',destination));
  const yearField=elt('div');yearField.style.maxWidth='420px';
  const year=elt('select');year.id='bvScopeYear';yearField.append(field('Ano/série da turma',year));
  const detail=elt('div',undefined,'bv-sc-note');detail.setAttribute('aria-live','polite');
  const confirmLabel=elt('label',undefined,'bv-sc-confirm');
  const tick=elt('input');tick.type='checkbox';tick.required=true;
  confirmLabel.append(tick,elt('span','Confirmei a matrícula anterior ou a autorização para conceder acesso exclusivamente ao destino selecionado, sem cobrança automática.'));
  const buttons=elt('div',undefined,'bv-sc-buttons');
  const submit=elt('button','Matricular neste destino','primary');submit.type='submit';
  const refreshBtn=elt('button','Atualizar opções');refreshBtn.type='button';
  buttons.append(submit,refreshBtn);
  form.append(grid,yearField,detail,confirmLabel,buttons);
  panel.append(form);
  const result=elt('div','Selecione o curso ou a turma para continuar.','bv-sc-result');result.setAttribute('role','status');result.setAttribute('aria-live','polite');panel.append(result);
  const title=elt('div','Matrículas deste destino','bv-sc-heading');
  const membershipList=elt('div',undefined,'bv-sc-members');
  panel.append(title,membershipList);
  const message=(msg,error=false)=>{result.textContent=msg;result.className='bv-sc-result'+(error?' error':'');};
  const scope = ()=>{
    const value=destination.value;
    if (!value || !value.includes(':')) return {type:null,id:null};
    const [type,id]=value.split(':');
    return {type,id};
  };
  function disableButtons(disable){
    saving=disable;
    panel.querySelectorAll('button').forEach(b=>b.disabled=disable);
  }
  function hideLegacyForm(){
    const base=document.getElementById('bvAdminManagerV4');
    const work=base?.querySelector('#bvAdminWork');
    if (!work) return;
    for (const box of work.querySelectorAll('.adm-box')) {
      const h=box.querySelector('h3');
      if (h && h.textContent.includes('Matricular estudante por e-mail')) {
        box.hidden=true;box.style.display='none';
      }
    }
  }
  function attach(){
    const base=document.getElementById('bvAdminManagerV4');
    if(!base)return false;
    const work=base.querySelector('#bvAdminWork');
    if(!work)return false;
    work.before(panel);
    hideLegacyForm();
    const watcher=new MutationObserver(hideLegacyForm);
    watcher.observe(work,{childList:true});
    return true;
  }
  if(!attach()){
    const watcher=new MutationObserver(()=>{if(attach())watcher.disconnect();});
    watcher.observe(staff,{childList:true,subtree:true});
  }
  function renderOptions(keep){
    destination.replaceChildren(new Option('Selecione um curso ou turma',''));
    const classroomGroup=elt('optgroup');classroomGroup.label='Turmas ativas';
    for(const c of classes.filter(c=>c.is_active && !c.deleted_at)) {
      classroomGroup.append(new Option('Turma · '+c.name,'class:'+c.id));
    }
    const courseGroup=elt('optgroup');courseGroup.label='Cursos publicados';
    for(const c of courses.filter(c=>c.published)){
      courseGroup.append(new Option('Curso · '+c.title,'course:'+c.id));
    }
    destination.append(classroomGroup,courseGroup);
    if(keep && [...destination.options].some(x=>x.value===keep))destination.value=keep;
    displayScope();
  }
  function displayScope(){
    const {type,id}=scope();
    year.replaceChildren();
    yearField.hidden=true;
    if(type==='class'){
      const c=classes.find(x=>x.id===id);
      if(!c)return;
      if(c.enrollment_type==='free_code'){
        yearField.hidden=false;year.required=true;
        year.append(new Option('Selecione o ano/série',''));
        for(const s of sections.filter(x=>x.classroom_id===id && x.is_active && !x.deleted_at)) year.append(new Option(s.label||s.grade_code,s.id));
        detail.textContent='Turma gratuita: o aluno terá acesso a esta turma e à série escolhida. Não recebe acesso a outras turmas ou séries.';
      }else{
        year.required=false;
        const associated=courses.find(x=>x.id===c.paid_course_id);
        detail.textContent='Turma com convite: o aluno receberá acesso à turma '+c.name+' e ao curso associado '+(associated?.title||'(curso vinculado)')+'. Não terá acesso às outras turmas.';
      }
      title.textContent='Matrículas da turma selecionada';
    } else if(type==='course'){
      year.required=false;
      const c=courses.find(x=>x.id===id);
      detail.textContent='Curso individual: acesso somente ao conteúdo de '+(c?.title||'curso selecionado')+'. Não libera mensagens, fóruns ou turmas privadas vinculadas.';
      title.textContent='Alunos com acesso a este curso';
    }else{
      year.required=false;
      detail.textContent='Selecione primeiro um curso ou turma. O acesso é definido pela matrícula, não apenas pelo que aparece no menu.';
      title.textContent='Matrículas deste destino';
    }
    renderMembers();
  }
  function renderMembers(){
    membershipList.replaceChildren();
    const {type,id}=scope();
    if(!id)return;
    if(type==='class'){
      const p=elt('p','Para desmatricular ou reativar alunos desta turma, use a lista “Matrículas existentes” no painel administrativo.','bv-sc-note');
      membershipList.append(p);
      return;
    }
    const matches=enrollments.filter(x=>x.course_id===id && (!x.valid_until || new Date(x.valid_until)>new Date()));
    if(!matches.length){membershipList.append(elt('p','Não há matrículas ativas neste curso.'));return;}
    for(const e of matches){
      const profile=profiles.find(p=>p.id===e.user_id);
      const card=elt('div',undefined,'bv-sc-member');
      const info=elt('div');
      info.append(elt('strong',profile?.full_name||profile?.display_name||'Estudante cadastrado'));
      const origin=e.source==='purchase'?'Compra registrada':e.source==='admin_grant'?'Acesso administrativo':'Acesso promocional';
      info.append(elt('small',origin));card.append(info);
      const action=elt('button',e.source==='admin_grant'?'Revogar acesso ao curso':'Acesso preservado',e.source==='admin_grant'?'danger':'');
      action.type='button';action.disabled=e.source!=='admin_grant';
      if(e.source==='admin_grant')action.addEventListener('click',async()=>{
        if(saving)return;
        if(!confirm('Revogar somente o acesso administrativo ao curso deste estudante? Compras e redações não serão apagadas.'))return;
        disableButtons(true);
        try{
          await req(db.rpc('bv_admin_revoke_course_v1',{p_course_id:id,p_student_id:e.user_id}));
          await load(id?'course:'+id:'');
          message('Acesso administrativo ao curso revogado; histórico preservado.');
        }catch(err){message(err.message||String(err),true);}finally{disableButtons(false);}
      });
      card.append(action);membershipList.append(card);
    }
  }
  async function load(keep){
    const previous=keep||destination.value;
    try{
      [classes,courses,sections,enrollments,profiles]=await Promise.all([
        req(db.from('classrooms').select('id,name,enrollment_type,is_active,deleted_at,paid_course_id').order('name')),
        req(db.from('courses').select('id,title,is_free,published,visibility').order('title')),
        req(db.from('classroom_sections').select('id,classroom_id,label,grade_code,is_active,deleted_at')),
        req(db.from('enrollments').select('user_id,course_id,source,valid_until')),
        req(db.from('profiles').select('id,display_name,full_name'))
      ]);
      renderOptions(previous);
      message('Opções e matrículas atualizadas. Nenhum acesso foi alterado.');
    }catch(err){message('Falha ao buscar as opções: '+(err.message||String(err)),true);}
  }
  destination.addEventListener('change',()=>{tick.checked=false;displayScope();});
  refreshBtn.addEventListener('click',()=>load());
  form.addEventListener('submit',async ev=>{
    ev.preventDefault();if(saving)return;
    const {type,id}=scope();const address=email.value.trim();
    if(!id||!['class','course'].includes(type)){message('Selecione um curso ou uma turma.',true);return;}
    if(!tick.checked){message('Confirme a autorização de matrícula.',true);return;}
    const item=type==='class'?classes.find(x=>x.id===id):courses.find(x=>x.id===id);
    if(!item){message('Destino indisponível. Atualize a lista.',true);return;}
    let sectionId=null;
    if(type==='class' && item.enrollment_type==='free_code'){
      sectionId=year.value;
      if(!sectionId){message('Escolha o ano/série escolar.',true);return;}
    }
    const label=type==='class'?item.name:item.title;
    if(!confirm('Conceder acesso APENAS '+(type==='class'?'à turma':'ao curso')+' “'+label+'” para '+address+'?'+(type==='class'&&item.enrollment_type==='paid_invite'?' O curso vinculado também será liberado.':'')))return;
    disableButtons(true);
    try{
      if(type==='class'){
        await req(db.rpc('bv_admin_manage_enrollment_v4',{
          p_classroom_id:id,p_student_email:address,p_action:'enroll',p_section_id:sectionId
        }));
        const main=document.querySelector('#bvAdminClassSelect');
        if(main && [...main.options].some(o=>o.value===id)){
          main.value=id;main.dispatchEvent(new Event('change',{bubbles:true}));
        }
        document.querySelector('#bvAdminRefresh')?.click();
      }else{
        await req(db.rpc('bv_admin_grant_course_email_v1',{p_course_id:id,p_student_email:address}));
      }
      email.value='';tick.checked=false;
      await load(type+':'+id);
      message('Matrícula concluída em '+label+'. O acesso foi limitado ao destino escolhido.');
    }catch(err){message('Não foi possível matricular: '+(err.message||String(err)),true);}finally{disableButtons(false);}
  });
  await load();
})();
