import { createShaderVisual } from "../core/webgl.js";

const LOOP_SECONDS = 4.8;
const FALLBACK_PARTICLES = 72;
const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function fract(value) {
  return value - Math.floor(value);
}

function smoother(edge0, edge1, value) {
  const amount = clamp01((value - edge0) / (edge1 - edge0));
  return amount * amount * amount * (amount * (amount * 6 - 15) + 10);
}

function hash(index, salt = 0) {
  return fract(Math.sin(index * 127.1 + salt * 311.7 + 41.17) * 43758.5453123);
}

function mix(a, b, amount) {
  return a + (b - a) * amount;
}

function mixPoint(a, b, amount) {
  return [mix(a[0], b[0], amount), mix(a[1], b[1], amount)];
}

function normalize(point) {
  const length = Math.hypot(point[0], point[1]) || 1;
  return [point[0] / length, point[1] / length];
}

function rotate(point, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [
    point[0] * cosine - point[1] * sine,
    point[0] * sine + point[1] * cosine,
  ];
}

// This is the analytic curl of a smooth stream function. Its divergence is
// zero, so the small midpoint steps below bend the formation without making
// the particle mass appear to inflate or collapse.
function curlVelocity(point, phase) {
  const ax = 3.1 * point[0] + TAU * phase * 0.17 + 0.37;
  const ay = 2.7 * point[1] - TAU * phase * 0.13 - 0.21;
  const wave = [
    2.7 * Math.sin(ax) * Math.cos(ay),
    -3.1 * Math.cos(ax) * Math.sin(ay),
  ];
  const offset = [point[0] - 0.035, point[1] + 0.015];
  const envelope = Math.exp(-2.8 * (offset[0] ** 2 + offset[1] ** 2));
  const vortex = [-offset[1] * envelope * 2.15, offset[0] * envelope * 2.15];
  return [wave[0] * 0.105 + vortex[0], wave[1] * 0.105 + vortex[1]];
}

function advect(point, phase, amount) {
  let result = point;
  const step = amount * 0.5;

  for (let iteration = 0; iteration < 2; iteration += 1) {
    const first = curlVelocity(result, phase);
    const midpoint = [result[0] + first[0] * step * 0.5, result[1] + first[1] * step * 0.5];
    const velocity = curlVelocity(midpoint, phase);
    result = [result[0] + velocity[0] * step, result[1] + velocity[1] * step];
  }

  return result;
}

function seedPosition(index, phase, count) {
  const order = (index + 0.5) / count;
  const angle = index * GOLDEN_ANGLE + TAU * phase;
  const breath = 1 + 0.055 * Math.sin(TAU * phase);
  const radius = (0.045 + 0.145 * Math.sqrt(order)) * breath;
  const center = [
    -0.1 + 0.014 * Math.cos(TAU * phase),
    0.012 * Math.sin(TAU * phase),
  ];

  return [
    center[0] + Math.cos(angle) * radius,
    center[1] + Math.sin(angle) * radius * 0.84,
  ];
}

function filamentPosition(index, phase, count) {
  const order = (index + 0.5) / count;
  const travel = smoother(0.075, 0.37, phase);
  const along = clamp01(travel * 1.22 - order * 0.9);
  const irregularity = hash(index, 1) - 0.5;
  const point = [
    -0.1 + 0.93 * along - 0.48 * along * along,
    0.31 * Math.sin(Math.PI * along) - 0.22 * along +
      0.022 * Math.sin(TAU * along + irregularity * 1.8) * along,
  ];
  const tangent = normalize([
    0.93 - 0.96 * along,
    0.31 * Math.PI * Math.cos(Math.PI * along) - 0.22 +
      0.022 * TAU * Math.cos(TAU * along + irregularity * 1.8),
  ]);
  const normal = [-tangent[1], tangent[0]];
  const crossStream = irregularity * 0.03 * smoother(0.08, 0.55, along);

  return {
    point: [
      point[0] + normal[0] * crossStream,
      point[1] + normal[1] * crossStream,
    ],
    tangent,
    depth: clamp01(0.47 + 0.24 * Math.sin(Math.PI * along + irregularity * 0.9)),
  };
}

