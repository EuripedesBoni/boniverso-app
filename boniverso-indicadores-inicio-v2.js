/* BoniVerso v2 — atalhos dos indicadores da página Início.
 * Complementa a correção v1 do Painel do Professor, sem alterar dados,
 * autenticação, matrículas nem as regras de acesso do Supabase.
 */
(() => {
  'use strict';
  const app = document.getElementById('app');
  if (!app) return;

  const routes = new Map([
    ['Cursos no catálogo', {
      screen: 'courses', description: 'Explorar os cursos do BoniVerso'
    }],
    ['Tarefas concluídas', {
      screen: 'planner', description: 'Abrir meu planejamento de estudos'
    }],
    ['Redações enviadas', {
      screen: 'essays', description: 'Abrir minhas redações e propostas'
    }],
    ['Aulas concluídas', {
      url: './painel-aprendizagem.html', description: 'Abrir o painel de aprendizagem'
    }]
  ]);

  const style = document.createElement('style');
  style.textContent = `
    #view .stats-row > button.bv-home-stat-link {
      appearance:none;-webkit-appearance:none;
      width:100%;min-width:0;cursor:pointer;position:relative;
      font:inherit;color:inherit;text-align:left;
      padding-right:31px;
      transition:box-shadow .16s ease, transform .16s ease, border-color .16s ease;
      -webkit-tap-highlight-color:rgba(56,112,216,.12);
    }
    #view .stats-row > button.bv-home-stat-link::after {
      content:'›';position:absolute;right:12px;top:50%;
      transform:translateY(-50%);font-size:23px;font-weight:800;
      color:#3978e8;line-height:1;pointer-events:none;
    }
    #view .stats-row > button.bv-home-stat-link:hover {
      border-color:#bed3f4;box-shadow:0 12px 28px rgba(24,63,124,.12);
      transform:translateY(-2px);
    }
    #view .stats-row > button.bv-home-stat-link:active { transform:translateY(0); }
    #view .stats-row > button.bv-home-stat-link:focus-visible {
      outline:3px solid #8dbbff;outline-offset:3px;
    }
    #view .stats-row > button.bv-home-stat-link small {line-height:1.4;display:block}
    @media(prefers-reduced-motion:reduce){
      #view .stats-row > button.bv-home-stat-link {transition:none}
    }
  `;
  document.head.append(style);

  function enhance() {
    const view = document.getElementById('view');
    if (!view || !view.querySelector(':scope > .hero')) return;
    // Somente a página Início tem o banner .hero; não modifica métricas
    // do Professor, do Desempenho ou de qualquer outra página.
    for (const card of view.querySelectorAll(':scope > .stats-row > .stat-card')) {
      if (card.classList.contains('bv-home-stat-link')) continue;
      const label = (card.querySelector('small')?.textContent || '').trim();
      const route = routes.get(label);
      if (!route) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = card.className + ' bv-home-stat-link';
      button.setAttribute('aria-label',route.description + ' — ' + label);
      button.title = route.description;
      if (route.screen) {
        // O app já trata esse atributo, preservando o login e as permissões.
        button.dataset.onlineAction = 'nav';
        button.dataset.id = route.screen;
      } else if (route.url) {
        button.addEventListener('click', () => window.location.assign(route.url));
      }
      while (card.firstChild) button.appendChild(card.firstChild);
      card.replaceWith(button);
    }
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhance();
    });
  });
  observer.observe(app,{subtree:true,childList:true});
  enhance();
})();
