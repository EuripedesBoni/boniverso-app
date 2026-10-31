/* BoniVerso 1.0.6 — Central de Atualizações
   GitHub Pages: compara revisões do repositório público sem chaves de API.
   Não força recarregamento durante a escrita de redações. */
(() => {
  'use strict';
  const ROOT = 'EuripedesBoni/boniverso-app';
  const ENDPOINT = `https://api.github.com/repos/${ROOT}/commits/main`;
  const INSTALLED_KEY = 'boniverso-updates-last-applied-sha';
  const CHECK_GAP = 30 * 60 * 1000; // no máximo uma consulta automática a cada 30 min por aba
  const APP_VERSION = '1.0.6';
  const icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.7 9A7 7 0 0 1 18.3 7L20 12"/><path d="M4 12l1.7 5A7 7 0 0 0 18.3 15"/></svg>';
  let latest = null;
  let lastChecked = 0;
  let working = false;
  let hasUpdate = false;
  let message = 'Você pode verificar se existe uma nova versão publicada.';
  let panel = null;
  let previouslyFocused = null;

  function readInstalled(){ try{return localStorage.getItem(INSTALLED_KEY)||'';}catch(_){return '';} }
  function saveInstalled(sha){ try{localStorage.setItem(INSTALLED_KEY,sha);}catch(_){/* armazenamento privado pode estar indisponível */} }
  function shortSha(sha){return sha ? sha.slice(0,7) : '—';}
  function toggleBadge(visible){
    document.querySelectorAll('.bv-update-dot').forEach(el=>{ el.hidden=!visible; });
    document.querySelectorAll('.bv-update-quick,.bv-update-nav').forEach(el=>{
      el.classList.toggle('bv-has-new',visible);
      el.setAttribute('aria-label',visible?'Nova versão disponível — Atualizações':'Atualizações do aplicativo');
    });
  }
  function ensureNav(){
    const nav=document.getElementById('sideNav');
    if(!nav || nav.querySelector('#bvUpdateNav'))return;
    // O app redesenha o menu após cada navegação; reinsere sem alterar seus botões originais.
    const el=document.createElement('button');
    el.id='bvUpdateNav';
    el.type='button';
    el.className='nav-link bv-update-nav';
    el.innerHTML=icon+'<span>Atualizações</span><span class="bv-update-dot" hidden aria-label="Nova versão"></span>';
    nav.appendChild(el);
    toggleBadge(hasUpdate);
  }
  function ensureQuick(){
    const actions=document.querySelector('.top-actions');
    if(!actions || actions.querySelector('#bvUpdateOpen'))return;
    const button=document.createElement('button');
    button.id='bvUpdateOpen';
    button.className='bv-update-quick';
    button.type='button';
    button.title='Atualizações do aplicativo';
    button.setAttribute('aria-label','Atualizações do aplicativo');
    button.innerHTML=icon+'<span class="bv-update-dot" hidden aria-hidden="true"></span>';
    const notifications=actions.querySelector('#notifications');
    actions.insertBefore(button,notifications||actions.firstChild);
    toggleBadge(hasUpdate);
  }
  function ensureUI(){ensureNav();ensureQuick();}
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;ensureUI();});
  });
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  ensureUI();

  function getDialog(){
    if(panel)return panel;
    const overlay=document.createElement('div');
    overlay.className='bv-update-overlay';
    overlay.id='bvUpdateOverlay';
    overlay.hidden=true;
    overlay.innerHTML=`<section class="bv-update-dialog" role="dialog" aria-modal="true" aria-labelledby="bvUpdateTitle">
      <div class="bv-update-heading"><div class="bv-update-heading-icon">${icon}</div><div><span class="bv-update-eyebrow">BONIVERSO · RSB EDUCAÇÃO</span><h2 id="bvUpdateTitle">Central de Atualizações</h2></div><button type="button" class="bv-update-close" data-bv-update="close" aria-label="Fechar">×</button></div>
      <div class="bv-update-content">
        <div class="bv-update-version"><div><span class="bv-update-kicker">VERSÃO DO APLICATIVO</span><strong>v${APP_VERSION}</strong><small id="bvInstalledCommit">Versão em uso no navegador</small></div><span id="bvUpdateState" class="bv-update-state">Verificando...</span></div>
        <p id="bvUpdateMessage" class="bv-update-message" role="status" aria-live="polite"></p>
        <div id="bvUpdateDetails" class="bv-update-details" hidden><strong>Última publicação no GitHub</strong><p id="bvUpdateCommitMessage"></p><small id="bvUpdateCommitDate"></small></div>
        <div class="bv-update-buttons"><button type="button" class="bv-update-button bv-update-secondary" data-bv-update="check">${icon} Verificar agora</button><button type="button" class="bv-update-button bv-update-primary" data-bv-update="apply">${icon} Atualizar aplicativo</button></div>
        <div class="bv-update-info"><strong>Como funciona?</strong><p>As melhorias são publicadas no GitHub. O BoniVerso procura novas versões e avisa você. Ao atualizar, baixa os arquivos mais recentes, preservando sua conta e seus dados no Supabase.</p><p><strong>Atenção:</strong> salve redações ou formulários em edição antes de atualizar. A atualização nunca reinicia o aplicativo automaticamente durante sua escrita.</p></div>
        <p class="bv-update-foot">Esta atualização é do site instalado no navegador. Não é necessário baixar outro aplicativo.</p>
      </div>
    </section>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click',ev=>{ if(ev.target===overlay)close(); });
    panel=overlay;
    return overlay;
  }
  function display(){
    if(!panel || panel.hidden)return;
    panel.querySelector('#bvInstalledCommit').textContent='Revisão instalada: '+shortSha(readInstalled());
    panel.querySelector('#bvUpdateState').textContent=working?'Verificando…':hasUpdate?'Nova versão':latest?'Em dia':'A verificar';
    panel.querySelector('#bvUpdateState').classList.toggle('bv-update-state-new',hasUpdate);
    panel.querySelector('#bvUpdateMessage').textContent=message;
    const box=panel.querySelector('#bvUpdateDetails');
    box.hidden=!latest;
    if(latest){
      panel.querySelector('#bvUpdateCommitMessage').textContent=latest.subject;
      panel.querySelector('#bvUpdateCommitDate').textContent=latest.date;
    }
    panel.querySelector('[data-bv-update="check"]').disabled=working;
    panel.querySelector('[data-bv-update="apply"]').disabled=working || !navigator.onLine;
  }
  function open(){previouslyFocused=document.activeElement;getDialog().hidden=false;document.body.classList.add('bv-updates-open');display();panel.querySelector('[data-bv-update="close"]').focus();check(false);}
  function close(){if(!panel)return;panel.hidden=true;document.body.classList.remove('bv-updates-open');previouslyFocused?.focus?.();}

  async function check(force=false){
    if(working)return;
    if(!force && Date.now()-lastChecked<CHECK_GAP)return;
    if(!navigator.onLine){message='Sem conexão. Você pode continuar usando os recursos disponíveis e verificar novamente quando estiver on-line.';display();return;}
    working=true;message='Procurando novidades da plataforma…';display();
    try{
      const resp=await fetch(ENDPOINT,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
      if(!resp.ok)throw new Error(resp.status===403?'O serviço público de verificação atingiu o limite temporário de consultas.':'Não foi possível consultar as atualizações ('+resp.status+').');
      const data=await resp.json();
      if(!/^[0-9a-f]{40}$/i.test(data.sha||''))throw new Error('A resposta do GitHub não pôde ser validada.');
      latest={sha:data.sha,subject:String(data.commit?.message||'Atualização do BoniVerso').split('\n')[0].slice(0,180),date:data.commit?.committer?.date?new Date(data.commit.committer.date).toLocaleString('pt-BR',{dateStyle:'medium',timeStyle:'short'}):'Data não informada'};
      lastChecked=Date.now();
      let installed=readInstalled();
      if(!installed){ installed=latest.sha;saveInstalled(installed); }
      hasUpdate=installed!==latest.sha;
      message=hasUpdate?'Encontramos uma atualização! Clique em “Atualizar aplicativo” para receber a versão mais recente.':'Você está com a versão mais recente conhecida. Se a tela parecer desatualizada, use “Atualizar aplicativo” para renovar os arquivos.';
      toggleBadge(hasUpdate);
    }catch(err){
      message=err.message+' Você pode usar “Atualizar aplicativo” para recarregar os arquivos diretamente do site.';
    }finally{working=false;display();}
  }

  async function apply(){
    if(working)return;
    if(!navigator.onLine){message='Conecte-se à internet antes de atualizar.';display();return;}
    if(!confirm('Atualizar o BoniVerso agora? Salve qualquer redação ou formulário que esteja preenchendo: a página será recarregada.'))return;
    working=true;message='Buscando e preparando os arquivos mais recentes…';display();
    try{
      const regs=await navigator.serviceWorker?.getRegistrations?.()||[];
      for(const reg of regs){
        if(reg.scope.startsWith(new URL('./',location.href).href)){
          try{await reg.update();}catch(_){/* prosseguir com renovação do cache */}
        }
      }
      if('caches' in window){
        const names=await caches.keys();
        await Promise.all(names.filter(name=>name.startsWith('boniverso-')).map(name=>caches.delete(name)));
      }
      if(latest?.sha)saveInstalled(latest.sha);
      // O link contém um identificador novo para impedir reutilização da página antiga.
      const url=new URL(location.href);
      url.searchParams.set('bv_atualizacao',Date.now().toString());
      location.replace(url.toString());
    }catch(err){
      message='Não foi possível concluir a atualização automática. Atualize a página no navegador e tente novamente. Detalhes: '+(err?.message||String(err));
      working=false;display();
    }
  }
  document.addEventListener('click',ev=>{
    const openTrigger=ev.target.closest('#bvUpdateOpen,#bvUpdateNav');
    if(openTrigger){ev.preventDefault();open();return;}
    const action=ev.target.closest('[data-bv-update]')?.dataset.bvUpdate;
    if(action==='close')close();
    else if(action==='check')check(true);
    else if(action==='apply')apply();
  });
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&panel&&!panel.hidden)close();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check(false);});
  window.addEventListener('online',()=>check(false));
  setInterval(()=>check(false),5*60*1000);
  // Não atrapalha a tela inicial: consulta em segundo plano, sem mostrar pop-ups.
  setTimeout(()=>check(false),2500);
})();
