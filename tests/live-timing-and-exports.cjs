const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../client/pe-grading-app.html'),'utf8');
let scripts=0;for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
 if(m[1].trim()){new vm.Script(m[1]);scripts++;}
}
function fn(name){const start=html.search(new RegExp('(?:async )?function '+name+'\\('));assert(start>=0,name);return html.slice(start,html.indexOf('\n}',start)+2);}
let now=100000,raf=0;const elements=new Map(),storage=new Map();
const el=id=>{if(!elements.has(id))elements.set(id,{style:{},classList:{contains:()=>false},querySelectorAll:()=>[],appendChild(){},textContent:'',innerHTML:''});return elements.get(id);};
const ctx={console,Date:class extends Date{static now(){return now;}},Math,Number,String,Object,Array,Set,JSON,
 document:{getElementById:el,addEventListener(){},hidden:false,createElement:()=>({style:{}})},
 window:{addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
 requestAnimationFrame:()=>++raf,cancelAnimationFrame(){},setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},
 SG_USER:{id:'teacher'},CUR:{gid:1,test:'run1000',semester:'a'},S:{groups:{}},LIVE_LS_KEY:'live',
 toast(){},getTbl:()=>({unit:'s'}),customTest:()=>null,TEST_LIST:[{id:'run1000',label:'Run'}],resKey:()=> 'results',
 getScore:(_id,_gr,_ge,v)=>Number(v),calcFinal:v=>v,_pdfScoreColor:()=>'',renderLiveScore(){},renderClock(){},
 startTestHistorySession:()=>({id:'test-session',startedAt:now}),lrUpdatePotential(){},lrUpdateCardScores(){},liveUpdateSplitControl(){},blUpdateProtocolDisplay(){},srlUpdatePotential(){},srlEnd(){ctx.SRL.running=false;},
 fmtTime:s=>String(s),XLSX:{utils:{aoa_to_sheet:rows=>{ctx.sheets.push(rows);return{};},book_new:()=>({}),book_append_sheet(){}},writeFile(){}},sheets:[],
 _pdfDownloadFromHtml:html=>{ctx.pdf=html;return Promise.resolve();},BEEP_TIMELINE:[{cumMs:1000},{cumMs:2000},{cumMs:3000}],
 TMR:{running:true,startTime:1000,elapsed:0,splits:[]},LR:{running:true,startTime:1000,elapsed:0,students:[]},BL:{running:true,startTime:1000,elapsed:0},
 SR:{running:true,startTime:1000},SRL:{running:true,deadline:61000},
};vm.createContext(ctx);
const names=['liveMeasurementNote','liveEstimatedTests','savedExternalResults','exportSafeHTML','externalExcelRows','appendExternalExcelSheet','testAchievementPDFRows','exportStudents','exportExcel','exportFullExcel','exportPDF','exportFullPDF','exportAllExcel','timerTick','timerSplit','lrTick','blCurrentPos','srlTick'];
for(const n of names)vm.runInContext(fn(n),ctx);
ctx.S.groups[1]={name:'Group',classes:'ט1',students:[{name:'תמר',grade:'ט',cls:'1',gender:'נ',id:'333'},{name:'אביב',grade:'ט',cls:'1',gender:'ז',id:'111'},{name:'דנה',grade:'ט',cls:'1',gender:'נ',id:'222'}],results:{run1000:{0:{a:'30'},1:{a:'10'},2:{a:'20'}}}};
ctx.S.customTests={};const before=JSON.stringify(ctx.S);
for(const name of ['exportExcel','exportFullExcel','exportAllExcel']){
 ctx.sheets=[];vm.runInContext(name+'()',ctx);
 const sheet=ctx.sheets[0],offset=name==='exportFullExcel'?0:1;
 assert.deepEqual(sheet.slice(1).map(r=>r[offset]),['אביב','דנה','תמר'],name);
 if(name==='exportExcel')assert.deepEqual(sheet.slice(1).map(r=>r[4]),['10','20','30']);
 assert.equal(JSON.stringify(ctx.S),before,'Export mutated source');
}
for(const name of ['exportPDF','exportFullPDF']){vm.runInContext(name+'()',ctx);assert(ctx.pdf.indexOf('אביב')<ctx.pdf.indexOf('דנה'));assert(ctx.pdf.indexOf('דנה')<ctx.pdf.indexOf('תמר'));assert.equal(JSON.stringify(ctx.S),before);}
// Estimated results remain numeric/scorable while their provenance is explicit in exports.
const estimatedResult=ctx.S.groups[1].results.run1000[0];estimatedResult._finish={estimated:true,value:'30'};
for(const name of ['exportExcel','exportFullExcel','exportAllExcel']){
 ctx.sheets=[];ctx[name]();assert(JSON.stringify(ctx.sheets).includes('משוער'),name+' lost estimate provenance');
}
for(const name of ['exportPDF','exportFullPDF']){ctx[name]();assert(ctx.pdf.includes('(משוער)'),name+' lost estimate provenance');}
estimatedResult.a='31';assert.equal(ctx.liveMeasurementNote(estimatedResult),'');estimatedResult.a='30';delete estimatedResult._finish;
assert.equal(JSON.stringify(ctx.S),before);
vm.runInContext('timerTick();lrTick()',ctx);assert.equal(ctx.TMR.elapsed,99000);assert.equal(ctx.LR.elapsed,99000);
now+=180000;vm.runInContext('timerTick();lrTick()',ctx);assert.equal(ctx.TMR.elapsed,279000);assert.equal(ctx.LR.elapsed,279000);
vm.runInContext('blCurrentPos()',ctx);assert.equal(ctx.BL.beepIdx,3);
now=31000;vm.runInContext('srlTick()',ctx);assert.equal(ctx.SRL.timeLeft,30);
now=65000;vm.runInContext('srlTick()',ctx);assert.equal(ctx.SRL.timeLeft,0);assert.equal(ctx.SRL.running,false);
// Action-time measurement must not depend on a recently rendered frame.
ctx.TMR={running:true,startTime:1000,elapsed:0,splits:[],testId:'run1000'};ctx.renderSplitRow=()=>{};
vm.runInContext('timerSplit()',ctx);assert.equal(ctx.TMR.splits[0].cumMs,64000);
// Durability: preserve wall-clock anchors, stopped sessions, inputs, and user isolation.
Object.assign(ctx,{
 openBeepLive(){},_doCloseBeepLive(){},openLongRunLive(){},_doCloseLongRunLive(){},
 openTimer(){},_doCloseTimer(){},openSprintLive(){},_doSpClose(){},openSkipropeLive(){},_doSrlClose(){},
 lrRenderGrid(){},lrRenderFinishRow(){},liveRenderSplits(){},liveUpdateSplitControl(){},setLrRound(){},
});
for(const n of ['liveEngines','saveLiveState','restoreLiveState','timerStart','lrStart'])vm.runInContext(fn(n),ctx);
function show(id){for(const [key,e] of elements)e.classList.contains=()=>key===id;el(id).classList.contains=()=>true;}
ctx.S.groups[1]._sbId=42;ctx.TMR={running:true,startTime:1000,elapsed:0,gid:1,testId:'run1000',splits:[]};
show('timer-modal');ctx.saveLiveState();const saved=storage.get('live');assert(saved);
now=121000;ctx.TMR.running=false;
(async()=>{
 await ctx.restoreLiveState();assert.equal(ctx.TMR.elapsed,120000);assert(ctx.TMR.running);
 ctx.TMR.running=false;ctx.TMR.elapsed=5000;ctx.saveLiveState();now+=90000;
 await ctx.restoreLiveState();assert.equal(ctx.TMR.elapsed,5000);assert.equal(ctx.TMR.running,false);
 ctx.LR={running:true,startTime:1000,elapsed:0,gid:1,testId:'run1000',students:[],finishers:[],undoStack:[]};show('lr-modal');ctx.saveLiveState();
 now+=60000;await ctx.restoreLiveState();assert.equal(ctx.LR.elapsed,now-1000);assert(ctx.LR.running);
 ctx.LR.running=false;ctx.LR.elapsed=7000;ctx.saveLiveState();now+=60000;
 await ctx.restoreLiveState();assert.equal(ctx.LR.elapsed,7000);assert.equal(ctx.LR.running,false);
 const userSnapshot=storage.get('live');ctx.SG_USER.id='other';ctx.LR.elapsed=888;
 await ctx.restoreLiveState();assert.equal(ctx.LR.elapsed,888);assert.equal(storage.get('live'),userSnapshot);
 ctx.SG_USER.id='teacher';ctx.S.groups[1].students.reverse();await ctx.restoreLiveState();assert.equal(ctx.LR.elapsed,888);
 // Mashov export keeps the original name/ID/result tuples without enriching the group.
 ctx.S.groups[1].students.reverse();const original=JSON.stringify(ctx.S);
 const data={rows:[['Title']],struct:{},entries:[
   {name:'תמר',id:'333',idHash:'hash3'},
   {name:'דנה',id:'222',idHash:'hash2'},
   {name:'אביב',id:'111',idHash:'hash1'},
 ]};
 Object.assign(ctx,{
   readMashovWorkbook:async()=>data,setIdMapEntry(){throw Error('Export changed local ID map');},
   _finalScoreForStudent:(g,idx)=>Number(g.results.run1000[idx].a),
   normGrade:g=>g,confirm:()=>true,Blob,URL:{createObjectURL:()=>'',revokeObjectURL(){}},
 });
 ctx.document.createElement=()=>({style:{},click(){},remove(){}});ctx.document.body={appendChild(){}};
 ctx.XLSX.write=()=>new Uint8Array();
 for(const n of ['importMashovIntoGroup','exportMashov'])vm.runInContext(fn(n),ctx);
 ctx.sheets=[];await ctx.exportMashov(null,'source.xlsx',1,'run1000','a');
 assert.deepEqual(ctx.sheets[0].slice(3,6).map(r=>[r[1],r[2],r[5]]),[['111','אביב',10],['222','דנה',20],['333','תמר',30]]);
 assert.equal(JSON.stringify(ctx.S),original);
 // Pause/resume excludes paused time, including fractional seconds in minute tests.
 vm.runInContext(fn('srlTogglePause'),ctx);ctx.SRL={running:true,paused:false,deadline:now+25500};
 ctx.srlTogglePause();assert.equal(ctx.SRL.remainingMs,25500);now+=90000;
 ctx.srlTogglePause();assert.equal(ctx.SRL.deadline,now+25500);
 now+=1000;ctx.srlTick();assert.equal(ctx.SRL.remainingMs,24500);
 console.log('PASS: '+scripts+' inline scripts parse; Hebrew Excel/PDF ordering; result association; source unchanged; background gaps; action-time splits; countdown expiry; running/stopped reloads; user/roster isolation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
