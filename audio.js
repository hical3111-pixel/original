'use strict';
/* 모든 층은 WebAudio 합성. 이 표에 계열만 추가하면 SCHOOLS 소속 함수에 자동 연결한다. */
const SFX_SCHOOL={
  crimson:{
    cast:[{wave:'sine',f:65,to:135,d:.48,v:.32},{wave:'sawtooth',f:82,to:122,d:.5,v:.08},{noise:'lowpass',f:700,to:1600,d:.55,v:.13}],
    hit:[{wave:'sine',f:125,to:32,d:.24,v:.52},{noise:'lowpass',f:1100,to:280,d:.24,v:.24},{wave:'sawtooth',f:100,to:60,d:.28,v:.055}],
    finish:[{wave:'sine',f:90,to:25,d:.85,v:.68},{wave:'sawtooth',f:83,to:42,d:.72,v:.085},{wave:'sawtooth',f:87,to:40,d:.8,v:.075},{noise:'lowpass',f:850,to:180,d:.9,v:.28},{noise:'bandpass',f:1700,to:450,d:.42,v:.09,delay:.09}],
    voices:{breath:{pitch:.85,tail:1.1,cues:[[1.35,'finish']],listen:[.5,1.35]},cannon:{pitch:.68,tail:1.15,listen:[.9,1.1]},demon:{pitch:.75,tail:1.2,cues:[[.12,'hit'],[.5,'finish']],listen:[.12,.5]},upper:{pitch:1.2,tail:.75,listen:[.2,1.2]},'combo:breath':{pitch:.82,listen:[.1,.8]},'combo:demon':{pitch:.64,listen:[.1,1.3]},inferno:{pitch:.58,listen:[1.25,2.3]}}
  },
  frost:{
    cast:[{wave:'sine',f:1174,to:1182,d:.65,v:.12},{wave:'triangle',f:1760,to:1745,d:.5,v:.065,delay:.06},{noise:'highpass',f:3200,to:6000,d:.65,v:.075}],
    hit:[{noise:'highpass',f:5500,to:8000,d:.16,v:.2},{wave:'sine',f:2637,to:2510,d:.3,v:.11},{wave:'triangle',f:3520,to:3270,d:.24,v:.06,delay:.025}],
    finish:[{noise:'highpass',f:5800,to:2400,d:.45,v:.26},{wave:'sine',f:1046,to:1034,d:1.15,v:.18},{wave:'sine',f:1568,to:1555,d:1.05,v:.12,delay:.045},{wave:'triangle',f:2350,to:2260,d:.75,v:.075,delay:.08},{noise:'bandpass',f:2800,to:900,d:.85,v:.1,delay:.08}],
    voices:{frostcut:{pitch:1.18,tail:.75,listen:[.45,.9]},icedragon:{pitch:.78,tail:1.15,listen:[1.15,1.18]},iceflower:{pitch:1.05,tail:1.1,listen:[.6,1]},frostspiral:{pitch:.9,tail:1,listen:[.55,1.3]},'combo:frostcut':{pitch:.82,listen:[.55,1.15]},'combo:iceflower':{pitch:1.05,listen:[.55,1.3]},frostcrown:{pitch:.72,listen:[.65,1.6]}}
  }
};
const AUDIO_LIMIT=24;
let audioBed=null,audioLead=null,audioVoices=[],schoolSoundContext=null,schoolAudioJobs=[];
const soundVolume=v=>Number.isFinite(v)?clamp(v,0,100):100;
function audioGraph(){master=AC.createGain();master.gain.value=.32*soundVolume(S.volume)/100*(S.sound?1:0);master.connect(AC.destination);audioBed=AC.createGain();audioLead=AC.createGain();audioBed.connect(master);audioLead.connect(master)}
function audioVolume(){if(master&&AC){master.gain.cancelScheduledValues(AC.currentTime);master.gain.setTargetAtTime(S.sound?.32*soundVolume(S.volume)/100:0,AC.currentTime,.015)}}
function audioPrune(){audioVoices=audioVoices.filter(v=>{if(v.end>AC.currentTime)return true;try{v.source.disconnect()}catch(e){}return false})}
function audioRoom(priority=0){if(!AC||!S.sound||S.volume===0)return false;audioPrune();if(audioVoices.length<AUDIO_LIMIT)return true;
  const i=audioVoices.findIndex(v=>v.priority<priority);if(i<0)return false;const [v]=audioVoices.splice(i,1);try{v.source.stop();v.source.disconnect()}catch(e){}return true}
