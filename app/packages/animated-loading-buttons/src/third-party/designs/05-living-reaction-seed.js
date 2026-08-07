import { createShaderVisual } from "../core/webgl.js";

const LOOP_SECONDS = 6;
const TAU = Math.PI * 2;
const SEED_RADIUS = 0.72;

const inoculations = [
  { point: [-0.43, -0.09], start: 0.08 },
  { point: [0.37, -0.24], start: 0.105 },
  { point: [0.07, 0.4], start: 0.13 },
];

const branchSegments = [
  // Western colony: a heavy root divides above and below before reaching inward.
  { from: [-0.43, -0.09], to: [-0.3, -0.06], start: 0, end: 0.16, width: 0.05 },
  { from: [-0.3, -0.06], to: [-0.2, 0.02], start: 0.12, end: 0.32, width: 0.044 },
  { from: [-0.2, 0.02], to: [-0.075, 0.065], start: 0.3, end: 0.63, width: 0.032 },
  { from: [-0.3, -0.06], to: [-0.32, 0.11], start: 0.2, end: 0.42, width: 0.038 },
  { from: [-0.32, 0.11], to: [-0.25, 0.24], start: 0.4, end: 0.7, width: 0.028 },
  { from: [-0.3, -0.06], to: [-0.28, -0.22], start: 0.24, end: 0.48, width: 0.035 },
  { from: [-0.28, -0.22], to: [-0.17, -0.31], start: 0.45, end: 0.74, width: 0.027 },

  // South-eastern colony: the inward arm answers the western tip without touching it.
  { from: [0.37, -0.24], to: [0.28, -0.16], start: 0.01, end: 0.16, width: 0.05 },
  { from: [0.28, -0.16], to: [0.19, -0.08], start: 0.12, end: 0.31, width: 0.044 },
  { from: [0.19, -0.08], to: [0.078, 0.04], start: 0.29, end: 0.64, width: 0.032 },
  { from: [0.28, -0.16], to: [0.4, -0.07], start: 0.2, end: 0.41, width: 0.038 },
  { from: [0.4, -0.07], to: [0.45, 0.08], start: 0.39, end: 0.7, width: 0.028 },
  { from: [0.28, -0.16], to: [0.17, -0.28], start: 0.23, end: 0.46, width: 0.035 },
  { from: [0.17, -0.28], to: [0.03, -0.34], start: 0.43, end: 0.73, width: 0.027 },

  // Northern colony: a short central stem fans into two asymmetric surface veins.
  { from: [0.07, 0.4], to: [0.04, 0.28], start: 0.02, end: 0.17, width: 0.05 },
  { from: [0.04, 0.28], to: [0.02, 0.18], start: 0.13, end: 0.32, width: 0.044 },
  { from: [0.02, 0.18], to: [0.005, 0.105], start: 0.3, end: 0.61, width: 0.032 },
  { from: [0.04, 0.28], to: [0.18, 0.25], start: 0.21, end: 0.43, width: 0.038 },
  { from: [0.18, 0.25], to: [0.31, 0.17], start: 0.4, end: 0.7, width: 0.028 },
  { from: [0.04, 0.28], to: [-0.1, 0.31], start: 0.24, end: 0.46, width: 0.036 },
  { from: [-0.1, 0.31], to: [-0.24, 0.25], start: 0.43, end: 0.72, width: 0.027 },
];

const reactionSpots = [
  { point: [-0.205, 0.13], start: 0.46, radius: 0.031 },
  { point: [-0.225, -0.145], start: 0.52, radius: 0.026 },
  { point: [0.315, -0.015], start: 0.47, radius: 0.03 },
  { point: [0.12, -0.205], start: 0.55, radius: 0.027 },
  { point: [0.145, 0.31], start: 0.48, radius: 0.029 },
  { point: [-0.115, 0.265], start: 0.53, radius: 0.026 },
];

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smootherstep(edge0, edge1, value) {
  const amount = clamp((value - edge0) / (edge1 - edge0));
  return amount * amount * amount * (amount * (amount * 6 - 15) + 10);
}

