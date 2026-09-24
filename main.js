'use strict';
/* ================= resize ================= */
function resize(){
  const r=stageEl.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);
  DPR=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
  U=clamp(Math.min(W/900,H/520),.55,1.5);groundY=H*.76;heroX=W*.29;monX=W*.69;
  const gi=$('goldIco').getBoundingClientRect();gx=gi.left-r.left+gi.width/2;gy=gi.top-r.top+gi.height/2;
  VIG=ctx.createRadialGradient(W/2,H*.5,Math.min(W,H)*.3,W/2,H*.5,Math.max(W,H)*.78);
  VIG.addColorStop(0,'rgba(0,0,0,0)');VIG.addColorStop(1,'rgba(0,0,0,.62)');
  if(m&&m.state==='fight'&&!m.mini)m.x=monX;
  stars=[];for(let i=0;i<80;i++)stars.push({x:rnd(0,W),y:rnd(0,groundY*.72),s:rnd(.5,1.8),ph:rnd(0,6),sp:rnd(1,3)});
}

/* ================= boss patterns ================= */
let bossMax=30;
function startPat(){
  const pool=m.enraged?['slam','beam','charge','rain','rain']:['slam','beam','charge'],ty=pool[Math.floor(Math.random()*pool.length)];
  m.pat={ty,t:0,imp:{slam:1.5,beam:1.25,charge:1.4,rain:1.5}[ty],end:{slam:1.9,beam:1.75,charge:1.9,rain:1.9}[ty],res:0,parry:false};sfx.warn();
  const sh=SK.find(s=>s.id==='shield');if(S.auto&&equipped(sh)&&unlocked(sh)&&cds.shield<=0&&castLock<=0)cast(sh);
}
function bossAI(dt){
  if(!m||!m.boss||m.state!=='fight')return;
  if(m.stun>0){m.stun-=dt;m.pat=null;return}
  if(!m.pat){m.atkT-=dt;if(m.atkT<=0)startPat();return}
  const p=m.pat;p.t+=dt*(m.enraged?1.3:1);const R=m.rb*U;
  if(p.ty==='slam'){
    if(p.t<1){m.sq=.14*Math.min(1,p.t/.8);m.sqv=0}
    else if(p.t<1.2){m.lyT=-190*U*Math.sin((p.t-1)/.2*Math.PI);m.lyF=60}
    at(p,1.2,()=>{sfx.land();addTrauma(.6);m.sqv=9;P.push({t:'ring',x:m.x,y:groundY,r0:10*U,r1:260*U,w:8*U,sy:.2,life:.5,max:.5,color:'#ff4f5e'});smoke(m.x,groundY-10*U,8,'#3a2a2a',.8)});
    if(p.t>1.2&&p.t<1.5){const wx=lerp(m.x-R,heroX+20*U,(p.t-1.2)/.3);if(!p.lw||p.lw-wx>22*U){p.lw=wx;spike(wx,rnd(20,34)*U,rnd(40,80)*U,-.3,1,'#3a0a10','#ff4f5e',.5);
      P.push({t:'smoke',x:wx,y:groundY-8*U,vx:rnd(-60,60)*U,vy:-rnd(20,80)*U,drag:2,r0:8*U,r1:30*U,life:.5,max:.5,color:'#3a2a2a'})}}
  }else if(p.ty==='beam'){
    if(p.t<1.2&&Math.random()<dt*40){const c=mCenter(m),a=rnd(0,7),r=rnd(40,90)*U;P.push({t:'dot',x:c.x+Math.cos(a)*r,y:c.y+Math.sin(a)*r,vx:-Math.cos(a)*r/.25,vy:-Math.sin(a)*r/.25,g:0,drag:0,size:2.5*U,life:.25,max:.25,color:'#ff2a3a'})}
    at(p,1.2,()=>{sfx.beam();addTrauma(.4)});
    if(p.t>1.2&&p.t<1.6)addTrauma(dt*.8);
  }else if(p.ty==='rain'){
    if(!p.tg)p.tg=[-45,35,0].map((o,i)=>({x:heroX+(o+rnd(-12,12))*U,hit:1+i*.25}));
    for(const g of p.tg)if(!g.done&&p.t>=g.hit){g.done=1;burst(g.x,groundY-20*U,['#ff2a3a','#ffb0b8','#fff'],18,900,-Math.PI/2);
      P.push({t:'ring',x:g.x,y:groundY,r0:6*U,r1:90*U,w:6*U,sy:.3,life:.35,max:.35,color:'#ff2a3a'});smoke(g.x,groundY-10*U,4,'#3a0a14',.6);addTrauma(.3);sfx.boom()}
  }else{
    if(p.t<1.2){m.pxT=28*U*Math.min(1,p.t/.6)}
    else if(p.t<1.4){m.pxT=lerp(28*U,heroX+75*U-m.x,easeIn((p.t-1.2)/.2));m.pxF=50;if(Math.random()<.6)P.push({t:'ghost',x:m.x+m.px,y:groundY,col:`hsl(${m.hue},60%,50%)`,lean:0,ang:0,life:.15,max:.15})}
    else{m.pxT=lerp(heroX+75*U-m.x,0,easeOut(Math.min(1,(p.t-1.4)/.45)));m.pxF=50}
  }
  if(!p.res&&p.t>=p.imp){p.res=1;resolveHit(p)}
  if(m.pat&&p.t>=p.end){m.pat=null;m.atkT=rnd(4.5,7)/(m.enraged?1.6:1)/(hasMod('fury')?2:1)}
}
function resolveHit(p){
  const hx=heroX,hy=groundY-60*U,c=mCenter(m);
  if(shieldOn){shieldOn.blocked=true;
    if(br('shield')==='a'){P.push({t:'streak',x:hx+75*U,y:hy,x2:c.x,y2:c.y,life:.3,max:.3,w:16*U,color:'#e8dcff'});P.push({t:'glow',x:c.x,y:c.y,size:150*U,life:.3,max:.3,color:'#b7a6ff'});
      deal(ST.atk*ST.sk*6,true,'skill',c.x,c.y,{heavy:1,name:'반사 결정',col:'#e8dcff',fc:'210,195,255',crack:1,sid:'shield'})}
    P.push({t:'star',x:hx+75*U,y:hy-10*U,size:140*U,life:.15,max:.15});burst(hx+75*U,hy,['#e8dcff','#b7a6ff','#fff'],24,1000);
    T.push({x:hx+40*U,y:hy-70*U,vx:0,vy:-90*U,text:'막기!',crit:1,label:'',size:40,life:1,max:1,color:'#d9ccff'});sfx.parry();stop=Math.max(stop,.1);addTrauma(.35);if(p.ty==='charge')m.kv+=900*U;return}
  if(p.parry){S.parries++;sfx.parry();flash(.8,'255,240,190');stop=Math.max(stop,.22);slowT=.8;gauge=Math.min(100,gauge+15*ST.gg);
    T.push({x:hx+30*U,y:hy-80*U,vx:0,vy:-70*U,text:'패링!',crit:1,label:'PERFECT',lcol:'#fff',size:56,life:1.2,max:1.2,color:'#ffe066'});
    P.push({t:'ring',x:hx+50*U,y:hy,r0:10*U,r1:200*U,w:8*U,life:.4,max:.4,color:'#ffe066'});P.push({t:'star',x:hx+60*U,y:hy,size:160*U,life:.16,max:.16});burst(hx+60*U,hy,['#ffe066','#fff'],30,1200);
    m.stun=2.2;m.pat=null;m.kv+=1100*U;deal(ST.atk*8,true,'hero',c.x,c.y,{heavy:1,name:'반격',col:'#ffe066'});return}
  if(rv('phoenix')){for(let i=0;i<16;i++)P.push({t:'flame',x:hx+rnd(-40,40)*U,y:groundY-rnd(0,60)*U,vx:rnd(-40,40)*U,vy:-rnd(200,420)*U,drag:1,g:0,r:rnd(12,26)*U,cols:['#7a1606','#ff8a2a','#ffe08a'],life:rnd(.4,.8),max:.8});
    T.push({x:hx,y:hy-80*U,vx:0,vy:-80*U,text:'불사조!',crit:1,label:'',size:40,life:1,max:1,color:'#ffb040'});
    deal(ST.atk*4*rv('phoenix'),false,'relic',c.x,c.y,{heavy:1,name:'불사조 반격',col:'#ffb040',fc:'255,190,110'});return}
  if(Math.random()<.55){h.dodgeT=0;sfx.whoosh();T.push({x:hx,y:hy-80*U,vx:0,vy:-80*U,text:'회피',crit:0,label:'',size:26,life:.8,max:.8,color:'#e0f6ff'});return}
  if(hasMod('glass')){burst(hx,hy,['#7fe8ff','#fff'],24,1000);chFail('유리 대포 — 기절하고 말았습니다');return}
  h.stun=1.3;flash(.5,'255,40,60');addTrauma(.8);sfx.hurt();burst(hx,hy,['#ff2a3a','#fff'],18,900);
  T.push({x:hx,y:hy-80*U,vx:0,vy:-80*U,text:'기절!',crit:1,label:'',size:36,life:1.1,max:1.1,color:'#ff4f5e'});
}

