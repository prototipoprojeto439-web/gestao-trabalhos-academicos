(() => {
'use strict';
const APP_NAME = 'Etapa'; // troque aqui o nome da plataforma
const KEY = 'etapa-mvp-v2';
const COLORS = ['#0f8270','#2457a6','#b4610e','#7b3fb3','#c2416b','#3f7f2a','#566b70'];
const STATUS = {todo:'A fazer',doing:'Em andamento',done:'Concluída'};

document.getElementById('brand-name').textContent = APP_NAME;
document.title = APP_NAME + ' — o trabalho do grupo em um só lugar';

/* ---------- utilidades ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const iso = d => { const x = new Date(d); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'); };
const addDays = n => { const d = today(); d.setDate(d.getDate()+n); return iso(d); };
const parse = s => { if(!s) return null; const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const diffDays = s => { const d = parse(s); return d ? Math.round((d - today())/86400000) : null; };
const fmt = s => { const d = parse(s); return d ? d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}) : 'sem prazo'; };
const fmtTime = ts => new Date(ts).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}) + ' ' + new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
const initials = n => (n||'?').split(' ').filter(Boolean).slice(0,2).map(p => p[0].toUpperCase()).join('');
const ago = h => Date.now() - h*3600000;
const relDue = s => { const n = diffDays(s); if(n === null) return 'sem prazo'; if(n === 0) return 'vence hoje'; if(n === 1) return 'vence amanhã'; if(n > 1) return 'em ' + n + ' dias'; return (n === -1 ? 'atrasada 1 dia' : 'atrasada ' + (-n) + ' dias'); };

/* ---------- dados de exemplo ---------- */
function seed(){
  const m = [
    {id:'m1',name:'Vinicius',role:'Redação e revisão',color:COLORS[0],rep:false},
    {id:'m2',name:'Sabrina',role:'Pesquisa bibliográfica',color:COLORS[1],rep:true},
    {id:'m3',name:'Gabriela',role:'Formatação e apresentação',color:COLORS[3],rep:false},
    {id:'m4',name:'Lucas',role:'Tema e problema de pesquisa',color:COLORS[2],rep:false}
  ];
  return {
    me:'m1', current:'p1',
    projects:[{
      id:'p1', title:'Artigo científico em grupo', course:'Disciplina: Metodologia da Pesquisa', due:addDays(12),
      members:m,
      stages:[
        {id:uid(),title:'Definir tema e problema de pesquisa',desc:'Escolher o tema, a pergunta de pesquisa e os objetivos.',owner:'m4',due:addDays(-6),status:'done'},
        {id:uid(),title:'Revisão bibliográfica',desc:'Levantar e resumir as principais referências sobre o tema.',owner:'m2',due:addDays(-2),status:'doing'},
        {id:uid(),title:'Redação do artigo',desc:'Escrever introdução, desenvolvimento e conclusão.',owner:'m1',due:addDays(4),status:'todo'},
        {id:uid(),title:'Formatação e apresentação',desc:'Ajustar às normas e preparar os slides.',owner:'m3',due:addDays(9),status:'todo'}
      ],
      files:[
        {id:uid(),name:'Artigo.docx',versions:[
          {by:'m4',at:ago(120),note:'Estrutura inicial com tema e objetivos'},
          {by:'m1',at:ago(70),note:'Introdução escrita'},
          {by:'m2',at:ago(20),note:'Inclui as primeiras citações da revisão'}]},
        {id:uid(),name:'Orientacoes_do_professor.pdf',versions:[{by:'m4',at:ago(160),note:'Arquivo enviado pelo professor'}]},
        {id:uid(),name:'Referencias.docx',versions:[
          {by:'m2',at:ago(60),note:'12 referências levantadas'},
          {by:'m2',at:ago(26),note:'Remove fontes sem revisão por pares'}]}
      ],
      questions:[
        {id:uid(),by:'m2',at:ago(30),text:'Podemos citar TCCs e dissertações ou só artigos publicados?',prof:true,resolved:false,answers:[{by:'m1',at:ago(28),text:'Não sei, melhor confirmar com o professor.'}]},
        {id:uid(),by:'m3',at:ago(10),text:'A formatação segue a ABNT ou o modelo enviado pelo professor?',prof:false,resolved:false,answers:[]},
        {id:uid(),by:'m4',at:ago(90),text:'Qual o limite de páginas do artigo?',prof:false,resolved:true,answers:[{by:'m2',at:ago(85),text:'Entre 10 e 15 páginas, está nas orientações.'}]}
      ],
      feed:[]
    }]
  };
}

/* ---------- estado ---------- */
let memory = null;
function load(){ try { const s = JSON.parse(localStorage.getItem(KEY)); if(s && s.projects && s.projects.length) return s; } catch(e){} return memory || seed(); }
function save(){ memory = state; try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){} }
let state = load();
let qFilter = 'open';
const P = () => state.projects.find(p => p.id === state.current) || state.projects[0];
const member = id => P().members.find(x => x.id === id) || {name:'—',color:'#9aa',id:''};
const meName = () => member(state.me).name;
const avatar = (id, cls='') => { const x = member(id); return `<span class="avatar ${cls}" style="background:${x.color}" title="${esc(x.name)}">${esc(initials(x.name))}</span>`; };
function log(text){ P().feed.unshift({at:Date.now(), text}); P().feed = P().feed.slice(0,30); }

/* ---------- regras de negócio ---------- */
function stageInfo(p){
  return p.stages.map((s, i) => {
    const late = s.status !== 'done' && s.due && diffDays(s.due) < 0;
    const prevOpen = p.stages.slice(0, i).filter(x => x.status !== 'done');
    const blockedBy = prevOpen.length ? prevOpen[prevOpen.length-1] : null;
    return {...s, i, late, blockedBy};
  });
}
function alertsFor(p){
  const info = stageInfo(p), out = [];
  info.forEach(s => {
    if(s.late){
      const next = info[s.i+1];
      out.push({type:'danger', title:`"${s.title}" está ${relDue(s.due)}`,
        text:`Responsável: ${member(s.owner).name}.` + (next ? ` Isso impacta a próxima etapa, "${next.title}" (${member(next.owner).name}).` : ' É a última etapa do trabalho.'),
        mine: s.owner === state.me || (next && next.owner === state.me)});
    } else if(s.status !== 'done' && s.due && diffDays(s.due) <= 2){
      out.push({type:'warn', title:`"${s.title}" ${relDue(s.due)}`, text:`Responsável: ${member(s.owner).name}.`, mine: s.owner === state.me});
    }
  });
  const profQ = p.questions.filter(q => q.prof && !q.resolved);
  if(profQ.length){
    const rep = p.members.find(m => m.rep);
    out.push({type:'warn', title:`${profQ.length} dúvida(s) aguardando o professor`, text: rep ? `Representante do grupo: ${rep.name}.` : 'Defina um representante na aba Equipe.', mine: rep && rep.id === state.me});
  }
  return out;
}

/* ---------- render ---------- */
function render(){
  const p = P();
  // seletores
  $('#project-select').innerHTML = state.projects.map(x => `<option value="${x.id}" ${x.id===p.id?'selected':''}>${esc(x.title)}</option>`).join('');
  if(!p.members.some(m => m.id === state.me)) state.me = p.members[0] ? p.members[0].id : '';
  $('#me-select').innerHTML = p.members.map(m => `<option value="${m.id}" ${m.id===state.me?'selected':''}>${esc(m.name)}</option>`).join('');
  // topo
  $('#top-course').textContent = p.course || 'Trabalho acadêmico';
  $('#top-title').textContent = p.title;
  $('#top-due').textContent = p.due ? 'Entrega final: ' + parse(p.due).toLocaleDateString('pt-BR') : 'Sem data de entrega';
  $('#top-members').textContent = p.members.length + ' integrante(s)';
  renderOverview(p); renderStages(p); renderFiles(p); renderQuestions(p); renderTeam(p);
}

function renderOverview(p){
  const info = stageInfo(p), done = info.filter(s => s.status==='done').length, total = info.length;
  const doing = info.filter(s => s.status==='doing').length;
  const pct = total ? Math.round((done + doing*0.5) / total * 100) : 0;
  $('#m-progress').textContent = pct + '%';
  $('#m-progress-bar').style.width = pct + '%';
  $('#m-stages').textContent = done + '/' + total;
  const lateN = info.filter(s => s.late).length;
  $('#m-stages-foot').innerHTML = lateN ? `<span style="color:var(--danger);font-weight:700">${lateN} atrasada(s)</span>` : 'Nenhuma etapa atrasada';
  const dd = diffDays(p.due);
  $('#m-days').textContent = dd === null ? '—' : (dd < 0 ? 'Encerrado' : dd + (dd===1?' dia':' dias'));
  $('#m-days-foot').textContent = p.due ? parse(p.due).toLocaleDateString('pt-BR') : 'Defina uma data';
  const open = p.questions.filter(q => !q.resolved);
  $('#m-questions').textContent = open.length;
  $('#m-questions-foot').textContent = open.filter(q => q.prof).length + ' para o professor';

  const al = alertsFor(p);
  const nav = $('#nav-alerts'); nav.hidden = !al.length; nav.textContent = al.length;
  const nq = $('#nav-questions'); nq.hidden = !open.length; nq.textContent = open.length;
  const icon = t => t==='danger' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5h.01"/></svg>' : t==='warn' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17h.01"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.5L16 9.5"/></svg>';
  $('#alerts').innerHTML = al.length ? al.map(a => `<div class="alert ${a.type}">${icon(a.type)}<div><strong>${esc(a.title)}${a.mine?' · envolve você':''}</strong>${esc(a.text)}</div></div>`).join('')
    : `<div class="alert ok">${icon('ok')}<div><strong>Tudo em dia</strong>Nenhuma etapa atrasada ou dúvida pendente com o professor.</div></div>`;

  const up = info.filter(s => s.status !== 'done').slice(0,4);
  $('#upcoming').innerHTML = up.length ? up.map(s => `<div class="row">${avatar(s.owner)}<div class="grow"><div class="title">${esc(s.title)}</div><div class="small muted">${esc(member(s.owner).name)} · ${fmt(s.due)}</div></div>${statusPill(s)}</div>`).join('') : '<div class="empty">Todas as etapas foram concluídas. 🎉</div>';

  const mine = info.filter(s => s.owner === state.me && s.status !== 'done');
  $('#mine').innerHTML = mine.length ? mine.map(s => `<div class="row"><div class="grow"><div class="title">${esc(s.title)}</div><div class="small muted">${fmt(s.due)} · ${relDue(s.due)}</div>${s.blockedBy && s.status==='todo' ? `<div class="small" style="color:var(--warn);margin-top:3px">Aguardando: ${esc(s.blockedBy.title)}</div>`:''}</div>${statusPill(s)}</div>`).join('')
    : `<div class="empty">${esc(meName())} não tem etapas pendentes.</div>`;
}

function statusPill(s){
  if(s.status === 'done') return '<span class="pill done">Concluída</span>';
  if(s.late) return `<span class="pill late">${relDue(s.due)}</span>`;
  if(s.status === 'doing') return '<span class="pill doing">Em andamento</span>';
  if(s.blockedBy) return '<span class="pill wait">Aguardando anterior</span>';
  return '<span class="pill todo">A fazer</span>';
}

function renderStages(p){
  const info = stageInfo(p);
  if(!info.length){ $('#pipeline').innerHTML = '<div class="card empty">Nenhuma etapa ainda. Crie a primeira para organizar o trabalho.</div>'; return; }
  $('#pipeline').innerHTML = info.map((s, idx) => {
    const cls = s.status==='done' ? 'is-done' : s.late ? 'is-late' : s.status==='doing' ? 'is-doing' : '';
    const next = info[idx+1];
    let note = '';
    if(s.late) note = `<div class="stage-note danger">Etapa ${relDue(s.due)}.${next ? ` ${esc(member(next.owner).name)} (${esc(next.title)}) foi avisado(a).` : ''}</div>`;
    else if(s.status==='todo' && s.blockedBy) note = `<div class="stage-note warn">Depende de "${esc(s.blockedBy.title)}" (${esc(member(s.blockedBy.owner).name)})${s.blockedBy.late?', que está atrasada':''}.</div>`;
    const actions = s.status==='todo' ? `<button class="btn small" data-act="stage-status" data-id="${s.id}" data-to="doing" type="button">Iniciar</button>`
      : s.status==='doing' ? `<button class="btn small" data-act="stage-status" data-id="${s.id}" data-to="done" type="button">Concluir etapa</button>`
      : `<button class="btn small ghost" data-act="stage-status" data-id="${s.id}" data-to="doing" type="button">Reabrir</button>`;
    return `<li class="stage ${cls}"><div class="stage-num">${s.status==='done'?'✓':idx+1}</div><div class="stage-card">
      <div class="stage-top"><div><div class="stage-title">${esc(s.title)}</div>${s.desc?`<div class="small muted">${esc(s.desc)}</div>`:''}</div>${statusPill(s)}</div>
      <div class="stage-meta"><span class="who">${avatar(s.owner)}${esc(member(s.owner).name)}</span><span>Prazo: <b style="color:var(--ink)">${fmt(s.due)}</b></span>${s.status!=='done'?`<span>${relDue(s.due)}</span>`:''}</div>
      ${note}
      <div class="stage-actions">${actions}
        <button class="btn small ghost" data-act="stage-edit" data-id="${s.id}" type="button">Editar</button>
        <button class="btn small ghost" data-act="stage-up" data-id="${s.id}" type="button" ${idx===0?'disabled':''} aria-label="Mover para cima">↑</button>
        <button class="btn small ghost" data-act="stage-down" data-id="${s.id}" type="button" ${idx===info.length-1?'disabled':''} aria-label="Mover para baixo">↓</button>
        <button class="btn small danger" data-act="stage-del" data-id="${s.id}" type="button">Excluir</button>
      </div></div></li>`;
  }).join('');
}

function ext(name){ const m = /\.([a-z0-9]+)$/i.exec(name); return m ? m[1].slice(0,4) : 'doc'; }
function renderFiles(p){
  if(!p.files.length){ $('#files').innerHTML = '<div class="card empty">Nenhum arquivo ainda. Adicione o primeiro para começar o histórico.</div>'; return; }
  const sorted = [...p.files].sort((a,b) => b.versions[b.versions.length-1].at - a.versions[a.versions.length-1].at);
  $('#files').innerHTML = sorted.map(f => {
    const last = f.versions[f.versions.length-1], n = f.versions.length;
    return `<div class="file"><div class="file-head"><div class="file-icon">${esc(ext(f.name))}</div>
      <div class="grow" style="flex:1;min-width:0"><div class="title" style="font-weight:750;word-break:break-all">${esc(f.name)}</div>
      <div class="small muted">Última versão por ${esc(member(last.by).name)} · ${fmtTime(last.at)}</div>
      <div class="small" style="margin-top:2px">${esc(last.note)}</div></div>
      <span class="version" title="Versão atual">R${n}</span>
      <button class="btn small secondary" data-act="file-version" data-id="${f.id}" type="button">Enviar nova versão</button></div>
      ${n > 1 ? `<details><summary>Ver histórico (${n} versões)</summary><ul class="history">${f.versions.map((v,i)=>({v,i})).reverse().map(({v,i}) => `<li><span class="v">R${i+1}</span>${avatar(v.by)}<span style="flex:1">${esc(v.note)}</span><span class="muted">${esc(member(v.by).name)} · ${fmtTime(v.at)}</span></li>`).join('')}</ul></details>` : ''}
    </div>`;
  }).join('');
}

function renderQuestions(p){
  document.querySelectorAll('#q-tabs button').forEach(b => b.classList.toggle('active', b.dataset.qf === qFilter));
  const list = p.questions.filter(q => qFilter==='all' ? true : qFilter==='open' ? !q.resolved : qFilter==='prof' ? q.prof && !q.resolved : q.resolved)
    .sort((a,b) => b.at - a.at);
  $('#questions').innerHTML = list.length ? list.map(q => `<div class="q ${q.resolved?'resolved':''}">
    <div class="q-head">${avatar(q.by)}<div style="flex:1;min-width:0"><div class="q-text">${esc(q.text)}</div>
      <div class="small muted">${esc(member(q.by).name)} · ${fmtTime(q.at)} ${q.prof && !q.resolved ? ' · <span class="pill prof">Levar ao professor</span>' : ''} ${q.resolved ? ' · <span class="pill done">Resolvida</span>' : ''}</div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${!q.resolved ? `<button class="btn small ghost" data-act="q-prof" data-id="${q.id}" type="button">${q.prof?'Desmarcar professor':'Marcar p/ professor'}</button>` : ''}
        <button class="btn small ${q.resolved?'ghost':'secondary'}" data-act="q-resolve" data-id="${q.id}" type="button">${q.resolved?'Reabrir':'Marcar resolvida'}</button>
      </div></div>
    ${q.answers.length ? `<div class="answers">${q.answers.map(a => `<div class="answer"><b>${esc(member(a.by).name)}</b> <span class="muted small">${fmtTime(a.at)}</span><div>${esc(a.text)}</div></div>`).join('')}</div>` : ''}
    ${!q.resolved ? `<form class="answer-form" data-answer="${q.id}"><input placeholder="Responder como ${esc(meName())}..." aria-label="Resposta" maxlength="400"><button class="btn small" type="submit">Responder</button></form>` : ''}
  </div>`).join('') : '<div class="card empty">Nenhuma dúvida nesta lista.</div>';
}

function renderTeam(p){
  $('#team').innerHTML = p.members.map(m => {
    const st = p.stages.filter(s => s.owner === m.id);
    const doneN = st.filter(s => s.status==='done').length;
    const vers = p.files.reduce((n,f) => n + f.versions.filter(v => v.by === m.id).length, 0);
    const ans = p.questions.reduce((n,q) => n + q.answers.filter(a => a.by === m.id).length, 0);
    return `<div class="card member"><div class="member-top">${avatar(m.id,'lg')}<div style="flex:1;min-width:0"><div style="font-weight:800">${esc(m.name)}${m.id===state.me?' <span class="muted small">(você)</span>':''}</div><div class="small muted">${esc(m.role||'Sem função definida')}</div></div></div>
      ${m.rep ? '<span class="pill prof" style="align-self:flex-start">Representante com o professor</span>' : ''}
      <div class="stats"><div class="stat"><b>${doneN}/${st.length}</b>etapas</div><div class="stat"><b>${vers}</b>versões enviadas</div><div class="stat"><b>${ans}</b>respostas</div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${!m.rep ? `<button class="btn small ghost" data-act="m-rep" data-id="${m.id}" type="button">Tornar representante</button>` : ''}
        <button class="btn small danger" data-act="m-del" data-id="${m.id}" type="button">Remover</button>
      </div></div>`;
  }).join('') || '<div class="card empty">Adicione os integrantes do grupo.</div>';
}

/* ---------- diálogos ---------- */
const dlg = $('#dlg'), dlgForm = $('#dlg-form');
let onSubmit = null;
function openDialog(title, sub, fields, submitLabel, handler){
  dlgForm.innerHTML = `<h3>${esc(title)}</h3>${sub?`<p class="sub">${esc(sub)}</p>`:''}${fields}<div class="dlg-actions"><button class="btn ghost" value="cancel" type="button" data-close>Cancelar</button><button class="btn" type="submit">${esc(submitLabel)}</button></div>`;
  onSubmit = handler;
  dlg.showModal();
  const first = dlgForm.querySelector('input,select,textarea'); if(first) first.focus();
}
dlgForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(dlgForm).entries());
  dlgForm.querySelectorAll('input[type=checkbox]').forEach(c => data[c.name] = c.checked);
  const fileInput = dlgForm.querySelector('input[type=file]');
  if(fileInput && fileInput.files[0]) data.fileName = fileInput.files[0].name;
  if(onSubmit && onSubmit(data) !== false){ dlg.close(); save(); render(); }
});
dlgForm.addEventListener('click', e => { if(e.target.closest('[data-close]')) dlg.close(); });
const memberOptions = sel => P().members.map(m => `<option value="${m.id}" ${m.id===sel?'selected':''}>${esc(m.name)}</option>`).join('');

