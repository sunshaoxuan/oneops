import { createShaderVisual } from "../core/webgl.js";

const LOOP_SECONDS = 4.1;
const THREAD_COUNT = 18;
const TAU = Math.PI * 2;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smootherstep(start, end, value) {
  const amount = clamp01((value - start) / (end - start));
  return amount * amount * amount * (amount * (amount * 6 - 15) + 10);
}

function phaseAt(time) {
  return ((time / LOOP_SECONDS) % 1 + 1) % 1;
}

function strandForm(index, phase) {
  const spacing = TAU / THREAD_COUNT;
  const nominalTheta = 0.19 + (index + 0.5) * spacing;
  const frontRank = Math.cos(nominalTheta) * 0.5 + 0.5;
  const irregularity = 0.5 + 0.5 * Math.sin((index + 1) * 2.399963);
  const arriveAt = 0.035 + frontRank * 0.052 + irregularity * 0.018;
  const releaseAt = 0.67 + (1 - frontRank) * 0.035 + irregularity * 0.012;
  const arrival = smootherstep(arriveAt, arriveAt + 0.17, phase);
  const release = smootherstep(releaseAt, releaseAt + 0.145, phase);
  return arrival * (1 - release);
}

function rainOffsetAt(phase) {
  const entry = smootherstep(0.005, 0.2, phase);
  const fall = smootherstep(0.825, 0.995, phase);
  return -1.28 * (1 - entry) - 1.28 * fall;
}

function strandPoint(index, parameter, phase, size, centerX, centerY) {
  const spacing = TAU / THREAD_COUNT;
  const pair = Math.floor(index / 2);
  const pairSign = index % 2 === 0 ? -1 : 1;
  const pairCenter = 0.19 + (pair * 2 + 1) * spacing;
  const nominalTheta = pairCenter + pairSign * spacing * 0.5;
  const radial = Math.sqrt(Math.max(0, 1 - parameter * parameter));
  const seamTravel = smootherstep(0.32, 0.64, phase);
  const seamPosition = -1.46 + seamTravel * 2.92;
  const baseX = Math.sin(nominalTheta) * radial;
  const diagonal = parameter + baseX * 0.54 - seamPosition;
  const swap = smootherstep(-0.125, 0.125, diagonal);
  const theta = pairCenter + pairSign * spacing * 0.5 * (1 - 2 * swap);
  const crest = Math.exp(-diagonal * diagonal * 54);
  const alternating = pair % 2 === 0 ? 1 : -1;
  const over = pairSign * alternating * crest;
  const form = strandForm(index, phase);

  const objectX = Math.sin(theta) * radial;
  const objectZ = Math.cos(theta) * radial;
  // A 0°–6° nod keeps the rear shell offset during the central exchange;
  // rotation never supplies the motion idea and closes at the same 3° pose.
  const nod = 0.05236 * (1 + Math.sin(TAU * phase));
  const cosine = Math.cos(nod);
  const sine = Math.sin(nod);
  const viewY = parameter * cosine - objectZ * sine;
  const depth = parameter * sine + objectZ * cosine + over * form * 0.15;
  const perspective = 1 / (1 - 0.07 * depth);
  const sphereX = objectX * 0.78 * perspective;
  const sphereY = viewY * 0.78 * perspective;
  const rainX = -0.71 + ((index + 0.5) / THREAD_COUNT) * 1.42 +
    Math.sin(TAU * phase + index * 1.71) * 0.017 * (1 - form);
  const rainY = parameter * 1.12 + rainOffsetAt(phase);
  const normalX = rainX + (sphereX - rainX) * form;
  const normalY = rainY + (sphereY - rainY) * form;

  return {
    x: centerX + normalX * size * 0.5,
    y: centerY - normalY * size * 0.5,
    depth: -0.52 + (depth + 0.52) * form,
    form,
    over,
  };
}

