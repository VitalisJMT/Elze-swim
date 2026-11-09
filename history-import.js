/* Merge the verified Swimrankings snapshot without replacing personal data. */
(function(root){
  'use strict';
  const key='elze-swim-v2', main='Elzė Oržekauskaitė';
  function merge(db,snapshot){
    db.results ||= []; db.cResults ||= []; db.competitors ||= [];
    const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const seconds=t=>String(t).replace(',','.').split(':').reduce((n,v)=>n*60+Number(v),0);
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
      // Only correct the five exact dates from the old November screenshot
      // preset. Unrelated manual entries and their custom fields stay intact.
      for(const fix of (snapshot.dateCorrections||[]).filter(r=>r.athleteId===athlete.id)){
        const sameResult=v=>(isMain||v.cid===competitor.id)&&v.event===fix.event&&+v.pool===fix.pool&&seconds(v.time)===seconds(fix.time);
        for(const legacy of target.filter(v=>sameResult(v)&&v.date===fix.fromDate&&!v.sourceId)){
          const duplicate=target.find(v=>v!==legacy&&sameResult(v)&&v.date===fix.toDate);
          if(duplicate){
            // Retain the original object in a recoverable audit archive rather
            // than displaying the same official swim twice.
            (db.historyCorrectionArchive||=[]).push({version:snapshot.version,sourceId:fix.sourceId,result:{...legacy}});
            target.splice(target.indexOf(legacy),1);
          }else{
            legacy.date=fix.toDate;
            legacy.dateCorrection={from:fix.fromDate,to:fix.toDate,sourceId:fix.sourceId};
          }
        }
        if(isMain){
          const cents=Math.round(seconds(fix.time)*100),oldKey=[fix.fromDate,fix.event,fix.pool,cents].join('|'),newKey=[fix.toDate,fix.event,fix.pool,cents].join('|');
          for(const account of Object.values(db.pbSavings?.seasons||{})){
            const entry=account.entries?.find(e=>e.key===oldKey);
            if(!entry)continue;
            // Also handle a user who already corrected the result's date.
            // Both keys represent one verified swim, never two PB rewards.
            if(account.entries.some(e=>e.key===newKey)){
              (db.historyCorrectionArchive||=[]).push({version:snapshot.version,sourceId:fix.sourceId,reason:'duplicate-pb-date',reward:{...entry}});
              account.entries.splice(account.entries.indexOf(entry),1);
            }else{entry.key=newKey;entry.date=fix.toDate;}
          }
        }
      }
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
