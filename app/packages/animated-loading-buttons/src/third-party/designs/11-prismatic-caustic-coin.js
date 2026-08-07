import { createShaderVisual } from "../core/webgl.js";

const LOOP_SECONDS = 4;
const TAU = Math.PI * 2;
// 84.6 degrees leaves a five-pixel rigid edge at 30px instead of collapsing.
const MAX_YAW = Math.PI * 0.47;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

function smootherstep(start, end, value) {
  const amount = clamp01((value - start) / (end - start));
  return amount ** 3 * (amount * (amount * 6 - 15) + 10);
}

function motionAt(time) {
  const phase = ((time / LOOP_SECONDS) % 1 + 1) % 1;
  const turnIn = smootherstep(0.08, 0.32, phase);
  const turnOut = 1 - smootherstep(0.44, 0.82, phase);
  const yaw = MAX_YAW * turnIn * turnOut;
  const separation = Math.sin(yaw) * smootherstep(0.23, 0.43, phase) *
    (1 - smootherstep(0.66, 0.82, phase));
  const seamDistance = Math.min(phase, 1 - phase);

  return {
    phase,
    yaw,
    sweep: smootherstep(0.12, 0.78, phase),
    caustic: smootherstep(0.09, 0.18, phase) *
      (1 - smootherstep(0.84, 0.92, phase)),
    separation,
    tick: 1 - smootherstep(0, 0.055, seamDistance),
  };
}

function traceCoin(context, faceHalfWidth, halfDepth, radius) {
  context.beginPath();
  context.moveTo(-halfDepth, -radius);
  context.lineTo(halfDepth, -radius);
  context.ellipse(halfDepth, 0, faceHalfWidth, radius, 0, -Math.PI / 2, Math.PI / 2);
  context.lineTo(-halfDepth, radius);
  context.ellipse(-halfDepth, 0, faceHalfWidth, radius, 0, Math.PI / 2, Math.PI * 1.5);
  context.closePath();
}

function ribbonPath(context, x, radius) {
  context.beginPath();
  context.moveTo(x - radius * 0.035, -radius * 0.72);
  context.bezierCurveTo(
    x + radius * 0.12,
    -radius * 0.28,
    x - radius * 0.1,
    radius * 0.25,
    x + radius * 0.045,
    radius * 0.72,
  );
}

function drawFallback(context, time, _delta, width, height) {
  const state = motionAt(time);
  const size = Math.min(width, height);
  const radius = size * 0.355;
  const faceHalfWidth = Math.max(size * 0.012, radius * Math.cos(state.yaw));
  const halfDepth = size * 0.048 * Math.sin(state.yaw);
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const projectedSweep = (-0.72 + state.sweep * 1.44) * faceHalfWidth;
  const fringeGap = size * 0.055 * state.separation;

  context.save();
  context.translate(centerX, centerY);
  context.rotate(-0.09);
  traceCoin(context, faceHalfWidth, halfDepth, radius);
  context.clip();

  const glass = context.createLinearGradient(-radius, -radius, radius, radius);
  glass.addColorStop(0, "rgba(250, 250, 248, 0.52)");
  glass.addColorStop(0.45, "rgba(211, 215, 214, 0.18)");
  glass.addColorStop(1, "rgba(76, 79, 79, 0.32)");
  context.fillStyle = glass;
  context.fillRect(-radius, -radius, radius * 2, radius * 2);

  context.fillStyle = `rgba(34, 35, 35, ${0.2 * Math.sin(state.yaw)})`;
  context.fillRect(-halfDepth, -radius, halfDepth * 2, radius * 2);

  const fringes = [
    [-fringeGap, "217, 200, 232"],
    [0, "191, 219, 210"],
    [fringeGap, "229, 214, 185"],
  ];
  context.lineCap = "round";
  context.lineWidth = Math.max(0.55, size * 0.023);
  for (const [offset, color] of fringes) {
    ribbonPath(context, projectedSweep + offset, radius);
    context.strokeStyle = `rgba(${color}, ${state.separation * state.caustic * 0.3})`;
    context.stroke();
  }
  ribbonPath(context, projectedSweep, radius);
  context.lineWidth = Math.max(0.62, size * 0.027);
  context.strokeStyle = `rgba(255, 255, 252, ${state.caustic * (0.78 - state.separation * 0.22)})`;
  context.stroke();
  context.restore();

  context.save();
  context.translate(centerX, centerY);
  context.rotate(-0.09);
  traceCoin(context, faceHalfWidth, halfDepth, radius);
  context.lineWidth = Math.max(0.7, size * 0.027);
  context.strokeStyle = "rgba(54, 57, 57, 0.5)";
  context.stroke();

  const filmAlpha = 0.11 + Math.sin(state.yaw) * 0.09;
  context.lineWidth = Math.max(0.42, size * 0.016);
  for (const [start, end, color] of [
    [3.55, 4.42, "217, 200, 232"],
    [4.38, 5.25, "191, 219, 210"],
    [5.2, 6.05, "229, 214, 185"],
  ]) {
    context.beginPath();
    context.ellipse(halfDepth, 0, faceHalfWidth, radius, 0, start, end);
    context.strokeStyle = `rgba(${color}, ${filmAlpha})`;
    context.stroke();
  }

  if (state.tick > 0.001) {
    context.beginPath();
    context.ellipse(0, 0, faceHalfWidth * 0.83, radius * 0.83, 0, 3.72, 4.16);
    context.lineWidth = Math.max(0.72, size * 0.031);
    context.strokeStyle = `rgba(255, 255, 252, ${state.tick * 0.94})`;
    context.stroke();
  }
  context.restore();
}

