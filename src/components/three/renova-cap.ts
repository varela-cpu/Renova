import * as THREE from "three";
import {
  DEFAULT_DIMENSIONS,
  frontSurfaceTilt,
  frontSurfaceZ,
  type BagDimensions,
} from "./renova-bag-geometry";

/**
 * Sistema de cierre de la bolsa RENOVA.
 *
 * Piezas independientes de la textura del envase:
 *  - marco rectangular con abertura (asa integrada), construido con
 *    ExtrudeGeometry a partir de un contorno con hueco real
 *  - alojamiento circular del tapon, con capas concentricas
 *  - tapon cilindrico con estrías verticales, superficie superior
 *    ligeramente convexa y detalle central
 */

export const CAP_COLORS = {
  base: "#145B45",
  frame: "#1a6a51",
  seat: "#17654c",
  cap: "#145B45",
  rib: "#1b6f55",
  detail: "#0f4a38",
} as const;

export type ClosureOptions = {
  /** altura (en unidades de mundo) donde se fija el cierre */
  height: number;
  /** ancho del marco del asa */
  baseWidth: number;
  /** alto del marco del asa */
  baseHeight: number;
  /** radio del tapon */
  capRadius: number;
  /** numero de estrias del tapon */
  ribs: number;
};

export const DEFAULT_CLOSURE: ClosureOptions = {
  height: 1.5,
  baseWidth: 0.36,
  baseHeight: 0.2,
  capRadius: 0.048,
  ribs: 28,
};

function satinPlastic(color: string, roughness = 0.42) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.45,
    sheen: 0.15,
    sheenColor: new THREE.Color("#8fc7a8"),
  });
}

/** Contorno de rectangulo redondeado (sentido horario) sobre un Path/Shape. */
function roundedRect(
  target: THREE.Shape | THREE.Path,
  width: number,
  height: number,
  radius: number,
  centerY: number,
): void {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, Math.min(w, h));
  target.moveTo(-w + r, centerY - h);
  target.lineTo(w - r, centerY - h);
  target.absarc(w - r, centerY - h + r, r, -Math.PI / 2, 0, false);
  target.lineTo(w, centerY + h - r);
  target.absarc(w - r, centerY + h - r, r, 0, Math.PI / 2, false);
  target.lineTo(-w + r, centerY + h);
  target.absarc(-w + r, centerY + h - r, r, Math.PI / 2, Math.PI, false);
  target.lineTo(-w, centerY - h + r);
  target.absarc(-w + r, centerY - h + r, r, Math.PI, Math.PI * 1.5, false);
}

/** Contorno de ranura alargada (manga) para el asa. */
function slotPath(width: number, height: number, centerY: number): THREE.Path {
  const path = new THREE.Path();
  const w = width / 2;
  const h = height / 2;
  const r = h;
  // recorrido antihorario
  path.moveTo(-w + r, centerY - h);
  path.absarc(w - r, centerY - h, r, -Math.PI / 2, Math.PI / 2, true);
  path.absarc(-w + r, centerY + h, r, Math.PI / 2, Math.PI * 1.5, true);
  path.closePath();
  return path;
}

/** Marco del asa: pieza rectangular con hueco interior real. */
function createHandleFrame(options: ClosureOptions): THREE.Mesh {
  const shape = new THREE.Shape();
  roundedRect(shape, options.baseWidth, options.baseHeight, 0.028, 0);

  const slotHeight = 0.05;
  const slotWidth = options.baseWidth * 0.58;
  shape.holes.push(slotPath(slotWidth, slotHeight, options.baseHeight * 0.24));

  const depth = 0.02;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: 16,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, satinPlastic(CAP_COLORS.frame, 0.45));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Alojamiento circular del tapon: capas concentricas. */
function createCapSeat(radius: number): THREE.Group {
  const group = new THREE.Group();
  const layers = [
    { r: radius * 1.22, h: 0.008, z: 0.012, color: CAP_COLORS.frame },
    { r: radius * 1.06, h: 0.010, z: 0.020, color: CAP_COLORS.seat },
    { r: radius * 0.96, h: 0.010, z: 0.030, color: CAP_COLORS.base },
  ];

  for (const layer of layers) {
    const geometry = new THREE.CylinderGeometry(
      layer.r,
      layer.r * 1.02,
      layer.h,
      48,
      1,
      false,
    );
    geometry.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, satinPlastic(layer.color, 0.44));
    mesh.position.z = layer.z + layer.h / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}

/** Tapon cilindrico estriado con superficie superior convexa. */
function createScrewCap(radius: number, ribs: number): THREE.Group {
  const group = new THREE.Group();

  const profile: THREE.Vector2[] = [
    new THREE.Vector2(radius * 0.82, 0.0),
    new THREE.Vector2(radius * 0.99, 0.0),
    new THREE.Vector2(radius, 0.004),
    new THREE.Vector2(radius, radius * 0.82),
    new THREE.Vector2(radius * 0.93, radius * 0.94),
    new THREE.Vector2(radius * 0.78, radius * 1.05),
    new THREE.Vector2(radius * 0.52, radius * 1.13),
    new THREE.Vector2(radius * 0.24, radius * 1.18),
    new THREE.Vector2(0.0, radius * 1.2),
  ];

  const geometry = new THREE.LatheGeometry(profile, 96);
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const ribAmplitude = 0.035;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const radial = Math.hypot(x, z);
    if (radial < 1e-5) continue;
    // Solo la pared vertical lleva estrías
    if (y > radius * 0.08 && y < radius * 0.86) {
      const theta = Math.atan2(z, x);
      const scale = 1 + ribAmplitude * Math.cos(theta * ribs);
      position.setXYZ(i, x * scale, y, z * scale);
    }
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();

  const body = new THREE.Mesh(geometry, satinPlastic(CAP_COLORS.cap, 0.4));
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Detalle circular en el centro de la superficie superior
  const detailGeometry = new THREE.CylinderGeometry(
    radius * 0.2,
    radius * 0.22,
    radius * 0.08,
    32,
  );
  const detail = new THREE.Mesh(
    detailGeometry,
    satinPlastic(CAP_COLORS.detail, 0.35),
  );
  detail.position.y = radius * 1.2;
  detail.castShadow = true;
  group.add(detail);

  // Anillo fino bajo el borde (detalle de rosca)
  const ringGeometry = new THREE.TorusGeometry(radius * 0.99, radius * 0.055, 10, 64);
  ringGeometry.rotateX(Math.PI / 2);
  const ring = new THREE.Mesh(ringGeometry, satinPlastic(CAP_COLORS.rib, 0.38));
  ring.position.y = radius * 0.22;
  ring.castShadow = true;
  group.add(ring);

  return group;
}

export function createClosure(
  options: ClosureOptions = DEFAULT_CLOSURE,
  dims: BagDimensions = DEFAULT_DIMENSIONS,
): THREE.Group {
  const group = new THREE.Group();
  return group;
}
