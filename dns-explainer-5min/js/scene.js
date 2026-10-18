import * as THREE from "three";

export const SCENE = new THREE.Scene();
SCENE.background = new THREE.Color(0x0a0a14);
SCENE.fog = new THREE.FogExp2(0x0a0a14, 0.012);

export const CAMERA = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 400);
CAMERA.position.set(0, 0, 24);

export const RENDERER = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
RENDERER.setSize(window.innerWidth, window.innerHeight);
RENDERER.setPixelRatio(Math.min(window.devicePixelRatio, 2));
RENDERER.toneMapping = THREE.ACESFilmicToneMapping;
RENDERER.toneMappingExposure = 1.15;

export const GROUP = new THREE.Group();
SCENE.add(GROUP);

// Lighting: key + rim + ambient + accent
const AMBIENT = new THREE.AmbientLight(0xffffff, 0.6);
SCENE.add(AMBIENT);

// Debug helpers so the scene is never completely blank
SCENE.add(new THREE.GridHelper(100, 50, 0x444455, 0x222233));
SCENE.add(new THREE.AxesHelper(12));

const KEY = new THREE.DirectionalLight(0xffffff, 1.7);
KEY.position.set(9, 7, 5);
SCENE.add(KEY);

const RIM = new THREE.DirectionalLight(0x38bdf8, 1.1);
RIM.position.set(-7, 2, -7);
SCENE.add(RIM);

const FILL = new THREE.PointLight(0xa855f7, 2.2, 24);
FILL.position.set(0, 5, 3);
SCENE.add(FILL);

// Materials
export const MAT_NODE = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.45, metalness: 0.35, flatShading: true });
export const MAT_NODE_ACTIVE = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.3, metalness: 0.5, flatShading: true, emissive: 0x22c55e, emissiveIntensity: 0.7 });
export const MAT_PACKET = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.6, flatShading: true, emissive: 0x38bdf8, emissiveIntensity: 1.4 });
export const MAT_LINE = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.3 });

// Geometry helpers
export function makeBox(w, h, d, mat = MAT_NODE) {
  const geo = new THREE.BoxGeometry(w, h, d);
  return new THREE.Mesh(geo, mat);
}
export function makeSphere(r, mat = MAT_NODE, segs = 16) {
  const geo = new THREE.SphereGeometry(r, segs, segs);
  return new THREE.Mesh(geo, mat);
}
export function makeCylinder(rTop, rBot, h, mat = MAT_NODE, segs = 12) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
  return new THREE.Mesh(geo, mat);
}
export function makeTorus(r, tube, mat = MAT_NODE) {
  const geo = new THREE.TorusGeometry(r, tube, 12, 24);
  return new THREE.Mesh(geo, mat);
}

export function createNode(name, pos, bodyMat = MAT_NODE, scale = 1) {
  const root = new THREE.Group();
  root.name = name;
  root.position.copy(pos);

  const body = makeBox(1.5 * scale, 1.5 * scale, 1.5 * scale, bodyMat);
  body.name = name + "-body";
  root.add(body);

  const ring = makeTorus(1.0 * scale, 0.08 * scale, MAT_LINE);
  ring.rotation.x = Math.PI / 2;
  root.add(ring);

  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.14 * scale, 10, 10), bodyMat);
  dot.position.y = 0.9 * scale;
  dot.name = name + "-dot";
  root.add(dot);

  GROUP.add(root);
  return { root, body, dot };
}

export function worldPos(obj) {
  const v = new THREE.Vector3();
  obj.getWorldPosition(v);
  return v;
}

export function project(vector) {
  vector.clone().project(CAMERA);
  const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
  return { x, y };
}

export function render() {
  RENDERER.render(SCENE, CAMERA);
}
