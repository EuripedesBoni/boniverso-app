/* BoniVerso · acesso à segurança pelo PWA (iPad, celular e desktop).
 * Não cria permissões nem usa credenciais privilegiadas.
 * O fluxo MFA é executado na página existente mfa-admin.html,
 * na mesma origem e no mesmo escopo do aplicativo instalado.
 */
(() => {
  'use strict';
  const path = './mfa-admin.html';
  const make = () => {
    const nav = document.getElementById('sideNav');
    const userArea = document.getElementById('profileSwitch');
    // Não adicionar controle à tela de login.
    if (!nav || !userArea || !userArea.querySelector('.online-identity')) return;
    if (!nav.querySelector('#bvSecurityNav')) {
      const a = document.createElement('a');
      a.id = 'bvSecurityNav';
      a.className = 'nav-link';
      a.href = path;
      a.style.cssText = 'display:flex;align-items:center;gap:12px;text-decoration:none;min-height:44px';
      a.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15" r="1"/></svg><span>Segurança e autenticação</span>';
      nav.appendChild(a);
    }
    const footer = document.querySelector('.footer');
    if (footer && !footer.querySelector('#bvSecurityFooter')) {
      const a = document.createElement('a');
      a.id='bvSecurityFooter';a.href=path;a.textContent='Segurança da conta';
      a.style.cssText='color:inherit;text-decoration:underline;white-space:nowrap';
      footer.appendChild(a);
    }
  };
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled=true;
    queueMicrotask(() => { scheduled=false;make(); });
  });
  observer.observe(document.getElementById('app') || document.body,{childList:true,subtree:true});
  make();
})();
