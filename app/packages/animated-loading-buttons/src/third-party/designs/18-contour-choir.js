const LOOP_SECONDS = 3.8;
const TAU = Math.PI * 2;
const CENTER = 15;
const VOICE_COUNT = 7;
const PROPAGATION_PHASE = 0.09 / LOOP_SECONDS;

// Inner voice first: the graphite center leads and progressively lighter
// contours answer it toward the pearl-fog boundary.
const VOICES = [
  { red: 33, green: 35, blue: 36, opacity: 0.94, width: 0.82, axis: -12 },
  { red: 48, green: 50, blue: 51, opacity: 0.88, width: 0.77, axis: 8 },
  { red: 66, green: 68, blue: 69, opacity: 0.81, width: 0.72, axis: -9 },
  { red: 87, green: 89, blue: 89, opacity: 0.73, width: 0.67, axis: 11 },
  { red: 111, green: 113, blue: 112, opacity: 0.64, width: 0.62, axis: -7 },
  { red: 141, green: 143, blue: 140, opacity: 0.54, width: 0.58, axis: 7 },
  { red: 181, green: 181, blue: 175, opacity: 0.43, width: 0.54, axis: -4 },
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
  const safeTime = Number.isFinite(time) ? time : 0;
  return ((safeTime / LOOP_SECONDS) % 1 + 1) % 1;
}

