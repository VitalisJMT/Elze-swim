const {test,expect}=require('@playwright/test');test.use({serviceWorkers:'block'});test('desktop dashboard, filters, tab views and data persistence',async({page})=>{const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8765/Elze-swim/');await expect(page.locator('.swim-card')).toHaveCount(1);await expect(page.locator('.swim-chart-layout')).toBeVisible();await page.screenshot({path:'screenshots/desktop.png',fullPage:false});await expect(page.getByRole('heading',{name:'Rezultatai (723)',exact:true})).toBeVisible();const start=await page.locator('[data-chart-point]').evaluateAll(es=>es.map(e=>e.getAttribute('data-chart-point')).find(t=>t.startsWith('LT rekordo planas')));expect(start).toContain(new Date().toISOString().slice(0,10));await page.reload();await expect(page.getByRole('heading',{name:'Rezultatai (723)',exact:true})).toBeVisible();const select=page.locator('#swim-event-filter');await select.selectOption('all');expect(await page.locator('.swim-card').count()).toBeGreaterThan(5);await page.locator('[data-view="analysis"]').first().click();await expect(page.locator('.swim-card').first().locator('.swim-below')).toBeVisible();await expect(page.locator('.swim-card').first().locator('.swim-chart-layout')).toBeHidden();expect(errors).toEqual([])});test('mobile no horizontal overflow and screenshot',async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:8765/Elze-swim/');await expect(page.locator('.swim-card')).toHaveCount(1);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);expect(overflow).toBe(false);await page.screenshot({path:'screenshots/mobile.png',fullPage:false})});test('PWA manifest and service worker registration',async({browser,request})=>{const context=await browser.newContext({serviceWorkers:'allow'});const page=await context.newPage();await page.goto('http://127.0.0.1:8765/Elze-swim/');const manifest=await request.get('http://127.0.0.1:8765/Elze-swim/manifest.webmanifest');expect(manifest.ok()).toBeTruthy();const json=await manifest.json();expect(json.display).toBe('standalone');expect(json.start_url).toBe('/Elze-swim/');await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.getRegistration().then(Boolean))).toBe(true);await page.reload();await expect(page.locator('.swim-card')).toHaveCount(1);await context.close()});
test('season progress for all years, athletes and pools',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/Elze-swim/');
 const panel=page.locator('#yearly-analysis');
 await expect(panel.getByRole('heading',{level:2})).toHaveText('Plaukikių progresas per sezoną');
 await expect(page.locator('#yearly-year')).toHaveValue('all');
 await expect.poll(()=>panel.locator('tbody th').count()).toBeGreaterThan(3);
 await page.getByRole('button',{name:'▥ Analizė',exact:true}).click();
 await page.locator('#yearly-year').selectOption('2025');
 await page.locator('#yearly-event').selectOption('100 krutine');
 await page.locator('#yearly-pool').selectOption('25');
 await expect(panel.locator('tbody th')).toHaveText('Sezonas 2025–2026 · 2025-09-01 – 2026-08-31');
 await expect(panel.getByRole('row').filter({hasText:'Elzė Oržekauskaitė'})).toContainText('−17,87 s');
 await page.locator('#yearly-athlete').selectOption('main');
 await expect(panel.locator('tbody tr')).toHaveCount(2);
 await page.locator('#yearly-pool').selectOption('50');
 await expect(panel.locator('tbody')).toContainText('Nėra ankstesnio laiko');
 await expect(panel.locator('tbody')).not.toContainText('25 m');
 await page.locator('#yearly-athlete').selectOption('all');
 await page.locator('#yearly-pool').selectOption('25');
 await page.getByRole('button',{name:'▥ Analizė',exact:true}).click();
 await page.screenshot({path:'screenshots/season-analysis.png',fullPage:false});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)).toBe(false);
 expect(errors).toEqual([]);
});