function phaseState(time) {
  const phase = ((time / LOOP_SECONDS) % 1 + 1) % 1;
  const growth = smootherstep(0.115, 0.6, phase);
  const starvation = smootherstep(0.67, 0.95, phase);
  return {
    phase,
    growth,
    starvation,
    washRadius: -0.08 + starvation * 0.95,
  };
}

function segmentReveal(segment, growth) {
  return smootherstep(segment.start, segment.end, growth);
}

function mapPoint(point, centerX, centerY, scale) {
  return [centerX + point[0] * scale, centerY - point[1] * scale];
}

function traceSegment(context, segment, reveal, centerX, centerY, scale) {
  const start = mapPoint(segment.from, centerX, centerY, scale);
  const tip = mapPoint(
    [
      segment.from[0] + (segment.to[0] - segment.from[0]) * reveal,
      segment.from[1] + (segment.to[1] - segment.from[1]) * reveal,
    ],
    centerX,
    centerY,
    scale,
  );
  context.beginPath();
  context.moveTo(start[0], start[1]);
  context.lineTo(tip[0], tip[1]);
  return tip;
}

function drawSegmentPass(context, state, centerX, centerY, scale, color, offset, widthScale) {
  context.save();
  context.translate(offset[0], offset[1]);
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineCap = "round";
  context.lineJoin = "round";

  for (const segment of branchSegments) {
    const reveal = segmentReveal(segment, state.growth);
    if (reveal < 0.004) continue;
    const pulse = 1 + Math.sin(state.phase * TAU * 2 + segment.start * 9) * 0.035;
    const radius = segment.width * (0.66 + reveal * 0.34) * pulse * 0.82;
    const tip = traceSegment(context, segment, reveal, centerX, centerY, scale);
    context.lineWidth = Math.max(0.42, radius * scale * 2 * widthScale);
    context.stroke();

    const activeTip = 1 + (1 - smootherstep(0.86, 1, reveal)) * 0.32;
    context.beginPath();
    context.arc(tip[0], tip[1], radius * scale * activeTip * widthScale, 0, TAU);
    context.fill();
  }

  context.restore();
}

function applySurvivalClip(context, centerX, centerY, scale, washRadius) {
  if (washRadius <= 0) return;
  const outsideWash = new Path2D();
  outsideWash.rect(-2, -2, centerX * 2 + 4, centerY * 2 + 4);
  outsideWash.arc(centerX, centerY, washRadius * scale, 0, TAU);
  context.clip(outsideWash, "evenodd");
}

