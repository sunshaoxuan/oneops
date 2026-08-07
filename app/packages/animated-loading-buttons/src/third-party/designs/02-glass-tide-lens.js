import { createShaderVisual } from "../core/webgl.js";

const LOOP_SECONDS = 4.4;
const HIGHLIGHT_LAG_SECONDS = 0.12;
const TAU = Math.PI * 2;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function segment(value, start, end) {
  return clamp01((value - start) / (end - start));
}

function smoothstep(start, end, value) {
  const amount = segment(value, start, end);
  return amount * amount * (3 - 2 * amount);
}

function smootherstep(start, end, value) {
  const amount = segment(value, start, end);
  return amount * amount * amount * (amount * (amount * 6 - 15) + 10);
}

function pulse(value, riseStart, riseEnd, fallStart, fallEnd) {
  return smoothstep(riseStart, riseEnd, value) *
    (1 - smoothstep(fallStart, fallEnd, value));
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - ((-2 * value + 2) ** 3) / 2;
}

function easeOutBack(value) {
  const overshoot = 1.08;
  const shifted = value - 1;
  return 1 + (overshoot + 1) * shifted ** 3 + overshoot * shifted ** 2;
}

function rollAt(phase) {
  const amount = easeOutBack(segment(phase, 0.375, 0.665));
  return amount * (140 / 360) * TAU;
}

function stateAt(phase) {
  const rise = easeOutCubic(segment(phase, 0.075, 0.315));
  const returnToTide = easeInOutCubic(segment(phase, 0.64, 0.94));
  const presence = smootherstep(0.035, 0.185, phase) *
    (1 - smootherstep(0.825, 0.995, phase));
  const stretch = pulse(phase, 0.08, 0.165, 0.29, 0.41);
  const pressure = pulse(phase, 0.275, 0.365, 0.565, 0.68);
  const crescent = smootherstep(0.31, 0.455, phase) *
    (1 - smootherstep(0.665, 0.805, phase));
  const detached = smootherstep(0.16, 0.285, phase);
  const centerY = (-0.565 + 0.705 * rise) * (1 - returnToTide) +
    -0.565 * returnToTide;

  return {
    phase,
    centerY,
    presence,
    stretch,
    pressure,
    crescent,
    detached,
    angle: rollAt(phase),
    radiusX: (0.325 - stretch * 0.034 + pressure * 0.018) * presence,
    radiusY: (0.365 + stretch * 0.072 - pressure * 0.018) * presence,
  };
}

function traceDropletPath(context, state, scale, includeCut = true) {
  const rx = Math.max(scale * 0.015, state.radiusX * scale);
  const ry = Math.max(scale * 0.015, state.radiusY * scale);
  const tail = state.stretch * 0.15 + (1 - state.detached) * 0.08;

  context.beginPath();
  context.moveTo(0, -ry);
  context.bezierCurveTo(rx * 0.72, -ry, rx, -ry * 0.38, rx, 0);
  context.bezierCurveTo(rx, ry * 0.58, rx * 0.48, ry * 0.91, 0, ry * (1 + tail));
  context.bezierCurveTo(-rx * 0.48, ry * 0.91, -rx, ry * 0.58, -rx, 0);
  context.bezierCurveTo(-rx, -ry * 0.38, -rx * 0.72, -ry, 0, -ry);
  context.closePath();

  if (includeCut && state.crescent > 0.002) {
    const cutX = (0.92 + (0.14 - 0.92) * state.crescent) * scale;
    const cutY = (-0.62 + (-0.09 + 0.62) * state.crescent) * scale;
    const cutRadius = (0.15 + 0.14 * state.crescent) * scale;
    context.moveTo(cutX + cutRadius, cutY);
    context.arc(cutX, cutY, cutRadius, 0, TAU, false);
    context.closePath();
  }
}

