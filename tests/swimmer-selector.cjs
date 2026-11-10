const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../app-v3.js'),'utf8');
function setup(competitors){
 const nodes={},listeners={},db={competitors,results:[{time:'1:32.93'}],cResults:[{time:'1:21.46'}]};
 let redraws=0,document;
 const node=(id='')=>({id,dataset:{},attributes:{},focus(){document.activeElement=this},setAttribute(k,v){this.attributes[k]=v}});
 for(const id of ['swim-rival-picker','swim-rival-toggle','swim-rival-options','swim-rival-all','swim-rival-clear'])nodes[id]=node(id);
 const checks=competitors.map(c=>({...node(),dataset:{rival:c.id},checked:true}));
 nodes['swim-rival-picker'].contains=target=>Object.values(nodes).includes(target)||checks.includes(target);
 nodes['swim-rival-picker'].querySelectorAll=()=>checks;
 document={activeElement:null,getElementById:id=>nodes[id],addEventListener(type,fn){(listeners[type]||=[]).push(fn)}};
 const context={document,db,draw(){redraws++}};vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('const $='),source.indexOf('\nlet db;'))+'\n'+source.slice(source.indexOf('let selectedEvent='),source.indexOf('function draw(){'))+'\nthis.api={markup:rivalPickerMarkup,bind:bindRivalPicker,selected:()=>Array.from(selectedRivals)}',context);
 context.api.bind();
 return {api:context.api,nodes,checks,listeners,db,document,redraws:()=>redraws};
}
const names=['Viltė Ruzgailaitė','Elija Sniraitė','Lėja Būdaitė','Šarlotė Sofija Ušpuraitė','Auksė Terskovaitė'];
const t=setup(names.map((name,i)=>({id:'r'+i,name}))),before=JSON.stringify(t.db);
assert.match(t.api.markup(),/Visos sportininkės/);assert.match(t.api.markup(),/aria-expanded="false"/);assert.match(t.api.markup(),/ hidden>/);
assert.equal((t.api.markup().match(/ checked/g)||[]).length,5);
t.nodes['swim-rival-toggle'].onclick();assert.equal(t.nodes['swim-rival-options'].hidden,false);
t.nodes['swim-rival-clear'].onclick();assert.equal(t.api.selected().length,0);assert.match(t.api.markup(),/Tik Elzė/);assert.match(t.api.markup(),/aria-expanded="true"/);
for(let i=0;i<3;i++){t.checks[i].checked=true;t.checks[i].onchange();assert.equal(t.api.selected().length,i+1);assert.match(t.api.markup(),i===0?/Viltė Ruzgailaitė<\/span>/:new RegExp('Pasirinkta: '+(i+1)))}
t.checks[1].checked=false;t.checks[1].onchange();assert.deepEqual(Array.from(t.api.selected()),['r0','r2']);
t.nodes['swim-rival-all'].onclick();assert.equal(t.api.selected().length,5);assert.equal(t.redraws(),6);assert.equal(JSON.stringify(t.db),before);
let prevented=0,stopped=0;
t.nodes['swim-rival-picker'].onkeydown({key:'Escape',preventDefault(){prevented++},stopPropagation(){stopped++}});
assert.equal(t.nodes['swim-rival-options'].hidden,true);assert.equal(t.document.activeElement,t.nodes['swim-rival-toggle']);assert.equal(prevented,1);assert.equal(stopped,1);
t.nodes['swim-rival-toggle'].onkeydown({key:'ArrowDown',preventDefault(){prevented++}});assert.equal(t.document.activeElement,t.nodes['swim-rival-all']);assert.equal(t.nodes['swim-rival-options'].hidden,false);
t.listeners.pointerdown[0]({target:t.checks[0]});assert.equal(t.nodes['swim-rival-options'].hidden,false);
t.listeners.pointerdown[0]({target:{}});assert.equal(t.nodes['swim-rival-options'].hidden,true);
t.nodes['swim-rival-toggle'].onclick();t.listeners.focusin[0]({target:{}});assert.equal(t.nodes['swim-rival-options'].hidden,true);
t.api.bind();t.api.bind();assert.equal(t.listeners.pointerdown.length,1);assert.equal(t.listeners.focusin.length,1);
const empty=setup([]);assert.match(empty.api.markup(),/Tik Elzė/);empty.nodes['swim-rival-all'].onclick();assert.equal(empty.api.selected().length,0);
const escaped=setup([{id:'x"/><img src=x>',name:'<img src=x onerror=alert(1)>'}]);assert.ok(!escaped.api.markup().includes('<img'));assert.match(escaped.api.markup(),/&lt;img/);assert.match(escaped.api.markup(),/x&quot;\/&gt;&lt;img/);
console.log('Swimmer dropdown: all/none/one/two/three selections, unchanged data, escaped markup, keyboard and dismissal handlers passed');

// The RUN illustration is reused byte-for-byte, showing only its original static frame.
const png=fs.readFileSync(path.join(__dirname,'../icons/elze-run-avatar.png'));
assert.equal(require('node:crypto').createHash('sha256').update(png).digest('hex'),'e1b964a64476fc2a263680adab5410361a0d35254a59603579a16c873f651b0a');
assert.equal(png.readUInt32BE(16),1263);assert.equal(png.readUInt32BE(20),1245);
assert.ok(source.includes('viewBox="948 652 315 291" preserveAspectRatio="xMidYMid meet"'));
assert.ok(source.includes('<image href="./icons/elze-run-avatar.png" x="0" y="0" width="1263" height="1245"/>'));
assert.ok(!source.includes('<div class="swim-avatar">E</div>'));
console.log('RUN avatar: original PNG checksum/dimensions and exact local static sprite viewport passed');
