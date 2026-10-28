const assert=require('assert');
const {ctx,load,get,setNow}=require('./live-participation.cjs');
ctx.resKey=()=>ctx.CUR.semester==='b'?'results_b':'results';ctx.CUR={gid:1,test:'run1000',semester:'a'};
ctx.getTbl=test=>({lb:test==='run1000'});ctx.customTest=()=>null;
load(['parseTime']);ctx.parseInputVal=(test,value)=>test==='run1000'?ctx.parseTime(value):Number(value);
ctx.getScore=(test,_grade,_gender,value)=>{
 const numeric=ctx.parseInputVal(test,value);return Number.isFinite(numeric)?Math.min(100,Math.max(0,test==='run1000'?200-numeric:numeric*2)):null;
};
load(['writeResult','openAttemptHistory','onLive','onFC']);
const group=ctx.S.groups[1];group.name='קבוצה';group.results={run1000:{0:{a:'100',_ts:100}}};
const data=()=>group.results.run1000[0];
function save(value,source={}){const metadata=ctx.measurementAttemptMetadata('lr',source,value);ctx.writeResult(1,'run1000',0,value,'b',metadata);return source;}
setNow(1000);const slow=save('120');assert.equal(data().a,'100');assert.equal(data()._attempts.length,2);assert.equal(data()._attempts.at(-1).val,'120');
setNow(2000);save('120',slow);assert.equal(data()._attempts.length,2);assert.equal(data()._attempts.at(-1).ts,1000);
save('120');assert.equal(data()._attempts.length,3,'A distinct real attempt with the same result was lost');
save('90');save('80');assert.equal(data().a,'80','Equal 100 scores did not retain the better raw time');
save('bad input');assert.equal(data().a,'80');assert.equal(data()._attempts.at(-1).score,null);
const repeated=save('70');save('130',repeated);assert.equal(data().a,'80','A corrected measurement should reselect the best remaining attempt');
assert(data()._attempts.some(attempt=>attempt.val==='130'));
// Manual entry records the weaker attempt too; the displayed/scored value stays best.
ctx.r=idx=>group.results.run1000[idx];ctx.refreshRow=()=>{};ctx.checkAnomalous=()=>false;ctx.confirm=()=>{throw Error('Unexpected confirmation');};
const event={target:{value:'125',dataset:{idx:'0',f:'a',orig:'80'}}};ctx.onLive(event);setNow(9000);ctx.onFC(event);
assert.equal(data().a,'80');assert.equal(event.target.value,'80');assert(data()._attempts.some(attempt=>attempt.val==='125'));
// Greater-is-better strength tests use the same attempt store.
ctx.writeResult(1,'pushups',0,'10','a');ctx.writeResult(1,'pushups',0,'8','b');ctx.writeResult(1,'pushups',0,'60','b');ctx.writeResult(1,'pushups',0,'70','b');
assert.equal(group.results.pushups[0].a,'70');assert.equal(group.results.pushups[0]._attempts.length,4);
// Callers that used to reject weaker strength/count/sprint results must record them.
load(['srlSave','strSave','spSaveAll']);ctx.SRL={gid:1,testId:'pushups',count:5,unit:'חזרות'};ctx.STR={gid:1,testId:'pushups',count:3};
get('srl-student-name').value=group.students[0].name;get('str-finish-name').value=group.students[0].name;
ctx.srlSave();ctx.strSave();assert.equal(group.results.pushups[0]._attempts.length,6);assert.equal(group.results.pushups[0].a,'70');
ctx.SR={gid:1,testId:'run1000',splits:[{rawMs:120000,name:group.students[0].name}]};get('sp-name-0').value=group.students[0].name;
const sprintBefore=data()._attempts.length;ctx.spSaveAll();ctx.spSaveAll();assert.equal(data()._attempts.length,sprintBefore+1);assert.equal(data().a,'80');
// Semester data remains independent and old field B/manual history are preserved.
ctx.CUR.semester='b';ctx.writeResult(1,'run1000',0,'140','a');assert.equal(group.results_b.run1000[0].a,'140');assert.equal(data().a,'80');ctx.CUR.semester='a';
group.results.run1000[1]={a:'110',b:'90',_hist:[{val:'115',field:'a',ts:20}]};ctx.writeResult(1,'run1000',1,'130','b');
assert.equal(group.results.run1000[1].a,'90');assert.deepEqual(Array.from(group.results.run1000[1]._attempts,item=>item.val),['115','110','90','130']);
// Read-only history UI shows discarded attempts, newest attempt, and selected best.
ctx.TEST_LIST=[{id:'run1000',label:'ריצה'}];ctx.openModal=id=>{ctx.opened=id;};
const before=JSON.stringify(group);ctx.openAttemptHistory(0);assert.equal(JSON.stringify(group),before);assert.equal(ctx.opened,'attempt-history-modal');
const ui=get('attempt-history-modal').innerHTML;assert(ui.includes('125'));assert(ui.includes('120'));assert(ui.includes('ניסיון אחרון'));assert(ui.includes('הביצוע הנבחר למחצית'));
// History is kept inside existing result JSON; Supabase needs no new columns/tables.
let payload;ctx.navigator={onLine:true};ctx.stripLocalFields=students=>students;
ctx.sbApp={from:()=>({update:value=>({eq:async()=>{payload=value;return {error:null};}})})};
load(['sbSaveGroup']);
(async()=>{
 await ctx.sbSaveGroup(1);assert.equal(JSON.stringify(payload.semester_a.results.run1000[0]._attempts),JSON.stringify(data()._attempts));
 console.log('PASS: weaker attempts retained; repeated-save deduplication; distinct equal attempts; tie performance; corrected attempts; manual entry; strength tests; semester/legacy migration; read-only history UI; existing JSON sync.');
})().catch(error=>{console.error(error);process.exitCode=1;});
