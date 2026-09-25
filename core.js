'use strict';
/* ================= utils ================= */
const $=id=>document.getElementById(id);
const rnd=(a,b)=>a+Math.random()*(b-a);
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const easeOut=t=>1-Math.pow(1-t,3);
const easeIn=t=>t*t*t;
const easeBack=t=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)};
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const FXS=RM?.35:1;
if(!CanvasRenderingContext2D.prototype.roundRect){CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){r=Math.min(r,w/2,h/2);this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath();}}
function fmt(n){
  if(!isFinite(n))return '∞';
  if(n<1000)return n<10&&n%1?n.toFixed(1):Math.floor(n).toString();
  const u=['K','M','B','T'];let i=-1;
  while(n>=1000&&i<700){n/=1000;i++}
  const s=i<4?u[i]:String.fromCharCode(97+Math.floor((i-4)/26)%26)+String.fromCharCode(97+(i-4)%26);
  return (n<10?n.toFixed(2):n<100?n.toFixed(1):Math.floor(n))+s;
}

/* ================= state ================= */
const KEY='blade-road-v1';
const freshLv=()=>({atk:0,spd:0,crit:0,critd:0,skill:0,spirit:0,archer:0,mage:0,greed:0});
const fresh=()=>({gold:0,stage:1,kills:0,maxStage:1,best:1,farm:false,farmKills:0,lv:freshLv(),souls:0,auto:true,sound:true,t:Date.now(),totalKills:0,
  relics:{},ach:{},title:'',loadout:['dash'],equip:['dash','neon'],maxCombo:0,bossKills:0,parries:0,legends:0,rebirths:0,combos:0,awakes:0,eclBoss:0,pulls:0,
  awk:{},daily:{key:'',done:false},dailyWins:0,phase2:0,awkSel:'thousand',codex:{},unlockFloor:0,unlockV:2,
  mastery:{crimson:0,eclipse:0,verdant:0,abyss:0,storm:0,hellfire:0,frost:0}});
let S=fresh();
function load(d){try{const raw=d||JSON.parse(localStorage.getItem(KEY)||'null');if(raw){S=Object.assign(fresh(),raw);if(!raw.unlockV){S.unlockFloor=unlockFloorOf(raw.best||1);S.unlockV=2}S.lv=Object.assign(freshLv(),raw.lv||{});S.relics=Object.assign({},raw.relics||{});S.ach=Object.assign({},raw.ach||{});S.awk=Object.assign({},raw.awk||{});S.daily=Object.assign({key:'',done:false},raw.daily||{});S.codex=Object.assign({},raw.codex||{});S.mastery=Object.assign({crimson:0,eclipse:0,verdant:0,abyss:0,storm:0,hellfire:0,frost:0},raw.mastery||{});restoreLoadout(raw)}}catch(e){}}
function save(){S.t=Date.now();const out=CH?Object.assign({},S,CH.saved):S;try{localStorage.setItem(KEY,JSON.stringify(out))}catch(e){}}

