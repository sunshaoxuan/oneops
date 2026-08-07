const LOOP_SECONDS = 4.5;
const TAU = Math.PI * 2;
const POINT_COUNT = 24;
const NOISE_FPS = 30;
const NOISE_FRAME_COUNT = LOOP_SECONDS * NOISE_FPS;
const CENTER = 15;
const RADIUS_X = 9.15;
const RADIUS_Y = 10.65;
const SPLINE_TENSION = 0.78 / 6;
const FOLD_OFFSETS = [-0.34, -0.23, -0.12, 0, 0.12, 0.23, 0.34];
const FOLD_INSETS = [1.5, 2.1, 2.65, 2.9, 2.65, 2.1, 1.5];
const SEAM_POINTS = [
  [15.15, 6.85],
  [13.65, 10.1],
  [16.25, 12.85],
  [15, 15],
  [13.75, 17.2],
  [16.2, 20],
  [14.85, 23.15],
];

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smootherstep(start, end, value) {
  const amount = clamp01((value - start) / (end - start));
  return amount ** 3 * (amount * (amount * 6 - 15) + 10);
}

function pulse(value, riseStart, riseEnd, fallStart, fallEnd) {
  return smootherstep(riseStart, riseEnd, value) *
    (1 - smootherstep(fallStart, fallEnd, value));
}

function mix(start, end, amount) {
  return start + (end - start) * amount;
}

function wrappedPhase(time) {
  return ((time / LOOP_SECONDS) % 1 + 1) % 1;
}

function angularDelta(angle, origin) {
  return Math.atan2(Math.sin(angle - origin), Math.cos(angle - origin));
}

function formatNumber(value) {
  return Math.abs(value) < 0.0005 ? "0" : value.toFixed(3);
}

function formatPoint(point) {
  return `${formatNumber(point[0])} ${formatNumber(point[1])}`;
}

function closedSpline(points) {
  let path = `M ${formatPoint(points[0])}`;

  for (let index = 0; index < points.length; index += 1) {
    const before = points[(index - 1 + points.length) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const after = points[(index + 2) % points.length];
    const controlA = [
      current[0] + (next[0] - before[0]) * SPLINE_TENSION,
      current[1] + (next[1] - before[1]) * SPLINE_TENSION,
    ];
    const controlB = [
      next[0] - (after[0] - current[0]) * SPLINE_TENSION,
      next[1] - (after[1] - current[1]) * SPLINE_TENSION,
    ];
    path += ` C ${formatPoint(controlA)} ${formatPoint(controlB)} ${formatPoint(next)}`;
  }

  return `${path} Z`;
}

function stateAt(time) {
  const phase = wrappedPhase(time);
  const wrinkle = pulse(phase, 0.025, 0.14, 0.55, 0.72);
  const foldWrinkle = pulse(phase, 0.065, 0.18, 0.58, 0.735);
  const seam = pulse(phase, 0.48, 0.69, 0.82, 0.985);
  const travel = smootherstep(0.06, 0.66, phase);
  const convergence = smootherstep(0.48, 0.73, phase);
  const wrinkleAngle = -Math.PI * 0.72 + TAU * 0.92 * travel;

  return {
    phase,
    wrinkle,
    seam,
    convergence,
    wrinkleAngle,
    foldAngle: wrinkleAngle - foldWrinkle * 0.16,
    rotation: Math.sin(TAU * phase) * 10,
    filterScale: wrinkle * mix(1.24, 0.28, seam),
    foldOpacity: Math.max(foldWrinkle * 0.44, seam * 0.92),
  };
}

function contourAt(state) {
  const points = [];

  for (let index = 0; index < POINT_COUNT; index += 1) {
    const angle = -Math.PI / 2 + (index / POINT_COUNT) * TAU;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const sidePinch = state.seam * (0.13 + 0.2 * Math.abs(cosine) ** 1.8);
    let x = cosine * RADIUS_X * (1 - sidePinch);
    let y = sine * RADIUS_Y * (1 + state.seam * 0.035);

    // This compact, alternating profile is the normalized-path fallback and
    // also keeps the primary wrinkle readable beneath the SVG displacement.
    const delta = angularDelta(angle, state.wrinkleAngle);
    const envelope = 1 - smootherstep(0.12, 0.92, Math.abs(delta));
    const wrinkleOffset = state.wrinkle * envelope *
      (0.72 * Math.cos(delta * 9.5) - 0.12);
    const normalX = cosine / RADIUS_X;
    const normalY = sine / RADIUS_Y;
    const normalLength = Math.hypot(normalX, normalY) || 1;

    x += wrinkleOffset * normalX / normalLength;
    y += wrinkleOffset * normalY / normalLength;
    x += state.seam * 0.2 * Math.sin(angle * 2);
    points.push([CENTER + x, CENTER + y]);
  }

  return points;
}

function interiorPoint(angle, inset) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const normalX = cosine / RADIUS_X;
  const normalY = sine / RADIUS_Y;
  const normalLength = Math.hypot(normalX, normalY) || 1;
  return [
    CENTER + cosine * RADIUS_X - inset * normalX / normalLength,
    CENTER + sine * RADIUS_Y - inset * normalY / normalLength,
  ];
}

function foldPathAt(state) {
  const travelling = FOLD_OFFSETS.map((offset, index) =>
    interiorPoint(state.foldAngle + offset, FOLD_INSETS[index]));
  const points = travelling.map((point, index) => [
    mix(point[0], SEAM_POINTS[index][0], state.convergence),
    mix(point[1], SEAM_POINTS[index][1], state.convergence),
  ]);

  return `M ${formatPoint(points[0])} ` +
    `C ${formatPoint(points[1])} ${formatPoint(points[2])} ${formatPoint(points[3])} ` +
    `C ${formatPoint(points[4])} ${formatPoint(points[5])} ${formatPoint(points[6])}`;
}