/* ================= boss intro cutscene ================= */
function startBossIntro(){BI={t:0,m};m.yo=-H;castLock=Math.max(castLock,.2);sfx.siren()}
function updBossIntro(dt){
  if(!BI)return;
  if(!m||m!==BI.m){BI=null;return}
  BI.t+=dt;const t=BI.t;
  if(m.state==='enter'){castLock=Math.max(castLock,.1);dimT=Math.max(dimT,t<1?.5:.35)}
  m.yo=t<.75?-H:t<1?lerp(-H,0,easeIn((t-.75)/.25)):0;
  at(BI,1,()=>{sfx.land();sfx.bigboom();stop=Math.max(stop,.12);addTrauma(1);zoom+=.1*FXS;flash(.45,'255,90,100');m.sqv=10;
    P.push({t:'ring',x:m.x,y:groundY,r0:10*U,r1:340*U,w:12*U,sy:.2,life:.7,max:.7,color:'#ff4f5e'});
    P.push({t:'ring',x:m.x,y:groundY,r0:10*U,r1:220*U,w:6*U,sy:.2,life:.45,max:.45,color:'#ffffff'});
    smoke(m.x,groundY-10*U,16,'#2a1a3e',1.3);rubble(m.x,m.rb*U*2.6,10,1.4);addCrack(m.x,groundY-20*U,false)});
  at(BI,1.15,()=>{sfx.roar();m.sqv=-8});
  if(t>1.15&&t<1.9){addTrauma(dt*1.4);m.sq=.1*Math.sin(t*45);m.sqv=0;zoom=Math.max(zoom,1+.08*FXS)}
  at(BI,2.55,()=>{if(m.state==='enter'){m.state='fight';bossMax=bossTime();bossT=bossMax;m.atkT=2.5;castLock=0;sfx.fanfare()}});
  if(t>3.25)BI=null;
}
function skipBossIntro(){if(!BI||!m||m.state!=='enter'||BI.t<.4)return false;BI.t=BI.t<1?1:Math.max(BI.t,2.5);return true}
function drawBossIntroWorld(){
  if(!BI||!m)return;const t=BI.t,r=m.rb*U;
  if(t<1){const k=clamp(t/1,0,1);ctx.fillStyle=`rgba(0,0,0,${.2+.45*k})`;ctx.beginPath();ctx.ellipse(m.x,groundY+2,r*(.3+.9*k),r*.22*(.3+.9*k),0,0,7);ctx.fill();
    ctx.strokeStyle=`rgba(255,42,58,${.5+.4*Math.sin(t*18)})`;ctx.lineWidth=3*U;ctx.beginPath();ctx.ellipse(m.x,groundY+2,r*1.4,r*.3,0,0,7);ctx.stroke()}
}
function drawBossRoar(){
  if(!BI||!m||BI.t<1.15||BI.t>1.9)return;const c=mCenter(m),k=(BI.t-1.15)/.75;
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#fff';ctx.lineCap='round';
  for(let i=0;i<22;i++){const a=rnd(0,Math.PI*2),r0=rnd(90,160)*U,r1=r0+rnd(120,300)*U;ctx.globalAlpha=(1-k)*rnd(.3,.8);ctx.lineWidth=rnd(1.5,4)*U;
    ctx.beginPath();ctx.moveTo(c.x+Math.cos(a)*r0,c.y+Math.sin(a)*r0);ctx.lineTo(c.x+Math.cos(a)*r1,c.y+Math.sin(a)*r1);ctx.stroke()}
  ctx.globalAlpha=(1-k)*.8;ctx.strokeStyle='#ff4f5e';ctx.lineWidth=5*U;ctx.beginPath();ctx.arc(c.x,c.y,m.rb*U*(1.3+k*2.4),0,7);ctx.stroke();
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
function drawBossIntro(){
  if(!BI||!m)return;const t=BI.t;
  const inK=easeOut(clamp(t/.3,0,1)),outK=easeIn(clamp((t-2.6)/.4,0,1)),bh=H*.11*inK*(1-outK);
  if(t<1.1){ctx.fillStyle=`rgba(255,20,40,${.1+.08*Math.sin(t*14)})`;ctx.fillRect(0,0,W,H)}
  if(bh>.5){ctx.fillStyle='#000';ctx.fillRect(0,0,W,bh);ctx.fillRect(0,H-bh,W,bh);
    const wa=t<2.3?1:Math.max(0,1-(t-2.3)/.3);
    if(wa>0){ctx.save();ctx.globalAlpha=wa;const fs=Math.max(11,Math.round(bh*.42));ctx.font=`${fs}px "Black Han Sans",sans-serif`;ctx.textBaseline='middle';ctx.textAlign='left';
      const msg='WARNING  ·  BOSS APPROACHING  ·  보스 접근 중  ·  ',mw=ctx.measureText(msg).width;
      for(const [y0,dir] of [[0,1],[H-bh,-1]]){ctx.save();ctx.beginPath();ctx.rect(0,y0,W,bh);ctx.clip();
        ctx.fillStyle='#ff2a3a';const sy=dir>0?y0+bh-6:y0,off=(t*120)%24;for(let x=-24+off*dir;x<W+24;x+=24){ctx.beginPath();ctx.moveTo(x,sy);ctx.lineTo(x+12,sy);ctx.lineTo(x+6,sy+6);ctx.lineTo(x-6,sy+6);ctx.closePath();ctx.fill()}
        ctx.fillStyle='rgba(255,60,80,.85)';const sx=-((t*140*dir)%mw+mw)%mw;for(let x=sx;x<W;x+=mw)ctx.fillText(msg,x,y0+bh/2);ctx.restore()}
      ctx.restore()}}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  if(t>.1&&t<.95){const a=Math.sin(t*16)>0?1:.35,fs=Math.round(Math.max(34,72*U));ctx.globalAlpha=a;ctx.font=`${fs}px "Black Han Sans",sans-serif`;
    ctx.lineWidth=8;ctx.strokeStyle='#000';ctx.strokeText('WARNING',W/2,H*.4);ctx.fillStyle='#ff2a3a';ctx.fillText('WARNING',W/2,H*.4);
    ctx.globalAlpha=1;ctx.font=`700 ${Math.round(Math.max(12,16*U))}px "Noto Sans KR",sans-serif`;ctx.fillStyle='#ffd0d6';ctx.fillText(`STAGE ${S.stage} · 강력한 기운이 다가옵니다`,W/2,H*.4+fs*.7)}
  if(t>1.3&&t<2.95){const k=easeOut(clamp((t-1.3)/.25,0,1)),out=easeIn(clamp((t-2.55)/.35,0,1)),x0=lerp(W,W*.06,k)-out*W*.15,y=bh+H*.12;
    ctx.save();ctx.globalAlpha=1-out;ctx.textAlign='left';let fs=Math.round(Math.max(24,50*U));ctx.font=`${fs}px "Black Han Sans",sans-serif`;
    while(ctx.measureText(m.name).width>W*.86&&fs>16){fs-=2;ctx.font=`${fs}px "Black Han Sans",sans-serif`}
    const nw=ctx.measureText(m.name).width;
    ctx.fillStyle='rgba(8,2,12,.7)';ctx.beginPath();ctx.moveTo(x0-16,y-fs*1.05);ctx.lineTo(x0+nw+40,y-fs*1.05);ctx.lineTo(x0+nw+14,y+fs*.75);ctx.lineTo(x0-16,y+fs*.75);ctx.closePath();ctx.fill();
    ctx.font=`700 ${Math.round(Math.max(11,13*U))}px "Noto Sans KR",sans-serif`;ctx.fillStyle='#ff4f5e';ctx.fillText(`STAGE ${S.stage}  ·  BOSS  ·  제한 시간 ${bossTime()}초`,x0,y-fs*.72);
    ctx.font=`${fs}px "Black Han Sans",sans-serif`;ctx.lineWidth=6;ctx.strokeStyle='#000';ctx.strokeText(m.name,x0,y);ctx.fillStyle='#fff';ctx.fillText(m.name,x0,y);
    const uk=easeOut(clamp((t-1.45)/.35,0,1));ctx.fillStyle='#ff2a3a';ctx.fillRect(x0,y+fs*.52,nw*uk,4*U);ctx.fillStyle='#fff';ctx.fillRect(x0,y+fs*.52+6*U,nw*uk*.6,1.5*U);
    ctx.restore()}
  if(t>2.55){const k=t-2.55,s=k<.15?lerp(2.2,1,easeOut(k/.15)):1,a=k>.45?Math.max(0,1-(k-.45)/.2):1;if(a>0){
    ctx.save();ctx.globalAlpha=a;ctx.translate(W/2,H*.42);ctx.scale(s,s);ctx.rotate(-.05);const fs=Math.round(Math.max(40,80*U));ctx.font=`${fs}px "Black Han Sans",sans-serif`;
    ctx.lineWidth=9;ctx.strokeStyle='#000';ctx.strokeText('전투 개시!',0,0);ctx.fillStyle='#ffc94a';ctx.fillText('전투 개시!',0,0);ctx.restore()}}
  if(t>.4&&m.state==='enter'){ctx.globalAlpha=.6;ctx.font=`700 ${Math.round(Math.max(11,12*U))}px "Noto Sans KR",sans-serif`;ctx.textAlign='right';ctx.fillStyle='#fff';ctx.fillText('화면을 누르면 건너뛰기 ▸',W-14,H-bh-14);ctx.globalAlpha=1}
}

/* ================= combo link hint ================= */
function drawLinkHint(){
  const L=activeLink();if(!L||BI)return;const c=L.c,a=skOf(c.a),b=skOf(c.b),eq=equipped(b);
  const txt=eq?`${b.name} 사용 시`:`${b.name} 미장착`,fs=Math.round(Math.max(12,14*U)),y=hintY||H-(W<560?64:90);
  ctx.save();ctx.font=`700 ${fs}px "Noto Sans KR",sans-serif`;const w1=ctx.measureText(txt).width;ctx.font=`${fs+3}px "Black Han Sans",sans-serif`;const w2=ctx.measureText(c.name).width;
  const pad=12,w=Math.min(W-20,w1+w2+pad*3+44),hh=fs*2.4,x=W/2-w/2,pul=L.left<2?1+.04*Math.sin(gt*30):1;
  ctx.translate(W/2,y);ctx.scale(pul,pul);ctx.translate(-W/2,-y);
  ctx.fillStyle='rgba(8,4,18,.85)';ctx.beginPath();ctx.roundRect(x,y-hh/2,w,hh,hh/2);ctx.fill();ctx.strokeStyle=c.col;ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=c.col;ctx.fillRect(x+hh/2,y+hh/2-4,(w-hh)*(L.left/comboWin()),2.5);
  ctx.textBaseline='middle';ctx.textAlign='left';let cx=x+pad+6;
  ctx.fillStyle='#ffd166';ctx.font=`900 ${fs-2}px "Noto Sans KR",sans-serif`;ctx.fillText('⛓',cx-2,y-1);cx+=18;
  ctx.fillStyle=eq?b.c:'#9d95c4';ctx.font=`700 ${fs}px "Noto Sans KR",sans-serif`;ctx.fillText(txt,cx,y-1);cx+=w1+8;
  ctx.fillStyle='#fff';ctx.fillText('→',cx,y-1);cx+=18;
  ctx.fillStyle=c.col;ctx.font=`${fs+3}px "Black Han Sans",sans-serif`;ctx.fillText(c.name,cx,y-1);
  ctx.restore();
}

/* ================= allies ================= */
function allyShoot(kind){
  const c=mCenter(m),r=m.rb*U;
  if(kind==='arrow'){const x=heroX-58*U,y=groundY-58*U;PR.push({k:'arrow',x0:x,y0:y,cx:(x+c.x)/2,cy:Math.min(y,c.y)-30*U,x1:c.x+rnd(-.2,.2)*r,y1:c.y+rnd(-.2,.2)*r,t:0,dur:.18,tr:[]});comp.arShot=.15;sfx.arrow()}
  else{const x=heroX-112*U,y=groundY-112*U;PR.push({k:'orb',x0:x,y0:y,cx:lerp(x,c.x,.5),cy:Math.min(y,c.y)-150*U,x1:c.x,y1:c.y,t:0,dur:.55,tr:[]});comp.mgCast=.4}
}
function updAllies(dt,fg){
  comp.arShot=Math.max(0,comp.arShot-dt);comp.mgCast=Math.max(0,comp.mgCast-dt);
  if(S.lv.archer&&fg){comp.arT-=dt;if(comp.arT<=0){comp.arT=1/1.4;allyShoot('arrow')}}
  if(S.lv.mage&&fg){comp.mgT-=dt;if(comp.mgT<=0){comp.mgT=2.6;allyShoot('orb')}}
  for(let i=PR.length-1;i>=0;i--){const p=PR[i];p.t+=dt;const k=Math.min(1,p.t/p.dur),q=1-k;
    p.x=q*q*p.x0+2*q*k*p.cx+k*k*p.x1;p.y=q*q*p.y0+2*q*k*p.cy+k*k*p.y1;p.tr.push(p.x,p.y);if(p.tr.length>20)p.tr.splice(0,2);
    if(k>=1){const crit=Math.random()<ST.cc;
      if(p.k==='arrow'){burst(p.x,p.y,['#c8ffb0','#fff'],5,500);deal(ST.ar*(crit?ST.cm:1)*rnd(.9,1.1),crit,'ally',p.x,p.y,{col:'#c8ffb0'})}
      else{P.push({t:'ring',x:p.x,y:p.y,r0:8*U,r1:80*U,w:5*U,life:.3,max:.3,color:'#7aa8ff'});P.push({t:'glow',x:p.x,y:p.y,size:80*U,life:.2,max:.2,color:'#7aa8ff'});
        burst(p.x,p.y,['#b8ccff','#7aa8ff','#fff'],14,800);deal(ST.mg*(crit?ST.cm:1)*rnd(.9,1.1),crit,'ally',p.x,p.y,{col:'#b8ccff'});addTrauma(.1);sfx.zap()}
      PR[i]=PR[PR.length-1];PR.pop()}}
}

/* ================= update ================= */
let hintY=0,dispGold=0,uiAcc=0,saveAcc=0,achAcc=0,lastBump=0;
function update(rdt){
  trauma=Math.max(0,trauma-rdt*1.7);
  zoom+=(1-zoom)*Math.min(1,rdt*7);zoom=Math.min(zoom,1.25);
  flashA=Math.max(0,flashA-rdt*3.5);invertT=Math.max(0,invertT-rdt);
  comboPop=Math.max(0,comboPop-rdt*5);
  dispGold+=(S.gold-dispGold)*Math.min(1,rdt*9);if(Math.abs(S.gold-dispGold)<.5)dispGold=S.gold;
  if(BN){BN.t+=rdt;if(BN.t>BN.dur)BN=null}
  if(CUT){CUT.t+=rdt;if(CUT.t>CUT.dur)CUT=null}
  if(BF){BF.t+=rdt;if(BF.t>BF.dur)BF=null}
  for(let i=CR.length-1;i>=0;i--){const c=CR[i];c.t+=rdt;
    if(c.t>c.dur*.5&&!c.sd){c.sd=1;for(let j=0;j<14;j++)c.sh.push({x:c.x+rnd(-90,90)*U,y:c.y+rnd(-90,90)*U,vx:rnd(-120,120)*U,vy:rnd(-160,0)*U,s:rnd(6,16)*U,r:rnd(0,6)})}
    for(const s of c.sh){s.vy+=1400*U*rdt;s.x+=s.vx*rdt;s.y+=s.vy*rdt;s.r+=rdt*6}
    if(c.t>c.dur)CR.splice(i,1)}
  if(inkT>=0){inkT+=rdt;if(inkT>=.55)zoneShown=zoneOf(S.stage);if(inkT>1.4)inkT=-1}
  dimCur+=(dimT-dimCur)*Math.min(1,rdt*6);tintCur+=(tintA-tintCur)*Math.min(1,rdt*6);
  if(stop>0){stop-=rdt;if(m)m.flash=Math.max(m.flash,.6);return}
  let ts=1;if(slowT>0){slowT-=rdt;ts=lerp(1,.25,Math.min(1,slowT))}
  const dt=rdt*ts;gt+=dt;
  dimT=0;tintA=0;

  for(const s of SK)cds[s.id]=Math.max(0,cds[s.id]-dt*(circleT>0?2:1));if(circleT>0)circleT-=dt;
  castLock=Math.max(0,castLock-dt);
  if(frenzyT>0){frenzyT-=dt;
    if(Math.random()<dt*45)P.push({t:'flame',x:heroX+rnd(-24,24)*U,y:groundY-rnd(10,90)*U,vx:rnd(-20,20)*U,vy:-rnd(80,200)*U,drag:1,g:0,r:rnd(5,11)*U,cols:['#3a0620','#ff3d8b','#ffb0d8'],life:rnd(.3,.6),max:.6});}
  comboT-=dt;if(comboT<=0)combo=0;
  if(relicQ.length&&!FX.some(f=>f.relic)){const r=relicQ.shift();relicFX(r.x,r.boss,r.min||0)}

  const fg=fighting();
  autoCast();tickCombo();
  const running=(!m||m.state==='enter')&&h.ox===null;
  bgX+=dt*(running?420:14)*U;

  // hero
  h.t+=dt;
  const idle=-.55+Math.sin(gt*2.2)*.06,SW=.06;
  if(h.t<SW)h.ang=lerp(h.from,h.to,easeOut(h.t/SW));
  else h.ang=lerp(h.to,idle,easeOut(clamp((h.t-SW-.05)/.25,0,1)));
  h.lunge=h.t<.04?22*(h.t/.04):22*Math.max(0,1-(h.t-.04)/.2);
  h.bob=running?-Math.abs(Math.sin(gt*12))*5:Math.sin(gt*2.2)*1.2;
  h.run=running;h.lean=0;h.oy=0;h.dx=0;
  if(h.stun>0)h.stun-=dt;
  if(h.dodgeT>=0){h.dodgeT+=dt;const k=h.dodgeT/.45;h.dx=-75*U*Math.sin(Math.PI*k);h.oy=-45*U*Math.sin(Math.PI*k);h.lean=-.3*Math.sin(Math.PI*k);
    if(Math.random()<.5)P.push({t:'ghost',x:heroX+h.dx,y:groundY+h.oy,col:'#9fe9ff',lean:h.lean,ang:h.ang,life:.2,max:.2});if(k>=1)h.dodgeT=-1}
  if(fg&&castLock<=0&&h.stun<=0){atkT-=dt*(frenzyT>0?(br('demon')==='b'?2.6:2):1);if(atkT<=0){atkT=Math.max(atkT+1/ST.aps,-.1);heroStrike(false)}}

  // spirits
  spiritA+=dt*1.7;
  for(let i=0;i<ST.sn;i++){spiritT[i]-=dt;
    if(spiritT[i]<=0){spiritT[i]=rnd(1.1,1.4);
      if(fg){const s=spiritPos(i),c=mCenter(m);
        B.push({x0:s.x,y0:s.y,cx:lerp(s.x,c.x,.5)+rnd(-60,60)*U,cy:Math.min(s.y,c.y)-rnd(80,180)*U,x1:c.x+rnd(-.3,.3)*m.rb*U,y1:c.y+rnd(-.3,.3)*m.rb*U,t:0,dur:rnd(.3,.42),tr:[]});}}}
  for(let i=B.length-1;i>=0;i--){const b=B[i];b.t+=dt;const k=Math.min(1,b.t/b.dur),q=1-k;
    b.x=q*q*b.x0+2*q*k*b.cx+k*k*b.x1;b.y=q*q*b.y0+2*q*k*b.cy+k*k*b.y1;b.tr.push(b.x,b.y);if(b.tr.length>18)b.tr.splice(0,2);
    if(k>=1){const crit=Math.random()<ST.cc;
      for(let j=0;j<7;j++){const a=rnd(0,Math.PI*2),sp=rnd(150,500)*U;P.push({t:'spark',x:b.x,y:b.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,drag:6,g:0,w:2*U,life:.2,max:.2,color:'#8ff6ff'})}
      P.push({t:'ring',x:b.x,y:b.y,r0:4*U,r1:34*U,w:3*U,life:.2,max:.2,color:'#6ff2ff'});
      deal(ST.sd*(crit?ST.cm:1)*rnd(.9,1.1),false,'spirit',b.x,b.y);sfx.zap();
      B[i]=B[B.length-1];B.pop();}}
  updAllies(dt,fg);

  for(let i=FX.length-1;i>=0;i--){const o=FX[i];if(!o)continue;o.t+=dt;o.up&&o.up(dt,o);if(o.t>=o.dur){o.end&&o.end(o);FX.splice(i,1)}}
  updBossIntro(dt);
  bossAI(dt);

  // monster
  if(!m){spawnT-=dt;if(spawnT<=0){
    if(miniQ>0){m=makeMonster(S.stage,true);m.x=clamp(miniX+(miniQ===2?-40:40)*U,heroX+120*U,W-40*U);m.yo=-150*U;miniQ--}
    else{m=makeMonster(S.stage);if(m.boss)sfx.whoosh()}}}
  else{
    m.t+=dt;
    m.sqv+=(-130*m.sq-9*m.sqv)*dt;m.sq+=m.sqv*dt;m.sq=clamp(m.sq,-.35,.35);
    m.kv+=(-150*m.kx-15*m.kv)*dt;m.kx+=m.kv*dt;
    m.ly+=(m.lyT-m.ly)*Math.min(1,dt*(m.lyF||6));m.lyT=0;m.lyF=6;
    m.px+=(m.pxT-m.px)*Math.min(1,dt*m.pxF);m.pxT=0;m.pxF=6;
    m.sc+=(m.scT-m.sc)*Math.min(1,dt*6);m.scT=1;
    m.flash=Math.max(0,m.flash-dt*9);m.hurt-=dt;if(m.vuln>0)m.vuln-=dt;
    if(m.chipT>0)m.chipT-=dt;else m.chip+=(m.hp-m.chip)*Math.min(1,dt*7);
    if(m.state==='enter'){
      if(m.mini){const k=Math.min(1,m.t/.32);m.yo=lerp(-150*U,0,easeIn(k));if(k>=1){m.state='fight';m.sqv=7;P.push({t:'ring',x:m.x,y:groundY,r0:6*U,r1:60*U,w:4*U,sy:.25,life:.3,max:.3,color:'#fff'})}}
      else if(m.boss){if(!BI||BI.m!==m)startBossIntro()}
      else{const k=Math.min(1,m.t/.5);m.x=lerp(W+140*U,monX,easeBack(k));if(k>=1){m.state='fight';m.x=monX}}
    }else if(m.state==='fight'){
      if(m.boss){bossT-=dt;if(bossT<=0)bossFail();else if(!m.ph2&&m.hp<=m.max*.5)startPhase2()}
      if(m.enraged&&Math.random()<dt*30){const c=mCenter(m);P.push({t:'flame',x:c.x+rnd(-1,1)*m.rb*U,y:c.y+rnd(-.5,.8)*m.rb*U,vx:rnd(-20,20)*U,vy:-rnd(60,160)*U,drag:1,g:0,r:rnd(6,12)*U,cols:['#2a0008','#ff1a3a','#ff8a9a'],life:rnd(.4,.7),max:.7})}
    }else if(m.state==='phase'){updPhase2(dt)
    }else if(m.state==='dead'){m.deadT+=dt;if(m.deadT>.14){m=null;spawnT=miniQ>0?.15:.55}}
    else if(m.state==='split'){m.deadT+=dt;if(m.deadT>=.32&&!m.fx){m.fx=1;killFx(m)}if(m.deadT>.95){const win=CH&&CH.win;relicQ.push({x:m.x,boss:true,min:win?1:0});if(win)endChallenge();m=null;spawnT=.7}}
    else if(m.state==='flee'){m.x+=dt*1100*U;m.sq=Math.sin(gt*30)*.08;if(m.x>W+200*U){m=null;spawnT=.35}}
  }

  // particles
  for(let i=P.length-1;i>=0;i--){const p=P[i];p.life-=dt;
    if(p.life<=0){P[i]=P[P.length-1];P.pop();continue}
    if(p.vx!==undefined){const f=Math.max(0,1-(p.drag||0)*dt);p.vx*=f;p.vy=p.vy*f+(p.g||0)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.floor&&p.y>groundY){p.y=groundY;p.vy*=-.35;p.vx*=.7;if(p.vr)p.vr*=.6}}
    if(p.vr)p.rot+=p.vr*dt;}
  if(P.length>1300)P.splice(0,P.length-1300);
  for(let i=T.length-1;i>=0;i--){const t=T[i];t.life-=dt;t.x+=t.vx*dt;t.y+=t.vy*dt;t.vy*=1-2.2*dt;if(t.life<=0){T[i]=T[T.length-1];T.pop()}}
  if(T.length>60)T.splice(0,T.length-60);
  for(let i=C.length-1;i>=0;i--){const c=C[i];c.spin+=dt*12;
    if(c.ph===0){c.wait-=dt;c.vy+=2100*U*dt;c.vx*=1-1.8*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;
      if(c.y>groundY){c.y=groundY;c.vy*=-.45;c.vx*=.6}
      if(c.wait<=0){c.ph=1;c.sx=c.x;c.sy=c.y;c.ht=0;c.dur=rnd(.35,.55)}}
    else{c.ht+=dt;const k=easeIn(Math.min(1,c.ht/c.dur)),q=1-k,cx=c.sx+(gx-c.sx)*.15,cy=c.sy-160*U;
      c.x=q*q*c.sx+2*q*k*cx+k*k*gx;c.y=q*q*c.sy+2*q*k*cy+k*k*gy;
      if(c.ht>=c.dur){S.gold+=c.v;sfx.coin();bumpGold();C[i]=C[C.length-1];C.pop()}}}
}
function spiritPos(i){const a=spiritA+i*Math.PI*2/Math.max(1,ST.sn);return{x:heroX+Math.cos(a)*52*U,y:groundY-(108+Math.sin(a*2)*6)*U+Math.sin(a)*16*U}}
const goldBox=$('goldBox');
function bumpGold(){const n=performance.now();if(n-lastBump<70)return;lastBump=n;
  try{goldBox.animate([{transform:'scale(1.16)',filter:'brightness(1.6)'},{transform:'scale(1)',filter:'brightness(1)'}],{duration:180,easing:'ease-out'})}catch(e){}}

