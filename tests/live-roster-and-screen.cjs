const fs=require('fs'),vm=require('vm'),assert=require('assert');
const h=require('./live-participation.cjs');const {ctx,load,reset,get}=h;
for(const type of ['lr','beep']){
 reset(type);const e=type==='lr'?ctx.LR:ctx.BL;
 e.students=[{name:'תמר',idx:0,state:'active'},{name:'אביתר',idx:1,state:'active'},{name:'דנה',idx:2,state:'active'}];
 const before=JSON.stringify(e.students);
 (type==='lr'?ctx.lrRenderGrid:ctx.blRenderActiveGrid)();
 assert.deepEqual(get(type==='lr'?'lr-active-grid':'bl-active-grid').children.map(c=>c.id),type==='lr'?['lrc-1','lrc-2','lrc-0']:['blc-1','blc-2','blc-0']);
 assert.equal(JSON.stringify(e.students),before);
 assert(get(type==='lr'?'lr-modal':'bl-modal').classList.contains('live-compact'));
 ctx.liveRosterLayout(type,true);assert(!get(type==='lr'?'lr-modal':'bl-modal').classList.contains('live-compact'));
 ctx.liveRosterLayout(type,true);
 const prefix=type==='lr'?'lr':'bl';
 get(prefix+'-roster-tools').children[2].click();assert(get(prefix+'-modal').classList.contains('live-roster-focus'));assert(e.running);
 get(prefix+'-roster-tools').children[2].click();assert(!get(prefix+'-modal').classList.contains('live-roster-focus'));assert(e.running);
}
load(['liveScreenWanted','liveSyncScreen']);
vm.runInContext('var LIVE_SCREEN={lock:null,pending:false,retryAfter:0}',ctx);
ctx.document.visibilityState='visible';let requests=0,releases=0,resolve;
const lock={release:async()=>{releases++;},addEventListener(){}};
ctx.navigator={wakeLock:{request:()=>{requests++;return new Promise(r=>resolve=r);}}};
(async()=>{
 reset('lr');const p=ctx.liveSyncScreen();await ctx.liveSyncScreen();assert.equal(requests,1);resolve(lock);await p;
 await ctx.liveSyncScreen();assert.equal(requests,1);
 ctx.document.visibilityState='hidden';await ctx.liveSyncScreen();assert.equal(releases,1);
 ctx.document.visibilityState='visible';ctx.navigator.wakeLock.request=async()=>{requests++;return lock;};await ctx.liveSyncScreen();assert.equal(requests,2);
 ctx.LR.running=false;await ctx.liveSyncScreen();assert.equal(releases,2);
 reset('lr');ctx.navigator={};await ctx.liveSyncScreen();assert(ctx.LR.running);
 ctx.navigator={wakeLock:{request:async()=>{throw Error('denied');}}};await ctx.liveSyncScreen();assert(ctx.LR.running);
 ctx.LIVE_SCREEN.retryAfter=0;
 let done;ctx.navigator.wakeLock.request=()=>new Promise(r=>done=r);const pending=ctx.liveSyncScreen();ctx.LR.running=false;done(lock);await pending;assert.equal(releases,3);
 console.log('PASS live roster sorting, density and wake-lock lifecycle');
})().catch(e=>{console.error(e);process.exitCode=1;});
