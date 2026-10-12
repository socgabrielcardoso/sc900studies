import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BANK,DAYS,DOMAIN,SHOP,MILESTONES,OFFICIAL_GUIDE} from '../content.js';

const ids=new Set(BANK.map(item=>item.id));
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('A trilha contém 30 dias, três fases por dia e três chefões',()=>{
  assert.equal(DAYS.length,30);
  for(const [index,day] of DAYS.entries()){
    assert.equal(day.day,index+1);
    assert.equal(day.topics.length,3);
    assert.ok(day.topics.every(id=>ids.has(id)));
  }
  assert.deepEqual(DAYS.filter(d=>d.boss).map(d=>d.day),[22,29,30]);
  assert.equal(DAYS.length*3,90);
});
test('Há 86 conceitos exclusivos com definição, incidente, ação e dica',()=>{
  assert.equal(BANK.length,86);
  assert.equal(ids.size,BANK.length);
  assert.ok(BANK.every(c=>c.name&&c.definition&&c.incident&&c.action&&c.tip&&DOMAIN[c.domain]));
});
test('Cobertura dos quatro domínios oficiais, com prioridade à segurança',()=>{
  assert.deepEqual(BANK.reduce((a,c)=>(a[c.domain]=(a[c.domain]||0)+1,a),{}),{core:12,entra:21,security:33,purview:20});
  assert.equal(Object.values(DOMAIN).reduce((n,d)=>n+d.weight,0),100);
  assert.ok(DOMAIN.security.weight>DOMAIN.entra.weight);
});
test('Recursos essenciais e mecânicas de segurança presentes',()=>{
  for(const id of ['zero','mfa','pim','ca','siem','soar','sentinel','dxdr','dlp','labels','audit','ediscovery']){
    assert.ok(ids.has(id),'Falta conteúdo: '+id);
  }
  for(const term of ['localStorage','dueCards','recordAttempt','makeMatch','phaseQuestions','beginSession','confetti','initShader','importData']){
    assert.ok(source.includes(term),'Falta mecânica: '+term);
  }
  assert.ok(SHOP.some(item=>item.id==='freeze'));
  assert.ok(SHOP.some(item=>item.id==='shield'));
  assert.ok(MILESTONES.some(item=>item.id==='graduate'));
});
test('Privacidade, idioma e recursos locais sem dependências remotas',()=>{
  assert.match(html,/lang="pt-BR"/);
  assert.match(html,/Content-Security-Policy/);
  assert.match(html,/script type="module" src="\/app.js"/);
  assert.ok(OFFICIAL_GUIDE.startsWith('https://learn.microsoft.com/'));
  assert.ok(!source.includes('fetch('));
  assert.ok(!source.includes('eval('));
  assert.ok(!source.includes('innerHTML=state.notes'));
  assert.ok(!source.includes('style="'),'Estilos inline quebram a CSP');
});
