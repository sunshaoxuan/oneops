const LOOP_SECONDS = 3.3;

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
`;

const markup = /* html */ `
  <svg viewBox="0 0 30 30" role="presentation" aria-hidden="true">
    <path
      d="M 7.55 19.15
         C 3.05 15.45, 4.90 8.05, 12.40 6.45
         C 21.60 4.50, 27.10 11.70, 23.25 17.85
         C 20.25 22.65, 12.00 25.30, 7.55 21.05
         C 5.35 18.95, 7.55 15.85, 9.60 17.25
         C 11.45 18.50, 9.65 21.00, 7.55 19.15"
      fill="none"
      stroke="rgb(32 32 32)"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle
      cx="7.55"
      cy="19.15"
      r="1.12"
      fill="rgb(248 247 242)"
      stroke="rgb(32 32 32)"
    />
  </svg>
`;

export default {
  id: "orbital-calligraphy",
  name: "Orbital Calligraphy",
  kind: "svg",
  technique: "Bézier dash calligraphy",
  label: "Writing",
  phaseOffset: 1511,
  mount(container) {
    const host = document.createElement("span");
    host.className = "visual-dom";
    const shadowRoot = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    const shell = document.createElement("span");

    style.textContent = styles;
    shell.innerHTML = markup;
    const orbit = shell.querySelector("path");
    const head = shell.querySelector("circle");
    shadowRoot.append(style, ...shell.childNodes);
    container.replaceChildren(host);

    const pathLength = orbit.getTotalLength();

    function render(time) {
      const phase = ((time / LOOP_SECONDS) % 1 + 1) % 1;
      const headProgress = smootherstep(0.015, 0.74, phase);
      const tailProgress = smootherstep(0.78, 0.995, phase);
      const visibleLength = Math.max(0, headProgress - tailProgress) * pathLength;
      const tailDistance = tailProgress * pathLength;
      const tightTurn = pulse(headProgress, 0.72, 0.88, 0.965, 1);
      const catchAmount = pulse(phase, 0.64, 0.72, 0.79, 0.87);
      const release = smootherstep(0.79, 0.995, phase);
      const point = orbit.getPointAtLength(headProgress * pathLength);
      const mistTone = Math.round(mix(32, 128, release));

      orbit.setAttribute("stroke-dasharray", `${visibleLength} ${pathLength}`);
      orbit.setAttribute("stroke-dashoffset", String(-tailDistance));
      orbit.setAttribute("stroke-width", String(1.02 + tightTurn * 0.16 + catchAmount * 0.22));
      orbit.setAttribute("stroke", `rgb(${mistTone} ${mistTone + 2} ${mistTone + 3})`);
      orbit.setAttribute("stroke-opacity", String(mix(0.82, 0.42, release)));

      head.setAttribute("cx", String(point.x));
      head.setAttribute("cy", String(point.y));
      head.setAttribute("r", String(mix(1.12, 1.01, catchAmount)));
      head.setAttribute("stroke-width", String(0.48 + catchAmount * 0.48));
      head.setAttribute("stroke-opacity", String(0.88 + catchAmount * 0.1));
      head.setAttribute("fill-opacity", String(0.96 - catchAmount * 0.08));
    }

    render(0);

    return {
      render,
      resize(width, height) {
        const size = Math.max(1, Math.min(width, height));
        host.style.width = `${size}px`;
        host.style.height = `${size}px`;
      },
      reset() {
        render(0);
      },
      destroy() {
        host.remove();
      },
    };
  },
};