function stageDialog(stage){
  openDialog(stage ? 'Editar etapa' : 'Nova etapa', 'As etapas seguem a ordem da lista. Quem vem depois é avisado se uma atrasar.',
    `<div class="field"><label>Nome da etapa</label><input name="title" required maxlength="80" value="${esc(stage?stage.title:'')}" placeholder="Ex.: Revisão do relatório"></div>
     <div class="field"><label>Descrição (opcional)</label><textarea name="desc" maxlength="300" placeholder="O que precisa ser entregue nesta etapa?">${esc(stage?stage.desc:'')}</textarea></div>
     <div class="field"><label>Responsável</label><select name="owner">${memberOptions(stage?stage.owner:state.me)}</select></div>
     <div class="field"><label>Prazo</label><input type="date" name="due" value="${stage?stage.due:''}" required></div>`,
    stage ? 'Salvar' : 'Criar etapa', d => {
      if(!d.title.trim()) return false;
      if(stage){ Object.assign(stage, {title:d.title.trim(), desc:d.desc.trim(), owner:d.owner, due:d.due}); log(`${meName()} editou a etapa "${stage.title}"`); toast('Etapa atualizada.'); }
      else { P().stages.push({id:uid(), title:d.title.trim(), desc:d.desc.trim(), owner:d.owner, due:d.due, status:'todo'}); log(`${meName()} criou a etapa "${d.title.trim()}"`); toast('Etapa criada.'); }
    });
}