function audioTrack(source,end,priority=0){const voice={source,end,priority};audioVoices.push(voice);source.onended=()=>{const i=audioVoices.indexOf(voice);if(i>=0)audioVoices.splice(i,1);source.disconnect()}}
function silenceAudio(){for(const v of audioVoices){try{v.source.stop();v.source.disconnect()}catch(e){}}audioVoices=[];schoolAudioJobs=[];for(const k in thr)delete thr[k];if(AC&&audioBed){audioBed.gain.cancelScheduledValues(AC.currentTime);audioBed.gain.setValueAtTime(1,AC.currentTime)}audioVolume()}
function audioDuck(){if(!audioBed)return;const t=AC.currentTime;audioBed.gain.cancelScheduledValues(t);audioBed.gain.setValueAtTime(.38,t);audioBed.gain.linearRampToValueAtTime(1,t+.36)}
function soundOwner(kind,id){const school=kind==='combo'?COMBOS.find(c=>c.a===id)?.school:kind==='awk'?SCHOOLS.find(s=>s.awk===id)?.id:comboOf(id)?.school;
  return SFX_SCHOOL[school]?{school,kind,id,key:kind==='combo'?'combo:'+id:id}:null}
function withSchoolSound(owner,fn){const prev=schoolSoundContext;schoolSoundContext=owner;try{return fn()}finally{schoolSoundContext=prev}}
function schoolLayer(layer,pitch,tail,gain,priority,delay=0){
  if(!audioRoom(priority))return false;const t=AC.currentTime+(layer.delay||0)+delay,d=layer.d*tail,g=AC.createGain(),source=layer.noise?AC.createBufferSource():AC.createOscillator();
  if(layer.noise){source.buffer=noiseBuf;source.loop=true;const f=AC.createBiquadFilter();f.type=layer.noise;f.Q.value=.65;f.frequency.setValueAtTime(layer.f*pitch,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,layer.to*pitch),t+d);source.connect(f);f.connect(g)}
  else{source.type=layer.wave;source.frequency.setValueAtTime(layer.f*pitch,t);source.frequency.exponentialRampToValueAtTime(Math.max(20,layer.to*pitch),t+d);source.connect(g)}
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(layer.v*gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);g.connect(priority===2?audioLead:audioBed);
  audioTrack(source,t+d+.02,priority);source.start(t);source.stop(t+d+.02);return true;
}
function schoolCue(owner,phase){
  if(!owner||!AC||!S.sound||S.volume===0)return false;
  const palette=SFX_SCHOOL[owner.school],layers=palette?.[phase];if(!layers)return false;
  const now=AC.currentTime,key='school:'+owner.school+':'+owner.key+':'+phase,gap=phase==='hit'?.095:phase==='finish'?.18:.15;
  if(now-(thr[key]??-Infinity)<gap)return false;thr[key]=now;
  const voice=palette.voices?.[owner.key]||{},large=owner.kind!=='skill',tail=(voice.tail||1)*(large?1.35:1),gain=large?1.12:1,pitch=voice.pitch||1,priority=phase==='finish'?2:1;
  if(phase==='finish')audioDuck();let count=0;
  for(const layer of layers)if(schoolLayer(layer,pitch,tail,gain,priority))count++;
  // 연계/각성은 뒤에 낮고 약한 잔향 층을 더한다. 새 녹음 파일은 사용하지 않는다.
  if(large&&phase==='finish')for(const layer of layers.slice(0,2))if(schoolLayer(layer,pitch*.75,tail*1.15,gain*.35,priority,.12))count++;
  return count>0;
}
function schoolImpact(o){if(!schoolSoundContext)return;schoolCue(schoolSoundContext,'hit');if(o?.heavy)schoolCue(schoolSoundContext,'finish')}
function bindSchoolFX(o){if(!schoolSoundContext)return o;const owner=schoolSoundContext;for(const key of ['up','end']){const fn=o[key];if(fn)o[key]=function(...args){return withSchoolSound(owner,()=>fn.apply(this,args))}}return o}
function tickSchoolAudio(){for(let i=schoolAudioJobs.length-1;i>=0;i--){const j=schoolAudioJobs[i];if(gt>=j.at){schoolAudioJobs.splice(i,1);schoolCue(j.owner,j.phase)}}}
function installSchoolSounds(){
  for(const [kind,list] of [['skill',SK],['combo',COMBOS],['awk',AWK]])for(const a of list){const id=kind==='combo'?a.a:a.id,owner=soundOwner(kind,id);if(!owner)continue;const fn=a.fn;
    a.fn=function(...args){schoolCue(owner,'cast');for(const [t,phase] of SFX_SCHOOL[owner.school].voices?.[owner.key]?.cues||[])schoolAudioJobs.push({owner,phase,at:gt+t});return withSchoolSound(owner,()=>fn.apply(this,args))};
  }
  const branch=branchFX;branchFX=function(s,pm){const owner=soundOwner('skill',s.id);return owner?withSchoolSound(owner,()=>branch(s,pm)):branch(s,pm)};
}
installSchoolSounds();
