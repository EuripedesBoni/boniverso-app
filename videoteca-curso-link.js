/* BoniVerso v1.5.0 — adiciona Videoteca às páginas e cartões dos cursos.
   Sem alterar autenticação, matrículas, player LiveKit ou gestão das aulas. */
(() => {
  'use strict';
  const valid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
  const href=id=>'./curso-videos.html?curso='+encodeURIComponent(id);
  let lastCourse=null;
  const css=document.createElement('style');css.textContent='.bv-course-video-link{display:inline-flex;align-items:center;justify-content:center;gap:5px;border-radius:10px;background:#254f91;color:#fff!important;padding:10px 12px;text-decoration:none;font-weight:700;font-size:13px;min-height:39px}.bv-course-video-link:hover{background:#386bb2}.bv-video-modal-callout{border:1px solid #cbdff9;border-radius:13px;background:#edf5ff;padding:12px;margin:12px 0}.bv-video-modal-callout p{margin:4px 0 10px;color:#43638a;font-size:13px}';document.head.append(css);
  function link(id){const a=document.createElement('a');a.href=href(id);a.className='bv-course-video-link';a.textContent='🎬 Videoteca do curso';return a}
  function enhance(){
    document.querySelectorAll('#view button[data-online-action="course"][data-id]').forEach(b=>{
      const id=b.dataset.id;if(!valid.test(id||''))return;
      if(/detalhes|comprar/i.test(b.textContent||''))return;
      const card=b.closest('.course-card, .task-row');if(!card||card.querySelector('.bv-course-video-link'))return;
      const a=link(id);a.style.marginLeft='8px';b.insertAdjacentElement('afterend',a);
    });
    const dlg=document.getElementById('dialogContents');
    if(!dlg||!lastCourse||!valid.test(lastCourse))return;
    if(!document.getElementById('dialog')?.open)return;
    if(dlg.querySelector('.bv-video-modal-callout'))return;
    // Não oferecer convite para conteúdo quando o diálogo indica falta de acesso.
    if((dlg.textContent||'').includes('Conteúdo reservado'))return;
    const title=dlg.querySelector('h2');if(!title)return;
    const box=document.createElement('div');box.className='bv-video-modal-callout';
    const strong=document.createElement('strong');strong.textContent='🎬 Aulas gravadas deste curso';
    const p=document.createElement('p');p.textContent='Lives e vídeos do Meet organizados por módulos, com seu progresso salvo.';
    box.append(strong,p,link(lastCourse));title.insertAdjacentElement('afterend',box);
  }
  document.addEventListener('click',event=>{const b=event.target.closest?.('button[data-online-action="course"][data-id]');if(!b)return;const id=b.dataset.id;if(valid.test(id||'')){lastCourse=id;queueMicrotask(enhance);setTimeout(enhance,50)}},true);
  const observe=()=>{const app=document.getElementById('app');const observer=new MutationObserver(()=>queueMicrotask(enhance));if(app)observer.observe(app,{childList:true,subtree:true});enhance();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();