/* ================= daily challenge ================= */
let CH=null;
const DMODS=[
  {id:'crit',n:'급소만 노려라',d:'치명타가 아닌 피해 -85%',c:'#ff6fb5'},
  {id:'seal',n:'봉인된 비기',d:'장착한 앞쪽 2개 스킬만 사용 가능',c:'#9d95c4'},
  {id:'fury',n:'광폭한 보스',d:'보스가 2배 자주 공격 · 패링 반격 피해 2배',c:'#ff4f5e'},
  {id:'glass',n:'유리 대포',d:'주는 피해 3배 · 한 번 기절하면 실패',c:'#7fe8ff'},
  {id:'chain',n:'끝없는 연계',d:'연계 시간 16초 · 연계기 피해 2배',c:'#ffd166'},
  {id:'spirit',n:'검령 축제',d:'검령 6기 · 검령 피해 3배 · 기사 피해 절반',c:'#6ff2ff'},
];
function todayKey(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
function dailyMods(){let s=7;for(const ch of todayKey())s=(s*31+ch.charCodeAt(0))>>>0;const r=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
  const a=Math.floor(r()*DMODS.length);let b=Math.floor(r()*(DMODS.length-1));if(b>=a)b++;return[DMODS[a],DMODS[b]]}
const hasMod=id=>!!CH&&CH.mods.some(x=>x.id===id);
const dailyDone=()=>S.daily.key===todayKey()&&S.daily.done;
const chStage=()=>Math.max(5,Math.floor(S.best*.8/5)*5);
const bossTime=()=>CH?60:30+3*rv('sand');
function chMul(src,crit,o){if(!CH)return 1;let k=1;
  if(hasMod('crit')&&!crit&&src!=='spirit')k*=.15;if(hasMod('glass'))k*=3;
  if(hasMod('spirit')&&(src==='hero'||src==='tap'))k*=.5;if(hasMod('spirit')&&src==='spirit')k*=3;
  if(hasMod('chain')&&o.sid==='combo')k*=2;if(hasMod('fury')&&o.name==='반격')k*=2;return k}

const KPS=8;
const isBoss=s=>s%5===0;
// 밸런스 수치는 여기 한곳에 모은다(성장 곡선 시뮬레이션이 이 값을 바꿔 가며 측정한다)
const BAL={hpG:1.3,goldG:1.19,comboGauge:12,skillGauge:1.2};
// 해금 기준 스테이지. 예전 저장(해금 기준 v1)은 그때 도달했던 위치를 새 기준으로 환산해 S.unlockFloor에 두어, 이미 연 스킬이 다시 잠기지 않게 한다.
const OLD_UNLOCK=[1,3,5,8,9,11,12,14,17,18,20,21,23,26,27,30,32,34,36,40,44,48,52,56,60,64,68,72],NEW_UNLOCK=[1,5,10,15,20,26,32,38,45,52,60,68,76,84,90,96,102,108,114,120,128,136,144,152,160,170,180,190];
function unlockFloorOf(best){for(let i=1;i<OLD_UNLOCK.length;i++)if(best<OLD_UNLOCK[i]){const a=OLD_UNLOCK[i-1],b=OLD_UNLOCK[i];return Math.floor(NEW_UNLOCK[i-1]+(best-a)/(b-a)*(NEW_UNLOCK[i]-NEW_UNLOCK[i-1]))}return 9999}
const ub=()=>Math.max(S.best,S.unlockFloor||0);
const monHp=s=>12*Math.pow(BAL.hpG,s-1);
const goldDrop=s=>4*Math.pow(BAL.goldG,s-1);
const ZONES=['황혼 협곡','심연 숲','불꽃 광산','서리 성채'];
const PAL=[
  ['#0b0820','#2a1748','#7a2d55','#3a1f55','#241641','#140f28','#ff9a7a'],
  ['#03111b','#0b3044','#2f7a70','#12394a','#0b2533','#07161f','#8ff5d8'],
  ['#130606','#3d1210','#9a4318','#4a1a14','#2c0f0d','#170808','#ffb35a'],
  ['#0a1022','#1c2c55','#6186b8','#2a3d6b','#1a2748','#0e1530','#d6ecff']];
const zoneOf=s=>Math.floor((s-1)/10)%4;
const TYPES=['슬라임','골렘','눈알귀','박쥐'];
const ZTYPES=[[0,2,3],[1,3,0],[2,1,3],[0,1,2,3]];
const ZHUES=[14,165,33,208];
function bossTypeOf(s){
  const z=zoneOf(s),pool=ZTYPES[z];
  const bidx=Math.floor((s-1)/40)*2+Math.floor(((s-1)%10)/5);
  return pool[bidx%pool.length];
}
const CODEX=[];
ZONES.forEach((zn,z)=>{
  ZTYPES[z].forEach(t=>{
    let fs=0;
    for(let s=5;s<=400;s+=5){if(zoneOf(s)===z&&bossTypeOf(s)===t){fs=s;break}}
    CODEX.push({id:`${z}_${t}`,z,t,zone:zn,type:TYPES[t],name:`군주 ${TYPES[t]}`,first:fs});
  });
});
function codexCount(){let n=0;for(const c of CODEX)if(S.codex&&S.codex[c.id]>0)n++;return n}
function codexBonus(){return codexCount()*.02}

/* ================= relics & achievements ================= */
const RAR=[{n:'일반',c:'#cfcae3',w:.6},{n:'희귀',c:'#4fa8ff',w:.28},{n:'영웅',c:'#b36bff',w:.1},{n:'전설',c:'#ffc94a',w:.02}];
const RELICS=[
  {id:'coin',r:0,g:'金',name:'녹슨 금화',d:l=>`골드 +${l*8}%`},
  {id:'whet',r:0,g:'砥',name:'숫돌',d:l=>`공격력 +${l*6}%`},
  {id:'boots',r:0,g:'靴',name:'가벼운 장화',d:l=>`공격 속도 +${l*3}%`},
  {id:'ember',r:1,g:'火',name:'불씨 반지',d:l=>`평타 ${10+l*2}% 확률로 화염 폭발`},
  {id:'sand',r:1,g:'砂',name:'시간의 모래',d:l=>`보스 제한 시간 +${l*3}초`},
  {id:'hawk',r:1,g:'眼',name:'매의 눈',d:l=>`치명타 확률 +${l*2}%`},
  {id:'thunder',r:2,g:'雷',name:'천둥 인장',d:l=>`치명타 시 30% 확률로 낙뢰 (공격력 ×${2+l})`},
  {id:'frost',r:2,g:'氷',name:'서리 심장',d:l=>`스킬 재사용 대기 -${Math.min(40,l*5)}%`},
  {id:'shard',r:2,g:'星',name:'별조각',d:l=>`각성 게이지 충전 +${l*25}%`},
  {id:'crown',r:3,g:'王',name:'검왕의 왕관',d:l=>`모든 피해 +${l*25}%`},
  {id:'phoenix',r:3,g:'鳳',name:'불사조 깃털',d:l=>`보스 공격을 맞으면 기절 대신 반격 (공격력 ×${4*l})`},
  {id:'abyss',r:3,g:'淵',name:'심연의 눈',d:l=>`스킬 피해 +${l*40}%`},
];
const rv=id=>S.relics[id]||0;
const ACH=[
  {id:'s10',name:'첫 발걸음',title:'견습 검사',desc:'STAGE 10 도달',p:()=>[S.best,10]},
  {id:'s25',name:'협곡 너머',title:'떠돌이 검객',desc:'STAGE 25 도달',p:()=>[S.best,25]},
  {id:'s50',name:'검로의 중턱',title:'검호',desc:'STAGE 50 도달',p:()=>[S.best,50]},
  {id:'s100',name:'끝없는 자',title:'검성',desc:'STAGE 100 도달',p:()=>[S.best,100]},
  {id:'c100',name:'백연격',title:'연격의 달인',desc:'콤보 100 달성',p:()=>[S.maxCombo,100]},
  {id:'c500',name:'끊기지 않는 검',title:'폭풍 검무',desc:'콤보 500 달성',p:()=>[S.maxCombo,500]},
  {id:'b10',name:'군주 사냥꾼',title:'군주 사냥꾼',desc:'보스 10회 처치',p:()=>[S.bossKills,10]},
  {id:'b50',name:'왕관 수집가',title:'왕 살해자',desc:'보스 50회 처치',p:()=>[S.bossKills,50]},
  {id:'ecl',name:'검은 태양 아래',title:'일식의 주인',desc:'일식으로 보스 처치',p:()=>[S.eclBoss,1]},
  {id:'par',name:'칼날 위의 춤',title:'패링 마스터',desc:'패링 10회 성공',p:()=>[S.parries,10]},
  {id:'leg',name:'전설과의 조우',title:'선택받은 자',desc:'전설 유물 획득',p:()=>[S.legends,1]},
  {id:'reb',name:'다시 걷는 길',title:'윤회자',desc:'환생 1회',p:()=>[S.rebirths,1]},
  {id:'cmb',name:'합의 극의',title:'연계의 달인',desc:'연계기 5회 발동',p:()=>[S.combos,5]},
  {id:'awk',name:'천검',title:'천검의 주인',desc:'각성 10회 발동',p:()=>[S.awakes,10]},
  {id:'ph2',name:'진노를 넘어',title:'분노 진압자',desc:'2페이즈 보스 10회 처치',p:()=>[S.phase2,10]},
  {id:'dly',name:'시련의 길',title:'시련 돌파자',desc:'일일 도전 3회 성공',p:()=>[S.dailyWins,3]},
];

/* ================= stats ================= */
function stats(lv=S.lv){
  const soul=1+0.1*S.souls,am=1+.03*Object.keys(S.ach).length,cdx=1+codexBonus();
  const atk=4*(1+lv.atk)*Math.pow(1.08,lv.atk)*soul*(1+.06*rv('whet'))*(1+.25*rv('crown'))*am*cdx;
  return{atk,aps:(1.2+0.12*lv.spd)*(1+.03*rv('boots')),cc:Math.min(.8,.05+.02*lv.crit+.02*rv('hawk')),cm:2+.3*lv.critd,
    sn:hasMod('spirit')?6:Math.min(6,lv.spirit),sd:atk*.35*(1+.15*Math.max(0,lv.spirit-1))*(lv.spirit||hasMod('spirit')?1:0),
    ar:lv.archer?atk*.3*Math.pow(lv.archer,.9):0,mg:lv.mage?atk*1.4*Math.pow(lv.mage,.9):0,
    gm:(1+.2*lv.greed)*soul*(1+.08*rv('coin')),sk:(1+.25*lv.skill)*(1+.4*rv('abyss')),
    cdm:Math.max(.4,(1-.05*rv('frost'))*(typeof focusTier==='function'&&focusTier('abyss')>=1?.85:1)*(typeof hasRes==='function'&&hasRes('eclipse_abyss')?.92:1)),gg:1+.25*rv('shard'),cdx};
}
let ST=stats();
const tier=()=>S.lv.skill>=20?3:S.lv.skill>=10?2:S.lv.skill>=5?1:0;
function dps(){const cf=1+ST.cc*(ST.cm-1),f=frenzyT>0?2.8:1;return ST.atk*ST.aps*f*cf+ST.sn*.8*ST.sd*cf+ST.ar*1.4*cf+ST.mg/2.6*cf}

const UP=[
  {id:'atk',b:'공',c:'#ff8a5c',name:'검 단련',max:Infinity,cost:l=>10*Math.pow(1.14,l),
    d:(a,b)=>`공격력 <em>${fmt(a.atk)}</em> → <em>${fmt(b.atk)}</em>`},
  {id:'spd',b:'속',c:'#ffd166',name:'연격',max:30,cost:l=>40*Math.pow(1.55,l),
    d:(a,b)=>`초당 공격 <em>${a.aps.toFixed(2)}</em> → <em>${b.aps.toFixed(2)}</em>회`},
  {id:'crit',b:'급',c:'#ff6fb5',name:'급소 찌르기',max:30,cost:l=>80*Math.pow(1.5,l),
    d:(a,b)=>`치명타 확률 <em>${Math.round(a.cc*100)}%</em> → <em>${Math.round(b.cc*100)}%</em>`},
  {id:'critd',b:'파',c:'#c77dff',name:'파괴의 일격',max:Infinity,cost:l=>120*Math.pow(1.38,l),
    d:(a,b)=>`치명타 피해 <em>×${a.cm.toFixed(1)}</em> → <em>×${b.cm.toFixed(1)}</em>`},
  {id:'skill',b:'술',c:'#9b6bff',name:'비전 숙련',max:Infinity,cost:l=>200*Math.pow(1.42,l),
    d:(a,b)=>`스킬 피해 <em>×${a.sk.toFixed(2)}</em> → <em>×${b.sk.toFixed(2)}</em> · Lv5/10/20에 연출 강화`},
  {id:'spirit',b:'령',c:'#6ff2ff',name:'검령 소환',max:Infinity,cost:l=>150*Math.pow(1.45,l),
    d:(a,b)=>`검령 <em>${b.sn}기</em> · 한 발 <em>${fmt(a.sd)}</em> → <em>${fmt(b.sd)}</em>`},
  {id:'archer',b:'궁',c:'#8ce07a',name:'동료: 궁수',max:Infinity,cost:l=>500*Math.pow(1.5,l),
    d:(a,b)=>a.ar?`화살 <em>${fmt(a.ar)}</em> → <em>${fmt(b.ar)}</em> · 초당 1.4발`:`궁수를 고용합니다 · 화살 <em>${fmt(b.ar)}</em>`},
  {id:'mage',b:'마',c:'#7aa8ff',name:'동료: 마법사',max:Infinity,cost:l=>2500*Math.pow(1.55,l),
    d:(a,b)=>a.mg?`마력탄 <em>${fmt(a.mg)}</em> → <em>${fmt(b.mg)}</em>`:`마법사를 고용합니다 · 마력탄 <em>${fmt(b.mg)}</em>`},
  {id:'greed',b:'금',c:'#ffc94a',name:'황금 손길',max:Infinity,cost:l=>100*Math.pow(1.42,l),
    d:(a,b)=>`골드 획득 <em>×${a.gm.toFixed(1)}</em> → <em>×${b.gm.toFixed(1)}</em>`},
];

/* ================= audio ================= */
let AC=null,master=null,noiseBuf=null;const thr={};
function ensureAudio(){
  if(!S.sound)return;
  if(AC){if(AC.state==='suspended')AC.resume();return}
  try{AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=.32;master.connect(AC.destination);
    const len=AC.sampleRate*1.2;noiseBuf=AC.createBuffer(1,len,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;}catch(e){AC=null}
}
function tone(type,f0,f1,dur,vol,delay=0){
  if(!AC||!S.sound)return;const t=AC.currentTime+delay;const o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.02);
}
function noise(dur,vol,freq,q=1,type='bandpass',delay=0){
  if(!AC||!S.sound)return;const t=AC.currentTime+delay;const s=AC.createBufferSource();s.buffer=noiseBuf;
  const f=AC.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;const g=AC.createGain();
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t,Math.random()*.1,dur+.05);
}
const gate=(k,gap)=>{if(!AC)return false;const n=AC.currentTime;if(n-(thr[k]||0)<gap)return false;thr[k]=n;return true};
let coinI=0;
const sfx={
  hit(c){if(!gate('hit',.03))return;noise(.07,c?.6:.4,c?2800:1500,.9);tone('sine',c?260:170,45,.12,c?.75:.5);
    if(c){tone('square',1700,850,.14,.09);tone('triangle',2600,1900,.22,.07)}},
  zap(){if(gate('zap',.06))tone('triangle',1300,480,.07,.07)},
  arrow(){if(gate('arr',.08)){noise(.06,.18,4000,1.5);tone('triangle',900,1400,.05,.04)}},
  coin(){if(!gate('coin',.045))return;const f=[1320,1480,1760][coinI++%3];tone('square',f,f,.05,.04);tone('square',f*1.5,f*1.5,.08,.035,.045)},
  kill(b){noise(b?.7:.3,.6,b?380:700,.7,'lowpass');tone('sine',b?130:160,28,b?.7:.3,.85);if(b)tone('sawtooth',90,30,.8,.15)},
  boom(){noise(.55,.7,520,.6,'lowpass');tone('sine',95,24,.5,.9)},
  bigboom(){noise(1,.9,380,.5,'lowpass');tone('sine',70,18,1,1);tone('sawtooth',110,30,.6,.12)},
  whoosh(){noise(.3,.25,1400,.8)},
  buy(){[660,880,1175].forEach((f,i)=>tone('triangle',f,f,.1,.12,i*.05))},
  power(){tone('sawtooth',180,900,.4,.1);noise(.4,.2,3200,.5,'highpass')},
  land(){noise(.4,.6,300,.6,'lowpass');tone('sine',70,25,.45,.9)},
  fanfare(){[523,659,784,1047].forEach((f,i)=>tone('square',f,f,.16,.07,i*.1))},
  dark(){tone('sine',110,50,.7,.5);noise(.7,.3,260,.5,'lowpass')},
  charge(){tone('sawtooth',110,720,.5,.07);tone('sine',180,900,.5,.12)},
  beam(){noise(.9,.35,1800,.4);tone('sawtooth',230,150,.9,.09);tone('sine',80,55,.9,.45)},
  thunder(){noise(1,.9,900,.3,'lowpass');tone('square',60,28,.6,.18);tone('sine',120,20,.9,.85)},
  rumble(){noise(1,.5,160,.5,'lowpass');tone('sine',48,38,1,.5)},
  chime(){[1568,2093,2637].forEach((f,i)=>tone('triangle',f,f*.98,.3,.06,i*.06))},
  slash2(){noise(.25,.5,5000,.7,'highpass');tone('sawtooth',2400,300,.25,.08)},
  glass(){noise(.35,.45,6000,.8,'highpass');[2600,3300,2100].forEach((f,i)=>tone('triangle',f,f*.9,.2,.05,i*.03))},
  warn(){[880,880].forEach((f,i)=>tone('square',f,f,.08,.08,i*.14))},
  parry(){tone('square',2200,1800,.25,.12);tone('triangle',3300,3000,.4,.08);noise(.2,.5,3500,1)},
  hurt(){tone('sawtooth',300,80,.3,.2);noise(.25,.5,600,.6,'lowpass')},
  roar(){tone('sawtooth',90,60,.8,.2);tone('sawtooth',93,58,.8,.15);noise(.8,.35,500,.6,'lowpass')},
  chest(){noise(.25,.5,250,.6,'lowpass');tone('sine',90,50,.25,.6)},
  open(r){const base=[523,659,784,988][r];for(let i=0;i<3+r*2;i++)tone(r>2?'square':'triangle',base*Math.pow(1.26,i%5)*(i>4?2:1),base*Math.pow(1.26,i%5)*(i>4?2:1),.18,.07,i*.07);if(r>2)noise(1.2,.2,6000,.5,'highpass',.2)},
  cutin(){noise(.35,.4,2500,.6);tone('sawtooth',300,1200,.3,.07)},
  siren(){for(let i=0;i<3;i++){tone('sawtooth',420,880,.28,.07,i*.56);tone('sawtooth',880,420,.28,.07,i*.56+.28)}},
  beat(){tone("sine",70,38,.28,.9);noise(.15,.3,120,.8,"lowpass")},
  link(){[784,1047,1319].forEach((f,i)=>tone('triangle',f,f,.12,.08,i*.05))},
};