function ringPosition(index, phase, count) {
  const order = (index + 0.5) / count;
  const tubePhase = TAU * hash(index, 2) + TAU * phase * 0.24;
  const spin = 2.55 * (phase - 0.3) + 0.08 * Math.sin(TAU * phase);
  const angle = TAU * (1 - order + 0.18) + spin;
  const tubeRadius = 0.026 + 0.026 * hash(index, 3);
  const radial = 0.49 * (1 + 0.055 * Math.sin(angle * 2 + 0.7)) +
    Math.cos(tubePhase) * tubeRadius;
  const tilt = 0.48;
  const center = [0.025, 0.008];

  return {
    point: [
      center[0] + Math.cos(angle) * radial,
      center[1] +
        Math.sin(angle) * radial * Math.cos(tilt) +
        Math.sin(tubePhase) * tubeRadius * Math.sin(tilt),
    ],
    tangent: normalize([-Math.sin(angle), Math.cos(angle) * Math.cos(tilt)]),
    depth: clamp01(
      0.5 +
      0.42 * Math.sin(angle) * Math.sin(tilt) -
      0.18 * Math.sin(tubePhase) * Math.cos(tilt),
    ),
  };
}

function cometPosition(index, phase, count) {
  const order = (index + 0.5) / count;
  const unwrapped = fract(1 - order + 0.18);
  const headShare = 0.28;
  const head = [0.385, 0.055];

  if (unwrapped < headShare) {
    const local = unwrapped / headShare;
    const radius = 0.032 + 0.118 * Math.sqrt(local);
    const angle = local * TAU * 2.35 + TAU * hash(index, 4) * 0.26;
    return {
      point: [
        head[0] + Math.cos(angle) * radius,
        head[1] + Math.sin(angle) * radius * 0.76,
      ],
      tangent: normalize([-Math.sin(angle), Math.cos(angle) * 0.76]),
      depth: 0.58 + 0.25 * Math.cos(angle),
      age: 0,
    };
  }

  const age = (unwrapped - headShare) / (1 - headShare);
  const x = head[0] - 1.01 * age;
  const y = head[1] + 0.16 * Math.sin(Math.PI * age) - 0.21 * age +
    0.025 * Math.sin(TAU * age);
  const tangent = normalize([
    -1.01,
    0.16 * Math.PI * Math.cos(Math.PI * age) - 0.21 +
      0.025 * TAU * Math.cos(TAU * age),
  ]);
  const normal = [-tangent[1], tangent[0]];
  const width = mix(0.052, 0.012, age);
  const crossStream = (hash(index, 5) - 0.5) * width * 2;

  return {
    point: [x + normal[0] * crossStream, y + normal[1] * crossStream],
    tangent,
    depth: clamp01(0.52 + 0.2 * Math.sin(TAU * unwrapped)),
    age,
  };
}

function particleState(index, phase, count = FALLBACK_PARTICLES) {
  const order = (index + 0.5) / count;
  const seed = seedPosition(index, phase, count);
  const filament = filamentPosition(index, phase, count);
  const ring = ringPosition(index, phase, count);
  const comet = cometPosition(index, phase, count);

  const leak = smoother(0.085 + order * 0.14, 0.18 + order * 0.22, phase);
  const ringFormation = smoother(0.31 + order * 0.05, 0.53 + order * 0.05, phase);
  const unwrapped = fract(1 - order + 0.18);
  const shedding = smoother(0.56 + unwrapped * 0.08, 0.7 + unwrapped * 0.08, phase);
  const home = smoother(
    0.835 + hash(index, 6) * 0.02,
    0.982 + hash(index, 6) * 0.012,
    phase,
  );

  let point = mixPoint(seed, filament.point, leak);
  point = mixPoint(point, ring.point, ringFormation);
  point = mixPoint(point, comet.point, shedding);

  let tangent = mixPoint([0.25, 0.97], filament.tangent, leak);
  tangent = normalize(mixPoint(tangent, ring.tangent, ringFormation));
  tangent = normalize(mixPoint(tangent, comet.tangent, shedding));

  const displacement = [point[0] - seed[0], point[1] - seed[1]];
  const dragTurn = Math.sin(Math.PI * home) * (0.38 + hash(index, 7) * 0.36);
  const curledDisplacement = rotate(displacement, dragTurn);
  const dragScale = (1 - home) ** 1.14;
  point = [seed[0] + curledDisplacement[0] * dragScale, seed[1] + curledDisplacement[1] * dragScale];

  tangent = normalize(mixPoint(tangent, normalize([-displacement[0], -displacement[1]]), home));

  const activeFlow = (1 - home) * smoother(0.075, 0.2, phase);
  point = advect(point, phase, 0.045 * activeFlow * (0.35 + 0.65 * leak));
  const footprint = 1 + 0.24 * activeFlow;
  point = [point[0] * footprint, point[1] * footprint];
  const field = normalize(curlVelocity(point, phase));
  tangent = normalize(mixPoint(tangent, field, activeFlow * 0.2));

  const depthBeforeHome = mix(mix(filament.depth, ring.depth, ringFormation), comet.depth, shedding);
  const depth = mix(depthBeforeHome, 0.62, home);
  const age = comet.age * shedding * (1 - home);
  const accent = smoother(0.8, 0.985, comet.age) * shedding * (1 - home);
  const flow = activeFlow * (0.34 + 0.66 * Math.max(ringFormation, shedding));
  const cometBeat = smoother(0.58, 0.7, phase) * (1 - smoother(0.835, 0.94, phase));
  const headBoost = (1 - smoother(0.24, 0.5, unwrapped)) * cometBeat;

  return { point, tangent, depth, age, accent, flow, cometBeat, headBoost };
}

