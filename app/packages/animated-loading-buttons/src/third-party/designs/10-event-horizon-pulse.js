import { createShaderVisual } from "../core/webgl.js";

const LOOP_SECONDS = 4.6;
const TAU = Math.PI * 2;
const RING_ANGLE = -0.16;

const STAR_SPECS = [
  { angle: 0.18, radius: 0.91, drift: 0.25, bend: 0.31, direction: 1, size: 0.026, switchAt: 0.18 },
  { angle: 0.72, radius: 0.72, drift: 0.31, bend: 0.42, direction: -1, size: 0.034, switchAt: 0.76 },
  { angle: 1.23, radius: 0.95, drift: 0.22, bend: 0.28, direction: -1, size: 0.023, switchAt: 0.35 },
  { angle: 1.79, radius: 0.78, drift: 0.28, bend: 0.39, direction: 1, size: 0.029, switchAt: 0.61 },
  { angle: 2.34, radius: 0.88, drift: 0.34, bend: 0.47, direction: 1, size: 0.037, switchAt: 0.27 },
  { angle: 2.92, radius: 0.68, drift: 0.29, bend: 0.44, direction: -1, size: 0.025, switchAt: 0.83 },
  { angle: 3.43, radius: 0.97, drift: 0.25, bend: 0.30, direction: 1, size: 0.031, switchAt: 0.46 },
  { angle: 3.98, radius: 0.75, drift: 0.32, bend: 0.46, direction: -1, size: 0.036, switchAt: 0.69 },
  { angle: 4.51, radius: 0.9, drift: 0.24, bend: 0.33, direction: -1, size: 0.024, switchAt: 0.22 },
  { angle: 5.03, radius: 0.7, drift: 0.3, bend: 0.43, direction: 1, size: 0.032, switchAt: 0.54 },
  { angle: 5.49, radius: 0.96, drift: 0.27, bend: 0.36, direction: 1, size: 0.026, switchAt: 0.4 },
  { angle: 5.86, radius: 0.79, drift: 0.33, bend: 0.48, direction: -1, size: 0.035, switchAt: 0.72 },
];

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smootherstep(start, end, value) {
  const amount = clamp01((value - start) / (end - start));
  return amount * amount * amount * (amount * (amount * 6 - 15) + 10);
}

function pulse(value, riseStart, riseEnd, fallStart, fallEnd) {
  return smootherstep(riseStart, riseEnd, value) *
    (1 - smootherstep(fallStart, fallEnd, value));
}

function stateAt(time) {
  const phase = ((time / LOOP_SECONDS) % 1 + 1) % 1;

  return {
    phase,
    drift: smootherstep(0.025, 0.73, phase),
    restore: smootherstep(0.74, 0.985, phase),
    farLight: pulse(phase, 0.1, 0.26, 0.47, 0.64),
    heroProgress: smootherstep(0.285, 0.705, phase),
    heroOpacity: pulse(phase, 0.235, 0.3, 0.69, 0.77),
    stretch: pulse(phase, 0.405, 0.53, 0.655, 0.875),
  };
}