function drawFallback(context, time, _delta, width, height) {
  const phase = phaseAt(time);
  const presence = smootherstep(0.005, 0.062, phase) *
    (1 - smootherstep(0.94, 0.998, phase));
  if (presence <= 0.001) return;

  const size = Math.min(width, height);
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const segments = [];
  const samples = 22;

  for (let index = 0; index < THREAD_COUNT; index += 1) {
    let previous = strandPoint(index, -1, phase, size, centerX, centerY);

    for (let sample = 1; sample <= samples; sample += 1) {
      const parameter = -1 + (sample / samples) * 2;
      const current = strandPoint(index, parameter, phase, size, centerX, centerY);
      segments.push({
        x1: previous.x,
        y1: previous.y,
        x2: current.x,
        y2: current.y,
        depth: (previous.depth + current.depth) * 0.5,
        form: (previous.form + current.form) * 0.5,
        over: Math.max(previous.over, current.over),
      });
      previous = current;
    }
  }

  segments.sort((a, b) => a.depth - b.depth);
  context.lineCap = "round";
  context.lineWidth = Math.max(0.58, size * 0.021);

  for (const segment of segments) {
    const front = clamp01(segment.depth * 0.5 + 0.5);
    const highlight = clamp01(segment.over) * segment.form;
    const gray = Math.round(99 - front * 73);
    const red = Math.round(gray + (189 - gray) * highlight * 0.78);
    const green = Math.round(gray + (180 - gray) * highlight * 0.78);
    const blue = Math.round(gray + (166 - gray) * highlight * 0.78);
    const alpha = presence * (0.29 + front * 0.61 + highlight * 0.08);
    context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    context.beginPath();
    context.moveTo(segment.x1, segment.y1);
    context.lineTo(segment.x2, segment.y2);
    context.stroke();
  }
}

