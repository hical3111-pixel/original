'use strict';
/* 실제 ?lab 문서에서 부팅 이후에도 저장/전투 진행이 없는지 확인한다. */
(()=>{
  const startedAt=performance.now(),lines=[];let pass=0,fail=0,frames=0;
  const ok=(v,n)=>{if(v)pass++;else{fail++;lines.push('✗ '+n)}},guard=(n,fn)=>{try{fn()}catch(e){fail++;lines.push('✗ '+n+': '+e.message)}};
  S.sound=false;lab.repeat=false;
  const step=n=>{for(let i=0;i<n;i++){update(1/60);labTick(1/60);if(++frames%12===0)render()}};
  const finish=()=>{let n=0;while(lab.playing&&n++<3600)step(1);render();return !lab.playing};
  const clean=()=>!FX.length&&!P.length&&!T.length&&!CR.length&&!C.length&&!B.length&&!PR.length&&!castLock&&!CUT&&!BN&&!shieldOn&&!lastCast&&!pendingCombo&&!circleT&&!frenzyT&&!desat&&h.ox===null&&!h.hide;
  guard('수련장 시작',()=>{
    ok(LAB_MODE&&document.body.classList.contains('lab-mode'),'실제 lab 문서/전용 패널');
    ok(document.querySelectorAll('.lab-item').length===SK.length+COMBOS.length+AWK.length,'모든 스킬/연계/각성기 목록');
    ok(document.querySelectorAll('.lab-school').length===SCHOOLS.length+1,'모든 계열/그 외 각성기');
    ok(S.best===1&&!S.auto&&!S.loadout.length,'잠금 상태에서도 자동 전투/집중 없는 격리 상태');
    ok($('modal').hidden&&!$('blessPicker').open,'오프라인/축복 창 없음');
    const before=JSON.stringify(S);labClear();step(600);cv.dispatchEvent(new PointerEvent('pointerdown',{clientX:100,clientY:100}));
    ok(JSON.stringify(S)===before&&!T.length&&!FX.length&&!PR.length&&!B.length,'대기/탭으로 전투·보상·업적·축복 변화 없음');
  });
  const originalHit=skillHit;let hits=[];skillHit=function(mult,pm,x,y,o){hits.push({pm,sid:o?.sid});return originalHit(mult,pm,x,y,o)};
  for(const [kind,list] of [['skill',SK],['combo',COMBOS],['awk',AWK]])for(const item of list)guard(kind+' '+item.name,()=>{
    const id=kind==='combo'?item.a:item.id;hits=[];const before=JSON.stringify(S);labClear();ok(clean(),item.name+': 시작 전 정리');
    ok(labPlay(kind,id),item.name+': 해금/쿨타임 무관 재생');
    const kept=item.keep?.get();ok(finish(),item.name+': 전체 재생 종료');
    ok(m.hp===Infinity&&m.state==='fight'&&!m.boss&&!m.pat,item.name+': 불사 허수아비/공격 없음');
    const hitPower=kind==='awk'&&['dragon','inferno'].includes(id)?2.5:1;ok(hits.every(h=>h.pm===hitPower),item.name+': pm=1 진입, 기존 각성기 ×2.5 포함 실전 배율');
    if(kind==='combo'){
      ok(hits.some(h=>h.sid===item.a)||skOf(item.a).buff,item.name+': 시작 스킬부터 재생');
      ok(hits.some(h=>h.sid==='combo'),item.name+': 연계 적중');
      if(item.keep)ok(kept?.claimed&&kept.consumed,item.name+': 원본 keep 인계/소모');
    }
    ok(JSON.stringify(S)===before,item.name+': 성장·재화·업적·축복 상태 불변');
    labClear();ok(clean(),item.name+': 끝난 연출 정리');
    labPlay(kind,id);step(15);labClear();ok(clean(),item.name+': 도중 교체 정리');
  });
  for(const branch of ['a','b'])for(const sk of SK)guard(sk.id+' 분기 '+branch,()=>{
    const prev=S.awk[sk.id];S.awk[sk.id]=branch;hits=[];labPlay('skill',sk.id);ok(finish()&&hits.every(h=>h.pm===1),sk.id+': '+branch+' 분기 재생/실전 배율');labClear();if(prev)S.awk[sk.id]=prev;else delete S.awk[sk.id];
  });
  skillHit=originalHit;
  guard('재생 제어/실제 공격력/저장',()=>{
    labClear();for(const speed of [.5,1,2]){lab.speed=speed;const t=gt;step(60);ok(Math.abs(gt-t-speed)<1e-7,'수련장 ×'+speed+' 실제 진행 비율')}
    lab.speed=1;const lv=S.lv.skill,atk=ST.atk;for(const tr of [0,1,2,3]){$('labTier').value=tr;$('labTier').dispatchEvent(new Event('change'));ok(tier()===tr&&S.lv.skill===lv&&ST.atk===atk,'★'+tr+': 연출만 변경, 성장/공격력 보존')}
    labClear();const oldCC=ST.cc;ST.cc=0;const expected=ST.atk*ST.sk;skillHit(1,1,monX,groundY,{light:1});ok(T.length===1&&Number(T[0].text.replaceAll(',',''))!==0,'실제 피해 숫자 표시');ok(m.hp===Infinity,'실제 피해에도 HP 무한');ST.cc=oldCC;
    const originalDeal=deal;let damage=0;deal=(d,...args)=>{damage=d;return originalDeal(d,...args)};ST.cc=0;skillHit(1,1,monX,groundY,{light:1});deal=originalDeal;ST.cc=oldCC;ok(damage>=expected*.9&&damage<=expected*1.1,'저장된 공격력 × 스킬 배율 적용');
    lab.repeat=true;labPlay('skill','cannon');const plays=lab.plays;for(let i=0;i<2400&&lab.plays===plays;i++)step(1);ok(lab.plays>plays,'반복 재생');$('labStop').click();ok(!lab.repeat&&clean(),'정지 버튼 반복 해제/정리');
    $('labSound').click();ok(S.sound,'소리 켜기');$('labSound').click();ok(!S.sound,'소리 끄기');
    const snap=JSON.stringify(S);for(let i=0;i<130;i++)frame(performance.now()+i*50);document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pagehide'));
    ok(JSON.stringify(S)===snap,'실제 frame/탭 전환/닫기 상태 불변');
    ok(window.__labAudit?.save===0,'부팅부터 save 호출 0회');ok(window.__labAudit?.writes===0,'부팅부터 localStorage 쓰기/삭제 0회');
  });
  labClear();window.__selftest={pass,fail,lines,elapsedMs:performance.now()-startedAt,audit:window.__labAudit};
  if(window===window.parent){const box=document.createElement('pre');box.textContent=`수련장 점검 · 통과 ${pass} · 실패 ${fail} · ${(window.__selftest.elapsedMs/1000).toFixed(2)}초\n`+lines.join('\n');box.style.cssText='position:fixed;top:0;right:0;z-index:99;background:#17132b;max-height:80vh;overflow:auto';document.body.appendChild(box)}
})();
