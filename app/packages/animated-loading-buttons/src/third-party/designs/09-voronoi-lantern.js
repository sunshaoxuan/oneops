import { createShaderVisual } from "../core/webgl.js";

const LOOP_SECONDS = 3.7;

const FRAGMENT = /* glsl */ `
const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;
const int CELL_COUNT = 24;

float ease(float value) {
  value = clamp(value, 0.0, 1.0);
  return value * value * (3.0 - 2.0 * value);
}

float easeBetween(float a, float b, float value) {
  return ease((value - a) / max(b - a, 0.0001));
}

vec3 cellDirection(int index) {
  float fi = float(index);
  float y = 1.0 - 2.0 * (fi + 0.5) / float(CELL_COUNT);
  float ring = sqrt(max(0.0, 1.0 - y * y));
  float angle = fi * 2.399963229728653;
  return vec3(cos(angle) * ring, y, sin(angle) * ring);
}

vec3 rotateX(vec3 point, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec3(point.x, c * point.y - s * point.z, s * point.y + c * point.z);
}

vec3 rotateY(vec3 point, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec3(c * point.x + s * point.z, point.y, -s * point.x + c * point.z);
}

vec3 toObject(vec3 worldNormal, float yaw, float pitch) {
  return rotateX(rotateY(worldNormal, -yaw), -pitch);
}

vec3 toWorld(vec3 objectNormal, float yaw, float pitch) {
  return rotateY(rotateX(objectNormal, pitch), yaw);
}

void nearestCell(vec3 direction, out float cellId, out vec3 faceDirection, out float edgeGap) {
  float best = -2.0;
  float second = -2.0;
  cellId = 0.0;
  faceDirection = cellDirection(0);

  for (int i = 0; i < CELL_COUNT; i++) {
    vec3 candidate = cellDirection(i);
    float score = dot(direction, candidate);
    if (score > best) {
      second = best;
      best = score;
      cellId = float(i);
      faceDirection = candidate;
    } else if (score > second) {
      second = score;
    }
  }

  edgeGap = max(0.0, best - second);
}

float plateMotion(float phase, float delay) {
  float local = phase - 0.255 - delay;
  float rise = easeBetween(0.0, 0.105, local);
  float magneticDrop = 1.0 - easeBetween(0.275, 0.355, local);
  float reboundPhase = clamp((local - 0.355) / 0.155, 0.0, 1.0);
  float reboundWindow = step(0.355, local) * (1.0 - step(0.510, local));
  float rebound = 0.13 * sin(PI * reboundPhase) * reboundWindow;
  return clamp(rise * magneticDrop + rebound, 0.0, 1.0);
}

float selected(float cellId, float target) {
  return 1.0 - step(0.25, abs(cellId - target));
}

vec3 facetColor(
  float cellId,
  vec3 faceDirection,
  float edgeGap,
  float phase,
  float yaw,
  float pitch,
  float lifted
) {
  vec3 source = cellDirection(6);
  float geodesic = acos(clamp(dot(faceDirection, source), -1.0, 1.0)) / PI;
  float ignition = 0.055 + geodesic * 0.40;
  float darkening = 0.515 + geodesic * 0.28;
  float lit = easeBetween(ignition, ignition + 0.062, phase)
    * (1.0 - easeBetween(darkening, darkening + 0.072, phase));
  float front = exp(-pow((phase - ignition) / 0.050, 2.0))
    * (1.0 - easeBetween(darkening, darkening + 0.04, phase));

  vec3 worldFace = toWorld(faceDirection, yaw, pitch);
  vec3 lightDirection = normalize(vec3(-0.62, 0.78, 1.15));
  float lambert = 0.36 + 0.64 * max(0.0, dot(worldFace, lightDirection));
  float facetVariation = 0.92 + 0.07 * sin(cellId * 2.13 + 0.7);
  vec3 graphite = vec3(0.205, 0.210, 0.225) * (0.74 + 0.47 * lambert) * facetVariation;
  vec3 lilacGray = vec3(0.784, 0.769, 0.820);
  vec3 pearl = vec3(0.955, 0.945, 0.970);
  vec3 color = mix(graphite, lilacGray * (0.82 + 0.18 * lambert), 0.78 * lit);
  color = mix(color, pearl, 0.20 * front * lit + 0.08 * lifted);

  float seamWidth = max(fwidth(edgeGap) * 0.62, 0.006);
  float seam = 1.0 - smoothstep(0.0, seamWidth, edgeGap);
  color = mix(color, pearl, seam * (0.22 + 0.13 * lit));
  return color;
}

vec4 liftedPlate(
  vec2 uv,
  float radius,
  float phase,
  float yaw,
  float pitch,
  float target,
  float lift
) {
  vec3 plateWorld = toWorld(cellDirection(int(target + 0.5)), yaw, pitch);
  vec2 outward = normalize(plateWorld.xy + vec2(0.0001));
  vec2 sampleUv = uv - outward * (0.066 * lift);
  float radial = length(sampleUv);
  float aa = max(fwidth(radial), 0.003);
  float sphereAlpha = 1.0 - smoothstep(radius - aa, radius + aa, radial);
  vec2 sphereUv = sampleUv / radius;
  vec3 worldNormal = vec3(sphereUv, sqrt(max(0.0, 1.0 - dot(sphereUv, sphereUv))));
  vec3 objectNormal = toObject(worldNormal, yaw, pitch);
  float cellId;
  vec3 faceDirection;
  float edgeGap;
  nearestCell(objectNormal, cellId, faceDirection, edgeGap);
  float belongs = selected(cellId, target);
  float plateEdge = smoothstep(0.0, max(fwidth(edgeGap) * 0.46, 0.004), edgeGap);
  float alpha = sphereAlpha * belongs * plateEdge * (0.86 + 0.08 * lift);
  vec3 color = facetColor(cellId, faceDirection, edgeGap, phase, yaw, pitch, lift);
  return vec4(color, alpha);
}

vec4 over(vec4 under, vec4 top) {
  float alpha = top.a + under.a * (1.0 - top.a);
  vec3 color = (top.rgb * top.a + under.rgb * under.a * (1.0 - top.a))
    / max(alpha, 0.0001);
  return vec4(color, alpha);
}

vec4 shade(vec2 uv, float timeSeconds, float seed) {
  float phase = fract(timeSeconds / ${LOOP_SECONDS.toFixed(1)});
  float yaw = 0.085 * sin(TAU * phase + seed * 0.013);
  float pitch = 0.040 * (sin(TAU * phase + 1.15) - sin(1.15));
  float crossing = sin(PI * easeBetween(0.10, 0.70, phase));
  float radius = 0.755 * (1.0 + 0.035 * crossing);
  float radial = length(uv);
  float aa = max(fwidth(radial), 0.003);
  float sphereAlpha = 1.0 - smoothstep(radius - aa, radius + aa, radial);
  vec2 sphereUv = uv / radius;
  vec3 worldNormal = vec3(sphereUv, sqrt(max(0.0, 1.0 - dot(sphereUv, sphereUv))));
  vec3 objectNormal = toObject(worldNormal, yaw, pitch);
  float cellId;
  vec3 faceDirection;
  float edgeGap;
  nearestCell(objectNormal, cellId, faceDirection, edgeGap);

  float liftA = plateMotion(phase, 0.000);
  float liftB = plateMotion(phase, 0.045);
  float liftC = plateMotion(phase, 0.090);
  float localLift = selected(cellId, 3.0) * liftA
    + selected(cellId, 11.0) * liftB
    + selected(cellId, 14.0) * liftC;
  vec3 baseColor = facetColor(cellId, faceDirection, edgeGap, phase, yaw, pitch, 0.0);
  vec3 socket = vec3(0.105, 0.108, 0.120);
  baseColor = mix(baseColor, socket, 0.68 * localLift);
  vec4 result = vec4(baseColor, sphereAlpha * 0.88);

  result = over(result, liftedPlate(uv, radius, phase, yaw, pitch, 3.0, liftA));
  result = over(result, liftedPlate(uv, radius, phase, yaw, pitch, 11.0, liftB));
  result = over(result, liftedPlate(uv, radius, phase, yaw, pitch, 14.0, liftC));
  return result;
}
`;

