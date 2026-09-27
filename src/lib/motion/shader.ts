// Hand-written WebGL hero background (no library): domain-warped fbm plasma in the brand
// colours, a grid that bends like a lens around the lerped mouse, and a faint scanline.
const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

export const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 m = (uMouse - 0.5 * uRes) / uRes.y;
  vec2 dm = p - m;
  float d2 = dot(dm, dm);
  float t = uTime * 0.06;
  vec2 q = vec2(fbm(p * 1.6 + t), fbm(p * 1.6 - t + 4.2));
  float n = fbm(p * 1.8 + 2.2 * q + vec2(t * 1.3, -t) - dm * 0.35 * exp(-d2 * 4.0));
  vec3 col = vec3(0.039, 0.039, 0.059);
  col = mix(col, vec3(0.482, 0.184, 0.745), smoothstep(0.35, 0.85, n) * 0.55);
  col = mix(col, vec3(0.0, 0.831, 1.0), smoothstep(0.45, 0.9, q.y * n * 1.7) * 0.32);
  col += vec3(0.0, 0.831, 1.0) * 0.09 * exp(-d2 * 7.0);
  vec2 g = abs(fract((p + dm * 0.12 * exp(-d2 * 6.0)) * 11.0) - 0.5);
  float line = 1.0 - smoothstep(0.0, 0.04, min(g.x, g.y));
  col += line * 0.03 * smoothstep(1.1, 0.2, length(p - vec2(0.0, 0.25)));
  col += 0.01 * sin(gl_FragCoord.y * 1.4 + uTime * 6.0);
  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

/** Seconds since start, wrapped hourly so float precision never degrades on long sessions. */
export function shaderTime(ms: number): number {
  return (ms / 1000) % 3600;
}

/** Starts the render loop; returns a stop function, or null when WebGL is unavailable. */
export function startShader(canvas: HTMLCanvasElement): (() => void) | null {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(program, "uRes");
  const uTime = gl.getUniformLocation(program, "uTime");
  const uMouse = gl.getUniformLocation(program, "uMouse");

  // DPR capped at 1.5, then 0.75× (desktop) / 0.5× (< 768 px) internal resolution — re-evaluated on
  // every resize so a phone rotation / window resize picks the right budget.
  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * (window.innerWidth < 768 ? 0.5 : 0.75);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const target = { x: 0.7, y: 0.6 };
  const mouse = { x: 0.7, y: 0.6 };
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    target.x = (e.clientX - r.left) / r.width;
    target.y = 1 - (e.clientY - r.top) / r.height;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  let visible = true;
  let raf = 0;
  let live = false;
  const start = performance.now();

  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    mouse.x += (target.x - mouse.x) * 0.06;
    mouse.y += (target.y - mouse.y) * 0.06;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, shaderTime(now - start));
    gl.uniform2f(uMouse, mouse.x * canvas.width, mouse.y * canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!live) {
      live = true;
      canvas.classList.add("is-live");
    }
    loop();
  };
  const loop = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) loop();
  });
  io.observe(canvas);
  const onVisibility = () => {
    if (!document.hidden) loop();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const stop = () => {
    visible = false;
    cancelAnimationFrame(raf);
    raf = 0;
    ro.disconnect();
    io.disconnect();
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.classList.remove("is-live");
    gl.getExtension("WEBGL_lose_context")?.loseContext(); // free the GPU context now, not at GC
  };
  const onLost = () => stop(); // no restore: the CSS gradients underneath take over
  canvas.addEventListener("webglcontextlost", onLost);

  loop();
  return stop;
}
