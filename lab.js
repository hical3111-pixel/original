'use strict';
/* 수련장은 별도 탭의 메모리만 사용한다. 공용 시전 함수는 그대로 호출한다. */
const lab={speed:1,tier:0,repeat:false,selected:null,queued:null,playing:false,gap:0,plays:0};
if(LAB_MODE&&window.__labAudit){const originalSave=save;save=function(){window.__labAudit.save++;return originalSave()}}
function labURL(kind,id){const u=new URL(location.href);u.search='?lab';u.hash='';if(kind&&id)u.searchParams.set(kind,id);return u.href}
function labLink(kind,id){return `<a class="lab-link" href="${labURL(kind,id)}" target="_blank" rel="noopener">수련장에서 보기 ↗</a>`}
function labSilence(){silenceAudio()}
function labDummy(){const o=makeMonster(1);Object.assign(o,{type:1,name:'수련 허수아비 · HP ∞',state:'fight',x:monX,boss:false,split:false,sh:0,shMax:0,max:Infinity,chip:Infinity,atkT:Infinity});
  // 연타뿐 아니라 무한 배율/직접 HP 변경에도 처치와 보상 경로로 넘어가지 않는다.
  for(const key of ['hp','chip'])Object.defineProperty(o,key,{get:()=>Infinity,set:()=>{},enumerable:true});return o}