function drawFallback(context, time, _delta, width, height) {
  const phase = fract(time / LOOP_SECONDS);
  const size = Math.min(width, height);
  const scale = size * 0.5;
  const cx = width * 0.5;
  const cy = height * 0.5;

  context.lineCap = "round";

  // Sparse velocity ghosts make the field direction legible without turning
  // the icon into a blurred brush mark.
  for (let index = 0; index < FALLBACK_PARTICLES; index += 3) {
    const state = particleState(index, phase);
    const trail = size * (0.004 + 0.017 * state.flow) * (1 - state.age * 0.42);
    const x = cx + state.point[0] * scale;
    const y = cy - state.point[1] * scale;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x - state.tangent[0] * trail, y + state.tangent[1] * trail);
    context.strokeStyle = `rgba(61, 65, 65, ${0.025 + state.flow * 0.07})`;
    context.lineWidth = Math.max(0.22, size * 0.0052 * (0.72 + state.depth * 0.28));
    context.stroke();
  }

  // Two depth passes keep the ring hollow and the comet head dimensional.
  for (let pass = 0; pass < 2; pass += 1) {
    for (let index = 0; index < FALLBACK_PARTICLES; index += 1) {
      const state = particleState(index, phase);
      const front = state.depth >= 0.5;
      if ((pass === 1) !== front) continue;

      const x = cx + state.point[0] * scale;
      const y = cy - state.point[1] * scale;
      const identity = 0.42 + 0.58 * hash(index, 8) ** 1.7;
      const radius = size * (0.0055 + 0.0072 * state.depth) *
        (0.76 + 0.28 * hash(index, 9)) * (1 - state.age * 0.3) *
        (1 + state.cometBeat * 0.12 + state.headBoost * 0.55);
      const alpha = Math.min(
        0.98,
        (0.3 + 0.62 * state.depth) * identity * (1 - state.age * 0.57) *
          (1 + state.cometBeat * 0.16 + state.headBoost * 0.48),
      );
      const graphite = Math.round(mix(mix(126, 25, state.depth), 16, state.headBoost * 0.68));
      const red = Math.round(mix(graphite, 185, state.accent * 0.72));
      const green = Math.round(mix(graphite, 204, state.accent * 0.72));
      const blue = Math.round(mix(graphite, 206, state.accent * 0.72));

      context.beginPath();
      context.arc(x, y, radius * 1.65, 0, TAU);
      context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha * 0.045})`;
      context.fill();

      context.beginPath();
      context.arc(x, y, radius, 0, TAU);
      context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
      context.fill();
    }
  }
}

const fragment = `
const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;
const float LOOP = 4.8;
const int PARTICLES = 84;
const float GOLDEN_ANGLE = 2.399963229728653;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

float smoother(float edge0, float edge1, float value) {
  float amount = saturate((value - edge0) / (edge1 - edge0));
  return amount * amount * amount * (amount * (amount * 6.0 - 15.0) + 10.0);
}

