/* BoniVerso 3.5 — interface de turmas conforme papel autenticado.
   Apenas apresentação; permissões reais continuam no Supabase RLS/RPC.
   Mantém o ícone principal e não modifica matrículas. */
(async () => {
 'use strict';
 const cfg=window.BONIVERSO_CONFIG||{};
 if(!cfg.supabaseUrl||!cfg.supabasePublishableKey)return;
 const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.2');
 const db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 let role=null, busy=false, scheduled=false;
 const root=()=>document.getElementById('bvClassManager');
 const label=()=>role==='admin'?'Administrador':'Professor/equipe';
 async function check(){
  const {data,error}=await db.rpc('current_staff_role');
  if(error)throw error;
  role=data;
  return role;
 }
 function apply(){
  const p=root(); if(!p)return;
  const isAdmin=role==='admin';
  // Botões e permissões são apresentados conforme o papel verificado pelo servidor.
  p.querySelectorAll('button').forEach(b=>{
    const text=(b.textContent||'').trim();
    if(/^🗑?\s*Excluir (turma|ano)/i.test(text)||/^Excluir (turma|ano)/i.test(text)){
      if(b.hidden===isAdmin)b.hidden=!isAdmin;
      const display=isAdmin?'':'none';if(b.style.display!==display)b.style.display=display;
      if(b.getAttribute('aria-hidden')!==String(!isAdmin))b.setAttribute('aria-hidden',String(!isAdmin));
      if(!isAdmin && b.tabIndex!==-1)b.tabIndex=-1;
      else if(isAdmin && b.hasAttribute('tabindex'))b.removeAttribute('tabindex');
    }
  });
  let note=p.querySelector('#bvRoleInfo35');
  if(!note){note=document.createElement('div');note.id='bvRoleInfo35';note.className='notice';note.setAttribute('role','status');const tabs=p.querySelector('.bv-tabs');(tabs||p.firstElementChild)?.before(note);}
  const desired=isAdmin?'Acesso: Administrador · exclusão de turmas e anos disponível apenas quando não houver histórico vinculado.':'Acesso: Professor · criação, edição, matrículas e arquivamento disponíveis. Exclusões definitivas são exclusivas do administrador.';
  if(note.textContent!==desired && !note.textContent.startsWith('Dados atualizados com sucesso. '+desired))note.textContent=desired;
  note.style.background=isAdmin?'#e9f8ef':'#eef3fd';note.style.borderColor=isAdmin?'#bde5cb':'#d5e0f1';note.style.color=isAdmin?'#216843':'#294a76';
  const old=p.querySelector('#bvVerifyLink');if(old)old.style.display=isAdmin?'none':'none';
 }
 async function update(){if(busy)return;busy=true;
  const b=root()?.querySelector('#bvRefreshClasses');
  if(b){b.disabled=true;b.textContent='Atualizando…'}
  try{await check();apply();
   const note=root()?.querySelector('#bvRoleInfo35');if(note)note.textContent='Dados atualizados com sucesso. '+note.textContent;
  }catch(err){const note=root()?.querySelector('#bvRoleInfo35');if(note)note.textContent='Não foi possível verificar as permissões: '+String(err.message||err);}
  finally{if(b){b.disabled=false;b.textContent='Atualizar'}busy=false;}
 }
 const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;apply()},110)});
 observer.observe(document.getElementById('staff-view')||document.body,{childList:true,subtree:true});
 for(let i=0;i<50&&!root();i++)await new Promise(res=>setTimeout(res,200));
 if(!root())return;
 try{await check();apply()}catch(e){console.warn('BoniVerso — permissões de turmas',e)}
 const refresh=root().querySelector('#bvRefreshClasses');
 if(refresh)refresh.addEventListener('click',()=>setTimeout(update,0));
 window.addEventListener('focus',()=>{check().then(apply).catch(()=>{})});
})();
