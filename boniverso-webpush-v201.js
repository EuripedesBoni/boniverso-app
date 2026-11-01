/* BoniVerso 2.0.1 — Web Push remoto opt-in. Nenhuma chave privada no navegador. */
(()=>{
  'use strict';
  const $=(selector,scope=document)=>scope.querySelector(selector);
  const iOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||
      (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const installed=()=>window.matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone===true;
  const supported=()=>('serviceWorker' in navigator)&&('PushManager' in window)&&('Notification' in window)&&window.isSecureContext;
  let db=null,userId=null,started=false,busy=false,subscription=null,serverReady=false,info='';
  const css=`#bv-webpush-panel{margin:12px 0;padding:13px;border:1px solid #b6cdec;border-radius:13px;background:#f2f7ff;color:#18365e;font:13px/1.5 system-ui,sans-serif}
  #bv-webpush-panel strong{display:block;margin-bottom:5px;font-size:14px}
  #bv-webpush-panel p{margin:6px 0 10px}
  #bv-webpush-panel .bv-push-actions{display:flex;flex-wrap:wrap;gap:8px}
  #bv-webpush-panel button{border:0;border-radius:10px;background:#2862b6;color:white;padding:10px 14px;min-height:42px;font-weight:700;font-size:12px;cursor:pointer}
  #bv-webpush-panel button.secondary{background:#e5edf8;color:#1f487c}
  #bv-webpush-panel button:disabled{opacity:.45;cursor:wait}
  #bv-webpush-panel small{display:block;color:#526985;margin-top:9px}`;
  if(!$('#bv-webpush-style')){const el=document.createElement('style');el.id='bv-webpush-style';el.textContent=css;document.head.append(el)}
  function statusText(){
    if(!userId)return 'Entre na sua conta para ativar os avisos.';
    if(!supported())return 'Este navegador não disponibiliza Web Push. O sino de notificações continua funcionando normalmente.';
    if(iOS&&!installed())return 'No iPhone ou iPad: use Compartilhar → Adicionar à Tela de Início; abra o BoniVerso pelo novo ícone e volte ao sino de avisos.';
    if(Notification.permission==='denied')return 'As notificações foram bloqueadas pelo sistema. Reative nas configurações de notificações do aparelho.';
    if(!serverReady)return 'Verificando a conexão com o serviço seguro de notificações...';
    if(subscription)return 'Ativado neste aparelho! O BoniVerso pode avisar mesmo quando você não estiver com o aplicativo aberto.';
    return 'Ative o Web Push para receber alertas de aulas, mensagens e correções, mesmo com o aplicativo fechado.';
  }
  function mount(){
    const root=$('#bv-notices-root'),head=$('.bv-notice-head',root||document);
    if(!root||!head||!userId)return;
    if(supported()||iOS){const legacy=$('#bv-device-permission',root);if(legacy)legacy.hidden=true;}
    let panel=$('#bv-webpush-panel',root);
    if(!panel){
      panel=document.createElement('div');panel.id='bv-webpush-panel';
      panel.innerHTML='<strong>🔔 Avisos mesmo com o aplicativo fechado</strong><p id="bv-webpush-status"></p><div class="bv-push-actions"><button id="bv-webpush-toggle" type="button">Ativar notificações</button><button id="bv-webpush-test" class="secondary" type="button" hidden>Enviar notificação de teste</button></div><small>O recurso é opcional. A nota e os dados do aluno não aparecem na tela bloqueada. Os avisos continuam disponíveis no sino.</small>';
      head.insertAdjacentElement('afterend',panel);
      $('#bv-webpush-toggle',panel).addEventListener('click',toggle);
      $('#bv-webpush-test',panel).addEventListener('click',test);
    }
    paint();
  }
  function paint(){
    const el=$('#bv-webpush-panel');if(!el)return;
    const txt=info||statusText(),p=$('#bv-webpush-status',el),button=$('#bv-webpush-toggle',el),testBtn=$('#bv-webpush-test',el);
    if(p.textContent!==txt)p.textContent=txt;
    const usable=supported()&&(!iOS||installed())&&Notification.permission!=='denied';
    button.hidden=!usable;button.disabled=busy||!serverReady;
    button.textContent=busy?'Aguarde...':subscription?'Desativar neste aparelho':'Ativar notificações com app fechado';
    testBtn.hidden=!subscription;testBtn.disabled=busy;
  }
  async function api(action,extra={}){
    if(!db)throw Error('Entre na sua conta do BoniVerso.');
    const {data,error}=await db.functions.invoke('boniverso-push',{body:{action,...extra}});
    if(error){let m=error.message;try{m=(await error.context?.json?.())?.error||m}catch{}throw Error(m)}
    if(data?.error)throw Error(data.error);return data;
  }
  const fromBase64=base64=>{
    const normalized=base64.replace(/-/g,'+').replace(/_/g,'/');
    const raw=atob(normalized+'='.repeat((4-normalized.length%4)%4));
    return Uint8Array.from(raw,letter=>letter.charCodeAt(0));
  };
  const regReady=()=>Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('O aplicativo ainda não ativou o Service Worker. Reabra o BoniVerso e tente novamente.')),12000))]);
  async function sync(){
    info='';subscription=null;serverReady=false;
    if(!userId||!supported()||(iOS&&!installed())){mount();return}
    try{
      const [reg,config]=await Promise.all([regReady(),api('config')]);
      if(!config.ready)throw Error('O envio remoto está indisponível.');
      subscription=await reg.pushManager.getSubscription();
      serverReady=true;
      // Renovar inscrição se o navegador já estiver inscrito (por exemplo, após troca de versão).
      if(subscription&&Notification.permission==='granted'){
        await api('subscribe',{subscription:subscription.toJSON()});
        try{localStorage.setItem('boniverso-device-alerts-v200-'+userId,'off')}catch{}
      }
    }catch(err){info='Não foi possível consultar o Web Push: '+(err?.message||String(err));}
    mount();
  }
  async function toggle(){
    if(busy||!userId||!supported()||(iOS&&!installed()))return;
    busy=true;info='';paint();
    try{
      if(subscription){
        const endpoint=subscription.endpoint;
        await api('unsubscribe',{endpoint});
        await subscription.unsubscribe();subscription=null;
        info='Notificações com aplicativo fechado desativadas neste aparelho.';
      }else{
        // Apple exige que a solicitação de permissão se origine de um toque do usuário.
        const permission=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;
        if(permission!=='granted')throw Error('O aparelho não autorizou os avisos.');
        const config=await api('config');
        if(!config.public_key)throw Error('Chave pública não disponível.');
        const reg=await regReady();
        subscription=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:fromBase64(config.public_key)});
        try{await api('subscribe',{subscription:subscription.toJSON()})}catch(e){await subscription.unsubscribe();subscription=null;throw e}
        try{localStorage.setItem('boniverso-device-alerts-v200-'+userId,'off')}catch{}
        info='Web Push ativado! Use “Enviar notificação de teste” e confira os avisos com a tela bloqueada.';
      }
    }catch(e){info='Não foi possível configurar: '+(e?.message||String(e));}
    finally{busy=false;paint()}
  }
  async function test(){
    if(busy||!subscription||!userId)return;
    busy=true;info='Enviando teste ao serviço de notificações...';paint();
    try{const d=await api('test');info=`Notificação de teste enviada para ${d.sent||1} aparelho(s). Confira a tela de notificações do celular.`}
    catch(e){info='O teste não pôde ser entregue: '+(e?.message||String(e))}
    finally{busy=false;paint()}
  }
  async function setUser(user){
    const id=user?.id||null;
    if(id===userId)return;
    userId=id;info='';subscription=null;serverReady=false;
    if(!userId){$('#bv-webpush-panel')?.remove();return}
    mount();await sync();
  }
  async function init(){
    if(started||!window.BONIVERSO_DB)return;started=true;db=window.BONIVERSO_DB;
    db.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_OUT'){
        navigator.serviceWorker?.ready.then(reg=>reg.pushManager?.getSubscription()).then(sub=>sub?.unsubscribe()).catch(()=>{});
      }
      setTimeout(()=>setUser(session?.user),0);
    });
    const {data}=await db.auth.getUser();await setUser(data?.user);
    const observer=new MutationObserver(()=>{if(userId)mount()});
    observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&userId)sync()});
  }
  window.addEventListener('boniverso-db-ready',init);
  if(window.BONIVERSO_DB)init();
})();
