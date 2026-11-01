/* BoniVerso 3.1 — Gestão de turmas clara e segura.
   Substitui boniverso-gestao-turmas-v300.js. Não mexe no ícone principal. */
(async()=>{
'use strict';
const cfg=window.BONIVERSO_CONFIG||{};
if(!cfg.supabaseUrl||!cfg.supabasePublishableKey||!document.getElementById('staff-view'))return;
const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.2');
const db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const auth=await db.auth.getUser();if(!auth.data?.user)return;
const rr=await db.rpc('current_staff_role');if(rr.error||!['admin','teacher'].includes(rr.data))return;
const admin=rr.data==='admin';
const old=document.querySelector('#bvClassManager');if(old)old.remove();
const panel=document.createElement('section');panel.className='card spaced';panel.id='bvClassManager';
panel.innerHTML=`<style>
#bvClassManager .bv-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:15px 0}#bvClassManager .bv-tabs button[aria-pressed=true]{background:#132d58;color:white}
#bvClassManager .bv-rows{display:grid;gap:12px}#bvClassManager .bv-turma{border:1px solid #dce4f1;border-radius:14px;padding:15px;background:#fff}
#bvClassManager .bv-turma[aria-expanded=true]{border-color:#396ec6;box-shadow:0 4px 16px #243f6f18}
#bvClassManager .bv-title{font-size:16px;color:#172c4b;font-weight:800;overflow-wrap:anywhere}
#bvClassManager .bv-details{margin-top:14px;padding-top:14px;border-top:1px solid #e5eaf4}
#bvClassManager .bv-help{background:#f3f6fb;border-radius:10px;padding:12px;color:#405a79;font-size:13px;margin:10px 0}
#bvClassManager .bv-danger{background:#fff;color:#a12e2e;border-color:#dba9a9}#bvClassManager .bv-danger:hover{background:#fff0ef}
#bvClassManager .bv-muted{color:#657894;font-size:13px}#bvClassManager .bv-student-row{padding:10px;border-bottom:1px solid #e6eaf1}
#bvClassManager .bv-student-row:last-child{border:0}
</style>
<div class="section-top"><div><h2>🏫 Gerenciar turmas</h2><p class="muted">Ações dentro de cada turma, com separação das arquivadas.</p></div><button class="btn secondary sm" id="bvRefreshClasses" type="button">Atualizar</button></div>
<div class="bv-tabs"><button class="btn secondary" type="button" data-filter="active" aria-pressed="true">Turmas ativas <span id="bvActiveCount"></span></button><button class="btn secondary" type="button" data-filter="archived" aria-pressed="false">📦 Turmas arquivadas <span id="bvArchiveCount"></span></button></div>
<div id="bvClassRows" class="bv-rows"></div><div id="bvManagerStatus" class="notice hidden" role="status"></div>`;
const target=document.getElementById('report-panel');if(target)target.before(panel);else document.getElementById('staff-view').append(panel);
const $=s=>panel.querySelector(s);const msg=(s,bad=false)=>{const e=$('#bvManagerStatus');e.className='notice '+(bad?'error':'success');e.textContent=s;e.scrollIntoView({block:'nearest'});};
let classes=[],sections=[],members=[],profiles=[],filter='active',opened=null;
const request=async q=>{const r=await q;if(r.error)throw r.error;return r.data||[];};
const node=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el;};
const button=(title,cls,cb)=>{const b=node('button','btn sm '+cls,title);b.type='button';b.onclick=cb;return b;};
const saveForm=(c,content)=>{
 const form=node('form','bv-details');const fields=node('div','formgrid');
 for(const [label,key,max] of [['Nome da turma','name',140],['Informações / descrição','description',500]]){
  const wrap=node('div');const lab=node('label',null,label);const input=node('input');input.name=key;input.value=c[key]||'';input.maxLength=max;input.required=key==='name';wrap.append(lab,input);fields.append(wrap);
 }
 form.append(fields);form.append(button('Salvar alterações','',()=>form.requestSubmit()));
 form.onsubmit=async e=>{e.preventDefault();const name=form.elements.name.value.trim(),description=form.elements.description.value.trim();if(name.length<3)return msg('O nome deve ter pelo menos 3 caracteres.',true);
 const btn=form.querySelector('button');btn.disabled=true;try{await request(db.from('classrooms').update({name,description}).eq('id',c.id));msg('Turma atualizada.');await load(c.id)}catch(err){msg(err.message,true)}finally{btn.disabled=false}};
 const enrolled=members.filter(m=>m.classroom_id===c.id);
 form.append(node('h3',null,'Alunos matriculados'));
 form.append(node('p','bv-muted','As matrículas e as notas são preservadas quando você arquiva uma turma.'));
 if(!enrolled.length)form.append(node('p','bv-muted','Nenhum aluno vinculado a esta turma.'));
 for(const m of enrolled){const row=node('div','bv-student-row');const p=profiles.find(x=>x.id===m.user_id);row.append(node('strong',null,p?.full_name||p?.display_name||'Aluno cadastrado'));
 const opts=sections.filter(s=>s.classroom_id===c.id),select=node('select');select.setAttribute('aria-label','Série do aluno');select.append(new Option('Sem série',''));opts.forEach(s=>select.append(new Option(s.label||s.grade_code,s.id)));select.value=m.section_id||'';
 const tools=node('div','actions');tools.append(select,button('Salvar série','secondary',async()=>{if(!confirm('Alterar série deste aluno?'))return;try{await request(db.from('classroom_memberships').update({section_id:select.value||null}).eq('id',m.id));msg('Série atualizada.');await load(c.id)}catch(e){msg(e.message,true)}}),button(m.status==='active'?'Desativar matrícula':'Reativar matrícula','warn',async()=>{const next=m.status==='active'?'inactive':'active';if(!confirm('Alterar situação da matrícula? O histórico será preservado.'))return;try{await request(db.from('classroom_memberships').update({status:next}).eq('id',m.id));msg('Matrícula atualizada.');await load(c.id)}catch(e){msg(e.message,true)}}));row.append(tools);form.append(row);}
 content.append(form);
};
function render(){const active=classes.filter(c=>c.is_active),archived=classes.filter(c=>!c.is_active);$('#bvActiveCount').textContent='('+active.length+')';$('#bvArchiveCount').textContent='('+archived.length+')';for(const b of panel.querySelectorAll('[data-filter]'))b.setAttribute('aria-pressed',String(b.dataset.filter===filter));
 const rows=$('#bvClassRows');rows.replaceChildren();const list=filter==='active'?active:archived;
 if(!list.length){rows.append(node('p','bv-help',filter==='archived'?'Não há turmas arquivadas. Quando arquivadas, elas aparecem aqui e podem ser reativadas.':'Não há turmas ativas. Consulte a aba de turmas arquivadas.'));return;}
 for(const c of list){const card=node('article','bv-turma');card.setAttribute('aria-expanded',String(opened===c.id));const head=node('div','section-top');const title=node('div');title.append(node('div','bv-title',c.name),node('div','bv-muted',c.is_active?'Turma ativa':'Turma arquivada — histórico preservado'));head.append(title);card.append(head);
 const actions=node('div','actions');actions.append(button(opened===c.id?'Fechar detalhes':'✏️ Editar turma e alunos','secondary',()=>{opened=opened===c.id?null:c.id;render()}));
 actions.append(button(c.is_active?'📦 Arquivar turma':'↩ Reativar turma','warn',async()=>{if(!confirm(c.is_active?'Arquivar esta turma? Ela será movida para a aba Turmas arquivadas, preservando alunos, redações e notas.':'Reativar esta turma?'))return;try{await request(db.from('classrooms').update({is_active:!c.is_active}).eq('id',c.id));filter=c.is_active?'archived':'active';opened=null;msg(c.is_active?'Turma arquivada. Você a encontra na aba Turmas arquivadas.':'Turma reativada.');await load()}catch(e){msg(e.message,true)}}));
 actions.append(button('🗑 Excluir turma','bv-danger',()=>{if(!admin){msg('A exclusão definitiva é reservada ao administrador geral.',true);return;}const m=members.filter(x=>x.classroom_id===c.id).length,s=sections.filter(x=>x.classroom_id===c.id).length;alert(`Exclusão definitiva indisponível para proteção do histórico escolar. Esta turma possui ${m} matrícula(s) e ${s} série(s) vinculada(s). Também pode possuir redações, aulas e arquivos. Use “Arquivar turma” para removê-la das turmas ativas, sem apagar dados.`);}));card.append(actions);
 if(opened===c.id){const d=node('div');d.append(node('p','bv-help','Editar os dados abaixo afeta apenas esta turma. Exclusão permanente não remove automaticamente registros vinculados.'));saveForm(c,d);card.append(d)}rows.append(card);
 }
}
async function load(keep){try{[classes,sections,members,profiles]=await Promise.all([request(db.from('classrooms').select('id,name,description,is_active,enrollment_type').order('name')),request(db.from('classroom_sections').select('id,classroom_id,label,grade_code,is_active')),request(db.from('classroom_memberships').select('id,classroom_id,user_id,section_id,status')),request(db.from('profiles').select('id,display_name,full_name'))]);if(keep)opened=keep;render()}catch(e){msg('Falha ao carregar turmas: '+e.message,true)}}
panel.addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(b){filter=b.dataset.filter;opened=null;render()}});$('#bvRefreshClasses').onclick=()=>load();await load();
})();
