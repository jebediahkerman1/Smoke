(()=>{'use strict';
const canvas=document.getElementById('world'),ctx=canvas.getContext('2d'),$=id=>document.getElementById(id);
const W=canvas.width,H=canvas.height,MAP=24,TW=38,TH=20,BH=18;
const types=['grass','dirt','stone','wood','leaves','water','sand','glass','planks'];
const colors={grass:'#70c64f',dirt:'#95613e',stone:'#8d9a9c',wood:'#b78149',leaves:'#448e47',sand:'#d7c077',glass:'#91e3ec',planks:'#bd8b55',water:'#4b9fd0'};
const SAVE='smokeblocks-world-v1',LEGACY_SAVE='smokecraft-blocklands-v1';
let blocks=[],terrainHeight=[],player={x:12.5,y:12.5,facingX:0,facingY:-1},inventory={grass:12,dirt:18,stone:16,wood:8,leaves:8,water:8,sand:8,glass:4,planks:4},selected=0,mode='mine',mined=0,placed=0,elapsed=0,clockTime=8,toastTimer=0,keys={},last=0,particles=[],walkTime=0,worldSeed=73129,autosaveAt=0;
function hash(x,y){const n=Math.sin(x*127.1+y*311.7+worldSeed*.013)*43758.5453;return n-Math.floor(n)}
function groundType(h,x,y){return h<=1?'sand':'grass'}
function generateWorld(){
 blocks=Array.from({length:MAP},()=>Array(MAP));terrainHeight=Array.from({length:MAP},()=>Array(MAP).fill(1));
 for(let x=0;x<MAP;x++)for(let y=0;y<MAP;y++){
  let h=2+Math.round(Math.sin(x*.46)*.8+Math.cos(y*.37)*.7+Math.sin((x+y)*.22)*.6+(hash(x,y)-.5)*1.0);
  h=Math.max(1,Math.min(4,h));terrainHeight[x][y]=h;
  const stack=[];for(let z=0;z<h;z++)stack.push({type:z===h-1?groundType(h,x,y):(z<h-2?'stone':'dirt')});
  const pondOne=((x-6.1)/3.6)**2+((y-8.3)/2.5)**2<1;
  const pondTwo=((x-17.2)/2.5)**2+((y-16.5)/2.1)**2<1;
  if(h<=2&&(pondOne||pondTwo||hash(x+7,y+19)>.91)){
   stack[stack.length-1].type='sand';stack.push({type:'water'});
  }
  blocks[x][y]=stack;
 }
 // A handful of original, block-built trees around a clear spawn meadow.
 for(let x=3;x<MAP-3;x++)for(let y=3;y<MAP-3;y++){
  if(Math.abs(x-12)<3&&Math.abs(y-12)<3)continue;
  if(hash(x*3+11,y*5+9)>.936&&blocks[x][y].at(-1).type!=='water'){
   const treeH=2+(hash(x+81,y+44)>.55?1:0);
   for(let z=0;z<treeH;z++)blocks[x][y].push({type:'wood'});
   for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){
    const tx=x+dx,ty=y+dy,distance=Math.abs(dx)+Math.abs(dy);
    if(tx<1||ty<1||tx>=MAP-1||ty>=MAP-1||distance>3||(dx===0&&dy===0))continue;
    if(blocks[tx][ty].length!==terrainHeight[tx][ty]||blocks[tx][ty].at(-1).type==='water')continue;
    const layers=distance<=1?2:1;for(let z=0;z<layers;z++)blocks[tx][ty].push({type:'leaves'});
   }
  }
 }
}
function isWater(x,y){return !!blocks[x]?.[y]&&blocks[x][y].at(-1)?.type==='water'}
function groundLevel(x,y){return terrainHeight[x]?.[y]||1}
function isBlocked(x,y){if(x<1||y<1||x>=MAP-1||y>=MAP-1)return true;if(isWater(x,y))return true;return blocks[x][y].length>terrainHeight[x][y]}
function saveWorld(showMessage=true){
 try{localStorage.setItem(SAVE,JSON.stringify({blocks,terrainHeight,player,inventory,mined,placed,worldSeed,elapsed,clockTime}));if(showMessage)notify('WORLD SAVED TO THIS BROWSER');$('worldStatus').textContent='WORLD SAVED'}
 catch{$('worldStatus').textContent='SAVE ERROR';if(showMessage)notify('SAVE UNAVAILABLE — CHECK BROWSER STORAGE')}
}
function loadWorld(){
 try{
  const s=JSON.parse(localStorage.getItem(SAVE)||localStorage.getItem(LEGACY_SAVE)||'null');
  if(!s||!Array.isArray(s.blocks)||s.blocks.length!==MAP||!Array.isArray(s.terrainHeight)||s.terrainHeight.length!==MAP)return false;
  blocks=s.blocks;terrainHeight=s.terrainHeight;
  if(blocks.some(col=>!Array.isArray(col)||col.length!==MAP||col.some(stack=>!Array.isArray(stack)||!stack.length||stack.some(b=>!b||!colors[b.type]))))return false;
  if(terrainHeight.some(col=>!Array.isArray(col)||col.length!==MAP))return false;
  player=s.player||player;inventory=Object.assign(inventory,s.inventory||{});mined=Number(s.mined)||0;placed=Number(s.placed)||0;worldSeed=Number(s.worldSeed)||worldSeed;elapsed=Number(s.elapsed)||0;clockTime=Number(s.clockTime)||8;
  player.x=Math.max(1.1,Math.min(MAP-1.1,Number(player.x)||12.5));player.y=Math.max(1.1,Math.min(MAP-1.1,Number(player.y)||12.5));
  return true;
 }catch{return false}
}
function newWorld(){
 worldSeed=Math.floor(Math.random()*900000)+10000;generateWorld();player={x:12.5,y:12.5,facingX:0,facingY:-1};
 inventory={grass:12,dirt:18,stone:16,wood:8,leaves:8,water:8,sand:8,glass:4,planks:4};mined=0;placed=0;elapsed=0;clockTime=8;particles=[];saveWorld(false);render();updateUi();notify('NEW SMOKEBLOCKS WORLD GENERATED');
}
function notify(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1900)}
function project(cx,cy,z){
 const px=Math.floor(player.x)+.5,py=Math.floor(player.y)+.5,pz=groundLevel(Math.floor(player.x),Math.floor(player.y));
 return {x:W/2+((cx-cy)-(px-py))*TW/2,y:H*.72+((cx+cy)-(px+py))*TH/2-(z-pz)*BH};
}
function shade(hex,amount){
 const n=parseInt(hex.slice(1),16),r=Math.max(0,Math.min(255,(n>>16)+amount)),g=Math.max(0,Math.min(255,((n>>8)&255)+amount)),b=Math.max(0,Math.min(255,(n&255)+amount));
 return '#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
}
function polygon(points,color,stroke){
 ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}
}
function drawCubeFace(points,type,light){const c=colors[type]||colors.grass;polygon(points,shade(c,light),'rgba(14,35,24,.22)')}
function drawColumn(x,y){
 const stack=blocks[x][y],n=stack.length;
 for(let z=0;z<n;z++){
  const type=stack[z].type,top=z===n-1,center=project(x+.5,y+.5,z+1);
  const e={x:center.x+TW/2,y:center.y},s={x:center.x,y:center.y+TH/2},w={x:center.x-TW/2,y:center.y};
  const eb={x:e.x,y:e.y+BH},sb={x:s.x,y:s.y+BH},wb={x:w.x,y:w.y+BH};
  const nx=blocks[x+1]?.[y]?.length||0,ny=blocks[x]?.[y+1]?.length||0;
  if(nx<=z)drawCubeFace([e,s,sb,eb],type,-32);
  if(ny<=z)drawCubeFace([w,s,sb,wb],type,-49);
  if(top){
   const t={x:center.x,y:center.y-TH/2},r={x:center.x+TW/2,y:center.y},b={x:center.x,y:center.y+TH/2},l={x:center.x-TW/2,y:center.y};
   polygon([t,r,b,l],colors[type]||colors.grass,'rgba(15,36,24,.34)');
   if(type==='grass'){ctx.strokeStyle='#9be879';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(t.x-7,t.y+3);ctx.lineTo(t.x-1,t.y+6);ctx.lineTo(t.x+5,t.y+2);ctx.stroke()}
   else if(type==='water'){ctx.strokeStyle='rgba(211,250,255,.62)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(center.x-8,center.y-2);ctx.lineTo(center.x,center.y-4);ctx.lineTo(center.x+7,center.y-1);ctx.stroke()}
   else if(type==='glass'){ctx.strokeStyle='rgba(225,255,255,.85)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(t.x+4,t.y+3);ctx.lineTo(b.x-4,b.y-3);ctx.stroke()}
  }
 }
}
function drawCharacter(){
 const x=player.x,y=player.y,z=groundLevel(Math.floor(x),Math.floor(y)),base=project(x,y,z);
 const moving=!!(keys.w||keys.a||keys.s||keys.d||keys.arrowup||keys.arrowdown||keys.arrowleft||keys.arrowright);
 const step=moving?Math.sin(walkTime*(keys.shift?1.5:1))*5:0;
 ctx.save();ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(base.x,base.y+3,13,7,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#253c45';ctx.fillRect(base.x-10+step*.2,base.y-20,9,19);ctx.fillRect(base.x+1-step*.2,base.y-20,9,19);
 ctx.fillStyle='#e1c4a0';ctx.fillRect(base.x-12+step*.2,base.y-8,12,8);ctx.fillRect(base.x+1-step*.2,base.y-8,12,8);
 ctx.fillStyle='#3e94df';ctx.fillRect(base.x-13,base.y-45,26,27);ctx.fillStyle='#2569a6';ctx.fillRect(base.x+2,base.y-45,11,27);
 ctx.fillStyle='#e1c4a0';ctx.fillRect(base.x-18-step*.25,base.y-43,7,23);ctx.fillRect(base.x+11+step*.25,base.y-43,7,23);
 ctx.fillStyle='#d8b28d';ctx.fillRect(base.x-11,base.y-62,22,19);ctx.fillStyle='#523a2d';ctx.fillRect(base.x-12,base.y-65,24,6);ctx.fillRect(base.x-12,base.y-60,5,5);
 ctx.fillStyle='#202b32';ctx.fillRect(base.x-7,base.y-55,3,3);ctx.fillRect(base.x+4,base.y-55,3,3);
 ctx.fillStyle='#d9f4bc';ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.fillText('S',base.x,base.y-31);ctx.restore();
}
function drawCloud(x,y,scale){ctx.fillStyle='rgba(248,255,237,.22)';ctx.fillRect(x,y,42*scale,10*scale);ctx.fillRect(x+8*scale,y-7*scale,17*scale,9*scale);ctx.fillRect(x+23*scale,y-4*scale,16*scale,7*scale)}
function drawBackground(){
 const phase=(elapsed%240)/240,night=phase>.72||phase<.12,sky=ctx.createLinearGradient(0,0,0,H);
 sky.addColorStop(0,night?'#203954':'#73becd');sky.addColorStop(.62,night?'#6c9aa0':'#b4e0b8');sky.addColorStop(1,'#c6df9d');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 ctx.fillStyle=night?'#e8edcb':'#ffe49b';ctx.fillRect(night?W-130:W-185,night?70:64,night?25:38,night?25:38);
 if(night){ctx.fillStyle='#e3efd7';for(let i=0;i<38;i++)ctx.fillRect(hash(i,12)*W,hash(i,39)*150,2,2)}
 drawCloud((elapsed*5)%(W+120)-80,70,.9);drawCloud((elapsed*3+370)%(W+160)-90,125,.65);
 ctx.fillStyle=night?'#34516a':'#6da979';ctx.beginPath();ctx.moveTo(0,H*.44);for(let x=0;x<=W;x+=80)ctx.lineTo(x,H*.35+Math.sin(x*.012)*35+Math.cos(x*.027)*15);ctx.lineTo(W,H*.58);ctx.lineTo(0,H*.58);ctx.closePath();ctx.fill();
}
function drawParticles(dt){
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vy+=45*dt;ctx.globalAlpha=Math.max(0,p.life/.55);ctx.fillStyle=colors[p.type]||'#d6e8cf';ctx.fillRect(p.x,p.y,4,4)}
 ctx.globalAlpha=1;particles=particles.filter(p=>p.life>0);
}
function render(dt=0){
 drawBackground();const items=[];
 for(let x=0;x<MAP;x++)for(let y=0;y<MAP;y++)items.push({x,y,depth:x+y,kind:'block'});
 items.push({x:player.x,y:player.y,depth:player.x+player.y,kind:'player'});
 items.sort((a,b)=>a.depth-b.depth||(a.x-b.x));
 for(const it of items){if(it.kind==='player')drawCharacter();else drawColumn(it.x,it.y)}
 drawParticles(dt);const gr=ctx.createRadialGradient(W/2,H*.5,100,W/2,H*.5,W*.65);gr.addColorStop(0,'rgba(6,17,10,0)');gr.addColorStop(1,'rgba(6,17,10,.22)');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
}
function updateUi(){
 document.querySelectorAll('.slot').forEach((el,i)=>{const type=types[i];el.classList.toggle('active',i===selected);el.querySelector('b').textContent=inventory[type]||0});
 $('selectedLabel').textContent='Selected: '+types[selected][0].toUpperCase()+types[selected].slice(1)+' · '+mode.toUpperCase()+' MODE';
 $('minedCount').textContent=mined;$('placedCount').textContent=placed;$('coords').textContent='X '+Math.floor(player.x)+' · Y '+Math.floor(player.y);
 const day=Math.floor(elapsed/240)+1,clock=(clockTime+elapsed/10)%24;
 $('worldClock').textContent='DAY '+day+' · '+String(Math.floor(clock)).padStart(2,'0')+':'+String(Math.floor((clock%1)*60)).padStart(2,'0');
 $('buildMode').textContent='MODE: '+mode.toUpperCase()+' · TAP TO SWITCH';
}
function spawnParticles(x,y,type){for(let i=0;i<8;i++)particles.push({x,y,vx:(Math.random()-.5)*85,vy:-Math.random()*75-10,life:.3+Math.random()*.25,type})}
function tileUnderPointer(e){
 const rect=canvas.getBoundingClientRect(),sx=(e.clientX-rect.left)*W/rect.width,sy=(e.clientY-rect.top)*H/rect.height;let found=null,best=Infinity;
 for(let x=0;x<MAP;x++)for(let y=0;y<MAP;y++){
  const z=blocks[x][y].length,p=project(x+.5,y+.5,z),dx=Math.abs(sx-p.x)/(TW*.5),dy=Math.abs(sy-p.y)/(TH*.5),score=dx+dy;
  if(score<=1.08&&score<best){best=score;found={x,y,sx,sy,p}}
 }
 return found;
}
function mineTile(tile){
 if(!tile)return;const {x,y}=tile,stack=blocks[x][y];if(!stack?.length)return;
 if(x===Math.floor(player.x)&&y===Math.floor(player.y)&&stack.length<=terrainHeight[x][y]){notify('You need the ground beneath your feet.');return}
 const top=stack.at(-1);
 if(top.type==='water'){
  if(stack.length>terrainHeight[x][y])stack.pop();else stack[stack.length-1]={type:'sand'};
  inventory.water=(inventory.water||0)+1;mined++;spawnParticles(tile.p.x,tile.p.y,'water');notify('Collected water block');updateUi();saveWorld(false);return;
 }
 if(stack.length>terrainHeight[x][y])stack.pop();
 else if(terrainHeight[x][y]>1){stack.pop();terrainHeight[x][y]--}
 else {const old=stack[0].type;stack[0]={type:old==='grass'?'dirt':old==='dirt'?'stone':'grass'};inventory[old]=(inventory[old]||0)+1;mined++;spawnParticles(tile.p.x,tile.p.y,old);updateUi();saveWorld(false);return}
 inventory[top.type]=(inventory[top.type]||0)+1;mined++;spawnParticles(tile.p.x,tile.p.y,top.type);notify('+'+top.type.toUpperCase()+' BLOCK');updateUi();saveWorld(false);
}
function placeTile(tile){
 if(!tile)return;const {x,y}=tile,stack=blocks[x][y],type=types[selected];
 if((isWater(x,y)&&type!=='water')||(x===Math.floor(player.x)&&y===Math.floor(player.y))){notify('That spot is flooded or under your feet.');return}
 if(type==='water'&&isWater(x,y)){notify('That tile is already water.');return}
 if((inventory[type]||0)<1){notify('No '+type+' blocks left in your hotbar.');return}
 if(stack.length>=9){notify('Build limit reached for this tile.');return}
 stack.push({type});inventory[type]--;placed++;spawnParticles(tile.p.x,tile.p.y,type);notify('PLACED '+type.toUpperCase());updateUi();saveWorld(false);
}
function interact(e){e.preventDefault();const tile=tileUnderPointer(e);if(!tile)return;const wantsPlace=mode==='build'||e.button===2||e.shiftKey;if(wantsPlace)placeTile(tile);else mineTile(tile);render()}
function movePlayer(dt){
 let dx=0,dy=0;if(keys.w||keys.arrowup)dy-=1;if(keys.s||keys.arrowdown)dy+=1;if(keys.a||keys.arrowleft)dx-=1;if(keys.d||keys.arrowright)dx+=1;
 if(!dx&&!dy)return;const m=Math.hypot(dx,dy);dx/=m;dy/=m;const speed=(keys.shift?5.6:3.5)*dt;
 const tx=Math.max(1.1,Math.min(MAP-1.1,player.x+dx*speed)),ty=Math.max(1.1,Math.min(MAP-1.1,player.y+dy*speed));
 if(!isBlocked(Math.floor(tx),Math.floor(player.y)))player.x=tx;
 if(!isBlocked(Math.floor(player.x),Math.floor(ty)))player.y=ty;
 player.facingX=dx;player.facingY=dy;walkTime+=dt*(keys.shift?12:8);
}
function loop(t){
 const dt=Math.min(.04,(t-last)/1000||0);last=t;movePlayer(dt);elapsed+=dt;autosaveAt+=dt;
 if(autosaveAt>12){autosaveAt=0;saveWorld(false)}
 render(dt);updateUi();requestAnimationFrame(loop);
}
canvas.addEventListener('contextmenu',interact);
canvas.addEventListener('pointerdown',e=>{if(e.button===0)interact(e)});
document.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
 if(k>='1'&&k<='9'){selected=Number(k)-1;updateUi()}
 if(k==='m'){mode=mode==='mine'?'build':'mine';updateUi()}
 if(k==='shift')keys.shift=true;
 if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k))keys[k]=true;
});
document.addEventListener('keyup',e=>delete keys[e.key.toLowerCase()]);
document.querySelectorAll('.slot').forEach((el,i)=>el.addEventListener('click',()=>{selected=i;updateUi()}));
$('buildMode').addEventListener('click',()=>{mode=mode==='mine'?'build':'mine';updateUi();notify(mode==='build'?'BUILD MODE — TAP A TILE TO PLACE':'MINE MODE — TAP A BLOCK TO COLLECT')});
$('craftPlanks').addEventListener('click',()=>{if((inventory.wood||0)<3){notify('You need 3 wood blocks to craft planks.');return}inventory.wood-=3;inventory.planks=(inventory.planks||0)+6;notify('CRAFTED 6 PLANK BLOCKS');updateUi();saveWorld(false)});
$('saveWorld').addEventListener('click',()=>saveWorld(true));
$('newWorld').addEventListener('click',()=>{if(confirm('Start a new Smokeblocks world? Your saved world will be replaced.'))newWorld()});
generateWorld();loadWorld();saveWorld(false);updateUi();render();requestAnimationFrame(loop);
})();