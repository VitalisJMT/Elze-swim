const assert=require('node:assert/strict');
const {compare}=require('../yearly-analysis.js');
const row=(date,time)=>({date,time});
let c=compare([row('2025-08-31','1:40.00'),row('2025-09-01','1:35.00'),row('2026-08-31','1:30.00'),row('2026-09-01','1:20.00')],2025,'2026-11-08');
assert.equal(c.delta,-10);assert.equal(c.percent,-10);assert.equal(c.count,2);
c=compare([row('2024-01-01','90.00'),row('2025-09-01','95.00')],2025,'2026-11-08');assert.equal(c.delta,5);
assert.equal(compare([row('2025-09-01','90.00')],2025,'2026-11-08').delta,null);
assert.equal(compare([row('2024-01-01','90.00')],2025,'2026-11-08').current,null);
c=compare([row('2026-01-01','90.00'),row('2026-09-01','90,00'),row('2026-12-31','80.00'),row('2026-11-31','70.00'),row('2026-10-01','DSQ')],2026,'2026-11-08');assert.equal(c.delta,0);assert.equal(c.count,1);
assert.equal(compare([row('2026-13-01','30.00')],2026,'2026-11-08').count,0);
console.log('Season boundaries September 1 / August 31, percentages, missing baseline, slower times, ties, future dates and invalid results: passed');
// Exercise the UI against the real snapshot with a minimal DOM adapter.
const vm=require('node:vm'),fs=require('node:fs');
const nodes={};const document={getElementById(id){return nodes[id]||(nodes[id]={before(){}})},createElement(){return {innerHTML:'',className:'',id:''}}};
const context={document,console,Intl,Date};context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../swimrankings-history.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../history-import.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../yearly-analysis.js'),'utf8'),context);
const db=context.mergeSwimrankingsHistory({},context.SWIMRANKINGS_HISTORY).db;
const box={before(){},innerHTML:''};nodes['yearly-analysis']=box;
context.renderYearlyAnalysis(db);
assert.ok(box.innerHTML.includes('Visi sezonai'));assert.ok(box.innerHTML.includes('2025-09-01 – 2026-08-31'));
assert.ok(!box.innerHTML.includes('all-09'));for(const c of db.competitors)assert.ok(box.innerHTML.includes(c.name));
assert.ok((box.innerHTML.match(/<th colspan="10">Sezonas/g)||[]).length>=3);
nodes['yearly-year'].onchange({target:{value:'2025'}});assert.equal((box.innerHTML.match(/<th colspan="10">Sezonas/g)||[]).length,1);
nodes['yearly-pool'].onchange({target:{value:'50'}});assert.ok(!box.innerHTML.includes('<td>25 m</td>'));
nodes['yearly-athlete'].onchange({target:{value:'main'}});assert.ok(!box.innerHTML.includes('<td>Viltė Ruzgailaitė</td>'));
console.log('Real imported history: all seasons, all swimmers, season/athlete/pool controls passed');

nodes['yearly-athlete'].onchange({target:{value:'main'}});nodes['yearly-event'].onchange({target:{value:'100 krutine'}});nodes['yearly-pool'].onchange({target:{value:'25'}});assert.ok(box.innerHTML.includes('−17,87 s'));assert.ok(box.innerHTML.includes('−15,15 %'));assert.ok(box.innerHTML.includes('Pagerino PB'));

