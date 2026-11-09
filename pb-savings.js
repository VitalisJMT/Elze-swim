/* PB reward ledger. The confirmed opening balance includes six verified PBs through 2026-10-24. */
(function(root){
'use strict';
const OPENING_SEASON=2026,CUTOFF='2026-10-24',OPENING_COUNT=6,REWARD_CENTS=2000;
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
function timeCents(t){const s=String(t??'').trim().replace(',','.');if(!/^\d+(?::[0-5]\d)?(?:\.\d{1,2})?$/.test(s))return null;const a=s.split(':'),n=Math.round((a.length===2?Number(a[0])*60+Number(a[1]):Number(a[0]))*100);return n>0?n:null}
const seasonOf=d=>Number(d.slice(0,4))-(d.slice(5)<'09-01'?1:0);
const fingerprint=r=>r.date+'|'+r.event+'|'+Number(r.pool)+'|'+timeCents(r.time);
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Vilnius'}).format(new Date());
function initialize(db){
 if(!db.pbSavings)db.pbSavings={version:1,seasons:{}};
 db.pbSavings.seasons||={};
 if(!db.pbSavings.seasons[OPENING_SEASON]){
  const initial=[['2026-10-14','100 laisvu','1:20.40',8220],['2026-10-14','100 krutine','1:33.80',10007],['2026-10-23','100 laisvu','1:17.27',8040],['2026-10-23','100 krutine','1:33.73',9380],['2026-10-24','50 laisvu','34.69',3498],['2026-10-24','50 krutine','43.21',4478]];
  db.pbSavings.seasons[OPENING_SEASON]={openingCount:0,openingCents:0,through:CUTOFF,entries:initial.map(([date,event,time,previousTimeCents])=>({key:fingerprint({date,event,time,pool:25}),date,event,time,pool:25,previousTimeCents,rewardCents:REWARD_CENTS,reason:'verified-opening-pb'}))};
 }
 return db.pbSavings;
}
function reconcile(db,asOf=today()){
 const ledger=initialize(db),seen=new Set(),groups=new Map(),pending=[];let added=0;
 // Results are confirmed when saved by the existing result-import review.
 for(const r of db.results||[]){
  if(!validDate(r.date)||r.date>asOf||![25,50].includes(Number(r.pool))||!/^\d+ (laisvu|krutine|nugara|peteliske|kompleksinis)$/.test(r.event)||r.status==='DSQ'||r.status==='DNS')continue;
  if(r.date>CUTOFF&&r.source!=='Swimrankings'&&r.bonusConfirmed!==true)continue;
  const cents=timeCents(r.time);if(cents===null)continue;
  const key=fingerprint(r);if(seen.has(key))continue;seen.add(key);
  const eventKey=r.event+'|'+Number(r.pool),groupKey=eventKey+'|'+r.date;
  if(!groups.has(groupKey))groups.set(groupKey,{eventKey,date:r.date,rows:[]});groups.get(groupKey).rows.push({...r,cents,key});
 }
 const best=new Map();
 for(const day of [...groups.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.eventKey.localeCompare(b.eventKey))){
  const previous=best.get(day.eventKey),dayBest=Math.min(...day.rows.map(r=>r.cents));
  if(previous!==undefined&&dayBest<previous){
   const year=seasonOf(day.date);
   if(year>=OPENING_SEASON&&day.date>CUTOFF){
    const account=ledger.seasons[year]||(ledger.seasons[year]={openingCount:0,openingCents:0,through:year+'-08-31',entries:[]});
    const eligible=day.rows.filter(r=>r.cents<previous).sort((a,b)=>a.cents-b.cents),fastest=eligible[0];
    const credit=(r,reason)=>{if(!account.entries.some(e=>e.key===r.key)){account.entries.push({key:r.key,date:r.date,event:r.event,pool:Number(r.pool),time:r.time,previousTimeCents:previous,rewardCents:REWARD_CENTS,reason});added++}};
    // With no start order, only the fastest same-day result is certain to be a PB.
    credit(fastest,'confirmed-pb');
    for(const r of eligible.slice(1))if(!account.entries.some(e=>e.key===r.key))pending.push({...r,season:year,previousTimeCents:previous});
   }
  }
  best.set(day.eventKey,previous===undefined?dayBest:Math.min(previous,dayBest));
 }
 return {added,pending};
}
function totals(db,year=seasonOf(today())){
 const a=initialize(db).seasons[year]||{openingCount:0,openingCents:0,entries:[]};
 const championship=a.championship?.awarded?20000:0;
 return {season:year,count:a.openingCount+a.entries.length,cents:a.openingCents+a.entries.reduce((s,e)=>s+e.rewardCents,0)+championship,championshipCents:championship,account:a};
}
function confirmAdditional(db,row){
 const state=reconcile(db);const candidate=state.pending.find(r=>r.key===row.key);if(!candidate)return false;
 const a=db.pbSavings.seasons[candidate.season];a.entries.push({key:candidate.key,date:candidate.date,event:candidate.event,pool:Number(candidate.pool),time:candidate.time,previousTimeCents:candidate.previousTimeCents,rewardCents:REWARD_CENTS,reason:'user-confirmed-same-day-pb'});return true;
}
function awardChampionship(db,year=seasonOf(today()),date=today()){
 if(!validDate(date)||seasonOf(date)!==Number(year))return false;
 const ledger=initialize(db),a=ledger.seasons[year]||(ledger.seasons[year]={openingCount:0,openingCents:0,through:year+'-08-31',entries:[]});
 if(a.championship?.awarded)return false;
 a.championship={awarded:true,date,rewardCents:20000,name:'Patekimas į Lietuvos vaikų plaukimo čempionatą'};return true;
}
const api={initialize,reconcile,totals,timeCents,seasonOf,fingerprint,confirmAdditional,awardChampionship};root.ElzePbSavings=api;if(typeof module!=='undefined')module.exports=api;
if(!root.document)return;
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eur=c=>new Intl.NumberFormat('lt-LT',{style:'currency',currency:'EUR'}).format(c/100);
const eventName=e=>e.replace(/laisvu|krutine|peteliske|kompleksinis/g,s=>({laisvu:'laisvu stiliumi',krutine:'krūtine',peteliske:'peteliške',kompleksinis:'kompleksiniu būdu'}[s]));
root.renderPbSavings=function(db,save){
 let box=document.getElementById('pb-savings-panel');if(!box){box=document.createElement('section');box.id='pb-savings-panel';box.className='panel swim-import';document.getElementById('dash').after(box)}
 const year=seasonOf(today()),t=totals(db,year),pending=reconcile(db).pending.filter(r=>r.season===year);
 box.innerHTML='<h2>Elzės PB taupyklė</h2><p class="sub">'+year+'–'+(year+1)+' m. sezonas · rugsėjo 1 d. – rugpjūčio 31 d.</p><div class="pb-savings-summary"><div><small>Sukaupta bonusų</small><strong id="pb-savings-balance">'+eur(t.cents)+'</strong></div><div><small>PB pagerinimai</small><strong id="pb-savings-count">'+t.count+'</strong></div><div><small>Už kiekvieną naują PB</small><strong>'+eur(REWARD_CENTS)+'</strong></div></div><div class="pb-championship"><h3>Lietuvos vaikų plaukimo čempionatas</h3><p>Už patekimą – vienkartinis <b>200,00 €</b> bonusas šiame sezone. Jis nepriklauso nuo PB pagerinimų skaičiaus.</p>'+(t.account.championship?.awarded?'<p id="pb-championship-status">Patekimas patvirtintas · +200,00 € · '+safe(t.account.championship.date)+'</p>':'<p id="pb-championship-status">Patekimas dar nepatvirtintas.</p><button id="pb-confirm-championship" type="button">Patvirtinti patekimą +200 €</button>')+'</div><p class="sub">Pradinis patvirtintas šio sezono likutis: 120,00 € už 6 PB. Lapkričio 6–7 d. rezultatai neįtraukti, kol jie nepatvirtinti.</p><p>Bonusas pridedamas už naują Elzės asmeninį rekordą bet kurioje individualioje rungtyje. 25 m ir 50 m baseinų PB skaičiuojami atskirai. Vienodas laikas ir pakartotinai įkeltas rezultatas naujo bonuso nesukuria.</p><details><summary>Bonusų istorija</summary><div class="scroll"><table><thead><tr><th>Data</th><th>Pasiekimas</th><th>Bonusas</th></tr></thead><tbody>'+(t.account.openingCount?'<tr><td>Iki '+CUTOFF+' imtinai</td><td>Patvirtinti pradiniai PB pagerinimai</td><td>'+eur(t.account.openingCents)+'</td></tr>':'')+t.account.entries.map(e=>'<tr><td>'+safe(e.date)+'</td><td>'+safe(eventName(e.event))+' · '+e.pool+' m baseinas · '+safe(e.time)+'</td><td>+'+eur(e.rewardCents)+'</td></tr>').join('')+(t.account.championship?.awarded?'<tr><td>'+safe(t.account.championship.date)+'</td><td>Patekimas į Lietuvos vaikų plaukimo čempionatą</td><td>+200,00 €</td></tr>':'')+'</tbody></table></div></details>'+(pending.length?'<details><summary>Patikslinti tos pačios dienos PB ('+pending.length+')</summary><p>Tą pačią dieną yra keli greitesni laikai, tačiau nežinoma startų eilė. Greičiausio laiko bonusas įskaitytas. Papildomą patvirtink tik jei šis plaukimas taip pat pagerino tuo metu galiojusį PB.</p>'+pending.map((r,i)=>'<p>'+safe(r.date)+' · '+safe(eventName(r.event))+' · '+r.pool+' m · '+safe(r.time)+' <button data-bonus-confirm="'+i+'">Patvirtinti papildomą PB +20 €</button></p>').join('')+'</details>':'')+'<p class="sub">Taupyklės istorija išsaugoma kartu su rezultatų JSON atsargine kopija. Ji saugoma šioje naršyklėje.</p>';
 const championshipButton=document.getElementById('pb-confirm-championship');if(championshipButton)championshipButton.onclick=()=>{if(confirm('Patvirtini Elzės patekimą į Lietuvos vaikų plaukimo čempionatą? Vieną kartą pridėti 200,00 €?')&&awardChampionship(db,year)){save();root.renderPbSavings(db,save)}};
 box.querySelectorAll('[data-bonus-confirm]').forEach(b=>b.onclick=()=>{const row=pending[Number(b.dataset.bonusConfirm)];if(confirm('Patvirtini, kad '+row.time+' buvo atskiras PB pagerinimas? Pridėti 20,00 €?')&&confirmAdditional(db,row)){save();root.renderPbSavings(db,save)}});
};
})(typeof window==='undefined'?globalThis:window);
