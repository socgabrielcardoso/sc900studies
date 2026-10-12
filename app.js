import {BANK,BY_ID,DAYS,DOMAIN,MENTORS,SHOP,MILESTONES,OFFICIAL_GUIDE} from './content.js';

const KEY='sc900-academy-v1';
const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const dateLocal=(d=new Date())=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
const daysBetween=(a,b)=>Math.round((Date.parse(b+'T12:00:00')-Date.parse(a+'T12:00:00'))/86400000);
const yesterday=()=>{let d=new Date();d.setDate(d.getDate()-1);return dateLocal(d)};
const schedule=[1,3,7,14,30];
const fresh=()=>({version:1,name:'Chefe',startDate:dateLocal(),streak:0,lastStudy:'',coins:0,xp:0,hearts:5,heartsDay:dateLocal(),freezes:0,completed:[],topics:{},notes:{},inventory:[],quote:false,marathon:false,sound:false,history:[],lastBossScore:0});
function load(){
  try{
    const data=JSON.parse(localStorage.getItem(KEY)||'null');
    if(data&&data.version===1&&Array.isArray(data.completed)&&typeof data.topics==='object'&&data.topics!==null){
      return Object.assign(fresh(),data);
    }
  }catch(e){}
  return fresh();
}
let state=load(),view='home',selectedDay=1,session=null,ticker=null,saving=false;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){notify('O navegador não conseguiu salvar o progresso.',true)}};
function todaySetup(){
  const today=dateLocal();
  if(state.heartsDay!==today){state.hearts=5;state.heartsDay=today}
  if(state.lastStudy&&state.lastStudy!==today){
    let gap=Math.max(0,daysBetween(state.lastStudy,today)-1);
    if(gap>0){
      if(state.freezes>=gap){state.freezes-=gap;state.streak=Math.max(1,state.streak);state.lastStudy=yesterday()}
      else{state.streak=0}
    }
  }
  save();
}
todaySetup();
function studyToday(){
  let today=dateLocal();
  if(state.lastStudy===today)return;
  const delta=state.lastStudy?daysBetween(state.lastStudy,today):999;
  state.streak=delta===1?state.streak+1:1;
  state.lastStudy=today;
  save();
}
function currentDay(){for(let d=1;d<=30;d++){if(![1,2,3].every(p=>state.completed.includes(d+'-'+p)))return d}return 30}
function unlockedByDate(d){return state.marathon||d<=Math.max(1,daysBetween(state.startDate,dateLocal())+1)}
function unlockPhase(d,p){if(!unlockedByDate(d))return false; if(p===1)return d===1||state.completed.includes((d-1)+'-3');return state.completed.includes(d+'-'+(p-1))}
function level(){return Math.floor(state.xp/200)+1}
function accuracy(){const r=state.history.filter(x=>x.correct).length;return state.history.length?Math.round(r/state.history.length*100):0}
function domainScore(k){const records=BANK.filter(x=>x.domain===k).map(x=>state.topics[x.id]||{right:0,wrong:0});const a=records.reduce((n,x)=>n+x.right,0),b=records.reduce((n,x)=>n+x.wrong,0);return a+b?Math.round(a/(a+b)*100):0}
function readiness(){return Math.round(Object.entries(DOMAIN).reduce((n,[k,d])=>n+domainScore(k)*d.weight/100,0))}
function weakCards(){return BANK.filter(x=>state.topics[x.id]&&state.topics[x.id].wrong>0).sort((a,b)=>(state.topics[b.id].wrong/(state.topics[b.id].right+1))-(state.topics[a.id].wrong/(state.topics[a.id].right+1)))}
function dueCards(){return weakCards().filter(x=>(state.topics[x.id].due||'9999')<=dateLocal())}
function mentorName(day){return DAYS[day-1]?.mentor||'Camila'}
function face(name){const item=MENTORS[name]||MENTORS.Camila;const skin=name==='Guilherme'?'skin_g':name==='Camila'?'skin_c':'skin_b';const alt=name==='Guilherme'?'🥷':name==='Camila'?'🦸🏻‍♀️':'🤵';return state.inventory.includes(skin)?alt:item.emoji}
function notify(msg,error=false){const el=document.createElement('div');el.className='toast'+(error?' error':'');el.textContent=msg;$('#toast-layer').append(el);setTimeout(()=>el.remove(),3300)}
function playSound(good=true){if(!state.sound)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ctx=new C();const notes=good?[520,660,800]:[240,180];notes.forEach((freq,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=good?'sine':'triangle';o.frequency.value=freq;g.gain.setValueAtTime(.0001,ctx.currentTime+i*.09);g.gain.exponentialRampToValueAtTime(.085,ctx.currentTime+i*.09+.012);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+i*.09+.18);o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime+i*.09);o.stop(ctx.currentTime+i*.09+.21)});setTimeout(()=>ctx.close(),800)}catch(e){}}
function confetti(count=50){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const colors=['#64f5ce','#ffc06e','#8b91ff','#ff7dc2','#79d5ff'];for(let i=0;i<count;i++){const node=document.createElement('i');node.className='confetti';node.style.left=(Math.random()*100)+'%';node.style.background=colors[i%colors.length];node.style.animationDuration=(1.4+Math.random()*1.8)+'s';node.style.animationDelay=(Math.random()*.5)+'s';node.style.setProperty('--drift',(Math.random()*330-165)+'px');$('#confetti-layer').append(node);setTimeout(()=>node.remove(),3800)}}
function topStats(){
  $('#top-streak').textContent=state.streak;
  $('#top-coins').textContent=state.coins;
  $('#top-hearts').textContent=state.hearts;
  $('#sound-toggle').textContent=state.sound?'🔊':'🔇';
  $$('.nav-link,.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
}
function progressBar(percent){return '<div class="mini-progress"><div style="width:'+Math.max(0,Math.min(100,percent))+'%"></div></div>'}
function domainsMarkup(){return Object.entries(DOMAIN).map(([k,d])=>'<article class="domain-card"><div class="domain-top"><span class="domain-icon">'+d.icon+'</span><span class="domain-percent">'+domainScore(k)+'%</span></div><div class="domain-name">'+esc(d.short)+'</div>'+progressBar(domainScore(k))+'<small>Peso no edital: '+d.weight+'% (referência)</small></article>').join('')}
function source(){return '<div class="source-line">Treinamento independente, perguntas autorais. Edital oficial Microsoft: <a href="'+OFFICIAL_GUIDE+'" target="_blank" rel="noopener noreferrer">guia SC-900 ↗</a>. Atualização anunciada para 21/10/2026. Percentuais são faixas; os pesos exibidos servem apenas para orientar o estudo. Nota interna ≠ nota oficial (700 pontos escalonados).</div>'}
function pageIntro(eyebrow,title,desc){return '<div class="page-intro"><div><div class="eyebrow">'+eyebrow+'</div><h1>'+title+'</h1><p>'+desc+'</p></div></div>'}
function renderHome(){
  const cd=currentDay(),day=DAYS[cd-1],done=state.completed.length,sec=state.streak;
  return '<section class="hero"><div><div class="eyebrow">✦ SEU CENTRO DE OPERAÇÕES ESTÁ ONLINE</div><h1>Bom turno,<br><span class="highlight">'+esc(state.name)+'!</span> 🛡️</h1><p>A empresa está sob ataque. Sua missão? Resolver incidentes, aprender os recursos Microsoft e salvar a nuvem em pequenas doses.</p><button class="btn" data-act="open-day" data-day="'+cd+'">Continuar missão <span>↗</span></button></div><div class="hero-avatar" role="img" aria-label="Avatar de guardião">🧑‍🚀</div></section>'+
  '<div class="summary-grid"><div class="summary-card"><div class="card-icon">⚡</div><div class="label">XP acumulado</div><strong>'+state.xp+' <span>XP</span></strong></div><div class="summary-card"><div class="card-icon">🎯</div><div class="label">Missões concluídas</div><strong>'+done+' <span>/ 90</span></strong></div><div class="summary-card"><div class="card-icon">📈</div><div class="label">Precisão geral</div><strong>'+accuracy()+'<span>%</span></strong></div></div>'+
  '<div class="section-header"><h2>🚀 Sua próxima missão</h2><button class="text-link" data-view="journey">Ver mapa completo →</button></div>'+
  '<div class="mission-card"><div class="mission-emoji">'+day.emoji+'</div><div class="mission-text"><span class="pill">'+(day.boss?'CHEFÃO':'DIA '+pad(cd))+'</span><div><strong>'+esc(day.title)+'</strong></div><p>'+day.topics.map(x=>BY_ID[x]?.name||'').join(' • ')+'</p></div><button class="btn small mission-cta" data-act="open-day" data-day="'+cd+'">Entrar na missão →</button></div>'+
  '<div class="section-header"><h2>📊 Seu domínio da certificação</h2><button class="text-link" data-view="stats">Ver desempenho →</button></div><div class="domain-grid">'+domainsMarkup()+'</div>'+
  '<div class="level-banner"><div><strong>🛡️ Nível '+level()+' · '+(level()<5?'Cadete':level()<12?'Analista SOC':'Guardião da nuvem')+'</strong><p>'+(state.xp%200)+' / 200 XP até o próximo nível</p></div><div style="width:34%">'+progressBar((state.xp%200)/2)+'</div></div>'+source();
}
function pathCards(){
  return DAYS.map(d=>{
    const count=[1,2,3].filter(p=>state.completed.includes(d.day+'-'+p)).length;
    const status=count===3?'done':unlockPhase(d.day,count+1)?'current':'locked';
    return '<div class="day-node"><button type="button" class="node-core '+status+(d.boss?' boss':'')+'" data-act="open-day" data-day="'+d.day+'" aria-label="Dia '+d.day+' '+esc(d.title)+' '+(status==='locked'?'bloqueado':'disponível')+'"><span class="node-icon">'+(status==='locked'?'🔒':d.emoji)+'</span><span class="node-label">Dia '+pad(d.day)+' · '+esc(d.title)+'</span><span class="node-sub">'+(d.boss?'CHEFÃO · ':d.tier+' · ')+count+'/3 fases</span><span class="phase-dots">'+[1,2,3].map(p=>'<i class="'+(state.completed.includes(d.day+'-'+p)?'filled':'')+'"></i>').join('')+'</span></button></div>';
  }).join('')
}
function renderJourney(){return pageIntro('O MAPA DA SUA EVOLUÇÃO','Sua jornada de 30 dias 🗺️','90 fases em uma trilha. Conclua os três desafios de cada dia para avançar.')+
 '<section class="path-section"><div class="path-intro"><div><h2>Trilha dos Guardiões</h2><p>Da primeira ameaça ao domínio da nuvem.</p></div><span class="pill">'+state.completed.length+'/90</span></div>'+progressBar(state.completed.length/90*100)+'<div class="path-grid">'+pathCards()+'</div></section>'+source()}
function phaseCard(d,p){
  const titles=['Reconhecimento','Implementação','Resposta rápida'],icons=['🧩','🛠️','⚡'],details=['Aprenda nomes e conecte conceitos.','Corrija incidentes em cenários reais.','Decida sob pressão contra o relógio.'];
  const done=state.completed.includes(d+'-'+p),open=unlockPhase(d,p);
  return '<button class="phase-card '+(done?'done':'')+'" data-act="start-phase" data-day="'+d+'" data-phase="'+p+'" '+(!open?'disabled':'')+'><span class="phase-icon">'+(done?'✅':open?icons[p-1]:'🔒')+'</span><strong>Fase '+p+' · '+titles[p-1]+'</strong><small>'+details[p-1]+'</small><span class="status">'+(done?'CONCLUÍDA':open?'JOGAR AGORA →':'BLOQUEADA')+'</span></button>';
}
function renderDay(d){
 const day=DAYS[d-1]; if(!day)return renderJourney();
 const name=day.mentor,man=MENTORS[name];
 const coming=!unlockedByDate(d);
 return '<div class="breadcrumb"><button data-view="journey">← Jornada</button> / Dia '+pad(d)+'</div>'+
 '<section class="day-header"><div class="big-emoji">'+day.emoji+'</div><div><div class="eyebrow">'+(day.boss?'ENCONTRO COM O CHEFÃO':'MISSÃO '+pad(d)+' · '+day.tier.toUpperCase())+'</div><h1>'+esc(day.title)+'</h1><p>Três fases. Uma empresa para proteger. '+(coming?'Volte no dia correspondente ou habilite Maratona livre.':'Você decide a resposta.')+'</p></div></section>'+
 '<div class="story-bubble"><div class="story-avatar">'+face(name)+'</div><div><strong>'+name+' · '+man.role+'</strong><p>'+man.tone+' '+(day.boss?'O conselho quer uma auditoria completa.':BY_ID[day.topics[0]].incident)+'</p></div></div>'+
 '<div class="section-header"><h2>🎮 Escolha sua fase</h2><span class="pill">'+[1,2,3].filter(p=>state.completed.includes(d+'-'+p)).length+'/3 concluídas</span></div><div class="daily-layout">'+[1,2,3].map(p=>phaseCard(d,p)).join('')+'</div>'+
 '<div class="section-header" style="margin-top:26px"><h2>🧠 Palavras-chave</h2></div><div class="word-cloud">'+day.topics.map(id=>'<span class="term-badge">'+esc(BY_ID[id].name)+'</span>').join('')+'</div>'+
 (coming?'<div class="notice">🔒 A jornada acompanha o calendário. Ative <strong>Maratona livre</strong> em Meu progresso caso queira estudar adiantado.</div>':'')+source();
}
function renderRight(){
 const active=dueCards(),m=MENTORS.Camila;
 return '<div class="right-box"><div class="eyebrow">STATUS DA SUA OFENSIVA</div><div class="right-streak">🔥<strong>'+state.streak+' dias</strong><p>'+(!state.lastStudy?'Comece uma fase para acender sua chama.':state.lastStudy===dateLocal()?'Missão do dia registrada!':'Estude hoje para manter sua chama.')+'</p></div><div class="small-divider"></div><div class="micro-label">🧊 Bloqueios disponíveis: '+state.freezes+'</div>'+progressBar(Math.min(100,state.streak/7*100))+'</div>'+
 '<div class="right-box"><h3>👥 Sua equipe SOC</h3>'+Object.entries(MENTORS).map(([name,mn])=>'<div class="mentor-inline"><span class="mentor-face">'+face(name)+'</span><div><strong>'+name+'</strong><small>'+mn.role+'</small></div></div>').join('')+'</div>'+
 '<div class="right-box"><h3>🎯 Treino inteligente</h3><p>'+(active.length?'Há '+active.length+' conceito(s) que precisam de revisão hoje.':'Os erros serão agendados para revisão nos próximos dias.')+'</p><div class="daily-task"><span class="micro-label">SEU FOCO</span><div><strong>'+esc(active[0]?.name||'Fixar cada conceito')+'</strong></div>'+progressBar(readiness())+'</div><button class="btn small block secondary" data-view="lab" style="margin-top:14px">Revisar agora →</button></div>';
}
function renderLab(){
 const due=dueCards(),weak=weakCards(),all=state.history.length;
 return pageIntro('LABORATÓRIO DO SOC','Treino inteligente ⚡','Desafios curtos que adaptam a revisão aos conceitos com maior dificuldade.')+
 '<div class="rank-banner"><div class="rank-icon">🧠</div><div><h2>'+due.length+' revisões prontas</h2><p>Quando você erra, o mesmo conceito volta em um novo cenário após 1, 3, 7 ou 14 dias.</p></div></div>'+
 '<div class="daily-layout"><button class="phase-card" data-act="start-quick" data-mode="due"><span class="phase-icon">🔁</span><strong>Minha revisão</strong><small>'+(due.length?due.length+' cartões vencidos':'Revisão dos conceitos mais recentes')+'</small><span class="status">INICIAR →</span></button><button class="phase-card" data-act="start-quick" data-mode="weak"><span class="phase-icon">🎯</span><strong>Caça aos erros</strong><small>'+weak.length+' conceitos para fortalecer</small><span class="status">INICIAR →</span></button><button class="phase-card" data-act="start-quick" data-mode="random"><span class="phase-icon">🎲</span><strong>Simulado surpresa</strong><small>10 questões de todos os pilares</small><span class="status">INICIAR →</span></button></div>'+
 '<div class="section-header" style="margin-top:30px"><h2>🩺 Diagnóstico</h2></div><div class="domain-grid">'+domainsMarkup()+'</div>'+
 (weak.length?'<div class="section-header"><h2>🔍 Seus pontos fracos</h2></div><div class="list-tiles">'+weak.slice(0,6).map(x=>'<div class="tile"><div class="eyebrow">'+DOMAIN[x.domain].icon+' '+DOMAIN[x.domain].short+'</div><h3>'+esc(x.name)+'</h3><p>'+esc(x.tip)+'</p></div>').join('')+'</div>':'<div class="empty-state">✨ Resolva seus primeiros desafios para receber revisões personalizadas.</div>')+source();
}
function renderNotes(){
 const weak=weakCards(),entries=Object.entries(state.notes||{}).filter(([,v])=>v?.trim());
 return pageIntro('MEMÓRIA OPERACIONAL','Seu caderno de bordo 📓','Anote com suas palavras. As notas e os erros ficam apenas neste navegador.')+
 '<div class="note-card"><label class="label-block" for="note-topic">Nova anotação por assunto</label><select class="name-input" id="note-topic" aria-label="Conceito para anotar">'+BANK.map(c=>'<option value="'+c.id+'">'+DOMAIN[c.domain].icon+' '+esc(c.name)+'</option>').join('')+'</select><label class="label-block" for="note-editor" style="margin-top:15px">O que você aprendeu?</label><textarea id="note-editor" class="note-input" maxlength="2000" placeholder="Ex.: Sentinel é SIEM/SOAR; Defender XDR cruza alertas de várias soluções."></textarea><button class="btn small" data-act="save-note">💾 Salvar anotação</button></div>'+
 '<div class="section-header" style="margin-top:27px"><h2>📝 Anotações salvas</h2><span class="pill">'+entries.length+'</span></div>'+
 (entries.length?'<div class="notes-layout">'+entries.map(([id,v])=>'<div class="note-card"><div class="eyebrow">'+esc(BY_ID[id]?.name||id)+'</div><p style="white-space:pre-wrap;color:#d8e7fa;margin:10px 0">'+esc(v)+'</p><button class="btn small ghost" data-act="edit-note" data-topic="'+esc(id)+'">Editar</button> <button class="btn small ghost" data-act="remove-note" data-topic="'+esc(id)+'">Excluir</button></div>').join('')+'</div>':'<div class="empty-state"><div class="empty-icon">📓</div>Seu primeiro insight aparecerá aqui.</div>')+
 '<div class="section-header" style="margin-top:27px"><h2>🧯 Histórico de dificuldades</h2></div>'+
 (weak.length?'<div class="list-tiles">'+weak.slice(0,12).map(c=>'<div class="tile"><h3>'+esc(c.name)+'</h3><p>'+esc(c.tip)+'</p><small class="muted">Erros: '+state.topics[c.id].wrong+' · Próxima revisão: '+esc(state.topics[c.id].due||'—')+'</small></div>').join('')+'</div>':'<p>Os assuntos em que você errar aparecerão automaticamente aqui.</p>')+source();
}
function renderShop(){
 return pageIntro('ARSENAL DE RECOMPENSAS','Loja de SecCoins 🛍️','Compre cosméticos e itens com moedas obtidas no estudo. Nenhuma compra real.')+
 '<div class="level-banner"><div><strong>🪙 Seu saldo: '+state.coins+' SecCoins</strong><p>Fases concluídas rendem moedas. Acertos rendem XP.</p></div><span class="pill orange">LOJA VIRTUAL</span></div><div class="shop-grid">'+SHOP.map(item=>{
  let owned=state.inventory.includes(item.id)||(item.id==='quote'&&state.quote);
  return '<article class="shop-card"><div class="shop-visual">'+item.emoji+'</div><h3>'+esc(item.name)+'</h3><p>'+esc(item.description)+'</p><div class="shop-price">🪙 '+item.cost+'</div><button class="btn small '+(owned?'secondary':'')+'" data-act="buy" data-item="'+item.id+'" '+(owned?'disabled':state.coins<item.cost?'disabled':'')+'>'+(owned?'DESBLOQUEADO':state.coins<item.cost?'MOEDAS INSUFICIENTES':'OBTER ITEM')+'</button></article>';
 }).join('')+'</div>'+source();
}
function renderStats(){
 const done=state.completed.length;let most=weakCards()[0];
 return pageIntro('INTELIGÊNCIA DE ESTUDO','Seu desempenho 📊','Acompanhe sua precisão e suas fragilidades — com métricas de treino, não de aprovação oficial.')+
 '<div class="rank-banner"><div class="rank-icon">'+(done>=90?'👑':done>=45?'🛡️':'🎖️')+'</div><div><div class="eyebrow">PATENTE ATUAL</div><h2>'+ (done>=90?'Guardião oficial da Academia':done>=45?'Especialista SOC':'Cadete de segurança')+'</h2><p>Nível '+level()+' · '+state.xp+' XP · '+done+' / 90 fases</p></div></div>'+
 '<div class="analytics-row"><div class="analytics-card"><small>Precisão das respostas</small><strong>'+accuracy()+'%</strong></div><div class="analytics-card"><small>Índice de preparo no treino</small><strong>'+readiness()+'%</strong></div><div class="analytics-card"><small>Respostas registradas</small><strong>'+state.history.length+'</strong></div><div class="analytics-card"><small>Maior desafio atual</small><strong style="font-size:16px">'+esc(most?.name||'Ainda não identificado')+'</strong></div></div>'+
 '<div class="section-header" style="margin-top:30px"><h2>📈 Proficiência por domínio</h2></div><div class="domain-grid">'+domainsMarkup()+'</div>'+
 '<div class="section-header"><h2>🏆 Conquistas</h2></div><div class="badge-grid">'+MILESTONES.map(m=>'<div class="achievement '+(m.test(state)?'':'locked')+'"><div class="emoji">'+m.emoji+'</div><strong>'+m.name+'</strong></div>').join('')+'</div>'+
 (state.lastBossScore?'<div class="notice">⚔️ Último chefão: '+state.lastBossScore+'% de precisão. Meta de treino recomendada: 80%+ e consistência em todos os domínios.</div>':'')+source();
}
function renderProfile(){
 return pageIntro('CONFIGURAÇÕES DA ACADEMIA','Meu progresso ⚙️','Controle seus estudos, privacidade e ritmo. Seu progresso pertence a você.')+
 '<div class="note-card"><label class="label-block" for="profile-name">Como a equipe chama você?</label><input id="profile-name" class="name-input" maxlength="32" value="'+esc(state.name)+'"><div style="margin-top:13px"><button class="btn small" data-act="save-name">Salvar apelido</button></div></div>'+
 '<div class="toggle-row"><div><strong>🚀 Maratona livre</strong><p style="margin:0;font-size:12px">Desbloqueie os próximos dias sem esperar o calendário (continua exigindo concluir a fase anterior).</p></div><input type="checkbox" class="switch" id="marathon" '+(state.marathon?'checked':'')+' aria-label="Habilitar maratona livre"></div>'+
 '<div class="notice">🔒 <strong>Privacidade:</strong> progresso, respostas e notas ficam no armazenamento local deste navegador. Não existe conta, IA remota nem sincronização em nuvem. Faça backups para evitar perder tudo ao limpar dados.</div>'+
 '<div class="note-card"><h3>💾 Backup do progresso</h3><p>Exporte suas missões para um arquivo JSON ou importe um backup anterior.</p><div class="profile-controls"><button class="btn secondary" data-act="export">⬇ Exportar JSON</button><button class="btn secondary" data-act="import">⬆ Importar JSON</button><input type="file" id="import-file" accept="application/json,.json" hidden></div></div>'+
 '<div class="note-card" style="margin-top:16px"><h3>🧹 Reiniciar jornada</h3><p>Apaga todos os dados locais deste jogo neste navegador. Não pode ser desfeito sem backup.</p><button class="btn small ghost" data-act="reset">Excluir meu progresso</button></div>'+source();
}
function render(){
 if(session)return;
 topStats(); const main=$('#main-content');
 main.innerHTML=view==='home'?renderHome():view==='journey'?renderJourney():view==='lab'?renderLab():view==='notes'?renderNotes():view==='shop'?renderShop():view==='stats'?renderStats():view==='profile'?renderProfile():view==='day'?renderDay(selectedDay):renderHome();
 $('#rightbar').innerHTML=renderRight();
}
function go(v){if(session)return;view=v;render();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
function chooseDay(d){selectedDay=d;go('day')}
function sample(arr,n,rng=Math.random){return [...arr].sort(()=>rng()-.5).slice(0,n)}
function mix(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
function topicOptions(card,prop='name'){const pool=BANK.filter(x=>x.id!==card.id&&x.domain===card.domain&&!x[prop].includes(card[prop]));return mix([card[prop],...sample(pool,3).map(x=>x[prop])])}
function makeChoice(card,kind='name',variant=0){
  const name=kind==='name';
  const prompts=name?[
    'Quem sou eu? '+card.definition,
    'Incidente no escritório: '+card.incident+' Qual conceito/recurso ajuda a resolver?',
    'Identifique o termo: '+card.definition
  ]:[
    'Conserte a brecha: '+card.incident+' Qual ação é mais adequada?',
    'O Chefe quer resposta imediata. '+card.incident+' Sua decisão?',
    'Uma auditoria encontrou isto: '+card.incident+' Como agir?'
  ];
  return {type:'choice',topic:card.id,prompt:prompts[variant%3],options:topicOptions(card,name?'name':'action'),correct:name?card.name:card.action,tip:card.tip,explain:name?card.definition:card.action,tag:name?'QUEM SOU EU?':'CONSERTE A BRECHA'};
}
function makeMatch(cards){
 const items=cards.map(c=>({id:c.id,left:c.name,right:c.definition}));
 return {type:'match',topic:cards[0]?.id||'zero',pairs:items,prompt:'Conecte cada conceito à definição correta.',tag:'CONECTE OS PARES'};
}
function weightedCards(n){const buckets=Object.entries(DOMAIN).flatMap(([k,d])=>Array(Math.max(1,Math.round(d.weight/5))).fill(k));let picks=[];while(picks.length<n){let k=buckets[Math.floor(Math.random()*buckets.length)];let pool=sample(BANK.filter(c=>c.domain===k&&!picks.some(x=>x.id===c.id)),1);if(!pool.length)pool=sample(BANK.filter(c=>c.domain===k),1);picks.push(...pool)}return picks}
function phaseQuestions(day,phase){
 const d=DAYS[day-1],cards=d.topics.map(id=>BY_ID[id]),due=dueCards().filter(x=>!cards.some(c=>c.id===x.id));
 const reviews=sample(due,2);
 if(phase===1){
  if(d.day===30)return weightedCards(10).map((c,i)=>makeChoice(c,i%2?'action':'name',i));
  return [makeChoice(reviews[0]||cards[0],'name',1),makeChoice(cards[1],'name',0),makeMatch(cards),makeChoice(reviews[1]||cards[2],'name',2)];
 }
 if(phase===2){
  if(d.day===30)return weightedCards(10).map((c,i)=>makeChoice(c,i%3?'action':'name',i));
  return [makeChoice(cards[0],'action',0),makeChoice(cards[1],'name',1),makeChoice(cards[2],'action',1),makeChoice(cards[0],'name',2),makeChoice(cards[1],'action',2)];
 }
 if(d.boss){
  return weightedCards(day===30?24:15).map((c,i)=>makeChoice(c,i%3===0?'name':'action',i));
 }
 const pile=[...cards,...reviews,...cards];
 return sample(pile,6).map((c,i)=>makeChoice(c,i%2?'name':'action',i));
}
function quickQuestions(mode){
 let src=mode==='due'?dueCards():mode==='weak'?weakCards():[];
 if(mode==='random'||!src.length)src=weightedCards(10);
 while(src.length<6)src.push(...sample(BANK.filter(c=>!src.some(x=>x.id===c.id)),6-src.length));
 return sample(src,mode==='random'?10:Math.min(10,src.length)).map((c,i)=>makeChoice(c,i%2?'name':'action',i));
}
function beginSession(mode,day=1,phase=1,quick='due'){
 if(mode==='phase'&&!unlockPhase(day,phase)){notify('Fase bloqueada. Conclua as anteriores!',true);return}
 if(state.hearts<1){notify('Sem vidas! Volte amanhã ou adquira um escudo no Arsenal.',true);go('shop');return}
 let questions=mode==='phase'?phaseQuestions(day,phase):quickQuestions(quick);
 if(!questions.length){notify('Ainda sem exercícios para essa sessão.',true);return}
 const timed=mode==='phase'&&phase===3||quick==='random'&&mode==='quick';
 const seconds=timed?(day===30?240:DAYS[day-1]?.boss?155:day<12?110:85):0;
 session={mode,day,phase,quick,questions,index:0,correct:0,wrong:0,answered:false,chosen:null,endsAt:seconds?Date.now()+seconds*1000:null,matchLeft:null,matchDone:[],matchMistakes:0,latestCorrect:false,start:Date.now()};
 drawQuestion();if(timed){clearInterval(ticker);ticker=setInterval(updateTimer,200)}
}
function countdown(){return Math.max(0,Math.ceil((session.endsAt-Date.now())/1000))}
function updateTimer(){if(!session?.endsAt){clearInterval(ticker);return}let el=$('#seconds-left');if(el){el.textContent=countdown()+'s';el.parentElement?.classList.toggle('danger',countdown()<16)}if(countdown()===0){clearInterval(ticker);finishSession(true)}}
function questionHTML(q){
 if(q.type==='match'){
  const selected=session.matchLeft,done=session.matchDone;
  const right=q.pairs.slice().reverse();
  return '<p class="match-guide">Selecione uma palavra à esquerda e, depois, a definição correspondente à direita.</p><div class="match-area"><div class="match-col">'+q.pairs.map(c=>'<button class="match-choice '+(done.includes(c.id)?'matched':selected===c.id?'picked':'')+'" data-act="match-left" data-id="'+c.id+'" '+(done.includes(c.id)?'disabled':'')+'>'+esc(c.left)+'</button>').join('')+'</div><div class="match-col">'+right.map(c=>'<button class="match-choice '+(done.includes(c.id)?'matched':'')+'" data-act="match-right" data-id="'+c.id+'" '+(done.includes(c.id)||!selected?'disabled':'')+'>'+esc(c.right)+'</button>').join('')+'</div></div>';
 }
 return '<div class="options">'+q.options.map((o,i)=>'<button class="option '+(session.answered?(o===q.correct?'correct':o===session.chosen?'wrong':''):'')+'" data-act="answer" data-index="'+i+'" '+(session.answered?'disabled':'')+'><span class="key">'+(i+1)+'</span>'+esc(o)+'</button>').join('')+'</div>';
}
function drawQuestion(){
 if(!session)return;
 const s=session,q=s.questions[s.index],d=DAYS[s.day-1],mn=mentorName(s.day);
 const mentor=MENTORS[mn];
 const progress=Math.round(s.index/s.questions.length*100);
 const tip=session.answered?'<div class="quiz-feedback '+(session.latestCorrect?'good':'bad')+'"><strong>'+(session.latestCorrect?'✅ Excelente defesa!':'🔎 Essa brecha passou. Observe:')+'</strong><p>'+esc(q.tip||'Revise esse conceito antes da próxima missão.')+' '+(!session.latestCorrect?'Resposta: '+esc(q.correct||'relacione os termos'):'')+'</p></div>':'';
 $('#modal').innerHTML='<div class="quiz-dialog" role="dialog" aria-modal="true" aria-labelledby="quiz-heading"><div class="quiz-top"><div><div class="eyebrow">'+(s.mode==='phase'?'DIA '+pad(s.day)+' · FASE '+s.phase:'LABORATÓRIO · TREINO')+'</div><strong id="quiz-heading">'+(s.mode==='phase'?esc(d.title):'Revisão personalizada')+'</strong></div><button class="exit-btn" data-act="quit" aria-label="Sair da fase">×</button></div>'+
 '<div class="quiz-meta"><span>Questão '+(s.index+1)+' / '+s.questions.length+'</span><span>'+s.correct+' acertos'+(s.endsAt?'<span class="quiz-timer" style="margin-left:10px">⏳ <b id="seconds-left">'+countdown()+'s</b></span>':'')+'</span></div><div class="progress-track quiz-progress"><div style="width:'+progress+'%"></div></div>'+
 '<div class="quiz-mentor"><div class="mentor-emoji">'+face(mn)+'</div><p><strong>'+mn+':</strong> '+(q.type==='match'?'Vamos conectar as peças. Nomes primeiro, conceito depois.':q.tag==='CONSERTE A BRECHA'?'Decida qual defesa aplicar. Sem pânico, com método.':'Leia o cenário. Encontre o recurso certo.')+'</p></div>'+
 '<div class="question-type">'+q.tag+'</div><div class="quiz-prompt">'+esc(q.prompt)+'</div>'+questionHTML(q)+tip+
 '<div class="quiz-bottom"><small>💚 '+state.hearts+' vidas · 🪙 '+state.coins+'</small>'+(s.answered?'<button class="btn small" data-act="next">CONTINUAR →</button>':'<span class="muted">Selecione sua resposta</span>')+'</div></div>';
}
function recordAttempt(id,correct){
 studyToday();
 const t=state.topics[id]||{right:0,wrong:0,box:0,due:''};
 if(correct){t.right++;t.box=Math.min(4,(t.box||0)+1);state.xp+=12;playSound(true);confetti(18)}
 else{t.wrong++;t.box=0;state.hearts=Math.max(0,state.hearts-1);playSound(false);let dialog=$('.quiz-dialog');if(dialog){dialog.classList.remove('shake');void dialog.offsetWidth;dialog.classList.add('shake')}}
 let dt=new Date();dt.setDate(dt.getDate()+schedule[t.box]);t.due=dateLocal(dt);state.topics[id]=t;
 state.history.push({id,correct,date:dateLocal(),at:Date.now()});if(state.history.length>3000)state.history=state.history.slice(-3000);
 save();topStats();
}
function answer(i){
 if(!session||session.answered)return;
 const q=session.questions[session.index];if(q.type!=='choice')return;
 const chosen=q.options[i],good=chosen===q.correct;session.chosen=chosen;session.answered=true;session.latestCorrect=good;
 if(good)session.correct++;else session.wrong++;
 recordAttempt(q.topic,good);drawQuestion();
}
function matchSelect(side,id){
 if(!session||session.answered)return;
 let q=session.questions[session.index];if(q.type!=='match')return;
 if(side==='left'){session.matchLeft=id;drawQuestion();return}
 if(!session.matchLeft)return;
 let good=session.matchLeft===id;
 if(good){session.matchDone.push(id);recordAttempt(id,true);if(session.matchDone.length===q.pairs.length){session.correct++;session.answered=true;session.latestCorrect=session.matchMistakes===0;confetti(35)}}
 else{session.matchMistakes++;recordAttempt(session.matchLeft,false);notify('Ainda não é esse par. Compare o conceito e tente novamente.',true)}
 session.matchLeft=null;drawQuestion();
}
function nextQuestion(){
 if(!session||!session.answered)return;
 if(state.hearts===0){finishSession(false,true);return}
 session.index++;
 session.answered=false;session.chosen=null;session.matchLeft=null;session.matchDone=[];session.matchMistakes=0;
 if(session.index>=session.questions.length){finishSession(false);return}drawQuestion();
}
function finishSession(timeout=false,outOfHearts=false){
 if(!session)return;clearInterval(ticker);const s=session;session=null;
 const percent=Math.round(s.correct/s.questions.length*100);
 const threshold=s.mode==='phase'&&DAYS[s.day-1].boss?70:60;
 const success=!timeout&&!outOfHearts&&percent>=threshold;
 let reward=0,firstTime=false;
 if(s.mode==='phase'&&success){
  let id=s.day+'-'+s.phase;firstTime=!state.completed.includes(id);
  if(firstTime){state.completed.push(id);reward=s.phase===3?55:35;state.coins+=reward;state.xp+=s.phase===3?60:35}
  if(DAYS[s.day-1].boss)state.lastBossScore=percent;
 }
 if(s.mode==='quick'&&success){reward=12;state.coins+=reward}
 if(success){confetti(85);playSound(true)}
 save();topStats();
 const title=success?'MISSÃO CUMPRIDA!':'MISSÃO INCOMPLETA';
 const line=timeout?'O relógio zerou. Treine e tente outra vez.':outOfHearts?'Suas vidas acabaram. Recupere um escudo para continuar.':success?'A nuvem está mais segura graças a você.':'Reveja as brechas e tente novamente. Precisão mínima: '+threshold+'%.';
 $('#modal').innerHTML='<div class="popup-dialog" role="dialog" aria-modal="true" aria-labelledby="result-title"><div class="eyebrow">'+(success?'CERTIFICADO DA MISSÃO':'RELATÓRIO DO SOC')+'</div><div class="popup-emoji">'+(success?'🏆':timeout?'⏳':'💪')+'</div><h2 id="result-title">'+title+'</h2><p>'+line+'</p><div class="summary-grid"><div class="summary-card"><div class="label">Precisão</div><strong>'+percent+'%</strong></div><div class="summary-card"><div class="label">Acertos</div><strong>'+s.correct+'/'+s.questions.length+'</strong></div><div class="summary-card"><div class="label">SecCoins</div><strong>+'+reward+'</strong></div></div>'+
 '<div class="btn-row" style="justify-content:center"><button class="btn" data-act="result-close">'+(success?'CONTINUAR JORNADA':'VOLTAR À MISSÃO')+'</button>'+(!success&&state.hearts>0?'<button class="btn secondary" data-act="retry" data-day="'+s.day+'" data-phase="'+s.phase+'" data-mode="'+s.mode+'" data-quick="'+s.quick+'">Tentar novamente</button>':'')+'</div></div>';
 if(firstTime&&state.completed.length===90)notify('👑 Todas as 90 fases concluídas! Agora teste sua consistência no simulado.');
}
function closeModal(){clearInterval(ticker);session=null;$('#modal').innerHTML='';render()}
function buy(id){
 const item=SHOP.find(x=>x.id===id);if(!item||state.coins<item.cost){notify('Você precisa de mais SecCoins.',true);return}
 if((item.kind==='skin'&&state.inventory.includes(id))||(id==='quote'&&state.quote))return;
 state.coins-=item.cost;
 if(item.kind==='skin')state.inventory.push(id);
 if(id==='shield')state.hearts=Math.min(5,state.hearts+1);
 if(id==='freeze')state.freezes++;
 if(id==='quote')state.quote=true;
 save();render();notify('Item adquirido! '+item.emoji);
 if(id==='quote')$('#modal').innerHTML='<div class="popup-dialog" role="dialog" aria-modal="true"><div class="popup-emoji">📜</div><h2>Código do Guardião</h2><p>“Disciplina não é agir quando é fácil; é manter controles quando ninguém está olhando.”</p><button class="btn" data-act="result-close">Fechar</button></div>';
}
function exportData(){
 const json=JSON.stringify(state,null,2),blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='sc900-academy-'+dateLocal()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Backup do progresso exportado.');
}
function importData(file){
 if(!file||file.size>2_000_000){notify('Arquivo inválido ou maior que 2 MB.',true);return}
 const reader=new FileReader();reader.onload=()=>{
  try{const obj=JSON.parse(reader.result);
   if(obj.version!==1||!Array.isArray(obj.completed)||typeof obj.topics!=='object'||typeof obj.notes!=='object'||!Number.isFinite(obj.xp)||!Number.isFinite(obj.coins))throw Error('Formato');
   if(!window.confirm('Substituir TODO o seu progresso local pelo conteúdo do backup?'))return;
   state=Object.assign(fresh(),obj);
   state.completed=state.completed.filter(x=>/^(?:[1-9]|[12]\d|30)-[123]$/.test(x));
   state.coins=Math.max(0,Math.min(100000,state.coins));state.xp=Math.max(0,Math.min(10000000,state.xp));
   state.hearts=Math.max(0,Math.min(5,Number(state.hearts)||0));
   state.name=String(state.name).slice(0,32);
   state.history=Array.isArray(state.history)?state.history.slice(-3000):[];
   state.inventory=Array.isArray(state.inventory)?state.inventory.filter(x=>SHOP.some(i=>i.id===x&&i.kind==='skin')):[];
   save();todaySetup();go('home');notify('Backup importado!');
  }catch(e){notify('Não foi possível ler esse backup.',true)}
 };reader.readAsText(file);
}
document.addEventListener('click',ev=>{
 const b=ev.target.closest('[data-act],[data-view],#sound-toggle');if(!b)return;
 if(b.id==='sound-toggle'){state.sound=!state.sound;save();topStats();return}
 if(b.dataset.view){ev.preventDefault();go(b.dataset.view);return}
 const action=b.dataset.act;
 if(action==='open-day'){chooseDay(Number(b.dataset.day));return}
 if(action==='start-phase'){beginSession('phase',Number(b.dataset.day),Number(b.dataset.phase));return}
 if(action==='start-quick'){beginSession('quick',1,1,b.dataset.mode);return}
 if(action==='answer'){answer(Number(b.dataset.index));return}
 if(action==='match-left'||action==='match-right'){matchSelect(action==='match-left'?'left':'right',b.dataset.id);return}
 if(action==='next'){nextQuestion();return}
 if(action==='quit'){if(confirm('Sair desta fase? O progresso da fase atual não será salvo.'))closeModal();return}
 if(action==='result-close'){closeModal();return}
 if(action==='retry'){const args={mode:b.dataset.mode,day:Number(b.dataset.day),phase:Number(b.dataset.phase),quick:b.dataset.quick};$('#modal').innerHTML='';beginSession(args.mode,args.day,args.phase,args.quick);return}
 if(action==='buy'){buy(b.dataset.item);return}
 if(action==='save-note'){let id=$('#note-topic')?.value,text=$('#note-editor')?.value?.trim();if(!id||!text){notify('Escreva uma nota antes de salvar.',true);return}state.notes[id]=text.slice(0,2000);save();render();notify('Anotação salva!');return}
 if(action==='edit-note'){let id=b.dataset.topic;$('#note-topic').value=id;$('#note-editor').value=state.notes[id]||'';$('#note-editor').focus();return}
 if(action==='remove-note'){if(!confirm('Excluir esta anotação?'))return;delete state.notes[b.dataset.topic];save();render();return}
 if(action==='save-name'){state.name=($('#profile-name').value.trim()||'Chefe').slice(0,32);save();render();notify('Apelido atualizado.');return}
 if(action==='export'){exportData();return}
 if(action==='import'){$('#import-file')?.click();return}
 if(action==='reset'){if(!confirm('ATENÇÃO: apagar todo o progresso local, moedas, notas e conquistas?'))return;if(!confirm('Confirma o reinício completo?'))return;state=fresh();save();go('home');notify('Jornada reiniciada.');return}
});
document.addEventListener('change',ev=>{
 if(ev.target.id==='marathon'){state.marathon=ev.target.checked;save();notify(state.marathon?'Maratona livre ativada!':'Ritmo diário ativado.');render()}
 if(ev.target.id==='note-topic'){$('#note-editor').value=state.notes[ev.target.value]||''}
 if(ev.target.id==='import-file'){importData(ev.target.files?.[0]);ev.target.value=''}
});
document.addEventListener('keydown',ev=>{
 if(!session||session.answered||ev.altKey||ev.ctrlKey||ev.metaKey)return;
 const q=session.questions[session.index];if(q.type!=='choice')return;
 if(/^[1-4]$/.test(ev.key)){ev.preventDefault();answer(Number(ev.key)-1)}
});
function initShader(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 try{
  const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:0;opacity:.19;pointer-events:none';document.body.prepend(canvas);$('#app').style.position='relative';$('#app').style.zIndex='1';
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,powerPreference:'low-power'});if(!gl){canvas.remove();return}
  const vs='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const fs='precision mediump float;uniform vec2 r;uniform float t;void main(){vec2 uv=gl_FragCoord.xy/r;float a=sin(uv.x*8.+t*.2)*.04+sin(uv.y*7.-t*.16)*.05;float line=pow(max(0.,sin(uv.x*12.+uv.y*8.+t*.28+a)),10.);float glow=1.-length(uv-vec2(.7,.55));vec3 col=mix(vec3(.04,.17,.35),vec3(.10,.72,.70),clamp(glow*.6+line*.35,0.,1.));gl_FragColor=vec4(col,clamp(.14+line*.32,0.,.6));}';
  function shader(type,src){let s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('shader compile');return s}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('shader link');gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const r=gl.getUniformLocation(program,'r'),t=gl.getUniformLocation(program,'t');let last=0;
  function tick(now){requestAnimationFrame(tick);if(document.hidden||now-last<45)return;last=now;const w=Math.max(1,Math.floor(innerWidth*.5)),h=Math.max(1,Math.floor(innerHeight*.5));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}gl.uniform2f(r,w,h);gl.uniform1f(t,now/1000);gl.drawArrays(gl.TRIANGLES,0,6)}
  requestAnimationFrame(tick);
 }catch(e){/* WebGL enhancement is optional. */}
}
initShader();
render();
