/* BoniVerso 1.4.0 — Integra gravações MP4 importadas do Google Meet à biblioteca existente.
   Usa matrícula validada no Supabase e assinaturas de acesso no backend, sem chaves privadas. */
(async()=>{
  'use strict';
  const cfg=window.BONIVERSO_CONFIG,filter=document.getElementById('target'),search=document.getElementById('search'),list=document.getElementById('list');
  if(!cfg?.supabaseUrl||!cfg?.supabasePublishableKey||!filter||!list)return;
  const $=s=>document.getElementById(s);
  const el=(tag,txt,cls)=>{const v=document.createElement(tag);if(txt!==undefined&&txt!==null)v.textContent=String(txt);if(cls)v.className=cls;return v};
  const style=el('style');style.textContent=`.bvmeet-wrap{margin-top:20px}.bvmeet-wrap h2{font-size:21px;color:#244364}.bvmeet-badge{font-size:12px;font-weight:700;border-radius:30px;background:#e9f1ff;color:#28528f;padding:5px 9px}.bvmeet-video{width:100%;max-height:460px;border-radius:12px;background:#0a1930;margin-top:12px}.bvmeet-status{font-size:13px;color:#647994}.bvmeet-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}.bvmeet-wrap .tile h3{font-size:18px;margin:12px 0 5px}.bvmeet-wrap .tile p{margin:7px 0}.bvmeet-wrap .tile{min-width:0}`;document.head.append(style);
  const section=el('section',null,'bvmeet-wrap');const heading=el('h2','🎬 Vídeos do Meet e aulas importadas');const tip=el('p','Gravações do Google Meet enviadas e liberadas pelo professor para este curso ou turma.','bvmeet-status');const grid=el('div',null,'grid');section.append(heading,tip,grid);list.insertAdjacentElement('afterend',section);
  let db,items=[],names=new Map(),admin=false,ready=false;
  async function invoke(action,payload={}){
    const {data,error}=await db.functions.invoke('boniverso-course-videos',{body:{action,...payload}});
    if(error){let t=error.message||'Falha ao consultar o vídeo';try{t=(await error.context?.json?.())?.error||t}catch{}throw Error(t)}if(data?.error)throw Error(data.error);return data;
  }
  const toKey=v=>v.course_id?'course:'+v.course_id:'class:'+v.classroom_id;
  const label=v=>names.get(toKey(v))||(v.course_id?'Curso matriculado':'Turma autorizada');
  function ensureFilters(){let changed=false;for(const v of items){const k=toKey(v);if(![...filter.options].some(o=>o.value===k)){filter.append(new Option(names.get(k)||'Curso ou turma',k));changed=true}}return changed;}
  function render(){if(!ready)return;const selected=filter.value,term=(search?.value||'').trim().toLocaleLowerCase('pt-BR');grid.replaceChildren();const filtered=items.filter(v=>(selected==='all'||selected===toKey(v))&&(!term||v.title.toLocaleLowerCase('pt-BR').includes(term)));
    if(!filtered.length){grid.append(el('p',selected==='all'?'Nenhum vídeo importado disponível no momento.':'Nenhum vídeo importado nesta seleção.','empty'));return;}
    for(const v of filtered){
      const box=el('article',null,'tile');const badge=el('span',v.is_published?'Google Meet · disponível':'Prévia do professor','bvmeet-badge');box.append(badge,el('h3',v.title),el('p',label(v),'bvmeet-status'));if(v.description)box.append(el('p',v.description));
      const actions=el('div',null,'bvmeet-actions');const b=el('button','▶ Assistir');b.type='button';b.addEventListener('click',async()=>{b.disabled=true;b.textContent='Verificando matrícula…';try{const {url}=await invoke('watch',{video_id:v.id});if(!url)throw Error('Vídeo indisponível');box.querySelector('video')?.remove();const player=el('video',null,'bvmeet-video');player.controls=true;player.playsInline=true;player.preload='metadata';player.controlsList='nodownload noremoteplayback';player.disablePictureInPicture=true;player.addEventListener('contextmenu',e=>e.preventDefault());player.src=url;player.setAttribute('aria-label','Reproduzir '+v.title);box.append(player);player.play().catch(()=>{});b.textContent='↻ Renovar reprodução';}catch(e){b.textContent='Tentar novamente';tip.textContent='Não foi possível reproduzir: '+e.message;}finally{b.disabled=false}});actions.append(b);box.append(actions);grid.append(box);
    }
  }
  // A biblioteca original recria o filtro quando carrega, então reinsere destinos exclusivos do Meet.
  const observer=new MutationObserver(()=>{if(ready){ensureFilters();render();}});observer.observe(filter,{childList:true});
  filter.addEventListener('change',render);search?.addEventListener('input',render);
  $('refresh')?.addEventListener('click',()=>{setTimeout(load,150);});
  const mediaObserver=new MutationObserver(()=>{for(const v of list.querySelectorAll('video:not([data-bv-protected])')){v.dataset.bvProtected='1';v.controlsList='nodownload noremoteplayback';v.disablePictureInPicture=true;v.addEventListener('contextmenu',e=>e.preventDefault());}});mediaObserver.observe(list,{childList:true,subtree:true});
  async function load(){try{
    tip.textContent='Carregando vídeos do Meet…';const info=await invoke('list');admin=!!info.is_staff;items=(info.videos||[]).filter(v=>v.status==='ready');
    const [courses,classes]=await Promise.all([db.from('courses').select('id,title'),db.from('classrooms').select('id,name')]);
    names=new Map([...(courses.data||[]).map(c=>['course:'+c.id,'Curso · '+c.title]),...(classes.data||[]).map(c=>['class:'+c.id,'Turma · '+c.name])]);
    ready=true;ensureFilters();const fromUrl=new URLSearchParams(location.search).get('curso');if(fromUrl&&[...filter.options].some(o=>o.value==='course:'+fromUrl))filter.value='course:'+fromUrl;
    tip.textContent='Apenas vídeos liberados para seu curso ou turma. Reprodução dentro do BoniVerso.';render();
    if(admin){const nav=document.querySelector('header nav');if(nav&&!nav.querySelector('[data-bv-meet]')){const a=el('a','⬆ Importar vídeos Meet');a.href='./importar-videos.html';a.dataset.bvMeet='1';nav.append(a)}}
  }catch(e){tip.textContent='Não foi possível carregar os vídeos do Meet: '+e.message;grid.replaceChildren();}}
  try{const m=await import('https://esm.sh/@supabase/supabase-js@2.57.2');db=m.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});const {data:{user}}=await db.auth.getUser();if(!user){tip.textContent='Faça login para assistir às aulas.';return;}await load();}catch(e){tip.textContent='Vídeos do Meet indisponíveis: '+e.message;}
})();
