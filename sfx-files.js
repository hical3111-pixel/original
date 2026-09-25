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
  },
  "field_fire": {
    "path": "sfx/field_fire.mp3",
    "label": "실녹음 · 거세지는 불꽃",
    "pack": "Fire Whoosh",
    "original": "244926__hnhnh__fire-whoosh.wav",
    "author": "hnhnh",
    "source": "https://freesound.org/people/hnhnh/sounds/244926/",
    "license": "CC0 1.0",
    "preview": true,
    "trim": [
      1.65,
      1.9
    ],
    "bytes": 31390,
    "asset": "https://cdn.freesound.org/previews/244/244926_3983630-hq.mp3"
  },
  "field_ice": {
    "path": "sfx/field_ice.mp3",
    "label": "실녹음 · 얼음 균열",
    "pack": "Ice Cracking",
    "original": "342546__timbreknight__ice-cracking.wav",
    "author": "timbreknight",
    "source": "https://freesound.org/people/timbreknight/sounds/342546/",
    "license": "CC0 1.0",
    "preview": true,
    "trim": [
      0.44,
      1.0
    ],
    "bytes": 17179,
    "asset": "https://cdn.freesound.org/previews/342/342546_3562222-hq.mp3"
  },
  "field_ice_heavy": {
    "path": "sfx/field_ice_heavy.mp3",
    "label": "실녹음 · 큰 얼음 균열",
    "pack": "Ice Cracking",
    "original": "342546__timbreknight__ice-cracking.wav",
    "author": "timbreknight",
    "source": "https://freesound.org/people/timbreknight/sounds/342546/",
    "license": "CC0 1.0",
    "preview": true,
    "trim": [
      4.02,
      1.1
    ],
    "bytes": 17179,
    "asset": "https://cdn.freesound.org/previews/342/342546_3562222-hq.mp3"
  },
  "field_growl": {
    "path": "sfx/field_growl.mp3",
    "label": "목소리 가공 · 깊은 괴수 포효",
    "pack": "Deep Monster Growl",
    "original": "222523__uagadugu__deep-monster-growl.wav",
    "author": "uagadugu",
    "source": "https://freesound.org/people/uagadugu/sounds/222523/",
    "license": "CC0 1.0",
    "preview": true,
    "trim": [
      0.26,
      2.4
    ],
    "bytes": 39331,
    "asset": "https://cdn.freesound.org/previews/222/222523_255863-hq.mp3"
  },
  "spell_fire": {
    "path": "sfx/spell_fire.mp3",
    "label": "불 마법 · 짧은 폭발",
    "pack": "Basic Spell Impacts",
    "original": "Fire Spell Impacts/Fire Spell Impact 4.wav",
    "author": "lentikula",
    "source": "https://lentikula.itch.io/freecc0-basic-spell-impacts-sfx",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0.03,
      1.8
    ],
    "bytes": 29718
  },
  "spell_fire_heavy": {
    "path": "sfx/spell_fire_heavy.mp3",
    "label": "불 마법 · 번지는 강타",
    "pack": "Basic Spell Impacts",
    "original": "Fire Spell Impacts/Fire Spell Impact 2.wav",
    "author": "lentikula",
    "source": "https://lentikula.itch.io/freecc0-basic-spell-impacts-sfx",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0,
      2.9
    ],
    "bytes": 46018
  },
  "spell_ice": {
    "path": "sfx/spell_ice.mp3",
    "label": "얼음 마법 · 날카로운 결정",
    "pack": "Basic Spell Impacts",
    "original": "Ice Spell Impacts/Ice Spell Impact 5.wav",
    "author": "lentikula",
    "source": "https://lentikula.itch.io/freecc0-basic-spell-impacts-sfx",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0.015,
      1.75
    ],
    "bytes": 28882
  },
  "spell_ice_heavy": {
    "path": "sfx/spell_ice_heavy.mp3",
    "label": "얼음 마법 · 퍼지는 파편",
    "pack": "Basic Spell Impacts",
    "original": "Ice Spell Impacts/Ice Spell Impact 2.wav",
    "author": "lentikula",
    "source": "https://lentikula.itch.io/freecc0-basic-spell-impacts-sfx",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0,
      2.5
    ],
    "bytes": 41003
  },
  "shatter": {
    "path": "sfx/shatter.mp3",
    "label": "얼음 파손 · 짧게 부서짐",
    "pack": "Ice breaking/shattering",
    "original": "IceShatters/LedasLuzta.ogg",
    "author": "IgnasD",
    "source": "https://opengameart.org/content/ice-breakingshattering",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0,
      0.58
    ],
    "bytes": 10492
  },
  "shatter_heavy": {
    "path": "sfx/shatter_heavy.mp3",
    "label": "얼음 파손 · 굵은 파편",
    "pack": "Ice breaking/shattering",
    "original": "IceShatters/LedasLuzta33.ogg",
    "author": "IgnasD",
    "source": "https://opengameart.org/content/ice-breakingshattering",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0.03,
      1.27
    ],
    "bytes": 21358
  },
  "body_hit": {
    "path": "sfx/body_hit.mp3",
    "label": "타격 · 짧고 둔한 충격",
    "pack": "37 hits/punches",
    "original": "hits/hit09.mp3.flac",
    "author": "Independent.nu (submitted by qubodup)",
    "source": "https://opengameart.org/content/37-hitspunches",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0.125,
      0.47
    ],
    "bytes": 8402
  },
  "body_hit_heavy": {
    "path": "sfx/body_hit_heavy.mp3",
    "label": "타격 · 깊게 울리는 충격",
    "pack": "37 hits/punches",
    "original": "hits/hit10.mp3.flac",
    "author": "Independent.nu (submitted by qubodup)",
    "source": "https://opengameart.org/content/37-hitspunches",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0.04,
      1.0
    ],
    "bytes": 17179
  },
  "field_blast": {
    "path": "sfx/field_blast.mp3",
    "label": "실녹음 · 폭죽 폭발",
    "pack": "Firecracker Explosion",
    "original": "609588__unfa__firecracker-explosion.flac",
    "author": "unfa",
    "source": "https://freesound.org/people/unfa/sounds/609588/",
    "license": "CC0 1.0",
    "preview": true,
    "trim": [
      0,
      2.2
    ],
    "bytes": 36405,
    "asset": "https://cdn.freesound.org/previews/609/609588_1038806-hq.mp3"
  },
  "itch_fire1": {
    "path": "sfx/itch_fire1.mp3",
    "label": "불 마법 1 · 강타",
    "pack": "Basic Spell Impacts",
    "original": "Fire Spell Impacts/Fire Spell Impact 1.wav",
    "author": "lentikula",
    "source": "https://lentikula.itch.io/freecc0-basic-spell-impacts-sfx",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0.5,
      2.4
    ],
    "bytes": 39331
  },
  "itch_fire3": {
    "path": "sfx/itch_fire3.mp3",
    "label": "불 마법 3 · 짧은 적중",
    "pack": "Basic Spell Impacts",
    "original": "Fire Spell Impacts/Fire Spell Impact 3.wav",
    "author": "lentikula",
    "source": "https://lentikula.itch.io/freecc0-basic-spell-impacts-sfx",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0.45,
      0.65
    ],
    "bytes": 11327
  },
  "itch_fire5": {
    "path": "sfx/itch_fire5.mp3",
    "label": "불 마법 5 · 강타",
    "pack": "Basic Spell Impacts",
    "original": "Fire Spell Impacts/Fire Spell Impact 5.wav",
    "author": "lentikula",
    "source": "https://lentikula.itch.io/freecc0-basic-spell-impacts-sfx",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0.055,
      1.8
    ],
    "bytes": 29718
  },
  "itch_ice1": {
    "path": "sfx/itch_ice1.mp3",
    "label": "얼음 마법 1 · 강타",
    "pack": "Basic Spell Impacts",
    "original": "Ice Spell Impacts/Ice Spell Impact 1.wav",
    "author": "lentikula",
    "source": "https://lentikula.itch.io/freecc0-basic-spell-impacts-sfx",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0.6,
      1.8
    ],
    "bytes": 29718
  },
  "itch_ice3": {
    "path": "sfx/itch_ice3.mp3",
    "label": "얼음 마법 3 · 짧은 적중",
    "pack": "Basic Spell Impacts",
    "original": "Ice Spell Impacts/Ice Spell Impact 3.wav",
    "author": "lentikula",
    "source": "https://lentikula.itch.io/freecc0-basic-spell-impacts-sfx",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0.61,
      0.65
    ],
    "bytes": 11327
  },
  "itch_ice4": {
    "path": "sfx/itch_ice4.mp3",
    "label": "얼음 마법 4 · 강타",
    "pack": "Basic Spell Impacts",
    "original": "Ice Spell Impacts/Ice Spell Impact 4.wav",
    "author": "lentikula",
    "source": "https://lentikula.itch.io/freecc0-basic-spell-impacts-sfx",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0.45,
      1.4
    ],
    "bytes": 23448
  },
  "itch_wind2": {
    "path": "sfx/itch_wind2.mp3",
    "label": "바람 마법 2 · 기 모으기",
    "pack": "Druid Spell Impacts",
    "original": "Wind Spell Impacts/Wind Spell Impact 2.wav",
    "author": "lentikula",
    "source": "https://lentikula.itch.io/druid-spell-impacts",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0.175,
      1.5
    ],
    "bytes": 24284
  },
  "itch_wind5": {
    "path": "sfx/itch_wind5.mp3",
    "label": "바람 마법 5 · 기 모으기",
    "pack": "Druid Spell Impacts",
    "original": "Wind Spell Impacts/Wind Spell Impact 5.wav",
    "author": "lentikula",
    "source": "https://lentikula.itch.io/druid-spell-impacts",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0.05,
      0.8
    ],
    "bytes": 12999
  },
  "itch_heal10": {
    "path": "sfx/itch_heal10.mp3",
    "label": "회복 마법 10 · 결정 준비",
    "pack": "Healing Spell Impacts",
    "original": "Impacts/Healing Spell Impact 10.wav",
    "author": "lentikula",
    "source": "https://lentikula.itch.io/healing-spell-impacts",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0.13,
      0.8
    ],
    "bytes": 13835
  },
  "itch_heal11": {
    "path": "sfx/itch_heal11.mp3",
    "label": "회복 마법 11 · 결정 준비",
    "pack": "Healing Spell Impacts",
    "original": "Impacts/Healing Spell Impact 11.wav",
    "author": "lentikula",
    "source": "https://lentikula.itch.io/healing-spell-impacts",
    "license": "CC0 1.0",
    "preview": false,
    "trim": [
      0,
      1.5
    ],
    "bytes": 24284
  }
};
// kind 별 시작/적중/마무리. selected는 임시 기본값이며 후보 목록 안에 있어야 한다.
const sfxSlot=(selected,...candidates)=>({selected,candidates:[selected,...candidates]});
SFX_SCHOOL.crimson.files={
  skill:{cast:sfxSlot('itch_wind5','itch_fire5','field_fire','field_growl','spell_fire','fire','fire2','slice','rumble2'),hit:sfxSlot('itch_fire3','spell_fire','body_hit','body_hit_heavy','punch','punch2','chop','crunch'),finish:sfxSlot('itch_fire1','spell_fire_heavy','field_blast','spell_fire','crunch','rumble','crunch2','metal')},
  combo:{cast:sfxSlot('itch_fire5','itch_wind2','field_growl','field_fire','spell_fire','fire2','fire','rumble2'),hit:sfxSlot('spell_fire','itch_fire3','body_hit_heavy','field_blast','crunch2','punch2','metal'),finish:sfxSlot('spell_fire_heavy','itch_fire1','field_blast','rumble','crunch','crunch2','rumble2')},
  awk:{cast:sfxSlot('itch_wind2','itch_fire5','field_growl','field_fire','rumble2','fire2','fire'),hit:sfxSlot('itch_fire3','spell_fire','body_hit_heavy','spell_fire_heavy','metal','crunch2','punch'),finish:sfxSlot('itch_fire1','spell_fire_heavy','field_blast','crunch2','rumble','crunch')}
};
SFX_SCHOOL.frost.files={
  skill:{cast:sfxSlot('itch_heal10','itch_wind5','field_ice','spell_ice','slice','slice2','bell','glasslight'),hit:sfxSlot('itch_ice3','spell_ice','shatter','field_ice_heavy','body_hit','glasslight','glassmid','punch','chop'),finish:sfxSlot('itch_ice1','itch_ice4','shatter_heavy','spell_ice','field_ice_heavy','glass','glass2','bell','metal')},
  combo:{cast:sfxSlot('itch_wind2','itch_heal10','spell_ice','field_ice','bell','bell2','slice2'),hit:sfxSlot('spell_ice','itch_ice3','field_ice_heavy','shatter','body_hit_heavy','glassmid','glasslight','metal'),finish:sfxSlot('spell_ice_heavy','itch_ice1','shatter_heavy','glass2','glass','bell2')},
  awk:{cast:sfxSlot('itch_heal11','itch_heal10','spell_ice_heavy','field_ice','bell2','bell','slice'),hit:sfxSlot('itch_ice4','itch_ice3','shatter_heavy','field_ice_heavy','glass','glassmid','punch2'),finish:sfxSlot('itch_ice1','spell_ice_heavy','shatter_heavy','glass2','bell2','glass','metal')}
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
