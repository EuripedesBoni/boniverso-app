/* BoniVerso - Menu da Central de Mensagens (estudante e professor).
   A autenticação e as permissões continuam no Supabase, não neste menu.
   Adicione <script defer src="./boniverso-mensagens-menu-v1.js"></script>
   antes de </body> no index.html, após os outros scripts.
*/
(()=>{
  'use strict';
  const link='./mensagens-turma-v3.html';
  const envelope='<svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>';
  let queued=false;
  function install(){
    // O menu só deve aparecer depois de o app online iniciar e estar autenticado.
    if(!window.BONIVERSO_DB)return;
    const nav=document.getElementById('sideNav');
    if(!nav||!nav.querySelector('button[data-online-action="nav"]'))return;
    if(!nav.querySelector('[data-bv-messages-link]')){
      const a=document.createElement('a');
      a.href=link;a.className='nav-link';a.dataset.bvMessagesLink='1';
      a.setAttribute('aria-label','Mensagens privadas da turma');
      a.innerHTML=envelope+'<span>Mensagens</span>';
      a.style.textDecoration='none';a.style.display='flex';a.style.alignItems='center';
      nav.append(a);
    }
    const top=document.querySelector('.top-actions');
    if(top&&!top.querySelector('[data-bv-messages-top]')){
      const a=document.createElement('a');a.href=link;
      a.className='circle-button';a.dataset.bvMessagesTop='1';
      a.title='Mensagens privadas';a.setAttribute('aria-label','Abrir mensagens privadas');
      a.innerHTML=envelope;a.style.display='inline-flex';a.style.alignItems='center';a.style.justifyContent='center';
      const before=top.querySelector('#notifications');
      if(before)top.insertBefore(a,before);else top.append(a);
    }
  }
  const root=document.getElementById('app')||document.body;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;install()});
  });
  observer.observe(root,{childList:true,subtree:true});
  window.addEventListener('boniverso-db-ready',install);
  install();
})();
