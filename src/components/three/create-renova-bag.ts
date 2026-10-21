import * as THREE from "three";
import {
  ATLAS_HEIGHT,
  ATLAS_WIDTH,
  DEFAULT_ATLAS_OPTIONS,
  paintRenovaAtlas,
  type AtlasOptions,
} from "./renova-atlas";
import {
  DEFAULT_DIMENSIONS,
  createBagGeometry,
  type BagDimensions,
} from "./renova-bag-geometry";
import {
  DEFAULT_CLOSURE,
  createClosure,
  type ClosureOptions,
} from "./renova-cap";

/**
 * Producto 3D RENOVA: bolsa de detergente en polvo de 5 kg.
 *
 * createRenovaDetergentBag() devuelve un THREE.Group que contiene la bolsa
 * (malla con UV propio) y el sistema de cierre (piezas independientes).
 */

export type RenovaBagOptions = {
  dimensions?: Partial<BagDimensions>;
  closure?: Partial<ClosureOptions>;
  atlas?: Partial<AtlasOptions>;
  /** textura ya generada (opcional) */
  texture?: THREE.Texture;
  /** resolucion maxima de anisotropia del renderer */
  maxAnisotropy?: number;
};

export type RenovaBag = {
  group: THREE.Group;
  bag: THREE.Mesh;
  closure: THREE.Group;
  texture: THREE.Texture | null;
  dispose: () => void;
};

/** Genera el atlas de texturas de la bolsa con Canvas 2D. */
export function createRenovaBagTexture(
  options: Partial<AtlasOptions> = {},
  maxAnisotropy = 8,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_WIDTH;
  canvas.height = ATLAS_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo crear el contexto 2D para la textura RENOVA");
  }
  paintRenovaAtlas(context, { ...DEFAULT_ATLAS_OPTIONS, ...options });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = Math.min(16, maxAnisotropy);
  texture.needsUpdate = true;
  return texture;
}

/** Material de envase: plastico flexible satinado, no metalico. */
export function createBagMaterial(texture: THREE.Texture): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map: texture,
    roughness: 0.44,
    metalness: 0,
    clearcoat: 0.28,
    clearcoatRoughness: 0.55,
    sheen: 0.25,
    sheenColor: new THREE.Color("#dcecdd"),
    envMapIntensity: 0.8,
  });
}

/** Crea la bolsa RENOVA completa (envase + cierre) como un THREE.Group. */
export function createRenovaDetergentBag(
  options: RenovaBagOptions = {},
): RenovaBag {
  const dimensions: BagDimensions = {
    ...DEFAULT_DIMENSIONS,
    ...(options.dimensions ?? {}),
  };
  const closureOptions: ClosureOptions = {
    ...DEFAULT_CLOSURE,
    ...(options.closure ?? {}),
  };
  const atlasOptions: AtlasOptions = {
    ...DEFAULT_ATLAS_OPTIONS,
    ...(options.atlas ?? {}),
  };

  const texture =
    options.texture ??
    createRenovaBagTexture(atlasOptions, options.maxAnisotropy ?? 8);
  const material = createBagMaterial(texture);
  const geometry = createBagGeometry(dimensions);

  const bag = new THREE.Mesh(geometry, material);
  bag.name = "renova-bolsa";
  bag.castShadow = true;
  bag.receiveShadow = true;

  const closure = createClosure(closureOptions, dimensions);
  closure.name = "renova-cierre";

  const group = new THREE.Group();
  group.name = "renova-producto";
  group.add(bag, closure);

  return {
    group,
    bag,
    closure,
    texture: options.texture ? null : texture,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      if (!options.texture) texture.dispose();
      closure.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          const mat = mesh.material as THREE.Material | THREE.Material[];
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
    },
  };
}