test('LT record coverage in charts, source matrix and pool-specific filters',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/Elze-swim/');
 await expect(page.locator('#lt-records-panel')).toContainText('iki 13 m.');
 await page.locator('#swim-pool-filter').selectOption('50');
 await expect(page.locator('.chart-wrap svg')).toContainText('LT iki 17 m.');
 await expect(page.locator('.chart-wrap svg')).toContainText('1:04.35');
 await expect(page.locator('#lt-records-panel tbody tr')).toHaveCount(1);
 await page.getByRole('button',{name:'♕ Rekordai',exact:true}).click();
 await expect(page.locator('#lt-records-panel tbody tr')).toHaveCount(35);
 await expect(page.locator('#lt-records-panel a')).toHaveCount(140);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)).toBe(false);
 expect(errors).toEqual([]);
});
test('PB savings includes 180 EUR after verified history refresh and credits new PBs once across reload and duplicate imports',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/Elze-swim/');
 await expect(page.locator('#pb-savings-count')).toHaveText('9');
 await expect(page.locator('#pb-savings-balance')).toContainText('180,00');
 await page.locator('#pb-savings-panel').getByText('Bonusų istorija',{exact:true}).click();
 const pbRow=page.locator('#pb-savings-panel tbody tr').filter({hasText:'2026-10-23'}).filter({hasText:'100 laisvu stiliumi'});
 await expect(pbRow).toContainText('1:20,40');await expect(pbRow).toContainText('1:17,27');await expect(pbRow).toContainText('−3,13 s');await expect(pbRow).toContainText('−3,89 %');
 await page.getByRole('button',{name:'€ PB taupyklė',exact:true}).click();
 await expect(page.locator('#pb-savings-panel')).toContainText('Elzės PB taupyklė');
 await page.reload();await expect(page.locator('#pb-savings-count')).toHaveText('9');
 // Emulate the same verified history update used by future authorized result refreshes.
 await page.evaluate(()=>{const k='elze-swim-v2',d=JSON.parse(localStorage.getItem(k));d.results.push({id:'pb-test',date:'2026-11-08',event:'50 laisvu',pool:25,time:'33.90',source:'Swimrankings'});localStorage.setItem(k,JSON.stringify(d))});
 await page.reload();await expect(page.locator('#pb-savings-count')).toHaveText('10');await expect(page.locator('#pb-savings-balance')).toContainText('200,00');
 await page.reload();await expect(page.locator('#pb-savings-count')).toHaveText('10');
 await page.evaluate(()=>{const k='elze-swim-v2',d=JSON.parse(localStorage.getItem(k));d.results.push({id:'pb-test-duplicate',date:'2026-11-08',event:'50 laisvu',pool:25,time:'33.90',source:'Swimrankings'});localStorage.setItem(k,JSON.stringify(d))});
 await page.reload();await expect(page.locator('#pb-savings-count')).toHaveText('10');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)).toBe(false);
 expect(errors).toEqual([]);
});
test('Championship bonus is awarded once and does not increase the PB count',async({page})=>{
 await page.goto('http://127.0.0.1:8765/Elze-swim/');
 await expect(page.locator('#pb-savings-balance')).toContainText('180,00');
 await expect(page.locator('#pb-championship-status')).toContainText('dar nepatvirtintas');
 page.once('dialog',d=>d.accept());
 await page.locator('#pb-confirm-championship').click();
 await expect(page.locator('#pb-savings-balance')).toContainText('380,00');
 await expect(page.locator('#pb-savings-count')).toHaveText('9');
 await expect(page.locator('#pb-confirm-championship')).toHaveCount(0);
 await page.reload();await expect(page.locator('#pb-savings-balance')).toContainText('380,00');await expect(page.locator('#pb-savings-count')).toHaveText('9');
});
test('table-only absolute PB and signed per-swimmer comparison',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/Elze-swim/');
 const stored=await page.evaluate(()=>localStorage.getItem('elze-swim-v2'));
 await page.getByRole('button',{name:'▥ Analizė',exact:true}).click();
 const panel=page.locator('#yearly-analysis');
 await page.locator('#yearly-year').selectOption('2026');
 await page.locator('#yearly-event').selectOption('100 krutine');
 await page.locator('#yearly-pool').selectOption('25');
 await expect(panel.locator('thead th')).toHaveCount(10);
 await expect(panel.getByRole('columnheader',{name:'PB',exact:true})).toHaveCount(1);
 await expect(panel.locator('svg')).toHaveCount(0);
 for(const [name,gap] of [['Lėja Būdaitė','+11,47'],['Elija Sniraitė','−13,56'],['Auksė Terskovaitė','−7,77'],['Šarlotė Sofija Ušpuraitė','+4,68']])await expect(panel.locator('tbody tr').filter({hasText:name}).locator('.current-pb-gap')).toHaveText(gap);
 await expect(panel.locator('tbody tr').filter({hasText:'Elzė Oržekauskaitė'}).locator('.current-pb-gap')).toBeEmpty();
 await expect(panel.locator('.current-pb-gap small, .current-pb-gap br')).toHaveCount(0);
 await expect(panel.locator('tbody tr').filter({hasText:'Lėja Būdaitė'}).locator('.current-pb-gap .gap-behind')).toHaveCSS('color','rgb(255, 146, 146)');
 await expect(panel.locator('tbody tr').filter({hasText:'Elija Sniraitė'}).locator('.current-pb-gap .gap-ahead')).toHaveCSS('color','rgb(94, 230, 168)');
 await page.locator('#yearly-year').selectOption('2025');
 const elze=panel.locator('tbody tr').filter({hasText:'Elzė Oržekauskaitė'});
 await expect(elze.locator('td').nth(3)).toContainText('1:32.93');
 await expect(elze.locator('td').nth(3)).toContainText('2026-11-06');
 await expect(elze.locator('td').nth(5)).toContainText('1:40.07');
 await expect(elze).toContainText('−17,87 s');
 await expect(panel.locator('tbody tr').filter({hasText:'Lėja Būdaitė'}).locator('.current-pb-gap')).toContainText('+11,47');
 await page.locator('#yearly-pool').selectOption('50');
 await expect(panel.locator('tbody tr').filter({hasText:'Lėja Būdaitė'}).locator('.current-pb-gap')).toContainText('+19,39');
 expect(await page.evaluate(()=>localStorage.getItem('elze-swim-v2'))).toBe(stored);
 await page.reload();await expect(page.getByRole('heading',{name:'Rezultatai (723)',exact:true})).toBeVisible();
 await expect(page.locator('#pb-savings-count')).toHaveText('9');
 await page.getByRole('button',{name:'▥ Analizė',exact:true}).click();
 await page.setViewportSize({width:390,height:844});await panel.scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)).toBe(false);
 await page.screenshot({path:'screenshots/pb-comparison-mobile.png',fullPage:false});
 await page.evaluate(()=>{const db=JSON.parse(localStorage.getItem('elze-swim-v2'));db.results=[];window.renderYearlyAnalysis(db)});
 expect(await panel.locator('.current-pb-gap').count()).toBeGreaterThan(0);
 expect((await panel.locator('.current-pb-gap').allTextContents()).every(s=>s==='—')).toBe(true);
 expect(await page.evaluate(()=>localStorage.getItem('elze-swim-v2'))).toBe(stored);
 expect(errors).toEqual([]);
});

