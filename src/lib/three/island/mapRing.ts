// src/lib/three/island/mapRing.ts
import * as THREE from "three";
import { RING_CENTER, RING_RADIUS, ringFade } from "./chapters";
import type { DisposeBag } from "./dispose";
import { addPointLight } from "./lights";
import { damp, DEG, sstep } from "./math";
import { fogUniforms, GLSL_FOG_ADD } from "./noise";
import type { RingMapInfo, SceneContext, Unit } from "./types";

// Chapter 2 — ring of map screens (prototype lines 962–1135). Screens come from maps.json (via
// RingMapInfo), labels use the real next/font families, the focused screen is reported to the host.

const SCR_W = 6.4;
const SCR_H = 3.6;

// GLSL bodies: each shader below is the prototype's template literal at the cited lines, pasted verbatim, plus
// the portrait fade (uFade, T11): additive output scaled; face + body alpha, with a dithered tail (below).
const GLSL_SDF = `float sdRR(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }`;

/**
 * Fade tail of the opaque parts (face, body): below FADE_DITHER their depth-writing coverage drops with the fade
 * (dithered) and alpha stays FADE_DITHER, so the expected opacity is still `fade` — and the additive particles
 * behind a nearly gone screen come back gradually instead of all at once when the ring is hidden. At fade 1:
 * full coverage, alpha 1 → exactly the opaque look.
 */
const FADE_DITHER = 0.25;
const GLSL_FADE = /* glsl */ `
float ringDither(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float ringCoverage(float fade){ return min(1.0, fade * ${(1 / FADE_DITHER).toFixed(1)}); }`;
const fadeAlpha = (fade: number) => fade / Math.min(1, fade / FADE_DITHER);
const FACE_VS = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  varying vec2 vUv;
  void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const FACE_FS = /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform sampler2D uMap; uniform float uFocus, uTime, uSeed, uFade; varying vec2 vUv;
      ${GLSL_SDF}
      ${GLSL_FADE}
      void main(){
        vec2 sz = vec2(${SCR_W.toFixed(2)}, ${SCR_H.toFixed(2)});
        vec2 p = (vUv - 0.5) * sz;
        if (sdRR(p, sz * 0.5, 0.26) > 0.0) discard;
        float cov = ringCoverage(uFade);
        if (ringDither(gl_FragCoord.xy) >= cov) discard;
        vec3 t = texture2D(uMap, vUv).rgb;
        float vig = smoothstep(1.05, 0.35, length((vUv - 0.5) * vec2(1.0, 1.25)));
        vec3 c = t * mix(0.45, 0.98, uFocus) * mix(0.7, 1.0, vig);
        float sw = fract(uTime * 0.09 + uSeed);
        float band = smoothstep(0.06, 0.0, abs((vUv.x + vUv.y * 0.35) - (sw * 2.2 - 0.4)));
        c += vec3(0.6, 0.9, 1.0) * band * 0.12;
        c += vec3(0.0, 0.05, 0.1) * (1.0 - uFocus);
        gl_FragColor = vec4(c, uFade / cov);
        #include <fog_fragment>
      }`;
const HALO_FS = /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform float uFocus, uTime, uSeed, uFade; varying vec2 vUv;
      ${GLSL_SDF}
      void main(){
        vec2 sz = vec2(${(SCR_W + 3.2).toFixed(2)}, ${(SCR_H + 3.2).toFixed(2)});
        vec2 p = (vUv - 0.5) * sz;
        float d = sdRR(p, vec2(${(SCR_W / 2 + 0.16).toFixed(3)}, ${(SCR_H / 2 + 0.16).toFixed(3)}), 0.36);
        float w = fwidth(d) * 1.2;
        float line = smoothstep(0.035 + w, 0.0, abs(d));
        float halo = exp(-max(d, 0.0) * 2.4) * step(0.0, d) * smoothstep(1.6, 0.4, d);
        float ang = atan(p.y, p.x);
        float flow = 0.5 + 0.5 * sin(ang * 1.0 - uTime * 1.3 + uSeed * 6.0);
        float spark = pow(0.5 + 0.5 * sin(ang * 1.0 - uTime * 1.3 + uSeed * 6.0 + 1.2), 24.0);
        vec3 c = mix(vec3(0.0, 0.8, 1.2), vec3(0.62, 0.2, 1.25), flow);
        vec3 outC = c * (line * (1.2 + 2.2 * uFocus + spark * 2.6) + halo * (0.08 + 0.16 * uFocus)) * uFade;
        ${GLSL_FOG_ADD}
        gl_FragColor = vec4(outC, 1.0);
      }`;
