/* Link para turmas sem alterar a autenticação do BoniVerso.
   Segurança real: Supabase Auth + RLS + RPC no servidor. */
(() => {
  const makeLink = () => {
    const nav = document.getElementById('sideNav');
    if (!nav || nav.querySelector('#boniversoClassroomsLink')) return;
    // O menu é recriado pelo app após o login. Nunca inserir na tela pública.
    const teacher = !!nav.querySelector('button[data-id="admin"]');
    const student = !!nav.querySelector('button[data-id="home"]');
    if (!teacher && !student) return;
    const link = document.createElement('a');
    link.id = 'boniversoClassroomsLink';
    link.href = './turmas.html';
    link.className = 'nav-link';
    link.setAttribute('aria-label', teacher ? 'Gerenciar turmas e séries' : 'Minhas turmas e séries');
    const mark = document.createElement('span');
    mark.textContent='▦';
    mark.setAttribute('aria-hidden','true');
    mark.style.fontSize='20px';
    const title=document.createElement('span');
    title.textContent=teacher?'Turmas e séries':'Minhas turmas';
    link.append(mark,title);
    const reference=nav.querySelector(teacher?'button[data-id="corrections"]':'button[data-id="courses"]');
    if(reference)reference.insertAdjacentElement('afterend',link);else nav.append(link);
  };
  const observer=new MutationObserver(makeLink);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  makeLink();
})();