/* ================= render ================= */
function ridge(x,s){return Math.sin(x*.004+s)*.5+Math.sin(x*.011+s*2.1)*.3+Math.sin(x*.027+s*3.7)*.2}
function drawBG(){
  const pal=PAL[zoneShown];
  const g=ctx.createLinearGradient(0,0,0,groundY);g.addColorStop(0,pal[0]);g.addColorStop(.62,pal[1]);g.addColorStop(1,pal[2]);
  ctx.fillStyle=g;ctx.fillRect(-60,-60,W+120,groundY+60);
  for(const s of stars){ctx.globalAlpha=.25+.75*Math.abs(Math.sin(gt*s.sp+s.ph));ctx.fillStyle='#fff';
    const x=((s.x-bgX*.02)%W+W)%W;ctx.fillRect(x,s.y,s.s,s.s)}
  ctx.globalAlpha=1;
  const mx=W*.8,my=H*.2;ctx.fillStyle=pal[6];ctx.globalAlpha=.08;ctx.beginPath();ctx.arc(mx,my,70*U,0,7);ctx.fill();
  ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(mx,my,28*U,0,7);ctx.fill();ctx.globalAlpha=1;
  const layer=(par,base,amp,col,seed)=>{ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(-60,groundY+5);
    for(let x=-60;x<=W+60;x+=16)ctx.lineTo(x,base-amp*(.55+.45*ridge(x+bgX*par,seed)));ctx.lineTo(W+60,groundY+5);ctx.fill()};
  layer(.12,groundY-30*U,150*U,pal[3],1.3);layer(.4,groundY,80*U,pal[4],4.1);
  ctx.fillStyle=pal[5];ctx.fillRect(-60,groundY,W+120,H-groundY+60);
  ctx.strokeStyle=pal[6];ctx.globalAlpha=.35;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-60,groundY);ctx.lineTo(W+60,groundY);ctx.stroke();
  ctx.globalAlpha=.07;ctx.lineWidth=1;const sp=80*U,off=bgX%sp;
  ctx.beginPath();for(let x=-sp*8-off;x<W+sp*8;x+=sp){ctx.moveTo(x,groundY);ctx.lineTo(W/2+(x-W/2)*2.4,H+40)}
  for(const f of [.18,.42,.75]){const y=groundY+(H-groundY)*f;ctx.moveTo(-60,y);ctx.lineTo(W+60,y)}ctx.stroke();ctx.globalAlpha=1;
}
function drawHero(){
  if(h.hide)return;
  const bx=(h.ox!==null?h.ox:heroX+h.lunge*U)+h.dx,y=groundY+h.bob*U+h.oy,dem=frenzyT>0;
  const air=Math.max(.3,1+h.oy/(200*U));
  ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(bx,groundY+2,34*U*air,7*U*air,0,0,7);ctx.fill();
  ctx.save();ctx.translate(bx,y);ctx.scale(U,U);ctx.rotate(h.lean+(h.stun>0?-.22:0));
  if(dem){const cols=['#3a0620','#ff3d8b','#ffb0d8'],sz=[1,.72,.45];
    for(let l=0;l<3;l++){ctx.fillStyle=cols[l];ctx.beginPath();
      for(let i=0;i<5;i++)tongue((i-2)*13,-4,26*sz[l]+6,(80+22*Math.sin(gt*13+i*1.7))*(l?sz[l]+.2:1),gt*9+i);ctx.fill()}}
  const w=Math.sin(gt*8)*4+(h.run?8:0);
  ctx.fillStyle=dem?'#5a0a2c':'#8a1f3a';ctx.beginPath();ctx.moveTo(-4,-64);ctx.quadraticCurveTo(-30-w,-40,-36-w,-4+Math.sin(gt*10)*3);ctx.lineTo(-2,-12);ctx.closePath();ctx.fill();
  const ls=h.run?Math.sin(gt*18)*9:0;ctx.fillStyle='#2b2450';
  ctx.beginPath();ctx.roundRect(-13+ls*.5,-28,10,28,3);ctx.roundRect(3-ls*.5,-28,10,28,3);ctx.fill();
  const ag=ctx.createLinearGradient(0,-66,0,-22);ag.addColorStop(0,dem?'#ffd6ea':'#f1eeff');ag.addColorStop(1,dem?'#8a2a5a':'#8c83c6');
  ctx.fillStyle=ag;ctx.beginPath();ctx.roundRect(-16,-66,32,42,9);ctx.fill();
  ctx.fillStyle='#ffc94a';ctx.fillRect(-16,-32,32,4);
  if(dem){ctx.fillStyle='#1a0610';for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(1+s*6,-90);ctx.quadraticCurveTo(1+s*20,-100,1+s*16,-114);ctx.quadraticCurveTo(1+s*12,-100,1+s*1,-92);ctx.fill()}}
  ctx.fillStyle='#d6d0f7';ctx.beginPath();ctx.arc(1,-79,14,0,7);ctx.fill();
  ctx.fillStyle='#ff6a3d';ctx.beginPath();ctx.moveTo(-4,-92);ctx.quadraticCurveTo(-20-w*.5,-100,-26-w,-88);ctx.quadraticCurveTo(-14,-92,-2,-86);ctx.fill();
  ctx.fillStyle=dem?'#ff3d8b':h.stun>0?'#ff4f5e':'#6ff2ff';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=10;ctx.fillRect(2,-82,13,4);ctx.shadowBlur=0;
  ctx.save();ctx.translate(6,-56);
  if(h.t<.13){const k=1-h.t/.13;ctx.globalCompositeOperation='lighter';ctx.globalAlpha=k*.55;
    ctx.fillStyle=dem?'#ff7ab8':'#bff8ff';const a0=h.from,a1=h.ang,ccw=h.to<h.from;
    ctx.beginPath();ctx.arc(0,0,98,a0,a1,ccw);ctx.arc(0,0,34,a1,a0,!ccw);ctx.closePath();ctx.fill();
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
  ctx.rotate(h.ang);
  ctx.fillStyle='#bdb5ea';ctx.beginPath();ctx.roundRect(-2,-5,24,10,5);ctx.fill();
  ctx.fillStyle='#ffc94a';ctx.fillRect(20,-12,6,24);
  const bg=ctx.createLinearGradient(26,0,96,0);
  if(dem){bg.addColorStop(0,'#ffe0f0');bg.addColorStop(1,'#ff3d8b');ctx.shadowColor='#ff3d8b';ctx.shadowBlur=18}
  else{bg.addColorStop(0,'#ffffff');bg.addColorStop(1,'#9fe9ff');ctx.shadowColor='#6ff2ff';ctx.shadowBlur=8}
  ctx.fillStyle=bg;ctx.beginPath();ctx.moveTo(26,-4.5);ctx.lineTo(86,-3.5);ctx.lineTo(98,0);ctx.lineTo(86,3.5);ctx.lineTo(26,4.5);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.restore();ctx.restore();
  if(h.stun>0){ctx.fillStyle='#ffe066';for(let i=0;i<3;i++){const a=gt*6+i*2.1;star4(bx+Math.cos(a)*22*U,y-100*U+Math.sin(a)*6*U,7*U,3*U,a);ctx.fill()}}
}
function drawAllies(){
  const bobF=o=>h.run?-Math.abs(Math.sin(gt*12+o))*5:Math.sin(gt*2.2+o)*1.2;
  if(S.lv.archer){ctx.save();ctx.translate(heroX-72*U,groundY+bobF(1)*U);ctx.scale(U*.85,U*.85);
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,2,24,5,0,0,7);ctx.fill();
    ctx.fillStyle='#2f5a2a';ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(-18,-50);ctx.quadraticCurveTo(0,-72,14,-50);ctx.lineTo(12,0);ctx.closePath();ctx.fill();
    ctx.fillStyle='#3f7a36';ctx.beginPath();ctx.arc(0,-64,12,0,7);ctx.fill();ctx.fillStyle='#10200e';ctx.beginPath();ctx.arc(3,-63,8,0,7);ctx.fill();
    ctx.fillStyle='#b8ff9a';ctx.fillRect(5,-65,4,2);
    ctx.strokeStyle='#c89a5a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(12,-40,26,-1.2,1.2);ctx.stroke();
    const pull=comp.arShot>0?0:1;ctx.strokeStyle='#eee';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(12+26*Math.cos(1.2),-40-26*Math.sin(1.2));ctx.lineTo(12+26*Math.cos(1.2)-10*pull,-40);ctx.lineTo(12+26*Math.cos(1.2),-40+26*Math.sin(1.2));ctx.stroke();
    ctx.restore()}
  if(S.lv.mage){ctx.save();ctx.translate(heroX-128*U,groundY+bobF(2.5)*U);ctx.scale(U*.85,U*.85);
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,2,24,5,0,0,7);ctx.fill();
    ctx.fillStyle='#2a3a7a';ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(-8,-58);ctx.lineTo(10,-58);ctx.lineTo(20,0);ctx.closePath();ctx.fill();
    ctx.fillStyle='#e8d8c0';ctx.beginPath();ctx.arc(1,-66,10,0,7);ctx.fill();
    ctx.fillStyle='#3a4fa8';ctx.beginPath();ctx.moveTo(-18,-68);ctx.lineTo(22,-68);ctx.lineTo(-4,-108+Math.sin(gt*3)*3);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#8a6a3a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(24,-86);ctx.stroke();
    const gl=.5+.3*Math.sin(gt*4)+comp.mgCast*1.5;ctx.globalCompositeOperation='lighter';ctx.fillStyle='#7aa8ff';ctx.globalAlpha=Math.min(1,gl*.5);ctx.beginPath();ctx.arc(24,-92,14+comp.mgCast*20,0,7);ctx.fill();
    ctx.globalAlpha=1;ctx.fillStyle='#dfe8ff';ctx.beginPath();ctx.arc(24,-92,5,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';
    ctx.restore()}
  ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  for(const p of PR){const tr=p.tr,col=p.k==='arrow'?'#c8ffb0':'#7aa8ff';
    for(let j=2;j<tr.length;j+=2){ctx.globalAlpha=j/tr.length*.8;ctx.strokeStyle=col;ctx.lineWidth=(p.k==='arrow'?2:7)*U*j/tr.length;ctx.beginPath();ctx.moveTo(tr[j-2],tr[j-1]);ctx.lineTo(tr[j],tr[j+1]);ctx.stroke()}
    ctx.globalAlpha=1;if(p.k==='orb'){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y,5*U,0,7);ctx.fill()}
    else if(tr.length>=4){const a=Math.atan2(p.y-tr[tr.length-3],p.x-tr[tr.length-4]);ctx.strokeStyle='#fff';ctx.lineWidth=2*U;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-Math.cos(a)*22*U,p.y-Math.sin(a)*22*U);ctx.stroke()}}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
