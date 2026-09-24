'use strict';
/* 구조 자가 점검 — 주소 뒤에 ?selftest 를 붙이면 index.html이 이 파일을 불러온다.
   저장을 끄고 새 상태에서 모든 스킬·연계기·각성기·보스·도전을 실제로 돌려 본 뒤 결과를 화면에 띄운다.
   결과는 window.__selftest 에도 남는다: {pass, fail, lines, elapsedMs}. 규칙은 AGENTS.md 참고. */
(()=>{
  const startedAt=performance.now(),lines=[];let pass=0,fail=0;
  const ok=(cond,msg)=>{if(cond){pass++}else{fail++;lines.push('✗ '+msg)}};
  const section=name=>lines.push('— '+name);
  // 속도를 위해 그리기는 4프레임마다(+마지막 프레임). 짧은 연출 구간(0.2초 이상)도 여러 번 그려진다.
  let frameNo=0;const tick=n=>{for(let i=0;i<n;i++){update(1/60);if(++frameNo%4===0||n>1&&i===n-1)render()}};
  // 연출이 모두 끝날 때까지만 진행한다(최대 n프레임). 끝까지 돌리므로 검사 범위는 같다.
  const settle=n=>{for(let i=0;i<n;i++){update(1/60);if(++frameNo%4===0)render();if(i>=30&&FX.length===0&&castLock<=0&&!pendingCombo)break}render()};
  const toFight=()=>{for(let k=0;k<120&&(!fighting()||castLock>0);k++){if(BI)skipBossIntro();tick(10)}};
  const guard=(name,fn)=>{try{fn()}catch(e){fail++;lines.push('✗ '+name+' 예외: '+e.message+' @ '+String(e.stack||'').split('\n')[1])}};

  save=function(){};                                  // 점검 중에는 절대 저장하지 않는다
  $('modal').hidden=true;pending=0;                   // 오프라인 보상 창은 점검과 무관하므로 닫는다
  S=fresh();S.best=999;S.gold=1e300;S.auto=false;S.sound=false;S.equip=SK.slice(0,8).map(s=>s.id);
  ST=stats();m=null;spawnT=0;FX=[];P=[];T=[];C=[];CH=null;BI=null;castLock=0;
  buildBar();buildBook();buildRelics();buildAch();chUI();

  section('정적 구조');
  guard('정적 구조',()=>{
    const ids=SK.map(s=>s.id);ok(new Set(ids).size===ids.length,'SK id 중복: '+ids.join(','));
    for(const s of SK){
      ok(typeof s.fn==='function',s.id+': fn 없음');ok(IC[s.id],s.id+': IC 아이콘 없음');
      ok(BR[s.id]&&BR[s.id].a&&BR[s.id].b,s.id+': BR 분기 a/b 없음');
      ok(typeof s.unlock==='number'&&typeof s.cd==='number'&&s.c&&s.d&&s.name,s.id+': unlock/cd/c/d/name 누락');
      const n=COMBOS.filter(c=>c.a===s.id||c.b===s.id).length;ok(n===1,s.id+': 연계기 소속 '+n+'개 (정확히 1개여야 함)');
    }
    for(let i=1;i<SK.length;i++)ok(SK[i-1].unlock<=SK[i].unlock,'SK가 unlock 순으로 정렬되지 않음');
    for(const c of COMBOS){ok(ids.includes(c.a)&&ids.includes(c.b),c.name+': 없는 스킬 참조');ok(typeof c.fn==='function'&&c.col&&c.d,c.name+': fn/col/d 누락')}
    ok(new Set(COMBOS.map(c=>c.name)).size===COMBOS.length,'연계기 이름 중복');
    for(const a of AWK){ok(typeof a.fn==='function'&&a.name&&a.d&&typeof a.unlock==='number',a.id+': 각성기 필드 누락');ok(awkIcon(a),a.id+': 각성기 아이콘 없음');ok(!ids.includes(a.id),a.id+': 각성기가 일반 스킬 목록에도 있음')}
    ok(AWK[0].unlock<=1,'첫 각성기는 처음부터 열려 있어야 함');
    for(const u of UP)ok(u.id in freshLv(),'UP '+u.id+': freshLv에 없음');
    ok(new Set(RELICS.map(r=>r.id)).size===RELICS.length,'유물 id 중복');
    for(const a of ACH){const v=a.p();ok(Array.isArray(v)&&v.length===2,'업적 '+a.id+': p()가 [현재, 목표]를 돌려주지 않음')}
    const saved=JSON.parse(JSON.stringify(S));ok(saved.lv&&saved.relics&&saved.awk&&saved.daily,'저장 형식에 lv/relics/awk/daily 누락');
  });

  section('스킬 × 분기 실제 발동');
  guard('스킬',()=>{
    for(const s of SK)for(const b of [null,'a','b']){if(b)S.awk[s.id]=b;else delete S.awk[s.id];
      toFight();if(!m){fail++;lines.push('✗ 몬스터가 나오지 않음');return}m.hp=m.max=1e15;castLock=0;frenzyT=0;
      ok(cast(s,true),s.id+(b||'')+': 시연 실패');settle(s.buff?30:300)}
    S.awk={};
  });

  section('연계기');
  guard('연계기',()=>{for(const c of COMBOS){toFight();m.hp=m.max=1e15;castLock=0;ok(previewCombo(c),c.name+': 시연 실패');settle(300)}
    // 규칙: 시작 스킬을 쓰면 짝 스킬 쿨타임이 PRIME_CD 이하로 줄어든다
    const c=COMBOS.find(x=>x.a!=='shield'&&!skOf(x.a).buff),a=skOf(c.a),b=skOf(c.b);toFight();m.hp=m.max=1e15;castLock=0;
    for(const s of SK)cds[s.id]=0;cds[b.id]=30;lastCast=null;pendingCombo=null;cast(a);ok(cds[b.id]<=PRIME_CD,'연계 준비: 짝 쿨타임이 '+PRIME_CD+'초 이하로 줄지 않음');
    tick(10);ok(!!activeLink()&&activeLink().c===c,'연계 창이 열리지 않음');tick(400);
    // 뇌창 투척 -> 천뢰 낙하 -> 뇌신 강림 자동 연계 검증
    const tc=COMBOS.find(x=>x.name==='뇌신 강림'),ta=skOf(tc.a),tb=skOf(tc.b);
    S.equip=[ta.id,tb.id];buildBar();toFight();m.hp=m.max=1e15;castLock=0;for(const s of SK)cds[s.id]=0;cds[tb.id]=30;lastCast=null;pendingCombo=null;
    cast(ta);ok(cds[tb.id]<=PRIME_CD,'뇌창 투척 후 천뢰 낙하 쿨타임이 '+PRIME_CD+'초 이하로 줄지 않음');
    ok(!!activeLink()&&activeLink().c===tc,'뇌신 강림 연계 창이 열리지 않음');
    S.auto=true;cds[tb.id]=0;castLock=0;gauge=0;autoCast();
    ok(!!pendingCombo&&pendingCombo===tc,'자동 스킬에서 뇌신 강림 발동 실패');
    tickCombo();ok(castLock>0,'뇌신 강림 시전 잠금 미적용');tick(300);
    S.auto=false;S.equip=SK.slice(0,8).map(s=>s.id);buildBar();
  });

  section('뇌창 투척 · 천뢰 낙하 · 뇌신 강림');
  guard('뇌신 강림 keep 연계',()=>{
    const tc=comboOf('spear'),ta=skOf('spear'),tb=skOf('thunder');
    const reset=()=>{S=fresh();S.best=999;S.auto=false;S.sound=false;S.equip=['spear','thunder'];ST=stats();CH=null;BI=null;BF=null;FX=[];P=[];T=[];B=[];PR=[];C=[];relicQ=[];stop=0;slowT=0;castLock=0;frenzyT=0;gauge=0;lastCast=null;pendingCombo=null;spawnT=100;miniQ=0;
      m=makeMonster(1);m.state='fight';m.x=monX;m.hp=m.max=1e15;atkT=1e6;for(const s of SK)cds[s.id]=0;buildBar()};
    const until=fn=>{for(let i=0;i<1500&&!fn();i++)tick(1)};
    ok(ta.unlock===44&&tb.unlock===48,'뇌창/천뢰 해금 스테이지');ok(ta.cd===18&&tb.cd===24,'뇌창/천뢰 기본 쿨타임');
    reset();cds.thunder=30;ok(cast(ta),'뇌창 투척 실전 시전');const sp=thunderSpear();
    ok(cds.thunder===PRIME_CD,'뇌창 투척 연계 준비 쿨타임');ok(activeLink()?.c===tc,'뇌신 강림 연계 창');
    until(()=>castLock<=0);ok(thunderSpear()===sp&&FX.includes(sp),'시작 연출 종료 후 박힌 창 유지');ok(!sp.collapse,'연계 대기 중 창 붕괴 금지');
    until(()=>gt-lastCast.t>=7.8);cds.thunder=0;gauge=0;const cd=cds.spear;
    ok(cast(tb),'8초 직전 수동 천뢰 연계');ok(pendingCombo===tc,'뇌신 강림 예약');ok(Math.abs(cds.spear-cd*.5)<1e-9,'시작 스킬 쿨타임 절반 보상');ok(gauge===20*ST.gg,'각성 게이지 연계 보상');
    until(()=>sp.claimed);const god=FX.find(o=>o.spear===sp);ok(god?.spear===sp,'뇌신 강림이 박힌 동일 창 인계');
    ok(FX.filter(o=>o.thunderSpear).length===1,'창 중복 소환 금지');
    until(()=>sp.consumed);ok(sp.consumed&&stop>=.16,'번개 폭풍 적중 시 창 소모와 히트스톱');ok(S.combos===1,'뇌신 강림 발동 횟수');tick(200);ok(!thunderSpear()&&castLock<=0,'뇌신 강림 종료 정리');
    reset();cast(ta);const autoSp=thunderSpear();cds.thunder=PRIME_CD;S.auto=true;until(()=>autoSp.claimed);S.auto=false;
    ok(autoSp.claimed&&S.combos===1,'자동 뇌신 강림 창 인계');
    reset();cast(ta);const expired=thunderSpear();tick(550);ok(!FX.includes(expired),'8초 만료 시 창 전기를 잃고 붕괴/제거');
    reset();cast(ta);until(()=>castLock<=0);cast(skOf('dash'));tick(40);ok(!thunderSpear(),'다른 스킬로 연계 중단 시 창 정리');
    reset();S.best=44;cast(ta);tick(160);ok(!thunderSpear(),'천뢰 미해금 시 창 붕괴');
    reset();cast(ta,true);tick(160);ok(!thunderSpear(),'뇌창 단독 시연 종료 후 창 붕괴');
    reset();CH={mods:[DMODS.find(x=>x.id==='chain')]};cast(ta);const longSp=thunderSpear();until(()=>gt-lastCast.t>=15.7);
    ok(thunderSpear()===longSp&&activeLink()?.left>0,'일일 도전 16초 연계 창 동안 동일 창 유지');cast(tb);until(()=>longSp.claimed);ok(longSp.claimed,'16초 직전 뇌신 강림 인계');
    reset();cast(ta);const lost=thunderSpear();m=null;lastCast=null;tick(180);ok(!FX.includes(lost),'대상 소멸/연계 초기화 시 안전 정리');
    reset();ok(previewCombo(tc),'뇌신 강림 전체 과정 시연');const demoSp=thunderSpear();tick(300);
    ok(demoSp.claimed&&demoSp.consumed,'뇌신 강림 시연도 시작 창을 인계/소모');
  });

  section('중력 구속 · 운석 낙하 · 천붕');
  guard('중력 연계',()=>{
    const gc=comboOf('gravity'),ga=skOf('gravity'),gb=skOf('meteor');
    const reset=()=>{S=fresh();S.best=999;S.auto=false;S.sound=false;S.equip=['gravity','meteor'];ST=stats();CH=null;BI=null;BF=null;FX=[];P=[];T=[];B=[];PR=[];C=[];relicQ=[];stop=0;slowT=0;castLock=0;frenzyT=0;gauge=0;lastCast=null;pendingCombo=null;spawnT=100;miniQ=0;
      m=makeMonster(1);m.state='fight';m.x=monX;m.hp=m.max=1e15;atkT=1e6;for(const s of SK)cds[s.id]=0;buildBar()};
    const until=fn=>{for(let i=0;i<1500&&!fn();i++)tick(1)};
    ok(ga.unlock===52&&gb.unlock===56,'중력/운석 해금 스테이지');ok(ga.cd===20&&gb.cd===26,'중력/운석 기본 쿨타임');
    reset();cds.meteor=30;ok(cast(ga),'중력 구속 실전 시전');const well=gravityWell(),pos=gravityPoint(well);
    ok(cds.meteor===PRIME_CD,'중력 구속 연계 준비 쿨타임');ok(activeLink()?.c===gc,'천붕 연계 창');
    until(()=>well.t>=1.4);ok(m.sq>.2&&m.ly>0,'중력 구속의 찌그러짐/지면 침하');
    until(()=>castLock<=0);ok(gravityWell()===well&&FX.includes(well),'시작 연출 종료 후 동일 구체 유지');ok(!well.collapse,'연계 대기 중 구체 붕괴 금지');
    until(()=>gt-lastCast.t>=7.8);cds.meteor=0;gauge=0;const cd=cds.gravity;
    ok(cast(gb),'8초 직전 수동 운석 연계');ok(pendingCombo===gc,'천붕 예약');ok(Math.abs(cds.gravity-cd*.5)<1e-9,'시작 스킬 쿨타임 절반 보상');ok(gauge===20*ST.gg,'각성 게이지 연계 보상');
    until(()=>well.claimed);const flight=FX.find(o=>o.meteorFlight);ok(flight?.well===well,'운석이 시작 스킬의 동일 구체 인계');
    ok(FX.filter(o=>o.gravityWell).length===1&&FX.filter(o=>o.meteorFlight).length===1,'구체/운석 중복 소환 금지');
    ok(gravityPoint(well).x===pos.x&&gravityPoint(well).y===pos.y,'연계 인계 시 구체 좌표 연속성');
    until(()=>flight.hit);ok(well.consumed&&stop>=.14,'충돌 시 구체 소모와 히트스톱');ok(S.combos===1,'천붕 발동 횟수');tick(200);ok(!gravityWell()&&castLock<=0,'천붕 종료 정리');
    reset();cast(ga);const autoWell=gravityWell();cds.meteor=PRIME_CD;S.auto=true;until(()=>autoWell.claimed);S.auto=false;
    ok(autoWell.claimed&&S.combos===1,'실제 잠금/쿨타임을 기다린 자동 천붕');ok(FX.find(o=>o.meteorFlight)?.well===autoWell,'자동 천붕의 구체 연속성');
    reset();cast(ga);const expired=gravityWell();tick(550);ok(!FX.includes(expired),'8초 만료 시 구체 붕괴/제거');
    cds.meteor=0;cast(gb);ok(!pendingCombo&&!FX.find(o=>o.meteorFlight)?.well,'시간 만료 후 운석 단독 발동');
    reset();cast(ga);until(()=>castLock<=0);cast(skOf('dash'));tick(40);ok(!gravityWell(),'다른 스킬로 연계 중단 시 구체 정리');
    reset();S.best=52;cast(ga);tick(160);ok(!gravityWell(),'운석 미해금 시 구체 붕괴');
    reset();cast(ga,true);tick(160);ok(!gravityWell(),'중력 단독 시연 종료 후 구체 붕괴');
    reset();CH={mods:[DMODS.find(x=>x.id==='chain')]};cast(ga);const longWell=gravityWell();until(()=>gt-lastCast.t>=15.7);
    ok(gravityWell()===longWell&&activeLink()?.left>0,'일일 도전 16초 연계 창 동안 동일 구체 유지');cast(gb);until(()=>longWell.claimed);ok(longWell.claimed,'16초 직전 천붕 인계');
    reset();cast(ga);const lost=gravityWell();m=null;lastCast=null;tick(180);ok(!FX.includes(lost),'대상 소멸/연계 초기화 시 안전 정리');
    reset();cast(gb);m=null;tick(200);ok(FX.length===0&&castLock<=0,'운석 도중 몬스터 소멸 안전');
    reset();cast(ga);FX=[];cds.meteor=0;castLock=0;cast(gb);ok(!pendingCombo,'FX 초기화 후 존재하지 않는 구체로 연계 금지');
    // 실제 피해 경로에서 분기 A 및 시연 pm을 검증한다. 원래 함수를 반드시 복원한다.
    const hit=skillHit,damage=deal;let hits=[],dealt=0;
    try{
      skillHit=function(mult,pm,x,y,o){hits.push({mult,pm,...o});return hit(mult,pm,x,y,o)};
      deal=function(d,crit,src,x,y,o){if(src==='skill')dealt+=d;return damage(d,crit,src,x,y,o)};
      for(const [s,total] of [[ga,9],[gb,13.5]])for(const b of [null,'a','b']){
        reset();if(b)S.awk[s.id]=b;ST.cc=0;hits=[];dealt=0;cast(s,true);tick(200);
        ok(Math.abs(hits.reduce((n,h)=>n+h.mult,0)-total)<1e-8&&hits.every(h=>h.pm===.1&&h.sid===s.id),s.id+(b||'')+': 피해 합계/시연 배율/id');
        const expected=ST.atk*ST.sk*total*.1*(b==='a'?1.4:1);ok(dealt>=expected*.9&&dealt<=expected*1.1,s.id+(b||'')+': 실제 피해 및 A 분기');
        ok(hits.at(-1)?.heavy&&hits.at(-1)?.name===s.name,s.id+(b||'')+': 마지막 강타 라벨');
      }
      for(const s of [ga,gb]){reset();S.awk[s.id]='b';cast(s);ok(Math.abs(cds[s.id]-s.cd*ST.cdm*.7)<1e-9,s.id+': B 분기 쿨타임')}
      reset();hits=[];ok(previewCombo(gc),'천붕 전체 과정 시연');const demoWell=gravityWell();tick(300);
      ok(demoWell.claimed&&demoWell.consumed,'천붕 시연도 시작 구체를 인계/소모');
      ok(hits.every(h=>h.pm===.1)&&Math.abs(hits.reduce((n,h)=>n+h.mult,0)-38.5)<1e-8,'천붕 시연 9+13.5+16배, pm=0.1');
      ok(hits.filter(h=>h.sid==='meteor').length===1&&hits.filter(h=>h.sid==='combo').length===1,'운석/연계 피해 중복 없음');
      ok(hits.at(-1)?.name==='천붕'&&hits.at(-1)?.crack===2,'천붕 강타 이름/큰 균열');
    }finally{skillHit=hit;deal=damage;reset()}
    // 다른 스킬 쌍에도 데이터/훅만 붙여 동일한 인계 경로가 작동하는지 검증한다.
    const other=comboOf('dash'),oa=skOf(other.a),ob=skOf(other.b),afn=oa.fn,bfn=ob.fn,cfn=other.fn;let transfer=null,standalone=0;
    try{
      other.keep={get:()=>FX.find(o=>o.testKept&&!o.collapse&&!o.consumed),ready:.1,release(o){o.collapse=true;o.dur=o.t+.05}};
      oa.fn=pm=>addFX({testKept:1,dur:.2,up(dt,o){if(o.t<.1)castLock=Math.max(castLock,.05)}});
      ob.fn=()=>standalone++;other.fn=(pm,o)=>{transfer={pm,o};o.consumed=true;o.dur=o.t+.1};
      reset();cast(oa);const kept=other.keep.get();until(()=>castLock<=0);cast(ob);until(()=>!!transfer);
      ok(transfer?.o===kept&&transfer?.pm===1,'다른 스킬 쌍 keep 훅의 동일 FX/실전 배율 인계');
      ok(standalone===0&&S.combos===1,'keep 연계에서 마무리 스킬 중복 시전 방지');
      reset();transfer=null;ok(previewCombo(other),'다른 스킬 쌍 keep 전체 시연');const demo=other.keep.get();until(()=>!!transfer);
      ok(transfer?.o===demo&&transfer?.pm===.1,'keep 시연에서 시작 FX와 시연 배율 인계');
      reset();cast(oa);FX=[];castLock=0;ok(!activeLink(),'keep FX 소멸 시 연계 안내 제거');cast(ob);
      ok(!pendingCombo&&standalone===1,'keep FX 소멸 시 마무리 스킬 단독 발동');
      reset();cast(oa);const interrupted=other.keep.get();lastCast=null;tick(20);
      ok(interrupted.collapse&&!FX.includes(interrupted),'keep 연계 중단 시 release 훅 호출/정리');
    }finally{oa.fn=afn;ob.fn=bfn;other.fn=cfn;delete other.keep;reset()}
    // 3쌍 120초 자동 전투: 기존 기준 14/15보다 낮아지면 실패한다.
    const originalCast=cast;let finish=0,linked=0;
    try{S.equip=['spear','thunder','archers','wolf','gravity','meteor'];buildBar();S.auto=true;
      cast=function(s,preview){const n=S.combos,result=originalCast(s,preview);if(result&&!preview&&COMBOS.some(c=>c.b===s.id)){finish++;if(pendingCombo||S.combos>n)linked++}return result};
      const startTime=gt;for(let i=0;i<14400&&gt-startTime<120;i++)update(1/60);
      ok(gt-startTime>=120,'자동 전투가 전투 시간 120초에 도달하지 못함');
      ok(finish>=15&&linked/finish>=14/15,'3쌍 전투 시간 120초 자동 연계 비율: '+linked+'/'+finish);lines.push('자동 연계: '+linked+'/'+finish+' (전투 시간 120초)');
    }finally{cast=originalCast;reset();S.equip=SK.slice(0,8).map(s=>s.id);buildBar()}
  });

  section('각성기');
  guard('각성기',()=>{for(const a of AWK){toFight();m.hp=m.max=1e15;castLock=0;ok(previewAwk(a),a.name+': 시연 실패');settle(360)}
    S.awkSel=AWK[0].id;toFight();m.hp=m.max=1e15;castLock=0;gauge=100;ok(castAwaken(),'게이지 100에서 각성기 발동 실패');ok(gauge===0,'각성기 발동 후 게이지가 0이 아님');tick(360)});

  section('보스 · 2페이즈 · 패턴');
  guard('보스',()=>{S.farm=false;S.stage=10;m=null;spawnT=0;stop=0;for(let k=0;k<120&&!(m&&BI);k++)tick(1);ok(m&&m.boss&&m.state==='enter'&&!!BI,'보스 등장 컷신이 시작되지 않음');
    tick(260);ok(m.state==='fight','컷신 뒤 전투로 넘어가지 않음');
    m.hp=m.max*.49;tick(3);ok(m.state==='phase','체력 50% 아래에서 2페이즈 전환 없음');tick(200);ok(m.enraged&&m.state==='fight','2페이즈 변신 후 전투 복귀 실패');
    m.hp=m.max=1e15;const seen=new Set();for(let k=0;k<14;k++){m.atkT=0;tick(3);if(m.pat)seen.add(m.pat.ty);tick(150);if(!fighting())toFight()}
    ok(seen.size>=3,'보스 패턴 다양성 부족: '+[...seen].join(','));
    bossFail();ok(S.farm,'보스 실패 후 반복 사냥으로 가지 않음');for(const s of SK)cds[s.id]=9;retryBoss();ok(SK.every(s=>cds[s.id]===0),'보스 재도전 시 쿨타임 초기화 안 됨');
    S.farm=false;S.stage=10;m=null;spawnT=0;stop=0;BI=null;BF=null;
    for(let k=0;k<120&&!(m&&BI);k++)tick(1);
    tick(260);ok(m&&m.boss&&m.state==='fight','보스 전투 전환 실패');
    m.sh=0;m.hp=1;BF=null;deal(100,false,'hero',m.x,groundY-60*U);
    ok(m.state==='split','보스 처치 시 split 상태 미전환');
    ok(BF&&BF.name==='일반 공격','보스 처치 결정타 연출 미발동: '+(BF&&BF.name));
    tick(140);ok(!BF,'결정타 연출이 시간 내에 끝나지 않음');tick(400)});

  section('일일 도전');
  guard('도전',()=>{m=null;spawnT=0;tick(30);S.daily={key:'',done:false};const stBefore=S.stage;ok(startChallenge(),'도전 시작 실패');
    for(let k=0;k<300&&!(m&&m.boss&&m.state==='fight');k++){if(BI)skipBossIntro();tick(10)}ok(m&&m.boss&&bossMax===60,'도전 보스/제한 시간 이상');
    bossT=.01;tick(5);ok(!CH&&S.stage===stBefore,'도전 실패 후 원래 스테이지로 복귀하지 않음')});

  section('보스 도감');
  guard('도감 호환 및 처치 반영',()=>{
    ok(CODEX.length===13,'도감 총 항목 수가 13개가 아님: '+CODEX.length);
    const oldSave={gold:50,stage:3,lv:freshLv(),relics:{},ach:{},title:''};
    load(oldSave);
    ok(S.codex&&typeof S.codex==='object'&&Object.keys(S.codex).length===0,'도감 필드 없는 예전 세이브 load 시 빈 도감 미생성');
    ok(codexCount()===0,'빈 도감 수집 수가 0이 아님');
    ok(codexBonus()===0,'빈 도감 보너스가 0이 아님');
    S=fresh();S.best=999;S.gold=1e300;S.auto=false;S.sound=false;S.equip=SK.slice(0,8).map(s=>s.id);buildBar();
    const atk0=stats().atk;
    S.codex={};ST=stats();
    S.farm=false;S.stage=5;m=null;spawnT=0;stop=0;BI=null;BF=null;
    for(let k=0;k<120&&!(m&&BI);k++)tick(1);
    tick(260);ok(m&&m.boss&&m.state==='fight','도감 테스트용 보스 소환 실패');
    const expectedCid=`${m.zone}_${m.type}`;
    m.sh=0;m.hp=1;deal(100,false,'hero',m.x,groundY-60*U);
    ok(S.codex[expectedCid]===1,'보스 처치 후 해당 칸 처치 횟수 기록 실패: '+expectedCid);
    ok(codexCount()===1,'보스 처치 후 도감 열린 칸 수가 1이 아님');
    ok(Math.abs(codexBonus()-.02)<1e-5,'열린 칸 1개 보너스가 +2%가 아님: '+codexBonus());
    ok(stats().atk>atk0,'보스 도감 보너스가 stats().atk에 반영되지 않음');
    ok(Math.abs(stats().atk/(atk0*1.02)-1)<1e-3,'stats().atk 증가율이 +2%와 일치하지 않음');
    const z=m.zone,t=m.type;
    recordCodex({boss:true,zone:z,type:t});
    ok(S.codex[expectedCid]===2,'동일 보스 처치 시 처치 횟수 2회 누적 실패');
    ok(codexCount()===1,'동일 보스 재처치 시 칸 수가 1 유지 실패');
    for(const c of CODEX)S.codex[c.id]=1;
    ok(codexCount()===13,'전체 도감 수집 수가 13이 아님');
    ok(Math.abs(codexBonus()-.26)<1e-5,'13칸 전부 열었을 때 보너스가 +26%가 아님: '+codexBonus());
    ok(Math.abs(stats().atk/(atk0*1.26)-1)<1e-3,'전체 해금 시 stats().atk 증가율이 +26%와 일치하지 않음');
    // 스테이지 5~400 보스 출현 순회 검사 (13칸 모두 출현 & 100 스테이지 이내 출현)
    const seen=new Set();
    for(let s=5;s<=400;s+=5){seen.add(`${zoneOf(s)}_${bossTypeOf(s)}`)}
    ok(seen.size===CODEX.length,'스테이지 5~400에서 도감 13칸 중 미출현 보스 존재: '+seen.size+'/'+CODEX.length);
    ok(CODEX.every(c=>seen.has(c.id)&&c.first<=100),'100 스테이지 이내 미출현 도감 보스 존재');
    ok($('comboTxt').textContent.includes(String(COMBOS.length)),'연계기 헤더에 COMBOS.length 미반영: '+$('comboTxt').textContent);
    S.codex={};ST=stats();
  });

  section('보스 그림자 추적탄');
  guard('추적탄 독립 패링/피해/방패',()=>{
    const reset=(stage=20,enraged=false)=>{S=fresh();S.best=999;S.stage=stage;S.auto=false;S.sound=false;ST=stats();CH=null;BI=null;BF=null;FX=[];P=[];T=[];C=[];B=[];PR=[];relicQ=[];shieldOn=null;stop=0;slowT=0;castLock=0;parryLock=0;gauge=0;lastCast=null;pendingCombo=null;h.stun=0;h.dodgeT=-1;atkT=1e6;
      m=makeMonster(stage);m.state='fight';m.yo=0;m.sh=0;m.hp=m.max=1e12;m.enraged=enraged;m.ph2=true;m.atkT=100;for(const s of SK)cds[s.id]=0};
    const begin=()=>{const random=Math.random;try{Math.random=()=>.999;m.atkT=0;bossAI(1/60)}finally{Math.random=random}return m.pat};
    const advance=(p,t)=>{for(let i=0;i<900&&m&&m.pat===p&&p.t<t;i++)tick(1)};
    const tap=()=>{const lock=castLock,r=cv.getBoundingClientRect();castLock=Math.max(1,lock);cv.dispatchEvent(new PointerEvent('pointerdown',{clientX:r.left+heroX,clientY:r.top+groundY-60*U}));castLock=lock};
    const parries=(p,mask)=>{for(let i=0;i<p.orbs.length;i++){const g=p.orbs[i];advance(p,g.imp-.15);
      ok(bossParryTarget(p)===g&&g.imp-p.t>=0&&g.imp-p.t<=.5,`${i+1}번째 구체의 독립 경고 구간`);render();if(mask[i])tap();advance(p,g.imp+.01)}};
    try{
      reset(15);ok(begin().ty!=='orbs','20 스테이지 이전 추적탄 출현 금지');
      reset();let p=begin();ok(p.ty==='orbs'&&p.orbs.length===3,'20 스테이지 보스 추적탄 3개 발생');
      ok(p.orbs.every((g,i)=>Math.abs(g.imp-(1.2+i*.4))<1e-9),'추적탄 적중 간격 0.4초');
      advance(p,.6);tap();ok(p.orbs.every(g=>!g.parry),'경고 전 탭은 패링 불가');advance(p,1.1);tap();tap();
      ok(p.orbs[0].parry&&p.orbs.slice(1).every(g=>!g.parry),'연속 탭도 현재 구체 하나만 패링');advance(p,1.22);
      ok(p.orbs[0].result==='parried'&&m.pat===p&&!m.stun,'첫 패링 후 나머지 구체/보스 패턴 유지');
      reset();p=begin();p.evade=false;const hp=m.hp;parries(p,[true,true,true]);
      ok(S.parries===3&&p.orbs.every(g=>g.result==='parried'),'실제 탭 이벤트로 3연속 독립 패링');
      ok(p.returning&&CUT?.name==='완벽 반사!'&&!h.stun,'전부 패링 시 완벽 반사 연출/피해 없음');settle(200);
      ok(Math.abs(hp-m.hp-ST.atk*12)<.001,'완벽 반사 피해 공격력 12배');ok(T.some(t=>t.label==='완벽 반사!'||t.label==='치명타')||m.stun>0,'완벽 반사 강타/보스 기절');
      reset();p=begin();p.evade=false;parries(p,[false,true,false]);
      ok(S.parries===1&&p.orbs.filter(g=>g.result==='hit').length===2&&!p.returning,'부분 패링 시 해당 구체만 차단');
      ok(Math.abs(p.stunTotal-1.3*2/3)<1e-9,'1/3 패링 시 총 기절 피해 2/3');
      reset();p=begin();p.evade=false;parries(p,[true,false,true]);ok(Math.abs(p.stunTotal-1.3/3)<1e-9,'2/3 패링 시 총 기절 피해 1/3');
      reset(20,true);p=begin();ok(p.orbs.length===4,'2페이즈 추적탄 4개');
      const t0=p.t;bossAI(.4);ok(Math.abs(p.t-t0-.4)<1e-9,'2페이즈에서도 구체 간격 가속 없음');p.evade=false;parries(p,[true,true,true,true]);
      ok(S.parries===4&&p.returning,'2페이즈 4연속 패링 시 완벽 반사');
      reset();p=begin();p.evade=false;advance(p,.8);cast(skOf('shield'));const shield=shieldOn;advance(p,1.24);
      ok(p.orbs[0].result==='blocked'&&shield.blocked&&S.parries===0&&!h.stun,'결정 방패는 패링과 별개로 구체 차단');advance(p,1.5);
      ok(shield.ph===1&&shieldOn===null,'막기 후 기존 방패 변환 동작 유지');advance(p,2.05);
      ok(p.orbs.slice(1).every(g=>g.result==='hit')&&!p.returning,'소모된 방패는 뒤 구체까지 자동 차단하지 않음');settle(200);ok(shield.pl,'막기 후 기존 결정 파쇄검 발동');
      reset();p=begin();p.t=p.imp+.01;tap();ok(!p.orbs[0].parry,'적중 시각 이후 탭은 소급 패링 불가');
      for(const enrage of [false,true]){reset(20,enrage);p=begin();p.evade=false;advance(p,p.orbs.at(-1).imp+.01);
        ok(Math.abs(p.stunTotal-1.3)<1e-9,'무조작 총 기절 상한 1.3초: '+(enrage?'4개':'3개'));
        reset(20,enrage);p=begin();const random=Math.random;let rolls=0;
        try{Math.random=()=>{rolls++;return .2};resolveBossOrb(p,p.orbs[0]);const firstRolls=rolls;
          Math.random=()=>.9;for(const g of p.orbs.slice(1))resolveBossOrb(p,g);
          ok(firstRolls>0&&p.evade&&p.orbs.every(g=>g.result==='dodged')&&!h.stun,'회피 결과는 묶음 전체에 유지: '+(enrage?'4개':'3개'));
        }finally{Math.random=random}}
      for(const evade of [true,false]){reset();CH={stage:20,mods:[DMODS.find(x=>x.id==='glass')],saved:{stage:20,kills:0,farm:false,farmKills:0}};p=begin();p.evade=evade;advance(p,p.orbs.at(-1).imp+.01);
        ok(evade?!!CH&&p.orbs.every(g=>g.result==='dodged'):!CH&&m.state==='flee'&&p.orbs.filter(g=>g.res).length===1,'유리 대포에서도 묶음 단위 회피/피격 실패: '+evade)}
      reset();const random=Math.random;try{Math.random=()=>.9;resolveHit({ty:'slam',parry:false});ok(h.stun===1.3,'기존 단타 패턴 기절 1.3초 유지')}finally{Math.random=random}
      reset();p=begin();parries(p,[true,true,true]);m=null;spawnT=100;settle(200);ok(FX.length===0,'반사 중 보스 소멸 시 안전 정리');
      reset();p=begin();p.evade=false;
      advance(p,.2);tap();ok(T.some(t=>t.text==='너무 빨라!'),'패링 창 밖 탭 시 너무 빨라! 텍스트 출력');
      for(let t=p.t+.05;t<=p.orbs.at(-1).imp+.05;t+=.05){advance(p,t);tap()}
      advance(p,p.orbs.at(-1).imp+.1);
      ok(!p.returning&&p.orbs.filter(g=>g.result==='parried').length<p.orbs.length,'연타 시 추적탄 완벽 반사 실패');
      reset();p=begin();p.evade=false;
      for(let i=0;i<p.orbs.length;i++){const g=p.orbs[i];advance(p,g.imp-.15);tap();advance(p,g.imp+.01)}
      ok(S.parries===3&&p.orbs.every(g=>g.result==='parried')&&p.returning,'타이밍 맞춰 1회 탭 시 3/3 패링 성공');
      ok(!T.some(t=>t.text==='너무 빨라!'),'타이밍 성공 시 너무 빨라! 미출력');
      reset(1);m.pat=null;castLock=0;lastTap=0;const hp0=m.hp;
      const r=cv.getBoundingClientRect();
      cv.dispatchEvent(new PointerEvent('pointerdown',{clientX:r.left+heroX,clientY:r.top+groundY-60*U}));
      ok(m.hp<hp0,'경고 없을 때 탭 공격으로 피해 적용');
      ok(parryLock===0,'경고 없을 때 패링 잠금 미발생');
      ok(!T.some(t=>t.text==='너무 빨라!'),'경고 없을 때 너무 빨라! 미출력');
      reset(20);m.pat=null;castLock=0;lastTap=0;const bhp0=m.hp;
      cv.dispatchEvent(new PointerEvent('pointerdown',{clientX:r.left+heroX,clientY:r.top+groundY-60*U}));
      ok(m.hp<bhp0&&parryLock===0,'보스 공격 경고 없을 때도 탭 공격 정상 동작');
    }finally{reset(5);m=null;spawnT=100;buildBar()}
  });

  section('빙정 시트 · 유지 물체 · 피해');
  guard('빙정',()=>{
    const reset=()=>{S=fresh();S.best=999;S.auto=false;S.sound=false;S.equip=['frostcut','icedragon','iceflower','frostspiral'];ST=stats();CH=null;BI=null;BF=null;CUT=null;FX=[];P=[];T=[];B=[];PR=[];C=[];relicQ=[];shieldOn=null;stop=0;slowT=0;castLock=0;frenzyT=0;circleT=0;gauge=0;lastCast=null;pendingCombo=null;spawnT=100;miniQ=0;h.stun=0;
      m=makeMonster(1);m.state='fight';m.x=monX;m.sh=0;m.hp=m.max=1e12;atkT=1e6;for(const s of SK)cds[s.id]=0};
    // 긴 대기·수치 검사는 update만 실행. 실제 그리기는 기존 전체 시연과 아래 핵심 컷에서 확인한다.
    const step=n=>{for(let i=0;i<n;i++)update(1/60)},until=fn=>{for(let i=0;i<1800&&!fn();i++)update(1/60)};
    const data=[['frostcut',60,22,9.5,1.2],['icedragon',64,28,14,1.9],['iceflower',68,24,10,1.2],['frostspiral',72,30,14.5,1.9]];
    const hit=skillHit,damage=deal;let hits=[],dealt=0;
    try{
      skillHit=function(mult,pm,x,y,o){hits.push({mult,pm,...o});return hit(mult,pm,x,y,o)};
      deal=function(d,crit,src,x,y,o){if(src==='skill')dealt+=d;return damage(d,crit,src,x,y,o)};
      ok(JSON.stringify(ICE_COL)===JSON.stringify(['#05070B','#245BBC','#697582','#61DCF3','#FFFFFF']),'JSON 빙정 5색 일치');
      for(const [id,unlock,cd,base,slope] of data){const s=skOf(id);ok(s.unlock===unlock&&s.cd===cd,id+': 시트 배정/쿨타임');
        ok((IC[id].match(/#[0-9a-f]{6}/gi)||[]).every(c=>ICE_COL.includes(c)),id+': 아이콘 빙정 팔레트');
        for(const [tr,lv] of [[0,0],[1,5],[2,10],[3,20]])for(const b of [null,'a','b']){
          reset();S.lv.skill=lv;if(b)S.awk[id]=b;ST=stats();ST.cc=0;hits=[];dealt=0;cast(s,true);step(230);
          const total=base+slope*tr,expected=ST.atk*ST.sk*total*.1*(b==='a'?1.4:1);
          ok(Math.abs(hits.reduce((n,h)=>n+h.mult,0)-total)<1e-8&&hits.every(h=>h.pm===.1&&h.sid===id),id+': TR '+tr+' 분기 '+b+' 피해/pm/id');
          ok(dealt>=expected*.9&&dealt<=expected*1.1&&hits.at(-1)?.heavy&&hits.at(-1)?.name===s.name,id+': TR '+tr+' 분기 '+b+' 실제 피해/강타');
          const prev=id==='frostcut'||id==='iceflower'?(9+1.2*tr)/20:(13.5+1.9*tr)/26;
          ok(total/cd<=prev,id+': TR '+tr+' 기존 스킬 초당 배율 이하');
        }
        reset();S.awk[id]='b';cast(s);ok(Math.abs(cds[id]-s.cd*ST.cdm*.7)<1e-9,id+': B 쿨타임 -30%');
        reset();cast(s,true);m=null;step(240);ok(FX.length===0&&castLock<=0,id+': 대상 소멸 안전');
      }
      for(const [id,kind,count,total] of [['frostcut','spikes',3,39.5],['iceflower','petals',6,40.5]]){
        const c=comboOf(id),a=skOf(id),b=skOf(c.b);ok(c.keep&&c.keep.release===releaseIce,id+': 기존 keep 훅 사용');
        reset();cds[b.id]=30;cast(a);const kept=c.keep.get(),pieces=kept.pieces,refs=[...pieces];
        ok(pieces.length===count&&cds[b.id]===PRIME_CD,id+': 유지 개수/짝 준비');until(()=>castLock<=0);render();
        ok(c.keep.get()===kept&&pieces.every((p,i)=>p===refs[i]&&!p.used),id+': 시작 연출 뒤 같은 물체 유지');
        until(()=>gt-lastCast.t>=7.8);const cd=cds[id];gauge=0;ok(cast(b),id+': 8초 직전 수동 연계');
        ok(cds[id]===cd*.5&&gauge===20*ST.gg,id+': 연계 보상');until(()=>kept.claimed);const fin=FX.find(o=>o.kept===kept);
        ok(fin&&kept.pieces===pieces&&pieces.every((p,i)=>p===refs[i]),id+': 마무리에 원본 배열/객체 인계');
        ok(FX.filter(o=>o.iceKind===kind).length===1,id+': 유지 물체 중복 소환 금지');until(()=>pieces.some(p=>p.used));render();
        ok(pieces.some(p=>!p.used),id+': 한 번에 지우지 않고 순차 파괴/흡수');until(()=>kept.consumed);render();
        ok(pieces.every(p=>p.used)&&fin.hit&&stop>=.14&&S.combos===1,id+': 모든 원본 소모/한 번 발동/히트스톱');
        const tCombo=T.at(-1),tFin=T.at(-2);
        ok(tCombo&&tFin&&Math.abs(tCombo.x-tFin.x)>=50*U,id+': 마무리·연계 피해 숫자 분리 (거리 '+(tCombo&&tFin?Math.round(Math.abs(tCombo.x-tFin.x)/U):0)+'*U)');
        step(150);
        ok(!c.keep.get()&&FX.length===0&&castLock<=0,id+': 연계 종료 정리');
        reset();cast(a);const auto=c.keep.get();S.auto=true;until(()=>auto.claimed);S.auto=false;ok(auto.claimed&&S.combos===1,id+': 자동 연계 인계');
        reset();cast(a);const expired=c.keep.get();step(560);ok(!FX.includes(expired),id+': 8초 만료 정리');
        reset();cast(a);const interrupted=c.keep.get();until(()=>castLock<=0);cast(skOf('dash'));step(120);ok(interrupted.collapse&&!FX.includes(interrupted),id+': 다른 스킬로 중단');
        reset();S.best=a.unlock;cast(a);step(200);ok(!c.keep.get(),id+': 짝 미해금 시 소멸');
        reset();CH={mods:[DMODS.find(x=>x.id==='chain')]};cast(a);const long=c.keep.get();until(()=>gt-lastCast.t>=15.7);
        ok(c.keep.get()===long&&activeLink()?.left>0,id+': 도전 16초 동일 물체 유지');cast(b);until(()=>long.consumed);ok(long.consumed,id+': 16초 직전 연계');
        reset();cast(a);until(()=>castLock<=0);FX=[];cds[b.id]=0;cast(b);ok(!pendingCombo,id+': 소실 물체 인계 금지');
        reset();hits=[];let emitted=0,colors=[];const push=P.push;
        P.push=function(...args){emitted+=args.length;colors.push(...args.map(p=>p.color));return push.apply(this,args)};
        ok(previewCombo(c),id+': 시작부터 전체 시연');const demo=c.keep.get();step(350);
        ok(demo.claimed&&demo.consumed&&hits.every(h=>h.pm===.1),id+': 시연의 동일 물체/pm 인계');
        ok(Math.abs(hits.reduce((n,h)=>n+h.mult,0)-total)<1e-8&&hits.filter(h=>h.sid==='combo').length===1,id+': 시작+마무리+추가 16배 중복 없음');
        ok(hits.at(-1)?.name===c.name&&hits.at(-1)?.crack===2,id+': 연계 강타/균열 이름');
        ok(emitted<=100&&colors.every(col=>ICE_COL.includes(col)),id+': 전체 연계 입자 100개 이하/5색: '+emitted);delete P.push;
      }
      const a=AWK.find(a=>a.id==='frostcrown');ok(a.unlock===45&&a.name==='영원의 설관','빙정 각성기 배정');
      for(const [tr,lv] of [[0,0],[3,20]]){reset();S.lv.skill=lv;ST=stats();hits=[];S.awkSel=a.id;gauge=100;
        ok(castAwaken()&&gauge===0&&CUT.name===a.name,'설관 게이지 소비/컷인');step(300);
        ok(Math.abs(hits.reduce((n,h)=>n+h.mult,0)-(48+6*tr))<1e-8&&hits.every(h=>h.pm===1&&h.sid===a.id),'설관 TR '+tr+' 실전 피해');
        ok(hits.at(-1)?.heavy&&hits.at(-1)?.crack===2&&getFinisherInfo('skill',hits.at(-1)).kind==='각성기 결정타','설관 마지막 강타/각성 결정타');
      }
      reset();hits=[];let emitted=0,colors=[],maxDim=0;const push=P.push;
      P.push=function(...args){emitted+=args.length;colors.push(...args.map(p=>p.color));return push.apply(this,args)};
      previewAwk(a);const awkFX=FX.find(o=>o.frostcrown);
      ok(awkFX&&awkFX.dur>=2.5,'설관 연출 객체 생성 확인');
      for(let i=0;i<300;i++){update(1/60);maxDim=Math.max(maxDim,dimT)}
      ok(maxDim>=.5,'설관 화면 어두움 dimT 0.5 이상: '+maxDim.toFixed(2));
      ok(hits.every(h=>h.pm===.1)&&hits.length===7,'설관 시연 6연타+강타/pm');
      ok(emitted<=100&&colors.every(col=>ICE_COL.includes(col)),'설관 입자 100개 이하/5색: '+emitted);delete P.push;
      reset();a.fn(1);m=null;step(300);ok(FX.length===0&&castLock<=0,'설관 대상 소멸 안전');
    }finally{skillHit=hit;deal=damage;reset();m=null;buildBar()}
  });

  section('계열 A · 데이터 · 편성 · 저장 변환');
  guard('계열 A',()=>{
    const reset=()=>{S=fresh();S.auto=false;S.sound=false;ST=stats();CH=null;BI=null;BF=null;CUT=null;BN=null;FX=[];P=[];T=[];B=[];PR=[];C=[];relicQ=[];shieldOn=null;stop=0;slowT=0;castLock=0;frenzyT=0;circleT=0;gauge=0;lastCast=null;pendingCombo=null;spawnT=100;miniQ=0;h.stun=0;atkT=1e6;
      m=makeMonster(1);m.state='fight';m.x=monX;m.sh=0;m.hp=m.max=1e12;for(const s of SK)cds[s.id]=0};
    const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b),derived=()=>S.loadout.flatMap(id=>{const c=COMBOS.find(c=>c.a===id);return[c.a,c.b]});
    const mapping=[['crimson','진홍','#ff4f5e','inferno',['breath','demon']],['eclipse','월식','#9a7bff','dragon',['shadow','archers']],['verdant','녹광','#7dff5a',null,['orb','shield']],['abyss','심연','#b06bff','circle',['swords','gravity']],['storm','뇌전','#ffe853',null,['dash','spear']],['hellfire','업화','#ffa05a',null,['whip','hands']],['frost','빙정','#61dcf3','frostcrown',['frostcut','iceflower']]];
    const ring=[['crimson','hellfire','홍련작'],['hellfire','eclipse','그림자 왈츠'],['eclipse','abyss','칠흑'],['abyss','frost','절대영도'],['frost','storm','초전도'],['storm','verdant','질풍신'],['verdant','crimson','역린혈공']];
    try{
      ok(SCHOOLS.length===7&&new Set(SCHOOLS.map(s=>s.id)).size===7,'서로 다른 계열 7개');
      for(const [id,name,color,awk,pairs] of mapping){const s=SCHOOLS.find(s=>s.id===id),cs=COMBOS.filter(c=>c.school===id);
        ok(s?.name===name&&s.c===color&&s.awk===awk,id+': 계열 이름/색/전용 각성기');
        ok(cs.length===2&&pairs.every(a=>cs.some(c=>c.a===a))&&equal(s.pairs,cs.map(c=>c.a)),id+': 설계서 연계 2쌍');
        ok(awk===null||AWK.some(a=>a.id===awk),id+': 전용 각성기 존재');
      }
      for(const c of COMBOS)ok(SCHOOLS.filter(s=>s.id===c.school&&s.pairs.includes(c.a)).length===1,c.name+': 정확히 한 계열 소속');
      ok(!SCHOOLS.some(s=>s.awk==='thousand'),'천검멸은 기본 각성기로 유지');
      ok(RESONANCES.length===7&&new Set(RESONANCES.map(r=>r.id)).size===7,'공명 7개/고유 id');
      for(const [a,b,name] of ring)ok(RESONANCES.filter(r=>r.name===name&&r.a===a&&r.b===b).length===1,name+': 설계서 공명 연결');
      for(const s of SCHOOLS){const ns=RESONANCES.filter(r=>r.a===s.id||r.b===s.id).map(r=>r.a===s.id?r.b:r.a);ok(ns.length===2&&new Set(ns).size===2&&!ns.includes(s.id),s.name+': 서로 다른 공명 이웃 2개')}
      const reached=new Set([SCHOOLS[0].id]);for(let i=0;i<7;i++)for(const r of RESONANCES)if(reached.has(r.a)||reached.has(r.b)){reached.add(r.a);reached.add(r.b)}ok(reached.size===7,'공명 고리가 하나로 연결됨');
      reset();const original={best:72,gold:321,lv:{atk:7},relics:{coin:2},awk:{frostcut:'a'},codex:{'0_0':3},equip:['meteor','gravity','sniper','neon','wolf','frostcut']},copy=JSON.stringify(original);load(original);
      ok(equal(S.loadout,['gravity','shield','dash','archers']),'예전 장착 순서로 쌍 추정/중복 제거/앞 4쌍 유지');
      ok(equal(S.equip,derived())&&S.equip.length===8,'변환 후 equip에 각 쌍 두 스킬 보존');
      ok(S.gold===321&&S.lv.atk===7&&S.relics.coin===2&&S.awk.frostcut==='a'&&S.codex['0_0']===3,'기존 성장/유물/분기/도감 보존');ok(JSON.stringify(original)===copy,'저장 원본 객체를 변경하지 않음');
      load({best:72,equip:['wolf','missing','wolf']});ok(S.loadout[0]==='archers'&&S.loadout.length===4&&new Set(S.loadout).size===4,'부분 장착은 짝 보완, 빈칸은 중복 없이 추천');
      ok(equal(S.loadout,recommendLoadout(72,['archers'])),'추천으로 빈칸만 채우며 추정 쌍 고정');
      load({best:1,equip:['dash']});ok(equal(S.loadout,['dash'])&&equal(S.equip,['dash','neon']),'초반은 해금된 쌍 후보만 채우고 잠긴 짝 유지');
      load({best:72,equip:['invalid',null,7]});ok(equal(S.loadout,recommendLoadout(72)),'유효 장착이 없으면 추천 편성');
      load({best:72});ok(equal(S.loadout,recommendLoadout(72)),'장착 필드 없는 예전 저장도 추천');
      load({best:72,loadout:['iceflower','frostcut'],equip:['dash']});ok(equal(S.loadout,['iceflower','frostcut'])&&equal(S.equip,derived()),'새 저장은 loadout 우선, 의도적인 빈칸 유지');
      const saved=JSON.parse(JSON.stringify(S));load(saved);ok(equal(S.loadout,saved.loadout)&&equal(S.equip,saved.equip),'새 저장 왕복 시 편성 순서 유지');
      load({best:72,loadout:[],equip:['dash']});ok(S.loadout.length===0&&S.equip.length===0,'빈 편성을 추천으로 덮어쓰지 않음');
      load({best:72,loadout:['dash','dash','bad',null,'swords','breath','shadow','gravity']});ok(equal(S.loadout,['dash','swords','breath','shadow']),'손상된 편성의 중복/잘못된 id/초과 칸 정리');
      load({best:72,loadout:'broken',equip:['meteor']});ok(S.loadout[0]==='gravity'&&S.loadout.length===4,'배열 아닌 편성은 예전 장착에서 복원');
      reset();ok(equal(S.loadout,['dash'])&&equal(S.equip,derived())&&('mastery' in S)&&SCHOOLS.every(s=>S.mastery[s.id]===0),'새 게임 기본 쌍/파생 equip, 숙련 필드 초기화');
      const both=['frostcut','iceflower','dash','spear'];let state=schoolState(both,72);
      ok(equal(state.focus,['storm','frost'])&&equal(state.resonance,['frost_storm']),'빙정 2쌍+뇌전 2쌍: 집중 2/초전도');
      state=schoolState(both,71);ok(equal(state.focus,['storm'])&&state.counts.frost===1,'짝 하나 미해금이면 빙정 집중 꺼짐');
      state=schoolState(both,63);ok(state.counts.frost===0&&!state.resonance.includes('frost_storm'),'양쪽이 열린 쌍만 활성 집계');
      state=schoolState(['breath','demon','whip','shadow'],72);ok(equal(state.focus,['crimson'])&&equal(state.resonance,['crimson_hellfire','hellfire_eclipse']),'진홍 집중+업화/월식 공명');
      state=schoolState(['whip','shadow','swords','frostcut'],72);ok(state.focus.length===0&&state.resonance.length===3,'서로 다른 4계열 공명 사슬 3개');
      state=schoolState(['frostcut','frostcut'],72);ok(state.counts.frost===1&&!state.focus.length,'같은 쌍 중복은 집중으로 세지 않음');
      ok(schoolState([],72).resonance.length===0&&schoolState([],72).focus.length===0,'해제 후 집중/공명 모두 꺼짐');
      reset();S.best=72;const st=stats(),cw=comboWin();setLoadout(both);schoolState();ok(equal(stats(),st)&&comboWin()===cw,'A단계는 스탯/연계 창에 효과 수치를 적용하지 않음');
      // 독립 비트마스크 완전 탐색으로 추천의 전역 최댓값을 확인한다(그리기/전투 반복 없음).
      for(const best of [0,1,3,8,11,17,21,30,36,40,48,56,60,64,68,72,999]){
        const before=JSON.stringify(S),ids=recommendLoadout(best),eligible=COMBOS.filter(c=>[c.a,c.b].some(id=>skOf(id).unlock<=best)),n=Math.min(4,eligible.length);
        ok(ids.length===n&&new Set(ids).size===n&&ids.every(id=>eligible.some(c=>c.a===id)),'STAGE '+best+': 추천은 해금 상황에 맞는 쌍만');
        let maximum=-1;for(let mask=0;mask<(1<<eligible.length);mask++){let bits=mask,count=0;while(bits){bits&=bits-1;count++}if(count!==n)continue;
          const cs={};for(let j=0;j<eligible.length;j++)if(mask&(1<<j)){const c=eligible[j];if(skOf(c.a).unlock<=best&&skOf(c.b).unlock<=best)cs[c.school]=(cs[c.school]||0)+1}
          const score=Object.values(cs).filter(v=>v===2).length+ring.filter(([a,b])=>cs[a]>0&&cs[b]>0).length;maximum=Math.max(maximum,score)}
        const actual=schoolState(ids,best);ok(actual.focus.length+actual.resonance.length===maximum,'STAGE '+best+': 집중+공명 총수 전역 최댓값');
        ok(equal(ids,recommendLoadout(best))&&JSON.stringify(S)===before,'STAGE '+best+': 추천 결정성/상태 무변경');
      }
      reset();setLoadout([]);buildBar();buildBook();const row=id=>$('book').children[SK.findIndex(s=>s.id===id)];row('meteor').querySelector('.eq').click();
      ok(equal(S.loadout,['gravity'])&&equal(S.equip,['gravity','meteor']),'잠긴 마무리 버튼도 연계 쌍 전체 편성');ok(!cast(skOf('meteor')),'편성해도 잠긴 스킬은 시전 불가');
      row('gravity').querySelector('.eq').click();ok(S.loadout.length===0&&S.equip.length===0,'시작 스킬 버튼으로 쌍 전체 해제');
      setLoadout(['iceflower','frostcut','dash','spear']);buildBar();ok(equal(barOrder().map(s=>s.id),derived()),'스킬 바가 편성 칸 순서/시작→마무리 순서 유지');
      const full=JSON.stringify(S.loadout);ok(!toggleEquip('meteor')&&JSON.stringify(S.loadout)===full,'편성 4쌍 초과 금지');ok(!toggleEquip('invalid'),'없는 스킬 편성 거부');
      S.best=72;$('recommendBtn').click();ok(equal(S.loadout,recommendLoadout())&&equal(S.equip,derived()),'추천 버튼으로 편성/equip 동시 반영');
      ok($('slotTxt').textContent.includes('4/4쌍')&&$('skBar').querySelectorAll('.skill:not(.awk)').length===8,'편성 수/스킬 바 8칸 갱신');
      reset();S.stage=S.best=2;S.kills=KPS-1;kill();ok(S.best===3&&equal(S.loadout,['dash','swords'])&&equal(S.equip,derived()),'진행 중 새 스킬 해금도 쌍 단위 자동 편성');
      reset();S.stage=S.best=16;S.kills=KPS-1;kill();ok(S.best===17&&equal(S.loadout,['dash'])&&equal(S.equip,derived()),'편성한 잠긴 짝 해금 시 중복 칸 없음');
      reset();setLoadout(['dash','breath','gravity','frostcut']);S.stage=S.best=2;S.kills=KPS-1;kill();ok(!S.loadout.includes('swords')&&equal(S.equip,derived()),'빈칸 없는 해금은 기존 편성 보존');
    }finally{reset();m=null;buildBar();buildBook()}
  });

  section('계열 B · 카드 · 편성 · 효과 칩 · 해금 안내');
  guard('계열 UI',()=>{
    const reset=(best=72)=>{if($('pairPicker').open)$('pairPicker').close();S=fresh();S.best=best;S.auto=false;S.sound=false;S.gold=1e30;ST=stats();CH=null;BI=null;BF=null;CUT=null;BN=null;FX=[];P=[];T=[];B=[];PR=[];C=[];relicQ=[];shieldOn=null;stop=slowT=castLock=frenzyT=circleT=0;gauge=0;lastCast=pendingCombo=null;spawnT=100;miniQ=0;h.stun=0;atkT=1e6;
      m=makeMonster(1);m.state='fight';m.x=monX;m.sh=0;m.hp=m.max=1e12;for(const s of SK)cds[s.id]=0;schoolOpen=null;schoolSeenState=null;schoolNotices=[];buildBar();buildBook();uiTick()};
    const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b),row=id=>$('book').querySelector('[data-skill="'+id+'"]'),slot=i=>$('loadoutGrid').children[i];
    const shown=root=>[...root.querySelectorAll('[data-effect]')].map(e=>e.dataset.kind+':'+e.dataset.effect);
    try{
      reset(1);ok($('schoolCards').children.length===7,'계열 카드 7장');ok($('loadoutGrid').children.length===4,'항상 편성 4칸 표시');
      for(const s of SCHOOLS){const card=$('schoolCards').querySelector('[data-school="'+s.id+'"]'),skills=schoolSkills(s),icons=[...card.querySelectorAll('.school-skill')];
        ok(card.style.getPropertyValue('--c')===s.c&&card.querySelector('.school-heading b').textContent===s.name,s.name+': 카드 이름/색');
        ok(icons.length===4&&equal(icons.map(e=>e.dataset.skill),skills.map(sk=>sk.id)),s.name+': 스킬 아이콘 4개');
        ok(icons.every((e,i)=>e.classList.contains('locked')===!unlocked(skills[i])&&!!e.querySelector('.school-lock')===!unlocked(skills[i])),s.name+': 아이콘 잠금 표시');
        const a=AWK.find(a=>a.id===s.awk);ok(card.querySelector('.school-awakening').textContent.includes(a?a.name:'미정'),s.name+': 전용 각성기');
        const ns=RESONANCES.filter(r=>r.a===s.id||r.b===s.id).map(r=>SCHOOLS.find(n=>n.id===(r.a===s.id?r.b:r.a)).name);ok(ns.every(n=>card.querySelector('.school-neighbors').textContent.includes(n)),s.name+': 공명 이웃 이름 2개');
        $('school-toggle-'+s.id).click();const visible=[...$('book').children].filter(e=>!e.hidden);
        ok($('school-toggle-'+s.id).getAttribute('aria-expanded')==='true'&&!$('book').hidden&&$('book').parentElement.id==='school-body-'+s.id,s.name+': 카드 펼침');
        ok(visible.length===4&&visible.every(e=>e.dataset.school===s.id&&e.querySelector('.eq')&&e.querySelector('.pv')&&e.querySelector('small').textContent),s.name+': 기존 설명/편성/시연 행 재사용');
        $('school-toggle-'+s.id).click();ok($('book').hidden&&$('school-toggle-'+s.id).getAttribute('aria-expanded')==='false',s.name+': 다시 눌러 접기');
      }
      reset();$('school-toggle-frost').click();row('frostcut').querySelector('.awkbuy').click();ok(S.awk.frostcut==='a'&&schoolOpen==='frost','카드 안 스킬 각성 구매 후 펼침 유지');
      row('frostcut').querySelector('[data-br="b"]').click();ok(S.awk.frostcut==='b','카드 안 분기 변경');
      row('frostcut').querySelector('.pv').click();ok(FX.length>0&&castLock>0,'카드 안 실제 스킬 시연');
      reset();setLoadout([]);buildBar();buildBook();const ids=['frostcut','iceflower','dash','spear'];
      for(let i=0;i<4;i++){slot(i).click();ok($('pairPicker').open&&$('pairOptions').children.length===COMBOS.length,(i+1)+'번 빈칸: 전체 쌍 선택 창');
        ok([...$('pairOptions').children].every(b=>b.disabled===S.loadout.includes(b.dataset.pair)),(i+1)+'번: 이미 편성된 쌍 중복 선택 금지');
        $('pairOptions').querySelector('[data-pair="'+ids[i]+'"]').click();ok(!$('pairPicker').open&&S.loadout[i]===ids[i]&&slot(i).dataset.pair===ids[i],(i+1)+'번: 선택한 쌍 저장/칸 갱신')}
      ok(S.equip.length===8&&equal(barOrder().map(s=>s.id),S.equip),'편성 UI에서 스킬 바까지 반영');
      for(let i=3;i>=0;i--){slot(i).click();ok(S.loadout.length===i&&!slot(i).dataset.pair,(i+1)+'번: 편성된 칸 다시 눌러 해제')}
      slot(0).click();$('closePairPicker').click();ok(!$('pairPicker').open&&S.loadout.length===0,'선택 창 닫기는 편성을 변경하지 않음');
      reset(1);setLoadout([]);buildBar();slot(0).click();const locked=$('pairOptions').querySelector('[data-pair="iceflower"]');ok(locked.textContent.includes('72')&&!locked.disabled,'잠긴 연계도 해금 시각 안내 후 선택 가능');locked.click();ok(equal(S.loadout,['iceflower'])&&!cast(skOf('frostspiral')),'잠긴 쌍 편성은 해금/시전 조건을 바꾸지 않음');
      reset();for(const [ids,best] of [[[],72],[['frostcut','iceflower','dash','spear'],72],[['frostcut','iceflower','dash','spear'],71],[['frostcut','iceflower','dash','spear'],63],[['breath','demon','whip','shadow'],72],[['whip','shadow','swords','frostcut'],72]]){
        S.best=best;setLoadout(ids);buildBook();const state=schoolState(),expected=[...state.focus.map(id=>'focus:'+id),...state.resonance.map(id=>'resonance:'+id)];
        ok(equal(shown($('schoolEffects')),expected),'편성 칩은 schoolState 그대로: '+ids.join('/')+' @'+best);
        ok(equal(shown($('battleEffects')),expected)&&$('battleEffects').hidden===!expected.length,'전투 배지도 같은 상태/빈 상태 숨김');
        ok([...$('schoolEffects').querySelectorAll('.effect-chip')].every(e=>{const focus=e.dataset.kind==='focus',d=(focus?SCHOOLS:RESONANCES).find(d=>d.id===e.dataset.effect);const tr=focus?focusTier(d.id):0;return e.querySelector('span').textContent===(focus?'집중':'공명')+' · '+d.name&&e.querySelector('.effect-desc').textContent===(focus?tr+'단계 · '+FOCUS_FX[d.id].slice(0,tr).join(' · '):'')}),'칩: 활성 이름 + 집중은 켜진 단계 효과 설명(공명 설명은 D단계)');
      }
      S.best=63;setLoadout(['swords','frostcut']);buildBook();S.best=64;uiTick();ok(shown($('schoolEffects')).includes('resonance:abyss_frost'),'해금 순간 uiTick에서 공명 칩 자동 갱신');
      ok(!$('schoolCards').querySelector('[data-skill="icedragon"]').classList.contains('locked'),'해금 순간 카드 잠금 자동 갱신');
      $('recommendBtn').click();ok(equal(S.loadout,recommendLoadout())&&$('recommendBtn').closest('.formation'),'추천 버튼을 편성 영역으로 이동/동작 유지');
      for(const [before,after,text] of [[2,3,'새 계열: 심연'],[59,60,'새 계열: 빙정'],[71,72,'빙정 완성 · 집중 가능']]){reset(before);S.best=after;BN={text:'새 스킬 해금',t:0,dur:2};uiTick();ok(BN?.text===text,'계열 해금 배너: '+text);BN=null;uiTick();ok(!BN,'같은 해금을 반복 안내하지 않음')}
      reset(2);S.best=9;BN=null;uiTick();const notices=[BN.text];while(schoolNotices.length){BN=null;uiTick();notices.push(BN.text)}ok(equal(notices,['새 계열: 심연','새 계열: 진홍','새 계열: 월식','새 계열: 업화']),'여러 해금은 순서대로 안내');
      reset(72);ok(!BN&&schoolNotices.length===0,'이미 해금된 저장을 불러와도 배너 재생 없음');
      reset(59);S.stage=59;S.kills=KPS-1;kill();uiTick();ok(S.best===60&&BN?.text==='새 계열: 빙정','실제 몬스터 처치/해금 경로에서도 계열 배너 표시');
    }finally{reset();m=null;spawnT=100}
  });

  section('계열 C · 집중 효과 · 숙련');
  guard('계열 C',()=>{
    const reset=()=>{S=fresh();S.best=999;S.stage=72;S.auto=false;S.sound=false;ST=stats();CH=null;BI=null;BF=null;CUT=null;BN=null;FX=[];P=[];T=[];B=[];PR=[];C=[];relicQ=[];shieldOn=null;stop=0;slowT=0;castLock=0;frenzyT=0;circleT=0;gauge=0;lastCast=null;pendingCombo=null;spawnT=100;miniQ=0;h.stun=0;atkT=1e6;verdantCD=0;
      m=makeMonster(1);m.state='fight';m.x=monX;m.sh=0;m.hp=m.max=1e12;for(const s of SK)cds[s.id]=0};
    const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
    try{
      ok(Object.keys(FOCUS_FX).length===7&&SCHOOLS.every(s=>Array.isArray(FOCUS_FX[s.id])&&FOCUS_FX[s.id].length===3),'7계열 3단계 효과 설명 데이터 구비');
      reset();load({best:72,equip:['dash']});
      ok(S.mastery&&typeof S.mastery==='object'&&SCHOOLS.every(s=>S.mastery[s.id]===0),'숙련 필드 없는 옛 저장에 기본값(0) 병합');
      load({best:72,mastery:{crimson:12,frost:28}});
      ok(S.mastery.crimson===12&&S.mastery.frost===28&&S.mastery.storm===0,'저장된 숙련치 복원 및 누락 계열 0 병합');

      reset();const mBefore=JSON.stringify(S.mastery);showOffline(3600);
      ok(JSON.stringify(S.mastery)===mBefore,'오프라인 보상 정산 중 숙련치 불변');

      reset();S.mastery.crimson=20;Object.assign(S,{gold:0,stage:1,kills:0,maxStage:1,farm:false,farmKills:0,lv:freshLv()});
      ok(S.mastery.crimson===20,'환생 시에도 계열 숙련도 유지');

      for(const s of SCHOOLS){
        reset();setLoadout([]);
        ok(focusTier(s.id)===0,s.name+': 미편성 시 집중 꺼짐 (0단계)');
        setLoadout(s.pairs);
        ok(focusTier(s.id)===1,s.name+': 2쌍 편성 시 1단계 활성화');
        S.mastery[s.id]=9;ok(focusTier(s.id)===1,s.name+': 숙련 9는 여전히 1단계');
        S.mastery[s.id]=10;ok(focusTier(s.id)===2,s.name+': 숙련 10 도달 시 2단계 전환');
        S.mastery[s.id]=24;ok(focusTier(s.id)===2,s.name+': 숙련 24는 여전히 2단계');
        S.mastery[s.id]=25;ok(focusTier(s.id)===3,s.name+': 숙련 25 도달 시 3단계 전환');
        setLoadout([s.pairs[0]]);
        ok(focusTier(s.id)===0,s.name+': 1쌍만 편성 시 집중 꺼짐');
      }

      reset();setLoadout(['dash']);cds.dash=0;cds.neon=0;
      ok(S.mastery.storm===0,'뇌전 초기 숙련 0');
      cast(skOf('dash'));
      ok(S.mastery.storm===1,'시작 스킬 시전 시 그 계열 숙련 +1');
      castLock=0;cast(skOf('neon'));
      ok(S.mastery.storm===5,'마무리 스킬 시전(+1) 및 연계기 성공(+3)으로 숙련 +4 누적');
      const stPre=S.mastery.storm;previewCombo(COMBOS[0]);
      ok(S.mastery.storm===stPre,'시연 시에는 숙련도 증가 안 함');

      reset();
      const origRandom=Math.random;
      try{
        Math.random=()=>0.5;ST.cc=0;
        setLoadout(['dash']);let hpB=m.hp;skillHit(10,1,monX,groundY,{sid:'combo'});
        const baseDealt=hpB-m.hp;
        setLoadout(['breath','demon']);hpB=m.hp;skillHit(10,1,monX,groundY,{sid:'combo'});
        const boostedDealt=hpB-m.hp;
        ok(Math.abs(boostedDealt-baseDealt*1.3)<1e-4,'진홍 집중 1단계: 연계기 피해 +30%');

        S.awkSel='inferno';
        setLoadout(['dash']);hpB=m.hp;skillHit(20,1,monX,groundY,{sid:'inferno'});
        const awkBase=hpB-m.hp;
        setLoadout(['breath','demon']);hpB=m.hp;skillHit(20,1,monX,groundY,{sid:'inferno'});
        const awkBoosted=hpB-m.hp;
        ok(Math.abs(awkBoosted-awkBase*1.5)<1e-4,'진홍 집중 + 전용 각성기(염마 강림): 각성 위력 +50%');

        S.awkSel='thousand';hpB=m.hp;skillHit(20,1,monX,groundY,{sid:'thousand'});
        const thMult=hpB-m.hp;
        ok(Math.abs(thMult-awkBase)<1e-4,'기본 각성기(천검멸)는 계열 보너스 미적용');
      }finally{Math.random=origRandom;ST=stats()}

      reset();setLoadout(['dash']);const baseCdm=stats().cdm;
      setLoadout(['swords','gravity']);const abyssCdm=stats().cdm;
      ok(Math.abs(abyssCdm-baseCdm*.85)<1e-6,'심연 집중 1단계: 쿨타임 -15% (cdm)');

      reset();setLoadout(['dash']);ok(comboWin()===8,'일반 연계 창 8초');
      setLoadout(['shadow','archers']);ok(comboWin()===11,'월식 집중 1단계: 연계 창 11초 (+3초)');

      reset();setLoadout(['orb','shield']);
      ok(verdantCD===0,'녹광 방호 쿨타임 준비');
      const res1=resolveHit({ty:'slam',parry:false});
      ok(res1==='blocked'&&verdantCD===20&&h.stun===0,'녹광 집중 1단계: 보스 공격 자동 방호 성공 (쿨 20초)');
      const res2=resolveHit({ty:'slam',parry:false},1,false);
      ok(res2==='hit'&&h.stun>0,'방호 쿨타임 중 피격 정상 처리');
      reset();setLoadout(['orb','shield']);S.mastery.verdant=25;gauge=0;
      const hpBeforeRefl=m.hp;
      resolveHit({ty:'slam',parry:false});
      ok(hpBeforeRefl>m.hp,'녹광 2단계: 방호 시 반사 피해');
      ok(gauge>=15,'녹광 3단계: 방호 시 각성 게이지 +15');

      reset();setLoadout(['whip','hands']);m.vuln=2;
      const hp0=m.hp;deal(100,false,'hero',m.x,m.y);
      const hellDealt=hp0-m.hp;
      ok(Math.abs(hellDealt-100*1.3*1.3)<1e-4,'업화 집중 1단계: 속박 적에게 피해 추가 1.3배');

      reset();setLoadout(['frostcut','iceflower']);S.mastery.frost=10;m.freeze=3;
      const hp1=m.hp;deal(100,false,'hero',m.x,m.y);
      const frostDealt=hp1-m.hp;
      ok(Math.abs(frostDealt-100*1.2)<1e-4,'빙정 집중 2단계: 빙결 적 받는 피해 +20%');

      reset();setLoadout(['frostcut','iceflower']);S.mastery.frost=25;m.freeze=3;m.atkT=0;m.boss=true;
      startPat();
      ok(!m.pat&&m.freezeCancel,'빙정 집중 3단계: 빙결 중 적 패턴 1회 취소');
    }finally{reset();m=null;buildBar();buildBook()}
  });

  section('정리');
  guard('정리',()=>{tick(600);ok(FX.length===0,'연출이 끝나지 않고 남아 있음: '+FX.length+'개');ok(castLock<=0,'castLock이 풀리지 않음');ok(desat===0,'흑백(desat)이 풀리지 않고 남아 있음: '+desat)});

  const elapsedMs=performance.now()-startedAt,box=document.createElement('div');
  box.style.cssText='position:fixed;right:12px;top:12px;z-index:99;max-width:min(520px,92vw);max-height:80vh;overflow:auto;background:#0e0b1d;color:#f0ebff;border:2px solid '+(fail?'#ff4f5e':'#7cf29a')+';border-radius:12px;padding:14px;font:12px/1.6 "Noto Sans KR",sans-serif;white-space:pre-wrap';
  box.textContent=(fail?'자가 점검 실패':'자가 점검 통과')+` · 통과 ${pass} · 실패 ${fail} · ${(elapsedMs/1000).toFixed(1)}초\n`+lines.join('\n');
  document.body.appendChild(box);
  window.__selftest={pass,fail,lines,elapsedMs};console.log('[selftest]',pass,'pass',fail,'fail',(elapsedMs/1000).toFixed(1)+'s',lines.join('\n'));
})();
