// src/lib/three/island/dispose.test.ts
import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { DisposeBag, disposeGraph } from "./dispose";

describe("disposeGraph", () => {
  it("disposes shared geometries and materials exactly once", () => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial();
    const onGeometry = vi.fn();
    const onMaterial = vi.fn();
    geometry.addEventListener("dispose", onGeometry);
    material.addEventListener("dispose", onMaterial);
    const root = new THREE.Group();
    root.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, material));
    disposeGraph(root);
    expect(onGeometry).toHaveBeenCalledTimes(1);
    expect(onMaterial).toHaveBeenCalledTimes(1);
  });

  it("disposes textures held by materials and by shader uniforms", () => {
    const map = new THREE.Texture();
    const uniformTexture = new THREE.Texture();
    const onMap = vi.fn();
    const onUniform = vi.fn();
    map.addEventListener("dispose", onMap);
    uniformTexture.addEventListener("dispose", onUniform);
    const root = new THREE.Group();
    root.add(new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshBasicMaterial({ map })));
    root.add(new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.ShaderMaterial({ uniforms: { uMap: { value: uniformTexture } } })));
    disposeGraph(root);
    expect(onMap).toHaveBeenCalledTimes(1);
    expect(onUniform).toHaveBeenCalledTimes(1);
  });

  it("releases InstancedMesh buffers, Points and the scene environment", () => {
    const scene = new THREE.Scene();
    const environment = new THREE.Texture();
    scene.environment = environment;
    const instanced = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 3);
    const points = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial());
    scene.add(instanced, points);
    const onInstanced = vi.fn();
    const onEnvironment = vi.fn();
    const onPoints = vi.fn();
    instanced.addEventListener("dispose", onInstanced);
    environment.addEventListener("dispose", onEnvironment);
    points.geometry.addEventListener("dispose", onPoints);
    disposeGraph(scene);
    expect(onInstanced).toHaveBeenCalledTimes(1);
    expect(onEnvironment).toHaveBeenCalledTimes(1);
    expect(onPoints).toHaveBeenCalledTimes(1);
  });
});

describe("DisposeBag", () => {
  it("disposes each item once, runs deferred callbacks, and is idempotent", () => {
    const bag = new DisposeBag();
    const item = { dispose: vi.fn() };
    const callback = vi.fn();
    bag.add(item);
    bag.add(item);
    bag.defer(callback);
    bag.dispose();
    bag.dispose();
    expect(item.dispose).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(bag.disposed).toBe(true);
  });
  it("disposes late additions immediately", () => {
    const bag = new DisposeBag();
    bag.dispose();
    const late = { dispose: vi.fn() };
    const lateCallback = vi.fn();
    bag.add(late);
    bag.defer(lateCallback);
    expect(late.dispose).toHaveBeenCalledTimes(1);
    expect(lateCallback).toHaveBeenCalledTimes(1);
  });
});