function bodyPath(o,r){
  ctx.beginPath();const b=Math.sin(gt*2+o.ph)*6*U;
  if(o.type===0){const N=28;for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,rr=r*(1+.06*Math.sin(a*3+gt*4+o.ph));
    let px=Math.cos(a)*rr,py=-r*.8+Math.sin(a)*rr*.85;if(py>0)py=0;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath()}
  else if(o.type===1){ctx.roundRect(-r,-r*1.8,r*2,r*1.8,r*.38)}
  else if(o.type===2){const cy=-r*1.45+b,N=24;for(let i=0;i<=N;i++){const a=i/N*Math.PI*2+gt*.4,rr=r*(i%2?1.16:.98);
    const px=Math.cos(a)*rr,py=cy+Math.sin(a)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath()}
  else{const cy=-r*2.1+b*1.5;ctx.ellipse(0,cy,r*.62,r*.72,0,0,Math.PI*2);
    ctx.moveTo(-r*.45,cy-r*.45);ctx.lineTo(-r*.35,cy-r*1.05);ctx.lineTo(-r*.1,cy-r*.6);ctx.closePath();
    ctx.moveTo(r*.45,cy-r*.45);ctx.lineTo(r*.35,cy-r*1.05);ctx.lineTo(r*.1,cy-r*.6);ctx.closePath()}
}
function drawMonBody(o,r,da,white){
  const top=mTop(o)-(groundY+o.yo+o.ly);const tp=top/o.sc;
  if(o.type===3){const cy=-r*2.1+Math.sin(gt*2+o.ph)*9*U,f=Math.sin(gt*14+o.ph);ctx.fillStyle=`hsl(${o.hue},45%,22%)`;
    for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*r*.3,cy-r*.2);ctx.quadraticCurveTo(s*r*1.3,cy-r*(.9+f*.5),s*r*2,cy-r*(.2+f*.6));ctx.lineTo(s*r*1.55,cy+r*.1);ctx.lineTo(s*r*1.15,cy-r*.05);ctx.lineTo(s*r*.85,cy+r*.28);ctx.lineTo(s*r*.3,cy+r*.2);ctx.closePath();ctx.fill()}}
  if(o.boss){ctx.fillStyle='#2a1030';for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*r*.35,tp+r*.3);ctx.quadraticCurveTo(s*r*.9,tp-r*.1,s*r*.75,tp-r*.55);ctx.quadraticCurveTo(s*r*.6,tp,s*r*.1,tp+r*.35);ctx.fill()}}
  bodyPath(o,r);
  const g=ctx.createLinearGradient(0,tp,0,0);g.addColorStop(0,`hsl(${o.hue},72%,64%)`);g.addColorStop(1,`hsl(${o.hue},62%,30%)`);
  ctx.fillStyle=g;ctx.fill();ctx.lineWidth=3*U;ctx.strokeStyle='rgba(10,4,20,.45)';ctx.stroke();
  const hurt=o.hurt>0||o.state!=='fight'&&o.state!=='enter';
  ctx.fillStyle='#fff';ctx.strokeStyle='#1a0f24';ctx.lineWidth=3*U;ctx.lineCap='round';
  if(o.type===0){
    ctx.globalAlpha=da*.35;ctx.beginPath();ctx.ellipse(-r*.35,-r*1.25,r*.22,r*.12,-.5,0,7);ctx.fill();ctx.globalAlpha=da;
    for(const ex of [-r*.42,-r*.02]){const ey=-r*.9;
      if(hurt){ctx.beginPath();ctx.moveTo(ex-r*.1,ey-r*.08);ctx.lineTo(ex+r*.06,ey);ctx.lineTo(ex-r*.1,ey+r*.08);ctx.stroke()}
      else{ctx.beginPath();ctx.ellipse(ex,ey,r*.13,r*.17,0,0,7);ctx.fill();ctx.fillStyle='#1a0f24';ctx.beginPath();ctx.arc(ex-r*.05,ey+r*.02,r*.07,0,7);ctx.fill();ctx.fillStyle='#fff'}}
  }else if(o.type===1){
    ctx.strokeStyle='rgba(10,4,20,.35)';ctx.lineWidth=2*U;ctx.beginPath();ctx.moveTo(r*.3,-r*1.8);ctx.lineTo(r*.1,-r*1.4);ctx.lineTo(r*.35,-r*1.1);ctx.moveTo(-r*.6,-r*.4);ctx.lineTo(-r*.3,-r*.2);ctx.stroke();
    ctx.fillStyle=hurt?'#ffffff':`hsl(${(o.hue+180)%360},100%,70%)`;ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=12*U;
    ctx.fillRect(-r*.75,-r*1.3,r*.9,hurt?r*.05:r*.14);ctx.shadowBlur=0;
  }else if(o.type===2){
    const cy=-r*1.45+Math.sin(gt*2+o.ph)*6*U;
    if(hurt){ctx.beginPath();ctx.moveTo(-r*.5,cy);ctx.lineTo(r*.3,cy);ctx.lineWidth=5*U;ctx.stroke()}
    else{ctx.beginPath();ctx.arc(-r*.1,cy,r*.55,0,7);ctx.fill();ctx.fillStyle=`hsl(${(o.hue+140)%360},90%,55%)`;ctx.beginPath();ctx.arc(-r*.26,cy,r*.3,0,7);ctx.fill();
      ctx.fillStyle='#12081c';ctx.beginPath();ctx.arc(-r*.32,cy,r*.14,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-r*.2,cy-r*.12,r*.07,0,7);ctx.fill()}
  }else{
    const cy=-r*2.1+Math.sin(gt*2+o.ph)*9*U;
    ctx.fillStyle=hurt?'#fff':'#ffdd55';for(const ex of [-r*.3,r*.05]){ctx.beginPath();ctx.ellipse(ex,cy-r*.12,r*.12,hurt?r*.03:r*.09,0,0,7);ctx.fill()}
    ctx.fillStyle='#fff';for(const fx of [-r*.22,0]){ctx.beginPath();ctx.moveTo(fx,cy+r*.25);ctx.lineTo(fx+r*.06,cy+r*.42);ctx.lineTo(fx+r*.12,cy+r*.25);ctx.fill()}
  }
  if(white||o.flash>0){bodyPath(o,r);ctx.fillStyle='#fff';ctx.globalAlpha=white?da:Math.min(1,o.flash)*da;ctx.fill();ctx.globalAlpha=da}
}
function drawMonster(o){
  const r=o.rb*U;let x=o.x+o.kx+o.px;if(stop>0&&o.state==='fight')x+=rnd(-3,3)*U;
  const base=groundY+o.yo+o.ly,sh=(o.type>=2?.6:1)*o.sc;
  ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(x,groundY+2,r*1.05*sh,r*.2*sh,0,0,7);ctx.fill();
  if(o.state==='split'){drawSplit(o,x,base,r);return}
  ctx.save();ctx.translate(x,base);
  let sx=(1+o.sq)*o.sc,sy=(1-o.sq)*o.sc;const da=o.state==='dead'?1-o.deadT/.14:1;
  if(o.state==='dead'){const k=o.deadT/.14;sx*=1+k*.6;sy*=1+k*.6;ctx.globalAlpha=da}
  ctx.scale(sx,sy);
  if(o.boss){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=da*(.22+.08*Math.sin(gt*5));ctx.fillStyle=o.pat&&o.pat.t<o.pat.imp?'#ff2a3a':`hsl(${o.hue},100%,60%)`;
    const c=(mCenter(o).y-base)/o.sc;ctx.beginPath();ctx.arc(0,c,r*1.7,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=da}
  if(o.enraged||o.state==='phase'){const k=o.enraged?1:Math.min(1,o.P2.t);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.45*k*da;ctx.fillStyle='#ff1a3a';ctx.beginPath();
    for(let i=0;i<7;i++)tongue((i-3)*r*.34,0,r*.5,r*(2.4+.5*Math.sin(gt*11+i*1.3)),gt*9+i);ctx.fill();ctx.globalAlpha=da;ctx.globalCompositeOperation='source-over'}
  drawMonBody(o,r,da,o.state==='dead');
  if(o.state==='phase'){const k=Math.min(1,o.P2.t),c=(mCenter(o).y-base)/o.sc;ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(255,40,60,'+(.4+.6*k)+')';ctx.lineWidth=3*U;ctx.beginPath();
    for(let i=0;i<7;i++){let a=i/7*Math.PI*2+.3,px=0,py=c;ctx.moveTo(px,py);for(let j=0;j<3;j++){a+=((i*7+j*3)%5-2)*.2;px+=Math.cos(a)*r*.4*k;py+=Math.sin(a)*r*.4*k;ctx.lineTo(px,py)}}ctx.stroke();ctx.globalCompositeOperation='source-over'}
  if(o.sh>0){const c=(mCenter(o).y-base)/o.sc,rr=r*1.45;ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#7fe8ff';ctx.lineWidth=2.5*U;ctx.globalAlpha=.55+.2*Math.sin(gt*5);
    ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*Math.PI*2+Math.PI/6;i?ctx.lineTo(Math.cos(a)*rr,c+Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,c+Math.sin(a)*rr)}ctx.closePath();ctx.stroke();
    ctx.globalAlpha=.08;ctx.fillStyle='#7fe8ff';ctx.fill();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
  ctx.restore();
  if(o.state==='fight'||o.state==='enter'){
    const bw=Math.max(90*U,r*2.3),bh=(o.boss?10:7)*U,bx=x-bw/2,by=mTop(o)-(o.boss?30:20)*U-(o.shMax?8*U:0);
    ctx.fillStyle='rgba(8,4,16,.75)';ctx.beginPath();ctx.roundRect(bx-2,by-2,bw+4,bh+4,4*U);ctx.fill();
    ctx.fillStyle='#fff1b8';ctx.fillRect(bx,by,bw*clamp(o.chip/o.max,0,1),bh);
    const hg=ctx.createLinearGradient(bx,0,bx+bw,0);hg.addColorStop(0,'#ff4f5e');hg.addColorStop(1,'#ff8a5c');
    ctx.fillStyle=hg;ctx.fillRect(bx,by,bw*clamp(o.hp/o.max,0,1),bh);
    if(o.boss&&!o.ph2){ctx.fillStyle='#fff';ctx.fillRect(bx+bw*.5-1,by-3*U,2,bh+6*U)}
    if(o.shMax){ctx.fillStyle='rgba(8,4,16,.75)';ctx.fillRect(bx-2,by+bh+3,bw+4,5*U+2);ctx.fillStyle='#7fe8ff';ctx.fillRect(bx,by+bh+4,bw*clamp(o.sh/o.shMax,0,1),5*U)}
    ctx.font=`700 ${Math.max(11,Math.round((o.boss?14:11)*U))}px "Noto Sans KR",sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';
    ctx.fillStyle=o.boss?'#ffb3ba':'rgba(240,235,255,.75)';ctx.fillText(o.name,x,by-5*U);
  }
}
function drawSplit(o,x,base,r){
  const t=o.deadT,cy=(mCenter(o).y-base),a=o.cutA,dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx;
  const sep=t<.3?0:easeOut(Math.min(1,(t-.3)/.5))*46*U,al=t<.6?1:Math.max(0,1-(t-.6)/.3);
  for(const side of [-1,1]){ctx.save();ctx.translate(x+nx*sep*side+(side>0?dx*sep*.7:0),base+ny*sep*side+(side>0?dy*sep*.7:0));ctx.globalAlpha=al;
    ctx.beginPath();const B=2000;ctx.moveTo(-dx*B,cy-dy*B);ctx.lineTo(dx*B,cy+dy*B);ctx.lineTo(dx*B+nx*side*B,cy+dy*B+ny*side*B);ctx.lineTo(-dx*B+nx*side*B,cy-dy*B+ny*side*B);ctx.closePath();ctx.clip();
    drawMonBody(o,r,al,t<.3);ctx.restore()}
  if(t<.5){const k=Math.min(1,t/.1),w=Math.max(1,6*U*(1-t/.5));ctx.save();ctx.translate(x,base+cy);ctx.rotate(a);ctx.globalCompositeOperation='lighter';
    ctx.fillStyle='rgba(255,60,90,.6)';ctx.fillRect(-r*3*k,-w*2,r*6*k,w*4);ctx.fillStyle='#fff';ctx.fillRect(-r*3.2*k,-w/2,r*6.4*k,w);ctx.restore()}
}
function drawBossPat(){
  if(!m||!m.pat||m.state!=='fight')return;const p=m.pat,c=mCenter(m),r=m.rb*U;
  const wa=Math.min(1,p.t/1.1)*(.55+.45*Math.sin(p.t*26));
  if(p.t<p.imp){const s=1+.2*Math.abs(Math.sin(p.t*12)),fs=Math.round(Math.max(26,44*U)*s);ctx.font=`${fs}px "Black Han Sans",sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';
    ctx.lineWidth=6;ctx.strokeStyle='#000';ctx.strokeText('!',c.x,mTop(m)-46*U);ctx.fillStyle='#ff2a3a';ctx.fillText('!',c.x,mTop(m)-46*U)}
  if(p.ty==='slam'&&p.t<1.5){ctx.fillStyle=`rgba(255,40,60,${.28*wa})`;ctx.fillRect(heroX-60*U,groundY-4*U,m.x-heroX+60*U,12*U)}
  if(p.ty==='beam'){const ex=c.x-r*.3,ey=c.y,tx=heroX+10*U,ty=groundY-60*U;
    if(p.t<1.2){ctx.strokeStyle=`rgba(255,42,58,${wa})`;ctx.lineWidth=2*U;ctx.setLineDash([10*U,6*U]);ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(tx,ty);ctx.stroke();ctx.setLineDash([]);
      ctx.globalCompositeOperation='lighter';ctx.fillStyle='#ff2a3a';ctx.globalAlpha=.6;ctx.beginPath();ctx.arc(ex,ey,(6+14*p.t/1.2)*U,0,7);ctx.fill();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
    else if(p.t<1.6){const f=1-(p.t-1.2)/.4,a=Math.atan2(ty-ey,tx-ex),L=Math.hypot(tx-ex,ty-ey)+60*U;ctx.save();ctx.translate(ex,ey);ctx.rotate(a);
      ctx.fillStyle='#2a0008';ctx.fillRect(0,-15*U*f,L,30*U*f);ctx.globalCompositeOperation='lighter';ctx.fillStyle='#ff2a3a';ctx.fillRect(0,-9*U*f,L,18*U*f);ctx.fillStyle='#fff';ctx.fillRect(0,-3*U*f,L,6*U*f);ctx.restore();ctx.globalCompositeOperation='source-over'}}
  if(p.ty==='charge'&&p.t<1.2){ctx.strokeStyle=`rgba(255,42,58,${wa})`;ctx.lineWidth=4*U;ctx.lineJoin='miter';
    for(let i=0;i<4;i++){const x=m.x-r-30*U-i*50*U-(p.t*90*U%50*U),y=groundY-8*U;if(x<heroX)continue;ctx.beginPath();ctx.moveTo(x+14*U,y-12*U);ctx.lineTo(x,y);ctx.lineTo(x+14*U,y+12*U);ctx.stroke()}}
  if(!p.res){const d=p.imp-p.t;if(d<.5&&d>=0&&!shieldOn){const hx=heroX,hy=groundY-60*U,rr=lerp(22,120,d/.5)*U;
    ctx.strokeStyle='#ffe066';ctx.lineWidth=3*U;ctx.beginPath();ctx.arc(hx,hy,rr,0,7);ctx.stroke();ctx.globalAlpha=.4;ctx.beginPath();ctx.arc(hx,hy,22*U,0,7);ctx.stroke();ctx.globalAlpha=1;
    ctx.font=`${Math.round(Math.max(14,20*U))}px "Black Han Sans",sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineWidth=4;ctx.strokeStyle='#000';
    ctx.strokeText('탭! 패링',hx,hy-70*U);ctx.fillStyle='#ffe066';ctx.fillText('탭! 패링',hx,hy-70*U)}}
}
function drawSpirits(){
  if(!ST.sn)return;ctx.globalCompositeOperation='lighter';
  for(let i=0;i<ST.sn;i++){const s=spiritPos(i);
    for(let j=4;j>=1;j--){const a=spiritA-j*.07+i*Math.PI*2/ST.sn;const px=heroX+Math.cos(a)*52*U,py=groundY-(108+Math.sin(a*2)*6)*U+Math.sin(a)*16*U;
      ctx.globalAlpha=.12*(5-j)/4;ctx.fillStyle='#6ff2ff';ctx.beginPath();ctx.arc(px,py,(6-j)*U,0,7);ctx.fill()}
    ctx.globalAlpha=.28;ctx.fillStyle='#6ff2ff';ctx.beginPath();ctx.arc(s.x,s.y,12*U,0,7);ctx.fill();
    ctx.globalAlpha=1;ctx.fillStyle='#e8feff';ctx.beginPath();ctx.arc(s.x,s.y,4.5*U,0,7);ctx.fill()}
  for(const b of B){const tr=b.tr;for(let j=2;j<tr.length;j+=2){ctx.globalAlpha=j/tr.length;ctx.strokeStyle='#6ff2ff';ctx.lineWidth=5*U*j/tr.length;
      ctx.beginPath();ctx.moveTo(tr[j-2],tr[j-1]);ctx.lineTo(tr[j],tr[j+1]);ctx.stroke()}
    ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,4*U,0,7);ctx.fill()}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
function cres(p,s,o1,a0,io,ir,a1){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.scale(s,s*p.fy);ctx.beginPath();ctx.arc(0,0,o1,-a0,a0);ctx.arc(-io,0,ir,a1,-a1,true);ctx.closePath();ctx.restore()}
function drawParticles(){
  for(const p of P){const k=p.life/p.max,a=1-k;
    switch(p.t){
    case 'shard':ctx.globalAlpha=Math.min(1,k*2);ctx.fillStyle=p.color;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
      ctx.beginPath();ctx.moveTo(0,-p.size);ctx.lineTo(p.size*.8,p.size*.6);ctx.lineTo(-p.size*.7,p.size*.4);ctx.closePath();ctx.fill();ctx.restore();break;
    case 'smoke':ctx.globalAlpha=k*.5;ctx.fillStyle=p.color||'#2a1a3e';ctx.beginPath();ctx.arc(p.x,p.y,lerp(p.r0,p.r1,easeOut(a)),0,7);ctx.fill();break;
    case 'blob':{const fl=p.floor&&p.y>=groundY-1;ctx.globalAlpha=Math.min(1,k*2);ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(p.x,p.y,p.size*(fl?1.7:1),p.size*(fl?.45:1),0,0,7);ctx.fill();break}
    case 'spike':{const g=Math.min(1,(p.max-p.life)/.07);ctx.globalAlpha=Math.min(1,p.life/(p.max*.3));
      for(const [sc,col] of [[1,p.c1],[.55,p.c2]]){ctx.fillStyle=col;ctx.beginPath();
        p.pts.forEach(([u,v],i)=>{const X=p.x+u*p.w*sc+(-v)*p.lean*p.h*g*sc,Y=p.y+v*p.h*g*sc;i?ctx.lineTo(X,Y):ctx.moveTo(X,Y)});ctx.closePath();ctx.fill()}break}
    case 'flame':{const r=p.r*(.35+.65*k);ctx.globalAlpha=1;for(let i=0;i<3;i++){ctx.fillStyle=p.cols[i];ctx.beginPath();ctx.arc(p.x,p.y-i*r*.18,r*(1-i*.3),0,7);ctx.fill()}break}
    case 'ghost':drawSil(p.x,p.y,p.col,k*.55,1,p.lean,p.ang,false);break;
    case 'bolt':ctx.globalAlpha=k;ctx.strokeStyle='#05050a';ctx.lineWidth=10*U;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(p.pts[0],p.pts[1]);for(let i=2;i<p.pts.length;i+=2)ctx.lineTo(p.pts[i],p.pts[i+1]);ctx.stroke();break;
    case 'dslash':ctx.globalAlpha=Math.min(1,k*1.5);ctx.fillStyle='#07070f';cres(p,p.size*(.8+easeOut(a)*.4),1.1,1.35,.32,1.02,1.15);ctx.fill();break;
    }}
  ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  for(const p of P){const k=p.life/p.max,a=1-k;
    switch(p.t){
    case 'spark':ctx.globalAlpha=Math.min(1,k*1.6);ctx.strokeStyle=p.color;ctx.lineWidth=p.w;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.035,p.y-p.vy*.035);ctx.stroke();break;
    case 'dot':ctx.globalAlpha=Math.min(1,k*1.5);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,7);ctx.fill();break;
    case 'ring':{ctx.globalAlpha=k;ctx.strokeStyle=p.color;ctx.lineWidth=p.w*k+.5;ctx.beginPath();const rr=lerp(p.r0,p.r1,easeOut(a));
      ctx.ellipse(p.x,p.y,Math.max(.1,rr*(p.sx||1)),Math.max(.1,rr*(p.sy||1)),0,0,7);ctx.stroke();break}
    case 'glow':{const rr=p.size*(.6+a*.6),g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,rr);g.addColorStop(0,'rgba(255,255,255,'+k+')');g.addColorStop(.35,p.color);g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.globalAlpha=k;ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,rr,0,7);ctx.fill();break}
    case 'star':{const s=p.size*(.6+a*.6);ctx.globalAlpha=k;ctx.fillStyle='#fff';ctx.beginPath();
      for(let i=0;i<8;i++){const an=i*Math.PI/4+.3,rr=i%2?s*.12:s;i?ctx.lineTo(p.x+Math.cos(an)*rr,p.y+Math.sin(an)*rr):ctx.moveTo(p.x+Math.cos(an)*rr,p.y+Math.sin(an)*rr)}ctx.closePath();ctx.fill();break}
    case 'streak':ctx.globalAlpha=k;ctx.strokeStyle=p.color;ctx.lineWidth=p.w*k;ctx.beginPath();ctx.moveTo(lerp(p.x,p.x2,a*.7),lerp(p.y,p.y2,a*.7));ctx.lineTo(p.x2,p.y2);ctx.stroke();break;
    case 'slash':{const s=p.size*(.75+easeOut(a)*.45);
      ctx.globalAlpha=k*.55;ctx.fillStyle=p.color;cres(p,s,1.08,1.3,.3,1.02,1.15);ctx.fill();
      ctx.globalAlpha=k;ctx.fillStyle='#ffffff';cres(p,s,1,1.15,.14,.9,1.05);ctx.fill();break}
    case 'dslash':ctx.globalAlpha=k;ctx.fillStyle=p.color;cres(p,p.size*(.8+easeOut(a)*.4),1.12,1.25,.08,1.06,1.18);ctx.fill();break;
    case 'bolt':ctx.globalAlpha=Math.random()<.8?k:0;ctx.strokeStyle='#ffffff';ctx.lineWidth=3*U;ctx.beginPath();ctx.moveTo(p.pts[0],p.pts[1]);for(let i=2;i<p.pts.length;i+=2)ctx.lineTo(p.pts[i],p.pts[i+1]);ctx.stroke();break;
    }}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
function drawTexts(){
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  for(const t of T){const a=t.max-t.life,pop=a<.12?1+(1-a/.12)*(t.crit?1.3:.6):1;
    ctx.globalAlpha=t.life<.35?t.life/.35:1;ctx.save();ctx.translate(t.x,t.y);ctx.scale(pop,pop);if(t.crit)ctx.rotate(-.07);
    const fs=Math.max(12,Math.round(t.size*U));ctx.font=`${fs}px "Black Han Sans","Noto Sans KR",sans-serif`;
    ctx.lineWidth=Math.max(3,fs*.16);ctx.strokeStyle='rgba(18,6,30,.92)';ctx.strokeText(t.text,0,0);ctx.fillStyle=t.color;ctx.fillText(t.text,0,0);
    if(t.label){ctx.font=`${Math.max(11,Math.round(fs*.36))}px "Black Han Sans",sans-serif`;ctx.lineWidth=4;ctx.strokeText(t.label,0,-fs*.72);ctx.fillStyle=t.lcol||'#fff';ctx.fillText(t.label,0,-fs*.72)}
    ctx.restore()}
  ctx.globalAlpha=1;
}
function drawCoins(){
  for(const c of C){const s=8*U,w=Math.abs(Math.cos(c.spin))*s+1;
    if(c.ph===1){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.3;ctx.fillStyle='#ffc94a';ctx.beginPath();ctx.arc(c.x,c.y,s*1.8,0,7);ctx.fill();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
    ctx.fillStyle='#b8740f';ctx.beginPath();ctx.ellipse(c.x,c.y,w,s,0,0,7);ctx.fill();
    ctx.fillStyle='#ffc94a';ctx.beginPath();ctx.ellipse(c.x,c.y,Math.max(.5,w-1.5*U),s-1.5*U,0,0,7);ctx.fill();
    ctx.fillStyle='#fff6c9';ctx.fillRect(c.x-w*.35,c.y-s*.5,Math.max(1,w*.25),s*.5)}
}
function drawBanner(){
  if(!BN)return;const t=BN.t,d=BN.dur;let x=0;
  if(t<.22)x=lerp(-W,0,easeOut(t/.22));else if(t>d-.25)x=lerp(0,W,easeIn((t-(d-.25))/.25));
  const y=H*.36,bh=Math.max(34,46*U);
  ctx.save();ctx.translate(x,0);
  ctx.fillStyle='rgba(8,4,18,.78)';ctx.beginPath();ctx.moveTo(-20,y-bh*.85);ctx.lineTo(W+20,y-bh*1.05);ctx.lineTo(W+20,y+bh*.85);ctx.lineTo(-20,y+bh*1.05);ctx.closePath();ctx.fill();
  ctx.fillStyle=BN.color;ctx.fillRect(-20,y-bh*.85-3,W+40,3);ctx.fillRect(-20,y+bh*.85+1,W+40,3);
  ctx.textAlign='center';ctx.textBaseline='middle';
  let fs=Math.round(Math.max(26,50*U));ctx.font=`${fs}px "Black Han Sans","Noto Sans KR",sans-serif`;
  while(ctx.measureText(BN.text).width>W-40&&fs>16){fs-=2;ctx.font=`${fs}px "Black Han Sans","Noto Sans KR",sans-serif`}
  ctx.lineWidth=6;ctx.lineJoin='round';ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(BN.text,W/2,y-bh*.15);ctx.fillStyle=BN.color;ctx.fillText(BN.text,W/2,y-bh*.15);
  ctx.font=`700 ${Math.round(Math.max(11,14*U))}px "Noto Sans KR",sans-serif`;ctx.fillStyle='rgba(240,235,255,.85)';ctx.fillText(BN.sub,W/2,y+bh*.55,W-30);
  ctx.restore();
}
function drawCombo(){
  if(combo<5)return;const s=1+comboPop*.35,col=combo>=100?'#ff4fa3':combo>=40?'#ffc94a':'#ffffff';
  ctx.save();ctx.translate(W-24*U-10,H*.3);ctx.scale(s,s);ctx.rotate(-.06);ctx.textAlign='right';ctx.textBaseline='middle';
  const fs=Math.round(Math.max(22,38*U));ctx.font=`${fs}px "Black Han Sans",sans-serif`;ctx.lineWidth=6;ctx.lineJoin='round';
  ctx.strokeStyle='rgba(10,4,20,.9)';ctx.strokeText(combo,0,0);ctx.fillStyle=col;ctx.fillText(combo,0,0);
  const lb='콤보 +'+Math.min(50,Math.round(combo*.5))+'%';
  ctx.font=`${Math.round(fs*.38)}px "Black Han Sans",sans-serif`;ctx.lineWidth=4;ctx.strokeText(lb,0,fs*.62);ctx.fillStyle='rgba(240,235,255,.85)';ctx.fillText(lb,0,fs*.62);
  ctx.restore();
}
function drawCutin(){
  if(!CUT)return;const t=CUT.t,d=CUT.dur,inK=easeOut(Math.min(1,t/.16)),outK=t>d-.2?easeIn((t-(d-.2))/.2):0;
  const bh=clamp(H*.3,90,200),y=H*.42,sk=Math.min(40,W*.05);
  ctx.save();ctx.fillStyle=`rgba(0,0,0,${.5*(1-outK)*inK})`;ctx.fillRect(0,0,W,H);
  ctx.translate(lerp(W,0,inK)-outK*W*1.2,0);
  ctx.beginPath();ctx.moveTo(-40,y-bh/2+sk);ctx.lineTo(W+40,y-bh/2-sk);ctx.lineTo(W+40,y+bh/2-sk);ctx.lineTo(-40,y+bh/2+sk);ctx.closePath();
  ctx.fillStyle='#0a0612';ctx.fill();ctx.save();ctx.clip();
  const g=ctx.createLinearGradient(0,y-bh/2,0,y+bh/2);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.5,CUT.col);g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalAlpha=.4;ctx.fillStyle=g;ctx.fillRect(-40,y-bh,W+80,bh*2);ctx.globalAlpha=1;
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;ctx.beginPath();
  for(let i=0;i<22;i++){const ly=y-bh/2+((i*37)%bh),lx=W-((t*2600+i*211)%(W+300));ctx.moveTo(lx,ly);ctx.lineTo(lx+120+(i%3)*60,ly)}ctx.stroke();
  const ps=bh/120;ctx.save();ctx.translate(W*.24,y+bh*.2);ctx.scale(ps,ps);
  ctx.fillStyle='#8c83c6';ctx.beginPath();ctx.roundRect(-72,14,144,80,34);ctx.fill();
  ctx.fillStyle='#8a1f3a';ctx.beginPath();ctx.moveTo(-60,30);ctx.lineTo(-90,90);ctx.lineTo(-40,90);ctx.fill();
  ctx.fillStyle='#ff6a3d';ctx.beginPath();ctx.moveTo(-10,-60);ctx.quadraticCurveTo(-60,-86,-84,-50);ctx.quadraticCurveTo(-40,-66,-6,-48);ctx.fill();
  ctx.fillStyle='#d6d0f7';ctx.beginPath();ctx.arc(0,-18,46,0,7);ctx.fill();ctx.fillStyle='#9d95c4';ctx.beginPath();ctx.arc(-14,-10,40,1.6,3.6);ctx.fill();
  ctx.fillStyle=CUT.col;ctx.shadowColor=CUT.col;ctx.shadowBlur=24;ctx.fillRect(-4,-30,54,12);ctx.shadowBlur=0;
  ctx.fillStyle='#fff';star4(34,-24,16,4,0);ctx.fill();
  ctx.restore();
  ctx.textAlign='left';ctx.textBaseline='middle';let fs=Math.round(bh*.34);const tx=W*.42;
  ctx.font=`${fs}px "Black Han Sans",sans-serif`;while(ctx.measureText(CUT.name).width>W-tx-16&&fs>18){fs-=2;ctx.font=`${fs}px "Black Han Sans",sans-serif`}
  ctx.lineWidth=6;ctx.strokeStyle='#000';ctx.lineJoin='round';ctx.strokeText(CUT.name,tx,y-fs*.15);ctx.fillStyle='#fff';ctx.fillText(CUT.name,tx,y-fs*.15);
  ctx.font=`700 ${Math.max(10,Math.round(fs*.3))}px "Noto Sans KR",sans-serif`;ctx.fillStyle=CUT.col;ctx.fillText(CUT.sub,tx+4,y+fs*.6);
  if(CUT.pair){const k=easeOut(Math.min(1,t/.35)),ds=Math.max(7,fs*.2),py=y-fs*1.05,gap=ds*2.6,mx=tx+ds*2.2;
    CUT.pair.forEach((col,i)=>{const px=mx+(i?gap/2:-gap/2)*(.35+.65*k)+(i?1:-1)*(1-k)*60;ctx.save();ctx.translate(px+ds,py);ctx.rotate(Math.PI/4);
      ctx.shadowColor=col;ctx.shadowBlur=14;ctx.fillStyle=col;ctx.fillRect(-ds,-ds,ds*2,ds*2);ctx.restore()});
    if(k>=1){ctx.fillStyle='#fff';star4(mx+ds,py,ds*2.2*(1+.2*Math.sin(t*30)),ds*.5,0);ctx.fill()}}
  ctx.restore();ctx.restore();
}
function drawBossFinisher(){
  if(!BF)return;const t=BF.t,d=BF.dur;
  const inK=easeOut(Math.min(1,t/.18)),outK=t>d-.25?easeIn((t-(d-.25))/.25):0,a=(1-outK)*inK;
  if(a<=0)return;
  const cy=H*.43,bh=clamp(H*.34,105,220),sk=Math.min(45,W*.06),slam=t<.18?1+.28*(1-t/.18):1;
  ctx.save();
  ctx.fillStyle=`rgba(0,0,0,${.58*a})`;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.beginPath();ctx.moveTo(-50,cy-bh/2+sk);ctx.lineTo(W+50,cy-bh/2-sk);ctx.lineTo(W+50,cy+bh/2-sk);ctx.lineTo(-50,cy+bh/2+sk);ctx.closePath();
  ctx.fillStyle='#07040e';ctx.globalAlpha=a;ctx.fill();ctx.clip();
  const g=ctx.createRadialGradient(W*.5,cy,10,W*.5,cy,W*.55);g.addColorStop(0,BF.col);g.addColorStop(.6,'rgba(10,4,20,.6)');g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalAlpha=.45*a;ctx.fillStyle=g;ctx.fillRect(-50,cy-bh,W+100,bh*2);
  ctx.globalAlpha=.5*a;ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;ctx.beginPath();
  for(let i=0;i<24;i++){const ly=cy-bh/2+((i*31)%bh),lx=W-((t*3200+i*173)%(W+400));ctx.moveTo(lx,ly);ctx.lineTo(lx+140+(i%3)*70,ly)}ctx.stroke();
  if(t<.32){const sk2=Math.min(1,t/.12),sw=Math.max(1,8*U*(1-t/.32));ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-t/.32;
    ctx.fillStyle='#fff';ctx.fillRect(W*.5-W*.6*sk2,cy-sw/2,W*1.2*sk2,sw);ctx.fillStyle=BF.col;ctx.fillRect(W*.5-W*.65*sk2,cy-sw,W*1.3*sk2,sw*2);ctx.globalCompositeOperation='source-over'}
  ctx.globalAlpha=.8*a;ctx.strokeStyle=BF.col;ctx.lineWidth=2.5*U;ctx.beginPath();
  ctx.moveTo(-50,cy-bh/2+sk);ctx.lineTo(W+50,cy-bh/2-sk);ctx.moveTo(-50,cy+bh/2+sk);ctx.lineTo(W+50,cy+bh/2-sk);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1*U;ctx.stroke();ctx.restore();
  ctx.save();ctx.translate(W*.5,cy);ctx.scale(slam,slam);ctx.globalAlpha=a;
  const chipFs=Math.max(10,Math.round(bh*.13));ctx.font=`700 ${chipFs}px "Noto Sans KR",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
  const chipY=-bh*.26,chipTxt=`◆  ${BF.kind}  ◆`,chipW=ctx.measureText(chipTxt).width+24;
  ctx.fillStyle='rgba(15,10,30,.85)';ctx.strokeStyle=BF.col;ctx.lineWidth=1.5;ctx.beginPath();
  ctx.roundRect(-chipW/2,chipY-chipFs*.8,chipW,chipFs*1.6,chipFs*.8);ctx.fill();ctx.stroke();
  ctx.fillStyle=BF.col;ctx.shadowColor=BF.col;ctx.shadowBlur=8;ctx.fillText(chipTxt,0,chipY);ctx.shadowBlur=0;
  let fs=Math.round(clamp(bh*.38,28,54));const maxW=W*.82;
  ctx.font=`${fs}px "Black Han Sans",sans-serif`;
  while(ctx.measureText(BF.name).width>maxW&&fs>16){fs-=2;ctx.font=`${fs}px "Black Han Sans",sans-serif`}
  const mainY=bh*.03;ctx.lineJoin='round';ctx.lineWidth=Math.max(6,Math.round(fs*.18));ctx.strokeStyle='#000';ctx.strokeText(BF.name,0,mainY);
  ctx.fillStyle='#fff';ctx.shadowColor=BF.col;ctx.shadowBlur=20;ctx.fillText(BF.name,0,mainY);ctx.shadowBlur=0;
  const nameHalfW=ctx.measureText(BF.name).width/2,starDist=Math.min(nameHalfW+18,W*.46);
  ctx.fillStyle='#fff';const starS=Math.max(6,fs*.22)*(1+.15*Math.sin(t*24));
  star4(-starDist,mainY,starS,starS*.35,0);ctx.fill();star4(starDist,mainY,starS,starS*.35,0);ctx.fill();
  const subFs=Math.max(10,Math.round(fs*.28));ctx.font=`700 ${subFs}px "Noto Sans KR",sans-serif`;const subY=bh*.31;
  ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.strokeText(BF.sub,0,subY);ctx.fillStyle='rgba(240,235,255,.9)';ctx.fillText(BF.sub,0,subY);
  ctx.restore();ctx.restore();
}
function drawCracks(){
  for(const c of CR){const t=c.t,al=t<c.dur*.6?1:Math.max(0,1-(t-c.dur*.6)/(c.dur*.4)),k=Math.min(1,t/.06);
    ctx.globalAlpha=al;ctx.lineJoin='round';
    for(const [col,lw] of [['rgba(0,0,0,.55)',4],['rgba(255,255,255,.9)',1.4]]){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();
      for(const l of c.lines){const n=Math.max(2,Math.ceil(l.length/2*k));ctx.moveTo(l[0],l[1]);for(let j=1;j<n;j++)ctx.lineTo(l[j*2],l[j*2+1])}
      for(const [rr,a0,a1] of c.rings){ctx.moveTo(c.x+Math.cos(a0)*rr,c.y+Math.sin(a0)*rr);ctx.arc(c.x,c.y,rr,a0,a1)}
      ctx.stroke()}
    ctx.fillStyle='rgba(230,240,255,.7)';for(const s of c.sh){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.r);ctx.beginPath();ctx.moveTo(0,-s.s);ctx.lineTo(s.s*.7,s.s*.5);ctx.lineTo(-s.s*.6,s.s*.4);ctx.closePath();ctx.fill();ctx.restore()}
    ctx.globalAlpha=1}
}
function drawInk(){
  if(inkT<0)return;ctx.fillStyle='#06040c';
  for(const b of inkB){const k1=clamp((inkT-b.d)/.42,0,1),k2=clamp((inkT-.72-b.d)/.42,0,1),r=b.r*easeOut(k1)*(1-easeIn(k2));if(r<=1)continue;
    ctx.beginPath();ctx.arc(b.x,b.y,r,0,7);for(const [a,f,s] of b.s){const cx=b.x+Math.cos(a)*r*f,cy=b.y+Math.sin(a)*r*f;ctx.moveTo(cx+r*s,cy);ctx.arc(cx,cy,r*s,0,7)}ctx.fill()}
  const full=clamp((inkT-.35)/.15,0,1)*(1-clamp((inkT-.75)/.15,0,1));if(full>0){ctx.globalAlpha=full;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}
}
function render(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const sh=trauma*trauma,amp=24*U;
  const sx=(Math.random()*2-1)*amp*sh,sy=(Math.random()*2-1)*amp*sh;
  ctx.save();ctx.translate(W/2+sx,H*.6+sy);ctx.scale(zoom,zoom);ctx.rotate((Math.random()*2-1)*.025*sh);ctx.translate(-W/2,-H*.6);
  drawBG();
  if(dimCur>.01){ctx.fillStyle=`rgba(4,2,10,${dimCur})`;ctx.fillRect(-60,-60,W+120,H+120)}
  for(const o of FX)o.back&&o.back(o);
  drawCircleBuff();drawAllies();
  drawBossIntroWorld();
  if(m)drawMonster(m);
  drawBossRoar();
  drawBossPat();drawRain();
  drawHero();drawSpirits();
  for(const o of FX)o.draw&&o.draw(o);
  drawParticles();drawTexts();
  ctx.restore();
  if(desat>0){ctx.globalCompositeOperation='saturation';ctx.fillStyle='#808080';ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(0,0,W,H)}
  for(const o of FX)o.post&&o.post(o);
  if(frenzyT>0){ctx.fillStyle=`rgba(255,40,120,${.06+.04*Math.sin(gt*8)})`;ctx.fillRect(0,0,W,H)}
  if(tintCur>.01){ctx.fillStyle=`rgba(${tintC},${tintCur})`;ctx.fillRect(0,0,W,H)}
  ctx.fillStyle=VIG;ctx.fillRect(0,0,W,H);
  if(flashA>0){ctx.fillStyle=`rgba(${flashC},${flashA*.6})`;ctx.fillRect(0,0,W,H)}
  if(invertT>0&&!RM){ctx.globalCompositeOperation='difference';ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over'}
  drawInk();drawCracks();
  drawBossIntro();drawPhasePlate();drawLinkHint();
  drawCoins();drawCombo();drawBanner();drawCutin();drawBossFinisher();
}

/* ================= UI ================= */
let mode=1;
const upsEl=$('ups'),rows={};
for(const u of UP){
  const el=document.createElement('div');el.className='up';
  el.innerHTML=`<span class="badge" style="--c:${u.c}">${u.b}</span><div><div class="up-name">${u.name}<span class="lv"></span></div><div class="up-desc"></div></div><button class="buy" id="buy-${u.id}"><span class="n"></span><span class="c"><i class="coin"></i><span></span></span></button>`;
  upsEl.appendChild(el);
  rows[u.id]={lv:el.querySelector('.lv'),desc:el.querySelector('.up-desc'),btn:el.querySelector('.buy'),n:el.querySelector('.n'),c:el.querySelector('.c span')};
  rows[u.id].btn.addEventListener('click',()=>buy(u));
}
function barOrder(){const o=[];for(const c of COMBOS)for(const id of [c.a,c.b]){const s=skOf(id);if(equipped(s)&&!o.includes(s))o.push(s)}for(const s of SK)if(equipped(s)&&!o.includes(s))o.push(s);return o}
function buildBar(){
  const bar=$('skBar');bar.innerHTML='';
  let prev=null;for(const s of barOrder()){if(prev&&COMBOS.some(c=>c.a===prev.id&&c.b===s.id)){const l=document.createElement('span');l.className='lnk';l.textContent='⛓';l.style.color=comboOf(s.id).col;l.setAttribute('aria-hidden','true');bar.appendChild(l)}prev=s;const b=document.createElement('button');b.className='skill';b.style.setProperty('--c',s.c);
    b.setAttribute('aria-label',s.name);b.innerHTML=IC[s.id]+`<span class="k">${s.name}</span><span class="cd"></span>`;
    b.addEventListener('click',()=>{ensureAudio();if(!cast(s)){try{b.animate([{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'none'}],{duration:150})}catch(e){}}});
    bar.appendChild(b);s.el=b}
  for(const s of SK)if(!equipped(s))s.el=null;
  const a=document.createElement('button');a.className='skill awk';a.id='awk';a.setAttribute('aria-label','각성: 천검멸');
  const A=awkSel();a.setAttribute('aria-label','각성기: '+A.name);a.innerHTML=awkIcon(A)+'<span class="k">'+A.name+'</span><span class="cd"></span>';
  a.addEventListener('click',()=>{ensureAudio();if(!castAwaken()){try{a.animate([{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'none'}],{duration:150})}catch(e){}}});
  bar.appendChild(a);
}
function toggleEquip(id){const i=S.equip.indexOf(id);
  if(i>=0)S.equip.splice(i,1);else{if(S.equip.length>=8){banner('슬롯이 가득 찼습니다','다른 스킬을 먼저 해제하세요','#9d95c4',1.4);return}S.equip.push(id)}
  buildBar();buildBook();save()}
function buildBook(){
  buildAwk();
  const el=$('book'),TR=tier();el.innerHTML='';$('slotTxt').textContent=`장착 ${S.equip.length}/8 · 연출 ${'★'.repeat(TR)}${'☆'.repeat(3-TR)}`;
  for(const s of SK){const r=document.createElement('div'),lk=!unlocked(s),eq=equipped(s);r.className='bk'+(lk?' locked':'');r.style.setProperty('--c',s.c);
    r.innerHTML=`<i></i><div><b>${s.name}</b><small>${s.d}${comboTag(s)}</small>${awkHTML(s)}</div><div class="st">${lk?'STAGE '+s.unlock:''}<span class="btns">${lk?'':`<button type="button" class="eq${eq?' on':''}">${eq?'해제':'장착'}</button>`}<button type="button" class="pv">시연</button></span></div>`;
    r.querySelectorAll('[data-br]').forEach(x=>x.addEventListener('click',()=>{setBranch(s,x.dataset.br);buildBook()}));
    const ab=r.querySelector('.awkbuy');if(ab)ab.addEventListener('click',()=>{ensureAudio();if(buyAwk(s))buildBook()});
    const eb=r.querySelector('.eq');if(eb)eb.addEventListener('click',()=>toggleEquip(s.id));
    r.querySelector('.pv').addEventListener('click',()=>{ensureAudio();if(!cast(s,true))banner('지금은 시연할 수 없음','몬스터와 싸우는 중에 다시 눌러 주세요','#9d95c4',1.4)});
    el.appendChild(r)}
  const cb=$('combos');cb.innerHTML='<div class="cbrule">⛓ <b>시작 스킬</b>을 쓰면 짝 스킬의 재사용 대기가 <b>'+PRIME_CD+'초 이하</b>로 줄어듭니다. '+comboWin()+'초 안에 짝 스킬을 쓰면 연계기가 발동하고, 시작 스킬 대기가 <b>절반</b>으로 줄며 각성 게이지가 20 찹니다. 자동 스킬은 짝 스킬을 아껴 두었다가 연계로 씁니다.</div>';
  for(const c of COMBOS){const a=skOf(c.a),b=skOf(c.b),ok=comboReady(c),both=equipped(a)&&equipped(b),d=document.createElement('div');
    d.className='cbc'+(ok?'':' locked');d.style.setProperty('--c',c.col);
    const st=!ok?`STAGE ${Math.max(a.unlock,b.unlock)}에 해금`:both?'준비됨 · 자동 스킬이면 알아서 이어 씁니다':'두 스킬을 모두 장착해야 발동';
    d.innerHTML=`<div class="cbf"><span class="ic" style="--c:${a.c}">${IC[a.id]}</span><em>＋</em><span class="ic" style="--c:${b.c}">${IC[b.id]}</span><em>=</em><b>${c.name}</b></div>`+
      `<p><span style="color:${a.c}">${a.name}</span>${eul(a.name)} 쓴 뒤 <b>${comboWin()}초 안에</b> <span style="color:${b.c}">${b.name}</span>${eul(b.name)} 쓰면 발동. ${c.d}</p>`+
      `<div class="cbs"><span class="${ok&&both?'ok':''}">${st}</span><button type="button">시연</button></div>`;
    d.querySelector('button').addEventListener('click',()=>{ensureAudio();if(!previewCombo(c))banner('지금은 시연할 수 없음','몬스터와 싸우는 중에 다시 눌러 주세요','#9d95c4',1.4)});
    cb.appendChild(d)}
}
function eul(w){const c=w.charCodeAt(w.length-1)-0xAC00;return c>=0&&c<11172&&c%28?'을':'를'}
function comboTag(s){
  const c=COMBOS.find(c=>c.a===s.id||c.b===s.id);if(!c)return'';const o=skOf(c.a===s.id?c.b:c.a);
  return `<span class="ctag" style="--c:${c.col}">⛓ ${c.a===s.id?`다음에 ${o.name}`:`${o.name} 다음에`} → ${c.name}</span>`;
}
function buildRelics(){
  const el=$('relics');el.innerHTML='';
  for(const r of RELICS){const l=rv(r.id),d=document.createElement('div');d.className='rl'+(l?'':' none');d.style.setProperty('--c',RAR[r.r].c);
    d.innerHTML=`<i>${l?r.g:'?'}</i><div><b>${l?r.name:'???'}</b><small>${l?r.d(l):RAR[r.r].n+' 유물'}</small></div>${l?`<span>Lv.${l}</span>`:''}`;el.appendChild(d)}
}
const pullCost=()=>goldDrop(Math.max(1,S.best))*30*Math.pow(1.25,S.pulls);
function buildAch(){
  const el=$('achs');el.innerHTML='';let n=0;
  for(const a of ACH){const done=!!S.ach[a.id],[v,t]=a.p();if(done)n++;const d=document.createElement('div');d.className='ac'+(done?' done':'');
    d.innerHTML=`<div><b>${a.name}</b><small>${a.desc} · 칭호 「${a.title}」</small></div><span>${done?'달성':Math.min(v,t)+'/'+t}</span>`;el.appendChild(d)}
  $('achTxt').textContent=`${n}/${ACH.length} · 공격력 +${n*3}%`;
}
function titleUI(){const e=$('titleTxt');e.textContent=S.title?'「'+S.title+'」':'';e.hidden=!S.title}
function checkAch(){for(const a of ACH){if(S.ach[a.id])continue;const [v,n]=a.p();if(v>=n){S.ach[a.id]=1;S.title=a.title;ST=stats();
  banner('업적 달성 · '+a.name,'칭호 「'+a.title+'」 · 공격력 +3%','#ffc94a',2.2);sfx.fanfare();buildAch();titleUI();save()}}}
function plan(u){
  const l=S.lv[u.id],room=u.max-l;if(room<=0)return{n:0,c:0};
  const want=mode==='max'?Math.min(room,2000):Math.min(mode,room);let n=0,c=0;
  while(n<want){const k=u.cost(l+n);if(mode==='max'&&c+k>S.gold)break;c+=k;n++}
  if(n===0)return{n:1,c:u.cost(l)};return{n,c};
}
function levelFx(u){
  const x=heroX,y=groundY-50*U;
  P.push({t:'ring',x,y,r0:10*U,r1:120*U,w:6*U,life:.45,max:.45,color:u.c});
  P.push({t:'ring',x,y:groundY,r0:10*U,r1:110*U,w:5*U,sy:.25,life:.5,max:.5,color:u.c});
  for(let i=0;i<18;i++)P.push({t:'dot',x:x+rnd(-40,40)*U,y:groundY-rnd(0,90)*U,vx:rnd(-30,30)*U,vy:-rnd(120,320)*U,g:0,drag:1.5,size:rnd(1.5,3.5)*U,life:rnd(.5,1),max:1,color:u.c});
  T.push({x,y:groundY-120*U,vx:0,vy:-90*U,text:u.name+' UP',crit:0,label:'',size:20,life:1,max:1,color:u.c});
}
function buy(u){
  ensureAudio();const p=plan(u);if(!p.n||S.gold<p.c)return;
  const oldT=tier();S.gold-=p.c;S.lv[u.id]+=p.n;ST=stats();levelFx(u);sfx.buy();
  if(tier()>oldT){banner('스킬 연출 강화!','연출 단계 '+'★'.repeat(tier()),'#9b6bff',2);sfx.chime();buildBook()}
  try{rows[u.id].btn.animate([{transform:'scale(.9)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:220})}catch(e){}
  lastDesc='';uiTick(true);
}
document.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{
  mode=b.dataset.m==='max'?'max':+b.dataset.m;document.querySelectorAll('.seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));uiTick(true)}));
let lastDesc='';
function uiTick(force){
  $('goldTxt').textContent=fmt(dispGold);
  $('dpsTxt').textContent=fmt(dps());
  $('critTxt').textContent=Math.round(ST.cc*100)+'% · ×'+ST.cm.toFixed(1);
  $('bestTxt').textContent=S.best;
  $('soulTxt').textContent=S.souls+' (+'+S.souls*10+'%)';
  const key=JSON.stringify(S.lv)+S.souls+mode+Math.floor(Math.log10(S.gold+1)*20)+Object.keys(S.relics).length;
  for(const u of UP){const r=rows[u.id],l=S.lv[u.id],p=plan(u),max=l>=u.max;
    r.lv.textContent=max?'Lv.MAX':'Lv.'+l;
    if(key!==lastDesc||force){const nx=Object.assign({},S.lv,{[u.id]:l+Math.max(1,p.n)});r.desc.innerHTML=max?u.d(ST,ST).replace(/ → .*$/,''):u.d(ST,stats(nx))}
    r.btn.classList.toggle('max',max);r.btn.classList.toggle('can',!max&&S.gold>=p.c);r.btn.disabled=max;
    r.n.textContent=max?'완료':'+'+p.n;r.c.textContent=max?'—':fmt(p.c)}
  lastDesc=key;
  {const sr=stageEl.getBoundingClientRect(),bb=$('skBar').getBoundingClientRect();if(bb.height>0)hintY=bb.top-sr.top-Math.max(20,16*U)}
  const LK=activeLink();
  for(const s of SK){const b=s.el;if(!b)continue;b.classList.toggle('link',!!LK&&LK.c.b===s.id&&cds[s.id]<=0);const sl=sealed(s),lk=!unlocked(s)||sl,cd=cds[s.id],act=s.buff&&frenzyT>0,mx=s.cd*ST.cdm;
    b.classList.toggle('locked',lk);b.style.setProperty('--p',lk?1:act?0:Math.min(1,cd/mx));
    b.classList.toggle('ready',!lk&&cd<=0&&(s.buff?frenzyT<=0:castLock<=0));
    b.querySelector('.cd').textContent=lk?(sl?'봉인':'ST'+s.unlock):act?Math.ceil(frenzyT):cd>0?Math.ceil(cd):''}
  const a=$('awk');if(a){a.style.setProperty('--g',gauge/100);a.classList.toggle('full',gauge>=100);a.querySelector('.cd').textContent=gauge>=100?'':Math.floor(gauge)+'%'}
  if(m&&m.boss&&m.state==='fight')$('bossFill').style.width=clamp(bossT/bossMax*100,0,100)+'%';
  const pc=pullCost(),pb=$('pull');pb.querySelector('span').textContent=fmt(pc);pb.classList.toggle('can',S.gold>=pc);
  const g=soulGain(),btn=$('prestige');
  if(S.maxStage<30){$('soulDesc').innerHTML=`이번 여정에서 <b>STAGE 30</b>에 도달하면 환생할 수 있습니다. 현재 최고 <b>${S.maxStage}</b>. 유물·업적·스킬 해금은 유지됩니다.`;btn.disabled=true;btn.textContent='환생하기'}
  else{$('soulDesc').innerHTML=`처음부터 다시 걷는 대신 환생석 <b>+${g}</b>개를 얻습니다. 환생석 하나마다 공격력과 골드 <b>+10%</b>. 유물·업적·스킬 해금은 유지됩니다.`;btn.disabled=false;if(!armed)btn.textContent=`환생하고 환생석 ${g}개 받기`}
}
function stageUI(){
  const boss=isBoss(S.stage)&&!S.farm;
  $('stageTxt').textContent=CH?'일일 도전 · 시련':`STAGE ${S.stage}`+(boss?' · 보스':S.farm?' · 반복 사냥':'');
  $('zoneTxt').textContent=CH?CH.mods.map(x=>x.n).join(' · '):ZONES[zoneOf(S.stage)];
  $('bossBar').hidden=!boss;$('pips').hidden=boss;$('retry').hidden=!S.farm||!!CH;
  const pe=$('pips');if(pe.children.length!==KPS){pe.innerHTML='';for(let i=0;i<KPS;i++)pe.appendChild(document.createElement('i'))}
  [...pe.children].forEach((e,i)=>e.classList.toggle('on',S.farm?true:i<S.kills));
  if(boss)$('bossFill').style.width='100%';
}
const soulGain=()=>S.maxStage<30?0:Math.floor(Math.pow((S.maxStage-25)/5,1.6)*2);
let armed=false,armT=0;
$('prestige').addEventListener('click',()=>{
  ensureAudio();const g=soulGain();if(!g)return;const btn=$('prestige');
  if(!armed){armed=true;btn.textContent='한 번 더 누르면 환생합니다';clearTimeout(armT);armT=setTimeout(()=>{armed=false;uiTick(true)},3000);return}
  armed=false;clearTimeout(armT);
  if(CH)endChallenge();
  Object.assign(S,{gold:0,stage:1,kills:0,maxStage:1,farm:false,farmKills:0,lv:freshLv()});S.souls+=g;S.rebirths++;
  ST=stats();m=null;spawnT=1;miniQ=0;P=[];T=[];B=[];PR=[];FX=[];combo=0;frenzyT=0;castLock=0;h.ox=null;h.hide=false;shieldOn=null;desat=0;dispGold=0;
  for(const s of SK)cds[s.id]=0;
  flash(1,'220,190,255');addTrauma(.6);startInk();banner('환생',`환생석 +${g} · 공격력과 골드 +${g*10}%`,'#c77dff',2.4);sfx.fanfare();
  stageUI();buildBook();uiTick(true);save();
});
$('pull').addEventListener('click',()=>{ensureAudio();const c=pullCost();if(S.gold<c){banner('골드가 부족합니다',fmt(c)+' 골드가 필요해요','#9d95c4',1.3);return}
  S.gold-=c;S.pulls++;dispGold=S.gold;relicQ.push({x:(heroX+monX)/2,boss:false});uiTick(true)});
$('retry').addEventListener('click',()=>{ensureAudio();retryBoss()});
$('autoSk').addEventListener('change',e=>{S.auto=e.target.checked;save()});
$('soundBtn').addEventListener('click',()=>{S.sound=!S.sound;if(S.sound)ensureAudio();soundUI();save()});
function soundUI(){const b=$('soundBtn');b.textContent=S.sound?'소리 켬':'소리 끔';b.setAttribute('aria-pressed',S.sound)}
cv.addEventListener('pointerdown',e=>{
  ensureAudio();const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
  P.push({t:'ring',x,y,r0:4*U,r1:40*U,w:4*U,life:.25,max:.25,color:'#ffffff'});
  if(skipBossIntro())return;
  if(m&&m.pat&&!m.pat.res){const d=m.pat.imp-m.pat.t;if(d<=.5&&d>=0)m.pat.parry=true}
  const now=performance.now();if(now-lastTap<66||castLock>0)return;lastTap=now;heroStrike(true);
});

/* ================= offline ================= */
let pending=0;
function showOffline(sec){
  sec=Math.min(sec,8*3600);if(S.totalKills<1)return;
  const kps=Math.min(dps()/monHp(S.stage),1.5)*.6;
  const amt=sec*kps*goldDrop(S.stage)*ST.gm*.5;if(amt<1)return;
  pending+=amt;const hh=Math.floor(sec/3600),mm=Math.floor(sec%3600/60);
  $('awayTxt').textContent=`자리를 비운 ${hh?hh+'시간 ':''}${mm}분 동안 기사와 동료들이 대신 싸웠습니다.`;
  $('awayGold').textContent=fmt(pending);$('modal').hidden=false;
}
$('collect').addEventListener('click',()=>{
  ensureAudio();$('modal').hidden=true;const n=36,v=pending/n;pending=0;
  for(let i=0;i<n;i++)C.push({x:W/2+rnd(-60,60)*U,y:H*.4,vx:rnd(-600,600)*U,vy:rnd(-900,-300)*U,ph:0,wait:rnd(.3,.9),spin:rnd(0,6),v});
  flash(.4,'255,210,120');sfx.fanfare();
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)save();else{const away=(Date.now()-S.t)/1000;if(away>30)showOffline(away);last=performance.now()}
});
window.addEventListener('pagehide',save);

/* ================= loop ================= */
let last=performance.now();
function frame(now){
  let rdt=(now-last)/1000;last=now;rdt=Math.min(rdt,.05);
  try{update(rdt);render()}catch(e){console.error(e)}
  uiAcc+=rdt;if(uiAcc>.1){uiAcc=0;uiTick()}
  achAcc+=rdt;if(achAcc>.5){achAcc=0;checkAch()}
  saveAcc+=rdt;if(saveAcc>5){saveAcc=0;save();chUI()}
  requestAnimationFrame(frame);
}
function start(data){
  load(data&&data.S);
  if(!Array.isArray(S.equip))S.equip=SK.filter(unlocked).slice(0,8).map(s=>s.id);
  S.equip=S.equip.filter(id=>SK.some(s=>s.id===id));
  ST=stats();dispGold=S.gold;zoneShown=zoneOf(S.stage);
  $('autoSk').checked=S.auto;soundUI();titleUI();
  resize();new ResizeObserver(resize).observe(stageEl);
  stageUI();buildBar();buildBook();buildRelics();buildAch();chUI();uiTick(true);
  const away=(Date.now()-S.t)/1000;if(away>60)showOffline(away);
  if(S.totalKills===0)banner('끝없는 검로','화면을 눌러 직접 베어라','#ffc94a',2.2);
  try{document.fonts.load('40px "Black Han Sans"')}catch(e){}
  last=performance.now();requestAnimationFrame(frame);
}
try{window.claude?.hot?.snapshot?.(()=>({S:Object.assign({},S,{t:Date.now()})}))}catch(e){}
if(window.claude?.hot?.ready)window.claude.hot.ready(start);else start(window.claude?.hot?.data??{});

/* ================= boss phase 2 ================= */
function startPhase2(){m.ph2=true;m.state='phase';m.pat=null;m.P2={t:0};castLock=Math.max(castLock,.2);sfx.warn()}
function updPhase2(dt){
  const P2=m.P2;P2.t+=dt;const t=P2.t,c=mCenter(m);
  castLock=Math.max(castLock,.1);dimT=Math.max(dimT,.6);tintA=Math.max(tintA,.14);tintC='255,20,40';
  if(t<1){m.lyT=-25*U*easeOut(t);m.sq=.05*Math.sin(t*60);m.sqv=0;addTrauma(dt*.9);
    if(Math.random()<dt*90){const a=rnd(0,7),r=rnd(100,220)*U;P.push({t:'dot',x:c.x+Math.cos(a)*r,y:c.y+Math.sin(a)*r,vx:-Math.cos(a)*r/.3,vy:-Math.sin(a)*r/.3,g:0,drag:0,size:rnd(2,4)*U,life:.3,max:.3,color:Math.random()<.5?'#ff1a3a':'#ff8a9a'})}}
  for(const b of [.05,.4,.72])at(P2,b,()=>sfx.beat());
  at(P2,1,()=>{m.enraged=true;m.hue=(m.hue+170)%360;m.rb*=1.12;m.name='진노한 '+m.name;
    if(S.stage>=10&&m.sh<=0){m.shMax=m.max*.12;m.sh=m.shMax}
    flash(.9,'255,40,60');invertT=.08;stop=Math.max(stop,.15);addTrauma(1);zoom+=.12*FXS;sfx.roar();sfx.bigboom();
    for(const [r1,col,w] of [[320,'#ff1a3a',12],[220,'#ffffff',6]])P.push({t:'ring',x:c.x,y:c.y,r0:10*U,r1:r1*U,w:w*U,life:.5,max:.5,color:col});
    P.push({t:'ring',x:m.x,y:groundY,r0:10*U,r1:360*U,w:10*U,sy:.2,life:.6,max:.6,color:'#ff1a3a'});
    burst(c.x,c.y,['#ff1a3a','#fff','#ff8a9a'],50,1600);smoke(c.x,c.y,14,'#2a0008',1.4);addCrack(c.x,c.y,true)});
  at(P2,2.3,()=>{m.state='fight';m.atkT=1.2;castLock=0});
}
function drawPhasePlate(){
  if(!m||!m.P2||m.P2.t<1.05||m.P2.t>2.6)return;const t=m.P2.t-1.05,out=easeIn(clamp((t-1.2)/.3,0,1)),s=t<.15?lerp(2.4,1,easeOut(t/.15)):1;
  ctx.save();ctx.globalAlpha=1-out;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  ctx.translate(W/2,H*.34);ctx.scale(s,s);ctx.rotate(-.04);const fs=Math.round(Math.max(38,76*U));
  ctx.font=`${fs}px "Black Han Sans",sans-serif`;ctx.lineWidth=9;ctx.strokeStyle='#000';ctx.strokeText('PHASE 2',0,0);ctx.fillStyle='#ff2a3a';ctx.fillText('PHASE 2',0,0);
  let f2=Math.round(fs*.36);ctx.font=`${f2}px "Black Han Sans",sans-serif`;while(ctx.measureText(m.name).width>W*.9&&f2>12){f2-=2;ctx.font=`${f2}px "Black Han Sans",sans-serif`}
  ctx.lineWidth=5;ctx.strokeText(m.name,0,fs*.72);ctx.fillStyle='#fff';ctx.fillText(m.name,0,fs*.72);
  ctx.font=`700 ${Math.round(Math.max(11,13*U))}px "Noto Sans KR",sans-serif`;ctx.fillStyle='#ffb3ba';ctx.fillText('공격이 빨라지고 새 패턴 「핏빛 유성」을 씁니다',0,fs*1.2,W*.9);
  ctx.restore();
}
function drawRain(){
  if(!m||!m.pat||m.pat.ty!=='rain'||!m.pat.tg||m.state!=='fight')return;const p=m.pat;
  for(const g of p.tg){if(g.done)continue;const k=clamp(1-(g.hit-p.t)/1,0,1);
    ctx.strokeStyle=`rgba(255,42,58,${.4+.5*k})`;ctx.lineWidth=3*U;ctx.beginPath();ctx.ellipse(g.x,groundY+2,lerp(70,22,k)*U,lerp(16,6,k)*U,0,0,7);ctx.stroke();
    ctx.fillStyle=`rgba(255,42,58,${.15*k})`;ctx.beginPath();ctx.ellipse(g.x,groundY+2,22*U,6*U,0,0,7);ctx.fill();
    if(p.t>g.hit-.35){const f=easeIn(clamp((p.t-(g.hit-.35))/.35,0,1)),y=lerp(-40,groundY-10*U,f);
      ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ff2a3a';ctx.lineWidth=10*U;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(g.x,y-90*U);ctx.lineTo(g.x,y);ctx.stroke();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(g.x,y,8*U,0,7);ctx.fill();ctx.globalCompositeOperation='source-over'}}
}

/* ================= skill awakening UI ================= */
function awkHTML(s){
  if(!unlocked(s))return'';const B=br(s.id),D=BR[s.id];
  if(B)return `<div class="brs">${['a','b'].map(k=>`<button type="button" data-br="${k}" class="${B===k?'on':''}">${k.toUpperCase()} · ${D[k][0]}</button>`).join('')}</div><small class="brd">${D[B][1]}</small>`;
  if(S.best>=awkReq(s))return `<button type="button" class="awkbuy">스킬 각성 <i class="coin"></i>${fmt(awkCost(s))}</button><small class="brd">${D.a[0]} / ${D.b[0]} 중 선택</small>`;
  return `<small class="brd dim">STAGE ${awkReq(s)}에 각성 가능 · ${D.a[0]} / ${D.b[0]}</small>`;
}

/* ================= daily challenge UI ================= */
function chUI(){
  const el=$('daily');if(!el)return;const mods=CH?CH.mods:dailyMods(),done=dailyDone();
  el.innerHTML=`<div class="sec-h"><h2>일일 도전</h2><small>${todayKey()} · 매일 조건이 바뀝니다</small></div>
    <div class="mods">${mods.map(x=>`<div class="mod" style="--c:${x.c}"><b>${x.n}</b><small>${x.d}</small></div>`).join('')}</div>
    <p>시련의 군주(STAGE ${CH?CH.stage:chStage()} 보스, 체력 1.5배)를 <b>60초 안에</b> 쓰러뜨리면 골드와 <b>희귀 등급 이상 유물</b>을 받습니다. 실패해도 오늘 안에 다시 도전할 수 있어요.</p>
    <button type="button" id="chBtn" ${CH||done?'disabled':''}>${CH?'시련 진행 중…':done?'오늘의 시련 완료 ✓ · 내일 새 시련':'시련 시작'}</button>`;
  const b=$('chBtn');if(b&&!CH&&!done)b.addEventListener('click',()=>{ensureAudio();startChallenge()});
}

/* ================= awakening picker ================= */
function buildAwk(){
  const el=$('awks');if(!el)return;el.innerHTML='';const sel=awkSel();
  for(const a of AWK){const lk=S.best<a.unlock,on=sel.id===a.id,r=document.createElement('div');r.className='bk'+(lk?' locked':'');r.style.setProperty('--c',a.c);
    r.innerHTML=`<i></i><div><b>${a.name}</b><small>${a.d}</small></div><div class="st">${lk?'STAGE '+a.unlock:''}<span class="btns">${lk?'':`<button type="button" class="eq${on?' on':''}">${on?'선택됨':'선택'}</button>`}<button type="button" class="pv">시연</button></span></div>`;
    const eb=r.querySelector('.eq');if(eb&&!on)eb.addEventListener('click',()=>{S.awkSel=a.id;sfx.link();buildBar();buildAwk();save()});
    r.querySelector('.pv').addEventListener('click',()=>{ensureAudio();if(!previewAwk(a))banner('지금은 시연할 수 없음','몬스터와 싸우는 중에 다시 눌러 주세요','#9d95c4',1.4)});
    el.appendChild(r)}
}
