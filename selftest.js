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

  section('정리');
  guard('정리',()=>{tick(600);ok(FX.length===0,'연출이 끝나지 않고 남아 있음: '+FX.length+'개');ok(castLock<=0,'castLock이 풀리지 않음')});

  const box=document.createElement('div');
  box.style.cssText='position:fixed;right:12px;top:12px;z-index:99;max-width:min(520px,92vw);max-height:80vh;overflow:auto;background:#0e0b1d;color:#f0ebff;border:2px solid '+(fail?'#ff4f5e':'#7cf29a')+';border-radius:12px;padding:14px;font:12px/1.6 "Noto Sans KR",sans-serif;white-space:pre-wrap';
  box.textContent=(fail?'자가 점검 실패':'자가 점검 통과')+` · 통과 ${pass} · 실패 ${fail}\n`+lines.join('\n');
  document.body.appendChild(box);
  window.__selftest={pass,fail,lines};console.log('[selftest]',pass,'pass',fail,'fail',lines.join('\n'));
})();
