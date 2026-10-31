/* BoniVerso Live v1.2.4 | Exportação de presença em PDF
   Adicionar após config.js em painel-participantes.html, perto de </body>.
   A consulta continua no servidor e exige professor/admin autenticado. */
(async () => {
  'use strict';
  const query = new URLSearchParams(location.search);
  const eventId = query.get('sessao');
  const validId = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
  const cfg = window.BONIVERSO_CONFIG;
  const csv = document.getElementById('export');
  if (!validId.test(eventId || '') || !cfg?.supabaseUrl || !cfg?.supabasePublishableKey || !csv) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'boniverso-presenca-pdf';
  button.textContent = 'Baixar PDF';
  button.title = 'Gerar relatório de presença da aula em PDF';
  button.style.cssText = 'background:#132848;color:#fff;min-height:40px;border:0;border-radius:10px;padding:10px 15px;font-weight:700;cursor:pointer';
  csv.insertAdjacentElement('afterend', button);

  const feedback = text => {
    const status = document.getElementById('status');
    if (status) status.textContent = text;
  };
  const fmtDate = raw => {
    if (!raw) return '—';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Cuiaba', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(date);
  };
  const fmtSecs = number => {
    const n = Math.max(0, Math.floor(Number(number) || 0));
    return `${String(Math.floor(n / 3600)).padStart(2,'0')}:${String(Math.floor(n / 60) % 60).padStart(2,'0')}:${String(n % 60).padStart(2,'0')}`;
  };
  const safeName = name => String(name || 'Estudante').trim().slice(0, 80);

  // Reentradas são contadas, mas intervalos sobrepostos NÃO duplicam o tempo de presença.
  const calculate = data => {
    const now = Date.now();
    const active = new Set((data.roster || []).map(p => p.participant_sid));
    const people = new Map();
    const sessions = [];
    for (const s of data.attendance || []) {
      const joined = Date.parse(s.joined_at);
      if (!Number.isFinite(joined)) continue;
      const ended = s.left_at ? Date.parse(s.left_at) : null;
      const hasClosed = Number.isFinite(ended);
      const online = !hasClosed && active.has(s.participant_sid);
      const pending = !hasClosed && !online;
      const finish = hasClosed ? Math.max(joined, ended) : online ? now : joined;
      const row = {
        id: s.user_id, name: safeName(s.name), joined, finish,
        closed: hasClosed, online, pending, source: s.source || 'webhook'
      };
      sessions.push(row);
      if (!people.has(row.id)) people.set(row.id, {
        id: row.id, name: row.name, count: 0, first: Infinity,
        last: 0, online: false, pending: false, spans: []
      });
      const p = people.get(row.id);
      p.count++;
      p.first = Math.min(p.first, joined);
      if (hasClosed) p.last = Math.max(p.last, finish);
      if (online) p.online = true;
      if (pending) p.pending = true;
      p.spans.push([joined, finish]);
    }
    const students = [...people.values()].map(p => {
      let total = 0, endOfUnion = -Infinity;
      for (const [start, end] of p.spans.sort((a,b) => a[0]-b[0])) {
        if (end > endOfUnion) total += Math.max(0, end - Math.max(start, endOfUnion));
        endOfUnion = Math.max(endOfUnion, end);
      }
      return {...p, seconds: Math.round(total/1000)};
    }).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
    sessions.sort((a,b)=>a.joined-b.joined);
    return {students, sessions};
  };

  async function loadForPdf() {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.2');
    const db = createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
      auth: {persistSession:true, autoRefreshToken:true, detectSessionInUrl:false}
    });
    const {data: {user}, error:authError} = await db.auth.getUser();
    if (authError || !user) throw Error('Faça login como professor para exportar a presença.');
    const {data, error} = await db.functions.invoke('boniverso-live-participants', {
      body: {event_id:eventId, action:'list'}
    });
    if (error) {
      let detail = error.message || 'Falha ao consultar a presença';
      try {detail = (await error.context?.json?.())?.error || detail;} catch {}
      throw Error(detail);
    }
    if (data?.error) throw Error(data.error);
    if (!data?.attendance?.length) throw Error('Esta aula ainda não possui presença registrada para exportação.');
    if (data.attendance.length >= 1000) throw Error('Relatório chegou ao limite de 1.000 conexões. Solicite exportação paginada antes de emitir um PDF incompleto.');
    return data;
  }

  async function renderPdf(data) {
    const module = await import('https://esm.sh/jspdf@2.5.2?bundle');
    const PDF = module.jsPDF || module.default?.jsPDF;
    if (!PDF) throw Error('Não foi possível carregar o gerador de PDF.');
    const pdf = new PDF({orientation:'landscape',unit:'mm',format:'a4'});
    const P = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight();
    const margin = 14, available = P-2*margin;
    const {students, sessions} = calculate(data);
    const title = (data.event?.title || 'Aula ao vivo').slice(0, 110);
    const emitted = fmtDate(new Date());
    const connected = students.filter(p=>p.online).length;
    const pending = students.filter(p=>p.pending).length;
    const sumSeconds = students.reduce((t,p)=>t+p.seconds,0);
    let y = 0;

    function top(heading, continued=false) {
      pdf.setFillColor(19,40,72); pdf.rect(0,0,P,25,'F');
      pdf.setFont('helvetica','bold');pdf.setTextColor(255,255,255);
      pdf.setFontSize(17);pdf.text('BoniVerso',margin,15.5);
      pdf.setFontSize(9.5);pdf.setTextColor(233,200,136);pdf.text('LIVE  |  RSB EDUCACAO',53,15.3);
      pdf.setTextColor(255,255,255);pdf.setFontSize(10.5);
      pdf.text(heading,P-margin,15.5,{align:'right'});
      y=34;
      if (continued) {
        pdf.setFont('helvetica','normal');pdf.setFontSize(9);pdf.setTextColor(86,105,130);
        pdf.text(title + '  |  Continuacao',margin,y);y+=11;
      }
    }
    const text = (t,x,at,size=9,bold=false,color=[33,48,70])=>{
      pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);
      pdf.setTextColor(...color);pdf.text(String(t),x,at);
    };
    function caption(txt) {
      text(txt,margin,y,11,true,[19,40,72]);y+=8;
    }
    function tableHeader(cols,widths) {
      if (y+12>H-22){pdf.addPage();top('RELATORIO DE PRESENCA',true);}
      pdf.setFillColor(19,40,72);pdf.roundedRect(margin,y,available,9,1.5,1.5,'F');
      let x=margin;
      for(let i=0;i<cols.length;i++){text(cols[i],x+2,y+6,7.4,true,[255,255,255]);x+=widths[i];}
      y+=11;
    }
    function tableRow(values,widths,rowHeight=10) {
      if(y+rowHeight>H-22){pdf.addPage();top('RELATORIO DE PRESENCA',true);}
      if(Math.floor(y/10)%2===0){pdf.setFillColor(246,249,253);pdf.rect(margin,y,available,rowHeight,'F');}
      let x=margin;
      for(let i=0;i<values.length;i++){
        const maxLines=Math.max(1,Math.floor(rowHeight/4));
        let lines=pdf.splitTextToSize(String(values[i]),widths[i]-4).slice(0,maxLines);
        pdf.setTextColor(40,56,78);pdf.setFontSize(8.1);pdf.setFont('helvetica','normal');
        lines.forEach((line,j)=>pdf.text(line,x+2,y+5+j*3.8));
        x+=widths[i];
      }
      pdf.setDrawColor(224,232,241);pdf.line(margin,y+rowHeight,margin+available,y+rowHeight);
      y+=rowHeight;
    }
    top('RELATORIO DE PRESENCA');
    const titleLines=pdf.splitTextToSize(title,available);
    pdf.setTextColor(19,40,72);pdf.setFont('helvetica','bold');pdf.setFontSize(15);
    pdf.text(titleLines.slice(0,2),margin,y);y+=titleLines.slice(0,2).length*7;
    text('Emitido em '+emitted+'  |  Horario: America/Cuiaba  |  Fonte: LiveKit + Supabase',margin,y,8,false,[93,112,135]);y+=9;
    const statLabels=[['PARTICIPANTES',students.length],['CONEXOES',sessions.length],['TEMPO TOTAL',fmtSecs(sumSeconds)]];
    const width=(available-12)/3;
    for(let i=0;i<3;i++){
      const x=margin+i*(width+6);
      pdf.setFillColor(234,242,251);pdf.roundedRect(x,y,width,23,2,2,'F');
      text(statLabels[i][0],x+5,y+8,8,true,[91,108,133]);
      text(statLabels[i][1],x+5,y+18,14,true,[19,40,72]);
    }
    y+=32;
    caption('Resumo por participante');
    const cols=['PARTICIPANTE','ENTRADAS','PRIMEIRO ACESSO','ULTIMA SAIDA','TEMPO','SITUACAO'];
    const widths=[77,24,49,49,35,35];
    tableHeader(cols,widths);
    for(const s of students){
      if(y+12>H-22){pdf.addPage();top('RELATORIO DE PRESENCA',true);tableHeader(cols,widths);}
      tableRow([s.name,s.count,fmtDate(s.first),s.last?fmtDate(s.last):'—',fmtSecs(s.seconds),s.online?'Conectado':s.pending?'Saida pendente':'Encerrada'],widths,12);
    }
    y+=8;
    if(y>H-38){pdf.addPage();top('RELATORIO DE PRESENCA',true);}
    caption('Detalhamento das conexoes');
    const cols2=['PARTICIPANTE','ENTRADA','SAIDA','DURACAO','ORIGEM','STATUS'];
    const widths2=[82,49,49,33,25,31];
    tableHeader(cols2,widths2);
    for(const s of sessions){
      if(y+11>H-22){pdf.addPage();top('RELATORIO DE PRESENCA',true);tableHeader(cols2,widths2);}
      tableRow([s.name,fmtDate(s.joined),s.closed?fmtDate(s.finish):'—',s.pending?'Pendente':fmtSecs((s.finish-s.joined)/1000),s.source,s.online?'Ao vivo':s.pending?'Pendente':'Encerrada'],widths2,11);
    }
    y+=7;
    const note='Observacao: os tempos representam conexao tecnica. Reconexoes sao agrupadas por participante; intervalos simultaneos nao sao contados em dobro. Nao equivale a comprovacao de atencao ou rendimento.';
    if (y+18>H-20){pdf.addPage();top('RELATORIO DE PRESENCA',true);}
    const noteLines=pdf.splitTextToSize(note,available);
    noteLines.forEach(line=>{text(line,margin,y,7.7,false,[90,108,130]);y+=4.5;});
    if (connected || pending) {
      const alert=`Em aberto: ${connected} conectado(s) e ${pending} sem saida confirmada. Verifique novamente apos o encerramento da aula.`;
      const wrap=pdf.splitTextToSize(alert,available);
      wrap.forEach(line=>{if(y>H-23){pdf.addPage();top('RELATORIO DE PRESENCA',true);}text(line,margin,y,8,true,[144,94,24]);y+=5;});
    }
    const totalPages=pdf.getNumberOfPages();
    for(let i=1;i<=totalPages;i++){
      pdf.setPage(i);pdf.setDrawColor(220,228,239);pdf.line(margin,H-15,P-margin,H-15);
      text('BoniVerso  |  Relatorio tecnico de presenca',margin,H-9,7.4,false,[103,118,139]);
      pdf.setFont('helvetica','normal');pdf.setFontSize(7.4);pdf.setTextColor(103,118,139);
      pdf.text('Pagina '+i+' de '+totalPages,P-margin,H-9,{align:'right'});
    }
    const filename='BoniVerso_Presenca_'+eventId.slice(0,8)+'_'+new Date().toISOString().slice(0,10)+'.pdf';
    pdf.save(filename);
  }

  button.addEventListener('click', async () => {
    if(button.disabled)return;
    button.disabled=true;button.textContent='Preparando PDF…';
    try{
      feedback('Consultando a frequência e preparando o arquivo PDF…');
      const data=await loadForPdf();
      await renderPdf(data);
      feedback('PDF de presença preparado. Verifique os downloads do navegador.');
    }catch(e){
      console.error('BoniVerso PDF:',e);
      feedback('Não foi possível gerar o PDF: '+(e?.message||'erro desconhecido')+'. O botão Baixar CSV continua disponível.');
    }finally{button.disabled=false;button.textContent='Baixar PDF';}
  });
})();
