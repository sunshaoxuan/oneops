import { createShaderVisual } from "../core/webgl.js";

const LOOP_SECONDS = 3.5;
const PI = Math.PI;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smootherstep(start, end, value) {
  const amount = clamp01((value - start) / (end - start));
  return amount * amount * amount * (amount * (amount * 6 - 15) + 10);
}

// The sheet crosses its stop by exactly 6%, then seats without deforming cubes.
function lockProgress(value) {
  const amount = clamp01(value);
  const strike = 1.06 * smootherstep(0, 0.78, amount);
  return strike + (1 - strike) * smootherstep(0.78, 1, amount);
}

function sheetTravel(slice, phase) {
  const arrivalRank = 3 - slice;
  const arrival = lockProgress((phase - 0.015 - arrivalRank * 0.052) / 0.235);
  const departure = smootherstep(0.68 + slice * 0.046, 0.84 + slice * 0.046, phase);
  return arrival * (1 - departure);
}

function roundedSquare(context, half, radius) {
  context.beginPath();
  context.moveTo(-half + radius, -half);
  context.lineTo(half - radius, -half);
  context.quadraticCurveTo(half, -half, half, -half + radius);
  context.lineTo(half, half - radius);
  context.quadraticCurveTo(half, half, half - radius, half);
  context.lineTo(-half + radius, half);
  context.quadraticCurveTo(-half, half, -half, half - radius);
  context.lineTo(-half, -half + radius);
  context.quadraticCurveTo(-half, -half, -half + radius, -half);
  context.closePath();
}

function drawFallback(context, time, _delta, width, height) {
  const phase = ((time / LOOP_SECONDS) % 1 + 1) % 1;
  const size = Math.min(width, height);
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const gap = size * 0.15;
  const half = size * 0.054;

  // Sixteen graphic tiles preserve the ordered-sheet idea without imitating
  // the shader's 3D projection, making this a deliberately distinct fallback.
  for (let slice = 0; slice < 4; slice += 1) {
    const travel = sheetTravel(slice, phase);
    const direction = slice % 2 === 0 ? -1 : 1;
    const angle = direction * (1 - travel) * PI * 0.5;
    const targetX = centerX + (slice - 1.5) * gap;
    const sourceX = centerX + direction * size * 0.77;
    const spread = 1 - Math.abs(slice - 1.5) * 0.09;

    for (let row = 0; row < 4; row += 1) {
      const targetY = centerY + (row - 1.5) * gap * spread;
      const x = sourceX + (targetX - sourceX) * travel;
      const y = targetY;
      const edgeOn = 0.34 + 0.66 * Math.abs(Math.cos(angle));
      const tone = 31 + ((slice + row * 2) % 3) * 10;

      context.save();
      context.translate(x, y);
      context.rotate(angle);
      context.scale(edgeOn, 1);
      roundedSquare(context, half, half * 0.28);
      context.fillStyle = "rgba(158, 158, 156, 0.54)";
      context.fill();
      context.translate(-half * 0.13, -half * 0.13);
      roundedSquare(context, half * 0.86, half * 0.24);
      context.fillStyle = `rgba(${tone}, ${tone}, ${tone}, 0.94)`;
      context.fill();
      context.restore();
    }
  }

  const scanPresence = smootherstep(0.43, 0.47, phase) *
    (1 - smootherstep(0.64, 0.68, phase));
  if (scanPresence > 0.001) {
    const scanProgress = smootherstep(0.45, 0.65, phase);
    const scanY = centerY + (-0.31 + scanProgress * 0.62) * size;
    context.save();
    context.globalCompositeOperation = "source-atop";
    context.beginPath();
    context.moveTo(centerX - size * 0.34, scanY - size * 0.045);
    context.lineTo(centerX + size * 0.34, scanY + size * 0.045);
    context.lineWidth = Math.max(0.7, size * 0.026);
    context.lineCap = "round";
    context.strokeStyle = `rgba(250, 250, 247, ${scanPresence * 0.96})`;
    context.stroke();
    context.restore();
  }
}

