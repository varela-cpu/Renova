import * as THREE from "three";
import {
  ATLAS_HEIGHT,
  ATLAS_WIDTH,
  DEFAULT_ATLAS_OPTIONS,
  createFiberNoiseCanvas,
  createRoughnessNoiseCanvas,
  paintRenovaAtlas,
  type AtlasOptions,
} from "./renova-atlas";
import {
  DEFAULT_DIMENSIONS,
  createBagGeometry,
  type BagDimensions,
} from "./renova-bag-geometry";

/**
 * Producto 3D RENOVA: bolsa de detergente en polvo de 5 kg.
 *
 * createRenovaDetergentBag() devuelve un THREE.Group que contiene solo la bolsa
 * (sin tapa/cierre) con UV propio.
 */

export type RenovaBagOptions = {
  dimensions?: Partial<BagDimensions>;
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

/** Conjunto de mapas que usa el material del envase. */
export type RenovaBagTextures = {
  /** color e impresion */
  map: THREE.Texture;
  /** micro relieve de fibras */
  bumpMap: THREE.Texture;
  /** variacion sutil del acabado mate */
  roughnessMap: THREE.Texture;
};

/**
 * Genera los mapas del empaque:
 *  - color: atlas impreso (Canvas 2D) en espacio sRGB
 *  - bump: tile de fibras para el relieve
 *  - roughness: tile claro para un acabado mate con variacion
 */
export function createRenovaBagTextures(
  options: Partial<AtlasOptions> = {},
  maxAnisotropy = 8,
): RenovaBagTextures {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_WIDTH;
  canvas.height = ATLAS_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo crear el contexto 2D para la textura RENOVA");
  }
  paintRenovaAtlas(context, { ...DEFAULT_ATLAS_OPTIONS, ...options });

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.generateMipmaps = true;
  map.anisotropy = Math.min(8, maxAnisotropy);
  map.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(createFiberNoiseCanvas(512));
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 4);
  bumpMap.minFilter = THREE.LinearMipmapLinearFilter;
  bumpMap.magFilter = THREE.LinearFilter;
  bumpMap.generateMipmaps = true;
  bumpMap.anisotropy = Math.min(8, maxAnisotropy);
  bumpMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(createRoughnessNoiseCanvas(512));
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(2, 3);
  roughnessMap.minFilter = THREE.LinearMipmapLinearFilter;
  roughnessMap.magFilter = THREE.LinearFilter;
  roughnessMap.generateMipmaps = true;
  roughnessMap.anisotropy = Math.min(8, maxAnisotropy);
  roughnessMap.needsUpdate = true;

  return { map, bumpMap, roughnessMap };
}

/** Genera solo el atlas de color (color e impresion del empaque). */
export function createRenovaBagTexture(
  options: Partial<AtlasOptions> = {},
  maxAnisotropy = 8,
): THREE.CanvasTexture {
  return createRenovaBagTextures(options, maxAnisotropy)
    .map as THREE.CanvasTexture;
}

/**
 * Material del envase: papel kraft laminado / compuesto flexible.
 * Superficie mate con un toque satinado, sin brillo plastico duro.
 */
export function createBagMaterial(
  textures: RenovaBagTextures,
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map: textures.map,
    bumpMap: textures.bumpMap,
    bumpScale: 0.035,
    roughnessMap: textures.roughnessMap,
    roughness: 0.92,
    metalness: 0,
    clearcoat: 0.05,
    clearcoatRoughness: 0.85,
    sheen: 0.22,
    sheenColor: new THREE.Color("#f3eddd"),
    sheenRoughness: 0.9,
    envMapIntensity: 0.45,
  });
}

/** Crea la bolsa RENOVA completa (envase) como un THREE.Group. */
export function createRenovaDetergentBag(
  options: RenovaBagOptions = {},
): RenovaBag {
  const dimensions: BagDimensions = {
    ...DEFAULT_DIMENSIONS,
    ...(options.dimensions ?? {}),
  };
  const atlasOptions: AtlasOptions = {
    ...DEFAULT_ATLAS_OPTIONS,
    ...(options.atlas ?? {}),
  };

  const textures = createRenovaBagTextures(
    atlasOptions,
    options.maxAnisotropy ?? 8,
  );
  const material = createBagMaterial(textures);
  const geometry = createBagGeometry(dimensions);

  const bag = new THREE.Mesh(geometry, material);
  bag.name = "renova-bolsa";
  bag.castShadow = true;
  bag.receiveShadow = true;

  const closure = new THREE.Group();
  closure.name = "renova-cierre";

  const group = new THREE.Group();
  group.name = "renova-producto";
  group.add(bag);

  return {
    group,
    bag,
    closure,
    texture: textures.map,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      textures.map.dispose();
      textures.bumpMap.dispose();
      textures.roughnessMap.dispose();
    },
  };
}