float hash11(float value, float salt, float seed) {
  return fract(sin(value * 127.1 + salt * 311.7 + seed * 41.17) * 43758.5453123);
}

mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

vec2 safeNormalize(vec2 value) {
  return value / max(length(value), 0.00001);
}

// Curl of psi = sin(3.1x + t) sin(2.7y - t), plus a radial stream
// function. Both terms are divergence-free by construction.
vec2 curlVelocity(vec2 point, float phase, float seed) {
  float ax = 3.1 * point.x + TAU * phase * 0.17 + seed * 0.37;
  float ay = 2.7 * point.y - TAU * phase * 0.13 - seed * 0.21;
  vec2 wave = vec2(
    2.7 * sin(ax) * cos(ay),
    -3.1 * cos(ax) * sin(ay)
  );
  vec2 offset = point - vec2(0.035, -0.015);
  float envelope = exp(-2.8 * dot(offset, offset));
  vec2 vortex = vec2(-offset.y, offset.x) * envelope * 2.15;
  return wave * 0.105 + vortex;
}

vec2 advect(vec2 point, float phase, float amount, float seed) {
  vec2 result = point;
  float stepSize = amount * 0.5;
  for (int iteration = 0; iteration < 2; iteration += 1) {
    vec2 first = curlVelocity(result, phase, seed);
    vec2 midpoint = result + first * stepSize * 0.5;
    result += curlVelocity(midpoint, phase, seed) * stepSize;
  }
  return result;
}

vec2 seedPosition(float index, float order, float phase) {
  float angle = index * GOLDEN_ANGLE + TAU * phase;
  float breath = 1.0 + 0.055 * sin(TAU * phase);
  float radius = (0.045 + 0.145 * sqrt(order)) * breath;
  vec2 center = vec2(
    -0.1 + 0.014 * cos(TAU * phase),
    0.012 * sin(TAU * phase)
  );
  return center + vec2(cos(angle), sin(angle) * 0.84) * radius;
}

void filamentState(
  float index,
  float order,
  float phase,
  float seed,
  out vec2 point,
  out vec2 tangent,
  out float depth
) {
  float travel = smoother(0.075, 0.37, phase);
  float along = saturate(travel * 1.22 - order * 0.9);
  float irregularity = hash11(index, 1.0, seed) - 0.5;
  point = vec2(
    -0.1 + 0.93 * along - 0.48 * along * along,
    0.31 * sin(PI * along) - 0.22 * along +
      0.022 * sin(TAU * along + irregularity * 1.8) * along
  );
  tangent = safeNormalize(vec2(
    0.93 - 0.96 * along,
    0.31 * PI * cos(PI * along) - 0.22 +
      0.022 * TAU * cos(TAU * along + irregularity * 1.8)
  ));
  vec2 normal = vec2(-tangent.y, tangent.x);
  float crossStream = irregularity * 0.03 * smoother(0.08, 0.55, along);
  point += normal * crossStream;
  depth = saturate(0.47 + 0.24 * sin(PI * along + irregularity * 0.9));
}

void ringState(
  float index,
  float order,
  float phase,
  float seed,
  out vec2 point,
  out vec2 tangent,
  out float depth
) {
  float tubePhase = TAU * hash11(index, 2.0, seed) + TAU * phase * 0.24;
  float spin = 2.55 * (phase - 0.3) + 0.08 * sin(TAU * phase);
  float angle = TAU * (1.0 - order + 0.18) + spin;
  float tubeRadius = 0.026 + 0.026 * hash11(index, 3.0, seed);
  float radial = 0.49 * (1.0 + 0.055 * sin(angle * 2.0 + 0.7)) +
    cos(tubePhase) * tubeRadius;
  float tilt = 0.48;
  vec2 center = vec2(0.025, 0.008);
  point = vec2(
    center.x + cos(angle) * radial,
    center.y + sin(angle) * radial * cos(tilt) +
      sin(tubePhase) * tubeRadius * sin(tilt)
  );
  tangent = safeNormalize(vec2(-sin(angle), cos(angle) * cos(tilt)));
  depth = saturate(
    0.5 +
    0.42 * sin(angle) * sin(tilt) -
    0.18 * sin(tubePhase) * cos(tilt)
  );
}

