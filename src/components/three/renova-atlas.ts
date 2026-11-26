/**
 * Atlas UV de la bolsa RENOVA.
 *
 * Un unico canvas (pintado en runtime con Canvas 2D) que cubre TODAS las
 * caras del envase. El layout se deriva de las medidas reales de la bolsa
 * (`BAG_METRICS`), de forma que cada region mantiene la relacion de aspecto de
 * la cara que textura: nada queda estirado ni duplicado.
 *
 * Organizacion del atlas (3072 x 2048 px):
 *
 *   y=0                        y=1580
 *   +--------------------------+   +-----------+-----------+
 *   | FRONT|CFR|RIGHT|CBR|BACK |   |    TOP    |  BOTTOM   |
 *   | CBL|LEFT|CFL              |   |           |           |
 *   +--------------------------+   +-----------+-----------+
 *   x=0                     2672
 *
 * El cuerpo se pinta como un "panorama" continuo (FRONT -> esquina -> lateral
 * -> ... -> CFL -> vuelta a FRONT) para que los motivos vegetales crucen de una
 * cara a la siguiente sin cortes.
 *
 * Sistema de coordenadas del canvas: origen arriba-izquierda, y hacia abajo.
 * Sistema UV de Three.js: origen abajo-izquierda, v hacia arriba.
 */

import { BAG_METRICS } from "./renova-bag-metrics";

/** Paleta corporativa RENOVA. */
export const PALETTE = {
  /** papel kraft blanqueado / marfil calido */
  paper: "#E8E0CC",
  /** verde oscuro principal (marca) */
  forest: "#174F3D",
  /** verde medio */
  green: "#34745A",
  /** verde salvia (motivos y detalles) */
  sage: "#91A783",
  /** coral (acentos minimos) */
  coral: "#E87560",
  /** tinta para textos secundarios */
  ink: "#2C463C",
} as const;

export const FONT_DISPLAY =
  '"Avenir Next", "Futura", "Century Gothic", "Montserrat", "Segoe UI", sans-serif';
export const FONT_SANS =
  '"Avenir Next", "Segoe UI", "Trebuchet MS", system-ui, -apple-system, sans-serif';

/** Resolucion de la textura (px por unidad de mundo). */
export const PIXELS_PER_UNIT = 1000;

export const ATLAS_WIDTH = 3072;
export const ATLAS_HEIGHT = 2048;

export type RegionId =
  | "FRONT"
  | "BACK"
  | "RIGHT"
  | "LEFT"
  | "CORNER_FR"
  | "CORNER_FL"
  | "CORNER_BR"
  | "CORNER_BL"
  | "TOP"
  | "BOTTOM";

export type PixelRect = { x: number; y: number; w: number; h: number };

/* ------------------------------------------------------------------ */
/* Medidas de las regiones (derivadas de la geometria real)           */
/* ------------------------------------------------------------------ */

const FRONT_W = Math.round(BAG_METRICS.frontWidth * PIXELS_PER_UNIT);
const SIDE_W = Math.round(BAG_METRICS.sideWidth * PIXELS_PER_UNIT);
const CORNER_W = Math.round(BAG_METRICS.cornerWidth * PIXELS_PER_UNIT);
const BODY_H = Math.round(BAG_METRICS.bodyHeight * PIXELS_PER_UNIT);
const TOP_W = Math.round(BAG_METRICS.topWidth * PIXELS_PER_UNIT);
const TOP_H = Math.round(BAG_METRICS.topDepth * PIXELS_PER_UNIT);

/** Ancho del panorama continuo (perimetro del cuerpo). */
export const STRIP_W =
  FRONT_W * 2 + SIDE_W * 2 + CORNER_W * 4;

export const ATLAS_REGIONS: Record<RegionId, PixelRect> = (() => {
  const regions = {} as Record<RegionId, PixelRect>;
  let x = 0;
  const add = (id: RegionId, w: number) => {
    regions[id] = { x, y: 0, w, h: BODY_H };
    x += w;
  };
  // El orden del panorama coincide con el recorrido de la geometria.
  add("FRONT", FRONT_W);
  add("CORNER_FR", CORNER_W);
  add("RIGHT", SIDE_W);
  add("CORNER_BR", CORNER_W);
  add("BACK", FRONT_W);
  add("CORNER_BL", CORNER_W);
  add("LEFT", SIDE_W);
  add("CORNER_FL", CORNER_W);
  regions.TOP = { x: 0, y: BODY_H, w: TOP_W, h: TOP_H };
  regions.BOTTOM = { x: TOP_W + 16, y: BODY_H, w: TOP_W, h: TOP_H };
  return regions;
})();

