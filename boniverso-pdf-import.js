/* BoniVerso 1.6.1 — Leitura local de provas em PDF e prévia das questões.
 * O PDF é interpretado no navegador do professor. Nenhuma resposta é inferida
 * quando o gabarito não está no documento: deve ser definida pelo professor.
 */
(function (global) {
 'use strict';
 const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
 const PDF_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
 let libPromise;
 function pdfLib(){
   if(!libPromise)libPromise=import(PDFJS).then(mod=>{mod.GlobalWorkerOptions.workerSrc=PDF_WORKER;return mod});
   return libPromise;
 }
 async function extract(file){
   if(!file||file.size>15728640)throw Error('Selecione um PDF de até 15 MB.');
   if(file.size<5||(await file.slice(0,5).text())!=='%PDF-')throw Error('O arquivo selecionado não é um PDF válido.');
   const lib=await pdfLib();
   const task=lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});
   const doc=await task.promise;
   try {
     if(doc.numPages>70)throw Error('Este PDF tem mais de 70 páginas. Divida a prova em arquivos menores.');
     const parts=[];
     for(let page=1;page<=doc.numPages;page++){
       const data=await(await doc.getPage(page)).getTextContent();
       const out=[];let line='',lastY=null;
       for(const it of data.items){
         if(typeof it.str!=='string'||!it.str.trim())continue;
         const y=Number(it.transform?.[5]||0);
         if(lastY!==null&&Math.abs(lastY-y)>3.4){if(line.trim())out.push(line.trim());line='';}
         line+=(line?' ':'')+it.str.trim();lastY=y;
         if(it.hasEOL){if(line.trim())out.push(line.trim());line='';lastY=null;}
       }
       if(line.trim())out.push(line.trim());
       parts.push(out.join('\n'));
     }
     const txt=parts.join('\n');
     if(txt.replace(/\s/g,'').length<25)throw Error('Este PDF não possui texto selecionável suficiente. Se for digitalizado, use OCR ou um PDF gerado a partir de texto.');
     return txt;
   }finally{await doc.destroy()}
 }
 function parse(text){
   if(typeof text!=='string')throw Error('Texto não encontrado.');
   const raw=text.replace(/\r/g,'\n').replace(/\u00a0/g,' ').replace(/[‐‑‒–—]/g,'-').replace(/\t/g,' ').split('\n').map(v=>v.trim().replace(/\s+/g,' ')).filter(Boolean);
   const gabarito=new Map(),content=[];
   let atKey=false;
   for(const line of raw){
     // O gabarito pode estar no fim: "Gabarito", "Respostas corretas" etc.
     const keyLine=line.match(/^(?:gabarito(?:\s+(?:oficial|das\s+questões))?|respostas\s+corretas|chave\s+de\s+respostas|answer\s+key)\s*[:\-]?\s*(.*)$/i);
     if(keyLine){atKey=true;if(keyLine[1])gatherKey(keyLine[1]);continue;}
     if(atKey){gatherKey(line);continue;}
     content.push(line);
   }
   function gatherKey(line){
     const re=/(?:^|[\s,;|])(?:Q(?:UEST(?:ÃO|AO)?)?\s*)?(\d{1,2})\s*(?:[.\):-]|\s)\s*([A-D])(?=\b|[\s,;|])/gi;
     let m;while((m=re.exec(line))!==null){gabarito.set(Number(m[1]),m[2].toUpperCase().charCodeAt(0)-65)}
   }
   const result=[];let item=null,lastOpt=-1;
   function push(){
     if(!item)return;
     if(item.prompt.trim().length>=5&&item.options.length===4&&item.options.every(x=>x.trim())){
       result.push({...item,prompt:item.prompt.trim(),options:item.options.map(v=>v.trim()),correct_index:gabarito.has(item.number)?gabarito.get(item.number):-1,explanation:''});
     }
     item=null;lastOpt=-1;
   }
   for(const line of content){
     const q=line.match(/^(?:QUEST(?:ÃO|AO)\s*)?(\d{1,2})\s*[.)\-:]\s*(.*)$/i)||line.match(/^QUEST(?:ÃO|AO)\s*(\d{1,2})\s+(.*)$/i);
     const alternative=line.match(/^\(?([A-D])\)?\s*[).:\-]\s*(.+)$/i)||line.match(/^\(([A-D])\)\s+(.+)$/i);
     if(q&&!alternative){push();item={number:Number(q[1]),prompt:q[2]||'',options:[]};continue;}
     if(!item)continue;
     if(alternative){
       const idx=alternative[1].toUpperCase().charCodeAt(0)-65;
       if(idx===item.options.length){item.options.push(alternative[2]);lastOpt=idx;continue;}
     }
     if(lastOpt>=0)item.options[lastOpt]+=' '+line;
     else item.prompt+=' '+line;
   }
   push();
   const unique=new Set(result.map(x=>x.number));
   if(unique.size!==result.length)throw Error('Foram identificadas questões com números repetidos. Revise o PDF antes de importar.');
   if(result.length>20)throw Error('Foram identificadas '+result.length+' questões. O limite atual é 20 por avaliação; divida o PDF.');
   return {questions:result,missingKey:result.filter(x=>x.correct_index<0).map(x=>x.number),keyCount:gabarito.size,textLength:text.length};
 }
 global.BoniPDFImport={extract,parse,version:'1.6.1'};
})(window);