const TRACK_FS = /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime, uFade; varying vec2 vUv;
      void main(){
        float a = vUv.x * 6.2831853;
        vec3 c = mix(vec3(0.0, 0.8, 1.2), vec3(0.65, 0.2, 1.3), 0.5 + 0.5 * sin(a * 2.0 + uTime * 0.6));
        float pulse = pow(0.5 + 0.5 * sin(a * 3.0 - uTime * 1.7), 18.0);
        vec3 outC = c * (1.4 + pulse * 3.5) * uFade;
        ${GLSL_FOG_ADD}
        gl_FragColor = vec4(outC, 1.0);
      }`;
const FLOOR_FS = /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime, uFade; varying vec2 vUv;
      float ln(float x, float w){ return smoothstep(w, 0.0, abs(x)); }
      void main(){
        vec2 p = (vUv - 0.5) * 56.0; float r = length(p); float a = atan(p.y, p.x);
        float fw = fwidth(r) * 1.5;
        float I = ln(r - 16.0, fw + 0.02) * 0.9 + ln(r - 12.0, fw) * 0.35 + ln(r - 20.5, fw + 0.01) * 0.45 + ln(r - 24.0, fw) * 0.2;
        float ticks = step(0.72, fract(a / 6.2831853 * 120.0)) * ln(r - 18.2, 0.45) * 0.4;
        float sweep = pow(max(0.0, cos(a - uTime * 0.45)), 40.0) * smoothstep(22.0, 3.0, r) * 0.22;
        vec3 c = mix(vec3(0.0, 0.75, 1.2), vec3(0.6, 0.2, 1.25), 0.5 + 0.5 * sin(a + uTime * 0.3));
        vec3 outC = c * (I + ticks + sweep) * smoothstep(27.0, 22.0, r) * uFade;
        ${GLSL_FOG_ADD}
        gl_FragColor = vec4(outC, 1.0);
      }`;

interface Screen {
  group: THREE.Group;
  face: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  halo: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  label: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  labelMap: THREE.CanvasTexture;
  base: THREE.Vector3;
  focus: number;
}

export interface MapRingOptions {
  maps: readonly RingMapInfo[];
  minutesUnit: string;
  onFocusChange(index: number): void;
}

interface LabelFonts {
  heading: string;
  body: string;
}

function cssFontFamily(variable: "--font-orbitron" | "--font-inter"): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || "sans-serif";
}

/** Blank until drawLabel(); it exists from the start so the label program is compiled with its map. */
function labelTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 154;
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function drawLabel(texture: THREE.CanvasTexture, m: RingMapInfo, index: number, minutesUnit: string, fonts: LabelFonts): void {
  const g = (texture.image as HTMLCanvasElement).getContext("2d");
  if (g) {
    g.textBaseline = "alphabetic";
    g.font = `700 30px ${fonts.heading}`;
    g.fillStyle = "#00D4FF";
    g.fillText(String(index + 1).padStart(2, "0"), 6, 52);
    g.fillStyle = "rgba(255,255,255,.25)";
    g.fillRect(70, 40, 60, 2);
    g.font = `800 46px ${fonts.heading}`;
    g.fillStyle = "#F5F2FF";
    g.fillText(m.title, 150, 56);
    g.font = `600 26px ${fonts.body}`;
    g.fillStyle = "rgba(214,204,255,.72)";
    g.fillText(`${m.creator}   ·   ${m.minutes} ${minutesUnit.toUpperCase()}   ·   ${m.tag}`, 150, 112);
  }
  texture.needsUpdate = true;
}

/**
 * The screens are drawn at 1024×576: fetch each thumbnail through the Next image optimizer (same origin) at
 * 1080 px — the nearest width of next/image's default deviceSizes — instead of the full-size JPEG.
 */
