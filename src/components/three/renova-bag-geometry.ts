import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  ATLAS_REGIONS,
  type RegionId,
  uvRectFromPixels,
} from "./renova-atlas";

/**
 * Geometria de la bolsa RENOVA.
 *
 * Malla real construida por barrido: en cada altura se genera una seccion
 * transversal de rectangulo redondeado, y se desplazan sus vertices hacia
 * fuera (abombado de las caras), con pliegues suaves en la base y los
 * laterales. Cada vertice recibe UV segun la region del atlas a la que
 * pertenece, de modo que ninguna cara comparte textura con otra.
 */

export type BagDimensions = {
  /** altura total de la bolsa */
  height: number;
  /** semiancho del cuerpo */
  halfWidth: number;
  /** semiprofundidad del cuerpo */
  halfDepth: number;
  /** radio de las esquinas redondeadas */
  cornerRadius: number;
};

export const DEFAULT_DIMENSIONS: BagDimensions = {
  height: 1.58,
  halfWidth: 0.52,
  halfDepth: 0.19,
  cornerRadius: 0.09,
};

/** Amplitud del abombado de las caras frontales. */
const FRONT_BULGE = 0.022;
const SIDE_BULGE = 0.018;

type ProfileKey = { t: number; w: number; d: number; r: number };

/**
 * Perfil vertical normalizado (t = y / height).
 *  - la base es un poco mas ancha y profunda
 *  - el cuerpo se mantiene estable
 *  - la zona superior se aplana para el sellado
 */
const PROFILE_KEYS: ProfileKey[] = [
  { t: 0.0, w: 1.14, d: 1.32, r: 0.92 },
  { t: 0.12, w: 1.08, d: 1.18, r: 0.96 },
  { t: 0.32, w: 1.02, d: 1.08, r: 1.0 },
  { t: 0.58, w: 0.998, d: 1.02, r: 0.98 },
  { t: 0.82, w: 0.98, d: 0.95, r: 0.9 },
  { t: 0.94, w: 0.95, d: 0.84, r: 0.82 },
  { t: 1.0, w: 0.94, d: 0.78, r: 0.78 },
];

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export type SectionProfile = {
  halfWidth: number;
  halfDepth: number;
  cornerRadius: number;
};

/** Perfil de la bolsa a una altura dada. */
export function profileAt(
  y: number,
  dims: BagDimensions = DEFAULT_DIMENSIONS,
): SectionProfile {
  const t = Math.min(1, Math.max(0, y / dims.height));
  let i = 0;
  while (i < PROFILE_KEYS.length - 2 && t > PROFILE_KEYS[i + 1].t) i++;
  const k0 = PROFILE_KEYS[i];
  const k1 = PROFILE_KEYS[i + 1];
  const raw = (t - k0.t) / (k1.t - k0.t);
  const f = raw * raw * (3 - 2 * raw);
  return {
    halfWidth: dims.halfWidth * lerp(k0.w, k1.w, f),
    halfDepth: dims.halfDepth * lerp(k0.d, k1.d, f),
    cornerRadius: dims.cornerRadius * lerp(k0.r, k1.r, f),
  };
}

/** Perfil vertical del abombado: nulo en la base y en el sellado. */
function bulgeProfile(t: number): number {
  return smoothstep(0.0, 0.14, t) * (1 - smoothstep(0.86, 1.0, t));
}

/** Coordenada z de la superficie frontal (con abombado) a una altura dada. */
export function frontSurfaceZ(
  y: number,
  dims: BagDimensions = DEFAULT_DIMENSIONS,
): number {
  const p = profileAt(y, dims);
  const bulge = FRONT_BULGE * bulgeProfile(y / dims.height);
  return p.halfDepth + bulge;
}

/** Pendiente dz/dy de la superficie frontal (rad). */
export function frontSurfaceTilt(
  y: number,
  dims: BagDimensions = DEFAULT_DIMENSIONS,
): number {
  const delta = 0.01;
  const z0 = frontSurfaceZ(y - delta, dims);
  const z1 = frontSurfaceZ(y + delta, dims);
  return Math.atan2(z1 - z0, 2 * delta);
}

const REGION_SEGMENTS: Record<RegionId, number> = {
  FRONT: 96,
  BACK: 96,
  RIGHT: 24,
  LEFT: 24,
  CORNER_FR: 18,
  CORNER_FL: 18,
  CORNER_BR: 18,
  CORNER_BL: 18,
  TOP: 1,
  BOTTOM: 1,
};

