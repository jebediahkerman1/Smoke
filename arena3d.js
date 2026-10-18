/* SMOKE 3D Arena Engine — original low-poly browser FPS modes.
   Uses Three.js for real 3D rendering; all characters, maps, and game rules are original. */
(function () {
  'use strict';
  const byId = id => document.getElementById(id);
  const mode = document.body.dataset.game || 'strike';
  const configs = {
    strike: { name: 'COUNTER SMOKE', enemyLabel: 'HOSTILES LEFT', startEnemies: 5, hp: 100, mag: 24, reserve: 96, damage: 34, fireRate: .19, speed: 5.3, color: 0x4eb8e7, botColor: 0xd85b57, botHp: 100, botDamage: 9, botSpeed: 2.45 },
    payload: { name: 'PAYLOAD PANIC', enemyLabel: 'RED TEAM ACTIVE', startEnemies: 6, hp: 125, mag: 32, reserve: 128, damage: 27, fireRate: .14, speed: 5.1, color: 0x5cb9ff, botColor: 0xe65f51, botHp: 95, botDamage: 8, botSpeed: 2.3 },
    zombie: { name: 'ZOMBIE SHIFT', enemyLabel: 'INFECTED NEARBY', startEnemies: 8, hp: 100, mag: 30, reserve: 180, damage: 36, fireRate: .15, speed: 5.35, color: 0x8adf77, botColor: 0x548c55, botHp: 75, botDamage: 12, botSpeed: 2.0 }
  };
  const cfg = configs[mode] || configs.strike;
  const canvas = byId('gameCanvas');
  const overlay = byId('overlay');
  const deployBtn = byId('deployBtn');
  const panelTitle = byId('panelTitle');
  const panelDescription = byId('panelDescription');
  const healthFill = byId('healthFill');
  const healthValue = byId('healthValue');
  const ammoValue = byId('ammoValue');
  const reserveValue = byId('reserveValue');
  const ammoCaption = byId('ammoCaption');
  const enemyCount = byId('enemyCount');
  const objectiveChip = byId('objectiveChip');
  const objectiveText = byId('objectiveText');
  const hintText = byId('hintText');
  const toast = byId('toast');
  const hitMarker = byId('hitMarker');
  const roundBanner = byId('roundBanner');
  const classPicker = byId('classPicker');

  if (!window.THREE) {
    panelTitle.textContent = '3D ENGINE DID NOT LOAD';
    panelDescription.textContent = 'The game could not load the Three.js library. Check your internet connection and reload this page.';
    deployBtn.disabled = true;
    return;
  }

  const THREE = window.THREE;
  const scene = new THREE.Scene();
  const background = mode === 'payload' ? 0x18232d : mode === 'zombie' ? 0x101c16 : 0x101b27;
  scene.background = new THREE.Color(background);
  scene.fog = new THREE.Fog(background, 20, 57);
  const camera = new THREE.PerspectiveCamera(76, window.innerWidth / window.innerHeight, .08, 100);
  camera.rotation.order = 'YXZ';
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.add(new THREE.HemisphereLight(0xd3e8ff, mode === 'zombie' ? 0x132619 : 0x27303a, 1.15));
  const sun = new THREE.DirectionalLight(mode === 'payload' ? 0xffdcb1 : 0xd3e8ff, 1.5);
  sun.position.set(-12, 22, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -30; sun.shadow.camera.right = 30; sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
  scene.add(sun);

  const solidMeshes = [];
  const colliders = [];
  let bots = [];
  let botParts = [];
  let projectiles = [];
  let decorative = [];
  let px = 0, pz = 12, yaw = 0, pitch = 0, jumpY = 0, jumpV = 0, grounded = true;
  let health = cfg.hp, ammo = cfg.mag, reserveAmmo = cfg.reserve;
  let active = false, paused = true, gameOver = false;
  let fireCooldown = 0, reloadTimer = 0, botSpawnTimer = 0, lastFrame = performance.now();
  let killCount = 0, round = 1, roundsWon = 0, wave = 1, transition = false, cartProgress = 0;
  let currentClass = 0, score = 0, toastTimer = 0, hitTimer = 0, elapsed = 0;
  let cart = null, cartTrack = [], weaponGroup = null;
  const keys = Object.create(null);
  const raycaster = new THREE.Raycaster();
  const center = new THREE.Vector2(0, 0);
  const up = new THREE.Vector3(0, 1, 0);
  const classInfo = [
    { name: 'SCOUT', hp: 100, mag: 32, reserve: 128, damage: 21, delay: .105, speed: 7.1, gun: 'LIGHT SMG' },
    { name: 'SOLDIER', hp: 125, mag: 20, reserve: 80, damage: 44, delay: .36, speed: 5.0, gun: 'BURST RIFLE' },
    { name: 'HEAVY', hp: 185, mag: 60, reserve: 180, damage: 13, delay: .075, speed: 3.65, gun: 'MINI-GUN' },
    { name: 'MEDIC', hp: 125, mag: 28, reserve: 112, damage: 23, delay: .16, speed: 5.4, gun: 'MEDIC CARBINE' }
  ];
  const MAT = (color, roughness) => new THREE.MeshStandardMaterial({ color: color, roughness: roughness === undefined ? .82 : roughness, metalness: .04 });
  function box(x, y, z, w, h, d, color, solid, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material || MAT(color));
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
    if (solid) { solidMeshes.push(mesh); colliders.push({ x: x, z: z, w: w, d: d }); }
    return mesh;
  }
  function cylinder(x, y, z, rTop, rBottom, height, color, segments) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, height, segments || 8), MAT(color));
    mesh.position.set(x, y, z); mesh.castShadow = true; scene.add(mesh); return mesh;
  }
  function makeArena() {
    const groundColor = mode === 'payload' ? 0x55514a : mode === 'zombie' ? 0x27352b : 0x34404a;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), MAT(groundColor));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -.06; ground.receiveShadow = true; scene.add(ground);
    const grid = new THREE.GridHelper(58, 58, mode === 'payload' ? 0x9f7444 : mode === 'zombie' ? 0x49694a : 0x597080, 0x3b4b55);
    grid.position.y = -.035; grid.material.transparent = true; grid.material.opacity = .21; scene.add(grid);
    const boundaryColor = mode === 'payload' ? 0x645b4b : mode === 'zombie' ? 0x26392b : 0x485560;
    box(0, 2, -28, 58, 4, 1.2, boundaryColor, true);
    box(0, 2, 28, 58, 4, 1.2, boundaryColor, true);
    box(-28, 2, 0, 1.2, 4, 58, boundaryColor, true);
    box(28, 2, 0, 1.2, 4, 58, boundaryColor, true);
    // Cover is deliberately arranged as lanes and pockets, keeping a clear route through the arena.
    const crateColor = mode === 'payload' ? 0x866447 : mode === 'zombie' ? 0x3a573b : 0x596b77;
    const metalColor = mode === 'payload' ? 0x527c9b : mode === 'zombie' ? 0x36463a : 0x3c515f;
    const covers = [
      [-10, -12, 4, 3, 2.5], [7, -12, 5, 3, 2.3], [-2, -5, 3, 3, 2.8],
      [12, -5, 3.5, 4, 2.5], [-13, -2, 3, 5, 2.5], [5, 2, 4.5, 3, 2.2],
      [-5, 8, 3.5, 4, 2.6], [12, 10, 5, 3, 2.4], [-13, 14, 4, 3, 2.1], [3, 16, 4, 3, 2.4],
      [-1, -17, 4, 2, 2.2], [17, 1, 3, 3, 2.2], [-18, 6, 2.5, 3, 2.4], [18, 17, 3, 3, 2.2]
    ];
    covers.forEach((c, i) => {
      box(c[0], c[4] / 2, c[1], c[2], c[4], c[3], i % 3 === 0 ? metalColor : crateColor, true);
      if (c[4] > 2.3 && i % 2 === 0) box(c[0], c[4] + .65, c[1], c[2] * .82, 1.3, c[3] * .84, crateColor, true);
      // Minimal stripes and bolts add readable industrial detail.
      if (mode === 'payload') {
        const stripe = box(c[0], c[4] + .01, c[1] - c[3] / 2 - .015, c[2] * .65, .08, .05, i % 2 ? 0xe5aa52 : 0x7dc7e4, false);
        decorative.push(stripe);
      }
    });
    for (let i = 0; i < 6; i++) {
      const x = -22 + i * 8.7;
      const pole = cylinder(x, 3, -24, .09, .13, 6, mode === 'zombie' ? 0x758a61 : 0x798f9a, 6);
      decorative.push(pole);
      const lamp = new THREE.PointLight(mode === 'zombie' ? 0x83e778 : mode === 'payload' ? 0xffbf70 : 0x6bbfe8, .65, 12);
      lamp.position.set(x, 5.5, -24); scene.add(lamp); decorative.push(lamp);
    }
    if (mode === 'payload') makeCart();
    if (mode === 'zombie') {
      for (let i = 0; i < 13; i++) {
        const x = -21 + (i * 7 % 42), z = -21 + (i * 11 % 42);
        cylinder(x, .7, z, .12, .17, 1.4, 0x5a6651, 7);
        const treeTop = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.4, 6), MAT(0x355a3d));
        treeTop.position.set(x, 2.1, z); scene.add(treeTop);
      }
    }
  }
  function makeCart() {
    cart = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.7, .45, 2.1), MAT(0x2b3037)); base.position.y = .75; cart.add(base);
    const payloadBox = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.15, 1.2), MAT(0xd9a35a)); payloadBox.position.set(0, 1.52, 0); cart.add(payloadBox);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.25, .15, .88), MAT(0xffcf75)); top.position.set(0, 2.17, 0); cart.add(top);
    for (const x of [-.95, .95]) for (const z of [-.72, .72]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.37, .37, .22, 12), MAT(0x171d24));
      wheel.rotation.z = Math.PI / 2; wheel.position.set(x, .48, z); cart.add(wheel);
    }
    const glow = new THREE.PointLight(0xffb95d, 1.4, 9); glow.position.set(0, 2.2, 0); cart.add(glow);
    cart.position.set(0, 0, -8); scene.add(cart);
    const railMat = MAT(0x9d9c91);
    for (const x of [-1.25, 1.25]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, 28), railMat); rail.position.set(x, .05, 2); scene.add(rail);
      for (let z = -12; z < 16; z += 1.7) box(x, .02, z, .26, .12, .48, 0x6d5540, false);
    }
    cartTrack = [cart.position.z];
  }
  makeArena();

  const weapon = new THREE.Group();
  const gunBase = new THREE.Mesh(new THREE.BoxGeometry(.22, .22, .72), MAT(mode === 'payload' ? 0x493c2c : mode === 'zombie' ? 0x283f2d : 0x25343e));
  gunBase.position.set(.38, -.34, -.62); weapon.add(gunBase);
  const gunTop = new THREE.Mesh(new THREE.BoxGeometry(.13, .13, .48), MAT(0x8ca1aa));
  gunTop.position.set(.38, -.23, -.73); weapon.add(gunTop);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.055, .065, .49, 8), MAT(0x19252e));
  barrel.rotation.x = Math.PI / 2; barrel.position.set(.38, -.31, -1.08); weapon.add(barrel);
  const sight = new THREE.Mesh(new THREE.BoxGeometry(.055, .09, .08), MAT(cfg.color));
  sight.position.set(.38, -.14, -.83); weapon.add(sight);
  camera.add(weapon); scene.add(camera); weaponGroup = weapon;

  function blocked(x, z, radius) {
    const r = radius || .42;
    if (x < -26.2 + r || x > 26.2 - r || z < -26.2 + r || z > 26.2 - r) return true;
    for (const c of colliders) if (Math.abs(x - c.x) < c.w / 2 + r && Math.abs(z - c.z) < c.d / 2 + r) return true;
    return false;
  }
  function randomSpawn() {
    const spots = [[-21,-19],[20,-18],[-21,20],[21,20],[-19,-5],[20,7],[-1,-22],[0,22],[14,17],[-17,12],[14,-16],[-20,3]];
    for (let i = 0; i < spots.length; i++) {
      const p = spots[(Math.random() * spots.length) | 0];
      if (!blocked(p[0], p[1], 1.2) && Math.hypot(p[0] - px, p[1] - pz) > 8) return { x: p[0], z: p[1] };
    }
    return { x: 19, z: -20 };
  }
  function makeBot(isZombie, team, x, z, hp, index) {
    const bot = { x: x, z: z, hp: hp, maxHp: hp, alive: true, zombie: isZombie, team: team || 'red', cooldown: .8 + Math.random() * 1.4, movePhase: Math.random() * 6, meshes: [], parts: [], index: index || 0, strafe: Math.random() > .5 ? 1 : -1 };
    bot.group = new THREE.Group();
    const skin = isZombie ? (index % 2 ? 0x699c62 : 0x4d835b) : (bot.team === 'blue' ? 0x428bbd : cfg.botColor);
    const armor = isZombie ? 0x293d2d : (bot.team === 'blue' ? 0x254c79 : 0x662e34);
    function part(geo, material, x1, y1, z1) {
      const m = new THREE.Mesh(geo, MAT(material)); m.position.set(x1, y1, z1); m.castShadow = true; m.userData.bot = bot; bot.group.add(m); bot.meshes.push(m); bot.parts.push(m); botParts.push(m); return m;
    }
    part(new THREE.BoxGeometry(.75, 1.0, .42), armor, 0, 1.05, 0);
    part(new THREE.BoxGeometry(.57, .2, .45), skin, 0, 1.58, 0);
    part(new THREE.SphereGeometry(isZombie ? .34 : .29, 8, 7), skin, 0, 1.89, 0);
    if (!isZombie) {
      part(new THREE.BoxGeometry(.5, .12, .35), 0x1b242d, 0, 1.98, -.11);
      part(new THREE.BoxGeometry(.43, .08, .08), 0xd6e4e9, 0, 1.92, -.28);
    } else {
      const eye1 = part(new THREE.SphereGeometry(.045, 6, 5), 0xb4ff72, -.11, 1.95, -.255);
      const eye2 = part(new THREE.SphereGeometry(.045, 6, 5), 0xb4ff72, .11, 1.95, -.255);
    }
    for (const side of [-1, 1]) {
      part(new THREE.BoxGeometry(.22, .72, .24), skin, side * .49, 1.05, -.015).rotation.z = side * -.08;
      part(new THREE.BoxGeometry(.24, .68, .27), armor, side * .23, .39, 0);
    }
    if (!isZombie) {
      const gun = part(new THREE.BoxGeometry(.12, .13, .68), 0x202931, .38, 1.05, -.37);
      gun.rotation.x = -.08;
    }
    bot.group.position.set(x, 0, z); scene.add(bot.group);
    return bot;
  }
  function clearBots() {
    bots.forEach(bot => { scene.remove(bot.group); bot.meshes.forEach(m => { m.userData.bot = null; }); });
    bots = []; botParts = [];
    projectiles.forEach(p => scene.remove(p.mesh)); projectiles = [];
  }
  function spawnBots(count, zombie) {
    for (let i = 0; i < count; i++) {
      let p;
      if (mode === 'payload' && i < 2) {
        const candidates = [[-10,-18],[11,-16],[18,3],[-19,7],[10,20],[-20,18],[17,-22],[-8,22]];
        p = { x: candidates[(i + Math.floor(Math.random() * candidates.length)) % candidates.length][0], z: candidates[(i + Math.floor(Math.random() * candidates.length)) % candidates.length][1] };
        if (blocked(p.x,p.z,1.1) || Math.hypot(p.x-px,p.z-pz)<7) p = randomSpawn();
      } else p = randomSpawn();
      bots.push(makeBot(!!zombie, zombie ? 'green' : 'red', p.x, p.z, zombie ? cfg.botHp + (wave-1)*9 : cfg.botHp, i));
    }
    updateHUD();
  }
  function showToast(text) {
    toast.textContent = text; toast.classList.add('show'); toastTimer = 2.1;
  }
  function showBanner(text) {
    roundBanner.textContent = text;
    roundBanner.classList.remove('show'); void roundBanner.offsetWidth; roundBanner.classList.add('show');
  }
  function activeBots() { return bots.filter(b => b.alive).length; }
  function setPlayerDefaults() {
    px = 0;
    pz = mode === 'payload' ? -4 : 14;
    yaw = 0; pitch = 0; jumpY = 0; jumpV = 0; grounded = true;
    if (mode === 'payload') applyClass(0, true);
    else { health = cfg.hp; ammo = cfg.mag; reserveAmmo = cfg.reserve; }
    camera.position.set(px, 1.67, pz); camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }
  function startRun() {
    clearBots();
    score = 0; killCount = 0; round = 1; roundsWon = 0; wave = 1; cartProgress = 0; transition = false; elapsed = 0;
    if (cart) { cart.position.z = -8; }
    currentClass = 0; setPlayerDefaults();
    spawnBots(cfg.startEnemies, mode === 'zombie');
    gameOver = false; active = true; paused = false; overlay.classList.add('hidden');
    panelTitle.textContent = mode === 'strike' ? 'LOCK. LOAD. DON’T PANIC.' : mode === 'payload' ? 'PUSH THE CART. MAKE IT WEIRD.' : 'ONE MORE WAVE. THAT’S IT.';
    deployBtn.textContent = 'DEPLOY / RESUME';
    deployBtn.blur();
    if (renderer.domElement.requestPointerLock) renderer.domElement.requestPointerLock();
    updateHUD();
    showBanner(mode === 'strike' ? 'ROUND 1 — GO!' : mode === 'payload' ? 'BLUE CREW — MOVE OUT!' : 'WAVE 1');
  }
  function endGame(title, description) {
    active = false; paused = false; gameOver = true;
    document.exitPointerLock && document.exitPointerLock();
    panelTitle.innerHTML = title;
    panelDescription.textContent = description;
    deployBtn.textContent = 'PLAY AGAIN';
    overlay.classList.remove('hidden');
  }
  function applyClass(index, resetHealth) {
    currentClass = Math.max(0, Math.min(classInfo.length - 1, index));
    const c = classInfo[currentClass];
    const oldMax = mode === 'payload' ? (classInfo[currentClass] || classInfo[0]).hp : cfg.hp;
    if (resetHealth) health = c.hp;
    else health = Math.min(c.hp, Math.ceil(health / Math.max(1, oldMax) * c.hp));
    ammo = Math.min(ammo, c.mag); if (ammo <= 0) ammo = c.mag;
    reserveAmmo = Math.max(reserveAmmo, c.reserve);
    cfg.hp = c.hp; cfg.mag = c.mag; cfg.damage = c.damage; cfg.fireRate = c.delay; cfg.speed = c.speed;
    cfg.reserve = c.reserve;
    if (classPicker) Array.from(classPicker.querySelectorAll('button')).forEach(btn => btn.classList.toggle('selected', Number(btn.dataset.class) === currentClass));
    if (ammoCaption) ammoCaption.textContent = c.name + ' // ' + c.gun;
    if (weaponGroup) {
      weaponGroup.scale.set(currentClass === 2 ? 1.18 : currentClass === 0 ? .82 : 1, currentClass === 2 ? 1.12 : 1, 1);
      const accent = currentClass === 3 ? 0x77e7ba : currentClass === 2 ? 0xffcb5d : currentClass === 1 ? 0xff855d : 0x76e0ff;
      weaponGroup.children[3].material.color.setHex(accent);
    }
    updateHUD();
  }
  function updateHUD() {
    healthValue.textContent = Math.max(0, Math.ceil(health));
    healthFill.style.width = Math.max(0, Math.min(100, health / Math.max(1, cfg.hp) * 100)) + '%';
    healthFill.style.background = health / Math.max(1, cfg.hp) < .3 ? '#ff6267' : mode === 'payload' ? '#ffc16b' : mode === 'zombie' ? '#9bec8a' : '#6fe0a2';
    ammoValue.textContent = ammo; reserveValue.textContent = reserveAmmo;
    enemyCount.textContent = String(activeBots()).padStart(2, '0');
    if (mode === 'strike') {
      objectiveChip.textContent = 'ROUND ' + round + ' / 3';
      objectiveText.innerHTML = 'CLEAR THE ZONE<br>Eliminate the hostile squad to secure the round.';
    } else if (mode === 'payload') {
      objectiveChip.textContent = 'CART: ' + Math.floor(cartProgress) + '%';
      objectiveText.innerHTML = 'STAY WITH THE CART<br>Clear a path and escort the payload to the checkpoint.';
    } else {
      objectiveChip.textContent = 'WAVE ' + wave + ' / 5';
      objectiveText.innerHTML = 'SURVIVE THE NIGHT<br>Thin the horde before it surrounds you.';
    }
    if (mode === 'payload') hintText.innerHTML = 'WASD move · mouse aim · click fire · R reload<br>1–4 change class · Shift sprint · Space jump';
  }
  function tryReload() {
    if (!active || reloadTimer > 0 || ammo >= cfg.mag || reserveAmmo <= 0) return;
    reloadTimer = mode === 'payload' && currentClass === 2 ? 2.6 : .95;
    showToast('RELOADING...');
  }
  function completeReload() {
    const needed = cfg.mag - ammo, loaded = Math.min(needed, reserveAmmo);
    ammo += loaded; reserveAmmo -= loaded;
    reloadTimer = 0; updateHUD(); showToast('MAGAZINE READY');
  }
  function hitTarget(bot, damage) {
    if (!bot || !bot.alive) return;
    bot.hp -= damage;
    hitMarker.classList.add('show'); hitTimer = .13;
    if (bot.hp <= 0) {
      bot.alive = false; score += 100; killCount++;
      scene.remove(bot.group);
      bot.meshes.forEach(m => { m.userData.bot = null; });
      botParts = botParts.filter(m => bot.meshes.indexOf(m) === -1);
      showToast(mode === 'zombie' ? 'INFECTED DOWN  +100' : 'HOSTILE NEUTRALIZED  +100');
      if (mode === 'payload' && health < cfg.hp) health = Math.min(cfg.hp, health + 5);
      updateHUD();
    } else {
      showToast(mode === 'zombie' ? 'HIT — KEEP MOVING' : 'HIT CONFIRMED');
    }
  }
  function shoot() {
    if (!active || paused || gameOver || fireCooldown > 0 || reloadTimer > 0) return;
    if (ammo <= 0) { showToast('MAG EMPTY — PRESS R'); return; }
    ammo--; fireCooldown = cfg.fireRate;
    weaponGroup.position.z = .09; // small recoil
    const jitter = mode === 'payload' && currentClass === 2 ? .02 : .006;
    raycaster.setFromCamera(center, camera);
    raycaster.far = 62;
    const hits = raycaster.intersectObjects(solidMeshes.concat(botParts), false);
    if (hits.length) {
      const h = hits[0];
      if (h.object.userData.bot) {
        const bonus = h.point.y > h.object.userData.bot.group.position.y + 1.65 ? 1.3 : 1;
        hitTarget(h.object.userData.bot, Math.round(cfg.damage * bonus));
      } else {
        showToast('HIT COVER');
      }
      const beamGeometry = new THREE.BufferGeometry().setFromPoints([camera.position.clone(), h.point.clone()]);
      const beam = new THREE.Line(beamGeometry, new THREE.LineBasicMaterial({ color: mode === 'payload' ? 0xffcc7a : mode === 'zombie' ? 0x9aec8a : 0x6be8ff, transparent: true, opacity: .9 }));
      scene.add(beam); setTimeout(() => { scene.remove(beam); beam.geometry.dispose(); beam.material.dispose(); }, 65);
    } else if (Math.random() < jitter) showToast('SUPPRESSIVE FIRE');
    updateHUD();
  }
  function blockedLine(from, to) {
    const direction = to.clone().sub(from);
    const dist = direction.length();
    direction.normalize(); raycaster.set(from, direction); raycaster.far = dist;
    const hit = raycaster.intersectObjects(solidMeshes, false);
    return hit.length > 0 && hit[0].distance < dist - .65;
  }
  function enemyShoot(bot) {
    const origin = new THREE.Vector3(bot.x, 1.4, bot.z);
    const target = new THREE.Vector3(px, 1.45 + jumpY, pz);
    if (blockedLine(origin, target)) return;
    const direction = target.sub(origin).normalize();
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(.12, 7, 6), MAT(mode === 'payload' ? 0xff775c : 0xffd16f));
    mesh.position.copy(origin); scene.add(mesh);
    projectiles.push({ mesh: mesh, velocity: direction.multiplyScalar(mode === 'payload' ? 13 : 11.5), life: 3, enemy: true, damage: cfg.botDamage });
  }
  function updateBots(dt) {
    for (const bot of bots) {
      if (!bot.alive) continue;
      bot.cooldown -= dt; bot.movePhase += dt;
      const dx = px - bot.x, dz = pz - bot.z, dist = Math.hypot(dx, dz) || .001;
      if (bot.zombie) {
        if (dist > 1.35) {
          const v = (cfg.botSpeed + (wave - 1) * .12) * dt;
          const nx = bot.x + dx / dist * v, nz = bot.z + dz / dist * v;
          if (!blocked(nx, bot.z, .36)) bot.x = nx;
          if (!blocked(bot.x, nz, .36)) bot.z = nz;
          bot.group.position.set(bot.x, Math.abs(Math.sin(bot.movePhase * 7)) * .06, bot.z);
          bot.group.rotation.y = Math.atan2(dx, dz);
        } else if (bot.cooldown <= 0) {
          bot.cooldown = .8 + Math.random() * .45; health -= bot.maxHp > 80 ? 13 : 10; showToast('THE HORDE GOT YOU!'); updateHUD();
        }
        continue;
      }
      if (dist > 9.2) {
        const v = cfg.botSpeed * dt, nx = bot.x + dx / dist * v, nz = bot.z + dz / dist * v;
        if (!blocked(nx, bot.z, .38)) bot.x = nx;
        if (!blocked(bot.x, nz, .38)) bot.z = nz;
        bot.group.position.set(bot.x, Math.abs(Math.sin(bot.movePhase * 5)) * .035, bot.z);
      } else if (dist > 4.3) {
        const sx = -dz / dist * bot.strafe * .75 * dt, sz = dx / dist * bot.strafe * .75 * dt;
        if (!blocked(bot.x + sx, bot.z, .38)) bot.x += sx;
        if (!blocked(bot.x, bot.z + sz, .38)) bot.z += sz;
        bot.group.position.set(bot.x, 0, bot.z);
      }
      bot.group.rotation.y = Math.atan2(dx, dz);
      if (dist < 22 && bot.cooldown <= 0) { bot.cooldown = 1.2 + Math.random() * 1.5; enemyShoot(bot); }
    }
  }
  function updateProjectiles(dt) {
    const rest = [];
    for (const p of projectiles) {
      p.life -= dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      const pos = p.mesh.position;
      if (p.life <= 0 || blocked(pos.x, pos.z, .08)) { scene.remove(p.mesh); continue; }
      if (p.enemy && Math.hypot(pos.x - px, pos.z - pz) < .55 && pos.y < 2.3 + jumpY) {
        health -= p.damage; scene.remove(p.mesh);
        showToast('INCOMING FIRE'); updateHUD(); continue;
      }
      rest.push(p);
    }
    projectiles = rest;
  }
  function updatePlayer(dt) {
    const sprint = keys.shift ? 1.45 : 1;
    const speed = cfg.speed * sprint;
    let forward = 0, side = 0;
    if (keys.w || keys.arrowup) forward += 1;
    if (keys.s || keys.arrowdown) forward -= 1;
    if (keys.d) side += 1;
    if (keys.a) side -= 1;
    const norm = Math.hypot(forward, side) || 1;
    forward /= norm; side /= norm;
    const dx = (-Math.sin(yaw) * forward + Math.cos(yaw) * side) * speed * dt;
    const dz = (-Math.cos(yaw) * forward - Math.sin(yaw) * side) * speed * dt;
    if (!blocked(px + dx, pz, .42)) px += dx;
    if (!blocked(px, pz + dz, .42)) pz += dz;
    if (keys.space && grounded) { jumpV = 6.6; grounded = false; }
    jumpV -= 17 * dt; jumpY += jumpV * dt;
    if (jumpY <= 0) { jumpY = 0; jumpV = 0; grounded = true; }
    camera.position.set(px, 1.67 + jumpY, pz);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    weaponGroup.position.z += (0 - weaponGroup.position.z) * Math.min(1, dt * 18);
    if (mode === 'payload') {
      const dist = Math.hypot(px - cart.position.x, pz - cart.position.z);
      if (dist < 5.2) {
        cartProgress = Math.min(100, cartProgress + dt * (keys.shift ? 1.35 : .88));
        cart.position.z = -8 + cartProgress * .2;
        if (Math.floor(cartProgress) % 20 === 0) objectiveChip.textContent = 'CART: ' + Math.floor(cartProgress) + '%';
      }
    }
    if (mode === 'payload' && currentClass === 3) health = Math.min(cfg.hp, health + dt * 1.1);
    elapsed += dt;
  }
  function handleObjective() {
    if (health <= 0) {
      health = 0; updateHUD();
      if (mode === 'strike') endGame('MISSION FAILED', 'Your squad was overrun. Change your approach, use the cover and try the round again.');
      else if (mode === 'payload') endGame('BLUE TEAM WIPED', 'The red bots held the line. Switch classes, use cover and escort the cart to 100%.');
      else endGame('SHIFT OVER', 'The horde won this time. Reload between waves and avoid getting boxed in.');
      return;
    }
    if (mode === 'strike' && activeBots() === 0 && !transition) {
      transition = true; roundsWon++;
      if (roundsWon >= 3) {
        endGame('TACTICAL VICTORY', 'Three rounds secured. You cleared the hostile squad and completed the Counter Smoke field test.');
      } else {
        showBanner('ROUND SECURED');
        health = Math.min(cfg.hp, health + 28); ammo = cfg.mag; reserveAmmo = Math.min(cfg.reserve, reserveAmmo + 16);
        setTimeout(() => {
          if (!gameOver) { round++; spawnBots(cfg.startEnemies + round - 1, false); transition = false; showBanner('ROUND ' + round + ' — GO!'); updateHUD(); }
        }, 1700);
      }
    }
    if (mode === 'payload' && cartProgress >= 100) endGame('PAYLOAD DELIVERED!', 'The blue crew got the cart through. Four classes, one rattling objective and a very annoyed red team.');
    if (mode === 'zombie' && activeBots() === 0 && !transition) {
      transition = true;
      if (wave >= 5) endGame('SUNRISE!', 'Five waves survived. Quarantine Zone 07 is clear — for now.');
      else {
        showBanner('WAVE ' + wave + ' CLEAR');
        health = Math.min(cfg.hp, health + 22); ammo = cfg.mag; reserveAmmo = Math.min(cfg.reserve, reserveAmmo + 25);
        setTimeout(() => {
          if (!gameOver) { wave++; spawnBots(cfg.startEnemies + wave * 2, true); transition = false; showBanner('WAVE ' + wave); updateHUD(); }
        }, 1900);
      }
    }
    updateHUD();
  }
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(.045, Math.max(0, (now - lastFrame) / 1000)); lastFrame = now;
    if (active && !paused && !gameOver) {
      fireCooldown = Math.max(0, fireCooldown - dt);
      if (reloadTimer > 0) { reloadTimer -= dt; if (reloadTimer <= 0) completeReload(); }
      if (mode === 'payload' && currentClass === 3 && health < cfg.hp) health = Math.min(cfg.hp, health + dt * 1.2);
      updatePlayer(dt); updateBots(dt); updateProjectiles(dt); handleObjective();
      if (hitTimer > 0) { hitTimer -= dt; if (hitTimer <= 0) hitMarker.classList.remove('show'); }
      if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) toast.classList.remove('show'); }
    }
    renderer.render(scene, camera);
  }
  function pauseGame() {
    if (active) {
      active = false; paused = true; document.exitPointerLock && document.exitPointerLock();
      panelTitle.textContent = 'MISSION PAUSED';
      panelDescription.textContent = 'Take a breath. Your arena is frozen until you resume. Click below to return to the fight.';
      deployBtn.textContent = 'RESUME MISSION'; overlay.classList.remove('hidden');
    }
  }
  deployBtn.addEventListener('click', function () {
    if (gameOver || !bots.length) startRun();
    else {
      active = true; paused = false; overlay.classList.add('hidden');
      if (renderer.domElement.requestPointerLock) renderer.domElement.requestPointerLock();
    }
  });
  document.addEventListener('pointerlockchange', function () {
    if (!document.pointerLockElement && active && !gameOver) {
      active = false; paused = true;
      panelTitle.textContent = 'MISSION PAUSED';
      panelDescription.textContent = 'Mouse lock was released. Resume to continue the match.';
      deployBtn.textContent = 'RESUME MISSION'; overlay.classList.remove('hidden');
    }
  });
  document.addEventListener('mousemove', function (e) {
    if (!active || paused || document.pointerLockElement !== renderer.domElement) return;
    yaw -= e.movementX * .00225; pitch -= e.movementY * .00205;
    pitch = Math.max(-1.28, Math.min(1.28, pitch));
  });
  canvas.addEventListener('mousedown', function (e) {
    if (e.button === 0 && active && !paused && document.pointerLockElement === renderer.domElement) shoot();
  });
  document.addEventListener('keydown', function (e) {
    const k = e.key.toLowerCase();
    if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
    keys[k === ' ' ? 'space' : k] = true;
    if (e.repeat) return;
    if (k === 'r') tryReload();
    if (k === 'escape') pauseGame();
    if (mode === 'payload' && /^[1-4]$/.test(k)) applyClass(Number(k) - 1, false);
    if (k === 'f' && mode === 'payload') applyClass((currentClass + 1) % classInfo.length, false);
  });
  document.addEventListener('keyup', e => { const k=e.key.toLowerCase(); keys[k === ' ' ? 'space' : k] = false; });
  if (classPicker) classPicker.addEventListener('click', e => {
    const btn = e.target.closest('button[data-class]');
    if (btn) applyClass(Number(btn.dataset.class), false);
  });
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  // Initial bots are staged behind the overlay so the arena renders as a live 3D menu.
  setPlayerDefaults();
  spawnBots(cfg.startEnemies, mode === 'zombie');
  updateHUD();
  if (mode === 'strike') panelDescription.textContent = 'A round-based tactical shooter inspired by competitive objective FPS games. Clear three hostile waves, use cover, manage ammo and stay alive. Original arena, original models, browser-playable.';
  if (mode === 'payload') panelDescription.textContent = 'A colorful class-based arena shooter inspired by payload team games. Escort the rattling cart, break through red bots and swap roles: fast Scout, precise Soldier, sturdy Heavy or support Medic.';
  if (mode === 'zombie') panelDescription.textContent = 'A compact 3D survival shooter inspired by classic arena and co-op zombie games. Face five increasingly messy waves of infected bots and keep moving.';
  requestAnimationFrame(loop);
})();