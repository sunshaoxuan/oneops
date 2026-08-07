import { createCanvasVisual } from "../core/canvas.js";

const LOOP_SECONDS = 4.7;
const BOID_COUNT = 26;
const TAU = Math.PI * 2;
const PARAM_STRIDE = 10;
const STATE_STRIDE = 5;

const FORM_X = 0;
const FORM_Y = 1;
const ENTRY_X = 2;
const ENTRY_Y = 3;
const HEADING = 4;
const ENTRY_HEADING = 5;
const ORDER = 6;
const DEPTH = 7;
const SIZE = 8;
const FLUTTER = 9;

const STATE_X = 0;
const STATE_Y = 1;
const STATE_ANGLE = 2;
const STATE_BANK = 3;
const STATE_ALPHA = 4;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function fract(value) {
  return value - Math.floor(value);
}

function smootherstep(start, end, value) {
  const amount = clamp01((value - start) / (end - start));
  return amount ** 3 * (amount * (amount * 6 - 15) + 10);
}

function mix(start, end, amount) {
  return start + (end - start) * amount;
}

function hash(index, salt) {
  return fract(Math.sin(index * 127.1 + salt * 311.7 + 19.73) * 43758.5453);
}

function mixAngle(start, end, amount) {
  const delta = Math.atan2(Math.sin(end - start), Math.cos(end - start));
  return start + delta * amount;
}

// All flock identity is created once. Order follows physical neighbors along
// the crescent, so the delayed turn reads as a decision passing bird-to-bird.
const BOIDS = new Float32Array(BOID_COUNT * PARAM_STRIDE);
const COLORS = new Array(BOID_COUNT);

for (let index = 0; index < BOID_COUNT; index += 1) {
  const offset = index * PARAM_STRIDE;
  const baseOrder = index / (BOID_COUNT - 1);
  const order = index === 0
    ? 0
    : clamp01(baseOrder + (hash(index, 1) - 0.5) * 0.018);
  const lane = index === 0 ? -0.08 : (hash(index, 2) - 0.5) * 2;
  const bend = Math.sin(Math.PI * order);
  const centerX = 21 - 9.8 * order + 2.65 * bend;
  const centerY = 7.7 + 14.1 * order - 1.05 * bend;
  const derivativeX = -9.8 + 2.65 * Math.PI * Math.cos(Math.PI * order);
  const derivativeY = 14.1 - 1.05 * Math.PI * Math.cos(Math.PI * order);
  const derivativeLength = Math.hypot(derivativeX, derivativeY) || 1;
  const forwardX = -derivativeX / derivativeLength;
  const forwardY = -derivativeY / derivativeLength;
  const normalX = -forwardY;
  const normalY = forwardX;
  const band = (0.42 + 1.18 * Math.sin(Math.PI * order)) * lane;
  const longitudinal = (hash(index, 3) - 0.5) * 0.72;
  const formX = centerX + normalX * band + forwardX * longitudinal;
  const formY = centerY + normalY * band + forwardY * longitudinal;
  const entryX = -3.6 - order * 7.4 + lane * 0.42;
  const entryY = 33.4 + order * 5.8 - lane * 0.28;
  const depth = index === 0 ? 1 : 0.14 + hash(index, 4) * 0.86;
  const tone = Math.round(mix(151, 38, depth));

  BOIDS[offset + FORM_X] = formX;
  BOIDS[offset + FORM_Y] = formY;
  BOIDS[offset + ENTRY_X] = entryX;
  BOIDS[offset + ENTRY_Y] = entryY;
  BOIDS[offset + HEADING] = Math.atan2(forwardY, forwardX);
  BOIDS[offset + ENTRY_HEADING] = Math.atan2(formY - entryY, formX - entryX);
  BOIDS[offset + ORDER] = order;
  BOIDS[offset + DEPTH] = depth;
  BOIDS[offset + SIZE] = index === 0 ? 1.1 : 0.84 + hash(index, 5) * 0.28;
  BOIDS[offset + FLUTTER] = hash(index, 6);
  COLORS[index] = `rgb(${tone} ${tone + 2} ${tone + 2})`;
}

const DRAW_ORDER = Uint8Array.from(
  Array.from({ length: BOID_COUNT }, (_, index) => index)
    .sort((a, b) => BOIDS[a * PARAM_STRIDE + DEPTH] - BOIDS[b * PARAM_STRIDE + DEPTH]),
);

function wrappedPhase(time) {
  const safeTime = Number.isFinite(time) ? time : 0;
  return ((safeTime / LOOP_SECONDS) % 1 + 1) % 1;
}

