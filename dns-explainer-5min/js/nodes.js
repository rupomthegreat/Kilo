import * as THREE from "three";
import { createNode, MAT_NODE, MAT_PACKET, makeSphere, GROUP } from "./scene.js";

export const NODES = {};

NODES.user = createNode("user", new THREE.Vector3(-8, 0, 0), MAT_NODE, 1.0);
NODES.resolver = createNode("resolver", new THREE.Vector3(0, 0, 6), MAT_NODE, 1.1);
NODES.root = createNode("root", new THREE.Vector3(7, 1, -5), MAT_NODE, 1.7);
NODES.tld = createNode("tld", new THREE.Vector3(-3, -2, -8), MAT_NODE, 1.25);
NODES.auth = createNode("auth", new THREE.Vector3(8, -1, 9), MAT_NODE, 1.35);

// Glowing packet group (added to scene by animation module)
export const PACKET_GROUP = new THREE.Group();
const packetBody = makeSphere(0.24, MAT_PACKET);
PACKET_GROUP.add(packetBody);
const packetLight = new THREE.PointLight(0x38bdf8, 4, 10);
packetLight.position.set(0, 0, 0);
PACKET_GROUP.add(packetLight);
PACKET_GROUP.visible = false;

export function getPacket() {
  return PACKET_GROUP;
}
