/* BoniVerso v3.6.0 — proposta por série com rubrica e PDFs privados.
 * Usar SOMENTE em turmas.html após o formulário existente.
 * Não contém segredo: a autorização continua em Supabase Auth, RLS e Edge Functions.
 */
(async () => {
  'use strict';
  const form = document.getElementById('assignment-form');
  const genre = document.getElementById('assignment-genre');
  if (!form || !genre || document.getElementById('bvProposalExtra360')) return;
  const cfg = window.BONIVERSO_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabasePublishableKey) return;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.2');
  const db = createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth?.user) return;
  const { data: staffRole, error: roleError } = await db.rpc('current_staff_role');
  if (roleError || !['admin', 'teacher'].includes(staffRole)) return;

  const byId = id => document.getElementById(id);
  const labels = {
    enem: 'Dissertação ENEM', carta: 'Carta argumentativa ou aberta',
    resenha: 'Resenha crítica', artigo: 'Artigo de opinião', outro: 'Outro gênero'
  };
  for (const option of genre.options) {
    if (labels[option.value]) option.textContent = labels[option.value];
  }
  const container = document.createElement('div');
  container.id = 'bvProposalExtra360';
  container.innerHTML = `
    <style>
      #bvProposalExtra360 .bv-pdf-block{margin:15px 0;padding:16px;border:1px solid #d9e4f3;border-radius:13px;background:#f7faff}
      #bvProposalExtra360 .bv-pdf-block h3{font-size:16px;margin:0 0 10px;color:#1d3459}
      #bvProposalExtra360 .bv-input-note{font-size:12px;color:#5c708c;line-height:1.6;margin:6px 0}
      #bvProposalExtra360 .bv-genre-extra{margin:15px 0;padding:16px;border:2px solid #d6b16f;border-radius:13px;background:#fffdf8}
      #bvProposalExtra360 .bv-genre-extra[hidden]{display:none!important}
      #bvProposalExtra360 input[type=file]{background:#fff}
      #bvProposalExtra360 [role=status]{margin:12px 0;padding:12px;border-radius:10px;border:1px solid #c9dbee;background:#edf5ff;color:#254c79}
      #bvProposalExtra360 [role=status][data-error=true]{background:#fff1ee;border-color:#efb6ab;color:#9a3628}
      #bvProposalExtra360 [role=status]:empty{display:none}
    </style>
    <div class="field"><label for="bvProposalTheme360">Tema da proposta (opcional)</label>
      <input id="bvProposalTheme360" maxlength="350" placeholder="Ex.: Desinformação nas redes sociais" autocomplete="off"></div>
    <div class="field"><label for="bvProposalRubric360">Critérios adicionais de avaliação para a Luna (opcional)</label>
      <textarea id="bvProposalRubric360" maxlength="1800" rows="3" placeholder="Ex.: adequação ao interlocutor, estrutura, repertório, originalidade e argumentação."></textarea>
      <div class="bv-input-note">Esses critérios complementam a rubrica do gênero. A pré-correção é uma sugestão, sempre revisada pelo professor.</div></div>
    <div class="bv-pdf-block"><h3>📄 PDF da proposta / coletânea</h3>
      <div class="field"><label for="bvProposalCollection360">Anexar PDF para os alunos (opcional, até 10 MB)</label>
      <input id="bvProposalCollection360" type="file" accept=".pdf,application/pdf">
      <div class="bv-input-note">Como nos repertórios: o aluno autorizado poderá abrir esse PDF pela proposta publicada. Arquivo privado no Supabase.</div></div></div>
    <div class="bv-genre-extra" id="bvOtherGenre360" hidden>
      <h3>✍️ Configuração de outro gênero textual</h3>
      <div class="field"><label for="bvCustomGenre360">Nome do gênero *</label>
        <input id="bvCustomGenre360" maxlength="100" placeholder="Ex.: Crônica, relato, resumo, carta do leitor" autocomplete="off"></div>
      <div class="field"><label for="bvGenreManual360">PDF da rubrica / manual de correção * (até 10 MB)</label>
        <input id="bvGenreManual360" type="file" accept=".pdf,application/pdf">
        <div class="bv-input-note">A Luna utilizará as orientações desse arquivo para propor os critérios de correção. O documento não é publicado automaticamente para os alunos.</div></div>
      <p class="bv-input-note">Para outros gêneros, o nome e o PDF da rubrica são obrigatórios no motor de pré-correção atual. Não publique sem conferir os critérios e a legibilidade do arquivo.</p>
    </div>
    <p class="bv-input-note" id="bvLunaHint360">A Luna utiliza uma rubrica apropriada ao gênero e os critérios adicionais. A nota oficial depende de aprovação do professor.</p>
    <div id="bvProposalStatus360" role="status" aria-live="polite"></div>`;
  const submit = form.querySelector('button[type="submit"]');
  if (!submit) return;
  submit.before(container);
  const originalNotice = form.querySelector('.notice.warning');
  if (originalNotice && /matriz ENEM|pré-correção atual da Luna/i.test(originalNotice.textContent || '')) {
    originalNotice.textContent = 'A Luna pode gerar pré-correções para ENEM, carta, resenha, artigo e outros gêneros com rubrica em PDF. As sugestões não substituem a avaliação do professor.';
  }
  const status = (message, error = false) => {
    const el = byId('bvProposalStatus360');
    el.textContent = message;
    el.dataset.error = String(error);
  };
  function showCustom() {
    const other = genre.value === 'outro';
    byId('bvOtherGenre360').hidden = !other;
    byId('bvCustomGenre360').required = other;
    byId('bvGenreManual360').required = other;
    byId('bvLunaHint360').textContent = other
      ? 'A Luna usará o PDF da rubrica para uma pré-correção orientada ao gênero informado. A revisão e a nota final ficam com o professor.'
      : 'A Luna aplicará a rubrica pedagógica do gênero escolhido. A revisão e a nota final ficam com o professor.';
  }
  genre.addEventListener('change', showCustom);
  showCustom();

  const query = async promise => {
    const response = await promise;
    if (response.error) throw response.error;
    return response.data;
  };
  async function invoke(action, args = {}) {
    const { data, error } = await db.functions.invoke('boniverso-essays-manager', {
      body: { action, ...args }
    });
    if (error) {
      let message = error.message;
      try { message = (await error.context?.json?.())?.error || message; } catch { /* resposta sem JSON */ }
      throw Error(message || 'Não foi possível conectar ao serviço de documentos.');
    }
    if (data?.error) throw Error(data.error);
    return data;
  }
  async function uploadPdf(file, courseId, label) {
    if (!file) return null;
    if (!/\.pdf$/i.test(file.name) || file.size < 30 || file.size > 10 * 1024 * 1024)
      throw Error(`${label}: selecione um PDF válido de até 10 MB.`);
    if (await file.slice(0, 5).text() !== '%PDF-')
      throw Error(`${label}: o arquivo não possui assinatura de PDF.`);
    const prep = await invoke('prepare_pdf', { course_id: courseId });
    if (!prep?.path || !prep?.token) throw Error('Não foi possível preparar o envio privado do PDF.');
    await query(db.storage.from('boniverso-proposals').uploadToSignedUrl(
      prep.path, prep.token, file, { contentType: 'application/pdf', upsert: false }
    ));
    return prep.path;
  }

  // Captura a submissão ANTES do listener legado de turmas.html; assim a proposta
  // conserva a seção (ano escolar) e não é publicada duas vezes.
  form.addEventListener('submit', async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (form.dataset.bvBusy360 === 'true') return;
    form.dataset.bvBusy360 = 'true';
    submit.disabled = true;
    const previousLabel = submit.textContent;
    submit.textContent = 'Publicando…';
    status('Conferindo a proposta e enviando os documentos…');
    try {
      const role = await query(db.rpc('current_staff_role'));
      if (!['teacher', 'admin'].includes(role)) throw Error('Sua sessão não está autorizada a publicar propostas.');
      const sectionId = byId('assignment-section').value;
      const courseId = byId('assignment-course').value;
      const [section, course] = await Promise.all([
        query(db.from('classroom_sections').select('id,classroom_id,is_active').eq('id', sectionId).single()),
        query(db.from('courses').select('id,is_free,published').eq('id', courseId).single())
      ]);
      const school = await query(db.from('classrooms').select('id,is_active').eq('id', section.classroom_id).single());
      if (!section.is_active || !school.is_active) throw Error('Escolha uma turma e um ano escolar ativos.');
      if (!course.is_free || !course.published) throw Error('Escolha um curso gratuito e publicado.');
      const title = byId('assignment-title').value.trim();
      const basic = byId('assignment-instructions').value.trim();
      const rubric = byId('bvProposalRubric360').value.trim();
      if (title.length < 5 || title.length > 150 || basic.length < 20)
        throw Error('Preencha o título e as orientações com pelo menos 20 caracteres.');
      const instructions = basic + (rubric ? `\n\nCRITÉRIOS PEDAGÓGICOS ADICIONAIS DEFINIDOS PELO PROFESSOR:\n${rubric}` : '');
      if (instructions.length > 5000) throw Error('Orientações e critérios somados devem ter no máximo 5.000 caracteres.');
      const type = genre.value;
      if (!['enem','carta','resenha','artigo','outro'].includes(type)) throw Error('Gênero não reconhecido.');
      const customName = type === 'outro' ? byId('bvCustomGenre360').value.trim() : null;
      const manualFile = type === 'outro' ? byId('bvGenreManual360').files?.[0] : null;
      if (type === 'outro' && (!customName || customName.length < 3 || !manualFile))
        throw Error('Para Outro gênero, informe o nome e anexe o PDF com a rubrica.');
      const due = byId('assignment-due').value;
      const dueDate = due ? new Date(due) : null;
      if (dueDate && (!Number.isFinite(dueDate.getTime()) || dueDate <= new Date()))
        throw Error('Informe um prazo futuro ou deixe o campo em branco.');
      const collectionFile = byId('bvProposalCollection360').files?.[0];
      const collection_pdf_path = await uploadPdf(collectionFile, courseId, 'PDF da proposta');
      const genre_guidance_pdf_path = await uploadPdf(manualFile, courseId, 'PDF da rubrica');
      await query(db.from('assignments').insert({
        course_id: courseId, classroom_id: section.classroom_id, section_id: section.id,
        title, instructions, proposal_theme: byId('bvProposalTheme360').value.trim() || title,
        writing_genre: type, custom_genre_name: customName,
        collection_pdf_path, genre_guidance_pdf_path,
        due_at: dueDate ? dueDate.toISOString() : null,
        max_points: 1000, published: true
      }));
      form.reset();
      showCustom();
      status('✅ Proposta publicada para o ano selecionado. PDFs enviados de forma privada; a rubrica ficou vinculada à pré-correção da Luna.');
    } catch (error) {
      status('Não foi possível publicar: ' + (error?.message || String(error)) + '. Nenhuma proposta foi publicada por este formulário.', true);
    } finally {
      submit.disabled = false;
      submit.textContent = previousLabel;
      form.dataset.bvBusy360 = 'false';
    }
  }, true);
})();

