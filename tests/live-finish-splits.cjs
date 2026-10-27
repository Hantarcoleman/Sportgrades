const assert=require('assert');
const {ctx,reset,storage,get,html,load,setNow,getWrites}=require('./live-participation.cjs');
load(['lrStop','lrStart','blPause','blResume','blStop','blUndo','blRedo','lrUndo']);
ctx.BL_AUDIO={currentTime:0,play:()=>Promise.resolve(),pause(){}};
ctx.blScheduleNextBeep=()=>{};ctx.blTick=()=>{};
const snapshotGrade=JSON.stringify(ctx.S);
function places(type){return Array.from(ctx.liveSplitRows(type),r=>r.place);}
function candidates(type,place){const target=get(type==='beep'?'bl-elim-list':'lr-finish-list');const row=target.children.find(r=>r.children[0].textContent==='#'+place);return row.children[2].children.map(o=>o.value);}
(async()=>{
 for(const type of ['lr','beep']){
   const e=reset(type);e.students.push({name:'תמר',idx:2,state:'active'},{name:'אור',idx:3,state:'absent'});
   setNow(12345);ctx.liveRecordSplit(type); // #1 anonymous, click-time precision
   assert.equal(ctx.liveSplitRows(type)[0].elapsedMs,11345);
   if(type==='lr')assert.equal(e.finishers[0].rawVal,'0:11.345');
   else assert.equal(e.eliminations[0].result,'3.2');
   assert.equal(ctx.liveSplitRows(type)[0].studentArrIdx,null);
   assert.equal(get(type==='beep'?'bl-split-last':'lr-split-last').textContent,'#1');
   if(type==='lr')ctx.lrTapStudent(1);else ctx.blTapStudent(1); // #2 direct, same sequence
   for(let i=0;i<20;i++)ctx.liveRecordSplit(type); // deliberate rapid taps, no debounce/data loss
   assert.deepEqual(places(type),Array.from({length:22},(_,i)=>i+1));
   assert(!candidates(type,1).includes('1'),'Already-finished student offered');
   assert(!candidates(type,1).includes('3'),'Non-participant offered');
   const first=ctx.liveSplitRows(type)[0],raw=type==='beep'?first.result:first.rawVal;
   assert(ctx.liveAssignSplit(type,1,'0'));assert.equal(e.students[0].state,type==='beep'?'eliminated':'finished');
   assert.equal(ctx.liveAssignSplit(type,3,'0'),false,'Duplicate assignment accepted');
   assert.equal(ctx.liveAssignSplit(type,3,'3'),false,'Absent student accepted');
   assert(ctx.liveAssignSplit(type,1,'2')); // correct wrong name, retaining original split
   assert.equal(e.students[0].state,'active');assert.equal(first.place,1);
   assert.equal(type==='beep'?first.result:first.rawVal,raw);assert.equal(first.elapsedMs,11345);
   assert.equal(getWrites().length,0,'Assignment wrote grades');assert.equal(JSON.stringify(ctx.S),snapshotGrade);
   // Cancelled deletion does nothing; confirmed deletion leaves permanent numbering gaps.
   ctx.confirm=()=>false;ctx.liveDeleteSplit(type,2);assert(places(type).includes(2));
   ctx.confirm=()=>true;ctx.liveDeleteSplit(type,2);assert(!places(type).includes(2));assert.equal(e.students[1].state,'active');
   ctx.liveRecordSplit(type);assert.equal(ctx.liveSplitRows(type).at(-1).place,23);
   ctx.liveDeleteSplit(type,23);ctx.liveRecordSplit(type);assert.equal(ctx.liveSplitRows(type).at(-1).place,24);
   // Undo removes a name, not the measurement or announced place.
   if(type==='beep'){ctx.blUndo();assert.equal(first.studentArrIdx,null);ctx.blRedo();assert.equal(first.studentArrIdx,2);}
   else{ctx.lrUndo();assert.equal(first.studentArrIdx,null);ctx.liveAssignSplit(type,1,2);}
   const rowsBefore=JSON.stringify(ctx.liveSplitRows(type));const counter=e.nextPlace;
   ctx.saveLiveState();const durable=JSON.parse(storage.get('live'));assert.equal(durable.state.nextPlace,counter);
   setNow(999999);await ctx.restoreLiveState();assert.equal(JSON.stringify(ctx.liveSplitRows(type)),rowsBefore);assert.equal(e.nextPlace,counter);
   if(type==='beep')ctx.blResume();
   ctx.liveRecordSplit(type);assert.equal(ctx.liveSplitRows(type).at(-1).place,counter);
   // Pausing/stopping rejects splits; resuming excludes paused wall time.
   setNow(1000999);
   if(type==='beep')ctx.blPause();else ctx.lrStop();
   const count=ctx.liveSplitRows(type).length,elapsed=e.elapsed;ctx.liveRecordSplit(type);assert.equal(ctx.liveSplitRows(type).length,count);
   setNow(2000999);if(type==='beep')ctx.blResume();else ctx.lrStart();
   setNow(2001122);ctx.liveRecordSplit(type);assert.equal(ctx.liveSplitRows(type).at(-1).elapsedMs,elapsed+123);
 }
 // Saving writes only assigned records through existing score paths; anonymous rows stay local.
 const e=reset('lr');setNow(4123);ctx.liveRecordSplit('lr');ctx.liveRecordSplit('lr',0);ctx.lrSaveAll(true);
 assert.equal(getWrites().length,1);assert.equal(getWrites()[0][2],0);assert.equal(getWrites()[0][3],'0:03.123');
 assert.equal(JSON.stringify(ctx.S),snapshotGrade);
 // Candidate lists refresh when a teacher changes participation after a split exists.
 const roster=reset('lr');ctx.liveRecordSplit('lr');ctx.liveToggleParticipation('lr',0);
 assert(!candidates('lr',1).includes('0'));ctx.liveToggleParticipation('lr',0);assert(candidates('lr',1).includes('0'));
 // Real beep timeline lookup catches up after a background gap before capture.
 ctx.BEEP_TIMELINE=[{cumMs:1000,level:1,shuttle:1,cumDist:20},{cumMs:2000,level:1,shuttle:2,cumDist:40},{cumMs:3000,level:2,shuttle:1,cumDist:60}];
 load(['blCurrentPos','parseTime']);const beep=reset('beep');setNow(2500);ctx.liveRecordSplit('beep');
 assert.equal(beep.eliminations[0].result,'1.2');setNow(9000);ctx.liveRecordSplit('beep');assert.equal(beep.eliminations[1].result,'2.1');
 ctx.blSaveAll(true);assert.equal(getWrites().length,0,'Anonymous beep split saved as a student result');
 assert.equal(ctx.parseTime('0:03.123'),3.123);
 // Even deleting every split at time zero must retain the previously announced counter.
 const deleted=reset('lr');setNow(1000);ctx.liveRecordSplit('lr');ctx.liveDeleteSplit('lr',1);deleted.running=false;deleted.elapsed=0;
 ctx.saveLiveState();assert.equal(JSON.parse(storage.get('live')).state.nextPlace,2);
 // Restored legacy rows receive places without reallocating existing places.
 deleted.finishers=[{studentArrIdx:0,studentIdx:0,rawVal:'1:00'}, {place:7,studentArrIdx:null}];deleted.nextPlace=12;
 assert.deepEqual(places('lr'),[1,7]);assert.equal(deleted.nextPlace,12);
 assert(html.includes('min-height:64px'));assert(html.includes('touch-action:manipulation'));assert(html.includes('aria-live="assertive"'));
 console.log('PASS: rapid anonymous/direct splits; immutable places; exact ms/beep capture; candidate exclusions; reassignment; confirmed deletion gaps; undo/redo; reload/background anchors; pause/resume; save isolation; legacy hydration; touch controls.');
})().catch(e=>{console.error(e);process.exitCode=1;});