export type UvRect = { u0: number; u1: number; v0: number; v1: number };

/** Convierte un rectangulo de pixels del canvas a un rectangulo UV. */
export function uvRectFromPixels(rect: PixelRect): UvRect {
  const W = ATLAS_WIDTH;
  const H = ATLAS_HEIGHT;
  return {
    u0: rect.x / W,
    u1: (rect.x + rect.w) / W,
    v0: 1 - (rect.y + rect.h) / H,
    v1: 1 - rect.y / H,
  };
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

/** PRNG determinista: el arte es siempre el mismo en cada carga. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = makeRng(0x5245_4e4f);

function setFont(
  ctx: CanvasRenderingContext2D,
  size: number,
  weight: number | string,
  family: string,
): void {
  ctx.font = `${weight} ${size}px ${family}`;
}

/**
 * Texto centrado con interletraje manual (funciona en todos los navegadores).
 * `size` y `weight` controlan el cuerpo; el tracking se aplica por letra.
 */
function trackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  tracking: number,
): void {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total =
    widths.reduce((acc, w) => acc + w, 0) +
    tracking * Math.max(0, chars.length - 1);
  let x = centerX - total / 2;
  const previousAlign = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + tracking;
  });
  ctx.textAlign = previousAlign;
}

/** Texto centrado en una sola linea, sin interletraje extra. */
function plainText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
): void {
  ctx.textAlign = "center";
  ctx.fillText(text, centerX, y);
  ctx.textAlign = "left";
}

/* ------------------------------------------------------------------ */
/* Capa 1: material base (papel kraft blanqueado)                      */
/* ------------------------------------------------------------------ */

