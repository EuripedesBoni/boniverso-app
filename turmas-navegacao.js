/* BoniVerso 1.1.1 — navegação unificada de escolas, séries e turma paga.
   Só gera atalhos; a autorização verdadeira é do Supabase Auth + RLS. */
(() => {
  'use strict';
  const cfg = window.BONIVERSO_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabasePublishableKey) return;
  const path = location.pathname.split('/').pop() || 'index.html';
  if (!['index.html', 'turmas.html'].includes(path)) return;
  const isManager = path === 'turmas.html';
  const GRADE = {'6EF':'6º ano EF','7EF':'7º ano EF','8EF':'8º ano EF','9EF':'9º ano EF','1EM':'1ª série EM','2EM':'2ª série EM','3EM':'3ª série EM'};
  const bare = value => String(value || '').replace(/\s*[—–-]\s*Redaç[aã]o\s*$/iu,'').trim();
  const urlFor = (school, section) => school.enrollment_type === 'paid_invite'
    ? './aparecida.html'
    : './sala.html?turma='+encodeURIComponent(school.id)+(section?'&serie='+encodeURIComponent(section.id):'');
  let client, data, busy=false, queued=false, lastCheck=0;
  const byId = (id) => document.getElementById(id);
  const makeLink = (label, href, className) => {
    const a = document.createElement('a');
    a.href=href; a.textContent=label; a.className=className||'bv-abrir-turma';
    a.setAttribute('aria-label',label);
    return a;
  };
  const getInfo = async () => {
    if (busy) return;
    busy=true;
    try {
      if (!client) {
        const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2.57.2');
        client=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      }
      const auth=await client.auth.getUser();
      if (!auth.data.user) return;
      const [role,schools,sections,members]=await Promise.all([
        client.rpc('current_staff_role'),
        client.from('classrooms').select('id,name,enrollment_type,is_active,paid_course_id').order('name'),
        client.from('classroom_sections').select('id,classroom_id,label,grade_code,is_active'),
        client.from('classroom_memberships').select('user_id,classroom_id,section_id,status,joined_at').eq('user_id',auth.data.user.id).eq('status','active').order('joined_at',{ascending:false})
      ]);
      if(role.error||schools.error||sections.error||members.error) throw (role.error||schools.error||sections.error||members.error);
      data={staff:['admin','teacher'].includes(role.data),schools:schools.data||[],sections:sections.data||[],members:members.data||[]};
      lastCheck=Date.now();
      paint();
    } catch(err) {console.warn('BoniVerso: atalhos de turmas',err);} finally {busy=false;}
  };
  function schoolForName(name){return data?.schools.find(s=>bare(s.name)===bare(name))}
  function schoolForMember(m){return data.schools.find(s=>s.id===m.classroom_id)}
  function paintManager(){
    // Links recebidos da página de cada série abrem o relatório já selecionado.
    const reportId=new URLSearchParams(location.search).get('relatorio');
    const report=byId('report-section');
    if(data?.staff && report && reportId && !report.dataset.bvDeepLinked &&
       Array.from(report.options).some(o=>o.value===reportId)){
      report.value=reportId;
      report.dataset.bvDeepLinked='ready';
      report.dispatchEvent(new Event('change',{bubbles:true}));
      byId('report-panel')?.scrollIntoView({block:'start',behavior:'smooth'});
    }
    const view=byId('schools');
    if(data?.staff && view){
      for(const card of view.querySelectorAll('.schoolcard')){
        if(card.dataset.bvNavigation==='ready')continue;
        const top=card.querySelector('.section-top');
        const name=top?.querySelector('strong')?.textContent||'';
        const school=schoolForName(name);
        if(!school)continue;
        const href=urlFor(school);
        const title=top.querySelector('strong');
        const a=makeLink(title.textContent,href,'bv-room-title');
        title.replaceWith(a);
        const actions=card.querySelector(':scope > .actions');
        if(actions)actions.appendChild(makeLink(school.enrollment_type==='paid_invite'?'🎥 Abrir sala de Aparecida':'🏫 Abrir escola',href,'btn sm secondary bv-room-action'));
        if(school.enrollment_type!=='paid_invite'){
          for(const slot of card.querySelectorAll('.code-slot[id^="code-"]')){
            const sectionId=slot.id.slice('code-'.length);
            const section=data.sections.find(s=>s.id===sectionId && s.classroom_id===school.id);
            const buttons=slot.closest('.section')?.querySelector('.actions');
            if(section && buttons && !buttons.querySelector('.bv-room-action')) {
              buttons.appendChild(makeLink('📚 Abrir '+(GRADE[section.grade_code]||section.label),urlFor(school,section),'btn sm secondary bv-room-action'));
            }
          }
        }
        card.dataset.bvNavigation='ready';
      }
    }
    const mine=byId('my-classes');
    if(!data?.staff && mine && mine.querySelector('.section')){
      const cards=Array.from(mine.querySelectorAll(':scope > .section'));
      for(let i=0;i<cards.length;i++){
        const card=cards[i],m=data.members[i];
        if(card.dataset.bvNavigation==='ready'||!m)continue;
        const school=schoolForMember(m);
        if(!school)continue;
        const section=data.sections.find(s=>s.id===m.section_id);
        const href=urlFor(school,section);
        const name=school.enrollment_type==='paid_invite' ? school.name : school.name+' · '+(GRADE[section?.grade_code]||section?.label||'Turma');
        const strong=card.querySelector('strong');
        if(strong)strong.replaceWith(makeLink(name,href,'bv-room-title'));
        card.appendChild(makeLink(school.enrollment_type==='paid_invite'?'🎥 Entrar na minha aula ao vivo':'📚 Abrir minha sala',href,'bv-abrir-turma'));
        card.dataset.bvNavigation='ready';
      }
    }
  }
  function paintHome(){
    const panel=byId('boniverso-home-classrooms');
    if(!panel||!data)return;
    const cards=Array.from(panel.querySelectorAll('.bv-class-card'));
    const active=data.members.filter(m=>m.status==='active');
    const paid=data.schools.filter(s=>s.enrollment_type==='paid_invite');
    for(const card of cards){
      const title=card.querySelector('h3')?.textContent||'';
      const school=schoolForName(title);
      if(!school)continue;
      const link=card.querySelector('a.bv-class-btn');
      if(!link)continue;
      const gradeLabel=card.querySelector('.bv-class-grade')?.textContent?.trim();
      let sec;
      if(!data.staff && gradeLabel) sec=data.sections.find(s=>s.classroom_id===school.id&&(GRADE[s.grade_code]||s.label)===gradeLabel);
      link.href=urlFor(school,sec);
      link.innerHTML=data.staff?'Abrir escola <span aria-hidden="true">↗</span>':'Abrir minha sala <span aria-hidden="true">↗</span>';
      const h3=card.querySelector('h3');
      if(h3 && h3.tagName==='H3' && !h3.querySelector('a')) {
        const linkName=makeLink(h3.textContent,link.href,'bv-title-inline');
        h3.replaceChildren(linkName);
      }
    }
    const newSchools=data.staff
      ? data.schools.filter(s=>!cards.some(card=>bare(card.querySelector('h3')?.textContent)===bare(s.name)))
      : paid.filter(s=>active.some(m=>m.classroom_id===s.id));
    if(!newSchools.length)return;
    let grid=panel.querySelector('.bv-class-grid');
    if(!grid){
      const empty=panel.querySelector('.bv-class-empty');
      if(empty){grid=document.createElement('div');grid.className='bv-class-grid';empty.replaceWith(grid)}
    }
    if(!grid)return;
    for(const school of newSchools){
      if(grid.querySelector('[data-bv-paid-id="'+school.id+'"]'))continue;
      const card=document.createElement('article');card.className='bv-class-card';card.dataset.bvPaidId=school.id;
      const paidRoom=school.enrollment_type==='paid_invite';
      const dest=urlFor(school);
      const badge=document.createElement('span');badge.className='bv-class-tag';badge.textContent=data.staff?(paidRoom?'Turma exclusiva · Gestão':'Escola e séries'):'Matrícula autorizada';
      const top=document.createElement('div');top.className='bv-class-card-top';
      const icon=document.createElement('span');icon.className='bv-class-school-icon';icon.textContent=paidRoom?'🎥':'🏫';icon.setAttribute('aria-hidden','true');top.append(icon,badge);
      const title=document.createElement('h3');title.append(makeLink(bare(school.name),dest,'bv-title-inline'));
      const note=document.createElement('p');note.className='bv-class-note';note.textContent=data.staff?(paidRoom?'Controle de matrículas e aulas ao vivo do Prof. Rafael.':'Acesse as séries, propostas e relatórios desta escola.'):'Aulas privadas, calendário e chat da sua turma.';
      card.append(top,title,note,makeLink(data.staff?(paidRoom?'Abrir sala do professor':'Abrir escola'):'Entrar nas aulas ao vivo',dest,'bv-class-btn'));
      grid.append(card);
    }
  }
  function paint(){if(!data)return;paintManager();paintHome()}
  function schedule(){
    if(queued)return;queued=true;
    setTimeout(()=>{
      queued=false;
      paint();
      if(!data||Date.now()-lastCheck>60000){
        const need=(isManager && (!!byId('schools')?.querySelector('.schoolcard')||!!byId('my-classes')?.querySelector('.section')))
          || (!isManager && !!byId('boniverso-home-classrooms'));
        if(need)getInfo();
      }
    },110);
  }
  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('focus',()=>{if(Date.now()-lastCheck>60000)getInfo();});
  document.addEventListener('submit',e=>{if(e.target?.id==='join-form')setTimeout(getInfo,1500)},true);
  schedule();
})();
