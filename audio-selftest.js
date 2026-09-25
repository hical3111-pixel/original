'use strict';
// 오디오 장치 없이 노드 생성/스케줄/덕킹을 기록한다. 실제 저장소에는 쓰지 않는다.
function fakeAudio(){
  const a={currentTime:10,state:'running',destination:{},events:[],sources:[],sampleRate:8000};
  const param=()=>({value:1,setValueAtTime(v,t){this.value=v;a.events.push(['set',v,t])},exponentialRampToValueAtTime(v,t){a.events.push(['exp',v,t])},linearRampToValueAtTime(v,t){a.events.push(['ramp',v,t])},setTargetAtTime(v,t,k){this.value=v;a.events.push(['target',v,t,k])},cancelScheduledValues(t){a.events.push(['cancel',t])}});
  const node=kind=>({kind,connect(){},disconnect(){},gain:param(),frequency:param(),Q:param(),playbackRate:param(),start(t){a.events.push(['start',kind,t]);this.started=t},stop(t){a.events.push(['stop',kind,t]);this.stopped=t}});
  a.createGain=()=>node('gain');a.createDynamicsCompressor=()=>Object.assign(node('compressor'),{threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()});a.createBiquadFilter=()=>node('filter');a.createOscillator=()=>{const n=node('tone');a.sources.push(n);return n};a.createBufferSource=()=>{const n=node('noise');a.sources.push(n);return n};a.createBuffer=(n,len)=>({getChannelData:()=>new Float32Array(len)});a.resume=()=>{a.state='running';return Promise.resolve()};return a;
}
function runAudioSelftest(ok,reset,persist){
  const saved={AC,master,noiseBuf,audioBed,audioLead,audioVoices,schoolAudioJobs,schoolSoundContext,hit:skillHit,cue:schoolCue,random:Math.random},calls=[];
  const setup=()=>{reset();S.loadout=[];S.equip=[];S.sound=true;S.volume=100;ST=stats();AC=fakeAudio();noiseBuf=AC.createBuffer(1,9600,8000);audioVoices=[];schoolAudioJobs=[];schoolSoundContext=null;for(const k in thr)delete thr[k];audioGraph();calls.length=0};
  const step=n=>{for(let i=0;i<n;i++){AC.currentTime+=1/60;update(1/60)}};
  const fixture=[['crimson','skill','breath'],['crimson','skill','cannon'],['crimson','skill','demon'],['crimson','skill','upper'],['crimson','combo','breath'],['crimson','combo','demon'],['crimson','awk','inferno'],['frost','skill','frostcut'],['frost','skill','icedragon'],['frost','skill','iceflower'],['frost','skill','frostspiral'],['frost','combo','frostcut'],['frost','combo','iceflower'],['frost','awk','frostcrown']];
  const play=(kind,id)=>kind==='skill'?cast(skOf(id),true):kind==='combo'?previewCombo(COMBOS.find(c=>c.a===id)):previewAwk(AWK.find(a=>a.id===id));
  try{
    schoolCue=function(owner,phase){const emitted=saved.cue(owner,phase);if(emitted)calls.push([owner.school,owner.kind,owner.id,phase]);return emitted};Math.random=()=>.5;
    ok(Object.keys(SFX_SCHOOL).join()==='crimson,frost','새 소리 팔레트는 진홍/빙정 두 계열만');
    for(const [school,kind,id] of fixture){setup();play(kind,id);step(480);const own=calls.filter(c=>c[0]===school&&c[1]===kind&&c[2]===id);
      ok(['cast','hit','finish'].every(phase=>own.some(c=>c[3]===phase)),kind+' '+id+': 실제 시전/적중/마무리 새 소리');
      ok(AC.sources.some(n=>n.kind==='tone')&&AC.sources.some(n=>n.kind==='noise'),id+': 음파와 잡음 층 코드 합성');
      ok(!calls.some(c=>c[0]!==school),id+': 다른 계열 소리 섞이지 않음');
      const capture=enabled=>{setup();S.sound=enabled;const hits=[];skillHit=function(mult,pm,x,y,o){hits.push([mult,pm,o?.sid,!!o?.heavy]);return saved.hit(mult,pm,x,y,o)};play(kind,id);const shape=FX.map(f=>f.dur),particles=P.length;step(480);skillHit=saved.hit;return JSON.stringify({hits,shape,particles,hp:m.hp,stage:S.stage,gold:S.gold})};
      ok(capture(true)===capture(false),id+': 오디오 유무에 피해/연출 길이/입자/진행 동일');
    }
    for(const s of SCHOOLS.filter(s=>!SFX_SCHOOL[s.id])){setup();const sk=schoolSkills(s)[0];play('skill',sk.id);step(240);ok(calls.length===0,s.name+': 기존 효과음 경로 유지')}
    setup();const owner=soundOwner('skill','cannon');schoolCue(owner,'hit');const n=AC.sources.length;schoolCue(owner,'hit');ok(AC.sources.length===n,'thr: 같은 소리 즉시 반복 제한');AC.currentTime+=.1;schoolCue(owner,'hit');ok(AC.sources.length>n,'thr: 간격 이후 재생 재개');
    setup();for(let i=0;i<100;i++)tone('sine',200,100,1,.1);ok(audioVoices.length===AUDIO_LIMIT&&AC.sources.length===AUDIO_LIMIT,'공통/계열 음원 동시 재생 상한 24');
    schoolCue(owner,'finish');ok(audioVoices.length<=AUDIO_LIMIT&&audioVoices.some(v=>v.priority===2),'큰 타격은 낮은 우선순위를 교체, 상한 유지');
    ok(AC.events.some(e=>e[0]==='set'&&e[1]===.38)&&AC.events.some(e=>e[0]==='ramp'&&e[1]===1),'큰 타격: 배경 소리 덕킹과 복귀');
    AC.currentTime+=5;audioPrune();ok(audioVoices.length===0,'음원 종료 시 동시 재생 슬롯 반환');
    setup();S.sound=false;const off=AC.sources.length;schoolCue(owner,'cast');sfx.bigboom();tone('sine',100,50,1,.1);noise(.3,.1,500);ok(AC.sources.length===off,'소리 끔: 계열/기존/직접 음원 0개');
    S.sound=true;S.volume=0;schoolCue(owner,'finish');sfx.bigboom();ok(AC.sources.length===off,'음량 0: 음원 생성 0개');
    S.volume=37;audioVolume();ok(Math.abs(master.gain.value-.32*.37)<1e-9,'슬라이더 음량이 출력에 즉시 반영');S.sound=false;audioVolume();ok(master.gain.value===0,'소리 끔: 이미 재생 중인 출력도 즉시 감쇠');
    setup();schoolCue(owner,'finish');silenceAudio();ok(audioVoices.length===0&&Object.keys(thr).length===0&&schoolAudioJobs.length===0,'중단 시 음원/예약/제한 기록 정리');
    const lengths=[];for(const kind of ['skill','combo','awk']){setup();const x=soundOwner(kind,kind==='skill'?'breath':kind==='combo'?'breath':'inferno');schoolCue(x,'finish');lengths.push([audioVoices.length,Math.max(...audioVoices.map(v=>v.end-AC.currentTime))])}
    ok(lengths[1][0]>lengths[0][0]&&lengths[2][0]>lengths[0][0]&&lengths[1][1]>lengths[0][1]&&lengths[2][1]>lengths[0][1],'연계/각성은 일반기보다 많은 층과 긴 잔향');
    const originalSet=Storage.prototype.setItem;let stored=null;try{Storage.prototype.setItem=function(key,value){if(key===KEY){stored=value;return}throw Error('예상 밖 저장 키')};setup();S.volume=37;persist();ok(JSON.parse(stored).volume===37,'음량 실제 save 직렬화');load(JSON.parse(stored));ok(S.volume===37,'음량 저장 복원');load({best:72});ok(S.volume===100,'예전 저장 음량 기본 100%');for(const [v,want] of [[0,0],[-1,0],[101,100],[null,100],['37',100]]){load({volume:v});ok(S.volume===want,'음량 경계/손상 값 '+v)}}finally{Storage.prototype.setItem=originalSet}
  }finally{AC=saved.AC;master=saved.master;noiseBuf=saved.noiseBuf;audioBed=saved.audioBed;audioLead=saved.audioLead;audioVoices=saved.audioVoices;schoolAudioJobs=saved.schoolAudioJobs;schoolSoundContext=saved.schoolSoundContext;skillHit=saved.hit;schoolCue=saved.cue;Math.random=saved.random;reset()}
}