/** Tile de ruido fino reutilizable (grano + fibras). */
function createNoiseTile(size: number): HTMLCanvasElement {
  const tile = document.createElement("canvas");
  tile.width = size;
  tile.height = size;
  const ctx = tile.getContext("2d");
  if (!ctx) return tile;

  const image = ctx.createImageData(size, size);
  const data = image.data;
  const local = makeRng(0x9e37_79b9);
  for (let i = 0; i < size * size; i++) {
    const value = 128 + (local() - 0.5) * 26;
    data[i * 4] = value;
    data[i * 4 + 1] = value;
    data[i * 4 + 2] = value;
    data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return tile;
}

/** Variacion tonal muy suave: manchas de luz (no suciedad). */
function paintTonalVariation(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  count: number,
): void {
  for (let i = 0; i < count; i++) {
    const cx = x + rng() * w;
    const cy = y + rng() * h;
    const r = 240 + rng() * 620;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const warm = rng() > 0.45;
    gradient.addColorStop(
      0,
      warm ? "rgba(206,194,165,0.13)" : "rgba(252,248,236,0.16)",
    );
    gradient.addColorStop(1, "rgba(232,224,204,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
}

/** Fibras de papel: trazos cortos, dispersos y de muy baja opacidad. */
function paintFibers(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  count: number,
): void {
  ctx.lineCap = "round";
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle =
      pass === 0 ? "rgba(120,106,80,0.055)" : "rgba(255,252,242,0.075)";
    ctx.lineWidth = 1;
    const total = Math.round(count / 2);
    for (let i = 0; i < total; i++) {
      const px = x + rng() * w;
      const py = y + rng() * h;
      const len = 2 + rng() * 10;
      const angle =
        rng() < 0.62 ? (rng() - 0.5) * 0.7 : Math.PI / 2 + (rng() - 0.5) * 0.8;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(angle) * len, py + Math.sin(angle) * len);
      ctx.stroke();
    }
  }
}

/** Grano discreto sobre toda la superficie. */
function paintGrain(
  ctx: CanvasRenderingContext2D,
  tile: HTMLCanvasElement,
  alpha: number,
): void {
  const pattern = ctx.createPattern(tile, "repeat");
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, ATLAS_WIDTH, ATLAS_HEIGHT);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Motivos botanicos                                                    */
/* ------------------------------------------------------------------ */

/** Hoja organica con bordes ligeramente irregulares. */
function drawLeaf(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  length: number,
  width: number,
  angle: number,
  color: string,
  alpha = 1,
  jitter = 0.08,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const j = () => (rng() - 0.5) * jitter * length;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(
    length * 0.24,
    -width * 0.52 + j(),
    length * 0.74,
    -width * 0.44 + j(),
    length,
    j() * 0.5,
  );
  ctx.bezierCurveTo(
    length * 0.74,
    width * 0.44 + j(),
    length * 0.24,
    width * 0.52 + j(),
    0,
    0,
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/** Ramita: tallo curvo con hojas alternas. */
function drawSprig(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  length: number,
  angle: number,
  color: string,
  leafColor: string,
  leaves = 6,
  alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, length * 0.022);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(length * 0.5, -length * 0.12, length, -length * 0.02);
  ctx.stroke();
  for (let i = 0; i < leaves; i++) {
    const t = (i + 1) / (leaves + 1);
    const lx = length * t;
    const ly = -length * 0.12 * Math.sin(Math.PI * t) - length * 0.02 * t;
    const size = length * (0.3 - 0.08 * t);
    drawLeaf(ctx, lx, ly, size, size * 0.5, -0.72, leafColor, 1, 0.1);
    drawLeaf(ctx, lx, ly, size, size * 0.5, 0.72, leafColor, 1, 0.1);
  }
  ctx.restore();
}

/** Flor estilizada de petalos (centro coral). */
function drawBloom(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  petalColor: string,
  centerColor: string,
  alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + 0.2;
    drawLeaf(
      ctx,
      cx + Math.cos(angle) * radius * 0.42,
      cy + Math.sin(angle) * radius * 0.42,
      radius * 0.72,
      radius * 0.36,
      angle,
      petalColor,
      1,
      0.07,
    );
  }
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.17, 0, Math.PI * 2);
  ctx.fillStyle = centerColor;
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Capa 2: diseno impreso                                              */
/* ------------------------------------------------------------------ */

/**
 * Composicion frontal: una sola columna vertical sobre el fondo de papel,
 * sin recuadros, sin bandas y sin contornos. El marfil continua uniforme
 * detras de todos los textos.
 */
function drawFrontComposition(
  ctx: CanvasRenderingContext2D,
  options: AtlasOptions,
): void {
  const { w, h } = ATLAS_REGIONS.FRONT;
  const cx = w / 2;
  ctx.textBaseline = "middle";

  // --- Marca -------------------------------------------------------
  ctx.fillStyle = PALETTE.forest;
  setFont(ctx, Math.round(h * 0.0835), 800, FONT_DISPLAY);
  trackedText(ctx, "RENOVA", cx, h * 0.245, h * 0.0055);

  // --- Eslogan -----------------------------------------------------
  ctx.fillStyle = PALETTE.green;
  setFont(ctx, Math.round(h * 0.0245), 500, FONT_SANS);
  trackedText(ctx, "Limpieza que da mas vida", cx, h * 0.325, h * 0.0014);

  // --- Categoria ---------------------------------------------------
  ctx.fillStyle = PALETTE.forest;
  setFont(ctx, Math.round(h * 0.0262), 700, FONT_SANS);
  trackedText(ctx, "DETERGENTE EN POLVO", cx, h * 0.4, h * 0.0038);

  // --- Fragancia ---------------------------------------------------
  ctx.fillStyle = PALETTE.green;
  setFont(ctx, Math.round(h * 0.0175), 600, FONT_SANS);
  trackedText(ctx, "FRAGANCIA FLORAL", cx, h * 0.455, h * 0.005);

  // --- Peso (integrado, sin etiqueta ni ovalo) ----------------------
  const weightSize = Math.round(h * 0.042);
  const unitSize = Math.round(h * 0.021);
  setFont(ctx, weightSize, 800, FONT_DISPLAY);
  const weightText = options.weightLabel.replace(/\s*kg\s*$/i, "");
  const weightWidth = ctx.measureText(weightText).width;
  setFont(ctx, unitSize, 600, FONT_SANS);
  const unitWidth = ctx.measureText("kg").width;
  const gap = weightSize * 0.14;
  const total = weightWidth + gap + unitWidth;
  let x = cx - total / 2;
  ctx.fillStyle = PALETTE.forest;
  setFont(ctx, weightSize, 800, FONT_DISPLAY);
  ctx.textAlign = "left";
  ctx.fillText(weightText, x, h * 0.528);
  x += weightWidth + gap;
  ctx.fillStyle = PALETTE.green;
  setFont(ctx, unitSize, 600, FONT_SANS);
  ctx.fillText("kg", x, h * 0.532);
  ctx.textAlign = "left";

  // --- Codigo interno (discreto, al pie) ----------------------------
  ctx.fillStyle = "rgba(44,70,60,0.55)";
  setFont(ctx, Math.round(h * 0.0105), 500, FONT_SANS);
  trackedText(ctx, options.productCode, cx, h * 0.965, h * 0.0018);
}

/** Motivos botanicos de la cara frontal (esquinas y borde inferior). */
function drawFrontBotanicals(ctx: CanvasRenderingContext2D): void {
  const { w, h } = ATLAS_REGIONS.FRONT;

  // --- Esquina superior izquierda (cruza hacia la esquina FL) ------
  drawSprig(ctx, 8, 34, 300, 0.46, PALETTE.sage, PALETTE.sage, 6, 0.92);
  drawSprig(ctx, -18, 168, 250, 0.2, PALETTE.green, PALETTE.green, 5, 0.7);
  drawLeaf(ctx, 96, 116, 132, 58, 0.5, PALETTE.sage, 0.85);
  drawLeaf(ctx, 214, 46, 108, 46, 0.28, PALETTE.green, 0.6);
  drawBloom(ctx, 66, 250, 34, PALETTE.sage, PALETTE.coral, 0.8);

  // --- Esquina superior derecha (cruza hacia la esquina FR) --------
  drawSprig(ctx, w - 8, 34, 300, Math.PI - 0.46, PALETTE.sage, PALETTE.sage, 6, 0.92);
  drawSprig(ctx, w + 18, 168, 250, Math.PI - 0.2, PALETTE.green, PALETTE.green, 5, 0.7);
  drawLeaf(ctx, w - 96, 116, 132, 58, Math.PI - 0.5, PALETTE.sage, 0.85);
  drawLeaf(ctx, w - 214, 46, 108, 46, Math.PI - 0.28, PALETTE.green, 0.6);
  drawBloom(ctx, w - 66, 250, 34, PALETTE.sage, PALETTE.coral, 0.8);

  // --- Bordes inferiores -------------------------------------------
  drawSprig(ctx, 26, h + 24, 330, -0.78, PALETTE.green, PALETTE.green, 6, 0.85);
  drawSprig(ctx, w - 26, h + 24, 330, -Math.PI + 0.78, PALETTE.green, PALETTE.green, 6, 0.85);
  drawLeaf(ctx, 176, h - 26, 150, 62, -1.95, PALETTE.sage, 0.85);
  drawLeaf(ctx, w - 176, h - 26, 150, 62, -1.19, PALETTE.sage, 0.85);
  drawBloom(ctx, 74, h - 96, 30, PALETTE.sage, PALETTE.coral, 0.7);
  drawBloom(ctx, w - 74, h - 96, 30, PALETTE.sage, PALETTE.coral, 0.7);
}

/** Cara trasera: composicion propia (uso, caracteristicas, precauciones). */
function drawBackComposition(
  ctx: CanvasRenderingContext2D,
  options: AtlasOptions,
): void {
  const { w, h } = ATLAS_REGIONS.BACK;
  const cx = w / 2;
  ctx.textBaseline = "middle";

  ctx.fillStyle = PALETTE.forest;
  setFont(ctx, Math.round(h * 0.0295), 800, FONT_DISPLAY);
  trackedText(ctx, "RENOVA", cx, h * 0.082, h * 0.004);

  ctx.fillStyle = PALETTE.green;
  setFont(ctx, Math.round(h * 0.0155), 500, FONT_SANS);
  trackedText(ctx, "Limpieza que da mas vida", cx, h * 0.112, h * 0.0012);

  const heading = (text: string, at: number) => {
    ctx.fillStyle = PALETTE.forest;
    setFont(ctx, Math.round(h * 0.0132), 700, FONT_SANS);
    trackedText(ctx, text, cx, h * at, h * 0.0022);
  };
  const body = (rows: string[], from: number) => {
    ctx.fillStyle = PALETTE.ink;
    setFont(ctx, Math.round(h * 0.0108), 400, FONT_SANS);
    rows.forEach((row, i) => {
      plainText(ctx, row, cx, h * (from + i * 0.0215));
    });
  };

  heading("INSTRUCCIONES DE USO", 0.185);
  body(
    [
      "Lavado a mano: disuelva la dosis en agua,",
      "lave segun el cuidado de la prenda y",
      "enjuague bien.",
      "Lavadora: agregue la dosis en el compartimiento",
      "recomendado por el fabricante.",
    ],
    0.222,
  );

  heading("CARACTERISTICAS", 0.372);
  body(
    [
      "Detergente en polvo de uso domestico.",
      "Fragancia floral. Envase de 5 kg.",
    ],
    0.409,
  );

  heading("PRECAUCIONES", 0.495);
  body(
    [
      "No usar para higiene personal ni para lavar",
      "alimentos. No mezclar con otros limpiadores.",
      "Mantener fuera del alcance de los ninos.",
    ],
    0.532,
  );

  // Marca de reciclaje dibujada a mano.
  drawRecycleMark(ctx, cx, h * 0.72, h * 0.042, PALETTE.green);
  ctx.fillStyle = PALETTE.forest;
  setFont(ctx, Math.round(h * 0.0125), 700, FONT_SANS);
  trackedText(
    ctx,
    `CONTENIDO NETO ${options.weightLabel.toUpperCase()}`,
    cx,
    h * 0.778,
    h * 0.0018,
  );

  // Acentos botanicos en la parte trasera (mismo lenguaje visual).
  drawSprig(ctx, 10, 26, 250, 0.42, PALETTE.sage, PALETTE.sage, 5, 0.8);
  drawSprig(ctx, w - 10, 26, 250, Math.PI - 0.42, PALETTE.sage, PALETTE.sage, 5, 0.8);
  drawLeaf(ctx, w * 0.5, h - 40, 170, 62, -1.57, PALETTE.sage, 0.75);
  drawBloom(ctx, w * 0.5 - 150, h - 74, 30, PALETTE.sage, PALETTE.coral, 0.65);
  drawBloom(ctx, w * 0.5 + 150, h - 74, 30, PALETTE.sage, PALETTE.coral, 0.65);
}

/** Simbolo de reciclaje trazado a mano. */
function drawRecycleMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
): void {
  const r = size / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.11);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < 3; i++) {
    const a0 = (i / 3) * Math.PI * 2 - Math.PI / 2;
    const a1 = a0 + Math.PI * 0.62;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.7, a0, a1);
    ctx.stroke();
    const tipX = cx + Math.cos(a1) * r * 0.7;
    const tipY = cy + Math.sin(a1) * r * 0.7;
    const dir = a1 + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX + Math.cos(dir - 0.5) * r * 0.3,
      tipY + Math.sin(dir - 0.5) * r * 0.3,
    );
    ctx.lineTo(
      tipX + Math.cos(dir + 0.5) * r * 0.3,
      tipY + Math.sin(dir + 0.5) * r * 0.3,
    );
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Lateral: continuacion vegetal, sin texto. */
function drawSideArt(
  ctx: CanvasRenderingContext2D,
  region: "RIGHT" | "LEFT",
): void {
  const { x, y, w, h } = ATLAS_REGIONS[region];
  ctx.save();
  ctx.translate(x, y);
  ctx.textBaseline = "middle";

  // Tallo vertical que recorre el lateral.
  ctx.strokeStyle = PALETTE.sage;
  ctx.lineWidth = Math.max(2, w * 0.035);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.08);
  ctx.bezierCurveTo(
    w * 0.22,
    h * 0.3,
    w * 0.78,
    h * 0.52,
    w * 0.5,
    h * 0.78,
  );
  ctx.stroke();

  for (let i = 0; i < 7; i++) {
    const t = (i + 1) / 8;
    const ly = h * (0.12 + t * 0.66);
    const lx = w * (0.5 + Math.sin(t * Math.PI * 2.1) * 0.24);
    const size = w * (0.42 - 0.14 * t);
    const dir = i % 2 === 0 ? -0.9 : Math.PI + 0.9;
    drawLeaf(ctx, lx, ly, size, size * 0.52, dir, i % 3 === 0 ? PALETTE.green : PALETTE.sage, 0.85);
  }

  drawBloom(ctx, w * 0.5, h * 0.16, w * 0.3, PALETTE.sage, PALETTE.coral, 0.7);
  drawBloom(ctx, w * 0.5, h * 0.87, w * 0.26, PALETTE.sage, PALETTE.coral, 0.6);

  ctx.restore();
}