export const REGION_ORDER: RegionId[] = [
  "FRONT",
  "CORNER_FR",
  "RIGHT",
  "CORNER_BR",
  "BACK",
  "CORNER_BL",
  "LEFT",
  "CORNER_FL",
];

type SectionPoint = {
  x: number;
  z: number;
  nx: number;
  nz: number;
  region: RegionId;
  s: number;
  perimeter: number;
};

/**
 * Construye la seccion transversal de la bolsa.
 * El orden de las regiones coincide con el panorama del atlas, de modo que
 * la costura de UV coincide exactamente con el borde de la textura.
 */
export function buildSection(a: number, b: number, r: number): SectionPoint[] {
  const points: SectionPoint[] = [];
  const push = (
    x: number,
    z: number,
    nx: number,
    nz: number,
    region: RegionId,
    s: number,
  ) => {
    points.push({ x, z, nx, nz, region, s, perimeter: 0 });
  };
  const seg = (region: RegionId) => REGION_SEGMENTS[region];
  const half = Math.PI / 2;

  // 1. FRONTAL (de izquierda a derecha, z = +b)
  {
    const n = seg("FRONT");
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      push(-(a - r) + s * 2 * (a - r), b, 0, 1, "FRONT", s);
    }
  }
  // 2. ESQUINA FRONTAL DERECHA: de (a-r, b) a (a, b-r)
  {
    const n = seg("CORNER_FR");
    const cx = a - r;
    const cz = b - r;
    for (let i = 1; i <= n; i++) {
      const s = i / n;
      const theta = half * (1 - s);
      push(
        cx + Math.cos(theta) * r,
        cz + Math.sin(theta) * r,
        Math.cos(theta),
        Math.sin(theta),
        "CORNER_FR",
        s,
      );
    }
  }
  // 3. LATERAL DERECHO (de frente hacia atras)
  {
    const n = seg("RIGHT");
    for (let i = 1; i <= n; i++) {
      const s = i / n;
      push(a, b - r - s * 2 * (b - r), 1, 0, "RIGHT", s);
    }
  }
  // 4. ESQUINA TRASERA DERECHA: de (a, -(b-r)) a (a-r, -b)
  {
    const n = seg("CORNER_BR");
    const cx = a - r;
    const cz = -(b - r);
    for (let i = 1; i <= n; i++) {
      const s = i / n;
      const theta = half * s;
      push(
        cx + Math.cos(theta) * r,
        cz - Math.sin(theta) * r,
        Math.cos(theta),
        -Math.sin(theta),
        "CORNER_BR",
        s,
      );
    }
  }
  // 5. TRASERA (de derecha a izquierda, z = -b)
  {
    const n = seg("BACK");
    for (let i = 1; i <= n; i++) {
      const s = i / n;
      push(a - r - s * 2 * (a - r), -b, 0, -1, "BACK", s);
    }
  }
  // 6. ESQUINA TRASERA IZQUIERDA: de (-(a-r), -b) a (-a, -(b-r))
  {
    const n = seg("CORNER_BL");
    const cx = -(a - r);
    const cz = -(b - r);
    for (let i = 1; i <= n; i++) {
      const s = i / n;
      const theta = half * (1 - s);
      push(
        cx - Math.cos(theta) * r,
        cz - Math.sin(theta) * r,
        -Math.cos(theta),
        -Math.sin(theta),
        "CORNER_BL",
        s,
      );
    }
  }
  // 7. LATERAL IZQUIERDO (de atras hacia frente)
  {
    const n = seg("LEFT");
    for (let i = 1; i <= n; i++) {
      const s = i / n;
      push(-a, -(b - r) + s * 2 * (b - r), -1, 0, "LEFT", s);
    }
  }
  // 8. ESQUINA FRONTAL IZQUIERDA: de (-a, b-r) a (-(a-r), b) — cierra el perimetro
  {
    const n = seg("CORNER_FL");
    const cx = -(a - r);
    const cz = b - r;
    for (let i = 1; i <= n; i++) {
      const s = i / n;
      const theta = half * s;
      push(
        cx - Math.cos(theta) * r,
        cz + Math.sin(theta) * r,
        -Math.cos(theta),
        Math.sin(theta),
        "CORNER_FL",
        s,
      );
    }
  }

  // Parametro de perimetro normalizado (para los pliegues)
  let acc = 0;
  const lengths: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    acc += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
    lengths.push(acc);
  }
  for (let i = 0; i < points.length; i++) {
    points[i].perimeter = acc > 0 ? lengths[i] / acc : 0;
  }

  return points;
}

