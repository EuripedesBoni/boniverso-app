/* BoniVerso v1.0.1 — atalhos de turmas na página inicial.
 * Esta interface usa o login Supabase existente e não modifica matrículas.
 * Os dados de professor e estudante são protegidos por RLS no Supabase.
 */
(() => {
  'use strict';
  const CONFIG = window.BONIVERSO_CONFIG || {};
  const URL_CLASSROOMS = './turmas.html';
  let currentPanel = null;
  let clientPromise = null;
  let loading = false;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const gradeNames = {
    '6EF':'6º ano EF', '7EF':'7º ano EF', '8EF':'8º ano EF', '9EF':'9º ano EF',
    '1EM':'1ª série EM', '2EM':'2ª série EM', '3EM':'3ª série EM'
  };
  const grades = ['6EF','7EF','8EF','9EF','1EM','2EM','3EM'];
  const check = result => {
    if (result.error) throw result.error;
    return result.data || [];
  };
  const classPage = () => URL_CLASSROOMS;
  const getClient = () => {
    if (!CONFIG.supabaseUrl || !CONFIG.supabasePublishableKey) {
      return Promise.reject(new Error('Conexão do BoniVerso indisponível.'));
    }
    if (!clientPromise) {
      clientPromise = import('https://esm.sh/@supabase/supabase-js@2.57.2')
        .then(({ createClient }) => createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey, {
          auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:false }
        }));
    }
    return clientPromise;
  };
  const title = text => `<div class="bv-class-head"><div><div class="bv-class-eyebrow">BONIVERSO · TURMAS</div><h2>${esc(text)}</h2></div><a class="bv-class-all" href="${classPage()}">Abrir turmas <span aria-hidden="true">↗</span></a></div>`;
  const studentEmpty = () => `${title('Sua turma, sempre por perto')}<div class="bv-class-empty"><div><strong>Você ainda não entrou em uma turma.</strong><p>Peça ao professor seu código de matrícula e participe das atividades da sua série.</p></div><a class="bv-class-btn" href="${classPage()}">Entrar em uma turma</a></div>`;
  const roomLink = (school, section) => school.enrollment_type === 'paid_invite'
    ? './aparecida.html'
    : './sala.html?turma=' + encodeURIComponent(school.id) +
      (section ? '&serie=' + encodeURIComponent(section.id) : '');
  const studentCards = (memberships, sectionRows, classroomRows) => {
    const sectionById = new Map(sectionRows.map(s => [s.id, s]));
    const schoolById = new Map(classroomRows.map(c => [c.id, c]));
    const cards = memberships.map(m => {
      const school = schoolById.get(m.classroom_id);
      if (!school) return '';
      const section = m.section_id ? sectionById.get(m.section_id) : null;
      const paid = school.enrollment_type === 'paid_invite';
      if (!paid && !section) return '';
      const active = school.is_active !== false && (paid || section?.is_active !== false);
      const schoolName = school.name.replace(/\s*[—–-]\s*Redaç[aã]o\s*$/iu, '');
      const href=roomLink(school,section);
      const grade = paid ? 'Turma exclusiva · aulas ao vivo' : (gradeNames[section.grade_code] || section.label);
      return `<article class="bv-class-card"><div class="bv-class-card-top"><span class="bv-class-school-icon" aria-hidden="true">${paid?'🎥':'▦'}</span><span class="bv-class-tag">${active ? 'Matrícula ativa' : 'Temporariamente pausada'}</span></div><h3><a href="${href}" class="bv-title-inline">${esc(schoolName)}</a></h3><p class="bv-class-grade">${esc(grade)}</p><p class="bv-class-note">${paid?'Assista às aulas e participe do chat com o Prof. Rafa Boni.':'Sua sala de atividades e redações do professor Rafael.'}</p><a class="bv-class-btn" href="${href}">${paid?'Entrar na sala ao vivo':'Abrir minha turma'} <span aria-hidden="true">↗</span></a></article>`;
    }).filter(Boolean);
    return cards.length ? `${title('Minhas salas e turmas')}<div class="bv-class-grid">${cards.join('')}</div>` : studentEmpty();
  };
  const teacherCards = (classroomRows, sectionRows, memberships) => {
    const counts = new Map();
    const schoolCounts = new Map();
    for (const m of memberships) {
      if (m.status !== 'active') continue;
      schoolCounts.set(m.classroom_id, (schoolCounts.get(m.classroom_id) || 0) + 1);
      if (m.section_id) counts.set(m.section_id, (counts.get(m.section_id) || 0) + 1);
    }
    const cards = classroomRows.map(school => {
      const paid=school.enrollment_type === 'paid_invite';
      const sections = sectionRows.filter(s => s.classroom_id === school.id);
      const total = schoolCounts.get(school.id) || 0;
      const schoolName = school.name.replace(/\s*[—–-]\s*Redaç[aã]o\s*$/iu, '');
      const href=roomLink(school);
      return `<article class="bv-class-card"><div class="bv-class-card-top"><span class="bv-class-school-icon" aria-hidden="true">${paid?'🎥':'▦'}</span><span class="bv-class-tag">${total} aluno${total === 1 ? '' : 's'} matriculado${total === 1 ? '' : 's'}</span></div><h3><a class="bv-title-inline" href="${href}">${esc(schoolName)}</a></h3><p class="bv-class-note">${paid?'Turma exclusiva · aulas ao vivo e controle de matrículas':school.is_active?'Turma ativa · séries do Fundamental e Ensino Médio':'Turma arquivada'}</p>${paid?'':`<div class="bv-class-grades">${grades.map(code => {
        const sec = sections.find(s => s.grade_code === code);
        if (!sec) return '';
        const n = counts.get(sec.id) || 0;
        return `<a href="${roomLink(school,sec)}" class="bv-class-grade-chip" title="${esc(gradeNames[code])}">${esc(gradeNames[code])} <b>${n}</b></a>`;
      }).join('')}</div>`}<a class="bv-class-btn" href="${href}">${paid?'🎥 Gerenciar aula ao vivo':'Abrir escola e séries'} <span aria-hidden="true">↗</span></a></article>`;
    });
    return `${title('Acesso rápido às salas e turmas')}<div class="bv-class-grid">${cards.join('') || '<p>Cadastre as escolas em Turmas e séries.</p>'}</div>`;
  };

  async function fillPanel(panel, mode) {
    try {
      const db = await getClient();
      const {data: {user}, error:authError} = await db.auth.getUser();
      if (authError || !user) throw new Error('Faça login para visualizar suas turmas.');
      if (!panel.isConnected) return;
      if (mode === 'student') {
        const memberships = check(await db.from('classroom_memberships')
          .select('classroom_id,section_id,status').eq('user_id',user.id).eq('status','active'));
        if (!panel.isConnected) return;
        if (!memberships.length) { panel.innerHTML = studentEmpty(); return; }
        const sectionIds = [...new Set(memberships.map(x => x.section_id).filter(Boolean))];
        const sectionRows = sectionIds.length ? check(await db.from('classroom_sections')
          .select('id,classroom_id,grade_code,label,is_active').in('id', sectionIds)) : [];
        const schoolIds = [...new Set(memberships.map(x => x.classroom_id).filter(Boolean))];
        const classroomRows = schoolIds.length ? check(await db.from('classrooms')
          .select('id,name,is_active,enrollment_type').in('id', schoolIds)) : [];
        if (panel.isConnected) panel.innerHTML = studentCards(memberships, sectionRows, classroomRows);
      } else {
        // The server's RLS policies, not this UI, authorize teacher access.
        const result = await db.rpc('current_staff_role');
        if (result.error) throw result.error;
        if (!result.data) throw new Error('Área restrita ao professor.');
        const classroomRows = check(await db.from('classrooms')
          .select('id,name,school_code,is_active,enrollment_type').order('name'));
        const schoolIds = classroomRows.map(x => x.id);
        if (!schoolIds.length) {
          if (panel.isConnected) panel.innerHTML = teacherCards([],[],[]);
          return;
        }
        const [sectionsResult, membersResult] = await Promise.all([
          db.from('classroom_sections').select('id,classroom_id,grade_code,label').in('classroom_id', schoolIds),
          db.from('classroom_memberships').select('classroom_id,section_id,status').in('classroom_id', schoolIds).eq('status','active')
        ]);
        if (panel.isConnected) panel.innerHTML = teacherCards(classroomRows,check(sectionsResult),check(membersResult));
      }
    } catch (e) {
      if (panel.isConnected) panel.innerHTML = `${title('Turmas e séries')}<div class="bv-class-empty"><div><strong>Não foi possível atualizar os atalhos.</strong><p>${esc(e.message || 'Verifique a conexão e recarregue a página.')}</p></div><a class="bv-class-btn" href="${classPage()}">Abrir turmas</a></div>`;
    }
  }

  const update = () => {
    const nav = document.querySelector('#sideNav');
    const view = document.querySelector('#view');
    if (!nav || !view) return;
    const active = nav.querySelector('button.active[data-id]');
    const route = active?.getAttribute('data-id');
    const mode = route === 'admin' ? 'teacher' : route === 'home' ? 'student' : null;
    if (!mode) return;
    const stats = view.querySelector('.stats-row');
    if (!stats || !stats.parentElement || view.querySelector('#boniverso-home-classrooms')) return;
    const panel = document.createElement('section');
    panel.id = 'boniverso-home-classrooms';
    panel.className = 'bv-class-section';
    panel.setAttribute('aria-label', mode === 'student' ? 'Minhas salas e turmas' : 'Acesso rápido às salas e turmas');
    panel.innerHTML = `${title(mode === 'student' ? 'Minhas salas e turmas' : 'Acesso rápido às salas e turmas')}<p class="bv-class-loading" role="status">Carregando suas turmas…</p>`;
    stats.insertAdjacentElement('afterend', panel);
    currentPanel = panel;
    fillPanel(panel, mode);
  };
  const observer = new MutationObserver(update);
  observer.observe(document.documentElement, {subtree:true,childList:true});
  update();
})();
