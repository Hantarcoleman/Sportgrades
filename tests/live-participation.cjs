const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'../client/pe-grading-app.html'),'utf8');
function fn(name){const start=html.search(new RegExp('(?:async )?function '+name+'\\('));assert(start>=0,name);const lineEnd=html.indexOf('\n',start);return html.slice(start,html.slice(start,lineEnd).trim().endsWith('}')?lineEnd:html.indexOf('\n}',start)+2);}
const nodes=new Map();
class Element{
  constructor(tag='div'){this.tagName=tag;this.style={};this.dataset={};this.children=[];this.attrs={};this.value='';this.className='';this.textContent='';
    this.classList={contains:c=>this.className.split(' ').includes(c),add:c=>{if(!this.className.split(' ').includes(c))this.className+=' '+c;},remove:c=>{this.className=this.className.split(' ').filter(v=>v!==c).join(' ');},toggle:(c,on)=>{const list=new Set(this.className.split(' ').filter(Boolean));on?list.add(c):list.delete(c);this.className=[...list].join(' ');}};
  }
  set id(v){this._id=v;nodes.set(v,this);}get id(){return this._id;}
  set innerHTML(v){this._html=v;this.children=[];for(const m of v.matchAll(/id="([^"]+)"/g))get(m[1]);}
  get innerHTML(){return this._html||'';}
  setAttribute(k,v){this.attrs[k]=v;}
  appendChild(e){e.parent=this;this.children.push(e);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this);nodes.delete(this.id);}
  querySelector(selector){if(selector==='.bl-card-name')return {textContent:(this.innerHTML.match(/class="bl-card-name">([^<]*)/)||[])[1]||''};return null;}
  querySelectorAll(selector){return selector==='.bl-card'?this.children:[];}
  click(){let stopped=false;const event={stopPropagation(){stopped=true;}};this.onclick?.(event);if(!stopped)this.parent?.onclick?.(event);}
}
function get(id){if(!nodes.has(id)){const e=new Element();e.id=id;}return nodes.get(id);}
let now=100000,writes=[],saves=0;
const storage=new Map();
const ctx={console,Date:class extends Date{static now(){return now;}},Math,Number,String,Object,Array,JSON,
 document:{createElement:tag=>new Element(tag),getElementById:get,querySelector:()=>null,
   querySelectorAll:selector=>selector.includes('lr-active-grid')?get('lr-active-grid').children:[],addEventListener(){}},
 window:{addEventListener(){}},localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)||null,removeItem:k=>storage.delete(k)},
 SG_USER:{id:'teacher'},CUR:{gid:1,test:'run1000',semester:'a'},LIVE_LS_KEY:'live',
 S:{groups:{1:{_sbId:42,students:[{name:'אביב',idHash:'a'},{name:'דנה',idHash:'b'}],results:{run1000:{0:{a:'5:00'}},beep:{0:{a:'4.2'}}}}}},
 BL:{},LR:{},TMR:{},SR:{},SRL:{},
 blCurrentScoreFor:()=>85,blScoreClass:()=> 's-high',blUpdateProtocolDisplay(){ctx.activeBeep=ctx.BL.students.filter(s=>s.state==='active').length;},
 blRenderElimRow(){},blUpdateUndoRedo(){},blUpdateCard(){},blScoreForStudent:()=>85,blCurrentPos:()=>({level:3,shuttle:2,cumDist:300}),encodeBeepResult:(l,s)=>l+'.'+s,
 getScore:()=>85,getTbl:()=>({}),fmtTime:s=>String(s),lrLabel:()=>({tap:'Finish'}),lrRenderFinishRow(){},
 writeResult:(...args)=>writes.push(args),saveState(){saves++;},renderTable(){},toast:m=>ctx.message=m,rgAddResult:(...args)=>writes.push(args),
 setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setInterval:()=>1,clearInterval(){},
 lrUpdatePotential(){},lrUpdateCardScores(){},
 openBeepLive(){get('bl-modal').className='open';},_doCloseBeepLive(){},
 openLongRunLive(){get('lr-modal').className='open';},_doCloseLongRunLive(){},
 openTimer(){},_doCloseTimer(){},openSprintLive(){},_doSpClose(){},openSkipropeLive(){},_doSrlClose(){},
 blRenderElimList(){},blUpdateScoreBar(){},blRenderResults(){},blResume(){},confirm:()=>true,BL_AUDIO:{},BL_INTRO_MS:12300,
};vm.createContext(ctx);
const liveHelpers=['testHistoryEngine','testHistoryStudentKey','startTestHistorySession','startManualHistorySession','registerTestHistorySession','classTestHistory','measurementAttemptMetadata','recordedTestAttempts','betterTestAttempt','liveExternalId','liveAssignExternal','liveSaveExternalSplits','savedExternalResults','exportSafeHTML','liveRenderNonParticipants','liveFinishNumberLabel','liveFinishMetadata','liveMeasurementNote','liveEstimatedTests','liveSetFinishMode','liveFinishRows','liveDisplaySplitRows','liveRenderSmartFinish','liveToggleFinishSound','liveFinishFeedback','liveSmartFinish','liveCancelFinish','liveCancelLastFinish','liveRestoreFinish','liveSetArrivalGroup','liveAddMissedFinishes'];
vm.runInContext('let LIVE_FINISH_AUDIO=null;',ctx);
for(const name of [...liveHelpers,'liveSplitEngine','liveSplitRows','liveSplitTime','liveUpdateSplitControl','liveSetSplitStudent','liveRecordSplit','liveAssignSplit','liveDeleteSplit','liveRenderSplitRow','liveRenderSplits','liveRefreshSplits','liveUndoSplitAssignment','liveToggleParticipation','liveParticipationButton','blRenderActiveGrid','blFilterGrid','blTapStudent','lrRenderGrid','lrFilterGrid','lrUpdateCount','lrTapStudent','blSaveAll','blSaveAllFull','blSaveAllRG','lrSaveAll','lrSaveAllFull','liveEngines','saveLiveState','restoreLiveState','lrTick'])vm.runInContext(fn(name),ctx);
const students=()=>[{name:'אביב',idx:0,state:'active'},{name:'דנה',idx:1,state:'active'}];
const existing=JSON.stringify(ctx.S);
function reset(type){
 get('bl-screen-results').style.display='none';
 for(const id of ['lr-modal','bl-modal'])get(id).className='';
 writes=[];ctx.BL={gid:1,running:false,students:[],eliminations:[]};ctx.LR={gid:1,running:false,students:[],finishers:[]};
 const engine={gid:1,running:true,startTime:1000,elapsed:99000,students:students(),finishers:[],eliminations:[],undoStack:[],redoStack:[],testId:type==='lr'?'run1000':'beep',absentMode:false};
 ctx.CUR.test=engine.testId;ctx[type==='lr'?'LR':'BL']=engine;get(type==='lr'?'lr-modal':'bl-modal').className='open';return engine;
}
async function runParticipationTests(){
 for(const type of ['lr','beep']){
   const engine=reset(type),render=type==='lr'?ctx.lrRenderGrid:ctx.blRenderActiveGrid;
   render();const grid=get(type==='lr'?'lr-active-grid':'bl-active-grid');
   assert.equal(grid.children.length,2);
   const button=grid.children[0].children[0];assert.equal(button.tagName,'button');assert.equal(button.type,'button');
   button.click();assert.equal(engine.students[0].state,'absent');assert(engine.running);assert.equal(engine.startTime,1000);
   assert.equal(engine.finishers.length+engine.eliminations.length,0,'Click bubbled into result recording');
   const excluded=get(type==='lr'?'lr-nonparticipants-list':'bl-nonparticipants-list');
   assert.equal(grid.children.length,1);assert.equal(excluded.children.length,1);
   assert.equal(excluded.children[0].children[1].attrs['aria-pressed'],'true');
   assert.equal(type==='lr'?get('lr-active-remain').textContent:ctx.activeBeep,type==='lr'?'1 ממתינים':1);
   // Tapping the excluded card cannot record a result.
   excluded.children[0].click();assert.equal(engine.finishers.length+engine.eliminations.length,0);
   render();assert.equal(excluded.children[0].children[1].textContent,'החזר למבחן');
   assert.equal(JSON.parse(storage.get('live')).state.students[0].state,'absent');
   await ctx.restoreLiveState();assert.equal(engine.students[0].state,'absent');
   assert.equal(engine.running,type==='lr'); // Beep reload intentionally restores paused for audio.
   // Rejoin without restarting the clock; excluded scores remain untouched.
   const anchor=engine.startTime;excluded.children[0].children[1].click();assert.equal(engine.students[0].state,'active');assert.equal(engine.startTime,anchor);
   assert.equal(JSON.stringify(ctx.S),existing);assert.equal(writes.length,0);
   // Existing session results cannot be invalidated by the participation action.
   if(type==='lr'){engine.students[0].state='finished';engine.finishers.push({studentArrIdx:0,studentIdx:0,rawVal:'123'});}
   else{engine.students[0].state='eliminated';engine.eliminations.push({studentArrIdx:0,studentIdx:0,level:3,shuttle:2});}
   const completed=JSON.stringify(engine);ctx.liveToggleParticipation(type,0);assert.equal(JSON.stringify(engine),completed);
 }
 // A non-participant never writes a zero/result, even if stale result rows exist.
 for(const name of ['lrSaveAll','lrSaveAllFull','blSaveAll','blSaveAllFull','blSaveAllRG']){
   const type=name.startsWith('lr')?'lr':'beep',engine=reset(type);
   engine.students[0].state='absent';
   engine.finishers=[{studentArrIdx:0,studentIdx:0,rawVal:'111'},{studentArrIdx:1,studentIdx:1,rawVal:'222'}];
   engine.eliminations=[{studentArrIdx:0,studentIdx:0,level:3,shuttle:1},{studentArrIdx:1,studentIdx:1,level:4,shuttle:2}];
   ctx[name](true);assert.equal(writes.length,1,name);assert.equal(JSON.stringify(ctx.S),existing);
 }
 // Exercise the actual random-group wrapper, rather than only its base function.
 const wrapperStart=html.indexOf('const _lrSaveAll_orig = lrSaveAll;');
 const wrapperEnd=html.indexOf('// ── Random Metro / Timer:',wrapperStart);
 assert(wrapperStart>=0&&wrapperEnd>wrapperStart);
 vm.runInContext(html.slice(wrapperStart,wrapperEnd),ctx);
 const random=reset('lr');random.gid='__random__';random.students[0].state='absent';
 random.finishers=[{studentArrIdx:0,rawVal:'111'},{studentArrIdx:1,rawVal:'222'}];
 ctx.lrSaveAll(true);assert.equal(writes.length,1);assert.equal(writes[0][0],'דנה');
 // Other runners still record the current wall-clock time while one is excluded.
 const engine=reset('lr');ctx.liveToggleParticipation('lr',0);now+=5000;ctx.lrTapStudent(1);
 assert.equal(engine.finishers.length,1);assert.equal(engine.finishers[0].studentIdx,1);assert.equal(engine.finishers[0].rawVal,'1:44.000');assert(engine.running);
 // Legacy beep absence mode follows the same persistence path.
 const beep=reset('beep');beep.absentMode=true;ctx.blTapStudent(0);assert.equal(beep.students[0].state,'absent');assert.equal(JSON.parse(storage.get('live')).state.students[0].state,'absent');
 assert(/\.live-participation-btn\{[^}]*min-height:44px;[^}]*min-width:44px;[^}]*touch-action:manipulation/.test(html));
 console.log('PASS: live LR/beep participation; native button event isolation; rejoin; counters; rerender/reload persistence; clock continuity; existing results preserved; every save path excludes absent students; touch target size.');
}
module.exports={ctx,reset,storage,get,html,Element,load:names=>names.forEach(name=>vm.runInContext(fn(name),ctx)),setNow:value=>{now=value;},getWrites:()=>writes};
if(require.main===module)runParticipationTests().catch(e=>{console.error(e);process.exitCode=1;});