function starPosition(spec, travel) {
  const radius = spec.radius - spec.drift * travel;
  const nearLens = 1 - smootherstep(0.34, 0.9, radius);
  const angle = spec.angle + spec.direction * spec.bend * nearLens * travel;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

function heroPosition(amount) {
  const inverse = 1 - amount;
  const a = inverse * inverse * inverse;
  const b = 3 * inverse * inverse * amount;
  const c = 3 * inverse * amount * amount;
  const d = amount * amount * amount;

  return [
    -0.86 * a - 0.64 * b + 0.1 * c + 1.06 * d,
    0.38 * a - 0.25 * b - 0.78 * c - 0.1 * d,
  ];
}

function drawPoint(context, point, radius, alpha, tone, centerX, centerY, scale) {
  if (alpha <= 0.001) return;
  context.beginPath();
  context.arc(
    centerX + point[0] * scale,
    centerY - point[1] * scale,
    Math.max(0.42, radius * scale),
    0,
    TAU,
  );
  context.fillStyle = `rgba(${tone}, ${tone}, ${tone}, ${alpha})`;
  context.fill();
}

function drawStarField(context, state, centerX, centerY, scale) {
  for (const spec of STAR_SPECS) {
    const restored = smootherstep(
      spec.switchAt - 0.065,
      spec.switchAt + 0.065,
      state.restore,
    );
    const current = starPosition(spec, state.drift);
    const previous = starPosition(spec, Math.max(0, state.drift - 0.055));
    const reset = starPosition(spec, 0);
    const proximity = 1 - smootherstep(0.38, 0.84, Math.hypot(...current));
    const trailAlpha = (1 - restored) * proximity * smootherstep(0.04, 0.22, state.drift);

    if (trailAlpha > 0.002) {
      context.beginPath();
      context.moveTo(centerX + previous[0] * scale, centerY - previous[1] * scale);
      context.lineTo(centerX + current[0] * scale, centerY - current[1] * scale);
      context.strokeStyle = `rgba(75, 75, 75, ${0.3 * trailAlpha})`;
      context.lineCap = "round";
      context.lineWidth = Math.max(0.42, spec.size * scale * 0.62);
      context.stroke();
    }

    drawPoint(context, current, spec.size, 0.48 * (1 - restored), 72, centerX, centerY, scale);
    drawPoint(context, reset, spec.size, 0.42 * restored, 92, centerX, centerY, scale);
  }
}

function drawHero(context, state, centerX, centerY, scale) {
  if (state.heroOpacity <= 0.001) return;

  let previous = heroPosition(Math.max(0, state.heroProgress - 0.22));
  for (let index = 4; index >= 0; index -= 1) {
    const amount = Math.max(0, state.heroProgress - index * 0.044);
    const point = heroPosition(amount);
    const age = 1 - index / 5;
    context.beginPath();
    context.moveTo(centerX + previous[0] * scale, centerY - previous[1] * scale);
    context.lineTo(centerX + point[0] * scale, centerY - point[1] * scale);
    context.strokeStyle = `rgba(214, 214, 210, ${state.heroOpacity * age * age * 0.54})`;
    context.lineCap = "round";
    context.lineWidth = Math.max(0.46, scale * 0.018 * age);
    context.stroke();
    previous = point;
  }

  drawPoint(
    context,
    heroPosition(state.heroProgress),
    0.043,
    state.heroOpacity * 0.96,
    248,
    centerX,
    centerY,
    scale,
  );
}

function configureRingTransform(context, state, centerX, centerY, scale) {
  context.translate(centerX, centerY);
  context.rotate(-RING_ANGLE);
  context.scale(1 + state.stretch * 0.27, 0.78 - state.stretch * 0.27);
  context.lineCap = "round";
  context.lineWidth = Math.max(0.74, scale * 0.052);
}

function drawFarBand(context, state, centerX, centerY, scale) {
  context.save();
  configureRingTransform(context, state, centerX, centerY, scale);
  context.beginPath();
  context.arc(0, 0, scale * 0.5, Math.PI, TAU);
  context.strokeStyle = `rgba(77, 77, 77, ${0.34 + state.farLight * 0.2})`;
  context.stroke();

  const hotCenter = 4.04 - state.farLight * 0.34;
  context.beginPath();
  context.arc(0, 0, scale * 0.5, hotCenter - 0.24, hotCenter + 0.24);
  context.strokeStyle = `rgba(248, 248, 244, ${state.farLight * 0.96})`;
  context.stroke();
  context.restore();
}

function drawNearBand(context, state, centerX, centerY, scale) {
  context.save();
  configureRingTransform(context, state, centerX, centerY, scale);
  context.beginPath();
  context.arc(0, 0, scale * 0.5, 0, Math.PI);
  context.strokeStyle = "rgba(112, 112, 112, 0.58)";
  context.stroke();
  context.restore();
}

function drawFallback(context, time, _delta, width, height) {
  const state = stateAt(time);
  const size = Math.min(width, height);
  const scale = size * 0.5;
  const centerX = width * 0.5;
  const centerY = height * 0.5;

  drawStarField(context, state, centerX, centerY, scale);
  drawHero(context, state, centerX, centerY, scale);
  drawFarBand(context, state, centerX, centerY, scale);

  const diskRadius = (0.288 + state.stretch * 0.012) * scale;
  const core = context.createRadialGradient(
    centerX - diskRadius * 0.2,
    centerY - diskRadius * 0.18,
    0,
    centerX,
    centerY,
    diskRadius,
  );
  core.addColorStop(0, "rgba(5, 5, 5, 0.98)");
  core.addColorStop(0.78, "rgba(10, 10, 10, 0.97)");
  core.addColorStop(1, "rgba(20, 20, 20, 0.96)");
  context.beginPath();
  context.arc(centerX, centerY, diskRadius, 0, TAU);
  context.fillStyle = core;
  context.fill();

  drawNearBand(context, state, centerX, centerY, scale);
}

const fragment = `
const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;
const float LOOP = 4.6;

float smoother(float edge0, float edge1, float value) {
  float amount = clamp((value - edge0) / (edge1 - edge0), 0.0, 1.0);
  return amount * amount * amount * (amount * (amount * 6.0 - 15.0) + 10.0);
}

float pulse(float value, float rise0, float rise1, float fall0, float fall1) {
  return smoother(rise0, rise1, value) * (1.0 - smoother(fall0, fall1, value));
}

float hash11(float value) {
  return fract(sin(value * 127.1 + 311.7) * 43758.5453123);
}

mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

float discMask(vec2 point, vec2 center, float radius) {
  float distanceToEdge = length(point - center) - radius;
  float antialias = max(fwidth(distanceToEdge), 0.0025);
  return 1.0 - smoothstep(-antialias, antialias, distanceToEdge);
}

float segmentDistance(vec2 point, vec2 start, vec2 end) {
  vec2 axis = end - start;
  float amount = clamp(dot(point - start, axis) / max(dot(axis, axis), 0.00001), 0.0, 1.0);
  return length(point - start - axis * amount);
}

void composite(inout vec3 premultiplied, inout float alpha, vec3 color, float layerAlpha) {
  layerAlpha = clamp(layerAlpha, 0.0, 1.0);
  premultiplied = color * layerAlpha + premultiplied * (1.0 - layerAlpha);
  alpha = layerAlpha + alpha * (1.0 - layerAlpha);
}

vec2 starPosition(float index, float travel, float seed) {
  float angle = TAU * hash11(index * 5.17 + seed * 0.31);
  float baseRadius = 0.64 + 0.34 * hash11(index * 9.73 + seed * 1.19);
  float inward = 0.2 + 0.16 * hash11(index * 3.91 + seed * 2.07);
  float radius = baseRadius - inward * travel;
  float direction = hash11(index * 7.37 + seed * 0.77) < 0.5 ? -1.0 : 1.0;
  float nearLens = 1.0 - smoother(0.34, 0.9, radius);
  float bend = (0.28 + 0.22 * hash11(index * 11.13 + seed)) * nearLens * travel;
  angle += direction * bend;
  return vec2(cos(angle), sin(angle)) * radius;
}

vec2 heroPosition(float amount) {
  float inverse = 1.0 - amount;
  float a = inverse * inverse * inverse;
  float b = 3.0 * inverse * inverse * amount;
  float c = 3.0 * inverse * amount * amount;
  float d = amount * amount * amount;
  return vec2(
    -0.86 * a - 0.64 * b + 0.10 * c + 1.06 * d,
     0.38 * a - 0.25 * b - 0.78 * c - 0.10 * d
  );
}

vec4 shade(vec2 uv, float timeSeconds, float seed) {
  float phase = fract(timeSeconds / LOOP);
  float drift = smoother(0.025, 0.73, phase);
  float restore = smoother(0.74, 0.985, phase);
  float farLight = pulse(phase, 0.1, 0.26, 0.47, 0.64);
  float heroProgress = smoother(0.285, 0.705, phase);
  float heroOpacity = pulse(phase, 0.235, 0.3, 0.69, 0.77);
  float stretch = pulse(phase, 0.405, 0.53, 0.655, 0.875);

  vec3 premultiplied = vec3(0.0);
  float alpha = 0.0;

  // Sparse points follow deterministic inward trajectories. Their short
  // tangential wakes make the polar deflection readable at actual size.
  for (int index = 0; index < 12; index += 1) {
    float fi = float(index);
    vec2 current = starPosition(fi, drift, seed);
    vec2 previous = starPosition(fi, max(0.0, drift - 0.055), seed);
    vec2 resetPosition = starPosition(fi, 0.0, seed);
    float switchAt = 0.16 + 0.68 * hash11(fi * 13.71 + seed * 0.53);
    float restored = smoother(switchAt - 0.065, switchAt + 0.065, restore);
    float size = 0.023 + 0.017 * hash11(fi * 4.83 + seed * 1.73);
    float pointMask = discMask(uv, current, size) * (1.0 - restored);
    float resetMask = discMask(uv, resetPosition, size) * restored;
    float proximity = 1.0 - smoother(0.38, 0.84, length(current));
    float trailDistance = segmentDistance(uv, previous, current);
    float trailAA = max(fwidth(trailDistance), 0.0025);
    float trail = (1.0 - smoothstep(size * 0.22, size * 0.22 + trailAA, trailDistance)) *
      proximity * smoother(0.04, 0.22, drift) * (1.0 - restored);
    float tone = 0.28 + 0.16 * hash11(fi * 8.41 + seed * 2.3);
    composite(premultiplied, alpha, vec3(tone * 0.72), trail * 0.28);
    composite(premultiplied, alpha, vec3(tone), pointMask * 0.48);
    composite(premultiplied, alpha, vec3(tone + 0.08), resetMask * 0.43);
  }

  // A single high-energy star curves around the lower limb, accelerates out,
  // and leaves a finite, crisp wake rather than a glow.
  vec2 heroHead = heroPosition(heroProgress);
  vec2 trailStart = heroPosition(max(0.0, heroProgress - 0.22));
  for (int index = 0; index < 5; index += 1) {
    float fi = 4.0 - float(index);
    float amount = max(0.0, heroProgress - fi * 0.044);
    vec2 trailEnd = heroPosition(amount);
    float trailDistance = segmentDistance(uv, trailStart, trailEnd);
    float trailAA = max(fwidth(trailDistance), 0.0025);
    float age = 1.0 - fi / 5.0;
    float trail = 1.0 - smoothstep(0.009, 0.009 + trailAA, trailDistance);
    composite(premultiplied, alpha, vec3(0.84), trail * heroOpacity * age * age * 0.52);
    trailStart = trailEnd;
  }
  composite(
    premultiplied,
    alpha,
    vec3(0.975),
    discMask(uv, heroHead, 0.043) * heroOpacity * 0.97
  );

  // The band has real front/back ordering. Its far arc is laid down before the
  // void, then its near arc crosses in front, producing unmistakable occlusion.
  vec2 ringPoint = rotate2d(0.16) * uv;
  vec2 ringScale = vec2(1.0 + stretch * 0.27, 0.78 - stretch * 0.27);
  vec2 normalizedRing = ringPoint / ringScale;
  float ringRadius = length(normalizedRing);
  float ringAA = max(fwidth(ringRadius), 0.003);
  float band = 1.0 - smoothstep(0.018, 0.018 + ringAA, abs(ringRadius - 0.5));
  float farSide = smoother(-0.045, 0.055, normalizedRing.y);
  float nearSide = 1.0 - farSide;
  float ringAngle = atan(normalizedRing.y, normalizedRing.x);
  float hotCenter = 2.24 + farLight * 0.34;
  float hotDistance = abs(atan(sin(ringAngle - hotCenter), cos(ringAngle - hotCenter)));
  float hotArc = (1.0 - smoothstep(0.13, 0.25, hotDistance)) * farLight * farSide * band;
  composite(premultiplied, alpha, vec3(0.3), band * farSide * (0.34 + farLight * 0.2));
  composite(premultiplied, alpha, vec3(0.975), hotArc * 0.97);

  float diskRadius = 0.288 + stretch * 0.012;
  float voidMask = discMask(uv, vec2(0.0), diskRadius);
  float coreTone = mix(0.025, 0.075, smoother(0.0, diskRadius, length(uv)));
  composite(premultiplied, alpha, vec3(coreTone), voidMask * 0.975);
  composite(premultiplied, alpha, vec3(0.44), band * nearSide * 0.59);

  vec3 color = alpha > 0.0001 ? premultiplied / alpha : vec3(0.0);
  return vec4(color, alpha);
}
`;

export default {
  id: "event-horizon-pulse",
  name: "Event-Horizon Pulse",
  kind: "webgl",
  technique: "Analytic SDF void and polar lensing",
  label: "Pulsing",
  phaseOffset: 733,
  mount(container) {
    return createShaderVisual(container, {
      name: "Event-Horizon Pulse",
      seed: 10,
      fragment,
      fallback: drawFallback,
      maxDpr: 3,
    });
  },
};