test('compact swimmer dropdown selects one, two, three, all or only Elze without changing results',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/Elze-swim/');
 const stored=await page.evaluate(()=>localStorage.getItem('elze-swim-v2'));
 const toggle=page.locator('#swim-rival-toggle'),options=page.locator('#swim-rival-options');
 const mainPoints=()=>page.locator('[data-chart-point^="Elzė Oržekauskaitė"]').evaluateAll(es=>es.map(e=>e.getAttribute('data-chart-point')));
 const originalMain=await mainPoints();expect(originalMain.length).toBeGreaterThan(0);
 await expect(page.locator('#top-filters>.swim-toolbar')).toHaveCount(1);
 await expect(toggle).toHaveAccessibleName('Sportininkės Visos sportininkės');await expect(options).toBeHidden();
 await toggle.click();await expect(options.getByRole('checkbox')).toHaveCount(5);
 await options.getByRole('button',{name:'Išvalyti',exact:true}).click();
 await expect(toggle).toContainText('Tik Elzė');await expect(options).toBeVisible();await expect(page.locator('#swim-rival-clear')).toBeFocused();
 await expect(options.locator('input:checked')).toHaveCount(0);expect(await mainPoints()).toEqual(originalMain);
 for(const [i,name] of ['Lėja Būdaitė','Elija Sniraitė','Auksė Terskovaitė'].entries()){
  const check=options.getByRole('checkbox',{name,exact:true});await check.check();
  await expect(check).toBeFocused();await expect(options).toBeVisible();await expect(options.locator('input:checked')).toHaveCount(i+1);
  await expect(toggle).toContainText(i===0?name:'Pasirinkta: '+(i+1));
  expect(await page.locator('[data-chart-point]').evaluateAll((es,n)=>es.some(e=>e.getAttribute('data-chart-point').startsWith(n+' · ')),name)).toBe(true);
 }
 const chosen=await options.locator('input:checked').evaluateAll(es=>es.map(e=>e.dataset.rival));
 await page.locator('#swim-axis').focus();await page.locator('#swim-axis').selectOption('age');await expect(options).toBeHidden();
 await page.locator('#swim-pool-filter').selectOption('50');await page.locator('#swim-event-filter').selectOption('200 krutine');
 await toggle.click();expect(await options.locator('input:checked').evaluateAll(es=>es.map(e=>e.dataset.rival))).toEqual(chosen);
 await options.getByRole('button',{name:'Pasirinkti visas',exact:true}).click();
 await expect(options.locator('input:checked')).toHaveCount(5);await expect(toggle).toContainText('Visos sportininkės');await expect(page.locator('#swim-rival-all')).toBeFocused();
 await page.getByRole('heading',{name:'Elzė Oržekauskaitė',exact:true}).click();await expect(options).toBeHidden();
 for(let i=0;i<3;i++){await toggle.click();await expect(options).toBeVisible();await toggle.click();await expect(options).toBeHidden()}
 expect(await page.evaluate(()=>localStorage.getItem('elze-swim-v2'))).toBe(stored);
 expect(errors).toEqual([]);
});

