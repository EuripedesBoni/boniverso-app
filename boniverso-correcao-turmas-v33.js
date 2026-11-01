/* BoniVerso 3.3: visibilidade da exclusão e retorno do botão Atualizar.
   Não altera RLS; exclusões exigem RPC protegida por MFA/admin. */
(async () => {
 'use strict';
 const cfg=window.BONIVERSO_CONFIG||{};
 if(!cfg.supabaseUrl||!cfg.supabasePublishableKey)return;
 const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.2');
 const db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 const result=await db.auth.getUser();if(!result.data?.user)return;
 const root=()=>document.getElementById('bvClassManager');
 const show=(message,err=false)=>{const p=root();if(!p)return;let el=p.querySelector('#bvFixStatus');if(!el){el=document.createElement('div');el.id='bvFixStatus';el.setAttribute('role','status');p.querySelector('.bv-tabs')?.before(el)}el.className='notice '+(err?'warning':'success');el.textContent=message;};
 let role=null,working=false;
 async function checkRole(){const r=await db.rpc('current_staff_role');if(r.error)throw r.error;role=r.data;return role;}
 const request=async q=>{const r=await q;if(r.error)throw r.error;return r.data;};
 const isAdmin=()=>role==='admin';
 const security=()=>{show('Sua sessão está como professor/equipe, sem autorização de exclusão. Confirme a autenticação administrativa na opção Segurança e autenticação.',true);let el=root()?.querySelector('#bvMfaShortcut');if(!el){el=document.createElement('a');el.id='bvMfaShortcut';el.href='./mfa-admin.html';el.textContent='🔐 Confirmar autenticação administrativa';el.className='btn secondary';el.style.cssText='display:inline-block;margin:8px 0';root()?.querySelector('#bvFixStatus')?.after(el)}};
 const nameOf=card=>card.querySelector('.bv-title')?.textContent?.trim();
 async function handleDelete(c){if(!isAdmin())return security();if(!confirm('Excluir definitivamente a turma '+c.name+'? Apenas turmas sem histórico podem ser excluídas.'))return;if(prompt('Digite EXCLUIR para confirmar:')!=='EXCLUIR')return;try{await request(db.rpc('bv_delete_empty_classroom_v320',{p_classroom_id:c.id}));show('Turma excluída. Atualize a página.');await refresh()}catch(e){show('Exclusão bloqueada: '+e.message,true)}}
 async function refresh(){if(working)return;working=true;const b=root()?.querySelector('#bvRefreshClasses');if(b){b.textContent='Atualizando…';b.disabled=true}try{await db.auth.refreshSession();await checkRole();show('Dados consultados. Perfil reconhecido: '+(role==='admin'?'Administrador':'Professor/equipe')+'.'+(role==='admin'?'':' Para excluir, confirme o MFA nesta sessão.'),role!=='admin');}catch(e){show('Falha ao atualizar: '+e.message,true)}finally{if(b){b.textContent='Atualizar';b.disabled=false}working=false}setTimeout(paint,200)}
 let scheduled=false,painting=false;
 async function paint(){if(painting)return;painting=true;try{const p=root();if(!p)return;const cards=[...p.querySelectorAll('.bv-turma')];if(cards.length){const rs=await db.from('classrooms').select('id,name').order('name');if(rs.error)throw rs.error;for(const card of cards){const n=nameOf(card),c=(rs.data||[]).find(x=>x.name===n);if(!c)continue;const actions=card.querySelector(':scope > .actions');if(!actions||actions.querySelector('[data-bv-fix-delete]')||[...actions.querySelectorAll('button')].some(x=>x.textContent.includes('Excluir turma')))continue;const b=document.createElement('button');b.type='button';b.className='btn sm bv-danger';b.dataset.bvFixDelete='1';b.textContent='🗑 Excluir turma';b.addEventListener('click',()=>handleDelete(c));actions.appendChild(b)}}}catch(e){show('Erro de atualização da interface: '+e.message,true)}finally{painting=false}}
 const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;paint()},180)});observer.observe(document.getElementById('staff-view')||document.body,{subtree:true,childList:true});
 try{await checkRole()}catch(e){show('Não foi possível verificar a permissão: '+e.message,true)}
 const loop=setInterval(()=>{const btn=root()?.querySelector('#bvRefreshClasses');if(!btn)return;clearInterval(loop);btn.addEventListener('click',refresh);show('Gestão de turmas pronta. Perfil reconhecido: '+(role==='admin'?'Administrador':'Professor/equipe')+'.',role!=='admin');paint()},250);setTimeout(()=>clearInterval(loop),15000);
})();
