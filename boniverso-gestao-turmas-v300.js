/* BoniVerso v3.0 - gestão segura de turmas. Colocar somente em turmas.html.
   Nunca embute chaves administrativas: Supabase Auth + RLS validam cada operação. */
(async () => {
  'use strict';
  const cfg=window.BONIVERSO_CONFIG||{};
  if(!cfg.supabaseUrl||!cfg.supabasePublishableKey||!document.getElementById('staff-view'))return;
  const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.2');
  const db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  const auth=await db.auth.getUser();if(!auth.data?.user)return;
  const roleResult=await db.rpc('current_staff_role');
  if(roleResult.error||!['teacher','admin'].includes(roleResult.data))return;
  const admin=roleResult.data==='admin';
  const panel=document.createElement('section');panel.className='card spaced';panel.id='bvClassManager';
  panel.innerHTML=`<div class="section-top"><h2>⚙️ Gestão de turmas e matrículas</h2><button class="btn secondary sm" id="bvRefreshClasses" type="button">Atualizar</button></div>
  <p class="muted">Editar informações, consultar alunos e ajustar matrículas. Arquivar preserva notas e redações.</p>
  <div class="field"><label for="bvClassSelect">Turma / escola</label><select id="bvClassSelect"></select></div>
  <form id="bvEditClass"><div class="formgrid"><div><label for="bvClassName">Nome da turma</label><input id="bvClassName" required minlength="3" maxlength="140"></div><div><label for="bvClassDesc">Informações</label><input id="bvClassDesc" maxlength="500"></div></div><div class="actions"><button class="btn" type="submit">Salvar informações</button><button type="button" class="btn warn" id="bvArchiveClass">Arquivar turma</button></div></form>
  <h3 style="margin-top:24px">Alunos matriculados</h3><p class="hint">Para alterações, selecione a série correspondente e salve. Remover matrícula não exclui a conta do aluno nem suas redações.</p>
  <div class="scroll"><table><thead><tr><th>Aluno</th><th>Série</th><th>Situação</th><th>Ações</th></tr></thead><tbody id="bvMembers"></tbody></table></div>
  <div id="bvManagerStatus" class="notice hidden" role="status"></div>`;
  const target=document.getElementById('report-panel');
  if(target)target.before(panel);else document.getElementById('staff-view').append(panel);
  const $=s=>panel.querySelector(s);
  const msg=(str,err=false)=>{const e=$('#bvManagerStatus');e.className='notice '+(err?'error':'success');e.textContent=str;};
  let classes=[],sections=[],members=[],profiles=[];
  async function request(query){const r=await query;if(r.error)throw r.error;return r.data||[];}
  async function load(){
    try{
      [classes,sections,members,profiles]=await Promise.all([
        request(db.from('classrooms').select('id,name,description,is_active,enrollment_type').order('name')),
        request(db.from('classroom_sections').select('id,classroom_id,label,grade_code,is_active')),
        request(db.from('classroom_memberships').select('id,classroom_id,user_id,section_id,status')),
        request(db.from('profiles').select('id,display_name,full_name'))
      ]);
      const select=$('#bvClassSelect'),old=select.value;
      select.replaceChildren(...classes.map(c=>new Option(c.name+(c.is_active?'':' (arquivada)'),c.id)));
      if(classes.some(c=>c.id===old))select.value=old;
      render();
    }catch(e){msg('Falha ao atualizar turmas: '+e.message,true)}
  }
  function render(){
    const id=$('#bvClassSelect').value,c=classes.find(x=>x.id===id);
    if(!c)return;
    $('#bvClassName').value=c.name;$('#bvClassDesc').value=c.description||'';
    $('#bvArchiveClass').textContent=c.is_active?'Arquivar turma':'Reativar turma';
    const body=$('#bvMembers');body.replaceChildren();
    for(const m of members.filter(x=>x.classroom_id===id)){
      const tr=document.createElement('tr');
      const userCell=document.createElement('td');const prof=profiles.find(p=>p.id===m.user_id);userCell.textContent=prof?.full_name||prof?.display_name||('Aluno '+m.user_id.slice(0,8));
      const seriesCell=document.createElement('td');const combo=document.createElement('select');combo.setAttribute('aria-label','Série do aluno');
      combo.append(new Option('Sem série',''));
      sections.filter(s=>s.classroom_id===id&&s.is_active).forEach(s=>combo.add(new Option(s.label||s.grade_code,s.id)));
      combo.value=m.section_id||'';seriesCell.append(combo);
      const status=document.createElement('td');status.textContent=m.status;
      const actions=document.createElement('td');const save=document.createElement('button');save.type='button';save.className='btn sm secondary';save.textContent='Salvar série';
      save.addEventListener('click',async()=>{if(!confirm('Alterar a série deste aluno?'))return;save.disabled=true;try{await request(db.from('classroom_memberships').update({section_id:combo.value||null}).eq('id',m.id));msg('Série atualizada.');await load()}catch(e){msg(e.message,true)}finally{save.disabled=false}});
      actions.append(save);
      const remove=document.createElement('button');remove.type='button';remove.className='btn sm warn';remove.textContent=m.status==='active'?'Desativar':'Reativar';remove.style.marginLeft='6px';
      remove.addEventListener('click',async()=>{const next=m.status==='active'?'inactive':'active';if(!confirm((next==='inactive'?'Desativar':'Reativar')+' matrícula? O histórico do aluno será preservado.'))return;remove.disabled=true;try{await request(db.from('classroom_memberships').update({status:next}).eq('id',m.id));msg('Matrícula atualizada.');await load()}catch(e){msg(e.message,true)}finally{remove.disabled=false}});
      actions.append(remove);tr.append(userCell,seriesCell,status,actions);body.append(tr);
    }
    if(!body.childElementCount){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=4;td.textContent='Nenhum aluno matriculado.';tr.append(td);body.append(tr)}
  }
  $('#bvClassSelect').addEventListener('change',render);
  $('#bvRefreshClasses').addEventListener('click',load);
  $('#bvEditClass').addEventListener('submit',async e=>{e.preventDefault();const id=$('#bvClassSelect').value,name=$('#bvClassName').value.trim(),description=$('#bvClassDesc').value.trim();if(name.length<3)return msg('Informe um nome com pelo menos 3 caracteres.',true);const b=e.target.querySelector('[type=submit]');b.disabled=true;try{await request(db.from('classrooms').update({name,description}).eq('id',id));msg('Informações atualizadas com sucesso.');await load()}catch(err){msg(err.message,true)}finally{b.disabled=false}});
  $('#bvArchiveClass').addEventListener('click',async e=>{const id=$('#bvClassSelect').value,c=classes.find(x=>x.id===id);if(!c)return;if(!confirm(c.is_active?'Arquivar esta turma? As matrículas e redações serão preservadas.':'Reativar esta turma?'))return;e.target.disabled=true;try{await request(db.from('classrooms').update({is_active:!c.is_active}).eq('id',id));msg('Situação da turma atualizada.');await load()}catch(err){msg(err.message,true)}finally{e.target.disabled=false}});
  await load();
})();