/* ================= canvas & world vars ================= */
const cv=$('cv'),ctx=cv.getContext('2d'),stageEl=$('stage');
let W=800,H=450,DPR=1,U=1,groundY=340,heroX=200,monX=540,gx=40,gy=30,VIG=null,stars=[];
let m=null,spawnT=.6,miniQ=0,miniX=0,P=[],T=[],C=[],B=[],PR=[],FX=[],CR=[],BN=null,CUT=null,BF=null;
let trauma=0,zoom=1,flashA=0,flashC='255,255,255',stop=0,slowT=0,gt=0,bgX=0,invertT=0,desat=0;
let dimT=0,dimCur=0,tintA=0,tintC='255,120,40',tintCur=0;
let combo=0,comboT=0,comboPop=0,atkT=0,lastTap=0,bossT=30,castLock=0,gauge=0;
let frenzyT=0,spiritA=0,spiritT=[0,0,0,0,0,0],shieldOn=null,bloodBuffT=0;
let inkT=-1,inkB=[],zoneShown=0;
const h={t:9,from:-.55,to:-.55,ang:-.55,dir:1,lunge:0,bob:0,lean:0,ox:null,oy:0,dx:0,hide:false,stun:0,dodgeT:-1};
const comp={arT:.5,mgT:1.3,arShot:0,mgCast:0};
const addTrauma=v=>{trauma=Math.min(1,trauma+v*FXS)};
const flash=(v,c='255,255,255')=>{if(v*(RM?.3:1)>=flashA){flashA=v*(RM?.3:1);flashC=c}};
const fighting=()=>m&&m.state==='fight';
function cutin(name,sub,col,pair){CUT={name,sub,col,pair,t:0,dur:pair?1.35:1.05};stop=Math.max(stop,pair?1.1:.8);sfx.cutin()}
let BI=null;