const styles = /* css */ `
  :host {
    display: block;
    width: 100%;
    height: 100%;
    contain: strict;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
    shape-rendering: geometricPrecision;
  }

  .membrane {
    fill: url(#chrysalis-body);
    stroke: rgb(37 39 42);
    stroke-width: 1.02;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .fold-shadow,
  .fold-light {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .fold-shadow {
    stroke: rgb(43 45 48);
    stroke-width: 1.5;
  }

  .fold-light {
    stroke: rgb(201 202 213);
    stroke-width: 0.66;
  }
`;

const markup = /* html */ `
  <svg viewBox="0 0 30 30" role="presentation" aria-hidden="true">
    <defs>
      <radialGradient id="chrysalis-body" cx="35%" cy="27%" r="76%">
        <stop offset="0" stop-color="rgb(247 246 241)" stop-opacity="0.56" />
        <stop offset="0.46" stop-color="rgb(124 126 129)" stop-opacity="0.3" />
        <stop offset="1" stop-color="rgb(61 63 66)" stop-opacity="0.46" />
      </radialGradient>
      <filter id="chrysalis-displace" filterUnits="userSpaceOnUse"
        primitiveUnits="userSpaceOnUse" x="2.5" y="1.5" width="25" height="27"
        color-interpolation-filters="sRGB">
        <feTurbulence class="noise" type="fractalNoise" baseFrequency="0.08 0.29"
          numOctaves="2" seed="17" stitchTiles="stitch" result="noise-field" />
        <feOffset class="noise-shift" in="noise-field" dx="0" dy="0"
          result="travelling-noise" />
        <feDisplacementMap class="displacement" in="SourceGraphic" in2="travelling-noise"
          scale="0" xChannelSelector="R" yChannelSelector="B" />
      </filter>
    </defs>
    <g class="chrysalis">
      <path class="membrane" filter="url(#chrysalis-displace)" />
      <path class="fold-shadow" />
      <path class="fold-light" />
    </g>
  </svg>
`;

export default {
  id: "noise-chrysalis",
  name: "Noise Chrysalis",
  kind: "svg",
  technique: "Bounded turbulence-displaced membrane",
  label: "Forming",
  phaseOffset: 1709,
  mount(container) {
    const documentRef = container.ownerDocument;
    const host = documentRef.createElement("span");
    const shadowRoot = host.attachShadow({ mode: "closed" });
    const style = documentRef.createElement("style");
    const shell = documentRef.createElement("span");

    host.className = "visual-dom";
    style.textContent = styles;
    shell.innerHTML = markup;

    const svg = shell.querySelector("svg");
    const group = svg.querySelector(".chrysalis");
    const membrane = svg.querySelector(".membrane");
    const foldShadow = svg.querySelector(".fold-shadow");
    const foldLight = svg.querySelector(".fold-light");
    const turbulence = svg.querySelector(".noise");
    const noiseShift = svg.querySelector(".noise-shift");
    const displacement = svg.querySelector(".displacement");
    const view = documentRef.defaultView;
    const filterSupported = Boolean(view) &&
      "SVGFETurbulenceElement" in view &&
      "SVGFEDisplacementMapElement" in view;
    let lastNoiseFrame = -1;
    let destroyed = false;

    if (!filterSupported) membrane.removeAttribute("filter");
    shadowRoot.append(style, svg);
    container.replaceChildren(host);

    function updateNoise(phase) {
      if (!filterSupported) return;
      const frame = Math.floor(phase * NOISE_FRAME_COUNT) % NOISE_FRAME_COUNT;
      if (frame === lastNoiseFrame) return;

      lastNoiseFrame = frame;
      const noisePhase = frame / NOISE_FRAME_COUNT;
      const horizontal = 0.079 + Math.sin(TAU * noisePhase) * 0.008;
      const vertical = 0.29 + Math.cos(TAU * noisePhase) * 0.035;
      turbulence.setAttribute("baseFrequency", `${horizontal.toFixed(4)} ${vertical.toFixed(4)}`);
      noiseShift.setAttribute("dx", (Math.cos(TAU * noisePhase) * 0.72).toFixed(3));
      noiseShift.setAttribute("dy", (Math.sin(TAU * noisePhase) * 0.56).toFixed(3));
    }

    function render(time) {
      if (destroyed) return;
      const state = stateAt(time);
      const contour = closedSpline(contourAt(state));
      const fold = foldPathAt(state);

      updateNoise(state.phase);
      membrane.setAttribute("d", contour);
      group.setAttribute(
        "transform",
        `rotate(${state.rotation.toFixed(3)} ${CENTER} ${CENTER})`,
      );
      foldShadow.setAttribute("d", fold);
      foldLight.setAttribute("d", fold);
      foldShadow.setAttribute("opacity", (state.foldOpacity * 0.28).toFixed(3));
      foldLight.setAttribute("opacity", (state.foldOpacity * 0.82).toFixed(3));
      if (filterSupported) {
        displacement.setAttribute("scale", state.filterScale.toFixed(3));
      }
    }

    render(0);

    return {
      render,
      resize(width, height) {
        if (destroyed) return;
        const safeWidth = Number.isFinite(width) ? width : 30;
        const safeHeight = Number.isFinite(height) ? height : 30;
        const size = Math.max(1, Math.min(safeWidth, safeHeight));
        host.style.width = `${size}px`;
        host.style.height = `${size}px`;
      },
      reset() {
        if (destroyed) return;
        lastNoiseFrame = -1;
        render(0);
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        lastNoiseFrame = -1;
        host.remove();
      },
    };
  },
};