function writeAgentState(index, phase, output) {
  const source = index * PARAM_STRIDE;
  const target = index * STATE_STRIDE;
  const formX = BOIDS[source + FORM_X];
  const formY = BOIDS[source + FORM_Y];
  const entryX = BOIDS[source + ENTRY_X];
  const entryY = BOIDS[source + ENTRY_Y];
  const order = BOIDS[source + ORDER];
  const formationHeading = BOIDS[source + HEADING];
  const entryHeading = BOIDS[source + ENTRY_HEADING];
  const arrival = smootherstep(
    0.015 + order * 0.028,
    0.305 + order * 0.058,
    phase,
  );
  const arrivalBow = Math.sin(Math.PI * arrival);
  let x = mix(entryX, formX, arrival) + arrivalBow * (0.9 + order * 0.45);
  let y = mix(entryY, formY, arrival) - arrivalBow * (0.45 + order * 0.36);
  let angle = mixAngle(entryHeading, formationHeading, arrival);

  // The scout owns the first beat; the rest respond in crescent order over
  // roughly one second, with enough overlap to feel collective rather than
  // like 26 independent switches.
  const turnStart = 0.445 + order * 0.205;
  const turn = smootherstep(turnStart, turnStart + 0.072, phase);
  const bank = Math.sin(Math.PI * turn);
  const forwardX = Math.cos(formationHeading);
  const forwardY = Math.sin(formationHeading);
  const normalX = -forwardY;
  const normalY = forwardX;
  const reversalTravel = turn * (0.62 + (1 - order) * 0.88);
  const turnedX = formX - forwardX * reversalTravel + normalX * bank * 0.72;
  const turnedY = formY - forwardY * reversalTravel + normalY * bank * 0.72;

  x = mix(x, turnedX, turn);
  y = mix(y, turnedY, turn);
  // A small broadside overshoot gives the decision weight, then disappears
  // exactly as the new heading resolves. The scout banks most decisively.
  angle += Math.PI * turn + bank * (0.1 + (1 - order) * 0.08);

  const departure = smootherstep(0.688 + order * 0.041, 0.984, phase);
  const departureBow = Math.sin(Math.PI * departure);
  const exitHeading = Math.atan2(entryY - turnedY, entryX - turnedX);
  x = mix(x, entryX, departure) - departureBow * (1.05 + order * 0.55);
  y = mix(y, entryY, departure) + departureBow * (0.42 + order * 0.34);
  angle = mixAngle(angle, exitHeading, departure);

  const visibility = smootherstep(0.014 + order * 0.018, 0.105 + order * 0.042, phase) *
    (1 - smootherstep(0.962, 0.998, phase));
  output[target + STATE_X] = x;
  output[target + STATE_Y] = y;
  output[target + STATE_ANGLE] = angle;
  output[target + STATE_BANK] = bank;
  output[target + STATE_ALPHA] = visibility;
}

function traceMark(context, length, width) {
  context.beginPath();
  context.moveTo(length * 0.64, 0);
  context.quadraticCurveTo(length * 0.04, -width, -length * 0.58, -width * 0.28);
  context.quadraticCurveTo(-length * 0.18, 0, -length * 0.58, width * 0.28);
  context.quadraticCurveTo(length * 0.04, width, length * 0.64, 0);
  context.closePath();
}

function drawMark(context, x, y, angle, length, width, color, alpha, scout) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);

  if (scout) {
    context.save();
    context.translate(0.16, 0.2);
    traceMark(context, length * 1.06, width * 1.08);
    context.fillStyle = "rgb(40 42 43)";
    context.globalAlpha = alpha * 0.3;
    context.fill();
    context.restore();

    traceMark(context, length, width);
    context.fillStyle = "rgb(248 247 242)";
    context.globalAlpha = alpha;
    context.fill();
    context.strokeStyle = "rgb(57 60 60)";
    context.lineWidth = 0.18;
    context.globalAlpha = alpha * 0.76;
    context.stroke();
  } else {
    traceMark(context, length, width);
    context.fillStyle = color;
    context.globalAlpha = alpha;
    context.fill();
  }

  context.restore();
}

function drawFlock(context, time, _delta, width, height, state) {
  const phase = wrappedPhase(time);
  const size = Math.max(1, Math.min(width, height));
  const scale = size / 30;
  const offsetX = (width - size) * 0.5;
  const offsetY = (height - size) * 0.5;

  for (let index = 0; index < BOID_COUNT; index += 1) {
    writeAgentState(index, phase, state);
  }

  context.save();
  context.translate(offsetX, offsetY);
  context.scale(scale, scale);

  for (let orderIndex = 0; orderIndex < BOID_COUNT; orderIndex += 1) {
    const index = DRAW_ORDER[orderIndex];
    const source = index * PARAM_STRIDE;
    const target = index * STATE_STRIDE;
    const x = state[target + STATE_X];
    const y = state[target + STATE_Y];

    if (x < -3 || x > 33 || y < -3 || y > 33) continue;

    const depth = BOIDS[source + DEPTH];
    const bank = state[target + STATE_BANK];
    const flutter = Math.sin(TAU * (phase * 3 + BOIDS[source + FLUTTER]));
    const baseLength = mix(1.08, 1.74, depth) * BOIDS[source + SIZE];
    const length = baseLength * (1 - bank * 0.08);
    const markWidth = baseLength * (0.27 + bank * 0.1 + flutter * 0.018);
    const depthAlpha = mix(0.34, 0.9, depth);
    const alpha = state[target + STATE_ALPHA] * Math.min(1, depthAlpha + bank * 0.09);

    if (alpha <= 0.01) continue;

    drawMark(
      context,
      x,
      y,
      state[target + STATE_ANGLE],
      length,
      markWidth,
      COLORS[index],
      alpha,
      index === 0,
    );
  }

  context.restore();
}

export default {
  id: "murmuration-turn",
  name: "Murmuration Turn",
  kind: "canvas",
  technique: "Deterministic 26-boid reversal wave",
  label: "Turning",
  phaseOffset: 2017,
  mount(container) {
    const state = new Float32Array(BOID_COUNT * STATE_STRIDE);
    return createCanvasVisual(
      container,
      (context, time, delta, width, height) =>
        drawFlock(context, time, delta, width, height, state),
      { maxDpr: 3 },
    );
  },
};