const fragment = `
const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;
const float LOOP = 4.1;
const int THREADS = 18;

float smoother(float edge0, float edge1, float value) {
  float amount = clamp((value - edge0) / (edge1 - edge0), 0.0, 1.0);
  return amount * amount * amount * (amount * (amount * 6.0 - 15.0) + 10.0);
}

float formAt(float index, float phase) {
  float spacing = TAU / float(THREADS);
  float nominalTheta = 0.19 + (index + 0.5) * spacing;
  float frontRank = cos(nominalTheta) * 0.5 + 0.5;
  float irregularity = 0.5 + 0.5 * sin((index + 1.0) * 2.399963);
  float arriveAt = 0.035 + frontRank * 0.052 + irregularity * 0.018;
  float releaseAt = 0.67 + (1.0 - frontRank) * 0.035 + irregularity * 0.012;
  float arrival = smoother(arriveAt, arriveAt + 0.17, phase);
  float release = smoother(releaseAt, releaseAt + 0.145, phase);
  return arrival * (1.0 - release);
}

float rainOffset(float phase) {
  float entry = smoother(0.005, 0.2, phase);
  float fall = smoother(0.825, 0.995, phase);
  return -1.28 * (1.0 - entry) - 1.28 * fall;
}

vec4 shade(vec2 uv, float timeSeconds, float seed) {
  float phase = fract(timeSeconds / LOOP);
  float presence = smoother(0.005, 0.062, phase) *
    (1.0 - smoother(0.94, 0.998, phase));
  if (presence <= 0.0001) return vec4(0.0);

  float spacing = TAU / float(THREADS);
  float seamTravel = smoother(0.32, 0.64, phase);
  float seamPosition = mix(-1.46, 1.46, seamTravel);
  // The camera travels only six degrees. Keeping a small positive pitch at the
  // exchange frame prevents the rear meridians collapsing into flat stripes.
  float nod = 0.05236 * (1.0 + sin(TAU * phase));
  float nodCosine = cos(nod);
  float nodSine = sin(nod);
  float fallOffset = rainOffset(phase);
  float selectedDepth = -10.0;
  float selectedCoverage = 0.0;
  float selectedFront = 0.0;
  float selectedHighlight = 0.0;

  for (int thread = 0; thread < THREADS; thread += 1) {
    float index = float(thread);
    float pair = floor(index * 0.5);
    float pairSign = mod(index, 2.0) < 0.5 ? -1.0 : 1.0;
    float alternating = mod(pair, 2.0) < 0.5 ? 1.0 : -1.0;
    float pairCenter = 0.19 + (pair * 2.0 + 1.0) * spacing + seed * 0.001;
    float nominalTheta = pairCenter + pairSign * spacing * 0.5;
    float form = formAt(index, phase);
    float rainX = mix(-0.71, 0.71, (index + 0.5) / float(THREADS)) +
      sin(TAU * phase + index * 1.71) * 0.017 * (1.0 - form);
    float rainParameter = (uv.y - fallOffset) / 1.12;
    float sphereParameter = uv.y / 0.78;
    float rawParameter = mix(rainParameter, sphereParameter, form);
    float parameter = clamp(rawParameter, -1.0, 1.0);
    float radial = sqrt(max(0.0, 1.0 - parameter * parameter));
    float baseX = sin(nominalTheta) * radial;
    float diagonal = parameter + baseX * 0.54 - seamPosition;
    float swap = smoother(-0.125, 0.125, diagonal);
    float theta = pairCenter + pairSign * spacing * 0.5 * (1.0 - 2.0 * swap);
    float crest = exp(-diagonal * diagonal * 54.0);
    float over = pairSign * alternating * crest;

    vec3 point = vec3(sin(theta) * radial, parameter, cos(theta) * radial);
    float viewY = point.y * nodCosine - point.z * nodSine;
    float depth = point.y * nodSine + point.z * nodCosine + over * form * 0.15;
    float perspective = 1.0 / (1.0 - 0.07 * depth);
    vec2 spherePosition = vec2(point.x, viewY) * 0.78 * perspective;
    vec2 rainPosition = vec2(rainX, parameter * 1.12 + fallOffset);
    vec2 position = mix(rainPosition, spherePosition, form);

    vec2 offset = uv - position;
    float distanceToRibbon = length(vec2(offset.x, offset.y * 0.28));
    float antialias = max(fwidth(distanceToRibbon), 0.0025);
    float ribbonWidth = mix(0.0175, 0.0225, form);
    float cap = 1.0 - smoothstep(0.985, 1.035, abs(rawParameter));
    float droplet = 0.8 + 0.2 * smoother(-0.35, 0.45,
      sin(parameter * 20.0 - phase * TAU * 2.0 + index * 0.83));
    float coverage = smoothstep(
      ribbonWidth + antialias,
      ribbonWidth - antialias,
      distanceToRibbon
    ) * cap * presence * mix(droplet, 1.0, form);
    float effectiveDepth = mix(-0.52, depth, form);

    if (coverage > 0.001 && effectiveDepth > selectedDepth) {
      selectedDepth = effectiveDepth;
      selectedCoverage = coverage;
      selectedFront = clamp(effectiveDepth * 0.5 + 0.5, 0.0, 1.0);
      selectedHighlight = max(0.0, over) * form;
    }
  }

  vec3 rearInk = vec3(0.39, 0.385, 0.375);
  vec3 faceInk = vec3(0.075, 0.073, 0.07);
  vec3 champagne = vec3(0.741, 0.706, 0.651);
  vec3 color = mix(rearInk, faceInk, pow(selectedFront, 0.78));
  color = mix(color, champagne, selectedHighlight * 0.78);
  float alpha = selectedCoverage *
    (0.3 + selectedFront * 0.61 + selectedHighlight * 0.08);

  return vec4(color, alpha);
}
`;

export default {
  id: "meridian-loom",
  name: "Meridian Loom",
  kind: "webgl",
  technique: "Analytic WebGL2 woven longitude ribbons",
  label: "Weaving",
  phaseOffset: 809,
  mount(container) {
    return createShaderVisual(container, {
      name: "Meridian Loom",
      seed: 8,
      fragment,
      fallback: drawFallback,
      maxDpr: 3,
    });
  },
};
