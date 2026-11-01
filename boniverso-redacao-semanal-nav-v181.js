/* BoniVerso v1.8.1 — abre a redação vinculada a um repertório,
 * usando a navegação normal e as permissões já existentes do aplicativo.
 * Nenhuma nota ou matrícula é alterada por este script.
 */
(() => {
  'use strict';
  const url = new URL(window.location.href);
  const id = url.searchParams.get('redacao');
  if (!id || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) return;
  const app = document.getElementById('app');
  if (!app) return;
  let phase = 0;
  let scheduled = false;
  function open() {
    if (phase === 2) return;
    if (phase === 0) {
      const nav = document.querySelector('[data-online-action="nav"][data-id="essays"]');
      if (!nav) return;
      phase = 1;
      nav.click();
    }
    if (phase === 1) {
      const button = [...document.querySelectorAll('button[data-online-action="assignment"][data-id]')]
        .find(b => b.dataset.id === id);
      if (!button) return;
      phase = 2;
      button.click();
      url.searchParams.delete('redacao');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      observer.disconnect();
    }
  }
  const observer = new MutationObserver(() => {
    if (scheduled || phase === 2) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; open(); });
  });
  observer.observe(app, {subtree:true,childList:true});
  open();
})();
