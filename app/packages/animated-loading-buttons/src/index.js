const definitions = [
  ["fibonacci-breather", "Fibonacci Breather", "webgl", "Analytic WebGL2 Fibonacci micro-beads", "Gathering", () => import("./third-party/designs/01-fibonacci-breather.js")],
  ["glass-tide-lens", "Glass Tide Lens", "webgl", "Analytic liquid SDF and delayed refraction", "Focusing", () => import("./third-party/designs/02-glass-tide-lens.js")],
  ["binary-metaball-mitosis", "Binary Metaball Mitosis", "webgl", "WebGL2 analytic SDF mitosis", "Merging", () => import("./third-party/designs/03-binary-metaball-mitosis.js")],
  ["curl-field-comet", "Curl-Field Comet", "webgl", "WebGL2 divergence-free curl advection", "Drifting", () => import("./third-party/designs/04-curl-field-comet.js")],
  ["living-reaction-seed", "Living Reaction Seed", "webgl", "Analytic WebGL2 reaction surface and embossed starvation front", "Growing", () => import("./third-party/designs/05-living-reaction-seed.js")],
  ["chladni-whisper", "Chladni Whisper", "webgl", "WebGL2 standing-wave membrane", "Tuning", () => import("./third-party/designs/06-chladni-whisper.js")],
  ["topology-courier", "Topology Courier", "webgl", "WebGL2 wave-delayed 420-point correspondence", "Mapping", () => import("./third-party/designs/07-topology-courier.js")],
  ["meridian-loom", "Meridian Loom", "webgl", "Analytic WebGL2 woven longitude ribbons", "Weaving", () => import("./third-party/designs/08-meridian-loom.js")],
  ["voronoi-lantern", "Voronoi Lantern", "webgl", "Analytic spherical Voronoi shader", "Shaping", () => import("./third-party/designs/09-voronoi-lantern.js")],
  ["event-horizon-pulse", "Event-Horizon Pulse", "webgl", "Analytic SDF void and polar lensing", "Pulsing", () => import("./third-party/designs/10-event-horizon-pulse.js")],
  ["prismatic-caustic-coin", "Prismatic Caustic Coin", "webgl", "Analytic rigid-cylinder transmission and three-IOR caustics", "Polishing", () => import("./third-party/designs/11-prismatic-caustic-coin.js")],
  ["voxel-assembly-line", "Voxel Assembly Line", "webgl", "Analytic WebGL2 64-cube sheet assembly", "Building", () => import("./third-party/designs/12-voxel-assembly-line.js")],
  ["strange-attractor-scribe", "Strange-Attractor Scribe", "webgl", "Precomputed Lorenz phase-space stroke", "Tracing", () => import("./third-party/designs/13-strange-attractor-scribe.js")],
  ["conic-eclipse", "Conic Eclipse", "dom", "Masked conic-gradient occlusion", "Aligning", () => import("./third-party/designs/14-conic-eclipse.js")],
  ["orbital-calligraphy", "Orbital Calligraphy", "svg", "Bézier dash calligraphy", "Writing", () => import("./third-party/designs/15-orbital-calligraphy.js")],
  ["mercury-relay", "Mercury Relay", "svg", "Five-circle alpha-threshold relay", "Relaying", () => import("./third-party/designs/16-mercury-relay.js")],
  ["noise-chrysalis", "Noise Chrysalis", "svg", "Bounded turbulence-displaced membrane", "Forming", () => import("./third-party/designs/17-noise-chrysalis.js")],
  ["contour-choir", "Contour Choir", "svg", "Phase-reversed organic contour canon", "Syncing", () => import("./third-party/designs/18-contour-choir.js")],
  ["shapeshifter-seal", "Shapeshifter Seal", "svg", "Normalized four-emblem path interpolation", "Morphing", () => import("./third-party/designs/19-shapeshifter-seal.js")],
  ["murmuration-turn", "Murmuration Turn", "canvas", "Deterministic 26-boid reversal wave", "Turning", () => import("./third-party/designs/20-murmuration-turn.js")],
  ["frostwork-growth", "Frostwork Growth", "canvas", "Precomputed fractal accretion", "Freezing", () => import("./third-party/designs/21-frostwork-growth.js")],
  ["sandpile-bloom", "Sandpile Bloom", "canvas", "Precomputed 13 x 13 sandpile automaton", "Settling", () => import("./third-party/designs/22-sandpile-bloom.js")],
  ["elastic-cartography", "Elastic Cartography", "canvas", "Analytic spring-mesh relief", "Adjusting", () => import("./third-party/designs/23-elastic-cartography.js")],
  ["mechanical-iris", "Mechanical Iris", "svg", "Six-lamella hinged aperture", "Opening", () => import("./third-party/designs/24-mechanical-iris.js")],
  ["braille-flipwave", "Braille Flipwave", "dom", "Authored 3D dot-matrix flip choreography", "Flipping", () => import("./third-party/designs/25-braille-flipwave.js")],
];

export const loaderDesigns = Object.freeze(
  definitions.map(([id, name, kind, technique, label]) =>
    Object.freeze({ id, name, kind, technique, label })
  ),
);
export const loaderDesignIds = Object.freeze(
  loaderDesigns.map((design) => design.id),
);

const loadersById = new Map(
  definitions.map(([id, , , , , load]) => [id, load]),
);

export async function loadLoaderDesign(id) {
  const load = loadersById.get(id);
  if (!load) {
    throw new Error(`未登録のローダーアニメーションです: ${id}`);
  }
  const module = await load();
  return module.default;
}
