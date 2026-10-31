/* BoniVerso 1.1.2 — busca geral e atalhos de navegação. Não altera dados.
 * Resultados são filtrados no servidor pelo Supabase Auth + RLS.
 */
(() => {
  'use strict';
  const cfg=window.BONIVERSO_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabasePublishableKey) return;
  const $=s=>document.querySelector(s);
  const homeRoute=()=>$('#sideNav button.active[data-id]')?.dataset.id;
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const icon=(kind='search')=> kind==='search'
    ? '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>'
    :'<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21H3z"/><path d="M9 21v-8h6v8"/></svg>';
  const roomURL=(school,section)=>school.enrollment_type==='paid_invite'
    ? './aparecida.html'
    : './sala.html?turma='+encodeURIComponent(school.id)+(section?'&serie='+encodeURIComponent(section.id):'');
  let clientPromise=null;
  async function getClient(){
    if(!clientPromise)clientPromise=import('https://esm.sh/@supabase/supabase-js@2.57.2').then(({createClient})=>
      createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
    return clientPromise;
  }
  let catalog=[],loadedAt=0,loading=null,dialog=null,input=null,results=null,status=null;
  function createDialog(){
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.id='bvSearchDialog';dialog.className='bv-search-dialog';
    dialog.setAttribute('aria-labelledby','bvSearchTitle');
    dialog.innerHTML=`<div class="bv-search-box"><div class="bv-search-heading"><div><small>BONIVERSO · BUSCA GERAL</small><h2 id="bvSearchTitle">O que você deseja encontrar?</h2><p>Pesquise cursos, escolas, séries, redações e aulas ao vivo.</p></div><button type="button" class="bv-search-close" data-bv-search-close aria-label="Fechar pesquisa">×</button></div><div class="bv-search-input-wrap">${icon()}<input id="bvSearchInput" type="search" autocomplete="off" maxlength="120" aria-label="Pesquisar no BoniVerso" placeholder="Ex.: redação ENEM, Areião, Aparecida…"/></div><p class="bv-search-status" id="bvSearchStatus" role="status"></p><div id="bvSearchResults" class="bv-search-results" aria-live="polite"></div><div class="bv-search-foot"><span>Somente conteúdos disponíveis para a sua conta.</span><button type="button" id="bvSearchReload">Atualizar resultados</button></div></div>`;
    document.body.append(dialog);
    input=dialog.querySelector('#bvSearchInput');results=dialog.querySelector('#bvSearchResults');status=dialog.querySelector('#bvSearchStatus');
    dialog.addEventListener('click',e=>{
      if(e.target===dialog || e.target.closest('[data-bv-search-close]')){close();return;}
      const item=e.target.closest('a[data-bv-screen]');
      if(item){e.preventDefault();const screen=item.dataset.bvScreen;close();const button=$('#sideNav button[data-online-action="nav"][data-id="'+screen+'"]');if(button)button.click();else location.href='./';}
    });
    dialog.querySelector('#bvSearchReload').addEventListener('click',()=>loadCatalog(true));
    input.addEventListener('input',()=>renderResults());
    dialog.addEventListener('close',()=>document.body.classList.remove('bv-search-open'));
  }
  function close(){if(dialog?.open)dialog.close();document.body.classList.remove('bv-search-open');}
  function open(){
    if(!$('#sideNav')){return;}
    createDialog();
    if(!dialog.open){dialog.showModal();document.body.classList.add('bv-search-open');}
    input.focus();
    loadCatalog(false);
  }
  async function loadCatalog(force=false){
    if(loading)return loading;
    if(!force && catalog.length && Date.now()-loadedAt<120000){renderResults();return;}
    status.textContent='Buscando conteúdos disponíveis na sua conta…';
    results.replaceChildren();
    loading=(async()=>{
      try{
        const db=await getClient();const {data:{user},error:authErr}=await db.auth.getUser();
        if(authErr||!user)throw Error('Entre na sua conta para usar a busca geral.');
        const queries=[
          db.from('courses').select('id,title,summary,is_free,published').eq('published',true).limit(160),
          db.from('classrooms').select('id,name,enrollment_type,is_active').eq('is_active',true).limit(160),
          db.from('classroom_sections').select('id,classroom_id,grade_code,label,is_active').eq('is_active',true).limit(200),
          db.from('assignments').select('id,title,instructions,published,section_id').eq('published',true).limit(200),
          db.from('live_sessions').select('id,title,classroom_id,starts_at,status').limit(100),
          db.from('lessons').select('id,title,description,course_id,published').eq('published',true).limit(200)
        ];
        const records=await Promise.all(queries);
        const all=records.map(r=>r.error?[]:(r.data||[]));
        const failures=records.filter(r=>r.error).map(r=>r.error.message);
        const [courses,schools,sections,assignments,lives,lessons]=all;
        const byClass=new Map(schools.map(s=>[s.id,s]));
        const items=[];
        const byCourse=new Map(courses.map(c=>[c.id,c]));
        for(const c of schools) items.push({type:'Turma',title:c.name,summary:c.enrollment_type==='paid_invite'?'Aulas ao vivo · acesso exclusivo':'Escola e séries de redação',href:roomURL(c)});
        for(const s of sections){const c=byClass.get(s.classroom_id);if(!c)continue;
          items.push({type:'Série',title:(s.label||s.grade_code||'Série')+' · '+c.name,summary:'Acesse as propostas e atividades da série',href:roomURL(c,s)});
        }
        for(const l of lives){const c=byClass.get(l.classroom_id);if(!c)continue;
          items.push({type:'Aula ao vivo',title:l.title,summary:c.name+(l.starts_at?' · '+new Date(l.starts_at).toLocaleString('pt-BR'):' · horário a definir'),href:roomURL(c)});
        }
        for(const l of lessons){const c=byCourse.get(l.course_id);if(!c)continue;
          items.push({type:'Aula gravada',title:l.title,summary:c.title+' · '+(l.description||'Conteúdo do curso').slice(0,130),href:'./',screen:'courses'});
        }
        for(const a of assignments)items.push({type:'Redação',title:a.title,summary:(a.instructions||'Proposta de redação').slice(0,150),href:'./?pagina=redacoes&atividade='+encodeURIComponent(a.id)});
        for(const c of courses)items.push({type:'Curso',title:c.title,summary:(c.summary||'Curso do BoniVerso').slice(0,150),href:'./',screen:'courses'});
        catalog=items;
        loadedAt=Date.now();
        status.textContent=failures.length?'Algumas categorias estão temporariamente indisponíveis; os demais resultados foram carregados.':'Resultados atualizados · '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
        renderResults();
      }catch(err){status.textContent='Não foi possível consultar a busca: '+(err?.message||'verifique a conexão.');results.replaceChildren();}
      finally{loading=null;}
    })();
    return loading;
  }
  function renderResults(){
    if(!results || !input)return;
    const term=norm(input.value.trim());
    const types=['Turma','Série','Aula ao vivo','Aula gravada','Redação','Curso'];
    const filtered=catalog.filter(o=>!term||norm(o.title+' '+o.summary+' '+o.type).includes(term));
    const sorted=filtered.sort((a,b)=>{
      const aStart=term && norm(a.title).startsWith(term)?1:0;
      const bStart=term && norm(b.title).startsWith(term)?1:0;
      return bStart-aStart||types.indexOf(a.type)-types.indexOf(b.type)||a.title.localeCompare(b.title,'pt-BR');
    }).slice(0,50);
    results.replaceChildren();
    if(!sorted.length){const e=document.createElement('p');e.className='bv-search-empty';e.textContent=catalog.length?'Nenhum resultado para sua pesquisa. Tente outro termo.':'Nenhum conteúdo encontrado para esta conta.';results.append(e);return;}
    for(const x of sorted){
      const a=document.createElement('a');a.className='bv-search-result';a.href=x.href;if(x.screen)a.dataset.bvScreen=x.screen;
      const symbol=document.createElement('span');symbol.className='bv-search-result-icon';symbol.textContent={'Turma':'🏫','Série':'📚','Aula ao vivo':'🎥','Aula gravada':'▶️','Redação':'✍️','Curso':'📖'}[x.type]||'🔎';symbol.setAttribute('aria-hidden','true');
      const body=document.createElement('span');body.className='bv-search-result-text';
      const small=document.createElement('small');small.textContent=x.type;
      const name=document.createElement('strong');name.textContent=x.title;
      const description=document.createElement('span');description.textContent=x.summary;
      body.append(small,name,description);
      const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
      a.append(symbol,body,arrow);results.append(a);
    }
  }
  function addChrome(){
    const nav=$('#sideNav');
    if(nav && nav.children.length && !nav.querySelector('#bvSearchNav')){
      const btn=document.createElement('button');btn.id='bvSearchNav';btn.type='button';btn.className='nav-link bv-global-nav';btn.dataset.bvSearchOpen='true';btn.innerHTML=icon()+'<span>Pesquisar no BoniVerso</span>';
      nav.append(btn);
    }
    const toolbar=$('.top-actions');
    if(toolbar && !$('#bvSearchTop')){
      const btn=document.createElement('button');btn.id='bvSearchTop';btn.type='button';btn.className='bv-search-top';btn.dataset.bvSearchOpen='true';btn.setAttribute('aria-label','Pesquisar no BoniVerso');btn.title='Busca geral';btn.innerHTML=icon();
      toolbar.insertBefore(btn,toolbar.firstChild);
    }
    const defaultButton=$('#searchButton');
    if(defaultButton && !defaultButton.dataset.bvSearchReady){
      defaultButton.dataset.bvSearchReady='true';defaultButton.setAttribute('title','Pesquisar em todo o BoniVerso');
      const label=defaultButton.querySelector('span:not([data-icon])');if(label)label.textContent='Busca geral';
    }
    const view=$('#view');
    const route=homeRoute();
    if(view && (route==='home'||route==='admin') && !view.querySelector('#bvHomeSearch')){
      const stats=view.querySelector('.stats-row');
      if(stats){
        const wrap=document.createElement('section');wrap.id='bvHomeSearch';wrap.className='bv-home-search';
        wrap.innerHTML='<div><span>BUSCA GERAL</span><h2>Encontre sua próxima aula</h2><p>Turmas, cursos, propostas de redação e transmissões ao vivo em um só lugar.</p></div><button type="button" data-bv-search-open="true">'+icon()+' <span>Pesquisar no BoniVerso</span></button>';
        stats.insertAdjacentElement('afterend',wrap);
      }
    }
  }
  let pending=false;
  function scheduleChrome(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;addChrome();});}
  document.addEventListener('click',e=>{
    const btn=e.target.closest('#searchButton, [data-bv-search-open]');
    if(!btn)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open();
  },true);
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open();}
    if(e.key==='Escape'&&dialog?.open)close();
  });
  const observer=new MutationObserver(scheduleChrome);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  scheduleChrome();
})();
