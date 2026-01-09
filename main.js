import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* ESCENA */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

/* CÁMARA */
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

/* PLAYER */
const player = new THREE.Object3D();
player.position.set(0, 1.8, 5);
scene.add(player);
player.add(camera);
camera.position.set(0, 1.62, 0);

/* RENDER */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* LUCES */
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

/* TEXTURAS */
const loader = new THREE.TextureLoader();
const textures = {
  grass: loader.load("textures/grass.png"),
  dirt: loader.load("textures/dirt.png"),
  stone: loader.load("textures/stone.png"),
  wood: loader.load("textures/wood.png"),
  planks: loader.load("textures/planks.png") // 🟫 NUEVO
};

Object.values(textures).forEach(t => {
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
});

/* BLOQUES */
const blocks = [];
const geometry = new THREE.BoxGeometry(1, 1, 1);

function createBlock(x, y, z, type) {
  const mat = new THREE.MeshLambertMaterial({ map: textures[type] });
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z);
  mesh.userData.type = type;
  scene.add(mesh);
  blocks.push(mesh);
}

/* MUNDO */
for (let x = -10; x <= 10; x++) {
  for (let z = -10; z <= 10; z++) {
    createBlock(x, 0, z, "grass");
    createBlock(x, -1, z, "dirt");
  }
}

/* 🌳 árbol + planks de prueba */
createBlock(3, 1, 3, "wood");
createBlock(3, 2, 3, "wood");
createBlock(3, 3, 3, "wood");

createBlock(5, 1, 5, "planks");
createBlock(6, 1, 5, "planks");
createBlock(5, 1, 6, "planks");
createBlock(6, 1, 6, "planks");

/* =========================
   CONTROLES FPS
========================= */
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

let yaw = 0;
let pitch = 0;

document.body.addEventListener("click", () => {
  document.body.requestPointerLock();
});

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement !== document.body) return;

  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;

  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

  player.rotation.y = yaw;
  camera.rotation.x = pitch;
});

/* =========================
   MOVIMIENTO (VOLAR)
========================= */
function movePlayer() {
  const speed = 0.12;

  const forward = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(player.quaternion)
    .normalize();

  const right = new THREE.Vector3(1, 0, 0)
    .applyQuaternion(player.quaternion)
    .normalize();

  if (keys["KeyW"]) player.position.addScaledVector(forward, speed);
  if (keys["KeyS"]) player.position.addScaledVector(forward, -speed);
  if (keys["KeyA"]) player.position.addScaledVector(right, -speed);
  if (keys["KeyD"]) player.position.addScaledVector(right, speed);

  if (keys["Space"]) player.position.y += speed;
  if (keys["ShiftLeft"]) player.position.y -= speed;
}

/* =========================
   PICK BLOCK / COLOCAR
========================= */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0);

let selectedBlock = "stone";

window.addEventListener("mousedown", e => {
  if (document.pointerLockElement !== document.body) return;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(blocks);
  if (!hits.length) return;

  const hit = hits[0];

  if (e.button === 0) {
    scene.remove(hit.object);
    blocks.splice(blocks.indexOf(hit.object), 1);
  }

  if (e.button === 1) {
    selectedBlock = hit.object.userData.type;
    console.log("Seleccionado:", selectedBlock);
  }

  if (e.button === 2) {
    const p = hit.object.position;
    const n = hit.face.normal;
    createBlock(
      p.x + n.x,
      p.y + n.y,
      p.z + n.z,
      selectedBlock
    );
  }
});

window.addEventListener("contextmenu", e => e.preventDefault());

/* LOOP */
function animate() {
  requestAnimationFrame(animate);
  movePlayer();
  renderer.render(scene, camera);
}
animate();

/* RESIZE */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
