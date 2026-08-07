const LOOP_SECONDS = 3.1;
const BLADE_COUNT = 6;
const STAGGER_SECONDS = 0.035;
const CLOSE_START = 0.15;
const CLOSE_TRAVEL_SECONDS = 0.62;
const OPEN_START = 1.43;
const OPEN_TRAVEL_SECONDS = 0.66;
const OPEN_ANGLE = -28;
const CLOSED_ANGLE = 0;
const OVERSHOOT_DEGREES = 2;
const LAST_CLOSE = CLOSE_START + CLOSE_TRAVEL_SECONDS +
  (BLADE_COUNT - 1) * STAGGER_SECONDS;
const CENTER = 15;
const HINGE_Y = 3.98;

const STATION_ANGLES = [0, 60, 120, 180, 240, 300];
const TOLERANCE_DEGREES = [0.04, -0.08, 0.11, -0.05, 0.07, -0.1];

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

function wrappedTime(time) {
  const safeTime = Number.isFinite(time) ? time : 0;
  return ((safeTime % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS;
}

function bladeStateAt(loopTime, index) {
  const closeStart = CLOSE_START + index * STAGGER_SECONDS;
  const reverseIndex = BLADE_COUNT - 1 - index;
  const openStart = OPEN_START + reverseIndex * STAGGER_SECONDS;
  const openEnd = openStart + OPEN_TRAVEL_SECONDS;
  const close = smootherstep(
    closeStart,
    closeStart + CLOSE_TRAVEL_SECONDS,
    loopTime,
  );
  const open = smootherstep(openStart, openEnd, loopTime);
  const closure = close * (1 - open);

  const recoil = pulse(
    loopTime,
    LAST_CLOSE,
    LAST_CLOSE + 0.055,
    LAST_CLOSE + 0.09,
    LAST_CLOSE + 0.18,
  );
  const returnCheck = pulse(
    loopTime,
    LAST_CLOSE + 0.075,
    LAST_CLOSE + 0.115,
    LAST_CLOSE + 0.14,
    LAST_CLOSE + 0.215,
  );
  const overshoot = pulse(
    loopTime,
    openEnd - 0.14,
    openEnd - 0.045,
    openEnd - 0.045,
    openEnd + 0.2,
  );
  const tolerance = TOLERANCE_DEGREES[index] * (0.18 + closure * 0.82);
  const angle = mix(OPEN_ANGLE, CLOSED_ANGLE, closure) -
    recoil * 0.78 + returnCheck * 0.18 -
    overshoot * OVERSHOOT_DEGREES + tolerance;

  return { angle, closure };
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

  .aperture-well {
    fill: url(#iris-well-depth);
    stroke: rgb(247 245 239 / 0.42);
    stroke-width: 0.34;
  }

  .blade-face {
    fill: url(#iris-blade-satin);
    fill-opacity: 0.94;
    stroke: rgb(27 28 28 / 0.76);
    stroke-width: 0.27;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .blade-bevel {
    fill: none;
    stroke: rgb(246 244 238 / 0.46);
    stroke-width: 0.32;
    stroke-linecap: round;
  }

  .pinhole {
    fill: rgb(249 247 241);
    stroke: rgb(69 69 66 / 0.62);
    stroke-width: 0.28;
  }

  .rim-shadow,
  .rim,
  .rim-light {
    fill: none;
  }

  .rim-shadow {
    stroke: rgb(20 21 21 / 0.2);
    stroke-width: 1.04;
    stroke-linecap: round;
  }

  .rim {
    stroke: rgb(47 48 47 / 0.8);
    stroke-width: 0.58;
  }

  .rim-light {
    stroke: rgb(251 249 243 / 0.76);
    stroke-width: 0.48;
    stroke-linecap: round;
  }

  .bearing {
    fill: rgb(224 221 214 / 0.82);
    stroke: rgb(40 41 40 / 0.72);
    stroke-width: 0.26;
  }
`;

const bladeMarkup = STATION_ANGLES.map((stationAngle) => `
  <g transform="rotate(${stationAngle} ${CENTER} ${CENTER})">
    <g class="blade-motion">
      <path class="blade-face" d="M 15 3.48
        C 18.91 3.59 22.38 5.45 24.27 8.62
        L 16.04 15.78
        C 15.69 16.09 15.16 16.11 14.82 15.76
        C 14.61 15.54 14.54 15.22 14.61 14.94
        L 15 3.48 Z" />
      <path class="blade-bevel" d="M 15.34 4.04
        C 18.65 4.28 21.63 5.78 23.48 8.49
        L 15.82 15.34" />
    </g>
  </g>
`).join("");

const bearingMarkup = STATION_ANGLES.map((stationAngle) => `
  <g transform="rotate(${stationAngle} ${CENTER} ${CENTER})">
    <circle class="bearing" cx="15" cy="3.98" r="0.36" />
  </g>
`).join("");

const markup = /* html */ `
  <svg viewBox="0 0 30 30" role="presentation" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id="iris-aperture-clip" clipPathUnits="userSpaceOnUse">
        <circle cx="15" cy="15" r="11.32" />
      </clipPath>
      <radialGradient id="iris-well-depth" cx="37%" cy="31%" r="74%">
        <stop offset="0" stop-color="rgb(248 246 240)" stop-opacity="0.12" />
        <stop offset="0.64" stop-color="rgb(61 62 61)" stop-opacity="0.08" />
        <stop offset="1" stop-color="rgb(25 26 26)" stop-opacity="0.16" />
      </radialGradient>
      <linearGradient id="iris-blade-satin" x1="14" y1="4" x2="21" y2="16"
        gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="rgb(105 106 103)" />
        <stop offset="0.2" stop-color="rgb(82 83 81)" />
        <stop offset="0.56" stop-color="rgb(55 56 55)" />
        <stop offset="1" stop-color="rgb(30 31 31)" />
      </linearGradient>
    </defs>
    <circle class="aperture-well" cx="15" cy="15" r="11.32" />
    <circle class="pinhole" cx="15" cy="15" r="0.72" />
    <g clip-path="url(#iris-aperture-clip)">
      ${bladeMarkup}
    </g>
    <path class="rim-shadow" d="M 23.66 22.62 A 11.54 11.54 0 0 1 9.75 25.25" />
    <circle class="rim" cx="15" cy="15" r="11.54" />
    <path class="rim-light" d="M 6.34 7.62 A 11.54 11.54 0 0 1 20.18 4.68" />
    ${bearingMarkup}
  </svg>
`;

export default {
  id: "mechanical-iris",
  name: "Mechanical Iris",
  kind: "svg",
  technique: "Six-lamella hinged aperture",
  label: "Opening",
  phaseOffset: 2401,
  mount(container) {
    const documentRef = container.ownerDocument;
    const host = documentRef.createElement("span");
    const shadowRoot = host.attachShadow({ mode: "closed" });
    const style = documentRef.createElement("style");
    const shell = documentRef.createElement("span");

    host.className = "visual-svg";
    style.textContent = styles;
    shell.innerHTML = markup;

    const svg = shell.querySelector("svg");
    const blades = Array.from(svg.querySelectorAll(".blade-motion"));
    const pinhole = svg.querySelector(".pinhole");
    let lastTime = Number.NaN;
    let destroyed = false;

    if (blades.length !== BLADE_COUNT || !pinhole) {
      throw new Error("Mechanical Iris SVG structure is incomplete");
    }

    host.setAttribute("aria-hidden", "true");
    shadowRoot.append(style, svg);
    container.replaceChildren(host);

    function render(time, _delta) {
      if (destroyed) return;
      const loopTime = wrappedTime(time);
      if (loopTime === lastTime) return;
      lastTime = loopTime;

      let collectiveClosure = 1;
      for (let index = 0; index < BLADE_COUNT; index += 1) {
        const state = bladeStateAt(loopTime, index);
        collectiveClosure = Math.min(collectiveClosure, state.closure);
        blades[index].setAttribute(
          "transform",
          `rotate(${fixed(state.angle)} ${CENTER} ${HINGE_Y})`,
        );
      }

      const pinholePresence = smootherstep(0.86, 0.995, collectiveClosure);
      pinhole.setAttribute("opacity", fixed(pinholePresence));
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
        lastTime = Number.NaN;
        render(0, 0);
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        lastTime = Number.NaN;
        host.remove();
      },
    };
  },
};
