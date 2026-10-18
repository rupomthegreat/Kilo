import * as THREE from "three";
import { gsap } from "gsap";
import { SCENE, CAMERA, RENDERER, GROUP, MAT_NODE, MAT_NODE_ACTIVE, MAT_PACKET, MAT_LINE, worldPos, project, render } from "./scene.js";
import { NODES, PACKET_GROUP, getPacket } from "./nodes.js";

// Add packet to scene
SCENE.add(PACKET_GROUP);

// Text overlay refs
const LBL_MAIN = document.getElementById("lbl-main");
const LBL_SUB = document.getElementById("lbl-sub");
const PROGRESS = document.getElementById("progress");
const TIMECODE = document.getElementById("timecode");

// Lines between nodes
const LINES = {};
function makeLine(a, b) {
  const geo = new THREE.BufferGeometry().setFromPoints([a.clone(), b.clone()]);
  const line = new THREE.LineSegments(geo, MAT_LINE);
  line.frustumCulled = false;
  return line;
}
function addLine(name, aObj, bObj) {
  const line = makeLine(worldPos(aObj), worldPos(bObj));
  GROUP.add(line);
  LINES[name] = line;
  return line;
}

addLine("user-resolver", NODES.user.root, NODES.resolver.root);
addLine("resolver-root", NODES.resolver.root, NODES.root.root);
addLine("root-tld", NODES.root.root, NODES.tld.root);
addLine("tld-auth", NODES.tld.root, NODES.auth.root);
addLine("auth-resolver", NODES.auth.root, NODES.resolver.root);
addLine("resolver-user", NODES.resolver.root, NODES.user.root);
addLine("user-auth", NODES.user.root, NODES.auth.root);

Object.values(LINES).forEach((l) => (l.visible = false));

// Update line endpoints to current world positions each frame
function updateLines() {
  const pairs = {
    "user-resolver": [NODES.user.root, NODES.resolver.root],
    "resolver-root": [NODES.resolver.root, NODES.root.root],
    "root-tld": [NODES.root.root, NODES.tld.root],
    "tld-auth": [NODES.tld.root, NODES.auth.root],
    "auth-resolver": [NODES.auth.root, NODES.resolver.root],
    "resolver-user": [NODES.resolver.root, NODES.user.root],
    "user-auth": [NODES.user.root, NODES.auth.root],
  };
  Object.entries(pairs).forEach(([name, [a, b]]) => {
    const line = LINES[name];
    if (!line) return;
    const pa = worldPos(a);
    const pb = worldPos(b);
    line.geometry.setFromPoints([pa, pb]);
    line.geometry.attributes.position.needsUpdate = true;
  });
}

// ---------- Deterministic timeline (300 seconds) ----------
export const DUR = 300;
export const TL = gsap.timeline({ paused: true, smoothChildTiming: true });

function showLineAt(time, name) {
  TL.to({}, { duration: 0, onStart: () => { LINES[name].visible = true; } }, time);
}
function hideLineAt(time, name) {
  TL.to({}, { duration: 0, onStart: () => { LINES[name].visible = false; } }, time);
}

function setLabel(main, sub, t, hold = 5) {
  TL.to({}, {
    duration: 0,
    onStart: () => {
      LBL_MAIN.textContent = main;
      LBL_SUB.textContent = sub || "";
      LBL_MAIN.classList.add("show");
      if (LBL_SUB) LBL_SUB.classList.add("show");
    },
  }, t);
  TL.to({}, {
    duration: 0,
    onStart: () => {
      LBL_MAIN.classList.remove("show");
      if (LBL_SUB) LBL_SUB.classList.remove("show");
    },
  }, t + hold);
}

function camTo(pos, target, t, dur, ease = "power2.inOut") {
  const lookAtTarget = new THREE.Vector3(target.x, target.y, target.z);
  TL.to(CAMERA.position, {
    duration: dur,
    x: pos.x,
    y: pos.y,
    z: pos.z,
    ease,
    onUpdate: () => {
      CAMERA.lookAt(lookAtTarget);
      CAMERA.updateMatrixWorld();
    },
  }, t);
}

function pulseNode(name, t, dur = 0.8) {
  const body = NODES[name].body;
  const dot = NODES[name].dot;
  TL.to(body.scale, { duration: dur * 0.35, x: 1.3, y: 1.3, z: 1.3, ease: "power2.out" }, t);
  TL.to(body.scale, { duration: dur * 0.35, x: 1, y: 1, z: 1, ease: "power2.in" }, t + dur * 0.35);
  TL.to(body.material, { duration: dur, emissiveIntensity: 1.4, ease: "power2.inOut" }, t);
  TL.to(body.material, { duration: dur, emissiveIntensity: 0.6 }, t + dur);
  TL.to(dot.material, { duration: dur * 0.5, emissiveIntensity: 2.5, ease: "power2.out" }, t);
  TL.to(dot.material, { duration: dur * 0.5, emissiveIntensity: 0.5 }, t + dur * 0.5);
}

function movePacket(fromObj, toObj, startTime, dur) {
  const p0 = { x: fromObj.position.x, y: fromObj.position.y, z: fromObj.position.z };
  const p1 = { x: toObj.position.x, y: toObj.position.y, z: toObj.position.z };
  const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 + 1.6, z: (p0.z + p1.z) / 2 };
  TL.to(PACKET_GROUP.position, {
    duration: dur,
    bezier: { type: "cubic", values: [p0, mid, mid, p1] },
    ease: "power2.inOut",
  }, startTime);
  TL.to(PACKET_GROUP.scale, { duration: dur * 0.25, x: 1.6, y: 1.6, z: 1.6, yoyo: true, repeat: 1, ease: "power2.inOut" }, startTime);
}

