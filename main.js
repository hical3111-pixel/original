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
  const ty=['slam','beam','charge'][Math.floor(Math.random()*3)];
  m.pat={ty,t:0,imp:ty==='slam'?1.5:ty==='beam'?1.25:1.4,end:ty==='slam'?1.9:ty==='beam'?1.75:1.9,res:0,parry:false};sfx.warn();
  const sh=SK.find(s=>s.id==='shield');if(S.auto&&equipped(sh)&&unlocked(sh)&&cds.shield<=0&&castLock<=0)cast(sh);
}
function bossAI(dt){
  if(!m||!m.boss||m.state!=='fight')return;
  if(m.stun>0){m.stun-=dt;m.pat=null;return}
  if(!m.pat){m.atkT-=dt;if(m.atkT<=0)startPat();return}
  const p=m.pat;p.t+=dt;const R=m.rb*U;
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
  }else{
    if(p.t<1.2){m.pxT=28*U*Math.min(1,p.t/.6)}
    else if(p.t<1.4){m.pxT=lerp(28*U,heroX+75*U-m.x,easeIn((p.t-1.2)/.2));m.pxF=50;if(Math.random()<.6)P.push({t:'ghost',x:m.x+m.px,y:groundY,col:`hsl(${m.hue},60%,50%)`,lean:0,ang:0,life:.15,max:.15})}
    else{m.pxT=lerp(heroX+75*U-m.x,0,easeOut(Math.min(1,(p.t-1.4)/.45)));m.pxF=50}
  }
  if(!p.res&&p.t>=p.imp){p.res=1;resolveHit(p)}
  if(m.pat&&p.t>=p.end){m.pat=null;m.atkT=rnd(4.5,7)}
}
function resolveHit(p){
  const hx=heroX,hy=groundY-60*U,c=mCenter(m);
  if(shieldOn){shieldOn.blocked=true;P.push({t:'star',x:hx+75*U,y:hy-10*U,size:140*U,life:.15,max:.15});burst(hx+75*U,hy,['#e8dcff','#b7a6ff','#fff'],24,1000);
    T.push({x:hx+40*U,y:hy-70*U,vx:0,vy:-90*U,text:'막기!',crit:1,label:'',size:40,life:1,max:1,color:'#d9ccff'});sfx.parry();stop=Math.max(stop,.1);addTrauma(.35);if(p.ty==='charge')m.kv+=900*U;return}
  if(p.parry){S.parries++;sfx.parry();flash(.8,'255,240,190');stop=Math.max(stop,.22);slowT=.8;gauge=Math.min(100,gauge+15*ST.gg);
    T.push({x:hx+30*U,y:hy-80*U,vx:0,vy:-70*U,text:'패링!',crit:1,label:'PERFECT',lcol:'#fff',size:56,life:1.2,max:1.2,color:'#ffe066'});
    P.push({t:'ring',x:hx+50*U,y:hy,r0:10*U,r1:200*U,w:8*U,life:.4,max:.4,color:'#ffe066'});P.push({t:'star',x:hx+60*U,y:hy,size:160*U,life:.16,max:.16});burst(hx+60*U,hy,['#ffe066','#fff'],30,1200);
    m.stun=2.2;m.pat=null;m.kv+=1100*U;deal(ST.atk*8,true,'hero',c.x,c.y,{heavy:1,name:'반격',col:'#ffe066'});return}
  if(rv('phoenix')){for(let i=0;i<16;i++)P.push({t:'flame',x:hx+rnd(-40,40)*U,y:groundY-rnd(0,60)*U,vx:rnd(-40,40)*U,vy:-rnd(200,420)*U,drag:1,g:0,r:rnd(12,26)*U,cols:['#7a1606','#ff8a2a','#ffe08a'],life:rnd(.4,.8),max:.8});
    T.push({x:hx,y:hy-80*U,vx:0,vy:-80*U,text:'불사조!',crit:1,label:'',size:40,life:1,max:1,color:'#ffb040'});
    deal(ST.atk*4*rv('phoenix'),false,'relic',c.x,c.y,{heavy:1,name:'불사조 반격',col:'#ffb040',fc:'255,190,110'});return}
  if(Math.random()<.55){h.dodgeT=0;sfx.whoosh();T.push({x:hx,y:hy-80*U,vx:0,vy:-80*U,text:'회피',crit:0,label:'',size:26,life:.8,max:.8,color:'#e0f6ff'});return}
  h.stun=1.3;flash(.5,'255,40,60');addTrauma(.8);sfx.hurt();burst(hx,hy,['#ff2a3a','#fff'],18,900);
  T.push({x:hx,y:hy-80*U,vx:0,vy:-80*U,text:'기절!',crit:1,label:'',size:36,life:1.1,max:1.1,color:'#ff4f5e'});
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
let dispGold=0,uiAcc=0,saveAcc=0,achAcc=0,lastBump=0;
function update(rdt){
  trauma=Math.max(0,trauma-rdt*1.7);
  zoom+=(1-zoom)*Math.min(1,rdt*7);zoom=Math.min(zoom,1.25);
  flashA=Math.max(0,flashA-rdt*3.5);invertT=Math.max(0,invertT-rdt);
  comboPop=Math.max(0,comboPop-rdt*5);
  dispGold+=(S.gold-dispGold)*Math.min(1,rdt*9);if(Math.abs(S.gold-dispGold)<.5)dispGold=S.gold;
  if(BN){BN.t+=rdt;if(BN.t>BN.dur)BN=null}
  if(CUT){CUT.t+=rdt;if(CUT.t>CUT.dur)CUT=null}
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

  for(const s of SK)cds[s.id]=Math.max(0,cds[s.id]-dt);
  castLock=Math.max(0,castLock-dt);
  if(frenzyT>0){frenzyT-=dt;
    if(Math.random()<dt*45)P.push({t:'flame',x:heroX+rnd(-24,24)*U,y:groundY-rnd(10,90)*U,vx:rnd(-20,20)*U,vy:-rnd(80,200)*U,drag:1,g:0,r:rnd(5,11)*U,cols:['#3a0620','#ff3d8b','#ffb0d8'],life:rnd(.3,.6),max:.6});}
  comboT-=dt;if(comboT<=0)combo=0;
  if(relicQ.length&&!FX.some(f=>f.relic)){const r=relicQ.shift();relicFX(r.x,r.boss)}

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
  if(fg&&castLock<=0&&h.stun<=0){atkT-=dt*(frenzyT>0?2:1);if(atkT<=0){atkT=Math.max(atkT+1/ST.aps,-.1);heroStrike(false)}}

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
    m.flash=Math.max(0,m.flash-dt*9);m.hurt-=dt;
    if(m.chipT>0)m.chipT-=dt;else m.chip+=(m.hp-m.chip)*Math.min(1,dt*7);
    if(m.state==='enter'){
      if(m.mini){const k=Math.min(1,m.t/.32);m.yo=lerp(-150*U,0,easeIn(k));if(k>=1){m.state='fight';m.sqv=7;P.push({t:'ring',x:m.x,y:groundY,r0:6*U,r1:60*U,w:4*U,sy:.25,life:.3,max:.3,color:'#fff'})}}
      else if(m.boss){const k=Math.min(1,m.t/.5);m.yo=lerp(-H,0,easeIn(k));
        if(k>=1){m.state='fight';bossMax=30+3*rv('sand');bossT=bossMax;m.sqv=8;sfx.land();addTrauma(.85);zoom+=.08*FXS;flash(.25,'255,90,100');
          P.push({t:'ring',x:m.x,y:groundY,r0:10*U,r1:300*U,w:10*U,sy:.2,life:.6,max:.6,color:'#ff4f5e'});smoke(m.x,groundY-10*U,14,'#2a1a3e')}}
      else{const k=Math.min(1,m.t/.5);m.x=lerp(W+140*U,monX,easeBack(k));if(k>=1){m.state='fight';m.x=monX}}
    }else if(m.state==='fight'){
      if(m.boss){bossT-=dt;if(bossT<=0)bossFail()}
    }else if(m.state==='dead'){m.deadT+=dt;if(m.deadT>.14){m=null;spawnT=miniQ>0?.15:.55}}
    else if(m.state==='split'){m.deadT+=dt;if(m.deadT>=.32&&!m.fx){m.fx=1;killFx(m)}if(m.deadT>.95){relicQ.push({x:m.x,boss:true});m=null;spawnT=.7}}
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
  drawMonBody(o,r,da,o.state==='dead');
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
  drawAllies();
  if(m)drawMonster(m);
  drawBossPat();
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
  drawCoins();drawCombo();drawBanner();drawCutin();
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
function buildBar(){
  const bar=$('skBar');bar.innerHTML='';
  for(const s of SK){if(!equipped(s))continue;const b=document.createElement('button');b.className='skill';b.style.setProperty('--c',s.c);
    b.setAttribute('aria-label',s.name);b.innerHTML=IC[s.id]+`<span class="k">${s.name}</span><span class="cd"></span>`;
    b.addEventListener('click',()=>{ensureAudio();if(!cast(s)){try{b.animate([{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'none'}],{duration:150})}catch(e){}}});
    bar.appendChild(b);s.el=b}
  for(const s of SK)if(!equipped(s))s.el=null;
  const a=document.createElement('button');a.className='skill awk';a.id='awk';a.setAttribute('aria-label','각성: 천검멸');
  a.innerHTML='<svg viewBox="0 0 32 32"><path d="M16 2l2 11 11-2-9 6 6 10-10-7-10 7 6-10-9-6 11 2z" fill="#ff2a3a" stroke="#fff" stroke-width="1"/></svg><span class="k">천검멸</span><span class="cd"></span>';
  a.addEventListener('click',()=>{ensureAudio();if(!castAwaken()){try{a.animate([{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'none'}],{duration:150})}catch(e){}}});
  bar.appendChild(a);
}
function toggleEquip(id){const i=S.equip.indexOf(id);
  if(i>=0)S.equip.splice(i,1);else{if(S.equip.length>=7){banner('슬롯이 가득 찼습니다','다른 스킬을 먼저 해제하세요','#9d95c4',1.4);return}S.equip.push(id)}
  buildBar();buildBook();save()}
function buildBook(){
  const el=$('book'),TR=tier();el.innerHTML='';$('slotTxt').textContent=`장착 ${S.equip.length}/7 · 연출 ${'★'.repeat(TR)}${'☆'.repeat(3-TR)}`;
  for(const s of SK){const r=document.createElement('div'),lk=!unlocked(s),eq=equipped(s);r.className='bk'+(lk?' locked':'');r.style.setProperty('--c',s.c);
    r.innerHTML=`<i></i><div><b>${s.name}</b><small>${s.d}</small></div><div class="st">${lk?'STAGE '+s.unlock:''}<span class="btns">${lk?'':`<button type="button" class="eq${eq?' on':''}">${eq?'해제':'장착'}</button>`}<button type="button" class="pv">시연</button></span></div>`;
    const eb=r.querySelector('.eq');if(eb)eb.addEventListener('click',()=>toggleEquip(s.id));
    r.querySelector('.pv').addEventListener('click',()=>{ensureAudio();if(!cast(s,true))banner('지금은 시연할 수 없음','몬스터와 싸우는 중에 다시 눌러 주세요','#9d95c4',1.4)});
    el.appendChild(r)}
  const cb=$('combos');cb.innerHTML='';
  for(const c of COMBOS){const a=SK.find(s=>s.id===c.a),b=SK.find(s=>s.id===c.b),d=document.createElement('div');d.className='cb';
    d.innerHTML=`<span style="color:${a.c}">${a.name}</span><em>→</em><span style="color:${b.c}">${b.name}</span><b>${c.name}</b>`;cb.appendChild(d)}
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
  for(const s of SK){const b=s.el;if(!b)continue;const lk=!unlocked(s),cd=cds[s.id],act=s.buff&&frenzyT>0,mx=s.cd*ST.cdm;
    b.classList.toggle('locked',lk);b.style.setProperty('--p',lk?1:act?0:Math.min(1,cd/mx));
    b.classList.toggle('ready',!lk&&cd<=0&&(s.buff?frenzyT<=0:castLock<=0));
    b.querySelector('.cd').textContent=lk?'ST'+s.unlock:act?Math.ceil(frenzyT):cd>0?Math.ceil(cd):''}
  const a=$('awk');if(a){a.style.setProperty('--g',gauge/100);a.classList.toggle('full',gauge>=100);a.querySelector('.cd').textContent=gauge>=100?'':Math.floor(gauge)+'%'}
  if(m&&m.boss&&m.state==='fight')$('bossFill').style.width=clamp(bossT/bossMax*100,0,100)+'%';
  const pc=pullCost(),pb=$('pull');pb.querySelector('span').textContent=fmt(pc);pb.classList.toggle('can',S.gold>=pc);
  const g=soulGain(),btn=$('prestige');
  if(S.maxStage<30){$('soulDesc').innerHTML=`이번 여정에서 <b>STAGE 30</b>에 도달하면 환생할 수 있습니다. 현재 최고 <b>${S.maxStage}</b>. 유물·업적·스킬 해금은 유지됩니다.`;btn.disabled=true;btn.textContent='환생하기'}
  else{$('soulDesc').innerHTML=`처음부터 다시 걷는 대신 환생석 <b>+${g}</b>개를 얻습니다. 환생석 하나마다 공격력과 골드 <b>+10%</b>. 유물·업적·스킬 해금은 유지됩니다.`;btn.disabled=false;if(!armed)btn.textContent=`환생하고 환생석 ${g}개 받기`}
}
function stageUI(){
  const boss=isBoss(S.stage)&&!S.farm;
  $('stageTxt').textContent=`STAGE ${S.stage}`+(boss?' · 보스':S.farm?' · 반복 사냥':'');
  $('zoneTxt').textContent=ZONES[zoneOf(S.stage)];
  $('bossBar').hidden=!boss;$('pips').hidden=boss;$('retry').hidden=!S.farm;
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
  saveAcc+=rdt;if(saveAcc>5){saveAcc=0;save()}
  requestAnimationFrame(frame);
}
function start(data){
  load(data&&data.S);
  if(!Array.isArray(S.equip))S.equip=SK.filter(unlocked).slice(0,7).map(s=>s.id);
  S.equip=S.equip.filter(id=>SK.some(s=>s.id===id));
  ST=stats();dispGold=S.gold;zoneShown=zoneOf(S.stage);
  $('autoSk').checked=S.auto;soundUI();titleUI();
  resize();new ResizeObserver(resize).observe(stageEl);
  stageUI();buildBar();buildBook();buildRelics();buildAch();uiTick(true);
  const away=(Date.now()-S.t)/1000;if(away>60)showOffline(away);
  if(S.totalKills===0)banner('끝없는 검로','화면을 눌러 직접 베어라','#ffc94a',2.2);
  try{document.fonts.load('40px "Black Han Sans"')}catch(e){}
  last=performance.now();requestAnimationFrame(frame);
}
try{window.claude?.hot?.snapshot?.(()=>({S:Object.assign({},S,{t:Date.now()})}))}catch(e){}
if(window.claude?.hot?.ready)window.claude.hot.ready(start);else start(window.claude?.hot?.data??{});
