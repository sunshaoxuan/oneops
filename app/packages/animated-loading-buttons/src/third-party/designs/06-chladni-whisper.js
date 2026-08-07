import { createShaderVisual } from "../core/webgl.js";

const LOOP_SECONDS = 3.9;
const TAU = Math.PI * 2;
const MODE_B_ANGLE = 0.24;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smootherstep(start, end, value) {
  const amount = clamp01((value - start) / (end - start));
  return amount * amount * amount * (amount * (amount * 6 - 15) + 10);
}

function stateAt(time) {
  const phase = ((time / LOOP_SECONDS) % 1 + 1) % 1;
  const arrival = smootherstep(0.28, 0.47, phase);
  const departure = smootherstep(0.62, 0.94, phase);
  const rise = smootherstep(0.08, 0.29, phase);
  const decay = smootherstep(0.63, 0.98, phase);

  return {
    phase,
    modeMix: arrival * (1 - departure),
    energy: 0.18 + 0.82 * rise * (1 - decay),
    sweep: -1.46 + 2.92 * smootherstep(0.045, 0.955, phase),
    vibration: Math.sin(TAU * phase * 2),
  };
}

function modeSample(x, y, modeMix) {
  const radius = Math.hypot(x, y);
  const tension = 0.5 + 0.045 * radius * radius;
  const plateX = x * tension;
  const plateY = y * tension;
  const componentA1 = Math.cos(Math.PI * 2 * plateX) * Math.cos(Math.PI * 3 * plateY);
  const componentA2 = Math.cos(Math.PI * 3 * plateX) * Math.cos(Math.PI * 2 * plateY);
  const cosine = Math.cos(MODE_B_ANGLE);
  const sine = Math.sin(MODE_B_ANGLE);
  const turnedX = (cosine * x - sine * y) * 0.52;
  const turnedY = (sine * x + cosine * y) * 0.52;
  const componentB1 = Math.cos(Math.PI * 3 * turnedX) * Math.cos(Math.PI * 5 * turnedY);
  const componentB2 = Math.cos(Math.PI * 5 * turnedX) * Math.cos(Math.PI * 3 * turnedY);
  const componentB3 = Math.sin(Math.PI * 4 * (turnedX + 0.32 * turnedY));
  const modeA = componentA1 - 0.76 * componentA2 + 0.075 * Math.sin(Math.PI * 2.35 * radius);
  const modeB = componentB1 - 0.63 * componentB2 + 0.16 * componentB3 +
    0.055 * Math.cos(3 * Math.atan2(y, x) + MODE_B_ANGLE) * radius;
  const blendAngle = modeMix * Math.PI * 0.5;
  const weightA = Math.cos(blendAngle);
  const weightB = Math.sin(blendAngle);

  return {
    field: weightA * modeA + weightB * modeB,
    intersectionA: Math.max(
      0,
      1 - Math.max(Math.abs(componentA1), Math.abs(componentA2)) / 0.17,
    ),
    intersectionB: Math.max(
      0,
      1 - Math.max(Math.abs(componentB1), Math.abs(componentB2)) / 0.17,
    ),
  };
}

