// src/lib/three/island/dispose.ts
import * as THREE from "three";

export interface Disposable {
  dispose(): void;
}

/**
 * GPU resources that live outside the scene graph (render targets, the PMREM environment, canvas
 * textures, in-flight image loads…). Each is disposed once; deferred callbacks run first.
 */
export class DisposeBag {
  private readonly items = new Set<Disposable>();
  private readonly callbacks: (() => void)[] = [];
  private done = false;

  get disposed(): boolean {
    return this.done;
  }

  add<T extends Disposable>(item: T): T {
    if (this.done) item.dispose();
    else this.items.add(item);
    return item;
  }

  defer(callback: () => void): void {
    if (this.done) callback();
    else this.callbacks.push(callback);
  }

  dispose(): void {
    if (this.done) return;
    this.done = true;
    this.callbacks.splice(0).forEach((callback) => callback());
    this.items.forEach((item) => item.dispose());
    this.items.clear();
  }
}

function texturesOf(material: THREE.Material): THREE.Texture[] {
  const found: THREE.Texture[] = [];
  for (const value of Object.values(material)) if (value instanceof THREE.Texture) found.push(value);
  const uniforms = (material as Partial<THREE.ShaderMaterial>).uniforms;
  if (uniforms) for (const uniform of Object.values(uniforms)) if (uniform?.value instanceof THREE.Texture) found.push(uniform.value);
  return found;
}

/**
 * Disposes every geometry, material and texture reachable from `root` exactly once — shared ones
 * included — plus InstancedMesh instance buffers and, for a Scene, its environment/background.
 */
export function disposeGraph(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    const { geometry, material } = object as Partial<THREE.Mesh>;
    if (geometry) geometries.add(geometry);
    if (material) (Array.isArray(material) ? material : [material]).forEach((m) => materials.add(m));
    if ((object as THREE.InstancedMesh).isInstancedMesh) (object as THREE.InstancedMesh).dispose();
  });
  if (root instanceof THREE.Scene) {
    if (root.environment) textures.add(root.environment);
    if (root.background instanceof THREE.Texture) textures.add(root.background);
  }
  materials.forEach((m) => texturesOf(m).forEach((t) => textures.add(t)));
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}