/* ---------- ações ---------- */
document.addEventListener('click', e => {
  const nav = e.target.closest('[data-view]'); if(nav) return show(nav.dataset.view);
  const go = e.target.closest('[data-goto]'); if(go) return show(go.dataset.goto);
  const qf = e.target.closest('[data-qf]'); if(qf){ qFilter = qf.dataset.qf; return renderQuestions(P()); }
  const a = e.target.closest('[data-act]'); if(!a) return;
  const p = P(), id = a.dataset.id, act = a.dataset.act;
  const stage = p.stages.find(s => s.id === id);
  if(act === 'stage-status'){ stage.status = a.dataset.to; log(`${meName()} ${a.dataset.to==='done'?'concluiu':a.dataset.to==='doing'?'iniciou':'reabriu'} "${stage.title}"`);
    if(a.dataset.to === 'done'){ const i = p.stages.indexOf(stage), next = p.stages[i+1]; toast(next ? `Etapa concluída! ${member(next.owner).name} já pode seguir com "${next.title}".` : 'Última etapa concluída. Trabalho pronto para entrega!'); } }
  if(act === 'stage-edit') return stageDialog(stage);
  if(act === 'stage-up' || act === 'stage-down'){ const i = p.stages.indexOf(stage), j = act==='stage-up' ? i-1 : i+1; if(j < 0 || j >= p.stages.length) return; [p.stages[i], p.stages[j]] = [p.stages[j], p.stages[i]]; }
  if(act === 'stage-del'){ if(!confirmInline(a)) return; p.stages = p.stages.filter(s => s.id !== id); log(`${meName()} excluiu a etapa "${stage.title}"`); }
  if(act === 'file-version'){ const f = p.files.find(x => x.id === id);
    return openDialog('Nova versão de ' + f.name, `Vai virar a R${f.versions.length+1}. Descreva o que mudou para o grupo acompanhar.`,
      `<div class="field"><label>Arquivo (opcional no protótipo)</label><input type="file" name="file"><div class="hint">No protótipo, só o nome é registrado. O arquivo não é enviado a nenhum servidor.</div></div>
       <div class="field"><label>O que mudou?</label><input name="note" required maxlength="140" placeholder="Ex.: corrige preços do item 3"></div>`,
      'Registrar versão', d => { if(!d.note.trim()) return false; f.versions.push({by:state.me, at:Date.now(), note:d.note.trim()}); log(`${meName()} enviou ${f.name} R${f.versions.length}`); toast(`${f.name} agora está na R${f.versions.length}.`); }); }
  if(act === 'q-resolve'){ const q = p.questions.find(x => x.id === id); q.resolved = !q.resolved; if(q.resolved) q.prof = false; log(`${meName()} ${q.resolved?'marcou como resolvida':'reabriu'} uma dúvida`); }
  if(act === 'q-prof'){ const q = p.questions.find(x => x.id === id); q.prof = !q.prof; const rep = p.members.find(m => m.rep); if(q.prof) toast(rep ? `${rep.name} vai levar a dúvida ao professor.` : 'Defina um representante na aba Equipe.'); }
  if(act === 'm-rep'){ p.members.forEach(m => m.rep = m.id === id); log(`${member(id).name} agora é o(a) representante com o professor`); toast(`${member(id).name} é o(a) representante com o professor.`); }
  if(act === 'm-del'){ if(p.members.length === 1) return toast('O trabalho precisa de pelo menos um integrante.'); if(!confirmInline(a)) return; const name = member(id).name; p.members = p.members.filter(m => m.id !== id); p.stages.forEach(s => { if(s.owner === id) s.owner = p.members[0].id; }); log(`${name} foi removido(a) do grupo`); }
  save(); render();
});
function confirmInline(btn){ if(btn.dataset.armed){ return true; } btn.dataset.armed = '1'; const t = btn.textContent; btn.textContent = 'Confirmar?'; setTimeout(() => { if(btn.isConnected){ delete btn.dataset.armed; btn.textContent = t; } }, 2500); return false; }