function drawFallback(context, time, _delta, width, height) {
  const state = phaseState(time);
  const size = Math.min(width, height);
  const scale = size * 0.5;
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const radius = SEED_RADIUS * scale;
  const lightWander = Math.sin(state.phase * TAU) * scale * 0.025;

  context.save();
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, TAU);
  context.shadowColor = "rgba(52, 50, 46, 0.2)";
  context.shadowBlur = Math.max(0.75, size * 0.045);
  context.shadowOffsetY = size * 0.018;
  const pearl = context.createRadialGradient(
    centerX - radius * 0.34 + lightWander,
    centerY - radius * 0.42,
    radius * 0.03,
    centerX + radius * 0.06,
    centerY + radius * 0.12,
    radius * 1.18,
  );
  pearl.addColorStop(0, "rgba(252, 250, 243, 0.97)");
  pearl.addColorStop(0.38, "rgba(232, 227, 216, 0.95)");
  pearl.addColorStop(0.78, "rgba(197, 192, 182, 0.92)");
  pearl.addColorStop(1, "rgba(119, 117, 112, 0.86)");
  context.fillStyle = pearl;
  context.fill();
  context.restore();

  context.save();
  context.beginPath();
  context.arc(centerX, centerY, radius - Math.max(0.2, size * 0.012), 0, TAU);
  context.clip();
  applySurvivalClip(context, centerX, centerY, scale, state.washRadius);

  // A bright upstream lip and a soft downstream recess create the same shallow
  // concentration emboss as the fragment shader without resorting to blur.
  const bevelOffset = Math.max(0.24, size * 0.012);
  drawSegmentPass(
    context,
    state,
    centerX,
    centerY,
    scale,
    "rgba(252, 250, 243, 0.52)",
    [-bevelOffset, -bevelOffset],
    1.34,
  );
  drawSegmentPass(
    context,
    state,
    centerX,
    centerY,
    scale,
    "rgba(62, 59, 55, 0.34)",
    [bevelOffset, bevelOffset],
    1.22,
  );
  drawSegmentPass(
    context,
    state,
    centerX,
    centerY,
    scale,
    "rgba(29, 28, 27, 0.9)",
    [0, 0],
    1,
  );

  for (const inoculation of inoculations) {
    const reveal = smootherstep(inoculation.start, inoculation.start + 0.055, state.phase);
    if (reveal < 0.004) continue;
    const point = mapPoint(inoculation.point, centerX, centerY, scale);
    context.beginPath();
    context.arc(point[0], point[1], scale * 0.026 * reveal, 0, TAU);
    context.fillStyle = `rgba(23, 22, 21, ${0.92 * reveal})`;
    context.fill();
  }

  for (const spot of reactionSpots) {
    const reveal = smootherstep(spot.start, spot.start + 0.13, state.growth);
    if (reveal < 0.004) continue;
    const point = mapPoint(spot.point, centerX, centerY, scale);
    context.beginPath();
    context.arc(point[0], point[1], scale * spot.radius * reveal, 0, TAU);
    context.fillStyle = `rgba(35, 33, 31, ${0.78 * reveal})`;
    context.fill();
  }
  context.restore();

  if (state.starvation > 0.002 && state.washRadius > 0) {
    context.save();
    context.beginPath();
    context.arc(centerX, centerY, state.washRadius * scale, 0, TAU);
    context.strokeStyle = `rgba(252, 250, 243, ${0.62 * (1 - state.starvation * 0.34)})`;
    context.lineWidth = Math.max(0.55, size * 0.027);
    context.stroke();
    context.beginPath();
    context.arc(
      centerX,
      centerY,
      Math.max(0, state.washRadius * scale + size * 0.018),
      0,
      TAU,
    );
    context.strokeStyle = `rgba(74, 70, 65, ${0.18 * (1 - state.starvation)})`;
    context.lineWidth = Math.max(0.35, size * 0.014);
    context.stroke();
    context.restore();
  }

  context.beginPath();
  context.arc(centerX, centerY, radius, 0, TAU);
  context.strokeStyle = "rgba(54, 52, 49, 0.46)";
  context.lineWidth = Math.max(0.52, size * 0.022);
  context.stroke();
}