/** Abombado de las caras: 0 en los bordes, maximo en el centro. */
function faceBulge(region: RegionId | undefined, s: number, amount: number): number {
  if (!region) return 0;
  const straight =
    region === "FRONT" ||
    region === "BACK" ||
    region === "RIGHT" ||
    region === "LEFT";
  if (!straight) return 0;
  return amount * Math.sin(Math.PI * s);
}

/** Desplazamiento total (abombado + pliegues) de un vertice. */
function displacement(
  point: SectionPoint | undefined,
  y: number,
  dims: BagDimensions,
): number {
  if (!point || !point.region) return 0;
  const t = y / dims.height;
  const body = bulgeProfile(t);

  const amount =
    point.region === "FRONT" || point.region === "BACK" ? FRONT_BULGE : SIDE_BULGE;
  const bulge = faceBulge(point.region, point.s, amount) * body;

  // Pliegues arrugados tipo saco de cemento
  const foldWeight =
    point.region === "FRONT" || point.region === "BACK" ? 0.34 : 0.9;
  const foldEnvelope = Math.exp(-Math.pow((y - 0.14) / 0.16, 2));
  const fold =
    Math.sin(point.perimeter * Math.PI * 2 * 9 + y * 6.2) *
    0.012 *
    foldEnvelope *
    foldWeight *
    body +
    Math.sin(point.perimeter * Math.PI * 2 * 5 + y * 3.4) * 0.006 * foldEnvelope * body;

  // Pliegues verticales en esquinas
  const crease = point.region.startsWith("CORNER")
    ? -0.01 * Math.exp(-Math.pow((y - 0.16) / 0.18, 2)) * body
    : 0;

  // Pliegues del cierre inferior/superior tipo saco (costura plegada)
  const gusset = Math.sin((t > 0.92 ? (1 - t) * 12 : t * 8)) * 0.008 * (1 - Math.min(1, t * 0.6));
  const gussetTop = smoothstep(0.86, 0.94, t) * (1 - smoothstep(0.99, 1.0, t))
    ? Math.sin(point.perimeter * Math.PI * 2 * 11 + t * 40) * 0.005
    : 0;

  // Arrugas en el cuello
  const crimp =
    smoothstep(0.88, 0.93, t) * (1 - smoothstep(0.985, 1.0, t))
      ? (Math.sin((t - 0.88) * Math.PI * 2 * 16) + Math.sin((t - 0.9) * Math.PI * 2 * 9)) * 0.004
      : 0;

  return bulge + fold + crease + gusset + gussetTop + crimp;
}

/** Distribucion vertical de las filas: mas densidad en base y sellado. */
function buildRows(dims: BagDimensions): number[] {
  const rows: number[] = [];
  const push = (from: number, to: number, count: number) => {
    for (let i = 0; i < count; i++) rows.push(from + ((to - from) * i) / count);
  };
  push(0, 0.32, 28);
  push(0.32, 1.44, 42);
  push(1.44, dims.height, 28);
  rows.push(dims.height);
  return rows;
}