const FALLBACK_SITES = [
  [-0.18, -0.72], [0.37, -0.63], [-0.65, -0.42], [0.02, -0.31],
  [0.66, -0.20], [-0.77, 0.08], [-0.34, 0.13], [0.26, 0.10],
  [0.73, 0.31], [-0.54, 0.55], [-0.05, 0.65], [0.48, 0.63],
];

function clipCell(polygon, site, neighbor) {
  const nx = neighbor[0] - site[0];
  const ny = neighbor[1] - site[1];
  const boundary = (neighbor[0] ** 2 + neighbor[1] ** 2 - site[0] ** 2 - site[1] ** 2) / 2;
  const result = [];

  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const currentDistance = current[0] * nx + current[1] * ny - boundary;
    const nextDistance = next[0] * nx + next[1] * ny - boundary;
    const currentInside = currentDistance <= 0;
    const nextInside = nextDistance <= 0;
    if (currentInside) result.push(current);
    if (currentInside !== nextInside) {
      const amount = currentDistance / (currentDistance - nextDistance);
      result.push([
        current[0] + (next[0] - current[0]) * amount,
        current[1] + (next[1] - current[1]) * amount,
      ]);
    }
  }
  return result;
}

const FALLBACK_CELLS = FALLBACK_SITES.map((site, siteIndex) => {
  let polygon = [[-1.2, -1.2], [1.2, -1.2], [1.2, 1.2], [-1.2, 1.2]];
  FALLBACK_SITES.forEach((neighbor, neighborIndex) => {
    if (siteIndex !== neighborIndex) polygon = clipCell(polygon, site, neighbor);
  });
  return polygon;
});