document.addEventListener('submit', e => {
  const f = e.target.closest('[data-answer]'); if(!f) return; e.preventDefault();
  const input = f.querySelector('input'), text = input.value.trim(); if(!text) return;
  const q = P().questions.find(x => x.id === f.dataset.answer);
  q.answers.push({by:state.me, at:Date.now(), text}); log(`${meName()} respondeu uma dúvida`); save(); render(); toast('Resposta registrada para todo o grupo.');
});

$('#btn-new-stage').addEventListener('click', () => stageDialog(null));
$('#btn-new-file').addEventListener('click', () => openDialog('Novo arquivo', 'O arquivo entra como R1. Cada novo envio cria uma versão no histórico.',
  `<div class="field"><label>Escolher arquivo</label><input type="file" name="file"><div class="hint">No protótipo, só o nome é registrado. O arquivo não sai do seu computador.</div></div>
   <div class="field"><label>Ou digite o nome</label><input name="name" maxlength="80" placeholder="Ex.: Relatorio_final.docx"></div>
   <div class="field"><label>Descrição</label><input name="note" maxlength="140" placeholder="Ex.: primeira versão do relatório"></div>`,
  'Adicionar', d => { const name = (d.fileName || d.name || '').trim(); if(!name){ toast('Escolha um arquivo ou digite um nome.'); return false; }
    P().files.push({id:uid(), name, versions:[{by:state.me, at:Date.now(), note:(d.note||'').trim() || 'Primeira versão'}]}); log(`${meName()} adicionou ${name} (R1)`); toast(`${name} adicionado como R1.`); }));