const fragment = `
const float TAU = 6.283185307179586;
const float LOOP = 6.0;
const float SEED_RADIUS = 0.72;

float smoother(float edge0, float edge1, float value) {
  float amount = clamp((value - edge0) / (edge1 - edge0), 0.0, 1.0);
  return amount * amount * amount * (amount * (amount * 6.0 - 15.0) + 10.0);
}

float sdCapsule(vec2 point, vec2 start, vec2 end, float radius) {
  vec2 axis = end - start;
  float amount = clamp(
    dot(point - start, axis) / max(dot(axis, axis), 0.00001),
    0.0,
    1.0
  );
  return length(point - start - axis * amount) - radius;
}

float livingSegment(
  vec2 point,
  vec2 start,
  vec2 end,
  float startPhase,
  float endPhase,
  float radius,
  float growth,
  float pulse
) {
  float reveal = smoother(startPhase, endPhase, growth);
  float activation = smoothstep(0.0, 0.025, reveal);
  vec2 tip = mix(start, end, reveal);
  float currentRadius = radius * mix(0.66, 1.0, reveal) * pulse * 0.82;
  float distanceToVein = sdCapsule(point, start, tip, currentRadius);
  float activeTip = 1.0 + (1.0 - smoother(0.86, 1.0, reveal)) * 0.32;
  distanceToVein = min(
    distanceToVein,
    length(point - tip) - currentRadius * activeTip
  );
  return mix(1.0, distanceToVein, activation);
}

float livingSpot(
  vec2 point,
  vec2 center,
  float startPhase,
  float radius,
  float growth
) {
  float reveal = smoother(startPhase, startPhase + 0.13, growth);
  return mix(1.0, length(point - center) - radius * reveal, reveal);
}

float inoculation(
  vec2 point,
  vec2 center,
  float startPhase,
  float phase
) {
  float reveal = smoother(startPhase, startPhase + 0.055, phase);
  return mix(1.0, length(point - center) - 0.026 * reveal, reveal);
}

float reactionColony(
  vec2 point,
  vec2 center,
  float orientation,
  float growth
) {
  vec2 local = point - center;
  float radius = length(local);
  float angle = atan(local.y, local.x);
  float front = mix(0.014, 0.455, growth);
  float frontWarp = radius +
    sin(angle * 3.0 + orientation) * 0.034 +
    sin(angle * 7.0 - orientation * 1.3) * 0.014;
  float domain = smoothstep(front + 0.026, front - 0.02, frontWarp);

  // Two coupled polar modes approximate the maze-and-coral families of a
  // Gray-Scott surface. Their fixed phase keeps every branch deterministic.
  float reaction =
    sin(radius * 18.0 - sin(angle * 3.0 + orientation) * 2.15 + orientation) +
    sin(radius * 11.0 + angle * 5.0 - orientation * 1.4) * 0.46;
  float vein = 1.0 - smoothstep(0.11, 0.34, abs(reaction));
  float root = 1.0 - smoothstep(0.022, 0.052, radius);
  float awayFromRoot = smoothstep(0.046, 0.105, radius);
  return domain * max(root, vein * awayFromRoot);
}

float reactionSurface(vec2 point, float phase) {
  float growth = smoother(0.115, 0.6, phase);
  float colony = reactionColony(point, vec2(-0.43, -0.09), 0.4, growth);
  colony = max(colony, reactionColony(point, vec2(0.37, -0.24), 2.7, growth));
  colony = max(colony, reactionColony(point, vec2(0.07, 0.4), 4.8, growth));
  return colony;
}

float coralDistance(vec2 point, float phase, float seed) {
  float growth = smoother(0.115, 0.6, phase);
  float pulse = 1.0 + sin(phase * TAU * 2.0 + seed * 0.73) * 0.035;
  vec2 warped = point + vec2(
    sin(point.y * 12.0 + seed * 1.7),
    sin(point.x * 14.0 - seed * 1.1)
  ) * (0.004 + 0.009 * growth);
  float distanceToCoral = 1.0;

  distanceToCoral = min(distanceToCoral, inoculation(warped, vec2(-0.43, -0.09), 0.08, phase));
  distanceToCoral = min(distanceToCoral, inoculation(warped, vec2(0.37, -0.24), 0.105, phase));
  distanceToCoral = min(distanceToCoral, inoculation(warped, vec2(0.07, 0.4), 0.13, phase));

  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(-0.43, -0.09), vec2(-0.3, -0.06), 0.0, 0.16, 0.05, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(-0.3, -0.06), vec2(-0.2, 0.02), 0.12, 0.32, 0.044, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(-0.2, 0.02), vec2(-0.075, 0.065), 0.3, 0.63, 0.032, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(-0.3, -0.06), vec2(-0.32, 0.11), 0.2, 0.42, 0.038, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(-0.32, 0.11), vec2(-0.25, 0.24), 0.4, 0.7, 0.028, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(-0.3, -0.06), vec2(-0.28, -0.22), 0.24, 0.48, 0.035, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(-0.28, -0.22), vec2(-0.17, -0.31), 0.45, 0.74, 0.027, growth, pulse));

  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(0.37, -0.24), vec2(0.28, -0.16), 0.01, 0.16, 0.05, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(0.28, -0.16), vec2(0.19, -0.08), 0.12, 0.31, 0.044, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(0.19, -0.08), vec2(0.078, 0.04), 0.29, 0.64, 0.032, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(0.28, -0.16), vec2(0.4, -0.07), 0.2, 0.41, 0.038, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(0.4, -0.07), vec2(0.45, 0.08), 0.39, 0.7, 0.028, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(0.28, -0.16), vec2(0.17, -0.28), 0.23, 0.46, 0.035, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(0.17, -0.28), vec2(0.03, -0.34), 0.43, 0.73, 0.027, growth, pulse));

  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(0.07, 0.4), vec2(0.04, 0.28), 0.02, 0.17, 0.05, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(0.04, 0.28), vec2(0.02, 0.18), 0.13, 0.32, 0.044, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(0.02, 0.18), vec2(0.005, 0.105), 0.3, 0.61, 0.032, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(0.04, 0.28), vec2(0.18, 0.25), 0.21, 0.43, 0.038, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(0.18, 0.25), vec2(0.31, 0.17), 0.4, 0.7, 0.028, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(0.04, 0.28), vec2(-0.1, 0.31), 0.24, 0.46, 0.036, growth, pulse));
  distanceToCoral = min(distanceToCoral, livingSegment(warped, vec2(-0.1, 0.31), vec2(-0.24, 0.25), 0.43, 0.72, 0.027, growth, pulse));

  distanceToCoral = min(distanceToCoral, livingSpot(warped, vec2(-0.205, 0.13), 0.46, 0.031, growth));
  distanceToCoral = min(distanceToCoral, livingSpot(warped, vec2(-0.225, -0.145), 0.52, 0.026, growth));
  distanceToCoral = min(distanceToCoral, livingSpot(warped, vec2(0.315, -0.015), 0.47, 0.03, growth));
  distanceToCoral = min(distanceToCoral, livingSpot(warped, vec2(0.12, -0.205), 0.55, 0.027, growth));
  distanceToCoral = min(distanceToCoral, livingSpot(warped, vec2(0.145, 0.31), 0.48, 0.029, growth));
  distanceToCoral = min(distanceToCoral, livingSpot(warped, vec2(-0.115, 0.265), 0.53, 0.026, growth));
  return distanceToCoral;
}

float survivalAt(vec2 point, float phase) {
  float starvation = smoother(0.67, 0.95, phase);
  float washRadius = mix(-0.08, 0.87, starvation);
  return smoothstep(washRadius - 0.022, washRadius + 0.028, length(point));
}

vec4 shade(vec2 uv, float timeSeconds, float seed) {
  float phase = fract(timeSeconds / LOOP);
  float radius = length(uv);
  float distanceToSeed = radius - SEED_RADIUS;
  float antialias = max(fwidth(distanceToSeed), 0.005);
  float body = smoothstep(antialias, -antialias, distanceToSeed);
  float outerMist = smoothstep(0.78, 0.715, radius) * (1.0 - body);

  float sphereZ = sqrt(max(0.0, 1.0 - pow(radius / SEED_RADIUS, 2.0)));
  float lightWander = sin(phase * TAU) * 0.045;
  vec3 normal = normalize(vec3(uv / SEED_RADIUS, sphereZ));
  vec3 lightDirection = normalize(vec3(-0.55 + lightWander, 0.68, 0.72));
  vec3 halfDirection = normalize(lightDirection + vec3(0.0, 0.0, 1.0));
  float diffuse = clamp(dot(normal, lightDirection) * 0.5 + 0.5, 0.0, 1.0);
  float specular = pow(max(dot(normal, halfDirection), 0.0), 34.0);
  float rim = pow(1.0 - sphereZ, 2.1);

  vec3 warmShadow = vec3(0.47, 0.455, 0.425);
  vec3 warmPearl = vec3(0.91, 0.89, 0.845);
  vec3 pearlHighlight = vec3(0.99, 0.982, 0.95);
  vec3 color = mix(warmShadow, warmPearl, 0.28 + diffuse * 0.72);
  color = mix(color, vec3(0.29, 0.285, 0.275), rim * 0.42);
  color = mix(color, pearlHighlight, specular * 0.5);

  // Expand the texture slightly toward the silhouette so the chemistry reads
  // as wrapped around a shallow sphere instead of pasted onto a flat badge.
  vec2 surfacePoint = uv / (0.89 + sphereZ * 0.11);
  float distanceToCoral = coralDistance(surfacePoint, phase, seed);
  float coralAA = max(fwidth(distanceToCoral) * 1.15, 0.0065);
  float rimFade = 1.0 - smoothstep(0.58, 0.69, radius);
  float survival = survivalAt(surfacePoint, phase);
  float skeleton = smoothstep(coralAA, -coralAA, distanceToCoral) * survival * rimFade;
  float maturity = smoother(0.18, 0.72, smoother(0.115, 0.6, phase));
  float chemical = reactionSurface(surfacePoint, phase) * survival * rimFade;
  float coral = max(chemical, skeleton * mix(1.0, 0.42, maturity));

  vec2 bevelOffset = normalize(vec2(-0.72, 0.69)) * 0.016;
  float upstream = smoothstep(
    0.011,
    -0.011,
    coralDistance(surfacePoint + bevelOffset, phase, seed)
  ) * survivalAt(surfacePoint + bevelOffset, phase);
  float downstream = smoothstep(
    0.011,
    -0.011,
    coralDistance(surfacePoint - bevelOffset, phase, seed)
  ) * survivalAt(surfacePoint - bevelOffset, phase);
  float chemicalUpstream = reactionSurface(surfacePoint + bevelOffset, phase) *
    survivalAt(surfacePoint + bevelOffset, phase);
  float chemicalDownstream = reactionSurface(surfacePoint - bevelOffset, phase) *
    survivalAt(surfacePoint - bevelOffset, phase);
  float emboss = mix(
    upstream - downstream,
    chemicalUpstream - chemicalDownstream,
    maturity
  ) * rimFade;

  color = mix(color, vec3(0.085, 0.081, 0.076), coral * 0.84);
  color = mix(color, pearlHighlight, max(emboss, 0.0) * 0.34);
  color = mix(color, vec3(0.22, 0.21, 0.195), max(-emboss, 0.0) * 0.4);

  float starvation = smoother(0.67, 0.95, phase);
  float washRadius = mix(-0.08, 0.87, starvation);
  float washPresence = smoothstep(0.0, 0.08, starvation) *
    (1.0 - smoother(0.88, 1.0, starvation));
  float washLip = exp(-pow((radius - washRadius) / 0.026, 2.0)) * washPresence * body;
  float washShadow = exp(-pow((radius - washRadius - 0.026) / 0.018, 2.0)) *
    washPresence * body;
  color = mix(color, pearlHighlight, washLip * 0.5);
  color = mix(color, vec3(0.28, 0.27, 0.25), washShadow * 0.13);

  float bodyAlpha = body * (0.89 + 0.06 * sphereZ);
  float alpha = clamp(bodyAlpha + outerMist * 0.15, 0.0, 1.0);
  vec3 mistColor = vec3(0.33, 0.32, 0.30);
  color = mix(mistColor, color, body);
  return vec4(color, alpha);
}
`;

export default {
  id: "living-reaction-seed",
  name: "Living Reaction Seed",
  kind: "webgl",
  technique: "Analytic WebGL2 reaction surface and embossed starvation front",
  label: "Growing",
  phaseOffset: 557,
  mount(container) {
    return createShaderVisual(container, {
      name: "Living Reaction Seed",
      seed: 5,
      fragment,
      fallback: drawFallback,
      maxDpr: 3,
    });
  },
};
