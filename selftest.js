'use strict';
/* 구조 자가 점검 — 주소 뒤에 ?selftest 를 붙이면 index.html이 이 파일을 불러온다.
   저장을 끄고 새 상태에서 모든 스킬·연계기·각성기·보스·도전을 실제로 돌려 본 뒤 결과를 화면에 띄운다.
   결과는 window.__selftest 에도 남는다: {pass, fail, lines, elapsedMs, timings, autoResults}. 규칙은 AGENTS.md 참고. */
(async()=>{
  const startedAt=performance.now(),lines=[];let pass=0,fail=0;
  const ok=(cond,msg)=>{if(cond){pass++}else{fail++;lines.push('✗ '+msg)}};
  const timings=[];let timedSection=null;
  const closeSection=()=>{if(timedSection){timedSection.ms=performance.now()-timedSection.start;timedSection.pass=pass-timedSection.pass;timedSection.fail=fail-timedSection.fail;timings.push(timedSection);timedSection=null}};
  const section=name=>{closeSection();timedSection={name,start:performance.now(),pass,fail};lines.push('— '+name)};
  // 속도를 위해 그리기는 4프레임마다(+마지막 프레임). 짧은 연출 구간(0.2초 이상)도 여러 번 그려진다.
  let frameNo=0;const tick=n=>{for(let i=0;i<n;i++){update(1/60);if(++frameNo%4===0||n>1&&i===n-1)render()}};
  // 연출이 모두 끝날 때까지만 진행한다(최대 n프레임). 끝까지 돌리므로 검사 범위는 같다.
  const settle=n=>{for(let i=0;i<n;i++){update(1/60);if(++frameNo%4===0)render();if(i>=30&&FX.length===0&&castLock<=0&&!pendingCombo)break}render()};
  const toFight=()=>{for(let k=0;k<120&&(!fighting()||castLock>0);k++){if(BI)skipBossIntro();tick(10)}};
  const guard=(name,fn)=>{try{fn()}catch(e){fail++;lines.push('✗ '+name+' 예외: '+e.message+' @ '+String(e.stack||'').split('\n')[1])}};
  const OB=b=>unlockFloorOf(b);                      // 옛 해금 기준 스테이지를 새 기준(해금 배치 v2)으로 옮겨 검사 의미를 그대로 유지한다

  // 변경 전 구현을 기준 답안으로 보존한다. 최적화 코드와 공유하지 않는다.
function referenceLoadout(best=ub(),keep=[]){
  const fixed=cleanLoadout(keep),pool=COMBOS.filter(c=>!fixed.includes(c.a)&&[c.a,c.b].some(id=>skOf(id).unlock<=best)),n=Math.min(4-fixed.length,pool.length);
  let result=fixed,bestScore=[-1,-1,-1];
  const visit=(i,picked)=>{if(picked.length===n){const ids=fixed.concat(picked),st=schoolState(ids,best),skills=ids.map(id=>COMBOS.find(c=>c.a===id)).flatMap(c=>[c.a,c.b]);
      const score=[st.focus.length+st.resonance.length,Object.values(st.counts).reduce((n,v)=>n+v,0),skills.filter(id=>skOf(id).unlock<=best).length];
      // 동률이면 완전히 열린 쌍, 열린 스킬 수, 마지막으로 COMBOS의 고정 순서로 결정한다.
      const diff=score.findIndex((v,j)=>v!==bestScore[j]);if(diff>=0&&score[diff]>bestScore[diff]){bestScore=score;result=ids}return}
    for(let j=i;j<=pool.length-(n-picked.length);j++)visit(j+1,picked.concat(pool[j].a))};
  visit(0,[]);return result;
}

  const schoolFixture=[
    ['crimson','진홍','#ff4f5e','inferno',['breath','demon']],['eclipse','월식','#9a7bff','dragon',['shadow','archers']],
    ['verdant','녹광','#7dff5a','celestial',['orb','shield']],['abyss','심연','#b06bff','circle',['swords','gravity']],
    ['storm','뇌전','#ffe853','judgment',['dash','spear']],['hellfire','업화','#ffa05a','hellking',['whip','hands']],
    ['frost','빙정','#61dcf3','frostcrown',['frostcut','iceflower']],['ink','음양검결','#D9DFE5','yinyangsky',['twinstroke','inkrain']],
    ['wuji','무극도법','#D9DFE5','wuji_return',['ink_gate','talisman']],['spirit','묵령현신','#D9DFE5','ascension',['koi','turtle']]
  ];
  const resonanceFixture=[['crimson','hellfire','홍련작'],['hellfire','eclipse','그림자 왈츠'],['eclipse','abyss','칠흑'],['abyss','frost','절대영도'],['frost','storm','초전도'],['storm','verdant','질풍신'],['verdant','crimson','역린혈공'],['eclipse','ink','묵월'],['abyss','ink','현묵'],['ink','wuji','태허도검'],['verdant','wuji','생무극'],['frost','spirit','빙령유영'],['crimson','spirit','혈호포효']];
  const expectedNeighbors=id=>resonanceFixture.filter(([a,b])=>a===id||b===id).map(([a,b])=>a===id?b:a);
  // 기존 전수 검사와 동일한 n개 선택만 순회한다. 비트 연산 없이 32쌍 이상도 검사한다.
  function* choiceIndices(total,n){if(!n){yield [];return}const picked=Array.from({length:n},(_,i)=>i);while(true){yield picked.slice();let i=n-1;while(i>=0&&picked[i]===total-n+i)i--;if(i<0)return;picked[i]++;for(let j=i+1;j<n;j++)picked[j]=picked[j-1]+1}}
  const testReset=()=>{S=fresh();S.best=999;S.auto=false;S.sound=false;ST=stats();CH=BI=BF=CUT=BN=null;FX=[];P=[];T=[];B=[];PR=[];C=[];relicQ=[];shieldOn=null;stop=slowT=castLock=frenzyT=circleT=desat=0;gauge=0;lastCast=pendingCombo=null;spawnT=100;miniQ=0;h.stun=0;atkT=1e6;verdantCD=bloodBuffT=0;
    m=makeMonster(1);m.state='fight';m.x=monX;m.sh=0;m.hp=m.max=1e12;for(const s of SK)cds[s.id]=0};
  const checkUnlock=(sk,reset)=>{reset();S.best=sk.unlock-1;ok(!unlocked(sk),sk.id+': 바로 전 스테이지 잠금');S.unlockFloor=sk.unlock;ok(unlocked(sk),sk.id+': ub 해금 바닥값 적용')};
  const checkNeighbors=s=>{const ns=RESONANCES.filter(r=>r.a===s.id||r.b===s.id).map(r=>r.a===s.id?r.b:r.a),expected=expectedNeighbors(s.id);ok(ns.length===expected.length&&new Set(ns).size===expected.length&&!ns.includes(s.id)&&expected.every(id=>ns.includes(id)),s.name+': 설계서의 정확한 공명 이웃 '+expected.length+'개')};
  const checkSchoolSkills=(data,palette,previous,reset,step,clear,read)=>{
      for(const [id,unlock,cd,base,slope,ice,iceSlope,iceCD] of data){const s=skOf(id);ok(s.unlock===unlock&&s.cd===cd,id+': 설계서 해금/쿨타임');
        ok((IC[id].match(/#[0-9a-f]{6}/gi)||[]).every(c=>palette.includes(c)),id+': 금색 없는 수묵 아이콘');
        checkUnlock(s,reset);
        for(const [tr,lv] of [[0,0],[1,5],[2,10],[3,20]])for(const b of [null,'a','b']){
          reset();S.lv.skill=lv;if(b)S.awk[id]=b;ST=stats();ST.cc=0;clear();cast(s,true);step(250);const {hits,dealt}=read();
          const total=base+slope*tr,expected=ST.atk*ST.sk*total*.1*(b==='a'?1.4:1);
          ok(Math.abs(hits.reduce((n,h)=>n+h.mult,0)-total)<1e-8&&hits.every(h=>h.pm===.1&&h.sid===id),id+': TR '+tr+' 분기 '+b+' 피해/pm/id');
          ok(dealt>=expected*.9&&dealt<=expected*1.1&&hits.at(-1)?.heavy&&hits.at(-1)?.name===s.name,id+': TR '+tr+' 분기 '+b+' 실제 피해/강타');
          ok(total/cd<=(ice+iceSlope*tr)/iceCD,id+': TR '+tr+' 분기 '+b+' '+previous+' 초당 배율 이하');
        }
        reset();S.awk[id]='b';cast(s);ok(Math.abs(cds[id]-s.cd*ST.cdm*.7)<1e-9,id+': B 분기 쿨타임 -30%');
        reset();s.fn(.1);let frames=0,gray=true;for(let i=0;i<60;i++){const frozen=stop>0;desat=0;update(1/60);if(!frozen&&FX.some(o=>o.inkSchool)){frames++;gray=gray&&desat===1}}ok(frames>20&&gray,id+': 모든 월드 프레임 흑백 갱신')
        m=null;step(300);ok(FX.length===0&&castLock<=0&&desat===0,id+': 대상 소멸/흑백/잠금 종료');
      }
  };
  const autoResults=[];
  const checkAuto=(reset,setup,label,speed,limit=18000,separate=false)=>{const originalCast=cast;let finish=0,linked=0;reset();setup();S.speed=speed;S.auto=true;
    try{cast=function(sk,preview){const n=S.combos,result=originalCast(sk,preview);if(result&&!preview&&COMBOS.some(c=>c.b===sk.id)){finish++;if(pendingCombo||S.combos>n)linked++}return result};
      const start=gt;for(let i=0;i<limit&&gt-start<120;i++)update(1/60);
      if(separate){ok(gt-start>=120,label+': 120 게임초 도달');ok(finish>=15&&linked/finish>=14/15,label+': 자동 연계 14/15 '+linked+'/'+finish)}
      else ok(gt-start>=120&&finish>=15&&linked/finish>=14/15,label+': 120초 자동 연계 14/15 '+linked+'/'+finish);
      autoResults.push({label,speed,finish,linked});lines.push(label+': '+linked+'/'+finish);
    }finally{cast=originalCast;reset()}
  };

  const persistForAudio=save;
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
    // 화염 채찍(whip) 피해 총합 및 타수 검증: (1.2+0.1*TR)*2 + (3.5+0.5*TR) = 5.9+0.7*TR
    const hitW=skillHit;let whipHits=[];
    try{
      skillHit=function(mult,pm,x,y,o){whipHits.push({mult,pm,...o});return hitW(mult,pm,x,y,o)};
      for(const lv of [0,5,20]){
        toFight();m.hp=m.max=1e15;castLock=0;frenzyT=0;S.lv.skill=lv;const tr=tier();whipHits=[];
        cast(skOf('whip'),true);settle(140);
        const expected=5.9+0.7*tr;
        const totalMult=whipHits.reduce((n,h)=>n+h.mult,0);
        ok(whipHits.length===3&&Math.abs(totalMult-expected)<1e-8&&whipHits.every(h=>h.pm===.1&&h.sid==='whip'),'화염 채찍 Lv'+lv+': 3타 피해 총합 '+(expected.toFixed(1))+'배(TR='+tr+') / pm=0.1 / sid');
        ok(whipHits.at(-1)?.heavy&&whipHits.at(-1)?.name==='화염 채찍','화염 채찍 마지막 강타 라벨');
      }
    }finally{skillHit=hitW;S.lv.skill=0}
    // 그림자 분신(shadow) 피해 총합 및 타수 검증: 2.0 * N + 3.6 (기본 9.6배)
    const hitS=skillHit;let shadowHits=[];
    try{
      skillHit=function(mult,pm,x,y,o){shadowHits.push({mult,pm,...o});return hitS(mult,pm,x,y,o)};
      toFight();m.hp=m.max=1e15;castLock=0;frenzyT=0;S.lv.skill=0;shadowHits=[];
      cast(skOf('shadow'),true);settle(120);
      const expected=2*3+3.6;
      const totalMult=shadowHits.reduce((n,h)=>n+h.mult,0);
      ok(shadowHits.length===4&&Math.abs(totalMult-expected)<1e-8&&shadowHits.every(h=>h.pm===.1&&h.sid==='shadow')&&shadowHits.at(-1)?.heavy&&shadowHits.at(-1)?.name==='그림자 분신','그림자 분신: 4타 피해 총합 '+(expected.toFixed(1))+'배(2x3+3.6) / pm=0.1 / sid / 강타 라벨');
    }finally{skillHit=hitS;S.lv.skill=0}
    // 진홍 대포(cannon) 피해 총합 검증: (6 + TR * 1.2) = 6.0배 (기본)
    const hitC=skillHit;let cannonHits=[];
    try{
      skillHit=function(mult,pm,x,y,o){cannonHits.push({mult,pm,...o});return hitC(mult,pm,x,y,o)};
      toFight();m.hp=m.max=1e15;castLock=0;frenzyT=0;S.lv.skill=0;cannonHits=[];
      cast(skOf('cannon'),true);settle(100);
      const expected=6.0;
      const totalMult=cannonHits.reduce((n,h)=>n+h.mult,0);
      ok(cannonHits.length===1&&Math.abs(totalMult-expected)<1e-8&&cannonHits.every(h=>h.pm===.1&&h.sid==='cannon')&&cannonHits[0]?.heavy&&cannonHits[0]?.name==='진홍 포격','진홍 대포: 1타 피해 총합 '+(expected.toFixed(1))+'배 / pm=0.1 / sid / 강타 라벨');
    }finally{skillHit=hitC;S.lv.skill=0}
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
    ok(ta.unlock===128&&tb.unlock===136,'뇌창/천뢰 해금 스테이지');ok(ta.cd===18&&tb.cd===24,'뇌창/천뢰 기본 쿨타임');
    reset();cds.thunder=30;ok(cast(ta),'뇌창 투척 실전 시전');const sp=thunderSpear();
    ok(cds.thunder===PRIME_CD,'뇌창 투척 연계 준비 쿨타임');ok(activeLink()?.c===tc,'뇌신 강림 연계 창');
    until(()=>castLock<=0);ok(thunderSpear()===sp&&FX.includes(sp),'시작 연출 종료 후 박힌 창 유지');ok(!sp.collapse,'연계 대기 중 창 붕괴 금지');
    until(()=>gt-lastCast.t>=7.8);cds.thunder=0;gauge=0;const cd=cds.spear;
    ok(cast(tb),'8초 직전 수동 천뢰 연계');ok(pendingCombo===tc,'뇌신 강림 예약');ok(Math.abs(cds.spear-cd*.5)<1e-9,'시작 스킬 쿨타임 절반 보상');ok(gauge===BAL.comboGauge*ST.gg,'각성 게이지 연계 보상');
    until(()=>sp.claimed);const god=FX.find(o=>o.spear===sp);ok(god?.spear===sp,'뇌신 강림이 박힌 동일 창 인계');
    ok(FX.filter(o=>o.thunderSpear).length===1,'창 중복 소환 금지');
    until(()=>sp.consumed);ok(sp.consumed&&stop>=.16,'번개 폭풍 적중 시 창 소모와 히트스톱');ok(S.combos===1,'뇌신 강림 발동 횟수');tick(200);ok(!thunderSpear()&&castLock<=0,'뇌신 강림 종료 정리');
    reset();cast(ta);const autoSp=thunderSpear();cds.thunder=PRIME_CD;S.auto=true;until(()=>autoSp.claimed);S.auto=false;
    ok(autoSp.claimed&&S.combos===1,'자동 뇌신 강림 창 인계');
    reset();cast(ta);const expired=thunderSpear();tick(550);ok(!FX.includes(expired),'8초 만료 시 창 전기를 잃고 붕괴/제거');
    reset();cast(ta);until(()=>castLock<=0);cast(skOf('dash'));tick(40);ok(!thunderSpear(),'다른 스킬로 연계 중단 시 창 정리');
    reset();S.best=ta.unlock;cast(ta);tick(160);ok(!thunderSpear(),'천뢰 미해금 시 창 붕괴');
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
    ok(ga.unlock===144&&gb.unlock===152,'중력/운석 해금 스테이지');ok(ga.cd===20&&gb.cd===26,'중력/운석 기본 쿨타임');
    reset();cds.meteor=30;ok(cast(ga),'중력 구속 실전 시전');const well=gravityWell(),pos=gravityPoint(well);
    ok(cds.meteor===PRIME_CD,'중력 구속 연계 준비 쿨타임');ok(activeLink()?.c===gc,'천붕 연계 창');
    until(()=>well.t>=1.4);ok(m.sq>.2&&m.ly>0,'중력 구속의 찌그러짐/지면 침하');
    until(()=>castLock<=0);ok(gravityWell()===well&&FX.includes(well),'시작 연출 종료 후 동일 구체 유지');ok(!well.collapse,'연계 대기 중 구체 붕괴 금지');
    until(()=>gt-lastCast.t>=7.8);cds.meteor=0;gauge=0;const cd=cds.gravity;
    ok(cast(gb),'8초 직전 수동 운석 연계');ok(pendingCombo===gc,'천붕 예약');ok(Math.abs(cds.gravity-cd*.5)<1e-9,'시작 스킬 쿨타임 절반 보상');ok(gauge===BAL.comboGauge*ST.gg,'각성 게이지 연계 보상');
    until(()=>well.claimed);const flight=FX.find(o=>o.meteorFlight);ok(flight?.well===well,'운석이 시작 스킬의 동일 구체 인계');
    ok(FX.filter(o=>o.gravityWell).length===1&&FX.filter(o=>o.meteorFlight).length===1,'구체/운석 중복 소환 금지');
    ok(gravityPoint(well).x===pos.x&&gravityPoint(well).y===pos.y,'연계 인계 시 구체 좌표 연속성');
    until(()=>flight.hit);ok(well.consumed&&stop>=.14,'충돌 시 구체 소모와 히트스톱');ok(S.combos===1,'천붕 발동 횟수');tick(200);ok(!gravityWell()&&castLock<=0,'천붕 종료 정리');
    reset();cast(ga);const autoWell=gravityWell();cds.meteor=PRIME_CD;S.auto=true;until(()=>autoWell.claimed);S.auto=false;
    ok(autoWell.claimed&&S.combos===1,'실제 잠금/쿨타임을 기다린 자동 천붕');ok(FX.find(o=>o.meteorFlight)?.well===autoWell,'자동 천붕의 구체 연속성');
    reset();cast(ga);const expired=gravityWell();tick(550);ok(!FX.includes(expired),'8초 만료 시 구체 붕괴/제거');
    cds.meteor=0;cast(gb);ok(!pendingCombo&&!FX.find(o=>o.meteorFlight)?.well,'시간 만료 후 운석 단독 발동');
    reset();cast(ga);until(()=>castLock<=0);cast(skOf('dash'));tick(40);ok(!gravityWell(),'다른 스킬로 연계 중단 시 구체 정리');
    reset();S.best=ga.unlock;cast(ga);tick(160);ok(!gravityWell(),'운석 미해금 시 구체 붕괴');
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
    checkAuto(reset,()=>{S.equip=['spear','thunder','archers','wolf','gravity','meteor'];buildBar()},'기존 3쌍 1배',1,14400,true);
    S.equip=SK.slice(0,8).map(s=>s.id);buildBar();
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
    const data=[['frostcut',160,22,9.5,1.2],['icedragon',170,28,14,1.9],['iceflower',180,24,10,1.2],['frostspiral',190,30,14.5,1.9]];
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
        ok(cds[id]===cd*.5&&gauge===BAL.comboGauge*ST.gg,id+': 연계 보상');until(()=>kept.claimed);const fin=FX.find(o=>o.kept===kept);
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
      const a=AWK.find(a=>a.id==='frostcrown');ok(a.unlock===130&&a.name==='영원의 설관','빙정 각성기 배정');
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
    const mapping=schoolFixture,ring=resonanceFixture;
    try{
      ok(SCHOOLS.length===schoolFixture.length&&new Set(SCHOOLS.map(s=>s.id)).size===schoolFixture.length,'서로 다른 계열 10개');
      for(const [id,name,color,awk,pairs] of mapping){const s=SCHOOLS.find(s=>s.id===id),cs=COMBOS.filter(c=>c.school===id);
        ok(s?.name===name&&s.c===color&&s.awk===awk,id+': 계열 이름/색/전용 각성기');
        ok(cs.length===2&&pairs.every(a=>cs.some(c=>c.a===a))&&equal(s.pairs,cs.map(c=>c.a)),id+': 설계서 연계 2쌍');
        ok(awk===null||AWK.some(a=>a.id===awk),id+': 전용 각성기 존재');
      }
      for(const c of COMBOS)ok(SCHOOLS.filter(s=>s.id===c.school&&s.pairs.includes(c.a)).length===1,c.name+': 정확히 한 계열 소속');
      ok(!SCHOOLS.some(s=>s.awk==='thousand'),'천검멸은 기본 각성기로 유지');
      ok(RESONANCES.length===resonanceFixture.length&&new Set(RESONANCES.map(r=>r.id)).size===resonanceFixture.length,'공명 13개/고유 id');
      for(const [a,b,name] of ring)ok(RESONANCES.filter(r=>r.name===name&&r.a===a&&r.b===b).length===1,name+': 설계서 공명 연결');
      for(const s of SCHOOLS)checkNeighbors(s);
      const reached=new Set([SCHOOLS[0].id]);for(let i=0;i<schoolFixture.length;i++)for(const r of RESONANCES)if(reached.has(r.a)||reached.has(r.b)){reached.add(r.a);reached.add(r.b)}ok(reached.size===schoolFixture.length,'기존 연결과 묵령현신이 하나로 연결됨');
      reset();const original={best:72,gold:321,lv:{atk:7},relics:{coin:2},awk:{frostcut:'a'},codex:{'0_0':3},equip:['meteor','gravity','sniper','neon','wolf','frostcut']},copy=JSON.stringify(original);load(original);
      ok(equal(S.loadout,['gravity','shield','dash','archers']),'예전 장착 순서로 쌍 추정/중복 제거/앞 4쌍 유지');
      ok(equal(S.equip,derived())&&S.equip.length===8,'변환 후 equip에 각 쌍 두 스킬 보존');
      ok(S.gold===321&&S.lv.atk===7&&S.relics.coin===2&&S.awk.frostcut==='a'&&S.codex['0_0']===3,'기존 성장/유물/분기/도감 보존');ok(JSON.stringify(original)===copy,'저장 원본 객체를 변경하지 않음');
      load({best:72,equip:['wolf','missing','wolf']});ok(S.loadout[0]==='archers'&&S.loadout.length===4&&new Set(S.loadout).size===4,'부분 장착은 짝 보완, 빈칸은 중복 없이 추천');
      ok(equal(S.loadout,recommendLoadout(OB(72),['archers'])),'추천으로 빈칸만 채우며 추정 쌍 고정');
      load({best:1,equip:['dash']});ok(equal(S.loadout,['dash'])&&equal(S.equip,['dash','neon']),'초반은 해금된 쌍 후보만 채우고 잠긴 짝 유지');
      load({best:72,equip:['invalid',null,7]});ok(equal(S.loadout,recommendLoadout(OB(72))),'유효 장착이 없으면 추천 편성');
      load({best:72});ok(equal(S.loadout,recommendLoadout(OB(72))),'장착 필드 없는 예전 저장도 추천');
      load({best:72,loadout:['iceflower','frostcut'],equip:['dash']});ok(equal(S.loadout,['iceflower','frostcut'])&&equal(S.equip,derived()),'새 저장은 loadout 우선, 의도적인 빈칸 유지');
      const saved=JSON.parse(JSON.stringify(S));load(saved);ok(equal(S.loadout,saved.loadout)&&equal(S.equip,saved.equip),'새 저장 왕복 시 편성 순서 유지');
      load({best:72,loadout:[],equip:['dash']});ok(S.loadout.length===0&&S.equip.length===0,'빈 편성을 추천으로 덮어쓰지 않음');
      load({best:72,loadout:['dash','dash','bad',null,'swords','breath','shadow','gravity']});ok(equal(S.loadout,['dash','swords','breath','shadow']),'손상된 편성의 중복/잘못된 id/초과 칸 정리');
      load({best:72,loadout:'broken',equip:['meteor']});ok(S.loadout[0]==='gravity'&&S.loadout.length===4,'배열 아닌 편성은 예전 장착에서 복원');
      reset();ok(equal(S.loadout,['dash'])&&equal(S.equip,derived())&&('mastery' in S)&&SCHOOLS.every(s=>S.mastery[s.id]===0),'새 게임 기본 쌍/파생 equip, 숙련 필드 초기화');
      const both=['frostcut','iceflower','dash','spear'];let state=schoolState(both,OB(72));
      ok(equal(state.focus,['storm','frost'])&&equal(state.resonance,['frost_storm']),'빙정 2쌍+뇌전 2쌍: 집중 2/초전도');
      state=schoolState(both,OB(71));ok(equal(state.focus,['storm'])&&state.counts.frost===1,'짝 하나 미해금이면 빙정 집중 꺼짐');
      state=schoolState(both,OB(63));ok(state.counts.frost===0&&!state.resonance.includes('frost_storm'),'양쪽이 열린 쌍만 활성 집계');
      state=schoolState(['breath','demon','whip','shadow'],OB(72));ok(equal(state.focus,['crimson'])&&equal(state.resonance,['crimson_hellfire','hellfire_eclipse']),'진홍 집중+업화/월식 공명');
      state=schoolState(['whip','shadow','swords','frostcut'],OB(72));ok(state.focus.length===0&&state.resonance.length===3,'서로 다른 4계열 공명 사슬 3개');
      state=schoolState(['frostcut','frostcut'],OB(72));ok(state.counts.frost===1&&!state.focus.length,'같은 쌍 중복은 집중으로 세지 않음');
      ok(schoolState([],OB(72)).resonance.length===0&&schoolState([],OB(72)).focus.length===0,'해제 후 집중/공명 모두 꺼짐');
      reset();S.best=OB(72);const st=stats(),cw=comboWin();setLoadout(both);schoolState();ok(equal(stats(),st)&&comboWin()===cw,'A단계는 스탯/연계 창에 효과 수치를 적용하지 않음');
      // 독립 비트마스크 완전 탐색으로 추천의 전역 최댓값을 확인한다(그리기/전투 반복 없음).
      for(const best of [...[0,1,3,8,11,17,21,30,36,40,48,56,60,64,68,72,999].map(OB),199,200,205,209,210,219,220,229,230,239,240,249,250,255,259,260,269,270,279,280,289,290,295,299,300,309,310]){
        const before=JSON.stringify(S),ids=recommendLoadout(best),eligible=COMBOS.filter(c=>[c.a,c.b].some(id=>skOf(id).unlock<=best)),n=Math.min(4,eligible.length);
        ok(ids.length===n&&new Set(ids).size===n&&ids.every(id=>eligible.some(c=>c.a===id)),'STAGE '+best+': 추천은 해금 상황에 맞는 쌍만');
        let maximum=-1;for(const picked of choiceIndices(eligible.length,n)){
          const cs={};for(const j of picked){const c=eligible[j];if(skOf(c.a).unlock<=best&&skOf(c.b).unlock<=best)cs[c.school]=(cs[c.school]||0)+1}
          const score=Object.values(cs).filter(v=>v===2).length+ring.filter(([a,b])=>cs[a]>0&&cs[b]>0).length;maximum=Math.max(maximum,score)}
        const actual=schoolState(ids,best);ok(actual.focus.length+actual.resonance.length===maximum,'STAGE '+best+': 집중+공명 총수 전역 최댓값');
        ok(equal(ids,recommendLoadout(best))&&JSON.stringify(S)===before,'STAGE '+best+': 추천 결정성/상태 무변경');
      }
      reset();setLoadout([]);buildBar();buildBook();const row=id=>$('book').children[SK.findIndex(s=>s.id===id)];row('meteor').querySelector('.eq').click();
      ok(equal(S.loadout,['gravity'])&&equal(S.equip,['gravity','meteor']),'잠긴 마무리 버튼도 연계 쌍 전체 편성');ok(!cast(skOf('meteor')),'편성해도 잠긴 스킬은 시전 불가');
      row('gravity').querySelector('.eq').click();ok(S.loadout.length===0&&S.equip.length===0,'시작 스킬 버튼으로 쌍 전체 해제');
      setLoadout(['iceflower','frostcut','dash','spear']);buildBar();ok(equal(barOrder().map(s=>s.id),derived()),'스킬 바가 편성 칸 순서/시작→마무리 순서 유지');
      const full=JSON.stringify(S.loadout);ok(!toggleEquip('meteor')&&JSON.stringify(S.loadout)===full,'편성 4쌍 초과 금지');ok(!toggleEquip('invalid'),'없는 스킬 편성 거부');
      S.best=OB(72);$('recommendBtn').click();ok(equal(S.loadout,recommendLoadout())&&equal(S.equip,derived()),'추천 버튼으로 편성/equip 동시 반영');
      ok($('slotTxt').textContent.includes('4/4쌍')&&$('skBar').querySelectorAll('.skill:not(.awk)').length===8,'편성 수/스킬 바 8칸 갱신');
      reset();S.stage=S.best=skOf('swords').unlock-1;S.kills=KPS-1;kill();ok(S.best===skOf('swords').unlock&&equal(S.loadout,['dash','swords'])&&equal(S.equip,derived()),'진행 중 새 스킬 해금도 쌍 단위 자동 편성');
      reset();S.stage=S.best=skOf('neon').unlock-1;S.kills=KPS-1;kill();ok(S.best===skOf('neon').unlock&&equal(S.loadout,['dash'])&&equal(S.equip,derived()),'편성한 잠긴 짝 해금 시 중복 칸 없음');
      reset();setLoadout(['dash','breath','gravity','frostcut']);S.stage=S.best=skOf('swords').unlock-1;S.kills=KPS-1;kill();ok(!S.loadout.includes('swords')&&equal(S.equip,derived()),'빈칸 없는 해금은 기존 편성 보존');
    }finally{reset();m=null;buildBar();buildBook()}
  });

  section('계열 B · 카드 · 편성 · 효과 칩 · 해금 안내');
  guard('계열 UI',()=>{
    const reset=(best=OB(72))=>{if($('pairPicker').open)$('pairPicker').close();S=fresh();S.best=best;S.auto=false;S.sound=false;S.gold=1e30;ST=stats();CH=null;BI=null;BF=null;CUT=null;BN=null;FX=[];P=[];T=[];B=[];PR=[];C=[];relicQ=[];shieldOn=null;stop=slowT=castLock=frenzyT=circleT=0;gauge=0;lastCast=pendingCombo=null;spawnT=100;miniQ=0;h.stun=0;atkT=1e6;
      m=makeMonster(1);m.state='fight';m.x=monX;m.sh=0;m.hp=m.max=1e12;for(const s of SK)cds[s.id]=0;schoolOpen=null;schoolSeenState=null;schoolNotices=[];buildBar();buildBook();uiTick()};
    const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b),row=id=>$('book').querySelector('[data-skill="'+id+'"]'),slot=i=>$('loadoutGrid').children[i];
    const shown=root=>[...root.querySelectorAll('[data-effect]')].map(e=>e.dataset.kind+':'+e.dataset.effect);
    try{
      reset(1);ok($('schoolCards').children.length===schoolFixture.length,'계열 카드 10장');ok($('loadoutGrid').children.length===4,'항상 편성 4칸 표시');
      for(const s of SCHOOLS){const card=$('schoolCards').querySelector('[data-school="'+s.id+'"]'),skills=schoolSkills(s),icons=[...card.querySelectorAll('.school-skill')];
        ok(card.style.getPropertyValue('--c')===s.c&&card.querySelector('.school-heading b').textContent===s.name,s.name+': 카드 이름/색');
        ok(icons.length===4&&equal(icons.map(e=>e.dataset.skill),skills.map(sk=>sk.id)),s.name+': 스킬 아이콘 4개');
        ok(icons.every((e,i)=>e.classList.contains('locked')===!unlocked(skills[i])&&!!e.querySelector('.school-lock')===!unlocked(skills[i])),s.name+': 아이콘 잠금 표시');
        const a=AWK.find(a=>a.id===s.awk);ok(card.querySelector('.school-awakening').textContent.includes(a?a.name:'미정'),s.name+': 전용 각성기');
        const ns=expectedNeighbors(s.id).map(id=>SCHOOLS.find(n=>n.id===id).name);ok(ns.every(n=>card.querySelector('.school-neighbors').textContent.includes(n)),s.name+': 설계서 공명 이웃 이름');
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
      reset(1);setLoadout([]);buildBar();slot(0).click();const locked=$('pairOptions').querySelector('[data-pair="iceflower"]');ok(locked.textContent.includes(String(skOf('frostspiral').unlock))&&!locked.disabled,'잠긴 연계도 해금 시각 안내 후 선택 가능');locked.click();ok(equal(S.loadout,['iceflower'])&&!cast(skOf('frostspiral')),'잠긴 쌍 편성은 해금/시전 조건을 바꾸지 않음');
      reset();for(const [ids,best] of [[[],OB(72)],[['frostcut','iceflower','dash','spear'],OB(72)],[['frostcut','iceflower','dash','spear'],OB(71)],[['frostcut','iceflower','dash','spear'],OB(63)],[['breath','demon','whip','shadow'],OB(72)],[['whip','shadow','swords','frostcut'],OB(72)]]){
        S.best=best;setLoadout(ids);buildBook();const state=schoolState(),expected=[...state.focus.map(id=>'focus:'+id),...state.resonance.map(id=>'resonance:'+id)];
        ok(equal(shown($('schoolEffects')),expected),'편성 칩은 schoolState 그대로: '+ids.join('/')+' @'+best);
        ok(equal(shown($('battleEffects')),expected)&&$('battleEffects').hidden===!expected.length,'전투 배지도 같은 상태/빈 상태 숨김');
        ok([...$('schoolEffects').querySelectorAll('.effect-chip')].every(e=>{const focus=e.dataset.kind==='focus',d=(focus?SCHOOLS:RESONANCES).find(d=>d.id===e.dataset.effect);const tr=focus?focusTier(d.id):0;return e.querySelector('span').textContent===(focus?'집중':'공명')+' · '+d.name&&e.querySelector('.effect-desc').textContent===(focus?tr+'단계 · '+FOCUS_FX[d.id].slice(0,tr).join(' · '):RES_FX[d.id])}),'칩: 활성 이름 + 집중/공명 효과 설명');
      }
      S.best=OB(63);setLoadout(['swords','frostcut']);buildBook();S.best=OB(64);uiTick();ok(shown($('schoolEffects')).includes('resonance:abyss_frost'),'해금 순간 uiTick에서 공명 칩 자동 갱신');
      ok(!$('schoolCards').querySelector('[data-skill="icedragon"]').classList.contains('locked'),'해금 순간 카드 잠금 자동 갱신');
      $('recommendBtn').click();ok(equal(S.loadout,recommendLoadout())&&$('recommendBtn').closest('.formation'),'추천 버튼을 편성 영역으로 이동/동작 유지');

      reset(OB(2));S.best=OB(9);BN=null;uiTick();const notices=[BN.text];while(schoolNotices.length){BN=null;uiTick();notices.push(BN.text)}ok(equal(notices,['새 계열: 심연','새 계열: 진홍','새 계열: 월식','새 계열: 업화']),'여러 해금은 순서대로 안내');
      reset(OB(72));ok(!BN&&schoolNotices.length===0,'이미 해금된 저장을 불러와도 배너 재생 없음');
      reset(skOf('frostcut').unlock-1);S.stage=skOf('frostcut').unlock-1;S.kills=KPS-1;kill();uiTick();ok(S.best===skOf('frostcut').unlock&&BN?.text==='새 계열: 빙정','실제 몬스터 처치/해금 경로에서도 계열 배너 표시');
    }finally{reset();m=null;spawnT=100}
  });

  section('계열 C · 집중 효과 · 숙련');
  guard('계열 C',()=>{
    const reset=()=>{S=fresh();S.best=999;S.stage=72;S.auto=false;S.sound=false;ST=stats();CH=null;BI=null;BF=null;CUT=null;BN=null;FX=[];P=[];T=[];B=[];PR=[];C=[];relicQ=[];shieldOn=null;stop=0;slowT=0;castLock=0;frenzyT=0;circleT=0;gauge=0;lastCast=null;pendingCombo=null;spawnT=100;miniQ=0;h.stun=0;atkT=1e6;verdantCD=0;bloodBuffT=0;
      m=makeMonster(1);m.state='fight';m.x=monX;m.sh=0;m.hp=m.max=1e12;for(const s of SK)cds[s.id]=0};
    const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
    try{
      ok(Object.keys(FOCUS_FX).length===schoolFixture.length&&SCHOOLS.every(s=>Array.isArray(FOCUS_FX[s.id])&&FOCUS_FX[s.id].length===3),'10계열 3단계 효과 설명 데이터 구비');
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

  section('계열 전용 각성기 · 천체 창례 · 천벌 병기 · 업화 명왕');
  guard('계열 전용 각성기',()=>{
    const data=[['celestial','verdant',140,44,5,5],['judgment','storm',160,46,5.5,4],['hellking','hellfire',185,48,6,4]],hit=skillHit,damage=deal,random=Math.random;
    let hits=[],dealt=0;
    const reset=()=>{S=fresh();S.best=999;S.auto=false;S.sound=false;setLoadout([]);ST=stats();ST.atk=100;ST.sk=1;ST.cc=0;CH=null;BI=null;BF=null;CUT=null;BN=null;FX=[];P=[];T=[];B=[];PR=[];C=[];relicQ=[];shieldOn=null;stop=slowT=castLock=frenzyT=circleT=desat=0;gauge=0;lastCast=pendingCombo=null;spawnT=100;miniQ=0;h.stun=0;atkT=1e6;verdantCD=0;
      m=makeMonster(1);m.state='fight';m.x=monX;m.sh=0;m.hp=m.max=1e12;hits=[];dealt=0;for(const s of SK)cds[s.id]=0};
    try{
      Math.random=()=>.5;
      skillHit=function(mult,pm,x,y,o){hits.push({mult,pm,...o});return hit(mult,pm,x,y,o)};
      deal=function(d,crit,src,x,y,o){if(src==='skill')dealt+=d;return damage(d,crit,src,x,y,o)};
      ok(new Set(AWK.map(a=>a.id)).size===AWK.length,'각성기 id 중복 없음');
      ok(SCHOOLS.every(s=>AWK.some(a=>a.id===s.awk)),'10계열 모두 유효한 전용 각성기');
      for(const [id,school,unlock,base,slope,count] of data){const a=AWK.find(a=>a.id===id),s=SCHOOLS.find(s=>s.id===school),p=SCHOOL_AWK_COL[id];
        ok(a.unlock===unlock&&s.awk===id,id+': 해금/계열 배정');ok((awkIcon(a).match(/#[0-9a-f]{6}/gi)||[]).every(c=>p.includes(c)),id+': 아이콘 전용 5색');
        reset();S.best=unlock-1;S.awkSel=id;buildBook();ok(awkSel().id==='thousand',id+': 해금 전 실전 선택 차단');
        ok($('schoolCards').querySelector('[data-school="'+school+'"] .school-awakening').textContent.includes(a.name)&&!$('schoolCards').querySelector('[data-school="'+school+'"] .school-awakening').textContent.includes('미정'),id+': 계열 카드 자동 이름 표시');
        S.best=unlock;ok(awkSel()===a,id+': 지정 스테이지 해금');S.awkSel='thousand';buildBook();$('awks').children[AWK.indexOf(a)].querySelector('.eq').click();ok(S.awkSel===id&&$('awk').getAttribute('aria-label')==='각성기: '+a.name,id+': 패널 선택과 전투 버튼 연결');
        for(const [tr,lv] of [[0,0],[1,5],[2,10],[3,20]]){reset();S.lv.skill=lv;S.awkSel=id;gauge=100;const total=base+slope*tr;
          ok(castAwaken()&&gauge===0&&S.awakes===1&&CUT.name===a.name,id+': TR '+tr+' 실전 게이지/컷인');settle(360);
          ok(hits.length===count&&Math.abs(hits.reduce((n,h)=>n+h.mult,0)-total)<1e-8&&hits.every(h=>h.pm===1&&h.sid===id),id+': TR '+tr+' 타수/배율/pm/sid');
          ok(Math.abs(dealt-100*total)<1e-6,id+': TR '+tr+' 실제 피해 합계');
          ok(total<=48+6*tr,id+': TR '+tr+' 영원의 설관 이하');
          ok(hits.at(-1)?.heavy&&hits.at(-1)?.crack===2&&hits.at(-1)?.name===a.name&&getFinisherInfo('skill',hits.at(-1)).kind==='각성기 결정타',id+': TR '+tr+' 마지막 강타/균열/이름');
          ok(FX.length===0&&castLock<=0&&desat===0,id+': TR '+tr+' 연출 종료/잠금/흑백 복귀');
          reset();S.lv.skill=lv;S.awkSel=id;setLoadout(s.pairs);ST.atk=100;ST.sk=1;ST.cc=0;gauge=100;castAwaken();settle(360);
          ok(isFocusAwk()&&Math.abs(dealt-100*total*1.5)<1e-6,id+': TR '+tr+' 집중 전용 각성기 실제 피해 +50%');
        }
        reset();S.awkSel=id;setLoadout([s.pairs[0]]);ST.atk=100;ST.sk=1;ST.cc=0;gauge=100;castAwaken();settle(360);
        ok(!isFocusAwk()&&Math.abs(dealt-100*base)<1e-6,id+': 한 쌍만 편성하면 집중 보너스 없음');
        reset();S.best=1;gauge=43;const mastery=JSON.stringify(S.mastery);ok(previewAwk(a),id+': 잠긴 각성기 시연');settle(360);
        ok(hits.every(h=>h.pm===.1)&&Math.abs(dealt-10*base)<1e-6&&Math.abs(gauge-(43+(count-1)*.12+BAL.skillGauge))<1e-6&&S.awakes===0&&JSON.stringify(S.mastery)===mastery,id+': 시연 0.1배/게이지 소비 없음/기존 적중 충전/숙련 보존');
        reset();a.fn(.1);m=null;settle(360);ok(FX.length===0&&castLock<=0,id+': 발동 직후 대상 소멸 안전');
        reset();m=null;a.fn(.1);settle(360);ok(FX.length===0&&castLock<=0,id+': 대상 없는 직접 시연도 안전');
        // 전용 FX만 분리해 팔레트·입자 예산·예약 이벤트·지속 흑백을 검증한다.
        reset();skillHit=(mult,pm,x,y,o)=>hits.push({mult,pm,...o});let emitted=0,colors=[];const push=P.push;
        P.push=function(...args){emitted+=args.length;colors.push(...args.map(p=>p.color));return push.apply(this,args)};
        const fx=a.fn(.1),linear=ctx.createLinearGradient,radial=ctx.createRadialGradient;let locked=true,gray=true;
        try{ctx.createLinearGradient=ctx.createRadialGradient=()=>{throw Error('각성기 그라데이션 금지')};
          for(let i=0;i<168;i++){fx.t=(i+1)/60;castLock=0;desat=0;fx.up(1/60,fx);locked=locked&&castLock>0;if(fx.t<1.5&&id!=='hellking')gray=gray&&desat>=.8;ctx.save();fx.post(fx);ctx.restore()}
        }finally{ctx.createLinearGradient=linear;ctx.createRadialGradient=radial;delete P.push}
        ok(emitted===74&&emitted<=100&&colors.every(c=>p.includes(c)),id+': 단색 입자 74개, 예산 100개 이하');
        ok(locked&&gray,id+': 매 프레임 시전 잠금/필요 구간 흑백 유지');ok(hits.length===count,id+': 이벤트 중복 적중 없음');
        skillHit=function(mult,pm,x,y,o){hits.push({mult,pm,...o});return hit(mult,pm,x,y,o)};
      }
      reset();S.best=S.stage=skOf('frostcut').unlock-1;S.kills=KPS-1;schoolSeenState=null;uiTick();kill();uiTick();ok(BN?.text==='새 계열: 빙정','STAGE 60 동시 해금: 계열 안내 우선');BN=null;uiTick();ok(BN?.text==='새 각성기 해금'&&BN.sub.includes('천벌 병기'),'동시 해금: 각성기 안내도 잃지 않고 다음 배너로 표시');
    }finally{skillHit=hit;deal=damage;Math.random=random;reset();m=null;buildBar();buildBook()}
  });

  section('계열 D · 공명 효과 7종');
  guard('계열 D',()=>{
    const reset=()=>{S=fresh();S.best=999;S.stage=72;S.auto=false;S.sound=false;ST=stats();CH=null;BI=null;BF=null;CUT=null;BN=null;FX=[];P=[];T=[];B=[];PR=[];C=[];relicQ=[];shieldOn=null;stop=0;slowT=0;castLock=0;frenzyT=0;circleT=0;gauge=0;lastCast=null;pendingCombo=null;spawnT=100;miniQ=0;h.stun=0;atkT=1e6;verdantCD=0;bloodBuffT=0;
      m=makeMonster(1);m.state='fight';m.x=monX;m.sh=0;m.hp=m.max=1e12;for(const s of SK)cds[s.id]=0};
    try{
      ok(Object.keys(RES_FX).length===resonanceFixture.length&&RESONANCES.every(r=>typeof RES_FX[r.id]==='string'&&RES_FX[r.id].length>0),'13공명 효과 설명 데이터 구비');

      // 7종 각각 켜짐/꺼짐 판정 (schoolState().resonance 기반)
      reset();
      setLoadout(['breath','hands']);ok(hasRes('crimson_hellfire'),'홍련작 켜짐: 진홍+업화');
      setLoadout(['breath','demon']);ok(!hasRes('crimson_hellfire'),'홍련작 꺼짐: 진홍 2쌍 (업화 없음)');

      setLoadout(['hands','shadow']);ok(hasRes('hellfire_eclipse'),'그림자 왈츠 켜짐: 업화+월식');
      setLoadout(['hands','whip']);ok(!hasRes('hellfire_eclipse'),'그림자 왈츠 꺼짐: 업화 2쌍 (월식 없음)');

      setLoadout(['shadow','swords']);ok(hasRes('eclipse_abyss'),'칠흑 켜짐: 월식+심연');
      setLoadout(['shadow','archers']);ok(!hasRes('eclipse_abyss'),'칠흑 꺼짐: 월식 2쌍 (심연 없음)');

      setLoadout(['swords','frostcut']);ok(hasRes('abyss_frost'),'절대영도 켜짐: 심연+빙정');
      setLoadout(['swords','gravity']);ok(!hasRes('abyss_frost'),'절대영도 꺼짐: 심연 2쌍 (빙정 없음)');

      setLoadout(['frostcut','dash']);ok(hasRes('frost_storm'),'초전도 켜짐: 빙정+뇌전');
      setLoadout(['frostcut','iceflower']);ok(!hasRes('frost_storm'),'초전도 꺼짐: 빙정 2쌍 (뇌전 없음)');

      setLoadout(['dash','orb']);ok(hasRes('storm_verdant'),'질풍신 켜짐: 뇌전+녹광');
      setLoadout(['dash','spear']);ok(!hasRes('storm_verdant'),'질풍신 꺼짐: 뇌전 2쌍 (녹광 없음)');

      setLoadout(['orb','breath']);ok(hasRes('verdant_crimson'),'역린혈공 켜짐: 녹광+진홍');
      setLoadout(['orb','shield']);ok(!hasRes('verdant_crimson'),'역린혈공 꺼짐: 녹광 2쌍 (진홍 없음)');

      // 1. 칠흑 (eclipse_abyss) 수치 검증
      reset();setLoadout(['shadow','swords']);
      ok(comboWin()===10,'칠흑: 연계 창 +2초 (기본 8초 + 2초 = 10초)');
      const baseCdm=(1-.05*rv('frost'));
      ok(Math.abs(stats().cdm-baseCdm*.92)<1e-5,'칠흑: 모든 쿨타임 -8%');
      setLoadout(['shadow','archers','swords']);
      ok(comboWin()===13,'월식 집중(+3초)과 칠흑(+2초) 중첩: 연계 창 13초');

      // 2. 홍련작 (crimson_hellfire) 수치 및 발동 검증
      reset();setLoadout(['breath','hands']);cds.breath=0;cds.cannon=0;
      cast(skOf('breath'));castLock=0;cast(skOf('cannon'));
      ok(m.burn===3,'홍련작: 연계기 발동 시 화상 3초 부여');
      m.vuln=2;m.burn=3;m.burnTick=0;let hpB=m.hp;update(0.01);const dealtVuln=hpB-m.hp;
      m.vuln=0;m.burn=3;m.burnTick=0;let hpB2=m.hp;update(0.01);const dealtNorm=hpB2-m.hp;
      ok(Math.abs(dealtVuln-dealtNorm*2*1.3)<1e-4,'홍련작: 속박 중인 적에게 화상 DoT 피해 2배');

      // 3. 그림자 왈츠 (hellfire_eclipse) 발동 검증
      reset();setLoadout(['hands','shadow']);cds.hands=0;cds.skulls=0;
      cast(skOf('hands'));castLock=0;cast(skOf('skulls'));
      ok(m.vuln===2,'그림자 왈츠: 연계기 발동 시 속박 2초 부여');
      const hpBeforeClone=m.hp;tick(20);
      ok(hpBeforeClone>m.hp,'그림자 왈츠: 그림자 분신 추가타 적중');

      // 4. 절대영도 (abyss_frost) 및 집중과의 중복 없는 지속 갱신 검증
      reset();setLoadout(['swords','frostcut']);cds.swords=0;cds.portal=0;
      cast(skOf('swords'));castLock=0;cast(skOf('portal'));
      ok(Math.abs(m.freeze-2)<1e-4,'절대영도: 미빙결 적에게 연계 시 빙결 2초');
      reset();setLoadout(['swords','frostcut']);m.freeze=2.0;cds.swords=0;cds.portal=0;
      cast(skOf('swords'));castLock=0;cast(skOf('portal'));
      ok(Math.abs(m.freeze-3.0)<1e-4,'절대영도: 이미 빙결(2초)인 적에게 연계 시 지속 +50% (3초)');
      // 집중과 중복 검증: 빙정 2쌍(빙정 집중 3.5초) + 절대영도
      reset();setLoadout(['frostcut','iceflower','swords']);cds.frostcut=0;cds.icedragon=0;
      cast(skOf('frostcut'));castLock=0;cast(skOf('icedragon'));
      ok(Math.abs(m.freeze-3.5)<1e-4,'빙정 집중(3.5초)과 절대영도 동시 활성 시 집중의 3.5초 보존 (중복 덮어쓰기 없음)');

      // 5. 초전도 (frost_storm) 수치 검증
      reset();setLoadout(['frostcut','dash']);m.freeze=3;
      const hp0=m.hp;deal(100,false,'skill',m.x,m.y);const dealtFrz=hp0-m.hp;
      m.freeze=0;const hp1=m.hp;deal(100,false,'skill',m.x,m.y);const dealtUnfrz=hp1-m.hp;
      ok(Math.abs(dealtFrz-dealtUnfrz*1.15)<1e-4,'초전도: 빙결된 적이 받는 스킬 피해 +15%');
      m.freeze=3;const hpBeforeFin=m.hp;deal(100,false,'skill',m.x,m.y,{sid:'combo',heavy:1});
      tick(20);ok(m.hp<hpBeforeFin-100*1.15,'초전도: 빙결된 적에게 연계기 적중 시 낙뢰 1회 추가타');

      // 6. 질풍신 (storm_verdant) 검증
      reset();setLoadout(['dash','orb']);gauge=10;cds.dash=0;cds.neon=0;
      cast(skOf('dash'));castLock=0;cast(skOf('neon'));
      ok(gauge>=10+BAL.comboGauge+5,'질풍신: 연계기 발동 시 각성 게이지 +5 추가 충전');

      // 7. 역린혈공 (verdant_crimson) 막기/패링 4종 및 피해 증폭 검증
      reset();setLoadout(['orb','breath']);bloodBuffT=0;
      resolveHit({ty:'slam',parry:true});
      ok(bloodBuffT===10,'역린혈공: 일반 패링 성공 시 발동 (10초)');
      bloodBuffT=0;shieldOn={blocked:false};resolveHit({ty:'slam',parry:false});
      ok(bloodBuffT===10,'역린혈공: 결정 방패 막기 성공 시 발동');
      bloodBuffT=0;shieldOn=null;S.mastery.verdant=0;setLoadout(['orb','shield','breath']);verdantCD=0;resolveHit({ty:'slam',parry:false});
      ok(bloodBuffT===10,'역린혈공: 녹광 방호 성공 시 발동');
      bloodBuffT=0;resolveBossOrb({orbs:[{imp:1,res:0,parry:true}]},{imp:1,res:0,parry:true});
      ok(bloodBuffT===10,'역린혈공: 추적탄 패링 성공 시 발동');
      // 피해 증폭 검증
      reset();setLoadout(['orb','breath']);const origR=Math.random;
      try{
        Math.random=()=>0.5;ST.cc=0;
        bloodBuffT=0;let hpB=m.hp;skillHit(10,1,m.x,m.y,{sid:'combo'});const normCombo=hpB-m.hp;
        bloodBuffT=10;hpB=m.hp;skillHit(10,1,m.x,m.y,{sid:'combo'});const buffCombo=hpB-m.hp;
        ok(Math.abs(buffCombo-normCombo*1.2)<1e-4,'역린혈공: 버프 지속 중 연계기 피해 +20%');
      }finally{Math.random=origR;ST=stats()}
    }finally{reset();m=null;buildBar();buildBook()}
  });

  section('해금 배치 v2 · 예전 저장 보호');
  guard('해금 배치 v2',()=>{
    try{
      const oldU=OLD_UNLOCK,newU=NEW_UNLOCK,byOld=[...SK].sort((a,b)=>a.unlock-b.unlock);
      ok(oldU.length===28&&newU.length===28&&byOld.slice(0,28).every((s,i)=>s.unlock===newU[i]),'해금 순 앞 28개 스킬이 NEW_UNLOCK과 1:1');
      ok(newU.every((v,i)=>!i||v>newU[i-1]),'새 해금 스테이지는 엄격히 증가');
      for(const a of AWK.filter(a=>['thousand','circle','dragon','inferno','frostcrown','celestial','judgment','hellking'].includes(a.id)))ok(unlockFloorOf(a.id==='thousand'?1:{circle:15,dragon:25,inferno:35,frostcrown:45,celestial:50,judgment:60,hellking:70}[a.id])>=a.unlock,a.id+': 옛 해금 위치를 환산하면 새 해금 이상');
      for(const b of [1,2,9,21,30,47,63,71,72,120]){load({best:b,gold:5});const lost=SK.filter((s,i)=>oldU[i]<=b&&!unlocked(s));
        ok(!lost.length&&S.unlockV===2,'예전 저장 STAGE '+b+': 이미 연 스킬 유지'+(lost.length?' '+lost.map(s=>s.id):''))}
      load({best:30,gold:5});const floor=S.unlockFloor;ok(floor===unlockFloorOf(30)&&floor>30,'예전 저장 바닥값 환산');
      load(JSON.parse(JSON.stringify(S)));ok(S.unlockFloor===floor,'새 형식으로 다시 불러와도 바닥값 유지(재환산 없음)');
      load({best:30,gold:5,unlockV:2});ok(!S.unlockFloor,'새 저장은 바닥값 없이 새 해금표 그대로');
      load({best:72});ok(S.unlockFloor===190&&SK.slice(0,28).every(unlocked),'옛 최고 72: 바닥값 190/기존 28스킬 모두 보존');
      ok(['twinstroke','whitestep','inkrain','halfmoon'].every(id=>!unlocked(skOf(id)))&&AWK.find(a=>a.id==='yinyangsky').unlock>ub(),'옛 최고 72: 수묵 4스킬/양의개천 잠김');
      load({best:250});ok(S.best===250&&S.unlockFloor===190&&SK.slice(0,32).every(unlocked)&&AWK.find(a=>a.id==='yinyangsky').unlock<=ub(),'옛 최고 250: 실제 도달 기록으로 수묵까지 해금');
      load({best:72,unlockV:2,unlockFloor:9999});ok(S.unlockFloor===190&&ub()===190&&!unlocked(skOf('twinstroke')),'이미 환산된 저장의 9999 바닥값도 190으로 보정');
      load(JSON.parse(JSON.stringify(S)));ok(S.unlockFloor===190&&ub()===190,'보정한 바닥값 재저장/불러오기 유지');
      S=fresh();ok(S.unlockV===2&&S.unlockFloor===0&&ub()===1,'새 게임은 바닥값 0');
      S.best=31;S.maxStage=31;S.unlockFloor=90;Object.assign(S,{gold:0,stage:1,kills:0,maxStage:1,farm:false,farmKills:0,lv:freshLv()});ok(S.unlockFloor===90&&ub()===90,'환생 필드 초기화에 바닥값 포함 안 됨');
      ok(BAL.hpG===1.3&&BAL.comboGauge===8&&BAL.skillGauge===.8,'밸런스 v3 수치(체력 증가율 1.3, 연계 게이지 8, 스킬 적중 게이지 0.8)');
    }finally{S=fresh();S.best=999;S.gold=1e300;S.auto=false;S.sound=false;ST=stats();m=null;spawnT=100;buildBar();buildBook()}
  });

  section('배속 · 실제 시간 축복 · 저장');
  guard('배속/축복',()=>{
    const dateNow=Date.now,random=Math.random,originalCast=cast;let now=1800000000000;
    const close=()=>{if($('blessPicker').open)$('blessPicker').close()};
    const reset=()=>{close();S=fresh();S.best=999;S.auto=false;S.sound=false;setLoadout([]);ST=stats();CH=null;BI=null;BF=null;CUT=null;BN=null;FX=[];P=[];T=[];B=[];PR=[];C=[];CR=[];relicQ=[];shieldOn=null;stop=slowT=castLock=frenzyT=circleT=desat=0;lastCast=pendingCombo=null;spawnT=100;miniQ=0;h.stun=0;h.dodgeT=-1;atkT=1e6;verdantCD=bloodBuffT=0;gt=0;
      m=makeMonster(5);m.state='fight';m.x=monX;m.yo=0;m.hp=m.max=1e12;m.sh=0;m.atkT=1e6;bossT=bossMax=100;for(const s of SK)cds[s.id]=100};
    const near=(a,b)=>Math.abs(a-b)<1e-6;
    try{Date.now=()=>now;Math.random=()=>.5;
      for(const speed of [1,2,3]){reset();S.speed=speed===3?2:speed;if(speed===3)S.blessing.until.haste=now+BAL.blessDuration;
        BN={t:0,dur:10};CUT={t:0,dur:10};BF={t:0,dur:10};const fx=addFX({dur:10}),oldBg=bgX;for(let i=0;i<60;i++)update(1/60);
        ok(near(100-cds.dash,speed),speed+'배: 1초당 쿨타임 진행');ok(near(100-bossT,speed),speed+'배: 보스 제한 시간도 같은 비율');
        ok(near(gt,speed)&&near(fx.t,speed)&&near(m.t,speed)&&near(bgX-oldBg,14*U*speed),speed+'배: 월드/FX/몬스터/이동 시간');
        ok(near(BN.t,1)&&near(CUT.t,1)&&near(BF.t,1),speed+'배: 배너/컷인/결정타는 실제 1초');
        reset();S.speed=speed===3?2:speed;if(speed===3)S.blessing.until.haste=now+BAL.blessDuration;stop=.5;trauma=1;flashA=1;update(.1);
        ok(near(stop,.4)&&near(trauma,.83)&&near(flashA,.65)&&gt===0,speed+'배: 히트스톱/흔들림/섬광 실제 시간, 월드 정지');
        reset();S.speed=speed===3?2:speed;if(speed===3)S.blessing.until.haste=now+BAL.blessDuration;startPat();const pat=m.pat;update(.05);ok(near(pat.t,.05*speed),speed+'배: 보스 패턴 진행 비율');
      }
      reset();ok(S.speed===1&&S.blessing.charges===3,'신규 저장 기본 ×1/축복 3회');S.speed=2;const saved=JSON.parse(JSON.stringify(S));load(saved);ok(S.speed===2&&S.blessing.charges===3,'배속·충전 저장 왕복');
      load({best:30,gold:123});ok(S.speed===1&&S.blessing.charges===3&&S.blessing.until.power===0&&S.gold===123&&ub()===unlockFloorOf(30),'예전 저장 기본값 병합과 해금 바닥값 보존');
      load({unlockV:2,speed:7,blessing:{charges:99,until:{power:now+1000}}});ok(S.speed===1&&S.blessing.charges===3&&S.blessing.until.gold===0,'손상된 배속/충전 보정 및 until 필드 병합');
      reset();S.blessing.charges=0;const start=now;now+=BAL.blessRecharge-1;syncBlessings();ok(S.blessing.charges===0,'2시간 직전 충전 없음');now++;syncBlessings();ok(S.blessing.charges===1&&S.blessing.chargeAt===now,'2시간 경계에 정확히 1회 충전');
      now=start+BAL.blessRecharge*2+1234;syncBlessings();ok(S.blessing.charges===2&&S.blessing.chargeAt===start+BAL.blessRecharge*2,'충전 후 남은 실제 시간 보존');now+=BAL.blessRecharge*10;syncBlessings();ok(S.blessing.charges===3&&S.blessing.chargeAt===now,'최대 3회와 가득 찬 초과 시간 버림');
      ok(beginBlessing('power')&&S.blessing.charges===2,'축복 선택 시 정확히 1회 소비');ok(!beginBlessing('gold')&&S.blessing.charges===2,'연출 중 중복 소비 금지');now+=BAL.blessRitual-1;update(0);ok(!blessingActive('power'),'3초 연출 전 버프 없음');now++;update(0);ok(blessingActive('power')&&S.blessing.until.power===now+BAL.blessDuration&&!S.blessing.pending,'3초 후 30분 발동');
      const fullEnd=S.blessing.until.power;ok(beginBlessing('power'),'같은 축복 재선택');now+=BAL.blessRitual;update(0);ok(S.blessing.until.power===fullEnd+BAL.blessDuration,'같은 축복의 기존 남은 시간에 30분 연장');
      S.blessing.until.power=now+BAL.blessCap-10000;S.blessing.charges=1;beginBlessing('power');now+=BAL.blessRitual;update(0);ok(S.blessing.until.power===now+BAL.blessCap,'축복 연장 최대 2시간');S.blessing.charges=1;ok(!beginBlessing('power')&&S.blessing.charges===1,'상한에 도달한 축복은 충전 낭비 방지');
      const end=S.blessing.until.power;now=end-1;ok(blessingActive('power'),'만료 1ms 전 활성');now=end;update(0);ok(!blessingActive('power')&&ST.blessingMask===0,'실제 만료 시각에 효과·스탯 해제');
      reset();S.blessing.charges=0;ok(!beginBlessing('gold')&&!S.blessing.pending,'충전 0회 수령 금지');ok(!beginBlessing('bad'),'없는 축복 수령 금지');
      const old=JSON.parse(JSON.stringify(S));now+=BAL.blessRecharge*2+10000;load(old);ok(S.blessing.charges===2,'게임 종료 중 4시간 충전');
      reset();beginBlessing('gold');const pendingSave=JSON.parse(JSON.stringify(S));now+=1000;load(pendingSave);ok(S.blessing.charges===2&&S.blessing.pending.id==='gold'&&!blessingActive('gold'),'연출 중 저장 복원: 충전 중복 소비 없음');now+=2000;update(0);ok(blessingActive('gold'),'복원한 연출은 원래 완료 시각에 발동');
      reset();beginBlessing('haste');const offlinePending=JSON.parse(JSON.stringify(S));now+=BAL.blessDuration+BAL.blessRitual+1;load(offlinePending);ok(!S.blessing.pending&&!blessingActive('haste'),'연출 중 종료 후 오래 지나면 버프도 만료 (재접속부터 연장 금지)');
      reset();const base=stats();for(const id of ['power','gold','haste'])S.blessing.until[id]=now+BAL.blessDuration;update(0);
      ok(near(ST.atk,base.atk*2)&&near(ST.gm,base.gm*2)&&ST.blessingMask===3,'힘 공격력 ×2/풍요 골드 ×2 동시 적용');
      ok(gameSpeed()===3,'신속은 ×1 설정에서도 ×3');S.speed=2;ok(gameSpeed()===3,'신속은 ×2와 곱하지 않고 ×3');now+=BAL.blessDuration;update(0);ok(gameSpeed()===2&&near(ST.atk,base.atk)&&near(ST.gm,base.gm),'만료 후 저장한 ×2와 원래 스탯 복귀');
      reset();m.boss=false;m.hp=m.max=1e8;let hp=m.hp;skillHit(1,1,monX,groundY,{light:1});const dmg=hp-m.hp;S.blessing.until.power=now+BAL.blessDuration;update(0);hp=m.hp;skillHit(1,1,monX,groundY,{light:1});ok(Math.abs(hp-m.hp-dmg*2)<1e-5,'힘 축복 실제 피해 ×2');
      reset();m.boss=false;kill();const gold=C.reduce((n,c)=>n+c.v,0);reset();m.boss=false;S.blessing.until.gold=now+BAL.blessDuration;update(0);kill();ok(near(C.reduce((n,c)=>n+c.v,0),gold*2),'풍요 축복 실제 처치 골드 ×2');
      reset();S.totalKills=10;S.stage=20;pending=0;showOffline(3600);const offline=pending;pending=0;S.speed=2;for(const a of BLESSINGS)S.blessing.until[a.id]=now+BAL.blessDuration;ST=stats();showOffline(3600);ok(near(pending,offline),'오프라인 보상에 배속/축복 배율 미적용');pending=0;$('modal').hidden=true;
      reset();blessingUI();$('speedBtn').click();ok(S.speed===2&&$('speedBtn').textContent==='×2','HUD 배속 전환');$('blessBtn').click();ok($('blessPicker').open&&$('blessChoices').children.length===3,'축복 버튼에서 3종 선택');$('blessChoices').querySelector('[data-blessing="haste"]').click();ok(S.blessing.pending?.id==='haste'&&!$('blessRitual').hidden&&$('blessSelection').hidden,'선택 후 금빛 연출 표시');
      now+=BAL.blessRitual;update(0);blessingUI();ok(!$('blessPicker').open&&$('speedBtn').textContent==='×3'&&!$('speedBtn').disabled&&$('blessBuffs').querySelector('[data-blessing="haste"]'),'연출 종료/신속 HUD 표시(기본 ×3, 버튼 사용 가능)');
      const cyc=[];for(let i=0;i<3;i++){$('speedBtn').click();cyc.push($('speedBtn').textContent+':'+gameSpeed())}ok(cyc.join()==='×1:1,×2:2,×3:3'&&S.speed===2,'신속 중 배속 버튼 ×3→×1→×2→×3 순환, 저장 배속은 유지');
      $('speedBtn').click();ok(gameSpeed()===1,'신속 중 ×1로 낮추기');now+=BAL.blessDuration;update(0);blessingUI();ok($('speedBtn').textContent==='×2'&&!$('speedBtn').disabled&&!$('blessBuffs').children.length,'신속 만료 HUD 복귀');
      checkAuto(reset,()=>{m.boss=false;S.equip=['spear','thunder','archers','wolf','gravity','meteor'];for(const sk of SK)cds[sk.id]=0},'기존 3쌍 2배',2,14400,true);
    }finally{Date.now=dateNow;Math.random=random;cast=originalCast;reset();m=null;spawnT=100;pending=0;$('modal').hidden=true;buildBar();buildBook();blessingUI()}
  });

  section('음양검결 · 원본 유지 · 집중 · 공명');
  guard('음양검결',()=>{
    const reset=()=>{S=fresh();S.best=999;S.auto=false;S.sound=false;ST=stats();CH=null;BI=null;BF=null;CUT=null;BN=null;FX=[];P=[];T=[];B=[];PR=[];C=[];relicQ=[];shieldOn=null;stop=slowT=castLock=frenzyT=circleT=desat=0;gauge=0;lastCast=pendingCombo=null;spawnT=100;miniQ=0;h.stun=0;atkT=1e6;verdantCD=bloodBuffT=0;
      m=makeMonster(1);m.state='fight';m.x=monX;m.sh=0;m.hp=m.max=1e12;for(const s of SK)cds[s.id]=0};
    const step=n=>{for(let i=0;i<n;i++)update(1/60)},until=fn=>{for(let i=0;i<1800&&!fn();i++)update(1/60)};
    const originalHit=skillHit,originalDeal=deal,random=Math.random,originalCast=cast;let hits=[],dealt=0;
    const data=[['twinstroke',200,24,9,1.2,9.5,1.2,22],['whitestep',210,30,13.5,1.8,14,1.9,28],['inkrain',220,26,9.5,1.2,10,1.2,24],['halfmoon',230,32,14,1.8,14.5,1.9,30]];
    try{
      skillHit=function(mult,pm,x,y,o){hits.push({mult,pm,...o});return originalHit(mult,pm,x,y,o)};
      deal=function(d,crit,src,x,y,o){if(src==='skill')dealt+=d;return originalDeal(d,crit,src,x,y,o)};
      ok(JSON.stringify(INK_COL)===JSON.stringify(['#05070B','#363F4D','#77808C','#D9DFE5','#FFFFFF']),'수묵 JSON 5색 그대로');
      checkSchoolSkills(data,INK_COL,'빙정',reset,step,()=>{hits=[];dealt=0},()=>({hits,dealt}));
      for(const [id,kind,count,total] of [['twinstroke','strokes',2,38.5],['inkrain','swords',5,39.5]]){
        const c=comboOf(id),a=skOf(id),b=skOf(c.b);ok(c.school==='ink'&&c.keep.release===releaseInk,id+': 공통 keep 훅 사용');
        reset();cds[b.id]=30;cast(a);const kept=c.keep.get(),pieces=kept.pieces,refs=[...pieces];
        ok(pieces.length===count&&cds[b.id]===PRIME_CD,id+': 유지 개수/짝 준비');until(()=>castLock<=0);render();
        ok(c.keep.get()===kept&&pieces.every((p,i)=>p===refs[i]&&!p.used),id+': 시작 종료 후 원본 유지');
        until(()=>gt-lastCast.t>=7.8);const cd=cds[id];gauge=0;ok(cast(b),id+': 8초 직전 연계');
        ok(cds[id]===cd*.5&&gauge===BAL.comboGauge*ST.gg,id+': 기존 연계 보상 유지');until(()=>kept.claimed);const fin=FX.find(o=>o.kept===kept);
        ok(fin&&kept.pieces===pieces&&pieces.every((p,i)=>p===refs[i]),id+': 배열과 물체 참조 그대로 인계');
        ok(FX.filter(o=>o.inkKind===kind).length===1,id+': 유지 물체 재소환 없음');until(()=>kept.consumed);render();
        ok(pieces.every(p=>p.used&&(kind==='strokes'?p.crossed:p.recalled))&&S.combos===1,id+': 모든 획 통과/먹검 회수 후 한 번 소모');step(150);
        ok(!c.keep.get()&&FX.length===0&&castLock<=0,id+': 연계 종료 정리');
        reset();setLoadout([id]);cast(a);const auto=c.keep.get();S.auto=true;until(()=>auto.claimed);S.auto=false;ok(auto.claimed&&S.combos===1,id+': 자동 연계 인계');
        reset();cast(a);const expired=c.keep.get();step(560);ok(!FX.includes(expired),id+': 만료 시 원본 정리');
        reset();cast(a);const interrupted=c.keep.get();until(()=>castLock<=0);cast(skOf('dash'));step(120);ok(interrupted.collapse&&!FX.includes(interrupted),id+': 다른 스킬로 중단');
        reset();S.best=a.unlock;cast(a);step(240);ok(!c.keep.get(),id+': 짝 미해금은 자연 소멸');
        reset();CH={mods:[DMODS.find(x=>x.id==='chain')]};cast(a);const long=c.keep.get();until(()=>gt-lastCast.t>=15.7);
        ok(c.keep.get()===long&&activeLink()?.left>0,id+': 도전 16초 동일 물체 유지');cast(b);until(()=>long.consumed);ok(long.consumed,id+': 16초 직전 인계');
        reset();cast(a);until(()=>castLock<=0);FX=[];cds[b.id]=0;cast(b);ok(!pendingCombo,id+': 소실 물체 연계 금지');
        reset();hits=[];let emitted=0,colors=[];const push=P.push;P.push=function(...args){emitted+=args.length;colors.push(...args.map(p=>p.color));return push.apply(this,args)};
        ok(previewCombo(c),id+': 시작부터 전체 시연');const demo=c.keep.get();step(350);
        ok(demo.claimed&&demo.consumed&&hits.every(h=>h.pm===.1),id+': 시연 원본 인계/피해 10%');
        ok(Math.abs(hits.reduce((n,h)=>n+h.mult,0)-total)<1e-8&&hits.filter(h=>h.sid==='combo').length===1,id+': 시작+마무리+16배, 중복 발동 없음');
        ok(hits.at(-1)?.name===c.name&&hits.at(-1)?.crack===2,id+': 마지막 연계 이름/균열');
        ok(emitted<=100&&colors.every(col=>INK_COL.includes(col)),id+': 입자 100개 이하/금색 없는 5색 ('+emitted+')');delete P.push;
      }
      const a=AWK.find(a=>a.id==='yinyangsky');ok(a.name==='양의개천'&&a.unlock===205&&SCHOOLS.find(s=>s.id==='ink').awk===a.id,'양의개천 배정/계열');
      reset();S.awkSel=a.id;S.best=204;ok(awkSel().id==='thousand','양의개천 204 잠금');S.unlockFloor=205;ok(awkSel()===a,'양의개천 ub 205 해금');
      for(const [tr,lv] of [[0,0],[1,5],[2,10],[3,20]]){reset();S.lv.skill=lv;ST=stats();ST.cc=0;hits=[];S.awkSel=a.id;gauge=100;
        ok(castAwaken()&&gauge===0&&CUT.name===a.name,'양의개천 TR '+tr+' 게이지/컷인');step(330);
        ok(Math.abs(hits.reduce((n,h)=>n+h.mult,0)-(48+6*tr))<1e-8&&hits.every(h=>h.pm===1&&h.sid===a.id),'양의개천 TR '+tr+' 설관 이하 피해');
        ok(hits.at(-1)?.heavy&&hits.at(-1)?.crack===2,'양의개천 TR '+tr+' 마지막 강타/균열');
      }
      reset();hits=[];a.fn(.1);const awk=FX.find(o=>o.yinyangsky);ok(awk?.dur===2.8,'양의개천 화면 연출 2.8초');
      let grayFrames=0,grayAwk=true;for(let i=0;i<150;i++){const frozen=stop>0;desat=0;update(1/60);if(!frozen&&FX.includes(awk)){grayFrames++;grayAwk=grayAwk&&desat===1}}ok(grayFrames>60&&grayAwk,'양의개천 모든 월드 프레임 흑백 유지')
      step(200);ok(hits.every(h=>h.pm===.1)&&FX.length===0,'양의개천 시연/종료');reset();a.fn(1);m=null;step(330);ok(FX.length===0,'양의개천 대상 소멸 안전');
      reset();let emitted=0,colors=[];const push=P.push;P.push=function(...args){emitted+=args.length;colors.push(...args.map(p=>p.color));return push.apply(this,args)};a.fn(.1);step(330);
      ok(emitted<=100&&colors.every(col=>INK_COL.includes(col)),'양의개천 100개 이하 수묵 입자: '+emitted);delete P.push;
      // 전용 도형의 실제 fill/stroke 색을 수집한다. 배경·공용 컷인은 포함하지 않는다.
      for(const run of [()=>castTwinstroke(.1),()=>castWhitestep(.1),()=>castInkrain(.1),()=>castHalfmoon(.1),()=>previewCombo(comboOf('twinstroke')),()=>previewCombo(comboOf('inkrain')),()=>a.fn(.1)]){
        reset();const paint=[],fill=ctx.fill,stroke=ctx.stroke,rect=ctx.fillRect;
        ctx.fill=function(...args){paint.push(this.fillStyle);return fill.apply(this,args)};ctx.stroke=function(...args){paint.push(this.strokeStyle);return stroke.apply(this,args)};ctx.fillRect=function(...args){paint.push(this.fillStyle);return rect.apply(this,args)};
        try{run();const gold=FX.some(o=>o.yinyangsky);for(let i=0;i<400;i++){update(1/60);if(i%8===0)for(const f of FX)if(f.post)f.post(f)}
          const allowed=(gold?INK_COL.concat('#FFD45B'):INK_COL).map(c=>c.toLowerCase());ok(paint.length>0&&paint.every(c=>allowed.includes(c.toLowerCase())),'수묵 도형 팔레트/각성기만 금색');if(gold)ok(paint.includes('#ffd45b'),'양의개천 금색 실제 그리기');
        }finally{ctx.fill=fill;ctx.stroke=stroke;ctx.fillRect=rect}
      }
      // 집중: 발동 한 번당 고정 추가타, 숙련 경계, 수묵 연출에만 치명타 보너스.
      reset();setLoadout(['twinstroke','inkrain']);for(const [xp,w,cc] of [[0,8,0],[9,8,0],[10,10,0],[24,10,0],[25,10,.2]]){
        S.mastery.ink=xp;ok(comboWin()===w,'음양검결 숙련 '+xp+' 연계 창');FX=[];ST.cc=.1;desat=1;ok(combatCritChance()===.1,'숙련 '+xp+' 다른 흑백 연출 보너스 없음');
        const effect=castTwinstroke(.1);ok(Math.abs(combatCritChance()-(.1+cc))<1e-9,'숙련 '+xp+' 수묵 중 치명타 +20%p');releaseInk(effect);ok(combatCritChance()===.1,'중단 시 치명타 보너스 종료');FX=[];
      }
      reset();setLoadout(['twinstroke','inkrain']);S.mastery.ink=25;ST.cc=.1;castTwinstroke(.1);Math.random=()=>.25;const hp=m.hp;
      originalHit(1,1,monX,groundY,{light:1,sid:'twinstroke'});ok(T.at(-1)?.label==='치명타'&&m.hp<hp,'수묵 치명타 실제 피해 판정에 반영');Math.random=random;
      reset();setLoadout(['twinstroke','inkrain']);dealt=0;triggerResonanceCombo(comboOf('twinstroke'),false,0);step(40);ok(Math.abs(dealt-ST.atk*4)<1e-9,'음양검결 집중 일섬은 정확히 공격력 ×4 한 번');
      reset();dealt=0;triggerResonanceCombo(comboOf('twinstroke'),false,0);step(40);ok(dealt===0,'집중 비활성은 일섬 없음');
      reset();setLoadout(['twinstroke','inkrain']);S.awkSel=a.id;ST.cc=0;Math.random=()=>.5;const before=m.hp;originalHit(2,1,monX,groundY,{sid:a.id,light:1});ok(Math.abs(before-m.hp-ST.atk*ST.sk*3)<.001,'음양검결 집중 전용 각성기 +50%');Math.random=random;
      // 묵월: 실제 적중 뒤 표식, 모든 피해 경로 증폭, 게임 시간 만료, 시연 제외.
      reset();setLoadout(['shadow','twinstroke']);ST.cc=0;Math.random=()=>.5;const first=m.hp;originalHit(2,1,monX,groundY,{sid:'combo',light:1});
      ok(m.inkMark===5&&Math.abs(first-m.hp-ST.atk*ST.sk*2)<.001,'묵월 첫 적중 후 5초 표식');
      for(const src of ['hero','tap','skill','ally','dot']){const hp=m.hp;originalDeal(100,false,src,monX,groundY,{light:1});ok(Math.abs(hp-m.hp-115)<.001,'먹물 표식 '+src+' 피해 +15%')}
      step(301);ok(m.inkMark===0,'묵월 5게임초 만료');const cleared=m.hp;originalDeal(100,false,'hero',monX,groundY,{light:1});ok(Math.abs(cleared-m.hp-100)<.001,'표식 만료 후 피해 복귀');
      reset();setLoadout(['shadow','twinstroke']);originalHit(2,.1,monX,groundY,{sid:'combo',light:1});ok(!m.inkMark,'시연은 묵월 표식 없음');Math.random=random;
      // 현묵: 정확히 20% 경계, 실제 cast 경로에서도 덮어쓰기 없이 초기화.
      for(const roll of [.1999,.2,.8]){reset();setLoadout(['swords','twinstroke']);Math.random=()=>roll;cds.whitestep=30;triggerResonanceCombo(comboOf('twinstroke'),false,0);ok(cds.whitestep===(roll<.2?0:30),'현묵 확률 경계 '+roll);Math.random=random}
      reset();setLoadout(['swords','twinstroke']);cast(skOf('twinstroke'));until(()=>castLock<=0);Math.random=()=>.1;cast(skOf('whitestep'));ok(cds.whitestep===0&&pendingCombo?.a==='twinstroke','현묵 실제 연계 시 마무리 쿨 즉시 초기화');Math.random=random;
      reset();setLoadout(['swords','twinstroke']);cds.whitestep=30;Math.random=()=>0;previewCombo(comboOf('twinstroke'));step(330);ok(cds.whitestep>20,'연계 시연은 현묵 초기화 없음');Math.random=random;
      reset();load({unlockV:2,best:230,mastery:{crimson:12},loadout:['twinstroke','inkrain']});ok(S.mastery.ink===0&&S.mastery.crimson===12&&S.equip.join()==='twinstroke,whitestep,inkrain,halfmoon','기존 저장 숙련 병합/수묵 편성 복원');
      load({...S,mastery:{...S.mastery,ink:25}});ok(S.mastery.ink===25,'수묵 숙련 저장 복원');buildBook();ok($('schoolCards').querySelector('[data-school="ink"]')?.textContent.includes('양의개천'),'새 계열 카드 전용 각성기 이름');
      const started=performance.now();let result;for(let i=0;i<10;i++)result=recommendLoadout(230);const elapsed=performance.now()-started;ok(elapsed<1000&&result.length===4,'8계열 추천 10회 <1초: '+elapsed.toFixed(1)+'ms');lines.push('8계열 추천 10회: '+elapsed.toFixed(1)+'ms');

    }finally{skillHit=originalHit;deal=originalDeal;Math.random=random;cast=originalCast;reset();m=null;buildBook();buildBar()}
  });

  section('무극도법 · 원본 유지 · 집중 · 공명');
  guard('무극도법',()=>{
    const reset=()=>{S=fresh();S.best=999;S.auto=false;S.sound=false;ST=stats();CH=null;BI=null;BF=null;CUT=null;BN=null;FX=[];P=[];T=[];B=[];PR=[];C=[];relicQ=[];shieldOn=null;stop=slowT=castLock=frenzyT=circleT=desat=0;gauge=0;lastCast=pendingCombo=null;spawnT=100;miniQ=0;h.stun=0;atkT=1e6;verdantCD=bloodBuffT=0;
      m=makeMonster(1);m.state='fight';m.x=monX;m.sh=0;m.hp=m.max=1e12;for(const s of SK)cds[s.id]=0};
    const step=n=>{for(let i=0;i<n;i++)update(1/60)},until=fn=>{for(let i=0;i<1800&&!fn();i++)update(1/60)};
    const originalHit=skillHit,originalDeal=deal,random=Math.random,originalCast=cast;let hits=[],dealt=0;
    const data=[['ink_gate',240,26,9,1.2,9,1.2,24],['bind',250,32,13.5,1.8,13.5,1.8,30],['talisman',260,28,9.5,1.2,9.5,1.2,26],['backflow',270,34,14,1.8,14,1.8,32]];
    try{
      skillHit=function(mult,pm,x,y,o){hits.push({mult,pm,...o});return originalHit(mult,pm,x,y,o)};
      deal=function(d,crit,src,x,y,o){if(src==='skill')dealt+=d;return originalDeal(d,crit,src,x,y,o)};
      ok(JSON.stringify(WUJI_COL)===JSON.stringify(['#05070B','#363F4D','#77808C','#D9DFE5','#FFFFFF']),'수묵 JSON 5색 그대로');
      checkSchoolSkills(data,WUJI_COL,'음양검결',reset,step,()=>{hits=[];dealt=0},()=>({hits,dealt}));
      for(const [id,kind,count,total] of [['ink_gate','gates',2,38.5],['talisman','papers',5,39.5]]){
        const c=comboOf(id),a=skOf(id),b=skOf(c.b);ok(c.school==='wuji'&&c.keep.release===releaseWuji,id+': 공통 keep 훅 사용');
        reset();cds[b.id]=30;cast(a);const kept=c.keep.get(),pieces=kept.pieces,refs=[...pieces];
        ok(pieces.length===count&&cds[b.id]===PRIME_CD,id+': 유지 개수/짝 준비');until(()=>castLock<=0);render();
        ok(c.keep.get()===kept&&pieces.every((p,i)=>p===refs[i]&&!p.used),id+': 시작 종료 후 원본 유지');
        until(()=>gt-lastCast.t>=7.8);const cd=cds[id];gauge=0;ok(cast(b),id+': 8초 직전 연계');
        ok(cds[id]===cd*.5&&gauge===BAL.comboGauge*ST.gg,id+': 기존 연계 보상 유지');until(()=>kept.claimed);const fin=FX.find(o=>o.kept===kept);
        ok(fin&&kept.pieces===pieces&&pieces.every((p,i)=>p===refs[i]),id+': 배열과 물체 참조 그대로 인계');
        ok(FX.filter(o=>o.wujiKind===kind).length===1,id+': 유지 물체 재소환 없음');until(()=>kept.consumed);render();
        ok(pieces.every(p=>p.used&&(kind==='gates'?p.extended:p.absorbed))&&S.combos===1,id+': 원본 문에서 띠 연장/부적 흡수 후 한 번 소모');step(150);
        ok(!c.keep.get()&&FX.length===0&&castLock<=0,id+': 연계 종료 정리');
        reset();setLoadout([id]);cast(a);const auto=c.keep.get();S.auto=true;until(()=>auto.claimed);S.auto=false;ok(auto.claimed&&S.combos===1,id+': 자동 연계 인계');
        reset();cast(a);const expired=c.keep.get();step(560);ok(!FX.includes(expired),id+': 만료 시 원본 정리');
        reset();cast(a);const interrupted=c.keep.get();until(()=>castLock<=0);cast(skOf('dash'));step(120);ok(interrupted.collapse&&!FX.includes(interrupted),id+': 다른 스킬로 중단');
        reset();S.best=a.unlock;cast(a);step(240);ok(!c.keep.get(),id+': 짝 미해금은 자연 소멸');
        reset();CH={mods:[DMODS.find(x=>x.id==='chain')]};cast(a);const long=c.keep.get();until(()=>gt-lastCast.t>=15.7);
        ok(c.keep.get()===long&&activeLink()?.left>0,id+': 도전 16초 동일 물체 유지');cast(b);until(()=>long.consumed);ok(long.consumed,id+': 16초 직전 인계');
        reset();cast(a);until(()=>castLock<=0);FX=[];cds[b.id]=0;cast(b);ok(!pendingCombo,id+': 소실 물체 연계 금지');
        reset();hits=[];let emitted=0,colors=[];const push=P.push;P.push=function(...args){emitted+=args.length;colors.push(...args.map(p=>p.color));return push.apply(this,args)};
        ok(previewCombo(c),id+': 시작부터 전체 시연');const demo=c.keep.get();step(350);
        ok(demo.claimed&&demo.consumed&&hits.every(h=>h.pm===.1),id+': 시연 원본 인계/피해 10%');
        ok(Math.abs(hits.reduce((n,h)=>n+h.mult,0)-total)<1e-8&&hits.filter(h=>h.sid==='combo').length===1,id+': 시작+마무리+16배, 중복 발동 없음');
        ok(hits.at(-1)?.name===c.name&&hits.at(-1)?.crack===2,id+': 마지막 연계 이름/균열');
        ok(emitted<=100&&colors.every(col=>WUJI_COL.includes(col)),id+': 입자 100개 이하/금색 없는 5색 ('+emitted+')');delete P.push;
      }
      const a=AWK.find(a=>a.id==='wuji_return');ok(a.name==='무극귀일'&&a.unlock===255&&SCHOOLS.find(s=>s.id==='wuji').awk===a.id,'무극귀일 배정/계열');
      reset();S.awkSel=a.id;S.best=254;ok(awkSel().id==='thousand','무극귀일 254 잠금');S.unlockFloor=255;ok(awkSel()===a,'무극귀일 ub 255 해금');
      for(const [tr,lv] of [[0,0],[1,5],[2,10],[3,20]]){reset();S.lv.skill=lv;ST=stats();ST.cc=0;hits=[];S.awkSel=a.id;gauge=100;
        ok(castAwaken()&&gauge===0&&CUT.name===a.name,'무극귀일 TR '+tr+' 게이지/컷인');step(330);
        ok(Math.abs(hits.reduce((n,h)=>n+h.mult,0)-(48+6*tr))<1e-8&&hits.every(h=>h.pm===1&&h.sid===a.id),'무극귀일 TR '+tr+' 설관 이하 피해');
        ok(hits.at(-1)?.heavy&&hits.at(-1)?.crack===2,'무극귀일 TR '+tr+' 마지막 강타/균열');
      }
      reset();hits=[];a.fn(.1);const awk=FX.find(o=>o.wujiReturn);ok(awk?.dur===2.8,'무극귀일 화면 연출 2.8초');
      let grayFrames=0,grayAwk=true;for(let i=0;i<150;i++){const frozen=stop>0;desat=0;update(1/60);if(!frozen&&FX.includes(awk)){grayFrames++;grayAwk=grayAwk&&desat===1}}ok(grayFrames>60&&grayAwk,'무극귀일 모든 월드 프레임 흑백 유지')
      step(200);ok(hits.every(h=>h.pm===.1)&&FX.length===0,'무극귀일 시연/종료');reset();a.fn(1);m=null;step(330);ok(FX.length===0,'무극귀일 대상 소멸 안전');
      reset();let emitted=0,colors=[];const push=P.push;P.push=function(...args){emitted+=args.length;colors.push(...args.map(p=>p.color));return push.apply(this,args)};a.fn(.1);step(330);
      ok(emitted<=100&&colors.every(col=>WUJI_COL.includes(col)),'무극귀일 100개 이하 수묵 입자: '+emitted);delete P.push;
      // 전용 도형의 실제 fill/stroke 색을 수집한다. 배경·공용 컷인은 포함하지 않는다.
      for(const run of [()=>castInkGate(.1),()=>castWujiBind(.1),()=>castTalisman(.1),()=>castBackflow(.1),()=>previewCombo(comboOf('ink_gate')),()=>previewCombo(comboOf('talisman')),()=>a.fn(.1)]){
        reset();const paint=[],fill=ctx.fill,stroke=ctx.stroke,rect=ctx.fillRect;
        ctx.fill=function(...args){paint.push(this.fillStyle);return fill.apply(this,args)};ctx.stroke=function(...args){paint.push(this.strokeStyle);return stroke.apply(this,args)};ctx.fillRect=function(...args){paint.push(this.fillStyle);return rect.apply(this,args)};
        try{run();const gold=FX.some(o=>o.wujiReturn);for(let i=0;i<400;i++){update(1/60);if(i%8===0)for(const f of FX)if(f.post)f.post(f)}
          const allowed=(gold?WUJI_COL.concat('#FFD45B'):WUJI_COL).map(c=>c.toLowerCase());ok(paint.length>0&&paint.every(c=>allowed.includes(c.toLowerCase())),'수묵 도형 팔레트/각성기만 금색');if(gold)ok(paint.includes('#ffd45b'),'무극귀일 금색 실제 그리기');
        }finally{ctx.fill=fill;ctx.stroke=stroke;ctx.fillRect=rect}
      }
      // 집중: 연계로 준비한 방어 하나, 25게임초 쿨, 숙련 10/25의 누적 효과.
      reset();setLoadout(['ink_gate','talisman']);m.boss=true;bossT=1e6;triggerResonanceCombo(comboOf('ink_gate'),false,0);const ward=wujiWard(),ready=ward.readyAt;
      ok(ward.armed&&Math.abs(ready-gt-25)<1e-8,'무극 집중: 연계로 보스 공격 1회 방어/25초 재사용');
      ok(resolveHit({ty:'slam'},1,false)==='blocked'&&h.stun===0&&!ward.armed,'먹문이 실제 보스 공격 흡수');
      ok(resolveHit({ty:'beam'},1,false)==='hit'&&h.stun===1.3,'다음 보스 공격은 흡수하지 않음');h.stun=0;step(10);
      triggerResonanceCombo(comboOf('ink_gate'),false,0);ok(!ward.armed&&ward.readyAt===ready,'재사용 대기 중 재연계는 방어 재생성 없음');
      gt=ready-.001;triggerResonanceCombo(comboOf('ink_gate'),false,0);ok(!ward.armed,'25초 직전 방어 잠김');gt=ready;triggerResonanceCombo(comboOf('ink_gate'),false,0);ok(ward.armed,'25초 이후 연계로 재준비');
      const deadline=ward.readyAt;triggerResonanceCombo(comboOf('ink_gate'),false,0);ok(ward.readyAt===deadline&&FX.filter(f=>f.wujiWard===ward&&f.t<f.dur).length===1,'미사용 방어 중첩/대기 연장 없음');
      setLoadout([]);ok(!absorbWujiAttack()&&!wujiWard().armed,'집중 해제 시 흡수 불가/준비 해제');
      reset();setLoadout(['ink_gate','talisman']);triggerResonanceCombo(comboOf('ink_gate'),false,0);ok(!absorbWujiAttack(),'일반 몬스터 공격에는 보스 방어 소모 없음');
      for(const mode of ['shield','parry']){reset();setLoadout(['ink_gate','talisman']);m.boss=true;triggerWujiFocus();if(mode==='shield')shieldOn={};resolveHit({ty:'slam',parry:mode==='parry'},1,false);ok(wujiWard().armed,'먹문 준비보다 '+mode+' 우선/먹문 보존')}
      reset();setLoadout(['ink_gate','talisman']);triggerWujiFocus();const armedSave=JSON.parse(JSON.stringify(S));load(armedSave);ok(!wujiWard().armed&&wujiWard().readyAt===0,'일시 방어/재사용은 저장에 유출되지 않음');
      for(const xp of [0,9,10,24,25]){reset();setLoadout(['ink_gate','talisman']);S.mastery.wuji=xp;dealt=0;const seen=[];
        deal=function(d,crit,src,x,y,o){if(o?.sid==='wuji_talisman')seen.push(d);return originalDeal(d,crit,src,x,y,o)};
        for(let i=0;i<SK.length;i++)cds[SK[i].id]=i%3===0?0:i%3===1?.4:8;const before={...cds};triggerResonanceCombo(comboOf('ink_gate'),false,0);
        ok(SK.every(s=>cds[s.id]===(xp>=25?Math.max(0,before[s.id]-1):before[s.id])),'무극 숙련 '+xp+': 모든 스킬 쿨 -1초/0 바닥');step(65);
        ok(seen.length===(xp>=10?5:0)&&seen.every(d=>d===ST.atk),'무극 숙련 '+xp+': 부적 5개 각 공격력 ×1');
      }
      deal=originalDeal;reset();setLoadout(['ink_gate','talisman']);S.mastery.wuji=25;cast(skOf('ink_gate'));until(()=>castLock<=0);const startCD=cds.ink_gate;cds.dash=8;
      ok(cast(skOf('bind'))&&cds.ink_gate===Math.max(0,startCD*.5-1)&&cds.bind===skOf('bind').cd*ST.cdm-1&&cds.dash===7,'실제 cast 연계에서 시작/마무리/다른 스킬 쿨 환급');
      reset();setLoadout(['ink_gate','talisman']);S.mastery.wuji=25;cds.dash=20;previewCombo(comboOf('ink_gate'));step(400);ok(!wujiWard().armed&&cds.dash>13,'시연은 방어 준비/집중 쿨 환급 없음');
      // 추적탄 각각 독립: 먹문은 한 발만 막고, 이후 구체와 패링 판정은 유지한다.
      reset();setLoadout(['ink_gate','talisman']);m.boss=true;bossT=1e6;triggerWujiFocus();const orbs={ty:'orbs',t:0,orbs:[0,1,2].map(i=>({imp:1.2+i*.4,res:0,parry:false})),evade:false};m.pat=orbs;
      for(const orb of orbs.orbs)resolveBossOrb(orbs,orb);ok(orbs.orbs[0].result==='blocked'&&orbs.orbs.slice(1).every(g=>g.result==='hit')&&Math.abs(h.stun-1.3*2/3)<1e-9,'추적탄 1발만 흡수/나머지 기절 비율');
      // 태허도검: 공명 활성 + 수묵 연출 + 연계 피해 조건을 모두 만족할 때만 적용.
      reset();setLoadout(['twinstroke','ink_gate']);ST.cc=0;Math.random=()=>.5;const base=ST.atk*ST.sk*2;
      const hitAmount=(sid='combo')=>{const hp=m.hp;originalHit(2,1,monX,groundY,{sid,light:1});return hp-m.hp};
      ok(Math.abs(hitAmount()-base)<.001,'태허도검: 수묵 연출 없으면 증폭 없음');desat=1;ok(Math.abs(hitAmount()-base)<.001,'다른 흑백만 켜진 상태는 태허도검 미적용');
      const scene=castInkGate(.1);ok(Math.abs(hitAmount()-base*1.2)<.001&&T.some(t=>t.text==='태허도검!'),'태허도검 실제 연계 피해 +20%/새 발동 이름');
      ok(Math.abs(hitAmount('ink_gate')-base)<.001,'태허도검은 일반 스킬 피해 제외');releaseWuji(scene);ok(Math.abs(hitAmount()-base)<.001,'수묵 중단 즉시 태허도검 종료');
      FX=[];castTwinstroke(.1);ok(Math.abs(hitAmount()-base*1.2)<.001,'음양검결 수묵 연출도 태허도검 적용');
      FX=[];castInkGate(.1);T=[];originalHit(2,.1,monX,groundY,{sid:'combo',light:1});ok(!T.some(t=>t.text==='태허도검!'),'태허도검 시연은 실전 발동 안내 없음');
      setLoadout(['ink_gate']);ok(Math.abs(hitAmount()-base)<.001,'공명 비활성은 수묵 중에도 증폭 없음');Math.random=random;
      // 생무극: 결정 방패/녹광 방호/일반 패링/구체 패링에 각각 1회 반격.
      for(const mode of ['shield','verdant','parry','orb']){reset();setLoadout(mode==='verdant'?['orb','shield','ink_gate']:['orb','ink_gate']);m.boss=true;bossT=1e6;const seen=[];
        deal=function(d,crit,src,x,y,o){if(o?.sid==='wuji_talisman')seen.push(d);return originalDeal(d,crit,src,x,y,o)};
        if(mode==='shield')shieldOn={};if(mode==='orb'){const p={ty:'orbs',orbs:[{imp:1.2,res:0,parry:true},{imp:1.6,res:0,parry:false}],t:1.2};m.pat=p;resolveBossOrb(p,p.orbs[0])}
        else resolveHit({ty:'slam',parry:mode==='parry'},1,false);
        ok(T.some(t=>t.text==='생무극!'),'생무극 '+mode+' 새 발동 이름');step(150);
        ok(seen.length===1&&seen[0]===ST.atk*5,'생무극 '+mode+' 공격력 ×5 한 번');
      }
      reset();setLoadout(['orb','ink_gate']);const noCounter=[];deal=function(d,crit,src,x,y,o){if(o?.sid==='wuji_talisman')noCounter.push(d);return originalDeal(d,crit,src,x,y,o)};
      m.boss=true;resolveHit({ty:'slam'},1,true);step(60);ok(noCounter.length===0,'회피는 생무극 반격 없음');
      reset();setLoadout(['orb','ink_gate','talisman']);m.boss=true;triggerWujiFocus();resolveHit({ty:'slam'},1,false);step(60);ok(noCounter.length===0,'먹문 흡수는 생무극의 방패/패링 조건에 포함하지 않음');deal=originalDeal;
      reset();setLoadout(['ink_gate','talisman']);ST.cc=0;S.awkSel='wuji_return';Math.random=()=>.5;let hp=m.hp;originalHit(2,1,monX,groundY,{sid:'wuji_return',light:1});ok(Math.abs(hp-m.hp-ST.atk*ST.sk*3)<.001,'무극 집중 전용 각성기 +50%');Math.random=random;
      reset();load({unlockV:2,best:270,mastery:{ink:25},loadout:['ink_gate','talisman']});ok(S.mastery.wuji===0&&S.mastery.ink===25&&S.equip.join()==='ink_gate,bind,talisman,backflow','예전 저장 무극 숙련 0 병합/편성 복원');load({...S,mastery:{...S.mastery,wuji:25}});ok(S.mastery.wuji===25,'무극 숙련 재저장 복원');
      load({best:250});ok(['ink_gate','bind'].every(id=>unlocked(skOf(id)))&&['talisman','backflow'].every(id=>!unlocked(skOf(id)))&&AWK.find(a=>a.id==='wuji_return').unlock>ub(),'옛 최고 250: 무극 앞 2스킬만 해금/뒤 2스킬과 각성기 잠김');
      reset();setLoadout(['ink_gate','talisman','twinstroke','orb']);schoolOpen='wuji';buildBook();buildBar();
      ok($('schoolCards').querySelector('[data-school="wuji"]').textContent.includes('무극귀일'),'계열 카드 무극귀일 표시');ok(['ink_wuji','verdant_wuji'].every(id=>$('schoolEffects').querySelector('[data-effect="'+id+'"]')?.textContent.includes(RESONANCES.find(r=>r.id===id).name)),'태허도검/생무극 칩과 설명');

      const started=performance.now();let result;for(let i=0;i<10;i++)result=recommendLoadout(270);const elapsed=performance.now()-started;ok(elapsed<1000&&result.length===4,'9계열 추천 10회 <1초: '+elapsed.toFixed(1)+'ms');lines.push('9계열 추천 10회: '+elapsed.toFixed(1)+'ms');

    }finally{skillHit=originalHit;deal=originalDeal;Math.random=random;cast=originalCast;reset();m=null;buildBook();buildBar()}
  });

  section('태극묵륜 (무계열 수묵 각성기)');
  guard('태극묵륜',()=>{
    const reset=()=>{S=fresh();S.best=999;S.auto=false;S.sound=false;ST=stats();CH=null;BI=null;BF=null;CUT=null;BN=null;FX=[];P=[];T=[];B=[];PR=[];C=[];relicQ=[];shieldOn=null;stop=slowT=castLock=frenzyT=circleT=desat=0;gauge=0;lastCast=pendingCombo=null;spawnT=100;miniQ=0;h.stun=0;atkT=1e6;verdantCD=bloodBuffT=0;
      m=makeMonster(1);m.state='fight';m.x=monX;m.sh=0;m.hp=m.max=1e12;for(const s of SK)cds[s.id]=0};
    const step=n=>{for(let i=0;i<n;i++)update(1/60)};
    const originalHit=skillHit,originalDeal=deal;let hits=[];
    try{
      skillHit=function(mult,pm,x,y,o){hits.push({mult,pm,...o});return originalHit(mult,pm,x,y,o)};
      const a=AWK.find(x=>x.id==='taichi');
      ok(a&&a.name==='태극묵륜'&&a.unlock===235,'태극묵륜 AWK 등록 및 해금 스테이지 235');
      ok(!SCHOOLS.some(s=>s.awk==='taichi'),'태극묵륜: 무계열 각성기 (SCHOOLS 미소속/집중 보너스 없음)');
      ok(!!awkIcon(a),'태극묵륜 아이콘 존재');
      reset();S.awkSel=a.id;S.best=234;S.unlockFloor=0;ok(awkSel().id==='thousand','태극묵륜 234 잠금 (해금 전 실전 선택 차단)');
      S.unlockFloor=235;ok(awkSel()===a,'태극묵륜 ub 235 해금');
      for(const [tr,lv] of [[0,0],[1,5],[2,10],[3,20]]){
        reset();S.lv.skill=lv;ST=stats();ST.cc=0;hits=[];S.awkSel=a.id;gauge=100;
        ok(castAwaken()&&gauge===0&&CUT.name===a.name,'태극묵륜 TR '+tr+' 발동/컷인');step(330);
        const expected=48+6*tr;
        const totalMult=hits.reduce((n,h)=>n+h.mult,0);
        ok(Math.abs(totalMult-expected)<1e-8&&hits.every(h=>h.pm===1&&h.sid==='taichi'),'태극묵륜 TR '+tr+' 피해 '+(expected.toFixed(1))+'배 (양의개천 이하)');
        ok(hits.at(-1)?.heavy&&hits.at(-1)?.crack===2&&hits.at(-1)?.name==='태극묵륜','태극묵륜 TR '+tr+' 마지막 강타/균열');
      }
      reset();hits=[];a.fn(.1);const awk=FX.find(o=>o.taichi);ok(awk?.dur===2.8,'태극묵륜 화면 연출 2.8초');
      let grayFrames=0,grayAwk=true;for(let i=0;i<150;i++){const frozen=stop>0;desat=0;update(1/60);if(!frozen&&FX.includes(awk)){grayFrames++;grayAwk=grayAwk&&desat===1}}
      ok(grayFrames>60&&grayAwk,'태극묵륜 모든 월드 프레임 흑백 유지');
      step(200);ok(hits.every(h=>h.pm===.1)&&FX.length===0,'태극묵륜 시연 0.1배 및 연출 종료');
      ok(desat===0,'태극묵륜 종료 후 흑백 복귀 (desat===0)');
      reset();a.fn(1);m=null;step(330);ok(FX.length===0,'태극묵륜 대상 소멸 안전');
      reset();let emitted=0,colors=[];const push=P.push;P.push=function(...args){emitted+=args.length;colors.push(...args.map(p=>p.color));return push.apply(this,args)};a.fn(.1);step(330);
      ok(emitted<=100&&colors.every(col=>INK_COL.includes(col)),'태극묵륜 100개 이하 수묵 입자: '+emitted);delete P.push;
      reset();const paint=[],fill=ctx.fill,stroke=ctx.stroke;
      ctx.fill=function(...args){paint.push(this.fillStyle);return fill.apply(this,args)};
      ctx.stroke=function(...args){paint.push(this.strokeStyle);return stroke.apply(this,args)};
      try{
        a.fn(.1);for(let i=0;i<200;i++){update(1/60);if(i%8===0)for(const f of FX)if(f.post)f.post(f)}
        const allowed=INK_COL.concat('#FFD45B').map(c=>c.toLowerCase());
        ok(paint.length>0&&paint.every(c=>allowed.includes(String(c).toLowerCase())),'태극묵륜 도형 팔레트 5색+금색만 사용');
        ok(paint.map(c=>String(c).toLowerCase()).includes('#ffd45b'),'태극묵륜 적중 시 금색 절단선 실제 그림');
      }finally{ctx.fill=fill;ctx.stroke=stroke}
    }finally{skillHit=originalHit;deal=originalDeal;reset();m=null;buildBook();buildBar()}
  });

  section('묵령현신 · 원본 유지 · 집중 · 공명');
  guard('묵령현신',()=>{
    const reset=()=>{S=fresh();S.best=999;S.auto=false;S.sound=false;ST=stats();CH=null;BI=null;BF=null;CUT=null;BN=null;FX=[];P=[];T=[];B=[];PR=[];C=[];relicQ=[];shieldOn=null;stop=slowT=castLock=frenzyT=circleT=desat=0;gauge=0;lastCast=pendingCombo=null;spawnT=100;miniQ=0;h.stun=0;atkT=1e6;verdantCD=bloodBuffT=0;
      m=makeMonster(1);m.state='fight';m.x=monX;m.sh=0;m.hp=m.max=1e12;for(const s of SK)cds[s.id]=0};
    const step=n=>{for(let i=0;i<n;i++)update(1/60)},until=fn=>{for(let i=0;i<1800&&!fn();i++)update(1/60)};
    const originalHit=skillHit,originalDeal=deal,random=Math.random,originalCast=cast;let hits=[],dealt=0;
    const data=[['koi',280,28,9,1.2,9,1.2,26],['crane',290,34,13.5,1.8,13.5,1.8,32],['turtle',300,30,9.5,1.2,9.5,1.2,28],['tiger',310,36,14,1.8,14,1.8,34]];
    try{
      skillHit=function(mult,pm,x,y,o){hits.push({mult,pm,...o});return originalHit(mult,pm,x,y,o)};
      deal=function(d,crit,src,x,y,o){if(src==='skill')dealt+=d;return originalDeal(d,crit,src,x,y,o)};
      ok(JSON.stringify(SPIRIT_COL)===JSON.stringify(['#05070B','#363F4D','#77808C','#D9DFE5','#FFFFFF']),'수묵 JSON 5색 그대로');
      checkSchoolSkills(data,SPIRIT_COL,'무극도법',reset,step,()=>{hits=[];dealt=0},()=>({hits,dealt}));
      for(const [id,kind,count,total] of [['koi','trails',2,38.5],['turtle','plates',6,39.5]]){
        const c=comboOf(id),a=skOf(id),b=skOf(c.b);ok(c.school==='spirit'&&c.keep.release===releaseSpirit,id+': 공통 keep 훅 사용');
        reset();cds[b.id]=30;cast(a);const kept=c.keep.get(),pieces=kept.pieces,refs=[...pieces];
        ok(pieces.length===count&&cds[b.id]===PRIME_CD,id+': 유지 개수/짝 준비');until(()=>castLock<=0);render();
        ok(c.keep.get()===kept&&pieces.every((p,i)=>p===refs[i]&&!p.used),id+': 시작 종료 후 원본 유지');
        until(()=>gt-lastCast.t>=7.8);const cd=cds[id];gauge=0;ok(cast(b),id+': 8초 직전 연계');
        ok(cds[id]===cd*.5&&gauge===BAL.comboGauge*ST.gg,id+': 기존 연계 보상 유지');until(()=>kept.claimed);const fin=FX.find(o=>o.kept===kept);
        ok(fin&&kept.pieces===pieces&&pieces.every((p,i)=>p===refs[i]),id+': 배열과 물체 참조 그대로 인계');
        ok(FX.filter(o=>o.spiritKind===kind).length===1,id+': 유지 물체 재소환 없음');until(()=>kept.consumed);render();
        ok(pieces.every(p=>p.used&&(kind==='trails'?p.absorbed:p.attached))&&S.combos===1,id+': 원본 궤적 흡수/판 갑옷 부착 후 한 번 소모');step(150);
        ok(!c.keep.get()&&FX.length===0&&castLock<=0,id+': 연계 종료 정리');
        reset();setLoadout([id]);cast(a);const auto=c.keep.get();S.auto=true;until(()=>auto.claimed);S.auto=false;ok(auto.claimed&&S.combos===1,id+': 자동 연계 인계');
        reset();cast(a);const expired=c.keep.get();step(560);ok(!FX.includes(expired),id+': 만료 시 원본 정리');
        reset();cast(a);const interrupted=c.keep.get();until(()=>castLock<=0);cast(skOf('dash'));step(120);ok(interrupted.collapse&&!FX.includes(interrupted),id+': 다른 스킬로 중단');
        reset();S.best=a.unlock;cast(a);step(240);ok(!c.keep.get(),id+': 짝 미해금은 자연 소멸');
        reset();CH={mods:[DMODS.find(x=>x.id==='chain')]};cast(a);const long=c.keep.get();until(()=>gt-lastCast.t>=15.7);
        ok(c.keep.get()===long&&activeLink()?.left>0,id+': 도전 16초 동일 물체 유지');cast(b);until(()=>long.consumed);ok(long.consumed,id+': 16초 직전 인계');
        reset();cast(a);until(()=>castLock<=0);FX=[];cds[b.id]=0;cast(b);ok(!pendingCombo,id+': 소실 물체 연계 금지');
        reset();hits=[];let emitted=0,colors=[];const push=P.push;P.push=function(...args){emitted+=args.length;colors.push(...args.map(p=>p.color));return push.apply(this,args)};
        ok(previewCombo(c),id+': 시작부터 전체 시연');const demo=c.keep.get();step(350);
        ok(demo.claimed&&demo.consumed&&hits.every(h=>h.pm===.1),id+': 시연 원본 인계/피해 10%');
        ok(Math.abs(hits.reduce((n,h)=>n+h.mult,0)-total)<1e-8&&hits.filter(h=>h.sid==='combo').length===1,id+': 시작+마무리+16배, 중복 발동 없음');
        ok(hits.at(-1)?.name===c.name&&hits.at(-1)?.crack===2,id+': 마지막 연계 이름/균열');
        ok(emitted<=100&&colors.every(col=>SPIRIT_COL.includes(col)),id+': 입자 100개 이하/금색 없는 5색 ('+emitted+')');delete P.push;
      }
      const a=AWK.find(a=>a.id==='ascension');ok(a.name==='음양승천'&&a.unlock===295&&SCHOOLS.find(s=>s.id==='spirit').awk===a.id,'음양승천 배정/계열');
      reset();S.awkSel=a.id;S.best=294;ok(awkSel().id==='thousand','음양승천 294 잠금');S.unlockFloor=295;ok(awkSel()===a,'음양승천 ub 295 해금');
      for(const [tr,lv] of [[0,0],[1,5],[2,10],[3,20]]){reset();S.lv.skill=lv;ST=stats();ST.cc=0;hits=[];S.awkSel=a.id;gauge=100;
        ok(castAwaken()&&gauge===0&&CUT.name===a.name,'음양승천 TR '+tr+' 게이지/컷인');step(330);
        ok(Math.abs(hits.reduce((n,h)=>n+h.mult,0)-(48+6*tr))<1e-8&&hits.every(h=>h.pm===1&&h.sid===a.id),'음양승천 TR '+tr+' 설관 이하 피해');
        ok(hits.at(-1)?.heavy&&hits.at(-1)?.crack===2,'음양승천 TR '+tr+' 마지막 강타/균열');
      }
      reset();hits=[];a.fn(.1);const awk=FX.find(o=>o.ascension);ok(awk?.dur===2.8,'음양승천 화면 연출 2.8초');
      let grayFrames=0,grayAwk=true;for(let i=0;i<150;i++){const frozen=stop>0;desat=0;update(1/60);if(!frozen&&FX.includes(awk)){grayFrames++;grayAwk=grayAwk&&desat===1}}ok(grayFrames>60&&grayAwk,'음양승천 모든 월드 프레임 흑백 유지')
      step(200);ok(hits.every(h=>h.pm===.1)&&FX.length===0,'음양승천 시연/종료');reset();a.fn(1);m=null;step(330);ok(FX.length===0,'음양승천 대상 소멸 안전');
      reset();let emitted=0,colors=[];const push=P.push;P.push=function(...args){emitted+=args.length;colors.push(...args.map(p=>p.color));return push.apply(this,args)};a.fn(.1);step(330);
      ok(emitted<=100&&colors.every(col=>SPIRIT_COL.includes(col)),'음양승천 100개 이하 수묵 입자: '+emitted);delete P.push;
      // 전용 도형의 실제 fill/stroke 색을 수집한다. 배경·공용 컷인은 포함하지 않는다.
      for(const run of [()=>castKoi(.1),()=>castCrane(.1),()=>castTurtle(.1),()=>castTiger(.1),()=>previewCombo(comboOf('koi')),()=>previewCombo(comboOf('turtle')),()=>a.fn(.1)]){
        reset();const paint=[],fill=ctx.fill,stroke=ctx.stroke,rect=ctx.fillRect;
        ctx.fill=function(...args){paint.push(this.fillStyle);return fill.apply(this,args)};ctx.stroke=function(...args){paint.push(this.strokeStyle);return stroke.apply(this,args)};ctx.fillRect=function(...args){paint.push(this.fillStyle);return rect.apply(this,args)};
        try{run();const gold=FX.some(o=>o.ascension);for(let i=0;i<400;i++){update(1/60);if(i%8===0)for(const f of FX)if(f.post)f.post(f)}
          const allowed=(gold?SPIRIT_COL.concat('#FFD45B'):SPIRIT_COL).map(c=>c.toLowerCase());ok(paint.length>0&&paint.every(c=>allowed.includes(c.toLowerCase())),'수묵 도형 팔레트/각성기만 금색');if(gold)ok(paint.includes('#ffd45b'),'음양승천 금색 실제 그리기');
        }finally{ctx.fill=fill;ctx.stroke=stroke;ctx.fillRect=rect}
      }

      // 설계서 14장: 집중 추가타는 공격력 기준이며 스킬 배율 ST.sk를 곱하지 않는다.
      for(const xp of [0,9,10,24,25]){reset();setLoadout(['koi','turtle']);S.mastery.spirit=xp;ST.sk=7;const seen=[];
        deal=function(d,crit,src,x,y,o){if(o?.sid==='spirit_focus')seen.push(d);return originalDeal(d,crit,src,x,y,o)};
        triggerResonanceCombo(comboOf('koi'),false,0);ok(gauge===(xp>=25?10*ST.gg:0),'묵령 숙련 '+xp+': 연계 발동 게이지 +10');step(65);
        ok(seen.length===1&&seen[0]===ST.atk*4,'묵령 숙련 '+xp+': 영수 1마리 공격력 ×4');
        m.boss=true;bossT=1e6;h.stun=0;resolveHit({ty:'slam'},1,false);ok(h.stun===(xp>=10?.65:1.3),'묵령 숙련 '+xp+': 보스 기절 -50% 경계');
      }
      deal=originalDeal;
      reset();setLoadout(['koi']);triggerSpiritFocus();ok(!FX.some(f=>f.spiritStrike),'한 쌍만으로 집중 영수 발동하지 않음');
      reset();setLoadout(['koi','turtle']);S.best=309;S.mastery.spirit=25;triggerSpiritFocus();ok(!FX.some(f=>f.spiritStrike)&&gauge===0,'짝 미해금은 집중/게이지 발동 없음');
      reset();setLoadout(['koi','turtle']);S.mastery.spirit=25;gauge=97;triggerSpiritFocus();ok(gauge===100,'집중 게이지 100 상한');
      reset();setLoadout(['koi','turtle']);S.mastery.spirit=25;previewCombo(comboOf('koi'));step(400);ok(!T.some(t=>t.text==='영수 현신!')&&gauge<10,'시연에서 집중 추가타/보너스 충전 제외');
      reset();setLoadout(['koi','turtle']);S.mastery.spirit=10;resolveHit({ty:'slam'},1,false);ok(h.stun===1.3,'현무 가호는 일반 몬스터 공격 제외');
      m.boss=true;for(const mode of ['shield','parry','evade']){h.stun=0;shieldOn=mode==='shield'?{}:null;resolveHit({ty:'slam',parry:mode==='parry'},1,mode==='evade');ok(h.stun===0,'현무 가호가 '+mode+' 우선순위 보존')}
      for(const n of [3,4])for(const parry of [false,true]){reset();setLoadout(['koi','turtle']);S.mastery.spirit=10;m.boss=true;bossT=1e6;
        const p={ty:'orbs',t:0,evade:false,orbs:Array.from({length:n},(_,i)=>({imp:1.2+i*.4,res:0,parry:parry&&i===0}))};m.pat=p;
        for(const orb of p.orbs)resolveBossOrb(p,orb);const expected=.65*(parry?(n-1)/n:1);
        ok(Math.abs(h.stun-expected)<1e-9&&Math.abs(p.stunTotal-expected)<1e-9,'현무 가호 '+n+'구체/부분 패링 '+parry+' 기절 합산');
      }
      reset();setLoadout(['koi','turtle']);S.mastery.spirit=10;m.boss=true;h.stun=2;resolveHit({ty:'orbs'},1/3,false);ok(Math.abs(h.stun-(2+.65/3))<1e-9,'현무 가호는 기존 기절을 줄이지 않고 새 피해만 감소');
      reset();setLoadout(['koi','turtle']);S.mastery.spirit=10;m.boss=true;setLoadout(['koi']);resolveHit({ty:'slam'},1,false);ok(h.stun===1.3,'집중 해제 즉시 보스 기절 복원');
      // 공명은 각각 빙결 연계 적중/실제 치명타에만 반응하고 추가타가 재귀하지 않는다.
      let extra=[];deal=function(d,crit,src,x,y,o){if(o?.sid?.startsWith('spirit_'))extra.push({d,crit,sid:o.sid});return originalDeal(d,crit,src,x,y,o)};
      for(const frozen of [false,true])for(const sid of ['combo','koi'])for(const pm of [1,.1]){
        reset();setLoadout(['koi','frostcut']);ST.sk=8;ST.cc=0;extra=[];m.freeze=frozen?5:0;originalHit(1,pm,monX,groundY,{sid,light:1});step(60);
        const yes=frozen&&sid==='combo'&&pm===1;ok(extra.length===(yes?1:0)&&extra.every(h=>h.d===ST.atk*4&&!h.crit&&h.sid==='spirit_koi'),'빙령유영 빙결 '+frozen+' / '+sid+' / pm '+pm+' 공격력 ×4');
      }
      reset();setLoadout(['koi']);m.freeze=5;extra=[];originalHit(1,1,monX,groundY,{sid:'combo',light:1});step(60);ok(extra.length===0,'빙정 미편성은 빙령유영 발동 없음');
      reset();setLoadout(['koi','frostcut']);m.freeze=5;extra=[];originalHit(1,1,monX,groundY,{sid:'combo',light:1});const old=m;m=makeMonster(1);m.state='fight';m.sh=0;m.hp=m.max=1e12;step(60);ok(extra.length===0&&old!==m,'빙령유영이 다음 적을 잘못 타격하지 않음');
      reset();setLoadout(['koi','frostcut']);extra=[];m.freeze=5;m.hp=1;originalHit(10,1,monX,groundY,{sid:'combo',light:1});ok(!FX.some(f=>f.spiritStrike==='spirit_koi'),'죽은 적에게 빙령유영 예약하지 않음');
      reset();setLoadout(['koi','breath']);ST.sk=9;extra=[];const hit=(crit=true)=>deal(1,crit,'hero',monX,groundY,{light:1});
      hit(false);ok(!FX.some(f=>f.spiritStrike),'비치명타는 혈호포효 발동 없음');hit();const atTime=gt,ready=spiritClawState.readyAt;
      ok(ready===atTime+3&&T.some(t=>t.text==='혈호포효!'),'혈호포효 이름/3게임초 쿨');hit();step(60);
      ok(extra.length===1&&extra[0].d===ST.atk*2&&!extra[0].crit,'연속 치명타는 발톱 1회 공격력 ×2, 재귀 없음');
      gt=ready-.001;hit();ok(spiritClawState.readyAt===ready,'3초 직전 발톱 재사용 불가');gt=ready;hit();step(60);ok(extra.length===2,'3초 경계에서 발톱 재사용');
      reset();setLoadout(['koi','breath']);ST.cc=1;extra=[];originalHit(1,.1,monX,groundY,{sid:'koi',light:1});step(60);ok(extra.length===0,'치명타 시연은 혈호포효 발동 없음');
      reset();setLoadout(['koi','breath','dash','spear']);S.mastery.storm=25;extra=[];originalHit(1,.1,monX,groundY,{sid:'combo',heavy:1});step(100);ok(extra.length===0,'시연의 확정 치명 낙뢰에도 혈호포효 발동 없음');
      reset();setLoadout(['koi','breath']);ST.atk=100;ST.sk=9;extra=[];const health=m.hp;deal(1,true,'hero',monX,groundY,{light:1});step(60);ok(Math.abs(health-m.hp-201)<.001,'혈호포효 실제 체력 감소 1+공격력 2배, 스킬 배율 제외');
      reset();setLoadout(['koi','frostcut']);ST.atk=100;ST.sk=9;m.freeze=5;extra=[];const frozenHP=m.hp;deal(1,false,'skill',monX,groundY,{sid:'combo',light:1});step(60);ok(Math.abs(frozenHP-m.hp-401)<.001,'빙령유영 실제 체력 감소 1+공격력 4배, 스킬 배율 제외');
      reset();setLoadout(['koi']);extra=[];hit();step(60);ok(extra.length===0,'진홍 미편성은 혈호포효 발동 없음');
      reset();setLoadout(['koi','breath']);extra=[];hit();const saved=JSON.parse(JSON.stringify(S));load(saved);ST=stats();hit();step(60);ok(extra.length===1&&spiritClawState.owner===S,'발톱 재사용은 저장하지 않고 옛 상태 추가타도 인계하지 않음');
      deal=originalDeal;reset();setLoadout(['koi','turtle']);ST.cc=0;S.awkSel='ascension';Math.random=()=>.5;let hp=m.hp;originalHit(2,1,monX,groundY,{sid:'ascension',light:1});ok(Math.abs(hp-m.hp-ST.atk*ST.sk*3)<.001,'묵령 집중 음양승천 피해 +50%');Math.random=random;
      reset();load({unlockV:2,best:310,mastery:{wuji:25},loadout:['koi','turtle']});ok(S.mastery.spirit===0&&S.mastery.wuji===25&&S.equip.join()==='koi,crane,turtle,tiger','예전 저장 묵령 숙련 0 병합/편성 복원');load({...S,mastery:{...S.mastery,spirit:25}});ok(S.mastery.spirit===25,'묵령 숙련 저장 복원');
      load({best:72});ok(['koi','crane','turtle','tiger'].every(id=>!unlocked(skOf(id)))&&ub()===190,'옛 최고 72는 역사적 해금만 보존/묵령 잠김');
      reset();setLoadout(['koi','turtle','frostcut','breath']);schoolOpen='spirit';buildBook();buildBar();
      ok($('schoolCards').querySelector('[data-school="spirit"]').textContent.includes('음양승천'),'계열 카드 음양승천 표시');ok(['frost_spirit','crimson_spirit'].every(id=>$('schoolEffects').querySelector('[data-effect="'+id+'"]')?.textContent.includes(RESONANCES.find(r=>r.id===id).name)),'빙령유영/혈호포효 칩과 설명');

      const started=performance.now();let result;for(let i=0;i<10;i++)result=recommendLoadout(310);const elapsed=performance.now()-started;ok(elapsed<1000&&result.length===4,'10계열 추천 10회 <1초: '+elapsed.toFixed(1)+'ms');lines.push('10계열 추천 10회: '+elapsed.toFixed(1)+'ms');

    }finally{skillHit=originalHit;deal=originalDeal;Math.random=random;cast=originalCast;reset();m=null;buildBook();buildBar()}
  });

  section('추천 편성 · 이전 구현과 완전 일치 · 확장 성능');
  guard('추천 기준 답안',()=>{
    const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b),before=JSON.stringify(S),benchmarks=[],referenceBench=new URLSearchParams(location.search).has('referencebench');
    for(let total=0;total<=8;total++)for(let n=0;n<=Math.min(4,total);n++){const old=[];for(let mask=0;mask<2**total;mask++){const chosen=Array.from({length:total},(_,i)=>i).filter(i=>mask&(1<<i));if(chosen.length===n)old.push(chosen.join(','))}ok(equal([...choiceIndices(total,n)].map(a=>a.join(',')).sort(),old.sort()),'독립 정답 탐색의 후보 전체 보존 '+total+'개 중 '+n+'개')}
    const compare=(best,keep)=>{const actual=recommendLoadout(best,keep),expected=referenceLoadout(best,keep);ok(equal(actual,expected),'추천 기준 답안 일치 @'+best+' keep='+JSON.stringify(keep));ok(equal(actual.slice(0,cleanLoadout(keep).length),cleanLoadout(keep)),'고정 칸의 순서/잠긴 쌍/정리 규칙 유지')};
    const levels=[...new Set([0,1,999,...SK.flatMap(s=>[s.unlock-1,s.unlock]),...AWK.map(a=>a.unlock)])];
    for(const best of levels){for(const keep of [[],['gravity'],['turtle','koi'],['talisman','dash','talisman','invalid'],['shield','orb','swords'],['tiger',null,'inkrain','breath','dash','spear']])compare(best,keep)}
    for(let i=0;i<COMBOS.length;i++){compare(310,[COMBOS[i].a]);for(let j=i+1;j<COMBOS.length;j++)compare(310,[COMBOS[j].a,COMBOS[i].a])}
    for(const keep of [null,'broken',[],COMBOS.map(c=>c.a),['bad',null,7],['turtle','koi','gravity','dash']])compare(1,keep);
    const comboOrder=COMBOS.slice(),schoolOrder=SCHOOLS.slice();
    try{COMBOS.reverse();SCHOOLS.reverse();for(const best of [1,70,155,205,250,300,999])for(const keep of [[],['koi'],['turtle','koi'],['shield','dash','swords']])compare(best,keep)}
    finally{COMBOS.splice(0,COMBOS.length,...comboOrder);SCHOOLS.splice(0,SCHOOLS.length,...schoolOrder)}
    ok(JSON.stringify(S)===before,'추천 기준 답안 비교가 저장 상태를 바꾸지 않음');
    const measure=(fn,count=10)=>{const t=performance.now();for(let i=0;i<count;i++)fn(999);return performance.now()-t};
    // 캐시로 같은 결과를 재사용하지 않는다. 매번 계열 분배와 모든 동률 조건을 다시 계산한다.
    const old10=referenceBench?measure(referenceLoadout):null,new10=measure(recommendLoadout);benchmarks.push({schools:10,count:10,before:old10,after:new10});
    ok(new10<=100,'10계열 추천 10회 ≤100ms: '+new10.toFixed(1));
    const lengths=[SCHOOLS.length,COMBOS.length,SK.length,RESONANCES.length];
    try{
      for(let i=0;i<5;i++){const id='test_school_'+i,pairs=[];for(let j=0;j<2;j++){const a=id+'_'+j,b=a+'_end';pairs.push(a);SK.push({id:a,unlock:320+i*40+j*20},{id:b,unlock:330+i*40+j*20});COMBOS.push({school:id,a,b})}
        SCHOOLS.push({id,pairs});RESONANCES.push({id:'test_res_'+i,a:i?'test_school_'+(i-1):'spirit',b:id});
      }
      for(const [best,keep] of [[0,[]],[319,[]],[320,['test_school_4_1']],[350,['test_school_0_1','turtle']],[999,[]],[999,['test_school_4_1']],[999,['test_school_4_1','test_school_2_0']],[999,['koi','test_school_1_0','dash']]])compare(best,keep);
      const old15=referenceBench?measure(referenceLoadout):null,new15=measure(recommendLoadout);benchmarks.push({schools:15,count:10,before:old15,after:new15});ok(new15<=1000,'15계열 추천 10회 ≤1초: '+new15.toFixed(1));
    }finally{SCHOOLS.length=lengths[0];COMBOS.length=lengths[1];SK.length=lengths[2];RESONANCES.length=lengths[3]}
    for(const b of benchmarks)lines.push(b.schools+'계열 추천 '+b.count+'회: '+(b.before===null?'':'이전 '+b.before.toFixed(1)+'ms → ')+b.after.toFixed(1)+'ms');
    window.__recommendBenchmarks=benchmarks;
  });

  section('계열 공통 · 자동 전투 · 해금');
  guard('계열 공통',()=>{try{
    for(const school of SCHOOLS){
      // 기존 수묵 3계열은 원래 3쌍 편성을 그대로 쓴다. 다른 계열에도 두 속도 검사를 확장한다.
      const third=['ink','wuji','spirit'].includes(school.id)?'gravity':COMBOS.find(c=>c.school!==school.id&&c.a==='dash')?.a||'gravity';
      for(const speed of [1,2])checkAuto(testReset,()=>setLoadout(school.pairs.concat(third)),school.name+' '+speed+'배',speed);
      if(!['ink','wuji','spirit'].includes(school.id))for(const sk of schoolSkills(school))checkUnlock(sk,testReset);
      const skills=schoolSkills(school),first=Math.min(...skills.map(s=>s.unlock)),last=Math.max(...skills.map(s=>s.unlock));
      for(const [stage,text] of [[first,'새 계열: '+school.name],[last,school.name+' 완성 · 집중 가능']]){
        // STAGE 1 계열은 새 게임부터 활성. 최초 안내는 기존 동작에 따라 건너뛴다.
        if(stage<=1)continue;testReset();S.best=stage-1;schoolSeenState=null;schoolNotices=[];uiTick();S.best=stage;
        if(['abyss','frost','ink'].includes(school.id))BN={text:'새 스킬 해금',t:0,dur:2};
        uiTick();ok(BN?.text===text,school.name+': 해금 배너 '+stage);BN=null;uiTick();ok(!BN,school.name+': 같은 해금 반복 없음 '+stage);
      }
    }
  }finally{testReset();m=null;buildBook();buildBar()}});

  section('정리');
  guard('정리',()=>{tick(600);ok(FX.length===0,'연출이 끝나지 않고 남아 있음: '+FX.length+'개');ok(castLock<=0,'castLock이 풀리지 않음');ok(desat===0,'흑백(desat)이 풀리지 않고 남아 있음: '+desat)});

  section('진홍·빙정 효과음 · 저장 · 재생 제한');
  guard('효과음',()=>runAudioSelftest(ok,testReset,persistForAudio));

  section('CC0 파일 · 캐시 · 대체음');
  try{await runFileAudioSelftest(ok)}catch(e){ok(false,'파일 음원 검사: '+e.message)}

  section('수련장 별도 문서');
  const labFrame=document.createElement('iframe');labFrame.style.cssText='position:fixed;left:-2000px;width:390px;height:844px';labFrame.src='?lab&selftest';document.body.appendChild(labFrame);
  try{const deadline=performance.now()+25000;while(!labFrame.contentWindow?.__selftest&&performance.now()<deadline)await new Promise(r=>setTimeout(r,25));
    const result=labFrame.contentWindow?.__selftest;ok(!!result,'수련장 별도 문서 점검 완료');if(result){pass+=result.pass;fail+=result.fail;lines.push(...result.lines);window.__labSelftest=result}
  }catch(e){ok(false,'수련장 문서 예외: '+e.message)}finally{labFrame.remove()}
  ok(!LAB_MODE,'기존 전투 점검은 일반 모드에서 실행');ok(document.querySelectorAll('.lab-link').length===SK.length+COMBOS.length+AWK.length,'기존 시연 옆 수련장 링크 전체');

  closeSection();const elapsedMs=performance.now()-startedAt,box=document.createElement('div');
  box.style.cssText='position:fixed;right:12px;top:12px;z-index:99;max-width:min(520px,92vw);max-height:80vh;overflow:auto;background:#0e0b1d;color:#f0ebff;border:2px solid '+(fail?'#ff4f5e':'#7cf29a')+';border-radius:12px;padding:14px;font:12px/1.6 "Noto Sans KR",sans-serif;white-space:pre-wrap';
  lines.push('구간별 시간: '+timings.map(t=>t.name+' '+(t.ms/1000).toFixed(2)+'초').join(' / '));
  box.textContent=(fail?'자가 점검 실패':'자가 점검 통과')+` · 통과 ${pass} · 실패 ${fail} · ${(elapsedMs/1000).toFixed(1)}초\n`+lines.join('\n');
  document.body.appendChild(box);
  window.__selftest={pass,fail,lines,elapsedMs,timings,autoResults};console.log('[selftest]',pass,'pass',fail,'fail',(elapsedMs/1000).toFixed(1)+'s',lines.join('\n'));
})();
