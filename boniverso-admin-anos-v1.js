/* BoniVerso — Administrador: exclusão reversível de ano escolar (v1)
   Mantém avaliações, entregas, notas e histórico. Não modifica turmas nem outras matrículas.
   RPCs com autorização admin + MFA no banco (Supabase).
*/
(async () => {
  'use strict';
  const cfg=window.BONIVERSO_CONFIG||{};
  const staff=document.getElementById('staff-view');
  if(!staff||!cfg.supabaseUrl||!cfg.supabasePublishableKey)return;
  const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.2');
  const db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user)return;
  const {data:role,error:roleError}=await db.rpc('current_staff_role');
  if(roleError||role!=='admin')return;
  if(document.getElementById('bvAdminYearsV1'))return;

  const panel=document.createElement('section');
  panel.className='card spaced';panel.id='bvAdminYearsV1';
  panel.innerHTML=`
    <style>
      #bvAdminYearsV1{border:1px solid #cbdcf3;border-radius:18px;padding:18px;margin:18px 0;background:#fff}
      #bvAdminYearsV1 h2{font-size:1.15rem;margin:0 0 7px;color:#142f51}
      #bvAdminYearsV1 p{color:#60738c;font-size:.89rem;line-height:1.6}
      #bvAdminYearsV1 .bv-ay-rows{display:grid;gap:12px;margin-top:13px}
      #bvAdminYearsV1 .bv-ay-card{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:14px;border:1px solid #dce6f4;border-radius:13px;background:#f7faff}
      #bvAdminYearsV1 .bv-ay-card strong{color:#1b385c;display:block;line-height:1.4}
      #bvAdminYearsV1 .bv-ay-card small{display:block;color:#64768b;margin-top:3px;line-height:1.5}
      #bvAdminYearsV1 .bv-ay-action{background:#fff;border:1px solid #d5a0a0;border-radius:10px;color:#a13338;cursor:pointer;font:inherit;font-weight:700;padding:10px 13px;min-height:43px}
      #bvAdminYearsV1 .bv-ay-action.restore{color:#2367aa;border-color:#a7bfe3}
      #bvAdminYearsV1 .bv-ay-action:disabled{opacity:.55;cursor:wait}
      #bvAdminYearsV1 .bv-ay-result{padding:11px 14px;border-radius:10px;color:#255881;background:#eaf3fe;margin:12px 0}
      #bvAdminYearsV1 .bv-ay-result.error{color:#a03435;background:#fff0ef}
      #bvAdminYearsV1 .bv-ay-tools{display:flex;align-items:center;flex-wrap:wrap;gap:10px}
      #bvAdminYearsV1 .bv-ay-update{font:inherit;color:#2455aa;background:#eef4ff;border:1px solid #b8ceea;border-radius:10px;padding:9px 13px;min-height:42px;cursor:pointer}
      #bvClassManager .bv-ay-safe{color:#a2303c!important;border-color:#e3adb2!important;background:#fff8f8!important}
      @media(max-width:640px){#bvAdminYearsV1 .bv-ay-card{align-items:stretch}#bvAdminYearsV1 .bv-ay-action{width:100%}}
    </style>
    <h2>🛡️ Gestão administrativa de anos escolares</h2>
    <p>Exclua um ano da interface mesmo que existam redações, avaliações ou matrículas. <strong>O histórico é preservado</strong> e o ano pode ser restaurado aqui. A exclusão suspende as matrículas ativas daquele ano, sem afetar outras turmas.</p>
    <div class="bv-ay-tools"><button type="button" class="bv-ay-update" id="bvAyRefresh">Atualizar anos</button></div>
    <div class="bv-ay-result" id="bvAyStatus" role="status" aria-live="polite">Carregando anos…</div>
    <h3 style="font-size:1rem;color:#173456;margin-top:18px">Anos excluídos (restauráveis)</h3>
    <div class="bv-ay-rows" id="bvAyRemoved"></div>
  `;
  const prev=document.getElementById('bvAdminManagerV4')||document.getElementById('bvClassManager');
  if(prev)prev.after(panel);else staff.append(panel);
  const by=id=>panel.querySelector('#'+id);
  const status=(message,error=false)=>{const e=by('bvAyStatus');e.textContent=message;e.className='bv-ay-result'+(error?' error':'');};
  const req=async(p)=>{const r=await p;if(r.error)throw r.error;return r.data;};
  let classes=[],sections=[],busy=false;
  const nameOf=c=>c?.name||'Turma';
  const sectionName=s=>s?.label||s?.grade_code||'Ano';
  const activeYears=classId=>sections.filter(s=>s.classroom_id===classId&&!s.deleted_at);
  const findYear=(classId,txt)=>sections.find(s=>s.classroom_id===classId&&!s.deleted_at&&sectionName(s)===txt);

  const action=async(s,restore)=>{
    if(busy)return;
    const label=sectionName(s);
    if(restore){
      if(!confirm(`Restaurar ${label}? O ano voltará a aparecer, e matrículas ativas antes da exclusão serão restauradas.`))return;
    }else{
      if(!confirm(`Excluir ${label} do aplicativo? Entregas, notas, redações e histórico ficarão salvos. O acesso dos matriculados neste ano será suspenso.`))return;
      const typed=prompt('Digite o nome completo do ano para confirmar:\n'+label);
      if(typed!==label){status('Exclusão cancelada: digite exatamente o nome do ano.',true);return;}
    }
    busy=true;
    panel.querySelectorAll('button').forEach(b=>b.disabled=true);
    status('Atualizando o ano e preservando o histórico…');
    try{
      if(restore)await req(db.rpc('bv_admin_restore_section_v1',{p_section_id:s.id}));
      else await req(db.rpc('bv_admin_exclude_section_v1',{p_section_id:s.id,p_confirm_label:label}));
      await refresh();
      status(restore?`${label} restaurado. Histórico preservado.`:`${label} excluído da interface. Histórico preservado; restauração disponível abaixo.`);
      const reload=document.getElementById('bvRefreshClasses');if(reload)reload.click();
    }catch(e){status('Não foi possível concluir: '+(e.message||String(e)),true);}
    finally{busy=false;panel.querySelectorAll('button').forEach(b=>b.disabled=false);}
  };

  const refresh=async()=>{
    [classes,sections]=await Promise.all([
      req(db.from('classrooms').select('id,name,deleted_at')),
      req(db.from('classroom_sections').select('id,classroom_id,label,grade_code,is_active,deleted_at'))
    ]);
    renderRemoved();decorateLegacy();
  };

  const renderRemoved=()=>{
    const root=by('bvAyRemoved');root.replaceChildren();
    const removed=sections.filter(s=>!!s.deleted_at);
    if(!removed.length){const p=document.createElement('p');p.textContent='Nenhum ano excluído no momento.';root.append(p);return;}
    for(const s of removed){
      const card=document.createElement('div');card.className='bv-ay-card';
      const data=document.createElement('div');const strong=document.createElement('strong');strong.textContent=sectionName(s);
      const hint=document.createElement('small');hint.textContent=nameOf(classes.find(c=>c.id===s.classroom_id))+' · histórico preservado';
      data.append(strong,hint);
      const b=document.createElement('button');b.type='button';b.className='bv-ay-action restore';b.textContent='↩ Restaurar ano';b.addEventListener('click',()=>action(s,true));
      card.append(data,b);root.append(card);
    }
  };

  // O módulo antigo continua responsável pelas aulas, anos e códigos. Substituímos
  // exclusivamente seu botão de exclusão definitiva por uma exclusão reversível.
  const decorateLegacy=()=>{
    const root=document.getElementById('bvClassManager');if(!root)return;
    for(const card of root.querySelectorAll('.bv-turma')){
      const className=card.querySelector('.bv-title')?.textContent?.trim();
      const c=classes.find(x=>x.name===className);if(!c)continue;
      const oldSummary=card.querySelector('.section-top .bv-muted');
      if(oldSummary){
        const total=activeYears(c.id).length;
        const replace=oldSummary.textContent.replace(/\d+ ano\(s\)/,`${total} ano(s)`);
        if(oldSummary.textContent!==replace)oldSummary.textContent=replace;
      }
      for(const row of card.querySelectorAll('.bv-year')){
        const label=row.querySelector('.bv-year-head strong')?.textContent?.trim();
        if(!label)continue;
        const s=findYear(c.id,label);
        const actions=row.querySelector('.actions');
        if(!actions)continue;
        // Oculta o botão de exclusão definitiva do código legado, sem
        // alterá-lo. Não toca nos controles Pausar/Ativar e Códigos.
        for(const b of actions.querySelectorAll('button')){
          if((b.textContent||'').includes('Excluir ano')){
            if(!b.hidden){b.hidden=true;b.style.display='none';}
          }
        }
        if(!s){if(row.style.display!=='none')row.style.display='none';continue;}
        if(row.style.display==='none')row.style.display='';
        let safe=actions.querySelector('.bv-ay-safe');
        if(!safe){
          safe=document.createElement('button');safe.className='btn sm bv-ay-safe';safe.type='button';
          safe.textContent='🗑 Excluir ano (preservar histórico)';
          actions.append(safe);
        }
        // Substituir o handler sempre que a seção mudar (sem criar vários).
        safe.onclick=()=>action(s,false);
      }
    }
  };
  const original=document.getElementById('bvClassManager');
  const watcher=new MutationObserver(()=>decorateLegacy());
  if(original)watcher.observe(original,{childList:true,subtree:true});
  else{
    const wait=new MutationObserver(()=>{
      const root=document.getElementById('bvClassManager');
      if(root){watcher.observe(root,{childList:true,subtree:true});decorateLegacy();wait.disconnect();}
    });
    wait.observe(staff,{childList:true,subtree:true});
  }
  by('bvAyRefresh').addEventListener('click',async()=>{
    try{await refresh();status('Anos atualizados.')}catch(e){status(e.message||String(e),true)}
  });
  try{await refresh();status('Pronto. Escolha um ano e use “Excluir ano (preservar histórico)”.');}
  catch(e){status('Falha ao carregar anos: '+(e.message||String(e)),true)}
})();
