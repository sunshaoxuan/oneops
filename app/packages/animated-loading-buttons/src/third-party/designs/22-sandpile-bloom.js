import { createCanvasVisual } from "../core/canvas.js";

const GRID_SIZE = 13;
const MID = (GRID_SIZE - 1) / 2;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;
const CENTER_INDEX = MID * GRID_SIZE + MID;
const LOOP_SECONDS = 4;
const FRAME_RATE = 20;
const FRAME_COUNT = LOOP_SECONDS * FRAME_RATE;
const MAX_DRAIN_DISTANCE = Math.hypot(MID, MID) + 0.56 * MID;
const LATTICE_TILT = Math.PI / 4;

const COLORS = ["#d2d2d2", "#9a9a9a", "#565656", "#191919"];
const OPACITIES = [0.34, 0.56, 0.76, 0.94];
const CELL_SCALES = [0.2, 0.36, 0.53, 0.7];

function cellIndex(x, y) {
  return y * GRID_SIZE + x;
}

function precomputeAvalanche() {
  let heights = new Int16Array(CELL_COUNT);
  heights.fill(3);
  heights[CENTER_INDEX] = 4;

  const arrivals = new Int8Array(CELL_COUNT);
  const topplings = new Uint16Array(CELL_COUNT);
  arrivals.fill(-1);

  for (let wave = 0; wave < 16; wave += 1) {
    const outgoing = new Uint8Array(CELL_COUNT);

    for (let index = 0; index < CELL_COUNT; index += 1) {
      const amount = Math.floor(heights[index] / 4);
      if (amount === 0) continue;
      outgoing[index] = amount;
      topplings[index] += amount;
      if (arrivals[index] === -1) arrivals[index] = wave;
    }

    const next = heights.slice();
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const index = cellIndex(x, y);
        const amount = outgoing[index];
        if (amount === 0) continue;

        next[index] -= amount * 4;
        if (x > 0) next[index - 1] += amount;
        if (x < GRID_SIZE - 1) next[index + 1] += amount;
        if (y > 0) next[index - GRID_SIZE] += amount;
        if (y < GRID_SIZE - 1) next[index + GRID_SIZE] += amount;
      }
    }
    heights = next;
  }

  const settled = new Uint8Array(CELL_COUNT);
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const index = cellIndex(x, y);
      const dx = Math.abs(x - MID);
      const dy = Math.abs(y - MID);
      const latticeRing = Math.max(dx, dy) + dx + dy;
      settled[index] = 1 + ((heights[index] + topplings[index] + latticeRing) % 3);
    }
  }

  return { arrivals, settled };
}

function makeSeedFrame(level = 1) {
  const frame = new Uint8Array(CELL_COUNT);
  frame[CENTER_INDEX] = level;
  return frame;
}

function precomputeFrames() {
  const { arrivals, settled } = precomputeAvalanche();
  const frames = [];

  for (let step = 0; step < 10; step += 1) {
    frames.push(makeSeedFrame(step < 3 ? 1 : step < 6 ? 2 : 3));
  }

  for (let step = 0; step < 32; step += 1) {
    const frame = new Uint8Array(CELL_COUNT);
    const wave = Math.floor(step / 2);
    const releaseBeat = step % 2;

    for (let index = 0; index < CELL_COUNT; index += 1) {
      const arrival = arrivals[index];
      if (arrival < 0 || arrival > wave) continue;

      const age = wave - arrival;
      if (age === 0) frame[index] = releaseBeat === 0 ? 3 : 2;
      else if (age === 1 && releaseBeat === 0) frame[index] = Math.max(2, settled[index]);
      else frame[index] = settled[index];
    }
    frames.push(frame);
  }

  for (let step = 0; step < 22; step += 1) {
    const frame = settled.slice();
    const front = -0.8 + (step / 21) * 7.2;

    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const index = cellIndex(x, y);
        const edgeDistance = Math.min(x, y, GRID_SIZE - 1 - x, GRID_SIZE - 1 - y);
        const distanceToFront = Math.abs(edgeDistance - front);

        if (distanceToFront < 0.48) frame[index] = Math.max(0, frame[index] - 2);
        else if (edgeDistance < front - 0.48) frame[index] = Math.max(0, frame[index] - 1);
      }
    }
    frames.push(frame);
  }

  const reflected = frames[frames.length - 1];
  for (let step = 0; step < 16; step += 1) {
    if (step >= 14) {
      frames.push(makeSeedFrame());
      continue;
    }

    const frame = new Uint8Array(CELL_COUNT);
    const progress = step / 14;
    const liveRadius = 1 - progress;

    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const index = cellIndex(x, y);
        const dx = Math.abs(x - MID);
        const dy = Math.abs(y - MID);
        const radius = (Math.hypot(dx, dy) + 0.28 * (dx + dy)) / MAX_DRAIN_DISTANCE;
        if (radius <= liveRadius) {
          frame[index] = Math.max(0, reflected[index] - Math.floor(progress * 2));
        }
      }
    }
    frame[CENTER_INDEX] = Math.max(1, frame[CENTER_INDEX]);
    frames.push(frame);
  }

  return frames;
}

const FRAMES = precomputeFrames();

function drawSandpile(context, time, _delta, width, height) {
  const loopTime = ((time % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS;
  const frame = FRAMES[Math.floor(loopTime * FRAME_RATE) % FRAME_COUNT];
  const pitch = Math.min(width, height) / 18.4;

  context.imageSmoothingEnabled = false;
  context.translate(width * 0.5, height * 0.5);
  context.rotate(LATTICE_TILT);

  for (let level = 0; level < COLORS.length; level += 1) {
    const size = pitch * CELL_SCALES[level];
    const offset = size * 0.5;
    context.fillStyle = COLORS[level];
    context.globalAlpha = OPACITIES[level];
    context.beginPath();

    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const index = cellIndex(x, y);
        if (frame[index] !== level) continue;
        context.rect((x - MID) * pitch - offset, (y - MID) * pitch - offset, size, size);
      }
    }
    context.fill();
  }
}

export default {
  id: "sandpile-bloom",
  name: "Sandpile Bloom",
  kind: "canvas",
  technique: "Precomputed 13 x 13 sandpile automaton",
  label: "Settling",
  mount(container) {
    return createCanvasVisual(container, drawSandpile, { maxDpr: 3 });
  },
};