const fragment = /* glsl */ `
const float PI = 3.141592653589793;
const float LOOP = 3.5;
const int CUBE_COUNT = 64;

float smoother(float edge0, float edge1, float value) {
  float amount = clamp((value - edge0) / (edge1 - edge0), 0.0, 1.0);
  return amount * amount * amount * (amount * (amount * 6.0 - 15.0) + 10.0);
}

float lockProgress(float value) {
  float amount = clamp(value, 0.0, 1.0);
  float strike = 1.06 * smoother(0.0, 0.78, amount);
  return strike + (1.0 - strike) * smoother(0.78, 1.0, amount);
}

float sheetTravel(float slice, float phase) {
  float arrivalRank = 3.0 - slice;
  float arrival = lockProgress(
    (phase - 0.015 - arrivalRank * 0.052) / 0.235
  );
  float departure = smoother(
    0.68 + slice * 0.046,
    0.84 + slice * 0.046,
    phase
  );
  return arrival * (1.0 - departure);
}

mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

vec3 rotateX(vec3 point, float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return vec3(point.x, cosine * point.y - sine * point.z,
    sine * point.y + cosine * point.z);
}

vec3 rotateY(vec3 point, float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return vec3(cosine * point.x + sine * point.z, point.y,
    -sine * point.x + cosine * point.z);
}

float roundedBoxDistance(vec2 point, vec2 halfSize, float radius) {
  vec2 offset = abs(point) - halfSize + radius;
  return length(max(offset, 0.0)) + min(max(offset.x, offset.y), 0.0) - radius;
}

vec4 over(vec4 under, vec4 top) {
  float alpha = top.a + under.a * (1.0 - top.a);
  vec3 color = (top.rgb * top.a + under.rgb * under.a * (1.0 - top.a)) /
    max(alpha, 0.0001);
  return vec4(color, alpha);
}

vec4 shade(vec2 uv, float timeSeconds, float seed) {
  float phase = fract(timeSeconds / LOOP);
  vec3 chosenColor = vec3(0.0);
  float chosenAlpha = 0.0;
  float chosenDepth = -100.0;

  for (int index = 0; index < CUBE_COUNT; index += 1) {
    float instance = float(index);
    float slice = floor(instance / 16.0);
    float cell = instance - slice * 16.0;
    float row = floor(cell / 4.0);
    float column = cell - row * 4.0;
    float direction = mod(slice, 2.0) < 1.0 ? -1.0 : 1.0;
    float travel = sheetTravel(slice, phase);
    float angle = direction * (1.0 - travel) * PI * 0.5;

    // Outer depth sheets are slightly tighter, so the locked 4x4x4 lattice
    // reads as a compact sphere while every unit remains a rigid rounded cube.
    float shell = 1.0 - 0.105 * abs(slice - 1.5);
    vec3 local = vec3(
      (column - 1.5) * 0.225 * shell,
      (row - 1.5) * 0.225 * shell,
      0.0
    );
    local = rotateY(local, angle);
    float targetDepth = (slice - 1.5) * 0.19;
    vec3 sourceCenter = vec3(direction * 1.36, 0.0, targetDepth);
    vec3 targetCenter = vec3(0.0, 0.0, targetDepth);
    vec3 point = mix(sourceCenter, targetCenter, travel) + local;

    vec3 cameraPoint = rotateX(rotateY(point, -0.54), -0.34);
    float perspective = 1.0 / (1.0 - cameraPoint.z * 0.14);
    vec2 center = cameraPoint.xy * 0.94 * perspective;
    float halfSize = 0.082 * perspective * (0.96 + shell * 0.04);
    vec2 glyph = rotate2d(-0.12 - angle * 0.46) * (uv - center);
    float distanceToCube = roundedBoxDistance(
      glyph,
      vec2(halfSize * 0.82),
      halfSize * 0.22
    );
    float antialias = max(fwidth(distanceToCube), 0.0018);
    float coverage = smoothstep(antialias, -antialias, distanceToCube);

    if (coverage > 0.001 && cameraPoint.z > chosenDepth) {
      vec2 face = glyph / max(halfSize, 0.0001);
      float bevel = smoother(-halfSize * 0.55, 0.0, distanceToCube);
      float faceLight = clamp(0.72 - face.x * 0.13 + face.y * 0.16, 0.45, 0.94);
      float variation = mod(slice + row * 2.0 + column, 3.0) * 0.018;
      vec3 charcoal = vec3(0.105 + variation) * faceLight;
      vec3 fog = vec3(0.655, 0.655, 0.645);
      float upperFace = smoother(-0.62, 0.44, face.y - face.x * 0.24);
      vec3 color = mix(charcoal, fog, bevel * (0.24 + upperFace * 0.18));
      color += vec3(0.035) * smoother(0.35, 0.86, -face.x - face.y);

      chosenColor = color;
      chosenAlpha = coverage * 0.94;
      chosenDepth = cameraPoint.z;
    }
  }

  vec4 result = vec4(chosenColor, chosenAlpha);
  float scanPresence = smoother(0.43, 0.47, phase) *
    (1.0 - smoother(0.64, 0.68, phase));
  float scanProgress = smoother(0.45, 0.65, phase);
  float scanCoordinate = uv.y - uv.x * 0.13;
  float scanPosition = mix(-0.67, 0.67, scanProgress);
  float scanWidth = max(fwidth(scanCoordinate) * 0.62, 0.012);
  float scanLine = scanPresence *
    (1.0 - smoothstep(scanWidth, scanWidth * 1.85,
      abs(scanCoordinate - scanPosition))) *
    (1.0 - smoothstep(0.56, 0.66, abs(uv.x)));
  vec3 pearl = vec3(0.98, 0.98, 0.965 + seed * 0.0);
  result = over(result, vec4(pearl, scanLine * 0.88));
  return result;
}
`;

export default {
  id: "voxel-assembly-line",
  name: "Voxel Assembly Line",
  kind: "webgl",
  technique: "Analytic WebGL2 64-cube sheet assembly",
  label: "Building",
  phaseOffset: 1201,
  mount(container) {
    return createShaderVisual(container, {
      name: "Voxel Assembly Line",
      seed: 12,
      fragment,
      fallback: drawFallback,
      maxDpr: 3,
    });
  },
};
