const assert=require('assert');
const {ctx,reset,storage,get,setNow,load,html}=require('./live-participation.cjs');
ctx.LIVE_LS_KEY='sg_live_v1';ctx.S.groups[1].name='קבוצה';
ctx._parseRoute=()=>null;ctx.document.documentElement={removeAttribute(){}};ctx.setCUR=patch=>Object.assign(ctx.CUR,patch);
ctx.TEST_LIST=[{id:'run1000',label:'ריצה'},{id:'beep',label:'ביפ'}];ctx.showView=()=>{};ctx._liveModalClose=()=>{};
let opened=0;ctx.openLongRunLive=()=>{opened++;get('lr-modal').className='open';};ctx.openBeepLive=()=>{opened++;get('bl-modal').className='open';};
ctx.BL_AUDIO={pause(){},currentTime:0};
load(['restoreRoute','lrStart','lrStop','_doCloseLongRunLive','blEnd','blBackToLive']);
function snapshot(){return JSON.parse(storage.get(ctx.LIVE_LS_KEY));}
(async()=>{
 for(const type of ['lr','beep']){
  const e=reset(type);setNow(10000);ctx.liveRecordSplit(type);ctx.liveRecordSplit(type,0);
  if(type==='lr')ctx.lrSaveAll(false);else ctx.blSaveAll(false);
  const rows=JSON.stringify(ctx.liveSplitRows(type));
  assert.equal(e.running,false);assert.equal(e.paused,false);assert.equal(snapshot().lifecycle,'completed');
  const durable=storage.get(ctx.LIVE_LS_KEY);get(type==='lr'?'lr-modal':'bl-modal').classList.remove('open');
  ctx.saveLiveState();assert.equal(storage.get(ctx.LIVE_LS_KEY),durable);
  const elapsed=e.elapsed;setNow(100000000);const before=opened;
  await ctx.restoreRoute();await ctx.restoreLiveState();assert.equal(opened,before,'Completed test reopened automatically');
  ctx.renderStoredLiveSessionNotice();assert.equal(get('stored-live-session-notice').hidden,false);
  assert(get('stored-live-session-notice').innerHTML.includes('מבחן שהסתיים'));
  await ctx.restoreRoute(true);assert.equal(opened,before+1);assert.equal(e.running,false);assert.equal(e.elapsed,elapsed);assert.equal(JSON.stringify(ctx.liveSplitRows(type)),rows);
 }
 // The Beep "End test" button also finishes, even though it uses silent grade saving.
 const beep=reset('beep');setNow(12000);ctx.liveRecordSplit('beep');ctx.blEnd();
 assert.equal(snapshot().lifecycle,'completed');assert(!beep.running);ctx.blBackToLive();assert(!beep.running);
 assert.equal(get('bl-pause-btn').textContent,'▶ המשך');
 // Save-without-finishing and backgrounding still preserve a real active run.
 let e=reset('lr');setNow(20000);ctx.liveRecordSplit('lr');ctx.lrSaveAll(true);ctx.saveLiveState();
 assert.equal(snapshot().lifecycle,'active');const anchor=e.startTime;setNow(30000);const beforeActive=opened;
 await ctx.restoreRoute();assert.equal(opened,beforeActive+1);assert(e.running);assert.equal(e.elapsed,30000-anchor);
 // Stop/pause does not discard the data and does not imply automatic navigation.
 ctx.lrStop();ctx.saveLiveState();assert.equal(snapshot().lifecycle,'pending');const stopped=opened;
 await ctx.restoreRoute();assert.equal(opened,stopped);await ctx.restoreRoute(true);assert.equal(opened,stopped+1);assert(!e.running);
 ctx.lrStart();ctx.saveLiveState();assert.equal(snapshot().lifecycle,'active');
 // Explicit close retains an unsaved run for manual recovery, without a modal on startup.
 ctx._doCloseLongRunLive();assert.equal(snapshot().lifecycle,'closed');const closed=opened;await ctx.restoreRoute();assert.equal(opened,closed);
 // Legacy snapshots cannot distinguish Save from active running: keep them, never auto-open.
 const legacy=snapshot();delete legacy.lifecycle;legacy.state.running=true;legacy.state.elapsed=12345;legacy.state.startTime=1;
 storage.set(ctx.LIVE_LS_KEY,JSON.stringify(legacy));setNow(900000000);
 await ctx.restoreRoute();assert.equal(opened,closed);assert.equal(snapshot().state.elapsed,12345);
 await ctx.restoreRoute(true);assert.equal(e.elapsed,12345);assert(!e.running,'Legacy run resumed for days after its last save');
 const legacyBeep={...legacy,type:'beep',test:'beep',state:{...legacy.state,students:[{name:'אביב',idx:0,state:'active'}],eliminations:[],undoStack:[],redoStack:[],beepIdx:0}};
 storage.set(ctx.LIVE_LS_KEY,JSON.stringify(legacyBeep));await ctx.restoreRoute(true);assert.equal(snapshot().lifecycle,'closed');
 const inspectedBeep=opened;await ctx.restoreRoute();assert.equal(opened,inspectedBeep,'Manual beep inspection became an automatic resume');
 // A different signed-in account never receives the previous account's recovery prompt.
 ctx.SG_USER.id='other';ctx.renderStoredLiveSessionNotice();assert(get('stored-live-session-notice').hidden);const other=opened;await ctx.restoreRoute(true);assert.equal(opened,other);
 assert(html.includes('finishStoredLiveSession(\'lr\')'));assert(html.includes('finishStoredLiveSession(\'beep\')'));
 console.log('PASS: explicit save finalizes LR/beep; no automatic reopening/navigation; completed/closed/legacy manual recovery preserves splits and elapsed; active background restore; stopped run resume; account isolation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
