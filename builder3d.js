(()=> {
const $=id=>document.getElementById(id);
const mode=$('builderMode'), cameraMode=$('cameraMode'), objectTool=$('objectTool'), world=$('world3d'), grid=$('levelGrid');
if(!mode||!world||!window.THREE)return;
const THREE=window.THREE;
let renderer,scene,camera,ground,gridHelper,objects=[],player,playerMesh,goalMarker,playing=false,won3d=false,worldOverlay,worldOverlayTitle,worldOverlayText,worldOverlayButton;
let px=0,pz=0,vy=0,yaw=0,pitch=-0.18,last=0,keys={},dragging=false,lastX=0,lastY=0,moveSpeed=6;
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const savedKey='smoke-custom-world3d-v1';
const colors={block:0x58a86d,coin:0xffd84f,hazard:0xe74c3c,start:0x4bafff,goal:0xb78cff};
function material(color,roughness=.8){return new THREE.MeshStandardMaterial({color,roughness})}
function init3d(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x8bc9ed);scene.fog=new THREE.Fog(0x8bc9ed,28,75);
 camera=new THREE.PerspectiveCamera(70,1,.1,180);
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;world.appendChild(renderer.domElement);world.insertAdjacentHTML('beforeend','<div id="world3dOverlay" class="world3d-overlay"><div class="world3d-panel"><h2 id="world3dOverlayTitle">3D playtest</h2><p id="world3dOverlayText">Build a world, then start your test.</p><button type="button" id="world3dStart">START 3D PLAYTEST</button></div></div>');worldOverlay=$('world3dOverlay');worldOverlayTitle=$('world3dOverlayTitle');worldOverlayText=$('world3dOverlayText');worldOverlayButton=$('world3dStart');worldOverlayButton.addEventListener('click',()=>{if(won3d){const s=objects.find(o=>o.userData.kind==='start');px=s?s.position.x:0;pz=s?s.position.z:5;player.position.set(px,0,pz);won3d=false}begin3d()});
 scene.add(new THREE.HemisphereLight(0xeaf7ff,0x58734a,2));
 const sun=new THREE.DirectionalLight(0xffffff,2.1);sun.position.set(-12,22,10);sun.castShadow=true;scene.add(sun);
 ground=new THREE.Mesh(new THREE.PlaneGeometry(34,34),material(0x7caa5d));ground.rotation.x=-Math.PI/2;ground.position.y=-.06;ground.receiveShadow=true;scene.add(ground);
 gridHelper=new THREE.GridHelper(32,32,0x263d4c,0x45604c);gridHelper.position.y=.015;scene.add(gridHelper);
 const skySun=new THREE.Mesh(new THREE.SphereGeometry(1.7,16,12),new THREE.MeshBasicMaterial({color:0xffe5a0}));skySun.position.set(-13,15,-24);scene.add(skySun);
 player=new THREE.Group();
 const body=new THREE.Mesh(new THREE.BoxGeometry(.7,1.1,.45),material(0x2787c4));body.position.y=.8;body.castShadow=true;player.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.3,16,12),material(0xf0c6a3));head.position.y=1.55;head.castShadow=true;player.add(head);
 const marker=new THREE.Mesh(new THREE.ConeGeometry(.18,.38,10),material(0xffd15b));marker.position.set(0,2.05,0);marker.rotation.x=Math.PI;player.add(marker);
 scene.add(player);
 resize();window.addEventListener('resize',resize);
 renderer.domElement.addEventListener('pointerdown',pointerDown);
 renderer.domElement.addEventListener('pointermove',pointerMove);
 window.addEventListener('pointerup',()=>{dragging=false});
 renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
 window.addEventListener('keydown',e=>{if(mode.value!=='3d')return;const k=e.key.toLowerCase();keys[k]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault()});
 window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
 window.addEventListener('blur',()=>keys={});
 renderObjects();requestAnimationFrame(loop);
}
function resize(){if(!renderer||!camera)return;const w=Math.max(1,world.clientWidth),h=Math.max(1,world.clientHeight);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
function makeObject(type,x,z){
 let mesh;
 if(type==='block'){mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material(colors.block));mesh.position.y=.5}
 else if(type==='coin'){mesh=new THREE.Mesh(new THREE.TorusGeometry(.32,.12,10,20),material(colors.coin,.35));mesh.position.y=.8;mesh.rotation.x=Math.PI/2}
 else if(type==='hazard'){mesh=new THREE.Mesh(new THREE.ConeGeometry(.48,1.05,5),material(colors.hazard));mesh.position.y=.52}
 else if(type==='goal'){mesh=new THREE.Group();const post=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,2.1,8),material(0xf2f5f7));post.position.y=1.05;mesh.add(post);const flag=new THREE.Mesh(new THREE.BoxGeometry(.75,.42,.06),material(colors.goal));flag.position.set(.36,1.72,0);mesh.add(flag)}
 else if(type==='start'){mesh=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.09,20),material(colors.start));mesh.position.y=.05}
 mesh.position.x=x;mesh.position.z=z;mesh.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});mesh.userData={kind:type,gx:x,gz:z};scene.add(mesh);objects.push(mesh);return mesh
}
function renderObjects(){if(!scene)return;objects.forEach(o=>scene.remove(o));objects=[];const initial=[{type:'start',x:0,z:5},{type:'goal',x:0,z:-5}];initial.forEach(o=>makeObject(o.type,o.x,o.z));}
function setMode(){
 const is3d=mode.value==='3d';
 world.hidden=!is3d;grid.hidden=is3d;
 const legend=document.querySelector('.editor-legend'),touch=document.querySelector('.builder-touch');
 if(legend)legend.hidden=is3d;if(touch)touch.hidden=is3d;
 $('cameraOptions').hidden=!is3d;
 $('editorDimensions').textContent=is3d?'3D WORLD · 32 × 32 GRID':'20 × 12 GRID';
 $('tileTool').disabled=is3d;
 if(is3d){if(!renderer)init3d();else resize();$('builderStatus').textContent='3D mode: choose an object and click the world to place it. Switch camera between first and third person.'}
 else {playing=false;grid.style.pointerEvents='';$('builderStatus').textContent='2D platform mode selected.'}
 $('playtest').textContent=is3d?'▶ PLAYTEST 3D WORLD':'▶ PLAYTEST';
 $('stoptest').textContent='■ STOP TEST';
}
function pointerFromEvent(e){const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1}
function pointerDown(e){
 if(mode.value!=='3d')return;
 if(playing&&cameraMode.value==='third'){dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId);return}
 if(playing)return;
 pointerFromEvent(e);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObject(ground);
 if(!hits.length)return;
 const hit=hits[0].point,x=Math.round(THREE.MathUtils.clamp(hit.x,-15,15)),z=Math.round(THREE.MathUtils.clamp(hit.z,-15,15)),type=objectTool.value;
 if(type==='erase'){
  const nearest=objects.filter(o=>o.userData.kind!=='start').sort((a,b)=>a.position.distanceTo(new THREE.Vector3(x,0,z))-b.position.distanceTo(new THREE.Vector3(x,0,z)))[0];
  if(nearest&&nearest.position.distanceTo(new THREE.Vector3(x,0,z))<1.4){scene.remove(nearest);objects=objects.filter(o=>o!==nearest)}
 }else{
  const old=objects.find(o=>o.userData.kind===type&&o.userData.gx===x&&o.userData.gz===z);
  if(old){scene.remove(old);objects=objects.filter(o=>o!==old)}
  makeObject(type,x,z);
 }
 $('builderStatus').textContent='3D object placed at '+x+', '+z+'. Save your world when ready.';
}
function pointerMove(e){if(!dragging||!playing||cameraMode.value!=='third')return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*.006;pitch=THREE.MathUtils.clamp(pitch-dy*.004,-.75,.25)}
function start3d(){
 if(mode.value!=='3d')return;
 playing=false;won3d=false;const spawn=objects.find(o=>o.userData.kind==='start');px=spawn?spawn.position.x:0;pz=spawn?spawn.position.z:5;vy=0;yaw=0;pitch=-.18;player.position.set(px,0,pz);player.visible=cameraMode.value!=='first';worldOverlay.hidden=false;worldOverlay.style.display='grid';worldOverlayTitle.textContent='3D playtest ready';worldOverlayText.textContent='WASD moves. Space jumps. Reach the purple goal, avoid red hazards, and collect gold coins. Drag the mouse to look around in third person.';worldOverlayButton.textContent='START 3D PLAYTEST';$('builderStatus').textContent='3D playtest ready. Press START 3D PLAYTEST.';last=performance.now();
}
function begin3d(){playing=true;won3d=false;worldOverlay.style.display='none';last=performance.now();player.visible=cameraMode.value!=='first';}
function stop3d(){playing=false;dragging=false;keys={};if(player)player.visible=true;if(worldOverlay)worldOverlay.style.display='none';$('builderStatus').textContent=mode.value==='3d'?'3D editor ready. Click to place objects.':'Editor ready.'}
function collisionAt(x,z,kind){return objects.find(o=>o.userData.kind===kind&&Math.abs(o.position.x-x)<.72&&Math.abs(o.position.z-z)<.72)}
function win3d(){playing=false;won3d=true;worldOverlayTitle.textContent='3D WORLD COMPLETE!';worldOverlayText.textContent='You reached the goal! Your 3D world works. Save it or keep building.';worldOverlayButton.textContent='PLAY AGAIN';worldOverlay.style.display='grid';$('builderStatus').textContent='3D world completed!'}
function update3d(dt){
 if(!playing)return;
 let f=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0),side=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
 const len=Math.hypot(f,side)||1;f/=len;side/=len;
 px+=(-Math.sin(yaw)*f+Math.cos(yaw)*side)*moveSpeed*dt;pz+=(-Math.cos(yaw)*f-Math.sin(yaw)*side)*moveSpeed*dt;
 px=THREE.MathUtils.clamp(px,-15.5,15.5);pz=THREE.MathUtils.clamp(pz,-15.5,15.5);
 if(keys[' ']&&Math.abs(vy)<.001)vy=7.5;vy-=18*dt;player.position.y=Math.max(0,player.position.y+vy*dt);if(player.position.y<=0){player.position.y=0;vy=0}
 if(collisionAt(px,pz,'hazard')){const s=objects.find(o=>o.userData.kind==='start');px=s?s.position.x:0;pz=s?s.position.z:5;player.position.y=0;vy=0;$('builderStatus').textContent='Hazard hit! Respawned at the start.'}
 const coin=collisionAt(px,pz,'coin');if(coin){scene.remove(coin);objects=objects.filter(o=>o!==coin);$('builderStatus').textContent='Coin collected!'}
 if(collisionAt(px,pz,'goal')){win3d();return}
 player.position.x=px;player.position.z=pz;player.rotation.y=yaw;
 player.visible=cameraMode.value!=='first';
 if(cameraMode.value==='first'){
  camera.position.set(px,player.position.y+1.55,pz);camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;
 }else{
  const distance=6.5,up=2.8;
  const target=new THREE.Vector3(px,player.position.y+1.25,pz);
  const offset=new THREE.Vector3(Math.sin(yaw)*distance,up-Math.sin(pitch)*2,Math.cos(yaw)*distance);
  camera.position.lerp(target.clone().add(offset),.22);camera.lookAt(target);
 }
}
function loop(t){requestAnimationFrame(loop);if(!renderer||!scene)return;const dt=Math.min(.04,(t-(last||t))/1000);if(playing)update3d(dt);else if(cameraMode.value==='third'){const target=new THREE.Vector3(0,1,0);camera.position.lerp(new THREE.Vector3(11,9,14),.035);camera.lookAt(target)}if(renderer)renderer.render(scene,camera)}
mode.addEventListener('change',setMode);
cameraMode.addEventListener('change',()=>{if(player)player.visible=cameraMode.value!=='first';if(playing&&cameraMode.value==='first')dragging=false});
$('playtest').addEventListener('click',e=>{if(mode.value==='3d'){e.stopImmediatePropagation();start3d()}},true);
$('stoptest').addEventListener('click',e=>{if(mode.value==='3d'){e.stopImmediatePropagation();stop3d()}},true);

