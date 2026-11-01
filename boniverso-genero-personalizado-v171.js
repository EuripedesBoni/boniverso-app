/* BoniVerso v1.7.1 — Gênero personalizado e manual pedagógico em PDF.
   A pré-correção é privada. O professor aprova a nota em fluxo separado.
   Este complemento só intercepta a criação quando 'Outro' está selecionado.
*/
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const $ = id => document.getElementById(id);
const form = $('newProposal');
const genreSelect = $('pGenre');
const courseSelect = $('pCourse');
if (form && genreSelect && courseSelect && !$('bvGenreCustomBlock')) {
  const config = window.BONIVERSO_CONFIG || {};
  const box = document.createElement('section');
  box.id = 'bvGenreCustomBlock';
  box.hidden = true;
  box.style.cssText = 'display:none;margin:12px 0 18px;padding:18px;border-radius:14px;border:1px solid #c8d9f2;background:#f0f6ff;';
  box.innerHTML = `
    <h3 style="margin:0 0 7px;color:#153a70;font-size:17px">📘 Orientações do gênero personalizado</h3>
    <p style="margin:0 0 15px;color:#536681;font-size:13px;line-height:1.6">O professor define o gênero e anexa as orientações pedagógicas em PDF. Esse documento será consultado pela IA para sugerir uma análise adequada ao gênero, sempre sujeita à revisão do professor.</p>
    <div class="field"><label for="bvCustomGenreName">Nome do gênero textual</label>
      <input id="bvCustomGenreName" maxlength="100" minlength="3" placeholder="Ex.: Crônica, editorial, relato pessoal, carta aberta..." autocomplete="off" />
    </div>
    <div class="field" style="margin-top:12px"><label for="bvGenreGuidancePdf">📄 PDF com orientações e critérios de correção (obrigatório, até 10 MB)</label>
      <input id="bvGenreGuidancePdf" type="file" accept=".pdf,application/pdf" />
      <small>Inclua estrutura, finalidade, características linguísticas e, se possível, critérios de avaliação. Este manual fica reservado à equipe pedagógica. É diferente da coletânea para os alunos.</small>
    </div>
    <p id="bvGenreHelp" role="status" style="font-size:12px;color:#476189;margin:10px 0 0">O texto será avaliado com critérios adaptados ao gênero, não com a rubrica oficial do ENEM.</p>
  `;
  const genreField = genreSelect.closest('.field');
  const grid = genreField?.closest('.form-grid');
  if (grid) grid.insertAdjacentElement('afterend', box);
  else genreField?.insertAdjacentElement('afterend', box);
  const name = $('bvCustomGenreName');
  const pdfInput = $('bvGenreGuidancePdf');
  const hint = $('bvGenreHelp');
  const submitButton = $('createProposal');
  function refreshVisibility() {
    const other = genreSelect.value === 'outro';
    box.hidden = !other;
    box.style.display = other ? 'block' : 'none';
    name.required = other;
    pdfInput.required = other;
    genreSelect.querySelector('option[value="outro"]').textContent = 'Outro — definir gênero e anexar manual em PDF';
  }
  genreSelect.addEventListener('change', refreshVisibility);
  form.addEventListener('reset', () => queueMicrotask(refreshVisibility));
  refreshVisibility();

  function errorMessage(err) {
    if (typeof err?.message === 'string' && err.message.trim()) return err.message;
    return 'Ocorreu uma falha ao salvar a proposta.';
  }
  async function call(db, action, payload) {
    const {data, error} = await db.functions.invoke('boniverso-essays-manager', {body:{action,...payload}});
    if (error) {
      let message = error.message;
      try { const j = await error.context?.json?.(); if (j?.error) message = j.error; } catch {}
      throw Error(message || 'Serviço indisponível.');
    }
    if (data?.error) throw Error(data.error);
    return data;
  }
  async function uploadManual(db, file, course_id) {
    if (file.size < 30 || file.size > 10 * 1024 * 1024) throw Error('O PDF deve ter no máximo 10 MB.');
    if ((await file.slice(0,5).text()) !== '%PDF-') throw Error('O documento de orientações não é um PDF válido.');
    const prep = await call(db, 'prepare_pdf', {course_id});
    const upload = await db.storage.from('boniverso-proposals').uploadToSignedUrl(
      prep.path,prep.token,file,{contentType:'application/pdf',upsert:false});
    if(upload.error) throw upload.error;
    return prep.path;
  }
  // Capture phase: avoid the legacy submit callback, but ONLY for "Outro".
  form.addEventListener('submit', async event => {
    if(genreSelect.value !== 'outro') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (form.dataset.bvGenreSaving === '1') return;
    if (!form.reportValidity()) return;
    const course_id = courseSelect.value;
    const custom_genre_name = name.value.trim();
    const guidance = pdfInput.files?.[0];
    const collection = $('pPdf')?.files?.[0] || null;
    if(custom_genre_name.length < 3 || !guidance) {
      hint.textContent = 'Informe o gênero e selecione o PDF com as orientações.';
      hint.style.color = '#b42318';
      return;
    }
    if (!config.supabaseUrl || !config.supabasePublishableKey) {
      hint.textContent = 'Configuração de acesso indisponível.';
      hint.style.color = '#b42318';
      return;
    }
    const db = createClient(config.supabaseUrl,config.supabasePublishableKey,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
    });
    form.dataset.bvGenreSaving = '1';
    submitButton.disabled = true;
    const oldLabel = submitButton.textContent;
    submitButton.textContent = 'Salvando gênero e anexos…';
    hint.textContent = 'Enviando o manual de critérios em PDF para armazenamento privado…';
    hint.style.color = '#476189';
    try {
      const {data:{user},error:authError} = await db.auth.getUser();
      if(authError || !user) throw Error('Entre com a conta do professor antes de publicar.');
      const genre_guidance_pdf_path = await uploadManual(db,guidance,course_id);
      hint.textContent = 'Manual enviado. Registrando a proposta…';
      const collection_pdf_path = collection ? await uploadManual(db,collection,course_id) : null;
      await call(db,'create_proposal',{
        course_id,
        title:$('pTitle')?.value.trim(),
        proposal_theme:$('pTheme')?.value.trim(),
        writing_genre:'outro',
        custom_genre_name,
        genre_guidance_pdf_path,
        classroom_id:$('pClass')?.value||null,
        instructions:$('pInstructions')?.value.trim(),
        due_at:$('pDue')?.value||null,
        collection_pdf_path
      });
      hint.textContent = 'Gênero e proposta salvos como rascunho. O professor deverá revisá-los e publicar.';
      hint.style.color = '#137852';
      form.reset();
      // Recarrega a lista da Central sem duplicar a criação: a proposta já foi gravada.
      window.location.reload();
    } catch(err) {
      hint.textContent = 'Não foi possível salvar: ' + errorMessage(err);
      hint.style.color = '#b42318';
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = oldLabel;
      delete form.dataset.bvGenreSaving;
    }
  }, true);
}
