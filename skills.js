'use strict';
/* ================= shared skill drawing ================= */
function drawPSword(x,y,ang,len,al,glow,pal){
  const P0=pal||['#1c0b3d','#4b2a9a','#c9a8ff','#8e63ff','#2a1450'];
  ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.globalAlpha=al;const w=len*.07;
  ctx.fillStyle=P0[0];ctx.beginPath();ctx.moveTo(8,-w*.6);
  ctx.lineTo(len*.25,-w);ctx.lineTo(len*.3,-w*1.6);ctx.lineTo(len*.36,-w*.9);ctx.lineTo(len*.6,-w*.8);ctx.lineTo(len*.66,-w*1.35);ctx.lineTo(len*.72,-w*.6);ctx.lineTo(len,0);
  ctx.lineTo(len*.7,w*.7);ctx.lineTo(len*.55,w*1.25);ctx.lineTo(len*.5,w*.8);ctx.lineTo(len*.2,w*1.1);ctx.lineTo(8,w*.6);ctx.closePath();ctx.fill();
  ctx.fillStyle=P0[1];ctx.beginPath();ctx.moveTo(12,-w*.25);ctx.lineTo(len*.8,-w*.15);ctx.lineTo(len*.95,0);ctx.lineTo(len*.8,w*.2);ctx.lineTo(12,w*.25);ctx.closePath();ctx.fill();
  ctx.globalCompositeOperation='lighter';
  if(glow){ctx.globalAlpha=al*.35*glow;ctx.fillStyle=P0[3];ctx.beginPath();ctx.ellipse(len*.5,0,len*.62,w*3.2,0,0,7);ctx.fill()}
  ctx.globalAlpha=al;ctx.strokeStyle=P0[2];ctx.lineWidth=Math.max(1,w*.28)*(glow?1.8:1);ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(len*.3,0);ctx.moveTo(len*.38,-w*.1);ctx.lineTo(len*.62,0);ctx.moveTo(len*.68,0);ctx.lineTo(len*.9,0);ctx.stroke();
  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle=P0[4];ctx.fillRect(-16,-w*.35,24,w*.7);
  ctx.fillStyle=P0[3];ctx.beginPath();ctx.moveTo(8,-w*2.3);ctx.lineTo(13,0);ctx.lineTo(8,w*2.3);ctx.lineTo(3,0);ctx.closePath();ctx.fill();
  ctx.restore();
}
function drawTent(x,y,a,len,wB,curv){
  if(len<2||wB<.5)return;
  ctx.save();ctx.translate(x,y);ctx.rotate(a);const N=12,up=[],dn=[];
  for(let i=0;i<=N;i++){const u=i/N,px=u*len,off=Math.sin(u*Math.PI)*curv*len,w=wB*Math.pow(1-u,.9)+(i%4===2?wB*.3*(1-u):0);up.push(px,off-w/2);dn.push(px,off+w/2)}
  const g=ctx.createLinearGradient(0,0,len,0);g.addColorStop(0,'#1a0a36');g.addColorStop(.55,'#5a34c0');g.addColorStop(1,'#c9a8ff');
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(up[0],up[1]);for(let i=2;i<up.length;i+=2)ctx.lineTo(up[i],up[i+1]);for(let i=dn.length-2;i>=0;i-=2)ctx.lineTo(dn[i],dn[i+1]);ctx.closePath();ctx.fill();
  ctx.restore();
}
function drawShade(x,y,rise,lean,alpha,flip,ang){
  if(rise<=0||alpha<=0)return;ctx.save();ctx.translate(x,y);ctx.scale(flip?-1:1,rise);
  ctx.globalCompositeOperation='lighter';drawSil(0,0,'#3a55ff',alpha*.5,1.1,lean,ang,false);ctx.globalCompositeOperation='source-over';
  drawSil(0,0,'#05050c',alpha,1,lean,ang,true);ctx.restore();
}
function fleshBoom(b,scale=1){
  const t=b.t,R=190*U*scale*easeOut(Math.min(1,t/.3)),al=t>.8?Math.max(0,1-(t-.8)/.5):1;if(al<=0||R<1)return;
  ctx.save();ctx.globalAlpha=al;const x=b.x,y=b.y;
  ctx.fillStyle='#2a0610';for(let i=0;i<12;i++){const a=b.seed[i];ctx.beginPath();ctx.arc(x+Math.cos(a)*R*.72,y+Math.sin(a)*R*.62,R*.38,0,7);ctx.fill()}
  ctx.fillStyle='#ff5a6e';ctx.beginPath();ctx.ellipse(x,y,R*.92,R*.8,0,0,7);ctx.fill();
  ctx.fillStyle='#ffa3ad';for(let i=0;i<6;i++){const a=b.seed[i]*1.7;ctx.beginPath();ctx.arc(x+Math.cos(a)*R*.4,y+Math.sin(a)*R*.35,R*.22,0,7);ctx.fill()}
  ctx.strokeStyle='#a0102a';ctx.lineWidth=3*U;ctx.lineCap='round';
  for(let i=0;i<9;i++){const a=b.seed[i]+i;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*R*.15,y+Math.sin(a)*R*.15);ctx.quadraticCurveTo(x+Math.cos(a+.4)*R*.5,y+Math.sin(a+.4)*R*.45,x+Math.cos(a)*R*.85,y+Math.sin(a)*R*.72);ctx.stroke()}
  ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(x-R*.1,y+R*.05,0,x,y,R*.6);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(255,120,140,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,R*.6,0,7);ctx.fill();ctx.restore();
}
function drawBeast(x,y,s,t,al){
  ctx.save();ctx.globalAlpha=al;ctx.translate(x,y);ctx.scale(U*s,U*s);
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ff9ad0';ctx.lineWidth=3;
  for(const off of [-22,20]){ctx.beginPath();for(let i=0;i<=22;i++){const px=-30-i*12,py=off+Math.sin(t*14+i*.6)*10*(i/22+.2);i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.stroke()}
  ctx.globalCompositeOperation='source-over';
  for(let i=5;i>=0;i--){const bx=-44-i*24,by=Math.sin(t*12+i)*6,sz=1-i*.08;ctx.fillStyle='#0a0508';ctx.beginPath();ctx.roundRect(bx-16*sz,by-26*sz,32*sz,52*sz,10*sz);ctx.fill();
    ctx.strokeStyle='#ff3d8b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bx-8*sz,by-20*sz);ctx.lineTo(bx-8*sz,by+20*sz);ctx.stroke()}
  ctx.fillStyle='#0a0508';ctx.beginPath();ctx.roundRect(-38,-36,76,72,18);ctx.fill();
  ctx.fillStyle='#ff3d8b';for(const sg of [-1,1]){ctx.beginPath();ctx.moveTo(sg*14,-32);ctx.quadraticCurveTo(sg*36,-62,sg*22,-76);ctx.quadraticCurveTo(sg*26,-52,sg*3,-34);ctx.fill()}
  ctx.beginPath();ctx.ellipse(4,-2,29,27,0,0,7);ctx.fill();
  for(const ex of [-8,16]){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex,-8,8.5,0,7);ctx.fill();ctx.strokeStyle='#8a0a3a';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#0a0508';ctx.beginPath();ctx.arc(ex+2,-8,3.5,0,7);ctx.fill()}
  ctx.strokeStyle='#0a0508';ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(-18,-22);ctx.lineTo(0,-16);ctx.moveTo(28,-22);ctx.lineTo(10,-16);ctx.stroke();
  ctx.fillStyle='#0a0508';ctx.beginPath();ctx.roundRect(-14,8,38,13,5);ctx.fill();
  ctx.fillStyle='#fff';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-10+i*9,8);ctx.lineTo(-6+i*9,15);ctx.lineTo(-2+i*9,8);ctx.fill()}
  ctx.restore();
}
function drawDHead(x,y,ang,jaw,s){
  ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.scale(U*s,U*s*(Math.cos(ang)<0?-1:1));ctx.fillStyle='#07070f';
  ctx.beginPath();ctx.moveTo(-10,-14);ctx.quadraticCurveTo(-40,-36,-60,-32);ctx.quadraticCurveTo(-36,-22,-18,-6);ctx.fill();
  ctx.beginPath();ctx.moveTo(-14,-8);ctx.quadraticCurveTo(-44,-14,-62,-4);ctx.quadraticCurveTo(-38,-4,-20,2);ctx.fill();
  ctx.beginPath();ctx.moveTo(-26,-16);ctx.quadraticCurveTo(10,-28,50,-8);ctx.lineTo(54,0);ctx.lineTo(10,2);ctx.lineTo(-26,8);ctx.closePath();ctx.fill();
  ctx.fillStyle='#e8ecff';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(14+i*8,1);ctx.lineTo(17+i*8,7);ctx.lineTo(20+i*8,1);ctx.fill()}
  ctx.save();ctx.translate(-10,4);ctx.rotate(jaw*.75);ctx.fillStyle='#07070f';ctx.beginPath();ctx.moveTo(0,-2);ctx.lineTo(58,0);ctx.lineTo(52,9);ctx.quadraticCurveTo(20,15,0,10);ctx.closePath();ctx.fill();
  ctx.fillStyle='#e8ecff';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(22+i*8,0);ctx.lineTo(25+i*8,-6);ctx.lineTo(28+i*8,0);ctx.fill()}ctx.restore();
  ctx.fillStyle='#fff';ctx.shadowColor='#8fb0ff';ctx.shadowBlur=14;ctx.beginPath();ctx.moveTo(4,-13);ctx.lineTo(20,-11);ctx.lineTo(6,-7);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(90,123,255,.85)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-26,-16);ctx.quadraticCurveTo(10,-28,50,-8);ctx.stroke();ctx.globalCompositeOperation='source-over';
  ctx.restore();
}
function pool(x,t,t1,col){const r=Math.min(1,t/.25)*110*U*(t>t1?Math.max(0,1-(t-t1)/.3):1);if(r<=0)return;
  ctx.fillStyle='#05050c';ctx.beginPath();ctx.ellipse(x,groundY+3,r,r*.2,0,0,7);ctx.fill();
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle=col;ctx.lineWidth=2*U;ctx.stroke();ctx.globalCompositeOperation='source-over'}

/* ================= 1. 원소 질주 ================= */
const ELEM=[
  {n:'빙결',c:['#0b2f4d','#35b8ff','#bdf3ff','#ffffff'],fc:'190,240,255'},
  {n:'화염',c:['#3a0d06','#ff5a1a','#ffc04a','#fff4c0'],fc:'255,190,110'},
  {n:'대지',c:['#3a2412','#a86a32','#e8b870','#fff1d0'],fc:'255,225,170'},
  {n:'질풍',c:['#0b3a1c','#35d672','#b8ffcf','#ffffff'],fc:'200,255,215'}];
let elemI=0;
function elemTrail(ei,x){
  const c=ELEM[ei].c;
  if(ei===0){spike(x,rnd(14,28)*U,rnd(40,110)*U,-rnd(.3,.7),1,c[1],c[2],rnd(.5,.8));
    if(Math.random()<.5)P.push({t:'shard',x,y:groundY-rnd(10,60)*U,vx:rnd(-200,100)*U,vy:-rnd(100,400)*U,g:1500*U,drag:1,floor:1,size:rnd(3,7)*U,rot:0,vr:rnd(-10,10),life:.7,max:.7,color:c[2]})}
  else if(ei===1){P.push({t:'flame',x:x+rnd(-10,10)*U,y:groundY-rnd(15,65)*U,vx:-rnd(20,80)*U,vy:-rnd(40,140)*U,drag:1,g:0,r:rnd(14,30)*U,cols:[c[0],c[1],c[2]],life:rnd(.4,.7),max:.7});
    if(Math.random()<.4)P.push({t:'smoke',x,y:groundY-rnd(20,60)*U,vx:-rnd(20,80)*U,vy:-rnd(30,90)*U,drag:1.5,r0:10*U,r1:34*U,life:.7,max:.7,color:'#241010'})}
  else if(ei===2){spike(x,rnd(30,60)*U,rnd(25,70)*U,rnd(-.2,.4),2,c[1],c[2],rnd(.5,.8));
    P.push({t:'smoke',x,y:groundY-10*U,vx:rnd(-60,20)*U,vy:-rnd(20,60)*U,drag:2,r0:10*U,r1:40*U,life:.6,max:.6,color:'#4a3a2a'})}
  else{P.push({t:'ring',x,y:groundY-50*U,r0:10*U,r1:rnd(50,80)*U,w:5*U,sx:.35,life:.45,max:.45,color:c[1]});
    P.push({t:'dot',x,y:groundY-rnd(20,90)*U,vx:-rnd(100,300)*U,vy:-rnd(20,120)*U,g:0,drag:2,size:rnd(2,4)*U,life:.5,max:.5,color:c[2]})}
}
function dashHit(ei,c,pm,mult){
  const E=ELEM[ei],R=m?m.rb*U:44*U;
  P.push({t:'streak',x:c.x-R*2.2,y:c.y+R*.1,x2:c.x+R*2.6,y2:c.y-R*.1,life:.18,max:.18,w:12*U,color:'#ffffff'});
  P.push({t:'slash',x:c.x,y:c.y,rot:Math.PI/2+.12,fy:1,size:R*1.9,life:.26,max:.26,color:E.c[1]});
  P.push({t:'star',x:c.x,y:c.y,size:140*U,life:.14,max:.14});
  P.push({t:'ring',x:c.x,y:c.y,r0:10*U,r1:170*U,w:8*U,life:.35,max:.35,color:E.c[2]});
  burst(c.x,c.y,[E.c[1],E.c[2],'#fff'],30,1200);
  if(ei===0)for(let i=0;i<16;i++)P.push({t:'shard',x:c.x,y:c.y,vx:rnd(-500,800)*U,vy:rnd(-800,-100)*U,g:1800*U,drag:.8,floor:1,size:rnd(4,11)*U,rot:rnd(0,6),vr:rnd(-14,14),life:rnd(.7,1.2),max:1.2,color:Math.random()<.5?E.c[1]:E.c[2]});
  if(ei===1){for(let i=0;i<10;i++)P.push({t:'flame',x:c.x+rnd(-R,R),y:c.y+rnd(-R*.5,R*.5),vx:rnd(-60,160)*U,vy:-rnd(60,200)*U,drag:1,g:0,r:rnd(18,34)*U,cols:[E.c[0],E.c[1],E.c[2]],life:rnd(.4,.8),max:.8});smoke(c.x,c.y,6,'#241010')}
  if(ei===2)for(let i=0;i<7;i++)spike(c.x+rnd(-1.4,1.4)*R,rnd(30,55)*U,rnd(50,110)*U,rnd(-.4,.4),1+(i%2),E.c[1],E.c[2],rnd(.7,1));
  if(ei===3)for(let i=0;i<5;i++)P.push({t:'ring',x:c.x+i*18*U,y:c.y,r0:10*U,r1:rnd(60,110)*U,w:6*U,sx:.3,life:.5,max:.5,color:i%2?E.c[2]:E.c[1]});
  if(br('dash')==='a')burst(c.x,c.y,ELEM.map(e=>e.c[1]),36,1500);
  skillHit(mult,pm,c.x,c.y,{heavy:1,col:E.c[2],name:br('dash')==='a'?'원소 폭풍':E.n+' 질주',fc:E.fc,sid:'dash'});
}
function castDash(pm){
  const TR=tier(),DB=br('dash'),ei=elemI++%4,E=ELEM[ei],x0=heroX,x1=Math.min(W-40*U,monX+180*U);let gh=0,tc=0;
  addFX({dur:.8,up(dt,o){const t=o.t;castLock=Math.max(castLock,.05);
    at(o,0,()=>{sfx.whoosh();P.push({t:'ring',x:x0,y:groundY-50*U,r0:10*U,r1:90*U,w:6*U,sx:.5,life:.3,max:.3,color:E.c[2]});
      for(let i=0;i<8;i++)P.push({t:'smoke',x:x0,y:groundY-6*U,vx:-rnd(60,260)*U,vy:-rnd(10,60)*U,drag:3,r0:8*U,r1:30*U,life:.5,max:.5,color:'#3a3444'})});
    if(t<.1){h.ox=x0-14*U*easeOut(t/.1);h.lean=-.15;h.ang=2.6}
    else if(t<.24){const k=(t-.1)/.14,px=h.ox;h.ox=lerp(x0-14*U,x1,1-(1-k)*(1-k));h.lean=.45;h.ang=2.7;
      for(let x=px;x<h.ox;x+=(TR>=1||DB==='a'?12:18)*U)elemTrail(DB==='a'?tc++%4:ei,x);
      gh-=dt;if(gh<=0){gh=.018;P.push({t:'ghost',x:h.ox,y:groundY,col:E.c[1],lean:.45,ang:2.7,life:.3,max:.3})}
      if(!o.hit&&m&&h.ox>=mCenter(m).x){o.hit=1;dashHit(ei,mCenter(m),pm,(4.5+TR*.8)*(DB==='a'?1.3:1))}}
    else if(t<.44){h.ox=x1;h.lean=.2*(1-(t-.24)/.2);h.ang=lerp(2.7,.9,easeOut((t-.24)/.2));if(!o.hit){o.hit=1;if(m)dashHit(ei,mCenter(m),pm,(4.5+TR*.8)*(DB==='a'?1.3:1))}}
    else{const k=Math.min(1,(t-.44)/.3),px=h.ox;h.ox=lerp(x1,x0,easeOut(k));h.lean=-.2*(1-k);
      if(TR>=2||DB==='b'){for(let x=h.ox;x<px;x+=18*U)elemTrail(ei,x);if(!o.hit2&&m&&h.ox<=mCenter(m).x){o.hit2=1;dashHit(ei,mCenter(m),pm,DB==='b'?4:2.5)}}
      gh-=dt;if(gh<=0&&k<.8){gh=.03;P.push({t:'ghost',x:h.ox,y:groundY,col:E.c[1],lean:-.2,ang:-.55,life:.2,max:.2})}}
  },end(){h.ox=null;h.lean=0}});
}

