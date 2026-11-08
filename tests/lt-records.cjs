const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const nodes={'lt-records-panel':{innerHTML:''}},document={getElementById:id=>nodes[id]||(nodes[id]={before(){}}),createElement:()=>({})};
const w={document};w.window=w;vm.createContext(w);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../lt-records.js'),'utf8'),w);
assert.equal(Object.keys(w.LT_RECORDS_DATA).length,35);assert.equal(Object.keys(w.LT_RECORDS).filter(k=>k.endsWith('|25')).length,18);assert.equal(Object.keys(w.LT_RECORDS).filter(k=>k.endsWith('|50')).length,17);
for(const [k,a] of Object.entries(w.LT_RECORDS)){assert.equal(a.length,4);assert.ok(a.every(x=>Number.isFinite(x)&&x>0));assert.ok(a.every((x,i)=>!i||x<=a[i-1]),k);for(const v of Object.values(w.LT_RECORDS_DATA[k])){assert.ok(v.athlete&&/^https:\/\//.test(v.source));assert.ok(v.date===null||v.date<='2026-11-08');assert.ok(v.asOf);}}
assert.equal(w.LT_RECORDS['100 peteliske|25'][2],60.34);assert.equal(w.LT_RECORDS['200 laisvu|50'][3],116.9);assert.ok(!w.LT_RECORDS['100 kompleksinis|50']);assert.ok(!w.LT_RECORDS['25 laisvu|25']);
w.renderLtRecords('all','all');assert.equal((nodes['lt-records-panel'].innerHTML.match(/<td><b>/g)||[]).length,140);
w.renderLtRecords('100 krutine','50');assert.ok(nodes['lt-records-panel'].innerHTML.includes('1:04.35'));assert.ok(!nodes['lt-records-panel'].innerHTML.includes('<td>25 m</td>'));
w.renderLtRecords('100 kompleksinis','50');assert.ok(nodes['lt-records-panel'].innerHTML.includes('nefiksuojamas'));
console.log('All 140 record values, age ordering, metadata, 25/50 m separation, unsupported events and rendered matrix: passed');