function drawFallback(context, time, _delta, width, height) {
  const state = stateAt(time);
  const size = Math.min(width, height);
  const radius = size * 0.39;
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const sampleCount = Math.max(64, Math.min(120, Math.round(size * 2)));
  const step = (radius * 2) / sampleCount;
  const nodeBand = 0.16 - state.energy * 0.085;
  const sweepX = Math.cos(0.61);
  const sweepY = Math.sin(0.61);

  const body = context.createRadialGradient(
    centerX - radius * 0.22,
    centerY - radius * 0.26,
    radius * 0.04,
    centerX,
    centerY,
    radius,
  );
  body.addColorStop(0, "rgba(55, 55, 55, 0.78)");
  body.addColorStop(0.57, "rgba(32, 32, 32, 0.78)");
  body.addColorStop(1, "rgba(20, 20, 20, 0.84)");

  context.beginPath();
  context.arc(centerX, centerY, radius, 0, TAU);
  context.fillStyle = body;
  context.fill();

  context.save();
  context.beginPath();
  context.arc(centerX, centerY, radius - Math.max(0.25, size * 0.008), 0, TAU);
  context.clip();

  for (let row = 0; row <= sampleCount; row += 1) {
    const normalY = -1 + (row / sampleCount) * 2;

    for (let column = 0; column <= sampleCount; column += 1) {
      const normalX = -1 + (column / sampleCount) * 2;
      const membraneRadius = Math.hypot(normalX, normalY);
      if (membraneRadius >= 0.985) continue;

      const sample = modeSample(normalX, normalY, state.modeMix);
      const distanceToNode = Math.abs(sample.field);
      const node = 1 - smootherstep(nodeBand * 0.28, nodeBand, distanceToNode);
      const depositWave = Math.sin(normalX * 41 + 7 * Math.sin(normalY * 13));
      const crossGrain = Math.sin(normalY * 37 - 6 * Math.sin(normalX * 11));
      const dustGate = smootherstep(-0.22, 0.36, depositWave * crossGrain);
      const orderedDust = (1 - state.energy) * 0.74 +
        state.energy * (0.03 + 0.97 * dustGate);
      const sweepDistance = normalX * sweepX + normalY * sweepY - state.sweep;
      const highlight = Math.exp(-sweepDistance * sweepDistance * 53) *
        smootherstep(0.12, 0.76, Math.abs(sample.field));
      const intersection = (1 - state.modeMix) * sample.intersectionA +
        state.modeMix * sample.intersectionB;
      const heightShade = sample.field * state.vibration * state.energy;

      if (node > 0.018) {
        const pearl = clamp01(intersection * node);
        const tone = Math.round(93 + 82 * node * orderedDust + 67 * pearl + 18 * highlight);
        const alpha = 0.14 + 0.59 * node + 0.18 * pearl;
        context.fillStyle = `rgba(${tone}, ${tone}, ${Math.min(250, tone + 2)}, ${alpha})`;
        context.fillRect(
          centerX + normalX * radius - step * 0.58,
          centerY + normalY * radius - step * 0.58,
          step * 1.16,
          step * 1.16,
        );
      } else if (highlight > 0.028 || Math.abs(heightShade) > 0.64) {
        const tone = Math.round(43 + 13 * heightShade + 22 * highlight);
        context.fillStyle = `rgba(${tone}, ${tone}, ${tone}, ${0.1 + 0.18 * highlight})`;
        context.fillRect(
          centerX + normalX * radius - step * 0.53,
          centerY + normalY * radius - step * 0.53,
          step * 1.06,
          step * 1.06,
        );
      }
    }
  }

  context.restore();

  context.beginPath();
  context.arc(centerX, centerY, radius - Math.max(0.35, size * 0.012), 0, TAU);
  context.strokeStyle = "rgba(25, 25, 25, 0.38)";
  context.lineWidth = Math.max(0.6, size * 0.018);
  context.stroke();
}