function labClear(){
  lab.audioOnly=false;lab.soundQueue=[];labSilence();FX.length=P.length=T.length=C.length=B.length=PR.length=CR.length=relicQ.length=0;
  lastCast=pendingCombo=shieldOn=BI=BF=CUT=BN=null;stop=slowT=castLock=frenzyT=circleT=desat=trauma=flashA=invertT=0;
  dimT=dimCur=tintA=tintCur=combo=comboT=comboPop=gauge=bloodBuffT=verdantCD=parryLock=0;zoom=1;inkT=-1;inkB=[];miniQ=0;spawnT=Infinity;
  Object.assign(h,{t:9,from:-.55,to:-.55,ang:-.55,dir:1,lunge:0,bob:0,lean:0,ox:null,oy:0,dx:0,hide:false,stun:0,dodgeT:-1});
  for(const s of SK)cds[s.id]=0;m=labDummy();lab.queued=null;lab.playing=false;lab.gap=0;
}
function labBusy(){return FX.length>0||castLock>0||stop>0||!!CUT||!!BN||circleT>0||frenzyT>0}
function labListen(){
  if(!lab.selected)return false;const {kind,id}=lab.selected,owner=soundOwner(kind,id);if(!owner)return false;
  labClear();ensureAudio();lab.audioOnly=true;lab.playing=true;lab.plays++;lab.soundTime=0;lab.soundOwner=owner;
  const timings=SFX_SCHOOL[owner.school].voices?.[owner.key]?.listen||[.4,1.2];lab.soundQueue=[[0,'cast'],[timings[0],'hit'],[timings[1],'finish']];lab.soundEnd=timings[1]+3;
  $('labStatus').textContent='소리만 재생 · 기 모으기 → 적중 → 마지막 강타';return true;
}
function labPlay(kind,id){
  const item=kind==='skill'?skOf(id):kind==='combo'?COMBOS.find(c=>c.a===id):kind==='awk'?AWK.find(a=>a.id===id):null;if(!item)return false;
  labClear();ensureAudio();lab.selected={kind,id};lab.playing=true;lab.plays++;
  if(kind==='skill')cast(item,true);
  else if(kind==='awk')previewAwk(item);
  else if(item.keep)previewCombo(item);
  else{cast(skOf(item.a),true);lab.queued=item}
  $('labSoundOnly').disabled=!soundOwner(kind,id);$('labStatus').textContent=item.name+' · 재생 중';
  document.querySelectorAll('.lab-item').forEach(b=>b.setAttribute('aria-pressed',b.dataset.kind===kind&&b.dataset.id===id));return true;
}
function labTick(dt){
  if(lab.audioOnly&&lab.playing){lab.soundTime+=dt*lab.speed;while(lab.soundQueue.length&&lab.soundQueue[0][0]<=lab.soundTime)schoolCue(lab.soundOwner,lab.soundQueue.shift()[1]);if(lab.soundTime<lab.soundEnd)return}
  if(lab.queued&&!FX.length&&castLock<=0&&stop<=0){const c=lab.queued;lab.queued=null;frenzyT=circleT=0;previewCombo(c)}
  if(lab.playing&&!lab.queued&&!labBusy()&&!P.length&&!T.length&&!CR.length){lab.playing=false;lab.gap=.7;$('labStatus').textContent='재생 완료 · 다른 연출을 선택하세요'}
  if(!lab.playing&&lab.repeat&&lab.selected){lab.gap-=dt;if(lab.gap<=0){if(lab.audioOnly)labListen();else labPlay(lab.selected.kind,lab.selected.id)}}
}
function drawLabDummy(o){
  const r=o.rb*U,x=o.x+o.kx+o.px,y=groundY+o.yo+o.ly;ctx.save();ctx.translate(x,y);ctx.scale((1+o.sq)*o.sc,(1-o.sq)*o.sc);
  ctx.strokeStyle=o.flash>0?'#FFFFFF':'#9b819e';ctx.lineWidth=8*U;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-r*1.5);ctx.moveTo(-r*.8,-r*.9);ctx.lineTo(r*.8,-r*.9);ctx.stroke();
  ctx.fillStyle=o.flash>0?'#FFFFFF':'#c5b5a1';ctx.beginPath();ctx.arc(0,-r*1.55,r*.3,0,Math.PI*2);ctx.fill();ctx.fillRect(-r*.32,-r*1.1,r*.64,r*.7);
  ctx.strokeStyle='#66546e';ctx.lineWidth=2*U;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-r*.32,-r*(1-i*.18));ctx.lineTo(r*.32,-r*(.95-i*.18));ctx.stroke()}ctx.restore();
  ctx.fillStyle='#dfd3e6';ctx.font=`${Math.max(11,12*U)}px sans-serif`;ctx.textAlign='center';ctx.fillText(o.name,x,mTop(o)-18*U);
}
function labStart(){
  // load()는 축복을 정산하므로 사용하지 않는다. 성장/분기 자료만 읽어 별도 상태에 복사한다.
  let raw={};try{raw=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
  S=fresh();for(const key of ['lv','awk','mastery','relics','ach','codex'])Object.assign(S[key],raw[key]||{});S.souls=Number.isFinite(raw.souls)?raw.souls:0;
  S.auto=false;S.sound=raw.sound!==false;S.volume=soundVolume(raw.volume);S.loadout=[];S.equip=[];ST=stats(S.lv,false);lab.tier=S.lv.skill>=20?3:S.lv.skill>=10?2:S.lv.skill>=5?1:0;
  // 해금/쿨타임 우회는 기존 시연 경로를 쓰되 함수 입력은 실제 배율 pm=1이다.
  for(const a of [...SK,...COMBOS,...AWK]){const fn=a.fn;a.fn=(pm,...args)=>fn(1,...args)}
  const originalBranchFX=branchFX;branchFX=(s,pm)=>originalBranchFX(s,1);
  document.body.classList.add('lab-mode');$('labHeader').hidden=false;
  for(const e of $('panel').children)e.inert=true;
  const panel=document.createElement('div');panel.id='labPanel';panel.innerHTML=`<h2>수련장</h2><p>해금과 관계없이 모든 연출을 감상합니다. 분기와 공격력은 저장된 성장을 읽어 사용하며, 전투·보상·축복은 진행되지 않습니다.</p><div class="lab-controls"><label>속도 <select id="labSpeed"><option value="0.5">×0.5</option><option value="1" selected>×1</option><option value="2">×2</option></select></label><label>연출 <select id="labTier">${[0,1,2,3].map(n=>`<option value="${n}" ${lab.tier===n?'selected':''}>★${n}</option>`).join('')}</select></label><label><input id="labRepeat" type="checkbox">반복 재생</label><button id="labSound" type="button"></button><button id="labSoundOnly" type="button" disabled>소리만 듣기</button><button id="labStop" type="button">정지</button></div><label class="volume-control">음량 <input id="labVolume" type="range" min="0" max="100" value="${S.volume}" aria-label="수련장 음량"><output id="labVolumeValue">${S.volume}%</output></label><div id="labStatus" role="status">보고 싶은 연출을 선택하세요</div><div id="labCatalog"></div>`;$('panel').appendChild(panel);
  const button=(kind,a)=>`<button type="button" class="lab-item" data-kind="${kind}" data-id="${kind==='combo'?a.a:a.id}" aria-pressed="false">${kind==='skill'?IC[a.id]||'':kind==='awk'?AWK_IC[a.id]||IC[a.id]||'':''}<span>${a.name}<small>${kind==='skill'?'스킬'+(br(a.id)?' · 분기 '+br(a.id).toUpperCase():''):kind==='combo'?'시작 스킬 → 연계기':'각성기'}</small></span></button>`;
  $('labCatalog').innerHTML=SCHOOLS.map(s=>`<details class="lab-school" style="--c:${s.c}"><summary>${s.name}</summary><div class="lab-list">${schoolSkills(s).map(a=>button('skill',a)).join('')}${COMBOS.filter(c=>c.school===s.id).map(a=>button('combo',a)).join('')}${AWK.filter(a=>a.id===s.awk).map(a=>button('awk',a)).join('')}</div></details>`).join('')+`<details class="lab-school" style="--c:#d9c8f0"><summary>그 외 각성기</summary><div class="lab-list">${AWK.filter(a=>!SCHOOLS.some(s=>s.awk===a.id)).map(a=>button('awk',a)).join('')}</div></details>`;
  $('labCatalog').addEventListener('click',e=>{const b=e.target.closest('.lab-item');if(b)labPlay(b.dataset.kind,b.dataset.id)});
  $('labSpeed').onchange=e=>lab.speed=Number(e.target.value);$('labTier').onchange=e=>{lab.tier=Number(e.target.value);if(lab.selected)labPlay(lab.selected.kind,lab.selected.id)};
  $('labRepeat').onchange=e=>lab.repeat=e.target.checked;
  const sound=()=>{$('labSound').textContent=S.sound?'소리 켬':'소리 끔';$('labSound').setAttribute('aria-pressed',S.sound)};sound();
  $('labSound').onclick=()=>{S.sound=!S.sound;labSilence();if(S.sound)ensureAudio();sound()};
  $('labVolume').oninput=e=>{S.volume=soundVolume(Number(e.target.value));audioVolume();$('labVolumeValue').textContent=S.volume+'%'};$('labSoundOnly').onclick=labListen;
  $('labStop').onclick=()=>{lab.repeat=false;$('labRepeat').checked=false;labClear();$('labStatus').textContent='정지 · 연출을 정리했습니다'};
  $('labReturn').onclick=()=>{window.close();if(!window.closed){$('labStatus').textContent='직접 연 탭은 브라우저의 탭 닫기로 돌아가세요'}};
  buildLabSounds();
  resize();new ResizeObserver(resize).observe(stageEl);labClear();
  const q=new URLSearchParams(location.search);for(const kind of ['skill','combo','awk'])if(q.has(kind)&&labPlay(kind,q.get(kind))){const b=panel.querySelector(`[data-kind="${kind}"][data-id="${q.get(kind)}"]`);if(b){b.closest('details').open=true;b.scrollIntoView({block:'nearest'})}break}
  last=performance.now();requestAnimationFrame(frame);
}