$('saveLevel').addEventListener('click',e=>{if(mode.value!=='3d')return;e.stopImmediatePropagation();try{const data=objects.map(o=>({type:o.userData.kind,x:o.userData.gx,z:o.userData.gz}));localStorage.setItem(savedKey,JSON.stringify(data));$('builderStatus').textContent='3D world saved in this browser!'}catch(err){$('builderStatus').textContent='Could not save this 3D world.'}},true);
$('loadLevel').addEventListener('click',e=>{if(mode.value!=='3d')return;e.stopImmediatePropagation();try{const data=JSON.parse(localStorage.getItem(savedKey)||'null');if(!Array.isArray(data)){ $('builderStatus').textContent='No saved 3D world found yet.';return}objects.forEach(o=>scene.remove(o));objects=[];data.forEach(o=>makeObject(o.type,o.x,o.z));stop3d();$('builderStatus').textContent='Saved 3D world loaded!'}catch(err){$('builderStatus').textContent='Could not load saved 3D world.'}},true);
$('clearLevel').addEventListener('click',e=>{if(mode.value!=='3d')return;e.stopImmediatePropagation();objects.forEach(o=>scene.remove(o));objects=[];makeObject('start',0,5);makeObject('goal',0,-5);stop3d();$('builderStatus').textContent='3D world cleared. Start and goal markers restored.'},true);

setMode();
})();
