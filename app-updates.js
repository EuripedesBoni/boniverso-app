/* BoniVerso 1.0.7 — Central de Atualizações
 * Confere revisões públicas do GitHub; nunca reinicia o aplicativo sozinho.
 * Atualizações ficam disponíveis somente quando uma nova revisão é identificada.
 */
(() => {
  'use strict';
  const ROOT = 'EuripedesBoni/boniverso-app';
  const ENDPOINT = `https://api.github.com/repos/${ROOT}/commits/main`;
  const INSTALLED_KEY = 'boniverso-updates-last-applied-sha';
  const UI_VERSION_KEY = 'boniverso-updates-code-version';
  const CHECK_GAP = 30 * 60 * 1000;
  const APP_VERSION = '1.0.7';
  const icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.7 9A7 7 0 0 1 18.3 7L20 12"/><path d="M4 12l1.7 5A7 7 0 0 0 18.3 15"/></svg>';
  const clock = new Intl.DateTimeFormat('pt-BR', {hour:'2-digit',minute:'2-digit'});
  const dirtyFields = new Set();
  let latest = null;
  let lastChecked = 0;
  let working = false;
  let hasUpdate = false;
  let errorState = false;
  let message = 'Toque em “Verificar agora” para consultar a versão publicada.';
  let panel = null;
  let previouslyFocused = null;
  let calibrationNeeded = false;

  const read = key => {try{return localStorage.getItem(key)||'';}catch(_){return '';}};
  const save = (key,value) => {try{localStorage.setItem(key,value);}catch(_){/* privacidade do navegador */}};
  const shortSha = sha => sha ? sha.slice(0,7) : '—';
  const nowText = t => t ? clock.format(new Date(t)) : 'Ainda não verificado';
  const validSha = value => /^[a-f0-9]{40}$/i.test(String(value||''));
  // A primeira execução de um código recém-publicado já está usando sua versão.
  // Recalibrar a revisão local impede sugerir a instalação da mesma versão.
  calibrationNeeded = read(UI_VERSION_KEY) !== APP_VERSION;
  save(UI_VERSION_KEY,APP_VERSION);

  // Acompanhar apenas edições que ainda estejam na tela. Navegar entre telas
  // elimina campos antigos do DOM; nenhuma redação é recarregada automaticamente.
  document.addEventListener('input',ev=>{
    const el=ev.target;
    if(!el || !el.matches?.('textarea,input,select,[contenteditable="true"]'))return;
    if(el.closest('#bvUpdateOverlay'))return;
    dirtyFields.add(el);
  },true);
  document.addEventListener('change',ev=>{
    const el=ev.target;
    if(el?.matches?.('input[type="file"],select') && !el.closest('#bvUpdateOverlay'))dirtyFields.add(el);
  },true);
  document.addEventListener('submit',ev=>{
    ev.target.querySelectorAll?.('textarea,input,select,[contenteditable="true"]').forEach(el=>dirtyFields.delete(el));
  },true);
  const hasUnsubmittedChanges = () => [...dirtyFields].some(el=>el.isConnected && !el.closest('#bvUpdateOverlay'));

  function toggleBadge(visible){
    document.querySelectorAll('.bv-update-dot').forEach(el=>{el.hidden=!visible;});
    document.querySelectorAll('.bv-update-quick,.bv-update-nav').forEach(el=>{
      el.classList.toggle('bv-has-new',visible);
      el.setAttribute('aria-label',visible?'Nova atualização disponível — Central de Atualizações':'Central de Atualizações');
    });
  }
  function ensureNav(){
    const nav=document.getElementById('sideNav');
    if(!nav || nav.querySelector('#bvUpdateNav'))return;
    const el=document.createElement('button');
    el.id='bvUpdateNav';el.type='button';el.className='nav-link bv-update-nav';
    el.innerHTML=icon+'<span>Atualizações</span><span class="bv-update-dot" hidden aria-hidden="true"></span>';
    nav.appendChild(el);toggleBadge(hasUpdate);
  }
  function ensureQuick(){
    const actions=document.querySelector('.top-actions');
    if(!actions || actions.querySelector('#bvUpdateOpen'))return;
    const button=document.createElement('button');
    button.id='bvUpdateOpen';button.type='button';button.className='bv-update-quick';
    button.title='Central de Atualizações';button.setAttribute('aria-label','Central de Atualizações');
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

  // Ajustes visuais discretos, sem exigir alteração dos estilos atuais do app.
  const extraStyle=document.createElement('style');
  extraStyle.textContent=`
    .bv-last-checked{display:flex;align-items:center;gap:8px;color:#4c6789;font-size:12px;margin:-6px 2px 17px;line-height:1.5}
    .bv-last-checked svg{flex:0 0 17px;color:#4477b6}
    .bv-update-state-error{color:#99482d;background:#fff0ea}
    .bv-update-no-need{font-size:12px;line-height:1.45;color:#5b7190;text-align:center;margin:12px 0 2px}
    .bv-update-no-need[hidden]{display:none}
    .bv-update-buttons .bv-update-button:disabled{opacity:.52;cursor:not-allowed}
    .bv-update-buttons .bv-update-button:disabled svg{opacity:.7}
  `;
  document.head.appendChild(extraStyle);

  function getDialog(){
    if(panel)return panel;
    const overlay=document.createElement('div');
    overlay.id='bvUpdateOverlay';overlay.className='bv-update-overlay';overlay.hidden=true;
    overlay.innerHTML=`<section class="bv-update-dialog" role="dialog" aria-modal="true" aria-labelledby="bvUpdateTitle">
      <div class="bv-update-heading"><div class="bv-update-heading-icon">${icon}</div><div><span class="bv-update-eyebrow">BONIVERSO · RSB EDUCAÇÃO</span><h2 id="bvUpdateTitle">Central de Atualizações</h2></div><button type="button" class="bv-update-close" data-bv-update="close" aria-label="Fechar">×</button></div>
      <div class="bv-update-content">
        <div class="bv-update-version"><div><span class="bv-update-kicker">VERSÃO DO APLICATIVO</span><strong>v${APP_VERSION}</strong><small id="bvInstalledCommit">Versão em uso no navegador</small></div><span id="bvUpdateState" class="bv-update-state">A verificar</span></div>
        <p class="bv-update-message" id="bvUpdateMessage" role="status" aria-live="polite"></p>
        <div class="bv-last-checked"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span id="bvLastChecked">Última verificação: ainda não realizada</span></div>
        <div id="bvUpdateDetails" class="bv-update-details" hidden><strong>Última revisão encontrada</strong><p id="bvUpdateCommitMessage"></p><small id="bvUpdateCommitDate"></small></div>
        <div class="bv-update-buttons"><button type="button" class="bv-update-button bv-update-secondary" data-bv-update="check">${icon}<span id="bvCheckLabel">Verificar agora</span></button><button type="button" class="bv-update-button bv-update-primary" data-bv-update="apply" disabled>${icon}<span id="bvApplyLabel">Nenhuma atualização pendente</span></button></div>
        <p class="bv-update-no-need" id="bvUpToDateHint">Você não precisa fazer nada quando o aplicativo estiver atualizado.</p>
        <div class="bv-update-info"><strong>Atualizações sem preocupação</strong><p>O BoniVerso consulta novas revisões na plataforma. Quando houver uma atualização, o botão será habilitado. Seus dados, matrículas e redações já enviadas permanecem na sua conta.</p><p><strong>Segurança:</strong> o aplicativo nunca recarrega automaticamente enquanto você escreve. Caso haja conteúdo ainda não enviado, pediremos confirmação antes de atualizar.</p></div>
        <p class="bv-update-foot">Disponível no celular e computador. É necessária uma conexão à internet para consultar novas revisões.</p>
      </div>
    </section>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click',ev=>{if(ev.target===overlay)close();});
    panel=overlay;return panel;
  }

  function display(){
    if(!panel || panel.hidden)return;
    const revision=read(INSTALLED_KEY);
    panel.querySelector('#bvInstalledCommit').textContent='Revisão conhecida: '+shortSha(revision);
    const status=panel.querySelector('#bvUpdateState');
    status.textContent=working?'Verificando…':errorState?'Não verificado':hasUpdate?'Nova revisão':lastChecked?'Em dia':'A verificar';
    status.classList.toggle('bv-update-state-new',hasUpdate && !errorState);
    status.classList.toggle('bv-update-state-error',errorState);
    panel.querySelector('#bvUpdateMessage').textContent=message;
    panel.querySelector('#bvLastChecked').textContent=lastChecked?'Última verificação concluída: '+nowText(lastChecked):'Última verificação: ainda não realizada';
    const details=panel.querySelector('#bvUpdateDetails');
    details.hidden=!latest;
    if(latest){
      panel.querySelector('#bvUpdateCommitMessage').textContent=latest.subject;
      panel.querySelector('#bvUpdateCommitDate').textContent=latest.date;
    }
    const checkButton=panel.querySelector('[data-bv-update="check"]');
    checkButton.disabled=working;
    panel.querySelector('#bvCheckLabel').textContent=working?'Consultando…':'Verificar agora';
    const applyButton=panel.querySelector('[data-bv-update="apply"]');
    applyButton.disabled=working || !hasUpdate || errorState || !navigator.onLine;
    panel.querySelector('#bvApplyLabel').textContent=working?'Aguarde…':hasUpdate?'Instalar nova revisão':'Nenhuma atualização pendente';
    panel.querySelector('#bvUpToDateHint').hidden=hasUpdate;
  }
  function open(){
    previouslyFocused=document.activeElement;
    getDialog().hidden=false;
    document.body.classList.add('bv-updates-open');
    display();panel.querySelector('[data-bv-update="close"]').focus();
    check(false);
  }
  function close(){
    if(!panel)return;
    panel.hidden=true;document.body.classList.remove('bv-updates-open');
    previouslyFocused?.focus?.();
  }

  async function check(force=false){
    if(working)return;
    if(!force && Date.now()-lastChecked<CHECK_GAP)return;
    if(!navigator.onLine){
      errorState=true;
      message='Sem internet. Conecte-se para verificar se existe uma atualização.';
      display();return;
    }
    working=true;errorState=false;
    message='Verificando as versões publicadas no GitHub…';display();
    try{
      const response=await fetch(ENDPOINT,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
      if(!response.ok){
        throw new Error(response.status===403
          ? 'O GitHub limitou temporariamente as consultas. Tente novamente mais tarde.'
          : 'Não foi possível consultar o GitHub (código '+response.status+').');
      }
      const data=await response.json();
      if(!validSha(data.sha))throw new Error('A consulta retornou dados inesperados.');
      latest={
        sha:data.sha,
        subject:String(data.commit?.message||'Revisão do BoniVerso').split('\n')[0].slice(0,180),
        date:data.commit?.committer?.date
          ? new Date(data.commit.committer.date).toLocaleString('pt-BR',{dateStyle:'medium',timeStyle:'short'})
          : 'Data não informada'
      };
      lastChecked=Date.now();
      let installed=read(INSTALLED_KEY);
      if(calibrationNeeded || !validSha(installed)){
        // Se o próprio código da Central já mudou, o navegador já baixou esta revisão.
        installed=latest.sha;
        save(INSTALLED_KEY,installed);
        calibrationNeeded=false;
      }
      hasUpdate=installed!==latest.sha;
      errorState=false;
      message=hasUpdate
        ? `Verificação concluída às ${nowText(lastChecked)}. Encontramos uma revisão mais recente. Salve o que estiver escrevendo antes de instalá-la.`
        : `Verificação concluída às ${nowText(lastChecked)}. Tudo certo! Você já está usando a revisão mais recente conhecida.`;
      toggleBadge(hasUpdate);
    }catch(err){
      errorState=true;
      message='A verificação não pôde ser concluída. '+(err?.message||String(err))+' Suas atividades continuam disponíveis.';
    }finally{working=false;display();}
  }

  async function apply(){
    if(working)return;
    if(!hasUpdate || !latest || errorState){
      message='Nenhuma atualização pendente. Use “Verificar agora” para consultar novidades.';
      display();return;
    }
    if(!navigator.onLine){
      errorState=true;message='Conecte-se à internet antes de instalar uma atualização.';
      display();return;
    }
    // Só interromper com uma confirmação se a pessoa estiver com um texto em edição.
    if(hasUnsubmittedChanges() && !window.confirm(
      'Você tem conteúdo em edição. Salve ou envie sua redação antes de atualizar. Deseja recarregar o aplicativo mesmo assim?'
    ))return;
    working=true;message='Preparando os arquivos mais recentes…';display();
    try{
      if('serviceWorker' in navigator){
        const expectedScope=new URL('./',location.href).href;
        const regs=await navigator.serviceWorker.getRegistrations();
        for(const reg of regs){
          if(reg.scope===expectedScope){
            try{await reg.update();}catch(_){/* Network-first do navegador continua válido. */}
          }
        }
      }
      save(INSTALLED_KEY,latest.sha);
      const url=new URL(location.href);
      url.searchParams.set('bv_atualizacao',latest.sha.slice(0,12)+'-'+Date.now());
      location.replace(url.toString());
    }catch(err){
      working=false;
      message='Não foi possível aplicar a revisão. Seus dados foram preservados. '+(err?.message||String(err));
      display();
    }
  }

  document.addEventListener('click',ev=>{
    const opener=ev.target.closest?.('#bvUpdateOpen,#bvUpdateNav');
    if(opener){ev.preventDefault();open();return;}
    const action=ev.target.closest?.('[data-bv-update]')?.dataset.bvUpdate;
    if(action==='close')close();
    else if(action==='check')check(true);
    else if(action==='apply')apply();
  });
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&panel&&!panel.hidden)close();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check(false);});
  window.addEventListener('online',()=>check(false));
  window.setInterval(()=>check(false),5*60*1000);
  window.setTimeout(()=>check(false),2500);
})();
