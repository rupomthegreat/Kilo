// Animation registry — add new entries here; index.html reads this automatically.
// desc must be exactly 10 words.
const ANIMATIONS = [
  {
    id: "dns-explainer-5min",
    name: "How DNS Works",
    path: "dns-explainer-5min/index.html",
    desc: "Five minute deterministic 3D DNS explainer built with Three.js GSAP.",
    tags: ["dns", "networking", "explainer", "threejs", "gsap"],
  },
];

window.ANIMATIONS = ANIMATIONS;