function drawFallback(context, time, _delta, width, height) {
  const phase = ((time / LOOP_SECONDS) % 1 + 1) % 1;
  const state = stateAt(phase);
  const lagPhase = Math.max(0, phase - HIGHLIGHT_LAG_SECONDS / LOOP_SECONDS);
  const lagState = stateAt(lagPhase);
  const size = Math.min(width, height);
  const scale = size * 0.5;
  const centerX = width * 0.5;
  const centerY = height * 0.5;

  const tideEnergy = pulse(phase, 0.035, 0.13, 0.34, 0.48) +
    pulse(phase, 0.72, 0.79, 0.94, 0.995) + state.pressure * 0.72;
  const surfaceAt = (normalX) => -0.565 +
    Math.sin(normalX * 9 - phase * TAU * 1.7) *
      0.026 * tideEnergy * Math.exp(-normalX * normalX * 1.9);

  // Layer one: the reservoir is quiet but dimensional enough to establish a
  // real liquid source before the droplet appears.
  const reservoir = context.createLinearGradient(0, centerY + scale * 0.52, 0, centerY + scale);
  reservoir.addColorStop(0, "rgba(62, 68, 70, 0.22)");
  reservoir.addColorStop(1, "rgba(25, 25, 25, 0)");
  context.beginPath();
  for (let index = 0; index <= 20; index += 1) {
    const normalX = -0.76 + (index / 20) * 1.52;
    const x = centerX + normalX * scale;
    const y = centerY - surfaceAt(normalX) * scale;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.lineTo(centerX + 0.76 * scale, centerY + scale);
  context.lineTo(centerX - 0.76 * scale, centerY + scale);
  context.closePath();
  context.fillStyle = reservoir;
  context.fill();

  context.beginPath();
  for (let index = 0; index <= 24; index += 1) {
    const normalX = -0.76 + (index / 24) * 1.52;
    const x = centerX + normalX * scale;
    const y = centerY - surfaceAt(normalX) * scale;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.strokeStyle = "rgba(49, 54, 56, 0.72)";
  context.lineCap = "round";
  context.lineWidth = Math.max(0.8, size * 0.032);
  context.stroke();

  // Layer two: a capillary neck holds for a beat, narrows, and releases.
  const neckStrength = state.presence * (1 - state.detached);
  if (neckStrength > 0.002) {
    const bodyBottom = centerY - (state.centerY - state.radiusY * 0.88) * scale;
    const surface = centerY - surfaceAt(0) * scale;
    const neckGradient = context.createLinearGradient(centerX, surface, centerX, bodyBottom);
    neckGradient.addColorStop(0, `rgba(74, 81, 83, ${0.28 * neckStrength})`);
    neckGradient.addColorStop(1, `rgba(216, 225, 227, ${0.48 * neckStrength})`);
    context.beginPath();
    context.moveTo(centerX, surface);
    context.bezierCurveTo(
      centerX - scale * 0.025,
      surface - scale * 0.09,
      centerX + scale * 0.025,
      bodyBottom + scale * 0.07,
      centerX,
      bodyBottom,
    );
    context.strokeStyle = neckGradient;
    context.lineWidth = Math.max(0.6, scale * 0.115 * neckStrength);
    context.stroke();
  }

  if (state.presence < 0.008) return;

  const worldX = centerX;
  const worldY = centerY - state.centerY * scale;

  // Layer three: smoke-glass body and carved pressure crescent.
  context.save();
  context.translate(worldX, worldY);
  context.rotate(-state.angle);
  traceDropletPath(context, state, scale);
  const glass = context.createLinearGradient(-scale * 0.32, -scale * 0.33, scale * 0.3, scale * 0.36);
  glass.addColorStop(0, "rgba(250, 250, 248, 0.70)");
  glass.addColorStop(0.28, "rgba(190, 203, 206, 0.52)");
  glass.addColorStop(0.7, "rgba(65, 71, 73, 0.43)");
  glass.addColorStop(1, "rgba(25, 25, 25, 0.62)");
  context.fillStyle = glass;
  context.fill("evenodd");
  context.strokeStyle = "rgba(42, 47, 49, 0.78)";
  context.lineWidth = Math.max(0.78, size * 0.031);
  context.stroke();
  context.restore();

  // Layer four: a diagonal pressure ridge passes through the material. It is
  // clipped to the current topology and stays separate from the delayed glint.
  if (state.pressure > 0.002) {
    const pressurePosition = (-0.46 + segment(phase, 0.275, 0.58) * 0.92) * scale;
    context.save();
    context.translate(worldX, worldY);
    context.rotate(-state.angle);
    traceDropletPath(context, state, scale);
    context.clip("evenodd");
    context.rotate(-0.72);
    context.beginPath();
    context.moveTo(pressurePosition, -scale * 0.55);
    context.lineTo(pressurePosition, scale * 0.55);
    context.strokeStyle = `rgba(250, 250, 248, ${0.72 * state.pressure})`;
    context.lineWidth = Math.max(0.78, size * 0.036);
    context.stroke();
    context.restore();
  }

  // Layer five: the specular arc follows the prior material pose by 120 ms.
  // Its world-space delay remains visible even when the crescent changes angle.
  context.save();
  context.translate(worldX, worldY);
  context.rotate(-state.angle);
  traceDropletPath(context, state, scale);
  context.clip("evenodd");
  context.rotate(state.angle);
  context.translate(-worldX, -worldY);
  context.translate(centerX, centerY - lagState.centerY * scale);
  context.rotate(-lagState.angle);
  const lagRx = Math.max(scale * 0.015, lagState.radiusX * scale);
  const lagRy = Math.max(scale * 0.015, lagState.radiusY * scale);
  context.beginPath();
  context.ellipse(0, 0, lagRx * 0.82, lagRy * 0.82, 0, 3.68, 5.05);
  context.strokeStyle = "rgba(250, 250, 248, 0.92)";
  context.lineCap = "round";
  context.lineWidth = Math.max(0.72, size * 0.028);
  context.stroke();
  context.restore();
}

const fragment = `
const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;
const float LOOP = 4.4;
const float HIGHLIGHT_LAG = 0.0272727272727273;

mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

float segment(float value, float start, float end) {
  return saturate((value - start) / (end - start));
}

float smoother(float value) {
  value = saturate(value);
  return value * value * value * (value * (value * 6.0 - 15.0) + 10.0);
}

float pulse(float value, float riseStart, float riseEnd, float fallStart, float fallEnd) {
  return smoothstep(riseStart, riseEnd, value) *
    (1.0 - smoothstep(fallStart, fallEnd, value));
}

float easeOutCubic(float value) {
  return 1.0 - pow(1.0 - saturate(value), 3.0);
}

float easeInOutCubic(float value) {
  value = saturate(value);
  return value < 0.5
    ? 4.0 * value * value * value
    : 1.0 - pow(-2.0 * value + 2.0, 3.0) * 0.5;
}

float easeOutBack(float value) {
  value = saturate(value);
  const float overshoot = 1.08;
  float shifted = value - 1.0;
  return 1.0 + (overshoot + 1.0) * shifted * shifted * shifted +
    overshoot * shifted * shifted;
}

float rollAt(float phase) {
  return easeOutBack(segment(phase, 0.375, 0.665)) * radians(140.0);
}

vec4 liquidState(float phase) {
  float rise = easeOutCubic(segment(phase, 0.075, 0.315));
  float returnToTide = easeInOutCubic(segment(phase, 0.64, 0.94));
  float presence = smoother(segment(phase, 0.035, 0.185)) *
    (1.0 - smoother(segment(phase, 0.825, 0.995)));
  float stretch = pulse(phase, 0.08, 0.165, 0.29, 0.41);
  float pressure = pulse(phase, 0.275, 0.365, 0.565, 0.68);
  float centerY = mix(-0.565 + 0.705 * rise, -0.565, returnToTide);
  return vec4(centerY, presence, stretch, pressure);
}

float crescentAt(float phase) {
  return smoother(segment(phase, 0.31, 0.455)) *
    (1.0 - smoother(segment(phase, 0.665, 0.805)));
}

float detachedAt(float phase) {
  return smoother(segment(phase, 0.16, 0.285));
}

float sdEllipse(vec2 point, vec2 radii) {
  radii = max(radii, vec2(0.012));
  float k0 = length(point / radii);
  float k1 = length(point / (radii * radii));
  return k0 * (k0 - 1.0) / max(k1, 0.0001);
}

float sdCapsule(vec2 point, vec2 start, vec2 end, float radius) {
  vec2 fromStart = point - start;
  vec2 axis = end - start;
  float amount = saturate(dot(fromStart, axis) / max(dot(axis, axis), 0.0001));
  return length(fromStart - axis * amount) - radius;
}

float smoothUnion(float first, float second, float radius) {
  float blend = saturate(0.5 + 0.5 * (second - first) / radius);
  return mix(second, first, blend) - radius * blend * (1.0 - blend);
}

float tideSurface(float x, float phase) {
  float energy = pulse(phase, 0.035, 0.13, 0.34, 0.48) +
    pulse(phase, 0.72, 0.79, 0.94, 0.995) +
    pulse(phase, 0.275, 0.365, 0.565, 0.68) * 0.72;
  return -0.565 + sin(x * 9.0 - phase * TAU * 1.7) *
    0.026 * energy * exp(-x * x * 1.9);
}

float lensDistance(vec2 point, float phase) {
  vec4 state = liquidState(phase);
  float centerY = state.x;
  float presence = state.y;
  float stretch = state.z;
  float pressure = state.w;
  float crescent = crescentAt(phase);
  float detached = detachedAt(phase);
  float angle = rollAt(phase);
  vec2 local = rotate2d(-angle) * (point - vec2(0.0, centerY));
  vec2 radii = vec2(
    (0.325 - stretch * 0.034 + pressure * 0.018) * presence,
    (0.365 + stretch * 0.072 - pressure * 0.018) * presence
  );

  // A tiny second harmonic makes the body read as held liquid, never a rigid coin.
  float outer = sdEllipse(local, radii);
  float polar = atan(local.y, local.x);
  outer += sin(polar * 2.0 - pressure * 1.4) * 0.012 * pressure;

  float surface = tideSurface(0.0, phase);
  vec2 neckEnd = vec2(0.0, centerY - max(radii.y * 0.82, 0.01));
  float neckRadius = 0.064 * presence * (1.0 - detached);
  float neck = sdCapsule(point, vec2(0.0, surface), neckEnd, max(neckRadius, 0.004));
  neck += detached * 0.8 + (1.0 - presence) * 0.8;
  float body = smoothUnion(outer, neck, 0.034);

  vec2 cutCenter = mix(vec2(0.92, -0.62), vec2(0.14, -0.09), crescent);
  float cutRadius = mix(0.15, 0.29, crescent);
  float cut = length(local - cutCenter) - cutRadius;
  return max(body, -cut);
}

vec3 sampleBackdrop(vec2 point) {
  // One deliberately quiet substrate lookup: enough information for the normal
  // offset to read as refraction without pretending there is an environment map.
  float paper = 0.91 + point.y * 0.025;
  float softLine = exp(-pow((point.x + point.y * 0.54 + 0.08) * 6.2, 2.0));
  return vec3(paper - softLine * 0.105, paper - softLine * 0.085, paper - softLine * 0.075);
}

vec4 shade(vec2 uv, float timeSeconds, float seed) {
  float phase = fract(timeSeconds / LOOP);
  vec4 state = liquidState(phase);
  float distanceToLens = lensDistance(uv, phase);
  float antialias = max(fwidth(distanceToLens), 0.004);
  float bodyCoverage = smoothstep(antialias, -antialias, distanceToLens);

  float epsilon = 0.008;
  vec2 normal = normalize(vec2(
    lensDistance(uv + vec2(epsilon, 0.0), phase) -
      lensDistance(uv - vec2(epsilon, 0.0), phase),
    lensDistance(uv + vec2(0.0, epsilon), phase) -
      lensDistance(uv - vec2(0.0, epsilon), phase)
  ) + vec2(0.00001));
  float interiorDepth = saturate(-distanceToLens / 0.19);
  vec2 refractedUv = uv - normal * (0.028 + 0.046 * interiorDepth);
  vec3 refracted = sampleBackdrop(refractedUv);

  float fresnel = bodyCoverage * exp(-abs(distanceToLens) * 31.0);
  float facing = saturate(dot(normal, normalize(vec2(-0.67, 0.74))) * 0.5 + 0.5);
  vec3 smoke = mix(vec3(0.12, 0.13, 0.135), refracted, 0.38 + 0.22 * interiorDepth);
  smoke = mix(smoke, vec3(0.105, 0.115, 0.12), fresnel * (0.42 - facing * 0.18));
  smoke = mix(smoke, vec3(0.875, 0.91, 0.92), fresnel * facing * facing * 0.68);

  float pressurePosition = mix(-0.46, 0.46, segment(phase, 0.275, 0.58));
  vec2 pressureDirection = normalize(vec2(0.66, 0.75));
  float pressureRidge = state.w * exp(-pow(
    (dot(uv - vec2(0.0, state.x), pressureDirection) - pressurePosition) / 0.045,
    2.0
  )) * bodyCoverage;

  // This material state is sampled 120 ms behind the SDF state. During the
  // 140-degree roll the glint visibly trails instead of being glued to the rim.
  float lagPhase = max(0.0, phase - HIGHLIGHT_LAG);
  vec4 lagState = liquidState(lagPhase);
  vec2 lagLocal = rotate2d(-rollAt(lagPhase)) * (uv - vec2(0.0, lagState.x));
  vec2 lagRadii = max(vec2(
    (0.325 - lagState.z * 0.034 + lagState.w * 0.018) * lagState.y,
    (0.365 + lagState.z * 0.072 - lagState.w * 0.018) * lagState.y
  ), vec2(0.012));
  float lagRadius = length(lagLocal / lagRadii);
  float lagDirection = smoothstep(0.05, 0.68, dot(
    normalize(lagLocal + vec2(0.0001)),
    normalize(vec2(-0.72, 0.69))
  ));
  float delayedGlint = exp(-pow((lagRadius - 0.79) / 0.105, 2.0)) *
    lagDirection * bodyCoverage * lagState.y;

  vec3 bodyColor = mix(smoke, vec3(0.98, 0.985, 0.975),
    saturate(pressureRidge * 0.68 + delayedGlint * 0.88));
  float bodyAlpha = bodyCoverage * (0.27 + 0.40 * interiorDepth) +
    fresnel * 0.42 + pressureRidge * 0.14 + delayedGlint * 0.20;

  float surfaceY = tideSurface(uv.x, phase);
  float sideMask = 1.0 - smoothstep(0.61, 0.73, abs(uv.x));
  float surfaceDistance = abs(uv.y - surfaceY);
  float surfaceLine = smoothstep(0.037 + antialias, 0.004, surfaceDistance) * sideMask;
  float reservoir = smoothstep(surfaceY + 0.035, surfaceY - 0.09, uv.y) *
    smoothstep(surfaceY - 0.42, surfaceY - 0.12, uv.y) * sideMask;
  float surfaceAlpha = surfaceLine * 0.66 + reservoir * 0.11;
  vec3 surfaceColor = mix(vec3(0.20, 0.22, 0.23), vec3(0.49, 0.53, 0.54),
    saturate(surfaceLine * 0.55 + state.w * 0.18));

  float uncoveredSurface = surfaceAlpha * (1.0 - bodyCoverage * 0.72);
  float alpha = saturate(bodyAlpha + uncoveredSurface * (1.0 - bodyAlpha));
  vec3 color = alpha > 0.0001
    ? (bodyColor * bodyAlpha + surfaceColor * uncoveredSurface * (1.0 - bodyAlpha)) / alpha
    : vec3(0.0);

  return vec4(color, alpha);
}
`;

export default {
  id: "glass-tide-lens",
  name: "Glass Tide Lens",
  kind: "webgl",
  technique: "Analytic liquid SDF and delayed refraction",
  label: "Focusing",
  phaseOffset: 262,
  mount(container) {
    return createShaderVisual(container, {
      name: "Glass Tide Lens",
      seed: 2,
      fragment,
      fallback: drawFallback,
      maxDpr: 3,
    });
  },
};
