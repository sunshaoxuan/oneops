import { createShaderVisual } from "../core/webgl.js";

const LOOP_SECONDS = 5.6;
const SAMPLE_COUNT = 320;
const TAU = Math.PI * 2;
const PARALLAX = Math.PI / 45;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smoother(start, end, value) {
  const amount = clamp01((value - start) / (end - start));
  return amount ** 3 * (amount * (amount * 6 - 15) + 10);
}

function lorenzDerivative([x, y, z]) {
  return [10 * (y - x), x * (28 - z) - y, x * y - (8 / 3) * z];
}

function lorenzStep(point) {
  const step = 0.006;
  const a = lorenzDerivative(point);
  const b = lorenzDerivative(
    point.map((value, index) => value + a[index] * step * 0.5),
  );
  const c = lorenzDerivative(
    point.map((value, index) => value + b[index] * step * 0.5),
  );
  const d = lorenzDerivative(
    point.map((value, index) => value + c[index] * step),
  );
  return point.map(
    (value, index) => value + step * (a[index] + 2 * b[index] + 2 * c[index] + d[index]) / 6,
  );
}

function makeTrajectory() {
  let point = [0.1, 0, 0];
  // This deterministic window is a near recurrence: its endpoints meet while
  // the intervening orbit visits both Lorenz lobes with unequal dwell times.
  for (let index = 0; index < 3648; index += 1) point = lorenzStep(point);

  const raw = [point];
  for (let index = 0; index < 1256; index += 1) {
    point = lorenzStep(point);
    raw.push(point);
  }

  const cumulative = [0];
  for (let index = 1; index < raw.length; index += 1) {
    cumulative.push(cumulative[index - 1] + Math.hypot(
      raw[index][0] - raw[index - 1][0],
      raw[index][1] - raw[index - 1][1],
      raw[index][2] - raw[index - 1][2],
    ));
  }

  const bounds = [0, 1, 2].map((axis) => {
    const values = raw.map((sample) => sample[axis]);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    return [(minimum + maximum) * 0.5, (maximum - minimum) * 0.5];
  });
  const total = cumulative.at(-1);
  let cursor = 1;

  return Array.from({ length: SAMPLE_COUNT }, (_, index) => {
    const distance = total * index / (SAMPLE_COUNT - 1);
    while (cumulative[cursor] < distance) cursor += 1;
    const before = cursor - 1;
    const span = cumulative[cursor] - cumulative[before] || 1;
    const amount = (distance - cumulative[before]) / span;
    const sample = raw[before].map(
      (value, axis) => value + (raw[cursor][axis] - value) * amount,
    );
    return [
      ((sample[0] - bounds[0][0]) / bounds[0][1]) * 0.8,
      ((sample[2] - bounds[2][0]) / bounds[2][1]) * 0.7,
      ((sample[1] - bounds[1][0]) / bounds[1][1]) * 0.78,
    ];
  });
}

const trajectory = makeTrajectory();

function motionAt(time) {
  const phase = ((time / LOOP_SECONDS) % 1 + 1) % 1;
  return {
    phase,
    head: phase - Math.sin(TAU * phase) * 0.026,
    history: 0.07 + 0.91 * smoother(0.015, 0.6, phase) *
      (1 - smoother(0.76, 0.995, phase)),
    yaw: PARALLAX * Math.sin(TAU * phase),
  };
}