function showPacket(t) {
  TL.to({}, { duration: 0, onStart: () => { PACKET_GROUP.visible = true; } }, t);
}
function hidePacket(t) {
  TL.to({}, { duration: 0, onStart: () => { PACKET_GROUP.visible = false; } }, t);
}

// ================= BUILD 300s TIMELINE =================

// 0-45 Hook: User types sysminu.com
camTo(new THREE.Vector3(-8, 3, 7), NODES.user.root.position, 0, 2.5);
setLabel("Typing \"sysminu.com\"", "User initiates a DNS query", 0, 44);
pulseNode("user", 1, 1);
TL.to(NODES.user.dot.material, { duration: 0.5, emissiveIntensity: 3, emissive: 0x22c55e }, 1);
TL.to(NODES.user.dot.material, { duration: 0.5, emissiveIntensity: 0.5, emissive: 0x6b7280 }, 2);

// 45-90 The Request: packet user -> resolver
showPacket(45);
TL.set(PACKET_GROUP.position, {
  x: NODES.user.root.position.x,
  y: NODES.user.root.position.y,
  z: NODES.user.root.position.z,
}, 45);
movePacket(NODES.user.root, NODES.resolver.root, 47, 3);
setLabel("The Request", "Query packet travels to the Resolver", 45, 44);
camTo(new THREE.Vector3(-4, 2, 11), new THREE.Vector3(-4, 0, 3), 45, 4);
pulseNode("resolver", 52, 1);
showLineAt(50, "user-resolver");

// 90-135 Root Server: resolver -> root
movePacket(NODES.resolver.root, NODES.root.root, 92, 3.5);
setLabel("The Root Server", "Resolver asks the Root for the .com TLD", 90, 44);
camTo(new THREE.Vector3(10, 5, -2), NODES.root.root.position, 90, 4.5);
pulseNode("root", 96, 1.2);
showLineAt(93, "resolver-root");

// 135-180 TLD Server: root -> .com TLD
movePacket(NODES.root.root, NODES.tld.root, 137, 3.5);
setLabel("The TLD Server (.com)", "Root points to the .com TLD server", 135, 44);
camTo(new THREE.Vector3(0, -6, -11), NODES.tld.root.position, 135, 4.5);
pulseNode("tld", 141, 1.2);
showLineAt(138, "root-tld");

// 180-225 Authoritative: TLD -> auth, IP revealed
movePacket(NODES.tld.root, NODES.auth.root, 182, 3.5);
setLabel("Authoritative Server", "TLD returns sysminu.com → 198.51.100.42", 180, 44);
camTo(new THREE.Vector3(10, 1, 11), NODES.auth.root.position, 180, 4.5);
pulseNode("auth", 186, 1.2);
showLineAt(183, "tld-auth");

// 225-270 The Return: IP travels back auth -> resolver -> user
TL.set(PACKET_GROUP.position, {
  x: NODES.auth.root.position.x,
  y: NODES.auth.root.position.y,
  z: NODES.auth.root.position.z,
}, 225);
movePacket(NODES.auth.root, NODES.resolver.root, 227, 3);
movePacket(NODES.resolver.root, NODES.user.root, 230, 3);
setLabel("The Return", "IP address travels back: Resolver → User", 225, 44);
pulseNode("user", 234, 1);
showLineAt(228, "auth-resolver");
showLineAt(231, "resolver-user");
camTo(new THREE.Vector3(-6, 3, 8), new THREE.Vector3(-3, 0, 3), 225, 4);

// 270-300 Resolution: user <-> auth connected, full diagram
TL.to({}, { duration: 0, onStart: () => { Object.values(LINES).forEach((l) => (l.visible = true)); } }, 270);
setLabel("Connection Established", "sysminu.com resolved — browser connects", 270, 29);
pulseNode("auth", 274, 1);
pulseNode("user", 274, 1);
camTo(new THREE.Vector3(0, 8, 30), new THREE.Vector3(0, 0, 0), 270, 6);

// Hold end
TL.to({}, { duration: 0 }, 300);

// ---------- Expose seek API ----------
window.__timelines = [TL];
window.__duration = DUR;
window.__seek = async (t) => {
  t = Math.max(0, Math.min(DUR, t));
  TL.pause();
  TL.time(t);
  updateLines();
  render();
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => requestAnimationFrame(r));
  render();
  updateUI(t);
};

// ---------- UI / playback ----------
let started = false;
let rafId;
function updateUI(t) {
  if (PROGRESS) PROGRESS.style.width = (t / DUR) * 100 + "%";
  if (TIMECODE) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    TIMECODE.textContent = `${m}:${String(s).padStart(2, "0")}`;
  }
}
function loop() {
  if (!TL.paused()) {
    const t = TL.time();
    updateUI(t);
    updateLines();
  }
  render();
  rafId = requestAnimationFrame(loop);
}
function start() {
  if (started) return;
  started = true;
  TL.play();
}
window.addEventListener("pointerdown", start, { once: true });
window.addEventListener("keydown", start, { once: true });
setTimeout(start, 1200);

// Initial
TL.pause();
TL.time(0);
CAMERA.lookAt(new THREE.Vector3(0, 0, 0));
CAMERA.updateMatrixWorld();
updateLines();
render();
updateUI(0);
loop();

window.addEventListener("resize", () => {
  CAMERA.aspect = window.innerWidth / window.innerHeight;
  CAMERA.updateProjectionMatrix();
  RENDERER.setSize(window.innerWidth, window.innerHeight);
  render();
});
