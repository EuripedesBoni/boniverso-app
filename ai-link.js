// Adiciona um acesso ao BoniVerso AI apenas na navegação visual de professores.
// Permissões reais são verificadas novamente por Supabase Auth e RLS.
(() => {
  function addLink() {
    const nav = document.getElementById('sideNav');
    if (!nav || document.getElementById('boniversoAiLink')) return;
    const teacherNav = nav.querySelector('button[data-id="admin"]');
    if (!teacherNav) return;
    const item = document.createElement('a');
    item.id = 'boniversoAiLink';
    item.className = 'nav-link';
    item.href = './boniverso-ai.html';
    item.innerHTML = '<span aria-hidden="true" style="font-size:20px">✦</span><span>BoniVerso AI</span>';
    const corrections = nav.querySelector('button[data-id="corrections"]');
    if (corrections) corrections.insertAdjacentElement('afterend', item);
    else nav.appendChild(item);
  }
  const observer = new MutationObserver(addLink);
  observer.observe(document.documentElement, {childList:true,subtree:true});
  addLink();
})();
