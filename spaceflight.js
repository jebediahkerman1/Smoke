(() => {
'use strict';
const $ = id => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const STORAGE_PARTS = 'smokeSpaceCustomParts';
const STORAGE_FLAGS = 'smokeSpaceFlags';
const bodies = [
 {name:'Earth',kind:'Homeworld',color:'#58b65c',gravity:9.8,radius:6371,orbit:1},
 {name:'Nysa',kind:'Ocean moon',color:'#48a8d8',gravity:3.1,radius:1737,orbit:2},
 {name:'Pip',kind:'Moon',color:'#aeb6c4',gravity:1.6,radius:950,orbit:3},
 {name:'Bront',kind:'Desert planet',color:'#c87851',gravity:4.1,radius:4100,orbit:4},
 {name:'Ilyra',kind:'Ice planet',color:'#82d9e8',gravity:6.3,radius:5600,orbit:5}
];
const parts = [
 {id:'capsule',name:'Command Capsule',type:'capsule',mass:800,fuel:0,thrust:0,icon:'◈',color:'#d4e0e9'},
 {id:'tank',name:'Small Fuel Tank',type:'tank',mass:180,fuel:120,thrust:0,icon:'▤',color:'#91a6b7'},
 {id:'engine',name:'Pioneer Engine',type:'engine',mass:250,fuel:0,thrust:420,icon:'♨',color:'#e28b54'},
 {id:'booster',name:'Solid Booster',type:'booster',mass:400,fuel:180,thrust:700,icon:'✹',color:'#cf7052'},
 {id:'solar',name:'Solar Panel',type:'solar',mass:35,fuel:0,thrust:0,icon:'▦',color:'#448bd2'},
 {id:'legs',name:'Landing Legs',type:'legs',mass:90,fuel:0,thrust:0,icon:'⌁',color:'#b5c1cb'}
];
let custom = readJSON(STORAGE_PARTS, []);
let flags = readJSON(STORAGE_FLAGS, {});
let stack = [makePart(parts[0]),makePart(parts[1]),makePart(parts[2])];
let nextId = 4, selectedBody = 1, mode = 'build', launched = false, paused = false, crashed = false, landed = false;
let altitude=0, verticalSpeed=0, horizontalSpeed=0, angle=0, fuel=0, simTime=0, stageNo=0, worldX=0, worldY=0;
let keys = new Set(), lastTime=0, message='Ready to build. Add parts, then launch.';
function readJSON(key,fallback){try{const x=JSON.parse(localStorage.getItem(key)||'null');return x==null?fallback:x}catch(e){return fallback}}
function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){setMessage('Browser storage is unavailable. Changes may not persist.')}}
function makePart(p){return {...p,uid:nextId++}}
function body(){return bodies[selectedBody]}
function totalMass(){return stack.reduce((n,p)=>n+(+p.mass||0),0)+fuel}
function thrust(){return stack.reduce((n,p)=>n+((p.type==='engine'||p.type==='booster')?(+p.thrust||0):0),0)}
function setMessage(s){message=s;$('notice').textContent=s}
function format(n){return Math.round(n).toLocaleString('en-US')}
function drawCatalog(){
 const el=$('partCatalog');el.innerHTML='';
 parts.concat(custom).forEach(p=>{
  const b=document.createElement('button');b.className='part';
  b.innerHTML='<span class="partIcon"></span><span class="partCopy"><b></b><small></small></span><span class="plus">+</span>';
  b.querySelector('.partIcon').textContent=p.icon||'◆';b.querySelector('b').textContent=p.name;
  b.querySelector('small').textContent=p.type.toUpperCase()+' · '+p.mass+' kg'+(p.thrust?' · '+p.thrust+' kN':'');
  b.addEventListener('click',()=>{if(launched){setMessage('Recover the rocket before changing its design.');return}stack.push(makePart(p));renderStack();setMessage(p.name+' added to the rocket.')});
  el.appendChild(b);
 });
 renderCustom();
}
function renderStack(){
 const el=$('rocketStack');el.innerHTML='';
 stack.slice().reverse().forEach((p,rev)=>{
  const index=stack.length-1-rev,row=document.createElement('div');row.className='stackItem';
  const label=document.createElement('span');label.className='stackName';label.textContent=String(index+1).padStart(2,'0')+'  '+(p.icon||'◆')+' '+p.name;
  const remove=document.createElement('button');remove.className='removePart';remove.textContent='×';remove.title='Remove '+p.name;
  remove.addEventListener('click',()=>{if(launched)return;stack.splice(index,1);renderStack();setMessage(p.name+' removed.')});
  row.append(label,remove);el.appendChild(row);
 });
 $('partCount').textContent=stack.length+' PARTS';
 $('launchBtn').disabled=launched;
 updateStats();
}
function renderCustom(){
 const el=$('customList');el.innerHTML='';
 custom.forEach((p,i)=>{const row=document.createElement('div');row.className='customItem';const name=document.createElement('span');name.textContent=p.icon+' '+p.name+' · '+p.mass+' kg';const del=document.createElement('button');del.className='btn danger';del.textContent='Delete';del.addEventListener('click',()=>{custom.splice(i,1);writeJSON(STORAGE_PARTS,custom);drawCatalog()});row.append(name,del);el.appendChild(row)});
}
function updateStats(){
 const dry=stack.reduce((n,p)=>n+(+p.mass||0),0);
 $('statMass').textContent=format(dry)+' kg';$('statFuel').textContent=format(fuel||stack.reduce((n,p)=>n+(+p.fuel||0),0))+' kg';
 $('statThrust').textContent=format(thrust())+' kN';$('statTwr').textContent=(dry?thrust()*1000/(dry*body().gravity):0).toFixed(2);
 $('hudAlt').textContent='ALT '+format(altitude)+' m';$('hudSpeed').textContent='SPD '+format(Math.hypot(verticalSpeed,horizontalSpeed))+' m/s';
 $('hudFuel').textContent='FUEL '+format(fuel)+' kg';$('hudMode').textContent=mode==='map'?'SYSTEM MAP':mode==='stats'?'VEHICLE DATA':launched?'FLIGHT':'BUILD';
 $('modePill').textContent=paused?'PAUSED':crashed?'MISSION FAILED':landed?'LANDED':mode==='map'?'SYSTEM MAP':mode==='stats'?'VEHICLE DATA':launched?'FLIGHT MODE':'WORKSHOP MODE';
 $('metricAlt').textContent=format(altitude)+' m';$('metricV').textContent=format(verticalSpeed)+' m/s';$('metricH').textContent=format(horizontalSpeed)+' m/s';$('metricFuel').textContent=format(fuel)+' kg';
 $('metricApo').textContent=(Math.max(0,altitude+verticalSpeed*Math.abs(verticalSpeed)/(2*body().gravity))/1000).toFixed(1)+' km';
 $('metricPeri').textContent=(Math.max(0,altitude-Math.max(0,verticalSpeed*verticalSpeed/(2*body().gravity)))/1000).toFixed(1)+' km';
 $('pauseBtn').textContent=paused?'▶ Resume':'Ⅱ Pause';
 $('plantFlagBtn').disabled=!landed||crashed;
}
function renderBodySelect(){
 const sel=$('planetSelect');sel.innerHTML='';
 bodies.forEach((b,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=b.name+' — '+b.kind;sel.appendChild(o)});
 sel.value=String(selectedBody);$('bodyInfo').textContent=body().name+' · gravity '+body().gravity+' m/s² · '+body().kind;
 renderStarChart();updateStats();
}
function renderStarChart(){
 const el=$('starChart');el.innerHTML='';
 const title=document.createElement('h3');title.textContent='EMBER SYSTEM';title.style.color='#ffb65c';el.appendChild(title);
 bodies.forEach((b,i)=>{const row=document.createElement('div');row.className='planetRow';const dot=document.createElement('span');dot.className='planetDot';dot.style.background=b.color;const name=document.createElement('span');name.textContent=b.name+' · '+b.kind;if(i===selectedBody){name.className='selectedPlanet'}if(flags[b.name]){const flag=document.createElement('span');flag.textContent=' ⚑';flag.style.color='#ffcf4a';name.appendChild(flag)}row.append(dot,name);el.appendChild(row)});
}
function switchMode(next){
 if(next==='flight')next='build';
 if(!['build','map','stats'].includes(next))next='build';
 mode=next;
 document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
 $('statsPanel').classList.toggle('hidden',mode!=='stats');
 $('mapExit').classList.toggle('hidden',mode!=='map');
 $('game').classList.toggle('mapCanvas',mode==='map');
 $('controlText').textContent=mode==='map'?'SYSTEM MAP · M or Esc returns to flight.':mode==='stats'?'LIVE VEHICLE DATA · M opens the system map.':'W / ↑ thrust · A / D steer · S / ↓ retro-thrust · SPACE stage · M map · R reset';
 updateStats();draw();
}
function resetFlight(){
 launched=false;paused=false;crashed=false;landed=false;altitude=0;verticalSpeed=0;horizontalSpeed=0;angle=0;simTime=0;stageNo=0;worldX=0;worldY=0;keys.clear();
 fuel=stack.reduce((n,p)=>n+(+p.fuel||0),0);switchMode('build');renderStack();setMessage('Rocket reset on '+body().name+'. Ready for launch.');
}
function launch(){
 if(launched)return;
 if(!stack.some(p=>(p.type==='engine'||p.type==='booster')&&+p.thrust>0)||!stack.some(p=>+p.fuel>0)){setMessage('Add an engine or booster AND a fuel tank before launching.');return}
 launched=true;paused=false;crashed=false;landed=false;altitude=0;verticalSpeed=0;horizontalSpeed=0;angle=0;simTime=0;stageNo=0;fuel=stack.reduce((n,p)=>n+(+p.fuel||0),0);switchMode('flight');setMessage('Launch ready. Hold W or ↑ to ignite the engine.');
}
function stage(){
 if(!launched){setMessage('Launch first before staging.');return}
 let i=-1;for(let j=stack.length-1;j>=0;j--){if(stack[j].type==='booster'||stack[j].type==='tank'){i=j;break}}
 if(i<0){setMessage('No detachable booster or tank left.');return}
 const p=stack.splice(i,1)[0];if(p.type==='tank')fuel=Math.max(0,fuel-(+p.fuel||0));stageNo++;renderStack();setMessage('Stage '+stageNo+' separated: '+p.name+'.');
}
function safeFlag(){
 if(!landed||crashed){setMessage('Land safely and stop before planting a flag.');return}
 flags[body().name]=true;writeJSON(STORAGE_FLAGS,flags);renderStarChart();setMessage('⚑ Flag planted on '+body().name+'! Saved on this device.');
}
function drawStars(w,h){
 ctx.fillStyle='#050a12';ctx.fillRect(0,0,w,h);
 for(let i=0;i<95;i++){const x=(i*173+37)%w,y=(i*97+19)%h;ctx.fillStyle=i%7===0?'#8fcdf2':'#64788c';ctx.globalAlpha=.25+(i%5)*.12;ctx.fillRect(x,y,i%9===0?2:1,i%9===0?2:1)}ctx.globalAlpha=1;
}
function rounded(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function drawRocket(x,y,scale=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
 ctx.fillStyle='#d6e0e8';ctx.strokeStyle='#172635';ctx.lineWidth=2;
 const h=Math.max(36,stack.length*14);
 stack.forEach((p,i)=>{const py=h/2-i*14-14;
  if(p.type==='capsule'){ctx.beginPath();ctx.moveTo(-9,py+12);ctx.lineTo(-8,py+1);ctx.lineTo(0,py-9);ctx.lineTo(8,py+1);ctx.lineTo(9,py+12);ctx.closePath();ctx.fillStyle=p.color||'#d6e0e8';ctx.fill();ctx.stroke()}
  else if(p.type==='engine'||p.type==='booster'){ctx.fillStyle=p.color||'#e28b54';ctx.fillRect(-8,py-1,16,14);ctx.strokeRect(-8,py-1,16,14)}
  else if(p.type==='solar'){ctx.fillStyle='#448bd2';ctx.fillRect(-22,py+2,12,8);ctx.fillRect(10,py+2,12,8);ctx.fillStyle='#9aa9b8';ctx.fillRect(-8,py,16,10)}
  else {ctx.fillStyle=p.color||'#91a6b7';ctx.fillRect(-8,py,16,14);ctx.strokeRect(-8,py,16,14)}
  if(p.type==='legs'||/landing legs/i.test(p.name)){ctx.strokeStyle='#dce5ec';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,py+9);ctx.lineTo(-16,py+18);ctx.lineTo(-20,py+18);ctx.moveTo(7,py+9);ctx.lineTo(16,py+18);ctx.lineTo(20,py+18);ctx.stroke()}
 });
 if(keys.has('w')||keys.has('arrowup')){ctx.fillStyle='#ffad4d';ctx.beginPath();ctx.moveTo(-5,h/2);ctx.lineTo(0,h/2+15+Math.random()*7);ctx.lineTo(5,h/2);ctx.fill()}
 ctx.restore();
}
function drawFlight(){
 const w=canvas.width,h=canvas.height;drawStars(w,h);
 const b=body(),planetR=Math.max(42,Math.min(100,85-altitude/50000)),px=w*.52+worldX,py=h*.78+worldY;
 const grad=ctx.createRadialGradient(px-planetR*.3,py-planetR*.4,1,px,py,planetR*1.4);grad.addColorStop(0,b.color);grad.addColorStop(1,'#07111d');
 ctx.fillStyle=grad;ctx.beginPath();ctx.arc(px,py,planetR,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#ffffff18';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,planetR+2,Math.PI,Math.PI*2);ctx.stroke();
 const rx=w*.5,ry=h*.43-Math.min(altitude/18000,100);
 if(launched)drawRocket(rx,ry,.9);
 else {ctx.fillStyle='#9fb3c4';ctx.font='12px Arial';ctx.fillText('ASSEMBLY READY',w/2-50,h*.45);drawRocket(w/2,h*.38,.9)}
 ctx.fillStyle='#e3eff9';ctx.font='bold 13px Arial';ctx.fillText(b.name.toUpperCase()+' // FLIGHT DECK',18,28);
 ctx.fillStyle='#a7c0d5';ctx.font='12px Arial';ctx.fillText('GRAVITY '+b.gravity.toFixed(1)+' m/s² · SIM '+simTime.toFixed(1)+' s',18,h-20);
 if(!launched){rounded(w*.5-135,h*.13,270,48,7);ctx.fillStyle='#07111ddd';ctx.fill();ctx.strokeStyle='#3b5870';ctx.stroke();ctx.fillStyle='#eaf5fc';ctx.textAlign='center';ctx.font='bold 14px Arial';ctx.fillText('READY FOR LAUNCH',w*.5,h*.13+20);ctx.font='11px Arial';ctx.fillStyle='#9db6c9';ctx.fillText('Press LAUNCH, then hold W / ↑',w*.5,h*.13+37);ctx.textAlign='left'}
 if(paused||crashed||landed){ctx.fillStyle='#050a12bb';ctx.fillRect(0,0,w,h);ctx.textAlign='center';ctx.font='bold 28px Arial';ctx.fillStyle=crashed?'#ff9b8c':landed?'#b6df35':'#f1f7fc';ctx.fillText(crashed?'MISSION FAILED':landed?'LANDED SAFELY':'SIMULATION PAUSED',w/2,h/2);ctx.textAlign='left'}
}
function drawMap(){
 const w=canvas.width,h=canvas.height;drawStars(w,h);
 const sx=72,sy=h*.5,space=(w-150)/(bodies.length+0.2);
 ctx.fillStyle='#ffb65c';ctx.beginPath();ctx.arc(sx,sy,17,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff1cf';ctx.font='bold 12px Arial';ctx.fillText('Cinder',sx-18,sy+36);
 bodies.forEach((b,i)=>{
  const orbit=85+(i+1)*space*.72,x=Math.min(w-65,sx+orbit),y=sy+Math.sin(i*1.4)*Math.min(95,h*.18),r= Math.max(7,Math.min(13,7+b.radius/900));
  ctx.strokeStyle='#354b60';ctx.beginPath();ctx.ellipse(sx,sy,orbit,Math.min(145,35+i*18),0,0,Math.PI*2);ctx.stroke();
  const g=ctx.createRadialGradient(x-r*.35,y-r*.4,1,x,y,r*1.5);g.addColorStop(0,b.color);g.addColorStop(1,'#07111d');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  if(i===selectedBody){ctx.strokeStyle='#b6df35';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r+6,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#b6df35';ctx.font='bold 10px Arial';ctx.fillText('SELECTED',x-r,y-r-12)}
  if(flags[b.name]){ctx.fillStyle='#ffcf4a';ctx.font='bold 14px Arial';ctx.fillText('⚑',x+7,y-r-5)}
  ctx.fillStyle='#e2edf6';ctx.font='bold 12px Arial';ctx.fillText(b.name,Math.min(w-75,x-r),Math.min(h-35,y+r+20));
  ctx.fillStyle='#8ea5b9';ctx.font='10px Arial';ctx.fillText(b.kind,Math.min(w-90,x-r),Math.min(h-20,y+r+33));
 });
 ctx.fillStyle='#b8c8d7';ctx.font='bold 13px Arial';ctx.fillText('EMBER SYSTEM / STAR CHART',18,28);
 ctx.fillStyle='#8199ae';ctx.font='11px Arial';ctx.fillText('Select a launch body from Mission Setup. Flags stay saved on this device.',18,h-18);
}
function draw(){if(!ctx)return;if(mode==='map')drawMap();else drawFlight();updateStats()}
function tick(dt){
 if(!launched||paused||crashed||landed)return;
 dt=Math.min(dt,.03);simTime+=dt;
 const steer=(keys.has('a')||keys.has('arrowleft')?-1:0)+(keys.has('d')||keys.has('arrowright')?1:0);
 angle+=steer*1.7*dt;
 const firing=(keys.has('w')||keys.has('arrowup'))&&fuel>0;
 const retro=(keys.has('s')||keys.has('arrowdown'))&&fuel>0;
 if(firing||retro){
  const power=thrust()*1000/Math.max(1,totalMass());
  verticalSpeed+=(firing?Math.cos(angle):-Math.cos(angle))*power*dt;
  horizontalSpeed+=(firing?Math.sin(angle):-Math.sin(angle))*power*dt;
  fuel=Math.max(0,fuel-Math.max(.08,thrust()*.00025)*dt);
 }
 const gravity=body().gravity*Math.pow(body().radius*1000/(body().radius*1000+Math.max(0,altitude)),2);
 verticalSpeed-=gravity*Math.cos(angle)*dt*.35;
 verticalSpeed*=Math.max(.0,1-.012*dt);
 horizontalSpeed*=Math.max(.0,1-.006*dt);
 altitude+=verticalSpeed*dt;
 worldX-=horizontalSpeed*dt*.5;worldY+=verticalSpeed*dt*.12;
 if(altitude<=0){
  altitude=0;
  if(verticalSpeed < -18||Math.abs(horizontalSpeed)>90){crashed=true;setMessage('Impact too fast. Recover and try a gentler landing.')}
  else if(simTime>1){verticalSpeed=0;horizontalSpeed*=.25;if(Math.abs(horizontalSpeed)<1){landed=true;setMessage('Safe landing on '+body().name+'. You can plant a flag.')} }
 }
 if(altitude>10000000){setMessage('High altitude reached. Orbital mechanics are still simplified in this build.')}
}
function loop(now){const dt=lastTime?Math.min((now-lastTime)/1000,.03):0;lastTime=now;tick(dt);draw();requestAnimationFrame(loop)}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>switchMode(b.dataset.mode)));
$('launchBtn').addEventListener('click',launch);
$('recoverBtn').addEventListener('click',resetFlight);
$('clearRocket').addEventListener('click',()=>{if(launched){setMessage('Recover the rocket before clearing the stack.');return}stack=[];renderStack();setMessage('Rocket stack cleared.')});
$('planetSelect').addEventListener('change',()=>{selectedBody=Number($('planetSelect').value)||0;renderBodySelect();if(!launched)resetFlight();else setMessage('Selected '+body().name+'. Current flight stays in progress.')});
$('pauseBtn').addEventListener('click',()=>{if(!launched)return;paused=!paused;updateStats();setMessage(paused?'Simulation paused.':'Simulation resumed.')});
$('stageBtn').addEventListener('click',stage);
$('plantFlagBtn').addEventListener('click',safeFlag);
$('mapExit').addEventListener('click',()=>switchMode('flight'));
$('mapBtn').addEventListener('click',()=>switchMode(mode==='map'?'flight':'map'));
$('partForm').addEventListener('submit',e=>{
 e.preventDefault();const type=$('partType').value,name=$('partName').value.trim(),mass=Number($('partMass').value),fuel=Number($('partFuel').value),thrust=Number($('partThrust').value);
 if(!name||mass<=0||fuel<0||thrust<0){setMessage('Check the custom part name and stats.');return}
 const icons={capsule:'◈',tank:'▤',engine:'♨',booster:'✹',solar:'▦',legs:'⌁'};
 custom.push({id:'custom-'+Date.now(),name,type,mass,fuel,thrust,icon:icons[type],color:'#66c0f4'});writeJSON(STORAGE_PARTS,custom);drawCatalog();$('partName').value='';setMessage(name+' saved to your custom parts catalog.');
});
$('partType').addEventListener('change',()=>{const t=$('partType').value;$('partFuel').value=(t==='tank'||t==='booster')?180:0;$('partThrust').value=t==='engine'?420:t==='booster'?700:0;$('partMass').value=t==='capsule'?800:t==='tank'?180:t==='engine'?250:t==='booster'?400:t==='solar'?35:90});
document.addEventListener('keydown',e=>{
 const tag=e.target&&e.target.tagName;if(['INPUT','SELECT','TEXTAREA'].includes(tag))return;
 const k=e.key.toLowerCase();
 if(k==='m'||e.code==='KeyM'){e.preventDefault();switchMode(mode==='map'?'flight':'map');return}
 if(k==='escape'){e.preventDefault();if(mode==='map')switchMode('flight');return}
 if(k==='r'){resetFlight();return}
 if(k===' '){e.preventDefault();stage();return}
 if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();keys.add(k)}
},true);
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
renderBodySelect();drawCatalog();renderStack();fuel=stack.reduce((n,p)=>n+(+p.fuel||0),0);updateStats();requestAnimationFrame(loop);
})();