void cometState(
  float index,
  float order,
  float seed,
  out vec2 point,
  out vec2 tangent,
  out float depth,
  out float age,
  out float unwrapped
) {
  unwrapped = fract(1.0 - order + 0.18);
  const float HEAD_SHARE = 0.28;
  vec2 head = vec2(0.385, 0.055);

  if (unwrapped < HEAD_SHARE) {
    float local = unwrapped / HEAD_SHARE;
    float radius = 0.032 + 0.118 * sqrt(local);
    float angle = local * TAU * 2.35 + TAU * hash11(index, 4.0, seed) * 0.26;
    point = head + vec2(cos(angle), sin(angle) * 0.76) * radius;
    tangent = safeNormalize(vec2(-sin(angle), cos(angle) * 0.76));
    depth = 0.58 + 0.25 * cos(angle);
    age = 0.0;
    return;
  }

  age = (unwrapped - HEAD_SHARE) / (1.0 - HEAD_SHARE);
  point = vec2(
    head.x - 1.01 * age,
    head.y + 0.16 * sin(PI * age) - 0.21 * age +
      0.025 * sin(TAU * age)
  );
  tangent = safeNormalize(vec2(
    -1.01,
    0.16 * PI * cos(PI * age) - 0.21 + 0.025 * TAU * cos(TAU * age)
  ));
  vec2 normal = vec2(-tangent.y, tangent.x);
  float width = mix(0.052, 0.012, age);
  float crossStream = (hash11(index, 5.0, seed) - 0.5) * width * 2.0;
  point += normal * crossStream;
  depth = saturate(0.52 + 0.2 * sin(TAU * unwrapped));
}

void particleState(
  float index,
  float phase,
  float seed,
  out vec2 point,
  out vec2 tangent,
  out float depth,
  out float age,
  out float accent,
  out float flow
) {
  float order = (index + 0.5) / float(PARTICLES);
  vec2 seedPoint = seedPosition(index, order, phase);

  vec2 filamentPoint;
  vec2 filamentTangent;
  float filamentDepth;
  filamentState(index, order, phase, seed, filamentPoint, filamentTangent, filamentDepth);

  vec2 ringPoint;
  vec2 ringTangent;
  float ringDepth;
  ringState(index, order, phase, seed, ringPoint, ringTangent, ringDepth);

  vec2 cometPoint;
  vec2 cometTangent;
  float cometDepth;
  float cometAge;
  float unwrapped;
  cometState(
    index,
    order,
    seed,
    cometPoint,
    cometTangent,
    cometDepth,
    cometAge,
    unwrapped
  );

  float leak = smoother(0.085 + order * 0.14, 0.18 + order * 0.22, phase);
  float ringFormation = smoother(
    0.31 + order * 0.05,
    0.53 + order * 0.05,
    phase
  );
  float shedding = smoother(
    0.56 + unwrapped * 0.08,
    0.7 + unwrapped * 0.08,
    phase
  );
  float homeNoise = hash11(index, 6.0, seed);
  float home = smoother(
    0.835 + homeNoise * 0.02,
    0.982 + homeNoise * 0.012,
    phase
  );

  point = mix(seedPoint, filamentPoint, leak);
  point = mix(point, ringPoint, ringFormation);
  point = mix(point, cometPoint, shedding);

  tangent = mix(vec2(0.25, 0.97), filamentTangent, leak);
  tangent = safeNormalize(mix(tangent, ringTangent, ringFormation));
  tangent = safeNormalize(mix(tangent, cometTangent, shedding));

  vec2 displacement = point - seedPoint;
  float dragTurn = sin(PI * home) * (0.38 + hash11(index, 7.0, seed) * 0.36);
  vec2 curledDisplacement = rotate2d(dragTurn) * displacement;
  float dragScale = pow(1.0 - home, 1.14);
  point = seedPoint + curledDisplacement * dragScale;
  tangent = safeNormalize(mix(tangent, safeNormalize(-displacement), home));

  float activeFlow = (1.0 - home) * smoother(0.075, 0.2, phase);
  point = advect(point, phase, 0.045 * activeFlow * (0.35 + 0.65 * leak), seed);
  point *= 1.0 + 0.24 * activeFlow;
  tangent = safeNormalize(mix(
    tangent,
    safeNormalize(curlVelocity(point, phase, seed)),
    activeFlow * 0.2
  ));

  float depthBeforeHome = mix(
    mix(filamentDepth, ringDepth, ringFormation),
    cometDepth,
    shedding
  );
  depth = mix(depthBeforeHome, 0.62, home);
  age = cometAge * shedding * (1.0 - home);
  accent = smoother(0.8, 0.985, cometAge) * shedding * (1.0 - home);
  flow = activeFlow * (0.34 + 0.66 * max(ringFormation, shedding));
}

