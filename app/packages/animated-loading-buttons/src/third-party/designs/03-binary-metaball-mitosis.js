import { createShaderVisual } from "../core/webgl.js";

const LOOP_SECONDS = 3.2;
const TAU = Math.PI * 2;
const BASE_RADIUS = 0.53;
const LARGE_SHARE = 0.64;
const SMALL_SHARE = 1 - LARGE_SHARE;

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smootherstep(edge0, edge1, value) {
  const amount = clamp((value - edge0) / (edge1 - edge0));
  return amount * amount * amount * (amount * (amount * 6 - 15) + 10);
}

function pulse(value, rise0, rise1, fall0, fall1) {
  return smootherstep(rise0, rise1, value) * (1 - smootherstep(fall0, fall1, value));
}

function phaseState(time) {
  const phase = ((time / LOOP_SECONDS) % 1 + 1) % 1;
  const outward = smootherstep(0.04, 0.36, phase);
  const inward = 1 - smootherstep(0.68, 0.86, phase);
  const division =
    smootherstep(0.13, 0.36, phase) *
    (1 - smootherstep(0.72, 0.88, phase));
  const separation = 0.82 * outward * inward;
  const angle = -0.2 + TAU * smootherstep(0.34, 0.68, phase);
  const axisX = Math.cos(angle);
  const axisY = Math.sin(angle) * 0.78;
  const axisLength = Math.hypot(axisX, axisY) || 1;
  const axis = [axisX / axisLength, axisY / axisLength];
  const perpendicular = [-axis[1], axis[0]];

  const radiusA = BASE_RADIUS * (1 + (Math.sqrt(LARGE_SHARE) - 1) * division);
  const radiusB = 0.14 + (BASE_RADIUS * Math.sqrt(SMALL_SHARE) - 0.14) * division;
  const massA = radiusA * radiusA;
  const massB = radiusB * radiusB;
  const totalMass = massA + massB;
  const relativeX = axis[0] * separation;
  const relativeY = axis[1] * separation;
  const centerA = [
    -relativeX * (massB / totalMass),
    -relativeY * (massB / totalMass),
  ];
  const centerB = [
    relativeX * (massA / totalMass),
    relativeY * (massA / totalMass),
  ];

  const outboundNeck = pulse(phase, 0.06, 0.16, 0.28, 0.4);
  const inboundNeck = pulse(phase, 0.67, 0.73, 0.82, 0.91);
  const centerC = [
    centerA[0] +
      (centerB[0] - centerA[0]) * (0.44 * outboundNeck + 0.36 * inboundNeck) +
      perpendicular[0] * 0.018 * outboundNeck,
    centerA[1] +
      (centerB[1] - centerA[1]) * (0.44 * outboundNeck + 0.36 * inboundNeck) +
      perpendicular[1] * 0.018 * outboundNeck,
  ];
  const centerD = [
    centerB[0] +
      (centerA[0] - centerB[0]) * (0.4 * outboundNeck + 0.34 * inboundNeck) -
      perpendicular[0] * 0.015 * outboundNeck,
    centerB[1] +
      (centerA[1] - centerB[1]) * (0.4 * outboundNeck + 0.34 * inboundNeck) -
      perpendicular[1] * 0.015 * outboundNeck,
  ];

  return {
    phase,
    axis,
    perpendicular,
    separation,
    radiusA,
    radiusB,
    centerA,
    centerB,
    centerC,
    centerD,
    radiusC: radiusA * 0.36 + 0.105 * outboundNeck + 0.075 * inboundNeck,
    radiusD: radiusB * 0.39 + 0.095 * outboundNeck + 0.065 * inboundNeck,
    ripple: pulse(phase, 0.78, 0.83, 0.9, 1),
    glint: pulse(phase, 0.69, 0.72, 0.8, 0.87),
  };
}

function appendCircle(path, center, radius, cx, cy, scale) {
  path.moveTo(cx + (center[0] + radius) * scale, cy - center[1] * scale);
  path.arc(
    cx + center[0] * scale,
    cy - center[1] * scale,
    radius * scale,
    0,
    TAU,
  );
}

