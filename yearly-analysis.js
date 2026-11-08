/* Swimming-season comparisons. Pool lengths and events are never mixed. */
(function(root){
'use strict';
const seconds=t=>{const s=String(t??'').replace(',','.');if(!/^\d+(?::[0-5]\d)?(?:\.\d{1,2})?$/.test(s))return NaN;return s.split(':').reduce((a,v)=>a*60+Number(v),0)};
function compare(rows,year,today){
  const start=year+'-09-01',end=[(year+1)+'-08-31',today].sort()[0];
  const valid=rows.map(r=>({...r,s:seconds(r.time)})).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&Number.isFinite(Date.parse(r.date))&&new Date(r.date).toISOString().slice(0,10)===r.date&&r.date<=end&&Number.isFinite(r.s)&&r.s>0);
  const best=a=>a.slice().sort((a,b)=>a.s-b.s||a.date.localeCompare(b.date))[0]||null;
  const before=best(valid.filter(r=>r.date<start)),during=valid.filter(r=>r.date>=start),current=best(during);
  const delta=before&&current?Math.round((before.s-current.s)*100)/100:null;
  return {before,current,count:during.length,delta,percent:delta===null?null:delta/before.s*100};
}
root.calendarYearComparison=compare;
if(typeof module!=='undefined')module.exports={compare};
if(!root.document)return;
let year='all',athlete='all',event='all',pool='all';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=e=>e.replace(/laisvu|krutine|peteliske|kompleksinis/g,s=>({laisvu:'laisvu stiliumi',krutine:'krūtine',peteliske:'peteliške',kompleksinis:'kompleksiniu būdu'}[s]));
const todayLT=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Vilnius'}).format(new Date());
root.renderYearlyAnalysis=function(db){
 let box=document.getElementById('yearly-analysis');if(!box){box=document.createElement('section');box.id='yearly-analysis';box.className='panel';document.getElementById('manage-panel').before(box)}
 const people=[{id:'main',name:'Elzė Oržekauskaitė',rows:db.results},...db.competitors.map(c=>({...c,rows:db.cResults.filter(r=>r.cid===c.id)}))];
 const all=people.flatMap(p=>p.rows),today=todayLT(),thisYear=Number(today.slice(0,4));
 const currentSeason=thisYear-(today.slice(5)<'09-01'?1:0);
 const years=[...new Set([currentSeason,currentSeason-1,...all.map(r=>Number(String(r.date).slice(0,4))-(String(r.date).slice(5)<'09-01'?1:0)).filter(y=>y>1900&&y<=currentSeason)])].sort((a,b)=>b-a);
 const events=[...new Set(all.map(r=>r.event))].sort();
 if(!people.some(p=>p.id===athlete))athlete='all';if(!events.includes(event))event='all';
 const select=(id,title,options,value)=>'<label>'+title+'<select id="yearly-'+id+'">'+options.map(([v,t])=>'<option value="'+esc(v)+'" '+(String(v)===String(value)?'selected':'')+'>'+esc(t)+'</option>').join('')+'</select></label>';
 let rows='';
 for(const season of (year==='all'?years:[year])){
 const seasonYear=Number(season);
 let seasonRows='';
 for(const p of people.filter(p=>athlete==='all'||p.id===athlete)){
  const keys=[...new Set(p.rows.map(r=>r.event+'|'+r.pool))].sort();
  for(const key of keys){const [e,length]=key.split('|');if((event!=='all'&&event!==e)||(pool!=='all'&&pool!==length))continue;
   const c=compare(p.rows.filter(r=>r.event===e&&String(r.pool)===length),seasonYear,today);if(!c.before&&!c.current)continue;
   const value=r=>r?esc(r.time)+'<br><small>'+esc(r.date)+'</small>':'—';
   const change=c.delta===null?'—':(c.delta>0?'+':'')+c.delta.toFixed(2).replace('.',',')+' s';
   const percent=c.percent===null?'—':(c.percent>0?'+':'')+c.percent.toFixed(2).replace('.',',')+' %';
   const status=!c.current?'Nėra sezono rezultatų':!c.before?'Nėra ankstesnio laiko':c.delta>0?'Pagerino PB':c.delta===0?'Pakartojo PB':'PB nepagerino';
   seasonRows+='<tr><td>'+esc(p.name)+'</td><td>'+esc(label(e))+'</td><td>'+esc(length)+' m</td><td>'+value(c.before)+'</td><td>'+value(c.current)+'</td><td>'+change+'</td><td>'+percent+'</td><td>'+c.count+'</td><td>'+status+'</td></tr>';
  }
 }
 if(seasonRows)rows+='<tr><th colspan="9">Sezonas '+seasonYear+'–'+(seasonYear+1)+' · '+seasonYear+'-09-01 – '+([(seasonYear+1)+'-08-31',today].sort()[0])+'</th></tr>'+seasonRows;
 }
 box.innerHTML='<h2>Plaukikių progresas per sezoną</h2><div class="swim-toolbar">'+select('year','Sezonas',[['all','Visi sezonai'],...years.map(y=>[y,y+'–'+(y+1)+(y===currentSeason?' (iki šiandien)':'')])],year)+select('athlete','Plaukikė',[['all','Visos plaukikės'],...people.map(p=>[p.id,p.name])],athlete)+select('event','Rungtis',[['all','Visos rungtys'],...events.map(e=>[e,label(e)])],event)+select('pool','Baseinas',[['all','Visi baseinai'],['25','25 m'],['50','50 m']],pool)+'</div><p>Lyginamas geriausias asmeninis laikas iki rugsėjo 1 d. su geriausiu pasirinkto sezono laiku. „+“ reiškia greičiau, „−“ – lėčiau; procentas skaičiuojamas nuo ankstesnio laiko. Sezonas: rugsėjo 1 d. – kitų metų rugpjūčio 31 d. imtinai. 25 m ir 50 m baseinai analizuojami atskirai.</p><div class="scroll"><table><thead><tr><th>Plaukikė</th><th>Rungtis</th><th>Baseinas</th><th>PB iki sezono pradžios</th><th>Sezono geriausias</th><th>Pokytis, s</th><th>Pokytis, %</th><th>Startų</th><th>Įvertinimas</th></tr></thead><tbody>'+ (rows||'<tr><td colspan="9">Pasirinktam laikotarpiui ir filtrams duomenų nėra.</td></tr>')+'</tbody></table></div><p class="sub">Be ankstesnio laiko pagerėjimas neskaičiuojamas. Jei sezono geriausias laikas lėtesnis, ankstesnis PB išlieka. Skaičiavimas remiasi tik įkelta rezultatų istorija.</p>';
 for(const id of ['year','athlete','event','pool'])document.getElementById('yearly-'+id).onchange=e=>{if(id==='year')year=e.target.value==='all'?'all':Number(e.target.value);else if(id==='athlete')athlete=e.target.value;else if(id==='event')event=e.target.value;else pool=e.target.value;root.renderYearlyAnalysis(db)};
};
})(typeof window==='undefined'?globalThis:window);