function fixed(value) {
  return Math.abs(value) < 0.0005 ? "0" : value.toFixed(3);
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

  .contour {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
`;

const markup = /* html */ `
  <svg viewBox="0 0 30 30" role="presentation" aria-hidden="true" focusable="false">
    <path class="contour" d="M 15.30 3.15
      C 20.10 2.92 24.50 5.73 26.10 10.02
      C 27.72 14.37 26.13 20.55 22.35 23.89
      C 18.82 27.00 13.10 27.72 8.77 25.10
      C 4.25 22.38 2.43 17.15 3.63 12.35
      C 4.77 7.82 10.15 3.38 15.30 3.15 Z" />
    <path class="contour" d="M 14.55 5.00
      C 18.80 4.43 23.20 7.02 24.50 10.82
      C 25.95 15.05 24.60 20.10 21.06 22.90
      C 17.53 25.70 12.60 25.66 8.90 23.42
      C 5.19 21.15 4.22 16.17 5.35 12.12
      C 6.47 8.08 10.32 5.58 14.55 5.00 Z" />
    <path class="contour" d="M 15.35 6.58
      C 19.00 6.56 22.04 8.31 23.30 11.58
      C 24.54 14.83 23.02 19.09 20.42 21.19
      C 17.64 23.42 13.48 24.04 10.25 22.05
      C 7.43 20.33 5.87 16.51 6.98 13.22
      C 8.12 9.82 11.64 6.60 15.35 6.58 Z" />
    <path class="contour" d="M 14.52 8.12
      C 17.57 7.76 20.67 9.66 21.85 12.33
      C 23.16 15.28 21.62 18.62 19.32 20.34
      C 16.88 22.16 13.10 22.28 10.76 20.23
      C 8.52 18.25 7.54 15.18 8.81 12.44
      C 9.94 10.00 11.77 8.44 14.52 8.12 Z" />
    <path class="contour" d="M 15.22 9.75
      C 17.58 9.77 19.77 11.26 20.32 13.46
      C 21.03 16.22 19.82 18.49 17.60 19.78
      C 15.37 21.07 12.43 20.31 10.99 18.49
      C 9.55 16.66 9.69 13.92 11.29 11.99
      C 12.34 10.72 13.60 9.74 15.22 9.75 Z" />
    <path class="contour" d="M 14.58 11.27
      C 16.54 10.98 18.32 12.21 18.93 13.88
      C 19.64 15.82 18.76 17.79 17.08 18.71
      C 15.40 19.64 13.33 19.05 12.12 17.67
      C 10.94 16.31 10.93 14.27 12.15 12.81
      C 12.78 12.06 13.62 11.41 14.58 11.27 Z" />
    <path class="contour" d="M 15.18 12.68
      C 16.47 12.69 17.45 13.54 17.62 14.69
      C 17.81 15.96 17.07 17.14 15.86 17.43
      C 14.59 17.74 13.38 17.01 12.98 15.84
      C 12.56 14.61 13.23 13.39 14.31 12.90
      C 14.59 12.77 14.88 12.68 15.18 12.68 Z" />
  </svg>
`;

export default {
  id: "contour-choir",
  name: "Contour Choir",
  kind: "svg",
  technique: "Phase-reversed organic contour canon",
  label: "Syncing",
  phaseOffset: 1801,
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
    // Markup is painter-ordered outer-to-inner; motion is indexed leader-first.
    const contours = Array.from(svg.querySelectorAll(".contour")).reverse();
    let lastPhase = Number.NaN;
    let destroyed = false;

    shadowRoot.append(style, svg);
    container.replaceChildren(host);

    function render(time, _delta) {
      if (destroyed) return;
      const phase = wrappedPhase(time);
      if (phase === lastPhase) return;
      lastPhase = phase;
      const unison = pulse(phase, 0.635, 0.67, 0.695, 0.73);
      const wobbleGate = pulse(phase, 0.72, 0.78, 0.91, 0.985);
      const wobbleAngle = TAU * (phase - 0.72);

      for (let index = 0; index < VOICE_COUNT; index += 1) {
        const contour = contours[index];
        const voice = VOICES[index];
        const outwardDelay = index * PROPAGATION_PHASE;
        const returnDelay = (VOICE_COUNT - 1 - index) * PROPAGATION_PHASE;
        const inhale = pulse(
          phase,
          0.045 + outwardDelay,
          0.09 + outwardDelay,
          0.17 + outwardDelay,
          0.245 + outwardDelay,
        );
        const returnBreath = pulse(
          phase,
          0.29 + returnDelay,
          0.345 + returnDelay,
          0.42 + returnDelay,
          0.50 + returnDelay,
        );
        // The rim catches the outbound phrase before sending it back inward;
        // this hinge keeps the action from reading as an endless ripple.
        const boundaryTurn = index === VOICE_COUNT - 1
          ? pulse(phase, 0.255, 0.305, 0.355, 0.405)
          : 0;
        const depth = index / (VOICE_COUNT - 1);
        const breathAmplitude = mix(0.07, 0.047, depth);
        let scaleX = 1 + inhale * breathAmplitude -
          returnBreath * breathAmplitude * 0.52 - boundaryTurn * 0.012;
        let scaleY = 1 + inhale * breathAmplitude * 0.68 -
          returnBreath * breathAmplitude * 0.38 + boundaryTurn * 0.019;
        const voiceAngle = wobbleAngle + index * 0.43;
        let offsetX = Math.sin(voiceAngle * 1.12) * mix(0.07, 0.19, depth) * wobbleGate;
        let offsetY = Math.cos(voiceAngle * 0.91) * mix(0.05, 0.13, depth) * wobbleGate;
        let rotation = Math.sin(voiceAngle) * mix(0.18, 0.72, depth) * wobbleGate +
          boundaryTurn * 0.48;

        scaleX = mix(scaleX, 1, unison);
        scaleY = mix(scaleY, 1, unison);
        offsetX *= 1 - unison;
        offsetY *= 1 - unison;
        rotation *= 1 - unison;

        const emphasis = inhale * 0.14 + returnBreath * 0.09;
        const opacity = mix(
          Math.min(1, voice.opacity + emphasis),
          0.7,
          unison,
        );
        const strokeWidth = mix(
          voice.width + inhale * 0.11 + returnBreath * 0.07,
          0.64,
          unison,
        );
        const red = Math.round(mix(voice.red, 82, unison));
        const green = Math.round(mix(voice.green, 84, unison));
        const blue = Math.round(mix(voice.blue, 84, unison));

        contour.setAttribute(
          "transform",
          `translate(${fixed(offsetX)} ${fixed(offsetY)}) ` +
            `translate(${CENTER} ${CENTER}) rotate(${fixed(rotation)}) ` +
            `rotate(${voice.axis}) scale(${fixed(scaleX)} ${fixed(scaleY)}) ` +
            `rotate(${-voice.axis}) translate(${-CENTER} ${-CENTER})`,
        );
        contour.setAttribute("stroke", `rgb(${red} ${green} ${blue})`);
        contour.setAttribute("stroke-opacity", fixed(opacity));
        contour.setAttribute("stroke-width", fixed(strokeWidth));
      }
    }

    render(0, 0);

    return {
      render,
      resize(width, height, _devicePixelRatio) {
        if (destroyed) return;
        const safeWidth = Number.isFinite(width) ? width : 30;
        const safeHeight = Number.isFinite(height) ? height : 30;
        const size = Math.max(1, Math.min(safeWidth, safeHeight));
        host.style.width = `${size}px`;
        host.style.height = `${size}px`;
      },
      reset() {
        if (destroyed) return;
        lastPhase = Number.NaN;
        render(0, 0);
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        lastPhase = Number.NaN;
        host.remove();
      },
    };
  },
};
