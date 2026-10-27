const assert=require('assert');
const {ctx,reset,storage,get,setNow,getWrites,html,load}=require('./live-participation.cjs');
let vibrations=0,audioStarts=0;
ctx.navigator={vibrate:()=>{vibrations++;return true;}};
ctx.window.AudioContext=class{
  constructor(){this.currentTime=1;this.state='running';this.destination={};}
  createOscillator(){return {frequency:{},connect(){},start(){audioStarts++;},stop(){}};}
  createGain(){return {connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}};}
};
function rows(type){return ctx.liveSplitRows(type);}
function candidates(type,place){
 const list=get(type==='beep'?'bl-elim-list':'lr-finish-list');
 return list.children.find(div=>div.children[0].textContent===(type==='beep'?'מספר יציאה ':'#')+place).children[2].children.map(option=>option.value);
}
(async()=>{
 for(const type of ['lr','beep']){
  const initialAudioStarts=audioStarts;
  const e=reset(type);
  while(e.students.length<30){const idx=e.students.length;e.students.push({name:'תלמיד '+idx,idx,state:'active'});}
  ctx.S.groups[1].students=e.students.map(student=>({name:student.name,idHash:'student-'+student.idx,grade:'ט',gender:'ז'}));
  const gradeBefore=JSON.stringify(ctx.S),clockAnchor=e.startTime;
  ctx.liveSetFinishMode(type,'smart');assert.equal(e.finishMode,'smart');
  ctx.confirm=()=>{throw Error('Capture unexpectedly opened a confirmation');};
  for(let i=0;i<10;i++){setNow(2000+i*100);ctx.liveSmartFinish(type);}
  assert.equal(rows(type).length,10);
  setNow(5000);for(let i=0;i<5;i++)ctx.liveSmartFinish(type);
  assert.equal(rows(type).length,15);assert.equal(new Set(rows(type).map(row=>row.place)).size,15);
  assert(rows(type).slice(-5).every(row=>row.elapsedMs===4000));
  assert.equal(e.startTime,clockAnchor);assert(e.running);
  assert.equal(audioStarts,initialAudioStarts,'Muted capture made a sound');
  assert(get(type==='beep'?'bl-smart-counts':'lr-smart-counts').textContent.includes('עדיין משתתפים: 15'));
  assert.equal(get(type==='beep'?'bl-smart-recent':'lr-smart-recent').children.length,5);
  // The regular mode and direct named finish use the exact same sequence.
  ctx.liveSetFinishMode(type,'regular');
  if(type==='beep')ctx.blTapStudent(0);else ctx.lrTapStudent(0);
  assert.equal(rows(type).at(-1).place,16);assert.equal(rows(type).at(-1).studentArrIdx,0);
  ctx.liveSetFinishMode(type,'assign');ctx.liveToggleParticipation(type,29);
  assert(!candidates(type,1).includes('29'));assert(!candidates(type,1).includes('0'));
  const firstTime=rows(type)[0].elapsedMs;
  assert(ctx.liveAssignSplit(type,1,1));assert.equal(ctx.liveAssignSplit(type,2,1),false);
  assert(ctx.liveAssignSplit(type,1,2));assert.equal(rows(type)[0].elapsedMs,firstTime);
  assert.equal(rows(type)[0].place,1);assert.equal(JSON.stringify(ctx.S),gradeBefore);
  // Soft cancellation retains a named result, its measurement, and its number.
  ctx.liveCancelLastFinish(type);const cancelled=rows(type).at(-1);
  assert(cancelled.cancelled);assert.equal(cancelled.studentArrIdx,0);assert.equal(e.students[0].state,'active');assert.equal(e.nextPlace,17);
  assert(ctx.liveRestoreFinish(type));assert.equal(cancelled.cancelled,false);assert.equal(cancelled.studentArrIdx,0);
  ctx.liveCancelFinish(type,16);assert(ctx.liveAssignSplit(type,2,0));assert.equal(ctx.liveRestoreFinish(type,16),false);
  ctx.liveAssignSplit(type,2,null);assert(ctx.liveRestoreFinish(type,16));
  // Retrospective completions are estimated, grouped, and never renumber past IDs.
  const lastAnnounced=e.lastPlace;
  const missed=ctx.liveAddMissedFinishes(type,1,2);assert.equal(missed.length,2);
  assert(missed.every(row=>row.estimated&&row.arrivalGroup===1&&row.elapsedMs===firstTime));
  assert.deepEqual(Array.from(missed,row=>row.place),[17,18]);assert.equal(e.lastPlace,lastAnnounced);
  ctx.liveCancelLastFinish(type);assert(rows(type).find(row=>row.place===16).cancelled);assert(!missed.some(row=>row.cancelled));assert(ctx.liveRestoreFinish(type,16));
  ctx.liveSetArrivalGroup(type,2,'1');assert.equal(rows(type)[1].arrivalGroup,1);
  assert.deepEqual(Array.from(ctx.liveDisplaySplitRows(type).slice(0,4),row=>row.place),[1,2,17,18]);
  assert(!rows(type)[0].estimated);assert(ctx.liveAddMissedFinishes(type,1,31).length===0);
  const label=get(type==='beep'?'bl-elim-list':'lr-finish-list').children.find(div=>div.children[0].textContent===(type==='beep'?'מספר יציאה ':'#')+17).children[3].textContent;
  assert(label.includes('משוער'));assert(label.includes('ללא סדר פנימי'));
  ctx.confirm=()=>true;ctx.liveDeleteSplit(type,17);assert(rows(type).find(row=>row.place===17).cancelled);assert(ctx.liveRestoreFinish(type,17));
  // Restore the smart view, cancelled rows, unnamed rows, and groups together.
  ctx.liveCancelFinish(type,18);ctx.liveSetFinishMode(type,'smart');ctx.saveLiveState();
  const durable=JSON.parse(storage.get('live'));assert.equal(durable.state.finishMode,'smart');
  const before=JSON.stringify(rows(type));setNow(100000);await ctx.restoreLiveState();
  assert.equal(e.finishMode,'smart');assert.equal(JSON.stringify(rows(type)),before);assert.equal(e.nextPlace,19);
  if(type==='beep')e.running=true;
  ctx.liveToggleFinishSound(type);ctx.liveSmartFinish(type);assert(audioStarts>0);ctx.liveToggleFinishSound(type);
  const soundCount=audioStarts;ctx.liveSmartFinish(type);assert.equal(audioStarts,soundCount);
  assert.equal(rows(type).at(-1).place,20);assert.equal(JSON.stringify(ctx.S),gradeBefore);
  // Canceled/anonymous rows never become grades. Assigned estimated results use existing saves.
  ctx.liveAssignSplit(type,17,3);ctx.liveCancelFinish(type,1);
  const expected=ctx.liveFinishRows(type).filter(row=>row.studentArrIdx!=null).length;
  if(type==='beep')ctx.blSaveAll(true);else ctx.lrSaveAll(true);
  assert.equal(getWrites().length,expected);
 }
 assert(vibrations>=30);assert(html.includes('min-height:140px'));assert(html.includes('קו סיום חכם'));
 // Closing the live view does not discard the last saved unnamed/canceled session.
 ctx.saveLiveState();const lastSnapshot=storage.get('live');ctx.LR.running=false;ctx.BL.running=false;ctx.BL.paused=false;
 get('lr-modal').classList.remove('open');get('bl-modal').classList.remove('open');ctx.saveLiveState();assert.equal(storage.get('live'),lastSnapshot);
 // Real score writes preserve improvement-only behavior and carry optional estimate metadata.
 const oldWriter=ctx.writeResult,oldScorer=ctx.getScore,group=ctx.S.groups[1];
 const originalResults=JSON.stringify(group.results);ctx.getScore=(_test,_grade,_gender,value)=>Number(value);
 group.results.run1000[0]={a:'10'};ctx.resKey=()=> 'results';load(['writeResult']);
 const metadata={number:7,estimated:true,arrivalGroup:1,kind:'lr',value:'20'};
 ctx.writeResult(1,'run1000',0,'20','a',metadata);assert.equal(group.results.run1000[0].a,'20');assert.equal(ctx.liveMeasurementNote(group.results.run1000[0]),'משוער — הושלם בדיעבד');
 ctx.writeResult(1,'run1000',0,'5','a',null);assert.equal(group.results.run1000[0].a,'20');assert(group.results.run1000[0]._finish.estimated);
 group.results=JSON.parse(originalResults);ctx.writeResult=oldWriter;ctx.getScore=oldScorer;
 console.log('PASS: 30-student smart mode; ten sequential/five simultaneous clicks; feedback/mute; shared regular/direct sequence; reassignment; cancel/restore/conflicts; estimated missed arrivals/ties; no renumbering; mode/reload preservation; safe result saves.');
})().catch(error=>{console.error(error);process.exitCode=1;});
