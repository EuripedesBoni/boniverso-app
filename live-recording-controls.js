/* BoniVerso Live v1.1.9 — controles seguros de gravacao e aviso aos participantes.
   Nao contem credenciais secretas; somente professor pode iniciar/parar/publicar. */
(async () => {
  'use strict';
  const cfg = window.BONIVERSO_CONFIG;
  const lessonId = new URLSearchParams(location.search).get('sessao');
  const main = document.querySelector('main');
  const controls = document.querySelector('main .controls');
  if (!cfg || !main || !controls || !/^[0-9a-f-]{36}$/i.test(lessonId || '')) return;

  const wrapper = document.createElement('section');
  wrapper.setAttribute('aria-label', 'Situação da gravação');
  wrapper.style.cssText = 'margin:12px 0 18px;padding:14px 16px;border:1px solid #62769b;border-radius:12px;background:#1b3053;color:#fff';
  const heading = document.createElement('strong');
  heading.textContent = '⏺ Gravação da aula';
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.style.cssText = 'margin:7px 0';
  const info = document.createElement('small');
  info.textContent = 'Esta aula pode ser gravada. O professor deve informar os participantes e confirmar as autorizações necessárias antes de iniciar.';
  info.style.cssText = 'color:#d9e6fc;display:block';
  const staffPanel = document.createElement('div');
  staffPanel.hidden = true;
  staffPanel.style.cssText = 'margin-top:14px;border-top:1px solid #637b9b;padding-top:12px';
  const permissionLabel = document.createElement('label');
  permissionLabel.style.cssText = 'display:flex;gap:9px;align-items:flex-start;margin-bottom:12px;font-size:13px';
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.style.cssText = 'margin-top:4px;width:18px;height:18px;flex-shrink:0';
  permissionLabel.append(check, document.createTextNode('Confirmo que os participantes foram informados e que existe fundamento jurídico e, quando necessário, autorização para gravar, inclusive em caso de menores de idade.'));
  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:9px;flex-wrap:wrap';
  const buttons = {};
  for (const [act,label] of [['start','⏺ Iniciar gravação'],['stop','⏹ Encerrar gravação'],['refresh','↻ Verificar processamento'],['publish','📚 Publicar para alunos'],['unpublish','🔒 Retirar da biblioteca']]) {
    const button = document.createElement('button');
    button.type = 'button';button.textContent = label;button.dataset.recordAction=act;
    button.style.cssText = 'background:#36598a;color:white;border:1px solid #86a0c3;border-radius:9px;padding:9px;cursor:pointer';
    actions.append(button);buttons[act]=button;
  }
  staffPanel.append(permissionLabel,actions);
  wrapper.append(heading,status,info,staffPanel);
  controls.parentElement.insertBefore(wrapper,controls);
  let db, isStaff = false, recState = 'none', published = false, busy = false, lastError = '';
  function paint() {
    const labels = {
      none:'Gravação desativada.',pending:'Preparando a gravação…',recording:'🔴 GRAVAÇÃO EM ANDAMENTO — áudio e vídeo podem estar sendo registrados.',
      processing:'A gravação foi encerrada; o arquivo está sendo processado.',ready:'Gravação concluída. '+(published?'Disponível na biblioteca dos matriculados.':'Aguardando revisão e publicação pelo professor.'),
      failed:'Falha na gravação. Solicite verificação do professor.'
    };
    status.textContent = (labels[recState]||'Status da gravação indisponível.')+(lastError?' '+lastError:'');
    status.style.color = recState === 'recording' ? '#ffc9ba' : '#fff';
    staffPanel.hidden = !isStaff;
    buttons.start.disabled = busy || !['none','failed'].includes(recState) || !check.checked;
    buttons.stop.disabled = busy || recState !== 'recording';
    buttons.refresh.disabled = busy || !['recording','processing'].includes(recState);
    buttons.publish.disabled = busy || recState !== 'ready' || published;
    buttons.unpublish.disabled = busy || recState !== 'ready' || !published;
  }
  async function call(action, extra={}) {
    const {data,error} = await db.functions.invoke('boniverso-recording-control',{body:{event_id:lessonId,action,...extra}});
    if(error){
      let reason = error.message || 'Erro no servidor';
      try{const payload = await error.context?.json?.();reason=payload?.error ||reason;}catch(_e){}
      throw Error(reason);
    }
    if(data?.error)throw Error(data.error);
    return data || {};
  }
  async function update() {
    if(busy) return;
    try {
      const data=await call('status');
      recState = data.state || 'none';published=!!data.published;isStaff=!!data.is_teacher;lastError='';
    } catch(e) { lastError='Não foi possível consultar: '+e.message; }
    paint();
  }
  for(const [action,btn] of Object.entries(buttons)) {
    btn.addEventListener('click',async()=>{
      if(busy)return;
      if(action==='start' && !check.checked)return;
      if(action==='start' && !confirm('Iniciar a gravação agora? Você confirma que os participantes receberam aviso e que possui a autorização legal necessária?'))return;
      if(action==='publish' && !confirm('Publicar esta gravação apenas para estudantes com acesso ao curso ou turma?'))return;
      busy=true;lastError='';paint();
      try{
        const data=await call(action,action==='start'?{notice_confirmed:true}:{});
        if(data.state)recState=data.state;
        if(typeof data.published==='boolean')published=data.published;
        lastError=data.message||'';
      }catch(e){lastError='Não foi possível executar: '+e.message;}
      finally {busy=false;paint();}
      if(action!=='start') setTimeout(update,600);
    });
  }
  check.addEventListener('change',paint);
  paint();
  try {
    const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2.57.2');
    db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
    const {data:{session}}=await db.auth.getSession();
    if(!session){lastError='Faça login no BoniVerso para consultar gravações.';paint();return;}
    await update();
    // Aviso para professores e estudantes, inclusive quem entrar durante uma gravação.
    setInterval(()=>{if(!document.hidden)update()},30000);
  }catch(e){lastError='Controle de gravações indisponível: '+e.message;paint();}
})();
