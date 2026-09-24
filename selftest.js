'use strict';
/* 구조 자가 점검 — 주소 뒤에 ?selftest 를 붙이면 index.html이 이 파일을 불러온다.
   저장을 끄고 새 상태에서 모든 스킬·연계기·각성기·보스·도전을 실제로 돌려 본 뒤 결과를 화면에 띄운다.
   결과는 window.__selftest 에도 남는다: {pass, fail, lines}. 규칙은 AGENTS.md 참고. */
(()=>{
  const lines=[];let pass=0,fail=0;
  const ok=(cond,msg)=>{if(cond){pass++}else{fail++;lines.push('✗ '+msg)}};
  const section=name=>lines.push('— '+name);
  const tick=n=>{for(let i=0;i<n;i++){update(1/60);render()}};
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
      ok(cast(s,true),s.id+(b||'')+': 시연 실패');tick(s.buff?30:300)}
    S.awk={};
  });

  section('연계기');
  guard('연계기',()=>{for(const c of COMBOS){toFight();m.hp=m.max=1e15;castLock=0;ok(previewCombo(c),c.name+': 시연 실패');tick(300)}
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
    // 3쌍 120초 자동 전투: 기존 기준 14/15보다 낮아지면 실패한다.
    const originalCast=cast;let finish=0,linked=0;
    try{S.equip=['spear','thunder','archers','wolf','gravity','meteor'];buildBar();S.auto=true;
      cast=function(s,preview){const n=S.combos,result=originalCast(s,preview);if(result&&!preview&&COMBOS.some(c=>c.b===s.id)){finish++;if(pendingCombo||S.combos>n)linked++}return result};
      const startTime=gt;tick(7200);lines.push('자동 연계: '+linked+'/'+finish+' (히트스톱 포함 120초)');
      for(let i=0;i<7200&&gt-startTime<120;i++)tick(1);
      ok(finish>=15&&linked/finish>=14/15,'3쌍 전투 시간 120초 자동 연계 비율: '+linked+'/'+finish);lines.push('자동 연계: '+linked+'/'+finish+' (전투 시간 120초)');
    }finally{cast=originalCast;reset();S.equip=SK.slice(0,8).map(s=>s.id);buildBar()}
  });

  section('각성기');
  guard('각성기',()=>{for(const a of AWK){toFight();m.hp=m.max=1e15;castLock=0;ok(previewAwk(a),a.name+': 시연 실패');tick(360)}
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

  section('정리');
  guard('정리',()=>{tick(600);ok(FX.length===0,'연출이 끝나지 않고 남아 있음: '+FX.length+'개');ok(castLock<=0,'castLock이 풀리지 않음')});

  const box=document.createElement('div');
  box.style.cssText='position:fixed;right:12px;top:12px;z-index:99;max-width:min(520px,92vw);max-height:80vh;overflow:auto;background:#0e0b1d;color:#f0ebff;border:2px solid '+(fail?'#ff4f5e':'#7cf29a')+';border-radius:12px;padding:14px;font:12px/1.6 "Noto Sans KR",sans-serif;white-space:pre-wrap';
  box.textContent=(fail?'자가 점검 실패':'자가 점검 통과')+` · 통과 ${pass} · 실패 ${fail}\n`+lines.join('\n');
  document.body.appendChild(box);
  window.__selftest={pass,fail,lines};console.log('[selftest]',pass,'pass',fail,'fail',lines.join('\n'));
})();
