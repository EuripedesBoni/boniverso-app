/* BoniVerso 2.0.0 — alertas por notificação de navegador enquanto o app está em uso.
   Alertas de navegador exigem permissão explícita. NÃO implementa Web Push remoto
   quando o app está totalmente fechado. O sino dentro do BoniVerso funciona
   independentemente desta preferência. Não contém segredos ou chaves de servidor.
*/
(()=>{
  'use strict';
  const $=(sel,root=document)=>root.querySelector(sel);
  const KEY='boniverso-device-alerts-v200-';
  const HAS_NOTIFICATIONS=typeof Notification!=='undefined';
  const iOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||
    (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const installed=()=>window.matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone===true;
  const enabled=userId=>{try{return localStorage.getItem(KEY+userId)==='on'}catch{return false}};
  const setEnabled=(userId,value)=>{try{localStorage.setItem(KEY+userId,value?'on':'off')}catch{}};
  let db=null,userId=null,initial=true,known=new Set(),timer=null,busy=false,started=false;
  let phase='ready';

  const permission=()=>HAS_NOTIFICATIONS?Notification.permission:'unsupported';
  function message(){
    if(iOS&&!installed())return 'No iPhone ou iPad, abra o BoniVerso pelo ícone adicionado à Tela de Início para permitir avisos do aparelho.';
    if(!HAS_NOTIFICATIONS||!('serviceWorker' in navigator))return 'Este navegador não oferece alertas do aparelho neste modo. Os avisos continuam no sino do BoniVerso.';
    if(permission()==='denied')return 'O sistema bloqueou as notificações. Para reativá-las, ajuste as permissões deste site nas configurações do aparelho.';
    if(!userId)return 'Entre em sua conta para configurar as notificações deste aparelho.';
    return enabled(userId)&&permission()==='granted'?
      'Alertas ativados neste aparelho. Eles aparecem quando o BoniVerso está aberto ou em uso. Avisos com o aplicativo totalmente fechado exigem Web Push remoto, ainda não configurado.':
      'Ative os alertas para receber avisos do aparelho enquanto o BoniVerso estiver aberto. A central de avisos funciona mesmo sem esta permissão.';
  }
  function mount(){
    const root=$('#bv-notices-root');const head=$('.bv-notice-head',root||document);
    if(!root||!head||!userId)return;
    let panel=$('#bv-device-permission',root);
    if(!panel){
      panel=document.createElement('div');panel.id='bv-device-permission';
      panel.style.cssText='margin:12px 0 0;padding:12px;border:1px solid #bdd2ee;border-radius:13px;background:#f3f8ff;color:#1b3559;max-width:100%';
      const label=document.createElement('strong');label.textContent='📲 Alertas neste aparelho';
      label.style.cssText='display:block;font-size:13px;margin-bottom:6px';
      const desc=document.createElement('p');desc.id='bv-device-permission-info';desc.style.cssText='margin:4px 0 10px;font-size:12px;line-height:1.55';
      const button=document.createElement('button');button.id='bv-device-permission-toggle';button.type='button';
      button.style.cssText='border:0;border-radius:10px;padding:10px 13px;background:#2765b9;color:white;font:700 12px system-ui;min-height:42px;cursor:pointer';
      panel.append(label,desc,button);head.insertAdjacentElement('afterend',panel);
      button.addEventListener('click',toggle);
    }
    updatePanel();
  }
  function updatePanel(){
    const panel=$('#bv-device-permission');if(!panel||!userId)return;
    const info=$('#bv-device-permission-info',panel),btn=$('#bv-device-permission-toggle',panel);
    info.textContent=message();
    const on=enabled(userId)&&permission()==='granted';
    btn.textContent=on?'Desativar alertas neste aparelho':'Ativar alertas neste aparelho';
    btn.disabled=phase==='busy'||(iOS&&!installed())||!HAS_NOTIFICATIONS||permission()==='denied'||!('serviceWorker' in navigator);
    btn.style.opacity=btn.disabled?'.6':'1';
  }
  async function toggle(){
    if(!userId)return;
    const old=userId;
    if(enabled(old)&&permission()==='granted'){
      setEnabled(old,false);stop();phase='ready';updatePanel();return;
    }
    if(!HAS_NOTIFICATIONS||permission()==='denied'||(iOS&&!installed()))return updatePanel();
    phase='busy';updatePanel();
    try{
      // Solicitação é disparada APENAS após toque/click do usuário.
      const result=await Notification.requestPermission();
      if(old!==userId)return;
      setEnabled(old,result==='granted');
      initial=true;known.clear();
      if(result==='granted')start();
    }catch(e){console.warn('Avisos do aparelho:',e);}
    finally{phase='ready';updatePanel();}
  }
  async function showNotice(notice){
    if(!userId||!enabled(userId)||permission()!=='granted')return;
    const title=String(notice.title||'Novidade no BoniVerso').slice(0,150);
    // Não mostrar texto sensível de correções e mensagens na tela bloqueada.
    const body=notice.event_type==='feedback_published'?
      'Uma redação foi corrigida. Entre no BoniVerso para consultar sua devolutiva.':
      notice.event_type==='message_new'?'Você recebeu uma mensagem da turma. Acesse o aplicativo.':
      'Uma novidade está disponível no seu BoniVerso. Abra o aplicativo para conferir.';
    const options={body,icon:'./icon-192.png',badge:'./icon-192.png',tag:'bv-notice-'+notice.id,
      data:{url:new URL('./?avisos=1',location.href).href},renotify:false,silent:false};
    try{
      if('serviceWorker' in navigator){
        const reg=await Promise.race([navigator.serviceWorker.ready,
          new Promise((_,reject)=>setTimeout(()=>reject(Error('Service Worker indisponível')),6500))]);
        if(reg?.showNotification)await reg.showNotification(title,options);
      }else if(typeof Notification==='function'){
        new Notification(title,options);
      }
    }catch(e){console.warn('Alerta do aparelho não exibido:',e);}
  }
  async function check(){
    if(busy||document.hidden||!userId||!enabled(userId)||permission()!=='granted'||!db)return;
    busy=true;const checkingUser=userId;
    try{
      const {data,error}=await db.from('boniverso_notices')
        .select('id,title,event_type,created_at')
        .order('created_at',{ascending:false}).limit(35);
      if(error)throw error;
      if(checkingUser!==userId)return;
      const incoming=(data||[]).filter(n=>!known.has(n.id));
      known=new Set((data||[]).map(n=>n.id));
      if(initial){initial=false;return;}
      // Limite anti-spam: máximo de dois alertas ao voltar à página.
      for(const n of incoming.slice(0,2).reverse())await showNotice(n);
    }catch(e){console.warn('Não foi possível consultar novos avisos:',e);}
    finally{busy=false;}
  }
  function stop(){if(timer){clearInterval(timer);timer=null;}initial=true;known.clear()}
  function start(){stop();if(!userId||!enabled(userId)||permission()!=='granted')return;
    check();timer=setInterval(check,75000);
  }
  async function changeUser(user){
    const next=user?.id||null;if(next===userId)return;
    stop();userId=next;updatePanel();
    if(userId){mount();start();}
  }
  function openFromNotification(){
    const url=new URL(location.href);if(url.searchParams.get('avisos')!=='1'||!userId)return;
    const nav=$('#bv-notices-nav');if(!nav)return;
    nav.click();url.searchParams.delete('avisos');history.replaceState(null,'',url.pathname+url.search+url.hash);
  }
  function init(){
    if(started||!window.BONIVERSO_DB)return;started=true;db=window.BONIVERSO_DB;
    db.auth.getUser().then(x=>changeUser(x.data?.user));
    db.auth.onAuthStateChange((_,session)=>setTimeout(()=>changeUser(session?.user),0));
    const root=$('#app')||document.body;
    let queued=false;
    const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{
      queued=false;if(userId){mount();openFromNotification();}
    })});
    observer.observe(root,{childList:true,subtree:true});
    const panelObserver=new MutationObserver(()=>{if(userId)mount()});
    panelObserver.observe(document.body,{childList:true,subtree:false});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){check();mount()}});
    window.addEventListener('focus',check);
  }
  window.addEventListener('boniverso-db-ready',init);
  if(window.BONIVERSO_DB)init();
})();
