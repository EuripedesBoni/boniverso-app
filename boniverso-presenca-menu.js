/* BoniVerso Live v1.2.3 - atalho visível somente para equipe. */
(async () => {
  'use strict';
  const id=new URLSearchParams(location.search).get('sessao');
  if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id||''))return;
  const header=document.querySelector('main .controls');
  const cfg=window.BONIVERSO_CONFIG;
  if(!header||!cfg?.supabaseUrl||!cfg?.supabasePublishableKey||document.getElementById('bv-attendance-link'))return;
  try {
    const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.2');
    const db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
    const {data,error}=await db.rpc('current_staff_role');
    if(error||!['teacher','admin'].includes(data))return;
  } catch {return;}
  const link=document.createElement('a');
  link.id='bv-attendance-link';
  link.href='./painel-participantes.html?sessao='+encodeURIComponent(id);
  link.textContent='👥 Participantes e presença';
  link.style.cssText='display:inline-flex;align-items:center;justify-content:center;min-height:43px;border-radius:11px;background:#29466e;border:1px solid #59719a;color:white;padding:10px 14px;font:inherit;text-decoration:none';
  link.title='Acesso exclusivo para professores e administradores';
  header.append(link);
})();
