/* BoniVerso RSB Educação — conexão pública Supabase.
   A chave publicável não é secreta; nunca adicione service_role ou sb_secret_. */
window.BONIVERSO_CONFIG = Object.freeze({
  supabaseUrl: 'https://opzchnufngyegggkpdcn.supabase.co',
  supabasePublishableKey: 'sb_publishable_QWB7lg7Mn3OXxJFK5fGCKQ_ufOtLnGH'
});

/* BoniVerso 1.0.2 — conectar turmas às redações, sem alterar os dados existentes.
   O controle de acesso continua sob as regras de segurança (RLS) do Supabase. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const inClassrooms = /\/turmas\.html$/i.test(location.pathname);
  const onEssayLink = params.get('pagina') === 'redacoes';
  const target = params.get('atividade') || '';
  const assignmentId = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(target) ? target : '';
  const baseLink = './?pagina=redacoes';

  if (inClassrooms) {
    // The pre-existing link previously pointed to './' (the home screen).
    const original = document.querySelector('#student-view .actions a[href="./"]');
    if (original) {
      original.href = baseLink;
      original.textContent = 'Abrir Redações no aplicativo';
    }

    // Add a direct, per-proposal button without replacing the existing classroom code.
    const taskArea = document.getElementById('my-tasks');
    if (!taskArea) return;
    let syncing = false;
    let lastSignature = '';
    async function enhance() {
      if (syncing) return;
      const cards = Array.from(taskArea.querySelectorAll(':scope > .section'));
      if (!cards.length || cards.every(card => card.querySelector('.bv-open-essay'))) return;
      syncing = true;
      try {
        const { supabaseUrl, supabasePublishableKey } = window.BONIVERSO_CONFIG;
        if (!supabaseUrl || !supabasePublishableKey) return;
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.2');
        const client = createClient(supabaseUrl,supabasePublishableKey,{
          auth: { persistSession:true,autoRefreshToken:true,detectSessionInUrl:false }
        });
        const { data: session, error: authError } = await client.auth.getUser();
        if (authError || !session?.user?.id) return;
        const { data: memberships, error: membershipError } = await client
          .from('classroom_memberships').select('section_id')
          .eq('user_id',session.user.id).eq('status','active');
        if (membershipError) throw membershipError;
        const sections = [...new Set((memberships || []).map(m=>m.section_id).filter(Boolean))];
        if (!sections.length) return;
        const { data: assignments, error: assignmentsError } = await client
          .from('assignments').select('id,title,section_id,published,created_at')
          .in('section_id',sections).eq('published',true)
          .order('created_at',{ascending:false});
        if (assignmentsError) throw assignmentsError;
        const used = new Set();
        for (const card of cards) {
          if (!card.isConnected || card.querySelector('.bv-open-essay')) continue;
          const title = card.querySelector('strong')?.textContent?.trim() || '';
          const task = (assignments || []).find(a => a.title===title && !used.has(a.id));
          if (!task) continue;
          used.add(task.id);
          const link=document.createElement('a');
          link.className='btn bv-open-essay';
          link.href=baseLink+'&atividade='+encodeURIComponent(task.id);
          link.textContent='Escrever ou anexar PDF';
          link.style.cssText='display:inline-block;margin-top:12px;text-decoration:none;font-size:14px';
          card.appendChild(link);
        }
      } catch (err) {
        console.warn('Atalho de redação indisponível:',err);
      } finally {
        syncing = false;
      }
    }
    const observer = new MutationObserver(() => {
      const cards = taskArea.querySelectorAll(':scope > .section');
      const signature = Array.from(cards).map(c=>c.querySelector('strong')?.textContent||'').join('|');
      if (signature && signature !== lastSignature) {
        lastSignature=signature;
        enhance();
      }
    });
    observer.observe(taskArea,{childList:true,subtree:true});
    enhance();
    return;
  }

  if (!onEssayLink) return;

  // In the authenticated single-page app, selecting a sidebar route is client-side.
  // Wait for login/data loading; then open 'Redações' and the requested proposal.
  const app = document.getElementById('app');
  if (!app) return;
  let navigating=false, opened=false;
  let lastAttempt=0;
  let finished=false;
  let timer;
  const observer = new MutationObserver(syncRoute);
  function finish(){finished=true;observer.disconnect();if(timer)clearTimeout(timer);}
  function syncRoute(){
    if(finished) return;
    const essaysNav=document.querySelector('#sideNav [data-online-action="nav"][data-id="essays"]');
    if(!essaysNav) return;  // May still be on login page.
    const active=essaysNav.classList.contains('active');
    if(!active){
      if(!navigating && Date.now()-lastAttempt>500){
        navigating=true;
        lastAttempt=Date.now();
        essaysNav.click();
        timer=setTimeout(()=>{navigating=false;syncRoute();},450);
      }
      return;
    }
    navigating=false;
    const page=document.querySelector('#view');
    if(!page?.querySelector('.page-top')) return;
    if(!assignmentId){finish();return;}
    const buttons=Array.from(page.querySelectorAll('[data-online-action="assignment"]'));
    const open=buttons.find(button=>button.getAttribute('data-id')===assignmentId);
    if(open && !opened){
      opened=true;
      open.click();
      finish();
    } else if(buttons.length && !open){
      // Show the available proposals without exposing an inaccessible submission.
      finish();
      const banner=document.createElement('div');
      banner.className='callout section';
      banner.textContent='Esta proposta não está disponível para sua conta ou série. Verifique sua matrícula.';
      page.prepend(banner);
    }
  }
  observer.observe(app,{subtree:true,childList:true});
  syncRoute();
})();

/* v1.1.1 — atalhos das salas integrados em index.html e turmas.html.
   Não altera autorização, dados de turmas ou sessões. */
(() => {
  const page=location.pathname.split('/').pop()||'index.html';
  if(page!=='index.html' && page!=='turmas.html')return;
  const css=document.createElement('link');css.rel='stylesheet';css.href='./turmas-navegacao.css';document.head.append(css);
  const script=document.createElement('script');script.src='./turmas-navegacao.js';script.defer=true;document.head.append(script);
})();