function drawFallback(context, time, _delta, width, height) {
  const motion = motionAt(time);
  const size = Math.min(width, height);
  const scale = size * 0.5;
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const cosine = Math.cos(motion.yaw);
  const sine = Math.sin(motion.yaw);

  context.lineCap = "round";
  context.lineJoin = "round";

  for (let index = 0; index < SAMPLE_COUNT - 1; index += 1) {
    const order = (index + 0.5) / (SAMPLE_COUNT - 1);
    const age = ((motion.head - order) % 1 + 1) % 1;
    if (age > motion.history) continue;

    const normalizedAge = age / motion.history;
    const life = 1 - smoother(0.8, 1, normalizedAge);
    const first = trajectory[index];
    const second = trajectory[index + 1];
    const firstX = first[0] * cosine + first[2] * sine;
    const secondX = second[0] * cosine + second[2] * sine;
    const firstDepth = -first[0] * sine + first[2] * cosine;
    const secondDepth = -second[0] * sine + second[2] * cosine;
    const firstPerspective = 1 / (1 - firstDepth * 0.055);
    const secondPerspective = 1 / (1 - secondDepth * 0.055);
    const depth = clamp01((firstDepth + secondDepth) * 0.25 + 0.5);
    const oldness = normalizedAge ** 1.25;
    const tone = Math.round(74 + (181 - 74) * oldness);

    context.beginPath();
    context.moveTo(
      centerX + firstX * firstPerspective * scale,
      centerY - first[1] * firstPerspective * scale,
    );
    context.lineTo(
      centerX + secondX * secondPerspective * scale,
      centerY - second[1] * secondPerspective * scale,
    );
    context.lineWidth = Math.max(0.62, size * (0.025 - oldness * 0.004));
    const green = tone + Math.round(oldness * 3);
    const blue = tone + Math.round(oldness * 5);
    const alpha = life * (0.24 + 0.5 * (1 - oldness)) * (0.72 + depth * 0.28);
    context.strokeStyle = `rgba(${tone}, ${green}, ${blue}, ${alpha})`;
    context.stroke();

    if (index % 17 === 0 && life > 0.2) {
      context.beginPath();
      context.arc(
        centerX + firstX * firstPerspective * scale,
        centerY - first[1] * firstPerspective * scale,
        Math.max(0.38, size * 0.014),
        0,
        TAU,
      );
      context.fillStyle = `rgba(${tone}, ${tone + 3}, ${tone + 5}, ${life * 0.44})`;
      context.fill();
    }
  }

  const scaledHead = motion.head * (SAMPLE_COUNT - 1);
  const headIndex = Math.min(SAMPLE_COUNT - 2, Math.floor(scaledHead));
  const amount = scaledHead - headIndex;
  const first = trajectory[headIndex];
  const second = trajectory[headIndex + 1];
  const x = first[0] + (second[0] - first[0]) * amount;
  const y = first[1] + (second[1] - first[1]) * amount;
  const z = first[2] + (second[2] - first[2]) * amount;
  const turnedX = x * cosine + z * sine;
  const depth = -x * sine + z * cosine;
  const perspective = 1 / (1 - depth * 0.055);
  const headX = centerX + turnedX * perspective * scale;
  const headY = centerY - y * perspective * scale;

  context.beginPath();
  context.arc(headX, headY, Math.max(1.25, size * 0.052), 0, TAU);
  context.fillStyle = "rgba(74, 74, 74, 0.88)";
  context.fill();
  context.beginPath();
  context.arc(headX, headY, Math.max(0.68, size * 0.027), 0, TAU);
  context.fillStyle = "rgba(250, 250, 248, 0.98)";
  context.fill();
}

const pathSource = trajectory.map(([x, y, z]) =>
  `  vec3(${x.toFixed(6)}, ${y.toFixed(6)}, ${z.toFixed(6)})`
).join(",\n");

