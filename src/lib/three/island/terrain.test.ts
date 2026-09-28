import { createHash } from "node:crypto";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createMainIsland, makeIsland, type TopFn } from "./terrain";
import type { SceneContext } from "./types";

// F1 (final review): the detail-30 main island is generated in chunks that yield to the main thread.
// The output must stay byte-identical — these hashes were recorded from terrain.ts BEFORE the chunking.
const MAIN_HASH = "f9a61e1c8e35d420534cc283e4e43ff741d98f08006d793401520e7e14278fed";
const MAIN_META = [-13.579435729980469, { x: 3.4108239821788597, z: 4.769636871803855 }, { x: 6.559276888805499, z: 9.172378599622798 }, 10.44828099263028, 1.0721481126893986];
const SMALL_HASH = "02ceae270d56ae9c44e04c5c55d34f3920c871ec318e050e32c57c30eb8e0091";

/** sha256 over every attribute (sorted by name: color, normal, position, uv) and the index. */
function geometryHash(g: THREE.BufferGeometry): string {
  const h = createHash("sha256");
  for (const name of Object.keys(g.attributes).sort()) {
    const a = g.getAttribute(name) as THREE.BufferAttribute;
    h.update(`${name}:${a.itemSize}:${a.count}:`);
    h.update(Buffer.from(a.array.buffer, a.array.byteOffset, a.array.byteLength));
  }
  const index = g.getIndex();
  h.update(index ? Buffer.from(index.array.buffer, index.array.byteOffset, index.array.byteLength) : "no-index");
  return h.digest("hex");
}

const context = () => ({ scene: new THREE.Scene() }) as unknown as SceneContext;

async function mainIsland(pause?: () => Promise<void>) {
  const island = await createMainIsland(context(), pause);
  return {
    hash: geometryHash(island.shape.geometry),
    meta: [island.coreY, island.pond, island.waterfall, island.shape.Rof(1.234), island.shape.topAt(1.5, -2.5)],
  };
}

describe("main island generation (F1: chunked, byte-identical)", () => {
  it("without pauses, the geometry (positions, normals, colours, uvs, index) matches the pre-chunking hash", async () => {
    const run = await mainIsland();
    expect(run.hash).toBe(MAIN_HASH);
    expect(run.meta).toEqual(MAIN_META);
  });

  it("yielding to the main thread between chunks gives the same bytes, in many short steps", async () => {
    let pauses = 0;
    const run = await mainIsland(async () => {
      pauses++;
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });
    expect(run.hash).toBe(MAIN_HASH);
    expect(run.meta).toEqual(MAIN_META);
    // 57 660 vertices: the position and colour loops alone make ≥ 14 chunks of ≤ 8 190 vertices each.
    expect(pauses).toBeGreaterThanOrEqual(14);
  });

  it("makeIsland() (the synchronous drain used by the satellites and pillar rocks) is unchanged", () => {
    const top: TopFn = (x, z, rn, nz) => 0.3 * nz.noise(x * 0.5, z * 0.5) - rn;
    const small = makeIsland({ radius: 2.7, depth: 4.2, detail: 10, seed: 41, top, outline: 0.16 });
    expect(geometryHash(small.geometry)).toBe(SMALL_HASH);
  });
});
