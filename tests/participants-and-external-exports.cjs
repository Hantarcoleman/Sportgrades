const assert=require('assert'),vm=require('vm');
const {ctx,reset,storage,get,setNow,getWrites,html,load}=require('./live-participation.cjs');
ctx.resKey=()=>ctx.CUR.semester==='b'?'results_b':'results';
ctx.customTest=()=>null;ctx.TEST_LIST=[{id:'run1000',label:'ריצה'},{id:'beep',label:'ביפ'}];
ctx.calcFinal=value=>value;
ctx.S.groups[1].name='קבוצה';ctx.S.groups[1].classes='ט';
ctx._pdfScoreColor=()=>'';ctx._pdfDownloadFromHtml=body=>{ctx.pdf=body;return Promise.resolve();};
ctx.XLSX={utils:{aoa_to_sheet:rows=>({rows}),book_new:()=>({sheets:[]}),book_append_sheet:(book,sheet,name)=>book.sheets.push({sheet,name})},writeFile:book=>{ctx.workbook=book;}};
load(['exportStudents','externalExcelRows','appendExternalExcelSheet','testAchievementPDFRows','exportExcel','exportFullExcel','exportAllExcel','exportPDF','exportFullPDF']);
(async()=>{
 for(const type of ['lr','beep']){
  const e=reset(type),p=type==='lr'?'lr':'bl',roster=JSON.stringify(ctx.S.groups[1].students),grades=JSON.stringify(ctx.S.groups[1].results);
  ctx.liveToggleParticipation(type,0);ctx.liveToggleParticipation(type,1);
  assert.equal(get(p+'-active-grid').children.length,0);assert.equal(get(p+'-nonparticipants-list').children.length,2);
  assert.equal(get(p+'-nonparticipants-title').textContent,'לא משתתפים (2)');assert.equal(get(p+'-nonparticipants').open,false);
  get(p+'-nonparticipants').open=true;get(p+'-nonparticipants').ontoggle();assert(e.nonParticipantsOpen);
  ctx.saveLiveState();await ctx.restoreLiveState();assert(get(p+'-nonparticipants').open);
  const anchor=e.startTime;get(p+'-nonparticipants-list').children[0].children[1].click();assert.equal(e.students[0].state,'active');assert.equal(e.startTime,anchor);
  get(p+'-nonparticipants').open=false;get(p+'-nonparticipants').ontoggle();assert(!e.nonParticipantsOpen);
  if(type==='beep')e.running=true;
  ctx.liveSetFinishMode(type,'smart');setNow(4000);const one=ctx.liveRecordSplit(type);
  ctx.liveAssignExternal(type,one.place,'אביב'); // exact same name as a roster student
  const id=one.externalId;assert(id);assert.equal(one.studentArrIdx,null);assert.equal(one.score,null);
  setNow(4500);const two=ctx.liveRecordSplit(type);ctx.liveAssignExternal(type,two.place,'אביב');assert.notEqual(two.externalId,id);
  ctx.liveSaveExternalSplits(type);assert.equal(JSON.stringify(ctx.S.groups[1].students),roster);assert.equal(JSON.stringify(ctx.S.groups[1].results),grades);assert.equal(getWrites().length,0);
  assert.equal(ctx.savedExternalResults(ctx.S.groups[1],e.testId).length,2);
  ctx.liveAssignExternal(type,one.place,'אורח מתוקן');assert.equal(one.externalId,id);assert.equal(one.elapsedMs,3000);
  ctx.liveSaveExternalSplits(type);assert(ctx.savedExternalResults(ctx.S.groups[1],e.testId).some(row=>row.id===id&&row.name==='אורח מתוקן'));
  ctx.liveSetFinishMode(type,'assign');ctx.liveSaveExternalSplits(type);ctx.saveLiveState();await ctx.restoreLiveState();
  assert.equal(e.finishMode,'assign');assert.equal(ctx.liveSplitRows(type)[0].externalId,id);assert.equal(ctx.liveSplitRows(type)[0].externalName,'אורח מתוקן');
  const first=ctx.liveSplitRows(type)[0];ctx.liveAssignExternal(type,first.place,'');ctx.liveSaveExternalSplits(type);
  assert.equal(first.externalName,undefined);assert.equal(first.elapsedMs,3000);assert.equal(ctx.savedExternalResults(ctx.S.groups[1],e.testId).length,1);
  assert(ctx.S.groups[1].externalResults.a[e.testId][id].inactive);
  // Correcting to an explicit roster selection is a separate, identity-based operation.
  assert(ctx.liveAssignSplit(type,first.place,0));assert.equal(first.studentArrIdx,0);assert.equal(JSON.stringify(ctx.S.groups[1].results),grades);
  const second=ctx.liveSplitRows(type)[1];ctx.liveAssignExternal(type,second.place,'אביב');ctx.liveSaveExternalSplits(type);
  ctx.CUR.test=e.testId;
  ctx.exportExcel();const sheet=ctx.workbook.sheets[0].sheet.rows;
  assert.deepEqual(sheet.slice(1,3).map(row=>row[1]),['אביב','דנה']);
  const divider=sheet.findIndex(row=>String(row[1]).includes('רצים חיצוניים'));
  assert(divider>2);assert.equal(sheet[divider+1][1],'אביב');assert.equal(sheet[divider+1][5],'');assert.equal(sheet[divider+1][7],'');
  assert.equal(sheet[divider+1][4],second.rawVal||second.result);
  for(const name of ['exportPDF','exportFullPDF']){
   ctx[name]();const head=ctx.pdf.match(/<thead><tr>(.*?)<\/tr><\/thead>/s)[1];
   assert.deepEqual(Array.from(head.matchAll(/<th>(.*?)<\/th>/g),m=>m[1]),['שם התלמיד','תוצאה','ציון','#','מין','כיתה','ציון א׳']);
   assert(ctx.pdf.includes('רצים חיצוניים'));assert(ctx.pdf.includes('אביב'));
  }
  ctx.exportFullExcel();assert(ctx.workbook.sheets.some(item=>item.name==='רצים חיצוניים'));
  ctx.exportAllExcel();assert(ctx.workbook.sheets.some(item=>item.name==='רצים חיצוניים'));
  assert.equal(JSON.stringify(ctx.S.groups[1].students),roster);assert.equal(JSON.stringify(ctx.S.groups[1].results),grades);
 }
 // Adding a new guest through the existing dialog no longer appends to the roster.
 const e=reset('lr'),rosterBefore=JSON.stringify(ctx.S.groups[1].students);
 Object.assign(ctx,{_addParticipantGender:'ז',_addParticipantGrade:'ט',_addParticipantExternalRef:null,_addParticipantMode:'lr',isNameInActiveList:()=>false,closeModal(){}});
 const gradesBeforeGuest=JSON.stringify(ctx.S.groups[1].results);get('bl-add-name').value='אביב';
 const start=html.lastIndexOf('function blConfirmAddStudent('),end=html.indexOf('\n}',start)+2;
 vm.runInContext(html.slice(start,end),ctx);ctx.blConfirmAddStudent();
 assert.equal(JSON.stringify(ctx.S.groups[1].students),rosterBefore);assert(e.students.at(-1)._external);
 setNow(7000);ctx.lrTapStudent(e.students.length-1);ctx.lrSaveAll(true);
 assert(ctx.savedExternalResults(ctx.S.groups[1],'run1000').some(row=>row.name==='אביב'&&row.score===85));
 assert.equal(JSON.stringify(ctx.S.groups[1].results),gradesBeforeGuest);assert.equal(getWrites().length,0);
 // Optional externalResults round-trips through the existing semester JSON payload.
 let payload;
 ctx.navigator={onLine:true};ctx.stripLocalFields=students=>students;
 ctx.sbApp={from:()=>({update:value=>({eq:async()=>{payload=value;return {error:null};}}),select:()=>({eq:()=>({order:async()=>({data:[{id:42,name:'קבוצה',grade:'ט',semester_a:payload.semester_a,semester_b:payload.semester_b}],error:null})})})})};
 Object.assign(ctx,{hydrateGroupFromIdMap(){},ensureDemoGroups(){},renderGroupGrid(){},checkYearEndNotice(){},restoreRoute:async()=>{}});
 load(['sbSaveGroup','sbLoadUserData']);await ctx.sbSaveGroup(1);
 const expected=JSON.stringify(payload.semester_a.externalResults);await ctx.sbLoadUserData();assert.equal(JSON.stringify(ctx.S.groups[1].externalResults),expected);
 // Random-mode free runners are updated by stable ID, never by equal names.
 let randomData=[];ctx.rgLoad=()=>JSON.parse(JSON.stringify(randomData));ctx.rgSave=data=>{randomData=JSON.parse(JSON.stringify(data));};
 const random=reset('lr');random.gid='__random__';ctx.S.groups.__random__={name:'אקראית',students:[]};
 setNow(9000);const randomOne=ctx.liveRecordSplit('lr');ctx.liveAssignExternal('lr',randomOne.place,'אותו שם');
 const randomTwo=ctx.liveRecordSplit('lr');ctx.liveAssignExternal('lr',randomTwo.place,'אותו שם');ctx.liveSaveExternalSplits('lr');ctx.liveSaveExternalSplits('lr');
 assert.equal(randomData.length,2);assert(randomData.every(row=>row.score===null));
 ctx.liveAssignExternal('lr',randomOne.place,'<img src=x>');ctx.liveSaveExternalSplits('lr');assert.equal(randomData.length,2);
 load(['rgRenderResults']);ctx.rgRenderResults();assert(get('rg-results-list').innerHTML.includes('&lt;img src=x&gt;'));assert(!get('rg-results-list').innerHTML.includes('<img src=x>'));
 ctx.liveAssignExternal('lr',randomOne.place,'');ctx.liveSaveExternalSplits('lr');assert.equal(randomData.filter(row=>!row._inactive).length,1);
 assert.equal(ctx.S.groups.__random__.students.length,0);
 console.log('PASS: collapsed non-participant area/toggle/return/reload; free-name rename/unassign/identity isolation; guests never added to roster; unknown scores blank; external Excel/PDF/full exports; exact PDF column order; semester JSON round-trip.');
})().catch(error=>{console.error(error);process.exitCode=1;});