/* Integração complementar: Central de Redações, que já publica rascunhos
 * pela Edge Function boniverso-essays-manager.
 */
(async () => {
  'use strict';
  const form = document.getElementById('newProposal');
  const genre = document.getElementById('pGenre');
  if (!form || !genre || document.getElementById('bvCentralGenre360')) return;
  const cfg = window.BONIVERSO_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabasePublishableKey) return;
  const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2.57.2');
  const db = createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
  });
  const {data:auth,error:authError}=await db.auth.getUser();
  if(authError||!auth?.user) return;
  const {data:role,error:roleError}=await db.rpc('current_staff_role');
  if(roleError||!['admin','teacher'].includes(role))return;
  const byId = id => document.getElementById(id);
  const wrapper = document.createElement('div');
  wrapper.id = 'bvCentralGenre360';
  wrapper.innerHTML = `
    <div class="field"><label for="bvCentralRubric360">Critérios adicionais para a Luna (opcional)</label>
      <textarea id="bvCentralRubric360" maxlength="1800" rows="3" placeholder="Ex.: adequação ao interlocutor, estrutura textual e clareza argumentativa"></textarea></div>
    <div id="bvCentralOther360" hidden style="padding:15px;margin:12px 0;border:2px solid #d6b16f;border-radius:12px;background:#fffaf1">
      <h3>📋 Rubrica personalizada — outro gênero</h3>
      <div class="field"><label for="bvCentralGenreName360">Nome do gênero *</label>
        <input id="bvCentralGenreName360" maxlength="100" placeholder="Ex.: Crônica ou carta do leitor"></div>
      <div class="field"><label for="bvCentralManual360">PDF da rubrica / orientações para a Luna * (até 10 MB)</label>
        <input id="bvCentralManual360" type="file" accept=".pdf,application/pdf"></div>
      <p class="muted">Esse documento será usado somente como referência pedagógica para a pré-correção privada, sujeita à revisão do professor.</p>
    </div>
    <div id="bvCentralStatus360" role="status" aria-live="polite" style="margin:12px 0"></div>`;
  byId('createProposal')?.before(wrapper);
  const originalOption=[...genre.options].find(o=>o.value==='outro');
  if(originalOption)originalOption.textContent='Outro gênero — rubrica personalizada em PDF';
  function toggle(){const on=genre.value==='outro';byId('bvCentralOther360').hidden=!on;byId('bvCentralGenreName360').required=on;byId('bvCentralManual360').required=on;}
  genre.addEventListener('change',toggle);toggle();
  const message=(text,err=false)=>{const el=byId('bvCentralStatus360');if(el){el.textContent=text;el.style.color=err?'#a3382d':'#17684e';}};
  const query=async q=>{const r=await q;if(r.error)throw r.error;return r.data;};
  const invoke=async(action,params={})=>{const r=await db.functions.invoke('boniverso-essays-manager',{body:{action,...params}});
    if(r.error){let errorMessage=r.error.message;try{errorMessage=(await r.error.context?.json?.())?.error||errorMessage}catch{}throw Error(errorMessage)}
    if(r.data?.error)throw Error(r.data.error);return r.data;};
  async function upload(file,courseId,label){
    if(!file)return null;
    if(!/\.pdf$/i.test(file.name)||file.size<30||file.size>10485760||await file.slice(0,5).text()!=='%PDF-')throw Error(label+' deve ser PDF válido com até 10 MB.');
    const prep=await invoke('prepare_pdf',{course_id:courseId});
    if(!prep?.path||!prep?.token)throw Error('Não foi possível preparar o upload seguro.');
    await query(db.storage.from('boniverso-proposals').uploadToSignedUrl(prep.path,prep.token,file,{contentType:'application/pdf',upsert:false}));
    return prep.path;
  }
  const save=byId('createProposal');
  if(!save)return;
  form.addEventListener('submit',async event=>{
    event.preventDefault();event.stopImmediatePropagation();
    if(form.dataset.bvBusy360==='true')return;
    form.dataset.bvBusy360='true';save.disabled=true;
    message('Validando os critérios e enviando os arquivos…');
    try{
      const currentRole=await query(db.rpc('current_staff_role'));
      if(!['admin','teacher'].includes(currentRole))throw Error('Acesso exclusivo de professores autorizados.');
      const courseId=byId('pCourse').value;
      if(!courseId)throw Error('Selecione um curso.');
      const type=genre.value;
      const custom=type==='outro'?byId('bvCentralGenreName360').value.trim():null;
      if(type==='outro'&&(!custom||custom.length<3||!byId('bvCentralManual360').files?.length))throw Error('Informe o gênero e anexe a rubrica em PDF.');
      const basic=byId('pInstructions').value.trim();
      const extras=byId('bvCentralRubric360').value.trim();
      const instructions=basic+(extras?'\n\nCRITÉRIOS ADICIONAIS DO PROFESSOR:\n'+extras:'');
      if(instructions.length<8||instructions.length>5000)throw Error('Orientações e critérios devem totalizar entre 8 e 5.000 caracteres.');
      const due=byId('pDue').value;
      if(due && (!Number.isFinite(new Date(due).getTime())||new Date(due)<=new Date()))throw Error('Defina um prazo futuro.');
      const collection_pdf_path=await upload(byId('pPdf').files?.[0],courseId,'A coletânea');
      const genre_guidance_pdf_path=await upload(type==='outro'?byId('bvCentralManual360').files?.[0]:null,courseId,'A rubrica');
      const result=await invoke('create_proposal',{
        course_id:courseId,title:byId('pTitle').value.trim(),
        proposal_theme:byId('pTheme').value.trim(),writing_genre:type,
        classroom_id:byId('pClass').value||null,instructions,
        due_at:due||null,collection_pdf_path,
        custom_genre_name:custom,genre_guidance_pdf_path
      });
      if(!result?.id)throw Error('O servidor não confirmou a criação da proposta.');
      form.reset();toggle();
      message('✅ Proposta salva como rascunho, com rubrica vinculada. Atualize a página para visualizá-la e publicá-la.');
    }catch(e){message('Não foi possível salvar: '+(e?.message||e),true)}
    finally{save.disabled=false;form.dataset.bvBusy360='false'}
  },true);
})();
