const assert=require('assert');
const {ctx,reset,get,setNow,load}=require('./live-participation.cjs');
ctx.CUR={gid:1,test:'run1000',semester:'a'};ctx.resKey=()=>ctx.CUR.semester==='b'?'results_b':'results';
ctx.customTest=()=>null;ctx.TEST_LIST=[{id:'run1000',label:'ריצה'},{id:'pushups',label:'שכיבות סמיכה'}];
load(['parseTime']);ctx.parseInputVal=(_test,value)=>ctx.parseTime(value);
ctx.getTbl=test=>({lb:test==='run1000'});
ctx.getScore=(test,_grade,_gender,value)=>{const n=ctx.parseTime(value);return Number.isFinite(n)?Math.min(100,Math.max(0,test==='run1000'?200-n:n*2)):null;};
load(['writeResult','lrStart','lrStop','openClassTestHistory']);
ctx.openModal=id=>{ctx.opened=id;};
let group=ctx.S.groups[1];group.name='כיתה ט׳';group.results={};
while(group.students.length<30){const idx=group.students.length;group.students.push({name:'תלמיד '+idx,idHash:'student-'+idx,grade:'ט',gender:'ז'});}
function openRun(){const e=reset('lr');e.students=group.students.map((s,idx)=>({...s,idx,state:'active'}));e.running=false;e.elapsed=0;return e;}
const day=Date.UTC(2026,9,28,8);
let engine=openRun();setNow(day);ctx.lrStart();const firstId=engine.historySessionId;
ctx.liveToggleParticipation('lr',2);
setNow(day+1234);ctx.lrTapStudent(0);setNow(day+2345);ctx.lrTapStudent(1);ctx.lrSaveAll(true);ctx.lrStop();
const best=group.results.run1000[0].a;
engine=openRun();setNow(day+60000);ctx.lrStart();const secondId=engine.historySessionId;assert.notEqual(firstId,secondId);
setNow(day+180000);ctx.lrTapStudent(0);ctx.lrSaveAll(true);ctx.lrStop();const secondAttempts=group.results.run1000[0]._attempts.length;
ctx.lrStart();assert.equal(engine.historySessionId,secondId,'Resume created another event');ctx.lrSaveAll(true);assert.equal(group.results.run1000[0]._attempts.length,secondAttempts);
assert.equal(group.results.run1000[0].a,best,'Class history changed the best result');
let model=ctx.classTestHistory(1,'run1000');assert.equal(model.sessions.length,2);assert.equal(model.rows.length,30);
assert.equal(new Date(model.sessions[0].startedAt).toDateString(),new Date(model.sessions[1].startedAt).toDateString());
const firstKey='a:'+firstId,secondKey='a:'+secondId,studentKey=ctx.testHistoryStudentKey(group.students[0],0);
let row=model.rows.find(item=>item.key===studentKey);assert.equal(row.cells[firstKey][0].val,'0:01.234');assert.equal(row.cells[secondKey][0].val,'2:00.000');assert.equal(row.cells[secondKey][0].score,80);
assert(model.sessions[0].roster.find(item=>item.key===ctx.testHistoryStudentKey(group.students[2],2)).absent);
// Older data is explicitly ungrouped; matching dates are never treated as proof of an event.
group.results.run1000[3]={a:'150',_ts:day};model=ctx.classTestHistory(1,'run1000');assert.equal(model.sessions.length,2);assert(model.hasUnknown);
// External runners retain separate identities even when a roster name matches.
setNow(day+181000);const free=ctx.liveRecordSplit('lr');ctx.liveAssignExternal('lr',free.place,group.students[0].name);ctx.lrSaveAll(true);
model=ctx.classTestHistory(1,'run1000');const external=model.rows.find(item=>item.external&&item.key==='external:'+free.externalId);assert(external);assert.equal(external.cells[secondKey].length,1);
const before=JSON.stringify(group);ctx.openClassTestHistory();assert.equal(JSON.stringify(group),before);assert.equal(ctx.opened,'class-test-history-modal');
const ui=get('class-test-history-modal').innerHTML;assert(ui.includes('מועד 1'));assert(ui.includes('מועד 2'));assert(ui.includes('לא משתתף'));assert(ui.includes('לא נשמרה תוצאה'));assert(ui.includes('נתונים קודמים'));assert(ui.includes('2:00.000'));
// A manually selected event is shared across students, and the next event is explicit.
ctx.CUR.test='pushups';setNow(day+200000);const manual=ctx.startManualHistorySession(true);
ctx.writeResult(1,'pushups',0,'10','a');ctx.writeResult(1,'pushups',1,'12','a');
assert.equal(group.results.pushups[0]._attempts[0].finish.sessionId,manual.id);assert.equal(group.results.pushups[1]._attempts[0].finish.sessionId,manual.id);
ctx.startManualHistorySession(true);ctx.writeResult(1,'pushups',0,'8','b');assert.equal(ctx.classTestHistory(1,'pushups').sessions.length,2);assert.equal(group.results.pushups[0].a,'10');
// Existing semester JSON persists the event registry and all weaker attempts together.
let payload;ctx.navigator={onLine:true};ctx.stripLocalFields=students=>students;
ctx.sbApp={from:()=>({update:value=>({eq:async()=>{payload=value;return {error:null};}}),select:()=>({eq:()=>({order:async()=>({data:[{id:42,name:group.name,semester_a:payload.semester_a,semester_b:payload.semester_b}],error:null})})})})};
Object.assign(ctx,{hydrateGroupFromIdMap(){},ensureDemoGroups(){},renderGroupGrid(){},checkYearEndNotice(){},restoreRoute:async()=>{}});
load(['sbSaveGroup','sbLoadUserData']);
(async()=>{
 await ctx.sbSaveGroup(1);const expected=JSON.stringify(ctx.classTestHistory(1,'run1000'));assert(payload.semester_a.testSessions.a.run1000[firstId]);
 await ctx.sbLoadUserData();assert.equal(JSON.stringify(ctx.classTestHistory(1,'run1000')),expected);
 console.log('PASS: 30-student class matrix; separate events on one day; weaker performances/scores; pause/resume and save dedup; absent/missing distinction; explicit manual events; unknown legacy events; external identity; read-only UI; semester JSON round-trip.');
})().catch(error=>{console.error(error);process.exitCode=1;});