function thumbnailUrl(src: string): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=70`;
}

/**
 * Map thumbnail drawn into a 1024×576 canvas (prototype 1012–1025). Never blocks the first frame; uploaded to
 * the GPU as soon as it arrives (`upload`), not on the frame the ring first appears.
 */
function loadThumbnail(url: string, anisotropy: number, bag: DisposeBag, upload: (texture: THREE.Texture) => void): THREE.Texture {
  const texture = new THREE.Texture();
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    if (bag.disposed) return;
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 576;
    c.getContext("2d")?.drawImage(img, 0, 0, 1024, 576);
    texture.image = c;
    texture.needsUpdate = true;
    upload(texture);
  };
  img.onerror = () => undefined; // missing thumbnail → the screen stays dark; never break the scene
  img.src = url;
  bag.defer(() => {
    img.onload = null;
    img.onerror = null;
    img.removeAttribute("src"); // abort the download
  });
  return texture;
}

export function createMapRing({ scene, renderer, bag, uTime }: SceneContext, o: MapRingOptions): Unit {
  const group = new THREE.Group();
  scene.add(group);
  const center = new THREE.Vector3(...RING_CENTER);
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const upload = (texture: THREE.Texture) => renderer.initTexture(texture);

  const bodyGeometry = (() => {
    const w = SCR_W + 0.3;
    const h = SCR_H + 0.3;
    const r = 0.34;
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 6 }).translate(0, 0, -0.2);
  })();
  // Portrait fade (ringFade): one shared uniform for the shader materials. Face + body are transparent from the
  // start (alpha 1 renders exactly like opaque), so fading never builds a new program mid-scroll; renderOrder −1
  // draws them before every other transparent object — where the opaque pass drew them.
  const uFade = { value: 1 };
  let aspect = 16 / 9;
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x14101f, metalness: 0.75, roughness: 0.3, envMapIntensity: 1.4, transparent: true });
  bodyMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uFade = uFade;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform float uFade;${GLSL_FADE}`)
      .replace("void main() {", "void main() {\n  if (ringDither(gl_FragCoord.xy) >= ringCoverage(uFade)) discard;");
  };
  bodyMaterial.customProgramCacheKey = () => "ring-body-fade";
  const faceGeometry = new THREE.PlaneGeometry(SCR_W, SCR_H);
  const haloGeometry = new THREE.PlaneGeometry(SCR_W + 3.2, SCR_H + 3.2);
  const labelGeometry = new THREE.PlaneGeometry(SCR_W * 0.9, SCR_W * 0.9 * 0.15);

  const screens: Screen[] = o.maps.map((m, i) => {
    const ang = (70 + i * 30) * DEG;
    const base = new THREE.Vector3(center.x + Math.cos(ang) * RING_RADIUS, center.y + Math.sin(i * 1.3) * 0.5, center.z + Math.sin(ang) * RING_RADIUS);
    const g = new THREE.Group();
    g.position.copy(base);
    const face = new THREE.Mesh(
      faceGeometry,
      new THREE.ShaderMaterial({
        fog: true,
        transparent: true,
        uniforms: fogUniforms({ uMap: { value: loadThumbnail(thumbnailUrl(m.thumbnail), anisotropy, bag, upload) }, uFocus: { value: 0 }, uTime, uSeed: { value: i * 0.137 }, uFade }),
        vertexShader: FACE_VS,
        fragmentShader: FACE_FS,
      }),
    );
    face.position.z = -0.035;
    face.renderOrder = -1;
    const halo = new THREE.Mesh(
      haloGeometry,
      new THREE.ShaderMaterial({
        fog: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: fogUniforms({ uFocus: { value: 0 }, uTime, uSeed: { value: i * 0.7 }, uFade }),
        vertexShader: FACE_VS,
        fragmentShader: HALO_FS,
      }),
    );
    halo.position.z = -0.02;
    const labelMap = labelTexture();
    const label = new THREE.Mesh(labelGeometry, new THREE.MeshBasicMaterial({ map: labelMap, transparent: true, depthWrite: false, opacity: 0 }));
    label.position.set(-0.3, SCR_H / 2 + 0.85, 0);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.renderOrder = -1;
    g.add(body, face, halo, label);
    group.add(g);
    return { group: g, face, halo, label, labelMap, base, focus: 0 };
  });

  // Ring structure: glowing tracks + floor diagram (prototype 1092–1133)
  const trackMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true, uniforms: fogUniforms({ uTime, uFade }), vertexShader: FACE_VS, fragmentShader: TRACK_FS });
  for (const [radius, tube, radial] of [[RING_RADIUS, 0.045, 6], [RING_RADIUS + 1.3, 0.02, 4]] as const) {
    const track = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, radial, 240), trackMaterial);
    track.rotation.x = Math.PI / 2;
    track.position.copy(center).y -= 3.3;
    group.add(track);
  }
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(56, 56).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true, uniforms: fogUniforms({ uTime, uFade }), vertexShader: FACE_VS, fragmentShader: FLOOR_FS }),
  );
  floor.position.copy(center).y -= 4.6;
  group.add(floor);
  const light = addPointLight(scene, 0x8a4dff, 60, 40, 1.6, RING_CENTER);

  // Labels need the real next/font families; drawn once they are loaded (never blocks the first frame).
  const fonts: LabelFonts = { heading: cssFontFamily("--font-orbitron"), body: cssFontFamily("--font-inter") };
  let labelsDrawn = false;
  void Promise.all([
    document.fonts.load(`800 46px ${fonts.heading}`),
    document.fonts.load(`700 30px ${fonts.heading}`),
    document.fonts.load(`600 26px ${fonts.body}`),
  ])
    .catch(() => undefined)
    .then(() => {
      if (bag.disposed) return;
      screens.forEach((s, i) => {
        drawLabel(s.labelMap, o.maps[i], i, o.minutesUnit, fonts);
        upload(s.labelMap);
        s.label.material.opacity = 0.95;
      });
      labelsDrawn = true;
    });

  const forward = new THREE.Vector3();
  const toScreen = new THREE.Vector3();
  const dummy = new THREE.Object3D();
  const facing = new THREE.Quaternion();
  let lastFocus = -1;

  return {
    // Bob, turn toward the camera, focus the screen in view (prototype 1581–1604)
    update(frame, vis) {
      // Portrait: faded out as the stats chapter begins, then hidden (costs nothing); landscape: fade = 1.
      const fade = ringFade(frame.p, aspect);
      const on = vis.ring && fade > 0;
      light.setLevel(on ? fade : 0);
      group.visible = on;
      if (!on) return;
      uFade.value = fade;
      bodyMaterial.opacity = fadeAlpha(fade);
      const { camera, t, dt, bob } = frame;
      forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
      let best = -1;
      let bestF = 0;
      screens.forEach((s, i) => {
        s.group.position.set(s.base.x, s.base.y + Math.sin(t * 0.8 + i) * 0.22 * bob, s.base.z);
        dummy.position.copy(s.group.position);
        dummy.lookAt(center.x, s.group.position.y, center.z);
        facing.copy(dummy.quaternion);
        dummy.lookAt(camera.position);
        facing.slerp(dummy.quaternion, 0.5);
        s.group.quaternion.copy(facing);
        toScreen.copy(s.group.position).sub(camera.position);
        const dist = toScreen.length();
        const align = toScreen.normalize().dot(forward);
        const f = sstep(0.86, 0.985, align) * sstep(26, 12, dist);
        s.focus = damp(s.focus, f, 5, dt);
        s.face.material.uniforms.uFocus.value = s.focus;
        s.halo.material.uniforms.uFocus.value = s.focus;
        s.group.scale.setScalar(1 + s.focus * 0.07);
        if (labelsDrawn) s.label.material.opacity = (0.1 + 0.9 * s.focus) * fade;
        if (f > bestF) {
          bestF = f;
          best = i;
        }
      });
      if (best >= 0 && bestF > 0.3 && best !== lastFocus) {
        lastFocus = best;
        o.onFocusChange(best);
      }
    },
    resize(width, height) {
      aspect = width / height;
    },
  };
}