test('swimmer dropdown keyboard preserves focus through redraw and dismisses with Escape or Tab',async({page})=>{
 await page.goto('http://127.0.0.1:8765/Elze-swim/');
 const toggle=page.locator('#swim-rival-toggle'),options=page.locator('#swim-rival-options');
 await toggle.focus();await toggle.press('Enter');await expect(options).toBeVisible();
 await toggle.press('Tab');await expect(page.locator('#swim-rival-all')).toBeFocused();
 await page.keyboard.press('Tab');await expect(page.locator('#swim-rival-clear')).toBeFocused();
 await page.keyboard.press('Enter');await expect(page.locator('#swim-rival-clear')).toBeFocused();
 await page.keyboard.press('Tab');const first=options.getByRole('checkbox').first();await expect(first).toBeFocused();
 await page.keyboard.press('Space');await expect(first).toBeChecked();await expect(first).toBeFocused();await expect(options).toBeVisible();
 await page.keyboard.press('Space');await expect(first).not.toBeChecked();await expect(first).toBeFocused();
 await page.keyboard.press('Escape');await expect(options).toBeHidden();await expect(toggle).toBeFocused();await expect(toggle).toHaveAttribute('aria-expanded','false');
 await toggle.press('ArrowDown');await expect(page.locator('#swim-rival-all')).toBeFocused();
 await options.getByRole('checkbox').last().focus();await page.keyboard.press('Tab');await expect(options).toBeHidden();
 await toggle.focus();await toggle.press('Space');await expect(options).toBeVisible();await toggle.press('Shift+Tab');await expect(options).toBeHidden();
});

