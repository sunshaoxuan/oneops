import { createCanvasVisual } from "./canvas.js";

const VERTEX_SOURCE = `#version 300 es
precision highp float;

const vec2 POSITIONS[3] = vec2[3](
  vec2(-1.0, -1.0),
  vec2(3.0, -1.0),
  vec2(-1.0, 3.0)
);

void main() {
  gl_Position = vec4(POSITIONS[gl_VertexID], 0.0, 1.0);
}
`;

function makeFragmentSource(shaderBody) {
  return `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_seed;
out vec4 outColor;

${shaderBody}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  outColor = shade(uv, u_time, u_seed);
}
`;
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown shader compilation error";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function link(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Unknown shader link error";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

class SharedMicroRenderer {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1;
    this.canvas.height = 1;
    this.gl = this.canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      desynchronized: true,
      // These shaders render into small micro-canvases; favor the integrated GPU
      // so opening the gallery does not wake a discrete/high-power graphics path.
      powerPreference: "low-power",
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      stencil: false,
    });

    if (!this.gl) throw new Error("WebGL 2 is unavailable");

    this.vertexShader = compile(this.gl, this.gl.VERTEX_SHADER, VERTEX_SOURCE);
    this.gl.disable(this.gl.BLEND);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.CULL_FACE);
    this.gl.clearColor(0, 0, 0, 0);
  }

  register(config) {
    const fragmentShader = compile(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      makeFragmentSource(config.fragment),
    );
    const program = link(this.gl, this.vertexShader, fragmentShader);

    return {
      fragmentShader,
      program,
      resolutionLocation: this.gl.getUniformLocation(program, "u_resolution"),
      timeLocation: this.gl.getUniformLocation(program, "u_time"),
      seedLocation: this.gl.getUniformLocation(program, "u_seed"),
      seed: Number.isFinite(config.seed) ? config.seed : 1,
    };
  }

  draw(entry, width, height, time) {
    const gl = this.gl;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(entry.program);
    gl.uniform2f(entry.resolutionLocation, width, height);
    gl.uniform1f(entry.timeLocation, time);
    gl.uniform1f(entry.seedLocation, entry.seed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    return this.canvas;
  }

  release(entry) {
    this.gl.deleteProgram(entry.program);
    this.gl.deleteShader(entry.fragmentShader);
  }
}

let sharedRenderer;
let rendererFailure;

function getSharedRenderer() {
  if (sharedRenderer) return sharedRenderer;
  if (rendererFailure) throw rendererFailure;

  try {
    sharedRenderer = new SharedMicroRenderer();
    return sharedRenderer;
  } catch (error) {
    rendererFailure = error;
    throw error;
  }
}

function defaultFallback(context, time, _delta, width, height) {
  const size = Math.min(width, height);
  const radius = size * 0.27;
  const count = 12;
  const cx = width / 2;
  const cy = height / 2;

  context.fillStyle = "#191919";
  for (let index = 0; index < count; index += 1) {
    const phase = index / count;
    const angle = phase * Math.PI * 2 - time * 2.4;
    context.globalAlpha = 0.16 + 0.84 * ((phase + time * 0.38) % 1);
    context.beginPath();
    context.arc(
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius,
      size * (0.018 + phase * 0.025),
      0,
      Math.PI * 2,
    );
    context.fill();
  }
}

export function createShaderVisual(container, config) {
  let renderer;
  let entry;

  try {
    renderer = getSharedRenderer();
    entry = renderer.register(config);
  } catch (error) {
    console.error(`[${config.name ?? "WebGL loader"}]`, error);
    return createCanvasVisual(container, config.fallback ?? defaultFallback, {
      maxDpr: config.maxDpr ?? 3,
    });
  }

  const canvas = document.createElement("canvas");
  canvas.className = "visual-canvas";
  canvas.setAttribute("aria-hidden", "true");
  container.append(canvas);

  const context = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });

  let width = 1;
  let height = 1;
  let dpr = 1;

  function resize(nextWidth, nextHeight, nextDpr = window.devicePixelRatio || 1) {
    width = Math.max(1, nextWidth);
    height = Math.max(1, nextHeight);
    const defaultCap = 3;
    dpr = Math.min(config.maxDpr ?? defaultCap, Math.max(1, nextDpr));
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
  }

  return {
    render(time) {
      const source = renderer.draw(entry, canvas.width, canvas.height, time);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
    },
    resize,
    reset() {},
    destroy() {
      renderer.release(entry);
      canvas.remove();
    },
  };
}
