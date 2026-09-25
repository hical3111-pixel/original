'use strict';
// CC0 원본·변환 기록: CREDITS.md. 게임 실행 시 외부 도구는 필요 없다.
const SFX_FILES={
  "rumble": {
    "path": "sfx/rumble.mp3",
    "label": "깊은 저음 폭발",
    "pack": "Sci-fi Sounds",
    "original": "Audio/lowFrequency_explosion_000.ogg",
    "bytes": 33061
  },
  "rumble2": {
    "path": "sfx/rumble2.mp3",
    "label": "낮게 번지는 폭발",
    "pack": "Sci-fi Sounds",
    "original": "Audio/lowFrequency_explosion_001.ogg",
    "bytes": 17179
  },
  "crunch": {
    "path": "sfx/crunch.mp3",
    "label": "거칠게 터지는 폭발",
    "pack": "Sci-fi Sounds",
    "original": "Audio/explosionCrunch_000.ogg",
    "bytes": 13417
  },
  "crunch2": {
    "path": "sfx/crunch2.mp3",
    "label": "파편 섞인 폭발",
    "pack": "Sci-fi Sounds",
    "original": "Audio/explosionCrunch_003.ogg",
    "bytes": 25956
  },
  "fire": {
    "path": "sfx/fire.mp3",
    "label": "불꽃 분사",
    "pack": "Sci-fi Sounds",
    "original": "Audio/thrusterFire_000.ogg",
    "bytes": 81127
  },
  "fire2": {
    "path": "sfx/fire2.mp3",
    "label": "거친 분사음",
    "pack": "Sci-fi Sounds",
    "original": "Audio/thrusterFire_002.ogg",
    "bytes": 81127
  },
  "glass": {
    "path": "sfx/glass.mp3",
    "label": "두꺼운 유리 파손",
    "pack": "Impact Sounds",
    "original": "Audio/impactGlass_heavy_000.ogg",
    "bytes": 5058
  },
  "glass2": {
    "path": "sfx/glass2.mp3",
    "label": "유리 파편 강타",
    "pack": "Impact Sounds",
    "original": "Audio/impactGlass_heavy_003.ogg",
    "bytes": 3804
  },
  "glasslight": {
    "path": "sfx/glasslight.mp3",
    "label": "작은 유리 조각",
    "pack": "Impact Sounds",
    "original": "Audio/impactGlass_light_002.ogg",
    "bytes": 4222
  },
  "glassmid": {
    "path": "sfx/glassmid.mp3",
    "label": "맑은 유리 충돌",
    "pack": "Impact Sounds",
    "original": "Audio/impactGlass_medium_001.ogg",
    "bytes": 9656
  },
  "bell": {
    "path": "sfx/bell.mp3",
    "label": "낮은 금속 종 울림",
    "pack": "Impact Sounds",
    "original": "Audio/impactBell_heavy_000.ogg",
    "bytes": 24702
  },
  "bell2": {
    "path": "sfx/bell2.mp3",
    "label": "긴 금속 종 울림",
    "pack": "Impact Sounds",
    "original": "Audio/impactBell_heavy_003.ogg",
    "bytes": 11745
  },
  "punch": {
    "path": "sfx/punch.mp3",
    "label": "묵직한 타격",
    "pack": "Impact Sounds",
    "original": "Audio/impactPunch_heavy_000.ogg",
    "bytes": 11327
  },
  "punch2": {
    "path": "sfx/punch2.mp3",
    "label": "단단한 강타",
    "pack": "Impact Sounds",
    "original": "Audio/impactPunch_heavy_003.ogg",
    "bytes": 8820
  },
  "metal": {
    "path": "sfx/metal.mp3",
    "label": "무거운 금속 충돌",
    "pack": "Impact Sounds",
    "original": "Audio/impactMetal_heavy_002.ogg",
    "bytes": 2968
  },
  "slice": {
    "path": "sfx/slice.mp3",
    "label": "날카로운 베기",
    "pack": "RPG Audio",
    "original": "Audio/knifeSlice.ogg",
    "bytes": 10492
  },
  "slice2": {
    "path": "sfx/slice2.mp3",
    "label": "짧은 베기",
    "pack": "RPG Audio",
    "original": "Audio/knifeSlice2.ogg",
    "bytes": 10074
  },
  "chop": {
    "path": "sfx/chop.mp3",
    "label": "내려찍기",
    "pack": "RPG Audio",
    "original": "Audio/chop.ogg",
    "bytes": 5058
  }
};
// kind 별 시작/적중/마무리. selected는 임시 기본값이며 후보 목록 안에 있어야 한다.
const sfxSlot=(selected,...candidates)=>({selected,candidates:[selected,...candidates]});
SFX_SCHOOL.crimson.files={
  skill:{cast:sfxSlot('fire','fire2','slice','rumble2'),hit:sfxSlot('punch','punch2','chop','crunch'),finish:sfxSlot('crunch','rumble','crunch2','metal')},
  combo:{cast:sfxSlot('fire2','fire','rumble2'),hit:sfxSlot('crunch2','punch2','metal'),finish:sfxSlot('rumble','crunch','crunch2','rumble2')},
  awk:{cast:sfxSlot('rumble2','fire2','fire'),hit:sfxSlot('metal','crunch2','punch'),finish:sfxSlot('crunch2','rumble','crunch')}
};
SFX_SCHOOL.frost.files={
  skill:{cast:sfxSlot('slice','slice2','bell','glasslight'),hit:sfxSlot('glasslight','glassmid','punch','chop'),finish:sfxSlot('glass','glass2','bell','metal')},
  combo:{cast:sfxSlot('bell','bell2','slice2'),hit:sfxSlot('glassmid','glasslight','metal'),finish:sfxSlot('glass2','glass','bell2')},
  awk:{cast:sfxSlot('bell2','bell','slice'),hit:sfxSlot('glass','glassmid','punch2'),finish:sfxSlot('glass2','bell2','glass','metal')}
};
const SFX_CACHE=new WeakMap(),labSoundChoices=Object.create(null);
let sfxPlaybackEpoch=0,sfxRandomSeed=0x62a914b3;
// 소리 변주가 전투의 Math.random 순서를 바꾸지 않도록 독립 난수를 쓴다.
function sfxJitter(){sfxRandomSeed=(Math.imul(sfxRandomSeed,1664525)+1013904223)>>>0;return sfxRandomSeed/4294967296}
function sfxChoiceKey(owner,phase){return owner.school+'.'+owner.kind+'.'+phase}
function sfxChoice(owner,phase){const slot=SFX_SCHOOL[owner.school]?.files?.[owner.kind]?.[phase];if(!slot)return null;const choice=LAB_MODE&&labSoundChoices[sfxChoiceKey(owner,phase)];return choice&&slot.candidates.includes(choice)?choice:slot.selected}
function sfxCache(ac){let c=SFX_CACHE.get(ac);if(!c){c=new Map();SFX_CACHE.set(ac,c)}return c}
function loadSfx(id,ac=AC){
  if(!ac||typeof ac.decodeAudioData!=='function'||!SFX_FILES[id])return Promise.resolve(null);
  const cache=sfxCache(ac),old=cache.get(id);if(old?.failed&&performance.now()-old.failedAt>5000)cache.delete(id);if(cache.has(id))return cache.get(id).promise;
  const entry={buffer:null,failed:false,promise:null};cache.set(id,entry);
  entry.promise=(async()=>{const controller=new AbortController();let timer;
    try{
      const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('audio timeout'))},8000)});
      const work=(async()=>{const response=await fetch(SFX_FILES[id].path,{signal:controller.signal});if(!response.ok)throw Error('audio '+response.status);const bytes=await response.arrayBuffer();
        // 콜백 방식도 전달해 이전 Safari의 decodeAudioData에 대응한다.
        return await new Promise((resolve,reject)=>{const p=ac.decodeAudioData(bytes,resolve,reject);if(p?.then)p.then(resolve,reject)})})();
      entry.buffer=await Promise.race([work,timeout]);if(!entry.buffer||!(entry.buffer.duration>0))throw Error('empty audio');return entry.buffer;
    }catch(e){entry.failed=true;entry.failedAt=performance.now();entry.error=String(e);entry.buffer=null;return null}finally{clearTimeout(timer)}
  })();return entry.promise;
}
function warmSchoolFiles(owner){if(!owner||!AC||!S.sound||S.volume===0)return Promise.resolve([]);return Promise.all(['cast','hit','finish'].map(p=>loadSfx(sfxChoice(owner,p))))}
function playSfxBuffer(id,buffer,owner,phase){
  const priority=phase==='finish'?2:1;if(!audioRoom(priority))return false;
  const t=AC.currentTime,key='file:'+id;if(t-(thr[key]??-Infinity)<.085)return false;thr[key]=t;
  const source=AC.createBufferSource(),g=AC.createGain(),voice=SFX_SCHOOL[owner.school]?.voices?.[owner.key]||{},large=owner.kind!=='skill';
  const rate=clamp(1+((voice.pitch||1)-1)*.2,.88,1.08)*(1+(sfxJitter()-.5)*.06),duration=Math.min(buffer.duration,phase==='cast'?(large?1.6:.85):phase==='hit'?.7:large?2.4:1.6)/rate;
  source.buffer=buffer;source.playbackRate.value=rate;const volume=(large?.92:.8)*(1+(sfxJitter()-.5)*.1);g.gain.setValueAtTime(volume,t);g.gain.setValueAtTime(volume,t+Math.max(0,duration-.18));g.gain.linearRampToValueAtTime(0,t+duration);source.connect(g);g.connect(priority===2?audioLead:audioBed);
  audioTrack(source,t+duration+.02,priority);source.start(t);source.stop(t+duration+.02);
  if(phase==='finish'){audioDuck();schoolLayer(SFX_SCHOOL.crimson.finish[0],owner.school==='frost'?1.3:1,large?1.25:.8,large?.45:.28,2)}
  return true;
}
function schoolFileCue(owner,phase){
  const id=sfxChoice(owner,phase);if(!id||typeof AC.decodeAudioData!=='function')return null;
  if(phase==='cast')warmSchoolFiles(owner);else loadSfx(id);
  const buffer=sfxCache(AC).get(id)?.buffer;if(!buffer)return null;
  try{return playSfxBuffer(id,buffer,owner,phase)}catch(e){sfxCache(AC).delete(id);return null}
}