test('swimmer dropdown fits mobile, tablet and desktop while open',async({page})=>{
 await page.goto('http://127.0.0.1:8765/Elze-swim/');
 const toggle=page.locator('#swim-rival-toggle'),options=page.locator('#swim-rival-options');
 for(const width of [320,390,650,768,1024,1440]){
  await page.setViewportSize({width,height:844});await toggle.scrollIntoViewIfNeeded();
  await toggle.click();await expect(options).toBeVisible();
  const bounds=await options.boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);
  if(width===320)await page.screenshot({path:'screenshots/swimmer-dropdown-320.png',fullPage:false});
  const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflowing:[...document.querySelectorAll('body *')].map(el=>{const r=el.getBoundingClientRect(),style=getComputedStyle(el);return {tag:el.tagName,id:el.id,className:typeof el.className==='string'?el.className:'',left:r.left,right:r.right,width:r.width,overflowX:style.overflowX,minWidth:style.minWidth,gridColumns:style.gridTemplateColumns}}).filter(r=>r.width>0&&(r.left< -2||r.right>innerWidth+2)).slice(0,40)}));
  expect(layout.scrollWidth,JSON.stringify({testedWidth:width,...layout},null,2)).toBeLessThanOrEqual(layout.width+2);
  await options.getByRole('button',{name:'Išvalyti',exact:true}).click();await options.getByRole('checkbox').nth(2).check();
  await expect(options).toBeVisible();await expect(options.locator('input:checked')).toHaveCount(1);
  if(width===390||width===1440)await page.screenshot({path:'screenshots/swimmer-dropdown-'+width+'.png',fullPage:false});
  await options.getByRole('button',{name:'Pasirinkti visas',exact:true}).click();await toggle.click();await expect(options).toBeHidden();
 }
});

test('RUN avatar loads the original local static sprite without external images',async({page})=>{
 const externalImages=[];page.on('request',r=>{if(r.resourceType()==='image'&&new URL(r.url()).origin!=='http://127.0.0.1:8765')externalImages.push(r.url())});
 const imageResponse=page.waitForResponse(r=>r.url()==='http://127.0.0.1:8765/Elze-swim/icons/elze-run-avatar.png');
 await page.goto('http://127.0.0.1:8765/Elze-swim/');expect((await imageResponse).ok()).toBe(true);
 const avatar=page.locator('.swim-avatar'),svg=avatar.locator('svg'),sprite=svg.locator('image');
 await expect(svg).toHaveAttribute('viewBox','948 652 315 291');await expect(svg).toHaveAttribute('preserveAspectRatio','xMidYMid meet');
 await expect(sprite).toHaveAttribute('href','./icons/elze-run-avatar.png');await expect(sprite).toHaveAttribute('width','1263');await expect(sprite).toHaveAttribute('height','1245');
 const dimensions=await sprite.evaluate(async el=>{const img=new Image();img.src=el.href.baseVal;await img.decode();return [img.naturalWidth,img.naturalHeight]});expect(dimensions).toEqual([1263,1245]);
 await expect(avatar).toHaveCSS('width','76px');await expect(avatar).toHaveCSS('height','76px');await expect(svg).toBeVisible();
 await page.setViewportSize({width:390,height:844});await expect(avatar).toHaveCSS('width','54px');await expect(avatar).toHaveCSS('height','54px');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)).toBe(false);expect(externalImages).toEqual([]);
});
