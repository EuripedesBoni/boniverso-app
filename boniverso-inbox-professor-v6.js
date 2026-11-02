/* BoniVerso · Caixa de Entrada do Professor — apresentação responsiva v6
 * Arquivo complementar à página mensagens-turma-v3.html.
 * Não consulta dados, não modifica regras de acesso, não exibe conteúdo privado.
 * Reorganiza apenas os elementos que a página autorizada já renderizou.
 */
(()=>{
  'use strict';
  const styleId='bv-professor-inbox-style-v6';
  const rootSelector='#teacherInbox';
  const css=`
  ${rootSelector}[hidden]{display:none!important}
  ${rootSelector}{background:#fff!important;border:1px solid #dae4f1!important;border-radius:20px!important;
    box-shadow:0 6px 20px rgba(13,45,88,.045)!important;min-width:0!important;}
  ${rootSelector} .heading{display:flex!important;align-items:center!important;gap:12px!important;
    justify-content:space-between!important;flex-wrap:wrap!important;}
  ${rootSelector} #inboxTitle{font-size:clamp(20px,3.7vw,26px)!important;line-height:1.35!important;
    font-weight:800!important;color:#183558!important;overflow-wrap:anywhere!important;}
  ${rootSelector} #inboxRefresh{flex:none!important;min-height:42px!important;padding:10px 14px!important;
    border-radius:11px!important;background:#edf4ff!important;border:1px solid #c5d6ed!important;
    color:#2a558d!important;font:700 13px/1.2 system-ui,sans-serif!important;box-shadow:none!important;}
  ${rootSelector} .bv-inbox-controls{display:grid!important;grid-template-columns:minmax(220px,1fr) minmax(190px,235px) auto!important;
    align-items:end!important;gap:12px!important;margin:16px 0!important;}
  ${rootSelector} .bv-inbox-controls .bv-prof-filter{display:flex!important;flex-direction:column!important;gap:6px!important;min-width:190px!important;}
  ${rootSelector} .bv-inbox-controls #inboxStatusFilter{display:block!important;width:100%!important;min-height:44px!important;
    border-radius:11px!important;border:1px solid #c1d2e6!important;background:#fff!important;
    color:#193758!important;padding:10px 32px 10px 12px!important;font:600 13px/1.35 system-ui,sans-serif!important;
    max-width:none!important;text-align:left!important;appearance:auto!important;-webkit-appearance:menulist!important;}
  ${rootSelector} .bv-inbox-controls #inboxStatusFilter:focus-visible{outline:3px solid #76a2e6!important;outline-offset:2px!important;}
  ${rootSelector} .bv-inbox-controls .search{min-width:0!important;display:block!important;}
  ${rootSelector} .bv-inbox-controls label{font-weight:750!important;font-size:13px!important;color:#294664!important;}
  ${rootSelector} .bv-inbox-controls input[type="search"]{display:block!important;width:100%!important;
    min-width:0!important;min-height:44px!important;margin-top:6px!important;padding:10px 12px!important;
    border:1px solid #c1d2e6!important;border-radius:11px!important;background:#fff!important;
    color:#193758!important;font:400 14px/1.4 system-ui,sans-serif!important;text-align:left!important;}
  ${rootSelector} .bv-inbox-controls .unread-toggle{display:flex!important;align-items:center!important;
    min-height:44px!important;gap:9px!important;white-space:normal!important;}
  ${rootSelector} .bv-inbox-controls .unread-toggle input{appearance:auto!important;flex:none!important;
    width:18px!important;height:18px!important;margin:0!important;accent-color:#3c6cc7!important;}
  ${rootSelector} .bv-inbox-controls .unread-toggle span{font-weight:700!important;color:#375371!important;font-size:13px!important;}
  ${rootSelector} #inboxStatus{margin:6px 0 14px!important;color:#617791!important;font-size:13px!important;
    line-height:1.5!important;}
  ${rootSelector} #inboxList{display:flex!important;flex-direction:column!important;
    align-items:stretch!important;gap:14px!important;min-width:0!important;}
  ${rootSelector} button.bv-inbox-item{appearance:none!important;-webkit-appearance:none!important;
    display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;
    gap:9px!important;width:100%!important;min-width:0!important;height:auto!important;min-height:0!important;
    padding:16px 18px!important;margin:0!important;text-align:left!important;color:#1e3a5d!important;
    background:#f9fbff!important;border:1px solid #d9e4f2!important;border-left:4px solid #90b0df!important;
    border-radius:16px!important;box-shadow:0 4px 13px rgba(15,42,80,.05)!important;
    font:400 14px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif!important;
    overflow-wrap:anywhere!important;white-space:normal!important;cursor:pointer!important;}
  ${rootSelector} button.bv-inbox-item.is-unread{background:#f0f6ff!important;border-color:#a8c4e8!important;
    border-left-color:#3368c9!important;}
  ${rootSelector} button.bv-inbox-item:hover{background:#f4f8ff!important;border-color:#a9c5ec!important;}
  ${rootSelector} button.bv-inbox-item:focus-visible{outline:3px solid #76a2e6!important;outline-offset:3px!important;}
  ${rootSelector} button.bv-inbox-item:disabled{opacity:.68!important;cursor:wait!important;}
  ${rootSelector} .bv-inbox-main{display:flex!important;flex-direction:column!important;gap:4px!important;
    width:100%!important;min-width:0!important;flex:auto!important;}
  ${rootSelector} .bv-inbox-name{display:block!important;color:#1c3959!important;font-size:16px!important;
    font-weight:800!important;line-height:1.35!important;white-space:normal!important;overflow-wrap:anywhere!important;}
  ${rootSelector} .bv-inbox-class{display:block!important;font-size:13px!important;line-height:1.5!important;
    font-weight:550!important;color:#647891!important;white-space:normal!important;overflow-wrap:anywhere!important;}
  ${rootSelector} .bv-inbox-meta{display:none!important}
  ${rootSelector} .bv-inbox-right{display:flex!important;flex-direction:row!important;justify-content:space-between!important;
    align-items:center!important;gap:10px!important;flex:auto!important;width:100%!important;min-width:0!important;}
  ${rootSelector} .bv-inbox-time{display:block!important;font-size:12px!important;font-weight:500!important;
    color:#627c99!important;white-space:normal!important;}
  ${rootSelector} .bv-inbox-pill{display:inline-flex!important;justify-content:center!important;align-items:center!important;
    min-width:25px!important;min-height:25px!important;border-radius:999px!important;background:#3167c4!important;
    color:#fff!important;font-size:12px!important;font-weight:800!important;padding:2px 8px!important;}
  ${rootSelector} .bv-inbox-arrow{display:none!important}
  ${rootSelector} .bv-prof-card-footer{display:flex!important;justify-content:space-between!important;
    align-items:center!important;gap:12px!important;flex-wrap:wrap!important;
    border-top:1px solid #e1eaf4!important;padding-top:11px!important;margin-top:3px!important;}
  ${rootSelector} .bv-prof-status{display:inline-flex!important;align-items:center!important;gap:6px!important;
    max-width:100%!important;padding:5px 9px!important;border-radius:999px!important;
    font-size:12px!important;font-weight:800!important;line-height:1.3!important;white-space:normal!important;}
  ${rootSelector} .bv-prof-status.pending{background:#fff1d6!important;color:#815813!important;border:1px solid #efdab0!important;}
  ${rootSelector} .bv-prof-status.answered{background:#e6f6ed!important;color:#246746!important;border:1px solid #c3e4d1!important;}
  ${rootSelector} .bv-prof-card-action{display:inline-flex!important;align-items:center!important;gap:8px!important;
    color:#2c5eae!important;font-size:13px!important;font-weight:800!important;}
  ${rootSelector} .bv-prof-card-action .arrow{font-size:20px!important;line-height:1!important;}
  @media(max-width:960px){
    ${rootSelector} .bv-inbox-controls{grid-template-columns:minmax(0,1fr) minmax(180px,220px)!important;}
    ${rootSelector} .bv-inbox-controls .unread-toggle{grid-column:1/-1!important;}
  }
  @media(max-width:700px){
    ${rootSelector}{padding:16px!important;}
    ${rootSelector} .bv-inbox-controls{grid-template-columns:1fr!important;gap:9px!important;}
    ${rootSelector} .bv-inbox-controls .unread-toggle{width:100%!important;min-height:36px!important;}
    ${rootSelector} button.bv-inbox-item{padding:14px!important;gap:10px!important;}
    ${rootSelector} .bv-inbox-name{font-size:15px!important;}
    ${rootSelector} .bv-prof-card-footer{gap:9px!important;}
  }
  `;
  let observedRoot=null;
  let obs=null;
  function installCss(){
    if(document.getElementById(styleId))return;
    const style=document.createElement('style');style.id=styleId;style.textContent=css;
    document.head.appendChild(style);
  }
  function enhance(){
    const root=document.querySelector(`${rootSelector} #inboxList`);
    if(!root)return;
    for(const btn of root.querySelectorAll('button.bv-inbox-item:not([data-bv-prof-v5])')){
      // Não substituímos o botão; ele conserva o clique e as permissões implementadas na página.
      const meta=btn.querySelector('.bv-inbox-meta');
      const isStudentLast=(meta?.textContent||'').toLocaleLowerCase('pt-BR').includes('estudante');
      const footer=document.createElement('span');footer.className='bv-prof-card-footer';
      const state=document.createElement('span');
      state.className='bv-prof-status '+(isStudentLast?'pending':'answered');
      state.textContent=isStudentLast?'● Aguardando resposta':'✓ Respondida';
      const action=document.createElement('span');action.className='bv-prof-card-action';
      action.append(document.createTextNode('Abrir conversa'));
      const chev=document.createElement('span');chev.className='arrow';chev.textContent='›';chev.setAttribute('aria-hidden','true');
      action.appendChild(chev);footer.append(state,action);btn.appendChild(footer);
      btn.dataset.bvProfV5='1';
    }
  }
  function connect(){
    installCss();
    const root=document.querySelector(`${rootSelector} #inboxList`);
    if(!root)return;
    if(root!==observedRoot){
      obs?.disconnect();observedRoot=root;
      obs=new MutationObserver(enhance);
      obs.observe(root,{childList:true});
    }
    enhance();
  }
  function start(){
    connect();
    window.addEventListener('pageshow',connect);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)connect();});
    // O elemento existe no HTML original; a lista é preenchida depois da autenticação.
    if(!observedRoot){
      let tries=0;
      const find=setInterval(()=>{connect();if(observedRoot||++tries>20)clearInterval(find)},500);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