/** Construye la malla de la bolsa (cuerpo + tapas superior e inferior). */
export function createBagGeometry(
  dims: BagDimensions = DEFAULT_DIMENSIONS,
): THREE.BufferGeometry {
  const rows = buildRows(dims);
  const rowCount = rows.length;
  const colCount = REGION_ORDER.reduce(
    (acc, region) => acc + REGION_SEGMENTS[region] + 1,
    0,
  );

  const positions = new Float32Array(rowCount * colCount * 3);
  const uvs = new Float32Array(rowCount * colCount * 2);
  const indices: number[] = [];

  const uvCache = new Map<RegionId, ReturnType<typeof uvRectFromPixels>>();
  for (const region of REGION_ORDER) {
    uvCache.set(region, uvRectFromPixels(ATLAS_REGIONS[region]));
  }

  for (let r = 0; r < rowCount; r++) {
    const y = rows[r];
    const profile = profileAt(y, dims);
    const section = buildSection(
      profile.halfWidth,
      profile.halfDepth,
      profile.cornerRadius,
    );

    for (let c = 0; c < colCount; c++) {
      const point = section[c];
      if (!point || typeof point.region !== "string") {
        // Copiar el punto válido anterior si existe
        const prev = section[c - 1] ?? section[section.length - 1];
        if (!prev?.region) continue;
        const vi = r * colCount + c;
        positions[vi * 3] = prev.x;
        positions[vi * 3 + 1] = y;
        positions[vi * 3 + 2] = prev.z;
        const rect = uvCache.get(prev.region);
        if (!rect) continue;
        uvs[vi * 2] = rect.u0 + (rect.u1 - rect.u0) * (prev.s ?? 0);
        uvs[vi * 2 + 1] = rect.v0 + (rect.v1 - rect.v0) * (y / dims.height);
        continue;
      }
      const offset = displacement(point, y, dims);
      const vi = r * colCount + c;
      positions[vi * 3] = point.x + point.nx * offset;
      positions[vi * 3 + 1] = y;
      positions[vi * 3 + 2] = point.z + point.nz * offset;

      const rect = uvCache.get(point.region);
      if (!rect) continue;
      uvs[vi * 2] = rect.u0 + (rect.u1 - rect.u0) * (point.s ?? 0);
      uvs[vi * 2 + 1] = rect.v0 + (rect.v1 - rect.v0) * (y / dims.height);
    }
  }

  for (let r = 0; r < rowCount - 1; r++) {
    for (let c = 0; c < colCount - 1; c++) {
      const a = r * colCount + c;
      const b = r * colCount + c + 1;
      const d = (r + 1) * colCount + c + 1;
      const e = (r + 1) * colCount + c;
      indices.push(a, b, d, a, d, e);
    }
  }

  const body = new THREE.BufferGeometry();
  body.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  body.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  body.setIndex(indices);
  body.computeVertexNormals();

  // Suaviza la costura: la primera y la ultima columna comparten posicion
  const normals = body.getAttribute("normal") as THREE.BufferAttribute;
  for (let r = 0; r < rowCount; r++) {
    const first = r * colCount;
    const last = r * colCount + colCount - 1;
    const nx = (normals.getX(first) + normals.getX(last)) / 2;
    const ny = (normals.getY(first) + normals.getY(last)) / 2;
    const nz = (normals.getZ(first) + normals.getZ(last)) / 2;
    const len = Math.hypot(nx, ny, nz) || 1;
    normals.setXYZ(first, nx / len, ny / len, nz / len);
    normals.setXYZ(last, nx / len, ny / len, nz / len);
  }
  normals.needsUpdate = true;

  const caps = [
    createCapGeometry(dims, "BOTTOM"),
    createCapGeometry(dims, "TOP"),
  ];
  const merged = mergeGeometries([body, ...caps], false);
  const result = merged ?? body;
  result.computeBoundingBox();
  result.computeBoundingSphere();
  return result;
}

/** Tapa (superior o inferior) con mapeo UV propio. */
function createCapGeometry(
  dims: BagDimensions,
  which: "TOP" | "BOTTOM",
): THREE.BufferGeometry {
  const y = which === "BOTTOM" ? 0 : dims.height;
  const profile = profileAt(y, dims);
  const section = buildSection(
    profile.halfWidth,
    profile.halfDepth,
    profile.cornerRadius,
  );
  const rect = uvRectFromPixels(ATLAS_REGIONS[which]);
  const rings = 8;
  const count = section.length;
  const dish = which === "BOTTOM" ? 0.012 : 0.006;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Centro
  positions.push(0, y + dish, 0);
  uvs.push((rect.u0 + rect.u1) / 2, (rect.v0 + rect.v1) / 2);

  for (let ring = 1; ring <= rings; ring++) {
    const t = ring / rings;
    for (let i = 0; i < count; i++) {
      const p = section[i];
      const x = p.x * t;
      const z = p.z * t;
      positions.push(x, y + dish * (1 - t * t), z);
      uvs.push(
        rect.u0 + (rect.u1 - rect.u0) * (0.5 + (x / (2 * profile.halfWidth)) * 0.5),
        rect.v0 + (rect.v1 - rect.v0) * (0.5 - (z / (2 * profile.halfDepth)) * 0.5),
      );
    }
  }

  for (let i = 0; i < count; i++) {
    indices.push(0, 1 + i, 1 + ((i + 1) % count));
  }
  for (let ring = 0; ring < rings - 1; ring++) {
    const base = 1 + ring * count;
    const next = 1 + (ring + 1) * count;
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      if (which === "BOTTOM") {
        indices.push(base + i, next + i, next + j, base + i, next + j, base + j);
      } else {
        indices.push(base + i, next + j, next + i, base + i, base + j, next + j);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