const fragment = /* glsl */ `
const float PI = 3.141592653589793;
const float COIN_RADIUS = 0.71;
const float COIN_HALF_DEPTH = 0.096;
const float MAX_YAW = PI * 0.47;

float smoother(float edge0, float edge1, float value) {
  float amount = clamp((value - edge0) / (edge1 - edge0), 0.0, 1.0);
  return amount * amount * amount * (amount * (amount * 6.0 - 15.0) + 10.0);
}

mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

vec3 rotateY(vec3 point, float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return vec3(
    cosine * point.x + sine * point.z,
    point.y,
    -sine * point.x + cosine * point.z
  );
}

bool intersectCoin(
  vec3 origin,
  vec3 direction,
  out float entry,
  out float exitDistance,
  out vec3 hitPoint,
  out vec3 hitNormal
) {
  const float FAR = 1000.0;
  float radialNear = -FAR;
  float radialFar = FAR;
  float radialA = dot(direction.xy, direction.xy);

  if (radialA < 0.000001) {
    if (dot(origin.xy, origin.xy) > COIN_RADIUS * COIN_RADIUS) return false;
  } else {
    float radialB = dot(origin.xy, direction.xy);
    float discriminant = radialB * radialB - radialA *
      (dot(origin.xy, origin.xy) - COIN_RADIUS * COIN_RADIUS);
    if (discriminant < 0.0) return false;
    float root = sqrt(discriminant);
    radialNear = (-radialB - root) / radialA;
    radialFar = (-radialB + root) / radialA;
  }

  float slabNear = -FAR;
  float slabFar = FAR;
  if (abs(direction.z) < 0.000001) {
    if (abs(origin.z) > COIN_HALF_DEPTH) return false;
  } else {
    float first = (-COIN_HALF_DEPTH - origin.z) / direction.z;
    float second = (COIN_HALF_DEPTH - origin.z) / direction.z;
    slabNear = min(first, second);
    slabFar = max(first, second);
  }

  entry = max(radialNear, slabNear);
  exitDistance = min(radialFar, slabFar);
  if (exitDistance < max(entry, 0.0)) return false;
  hitPoint = origin + direction * entry;
  hitNormal = slabNear > radialNear
    ? vec3(0.0, 0.0, sign(hitPoint.z))
    : vec3(normalize(hitPoint.xy), 0.0);
  return true;
}

vec3 sampleBackdrop(vec2 point) {
  float paper = 0.925 + point.y * 0.018;
  float diagonal = exp(-pow((dot(point, normalize(vec2(0.74, 0.67))) + 0.15) * 7.2, 2.0));
  float thread = exp(-pow((point.x - point.y * 0.28 - 0.31) * 11.0, 2.0));
  return vec3(paper - diagonal * 0.105 - thread * 0.045);
}

float ribbon(float coordinate, float center, float width) {
  float distanceToRibbon = abs(coordinate - center);
  float antialias = max(fwidth(distanceToRibbon), 0.003);
  return 1.0 - smoothstep(width, width + antialias, distanceToRibbon);
}

void composite(inout vec3 premultiplied, inout float alpha, vec3 color, float layerAlpha) {
  layerAlpha = clamp(layerAlpha, 0.0, 1.0);
  premultiplied = color * layerAlpha + premultiplied * (1.0 - layerAlpha);
  alpha = layerAlpha + alpha * (1.0 - layerAlpha);
}

vec4 shade(vec2 uv, float timeSeconds, float seed) {
  float phase = fract(timeSeconds / 4.0);
  float turnIn = smoother(0.08, 0.32, phase);
  float turnOut = 1.0 - smoother(0.44, 0.82, phase);
  float yaw = MAX_YAW * turnIn * turnOut;
  float split = sin(yaw) * smoother(0.23, 0.43, phase) *
    (1.0 - smoother(0.66, 0.82, phase));
  float causticPresence = smoother(0.09, 0.18, phase) *
    (1.0 - smoother(0.84, 0.92, phase));

  vec2 screenPoint = rotate2d(0.09) * uv;
  vec3 rayOrigin = rotateY(vec3(screenPoint, 2.4), -yaw);
  vec3 rayDirection = rotateY(vec3(0.0, 0.0, -1.0), -yaw);
  float entry;
  float exitDistance;
  vec3 objectPoint;
  vec3 objectNormal;
  if (!intersectCoin(
    rayOrigin,
    rayDirection,
    entry,
    exitDistance,
    objectPoint,
    objectNormal
  )) return vec4(0.0);

  float pathLength = max(0.0, exitDistance - entry);
  vec3 worldNormal = rotateY(objectNormal, yaw);
  vec2 refractionAxis = normalize(worldNormal.xy + vec2(0.0001));
  float opticalPath = min(pathLength, 1.45);

  // Three restrained IOR taps create true analytic dispersion without a PBR pass.
  vec2 lavenderOffset = refractionAxis * opticalPath * (1.0 - 1.0 / 1.526) * 0.19;
  vec2 mintOffset = refractionAxis * opticalPath * (1.0 - 1.0 / 1.518) * 0.19;
  vec2 champagneOffset = refractionAxis * opticalPath * (1.0 - 1.0 / 1.509) * 0.19;
  vec3 lavenderTap = sampleBackdrop(screenPoint - lavenderOffset);
  vec3 mintTap = sampleBackdrop(screenPoint - mintOffset);
  vec3 champagneTap = sampleBackdrop(screenPoint - champagneOffset);
  vec3 transmitted = vec3(lavenderTap.r, mintTap.g, champagneTap.b);

  float facing = abs(dot(worldNormal, vec3(0.0, 0.0, 1.0)));
  float rim = pow(1.0 - facing, 2.2);
  float absorption = 1.0 - exp(-pathLength * 1.15);
  vec3 neutralGlass = mix(transmitted, vec3(0.27), rim * 0.36);
  float bodyAlpha = 0.13 + absorption * 0.13 + rim * 0.28;

  vec3 premultiplied = neutralGlass * bodyAlpha;
  float alpha = bodyAlpha;

  float filmWave = 0.5 + 0.5 * sin(objectPoint.y * 12.0 + facing * 8.0 + seed * 0.07);
  vec3 film = mix(vec3(0.851, 0.784, 0.910), vec3(0.749, 0.859, 0.824), filmWave);
  film = mix(film, vec3(0.898, 0.839, 0.725), smoother(0.58, 0.92, filmWave));
  composite(premultiplied, alpha, film, rim * 0.2);

  float sweep = smoother(0.12, 0.78, phase);
  float projectedSweep = mix(-0.51, 0.51, sweep) * cos(yaw);
  float curve = screenPoint.x + screenPoint.y * 0.045 +
    sin(screenPoint.y * 7.5 + seed * 0.03) * 0.018;
  float fringeGap = 0.075 * split;
  float width = 0.021 + 0.008 * sin(yaw);
  float lavender = ribbon(curve, projectedSweep - fringeGap, width);
  float mint = ribbon(curve, projectedSweep, width);
  float champagne = ribbon(curve, projectedSweep + fringeGap, width);
  float fringeAlpha = split * causticPresence * 0.24;
  composite(premultiplied, alpha, vec3(0.851, 0.784, 0.910), lavender * fringeAlpha);
  composite(premultiplied, alpha, vec3(0.749, 0.859, 0.824), mint * fringeAlpha * 0.88);
  composite(premultiplied, alpha, vec3(0.898, 0.839, 0.725), champagne * fringeAlpha);

  float whiteRibbon = ribbon(curve, projectedSweep, width * 0.7);
  composite(
    premultiplied,
    alpha,
    vec3(0.995, 0.995, 0.98),
    whiteRibbon * causticPresence * (0.68 - split * 0.2)
  );

  float seamDistance = min(phase, 1.0 - phase);
  float tickEnvelope = 1.0 - smoother(0.0, 0.055, seamDistance);
  vec2 faceCoordinate = objectPoint.xy / COIN_RADIUS;
  float polar = atan(faceCoordinate.y, faceCoordinate.x);
  float tickAngle = abs(atan(sin(polar - 2.28), cos(polar - 2.28)));
  float tick = exp(-pow((length(faceCoordinate) - 0.83) / 0.055, 2.0)) *
    (1.0 - smoother(0.1, 0.24, tickAngle)) * tickEnvelope;
  composite(premultiplied, alpha, vec3(1.0, 1.0, 0.985), tick * 0.94);

  return vec4(alpha > 0.0001 ? premultiplied / alpha : vec3(0.0), alpha);
}
`;

export default {
  id: "prismatic-caustic-coin",
  name: "Prismatic Caustic Coin",
  kind: "webgl",
  technique: "Analytic rigid-cylinder transmission and three-IOR caustics",
  label: "Polishing",
  phaseOffset: 1103,
  mount(container) {
    return createShaderVisual(container, {
      name: "Prismatic Caustic Coin",
      seed: 11,
      fragment,
      fallback: drawFallback,
      maxDpr: 3,
    });
  },
};
