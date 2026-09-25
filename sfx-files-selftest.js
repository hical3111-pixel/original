'use strict';
function fileAudioFixture(){const ac=fakeAudio();ac.decoded=0;ac.decodeAudioData=(bytes,resolve)=>{ac.decoded++;const buffer={duration:.75,fixture:true};resolve(buffer);return Promise.resolve(buffer)};return ac}
function fileAudioSnapshot(){return {AC,master,noiseBuf,audioBed,audioLead,audioVoices,schoolAudioJobs,schoolSoundContext,sound:S.sound,volume:S.volume,fetch:window.fetch,thr:{...thr}}}
function fileAudioRestore(o){silenceAudio();AC=o.AC;master=o.master;noiseBuf=o.noiseBuf;audioBed=o.audioBed;audioLead=o.audioLead;audioVoices=o.audioVoices;schoolAudioJobs=o.schoolAudioJobs;schoolSoundContext=o.schoolSoundContext;S.sound=o.sound;S.volume=o.volume;window.fetch=o.fetch;Object.assign(thr,o.thr)}
function fileAudioSetup(ac=fileAudioFixture()){AC=ac;S.sound=true;S.volume=100;audioVoices=[];schoolAudioJobs=[];schoolSoundContext=null;noiseBuf=ac.createBuffer(1,9600,8000);audioGraph();for(const k in thr)delete thr[k];return ac}
const fileResponse=()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
async function runFileAudioSelftest(ok){
  const credits=await (await fetch('CREDITS.md')).text(),decoder=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,1,44100);let bytes=0;
  // 로컬 정적 서버의 연결 대기열을 넘기지 않도록 파일은 순서대로 검사한다.
  for(const [id,file] of Object.entries(SFX_FILES)){const response=await fetch(file.path);ok(response.ok,id+': 음원 파일 경로 존재');const data=await response.arrayBuffer();bytes+=data.byteLength;
    ok(data.byteLength===file.bytes&&file.path.endsWith('.mp3'),id+': MP3 파일 크기/형식');try{const b=await decoder.decodeAudioData(data.slice(0));ok(b.duration>0&&b.numberOfChannels===1,id+': 실제 브라우저 MP3 디코드')}catch(e){ok(false,id+': 실제 MP3 디코드 '+e.message)}ok(credits.includes('`'+file.path+'`')&&credits.includes('`'+file.original+'`')&&credits.includes(file.pack),id+': CREDITS 팩/원본/변환 파일 기록');
  }ok(bytes<=5*1024*1024,'필요한 후보 음원 총합 ≤5MB');ok(credits.includes('CC0 1.0'),'CREDITS CC0 명시');
  const recorded=['field_fire','field_ice','field_ice_heavy','field_growl','spell_fire','spell_fire_heavy','spell_ice','spell_ice_heavy','shatter','shatter_heavy','body_hit','body_hit_heavy','field_blast'],provenance=await (await fetch('sfx/licenses/recordings.txt')).text();
  for(const id of recorded){const f=SFX_FILES[id];ok(f?.license==='CC0 1.0'&&provenance.includes(f.source)&&provenance.includes(f.original)&&provenance.includes(f.author),id+': 새 후보 CC0/제작자/공식 출처 기록');ok(!f.preview||!!f.asset&&provenance.includes(f.asset),id+': 공식 미리듣기 사용 여부 명시');ok(Object.values(SFX_SCHOOL).some(p=>Object.values(p.files).some(k=>Object.values(k).some(s=>s.candidates.includes(id)))),id+': 수련장 후보에서 선택 가능')}
  const oldSlots={crimson:[['fire','fire2','slice','rumble2'],['punch','punch2','chop','crunch'],['crunch','rumble','crunch2','metal'],['fire2','fire','rumble2'],['crunch2','punch2','metal'],['rumble','crunch','crunch2','rumble2'],['rumble2','fire2','fire'],['metal','crunch2','punch'],['crunch2','rumble','crunch']],frost:[['slice','slice2','bell','glasslight'],['glasslight','glassmid','punch','chop'],['glass','glass2','bell','metal'],['bell','bell2','slice2'],['glassmid','glasslight','metal'],['glass2','glass','bell2'],['bell2','bell','slice'],['glass','glassmid','punch2'],['glass2','bell2','glass','metal']]};
  // 사용자 승인: 이전 후보 13개에 고정하던 기본값 조건을 itch.io 공식 CC0 팩 조건으로 교체한다.
  const itchFiles=['spell_fire','spell_fire_heavy','spell_ice','spell_ice_heavy','itch_fire1','itch_fire3','itch_fire5','itch_ice1','itch_ice3','itch_ice4','itch_wind2','itch_wind5','itch_heal10','itch_heal11'],itchSources=['https://lentikula.itch.io/freecc0-basic-spell-impacts-sfx','https://lentikula.itch.io/druid-spell-impacts','https://lentikula.itch.io/healing-spell-impacts'];
  for(const school of ['crimson','frost']){const slots=Object.values(SFX_SCHOOL[school].files).flatMap(Object.values);slots.forEach((slot,i)=>{ok(oldSlots[school][i].every(id=>slot.candidates.includes(id)),school+' '+i+': 기존 비교 후보 모두 유지');const f=SFX_FILES[slot.selected];ok(itchFiles.includes(slot.selected)&&itchSources.includes(f?.source)&&f.license==='CC0 1.0',school+' '+i+': itch.io 공식 CC0 팩을 기본값으로 적용')})}
  const itchLicense=await (await fetch('sfx/licenses/itch-packs.txt')).text(),expectedItch={crimson:['itch_wind5','itch_fire3','itch_fire1','itch_fire5','spell_fire','spell_fire_heavy','itch_wind2','itch_fire3','itch_fire1'],frost:['itch_heal10','itch_ice3','itch_ice1','itch_wind2','spell_ice','spell_ice_heavy','itch_heal11','itch_ice4','itch_ice1']};
  for(const id of itchFiles){const f=SFX_FILES[id];ok(!!f&&itchLicense.includes(f.source)&&itchLicense.includes(f.pack)&&f.author==='lentikula'&&!f.preview,id+': itch.io 원본 팩·CC0 기록');ok(Object.values(SFX_SCHOOL).some(p=>Object.values(p.files).some(k=>Object.values(k).some(s=>s.candidates.includes(id)))),id+': itch.io 후보 선택 가능')}
  for(const school of ['crimson','frost'])Object.values(SFX_SCHOOL[school].files).flatMap(Object.values).forEach((slot,i)=>ok(slot.selected===expectedItch[school][i],school+' '+i+': 준비/적중/강타 배정 일치'));
  ok(new Set(recorded.map(id=>SFX_FILES[id].source)).size===7,'추천한 CC0 출처 7곳 모두 후보 반영');
  for(const name of ['impact','rpg','scifi']){const response=await fetch('sfx/licenses/'+name+'.txt'),license=await response.text();ok(response.ok&&license.includes('Creative Commons Zero, CC0'),name+': 공식 팩 동봉 CC0 라이선스')}
  for(const [school,palette] of Object.entries(SFX_SCHOOL))for(const [kind,slots] of Object.entries(palette.files))for(const [phase,slot] of Object.entries(slots)){
    ok(slot.candidates.includes(slot.selected)&&slot.candidates.every(id=>SFX_FILES[id]),school+' '+kind+' '+phase+': 선택/후보 모두 실제 파일');
  }
  const saved=fileAudioSnapshot();
  try{
    let requests=0;window.fetch=async()=>{requests++;return fileResponse()};let ac=fileAudioSetup();
    const limits=[],createLimit=ac.createDynamicsCompressor;ac.createDynamicsCompressor=()=>{const n=createLimit();limits.push(n);return n};audioGraph();ok(limits.length===1&&limits[0].ratio.value===20&&limits[0].threshold.value===-10,'마스터 압축기/리미터 연결');
    const a=loadSfx('punch'),b=loadSfx('punch');ok(a===b,'동일 파일 병렬 요청 공유');await Promise.all([a,b]);await loadSfx('punch');ok(requests===1&&ac.decoded===1,'fetch/디코드 캐시 각 1회');
    {const prev=ac,pre=fileAudioSetup(),before=requests,sel=new Set(Object.values(SFX_SCHOOL).flatMap(p=>Object.values(p.files||{}).flatMap(s=>Object.values(s).map(x=>x.selected))));await preloadSchoolFiles(pre);ok([...sel].every(id=>sfxCache(pre).get(id)?.buffer)&&requests-before===sel.size,'오디오 시작 시 선택 파일만 미리 불러오기('+sel.size+'개)');silenceAudio();pre.currentTime++;const st=pre.sources.length;ok(schoolCue(soundOwner('skill','frostcut'),'cast')&&pre.sources.slice(st).some(n=>n.buffer?.fixture),'미리 불러온 뒤 첫 시전부터 파일 소리');fileAudioSetup(prev)}
    for(const school of Object.keys(SFX_SCHOOL))for(const [kind,list] of [['skill',SK],['combo',COMBOS],['awk',AWK]])for(const item of list){const owner=soundOwner(kind,kind==='combo'?item.a:item.id);if(owner?.school!==school)continue;await warmSchoolFiles(owner);
      for(const phase of ['cast','hit','finish']){silenceAudio();ac.currentTime++;const start=ac.sources.length;ok(schoolCue(owner,phase),owner.key+' '+phase+': 선택 파일 재생');const nodes=ac.sources.slice(start);ok(nodes.some(n=>n.buffer?.fixture),owner.key+' '+phase+': 디코드된 파일 사용');if(phase==='finish')ok(nodes.some(n=>n.kind==='tone'),owner.key+': 강타 파일 + 합성 저음')}
    }
    const owner=soundOwner('skill','cannon');silenceAudio();ac.currentTime++;const sourceStart=ac.sources.length;S.sound=false;schoolCue(owner,'cast');ok(ac.sources.length===sourceStart,'파일 캐시가 있어도 소리 끔은 재생 0');S.sound=true;S.volume=0;schoolCue(owner,'finish');ok(ac.sources.length===sourceStart,'파일 캐시가 있어도 음량 0은 재생 0');S.volume=100;
    const rates=[];for(let i=0;i<4;i++){ac.currentTime++;schoolCue(owner,'hit');rates.push(ac.sources.filter(n=>n.buffer?.fixture).at(-1).playbackRate.value)}ok(new Set(rates).size===4&&rates.every(r=>r>.85&&r<1.12),'파일 음높이 작은 독립 변주');
    silenceAudio();for(let i=0;i<70;i++){ac.currentTime+=.005;playSfxBuffer(Object.keys(SFX_FILES)[i%18],{duration:20},owner,'hit')}ok(audioVoices.length===AUDIO_LIMIT,'파일 재생도 동시 음원 상한 24');
    for(const fail of ['network','http','decode','unsupported']){ac=fileAudioSetup();window.fetch=async()=>{if(fail==='network')throw Error('offline');return {...fileResponse(),ok:fail!=='http',status:404}};
      if(fail==='decode')ac.decodeAudioData=()=>Promise.reject(Error('unsupported codec'));if(fail==='unsupported')delete ac.decodeAudioData;
      const id=sfxChoice(owner,'finish');ok(await loadSfx(id)===null,fail+': 파일 실패 안전 처리');ok(schoolCue(owner,'finish')&&ac.sources.some(n=>n.kind==='tone')&&ac.sources.some(n=>n.kind==='noise'),fail+': 실제 합성 대체음 재생');
    }
    ac=fileAudioSetup();window.fetch=async()=>fileResponse();ac.decodeAudioData=(bytes,done)=>{done({duration:1})};ok(!!await loadSfx('bell'),'콜백 방식 Safari 디코드 지원');
  }finally{fileAudioRestore(saved)}
}
async function runLabFileSelftest(ok){
  const saved=fileAudioSnapshot(),before=JSON.stringify(S),choices={...labSoundChoices};
  try{
    fileAudioSetup();window.fetch=async()=>fileResponse();$('openLabSounds').click();ok(!$('soundPicker').hidden,'소리 고르기 열기');
    ok([...$('soundSchool').options].map(o=>o.value).join()==='crimson,frost','소리 고르기는 진홍/빙정만');
    for(const school of ['crimson','frost'])for(const kind of ['skill','combo','awk'])for(const phase of ['cast','hit','finish']){
      $('soundSchool').value=school;$('soundKind').value=kind;renderLabSoundPreview();$('soundPhase').value=phase;renderLabSoundCandidates();const owner=labSoundOwner(),slot=SFX_SCHOOL[school].files[kind][phase],id=slot.candidates.at(-1);
      const input=$('soundCandidates').querySelector('input[value="'+id+'"]');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));
      ok(sfxChoice(owner,phase)===id,school+' '+kind+' '+phase+': 후보 UI 선택 반영');ok(await labAudition(id),school+' '+kind+' '+phase+': 후보 파일 듣기');
      ok(audioVoices.some(v=>v.source.buffer?.fixture)&&!FX.length&&!P.length&&!T.length,school+' '+kind+' '+phase+': 파일만 재생/연출 없음');
    }
    const state=JSON.stringify(S);let copied='';ok(await labExportSounds(t=>{copied=t;return Promise.resolve()}),'선택표 클립보드 복사');ok(copied.split('\n').length===20&&Object.keys(labSoundChoices).every(k=>copied.includes(k+' = '+labSoundChoices[k])),'복사 내용 18개 계열/종류/단계 선택 정확');
    ok(!await labExportSounds(()=>Promise.reject(Error('denied')))&&!$('soundCopyText').hidden&&$('soundCopyText').value===copied,'클립보드 차단 시 직접 복사 제공');
    for(const school of ['crimson','frost'])for(const kind of ['skill','combo','awk']){$('soundSchool').value=school;$('soundKind').value=kind;renderLabSoundPreview();ok(await labSoundPreview()&&lab.playing&&FX.length>0,school+' '+kind+': 선택 조합으로 기존 연출 재생');labClear()}
    ok(JSON.stringify(S)===state,'후보 선택/듣기/복사/연출이 저장 상태 불변');
    fileAudioSetup();let resolveFetch;window.fetch=()=>new Promise(r=>resolveFetch=r);const pending=labAudition('bell');labClear();resolveFetch(fileResponse());ok(!await pending&&audioVoices.length===0,'정지 후 늦게 로드된 후보는 재생하지 않음');
    fileAudioSetup();window.fetch=async()=>{throw Error('offline')};ok(await labAudition('glass')&&$('soundStatus').textContent.includes('대체음'),'후보 로딩 실패 안내 + 합성 대체');
    labClear();S.sound=false;ok(!await labAudition('glass')&&!audioVoices.length,'소리 고르기 음소거 시 재생 없음');S.sound=true;S.volume=0;ok(!await labAudition('glass')&&!audioVoices.length,'소리 고르기 음량 0 재생 없음');
    ok(window.__labAudit.save===0&&window.__labAudit.writes===0,'소리 고르기 전체 save/localStorage 쓰기 0회');
  }finally{labClear();for(const key in labSoundChoices)delete labSoundChoices[key];Object.assign(labSoundChoices,choices);fileAudioRestore(saved);$('soundPicker').hidden=true}
  ok(JSON.stringify(S)===before,'소리 고르기 검사 후 기존 수련 상태 복원');
}