/* ================= monsters ================= */
const PRE=['끈적한','성난','심연의','타오르는','얼어붙은','황금빛','독기 어린','폭풍의','굶주린','뒤틀린'];
function makeMonster(s,mini){
  const z=zoneOf(s);
  const boss=!mini&&isBoss(s)&&!S.farm,pool=ZTYPES[z];
  const type=mini?0:boss?bossTypeOf(s):pool[Math.floor(Math.random()*pool.length)];
  const hp=monHp(s)*(boss?7:mini?.3:1);
  const o={type,zone:z,boss,mini:!!mini,hue:(s*47+200)%360,rb:boss?72:mini?28:46,hp,max:hp,chip:hp,chipT:0,
    x:boss?monX:W+140*U,yo:boss?-H:0,ly:0,lyT:0,px:0,pxT:0,pxF:6,sc:1,scT:1,state:'enter',t:0,sq:0,sqv:0,kx:0,kv:0,flash:0,hurt:0,deadT:0,ph:rnd(0,6),
    sh:0,shMax:0,split:false,atkT:3.5,pat:null,stun:0,lastSrc:''};
  if(!boss&&!mini){if(type===0&&s>=4&&Math.random()<.3)o.split=true;if(s>=8&&Math.random()<.18)o.shMax=o.sh=hp*.5}
  if(boss&&s>=10)o.shMax=o.sh=hp*.25;
  if(boss&&CH){o.hp=o.max=o.chip=hp*1.5;o.shMax=o.sh=o.shMax*1.5}
  o.name=mini?'작은 슬라임':(boss&&CH?'시련의 ':'')+(boss?'군주 ':'')+(o.split?'분열하는 ':'')+(o.shMax&&!boss?'가호받은 ':'')+PRE[(s+type)%PRE.length]+' '+TYPES[type];
  return o;
}
function mCenter(o){const r=o.rb*U,b=Math.sin(gt*2+o.ph)*6*U;
  const oy=o.type===2?-r*1.45+b:o.type===3?-r*2.1+b*1.5:o.type===1?-r*.9:-r*.8;
  return{x:o.x+o.kx+o.px,y:groundY+o.yo+o.ly+oy*o.sc}}
function mTop(o){const r=o.rb*U*o.sc;return groundY+o.yo+o.ly+(o.type===2?-r*2.55:o.type===3?-r*2.9:o.type===1?-r*1.85:-r*1.75)}