$('#btn-new-question').addEventListener('click', () => openDialog('Nova dúvida', 'Fica registrada para todo o grupo. Marque se precisar do professor.',
  `<div class="field"><label>Sua dúvida</label><textarea name="text" required maxlength="400" placeholder="Ex.: o relatório deve seguir a ABNT?"></textarea></div>
   <label class="check"><input type="checkbox" name="prof"> Precisa ser levada ao professor</label>`,
  'Publicar', d => { if(!d.text.trim()) return false; P().questions.push({id:uid(), by:state.me, at:Date.now(), text:d.text.trim(), prof:!!d.prof, resolved:false, answers:[]}); qFilter = d.prof ? 'prof' : 'open'; log(`${meName()} publicou uma dúvida`); toast('Dúvida publicada para o grupo.'); }));
$('#btn-new-member').addEventListener('click', () => openDialog('Adicionar integrante', '',
  `<div class="field"><label>Nome</label><input name="name" required maxlength="40"></div>
   <div class="field"><label>Função no trabalho (opcional)</label><input name="role" maxlength="60" placeholder="Ex.: revisão e formatação"></div>`,
  'Adicionar', d => { const name = d.name.trim(); if(!name) return false; const p = P(); if(p.members.some(m => m.name.toLowerCase() === name.toLowerCase())){ toast('Esse nome já está no grupo.'); return false; }
    p.members.push({id:uid(), name, role:d.role.trim(), color:COLORS[p.members.length % COLORS.length], rep:false}); log(`${name} entrou no grupo`); toast(`${name} adicionado(a).`); }));
