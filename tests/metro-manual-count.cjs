const assert=require('assert');
const {ctx,get,load,getWrites,html}=require('./live-participation.cjs');
ctx.CUR.test='pushups_metro';
ctx.MTR={gid:1,playing:false,testing:false,manualCount:false,bpm:60,beat:0,nextBeatTime:0,reps:0,halfReps:0,splits:[],round:'a'};
let callbacks=[],clicks=0;
ctx.setTimeout=(fn,delay)=>{callbacks.push({fn,delay});return callbacks.length;};
ctx.getAudioCtx=()=>({currentTime:0,state:'running'});ctx.playClick=()=>{clicks++;};
ctx.metroRenderSplitRow=()=>{};
load(['metroUpdateManualCountControls','metroSetManualCount','metroManualRep','metroStartTest','metroAdjust','metroSplit','metroSchedule','metroStop','metroStopTest','metroSaveAll','metroNewTest']);
const e=ctx.MTR;
function beat(){callbacks=[];e.playing=true;e.nextBeatTime=0;ctx.metroSchedule();assert(callbacks.length);callbacks.shift().fn();}
// Default automatic behavior is unchanged: first half rep, then half a rep per beat.
ctx.metroStartTest();assert.equal(e.reps,.5);beat();assert.equal(e.reps,1);ctx.metroManualRep();assert.equal(e.reps,1);
// A fresh manual test starts at zero and every click adds one full repetition.
ctx.metroSetManualCount(true);ctx.metroStartTest();assert.equal(e.reps,0);assert(!get('metro-manual-rep-btn').disabled);
for(let i=0;i<20;i++)ctx.metroManualRep();assert.equal(e.reps,20);assert.equal(e.halfReps,40);
const before=e.reps;beat();beat();assert.equal(e.reps,before,'Automatic beats leaked into manual count');assert(clicks>0,'Manual mode should not disable metronome playback');
// A scheduled automatic callback checks the selected mode at execution time.
ctx.metroSetManualCount(false);callbacks=[];e.nextBeatTime=0;ctx.metroSchedule();const queued=callbacks.shift();ctx.metroSetManualCount(true);queued.fn();assert.equal(e.reps,before);
ctx.metroManualRep();assert.equal(e.reps,21);
// Switching modes retains the count and existing split measurements.
ctx.metroSplit();assert.equal(e.splits[0].rawVal,'21');assert.equal(e.splits[0].displayVal,'21');
e.splits[0].studentIdx=0;e.splits[0].name=ctx.S.groups[1].students[0].name;
ctx.metroSaveAll(true);const written=getWrites().at(-1);assert.equal(written[1],'pushups_metro');assert.equal(written[2],0);assert.equal(written[3],'21');
ctx.metroSetManualCount(false);beat();assert.equal(e.reps,21.5);assert.equal(e.splits[0].rawVal,'21');
ctx.metroSetManualCount(true);ctx.metroManualRep();assert.equal(e.reps,22.5,'Mode switch silently rounded or reset the count');
ctx.metroStopTest();const stopped=e.reps;assert(get('metro-manual-rep-btn').disabled);ctx.metroManualRep();assert.equal(e.reps,stopped);
// New manual test resets count but retains the chosen manual preference.
ctx.metroPlay=()=>{e.playing=true;};ctx.metroNewTest();assert.equal(e.reps,0);assert(e.manualCount);assert(get('metro-manual-rep-btn').disabled);
ctx.metroStartTest();ctx.metroManualRep();assert.equal(e.reps,1);assert.equal(get('metro-reps').textContent,1);
assert(html.includes('min-height:76px'));assert(html.includes('onclick="metroManualRep()"'));assert(html.includes('touch-action:manipulation'));
console.log('PASS: automatic half-rep behavior; manual zero start/+1 rapid clicks; no beat double-counting; queued callback isolation; mode switch/split preservation; unchanged save value; disabled after stop; new test reset; touch button.');
