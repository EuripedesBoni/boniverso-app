/* BoniVerso · Gestão de cursos v1 (2026-11-02)
   Painel administrativo, sem alteração de matrículas, notas ou conteúdos.
   O banco valida novamente privilégios, vínculos e operações em RPCs restritas.
*/
(() => {
  'use strict';
  const app = document.getElementById('app');
  if (!app) return;
  const config = window.BONIVERSO_CONFIG || {};
  if (!config.supabaseUrl || !config.supabasePublishableKey) return;
  const css = document.createElement('style');
  css.textContent = `
    #view.bv-admin-editor > .two-cols{grid-template-columns:minmax(0,1fr)!important}
    #view.bv-admin-editor > .two-cols > .panel:nth-child(2){display:none!important}
    #bvCourseManagerV1{min-width:0;margin:24px 0 4px;padding:22px;border-radius:20px;background:#fff;border:1px solid #d9e5f5;box-shadow:0 8px 28px rgba(17,45,87,.05)}
    #bvCourseManagerV1 *{box-sizing:border-box}
    #bvCourseManagerV1 h2{font-size:22px;letter-spacing:-.4px;color:#162f52;margin:0 0 8px}
    #bvCourseManagerV1 p{line-height:1.5;color:#667f9f;font-size:13px;margin:0}
    #bvCourseManagerV1 .bv-cmgr-toolbar{display:grid;grid-template-columns:minmax(0,1fr) minmax(170px,250px) auto;gap:10px;margin:19px 0 8px;align-items:end}
    #bvCourseManagerV1 .bv-cmgr-field{display:grid;gap:6px;min-width:0}
    #bvCourseManagerV1 label{font-size:12px;font-weight:750;color:#294969}
    #bvCourseManagerV1 input,#bvCourseManagerV1 textarea,#bvCourseManagerV1 select{width:100%;min-width:0;padding:11px 13px;border:1px solid #cbd8eb;border-radius:10px;background:#fff;color:#193553;font:inherit;font-size:14px}
    #bvCourseManagerV1 textarea{min-height:90px;resize:vertical}
    #bvCourseManagerV1 button{font:inherit;font-size:13px;font-weight:700;min-height:42px;border-radius:10px;border:1px solid #cad9ea;background:#f8fbff;color:#204a85;padding:10px 13px;cursor:pointer}
    #bvCourseManagerV1 button.primary{background:#2e6bd1;border-color:#2e6bd1;color:#fff}
    #bvCourseManagerV1 button.danger{background:#fff7f6;border-color:#ecc4c1;color:#ab3532}
    #bvCourseManagerV1 button:disabled{opacity:.48;cursor:not-allowed}
    #bvCourseManagerV1 .bv-cmgr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:15px}
    #bvCourseManagerV1 .bv-cmgr-card{min-width:0;border:1px solid #dce6f2;border-radius:15px;padding:17px;background:#fbfcff;display:grid;align-content:start;gap:11px}
    #bvCourseManagerV1 .bv-cmgr-card h3{color:#152e50;font-size:16px;line-height:1.4;margin:0;overflow-wrap:anywhere}
    #bvCourseManagerV1 .bv-cmgr-meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center;color:#68809d;font-size:12px}
    #bvCourseManagerV1 .bv-cmgr-tag{display:inline-flex;background:#eaf2ff;color:#2d5897;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:750}
    #bvCourseManagerV1 .bv-cmgr-tag.warn{background:#fff3e7;color:#99591f}
    #bvCourseManagerV1 .bv-cmgr-tag.danger{background:#fff0ed;color:#9a3730}
    #bvCourseManagerV1 .bv-cmgr-tag.good{background:#e6f6ee;color:#1c7552}
    #bvCourseManagerV1 .bv-cmgr-actions{display:flex;gap:8px;flex-wrap:wrap}
    #bvCourseManagerV1 .bv-cmgr-actions > *{flex:1 1 auto;display:inline-flex;justify-content:center;align-items:center;text-align:center;text-decoration:none;line-height:1.3}
    #bvCourseManagerV1 .bv-cmgr-tip{font-size:12px;color:#85632c;background:#fff8ea;border:1px solid #f0dfba;border-radius:10px;padding:10px 12px}
    #bvCourseManagerV1 .bv-cmgr-message{border-radius:12px;border:1px solid #cbd9eb;background:#eff5fd;color:#315a89;padding:12px;margin-top:15px;font-size:13px}
    #bvCourseManagerV1 .bv-cmgr-message.error{background:#fff2f0;border-color:#e7bbb8;color:#a43c37}
    #bvCourseManagerV1 .bv-cmgr-edit{display:grid;gap:11px;border-top:1px solid #dce5f2;padding-top:12px}
    #bvCourseManagerV1 .bv-cmgr-edit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    #bvCourseManagerV1 .bv-cmgr-checkbox{display:flex;align-items:center;gap:9px}
    #bvCourseManagerV1 .bv-cmgr-checkbox input{width:20px;height:20px;flex:none}
    #bvCourseManagerV1 .bv-cmgr-toolbar button{white-space:nowrap}
    #bvCourseManagerV1 :is(button,a,input,textarea,select):focus-visible{outline:3px solid #88b6f4;outline-offset:2px}
    @media(max-width:1150px){#bvCourseManagerV1 .bv-cmgr-grid{grid-template-columns:minmax(0,1fr)}}
    @media(max-width:650px){#bvCourseManagerV1{padding:16px 13px}#bvCourseManagerV1 .bv-cmgr-toolbar{grid-template-columns:1fr}#bvCourseManagerV1 .bv-cmgr-edit-grid{grid-template-columns:1fr}#bvCourseManagerV1 .bv-cmgr-actions > *{flex:1 1 100%}}
  `;
  document.head.append(css);

  let dbPromise = null;
  let currentPanel = null;
  let courses = [], links = [], counts = {};
  let busy = false;
  const make = (tag, content, className) => {
    const el = document.createElement(tag);
    if (content !== undefined && content !== null) el.textContent = String(content);
    if (className) el.className = className;
    return el;
  };
  const request = async p => {const r = await p;if(r.error)throw r.error;return r.data;};
  async function client() {
    if (window.BONIVERSO_DB) return window.BONIVERSO_DB;
    if(!dbPromise)dbPromise=import('https://esm.sh/@supabase/supabase-js@2.57.2').then(({createClient}) => createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
    return dbPromise;
  }
  const formatPrice = c => c.is_free ? 'Gratuito' : Number(c.price_cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const normalize = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function byId(id){return courses.find(x=>x.id===id);}
  function linked(id){return links.filter(x=>x.paid_course_id===id);}
  function courseStatus(c){return c.deleted_at?'excluded':!c.published?'draft':c.visibility==='private'?'private':'published';}
  function statusText(status){return ({excluded:'Excluído · restaurável',draft:'Não publicado',private:'Publicado · privado',published:'Publicado · catálogo'})[status]||status;}
  function message(txt,isError=false){
    const box=currentPanel?.querySelector('.bv-cmgr-message');if(!box)return;
    box.textContent=txt;box.classList.toggle('error',isError);
  }
  function setBusy(value){busy=value;currentPanel?.querySelectorAll('button').forEach(x=>{x.disabled=busy||x.dataset.forbidden==='1';});}
  function field(label,value,tag='input',type='text'){
    const wrap=make('div',null,'bv-cmgr-field');
    const lbl=make('label',label);const control=make(tag);
    if(tag==='input')control.type=type;
    control.value=value??'';wrap.append(lbl,control);return {wrap,control};
  }
  function button(label,cls,action,disabled=false){
    const el=make('button',label,cls||'');el.type='button';
    if(disabled){el.disabled=true;el.dataset.forbidden='1';}
    else if(action)el.addEventListener('click',action);
    return el;
  }
  async function load(){
    if(!currentPanel?.isConnected)return;
    if(busy)return;
    const db=await client();
    message('Atualizando cursos e recursos…');
    try{
      const result=await Promise.all([
        request(db.from('courses').select('id,title,category,summary,price_cents,is_free,published,visibility,deleted_at,updated_at').order('title')),
        request(db.from('classrooms').select('id,name,paid_course_id,is_active,deleted_at'))
      ]);
      courses=result[0]||[];links=result[1]||[];
      const extra=[
        ['lessons','lessons'],['assignments','assignments'],
        ['resources','boniverso_learning_resources'],['videos','boniverso_course_videos']
      ];
      counts={};
      await Promise.all(extra.map(async ([name,table])=>{
        try{
          const rows=await request(db.from(table).select('course_id').limit(1500));
          for(const item of rows||[]){if(!item.course_id)continue;const c=counts[item.course_id]||(counts[item.course_id]={});c[name]=(c[name]||0)+1;}
        }catch(e){/* Contagem opcional: não ocultar o catálogo. */}
      }));
      render();
      message('Cursos atualizados. Nenhum curso ou matrícula foi alterado.');
    }catch(err){message('Não foi possível consultar os cursos: '+(err.message||String(err)),true);}
  }
  async function execute(id,action){
    const c=byId(id);if(!c||busy)return;
    const classroom=linked(c.id);
    if((action==='exclude'||action==='pause')&&classroom.length){message('Este curso está vinculado a uma turma; mantenha seu acesso enquanto o vínculo existir.',true);return;}
    let typed=null;
    if(action==='exclude'){
      typed=window.prompt('Para EXCLUIR DO APLICATIVO (sem apagar o histórico), digite o nome exato do curso:\n'+c.title);
      if(typed===null)return;
      if(typed.trim()!==c.title){message('O nome informado não corresponde ao curso. Nada foi excluído.',true);return;}
      if(!window.confirm('Confirma retirar o curso da interface e suspender seu acesso? Aulas, arquivos e redações serão preservados e o curso poderá ser restaurado.'))return;
    }else if(action==='restore'){
      if(!window.confirm('Restaurar o curso “'+c.title+'” e seu estado anterior de publicação?'))return;
    }else if(action==='pause'){
      if(!window.confirm('Pausar a publicação de “'+c.title+'”? Os alunos deixarão de acessar seu conteúdo até a republicação.'))return;
    }else if(action==='publish'){
      if(!window.confirm('Publicar “'+c.title+'” com a visibilidade configurada para o curso?'))return;
    }
    const db=await client();setBusy(true);
    try{
      await request(db.rpc('bv_admin_course_action_v1',{p_course_id:c.id,p_action:action,p_confirm_title:typed}));
      setBusy(false);await load();
      message(({exclude:'Curso excluído da interface. Histórico preservado.',restore:'Curso restaurado.',pause:'Publicação pausada.',publish:'Curso publicado.'})[action]);
    }catch(err){setBusy(false);message('Ação não concluída: '+(err.message||String(err)),true);}
  }
  function editForm(c,card){
    const former=card.querySelector('.bv-cmgr-edit');if(former){former.remove();return;}
    const form=make('form',null,'bv-cmgr-edit');
    const fTitle=field('Nome do curso',c.title);
    const fCat=field('Categoria',c.category);
    const fSummary=field('Descrição',c.summary,'textarea');
    const fPrice=field('Preço em R$',(c.price_cents/100).toFixed(2),'input','number');fPrice.control.min='0';fPrice.control.max='1000000';fPrice.control.step='0.01';
    const priceRow=make('div',null,'bv-cmgr-edit-grid');priceRow.append(fPrice.wrap);
    const freeWrap=make('label',null,'bv-cmgr-checkbox');const free=make('input');free.type='checkbox';free.checked=c.is_free;freeWrap.append(free,make('span','Curso gratuito'));
    const visibility=field('Visibilidade',c.visibility,'select');
    for(const [value,label] of [['catalog','Catálogo público'],['private','Privado — acesso por matrícula']]){
      const o=new Option(label,value);visibility.control.append(o);
    }visibility.control.value=c.visibility;
    const tied=linked(c.id).length>0;
    if(tied){free.disabled=true;visibility.control.disabled=true;}
    const fields=make('div',null,'bv-cmgr-edit-grid');fields.append(fTitle.wrap,fCat.wrap,fSummary.wrap,visibility.wrap);
    const footer=make('div',null,'bv-cmgr-actions');
    const save=make('button','Salvar alterações','primary');save.type='submit';
    footer.append(save,button('Cancelar edição','',()=>form.remove()));
    form.append(fields,priceRow,freeWrap,footer);
    form.addEventListener('submit',async e=>{
      e.preventDefault();if(busy)return;
      const title=fTitle.control.value.trim(),category=fCat.control.value.trim(),summary=fSummary.control.value.trim();
      const amount=Number(fPrice.control.value);
      if(title.length<3||title.length>140||category.length<2||category.length>60||summary.length>500||!Number.isFinite(amount)||amount<0||amount>1000000){message('Confira os campos: nome, categoria, descrição e valor.',true);return;}
      if(!window.confirm('Salvar as alterações do curso “'+c.title+'”?'))return;
      setBusy(true);
      try{
        const db=await client();
        await request(db.rpc('bv_admin_update_course_v1',{
          p_course_id:c.id,p_title:title,p_category:category,p_summary:summary,
          p_price_cents:Math.round(amount*100),p_is_free:free.checked,p_visibility:visibility.control.value
        }));
        setBusy(false);await load();message('Dados do curso salvos com sucesso.');
      }catch(err){setBusy(false);message('Não foi possível editar o curso: '+(err.message||String(err)),true);}
    });
    card.append(form);fTitle.control.focus();
  }
  function render(){
    const panel=currentPanel;if(!panel?.isConnected)return;
    const grid=panel.querySelector('.bv-cmgr-grid');const search=panel.querySelector('#bvCmgrSearch').value;
    const status=panel.querySelector('#bvCmgrFilter').value;
    const matches=courses.filter(c=>{
      const s=courseStatus(c);
      const ok=(status==='all' && s!=='excluded') || (status===s) || (status==='all-including-deleted');
      return ok&&normalize(c.title+' '+c.category).includes(normalize(search));
    });
    panel.querySelector('#bvCmgrCount').textContent=matches.length+' curso(s) exibido(s) · '+courses.filter(c=>c.deleted_at).length+' excluído(s) restaurável(is)';
    grid.replaceChildren();
    if(!matches.length){grid.append(make('p','Nenhum curso corresponde à pesquisa ou ao filtro.'));return;}
    for(const c of matches){
      const state=courseStatus(c),classrooms=linked(c.id);const card=make('article',null,'bv-cmgr-card');
      const h=make('h3',c.title);card.append(h);
      const meta=make('div',null,'bv-cmgr-meta');
      const badge=make('span',statusText(state),'bv-cmgr-tag '+(state==='excluded'?'danger':state==='draft'?'warn':state==='published'?'good':''));
      meta.append(badge,make('span',c.category+' · '+formatPrice(c)));
      card.append(meta);
      const ct=counts[c.id]||{};
      card.append(make('p',
        `${ct.lessons??0} aula(s) · ${ct.assignments??0} atividade(s) · ${ct.resources??0} material(is) · ${ct.videos??0} vídeo(s)`
      ));
      if(classrooms.length) card.append(make('div','🔒 Vinculado à turma: '+classrooms.map(x=>x.name).join(', ')+'. A exclusão e a pausa ficam bloqueadas enquanto houver vínculo.','bv-cmgr-tip'));
      const actions=make('div',null,'bv-cmgr-actions');
      if(state==='excluded'){
        actions.append(button('Restaurar curso','primary',()=>execute(c.id,'restore')));
      }else{
        actions.append(button('Editar','',()=>editForm(c,card)));
        actions.append(button(c.published?'Pausar publicação':'Publicar curso','',()=>execute(c.id,c.published?'pause':'publish'),c.published&&classrooms.length>0));
        actions.append(button('Excluir do aplicativo','danger',()=>execute(c.id,'exclude'),classrooms.length>0));
        const vids=make('a','🎬 Videoteca');vids.href='./curso-videos.html?curso='+encodeURIComponent(c.id);
        const learning=make('a','📚 Materiais');learning.href='./painel-aprendizagem.html?curso='+encodeURIComponent(c.id);
        actions.append(learning,vids);
        const lessons=button('▶ Aulas','',null);lessons.dataset.onlineAction='course';lessons.dataset.id=c.id;actions.append(lessons);
      }
      card.append(actions);grid.append(card);
    }
  }
  function mount(view){
    if (view.querySelector('#bvCourseManagerV1')) return;
    const editor=view.querySelector(':scope > .two-cols');if(!editor)return;
    const p=make('section',null);p.id='bvCourseManagerV1';
    const head=make('div');head.append(make('h2','📚 Gestão de cursos'),make('p','Pesquise, edite, publique ou exclua cursos do aplicativo. Exclusão reversível, com histórico preservado.'));
    const toolbar=make('div',null,'bv-cmgr-toolbar');
    const q=field('Buscar curso', '');q.control.id='bvCmgrSearch';q.control.placeholder='Nome ou categoria';
    const f=field('Exibir','all','select');f.control.id='bvCmgrFilter';
    for(const [value,label] of [['all','Todos os ativos'],['published','Publicados no catálogo'],['private','Publicados privados'],['draft','Não publicados'],['excluded','Excluídos / restauráveis'],['all-including-deleted','Todos, inclusive excluídos']])f.control.append(new Option(label,value));
    f.control.value='all';
    const reload=button('↻ Atualizar cursos','',()=>load());
    toolbar.append(q.wrap,f.wrap,reload);
    const count=make('p','Carregando…');count.id='bvCmgrCount';
    const grid=make('div',null,'bv-cmgr-grid');
    const msg=make('div','Aguardando autenticação administrativa…','bv-cmgr-message');
    p.append(head,toolbar,count,grid,msg);
    editor.insertAdjacentElement('afterend',p);currentPanel=p;
    q.control.addEventListener('input',render);
    f.control.addEventListener('change',render);
    load();
  }
  let verifying=false,authorized=false;
  async function verifyAndMount(view){
    if(verifying)return;
    verifying=true;
    try{
      const db=await client();const data=await db.auth.getUser();
      if(data.error || !data.data?.user){authorized=false;return;}
      const role=await db.rpc('current_staff_role');
      authorized=!role.error && role.data==='admin';
      if(authorized && view.isConnected && !view.querySelector('#bvCourseManagerV1'))mount(view);
    }catch(e){/* Nenhum painel administrativo é mostrado sem autenticação. */}
    finally{
      verifying=false;
      // Se a área central foi recriada durante a consulta, monte na versão atual.
      if(authorized){
        const live=document.getElementById('view');
        if(live && (live.querySelector('.page-top h1')?.textContent||'').trim()==='Editor de cursos'
          && !live.querySelector('#bvCourseManagerV1')) mount(live);
      }
    }
  }
  function enhance(){
    const view=document.getElementById('view');if(!view)return;
    const editor=(view.querySelector('.page-top h1')?.textContent||'').trim()==='Editor de cursos';
    if(!editor)return;
    if(view.querySelector('#bvCourseManagerV1'))return;
    if(!verifying) verifyAndMount(view);
  }
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;enhance();});
  });
  observer.observe(app,{childList:true,subtree:true});
  enhance();
})();