/** Esquina: sombreado suave del pliegue + continuation de motivos. */
function drawCornerArt(
  ctx: CanvasRenderingContext2D,
  region: "CORNER_FR" | "CORNER_FL" | "CORNER_BR" | "CORNER_BL",
): void {
  const { x, y, w, h } = ATLAS_REGIONS[region];
  ctx.save();
  ctx.translate(x, y);

  // Pliegue: sombra suave en el centro del arco.
  const gradient = ctx.createLinearGradient(0, 0, w, 0);
  gradient.addColorStop(0, "rgba(74,64,44,0)");
  gradient.addColorStop(0.5, "rgba(74,64,44,0.13)");
  gradient.addColorStop(1, "rgba(74,64,44,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Hojas sueltas que enlazan las caras.
  drawLeaf(ctx, w * 0.5, h * 0.16, w * 0.75, w * 0.34, -1.35, PALETTE.sage, 0.5);
  drawLeaf(ctx, w * 0.5, h * 0.86, w * 0.7, w * 0.3, -1.75, PALETTE.sage, 0.45);

  ctx.restore();
}

/** Cara superior: sellado en caliente con estrias. */
function drawTopArt(ctx: CanvasRenderingContext2D): void {
  const { x, y, w, h } = ATLAS_REGIONS.TOP;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "#E2D9C2";
  ctx.fillRect(0, 0, w, h);

  // Estrias del sellado.
  const step = Math.max(6, w / 150);
  for (let px = 0; px < w; px += step) {
    ctx.fillStyle = "rgba(255,252,244,0.5)";
    ctx.fillRect(px, h * 0.1, step * 0.42, h * 0.8);
    ctx.fillStyle = "rgba(112,99,74,0.12)";
    ctx.fillRect(px + step * 0.5, h * 0.1, step * 0.34, h * 0.8);
  }

  // Sombras suaves en los bordes del sellado.
  const top = ctx.createLinearGradient(0, 0, 0, h * 0.22);
  top.addColorStop(0, "rgba(96,84,62,0.22)");
  top.addColorStop(1, "rgba(96,84,62,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h * 0.22);

  const bottom = ctx.createLinearGradient(0, h * 0.82, 0, h);
  bottom.addColorStop(0, "rgba(96,84,62,0)");
  bottom.addColorStop(1, "rgba(96,84,62,0.18)");
  ctx.fillStyle = bottom;
  ctx.fillRect(0, h * 0.82, w, h * 0.18);

  ctx.restore();
}

/** Base inferior: pliegues de fuelle que permiten que la bolsa se sostenga. */
function drawBottomArt(ctx: CanvasRenderingContext2D): void {
  const { x, y, w, h } = ATLAS_REGIONS.BOTTOM;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "#E1D8C1";
  ctx.fillRect(0, 0, w, h);

  // Pliegues triangulares del fuelle.
  ctx.strokeStyle = "rgba(104,92,68,0.22)";
  ctx.lineWidth = Math.max(2, h * 0.02);
  for (let i = 0; i <= 6; i++) {
    const px = (i / 6) * w;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px + (i % 2 === 0 ? 1 : -1) * w * 0.05, h);
    ctx.stroke();
  }

  const shade = ctx.createRadialGradient(
    w * 0.5,
    h * 0.55,
    h * 0.1,
    w * 0.5,
    h * 0.55,
    w * 0.42,
  );
  shade.addColorStop(0, "rgba(96,84,62,0)");
  shade.addColorStop(1, "rgba(96,84,62,0.26)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* API publica                                                         */
/* ------------------------------------------------------------------ */

export type AtlasOptions = {
  /** peso neto que se imprime en la cara frontal */
  weightLabel: string;
  /** codigo interno que se imprime en la cara frontal */
  productCode: string;
};

export const DEFAULT_ATLAS_OPTIONS: AtlasOptions = {
  weightLabel: "5 kg",
  productCode: "REN-DET-005",
};

/**
 * Pinta el atlas completo de la bolsa RENOVA:
 *  1. material base (papel kraft blanqueado con fibras y grano)
 *  2. diseno impreso (composicion frontal, trasera y motivos vegetales)
 *  3. integracion (variacion suave de densidad de tinta)
 */
export function paintRenovaAtlas(
  ctx: CanvasRenderingContext2D,
  options: AtlasOptions = DEFAULT_ATLAS_OPTIONS,
): void {
  ctx.clearRect(0, 0, ATLAS_WIDTH, ATLAS_HEIGHT);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  const tile = createNoiseTile(128);

  // ---- Capa 1: material base ---------------------------------------
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, ATLAS_WIDTH, ATLAS_HEIGHT);
  paintTonalVariation(ctx, 0, 0, STRIP_W, BODY_H, 16);
  paintTonalVariation(ctx, 0, BODY_H, ATLAS_WIDTH, ATLAS_HEIGHT - BODY_H, 4);
  paintFibers(ctx, 0, 0, STRIP_W, BODY_H, 17000);
  paintFibers(ctx, 0, BODY_H, ATLAS_WIDTH, ATLAS_HEIGHT - BODY_H, 1200);
  paintGrain(ctx, tile, 0.05);

  // ---- Capa 2: diseno impreso --------------------------------------
  // El cuerpo se pinta como panorama continuo sobre la franja superior.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, STRIP_W, BODY_H);
  ctx.clip();

  // Motivos de la cara frontal. Se pintan dos veces: la segunda copia
  // continua el motivo en la esquina final del perimetro (cierre del anillo).
  for (const dx of [0, STRIP_W]) {
    ctx.save();
    ctx.translate(ATLAS_REGIONS.FRONT.x + dx, ATLAS_REGIONS.FRONT.y);
    drawFrontBotanicals(ctx);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(ATLAS_REGIONS.BACK.x, ATLAS_REGIONS.BACK.y);
  drawBackComposition(ctx, options);
  ctx.restore();

  ctx.save();
  ctx.translate(ATLAS_REGIONS.FRONT.x, ATLAS_REGIONS.FRONT.y);
  drawFrontComposition(ctx, options);
  ctx.restore();

  drawSideArt(ctx, "RIGHT");
  drawSideArt(ctx, "LEFT");
  drawCornerArt(ctx, "CORNER_FR");
  drawCornerArt(ctx, "CORNER_FL");
  drawCornerArt(ctx, "CORNER_BR");
  drawCornerArt(ctx, "CORNER_BL");

  ctx.restore();

  // Tapas.
  drawTopArt(ctx);
  drawBottomArt(ctx);

  // ---- Capa 3: integracion con el material -------------------------
  // Variacion de densidad de tinta: multiplos suaves, sin manchas.
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.05;
  paintTonalVariation(ctx, 0, 0, ATLAS_WIDTH, ATLAS_HEIGHT, 10);
  ctx.restore();

  // Grano final: unifica impresion y soporte.
  paintGrain(ctx, tile, 0.035);
}

/**
 * Canvas de microfibras para bumpMap / roughnessMap.
 * Es un tile en escala de grises, no el color del empaque.
 */
export function createFiberNoiseCanvas(size = 512): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const image = ctx.createImageData(size, size);
  const data = image.data;
  const local = makeRng(0x51ed_270b);
  for (let i = 0; i < size * size; i++) {
    const value = 128 + (local() - 0.5) * 18;
    data[i * 4] = value;
    data[i * 4 + 1] = value;
    data[i * 4 + 2] = value;
    data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  // Fibras finas (mapa de relieve).
  ctx.lineCap = "round";
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass === 0 ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.26)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 2600; i++) {
      const px = local() * size;
      const py = local() * size;
      const len = 3 + local() * 14;
      const angle = local() < 0.6 ? (local() - 0.5) * 0.8 : Math.PI / 2 + (local() - 0.5) * 0.9;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(angle) * len, py + Math.sin(angle) * len);
      ctx.stroke();
    }
  }
  return canvas;
}

/**
 * Tile para roughnessMap: valores altos y cercanos (acabado mate) con una
 * variacion leve, de modo que el brillo no sea uniforme en toda la superficie.
 */
export function createRoughnessNoiseCanvas(size = 512): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const image = ctx.createImageData(size, size);
  const data = image.data;
  const local = makeRng(0x2545_f491);
  for (let i = 0; i < size * size; i++) {
    const value = 236 + (local() - 0.5) * 22;
    data[i * 4] = value;
    data[i * 4 + 1] = value;
    data[i * 4 + 2] = value;
    data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  ctx.lineCap = "round";
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass === 0 ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.16)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 1800; i++) {
      const px = local() * size;
      const py = local() * size;
      const len = 4 + local() * 18;
      const angle = local() < 0.6 ? (local() - 0.5) * 0.8 : Math.PI / 2 + (local() - 0.5) * 0.9;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(angle) * len, py + Math.sin(angle) * len);
      ctx.stroke();
    }
  }
  return canvas;
}