// Absolute PBs and the table-only per-athlete comparison.
const {allTimePB,validDate}=require('../yearly-analysis.js');
const swim=(date,time,extra={})=>({date,time,event:'100 krutine',pool:25,...extra});
const today='2026-11-09';
const history=[swim('2025-08-01','100'),swim('2025-09-01','98'),swim('2026-08-31','95'),swim('2026-09-01','90'),swim('2026-11-10','20')];
assert.equal(allTimePB(history,today).s,90);
const historical=compare(history,2025,today);
assert.equal(historical.before.s,100);assert.equal(historical.current.s,95);assert.equal(historical.allTime.s,90);assert.equal(historical.delta,-5);
const invalid=[swim('2026-11-31','1'),swim('2026-02-29','1'),swim('2026-11-10','1'),swim('2026-10-01','1',{status:'DSQ'}),swim('2026-10-01','1',{status:'DNS'}),swim('2026-10-01','1',{status:'DNF'}),swim('2026-10-01','1',{relay:true}),swim('2026-10-01','1',{event:'4x100 krutine'}),swim('2026-10-01','1',{pool:33}),swim('2026-10-01','DSQ'),swim('2026-10-01','0')];
assert.equal(allTimePB(invalid,today),null);
assert.equal(validDate('2024-02-29'),true);assert.equal(validDate('2026-02-29'),false);
assert.equal(allTimePB([swim('2026-09-02','90'),swim('2026-09-01','90')],today).date,'2026-09-01');
const saved=JSON.stringify(db);
context.renderYearlyAnalysis(db);
nodes['yearly-year'].onchange({target:{value:'2026'}});nodes['yearly-athlete'].onchange({target:{value:'all'}});nodes['yearly-event'].onchange({target:{value:'100 krutine'}});nodes['yearly-pool'].onchange({target:{value:'25'}});
const renderedRows=()=>[...box.innerHTML.matchAll(/<tr><td>(.*?)<\/tr>/g)].map(m=>m[0]);
for(const [name,gap,cls] of [['Lėja Būdaitė','+11,47','gap-behind'],['Elija Sniraitė','−13,56','gap-ahead'],['Auksė Terskovaitė','−7,77','gap-ahead'],['Šarlotė Sofija Ušpuraitė','+4,68','gap-behind']]){
 const r=renderedRows().find(r=>r.includes(name));assert.ok(r.includes('<td class="current-pb-gap"><span class="'+cls+'">'+gap+'</span></td>'),name);
}
assert.ok(renderedRows().find(r=>r.includes('Elzė Oržekauskaitė')).includes('<td class="current-pb-gap"></td>'));
assert.ok([...box.innerHTML.matchAll(/<td class="current-pb-gap">(.*?)<\/td>/g)].every(m=>!m[1].includes('<small>')&&!m[1].includes('<br>')));
assert.equal((box.innerHTML.match(/<th>PB<\/th>/g)||[]).length,1);
assert.ok(!box.innerHTML.includes('<th>PB iki sezono pradžios</th>'));
assert.ok(!box.innerHTML.includes('<svg'));assert.ok(!box.innerHTML.includes('gap-analysis'));
const rendered=box.innerHTML;context.renderYearlyAnalysis(db);assert.equal(box.innerHTML,rendered);
nodes['yearly-year'].onchange({target:{value:'2025'}});
assert.ok(renderedRows().find(r=>r.includes('Lėja Būdaitė')).includes('+11,47'));
nodes['yearly-pool'].onchange({target:{value:'50'}});
assert.ok(renderedRows().find(r=>r.includes('Lėja Būdaitė')).includes('+19,39'));
assert.ok(!box.innerHTML.includes('<td>25 m</td>'));
assert.equal(JSON.stringify(db),saved,'Rendering must not mutate user data');
const malicious=JSON.parse(saved);malicious.competitors[0].name='<img src=x onerror=alert(1)>';
context.renderYearlyAnalysis(malicious);assert.ok(!box.innerHTML.includes('<img src=x'));assert.ok(box.innerHTML.includes('&lt;img'));
const withoutMain=JSON.parse(saved);withoutMain.results=[];context.renderYearlyAnalysis(withoutMain);
assert.ok(renderedRows().length>0);assert.ok(renderedRows().every(r=>r.includes('<td class="current-pb-gap">—</td>')));
console.log('Single absolute PB, signed colored per-athlete differences, pools, seasons, invalid data, escaping, missing baseline and immutable rerender: passed');

// Deployment regression: HTML and the offline shell must request identical,
// versioned analysis assets, without touching the user's result storage.
(async()=>{
 const path=require('node:path'),html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
 const handlers={},cached=new Map(),deleted=[];let installed=[];
 const sandbox={URL,fetch:async()=>{throw new Error('Offline')},self:{location:{origin:'https://example.test'},addEventListener:(type,fn)=>{handlers[type]=fn},skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>({addAll:async urls=>{installed=[...urls];for(const u of urls)cached.set(u,{url:u})}}),match:async req=>cached.get(typeof req==='string'?req:req.url),keys:async()=>['elze-swim-shell-old','unrelated-cache','elze-swim-shell-2026-11-10-pb-table-4','elze-swim-shell-2026-11-10-swimmer-picker-1','elze-swim-shell-2026-11-10-swimmer-picker-2'],delete:async key=>{deleted.push(key)}}};
 Object.defineProperty(sandbox,'localStorage',{get(){throw new Error('Service worker must not touch result storage')}});
 vm.runInNewContext(sw,sandbox);
 let pending;handlers.install({waitUntil:p=>{pending=p}});await pending;
 const refs=[...html.matchAll(/(?:src|href)="(\.\/(?:yearly-analysis\.js|dashboard-v4\.css|app-v3\.js)[^"]*)"/g)].map(m=>m[1]);
 assert.equal(refs.length,3);assert.ok(installed.includes('./icons/elze-run-avatar.png'));
 for(const ref of refs){assert.ok(ref.endsWith('?v=2026-11-10-'+(ref.includes('yearly-analysis.js')?'pb-table-4':ref.includes('app-v3.js')?'swimmer-picker-1':'swimmer-picker-2')));assert.ok(installed.includes(ref));assert.ok(!installed.includes(ref.split('?')[0]));}
 handlers.activate({waitUntil:p=>{pending=p}});await pending;
 assert.deepEqual(deleted,['elze-swim-shell-old','elze-swim-shell-2026-11-10-pb-table-4','elze-swim-shell-2026-11-10-swimmer-picker-1']);
 for(const ref of refs){
  const absolute=new URL(ref,'https://example.test/Elze-swim/').href;
  cached.set(absolute,cached.get(ref));
  handlers.fetch({request:{method:'GET',url:absolute,mode:'cors'},respondWith:p=>{pending=p}});
  assert.equal((await pending).url,ref,'Versioned asset must remain available offline');
 }
 handlers.fetch({request:{method:'GET',url:'https://example.test/Elze-swim/',mode:'navigate'},respondWith:p=>{pending=p}});
 assert.equal((await pending).url,'./index.html');
 console.log('Versioned HTML / precache references, offline assets/navigation and scoped cache cleanup: passed');
})().catch(error=>{console.error(error);process.exitCode=1});

// Keep the selector checks in the existing CI Node entry point.
require('./swimmer-selector.cjs');
