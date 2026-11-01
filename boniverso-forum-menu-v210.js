/* BoniVerso v2.1.0 — atalho do fórum de cada turma. Sem alterações no login. */
(()=>{
  'use strict';
  const URL='./forum-turmas.html';
  const style=document.createElement('style');
  style.textContent=`
    #sideNav .bv-forum-nav{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit;font-size:13px;font-weight:700;border-radius:12px;padding:12px 14px;min-height:46px}
    #sideNav .bv-forum-nav:hover,#sideNav .bv-forum-nav:focus-visible{background:#e9f2ff;color:#2456a3}
    .bv-forum-home{margin:16px 0 22px;padding:18px 20px;background:linear-gradient(105deg,#e9f6f0,#f8fbff);border:1px solid #cfe7dc;border-radius:16px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;box-shadow:0 5px 13px #1f42710c}
    .bv-forum-home .bv-forum-text{min-width:0;flex:1 1 180px}.bv-forum-home h3{margin:2px 0 5px;font-size:16px;color:#195443}.bv-forum-home p{margin:0;font-size:12px;color:#597976;line-height:1.6}
    .bv-forum-home a{display:inline-flex;justify-content:center;align-items:center;gap:7px;padding:12px 15px;border-radius:11px;background:#187b5c;color:white!important;text-decoration:none;font-size:12px;font-weight:800;min-height:43px}
    .bv-forum-home a:hover{background:#176249}
    @media(max-width:520px){.bv-forum-home{padding:17px 15px}.bv-forum-home a{width:100%}}
  `;
  document.head.append(style);
  function enhance(){
    const nav=document.getElementById('sideNav');
    if(nav&&!nav.querySelector('[data-bv-forum-nav]')){
      const a=document.createElement('a');a.href=URL;a.className='bv-forum-nav';a.dataset.bvForumNav='';
      a.innerHTML='<span aria-hidden="true" style="font-size:21px;width:22px;text-align:center">💬</span><span>Fórum da Turma</span>';
      const weekly=nav.querySelector('[data-bv-weekly-nav]');
      const courses=nav.querySelector('[data-id="courses"]');
      if(weekly)weekly.insertAdjacentElement('afterend',a);
      else if(courses)courses.insertAdjacentElement('afterend',a);
      else nav.append(a);
    }
    const view=document.getElementById('view');
    const hero=view?.querySelector('.hero');
    if(hero&&!view.querySelector('.bv-forum-home')){
      const section=document.createElement('section');section.className='bv-forum-home';
      const copy=document.createElement('div');copy.className='bv-forum-text';
      const h=document.createElement('h3');h.textContent='💬 Fórum das Turmas';
      const p=document.createElement('p');p.textContent='Debates, dúvidas, PDFs compartilhados e chat da sua turma. Veja quem está online, se a pessoa optar por aparecer.';
      const link=document.createElement('a');link.href=URL;link.textContent='Entrar no fórum';
      copy.append(h,p);section.append(copy,link);
      const weeklyCard=view.querySelector('.bv-weekly-home');
      (weeklyCard||hero).insertAdjacentElement('afterend',section);
    }
  }
  let queued=false;
  function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;enhance()})}
  function init(){const root=document.getElementById('app');if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});schedule()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
