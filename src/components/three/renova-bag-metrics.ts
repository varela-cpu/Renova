/**
 * Metricas compartidas de la bolsa RENOVA.
 *
 * Este modulo es la fuente de verdad de las proporciones del envase. Tanto
 * la geometria (malla barrida) como el atlas (texturas) lo consumen, de forma
 * que cada region UV conserva la比例 real de la cara a la que se aplica y
 * el diseno nunca aparece estirado.
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
  cornerRadius: 0.105,
};

export type ProfileKey = { t: number; w: number; d: number; r: number };

/**
 * Perfil vertical normalizado (t = y / height).
 *  - la base es mas ancha y profunda (el envase se apoya y se abre)
 *  - el cuerpo se mantiene estable con abombado central
 *  - la zona superior se aplana y se recoge para el sellado
 */
export const PROFILE_KEYS: ProfileKey[] = [
  { t: 0.0, w: 1.13, d: 1.3, r: 0.9 },
  { t: 0.1, w: 1.09, d: 1.15, r: 0.95 },
  { t: 0.3, w: 1.03, d: 1.06, r: 1.0 },
  { t: 0.56, w: 0.998, d: 1.02, r: 0.99 },
  { t: 0.8, w: 0.985, d: 0.96, r: 0.92 },
  { t: 0.92, w: 0.965, d: 0.86, r: 0.84 },
  { t: 1.0, w: 0.95, d: 0.78, r: 0.78 },
];

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number): number {
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

/** Altura normalizada usada como referencia para el reparto de texturas. */
export const REFERENCE_T = 0.56;

const REFERENCE = profileAt(DEFAULT_DIMENSIONS.height * REFERENCE_T);

export type BagMetrics = {
  /** altura del cuerpo (sin cierre) */
  bodyHeight: number;
  /** ancho de la cara frontal (plano) */
  frontWidth: number;
  /** ancho de la cara trasera (plano) */
  backWidth: number;
  /** ancho de un lateral (plano) */
  sideWidth: number;
  /** longitud del arco de una esquina */
  cornerWidth: number;
  /** perimetro completo del cuerpo */
  perimeter: number;
  /** medidas de la cara superior */
  topWidth: number;
  topDepth: number;
};

/**
 * Medidas reales de cada cara. La textura se dimensiona con estos valores,
 * de modo que cada region UV mantiene la relacion de aspecto de la cara.
 */
export const BAG_METRICS: BagMetrics = (() => {
  const a = REFERENCE.halfWidth;
  const b = REFERENCE.halfDepth;
  const r = REFERENCE.cornerRadius;
  const frontWidth = 2 * (a - r);
  const sideWidth = 2 * (b - r);
  const cornerWidth = r * (Math.PI / 2);
  const top = profileAt(DEFAULT_DIMENSIONS.height);
  return {
    bodyHeight: DEFAULT_DIMENSIONS.height,
    frontWidth,
    backWidth: frontWidth,
    sideWidth,
    cornerWidth,
    perimeter:
      2 * frontWidth + 2 * sideWidth + 4 * cornerWidth,
    topWidth: 2 * top.halfWidth,
    topDepth: 2 * top.halfDepth,
  };
})();