$('#btn-new-project').addEventListener('click', () => openDialog('Novo trabalho', 'Cada trabalho tem seu próprio espaço com etapas, arquivos e dúvidas.',
  `<div class="field"><label>Título do trabalho</label><input name="title" required maxlength="80" placeholder="Ex.: Seminário sobre ética profissional"></div>
   <div class="field"><label>Disciplina</label><input name="course" maxlength="80" placeholder="Ex.: Metodologia da Pesquisa"></div>
   <div class="field"><label>Data de entrega</label><input type="date" name="due"></div>
   <div class="field"><label>Integrantes</label><input name="members" maxlength="200" placeholder="Separe os nomes por vírgula"><div class="hint">Você pode adicionar mais depois, na aba Equipe.</div></div>`,
  'Criar trabalho', d => { if(!d.title.trim()) return false;
    const names = (d.members||'').split(',').map(s => s.trim()).filter(Boolean); if(!names.length) names.push('Eu');
    const members = [...new Set(names)].map((n,i) => ({id:uid(), name:n, role:'', color:COLORS[i % COLORS.length], rep:i===0}));
    const p = {id:uid(), title:d.title.trim(), course:d.course.trim() ? 'Disciplina: ' + d.course.trim() : '', due:d.due, members, stages:[], files:[], questions:[], feed:[{at:Date.now(), text:'Trabalho criado'}]};
    state.projects.push(p); state.current = p.id; state.me = members[0].id; show('etapas'); toast('Trabalho criado. Comece cadastrando as etapas.'); }));
$('#btn-reset').addEventListener('click', e => { if(!confirmInline(e.target)) return; state = seed(); save(); render(); show('inicio'); toast('Exemplo restaurado.'); });
$('#project-select').addEventListener('change', e => { state.current = e.target.value; state.me = P().members[0] ? P().members[0].id : ''; save(); render(); });
$('#me-select').addEventListener('change', e => { state.me = e.target.value; save(); render(); toast('Agora você está vendo como ' + meName() + '.'); });

function show(view){
  document.querySelectorAll('.nav [data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  if(location.hash.slice(1) !== view) history.replaceState(null, '', '#' + view);
  window.scrollTo({top:0, behavior:'smooth'});
}
let toastTimer;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3000); }

render();
const h = location.hash.slice(1); if(['inicio','etapas','arquivos','duvidas','equipe'].includes(h)) show(h);
})();
