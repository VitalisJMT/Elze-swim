/* Merge the verified Swimrankings snapshot without replacing personal data. */
(function(root){
  'use strict';
  const key='elze-swim-v2', main='Elzė Oržekauskaitė';
  function merge(db,snapshot){
    db.results ||= []; db.cResults ||= []; db.competitors ||= [];
    const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const seconds=t=>String(t).split(':').reduce((n,v)=>n*60+Number(v),0);
    let added=0;
    for(const athlete of snapshot.athletes){
      const isMain=athlete.name===main;
      let competitor;
      if(!isMain){
        competitor=db.competitors.find(c=>normalize(c.name)===normalize(athlete.name));
        if(!competitor){competitor={id:'swimrankings-'+athlete.id,name:athlete.name};db.competitors.push(competitor);}
        competitor.year=athlete.year; competitor.swimrankingsId=athlete.id;
      }
      const target=isMain?db.results:db.cResults;
      for(const r of snapshot.results.filter(r=>r.athleteId===athlete.id)){
        if(!r.date||![25,50].includes(r.pool)||!Number.isFinite(seconds(r.time))||seconds(r.time)<=0)throw Error('Invalid historical result '+r.sourceId);
        const existing=target.find(v=>(isMain||v.cid===competitor.id)&&(v.sourceId===r.sourceId||(v.date===r.date&&v.event===r.event&&+v.pool===r.pool&&seconds(v.time)===seconds(r.time)&&!v.sourceId)));
        const metadata={source:'Swimrankings',sourceId:r.sourceId,sourceUrl:r.sourceUrl,meetUrl:r.meetUrl,city:r.city,season:r.season};
        if(existing){Object.assign(existing,metadata);continue;}
        target.push({id:'swimrankings-'+r.sourceId,event:r.event,pool:r.pool,date:r.date,time:r.time,...metadata,...(isMain?{}:{cid:competitor.id})});added++;
      }
    }
    db.historyImport={version:snapshot.version,importedAt:snapshot.collectedAt,total:snapshot.results.length};
    return {db,added};
  }
  root.mergeSwimrankingsHistory=merge;
  if(root.SWIMRANKINGS_HISTORY&&root.localStorage){
    const previous=root.localStorage.getItem(key);
    try{
      const db=previous?JSON.parse(previous):{};
      if(db.historyImport?.version===root.SWIMRANKINGS_HISTORY.version)return;
      if(previous)root.localStorage.setItem(key+'-before-history-'+root.SWIMRANKINGS_HISTORY.version,previous);
      root.localStorage.setItem(key,JSON.stringify(merge(db,root.SWIMRANKINGS_HISTORY).db));
    }catch(error){root.console.error('Swimrankings istorija neįkelta:',error);}
  }
})(typeof window==='undefined'?globalThis:window);