/* ================= fx helpers ================= */
function burst(x,y,cols,n,sp,dir){
  for(let i=0;i<n;i++){const a=dir===undefined?rnd(0,Math.PI*2):dir+rnd(-1,1),v=rnd(.3,1)*sp*U;
    P.push({t:'spark',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,drag:5,g:400*U,w:rnd(1.5,4)*U,life:rnd(.18,.45),max:.45,color:cols[i%cols.length]})}
}
function ink(x,y,n,col='#07070f'){
  for(let i=0;i<n;i++)P.push({t:'blob',x:x+rnd(-10,10)*U,y:y+rnd(-10,10)*U,vx:rnd(-520,520)*U,vy:rnd(-760,-120)*U,g:1900*U,drag:1,floor:1,size:rnd(3,9)*U,life:rnd(.6,1.1),max:1.1,color:col});
}
function smoke(x,y,n,col,sz=1){for(let i=0;i<n;i++)P.push({t:'smoke',x:x+rnd(-30,30)*U*sz,y:y+rnd(-20,20)*U*sz,vx:rnd(-160,160)*U,vy:rnd(-120,-20)*U,drag:2,r0:15*U*sz,r1:rnd(50,90)*U*sz,life:rnd(.7,1.2),max:1.2,color:col})}
function genSpike(n){const p=[[-.5,0]];for(let i=0;i<n;i++){const c=-.5+(i+.5)/n,hw=.5/n;p.push([c-hw*.55,-rnd(.15,.35)],[c+rnd(-.15,.15)*hw,-rnd(.75,1)],[c+hw*.55,-rnd(.15,.35)])}p.push([.5,0]);return p}
function spike(x,w,hh,lean,n,c1,c2,life){P.push({t:'spike',x,y:groundY,w,h:hh,lean,pts:genSpike(n),c1,c2,life,max:life})}
function rubble(cx,R,n,life=1.4){for(let i=0;i<n;i++){const x=cx+rnd(-1,1)*R;spike(x,rnd(20,45)*U,rnd(40,110)*U,(x-cx)/R*.8,1+(i%2),'#62626e','#a4a4b2',rnd(life*.7,life))}}
function genBolt(x1,y1,x2,y2){const p=[x1,y1],n=9;for(let i=1;i<n;i++){const k=i/n;p.push(lerp(x1,x2,k)+rnd(-30,30)*U,lerp(y1,y2,k)+rnd(-10,10)*U)}p.push(x2,y2);return p}
function at(o,t,fn){o.f=o.f||{};if(o.t>=t&&!o.f[t]){o.f[t]=1;fn()}}
function addFX(o){o.t=0;FX.push(o);return o}
function star4(x,y,L,w,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.beginPath();const c=w*.14;
  ctx.moveTo(0,-L);ctx.quadraticCurveTo(c,-c,w,0);ctx.quadraticCurveTo(c,c,0,L);ctx.quadraticCurveTo(-c,c,-w,0);ctx.quadraticCurveTo(-c,-c,0,-L);ctx.closePath();ctx.restore()}
function tongue(x,y,w,hh,ph){const s=Math.sin(ph);
  ctx.moveTo(x-w/2,y);ctx.bezierCurveTo(x-w/2,y-hh*.45,x+s*w*.5,y-hh*.7,x+s*w*.35,y-hh);ctx.bezierCurveTo(x+w*.1+s*w*.3,y-hh*.6,x+w/2,y-hh*.4,x+w/2,y);ctx.closePath()}
function drawSil(x,y,col,alpha,sc,lean,ang,eyes){
  ctx.save();ctx.translate(x,y);ctx.scale(U*sc,U*sc);ctx.rotate(lean);ctx.globalAlpha=alpha;ctx.fillStyle=col;ctx.beginPath();
  ctx.arc(1,-79,14,0,7);ctx.roundRect(-16,-66,32,42,9);ctx.roundRect(-13,-28,10,28,3);ctx.roundRect(3,-28,10,28,3);
  ctx.moveTo(-4,-64);ctx.quadraticCurveTo(-34,-40,-40,-4);ctx.lineTo(-2,-12);ctx.closePath();ctx.fill();
  ctx.save();ctx.translate(6,-56);ctx.rotate(ang);ctx.fillRect(0,-3.5,98,7);ctx.restore();
  if(eyes){ctx.fillStyle='#fff';ctx.shadowColor='#9fb2ff';ctx.shadowBlur=10;ctx.fillRect(4,-83,5,3);ctx.fillRect(11,-83,5,3);ctx.shadowBlur=0}
  ctx.restore();
}
function addCrack(x,y,big){
  if(RM)return;const lines=[],n=big?14:9,L=Math.max(W,H)*(big?.9:.5);
  for(let i=0;i<n;i++){let a=i/n*Math.PI*2+rnd(-.2,.2),px=x,py=y;const pts=[px,py],len=rnd(.3,1)*L;
    for(let j=0;j<4;j++){a+=rnd(-.35,.35);px+=Math.cos(a)*len/4;py+=Math.sin(a)*len/4;pts.push(px,py)}lines.push(pts)}
  const rings=[];for(let r=1;r<=(big?3:2);r++){const rr=r*rnd(40,70)*U;const arcs=[];for(let i=0;i<6;i++){const a=rnd(0,7);arcs.push([rr,a,a+rnd(.3,.9)])}rings.push(...arcs)}
  CR.push({x,y,lines,rings,t:0,dur:big?1:.65,sh:[]});sfx.glass();
}

/* ================= combat ================= */
function heroStrike(tap){
  if(!fighting()||h.stun>0)return;
  h.t=0;h.dir=-h.dir;h.from=h.dir>0?-2.15:1.15;h.to=h.dir>0?.95:-1.75;
  const crit=Math.random()<ST.cc,dem=frenzyT>0;
  const d=ST.atk*(tap?1.5:1)*(dem?1.4:1)*(1+Math.min(combo,100)*.005)*(crit?ST.cm:1)*rnd(.9,1.1);
  const c=mCenter(m),r=m.rb*U*m.sc;
  const hx=c.x+rnd(-.2,.2)*r,hy=c.y+rnd(-.25,.25)*r;
  P.push({t:'streak',x:heroX+70*U,y:groundY-75*U,x2:hx,y2:hy,life:.09,max:.09,w:(crit?7:3.5)*U,color:dem?'#ff7ab8':crit?'#ffb0dc':'#c8fbff'});
  if(dem){const sx=heroX+70*U;P.push({t:'slash',x:sx,y:hy,vx:(hx-sx)/.11,vy:0,drag:0,g:0,rot:0,fy:h.dir,size:r*1.2,life:.13,max:.13,color:'#ff3d8b'})}
  const rot=rnd(-.5,.5)+(h.dir>0?.25:-.25);
  P.push({t:'slash',x:hx,y:hy,rot,fy:h.dir,size:r*(crit?1.9:1.35),life:.2,max:.2,color:dem?'#ff3d8b':crit?'#ff5fb0':'#8ff6ff'});
  if(crit){P.push({t:'slash',x:hx,y:hy,rot:rot+1.6,fy:-h.dir,size:r*1.7,life:.24,max:.24,color:'#ffd166'});
    P.push({t:'ring',x:hx,y:hy,r0:8*U,r1:130*U,w:7*U,life:.32,max:.32,color:'#ff6fb5'});}
  P.push({t:'star',x:hx,y:hy,size:(crit?110:55)*U,life:crit?.13:.08,max:crit?.13:.08});
  const n=crit?28:12;
  for(let i=0;i<n;i++){const a=(crit?rnd(-Math.PI,Math.PI):rnd(-1.1,1.1)),sp=rnd(300,crit?1200:850)*U;
    P.push({t:'spark',x:hx,y:hy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,drag:5,g:500*U,w:rnd(1.5,3.5)*U,life:rnd(.15,.38),max:.38,
      color:Math.random()<.4?'#ffffff':dem?'#ff3d8b':crit?(Math.random()<.5?'#ff6fb5':'#ffd166'):(Math.random()<.5?'#ffe39a':`hsl(${m.hue},90%,70%)`)});}
  deal(d,crit,tap?'tap':'hero',hx,hy);
  sfx.hit(crit);
  if(!fighting())return;
  if(crit&&rv('thunder')&&Math.random()<.3){const c2=mCenter(m);P.push({t:'bolt',pts:genBolt(c2.x+rnd(-30,30)*U,-20,c2.x,c2.y),life:.3,max:.3});
    P.push({t:'glow',x:c2.x,y:c2.y,size:120*U,life:.2,max:.2,color:'#ffe066'});sfx.thunder();deal(ST.atk*(2+rv('thunder')),false,'relic',c2.x,c2.y,{col:'#ffe066'})}
  if(rv('ember')&&Math.random()<(.1+.02*rv('ember'))){const c2=mCenter(m);
    for(let i=0;i<8;i++)P.push({t:'flame',x:c2.x+rnd(-30,30)*U,y:c2.y+rnd(-20,20)*U,vx:rnd(-80,80)*U,vy:-rnd(60,200)*U,drag:1,g:0,r:rnd(12,24)*U,cols:['#3a0d06','#ff5a1a','#ffc04a'],life:rnd(.3,.6),max:.6});
    P.push({t:'ring',x:c2.x,y:c2.y,r0:8*U,r1:90*U,w:6*U,life:.3,max:.3,color:'#ff8a3a'});deal(ST.atk*1.5,false,'relic',c2.x,c2.y,{light:1,col:'#ffb060'})}
}