function makeRipplePath(state, cx, cy, scale) {
  const path = new Path2D();
  const samples = 44;
  for (let index = 0; index <= samples; index += 1) {
    const angle = (index / samples) * TAU;
    const travelingWave = Math.cos(angle * 3 - (state.phase - 0.79) * 37);
    const radius = BASE_RADIUS - 0.04 * state.ripple * travelingWave;
    const x = cx + Math.cos(angle) * radius * scale;
    const y = cy - Math.sin(angle) * radius * scale;
    if (index === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  path.closePath();
  return path;
}

function drawFallback(context, time, _delta, width, height) {
  const state = phaseState(time);
  const scale = Math.min(width, height) * 0.5;
  const cx = width * 0.5;
  const cy = height * 0.5;
  let silhouette;

  if (state.phase > 0.805 && state.ripple > 0.001) {
    silhouette = makeRipplePath(state, cx, cy, scale);
  } else {
    silhouette = new Path2D();
    appendCircle(silhouette, state.centerA, state.radiusA, cx, cy, scale);
    appendCircle(silhouette, state.centerB, state.radiusB, cx, cy, scale);
    appendCircle(silhouette, state.centerC, state.radiusC, cx, cy, scale);
    appendCircle(silhouette, state.centerD, state.radiusD, cx, cy, scale);
  }

  context.save();
  context.shadowColor = "rgba(100, 105, 106, 0.2)";
  context.shadowBlur = Math.max(0.8, scale * 0.055);
  context.fillStyle = "rgba(22, 23, 24, 0.9)";
  context.fill(silhouette);
  context.restore();

  context.save();
  context.clip(silhouette);
  const bodyGradient = context.createLinearGradient(
    cx - scale * 0.48,
    cy - scale * 0.55,
    cx + scale * 0.48,
    cy + scale * 0.62,
  );
  bodyGradient.addColorStop(0, "rgba(108, 112, 112, 0.9)");
  bodyGradient.addColorStop(0.27, "rgba(43, 45, 46, 0.94)");
  bodyGradient.addColorStop(0.72, "rgba(19, 20, 21, 0.96)");
  bodyGradient.addColorStop(1, "rgba(8, 9, 10, 0.96)");
  context.fillStyle = bodyGradient;
  context.fillRect(0, 0, width, height);

  for (const [center, radius] of [
    [state.centerA, state.radiusA],
    [state.centerB, state.radiusB],
  ]) {
    const localX = cx + (center[0] - radius * 0.26) * scale;
    const localY = cy - (center[1] + radius * 0.3) * scale;
    const highlight = context.createRadialGradient(
      localX,
      localY,
      0,
      localX,
      localY,
      radius * scale * 1.15,
    );
    highlight.addColorStop(0, "rgba(245, 246, 243, 0.31)");
    highlight.addColorStop(0.22, "rgba(191, 195, 194, 0.14)");
    highlight.addColorStop(0.7, "rgba(38, 39, 40, 0.02)");
    highlight.addColorStop(1, "rgba(0, 0, 0, 0.13)");
    context.fillStyle = highlight;
    context.fillRect(0, 0, width, height);
  }
  context.restore();

  if (state.glint > 0.001) {
    const contactA = [
      state.centerA[0] + state.axis[0] * state.radiusA,
      state.centerA[1] + state.axis[1] * state.radiusA,
    ];
    const contactB = [
      state.centerB[0] - state.axis[0] * state.radiusB,
      state.centerB[1] - state.axis[1] * state.radiusB,
    ];
    const contactX = cx + (contactA[0] + contactB[0]) * 0.5 * scale;
    const contactY = cy - (contactA[1] + contactB[1]) * 0.5 * scale;
    context.save();
    context.translate(contactX, contactY);
    context.rotate(-Math.atan2(state.axis[1], state.axis[0]));
    context.scale(0.42, 1);
    context.beginPath();
    context.arc(0, 0, scale * 0.075, 0, TAU);
    context.fillStyle = `rgba(252, 252, 248, ${0.92 * state.glint})`;
    context.shadowColor = `rgba(255, 255, 252, ${0.38 * state.glint})`;
    context.shadowBlur = scale * 0.045;
    context.fill();
    context.restore();
  }
}

const fragment = `
const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;
const float LOOP = 3.2;
const float BASE_RADIUS = 0.53;
const float LARGE_SHARE = 0.64;
const float SMALL_SHARE = 0.36;

float smoother(float edge0, float edge1, float value) {
  float amount = clamp((value - edge0) / (edge1 - edge0), 0.0, 1.0);
  return amount * amount * amount * (amount * (amount * 6.0 - 15.0) + 10.0);
}

float pulse(float value, float rise0, float rise1, float fall0, float fall1) {
  return smoother(rise0, rise1, value) * (1.0 - smoother(fall0, fall1, value));
}

float softMinimum(float a, float b, float softness) {
  float blend = clamp(0.5 + 0.5 * (b - a) / softness, 0.0, 1.0);
  return mix(b, a, blend) - softness * blend * (1.0 - blend);
}

float circleField(vec2 point, vec2 center, float radius) {
  return length(point - center) - radius;
}

void bodyGeometry(
  float phase,
  out vec2 centerA,
  out vec2 centerB,
  out vec2 centerC,
  out vec2 centerD,
  out vec2 axis,
  out float radiusA,
  out float radiusB,
  out float radiusC,
  out float radiusD,
  out float separation,
  out float ripple
) {
  float outward = smoother(0.04, 0.36, phase);
  float inward = 1.0 - smoother(0.68, 0.86, phase);
  float division = smoother(0.13, 0.36, phase) *
    (1.0 - smoother(0.72, 0.88, phase));
  separation = 0.82 * outward * inward;

  float angle = -0.2 + TAU * smoother(0.34, 0.68, phase);
  axis = normalize(vec2(cos(angle), sin(angle) * 0.78));
  vec2 perpendicular = vec2(-axis.y, axis.x);

  radiusA = mix(BASE_RADIUS, BASE_RADIUS * sqrt(LARGE_SHARE), division);
  radiusB = mix(0.14, BASE_RADIUS * sqrt(SMALL_SHARE), division);
  float massA = radiusA * radiusA;
  float massB = radiusB * radiusB;
  vec2 relativePosition = axis * separation;
  centerA = -relativePosition * (massB / (massA + massB));
  centerB = relativePosition * (massA / (massA + massB));

  float outboundNeck = pulse(phase, 0.06, 0.16, 0.28, 0.4);
  float inboundNeck = pulse(phase, 0.67, 0.73, 0.82, 0.91);
  centerC = centerA +
    (centerB - centerA) * (0.44 * outboundNeck + 0.36 * inboundNeck) +
    perpendicular * 0.018 * outboundNeck;
  centerD = centerB +
    (centerA - centerB) * (0.4 * outboundNeck + 0.34 * inboundNeck) -
    perpendicular * 0.015 * outboundNeck;
  radiusC = radiusA * 0.36 + 0.105 * outboundNeck + 0.075 * inboundNeck;
  radiusD = radiusB * 0.39 + 0.095 * outboundNeck + 0.065 * inboundNeck;
  ripple = pulse(phase, 0.78, 0.83, 0.9, 1.0);
}

float bodyDistance(vec2 point, float phase) {
  vec2 centerA;
  vec2 centerB;
  vec2 centerC;
  vec2 centerD;
  vec2 axis;
  float radiusA;
  float radiusB;
  float radiusC;
  float radiusD;
  float separation;
  float ripple;
  bodyGeometry(
    phase,
    centerA,
    centerB,
    centerC,
    centerD,
    axis,
    radiusA,
    radiusB,
    radiusC,
    radiusD,
    separation,
    ripple
  );

  float necking = max(
    pulse(phase, 0.06, 0.16, 0.28, 0.4),
    pulse(phase, 0.67, 0.73, 0.82, 0.91)
  );
  float softness = mix(0.024, 0.105, necking);
  float distanceToBody = circleField(point, centerA, radiusA);
  distanceToBody = softMinimum(
    distanceToBody,
    circleField(point, centerB, radiusB),
    softness
  );
  distanceToBody = softMinimum(
    distanceToBody,
    circleField(point, centerC, radiusC),
    softness * 0.82
  );
  distanceToBody = softMinimum(
    distanceToBody,
    circleField(point, centerD, radiusD),
    softness * 0.78
  );

  float angle = atan(point.y, point.x);
  float edgeEnvelope = smoother(0.2, 0.46, length(point));
  float capillaryWave = cos(angle * 3.0 - (phase - 0.79) * 37.0);
  distanceToBody += 0.04 * ripple * capillaryWave * edgeEnvelope;
  return distanceToBody;
}

vec4 shade(vec2 uv, float time, float seed) {
  float phase = fract(time / LOOP);
  float distanceToBody = bodyDistance(uv, phase);
  float antialias = max(fwidth(distanceToBody) * 1.2, 0.0065);
  float body = smoothstep(antialias, -antialias, distanceToBody);
  float mist = smoothstep(0.062, -0.006, distanceToBody);

  float interior = clamp(-distanceToBody / BASE_RADIUS, 0.0, 1.0);
  float dome = sqrt(max(0.0, interior * (2.0 - interior)));
  float gradientStep = 0.008;
  vec2 gradient = vec2(
    bodyDistance(uv + vec2(gradientStep, 0.0), phase) -
      bodyDistance(uv - vec2(gradientStep, 0.0), phase),
    bodyDistance(uv + vec2(0.0, gradientStep), phase) -
      bodyDistance(uv - vec2(0.0, gradientStep), phase)
  );
  gradient = normalize(gradient + vec2(0.00001));
  vec3 normal = normalize(vec3(gradient * sqrt(max(0.0, 1.0 - dome * dome)), dome));
  vec3 lightDirection = normalize(vec3(-0.58, 0.7, 0.62));
  vec3 halfDirection = normalize(lightDirection + vec3(0.0, 0.0, 1.0));
  float diffuse = max(dot(normal, lightDirection), 0.0);
  float specular = pow(max(dot(normal, halfDirection), 0.0), 34.0);
  float fogRim = pow(1.0 - dome, 2.15);

  vec3 graphite = vec3(0.075, 0.079, 0.082);
  vec3 litGraphite = vec3(0.145, 0.151, 0.152);
  vec3 fog = vec3(0.52, 0.535, 0.535);
  vec3 color = mix(graphite, litGraphite, 0.24 + 0.76 * diffuse);
  color = mix(color, fog, fogRim * 0.53);
  color += specular * vec3(0.34, 0.35, 0.34);

  vec2 centerA;
  vec2 centerB;
  vec2 centerC;
  vec2 centerD;
  vec2 axis;
  float radiusA;
  float radiusB;
  float radiusC;
  float radiusD;
  float separation;
  float ripple;
  bodyGeometry(
    phase,
    centerA,
    centerB,
    centerC,
    centerD,
    axis,
    radiusA,
    radiusB,
    radiusC,
    radiusD,
    separation,
    ripple
  );
  vec2 contactA = centerA + axis * radiusA;
  vec2 contactB = centerB - axis * radiusB;
  vec2 contact = (contactA + contactB) * 0.5;
  vec2 tangent = vec2(-axis.y, axis.x);
  vec2 fromContact = uv - contact;
  float contactGlint = exp(
    -pow(dot(fromContact, axis) / 0.033, 2.0) -
    pow(dot(fromContact, tangent) / 0.096, 2.0)
  );
  float glintPhase = pulse(phase, 0.69, 0.72, 0.8, 0.87);
  float proximity = 0.52 + 0.48 *
    (1.0 - smoother(0.04, 0.3, abs(separation - radiusA - radiusB)));
  float pearl = contactGlint * glintPhase * proximity;
  color = mix(color, vec3(0.985, 0.985, 0.965), pearl);

  float alpha = max(body * (0.86 + 0.08 * dome), mist * 0.18);
  alpha = max(alpha, pearl * 0.96);
  return vec4(color, alpha);
}
`;

export default {
  id: "binary-metaball-mitosis",
  name: "Binary Metaball Mitosis",
  kind: "webgl",
  technique: "WebGL2 analytic SDF mitosis",
  label: "Merging",
  phaseOffset: 317,
  mount(container) {
    return createShaderVisual(container, {
      name: "Binary Metaball Mitosis",
      seed: 3,
      fragment,
      fallback: drawFallback,
      maxDpr: 3,
    });
  },
};
