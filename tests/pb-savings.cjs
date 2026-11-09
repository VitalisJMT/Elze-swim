const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const api=require('../pb-savings.js');
const w={};w.window=w;vm.createContext(w);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../swimrankings-history.js'),'utf8'),w);
const h=w.SWIMRANKINGS_HISTORY,a=h.athletes.find(a=>a.name==='Elzė Oržekauskaitė');
const db={results:h.results.filter(r=>r.athleteId===a.id).map(r=>({...r,source:'Swimrankings'}))};
assert.equal(api.reconcile(db,'2026-11-09').added,0);assert.equal(api.totals(db,2026).count,6);assert.equal(api.totals(db,2026).cents,12000);
assert.equal(db.pbSavings.seasons[2026].entries.length,6);
const r=(date,event,time,pool=25,extra={})=>({date,event,time,pool,source:'Swimrankings',...extra});
db.results.push(r('2026-11-06','50 laisvu','34.11'),r('2026-11-07','100 krutine','1:32.93'),r('2026-11-07','200 krutine','3:23.19'));
assert.equal(api.reconcile(db,'2026-11-09').added,3);assert.equal(api.totals(db,2026).cents,18000);
assert.equal(api.reconcile(db,'2026-11-09').added,0);
db.results.push(r('2026-11-06','50 laisvu','34,11'),r('2026-11-08','50 laisvu','34.11'),r('2026-11-09','50 laisvu','35.00'));
assert.equal(api.reconcile(db,'2026-11-09').added,0);
db.results.push(r('2026-11-09','50 laisvu','33.90',25,{source:'Screenshot'}));assert.equal(api.reconcile(db,'2026-11-09').added,0);
db.results[db.results.length-1].bonusConfirmed=true;assert.equal(api.reconcile(db,'2026-11-09').added,1);
const restored=JSON.parse(JSON.stringify(db));assert.equal(api.reconcile(restored,'2026-11-09').added,0);assert.equal(api.totals(restored,2026).cents,20000);
db.results.push(r('2026-11-10','50 laisvu','20.00'),r('2026-11-09','50 nugara','DSQ'),r('2026-11-09','50 laisvu estafete','20.00'));assert.equal(api.reconcile(db,'2026-11-09').added,0);
const first={results:[r('2026-11-09','1500 laisvu','20:00.00')]};assert.equal(api.reconcile(first,'2026-11-09').added,0);
const pools={results:[r('2026-10-01','50 laisvu','35.00',25),r('2026-11-09','50 laisvu','36.00',50)]};assert.equal(api.reconcile(pools,'2026-11-09').added,0);
const next={results:[r('2026-10-01','50 laisvu','35.00'),r('2027-09-01','50 laisvu','34.00')]};api.reconcile(next,'2027-09-01');assert.equal(api.totals(next,2027).cents,2000);assert.equal(api.totals(next,2026).cents,12000);
const sameDay={results:[r('2026-10-01','100 laisvu','1:20.00'),r('2026-11-09','100 laisvu','1:18.00'),r('2026-11-09','100 laisvu','1:17.00')]};
let st=api.reconcile(sameDay,'2026-11-09');assert.equal(st.added,1);assert.equal(st.pending.length,1);
assert.equal(api.confirmAdditional(sameDay,st.pending[0]),true);assert.equal(api.confirmAdditional(sameDay,st.pending[0]),false);assert.equal(api.totals(sameDay,2026).cents,16000);
// Removing data must never silently deduct an earned bonus.
db.results=[];api.reconcile(db,'2026-11-09');assert.equal(api.totals(db,2026).cents,20000);
console.log('Verified opening six PBs / EUR120, new PBs, duplicate imports, ties, slower/invalid/future/relay times, confirmation, separate pools, JSON restore, seasons and same-day ambiguity: passed');

const champs={results:[]};assert.equal(api.awardChampionship(champs,2026,'2026-11-09'),true);assert.equal(api.totals(champs,2026).cents,32000);assert.equal(api.totals(champs,2026).count,6);assert.equal(api.awardChampionship(champs,2026,'2026-11-09'),false);assert.equal(api.totals(champs,2026).cents,32000);const copy=JSON.parse(JSON.stringify(champs));assert.equal(api.awardChampionship(copy,2026,'2026-11-09'),false);assert.equal(api.totals(copy,2026).championshipCents,20000);assert.equal(api.awardChampionship(copy,2026,'2027-09-01'),false);
console.log('Championship qualification EUR200 once per season, separate PB count, restore and season validation: passed');

const seeded={results:[]};api.initialize(seeded);const entry=seeded.pbSavings.seasons[2026].entries.find(e=>e.date==='2026-10-23'&&e.event==='100 laisvu');assert.equal(api.improvement(entry).previous,8040);assert.equal(api.improvement(entry).current,7727);assert.equal(api.improvement(entry).deltaCents,-313);assert.equal(api.improvement(entry).percent.toFixed(2),'-3.89');api.reconcile(sameDay,'2026-11-09');const faster=sameDay.pbSavings.seasons[2026].entries.find(e=>e.time==='1:17.00');assert.equal(faster.previousTimeCents,7800);assert.equal(api.improvement(faster).deltaCents,-100);console.log('Previous PB, new PB, negative seconds/percent changes and confirmed same-day PB chain: passed');
