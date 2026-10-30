const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
let src=fs.readFileSync(__dirname+'/../app.js','utf8');
src=src.replace(/\s*render\(\);\s*\}\)\(\);\s*$/, '\n window.__test={getState:()=>state,nav,openQuiz,quizFinish,render}; render();\n})();');
class E{constructor(){this.innerHTML='';this.textContent='';this.style={};this.dataset={};this.open=false;this.classList={add(){},remove(){},toggle(){}};this.value=''} addEventListener(){} showModal(){this.open=true} close(){this.open=false} focus(){} setSelectionRange(){} append(){} remove(){} }
const el=new Map(), events={};const doc={querySelectorAll:()=>[],querySelector:s=>{if(!el.has(s))el.set(s,new E());return el.get(s)},addEventListener(k,fn){events[k]=fn},createElement:()=>new E(),body:new E()};
const store=new Map();const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
class MockFormData{constructor(form){this.fields=form.fields||{}}[Symbol.iterator](){return Object.entries(this.fields)[Symbol.iterator]();}}
const window={addEventListener(){},scrollTo(){}};
const c=vm.createContext({document:doc,localStorage,window,location:{protocol:'file:',hostname:''},navigator:{},FormData:MockFormData,Date,Math,JSON,URL,Blob,console,crypto:{randomUUID:()=>'test-'+Math.random()},setTimeout(){},confirm:()=>true});
vm.runInContext(src,c);
const app=window.__test;
async function submit(id,fields,dataset={}){await events.submit({target:{id,fields,dataset,querySelector(){return{files:[]}}},preventDefault(){}})}
async function main(){
 assert.ok(el.get('#view').innerHTML.includes('Conhecimento')||el.get('#view').innerHTML.includes('Aprenda'));
 assert.equal(app.getState().role,'student');
 app.nav('courses');assert.ok(el.get('#view').innerHTML.includes('Português sem complicação'));
 app.nav('planner');assert.ok(el.get('#view').innerHTML.includes('plano de estudos'));
 await submit('taskForm',{title:'Revisar substantivos',due:'2026-11-03',category:'Português'});assert.ok(app.getState().tasks.some(x=>x.title==='Revisar substantivos'));
 app.nav('quizzes');assert.ok(el.get('#view').innerHTML.includes('questões'));
 app.nav('plans');assert.ok(el.get('#view').innerHTML.includes('BONIVERSO PRIME'));
 app.nav('profile');assert.ok(el.get('#view').innerHTML.includes('perfil'));
 const state=app.getState();state.role='teacher';app.nav('admin');assert.ok(el.get('#view').innerHTML.includes('professor')||el.get('#view').innerHTML.includes('Rafael'));
 assert.ok(store.size>0,'salvamento local');
 console.log('PASSOU: inicialização, aluno, cursos, planejamento, tarefa, quiz, planos, perfil, professor, persistência.');
}
main().catch(e=>{console.error(e);process.exit(1)});
