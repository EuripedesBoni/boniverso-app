/* BoniVerso v1.6.2 — títulos de cursos clicáveis e navegação móvel inclusiva.
 * Só complementa cartões já renderizados pelo app. Não altera Auth, RLS ou aulas.
 */
(() => {
  'use strict';
  const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
  const page = id => './painel-aprendizagem.html?curso=' + encodeURIComponent(id);

  function enhanceCourses() {
    const view = document.getElementById('view');
    if (!view) return;
    for (const card of view.querySelectorAll('.course-card')) {
      const original = card.querySelector('button[data-online-action="course"][data-id]');
      const heading = card.querySelector('.course-content h3');
      if (!original || !heading || heading.querySelector('.bv-course-title-link,.bv-course-title-trigger')) continue;
      const id = original.getAttribute('data-id') || '';
      if (!UUID.test(id)) continue;
      const title = heading.textContent.trim();
      if (!title) continue;
      const restricted = /\b(detalhes|comprar|assinar)\b/i.test(original.textContent || '');
      const item = document.createElement(restricted ? 'button' : 'a');
      item.textContent = title;
      item.setAttribute('aria-label', (restricted ? 'Ver detalhes de ' : 'Abrir página do curso ') + title);
      if (restricted) {
        item.type = 'button';
        item.className = 'bv-course-title-trigger';
        // O botão original preserva a verificação de acesso e o fluxo de detalhes.
        item.addEventListener('click', () => original.click());
      } else {
        item.className = 'bv-course-title-link';
        item.href = page(id);
        item.title = 'Abrir página do curso: ' + title;
      }
      heading.replaceChildren(item);
    }
  }

  function enhanceMobileLive() {
    const live = document.getElementById('bvLiveMobile');
    if (!live || live.dataset.bvMobileReady === '1') return;
    const icon = document.createElement('span');
    icon.className = 'bv-live-mobile-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '🎥';
    live.replaceChildren(icon, document.createTextNode('Ao vivo'));
    live.setAttribute('aria-label', 'Aulas ao vivo');
    live.dataset.bvMobileReady = '1';
  }

  function enhanceMobileLabels() {
    // Um rótulo curto evita partir "planejamento" no meio em iPhones estreitos.
    const planner = document.querySelector('#mobileBottom .mobile-nav-link[data-id="planner"]');
    const label = planner?.querySelector('span');
    if (label && label.textContent !== 'Planejar') {
      planner.setAttribute('aria-label', 'Meu planejamento');
      label.textContent = 'Planejar';
    }
  }

  let scheduled = false;
  function enhance() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      enhanceCourses();
      enhanceMobileLive();
      enhanceMobileLabels();
    });
  }

  function init() {
    const app = document.getElementById('app');
    if (!app) return;
    new MutationObserver(enhance).observe(app, {childList:true, subtree:true});
    enhance();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