function deal(d,crit,src,x,y,o={}){
  if(!fighting())return;
  d*=chMul(src,crit,o);
  if(m.vuln>0)d*=1.3*(typeof focusTier==='function'&&focusTier('hellfire')>=1?1.3:1);
  if(m.freeze>0&&typeof focusTier==='function'&&focusTier('frost')>=2)d*=1.2;
  if(m.freeze>0&&src==='skill'&&typeof hasRes==='function'&&hasRes('frost_storm'))d*=1.15;
  const light=o.light||src==='spirit'||src==='ally',heavy=o.heavy;
  let col=o.col||(src==='spirit'?'#8ff6ff':src==='ally'?'#c8ffb0':crit?'#ffe066':'#ffffff');
  if(m.sh>0){m.sh-=d;col='#7fe8ff';if(Math.random()<.5)P.push({t:'ring',x,y,r0:6*U,r1:40*U,w:3*U,life:.2,max:.2,color:'#7fe8ff'});
    if(m.sh<=0){const over=-m.sh;m.sh=0;shieldBreak();m.hp-=over}}
  else m.hp-=d;
  m.flash=1;m.hurt=.22;m.chipT=.35;if(o.sid)m.lastSrc=o.sid;
  m.sqv-=heavy?11:crit?9:light?2:5;m.kv+=(heavy?700:crit?520:light?80:260)*U;
  if(src!=='spirit'&&src!=='ally'){combo++;comboT=1.6;comboPop=1;if(combo>S.maxCombo)S.maxCombo=combo}
  const size=src==='spirit'||src==='ally'?17:light?22:heavy?54:crit?44:src==='tap'?32:src==='skill'?34:28;
  T.push({x:x+rnd(-26,26)*U,y:y-m.rb*U*.5,vx:rnd(-50,50)*U,vy:-rnd(150,210)*U,text:fmt(d),crit:crit||heavy,
    label:crit?'치명타':heavy&&o.name?o.name:'',lcol:crit?'#ff4fa3':col,size,life:heavy?1.1:.9,max:heavy?1.1:.9,color:col});
  if(crit&&m&&typeof focusTier==='function'&&focusTier('crimson')>=2){
    m.burn=3;if(!m.burnNotified){m.burnNotified=true;T.push({x:x,y:y-m.rb*U*.6,vx:0,vy:-50*U,text:'화상!',crit:0,label:'',size:22,life:1,max:1,color:'#ff4f5e'})}
  }
  if(o.sid==='combo'&&heavy&&!o._extra){
    if(typeof focusTier==='function'&&focusTier('crimson')>=3){
      later(.12,()=>{if(fighting()){const c=mCenter(m);sfx.slash2();stop=Math.max(stop,.08);flash(.3,'255,100,100');
        deal(d*.8,crit,'skill',c.x,c.y,Object.assign({},o,{_extra:1,name:(o.name||'연계')+' · 추격',col:'#ff2a3a',crack:1}));
        T.push({x:c.x,y:(m?mTop(m):c.y)-50*U,vx:0,vy:-60*U,text:'추가 강타!',crit:1,label:'',size:28,life:1.1,max:1.1,color:'#ff2a3a'})}});
    }
    if(typeof focusTier==='function'&&focusTier('storm')>=1){
      const gc=focusTier('storm')>=3,gv=focusTier('storm')>=2;
      for(let i=0;i<3;i++)later(.1+i*.12,()=>{if(fighting()){const c=mCenter(m),bx=c.x+rnd(-35,35)*U;
        P.push({t:'bolt',pts:genBolt(bx,0,bx,c.y),life:.25,max:.25,color:'#ffe853'});sfx.boom();stop=Math.max(stop,.04);
        if(gv)m.vuln=Math.max(m.vuln||0,2);
        deal(ST.atk*ST.sk*1.5*(gc?ST.cm:1),gc,'skill',bx,c.y,{light:1,col:'#ffe853',name:'추가 낙뢰',sid:'storm_bolt',_extra:1});
        if(i===0)T.push({x:c.x,y:(m?mTop(m):c.y)-45*U,vx:0,vy:-50*U,text:'추가 낙뢰!',crit:gc?1:0,label:'',size:22,life:1,max:1,color:'#ffe853'});
        if(gv&&i===0)T.push({x:c.x,y:(m?mTop(m):c.y)-70*U,vx:0,vy:-40*U,text:'속박!',crit:0,label:'',size:18,life:1,max:1,color:'#ffe853'})}});
    }
    if(m&&m.freeze>0&&typeof hasRes==='function'&&hasRes('frost_storm')){
      later(.1,()=>{if(fighting()){const c=mCenter(m),bx=c.x+rnd(-25,25)*U;
        P.push({t:'bolt',pts:genBolt(bx,0,bx,c.y),life:.25,max:.25,color:'#61dcf3'});sfx.boom();stop=Math.max(stop,.04);
        deal(ST.atk*3*ST.sk,false,'skill',bx,c.y,{light:1,col:'#61dcf3',name:'초전도 낙뢰',sid:'superconduct_bolt',_extra:1});
        T.push({x:c.x,y:(m?mTop(m):c.y)-50*U,vx:0,vy:-50*U,text:'초전도!',crit:0,label:'',size:22,life:1,max:1,color:'#61dcf3'})}});
    }
  }
  if(heavy){stop=Math.max(stop,.1);addTrauma(.6);zoom+=.07*FXS;flash(.42,o.fc||'255,255,255')}
  else if(crit&&!light){stop=Math.max(stop,.075);addTrauma(.32);zoom+=.045*FXS;flash(.18,'255,150,210')}
  else if(light)addTrauma(.04);
  else{stop=Math.max(stop,.028);addTrauma(.1)}
  gauge=Math.min(100,gauge+(src==='hero'||src==='tap'?.5:light?.12:src==='skill'?BAL.skillGauge:.3)*ST.gg);
  if(o.crack)addCrack(x,y,o.crack>1);
  if(m.hp<=0)kill(m.boss?getFinisherInfo(src,o,crit):null);
}
function getFinisherInfo(src,o={},crit=false){
  let name='',col=o.col||'',kind='결정타',sub='FINISHING BLOW';
  if(o.sid==='awaken'||o.sid==='awk'||(typeof AWK!=='undefined'&&AWK.some(a=>a.id===o.sid))){
    const a=(typeof AWK!=='undefined'&&AWK.find(x=>x.id===o.sid))||(typeof awkSel==='function'?awkSel():null);
    name=o.name||(a?a.name:'각성 비기');col=col||(a?a.c:'#ff2a3a');kind='각성기 결정타';sub='AWAKENING FINISH';
  }else if(o.sid==='combo'){
    const c=(typeof COMBOS!=='undefined'&&o.name)?COMBOS.find(x=>x.name===o.name):null;
    name=o.name||'연계 비기';col=col||(c?c.col:'#ff4f5e');kind='연계기 결정타';
    const sa=c&&typeof SK!=='undefined'?SK.find(s=>s.id===c.a):null,sb=c&&typeof SK!=='undefined'?SK.find(s=>s.id===c.b):null;
    sub=(sa&&sb)?`${sa.name} ＋ ${sb.name}`:'COMBO FINISH';
  }else if(o.sid&&typeof SK!=='undefined'&&SK.some(s=>s.id===o.sid)){
    const s=SK.find(x=>x.id===o.sid);name=o.name||s.name;col=col||s.c;kind='스킬 결정타';sub='SKILL FINISH';
  }else if(src==='skill'){
    name=o.name||'스킬 비기';col=col||'#8ff6ff';kind='스킬 결정타';sub='SKILL FINISH';
  }else if(src==='tap'){
    name=crit?'일섬 · 멸':'일섬';col=col||'#ff5fb0';kind=crit?'회심의 쾌검':'쾌검 결정타';sub=crit?'CRITICAL SLASH':'FATAL SLASH';
  }else if(src==='hero'){
    name=crit?'비검 회심타':'일반 공격';col=col||(crit?'#ffe066':'#ffffff');kind=crit?'회심의 일격':'기사의 일격';sub=crit?'CRITICAL STRIKE':'SWORD STRIKE';
  }else if(src==='spirit'){
    name='정령탄';col=col||'#8ff6ff';kind='정령의 일격';sub='SPIRIT FINISH';
  }else if(src==='ally'){
    name='동료 지원';col=col||'#c8ffb0';kind='동료의 일격';sub='ALLY FINISH';
  }else if(src==='relic'){
    name=col==='#ffe066'?'뇌전의 심판':'화염의 불씨';col=col||'#ffe066';kind='유물 발동';sub='RELIC FINISH';
  }
  if(!name)name='결정타';if(!col)col='#ff4f5e';
  return {name,col,kind,sub};
}
function triggerBossFinisher(fin,o){
  const c=mCenter(o);
  BF={name:fin.name,col:fin.col,kind:fin.kind,sub:fin.sub,t:0,dur:1.6};
  CUT=null;stop=Math.max(stop,.38);addTrauma(.75);zoom+=.12*FXS;flash(.85,'255,255,255');
  sfx.slash2();sfx.cutin();slowT=1.35;ink(c.x,c.y,35,'#120008');addCrack(c.x,c.y,true);
}
function skillHit(mult,pm,x,y,o){
  const crit=Math.random()<ST.cc;
  if(o&&o.sid&&BR[o.sid]&&BR[o.sid].gen&&br(o.sid)==='a')mult*=1.4;
  if(o&&o.sid==='combo'){
    if(typeof focusTier==='function'&&focusTier('crimson')>=1)mult*=1.3;
    if(typeof bloodBuffT!=='undefined'&&bloodBuffT>0)mult*=1.2;
  }
  const isAwk=o&&(o.sid==='awaken'||o.sid==='awk'||(typeof AWK!=='undefined'&&AWK.some(a=>a.id===o.sid)));
  if(isAwk&&typeof isFocusAwk==='function'&&isFocusAwk())mult*=1.5;
  deal(ST.atk*ST.sk*mult*pm*(crit?ST.cm:1)*rnd(.9,1.1),crit,'skill',x,y,o);
}
function shieldBreak(){
  const c=mCenter(m),r=m.rb*U;
  for(let i=0;i<26;i++)P.push({t:'shard',x:c.x+rnd(-r,r),y:c.y+rnd(-r,r),vx:rnd(-600,700)*U,vy:rnd(-700,100)*U,g:1600*U,drag:1,floor:1,size:rnd(4,10)*U,rot:rnd(0,6),vr:rnd(-15,15),life:rnd(.6,1.1),max:1.1,color:Math.random()<.5?'#7fe8ff':'#e6fbff'});
  P.push({t:'ring',x:c.x,y:c.y,r0:r,r1:r*3,w:6*U,life:.35,max:.35,color:'#7fe8ff'});
  T.push({x:c.x,y:c.y-r*1.4,vx:0,vy:-80*U,text:'방어막 파괴!',crit:1,label:'',size:30,life:1,max:1,color:'#7fe8ff'});
  stop=Math.max(stop,.12);addTrauma(.4);flash(.3,'170,240,255');sfx.glass();m.stun=Math.max(m.stun,1);
}

