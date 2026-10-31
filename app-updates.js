/* BoniVerso 1.0.9 — Central de Atualizações confiável.
 * Usa a revisão REALMENTE SERVIDA pelo GitHub Pages (sw.js), não o último commit.
 * Sem recarregamento automático; protege redações e formulários em edição.
 * Ao publicar qualquer versão futura, altere o CACHE em sw.js.
 */
(() => {
  'use strict';
  const BUNDLED_VERSION = '1.1.2';
  const BUNDLED_RELEASE = 'boniverso-v112-rooms-search-sidebar';
  const RELEASE_STORAGE = 'boniverso-update-release-applied';
  const MAX_CHECK_AGE = 15 * 60 * 1000;
  const UPDATE_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.7 9A7 7 0 0 1 18.3 7L20 12M4 12l1.7 5A7 7 0 0 0 18.3 15"/></svg>';
  const $ = (selector, root=document) => root.querySelector(selector);
  const VALID_RELEASE = /^boniverso-v([0-9]{3,})-[a-z0-9-]+$/;
  const dirty = new Set();
  let releaseInUse = BUNDLED_RELEASE;
  let latestPublished = null;
  let lastCheckedAt = 0;
  let checking = false;
  let checkError = false;
  let feedback = 'Toque em “Verificar agora” para consultar a publicação do BoniVerso.';
  let dialog = null;
  let lastFocus = null;

  function storageRead(key) {try {return localStorage.getItem(key)||'';} catch(_) {return '';}}
  function storageWrite(key,value) {try {localStorage.setItem(key,value);} catch(_) {/* Navegação privada */}}
  function releaseNumber(id) {const m=String(id||'').match(VALID_RELEASE);return m?Number(m[1]):0;}
  // Nunca tratar uma versão antiga do script como uma revisão já instalada.
  const storedRelease = storageRead(RELEASE_STORAGE);
  if (releaseNumber(storedRelease) >= releaseNumber(BUNDLED_RELEASE)) {
    releaseInUse = storedRelease;
  } else {
    storageWrite(RELEASE_STORAGE,BUNDLED_RELEASE);
  }
  const timeText = value => value ? new Date(value).toLocaleString('pt-BR', {hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}) : 'ainda não realizada';
  const updatedAvailable = () => !!latestPublished && releaseNumber(latestPublished) > releaseNumber(releaseInUse);

  // Proteger redações ainda não enviadas, inclusive arquivos selecionados.
  function track(el) {
    if (!el?.matches?.('textarea,input,select,[contenteditable="true"]')) return;
    if (el.closest('#bvUpdateOverlay')) return;
    if (el.matches('input[type="hidden"],input[type="button"],input[type="submit"],input[type="checkbox"]')) return;
    dirty.add(el);
  }
  document.addEventListener('input', e => track(e.target), true);
  document.addEventListener('change', e => track(e.target), true);
  document.addEventListener('submit', e => {
    e.target.querySelectorAll?.('textarea,input,select,[contenteditable="true"]').forEach(el=>dirty.delete(el));
  }, true);
  const hasDraft = () => [...dirty].some(el=>el.isConnected && !el.closest('#bvUpdateOverlay'));

  function toggleIndication() {
    const hasNew = updatedAvailable() && !checkError;
    document.querySelectorAll('.bv-update-dot').forEach(el => {el.hidden = !hasNew;});
    document.querySelectorAll('.bv-update-quick,.bv-update-nav').forEach(el => {
      el.classList.toggle('bv-has-new',hasNew);
      el.setAttribute('aria-label',hasNew?'Nova atualização disponível — Central de Atualizações':'Central de Atualizações');
    });
  }
  function ensureMenu() {
    const nav=$('#sideNav');
    if(nav && !nav.querySelector('#bvUpdateNav')) {
      const el=document.createElement('button');
      el.type='button'; el.id='bvUpdateNav'; el.className='nav-link bv-update-nav';
      el.innerHTML=UPDATE_ICON+'<span>Atualizações</span><span class="bv-update-dot" hidden aria-hidden="true"></span>';
      nav.appendChild(el);
    }
    const actions=$('.top-actions');
    if(actions && !actions.querySelector('#bvUpdateOpen')) {
      const el=document.createElement('button');
      el.type='button';el.id='bvUpdateOpen';el.className='bv-update-quick';
      el.title='Central de Atualizações';el.setAttribute('aria-label','Central de Atualizações');
      el.innerHTML=UPDATE_ICON+'<span class="bv-update-dot" hidden aria-hidden="true"></span>';
      actions.insertBefore(el,actions.querySelector('#notifications') || actions.firstChild);
    }
    toggleIndication();
  }
  let scheduled=false;
  const observer = new MutationObserver(()=> {
    if(scheduled)return;
    scheduled=true;
    queueMicrotask(()=>{scheduled=false;ensureMenu();});
  });
  observer.observe($('#app')||document.body,{childList:true,subtree:true});
  ensureMenu();

  // A experiência autenticada não registrava Service Worker (somente o modo
  // demonstração fazia isso). Registrar também para alunos e professores reais.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    const installWorker = () => navigator.serviceWorker.register('./sw.js', {scope:'./'}).catch(err=>{
      console.warn('BoniVerso: modo offline indisponível',err);
    });
    if (document.readyState === 'complete') installWorker();
    else window.addEventListener('load',installWorker,{once:true});
  }

  const additionalCSS=document.createElement('style');
  additionalCSS.textContent=`
    .bv-update-checktime{font-size:12px;line-height:1.5;color:#4c6789;margin:0 0 14px}
    .bv-update-manual{width:100%;margin-top:10px;min-height:40px;font-size:12px;background:#f1f5fa}
    .bv-update-state-error{color:#a24331;background:#fff0ea}
    .bv-update-button:disabled{opacity:.55;cursor:not-allowed}
    .bv-update-manual-note{font-size:11px;color:#6b7b93;line-height:1.5;margin:9px 0 0}
    .bv-update-foot{line-height:1.6}
  `;
  document.head.appendChild(additionalCSS);

  function createDialog() {
    if(dialog)return dialog;
    const overlay=document.createElement('div');
    overlay.id='bvUpdateOverlay';overlay.className='bv-update-overlay';overlay.hidden=true;
    overlay.innerHTML=`<section class="bv-update-dialog" role="dialog" aria-modal="true" aria-labelledby="bvUpdateTitle">
      <div class="bv-update-heading"><div class="bv-update-heading-icon">${UPDATE_ICON}</div><div><span class="bv-update-eyebrow">BONIVERSO · RSB EDUCAÇÃO</span><h2 id="bvUpdateTitle">Central de Atualizações</h2></div><button type="button" class="bv-update-close" data-bv-act="close" aria-label="Fechar">×</button></div>
      <div class="bv-update-content">
        <div class="bv-update-version"><div><span class="bv-update-kicker">VERSÃO DO APLICATIVO</span><strong>v${BUNDLED_VERSION}</strong><small id="bvCurrentRelease">Arquivos desta versão carregados</small></div><span id="bvUpdateState" class="bv-update-state">A verificar</span></div>
        <p id="bvUpdateMessage" class="bv-update-message" role="status" aria-live="polite"></p>
        <p id="bvUpdateCheckTime" class="bv-update-checktime">Última verificação: ainda não realizada</p>
        <div id="bvUpdateDetails" class="bv-update-details" hidden><strong>Nova versão publicada</strong><p id="bvPublishedRelease"></p></div>
        <div class="bv-update-buttons"><button type="button" class="bv-update-button bv-update-secondary" data-bv-act="check">${UPDATE_ICON}<span id="bvCheckAction">Verificar agora</span></button><button type="button" class="bv-update-button bv-update-primary" data-bv-act="apply" disabled>${UPDATE_ICON}<span id="bvApplyAction">Nenhuma atualização pendente</span></button></div>
        <button type="button" class="bv-update-button bv-update-secondary bv-update-manual" data-bv-act="reload">Recarregar a tela</button>
        <p class="bv-update-manual-note">Use “Recarregar a tela” somente se alguma mudança não aparecer. Salve seus textos antes.</p>
        <div class="bv-update-info"><strong>Atualizações sem interromper seus estudos</strong><p>O BoniVerso verifica os arquivos já publicados no site. Quando houver uma versão nova, habilita a atualização sem precisar baixar outro aplicativo.</p><p><strong>Segurança:</strong> nenhuma redação será recarregada automaticamente. Textos enviados continuam salvos no Supabase; textos ainda em edição devem ser salvos antes de recarregar.</p></div>
        <p class="bv-update-foot">O recurso precisa de internet. Caso a publicação do GitHub ainda esteja em andamento, a versão nova só aparecerá após ser disponibilizada no site.</p>
      </div>
    </section>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)closePanel();});
    dialog=overlay;return dialog;
  }
  function render() {
    if(!dialog || dialog.hidden)return;
    $('#bvCurrentRelease',dialog).textContent='Revisão em uso: '+releaseInUse;
    const state=$('#bvUpdateState',dialog);
    state.textContent=checking?'Verificando…':checkError?'Não verificado':updatedAvailable()?'Nova versão':lastCheckedAt?'Em dia':'A verificar';
    state.classList.toggle('bv-update-state-new',updatedAvailable()&&!checkError);
    state.classList.toggle('bv-update-state-error',checkError);
    $('#bvUpdateMessage',dialog).textContent=feedback;
    $('#bvUpdateCheckTime',dialog).textContent='Última verificação: '+timeText(lastCheckedAt);
    const details=$('#bvUpdateDetails',dialog);
    details.hidden=!updatedAvailable();
    if(latestPublished)$('#bvPublishedRelease',dialog).textContent=latestPublished;
    $('#bvCheckAction',dialog).textContent=checking?'Consultando…':'Verificar agora';
    $('[data-bv-act="check"]',dialog).disabled=checking;
    $('[data-bv-act="apply"]',dialog).disabled=checking||checkError||!updatedAvailable()||!navigator.onLine;
    $('#bvApplyAction',dialog).textContent=updatedAvailable()?'Instalar nova versão':'Nenhuma atualização pendente';
    toggleIndication();
  }
  function openPanel() {
    lastFocus=document.activeElement;
    createDialog().hidden=false;
    document.body.classList.add('bv-updates-open');
    render();
    $('[data-bv-act="close"]',dialog).focus();
    check(false);
  }
  function closePanel() {
    if(!dialog)return;
    dialog.hidden=true;
    document.body.classList.remove('bv-updates-open');
    lastFocus?.focus?.();
  }

  async function check(force=false) {
    if(checking)return;
    if(!force && Date.now()-lastCheckedAt<MAX_CHECK_AGE)return;
    if(!navigator.onLine){checkError=true;feedback='Sem conexão. Conecte-se à internet e tente novamente.';render();return;}
    checking=true;checkError=false;
    feedback='Consultando a versão publicada no site BoniVerso…';render();
    try {
      // SW é publicado junto a cada versão, no MESMO domínio: evita limite da API GitHub.
      const url=new URL('./sw.js',location.href);
      url.searchParams.set('bv_verificar',String(Date.now()));
      const res=await fetch(url.toString(),{cache:'no-store',redirect:'error'});
      if(!res.ok)throw new Error('O servidor respondeu com código '+res.status+'.');
      const body=await res.text();
      const match=body.match(/const\s+CACHE\s*=\s*['"](boniverso-v[0-9]{3,}-[a-z0-9-]+)['"]\s*;/i);
      if(!match || !VALID_RELEASE.test(match[1]))throw new Error('Não foi possível identificar a versão disponibilizada.');
      latestPublished=match[1];
      lastCheckedAt=Date.now();
      checkError=false;
      if(updatedAvailable()){
        feedback='Verificação concluída: há uma nova versão disponível. Salve qualquer redação em edição antes de instalar.';
      }else if(releaseNumber(latestPublished)<releaseNumber(releaseInUse)){
        feedback='Verificação concluída. O site ainda está finalizando a publicação desta versão. Não é necessário atualizar agora.';
      }else{
        feedback='Verificação concluída: tudo em dia! Você já está usando a versão mais recente publicada.';
      }
    } catch(err) {
      checkError=true;
      feedback='Não foi possível verificar agora: '+(err?.message||String(err))+' Seus dados permanecem seguros.';
    } finally {checking=false;render();}
  }

  function approveReload() {
    return !hasDraft() || window.confirm('Há conteúdo preenchido que pode não ter sido enviado. Salve sua redação ou formulário antes de continuar. Deseja recarregar mesmo assim?');
  }
  async function doReload(newRelease) {
    if(checking)return;
    if(!approveReload())return;
    checking=true;feedback='Preparando os arquivos do BoniVerso…';render();
    try {
      if('serviceWorker' in navigator){
        const scope=new URL('./',location.href).href;
        const regs=await navigator.serviceWorker.getRegistrations();
        const match=regs.filter(reg=>reg.scope===scope);
        await Promise.allSettled(match.map(reg=>reg.update()));
      }
      if(newRelease){
        // Atualizar a revisão local somente depois do pedido explícito.
        releaseInUse=latestPublished;
        storageWrite(RELEASE_STORAGE,releaseInUse);
      }
      const url=new URL(location.href);
      url.searchParams.set('bv_atualizacao',String(Date.now()));
      location.replace(url.toString());
    }catch(err){
      checking=false;
      feedback='Não foi possível recarregar agora: '+(err?.message||String(err));
      render();
    }
  }
  document.addEventListener('click',e=>{
    const target=e.target.closest?.('#bvUpdateOpen,#bvUpdateNav');
    if(target){e.preventDefault();openPanel();return;}
    const action=e.target.closest?.('[data-bv-act]')?.dataset.bvAct;
    if(!action)return;
    if(action==='close')closePanel();
    else if(action==='check')check(true);
    else if(action==='apply' && updatedAvailable() && !checkError)doReload(true);
    else if(action==='reload')doReload(false);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && dialog && !dialog.hidden)closePanel();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check(false);});
  window.addEventListener('online',()=>check(false));
  window.setInterval(()=>check(false),5*60*1000);
  window.setTimeout(()=>check(false),2500);
})();
