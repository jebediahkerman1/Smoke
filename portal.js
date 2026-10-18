/* SMOKE PORTAL — first-person raycaster adapted from the DOOMED: Sector 13 engine.
   Canvas raycasting, DDA wall hits, WASD collision, mouse look and pointer-lock controls. */
(()=>{'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),$=id=>document.getElementById(id);
const W=960,H=540,FOV=Math.PI/3,PORTAL_HALF=.36,PORTAL_WIDTH=PORTAL_HALF*2;
const maps=[
['1111111111111111','1000000000000001','1000000000000001','1000000000000001','1000000000000001','1000000000000001','1000000000000001','1000000000000001','1000000000000001','1000000000000001','1000000000000001','1111111111111111'],
['1111111111111111','1000000000000001','1010000000000101','1000000000000001','1000100001000001','1000100001000001','1000000000000001','1010000000000101','1000000000000001','1000000000000001','1000000000000001','1111111111111111'],
['1111111111111111','1000000000000001','1000000000000001','1000110001100001','1000000000000001','1000000000000001','1000000000000001','1000110001100001','1000000000000001','1000000000000001','1000000000000001','1111111111111111'],
['1111111111111111','1000000000000001','1000000000000001','1010000000000101','1000000000000001','1000100001000001','1000100001000001','1000000000000001','1010000000000101','1000000000000001','1000000000000001','1111111111111111'],
['1111111111111111','1000000000000001','1000100001000001','1000100001000001','1000000000000001','1000000000000001','1000000000000001','1000000000000001','1000100001000001','1000100001000001','1000000000000001','1111111111111111'],
['1111111111111111','1000000000000001','1000000000000001','1000110001100001','1000000000000001','1010000000000101','1010000000000101','1000000000000001','1000110001100001','1000000000000001','1000000000000001','1111111111111111'],
['1111111111111111','1000000000000001','1010000000000101','1000000000000001','1000100001000001','1000100001000001','1000000000000001','1000000100000001','1000000100000001','1000000000000001','1000000000000001','1111111111111111'],
['1111111111111111','1000000000000001','1000000000000001','1000111000000001','1000001000000001','1000001000000001','1000000000000001','1000000011100001','1000000000100001','1000000000100001','1000000000000001','1111111111111111'],
['1111111111111111','1000000000000001','1000000000000001','1010000000000101','1000000000000001','1000110001100001','1000000000000001','1000110001100001','1000000000000001','1010000000000101','1000000000000001','1111111111111111'],
['1111111111111111','1000000000000001','1000100001000001','1000000000000001','1000100001000001','1000000000000001','1000000000000001','1000000000000001','1000100001000001','1000000000000001','1000000000000001','1111111111111111'],
['1111111111111111','1000000000000001','1000000000000001','1000110001100001','1000000000000001','1010000000000101','1000000000000001','1000000000000001','1000110001100001','1000000000000001','1000000000000001','1111111111111111']]
let level=0,map=maps[0],mw=16,mh=12,player={x:2.5,y:2.5,a:0},blue=null,orange=null,keys={},running=false,paused=false,completed=Array(maps.length).fill(false),last=0,depth=new Float32Array(W),messageCooldown=0,health=100,damageFlash=0,turrets=[],turretBolts=[];
const status=$('statusText'),hint=$('toast'),overlay=$('pauseOverlay');
const exitPoint={x:13.5,y:10.5};
const levelNames=['01 — FIRST CONTACT','02 — MOMENTUM EXCHANGE','03 — THE EXIT PROBLEM','04 — SENTINEL PROTOCOL','05 — CROSS-FIRE','06 — FINAL OVERRIDE','07 — THE MOVING MAZE','08 — BLIND CORNERS','09 — REACTOR RUN','10 — THE LAST TEST'];
const objectives=['OBJECTIVE: PLACE BOTH PORTALS AND FIND THE EXIT','OBJECTIVE: USE PORTALS TO CROSS THE CHAMBER','OBJECTIVE: REACH THE FINAL EXIT','OBJECTIVE: EVADE TURRETS, PLACE BOTH PORTALS, REACH EXIT','OBJECTIVE: SURVIVE CROSS-FIRE AND REACH EXIT','OBJECTIVE: SURVIVE THE FINAL SECURITY GRID','OBJECTIVE: NAVIGATE THE MOVING-MAZE TEST','OBJECTIVE: FIND A SAFE ROUTE THROUGH BLIND CORNERS','OBJECTIVE: CROSS THE REACTOR TEST CHAMBER','OBJECTIVE: COMPLETE THE FINAL TEST AND ESCAPE'];
const turretLayouts=[[],[],[],[{x:8.5,y:2.5},{x:11.5,y:7.5},{x:6.5,y:9.5}],[{x:5.5,y:2.5},{x:10.5,y:3.5},{x:8.5,y:8.5},{x:12.5,y:6.5}],[{x:5.5,y:2.5},{x:10.5,y:2.5},{x:5.5,y:8.5},{x:10.5,y:8.5},{x:12.5,y:5.5}],[{x:8.5,y:2.5},{x:12.5,y:4.5},{x:7.5,y:8.5}],[{x:5.5,y:3.5},{x:11.5,y:3.5},{x:8.5,y:8.5},{x:12.5,y:9.5}],[{x:5.5,y:2.5},{x:10.5,y:2.5},{x:8.5,y:6.5},{x:5.5,y:9.5},{x:12.5,y:8.5}],[{x:5.5,y:2.5},{x:10.5,y:2.5},{x:5.5,y:7.5},{x:10.5,y:7.5},{x:12.5,y:5.5},{x:8.5,y:9.5}]];
function tile(x,y){if(x<0||y<0||x>=mw||y>=mh)return'1';return map[Math.floor(y)][Math.floor(x)]}
function wall(x,y){return tile(x,y)!=='0'}
function rawRay(ox,oy,angle){
 const dx=Math.cos(angle),dy=Math.sin(angle),mx=Math.floor(ox),my=Math.floor(oy);
 let gx=mx,gy=my,stepX=dx<0?-1:1,stepY=dy<0?-1:1;
 const ddx=Math.abs(1/(Math.abs(dx)<1e-9?1e-9:dx)),ddy=Math.abs(1/(Math.abs(dy)<1e-9?1e-9:dy));
 let sx=dx<0?(ox-mx)*ddx:(mx+1-ox)*ddx,sy=dy<0?(oy-my)*ddy:(my+1-oy)*ddy,side=0,dist=0;
 for(let i=0;i<1600;i++){
  if(sx<sy){gx+=stepX;dist=sx;sx+=ddx;side=0}else{gy+=stepY;dist=sy;sy+=ddy;side=1}
  if(tile(gx,gy)!=='0'){
   const x=ox+dx*dist,y=oy+dy*dist;
   return {d:dist,x,y,side,nx:side===0?-stepX:0,ny:side===1?-stepY:0,tile:tile(gx,gy),gx,gy,angle};
  }
 }
 return {d:30,x:ox+dx*30,y:oy+dy*30,side:0,nx:0,ny:0,tile:'1',gx:0,gy:0,angle};
}
function frontDot(p,x,y){return (x-p.x)*p.nx+(y-p.y)*p.ny}
function portalHit(hit,angle,p){
 if(!p||Math.cos(angle)*p.nx+Math.sin(angle)*p.ny>=-.0001)return false;
 const tx=-p.ny,ty=p.nx,offset=(hit.x-p.x)*tx+(hit.y-p.y)*ty;
 return Math.abs(offset)<=PORTAL_HALF;
}
function ray(ox,oy,angle,hops=0){
 const hit=rawRay(ox,oy,angle);
 if(hops<2&&blue&&orange){
  const entry=portalHit(hit,angle,blue)?blue:portalHit(hit,angle,orange)?orange:null;
  if(entry){
   const dest=entry===blue?orange:blue,tx=-entry.ny,ty=entry.nx;
   const off=(hit.x-entry.x)*tx+(hit.y-entry.y)*ty;
   const outTx=-dest.ny,outTy=dest.nx;
   const nx=dest.x-outTx*off+dest.nx*.025,ny=dest.y-outTy*off+dest.ny*.025;
   const outAngle=angle+dest.angle-entry.angle+Math.PI;
   const tail=ray(nx,ny,outAngle,hops+1);
   return {...tail,d:hit.d+tail.d,throughPortal:true};
  }
 }
 return hit;
}
function say(text){hint.textContent=text;hint.classList.add('show');clearTimeout(say.timer);say.timer=setTimeout(()=>hint.classList.remove('show'),1900)}
function resetRoom(){
 map=maps[level];player={x:2.5,y:2.5,a:0};blue=null;orange=null;keys={};paused=false;health=100;damageFlash=0;turretBolts=[];turrets=(turretLayouts[level]||[]).map(p=>({...p,a:Math.atan2(2.5-p.y,2.5-p.x),cooldown:1+Math.random()*1.5,flash:0,alive:true}));overlay.classList.remove('visible');
 status.textContent='AWAITING SUBJECT';
 $('levelName').textContent=levelNames[level];
 $('objective').textContent=objectives[level];
 $('progressLabel').textContent=completed.filter(Boolean).length+' / '+maps.length+' COMPLETE';
 $('trackFill').style.width=(completed.filter(Boolean).length/maps.length*100)+'%';
 $('nextBtn').disabled=!completed[level]||level>=maps.length-1;draw();
}
function placePortal(which){
 if(!running||paused)return;
 const hit=rawRay(player.x,player.y,player.a);
 if(hit.d>14){say('Too far away. Aim at a wall.');return}
 // Portals can be placed anywhere the crosshair hits a wall surface;
 // no more forced center-of-panel placement.
 const p={x:hit.x,y:hit.y,nx:hit.nx,ny:hit.ny,angle:Math.atan2(hit.ny,hit.nx),color:which};
 if(which==='blue')blue=p;else orange=p;
 say((which==='blue'?'BLUE':'ORANGE')+' portal placed at target location');draw();
}
function tryMove(nx,ny){
 const oldX=player.x,oldY=player.y;
 for(const entry of [blue,orange]){
  if(!entry)continue;
  const before=frontDot(entry,oldX,oldY),after=frontDot(entry,nx,ny);
  const tx=-entry.ny,ty=entry.nx,offset=(nx-entry.x)*tx+(ny-entry.y)*ty;
  if(before>.08&&after<=.08&&Math.abs(offset)<PORTAL_HALF-.10&&blue&&orange){
   const dest=entry===blue?orange:blue,outTx=-dest.ny,outTy=dest.nx;
   const oldOffset=(oldX-entry.x)*tx+(oldY-entry.y)*ty;
   player.x=dest.x-outTx*oldOffset+dest.nx*.34;
   player.y=dest.y-outTy*oldOffset+dest.ny*.34;
   player.a+=dest.angle-entry.angle+Math.PI;
   say('PORTAL TRANSFER — MOMENTUM PRESERVED');return true;
  }
 }
 let moved=false;
 if(!wall(nx,oldY)) {player.x=nx;moved=true}
 if(!wall(player.x,ny)){player.y=ny;moved=true}
 return moved;
}
function step(dt){
 if(!running||paused)return;
 let speed=(keys.shift?3.6:2.5)*dt,dx=0,dy=0;
 if(keys.w||keys.arrowup){dx+=Math.cos(player.a)*speed;dy+=Math.sin(player.a)*speed}
 if(keys.s||keys.arrowdown){dx-=Math.cos(player.a)*speed;dy-=Math.sin(player.a)*speed}
 if(keys.a){dx+=Math.cos(player.a-Math.PI/2)*speed;dy+=Math.sin(player.a-Math.PI/2)*speed}
 if(keys.d){dx+=Math.cos(player.a+Math.PI/2)*speed;dy+=Math.sin(player.a+Math.PI/2)*speed}
 if(dx||dy)tryMove(player.x+dx,player.y+dy);
 updateTurrets(dt);
 if(Math.hypot(player.x-exitPoint.x,player.y-exitPoint.y)<.62){
  if(!blue||!orange){if(messageCooldown<=0){say('Place both portals before ending the test.');messageCooldown=2}}
  else if(!completed[level]){
   completed[level]=true;running=false;document.exitPointerLock?.();status.textContent='CHAMBER COMPLETE';
   $('nextBtn').disabled=false;$('progressLabel').textContent=completed.filter(Boolean).length+' / '+maps.length+' COMPLETE';
   $('trackFill').style.width=(completed.filter(Boolean).length/maps.length*100)+'%';
   if(level<maps.length-1){$('nextBtn').disabled=true;say('EXIT OPEN — ENTERING NEXT CHAMBER');setTimeout(()=>{if(completed[level]&&level<maps.length-1){level++;resetRoom();running=true;status.textContent='TEST IN PROGRESS';canvas.requestPointerLock?.()}},1400)}else{say('ALL 10 CHAMBERS COMPLETE — YOU ESCAPED SMOKE LABS!');status.textContent='ALL TESTS COMPLETE';}
  }
 }
 messageCooldown=Math.max(0,messageCooldown-dt);
}
function updateTurrets(dt){
 for(const t of turrets){
  if(!t.alive)continue;
  const dx=player.x-t.x,dy=player.y-t.y,dist=Math.hypot(dx,dy),target=Math.atan2(dy,dx);
  const da=Math.atan2(Math.sin(target-t.a),Math.cos(target-t.a));t.a+=Math.max(-dt*1.8,Math.min(dt*1.8,da));t.cooldown-=dt;t.flash=Math.max(0,t.flash-dt);
  const sight=rawRay(t.x,t.y,target);
  if(dist<9&&Math.abs(da)<.22&&sight.d>=dist-.25&&t.cooldown<=0){
   t.cooldown=1.35+Math.random()*.6;t.flash=.16;health-=20;damageFlash=.75;say('TURRET HIT — HEALTH '+Math.max(0,health)+'%');
   if(health<=0){say('SUBJECT TERMINATED — RESTARTING CHAMBER');resetRoom();running=true;status.textContent='TEST IN PROGRESS';break;}
  }
 }
 damageFlash=Math.max(0,damageFlash-dt);
}
function drawTurrets(){
 for(const t of turrets){
  if(!t.alive)continue;
  const dx=t.x-player.x,dy=t.y-player.y,dist=Math.hypot(dx,dy),rel=Math.atan2(Math.sin(Math.atan2(dy,dx)-player.a),Math.cos(Math.atan2(dy,dx)-player.a));
  if(dist<.2||Math.abs(rel)>FOV*.65)continue;
  const sx=(.5+rel/FOV)*W,col=Math.max(0,Math.min(W-1,Math.floor(sx)));if(dist>depth[col]+.15)continue;
  const size=Math.min(130,H/dist*.48),cy=H/2+size*.12;
  ctx.save();ctx.translate(sx,cy);ctx.fillStyle='#1b2228';ctx.strokeStyle='#ff4b50';ctx.lineWidth=3;ctx.shadowColor='#ff2028';ctx.shadowBlur=12;
  ctx.beginPath();ctx.moveTo(-size*.42,-size*.15);ctx.lineTo(-size*.34,-size*.62);ctx.lineTo(size*.34,-size*.62);ctx.lineTo(size*.42,-size*.15);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#4b555d';ctx.fillRect(-size*.22,-size*.58,size*.44,size*.42);ctx.fillStyle=t.flash>0?'#fff':'#ff3038';ctx.beginPath();ctx.arc(0,-size*.39,size*.095,0,Math.PI*2);ctx.fill();ctx.fillStyle='#171c21';ctx.fillRect(-size*.09,-size*.12,size*.18,size*.4);ctx.shadowBlur=0;ctx.restore();
  if(t.flash>0){ctx.save();ctx.strokeStyle='#ff4148';ctx.lineWidth=3;ctx.globalAlpha=Math.min(1,t.flash*7);ctx.beginPath();ctx.moveTo(sx,cy-size*.35);ctx.lineTo(W/2,H*.55);ctx.stroke();ctx.restore();}
 }
}

function draw(){
 const sky=ctx.createLinearGradient(0,0,0,H/2);sky.addColorStop(0,'#141b25');sky.addColorStop(1,'#596570');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H/2);
 const floor=ctx.createLinearGradient(0,H/2,0,H);floor.addColorStop(0,'#485057');floor.addColorStop(1,'#11161b');ctx.fillStyle=floor;ctx.fillRect(0,H/2,W,H/2);
 for(let x=0;x<W;x++){
  const a=player.a+(x/W-.5)*FOV,h=ray(player.x,player.y,a),dist=Math.max(.02,h.d*Math.cos(a-player.a));depth[x]=dist;
  const hh=Math.min(H*1.8,H/dist),top=(H-hh)/2,shade=Math.max(25,210-dist*13-(h.side?35:0));
  ctx.fillStyle=h.side?'rgb('+Math.floor(shade*.62)+','+Math.floor(shade*.7)+','+Math.floor(shade*.74)+')':'rgb('+shade+','+Math.floor(shade*.94)+','+Math.floor(shade*.9)+')';
  ctx.fillRect(x,top,1,hh);
  if(x%9===0){ctx.fillStyle='rgba(5,10,14,.15)';ctx.fillRect(x,top,1,hh)}
 }
 drawPortalFrame(blue);drawPortalFrame(orange);drawExit();drawTurrets();drawDevice();
 if(damageFlash>0){ctx.fillStyle='rgba(255,30,35,'+Math.min(.32,damageFlash*.32)+')';ctx.fillRect(0,0,W,H);}
 ctx.strokeStyle='#eafaff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W/2-8,H/2);ctx.lineTo(W/2+8,H/2);ctx.moveTo(W/2,H/2-8);ctx.lineTo(W/2,H/2+8);ctx.stroke();
}
function drawPortalFrame(p){
 if(!p)return;
 const vx=p.x-player.x,vy=p.y-player.y,dist=Math.hypot(vx,vy),rel=Math.atan2(Math.sin(Math.atan2(vy,vx)-player.a),Math.cos(Math.atan2(vy,vx)-player.a));
 if(dist<.12||Math.abs(rel)>FOV*.68||frontDot(p,player.x,player.y)<=.01)return;
 const sx=(.5+rel/FOV)*W,col=Math.max(0,Math.min(W-1,Math.floor(sx)));
 if(depth[col]<dist-.25)return;
 // A tall, narrow portal with fully rounded ends, like the original Portal games.
 const scale=(W/(2*Math.tan(FOV/2)))/dist*Math.max(.22,Math.abs(Math.cos(rel)));
 const pw=Math.min(W*.25,PORTAL_WIDTH*scale),ph=Math.min(H*.94,H*1.12/dist),cy=H*.5;
 ctx.save();
 ctx.shadowColor=p.color==='blue'?'#00bfff':'#ff8c28';ctx.shadowBlur=24;
 ctx.strokeStyle=p.color==='blue'?'#40ddff':'#ffad50';ctx.lineWidth=Math.max(3,Math.min(8,8/dist));
 ctx.beginPath();ctx.ellipse(sx,cy,pw*.5,ph*.5,0,0,Math.PI*2);ctx.stroke();
 ctx.shadowBlur=0;ctx.globalAlpha=.32;ctx.fillStyle=p.color==='blue'?'#00bfff':'#ff8c28';
 ctx.beginPath();ctx.ellipse(sx,cy,pw*.47,ph*.48,0,0,Math.PI*2);ctx.fill();
 // Dark inner opening gives the oval a clear portal silhouette.
 ctx.globalAlpha=.88;ctx.fillStyle='#071018';
 ctx.beginPath();ctx.ellipse(sx,cy,pw*.39,ph*.43,0,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=.9;ctx.strokeStyle=p.color==='blue'?'#9bf0ff':'#ffd1a0';ctx.lineWidth=Math.max(1,Math.min(3,3/dist));
 ctx.beginPath();ctx.ellipse(sx,cy,pw*.42,ph*.45,0,0,Math.PI*2);ctx.stroke();
 ctx.restore();
}
function drawExit(){
 const dx=exitPoint.x-player.x,dy=exitPoint.y-player.y,dist=Math.hypot(dx,dy),rel=Math.atan2(Math.sin(Math.atan2(dy,dx)-player.a),Math.cos(Math.atan2(dy,dx)-player.a));
 if(Math.abs(rel)>FOV*.65||dist<.2)return;const sx=(.5+rel/FOV)*W,col=Math.max(0,Math.min(W-1,Math.floor(sx)));if(dist>depth[col]+.25)return;
 const h=Math.min(H*.8,H/dist*.62);ctx.save();ctx.fillStyle='#35ffab';ctx.shadowColor='#35ffab';ctx.shadowBlur=22;ctx.fillRect(sx-h*.12,H/2-h*.48,h*.24,h*.9);ctx.shadowBlur=0;ctx.fillStyle='#d9ffea';ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillText('EXIT',sx,H/2-h*.56);ctx.restore();
}
function drawDevice(){
 ctx.fillStyle='#111a20';ctx.beginPath();ctx.moveTo(W*.38,H);ctx.lineTo(W*.43,H*.82);ctx.lineTo(W*.57,H*.82);ctx.lineTo(W*.62,H);ctx.fill();
 ctx.fillStyle='#607681';ctx.fillRect(W*.445,H*.8,W*.11,H*.2);ctx.fillStyle='#b8d3db';ctx.fillRect(W*.475,H*.73,W*.05,H*.09);
 ctx.fillStyle='#18242b';ctx.fillRect(W*.49,H*.68,W*.02,H*.08);ctx.fillStyle=blue?'#29cfff':'#14738a';ctx.fillRect(W*.465,H*.77,W*.025,H*.025);ctx.fillStyle=orange?'#ff9d3e':'#87511f';ctx.fillRect(W*.51,H*.77,W*.025,H*.025);
}
function start(){if(running)return;running=true;paused=false;overlay.classList.remove('visible');status.textContent='TEST IN PROGRESS';canvas.requestPointerLock?.();say('WASD move · mouse look · left blue · right orange')}
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
 if(e.button===0){if(!running){start();return}if(!paused){canvas.requestPointerLock?.();placePortal('blue')}}
 if(e.button===2){if(!running){start();return}if(!paused)placePortal('orange')}
});
document.addEventListener('mousemove',e=>{if(running&&!paused&&document.pointerLockElement===canvas)player.a+=e.movementX*.0025});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&running&&!paused)say('Click the chamber to recapture mouse look.')});
document.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys[k]=true;if(e.repeat)return;
 if(k==='q')placePortal('blue');if(k==='e')placePortal('orange');
 if((k==='escape'||k==='p')&&running){paused=!paused;overlay.classList.toggle('visible',paused);status.textContent=paused?'PAUSED':'TEST IN PROGRESS';if(paused)document.exitPointerLock?.();else canvas.requestPointerLock?.()}
 if(k==='r'){running=true;resetRoom();status.textContent='TEST IN PROGRESS';canvas.requestPointerLock?.()}
});
document.addEventListener('keyup',e=>delete keys[e.key.toLowerCase()]);
$('startBtn').addEventListener('click',start);
$('resumeBtn').addEventListener('click',()=>{paused=false;overlay.classList.remove('visible');canvas.requestPointerLock?.();status.textContent='TEST IN PROGRESS'});
$('restartBtn').addEventListener('click',()=>{resetRoom();running=true;status.textContent='TEST IN PROGRESS';canvas.requestPointerLock?.()});
$('nextBtn').addEventListener('click',()=>{if(level<maps.length-1&&completed[level]){level++;resetRoom();running=true;status.textContent='TEST IN PROGRESS';canvas.requestPointerLock?.()}else if(level===maps.length-1&&completed[level]){say('ALL TEST CHAMBERS COMPLETE');}});
function loop(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;step(dt);draw();requestAnimationFrame(loop)}
resetRoom();requestAnimationFrame(loop);
})();