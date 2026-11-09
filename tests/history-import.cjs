const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const snapshotCode=fs.readFileSync(path.join(__dirname,'../swimrankings-history.js'),'utf8');
const importCode=fs.readFileSync(path.join(__dirname,'../history-import.js'),'utf8');
const w={};w.window=w;vm.createContext(w);vm.runInContext(snapshotCode,w);vm.runInContext(importCode,w);
const history=w.SWIMRANKINGS_HISTORY,merge=w.mergeSwimrankingsHistory,pb=require('../pb-savings.js');
const clone=x=>JSON.parse(JSON.stringify(x));
assert.equal(history.results.length,723);assert.equal(history.athletes.length,6);
assert.equal(new Set(history.results.map(r=>r.sourceId)).size,723);
const latest=history.results.filter(r=>r.meetUrl.includes('meetId=662805'));
assert.equal(latest.length,15);assert.equal(history.dateCorrections.length,5);
for(const [id,count] of Object.entries({'5527533':4,'5501711':3,'5486288':0,'5518473':4,'5467098':4,'5698348':0}))assert.equal(latest.filter(r=>r.athleteId===id).length,count);
for(const r of latest){assert.equal(r.pool,25);assert.ok(['2026-11-06','2026-11-07'].includes(r.date));assert.ok(r.sourceUrl.endsWith('id='+r.sourceId));}
assert.ok(!history.results.some(r=>['254375507','254375495'].includes(r.sourceId)));
const old=clone(history);old.results=old.results.filter(r=>!r.meetUrl.includes('meetId=662805'));old.version='2026-11-08-history-1';delete old.dateCorrections;
const fresh=merge({},history).db;assert.equal(fresh.results.length,100);assert.equal(fresh.cResults.length,623);assert.equal(merge(fresh,history).added,0);
pb.reconcile(fresh,'2026-11-09');assert.equal(pb.totals(fresh,2026).count,9);assert.equal(pb.totals(fresh,2026).cents,18000);
const upgraded=merge({},old).db;
upgraded.plans={custom:'Keep plan'};upgraded.records={custom:'Keep record'};upgraded.notes='Keep personal note';
upgraded.results.push({id:'personal',date:'2026-10-01',event:'400 laisvu',pool:50,time:'8:00.00',note:'Keep manual data'});
// Simulate all 15 previously imported screenshot rows, including five old dates.
for(const r of latest){
 const fix=history.dateCorrections.find(f=>f.sourceId===r.sourceId),main=r.athleteId==='5527533';
 const row={id:'screenshot-'+r.sourceId,date:fix?.fromDate||r.date,event:r.event,pool:r.pool,time:r.time,bonusConfirmed:true,note:'Keep screenshot note'};
 if(!main)row.cid=upgraded.competitors.find(c=>c.swimrankingsId===r.athleteId).id;
 (main?upgraded.results:upgraded.cResults).push(row);
}
pb.reconcile(upgraded,'2026-11-09');assert.equal(pb.totals(upgraded,2026).cents,18000);
assert.equal(merge(upgraded,history).added,0);
assert.equal(upgraded.results.length+upgraded.cResults.length,724);
assert.equal(upgraded.notes,'Keep personal note');assert.equal(upgraded.plans.custom,'Keep plan');assert.equal(upgraded.records.custom,'Keep record');assert.equal(upgraded.results.find(r=>r.id==='personal').note,'Keep manual data');
for(const r of latest){const saved=[...upgraded.results,...upgraded.cResults].filter(v=>v.sourceId===r.sourceId);assert.equal(saved.length,1);assert.equal(saved[0].date,r.date);assert.equal(saved[0].note,'Keep screenshot note');}
pb.reconcile(upgraded,'2026-11-09');assert.equal(pb.totals(upgraded,2026).count,9);assert.equal(pb.totals(upgraded,2026).cents,18000);
assert.equal(merge(upgraded,history).added,0);pb.reconcile(upgraded,'2026-11-09');assert.equal(pb.totals(upgraded,2026).count,9);
// If a user has also entered the corrected date, archive only the exact legacy duplicate.
const duplicateDb=merge({},old).db,fix=history.dateCorrections[0];
duplicateDb.results.push({id:'legacy',date:fix.fromDate,event:fix.event,pool:25,time:fix.time,note:'Preserve in archive'},{id:'correct',date:fix.toDate,event:fix.event,pool:25,time:fix.time});
merge(duplicateDb,history);assert.equal(duplicateDb.results.filter(r=>r.sourceId===fix.sourceId).length,1);assert.equal(duplicateDb.historyCorrectionArchive[0].result.note,'Preserve in archive');
// The automatic upgrade creates a restorable backup, writes once and is idempotent.
const key='elze-swim-v2',before=JSON.stringify(merge({},old).db),storage=new Map([[key,before]]);
const automatic={localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},console};automatic.window=automatic;vm.createContext(automatic);vm.runInContext(snapshotCode,automatic);vm.runInContext(importCode,automatic);
assert.equal(storage.get(key+'-before-history-'+history.version),before);
const after=storage.get(key);assert.equal(JSON.parse(after).historyImport.total,723);vm.runInContext(importCode,automatic);assert.equal(storage.get(key),after);
console.log('723 sourced results, all six swimmers, 15 additions, five exact date corrections, relay exclusions, manual data and PB ledger preservation, duplicate handling, backup and repeated imports: passed');
// A previously credited screenshot and a later corrected row may have two
// ledger keys. Keep one official reward and a recoverable copy of the duplicate.
const collision=clone(upgraded),account=collision.pbSavings.seasons[2026];
const current=account.entries.find(e=>e.date===fix.toDate&&e.event===fix.event&&e.time===fix.time);
account.entries.push({...current,key:current.key.replace(fix.toDate,fix.fromDate),date:fix.fromDate});
assert.equal(pb.totals(collision,2026).cents,20000);
merge(collision,history);pb.reconcile(collision,'2026-11-09');
assert.equal(pb.totals(collision,2026).cents,18000);assert.equal(pb.totals(collision,2026).count,9);
assert.equal(collision.historyCorrectionArchive.find(x=>x.reason==='duplicate-pb-date').reward.date,fix.fromDate);
merge(collision,history);assert.equal(pb.totals(collision,2026).cents,18000);
// A user-corrected result with only the legacy reward must not earn a second reward.
const corrected=clone(upgraded),reward=corrected.pbSavings.seasons[2026].entries.find(e=>e.key===current.key);
reward.key=reward.key.replace(fix.toDate,fix.fromDate);reward.date=fix.fromDate;
merge(corrected,history);assert.equal(pb.reconcile(corrected,'2026-11-09').added,0);assert.equal(pb.totals(corrected,2026).cents,18000);
console.log('Already-corrected dates and duplicate old/new PB ledger keys are reconciled once with a recoverable reward archive: passed');