/* ================= 2. 심연 비검 ================= */
function castSwords(pm){
  const TR=tier(),SB=br('swords'),N=[5,7,9,12][TR]+(SB==='a'?5:0),R=m.rb*U,L=92*U,target=m;sfx.chime();sfx.dark();
  const cx=heroX,cy=groundY-78*U,sw=[];
  for(let i=0;i<N;i++){const a=-Math.PI/2+(N===1?0:(i/(N-1)-.5)*2.7);sw.push({hx:cx+Math.cos(a)*105*U-12*U,hy:cy+Math.sin(a)*80*U,b:.04*i,go:.5+i*.075,st:0,ang:0,x:0,y:0,ph:rnd(0,6)})}
  const fin=sw[N-1].go+.5;
  addFX({dur:fin+.4,up(dt,o){const t=o.t;dimT=Math.max(dimT,.4);castLock=Math.max(castLock,.05);
    const alive=m===target&&fighting(),c=m?mCenter(m):{x:monX,y:groundY-50*U};
    for(const s of sw){if(t<s.b||s.st===3)continue;
      if(s.st===0){if(!s.sp){s.sp=1;P.push({t:'star',x:s.hx,y:s.hy,size:50*U,life:.12,max:.12});P.push({t:'ring',x:s.hx,y:s.hy,r0:4*U,r1:40*U,w:3*U,life:.25,max:.25,color:'#b89aff'})}
        s.x=s.hx;s.y=s.hy+Math.sin(gt*4+s.ph)*4*U;s.ang=Math.atan2(c.y-s.y,c.x-s.x);
        if(t>=s.go){s.st=1;s.t0=t;s.sx=s.x;s.sy=s.y;const tx=c.x+rnd(-.3,.3)*R,ty=c.y+rnd(-.35,.35)*R;s.ang=Math.atan2(ty-s.sy,tx-s.sx);
          s.ex=tx-Math.cos(s.ang)*L*.6;s.ey=ty-Math.sin(s.ang)*L*.6;s.tx=tx;s.ty=ty;if(s===sw[0]||Math.random()<.4)sfx.whoosh()}}
      else if(s.st===1){const k=Math.min(1,(t-s.t0)/.1);s.x=lerp(s.sx,s.ex,easeIn(k));s.y=lerp(s.sy,s.ey,easeIn(k));
        P.push({t:'streak',x:s.x,y:s.y,x2:s.x+Math.cos(s.ang)*L,y2:s.y+Math.sin(s.ang)*L,life:.08,max:.08,w:4*U,color:'#b89aff'});
        if(k>=1){if(alive){s.st=2;s.rx=s.x-c.x;s.ry=s.y-c.y;burst(s.tx,s.ty,['#c9a8ff','#fff','#7b4dff'],10,900,s.ang+Math.PI);
          P.push({t:'ring',x:s.tx,y:s.ty,r0:6*U,r1:50*U,w:4*U,life:.22,max:.22,color:'#b89aff'});if(SB==='b'){s.st=3;for(let i=0;i<7;i++)P.push({t:'shard',x:s.tx,y:s.ty,vx:rnd(-500,500)*U,vy:rnd(-600,100)*U,g:1400*U,drag:1,floor:1,size:rnd(4,10)*U,rot:rnd(0,6),vr:rnd(-14,14),life:.9,max:.9,color:Math.random()<.5?'#5a34c0':'#c9a8ff'});
            P.push({t:'glow',x:s.tx,y:s.ty,size:90*U,life:.2,max:.2,color:'#8e63ff'});P.push({t:'ring',x:s.tx,y:s.ty,r0:6*U,r1:90*U,w:5*U,life:.3,max:.3,color:'#c9a8ff'});
            skillHit(1.9+.1*TR,pm,s.tx,s.ty,{col:'#d9c6ff',sid:'swords'});sfx.boom()}
          else{skillHit(.9+.1*TR,pm,s.tx,s.ty,{col:'#d9c6ff',sid:'swords'});sfx.hit(false)}}
          else{s.st=3;burst(s.tx,s.ty,['#c9a8ff'],6,500)}}}
      else if(s.st===2){if(alive){s.x=c.x+s.rx;s.y=c.y+s.ry}else{s.st=3;for(let i=0;i<5;i++)P.push({t:'shard',x:s.x,y:s.y,vx:rnd(-300,300)*U,vy:rnd(-500,-100)*U,g:1500*U,drag:1,floor:1,size:rnd(4,9)*U,rot:rnd(0,6),vr:rnd(-12,12),life:.8,max:.8,color:'#7b4dff'})}}}
    at(o,fin,()=>{let n=0;for(const s of sw)if(s.st===2){n++;s.st=3;const tx=s.x+Math.cos(s.ang)*L*.6,ty=s.y+Math.sin(s.ang)*L*.6;
        for(let i=0;i<8;i++)P.push({t:'shard',x:tx,y:ty,vx:rnd(-600,600)*U,vy:rnd(-700,200)*U,g:1400*U,drag:1,floor:1,size:rnd(4,11)*U,rot:rnd(0,6),vr:rnd(-14,14),life:rnd(.6,1.1),max:1.1,color:Math.random()<.5?'#5a34c0':'#c9a8ff'});
        P.push({t:'ring',x:tx,y:ty,r0:6*U,r1:80*U,w:5*U,life:.3,max:.3,color:'#c9a8ff'})}
      if(n&&fighting()){const cc=mCenter(m);P.push({t:'glow',x:cc.x,y:cc.y,size:R*3.6,life:.3,max:.3,color:'#7b4dff'});
        skillHit(2.5+.3*n,pm,cc.x,cc.y,{heavy:1,col:'#d9c6ff',name:'심연 비검',fc:'200,170,255',crack:TR>=2?1:0,sid:'swords'});sfx.boom()}});
  },draw(o){const t=o.t;
    for(const s of sw){if(t<s.b||s.st===3)continue;const al=s.st===0?Math.min(1,(t-s.b)/.1):1,gl=s.st===2&&t>fin-.2?1:s.st===0?.4:0;
      if(s.st===0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.25*al;ctx.fillStyle='#8e63ff';ctx.beginPath();ctx.arc(s.x+Math.cos(s.ang)*L*.45,s.y+Math.sin(s.ang)*L*.45,L*.4,0,7);ctx.fill();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
      drawPSword(s.x,s.y,s.ang,L,al,gl)}
  }});
}

/* ================= 3. 마룡 숨결 ================= */
function castBreath(pm){
  const TR=tier(),BB=br('breath');castLock=1.6;sfx.charge();
  addFX({dur:1.6,tick:0,up(dt,o){const t=o.t,ox=heroX+75*U,oy=groundY-64*U;o.ox=ox;o.oy=oy;
    h.ang=-.05;h.t=9;dimT=Math.max(dimT,.45);
    if(t<.5){
      if(Math.random()<dt*80){const a=rnd(0,7),r=rnd(80,160)*U,px=ox+Math.cos(a)*r,py=oy+Math.sin(a)*r;
        P.push({t:'dot',x:px,y:py,vx:(ox-px)/.25,vy:(oy-py)/.25,g:0,drag:0,size:rnd(2,4)*U,life:.25,max:.25,color:Math.random()<.5?'#ff3d8b':'#ffb0d8'})}
      addTrauma(dt*.35);h.lunge=-6*(t/.5);
      at(o,.02,()=>P.push({t:'ring',x:ox,y:oy,r0:140*U,r1:6*U,w:4*U,life:.46,max:.46,color:'#ff3d8b'}));
    }else if(t<1.35){
      at(o,.5,()=>{sfx.beam();flash(.5,'255,160,210');addTrauma(.5);stop=Math.max(stop,.05);
        P.push({t:'ring',x:ox,y:oy,r0:10*U,r1:130*U,w:8*U,sx:.35,life:.35,max:.35,color:'#ffffff'})});
      tintA=Math.max(tintA,.12);tintC='255,60,140';addTrauma(dt*1.3);h.lunge=-10;
      o.tick-=dt;if(o.tick<=0){o.tick=.07;if(fighting()){const c=mCenter(m);skillHit((.45+.08*TR)*(BB==='a'?1.6:1),pm,c.x,c.y,{light:1,col:'#ffc0dd',sid:'breath'});burst(c.x-m.rb*U*.6,c.y,['#ff3d8b','#fff','#ffb0d8'],6,900,Math.PI)}}
      if(Math.random()<dt*50)P.push({t:'blob',x:ox+rnd(0,W*.6),y:oy+rnd(-1,1)*26*U,vx:900*U,vy:rnd(-80,80)*U,g:0,drag:0,size:rnd(3,8)*U,life:.3,max:.3,color:'#2b0a1c'});
    }
    at(o,1.35,()=>smoke(ox,oy,7,'#3a1a2a',.6));
  },draw(o){const t=o.t,ox=o.ox,oy=o.oy;if(ox===undefined)return;
    if(t<.5){const r=lerp(4,24,t/.5)*U*(1+.12*Math.sin(t*60));
      ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.4;ctx.fillStyle='#ff3d8b';ctx.beginPath();ctx.arc(ox,oy,r*2.4,0,7);ctx.fill();
      ctx.globalAlpha=1;ctx.beginPath();ctx.arc(ox,oy,r,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ox,oy,r*.55,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';return}
    const k=Math.min(1,(t-.5)/.08),fade=t<1.35?1:Math.max(0,1-(t-1.35)/.2),th=36*U*(1+.15*TR)*(1+.12*Math.sin(t*55))*fade;if(th<=.5)return;
    const x1=lerp(ox,W+120,easeOut(k));
    ctx.fillStyle='#2b0a1c';ctx.beginPath();ctx.moveTo(ox,oy-th*.7);
    for(let x=ox;x<=x1;x+=16*U)ctx.lineTo(x,oy-th*(.72+Math.random()*.4));ctx.lineTo(x1,oy);
    for(let x=x1;x>=ox;x-=16*U)ctx.lineTo(x,oy+th*(.72+Math.random()*.4));ctx.closePath();ctx.fill();
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.35;ctx.fillStyle='#ff3d8b';ctx.fillRect(ox,oy-th*.9,x1-ox,th*1.8);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#ff3d8b';ctx.beginPath();ctx.roundRect(ox,oy-th*.32,x1-ox,th*.64,th*.32);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(ox,oy-th*.14,x1-ox,th*.28,th*.14);ctx.fill();
    ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#fff';ctx.lineWidth=2*U;ctx.beginPath();
    for(let i=0;i<7;i++){const len=x1-ox,x=ox+((t*2600*U+i*173*U)%Math.max(1,len)),y=oy+Math.sin(i*2.3)*th*.24;ctx.moveTo(x,y);ctx.lineTo(Math.min(x1,x+70*U),y)}ctx.stroke();
    if(TR>=2||BB==='a'){ctx.strokeStyle='#ffb0d8';ctx.lineWidth=2*U;for(const s of [-1,1]){ctx.beginPath();for(let x=ox;x<=x1;x+=10*U){const y=oy+s*Math.sin((x-ox)*.03-t*30)*th*.8;x===ox?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke()}}
    ctx.lineWidth=3*U;for(const [dx,s] of [[26,1.3],[62,1.05],[96,.8]]){ctx.globalAlpha=.8;ctx.strokeStyle=dx===62?'#ff9ac8':'#fff';ctx.beginPath();ctx.ellipse(ox+dx*U,oy,6*U,th*(s+.15*Math.sin(t*40+dx)),0,0,7);ctx.stroke()}
    ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ox,oy,th*.75,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';
  }});
}

/* ================= 4. 그림자 분신 ================= */
function castShadow(pm){
  const TR=tier(),N=3+(TR>=1?1:0)+(TR>=3?1:0)+(br('shadow')==='a'?3:0);castLock=1.2+N*.18;sfx.dark();
  const cl=[...Array(N)].map((_,i)=>({i,x:heroX-(N-1)*20*U+i*40*U,born:.05+i*.07,dash:.42+i*.18,st:0,tr:[],px:0,py:0}));
  const fin=.42+N*.18+.22;
  addFX({dur:fin+.7,up(dt,o){const t=o.t;dimT=Math.max(dimT,.5);
    const c=m?mCenter(m):{x:monX,y:groundY-40*U},R=m?m.rb*U:44*U;
    for(const k of cl){
      if(k.st===0&&t>=k.dash){k.st=1;k.sx=k.x;k.t0=t;sfx.whoosh()}
      if(k.st===1){const q=Math.min(1,(t-k.t0)/.11);k.px=lerp(k.sx,c.x-R*.3,q);k.py=-Math.sin(q*Math.PI)*70*U;k.tr.push(k.px,groundY+k.py-50*U);if(k.tr.length>24)k.tr.splice(0,2);
        if(q>=1){k.st=2;k.x=c.x+R*(1+k.i*.35);
          P.push({t:'dslash',x:c.x,y:c.y,rot:rnd(-.7,.7),fy:Math.random()<.5?1:-1,size:R*2,life:.3,max:.3,color:'#5a7bff'});
          ink(c.x,c.y,10);skillHit(2,pm,c.x,c.y,{col:'#b8c6ff',sid:'shadow'});sfx.hit(true)}}
      if(k.st===2&&k.tr.length)k.tr.splice(0,2);
    }
    at(o,fin,()=>{for(let i=0;i<9+TR*2;i++){const a=(i/(8+TR*2)-.5)*1.7;spike(c.x+Math.sin(a)*R*1.7,rnd(18,30)*U,rnd(90,180)*U,a*.6,1,'#07070f','#2a3470',.8)}
      ink(c.x,c.y,18);P.push({t:'ring',x:c.x,y:groundY,r0:10*U,r1:200*U,w:6*U,sy:.22,life:.45,max:.45,color:'#5a7bff'});
      skillHit(3.6,pm,c.x,c.y,{heavy:1,col:'#b8c6ff',name:'그림자 분신',fc:'150,170,255',sid:'shadow'});sfx.boom()});
    at(o,fin+.28,()=>{for(const k of cl)for(let i=0;i<12;i++){P.push({t:'blob',x:k.x+rnd(-18,18)*U,y:groundY-rnd(0,90)*U,vx:rnd(-40,40)*U,vy:-rnd(60,200)*U,g:-100*U,drag:1,size:rnd(3,7)*U,life:rnd(.4,.8),max:.8,color:'#07070f'});
      if(i%3===0)P.push({t:'dot',x:k.x+rnd(-18,18)*U,y:groundY-rnd(0,90)*U,vx:0,vy:-rnd(60,160)*U,g:0,drag:1,size:2*U,life:.6,max:.6,color:'#5a7bff'})}});
  },back(o){pool(heroX,o.t,fin+.3,'rgba(90,123,255,.6)')},
  draw(o){const t=o.t,al=t>fin+.28?Math.max(0,1-(t-fin-.28)/.25):1;
    for(const k of cl){if(t<k.born)continue;const tr=k.tr;
      if(tr.length>3){ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='rgba(5,5,12,.85)';ctx.lineWidth=18*U;ctx.beginPath();ctx.moveTo(tr[0],tr[1]);for(let j=2;j<tr.length;j+=2)ctx.lineTo(tr[j],tr[j+1]);ctx.stroke();
        ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#5a7bff';ctx.lineWidth=3*U;ctx.stroke();ctx.globalCompositeOperation='source-over'}
      if(k.st===1)drawShade(k.px,groundY+k.py,1,.5,al,false,2.6);
      else drawShade(k.x,groundY,Math.min(1,(t-k.born)/.2),k.st===2?.1:0,al,k.st===2,k.st===2?.8:-.6)}
  }});
}

/* ================= 5. 진홍 대포 ================= */
function castCannon(pm){
  const TR=tier();castLock=2;sfx.charge();
  const bx=heroX+30*U,by=groundY-58*U;
  addFX({dur:2.1,kick:0,app:0,up(dt,o){const t=o.t;dimT=Math.max(dimT,.45);h.ang=-.2;h.t=9;
    o.app=Math.min(1,t/.25)*(t>1.5?Math.max(0,1-(t-1.5)/.3):1);
    const mx=bx+110*U;
    if(t>.3&&t<.75&&Math.random()<dt*70){const a=rnd(0,7),r=rnd(60,120)*U,px=mx+Math.cos(a)*r,py=by+Math.sin(a)*r;P.push({t:'dot',x:px,y:py,vx:(mx-px)/.2,vy:(by-py)/.2,g:0,drag:0,size:rnd(2,4)*U,life:.2,max:.2,color:'#ff4f5e'})}
    at(o,.3,()=>P.push({t:'ring',x:mx,y:by,r0:80*U,r1:6*U,w:4*U,sx:.35,life:.45,max:.45,color:'#ff4f5e'}));
    at(o,.75,()=>{o.kick=1;sfx.bigboom();addTrauma(.6);flash(.3,'255,90,110');P.push({t:'star',x:mx,y:by,size:120*U,life:.14,max:.14});
      for(let i=0;i<3;i++)P.push({t:'ring',x:mx+i*22*U,y:by,r0:10*U,r1:(70-i*12)*U,w:5*U,sx:.3,life:.35,max:.35,color:i===1?'#fff':'#ff4f5e'});
      smoke(mx,by,8,'#55555f',.7);o.shot={t:0}});
    o.kick=Math.max(0,o.kick-dt*4);
    if(o.shot&&!o.boom){const c=m?mCenter(m):{x:monX,y:by};o.shot.t+=dt;const k=Math.min(1,o.shot.t/.12);o.shot.x=lerp(mx,c.x,k);o.shot.y=lerp(by,c.y,k);
      if(k>=1){o.boom={x:c.x,y:c.y,t:0,seed:[...Array(12)].map(()=>rnd(0,7))};stop=Math.max(stop,.14);
        smoke(c.x,groundY-20*U,14,'#141014',1.4);ink(c.x,c.y,20,'#4a0a14');
        skillHit((6+TR*1.2)*(br('cannon')==='b'?1.7:1),pm,c.x,c.y,{heavy:1,name:'진홍 포격',col:'#ffb3b8',fc:'255,120,140',crack:2,sid:'cannon'})}}
    if(o.boom)o.boom.t+=dt;
  },draw(o){
    if(o.app>0){ctx.save();ctx.globalAlpha=o.app;ctx.translate(bx-o.kick*20*U,by);ctx.scale(U,U);
      ctx.fillStyle='#4a4a56';ctx.beginPath();ctx.roundRect(-22,-24,52,48,6);ctx.fill();
      ctx.fillStyle='#6c6c7a';ctx.beginPath();ctx.roundRect(20,-16,92,32,5);ctx.fill();
      ctx.fillStyle='#3a3a44';for(const x of [40,70,100])ctx.fillRect(x,-18,6,36);
      ctx.fillStyle='#ff4f5e';ctx.fillRect(-12,-4,30,3);ctx.fillRect(28,-2,62,2);
      if(o.t>.3&&o.t<.8){ctx.globalCompositeOperation='lighter';ctx.fillStyle='#ff4f5e';const r=6+18*Math.min(1,(o.t-.3)/.45);ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(114,0,r,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(114,0,r*.45,0,7);ctx.fill()}
      ctx.restore()}
    if(o.shot&&!o.boom&&o.shot.x!==undefined){ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ff4f5e';ctx.lineWidth=10*U;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(bx+110*U,by);ctx.lineTo(o.shot.x,o.shot.y);ctx.stroke();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(o.shot.x,o.shot.y,16*U,8*U,0,0,7);ctx.fill();ctx.globalCompositeOperation='source-over'}
    if(o.boom)fleshBoom(o.boom,(1+.15*TR)*(br('cannon')==='b'?1.6:1));
  }});
}

/* ================= 6. 일식 ================= */
function castEclipse(pm){
  const TR=tier();castLock=2.05;sfx.dark();
  const c0=mCenter(m),ex=c0.x,ey=Math.max(80*U,c0.y-215*U),RB=62*U*(1+.1*TR);
  addFX({dur:2.1,tick:0,up(dt,o){const t=o.t;dimT=Math.max(dimT,t<1.9?.68:.68*(1-(t-1.9)/.2));
    at(o,.05,()=>sfx.charge());
    if(t>.5&&t<1.45){if(m)m.lyT=-48*U;o.tick-=dt;
      if(o.tick<=0){o.tick=.12;if(fighting()){const c=mCenter(m);skillHit(.5,pm,c.x,c.y,{light:1,col:'#eeeeff',sid:'eclipse'})}}
      if(Math.random()<dt*55){const a=rnd(0,7),r=rnd(130,270)*U,px=ex+Math.cos(a)*r,py=ey+Math.sin(a)*r;
        P.push({t:'blob',x:px,y:py,vx:(ex-px)/.4,vy:(ey-py)/.4,g:0,drag:0,size:rnd(3,7)*U,life:.4,max:.4,color:'#05050a'})}
      addTrauma(dt*.45)}
    at(o,1.52,()=>{invertT=.1;sfx.thunder();
      const c=m?mCenter(m):c0,R=m?m.rb*U:44*U;
      for(let i=0;i<(6+3*TR)*(br('eclipse')==='a'?2:1);i++)P.push({t:'bolt',pts:genBolt(ex,ey,c.x+rnd(-1.8,1.8)*R,groundY),life:.4,max:.4});
      for(let i=0;i<8;i++)spike(c.x+rnd(-2,2)*R,rnd(25,45)*U,rnd(50,120)*U,rnd(-.5,.5),1+(i%2),'#101018','#4a4a5a',rnd(.8,1.2));
      ink(c.x,c.y,26,'#05050a');
      P.push({t:'ring',x:ex,y:ey,r0:10*U,r1:260*U,w:10*U,life:.4,max:.4,color:'#ffffff'});
      P.push({t:'ring',x:c.x,y:groundY,r0:10*U,r1:260*U,w:8*U,sy:.2,life:.5,max:.5,color:'#ffffff'});
      skillHit((6.5+TR)*(br('eclipse')==='a'?1.3:1),pm,c.x,c.y,{heavy:1,col:'#ffffff',name:'일식',fc:'255,255,255',crack:1,sid:'eclipse'})});
  },draw(o){const t=o.t;let r;
    if(t<.5)r=RB*easeBack(t/.5);else if(t<1.42)r=RB*(1+.04*Math.sin(t*20));else if(t<1.52)r=RB*lerp(1,.1,(t-1.42)/.1);else r=RB*.1*Math.max(0,1-(t-1.52)/.1);
    if(r<=.5)return;
    ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(ex,ey,r*.9,ex,ey,r*2.3);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(ex,ey,r*2.3,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';
    if(t>.35){ctx.lineCap='round';for(let i=0;i<3;i++){const a=t*3.2+i*2.1,rr=r*1.45+i*12*U;
      ctx.strokeStyle='#05050a';ctx.lineWidth=12*U;ctx.beginPath();ctx.arc(ex,ey,rr,a,a+1.7);ctx.stroke();
      ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.5*U;ctx.beginPath();ctx.arc(ex,ey,rr+7*U,a,a+1.5);ctx.stroke();ctx.globalCompositeOperation='source-over'}}
    ctx.fillStyle='#000';ctx.beginPath();ctx.arc(ex,ey,r,0,7);ctx.fill();
    ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#fff';ctx.lineWidth=3*U;ctx.beginPath();ctx.arc(ex,ey,r*1.02,0,7);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=8*U;ctx.beginPath();ctx.arc(ex,ey,r*1.1,0,7);ctx.stroke();
    ctx.fillStyle='#fff';for(let i=0;i<4;i++){const a=i*1.7+.4,s=(6+4*Math.abs(Math.sin(t*5+i)))*U;star4(ex+Math.cos(a)*r*2,ey+Math.sin(a)*r*1.6,s*2,s*.6,0);ctx.fill()}
    ctx.globalCompositeOperation='source-over';
  }});
}

/* ================= 7. 네온 연무 ================= */
function castNeon(pm){
  const TR=tier(),n=3+TR+(br('neon')==='a'?3:0),c0=mCenter(m),R=m.rb*U;sfx.power();
  const paths=[];for(let i=0;i<n;i++){const d=i%2?-1:1,sg=i%4<2?1:-1;
    paths.push([c0.x-d*R*3.4,c0.y+rnd(-.8,.8)*R,c0.x+d*R*2.6,c0.y-R*2.8*sg,c0.x-d*R*2.6,c0.y+R*2.2*sg,c0.x+d*R*3.4,c0.y+rnd(-.8,.8)*R])}
  const rib=[],COLS=['#ffb36b','#ff4fd8','#ff9ae6','#c26bff','#8a5bff'];
  const bez=(p,u)=>{const q=1-u;return[q*q*q*p[0]+3*q*q*u*p[2]+3*q*u*u*p[4]+u*u*u*p[6],q*q*q*p[1]+3*q*q*u*p[3]+3*q*u*u*p[5]+u*u*u*p[7]]};
  const T0=.15,PD=.2,end=T0+n*PD;
  addFX({dur:end+.65,up(dt,o){const t=o.t;dimT=Math.max(dimT,.5);castLock=Math.max(castLock,.05);let x=null,y=0;
    if(t<T0){const k=easeIn(t/T0);x=lerp(heroX,paths[0][0],k);y=lerp(groundY-60*U,paths[0][1],k)}
    else if(t<end){const i=Math.min(n-1,Math.floor((t-T0)/PD)),u=(t-T0-i*PD)/PD;[x,y]=bez(paths[i],u);
      if(u>=.5&&!o['h'+i]){o['h'+i]=1;const c=m?mCenter(m):c0;P.push({t:'slash',x:c.x,y:c.y,rot:rnd(0,6),fy:1,size:R*1.8,life:.2,max:.2,color:COLS[(i+1)%5]});
        burst(c.x,c.y,COLS,14,1000);skillHit(.9+.1*TR,pm,c.x,c.y,{col:'#ffc0f0',sid:'neon'});sfx.slash2()}}
    else if(t<end+.2){const k=easeOut((t-end)/.2),lp=paths[n-1];x=lerp(lp[6],heroX,k);y=lerp(lp[7],groundY-60*U,k)}
    else{h.ox=null;h.oy=0}
    if(x!==null){y=Math.min(y,groundY-60*U);if(o.px!==undefined)h.lean=clamp((x-o.px)*.02,-.6,.6);o.px=x;h.ox=x;h.oy=(y+60*U)-groundY;h.ang=2.5;rib.push({x,y,t:gt})}
    while(rib.length&&gt-rib[0].t>.7)rib.shift();
    at(o,end+.25,()=>{for(let i=0;i<rib.length;i+=3)P.push({t:'dot',x:rib[i].x,y:rib[i].y,vx:rnd(-80,80)*U,vy:rnd(-80,80)*U,g:0,drag:2,size:rnd(1.5,3)*U,life:.5,max:.5,color:COLS[i%5]});
      const c=m?mCenter(m):c0;P.push({t:'star',x:c.x,y:c.y,size:160*U,life:.16,max:.16});P.push({t:'ring',x:c.x,y:c.y,r0:10*U,r1:200*U,w:8*U,life:.4,max:.4,color:'#ff79c6'});
      skillHit((2.5+.5*TR)*(br('neon')==='b'?2:1),pm,c.x,c.y,{heavy:1,col:'#ffc0f0',name:'네온 연무',fc:'255,150,230',sid:'neon'});rib.length=0});
  },draw(){if(rib.length<2)return;ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    for(let l=0;l<5;l++){const off=(l-2)*5*U;ctx.strokeStyle=COLS[l];ctx.lineWidth=(l===2?4:2)*U;let px=0,py=0;
      for(let i=0;i<rib.length;i++){const p=rib[i],q=rib[Math.max(0,i-1)],r=rib[Math.min(rib.length-1,i+1)];let nx=-(r.y-q.y),ny=r.x-q.x;const nl=Math.hypot(nx,ny)||1;
        const w=off*(1+.6*Math.sin(i*.3+l)),X=p.x+nx/nl*w,Y=p.y+ny/nl*w;
        if(i){ctx.globalAlpha=Math.max(0,1-(gt-p.t)/.7)*.9;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(X,Y);ctx.stroke()}px=X;py=Y}}
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'},
  end(){h.ox=null;h.oy=0;h.lean=0}});
}

/* ================= 8. 결정 방패 ================= */
function crystalStar(x,y,s,rot,al){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.globalAlpha=al;
  ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(142,99,255,.28)';ctx.beginPath();ctx.arc(0,0,s*1.25,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';
  const path=(k)=>{ctx.beginPath();for(let i=0;i<16;i++){const a=i/16*Math.PI*2,r=(i%2?.34:i%4===0?1:.72)*s*k,bend=i%2?0:.12;const ax=a+bend;i?ctx.lineTo(Math.cos(ax)*r,Math.sin(ax)*r):ctx.moveTo(Math.cos(ax)*r,Math.sin(ax)*r)}ctx.closePath()};
  ctx.fillStyle='#1c0b3d';path(1);ctx.fill();ctx.fillStyle='#4b2a9a';path(.6);ctx.fill();
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#d9ccff';ctx.lineWidth=2*U;path(1);ctx.stroke();
  ctx.fillStyle='#e8dcff';ctx.beginPath();ctx.moveTo(0,-s*.22);ctx.lineTo(s*.15,0);ctx.lineTo(0,s*.22);ctx.lineTo(-s*.15,0);ctx.closePath();ctx.fill();
  ctx.restore();
}
function castShield(pm){
  const TR=tier(),sx=heroX+75*U,sy=groundY-72*U,S0=66*U*(1+.1*TR);sfx.chime();
  const o=addFX({dur:9,ph:0,tt:0,blocked:false,up(dt,o){o.tt+=dt;dimT=Math.max(dimT,.3);castLock=Math.max(castLock,.05);
    if(o.ph===0){if(o.tt>1.3||o.blocked){o.ph=1;o.tt=0;if(shieldOn===o)shieldOn=null;sfx.power();
        const c=m?mCenter(m):{x:monX,y:groundY-50*U};o.tx=c.x;o.ty=Math.max(40*U,c.y-300*U);
        o.pc=[...Array(8)].map((_,i)=>{const a=i/8*Math.PI*2;return{x:sx+Math.cos(a)*S0*.7,y:sy+Math.sin(a)*S0*.7,r:rnd(0,6)}})}}
    else if(o.ph===1){for(const p of o.pc)P.push({t:'dot',x:p.cx||p.x,y:p.cy||p.y,vx:0,vy:0,g:0,drag:0,size:3*U,life:.12,max:.12,color:'#c9b8ff'});
      if(o.tt>.55){o.ph=2;o.tt=0;flash(.3,'200,180,255');P.push({t:'star',x:o.tx,y:o.ty+60*U,size:170*U,life:.15,max:.15});sfx.chime()}}
    else{if(o.tt>.28&&!o.pl){o.pl=1;const c=m?mCenter(m):{x:o.tx,y:groundY-50*U},R=m?m.rb*U:44*U;
        for(let i=0;i<(br('shield')==='b'?22:10);i++){const x=c.x+rnd(-1.8,1.8)*R;spike(x,rnd(16,28)*U,rnd(60,140)*U,(x-c.x)/(R*1.8)*.6,1,'#2a1450','#b7a6ff',rnd(.8,1.2))}
        burst(c.x,c.y,['#e8dcff','#b7a6ff','#fff'],36,1300);P.push({t:'ring',x:c.x,y:groundY,r0:10*U,r1:260*U,w:8*U,sy:.2,life:.5,max:.5,color:'#b7a6ff'});
        skillHit((o.blocked?6:4)*(1+.2*TR)*(br('shield')==='b'?1.5:1),pm,c.x,c.y,{heavy:1,name:'결정 파쇄검',col:'#e8dcff',fc:'210,195,255',crack:2,sid:'shield'});sfx.bigboom()}
      if(o.tt>1)o.t=o.dur}
  },end(o){if(shieldOn===o)shieldOn=null},
  draw(o){const t=o.tt;
    if(o.ph===0){crystalStar(sx,sy,S0*easeBack(Math.min(1,t/.25)),o.t*2.2,1);
      for(let i=0;i<5;i++){const a=o.t*3+i*1.26;ctx.fillStyle='#c9b8ff';ctx.beginPath();star4(sx+Math.cos(a)*S0*1.3,sy+Math.sin(a)*S0*.5,6*U,3*U,a);ctx.fill()}}
    else if(o.ph===1){const k=easeOut(Math.min(1,t/.45));
      o.pc.forEach((p,i)=>{p.cx=lerp(p.x,o.tx,k);p.cy=lerp(p.y,o.ty+i/7*230*U,k);ctx.fillStyle=i%2?'#4b2a9a':'#b7a6ff';ctx.beginPath();star4(p.cx,p.cy,14*U,6*U,p.r+t*10);ctx.fill()})}
    else{const len=250*U,c=m?mCenter(m):{x:o.tx,y:groundY-50*U};let hy=o.ty+Math.sin(t*6)*4*U;
      if(t>.2){const k=easeIn(Math.min(1,(t-.2)/.08));hy=lerp(o.ty,c.y+20*U-len,k)}
      const al=t>.65?Math.max(0,1-(t-.65)/.35):Math.min(1,t/.08);
      drawPSword(o.tx,hy,Math.PI/2,len,al,t<.3?1:.5,['#1c0b3d','#6a4ac8','#eee6ff','#b7a6ff','#2a1450'])}
  }});
  shieldOn=o;
}

/* ================= 9. 악귀 변신 ================= */
function castDemon(pm){
  frenzyT=pm<1?4:12+2*tier()+(br('demon')==='a'?6:br('demon')==='b'?-3:0);sfx.power();banner('악귀 변신','공격 속도 ×'+(br('demon')==='b'?'2.6':'2')+' · 참격파','#ff3d8b',1.3);flash(.35,'255,80,160');addTrauma(.4);
  P.push({t:'ring',x:heroX,y:groundY-50*U,r0:10*U,r1:230*U,w:10*U,life:.5,max:.5,color:'#ff3d8b'});
  P.push({t:'ring',x:heroX,y:groundY,r0:10*U,r1:160*U,w:6*U,sy:.22,life:.5,max:.5,color:'#ffb0d8'});
  for(let i=0;i<18;i++)P.push({t:'flame',x:heroX+rnd(-40,40)*U,y:groundY-rnd(0,40)*U,vx:rnd(-30,30)*U,vy:-rnd(150,380)*U,drag:1,g:0,r:rnd(12,26)*U,cols:['#3a0620','#ff3d8b','#ffb0d8'],life:rnd(.4,.8),max:.8});
}

/* ================= 10. 녹광 구체 ================= */
function castOrb(pm){
  const TR=tier(),x0=heroX,y0=groundY-55*U,RB=70*U;castLock=2.1;sfx.charge();
  addFX({dur:2.1,r:0,up(dt,o){const t=o.t,c=m?mCenter(m):{x:monX,y:groundY-50*U};dimT=Math.max(dimT,.45);
    if(t<.55){o.r=RB*easeBack(Math.min(1,t/.4));o.ox=x0;o.oy=y0;addTrauma(dt*.3);
      if(Math.random()<dt*60){const a=rnd(0,7),r=rnd(110,170)*U,px=x0+Math.cos(a)*r,py=y0+Math.sin(a)*r;P.push({t:'dot',x:px,y:py,vx:(x0-px)/.25,vy:(y0-py)/.25,g:0,drag:0,size:rnd(2,4)*U,life:.25,max:.25,color:'#7dff5a'})}}
    else if(t<.8){if(!o.go){o.go=1;h.hide=true;sfx.whoosh()}const k=easeIn((t-.55)/.25);o.ox=lerp(x0,c.x,k);o.oy=lerp(y0,c.y,k);
      P.push({t:'ring',x:o.ox,y:o.oy,r0:RB*.9,r1:RB*1.1,w:4*U,sx:.3,life:.3,max:.3,color:'#7dff5a'});
      if(Math.random()<.5)P.push({t:'smoke',x:o.ox,y:groundY-6*U,vx:-rnd(60,200)*U,vy:-rnd(10,60)*U,drag:3,r0:8*U,r1:30*U,life:.5,max:.5,color:'#6a6a74'})}
    else if(!o.hit){o.hit=1;o.bx=o.ox;o.by=o.oy;stop=Math.max(stop,.12);sfx.bigboom();
      rubble(o.bx,(m?m.rb*U:44*U)*2.4,10);burst(o.bx,o.by,['#ffe24a','#7dff5a','#fff'],44,1400);
      for(let i=0;i<16;i++)P.push({t:'dot',x:o.bx,y:o.by,vx:rnd(-500,500)*U,vy:rnd(-900,-200)*U,g:1600*U,drag:1,floor:1,size:rnd(2,4)*U,life:rnd(.6,1.2),max:1.2,color:'#ffb040'});
      smoke(o.bx,o.by,10,'#2a2a18',1.2);
      skillHit((5+TR)*(br('orb')==='a'?1.4:1),pm,o.bx,o.by,{heavy:1,name:'녹광 폭쇄',col:'#e8ff9a',fc:'220,255,150',crack:1,sid:'orb'})}
    if(t>1.5&&h.hide){h.hide=false;P.push({t:'ring',x:heroX,y:groundY-50*U,r0:10*U,r1:80*U,w:5*U,life:.3,max:.3,color:'#7dff5a'})}
  },end(){h.hide=false},
  draw(o){const t=o.t;
    if(!o.hit){if(o.ox===undefined)return;const r=o.r;
      ctx.fillStyle='rgba(8,24,8,.62)';ctx.beginPath();ctx.arc(o.ox,o.oy,r,0,7);ctx.fill();
      if(h.hide){ctx.fillStyle='#0a0a0a';ctx.beginPath();ctx.ellipse(o.ox,o.oy+r*.1,r*.35,r*.28,.3,0,7);ctx.fill()}
      ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#5aff3a';ctx.globalAlpha=.35;ctx.lineWidth=12*U;ctx.beginPath();ctx.arc(o.ox,o.oy,r,0,7);ctx.stroke();
      ctx.globalAlpha=1;ctx.strokeStyle='#c8ff9a';ctx.lineWidth=3*U;ctx.stroke();
      ctx.strokeStyle='#fff';ctx.lineWidth=2*U;ctx.beginPath();for(let i=0;i<12;i++){const a=i/12*Math.PI*2+t*3;ctx.moveTo(o.ox+Math.cos(a)*r*.82,o.oy+Math.sin(a)*r*.82);ctx.lineTo(o.ox+Math.cos(a)*r*.92,o.oy+Math.sin(a)*r*.92)}ctx.stroke();
      ctx.globalCompositeOperation='source-over'}
    else{const k=Math.min(1,(t-.8)/.5),R2=210*U*(1+.12*TR)*(br('orb')==='a'?1.5:1)*easeOut(k),fade=t>1.3?Math.max(0,1-(t-1.3)/.45):1;if(fade<=0)return;
      ctx.save();ctx.beginPath();ctx.rect(-100,-100,W+200,groundY+100+6*U);ctx.clip();
      ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';
      ctx.fillStyle='rgba(255,226,74,.5)';ctx.beginPath();ctx.arc(o.bx,o.by,R2,0,7);ctx.fill();
      ctx.fillStyle='rgba(255,150,80,.6)';ctx.beginPath();ctx.arc(o.bx,o.by,R2*.5,0,7);ctx.fill();
      ctx.fillStyle='rgba(255,190,210,.9)';ctx.beginPath();for(let i=0;i<5;i++)tongue(o.bx+(i-2)*R2*.08,o.by+R2*.15,R2*.12,R2*(.35+.1*Math.sin(t*14+i)),t*9+i);ctx.fill();
      ctx.strokeStyle='#5aff3a';ctx.lineWidth=10*U*fade;ctx.beginPath();ctx.arc(o.bx,o.by,R2,0,7);ctx.stroke();
      ctx.strokeStyle='#fff';ctx.lineWidth=2*U;ctx.beginPath();for(let i=0;i<16;i++){const a=i/16*Math.PI*2+t;ctx.moveTo(o.bx+Math.cos(a)*R2*.7,o.by+Math.sin(a)*R2*.7);ctx.lineTo(o.bx+Math.cos(a)*R2*.8,o.by+Math.sin(a)*R2*.8)}ctx.stroke();
      ctx.restore()}
  }});
}

/* ================= 11. 차원문 ================= */
function castPortal(pm){
  const TR=tier(),c0=mCenter(m),R=m.rb*U,pxp=c0.x+R*1.5,pyp=c0.y,rx=R*.85,ry=R*1.9*(1+.1*TR);castLock=2.3;sfx.dark();
  const sp=[...Array(18)].map(()=>rnd(0,1));
  addFX({dur:2.3,tick:0,up(dt,o){const t=o.t;dimT=Math.max(dimT,.5);
    if(t>.35&&t<1.35&&m){m.pxT=R*1.25;m.pxF=4;m.scT=.45;o.tick-=dt;
      if(o.tick<=0){o.tick=.1;if(fighting()){const c=mCenter(m);skillHit(.45+.05*TR,pm,c.x,c.y,{light:1,col:'#e0d4ff',sid:'portal'})}}
      if(Math.random()<dt*60){const a=rnd(0,7),r=rnd(120,220)*U,px=pxp+Math.cos(a)*r,py=pyp+Math.sin(a)*r;P.push({t:'dot',x:px,y:py,vx:(pxp-px)/.35,vy:(pyp-py)/.35,g:0,drag:0,size:rnd(1.5,3)*U,life:.35,max:.35,color:Math.random()<.5?'#c9b8ff':'#fff'})}
      addTrauma(dt*.3)}
    at(o,1.35,()=>{if(m)m.kv-=1700*U;flash(.4,'220,200,255');P.push({t:'star',x:pxp,y:pyp,size:170*U,life:.16,max:.16});
      for(let i=0;i<3;i++)P.push({t:'ring',x:pxp,y:pyp,r0:10*U,r1:(150+i*60)*U,w:6*U,sx:.5,life:.4+i*.1,max:.4+i*.1,color:i?'#c9b8ff':'#fff'});
      burst(pxp,pyp,['#fff','#c9b8ff','#7b4dff'],30,1200,Math.PI);
      const c=m?mCenter(m):c0;skillHit(4.5+TR,pm,c.x,c.y,{heavy:1,name:'차원 방출',col:'#e0d4ff',fc:'220,200,255',crack:1,sid:'portal'});sfx.bigboom()});
  },draw(o){const t=o.t,s=t<.35?easeBack(t/.35):t<1.4?1:Math.max(0,1-(t-1.4)/.25);if(s<=0)return;
    ctx.save();ctx.translate(pxp,pyp);ctx.scale(s,s);
    ctx.fillStyle='#0a0612';ctx.beginPath();for(let i=0;i<36;i++){const a=i/36*Math.PI*2+t*.6,r=i%2?1:1.18+sp[i>>1]*.4;i?ctx.lineTo(Math.cos(a)*rx*r,Math.sin(a)*ry*r):ctx.moveTo(Math.cos(a)*rx*r,Math.sin(a)*ry*r)}ctx.closePath();ctx.fill();
    ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(0,0,rx*.86,ry*.86,0,0,7);ctx.fill();
    ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=2*U;ctx.setLineDash([8*U,6*U]);ctx.lineDashOffset=-t*60*U;
    for(const k of [.86,.7]){ctx.beginPath();ctx.ellipse(0,0,rx*k,ry*k,0,0,7);ctx.stroke()}ctx.setLineDash([]);
    ctx.strokeStyle='#b89aff';ctx.lineWidth=3*U;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(0,0,rx*(.2+.13*i),ry*(.2+.13*i),0,t*4+i,t*4+i+2);ctx.stroke()}
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,5*U*(1+Math.sin(t*20)*.3),0,7);ctx.fill();
    ctx.restore();
  }});
}

/* ================= 12. 괴수 돌진 ================= */
function castBeast(pm){
  const TR=tier();castLock=1.9;sfx.roar();
  addFX({dur:1.9,up(dt,o){const t=o.t,c=m?mCenter(m):{x:monX,y:groundY-50*U};dimT=Math.max(dimT,.45);
    if(t<.4){o.x=heroX-80*U;o.y=groundY-60*U-easeOut(t/.4)*30*U;o.a=Math.min(1,t/.25)}
    else if(t<.72){const k=easeIn((t-.4)/.32);o.x=lerp(heroX-80*U,c.x,k);o.y=lerp(groundY-90*U,c.y,k);o.a=1;
      P.push({t:'streak',x:o.x-120*U,y:o.y+rnd(-40,40)*U,x2:o.x-20*U,y2:o.y+rnd(-40,40)*U,life:.1,max:.1,w:2*U,color:'#ff9ad0'})}
    else if(!o.hit){o.hit=1;o.bx=c.x;o.by=c.y;stop=Math.max(stop,.12);sfx.bigboom();
      o.cl=[...Array(14)].map(()=>({x:rnd(-1,1)*120*U,y:rnd(-1,.5)*85*U,r:rnd(40,80)*U*(1+.1*TR),d:rnd(0,.1)}));
      for(let i=0;i<14;i++)P.push({t:'flame',x:c.x+rnd(-60,60)*U,y:c.y+rnd(-40,40)*U,vx:rnd(-200,200)*U,vy:-rnd(60,260)*U,drag:1,g:0,r:rnd(14,28)*U,cols:['#1a0a12','#ff3d8b','#ffd0e6'],life:rnd(.4,.8),max:.8});
      skillHit((5+TR)*(br('beast')==='b'?1.8:1),pm,c.x,c.y,{heavy:1,name:'괴수 돌진',col:'#ffc0dd',fc:'255,120,190',crack:1,sid:'beast'})}
  },back(o){const t=o.t;if(t>.75)return;const a=Math.min(1,t/.2)*(t>.55?Math.max(0,1-(t-.55)/.2):1);
    ctx.save();ctx.translate(heroX-80*U,groundY);ctx.scale(1,.25);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;ctx.strokeStyle='#ff3d8b';ctx.lineWidth=3*U;
    ctx.beginPath();ctx.arc(0,0,90*U,0,7);ctx.stroke();ctx.beginPath();ctx.arc(0,0,70*U,0,7);ctx.stroke();
    ctx.beginPath();for(let i=0;i<6;i++){const q=i/6*Math.PI*2+t*2,q2=q+Math.PI*2/6*2;ctx.moveTo(Math.cos(q)*70*U,Math.sin(q)*70*U);ctx.lineTo(Math.cos(q2)*70*U,Math.sin(q2)*70*U)}ctx.stroke();ctx.restore()},
  draw(o){const t=o.t;
    if(!o.hit){if(o.x!==undefined)drawBeast(o.x,o.y,(1+.12*TR)*(br('beast')==='b'?1.6:1),t,o.a);return}
    const fade=t>1.3?Math.max(0,1-(t-1.3)/.5):1;if(fade<=0)return;
    for(const cl of o.cl){const k=easeOut(clamp((t-.72-cl.d)/.25,0,1));ctx.globalAlpha=fade;ctx.fillStyle='#1a0a12';ctx.beginPath();ctx.arc(o.bx+cl.x,o.by+cl.y,cl.r*k,0,7);ctx.fill()}
    ctx.globalCompositeOperation='lighter';
    for(const cl of o.cl){const k=easeOut(clamp((t-.72-cl.d)/.25,0,1));ctx.globalAlpha=.75*fade;ctx.fillStyle='#ff3d8b';ctx.beginPath();ctx.arc(o.bx+cl.x*.6,o.by+cl.y*.6,cl.r*.5*k,0,7);ctx.fill()}
    ctx.globalAlpha=fade;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(o.bx,o.by,40*U*fade,0,7);ctx.fill();
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }});
}

/* ================= 13. 그림자 용 ================= */
function castDragon(pm){
  const TR=tier(),c0=mCenter(m),R=m.rb*U,seg=34+TR*6,tr=[];castLock=3;
  cutin('그림자 용','SHADOW DRAGON','#5a7bff');sfx.roar();
  addFX({dur:2.9,tick:0,jaw:0,up(dt,o){const t=o.t,c=m?mCenter(m):c0;dimT=Math.max(dimT,.62);castLock=Math.max(castLock,.05);let x,y;
    if(t<.25){x=heroX-30*U;y=groundY-t/.25*20*U}
    else if(t<.8){const k=(t-.25)/.55;x=lerp(heroX-30*U,heroX-60*U,k)+Math.sin(k*9)*20*U;y=lerp(groundY-20*U,groundY-230*U,easeOut(k))}
    else if(t<1.35){const th=Math.PI+(t-.8)/.55*Math.PI*1.8;x=heroX+50*U+Math.cos(th)*110*U;y=groundY-230*U+Math.sin(th)*90*U}
    else if(t<1.7){if(!o.d0)o.d0=[o.hx,o.hy];const k=easeIn((t-1.35)/.35);x=lerp(o.d0[0],c.x-R*.2,k);y=lerp(o.d0[1],c.y,k)-Math.sin(k*Math.PI)*60*U;o.jaw=k}
    else if(t<2.4){if(!o.bit){o.bit=1;o.jaw=0;ink(c.x,c.y,20);sfx.hit(true);skillHit((3+TR*.5)*(br('dragon')==='a'?2:1),pm,c.x,c.y,{heavy:1,name:'용의 송곳니',col:'#b8c6ff',fc:'150,170,255',crack:1,sid:'dragon'})}
      const w=(t-1.7)*9;x=c.x+Math.cos(w)*R*1.8;y=c.y+Math.sin(w)*R*.9;o.jaw=.3+.3*Math.sin(t*20);
      o.tick-=dt;if(o.tick<=0){o.tick=.1;if(fighting()){skillHit(.5*(br('dragon')==='a'?2:1),pm,c.x,c.y,{light:1,col:'#b8c6ff',sid:'dragon'})}}}
    else{x=o.hx;y=o.hy;if(!o.ex){o.ex=1;ink(c.x,c.y,40);smoke(c.x,c.y,12,'#07070f',1.4);
      for(let i=0;i<2;i++)P.push({t:'ring',x:c.x,y:c.y,r0:10*U,r1:(180+i*80)*U,w:8*U,life:.45,max:.45,color:'#5a7bff'});
      skillHit((4+TR)*(br('dragon')==='b'?2:1),pm,c.x,c.y,{heavy:1,name:'그림자 용',col:'#b8c6ff',fc:'150,170,255',crack:2,sid:'dragon'});sfx.bigboom()}}
    o.hx=x;o.hy=y;if(t<2.4){tr.unshift({x,y});if(tr.length>seg*2)tr.pop();
      if(Math.random()<dt*20&&tr.length>10){const p=tr[Math.floor(rnd(4,tr.length))];P.push({t:'blob',x:p.x,y:p.y,vx:rnd(-40,40)*U,vy:rnd(0,60)*U,g:400*U,drag:1,size:rnd(2,5)*U,life:.5,max:.5,color:'#07070f'})}}
  },back(o){pool(heroX-30*U,o.t,1.2,'rgba(90,123,255,.6)')},
  draw(o){const t=o.t,al=t>2.4?Math.max(0,1-(t-2.4)/.3):1;if(al<=0||tr.length<3)return;ctx.globalAlpha=al;
    const n=Math.min(tr.length,seg*2);
    for(let i=n-1;i>=2;i-=2){const p=tr[i],q=tr[i-2],k=i/(seg*2),r=(22-16*k)*U*(1+.1*TR);
      ctx.fillStyle='#07070f';ctx.beginPath();ctx.arc(p.x,p.y,r,0,7);ctx.fill();
      if(i%6===0){let dx=q.x-p.x,dy=q.y-p.y;const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;const nx=-dy,ny=dx;
        ctx.beginPath();ctx.moveTo(p.x+nx*r*.8-dx*r*.5,p.y+ny*r*.8-dy*r*.5);ctx.lineTo(p.x+nx*(r+14*U),p.y+ny*(r+14*U));ctx.lineTo(p.x+nx*r*.8+dx*r*.5,p.y+ny*r*.8+dy*r*.5);ctx.fill()}}
    ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(90,123,255,.55)';ctx.lineWidth=2*U;ctx.beginPath();
    for(let i=n-1;i>=0;i-=2){const p=tr[i],k=i/(seg*2),r=(22-16*k)*U*(1+.1*TR);i===n-1||i===n-2?ctx.moveTo(p.x,p.y-r):ctx.lineTo(p.x,p.y-r)}ctx.stroke();ctx.globalCompositeOperation='source-over';
    const a=Math.atan2(tr[0].y-tr[2].y,tr[0].x-tr[2].x);drawDHead(tr[0].x,tr[0].y,a,o.jaw,1.1+.1*TR);ctx.globalAlpha=1;
  }});
}

/* ================= 14. 염마 강림 ================= */
function demonShape(t){
  const w=Math.sin(t*3)*.03;ctx.beginPath();
  ctx.moveTo(-.1,0);ctx.quadraticCurveTo(-.34,-.35,-.2,-.62);ctx.lineTo(.2,-.62);ctx.quadraticCurveTo(.34,-.35,.1,0);ctx.closePath();
  ctx.moveTo(.13,-.72);ctx.ellipse(0,-.72,.13,.14,0,0,Math.PI*2);
  for(const s of [-1,1]){
    ctx.moveTo(s*.12,-.6);ctx.quadraticCurveTo(s*.45,-1+w,s*.92,-.84+w);ctx.quadraticCurveTo(s*.72,-.7,s*.84,-.5);ctx.quadraticCurveTo(s*.6,-.55,s*.62,-.36);ctx.quadraticCurveTo(s*.4,-.45,s*.15,-.4);ctx.closePath();
    ctx.moveTo(s*.07,-.82);ctx.quadraticCurveTo(s*.3,-.92,s*.26,-1.08);ctx.quadraticCurveTo(s*.2,-.92,s*.02,-.86);ctx.closePath();
    ctx.moveTo(s*.18,-.58);ctx.quadraticCurveTo(s*.44,-.4,s*.2,-.16);ctx.lineTo(s*.12,-.2);ctx.quadraticCurveTo(s*.28,-.4,s*.1,-.5);ctx.closePath();
  }
  ctx.fill();
}
function castInferno(pm){
  const TR=tier(),c0=mCenter(m),R=m.rb*U,cx=c0.x;castLock=3;
  cutin('염마 강림','INFERNO LORD','#ff8a2a');sfx.charge();
  const cracks=[...Array(7)].map((_,i)=>{const dir=i%2?1:-1,pts=[cx,groundY];let x=cx,y=groundY;for(let j=0;j<4;j++){x+=dir*rnd(25,60)*U;y+=rnd(0,10)*U;pts.push(x,y)}return pts});
  const pil=TR>=2||br('inferno')==='a'?[0,-1,1]:[0];
  addFX({dur:3.1,tick:0,up(dt,o){const t=o.t;dimT=Math.max(dimT,t<2.7?.58:.58*(1-(t-2.7)/.4));castLock=Math.max(castLock,.05);
    if(t>.3&&t<2.7){tintA=Math.max(tintA,.1);tintC='255,110,30'}
    if(t<1.25)h.ang=lerp(-.55,-1.8,easeOut(Math.min(1,t/.3)));else if(t<1.4)h.ang=lerp(-1.8,.95,easeOut(Math.min(1,(t-1.25)/.05)));if(t<1.4)h.t=9;
    if(Math.random()<dt*45)P.push({t:'dot',x:cx+rnd(-160,160)*U,y:groundY,vx:rnd(-20,20)*U,vy:-rnd(100,320)*U,g:0,drag:.5,size:rnd(1.5,3.5)*U,life:rnd(.6,1.2),max:1.2,color:Math.random()<.5?'#ffb040':'#ff5a1a'});
    if(t>.3&&t<1.25)addTrauma(dt*.55);
    at(o,.3,()=>sfx.rumble());
    at(o,1.25,()=>{sfx.bigboom();flash(.8,'255,200,120');addTrauma(1);stop=Math.max(stop,.12);
      for(const p of pil)rubble(cx+p*R*2.4,R*2.3*(p?.6:1),p?6:12,1.6);
      burst(cx,groundY-40*U,['#fff4c0','#ffb040','#ff5a1a'],40,1500);
      P.push({t:'ring',x:cx,y:groundY,r0:10*U,r1:320*U,w:10*U,sy:.2,life:.6,max:.6,color:'#ffb040'});
      P.push({t:'star',x:cx,y:groundY-H*.45,size:180*U,life:.2,max:.2});
      const c=m?mCenter(m):c0;skillHit(5+TR,pm,c.x,c.y,{heavy:1,col:'#ffd070',name:'염마 강림',fc:'255,200,120',crack:1,sid:'inferno'})});
    if(t>1.3&&t<2.3){o.tick-=dt;if(o.tick<=0){o.tick=.1;if(fighting()){const c=mCenter(m);skillHit(.8,pm,c.x,c.y,{light:1,col:'#ffc04a',sid:'inferno'})}}addTrauma(dt*1.1);
      if(Math.random()<dt*30)P.push({t:'flame',x:cx+rnd(-R,R),y:groundY-rnd(40,260)*U,vx:rnd(-60,60)*U,vy:-rnd(150,350)*U,drag:1,g:0,r:rnd(12,26)*U,cols:['#8a1a08','#ff5a1a','#ffc04a'],life:rnd(.3,.6),max:.6})}
    at(o,2.3,()=>{sfx.bigboom();const c=m?mCenter(m):c0;skillHit(8+TR*1.5,pm,c.x,c.y,{heavy:1,col:'#fff0b0',name:'염마 강림',fc:'255,220,150',crack:2,sid:'inferno'});
      smoke(cx,groundY-100*U,14,'#2a0c06',1.4)});
  },back(o){const t=o.t;
    const ca=Math.min(1,t/.3)*(t>2.6?Math.max(0,1-(t-2.6)/.4):1);
    if(ca>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=ca;ctx.strokeStyle='#ffb040';ctx.lineWidth=3*U;ctx.lineJoin='round';
      for(const p of cracks){ctx.beginPath();ctx.moveTo(p[0],p[1]);for(let j=2;j<p.length;j+=2)ctx.lineTo(p[j],p[j+1]);ctx.stroke()}ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
    if(t<.3)return;const rev=easeOut(Math.min(1,(t-.3)/.9)),al=t>2.4?Math.max(0,1-(t-2.4)/.6):1,yo=t>2.4?-(t-2.4)*140*U:0;if(al<=0)return;
    const DH=Math.min(H*.9,groundY*1.15),base=groundY+10*U+yo,dx=cx+10*U;
    ctx.save();ctx.beginPath();ctx.rect(-100,base-DH*1.15*rev,W+200,DH*1.3);ctx.clip();ctx.globalAlpha=al;
    const cols=['#7a1606','#e0461a','#ff9a2a','#ffd680'],ks=[1,.9,.78,.6];
    for(let i=0;i<4;i++){ctx.save();ctx.translate(dx,base-DH*.55);ctx.scale(DH*ks[i],DH*ks[i]);ctx.translate(0,.55);ctx.fillStyle=cols[i];demonShape(t+i*.4);ctx.restore()}
    ctx.save();ctx.translate(dx,base);ctx.scale(DH,DH);ctx.globalCompositeOperation='lighter';
    ctx.fillStyle=`rgba(255,255,220,${t>1?1:.5})`;for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*.03,-.73);ctx.lineTo(s*.1,-.76);ctx.lineTo(s*.09,-.72);ctx.closePath();ctx.fill()}
    ctx.restore();ctx.restore();
  },draw(o){const t=o.t;if(t<1.25||t>2.65)return;
    const g=easeOut(Math.min(1,(t-1.25)/.12)),s=t>2.3?Math.max(0,1-(t-2.3)/.35):1;if(s<=0)return;
    const cols=['#8a1a08','#ff5a1a','#ffb040','#fff4c0'],wf=[1,.76,.52,.26],n=5;
    for(const p of pil){const px=cx+p*R*2.4,sc=p?.6:1,PH=(groundY+30)*g*(.8+.2*s)*sc,PW=R*2.8*(.5+.5*s)*sc;
      for(let i=0;i<4;i++){ctx.fillStyle=cols[i];ctx.beginPath();
        for(let j=0;j<n;j++){const x=px+(j/(n-1)-.5)*PW*wf[i]*.7;tongue(x,groundY+8*U,PW*wf[i]/n*2,PH*(.72+.28*Math.sin(t*10+j*1.9+i+p))*(1-i*.08),t*8+j*1.3+i)}ctx.fill()}
      ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.22*s;ctx.fillStyle='#ffb040';ctx.fillRect(px-PW*.6,0,PW*1.2,groundY);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
  }});
}

/* ================= 각성: 천검멸 ================= */
function castAwaken(){
  if(gauge<100||!fighting()||castLock>0)return false;
  gauge=0;S.awakes++;castLock=3;
  cutin('천검멸','AWAKENING · 千劍滅','#ff2a3a');
  const c0=mCenter(m),R=m.rb*U,lines=[];
  addFX({dur:2.9,up(dt,o){const t=o.t,c=m?mCenter(m):c0;dimT=Math.max(dimT,.3);castLock=Math.max(castLock,.05);desat=t<2.3?1:0;h.hide=t<2.4;
    if(t>.1&&t<1.3){o.acc=(o.acc||0)+dt;while(o.acc>.045){o.acc-=.045;const a=rnd(0,Math.PI);lines.push({x:c.x+rnd(-.4,.4)*R,y:c.y+rnd(-.4,.4)*R,a,L:rnd(1.5,3)*R*2.2,t});
      skillHit(.6,1,c.x,c.y,{light:1,col:'#ff5a6a',sid:'awaken'});if(lines.length%3===0)sfx.slash2();addTrauma(.08)}}
    at(o,1.35,()=>{stop=Math.max(stop,.35)});
    at(o,1.5,()=>{flash(1);addCrack(c.x,c.y,true);skillHit(15,1,c.x,c.y,{heavy:1,name:'천검멸',col:'#ff5a6a',fc:'255,255,255',sid:'awaken'});sfx.bigboom();ink(c.x,c.y,30,'#b0101e');
      for(const l of lines)P.push({t:'spark',x:l.x+Math.cos(l.a)*rnd(-l.L/2,l.L/2),y:l.y+Math.sin(l.a)*rnd(-l.L/2,l.L/2),vx:rnd(-400,400)*U,vy:rnd(-400,200)*U,drag:3,g:600*U,w:3*U,life:.5,max:.5,color:'#ff3a4a'})});
  },draw(o){const t=o.t;if(t>1.4&&t<2.4){ctx.save();ctx.translate(c0.x+R*2.4,groundY);ctx.scale(-1,1);drawSil(0,0,'#0a0a10',1,1,.05,t<1.9?.9:-1.4,true);ctx.restore()}},
  post(o){const t=o.t;if(t>1.55)return;ctx.lineCap='butt';
    for(const l of lines){const k=Math.min(1,(t-l.t)/.05),glow=t>1.35,dx=Math.cos(l.a)*l.L/2*k,dy=Math.sin(l.a)*l.L/2*k;
      ctx.strokeStyle='#000';ctx.lineWidth=(glow?6:3.5)*U;ctx.beginPath();ctx.moveTo(l.x-dx,l.y-dy);ctx.lineTo(l.x+dx,l.y+dy);ctx.stroke();
      ctx.strokeStyle=glow?'#fff':'#ff2a3a';ctx.lineWidth=(glow?3:1.6)*U;ctx.stroke()}},
  end(){h.hide=false;desat=0}});
  return true;
}

/* ================= 연계기 ================= */
function comboLunar(pm=1){
  castLock=2.4;const c0=mCenter(m);
  addFX({dur:2.4,up(dt,o){const t=o.t;dimT=Math.max(dimT,.7);tintA=Math.max(tintA,.2);tintC='200,20,50';castLock=Math.max(castLock,.05);
    at(o,.9,()=>{const c=m?mCenter(m):c0;skillHit(10,pm,c.x,c.y,{heavy:1,name:'월식 처형',col:'#ff5a6a',fc:'255,60,80',crack:2,sid:'combo'});sfx.slash2();sfx.bigboom();ink(c.x,c.y,30,'#1a0006')});
  },draw(o){const t=o.t,mx=W*.5,my=H*.2,mr=70*U*easeBack(Math.min(1,t/.4)),al=t>1.9?Math.max(0,1-(t-1.9)/.5):1;
    ctx.globalAlpha=al;ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(mx,my,mr*.8,mx,my,mr*2.4);g.addColorStop(0,'rgba(255,40,70,.5)');g.addColorStop(1,'rgba(255,40,70,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(mx,my,mr*2.4,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#d0143a';ctx.beginPath();ctx.arc(mx,my,mr,0,7);ctx.fill();ctx.fillStyle='#14020a';ctx.beginPath();ctx.arc(mx+mr*.38,my-mr*.12,mr*.93,0,7);ctx.fill();
    if(t>.8&&t<1.7){const k=(t-.8)/.9,p={x:c0.x,y:c0.y,rot:-.45,fy:1},s=W*.42*(.9+.25*easeOut(k));
      ctx.globalAlpha=al*(1-k);ctx.fillStyle='#05000a';cres(p,s,1.08,1.3,.2,1.02,1.15);ctx.fill();
      ctx.globalCompositeOperation='lighter';ctx.fillStyle='#ff2a4a';cres(p,s,1.1,1.25,.05,1.07,1.2);ctx.fill();ctx.globalCompositeOperation='source-over'}
    ctx.globalAlpha=1}});
}
function comboRain(pm=1){
  castLock=2.5;const c0=mCenter(m),R=m.rb*U,py=Math.max(50*U,c0.y-270*U),sw=[],L=90*U;
  addFX({dur:2.5,up(dt,o){const t=o.t,c=m?mCenter(m):c0;dimT=Math.max(dimT,.55);castLock=Math.max(castLock,.05);
    if(t>.4&&t<1.7){o.acc=(o.acc||0)+dt;while(o.acc>.075){o.acc-=.075;sw.push({x:c0.x+rnd(-1.2,1.2)*R,ty:c.y+rnd(-.5,.8)*R,t,hit:0})}}
    for(const s of sw){const k=Math.min(1,(t-s.t)/.1);s.cy=lerp(py,s.ty,easeIn(k));if(k>=1&&!s.hit){s.hit=1;burst(s.x,s.ty,['#c9a8ff','#fff'],6,700);skillHit(.8,pm,s.x,s.ty,{light:1,col:'#d9c6ff',sid:'combo'});sfx.hit(false)}}
    at(o,1.9,()=>{for(const s of sw)for(let i=0;i<2;i++)P.push({t:'shard',x:s.x,y:s.ty,vx:rnd(-400,400)*U,vy:rnd(-600,-100)*U,g:1500*U,drag:1,floor:1,size:rnd(4,9)*U,rot:rnd(0,6),vr:rnd(-12,12),life:.9,max:.9,color:'#7b4dff'});
      skillHit(5,pm,c.x,c.y,{heavy:1,name:'차원 검우',col:'#d9c6ff',fc:'200,170,255',crack:1,sid:'combo'});sfx.boom();sw.length=0});
  },draw(o){const t=o.t,s=t<.35?easeBack(t/.35):t<1.8?1:Math.max(0,1-(t-1.8)/.25);
    if(s>0){ctx.fillStyle='#0a0612';ctx.beginPath();ctx.ellipse(c0.x,py,R*1.9*s,R*.45*s,0,0,7);ctx.fill();
      ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#c9b8ff';ctx.lineWidth=3*U;ctx.beginPath();ctx.ellipse(c0.x,py,R*1.9*s,R*.45*s,0,0,7);ctx.stroke();
      ctx.setLineDash([8*U,6*U]);ctx.lineDashOffset=-t*60*U;ctx.beginPath();ctx.ellipse(c0.x,py,R*1.5*s,R*.32*s,0,0,7);ctx.stroke();ctx.setLineDash([]);ctx.globalCompositeOperation='source-over'}
    for(const s2 of sw)if(s2.cy!==undefined)drawPSword(s2.x,s2.cy-L*.55,Math.PI/2,L,1,s2.hit?0:.6)}});
}
function comboCrimson(pm=1){
  castLock=2.3;const c0=mCenter(m),booms=[];
  addFX({dur:2.3,up(dt,o){const t=o.t,c=m?mCenter(m):c0;dimT=Math.max(dimT,.5);castLock=Math.max(castLock,.05);
    for(let i=0;i<6;i++)at(o,.1+i*.14,()=>{const k=i/5,x=lerp(heroX+80*U,c.x,k),y=lerp(groundY-40*U,c.y,k);booms.push({x,y,t:0,sc:.35+k*.55,seed:[...Array(12)].map(()=>rnd(0,7))});sfx.boom();addTrauma(.3);
      if(i===5)skillHit(7,pm,c.x,c.y,{heavy:1,name:'진홍 섬멸',col:'#ffb3b8',fc:'255,120,140',crack:2,sid:'combo'});else skillHit(.8,pm,c.x,c.y,{light:1,col:'#ffb3b8',sid:'combo'})});
    for(const b of booms)b.t+=dt;
  },draw(){for(const b of booms)fleshBoom(b,b.sc)}});
}
const COMBOS=[
  {a:'shadow',b:'eclipse',name:'월식 처형',fn:comboLunar,col:'#ff4a6a',d:'붉은 달이 떠오르고, 화면 전체를 가르는 거대한 참격이 떨어진다.'},
  {a:'swords',b:'portal',name:'차원 검우',fn:comboRain,col:'#c9a8ff',d:'하늘에 열린 차원문에서 보랏빛 검이 비처럼 쏟아진다.'},
  {a:'breath',b:'cannon',name:'진홍 섬멸',fn:comboCrimson,col:'#ff6b7a',d:'기사 앞부터 적까지 붉은 폭발이 연쇄로 터져 나간다.'}];
const comboWin=()=>hasMod('chain')?16:8;
let lastCast=null,pendingCombo=null;
const skOf=id=>SK.find(s=>s.id===id);
function comboReady(c){return unlocked(skOf(c.a))&&unlocked(skOf(c.b))}
function activeLink(){
  if(!lastCast||pendingCombo||gt-lastCast.t>=comboWin())return null;
  const c=COMBOS.find(c=>c.a===lastCast.id);if(!c||!comboReady(c))return null;
  return{c,left:comboWin()-(gt-lastCast.t)};
}
function fireCombo(c,pm){
  const a=skOf(c.a),b=skOf(c.b);
  cutin(c.name,`${a.name} ＋ ${b.name}`,c.col,[a.c,b.c]);c.fn(pm);
}
function previewCombo(c){if(!fighting()||castLock>0)return false;fireCombo(c,.1);return true}

/* ================= 유물 상자 ================= */
let relicQ=[];
function hexRgb(h){const n=parseInt(h.slice(1),16);return`${n>>16&255},${n>>8&255},${n&255}`}
function rollRelic(boss,min=0){const w=boss?[.45,.33,.17,.05]:RAR.map(r=>r.w);let r=Math.random(),rar=0;
  if(r<w[3])rar=3;else if(r<w[3]+w[2])rar=2;else if(r<w[3]+w[2]+w[1])rar=1;
  rar=Math.max(rar,min);const pool=RELICS.filter(x=>x.r===rar);return pool[Math.floor(Math.random()*pool.length)]}
function relicFX(x,boss,min=0){
  const rel=rollRelic(boss,min),rar=rel.r,col=RAR[rar].c;
  addFX({dur:rar===3?3.4:2.6,relic:1,c:0,y:-60*U,sh:0,up(dt,o){const t=o.t;
    o.y=t<.35?lerp(-60*U,groundY,easeIn(t/.35)):groundY;
    at(o,.35,()=>{sfx.chest();addTrauma(.2);smoke(x,groundY,5,'#3a3444',.5)});
    if(t>.4&&t<1){const k=(t-.4)/.6;o.sh=Math.sin(t*70)*3*U*k;o.c=Math.min(rar,Math.floor(k*(rar+1)))}else o.sh=0;
    at(o,1,()=>{o.c=rar;sfx.open(rar);flash(.3+rar*.15,hexRgb(col));burst(x,groundY-30*U,[col,'#fff'],20+rar*15,1100);
      P.push({t:'ring',x,y:groundY-30*U,r0:10*U,r1:(140+rar*50)*U,w:6*U,life:.5,max:.5,color:col});
      if(rar===3){slowT=1.2;S.legends++;addCrack(x,groundY-60*U,false);banner('전설 유물!',rel.name+' — '+rel.d(rv(rel.id)+1),col,2.6)}
      else banner(RAR[rar].n+' 유물 · '+rel.name,rel.d(rv(rel.id)+1),col,1.8);
      S.relics[rel.id]=rv(rel.id)+1;ST=stats();buildRelics();save()});
  },draw(o){const t=o.t,cc=RAR[o.c].c,fade=t>o.dur-.5?Math.max(0,(o.dur-t)/.5):1;
    ctx.save();ctx.globalAlpha=fade;
    if(t>1){const k=Math.min(1,(t-1)/.3);ctx.globalCompositeOperation='lighter';ctx.fillStyle=cc;
      for(let i=0;i<7+rar*2;i++){const a=-Math.PI/2+(i/(6+rar*2)-.5)*2.2+Math.sin(t*2+i)*.08,L=(160+rar*60)*U*k;ctx.globalAlpha=fade*.28;
        ctx.beginPath();ctx.moveTo(x,o.y-26*U);ctx.lineTo(x+Math.cos(a-.05)*L,o.y-26*U+Math.sin(a-.05)*L);ctx.lineTo(x+Math.cos(a+.05)*L,o.y-26*U+Math.sin(a+.05)*L);ctx.closePath();ctx.fill()}
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=fade}
    else if(t>.4){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(t-.4)*.9*(.6+.4*Math.sin(t*30));ctx.fillStyle=cc;ctx.beginPath();ctx.arc(x,o.y-20*U,50*U,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=fade}
    ctx.translate(x+o.sh,o.y);ctx.scale(U,U);
    ctx.fillStyle='#3a2616';ctx.beginPath();ctx.roundRect(-30,-36,60,36,4);ctx.fill();
    ctx.fillStyle=cc;ctx.fillRect(-30,-24,60,4);ctx.fillRect(-4,-36,8,36);
    ctx.save();ctx.translate(-30,-36);ctx.rotate(t>1?-1.9*easeOut(Math.min(1,(t-1)/.18)):0);
    ctx.fillStyle='#4a321e';ctx.beginPath();ctx.roundRect(0,-16,60,16,6);ctx.fill();ctx.fillStyle=cc;ctx.fillRect(26,-16,8,16);ctx.restore();
    ctx.restore();
    if(t>1){const k=easeOut(Math.min(1,(t-1)/.45)),iy=o.y-50*U-k*95*U,s=26*U*(.4+.6*k);
      ctx.save();ctx.globalAlpha=fade;ctx.translate(x,iy);ctx.rotate(Math.PI/4);ctx.fillStyle=cc;ctx.fillRect(-s,-s,s*2,s*2);ctx.fillStyle='#120c22';ctx.fillRect(-s*.78,-s*.78,s*1.56,s*1.56);ctx.restore();
      ctx.save();ctx.globalAlpha=fade;ctx.fillStyle=cc;ctx.font=`900 ${Math.round(s*1.1)}px "Noto Sans KR",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(rel.g,x,iy+1);ctx.restore()}
  }});
}

/* ================= 스킬 목록 ================= */
const IC={
  dash:'<svg viewBox="0 0 32 32"><path d="M4 9l7 7-7 7M13 9l7 7-7 7M22 9l6 7-6 7" stroke="#7fe3ff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  swords:'<svg viewBox="0 0 32 32"><g transform="rotate(-45 16 16)"><path d="M6 16l3-2h14l6 2-6 2H9z" fill="#4b2a9a" stroke="#c9a8ff" stroke-width="1.2"/><path d="M5 11l2 5-2 5" stroke="#8e63ff" stroke-width="2.4" fill="none"/></g><circle cx="7" cy="8" r="1.5" fill="#c9a8ff"/><circle cx="25" cy="25" r="1.5" fill="#c9a8ff"/></svg>',
  breath:'<svg viewBox="0 0 32 32"><rect x="6" y="11" width="25" height="10" rx="5" fill="#ff3d8b"/><rect x="6" y="14.5" width="25" height="3" rx="1.5" fill="#fff"/><circle cx="7" cy="16" r="6" fill="#fff"/></svg>',
  shadow:'<svg viewBox="0 0 32 32"><g fill="#0a0a18" stroke="#5a7bff" stroke-width="1.2"><path d="M2 30c0-7 2.5-11 5-11s5 4 5 11z"/><circle cx="7" cy="14" r="3.6"/><path d="M20 30c0-7 2.5-11 5-11s5 4 5 11z"/><circle cx="25" cy="14" r="3.6"/><path d="M10 30c0-9 3-13 6-13s6 4 6 13z"/><circle cx="16" cy="11" r="4.3"/></g></svg>',
  cannon:'<svg viewBox="0 0 32 32"><rect x="3" y="10" width="10" height="13" rx="2" fill="#4a4a56"/><rect x="11" y="12" width="17" height="9" rx="2" fill="#7a7a88"/><circle cx="29" cy="16.5" r="3" fill="#ff4f5e"/><rect x="5" y="15" width="8" height="2" fill="#ff4f5e"/></svg>',
  eclipse:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="none" stroke="#fff" stroke-width="2" opacity=".35"/><circle cx="16" cy="16" r="9" fill="#000" stroke="#fff" stroke-width="1.6"/></svg>',
  neon:'<svg viewBox="0 0 32 32"><path d="M3 22c6-16 20-16 14-4s-12 8-2-4 16-4 14 6" stroke="#ff4fd8" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M4 25c6-12 18-12 13-2" stroke="#8a5bff" stroke-width="1.6" fill="none"/></svg>',
  shield:'<svg viewBox="0 0 32 32"><path d="M16 2l3 9 9-3-6 8 6 8-9-3-3 9-3-9-9 3 6-8-6-8 9 3z" fill="#2a1450" stroke="#d9ccff" stroke-width="1.2"/><path d="M16 12l3 4-3 4-3-4z" fill="#e8dcff"/></svg>',
  demon:'<svg viewBox="0 0 32 32"><path d="M6 3c0 8 4 12 8 13M26 3c0 8-4 12-8 13" stroke="#ff3d8b" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="16" cy="21" r="8" fill="#ff3d8b"/><path d="M11.5 19.5l3.5 1.5M20.5 19.5L17 21" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
  orb:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#0c200a" stroke="#7dff5a" stroke-width="2.6"/><circle cx="16" cy="16" r="5" fill="#ffe24a"/></svg>',
  portal:'<svg viewBox="0 0 32 32"><path d="M16 1l3 5 5-2-1 6 5 2-4 4 4 4-5 2 1 6-5-2-3 5-3-5-5 2 1-6-5-2 4-4-4-4 5-2-1-6 5 2z" fill="#0a0612" stroke="#c9b8ff" stroke-width="1"/><ellipse cx="16" cy="16" rx="5" ry="8" fill="#000" stroke="#fff" stroke-width="1.2"/></svg>',
  beast:'<svg viewBox="0 0 32 32"><path d="M9 7c-1-4 1-6 3-6l1 6M23 7c1-4-1-6-3-6l-1 6" fill="#ff3d8b"/><rect x="4" y="6" width="24" height="22" rx="7" fill="#0a0508"/><ellipse cx="16" cy="17" rx="10" ry="9" fill="#ff3d8b"/><circle cx="12" cy="15" r="3" fill="#fff"/><circle cx="20" cy="15" r="3" fill="#fff"/><rect x="11" y="21" width="10" height="3" rx="1" fill="#0a0508"/></svg>',
  dragon:'<svg viewBox="0 0 32 32"><path d="M3 20c4-2 8-9 15-10l11 2-2 3-9 1 7 3-2 3-9-2c-4 2-7 4-11 0z" fill="#07070f" stroke="#5a7bff" stroke-width="1.2"/><path d="M9 10l-5-6 8 4" fill="#07070f" stroke="#5a7bff" stroke-width="1"/><path d="M17 13l4 1" stroke="#fff" stroke-width="1.6"/></svg>',
  inferno:'<svg viewBox="0 0 32 32"><path d="M16 2c2 6 9 8 9 17a9 9 0 0 1-18 0c0-5 2-7 3.5-9 .8 3.2 3.2 4.6 3.2 4.6C13.5 9 13.8 6 16 2z" fill="#ff5a1a"/><path d="M16 15c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1.5-3 2-4 .5 1.3 1.4 1.8 1.4 1.8 0-2.2.2-4 .6-5.8z" fill="#ffd26a"/></svg>',
};
const SK=[
  {id:'dash',name:'원소 질주',unlock:1,cd:8,c:'#7fe3ff',fn:castDash,d:'빙결·화염·대지·질풍을 번갈아 두르고 적을 꿰뚫는다.'},
  {id:'swords',name:'심연 비검',unlock:3,cd:13,c:'#9b6bff',fn:castSwords,d:'곁에 보랏빛 검이 떠올라 차례로 날아가 박힌 뒤, 한꺼번에 터진다.'},
  {id:'breath',name:'마룡 숨결',unlock:5,cd:20,c:'#ff3d8b',fn:castBreath,d:'힘을 모아 분홍빛 파괴 광선을 내뿜는다.'},
  {id:'shadow',name:'그림자 분신',unlock:8,cd:24,c:'#5a7bff',fn:castShadow,d:'그림자들이 차례로 벤 뒤 가시로 솟아오른다.'},
  {id:'cannon',name:'진홍 대포',unlock:11,cd:22,c:'#ff4f5e',fn:castCannon,d:'기계 대포를 꺼내 한 발. 붉은 살점 같은 폭발이 부풀어 오른다.'},
  {id:'eclipse',name:'일식',unlock:14,cd:32,c:'#e8e8ff',fn:castEclipse,d:'검은 태양이 적을 끌어올리고 검은 번개로 무너진다.'},
  {id:'neon',name:'네온 연무',unlock:17,cd:20,c:'#ff4fd8',fn:castNeon,d:'분홍 리본 궤적을 그리며 적 주위를 휘감아 연속으로 벤다.'},
  {id:'shield',name:'결정 방패',unlock:20,cd:26,c:'#b7a6ff',fn:castShield,d:'방패가 보스 공격을 막고, 파편이 거대한 검이 되어 내리꽂힌다. 막아내면 피해 1.5배. 자동 스킬이면 보스 공격에 맞춰 발동.'},
  {id:'demon',name:'악귀 변신',unlock:23,cd:45,c:'#ff5fa8',fn:castDemon,buff:1,d:'일정 시간 공격 속도 2배, 베기마다 참격파가 날아간다.'},
  {id:'orb',name:'녹광 구체',unlock:26,cd:28,c:'#7dff5a',fn:castOrb,d:'초록 구체에 몸을 싸고 돌진해 노란 불꽃 돔으로 터진다.'},
  {id:'portal',name:'차원문',unlock:30,cd:30,c:'#c9b8ff',fn:castPortal,d:'적 뒤에 가시 돋친 차원문을 열어 빨아들였다가 뱉어낸다.'},
  {id:'beast',name:'괴수 돌진',unlock:34,cd:30,c:'#ff3d8b',fn:castBeast,d:'가면 쓴 괴수를 불러내 검은 폭발과 함께 들이받는다.'},
  {id:'dragon',name:'그림자 용',unlock:38,cd:50,c:'#5a7bff',fn:castDragon,d:'먹물로 된 용이 하늘을 휘감고 내려와 적을 물어뜯는다.'},
  {id:'inferno',name:'염마 강림',unlock:42,cd:60,c:'#ff8a2a',fn:castInferno,d:'불꽃 마왕을 불러내 화염 기둥을 일으킨다.'},
];
const cds={};SK.forEach(s=>cds[s.id]=0);
const unlocked=s=>S.best>=s.unlock;
const equipped=s=>S.equip.includes(s.id);
function canCast(s){return fighting()&&(s.buff?frenzyT<=0:castLock<=0)}
function cast(s,preview){
  if(!canCast(s))return false;
  if(!preview){if(!unlocked(s)||cds[s.id]>0||sealed(s))return false;cds[s.id]=s.cd*ST.cdm;
    const cb=COMBOS.find(c=>lastCast&&c.a===lastCast.id&&c.b===s.id&&gt-lastCast.t<comboWin());
    if(cb){pendingCombo=cb;sfx.link();T.push({x:heroX,y:groundY-140*U,vx:0,vy:-60*U,text:'연계!',crit:1,label:cb.name,lcol:'#fff',size:34,life:1.2,max:1.2,color:cb.col})}
    lastCast={id:s.id,t:gt};
    const nx=COMBOS.find(c=>c.a===s.id);if(nx&&comboReady(nx))sfx.link()}
  s.fn(preview?.1:1);if(br(s.id))branchFX(s,preview?.1:1);if(!s.buff)castLock=Math.max(castLock,.1);return true;
}
function autoCast(){
  if(!fighting()||!S.auto)return;
  if(gauge>=100&&castLock<=0){castAwaken();return}
  if(lastCast&&gt-lastCast.t<8&&castLock<=0&&!pendingCombo){const cb=COMBOS.find(c=>c.a===lastCast.id);
    if(cb){const s=SK.find(x=>x.id===cb.b);if(equipped(s)&&unlocked(s)&&!sealed(s)&&cds[s.id]<=0){cast(s);return}}}
  for(let i=SK.length-1;i>=0;i--){const s=SK[i];if(s.id==='shield')continue;
    if(equipped(s)&&unlocked(s)&&!sealed(s)&&cds[s.id]<=0&&canCast(s)&&(s.buff||m.boss||m.hp>ST.atk*3)){cast(s);break}}
}
function tickCombo(){
  if(pendingCombo&&castLock<=0&&fighting()){const cb=pendingCombo;pendingCombo=null;S.combos++;fireCombo(cb,1)}
}

/* ================= 스킬 각성 분기 ================= */
const BR={
  dash:{a:['원소 폭풍','네 원소를 한꺼번에 두르고 질주 · 피해 +30%'],b:['왕복 질주','돌아오며 한 번 더 강하게 꿰뚫는다']},
  swords:{a:['검의 폭우','검이 5자루 더 떠오른다'],b:['연쇄 파열','박히는 순간마다 검이 터진다']},
  breath:{a:['쌍두 숨결','광선이 두 갈래로 휘감기고 지속 피해 +60%'],b:['과충전','광선이 끝나며 거대한 폭발']},
  shadow:{a:['그림자 군단','분신이 3명 더 나온다'],b:['그림자 처형','마지막에 거대한 그림자가 내려벤다']},
  cannon:{a:['삼연사','포탄을 세 발 연속 발사'],b:['대구경','폭발 크기 1.6배 · 피해 1.7배']},
  eclipse:{a:['개기일식','검은 번개 2배 · 피해 +30%'],b:['블랙홀','붕괴 뒤 블랙홀이 남아 계속 끌어당긴다']},
  neon:{a:['무한 궤적','휘감는 횟수 +3'],b:['네온 폭발','마무리 폭발 피해 2배']},
  shield:{a:['반사 결정','막아낸 공격을 광선으로 되돌려 준다'],b:['결정 붕괴','결정 가시가 두 배로 솟고 피해 1.5배']},
  demon:{a:['광란','지속 시간 +6초'],b:['악귀 강림','공격 속도 ×2.6 · 지속 시간 -3초']},
  orb:{a:['초신성','폭발 크기 1.5배 · 피해 1.4배'],b:['재폭발','잠시 후 한 번 더 폭발']},
  portal:{a:['쌍둥이 문','반대편에 문이 하나 더 열려 강타'],b:['차원 붕괴','문이 닫히며 균열이 연쇄 폭발']},
  beast:{a:['괴수 무리','괴수 두 마리가 더 뒤따른다'],b:['거대 괴수','크기 1.6배 · 피해 1.8배']},
  dragon:{a:['용의 분노','휘감기와 물기 피해 2배'],b:['먹물 폭풍','마지막 폭발 2배 · 먹물 비가 쏟아진다']},
  inferno:{a:['화염 군주','화염 기둥이 항상 3개'],b:['재앙의 불씨','끝난 뒤 3초간 땅이 불탄다']},
};
const br=id=>S.awk[id]||null;
const awkReq=s=>s.unlock+8;
const awkCost=s=>goldDrop(s.unlock+12)*40;
const sealed=s=>hasMod('seal')&&S.equip.indexOf(s.id)>1;
function buyAwk(s){
  if(br(s.id)||S.best<awkReq(s))return false;const c=awkCost(s);
  if(S.gold<c){banner('골드가 부족합니다',fmt(c)+' 골드가 필요해요','#9d95c4',1.3);return false}
  S.gold-=c;dispGold=S.gold;S.awk[s.id]='a';
  P.push({t:'ring',x:heroX,y:groundY-50*U,r0:10*U,r1:180*U,w:8*U,life:.5,max:.5,color:s.c});flash(.3);sfx.fanfare();
  banner('스킬 각성 · '+s.name,'분기를 골라 보세요: '+BR[s.id].a[0]+' / '+BR[s.id].b[0],s.c,2.2);save();return true;
}
function setBranch(s,b){if(!br(s.id))return;S.awk[s.id]=b;sfx.link();save()}
function later(d,fn,o={}){addFX(Object.assign({dur:d,end:fn},o))}
function fxBoom(x,y,sc){const b={x,y,t:0,seed:[...Array(12)].map(()=>rnd(0,7))};addFX({dur:1.4,up(dt){b.t+=dt},draw(){fleshBoom(b,sc)}})}
function branchFX(s,pm){
  const B=br(s.id),TR=tier(),c0=m?mCenter(m):{x:monX,y:groundY-50*U},R=m?m.rb*U:44*U,live=()=>fighting()?mCenter(m):null;
  if(s.id==='breath'&&B==='b')later(1.35,()=>{const c=live();if(!c)return;fxBoom(c.x,c.y,.9);burst(c.x,c.y,['#ff3d8b','#fff','#ffb0d8'],40,1400);
    P.push({t:'ring',x:c.x,y:c.y,r0:10*U,r1:220*U,w:10*U,life:.4,max:.4,color:'#ff9ac8'});sfx.bigboom();
    skillHit(4+TR,pm,c.x,c.y,{heavy:1,name:'과충전 폭발',col:'#ffc0dd',fc:'255,150,200',crack:1,sid:'breath'})});
  if(s.id==='shadow'&&B==='b'){const N=3+(TR>=1?1:0)+(TR>=3?1:0),fin=.42+N*.18+.22;castLock=Math.max(castLock,fin+1);
    later(fin+.12,()=>{if(!m)return;const x=m.x+R*1.8;
      addFX({dur:.9,up(dt,o){castLock=Math.max(castLock,.05);at(o,.28,()=>{const c=live();if(!c)return;
        P.push({t:'dslash',x:c.x,y:c.y,rot:-.6,fy:1,size:R*4.6,life:.4,max:.4,color:'#5a7bff'});ink(c.x,c.y,30);sfx.slash2();
        skillHit(4+TR*.5,pm,c.x,c.y,{heavy:1,name:'그림자 처형',col:'#b8c6ff',fc:'150,170,255',crack:1,sid:'shadow'})})},
        draw(o){const t=o.t,rise=Math.min(1,t/.2),al=t>.6?Math.max(0,1-(t-.6)/.3):1;ctx.save();ctx.translate(x,groundY);ctx.scale(-2.3,2.3*rise);
          ctx.globalCompositeOperation='lighter';drawSil(0,0,'#3a55ff',al*.5,1.08,.1,t<.28?-1.7:1,false);ctx.globalCompositeOperation='source-over';
          drawSil(0,0,'#05050c',al,1,.1,t<.28?-1.7:1,true);ctx.restore()}})})}
  if(s.id==='cannon'&&B==='a'){castLock=Math.max(castLock,2.4);
    for(const d of [.95,1.15])later(d,()=>{const sx=heroX+140*U,sy=groundY-58*U,sh={t:0};sfx.boom();addTrauma(.3);P.push({t:'star',x:sx,y:sy,size:80*U,life:.1,max:.1});
      addFX({dur:.14,up(dt){const c=live()||c0;sh.t+=dt;const k=Math.min(1,sh.t/.12);sh.x=lerp(sx,c.x,k);sh.y=lerp(sy,c.y,k)},
        draw(){if(sh.x===undefined)return;ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ff4f5e';ctx.lineWidth=7*U;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sh.x,sh.y);ctx.stroke();ctx.globalCompositeOperation='source-over'},
        end(){const c=live();if(!c)return;fxBoom(c.x+rnd(-20,20)*U,c.y+rnd(-20,20)*U,.6);skillHit(3+.5*TR,pm,c.x,c.y,{name:'연사',col:'#ffb3b8',sid:'cannon'})}})})}
  if(s.id==='eclipse'&&B==='b'){const ex=c0.x,ey=Math.max(80*U,c0.y-215*U);castLock=Math.max(castLock,3.2);
    later(1.6,()=>addFX({dur:1.5,tick:0,up(dt,o){castLock=Math.max(castLock,.05);dimT=Math.max(dimT,.55);if(m)m.lyT=-35*U;o.tick-=dt;
        if(o.tick<=0){o.tick=.1;const c=live();if(c)skillHit(.55,pm,c.x,c.y,{light:1,col:'#eeeeff',sid:'eclipse'})}
        if(Math.random()<dt*50){const a=rnd(0,7),r=rnd(80,200)*U;P.push({t:'blob',x:ex+Math.cos(a)*r,y:ey+Math.sin(a)*r,vx:-Math.cos(a)*r/.35,vy:-Math.sin(a)*r/.35,g:0,drag:0,size:rnd(2,5)*U,life:.35,max:.35,color:'#05050a'})}
        at(o,1.45,()=>{const c=live()||c0;burst(ex,ey,['#fff','#9fa8ff'],30,1200);P.push({t:'ring',x:ex,y:ey,r0:10*U,r1:200*U,w:8*U,life:.4,max:.4,color:'#fff'});sfx.boom();
          skillHit(2.5+TR*.5,pm,c.x,c.y,{heavy:1,name:'블랙홀 붕괴',col:'#fff',sid:'eclipse'})})},
      draw(o){const t=o.t,r=32*U*Math.min(1,t/.15)*(1+.08*Math.sin(t*25))*(t>1.4?Math.max(0,1-(t-1.4)/.1):1);if(r<=.5)return;
        ctx.lineCap='round';for(let i=0;i<3;i++){const a=t*6+i*2.1;ctx.strokeStyle='#05050a';ctx.lineWidth=7*U;ctx.beginPath();ctx.arc(ex,ey,r*1.6+i*6*U,a,a+1.5);ctx.stroke()}
        ctx.fillStyle='#000';ctx.beginPath();ctx.arc(ex,ey,r,0,7);ctx.fill();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#fff';ctx.lineWidth=2.5*U;ctx.beginPath();ctx.arc(ex,ey,r*1.05,0,7);ctx.stroke();ctx.globalCompositeOperation='source-over'}}))}
  if(s.id==='orb'&&B==='b')later(1.45,()=>{const c=live();if(!c)return;rubble(c.x,R*2,8);burst(c.x,c.y,['#ffe24a','#7dff5a','#fff'],36,1300);
    for(const [r1,col] of [[180,'#ffe24a'],[240,'#7dff5a']])P.push({t:'ring',x:c.x,y:c.y,r0:10*U,r1:r1*U,w:10*U,life:.45,max:.45,color:col});
    P.push({t:'glow',x:c.x,y:c.y,size:200*U,life:.35,max:.35,color:'#ffe24a'});sfx.bigboom();
    skillHit(3+TR,pm,c.x,c.y,{heavy:1,name:'재폭발',col:'#e8ff9a',fc:'220,255,150',crack:1,sid:'orb'})});
  if(s.id==='portal'&&B==='a'){castLock=Math.max(castLock,2.4);const px=c0.x-R*1.7,py=c0.y;
    later(1.5,()=>addFX({dur:.7,draw(o){const t=o.t,sc=t<.15?easeBack(t/.15):Math.max(0,1-(t-.45)/.25);if(sc<=0)return;ctx.save();ctx.translate(px,py);ctx.scale(sc,sc);
        ctx.fillStyle='#0a0612';ctx.beginPath();ctx.ellipse(0,0,R*.7,R*1.6,0,0,7);ctx.fill();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#c9b8ff';ctx.lineWidth=3*U;ctx.stroke();ctx.restore()},
      up(dt,o){at(o,.15,()=>{const c=live();if(!c)return;m.kv+=1500*U;burst(px,py,['#fff','#c9b8ff'],24,1200,0);P.push({t:'ring',x:px,y:py,r0:10*U,r1:150*U,w:6*U,sx:.5,life:.35,max:.35,color:'#fff'});sfx.boom();
        skillHit(3.5+TR,pm,c.x,c.y,{heavy:1,name:'쌍둥이 문',col:'#e0d4ff',fc:'220,200,255',sid:'portal'})})}}))}
  if(s.id==='portal'&&B==='b'){castLock=Math.max(castLock,2.3);
    for(let i=0;i<6;i++)later(1.55+i*.08,()=>{const c=live();if(!c)return;const y=c.y+(i/5-.5)*R*2.2,x=c.x+rnd(-.4,.4)*R;
      P.push({t:'star',x,y,size:80*U,life:.12,max:.12});burst(x,y,['#c9b8ff','#fff','#7b4dff'],10,900);sfx.hit(i===5);
      skillHit(i===5?2.5+TR*.5:.8,pm,c.x,c.y,i===5?{heavy:1,name:'차원 붕괴',col:'#e0d4ff',crack:1,sid:'portal'}:{light:1,col:'#e0d4ff',sid:'portal'})})}
  if(s.id==='beast'&&B==='a'){castLock=Math.max(castLock,2.2);
    for(const [d,oy] of [[.14,-60],[.28,55]]){const bs={};addFX({dur:1.3+d,up(dt,o){const t=o.t-d,c=live()||c0;if(t<0)return;
        if(t<.4){bs.x=heroX-110*U;bs.y=groundY-60*U+oy*U-easeOut(t/.4)*20*U;bs.a=Math.min(1,t/.25)}
        else if(t<.72){const k=easeIn((t-.4)/.32);bs.x=lerp(heroX-110*U,c.x,k);bs.y=lerp(groundY-80*U+oy*U,c.y+oy*.3*U,k)}
        else if(!bs.hit){bs.hit=1;smoke(c.x,c.y+oy*.3*U,8,'#1a0a12',.8);for(let i=0;i<6;i++)P.push({t:'flame',x:c.x+rnd(-40,40)*U,y:c.y+rnd(-30,30)*U,vx:rnd(-120,120)*U,vy:-rnd(60,200)*U,drag:1,g:0,r:rnd(10,20)*U,cols:['#1a0a12','#ff3d8b','#ffd0e6'],life:.6,max:.6});
          sfx.boom();skillHit(2+.3*TR,pm,c.x,c.y,{col:'#ffc0dd',sid:'beast'})}},
      draw(o){if(bs.x!==undefined&&!bs.hit)drawBeast(bs.x,bs.y,.7,o.t,bs.a)}})}}
  if(s.id==='dragon'&&B==='b')later(2.45,()=>addFX({dur:1.2,up(dt,o){dimT=Math.max(dimT,.6);
      if(Math.random()<dt*90)P.push({t:'blob',x:rnd(0,W),y:-10,vx:rnd(-40,40)*U,vy:rnd(500,900)*U,g:900*U,drag:0,floor:1,size:rnd(3,9)*U,life:1,max:1,color:'#07070f'});
      if(o.t<.6)addTrauma(dt*.6)}}));
  if(s.id==='inferno'&&B==='b'){const cx=c0.x;later(2.5,()=>addFX({dur:3,tick:0,up(dt,o){tintA=Math.max(tintA,.06);tintC='255,110,30';o.tick-=dt;
      if(o.tick<=0){o.tick=.25;const c=live();if(c)skillHit(.6,pm,c.x,c.y,{light:1,col:'#ffc04a',sid:'inferno'})}
      if(Math.random()<dt*40)P.push({t:'flame',x:cx+rnd(-2.5,2.5)*R,y:groundY-rnd(0,20)*U,vx:rnd(-20,20)*U,vy:-rnd(60,180)*U,drag:1,g:0,r:rnd(8,18)*U,cols:['#8a1a08','#ff5a1a','#ffc04a'],life:rnd(.4,.8),max:.8})},
    back(o){const a=Math.min(1,o.t/.3)*(o.t>2.5?Math.max(0,1-(o.t-2.5)/.5):1);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.35*a;
      const g=ctx.createRadialGradient(cx,groundY,0,cx,groundY,R*3);g.addColorStop(0,'#ff8a2a');g.addColorStop(1,'rgba(255,60,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(cx,groundY,R*3,R*.5,0,0,7);ctx.fill();
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}}))}
}