const fragment = /* glsl */ `
const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;
const float LOOP = 5.6;
const int PATH_POINTS = ${SAMPLE_COUNT};
const vec3 PATH[${SAMPLE_COUNT}] = vec3[${SAMPLE_COUNT}](
${pathSource}
);

float smoother(float edge0, float edge1, float value) {
  float amount = clamp((value - edge0) / (edge1 - edge0), 0.0, 1.0);
  return amount * amount * amount * (amount * (amount * 6.0 - 15.0) + 10.0);
}

float segmentDistance(vec2 point, vec2 start, vec2 end) {
  vec2 axis = end - start;
  float amount = clamp(dot(point - start, axis) / max(dot(axis, axis), 0.000001), 0.0, 1.0);
  return length(point - start - axis * amount);
}

vec3 projectPoint(vec3 point, float yaw) {
  float cosine = cos(yaw);
  float sine = sin(yaw);
  vec3 turned = vec3(
    point.x * cosine + point.z * sine,
    point.y,
    -point.x * sine + point.z * cosine
  );
  float perspective = 1.0 / (1.0 - turned.z * 0.055);
  return vec3(turned.xy * perspective, turned.z);
}

void composite(inout vec3 premultiplied, inout float alpha, vec3 color, float layerAlpha) {
  layerAlpha = clamp(layerAlpha, 0.0, 1.0);
  premultiplied = color * layerAlpha + premultiplied * (1.0 - layerAlpha);
  alpha = layerAlpha + alpha * (1.0 - layerAlpha);
}

vec4 shade(vec2 uv, float timeSeconds, float seed) {
  float phase = fract(timeSeconds / LOOP);
  float headProgress = phase - sin(TAU * phase) * 0.026;
  float history = 0.07 + 0.91 * smoother(0.015, 0.6, phase) *
    (1.0 - smoother(0.76, 0.995, phase));
  float yaw = (PI / 45.0) * sin(TAU * phase + seed * 0.0);
  vec3 weightedColor = vec3(0.0);
  float accumulated = 0.0;

  for (int index = 0; index < PATH_POINTS - 1; index += 1) {
    float order = (float(index) + 0.5) / float(PATH_POINTS - 1);
    float age = fract(headProgress - order + 1.0);
    if (age > history) continue;

    float normalizedAge = age / history;
    float life = 1.0 - smoother(0.8, 1.0, normalizedAge);
    vec3 first = projectPoint(PATH[index], yaw);
    vec3 second = projectPoint(PATH[index + 1], yaw);
    float distanceToStroke = segmentDistance(uv, first.xy, second.xy);
    float antialias = max(fwidth(distanceToStroke), 0.0025);
    float oldness = pow(normalizedAge, 1.25);
    float width = mix(0.014, 0.010, oldness);
    float stroke = 1.0 - smoothstep(width, width + antialias, distanceToStroke);
    float depth = clamp((first.z + second.z) * 0.25 + 0.5, 0.0, 1.0);
    float layer = stroke * life * mix(0.72, 0.24, oldness) * mix(0.72, 1.0, depth);
    vec3 color = mix(vec3(0.29), vec3(0.70, 0.72, 0.735), oldness);

    if (index % 17 == 0) {
      float pointDistance = length(uv - first.xy);
      float pointAA = max(fwidth(pointDistance), 0.0025);
      float samplePoint = 1.0 - smoothstep(0.018, 0.018 + pointAA, pointDistance);
      layer += samplePoint * life * 0.32;
    }

    weightedColor += color * layer;
    accumulated += layer;
  }

  float alpha = 1.0 - exp(-accumulated * 1.15);
  vec3 color = weightedColor / max(accumulated, 0.00001);
  vec3 premultiplied = color * alpha;

  float scaledHead = headProgress * float(PATH_POINTS - 1);
  int headIndex = min(PATH_POINTS - 2, int(floor(scaledHead)));
  vec3 head = projectPoint(mix(PATH[headIndex], PATH[headIndex + 1], fract(scaledHead)), yaw);
  float headDistance = length(uv - head.xy);
  float headAA = max(fwidth(headDistance), 0.0025);
  float outline = 1.0 - smoothstep(0.062, 0.062 + headAA, headDistance);
  float pearl = 1.0 - smoothstep(0.033, 0.033 + headAA, headDistance);
  composite(premultiplied, alpha, vec3(0.29), outline * 0.9);
  composite(premultiplied, alpha, vec3(0.98, 0.98, 0.97), pearl * 0.98);

  color = alpha > 0.0001 ? premultiplied / alpha : vec3(0.0);
  return vec4(color, alpha);
}
`;

export default {
  id: "strange-attractor-scribe",
  name: "Strange-Attractor Scribe",
  kind: "webgl",
  technique: "Precomputed Lorenz phase-space stroke",
  label: "Tracing",
  phaseOffset: 907,
  mount(container) {
    return createShaderVisual(container, {
      name: "Strange-Attractor Scribe",
      seed: 13,
      fragment,
      fallback: drawFallback,
      maxDpr: 3,
    });
  },
};
