/* BoniVerso 3.2 — Gestão integrada de turmas e anos escolares.
   Preserva o ícone existente. Autorização no servidor (Supabase RLS e RPCs).
   Compatível com turmas.html; substitui o antigo v300/v310. */
(async () => {
  'use strict';
  const cfg = window.BONIVERSO_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabasePublishableKey || !document.getElementById('staff-view')) return;
  const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2.57.2');
  const db = createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
  });
  const {data:auth} = await db.auth.getUser();
  if (!auth?.user) return;
  const {data:role,error:roleError}= await db.rpc('current_staff_role');
  if (roleError || !['admin','teacher'].includes(role)) return;
  const isAdmin = role === 'admin';
  document.getElementById('bvClassManager')?.remove();
  const panel = document.createElement('section');
  panel.id='bvClassManager'; panel.className='card spaced';
  panel.innerHTML=`<style>
    #bvClassManager .bv-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}
    #bvClassManager .bv-tabs .btn[aria-pressed=true]{background:#1a3563;color:#fff;border-color:#1a3563}
    #bvClassManager .bv-rows{display:grid;gap:12px}
    #bvClassManager .bv-turma{background:#fff;border:1px solid #dae3f0;border-radius:15px;padding:16px;min-width:0}
    #bvClassManager .bv-turma.bv-open{border-color:#5280ce;box-shadow:0 5px 15px #15294d15}
    #bvClassManager .bv-title{font-size:17px;font-weight:800;color:#142748;overflow-wrap:anywhere}
    #bvClassManager .bv-details{margin-top:14px;border-top:1px solid #e6ebf4;padding-top:15px}
    #bvClassManager .bv-year{border:1px solid #e2e7f0;border-radius:12px;padding:12px;margin:10px 0}
    #bvClassManager .bv-year-head{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}
    #bvClassManager .bv-hint{background:#f0f5fc;padding:12px 14px;border-radius:12px;color:#425d80;font-size:13px;margin:12px 0;line-height:1.5}
    #bvClassManager .bv-muted{font-size:13px;color:#637795}
    #bvClassManager .bv-danger{background:#fff;color:#ad3434;border-color:#dba6a6}
    #bvClassManager .bv-danger:hover{background:#fff2f0}
    #bvClassManager .bv-checks{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px;margin:12px 0}
    #bvClassManager .bv-checks label{padding:11px;border:1px solid #dce5f2;border-radius:11px;background:#fbfcff;display:flex;align-items:center;gap:8px;margin:0;font-size:14px}
    #bvClassManager .bv-checks input{width:auto;flex:none}
    #bvClassManager .bv-student{padding:10px 0;border-bottom:1px solid #e9edf4}
    #bvClassManager .bv-student:last-child{border:0}
    #bvClassManager .bv-student select{max-width:270px}
    #bvClassManager .bv-year .actions,#bvClassManager .bv-turma .actions{margin-top:10px}
    #bvClassManager .bv-code{padding:11px;background:#eff5ff;border-radius:9px;overflow-wrap:anywhere;font-family:monospace}
    #bvClassManager .bv-new{padding:18px;border:1px solid #dce5f0;border-radius:14px;background:#fbfcff}
    @media(max-width:640px){#bvClassManager .bv-tabs .btn{flex:1;min-width:120px}#bvClassManager .bv-year-head{align-items:flex-start}}
  </style>
  <div class="section-top"><div><h2>🏫 Gestão de turmas</h2><p class="muted">Crie, edite e organize turmas e anos em um só lugar.</p></div><button class="btn secondary sm" type="button" id="bvRefreshClasses">Atualizar</button></div>
  <div class="bv-tabs" role="group" aria-label="Opções de gestão de turmas">
    <button type="button" class="btn secondary" data-filter="active" aria-pressed="true">Turmas ativas <span id="bvActiveCount"></span></button>
    <button type="button" class="btn secondary" data-filter="archived" aria-pressed="false">📦 Arquivadas <span id="bvArchiveCount"></span></button>
    <button type="button" class="btn secondary" data-filter="create" aria-pressed="false">➕ Criar turma</button>
  </div>
  <div id="bvClassRows" class="bv-rows"></div>
  <div id="bvManagerStatus" class="notice hidden" role="status" aria-live="polite"></div>`;
  const reportPanel=document.getElementById('report-panel');
  if(reportPanel)reportPanel.before(panel);else document.getElementById('staff-view').append(panel);
  // O formulário legado permanece no DOM, mas a aba nova o substitui visualmente.
  const legacyForm=document.getElementById('new-school');
  if(legacyForm){const old=legacyForm.closest('.card');if(old)old.style.display='none';}
  // Evita controles duplicados do painel antigo. Gerar códigos já existe por ano no novo painel.
  const oldSchools=document.getElementById('schools')?.closest('.card');
  if(oldSchools)oldSchools.style.display='none';

  const $=s=>panel.querySelector(s);
  const make=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;};
  const btn=(txt,cls,click)=>{const b=make('button','btn sm '+cls,txt);b.type='button';b.addEventListener('click',click);return b;};
  const alertBox=(text,error=false)=>{const e=$('#bvManagerStatus');e.className='notice '+(error?'error':'success');e.textContent=text;e.scrollIntoView({block:'nearest',behavior:'smooth'});};
  const request=async p=>{const r=await p;if(r.error)throw r.error;return r.data;};
  const grades=[['6EF','6º ano do Ensino Fundamental'],['7EF','7º ano do Ensino Fundamental'],['8EF','8º ano do Ensino Fundamental'],['9EF','9º ano do Ensino Fundamental'],['1EM','1ª série do Ensino Médio'],['2EM','2ª série do Ensino Médio'],['3EM','3ª série do Ensino Médio']];
  const gradeLabel=(g,label)=>grades.find(x=>x[0]===g)?.[1]||label||g;
  let classes=[],sections=[],members=[],profiles=[],filter='active',opened=null,loading=false;
  const classSections=id=>sections.filter(x=>x.classroom_id===id).sort((a,b)=>grades.findIndex(x=>x[0]===a.grade_code)-grades.findIndex(x=>x[0]===b.grade_code));
  async function load(preserve){
    if(loading)return;
    loading=true;
    $('#bvRefreshClasses').disabled=true;
    try{
      [classes,sections,members,profiles]=await Promise.all([
        request(db.from('classrooms').select('id,name,description,school_code,enrollment_type,is_active').order('name')),
        request(db.from('classroom_sections').select('id,classroom_id,label,grade_code,is_active')),
        request(db.from('classroom_memberships').select('id,user_id,classroom_id,section_id,status')),
        request(db.from('profiles').select('id,full_name,display_name'))
      ]);
      if(preserve)opened=preserve;
      render();
    }catch(e){alertBox('Não foi possível atualizar as turmas: '+(e.message||e),true)}
    finally{loading=false;$('#bvRefreshClasses').disabled=false;}
  }
  function render(){
    const active=classes.filter(c=>c.is_active),archived=classes.filter(c=>!c.is_active);
    $('#bvActiveCount').textContent=`(${active.length})`;
    $('#bvArchiveCount').textContent=`(${archived.length})`;
    for(const b of panel.querySelectorAll('[data-filter]'))b.setAttribute('aria-pressed',String(b.dataset.filter===filter));
    const root=$('#bvClassRows');root.replaceChildren();
    if(filter==='create'){createForm(root);return;}
    const list=filter==='active'?active:archived;
    if(!list.length){root.append(make('p','bv-hint',filter==='archived'?'Nenhuma turma arquivada. Ao arquivar uma turma, ela ficará disponível aqui para reativação.':'Você ainda não tem turmas ativas. Use a aba Criar turma.'));return;}
    for(const c of list)root.append(classCard(c));
  }
  function createForm(root){
    const box=make('div','bv-new');
    const title=make('h3',null,'➕ Criar nova turma');
    const hint=make('p','bv-hint','Escolha o nome e quais anos escolares farão parte da turma. A matrícula será por código de acesso, sem cobrança nesta etapa.');
    const form=make('form');form.id='bvNewClassForm';
    const fields=make('div','formgrid');
    const nameWrap=make('div');const nameLabel=make('label',null,'Nome da turma / escola');const name=make('input');name.name='name';name.required=true;name.minLength=4;name.maxLength=140;name.placeholder='Ex.: Turma Preparatória 2027';nameWrap.append(nameLabel,name);
    const descWrap=make('div');const descLabel=make('label',null,'Informações (opcional)');const desc=make('input');desc.name='description';desc.maxLength=500;desc.placeholder='Ex.: Aulas de redação aos sábados';descWrap.append(descLabel,desc);
    fields.append(nameWrap,descWrap);form.append(fields);
    form.append(make('h3',null,'Selecionar anos escolares'));
    const options=make('div','bv-checks');options.setAttribute('role','group');options.setAttribute('aria-label','Anos da turma');
    grades.forEach(([code,label])=>{const wrapper=make('label');const input=make('input');input.type='checkbox';input.name='grade';input.value=code;input.checked=true;wrapper.append(input,make('span',null,label));options.append(wrapper)});form.append(options);
    const actions=make('div','actions');const all=btn('Selecionar todos','secondary',()=>options.querySelectorAll('input').forEach(x=>x.checked=true));const clear=btn('Limpar seleção','secondary',()=>options.querySelectorAll('input').forEach(x=>x.checked=false));
    const save=make('button','btn','Criar turma');save.type='submit';actions.append(all,clear,save);form.append(actions);
    form.addEventListener('submit',async e=>{
      e.preventDefault();const selected=[...options.querySelectorAll('input:checked')].map(x=>x.value);
      const n=name.value.trim(),d=desc.value.trim();
      if(n.length<4||n.length>140)return alertBox('Informe um nome entre 4 e 140 caracteres.',true);
      if(!selected.length)return alertBox('Selecione ao menos um ano escolar.',true);
      if(classes.some(c=>c.name.toLocaleLowerCase('pt-BR')===n.toLocaleLowerCase('pt-BR')))return alertBox('Já existe uma turma com esse nome.',true);
      save.disabled=true;
      try{
        const id=await request(db.rpc('bv_create_classroom_v320',{p_name:n,p_description:d,p_grade_codes:selected}));
        if(!id)throw Error('Turma não retornada pelo servidor.');
        filter='active';opened=id;await load(id);alertBox('Turma criada! Você pode editar os anos e gerar os códigos de matrícula.');
      }catch(err){alertBox('Não foi possível criar a turma: '+(err.message||err),true);save.disabled=false}
    });
    box.append(title,hint,form);root.append(box);
  }
  function classCard(c){
    const card=make('article','bv-turma'+(opened===c.id?' bv-open':''));
    const top=make('div','section-top');const info=make('div');info.append(make('div','bv-title',c.name));
    info.append(make('div','bv-muted',(c.is_active?'Ativa':'Arquivada')+' · '+classSections(c.id).length+' ano(s) · '+members.filter(m=>m.classroom_id===c.id&&m.status==='active').length+' matrícula(s) ativa(s)'));
    top.append(info);card.append(top);
    const actions=make('div','actions');
    actions.append(btn(opened===c.id?'Fechar detalhes':'✏️ Editar turma e anos','secondary',()=>{opened=opened===c.id?null:c.id;render()}));
    actions.append(btn(c.is_active?'📦 Arquivar turma':'↩ Reativar turma','warn',async()=>{
      if(!window.confirm(c.is_active?'Arquivar esta turma? Ela ficará em Turmas arquivadas, mantendo redações, notas e matrículas.':'Reativar esta turma?'))return;
      try{await request(db.from('classrooms').update({is_active:!c.is_active}).eq('id',c.id));filter=c.is_active?'archived':'active';opened=null;await load();alertBox(c.is_active?'Turma arquivada. Consulte a aba Turmas arquivadas.':'Turma reativada.');}
      catch(e){alertBox(e.message||String(e),true)}
    }));
    if(isAdmin)actions.append(btn('🗑 Excluir turma','bv-danger',async()=>{
      if(!confirm(`Excluir DEFINITIVAMENTE "${c.name}"? Isso só será possível se não houver alunos, atividades, aulas ou outros registros vinculados.`))return;
      if(prompt('Para confirmar, digite EXCLUIR:')!=='EXCLUIR')return;
      try{await request(db.rpc('bv_delete_empty_classroom_v320',{p_classroom_id:c.id}));opened=null;await load();alertBox('Turma vazia excluída definitivamente.');}
      catch(e){alertBox('Exclusão bloqueada: '+(e.message||e)+' Arquive a turma para preservar o histórico.',true)}
    }));
    card.append(actions);
    if(opened===c.id){const details=make('div','bv-details');details.append(editForm(c),gradeManager(c),studentManager(c));card.append(details)}
    return card;
  }
  function editForm(c){
    const form=make('form');form.append(make('h3',null,'Informações da turma'));
    const grid=make('div','formgrid');
    const nameWrap=make('div'),nameLab=make('label',null,'Nome da turma'),name=make('input');name.value=c.name;name.maxLength=140;name.minLength=4;name.required=true;nameWrap.append(nameLab,name);
    const descWrap=make('div'),descLab=make('label',null,'Descrição / informações'),desc=make('input');desc.value=c.description||'';desc.maxLength=500;descWrap.append(descLab,desc);
    grid.append(nameWrap,descWrap);form.append(grid);
    const submit=make('button','btn','Salvar informações');submit.type='submit';form.append(submit);
    form.onsubmit=async e=>{
      e.preventDefault();const n=name.value.trim(),d=desc.value.trim();
      if(n.length<4)return alertBox('O nome precisa ter pelo menos 4 caracteres.',true);
      submit.disabled=true;
      try{await request(db.from('classrooms').update({name:n,description:d}).eq('id',c.id));await load(c.id);alertBox('Informações da turma atualizadas.');}
      catch(err){alertBox(err.message||String(err),true);submit.disabled=false}
    };
    return form;
  }
  function gradeManager(c){
    const root=make('div','bv-details');root.append(make('h3',null,'📚 Anos escolares desta turma'));
    const ss=classSections(c.id);
    if(!ss.length)root.append(make('p','bv-hint',c.enrollment_type==='paid_invite'?'Esta é uma turma com acesso por convite, sem divisão escolar obrigatória.':'Esta turma não possui anos escolares. Adicione um abaixo.'));
    for(const s of ss){
      const row=make('div','bv-year');const head=make('div','bv-year-head');
      const name=make('strong',null,gradeLabel(s.grade_code,s.label));const state=make('span','pill'+(s.is_active?'':' off'),s.is_active?'Ativo':'Pausado');head.append(name,state);row.append(head);
      const actions=make('div','actions');
      actions.append(btn(s.is_active?'Pausar ano':'Reativar ano','warn',async()=>{
        if(!confirm((s.is_active?'Pausar':'Reativar')+' '+gradeLabel(s.grade_code,s.label)+'? Matrículas e redações serão preservadas.'))return;
        try{await request(db.from('classroom_sections').update({is_active:!s.is_active}).eq('id',s.id));await load(c.id);alertBox('Situação do ano atualizada.');}
        catch(e){alertBox(e.message||String(e),true)}
      }));
      if(c.is_active && s.is_active && c.enrollment_type==='free_code')actions.append(btn('Gerar código de matrícula','secondary',async()=>{
        if(!confirm('Gerar novo código para '+gradeLabel(s.grade_code,s.label)+'? Códigos anteriores deixarão de funcionar.'))return;
        try{
          const code=await request(db.rpc('generate_section_code',{p_section_id:s.id}));
          const old=row.querySelector('.bv-code');old?.remove();
          const box=make('div','bv-code','Código único: '+String(code));
          box.append(btn('Copiar código','secondary',async()=>{try{await navigator.clipboard.writeText(String(code));alertBox('Código copiado.')}catch{alertBox('Selecione e copie o código exibido.',true)}}));
          row.append(box);
        }catch(e){alertBox(e.message||String(e),true)}
      }));
      if(isAdmin)actions.append(btn('🗑 Excluir ano','bv-danger',async()=>{
        const label=gradeLabel(s.grade_code,s.label);
        if(!confirm(`Excluir DEFINITIVAMENTE ${label} de "${c.name}"? Somente anos sem histórico podem ser excluídos.`))return;
        if(prompt('Para confirmar a exclusão deste ano, digite EXCLUIR:')!=='EXCLUIR')return;
        try{await request(db.rpc('bv_delete_empty_section_v320',{p_section_id:s.id}));await load(c.id);alertBox(label+' excluído com segurança.');}
        catch(e){alertBox('Exclusão bloqueada: '+(e.message||e)+' Você pode pausar o ano sem apagar o histórico.',true)}
      }));
      row.append(actions);root.append(row);
    }
    const missing=grades.filter(x=>!ss.some(s=>s.grade_code===x[0]));
    if(missing.length && c.enrollment_type==='free_code'){
      const add=make('div','bv-hint');add.append(make('strong',null,'Adicionar outro ano escolar'));
      const form=make('form','actions');const select=make('select');select.setAttribute('aria-label','Escolha um ano para adicionar');select.style.maxWidth='310px';
      missing.forEach(([code,label])=>select.append(new Option(label,code)));
      const submit=make('button','btn sm','Adicionar ano');submit.type='submit';form.append(select,submit);
      form.onsubmit=async ev=>{
        ev.preventDefault();const pair=grades.find(x=>x[0]===select.value);if(!pair)return;
        submit.disabled=true;
        try{await request(db.from('classroom_sections').insert({classroom_id:c.id,grade_code:pair[0],label:pair[1],is_active:true}));await load(c.id);alertBox('Ano escolar adicionado.');}
        catch(e){alertBox(e.message||String(e),true);submit.disabled=false}
      };
      add.append(form);root.append(add);
    }
    return root;
  }
  function studentManager(c){
    const box=make('div','bv-details');box.append(make('h3',null,'👥 Alunos matriculados'));
    const enrolled=members.filter(m=>m.classroom_id===c.id);
    if(!enrolled.length){box.append(make('p','bv-muted','Ainda não há matrículas nesta turma.'));return box;}
    for(const m of enrolled){
      const row=make('div','bv-student');const prof=profiles.find(p=>p.id===m.user_id);
      row.append(make('strong',null,prof?.full_name||prof?.display_name||'Aluno cadastrado'));
      row.append(make('p','bv-muted',m.status==='active'?'Matrícula ativa':'Matrícula desativada'));
      const actions=make('div','actions');const select=make('select');select.setAttribute('aria-label','Alterar série do aluno');select.append(new Option('Sem ano escolar',''));
      classSections(c.id).forEach(s=>select.append(new Option(gradeLabel(s.grade_code,s.label),s.id)));
      select.value=m.section_id||'';
      actions.append(select);
      actions.append(btn('Salvar ano','secondary',async()=>{
        if(!confirm('Alterar o ano escolar deste estudante?'))return;
        try{await request(db.from('classroom_memberships').update({section_id:select.value||null}).eq('id',m.id));await load(c.id);alertBox('Ano do estudante atualizado.');}
        catch(e){alertBox(e.message||String(e),true)}
      }));
      actions.append(btn(m.status==='active'?'Desativar matrícula':'Reativar matrícula','warn',async()=>{
        if(!confirm('Alterar a matrícula? Redações, notas e histórico permanecerão salvos.'))return;
        try{await request(db.from('classroom_memberships').update({status:m.status==='active'?'inactive':'active'}).eq('id',m.id));await load(c.id);alertBox('Matrícula atualizada.');}
        catch(e){alertBox(e.message||String(e),true)}
      }));
      row.append(actions);box.append(row);
    }
    return box;
  }
  panel.addEventListener('click',e=>{
    const b=e.target.closest('button[data-filter]');if(!b)return;
    filter=b.dataset.filter;opened=null;render();
  });
  $('#bvRefreshClasses').onclick=()=>load();
  await load();
})();