function killFx(o){
  const c=mCenter(o),r=o.rb*U,b=o.boss;
  for(let i=0;i<(b?64:o.mini?12:28);i++){const a=rnd(-Math.PI,0),sp=rnd(250,b?1100:800)*U;
    P.push({t:'shard',x:c.x+rnd(-.3,.3)*r,y:c.y+rnd(-.3,.3)*r,vx:Math.cos(a)*sp+160*U,vy:Math.sin(a)*sp,g:2300*U,drag:.6,floor:1,
      size:rnd(5,15)*U*(b?1.5:1),rot:rnd(0,6),vr:rnd(-16,16),life:rnd(.8,1.5),max:1.5,color:`hsl(${o.hue},70%,${rnd(38,72)|0}%)`});}
  burst(c.x,c.y,['#fff',`hsl(${o.hue},95%,72%)`],b?50:30,1400);
  smoke(c.x,c.y,b?16:8,'#2a1a3e',r/(46*U));
  P.push({t:'glow',x:c.x,y:c.y,size:r*3.2,life:.28,max:.28,color:`hsl(${o.hue},100%,70%)`});
  P.push({t:'ring',x:c.x,y:c.y,r0:r*.5,r1:r*3,w:10*U,life:.35,max:.35,color:'#ffffff'});
  P.push({t:'ring',x:c.x,y:c.y,r0:r*.3,r1:r*4.2,w:5*U,life:.6,max:.6,color:`hsl(${o.hue},100%,70%)`});
  P.push({t:'ring',x:c.x,y:groundY,r0:r*.4,r1:r*3.6,w:6*U,sy:.22,life:.5,max:.5,color:'#ffffff'});
  const n=b?26:o.mini?2:clamp(4+Math.floor(S.stage/10),4,9),tot=goldDrop(S.stage)*ST.gm*(b?5:o.mini?.3:1);
  for(let i=0;i<n;i++)C.push({x:c.x,y:c.y,vx:rnd(-280,450)*U,vy:rnd(-820,-360)*U,ph:0,wait:rnd(.45,.85),spin:rnd(0,6),v:tot/n});
  if(b){T.push({x:c.x,y:c.y-r*1.2,vx:0,vy:-60*U,text:'격파!',crit:1,label:'',size:64,life:1.4,max:1.4,color:'#ff4f5e'});addCrack(c.x,c.y,true)}
  sfx.kill(b);
}
function kill(fin){
  const o=m,b=o.boss;o.hp=0;
  if(b){o.state='split';o.deadT=0;o.cutA=rnd(-.7,-.25);o.fx=0;
    triggerBossFinisher(fin||getFinisherInfo('hero'),o);
    S.bossKills++;if(o.lastSrc==='eclipse')S.eclBoss++;if(o.enraged)S.phase2++;
    recordCodex(o);}
  else{o.state='dead';o.deadT=0;stop=Math.max(stop,.1);addTrauma(.55);zoom+=.07*FXS;flash(.35);killFx(o)}
  if(o.split){miniQ=2;miniX=mCenter(o).x}
  S.totalKills++;
  if(CH){if(b)chWin(o);stageUI();return}
  const prevBest=S.best;
  if(!o.mini){
    if(b){S.stage++;S.kills=0;stageBanner()}
    else if(S.farm){S.farmKills++;if(S.auto&&S.farmKills>=15)retryBoss()}
    else{S.kills++;if(S.kills>=KPS){S.stage++;S.kills=0;stageBanner()}}
  }
  S.maxStage=Math.max(S.maxStage,S.stage);S.best=Math.max(S.best,S.stage);
  const prevUb=Math.max(prevBest,S.unlockFloor||0),nowUb=ub();
  for(const s of SK)if(s.unlock>prevUb&&s.unlock<=nowUb){banner('새 스킬 해금',s.name,s.c,2.2);sfx.chime();autoEquipPair(s.id);buildBar();buildBook()}
  for(const a of AWK)if(a.unlock>prevUb&&a.unlock<=nowUb){banner('새 각성기 해금',a.name+' · 패널에서 선택하세요',a.c,2.4);sfx.chime();buildBook()}
  stageUI();
}