float segmentDistance(vec2 point, vec2 start, vec2 end) {
  vec2 line = end - start;
  float projection = saturate(dot(point - start, line) / max(dot(line, line), 0.00001));
  return length(point - (start + line * projection));
}

vec4 shade(vec2 uv, float time, float seed) {
  float phase = fract(time / LOOP);
  vec3 weightedColor = vec3(0.0);
  float accumulated = 0.0;
  float knotEnergy = 0.0;

  for (int particle = 0; particle < PARTICLES; particle += 1) {
    float index = float(particle);
    vec2 point;
    vec2 tangent;
    float depth;
    float age;
    float accent;
    float flow;
    particleState(index, phase, seed, point, tangent, depth, age, accent, flow);

    float order = (index + 0.5) / float(PARTICLES);
    float unwrapped = fract(1.0 - order + 0.18);
    float cometBeat = smoother(0.58, 0.7, phase) *
      (1.0 - smoother(0.835, 0.94, phase));
    float headBoost = (1.0 - smoother(0.24, 0.5, unwrapped)) * cometBeat;
    float identity = 0.42 + 0.58 * pow(hash11(index, 8.0, seed), 1.7);
    float radius = (0.0108 + 0.0138 * depth) *
      (0.76 + 0.28 * hash11(index, 9.0, seed)) * (1.0 - age * 0.3) *
      (1.0 + cometBeat * 0.12 + headBoost * 0.55);
    float alpha = min(
      0.98,
      (0.3 + 0.62 * depth) * identity * (1.0 - age * 0.57) *
        (1.0 + cometBeat * 0.16 + headBoost * 0.48)
    );
    float distanceToPoint = length(uv - point);
    float antialias = max(fwidth(distanceToPoint), 0.0028);
    float dotCoverage = smoothstep(
      radius + antialias,
      radius - antialias,
      distanceToPoint
    );

    float trailLength = (0.008 + 0.033 * flow) * (1.0 - age * 0.42);
    float distanceToTrail = segmentDistance(uv, point, point - tangent * trailLength);
    float trailCoverage = smoothstep(
      radius * 0.58 + antialias,
      radius * 0.18,
      distanceToTrail
    ) * flow * 0.08 * step(0.66, hash11(index, 10.0, seed));
    float halo = exp(-pow(distanceToPoint / max(radius * 1.9, 0.001), 2.0)) * 0.026;

    float coverage = (dotCoverage + trailCoverage + halo) * alpha;
    vec3 graphite = mix(vec3(0.49), vec3(0.098), pow(depth, 0.82));
    graphite = mix(graphite, vec3(0.062), headBoost * 0.68);
    vec3 aqua = vec3(0.725, 0.8, 0.808);
    vec3 color = mix(graphite, aqua, accent * 0.72);

    weightedColor += color * coverage;
    accumulated += coverage;
    knotEnergy += dotCoverage * alpha;
  }

  float outAlpha = 1.0 - exp(-accumulated * 0.9);
  vec3 color = weightedColor / max(accumulated, 0.00001);
  float knot = smoother(1.15, 2.65, knotEnergy);
  color = mix(color, vec3(0.16, 0.17, 0.17), knot * 0.18);
  return vec4(color, outAlpha);
}
`;

export default {
  id: "curl-field-comet",
  name: "Curl-Field Comet",
  kind: "webgl",
  technique: "WebGL2 divergence-free curl advection",
  label: "Drifting",
  phaseOffset: 463,
  mount(container) {
    return createShaderVisual(container, {
      name: "Curl-Field Comet",
      seed: 4,
      fragment,
      fallback: drawFallback,
      maxDpr: 3,
    });
  },
};