const PLATE_DELAYS = new Map([[1, 0], [7, 0.045], [9, 0.09]]);

function ease(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function plateMotion(phase, delay) {
  const local = phase - 0.255 - delay;
  const rise = ease(local / 0.105);
  const drop = 1 - ease((local - 0.275) / 0.08);
  const reboundPhase = Math.max(0, Math.min(1, (local - 0.355) / 0.155));
  const rebound = local >= 0.355 && local < 0.51 ? 0.13 * Math.sin(Math.PI * reboundPhase) : 0;
  return Math.max(0, Math.min(1, rise * drop + rebound));
}

function mixChannel(a, b, amount) {
  return Math.round(a + (b - a) * amount);
}

function fallback(ctx, timeSeconds, _deltaSeconds, width, height) {
  const phase = ((timeSeconds / LOOP_SECONDS) % 1 + 1) % 1;
  const crossing = Math.sin(Math.PI * ease((phase - 0.10) / 0.60));
  const radius = Math.min(width, height) * 0.378 * (1 + 0.035 * crossing);
  const centerX = width / 2;
  const centerY = height / 2;
  const source = FALLBACK_SITES[3];

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(radius, radius);
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "rgba(27, 28, 32, 0.84)";
  ctx.fillRect(-1.05, -1.05, 2.1, 2.1);

  FALLBACK_CELLS.forEach((polygon, index) => {
    const site = FALLBACK_SITES[index];
    const geodesic = Math.min(1, Math.hypot(site[0] - source[0], site[1] - source[1]) / 1.65);
    const ignition = 0.055 + geodesic * 0.40;
    const darkening = 0.515 + geodesic * 0.28;
    const lit = ease((phase - ignition) / 0.062) * (1 - ease((phase - darkening) / 0.072));
    const light = Math.max(0.45, 0.84 - site[0] * 0.14 - site[1] * 0.12);
    const graphite = [47 * light, 48 * light, 53 * light];
    const lilac = [200, 196, 209];
    const fill = `rgb(${mixChannel(graphite[0], lilac[0], lit * 0.78)}, ${mixChannel(graphite[1], lilac[1], lit * 0.78)}, ${mixChannel(graphite[2], lilac[2], lit * 0.78)})`;
    const delay = PLATE_DELAYS.get(index);
    const lift = delay === undefined ? 0 : plateMotion(phase, delay);
    const length = Math.hypot(site[0], site[1]) || 1;

    if (lift > 0) {
      ctx.save();
      ctx.beginPath();
      polygon.forEach((point, pointIndex) => pointIndex === 0 ? ctx.moveTo(...point) : ctx.lineTo(...point));
      ctx.closePath();
      ctx.fillStyle = `rgba(18, 18, 22, ${0.55 * lift})`;
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate((site[0] / length) * lift / radius, (site[1] / length) * lift / radius);
    ctx.beginPath();
    polygon.forEach((point, pointIndex) => pointIndex === 0 ? ctx.moveTo(...point) : ctx.lineTo(...point));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = `rgba(244, 241, 247, ${0.22 + lit * 0.14})`;
    ctx.lineWidth = 0.035;
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

export default {
  id: "voronoi-lantern",
  name: "Voronoi Lantern",
  kind: "webgl",
  technique: "Analytic spherical Voronoi shader",
  label: "Shaping",
  mount(container) {
    return createShaderVisual(container, {
      name: "Voronoi Lantern",
      seed: 9,
      fragment: FRAGMENT,
      fallback,
      maxDpr: 3,
    });
  },
};
