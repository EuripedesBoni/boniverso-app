/* BoniVerso v1.8.0 — Repertório Semanal no menu do estudante e do professor.
   Não altera o login ou as permissões: o servidor controla o acesso.
*/
(()=>{
 'use strict';
 const URL='./repertorios-semanais.html';
 const css=document.createElement('style');
 css.textContent=`
 #sideNav .bv-weekly-nav{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit;font-size:13px;font-weight:700;border-radius:12px;padding:12px 14px;min-height:46px}
 #sideNav .bv-weekly-nav:hover,#sideNav .bv-weekly-nav:focus-visible{background:#e9f2ff;color:#2456a3}
 #sideNav .bv-weekly-nav .bv-weekly-icon{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;font-size:20px;flex-shrink:0}
 .bv-weekly-home{margin:16px 0 22px;padding:18px 20px;background:linear-gradient(105deg,#eff5ff,#f8fbff);border:1px solid #d5e3f7;border-radius:16px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;box-shadow:0 5px 13px #1f42710c}
 .bv-weekly-home .bv-weekly-text{min-width:0;flex:1 1 180px}.bv-weekly-home h3{margin:2px 0 5px;font-size:16px;color:#193960}.bv-weekly-home p{margin:0;font-size:12px;color:#647d9a;line-height:1.6}
 .bv-weekly-home a{display:inline-flex;justify-content:center;align-items:center;gap:7px;padding:12px 15px;border-radius:11px;background:#2a67c7;color:white!important;text-decoration:none;font-size:12px;font-weight:800;min-height:43px}
 .bv-weekly-home a:hover{background:#1d52a5}
 @media(max-width:520px){.bv-weekly-home{padding:17px 15px}.bv-weekly-home a{width:100%}}
 `;document.head.append(css);
 function enhance(){
  const nav=document.getElementById('sideNav');
  if(nav&&!nav.querySelector('[data-bv-weekly-nav]')){
   const a=document.createElement('a');a.href=URL;a.className='bv-weekly-nav';a.dataset.bvWeeklyNav='1';
   const icon=document.createElement('span');icon.className='bv-weekly-icon';icon.textContent='📚';icon.setAttribute('aria-hidden','true');
   const label=document.createElement('span');label.textContent='Repertório semanal';a.append(icon,label);
   const existing=nav.querySelector('button[data-id="essays"],button[data-id="courses"]');
   if(existing)existing.insertAdjacentElement('afterend',a);else nav.append(a);
  }
  const view=document.getElementById('view');
  const hero=view?.querySelector('.hero');
  if(hero&&!view.querySelector('.bv-weekly-home')){
   const box=document.createElement('section');box.className='bv-weekly-home';
   const info=document.createElement('div');info.className='bv-weekly-text';
   const h=document.createElement('h3');h.textContent='📚 Repertório Semanal';
   const p=document.createElement('p');p.textContent='Materiais em PDF organizados por turma, série e semana. Confira as publicações do Prof. Rafa Boni.';
   info.append(h,p);
   const a=document.createElement('a');a.href=URL;a.textContent='Ver repertórios';
   box.append(info,a);hero.insertAdjacentElement('afterend',box);
  }
 }
 let scheduled=false;
 function run(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance()})}
 function init(){const root=document.getElementById('app');if(root)new MutationObserver(run).observe(root,{childList:true,subtree:true});run()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