function recordCodex(o){
  if(!o||!o.boss)return;
  const z=o.zone!==undefined?o.zone:zoneOf(CH?CH.stage:S.stage);
  const t=o.type!==undefined?o.type:0;
  const cid=`${z}_${t}`;
  if(!S.codex)S.codex={};
  const isNew=!S.codex[cid];
  S.codex[cid]=(S.codex[cid]||0)+1;
  if(isNew){
    ST=stats();
    later(CH?.6:1.0,()=>{
      banner('도감 등록!',`${ZONES[z]} · 군주 ${TYPES[t]} (피해 +2%)`,'#ffc94a',2.4);
      sfx.chime();
    });
  }
  if(typeof buildCodex==='function')buildCodex();
}

function banner(text,sub,color,dur=1.7){BN={text,sub,color,t:0,dur}}
function stageBanner(){
  const z=zoneOf(S.stage);
  if(z!==zoneShown)startInk();
  if(isBoss(S.stage)&&!S.farm)return;
  if((S.stage-1)%10===0)banner(ZONES[z],`STAGE ${S.stage}`,PAL[z][6],1.9);
  else banner(`STAGE ${S.stage}`,ZONES[z],'#ffc94a',1.3);
}
function startInk(){if(RM){zoneShown=zoneOf(S.stage);return}inkT=0;inkB=[];for(let i=0;i<16;i++)inkB.push({x:rnd(0,W),y:rnd(0,H),r:rnd(.3,.55)*Math.max(W,H),d:rnd(0,.15),s:[...Array(5)].map(()=>[rnd(0,7),rnd(.9,1.15),rnd(.08,.18)])})}
function retryBoss(){
  if(!S.farm)return;S.farm=false;S.farmKills=0;S.stage++;S.kills=0;
  if(m&&m.state==='fight')m.state='flee';
  for(const s of SK)cds[s.id]=0;
  lastCast=null;pendingCombo=null;
  P.push({t:'ring',x:heroX,y:groundY-50*U,r0:10*U,r1:150*U,w:6*U,life:.45,max:.45,color:'#7fe3ff'});
  for(let i=0;i<16;i++)P.push({t:'dot',x:heroX+rnd(-40,40)*U,y:groundY-rnd(0,90)*U,vx:rnd(-30,30)*U,vy:-rnd(120,320)*U,g:0,drag:1.5,size:rnd(1.5,3.5)*U,life:rnd(.5,1),max:1,color:'#7fe3ff'});
  T.push({x:heroX,y:groundY-130*U,vx:0,vy:-70*U,text:'스킬 재충전!',crit:0,label:'',size:24,life:1.3,max:1.3,color:'#9ff3ff'});
  sfx.chime();
  stageBanner();stageUI();
}
function bossFail(){
  if(CH){chFail('제한 시간 안에 쓰러뜨리지 못했습니다');return}
  m.state='flee';m.pat=null;S.farm=true;S.farmKills=0;S.stage=Math.max(1,S.stage-1);S.kills=0;
  banner('시간 초과','검을 더 벼리고 다시 도전하자','#9d95c4',2);stageUI();
}

/* ================= daily challenge flow ================= */
function startChallenge(){
  if(CH||dailyDone())return false;
  const st=chStage();
  CH={mods:dailyMods(),saved:{stage:S.stage,kills:S.kills,farm:S.farm,farmKills:S.farmKills},stage:st,win:false};
  S.stage=st;S.farm=false;S.kills=0;BI=null;miniQ=0;
  if(m&&m.state!=='dead'&&m.state!=='split'){m.state='flee';m.pat=null;m.yo=0}else{m=null;spawnT=.4}
  for(const s of SK)cds[s.id]=0;lastCast=null;pendingCombo=null;ST=stats();
  banner('일일 도전 · 시련',CH.mods.map(x=>x.n).join('  ·  '),'#ffd166',2.2);sfx.fanfare();
  stageUI();chUI();return true;
}
function chWin(o){
  CH.win=true;S.daily={key:todayKey(),done:true};S.dailyWins++;
  const c=mCenter(o),g=goldDrop(CH.stage)*25*ST.gm;
  for(let i=0;i<30;i++)C.push({x:c.x,y:c.y,vx:rnd(-400,500)*U,vy:rnd(-900,-400)*U,ph:0,wait:rnd(.5,1),spin:rnd(0,6),v:g/30});
  banner('시련 돌파!','보상: 골드 +'+fmt(g)+' · 희귀 등급 이상 유물','#ffd166',2.6);sfx.fanfare();
}
function chFail(msg){
  if(!CH)return;
  banner('시련 실패',msg+' · 오늘 안에 다시 도전할 수 있어요','#9d95c4',2.4);sfx.hurt();
  if(m&&m.state!=='dead'&&m.state!=='split'){m.state='flee';m.pat=null}
  endChallenge();
}
function endChallenge(){
  if(!CH)return;const sv=CH.saved;CH=null;Object.assign(S,sv);ST=stats();
  for(const s of SK)cds[s.id]=0;BI=null;stageUI();chUI();save();
}
