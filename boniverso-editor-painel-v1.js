/* BoniVerso v1 · Responsividade do Editor e navegação dos indicadores docentes.
   Executa somente na página do app online. Preserva o roteamento interno existente.
*/
(() => {
  'use strict';
  // O app recria o conteúdo de #app ao navegar; observar o contêiner estável.
  const appRoot = document.getElementById('app');
  if (!appRoot) return;
  const routes = new Map([
    ['Cursos criados', {id:'editor', detail:'Abrir Editor de cursos'}],
    ['Aulas cadastradas', {id:'editor', detail:'Ver os cursos e selecionar Aulas'}],
    ['Atividades', {id:'essays', detail:'Abrir atividades e propostas de redação'}],
    ['Redações pendentes', {id:'corrections', detail:'Abrir redações aguardando correção'}]
  ]);
  let requestedLessons = false;
  let queued = false;

  function pageTitle(view) {
    return (view.querySelector('.page-top h1')?.textContent || '').trim();
  }
  function arrangeCourseCards(view) {
    const panels = view.querySelectorAll('.two-cols > .panel');
    if (panels.length < 2) return;
    const coursePanel = [...panels].find(panel =>
      (panel.querySelector('.section-title')?.textContent || '').trim() === 'Cursos cadastrados'
    );
    if (!coursePanel) return;
    for (const card of coursePanel.querySelectorAll('.task-row')) {
      card.classList.add('bv-editor-course-row');
      let actions = card.querySelector(':scope > .bv-editor-actions');
      const extras = [...card.children].filter(child =>
        !child.classList.contains('task-detail') && !child.classList.contains('bv-editor-actions')
      );
      if (extras.length && !actions) {
        actions = document.createElement('div');
        actions.className = 'bv-editor-actions';
        card.append(actions);
      }
      if (actions) for (const extra of extras) actions.append(extra);
    }
    if (!coursePanel.querySelector('.bv-editor-help')) {
      const help = document.createElement('p');
      help.className = 'bv-editor-help';
      help.textContent = 'Escolha o curso abaixo para abrir suas aulas, consultar os materiais ou acessar a videoteca.';
      const heading = coursePanel.querySelector('.section-title');
      heading?.insertAdjacentElement('afterend', help);
    }
    if (requestedLessons) {
      requestedLessons = false;
      // Encaminha à seção dos cursos, onde cada curso possui seu botão Aulas.
      requestAnimationFrame(() => {
        if (coursePanel.isConnected && view.classList.contains('bv-admin-editor')) {
          coursePanel.scrollIntoView({behavior:'smooth',block:'start'});
          coursePanel.setAttribute('tabindex','-1');
          coursePanel.focus({preventScroll:true});
        }
      });
    }
  }
  function enableTeacherCards(view) {
    for (const card of view.querySelectorAll('.stats-row > .stat-card')) {
      const label = (card.querySelector('small')?.textContent || '').trim();
      const route = routes.get(label);
      if (!route || card.matches('button.bv-stat-action')) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `${card.className} bv-stat-action`;
      button.setAttribute('data-online-action','nav');
      button.setAttribute('data-id',route.id);
      button.setAttribute('aria-label',`${route.detail}. ${card.querySelector('b')?.textContent || ''} ${label}`);
      button.title = route.detail;
      while (card.firstChild) button.append(card.firstChild);
      if (label === 'Aulas cadastradas') {
        button.addEventListener('click', () => { requestedLessons = true; });
      }
      card.replaceWith(button);
    }
  }
  function enhance() {
    const view = document.getElementById('view');
    if (!view) return;
    const title = pageTitle(view);
    const editor = title === 'Editor de cursos';
    const teacher = title === 'Painel do Prof. Rafa Boni';
    view.classList.toggle('bv-admin-editor',editor);
    view.classList.toggle('bv-admin-teacher-home',teacher);
    if (editor) arrangeCourseCards(view);
    if (teacher) enableTeacherCards(view);
    if (!editor && !teacher) requestedLessons = false;
  }
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {queued=false;enhance();});
  });
  observer.observe(appRoot,{childList:true,subtree:true});
  enhance();
})();