const fragment = `
const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;
const float LOOP = 3.9;

float smoother(float edge0, float edge1, float value) {
  float amount = clamp((value - edge0) / (edge1 - edge0), 0.0, 1.0);
  return amount * amount * amount * (amount * (amount * 6.0 - 15.0) + 10.0);
}

float isolateNode(float value, float energy) {
  float derivative = max(fwidth(value), 0.0008);
  float inner = mix(0.44, 0.22, energy) * derivative;
  float outer = mix(1.34, 0.68, energy) * derivative;
  return 1.0 - smoothstep(inner, outer, abs(value));
}

vec4 shade(vec2 uv, float timeSeconds, float seed) {
  float phase = fract(timeSeconds / LOOP);
  float arrival = smoother(0.28, 0.47, phase);
  float departure = smoother(0.62, 0.94, phase);
  float modeMix = arrival * (1.0 - departure);
  float rise = smoother(0.08, 0.29, phase);
  float decay = smoother(0.63, 0.98, phase);
  float energy = 0.18 + 0.82 * rise * (1.0 - decay);

  vec2 membrane = uv / 0.78;
  float radius = length(membrane);
  float angle = atan(membrane.y, membrane.x);
  float edgeAA = max(fwidth(radius), 0.0015);
  float disc = 1.0 - smoothstep(0.975 - edgeAA, 1.0 + edgeAA, radius);
  if (disc <= 0.0) return vec4(0.0);

  float tension = 0.5 + 0.045 * radius * radius;
  vec2 plateA = membrane * tension;
  float componentA1 = cos(PI * 2.0 * plateA.x) * cos(PI * 3.0 * plateA.y);
  float componentA2 = cos(PI * 3.0 * plateA.x) * cos(PI * 2.0 * plateA.y);
  float modeA = componentA1 - 0.76 * componentA2 + 0.075 * sin(PI * 2.35 * radius);

  float modeBAngle = 0.04 * seed;
  float modeBCosine = cos(modeBAngle);
  float modeBSine = sin(modeBAngle);
  mat2 modeBRotation = mat2(modeBCosine, modeBSine, -modeBSine, modeBCosine);
  vec2 plateB = modeBRotation * membrane * 0.52;
  float componentB1 = cos(PI * 3.0 * plateB.x) * cos(PI * 5.0 * plateB.y);
  float componentB2 = cos(PI * 5.0 * plateB.x) * cos(PI * 3.0 * plateB.y);
  float componentB3 = sin(PI * 4.0 * (plateB.x + 0.32 * plateB.y));
  float modeB = componentB1 - 0.63 * componentB2 + 0.16 * componentB3 +
    0.055 * cos(3.0 * angle + modeBAngle) * radius;

  float blendAngle = modeMix * PI * 0.5;
  float field = cos(blendAngle) * modeA + sin(blendAngle) * modeB;
  float node = isolateNode(field, energy);

  float componentNodeA1 = isolateNode(componentA1, energy);
  float componentNodeA2 = isolateNode(componentA2, energy);
  float componentNodeB1 = isolateNode(componentB1, energy);
  float componentNodeB2 = isolateNode(componentB2, energy);
  float intersectionA = componentNodeA1 * componentNodeA2;
  float intersectionB = componentNodeB1 * componentNodeB2;
  float intersection = mix(intersectionA, intersectionB, modeMix) * node;

  // Two stationary oscillations make the surface breathe in depth while every
  // zero-amplitude line remains fixed. The diagonal graze crosses only once.
  float vibration = sin(TAU * phase * 2.0);
  float heightShade = field * vibration * energy;
  vec2 travelDirection = vec2(0.819648, 0.572867);
  float sweep = mix(-1.46, 1.46, smoother(0.045, 0.955, phase));
  float sweepDistance = dot(membrane, travelDirection) - sweep;
  float travelingHighlight = exp(-sweepDistance * sweepDistance * 53.0) *
    smoother(0.12, 0.76, abs(field));

  // A deterministic deposition cadence interrupts the curves into fine sand.
  // It is tied to the plate coordinates, so it never becomes a free particle
  // cloud or a group of independently orbiting points.
  float depositWave = sin(membrane.x * 41.0 + 7.0 * sin(membrane.y * 13.0));
  float crossGrain = sin(membrane.y * 37.0 - 6.0 * sin(membrane.x * 11.0));
  float dustGate = smoother(-0.22, 0.36, depositWave * crossGrain);
  float orderedDust = mix(0.74, 0.03 + 0.97 * dustGate, energy);
  node *= orderedDust;

  vec3 charcoal = vec3(0.105);
  vec3 graphite = vec3(0.19);
  vec3 silver = vec3(0.64);
  vec3 pearl = vec3(0.97, 0.97, 0.955);
  vec3 color = mix(charcoal, graphite, 0.48 + 0.27 * heightShade);
  color = mix(color, silver, clamp(node * 0.9, 0.0, 1.0));
  color = mix(color, pearl, clamp(intersection * 0.74, 0.0, 0.8));
  color += travelingHighlight * vec3(0.085, 0.088, 0.09);

  float rim = 1.0 - smoothstep(edgeAA * 0.45, edgeAA * 1.75, abs(radius - 0.975));
  color = mix(color, vec3(0.075), rim * 0.24);
  float alpha = (0.76 + node * 0.13 + intersection * 0.06 + travelingHighlight * 0.025) * disc;

  return vec4(color, alpha);
}
`;

export default {
  id: "chladni-whisper",
  name: "Chladni Whisper",
  kind: "webgl",
  technique: "WebGL2 standing-wave membrane",
  label: "Tuning",
  phaseOffset: 641,
  mount(container) {
    return createShaderVisual(container, {
      name: "Chladni Whisper",
      seed: 6,
      fragment,
      fallback: drawFallback,
      maxDpr: 3,
    });
  },
};
