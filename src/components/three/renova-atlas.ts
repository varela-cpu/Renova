/**
 * Atlas UV de la bolsa RENOVA.
 *
 * Un único PNG (generado en runtime con Canvas 2D) que cubre TODAS las caras
 * de la bolsa. Las regiones se definen una sola vez aqui y son la fuente de
 * verdad tanto para el pintado (canvas) como para el mapeo UV de la geometria.
 *
 * El arte se pinta como un "panorama" continuo de 2590 x 1792 px que recorre
 * todo el perimetro de la bolsa (frontal -> esquina -> lateral -> esquina ->
 * trasera -> ...). Cada region del atlas es un recorte de ese panorama, de
 * modo que las costuras entre caras coinciden exactamente y las ondas
 * continues de una cara a la otra.
 *
 * Sistema de coordenadas del canvas: origen arriba-izquierda, y hacia abajo.
 * Sistema UV de Three.js: origen abajo-izquierda, v hacia arriba.
 */

export const PALETTE = {
  forest: "#145B45",
  leaf: "#287A5D",
  sage: "#A2B99A",
  ivory: "#F3F0E5",
  coral: "#F07863",
  moss: "#3F5D3A",
  sun: "#E8B14C",
  ink: "#12362B",
} as const;

export const FONT_DISPLAY =
  '"Futura", "Century Gothic", "Avenir Next", "Trebuchet MS", "Segoe UI", sans-serif';
export const FONT_SANS =
  '"Avenir Next", "Segoe UI", "Trebuchet MS", system-ui, -apple-system, sans-serif';

/** Pixels por unidad de mundo (la bolsa mide 1.0 x 1.75 unidades). */
export const PX_PER_UNIT = 1024;

export const ATLAS_WIDTH = 2688;
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

/**
 * Medidas de referencia de la bolsa (cuerpo):
 *  - panel frontal plano : 0.78 unidades  -> 799 px
 *  - lateral plano       : 0.13 unidades  -> 136 px
 *  - arco de esquina     : 0.173 unidades -> 180 px
 *  - altura total        : 1.75 unidades  -> 1792 px
 */
const FRONT_W = 799;
const BODY_H = 1792;
const SIDE_W = 136;
const CORNER_W = 180;
const CAP_H = 136;

/** Panorama continuo: perimetro completo de la bolsa. */
export const PANORAMA_W = 2590;
export const PANORAMA_H = BODY_H;

export const ATLAS_REGIONS: Record<RegionId, PixelRect> = {
  FRONT: { x: 0, y: 0, w: FRONT_W, h: BODY_H },
  CORNER_FR: { x: FRONT_W, y: 0, w: CORNER_W, h: BODY_H },
  RIGHT: { x: FRONT_W + CORNER_W, y: 0, w: SIDE_W, h: BODY_H },
  CORNER_BR: { x: FRONT_W + CORNER_W + SIDE_W, y: 0, w: CORNER_W, h: BODY_H },
  BACK: {
    x: FRONT_W + CORNER_W + SIDE_W + CORNER_W,
    y: 0,
    w: FRONT_W,
    h: BODY_H,
  },
  CORNER_BL: {
    x: FRONT_W + CORNER_W + SIDE_W + CORNER_W * 2,
    y: 0,
    w: CORNER_W,
    h: BODY_H,
  },
  LEFT: {
    x: FRONT_W + CORNER_W + SIDE_W + CORNER_W * 2 + CORNER_W,
    y: 0,
    w: SIDE_W,
    h: BODY_H,
  },
  CORNER_FL: {
    x: FRONT_W + CORNER_W + SIDE_W + CORNER_W * 3 + SIDE_W,
    y: 0,
    w: CORNER_W,
    h: BODY_H,
  },
  TOP: { x: 0, y: BODY_H, w: FRONT_W, h: CAP_H },
  BOTTOM: { x: FRONT_W, y: BODY_H, w: FRONT_W, h: CAP_H },
};

export type UvRect = { u0: number; u1: number; v0: number; v1: number };

/** Convierte un rectangulo de pixels del canvas a un rectangulo UV. */
export function uvRectFromPixels(rect: PixelRect): UvRect {
  return {
    u0: rect.x / ATLAS_WIDTH,
    u1: (rect.x + rect.w) / ATLAS_WIDTH,
    v0: 1 - (rect.y + rect.h) / ATLAS_HEIGHT,
    v1: 1 - rect.y / ATLAS_HEIGHT,
  };
}

/* ------------------------------------------------------------------ */
/* Utilidades de dibujo                                                */
/* ------------------------------------------------------------------ */

function fillRect(
  ctx: CanvasRenderingContext2D,
  rect: PixelRect,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** Banda ondulada que llena desde `baseY` hasta el borde inferior del area. */
function waveBand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  baseY: number,
  amplitude: number,
  frequency: number,
  phase: number,
  color: string,
): void {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, baseY);
  const steps = Math.max(24, Math.round(w / 6));
  for (let i = 0; i <= steps; i++) {
    const px = x + (i / steps) * w;
    const py =
      baseY + Math.sin((i / steps) * frequency * Math.PI * 2 + phase) * amplitude;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** Onda de trazo para lineas decorativas. */
function waveStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  baseY: number,
  amplitude: number,
  frequency: number,
  phase: number,
  color: string,
  lineWidth: number,
): void {
  ctx.beginPath();
  const steps = Math.max(24, Math.round(w / 6));
  for (let i = 0; i <= steps; i++) {
    const px = x + (i / steps) * w;
    const py =
      baseY + Math.sin((i / steps) * frequency * Math.PI * 2 + phase) * amplitude;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/** Hoja organica. */
function leaf(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  length: number,
  angle: number,
  color: string,
  alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(
    length * 0.28,
    -length * 0.36,
    length * 0.74,
    -length * 0.3,
    length,
    0,
  );
  ctx.bezierCurveTo(
    length * 0.74,
    length * 0.3,
    length * 0.28,
    length * 0.36,
    0,
    0,
  );
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/** Rama con hojas. */
function branch(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  length: number,
  angle: number,
  color: string,
  leaves = 5,
  alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, length * 0.02);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(length * 0.5, -length * 0.14, length, 0);
  ctx.stroke();
  for (let i = 0; i < leaves; i++) {
    const t = (i + 1) / (leaves + 1);
    const lx = length * t;
    const ly = -length * 0.14 * Math.sin(Math.PI * t);
    const size = length * (0.32 - 0.09 * t);
    leaf(ctx, lx, ly, size, -0.62, color);
    leaf(ctx, lx, ly, size, 0.62, color);
  }
  ctx.restore();
}

/** Texto con interletraje manual (funciona en todos los navegadores). */
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

function setFont(
  ctx: CanvasRenderingContext2D,
  size: number,
  weight: number | string,
  family: string,
  italic = false,
): void {
  ctx.font = `${italic ? "italic " : ""}${weight} ${size}px ${family}`;
}

/** Simbolo de reciclaje dibujado a mano (sin depender de una fuente). */
function recycleMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
): void {
  const r = size / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.12);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < 3; i++) {
    const a0 = (i / 3) * Math.PI * 2 - Math.PI / 2;
    const a1 = a0 + Math.PI * 0.62;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.72, a0, a1);
    ctx.stroke();
    const tipX = cx + Math.cos(a1) * r * 0.72;
    const tipY = cy + Math.sin(a1) * r * 0.72;
    const dir = a1 + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX + Math.cos(dir - 0.5) * r * 0.32,
      tipY + Math.sin(dir - 0.5) * r * 0.32,
    );
    ctx.lineTo(
      tipX + Math.cos(dir + 0.5) * r * 0.32,
      tipY + Math.sin(dir + 0.5) * r * 0.32,
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

/** Pastilla redondeada centrada. */
function pill(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  fill: string,
  stroke?: string,
  lineWidth = 3,
): void {
  const r = h / 2;
  const x = cx - w / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, cy - h / 2);
  ctx.arcTo(x + w, cy - h / 2, x + w, cy + h / 2, r);
  ctx.arcTo(x + w, cy + h / 2, x, cy + h / 2, r);
  ctx.arcTo(x, cy + h / 2, x, cy - h / 2, r);
  ctx.arcTo(x, cy - h / 2, x + w, cy - h / 2, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export type AtlasOptions = {
  /** peso neto que se imprime en la cara frontal */
  weightLabel: string;
  /** codigo interno que se imprime en la banda inferior */
  productCode: string;
};

export const DEFAULT_ATLAS_OPTIONS: AtlasOptions = {
  weightLabel: "5 kg",
  productCode: "REN-DET-005",
};

/* ------------------------------------------------------------------ */
/* Layout del panorama                                                 */
/* ------------------------------------------------------------------ */

const R = ATLAS_REGIONS;

/* ------------------------------------------------------------------ */
/* Pintado                                                             */
/* ------------------------------------------------------------------ */

function paintFrontArt(
  ctx: CanvasRenderingContext2D,
  options: AtlasOptions,
): void {
  const { x, y, w, h } = R.FRONT;
  ctx.save();
  ctx.translate(x, y);

  // Logotipo RENOVA
  ctx.fillStyle = PALETTE.forest;
  setFont(ctx, h * 0.082, 800, FONT_DISPLAY);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  trackedText(ctx, "RENOVA", x + w / 2, y + h * 0.335, h * 0.012);

  // Arco bajo el logotipo
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.335, w * 0.31, Math.PI * 0.2, Math.PI * 0.8);
  ctx.strokeStyle = PALETTE.coral;
  ctx.lineWidth = Math.max(3, h * 0.0042);
  ctx.stroke();

  // Eslogan
  ctx.fillStyle = PALETTE.leaf;
  setFont(ctx, h * 0.028, 500, FONT_SANS, true);
  trackedText(ctx, "Limpieza que da más vida", x + w / 2, y + h * 0.412, h * 0.0024);

  // Separador con hojas
  ctx.strokeStyle = PALETTE.sage;
  ctx.lineWidth = Math.max(2, h * 0.0024);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.22, y + h * 0.463);
  ctx.lineTo(x + w * 0.78, y + h * 0.463);
  ctx.stroke();
  leaf(ctx, x + w * 0.5 - w * 0.05, y + h * 0.463, w * 0.08, -0.5, PALETTE.sage);
  leaf(ctx, x + w * 0.5 + w * 0.05, y + h * 0.463, w * 0.08, Math.PI + 0.5, PALETTE.sage);

  // Informacion del producto
  ctx.fillStyle = PALETTE.forest;
  setFont(ctx, h * 0.025, 700, FONT_DISPLAY);
  trackedText(ctx, "DETERGENTE EN POLVO", x + w / 2, y + h * 0.518, h * 0.0044);

  ctx.fillStyle = PALETTE.leaf;
  setFont(ctx, h * 0.0195, 600, FONT_SANS);
  trackedText(ctx, "FRAGANCIA FLORAL", x + w / 2, y + h * 0.568, h * 0.0062);

  ctx.fillStyle = PALETTE.coral;
  const dot = h * 0.0052;
  ctx.beginPath();
  ctx.arc(x + w * 0.145, y + h * 0.568, dot, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.855, y + h * 0.568, dot, 0, Math.PI * 2);
  ctx.fill();

  // Badge de peso neto
  const badgeH = h * 0.05;
  const badgeY = y + h * 0.632;
  pill(ctx, x + w / 2, badgeY, w * 0.3, badgeH, PALETTE.ivory, PALETTE.forest, Math.max(3, h * 0.0034));
  ctx.fillStyle = PALETTE.forest;
  setFont(ctx, h * 0.029, 800, FONT_DISPLAY);
  trackedText(ctx, options.weightLabel, x + w / 2, badgeY, h * 0.003);

  // Ilustracion vegetal inferior
  branch(ctx, x + w * 0.14, y + h * 0.8, w * 0.46, -0.22, PALETTE.sage, 5, 0.9);
  branch(ctx, x + w * 0.9, y + h * 0.76, w * 0.38, Math.PI + 0.26, PALETTE.sage, 4, 0.9);
  leaf(ctx, x + w * 0.3, y + h * 0.72, w * 0.16, -1.1, PALETTE.leaf, 0.75);
  leaf(ctx, x + w * 0.72, y + h * 0.7, w * 0.14, -2.1, PALETTE.leaf, 0.7);

  ctx.restore();
}

function paintBackArt(
  ctx: CanvasRenderingContext2D,
  options: AtlasOptions,
): void {
  const { x, y, w, h } = R.BACK;
  ctx.save();
  ctx.translate(x, y);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Marca discreta
  ctx.fillStyle = PALETTE.forest;
  setFont(ctx, h * 0.038, 800, FONT_DISPLAY);
  trackedText(ctx, "RENOVA", x + w / 2, y + h * 0.155, h * 0.007);
  ctx.fillStyle = PALETTE.leaf;
  setFont(ctx, h * 0.021, 500, FONT_SANS, true);
  trackedText(ctx, "Limpieza que da más vida", x + w / 2, y + h * 0.195, h * 0.002);

  const heading = (text: string, at: number) => {
    ctx.fillStyle = PALETTE.forest;
    setFont(ctx, h * 0.018, 700, FONT_SANS);
    trackedText(ctx, text, x + w / 2, y + h * at, h * 0.0034);
  };
  const lines = (rows: string[], from: number) => {
    ctx.fillStyle = PALETTE.ink;
    setFont(ctx, h * 0.0148, 400, FONT_SANS);
    rows.forEach((line, i) => {
      ctx.fillText(line, x + w / 2, y + h * (from + i * 0.028));
    });
  };

  heading("INSTRUCCIONES DE USO", 0.275);
  lines(
    [
      "Lavado a mano: disuelva la dosis en agua,",
      "lave segun el cuidado de la prenda y",
      "enjuague bien.",
      "Lavadora: agregue la dosis en el compartimiento",
      "recomendado por el fabricante.",
    ],
    0.325,
  );

  heading("CARACTERISTICAS", 0.505);
  lines(
    [
      "Detergente en polvo de uso domestico.",
      "Fragancia floral.",
      "Envase de 5 kg.",
    ],
    0.552,
  );

  heading("PRECAUCIONES", 0.665);
  lines(
    [
      "No usar para higiene personal ni para lavar",
      "alimentos. No mezclar con otros limpiadores.",
      "Mantener fuera del alcance de los ninos.",
    ],
    0.712,
  );

  recycleMark(ctx, x + w * 0.5, y + h * 0.815, h * 0.055, PALETTE.leaf);
  ctx.fillStyle = PALETTE.forest;
  setFont(ctx, h * 0.0165, 700, FONT_SANS);
  trackedText(
    ctx,
    `CONTENIDO NETO ${options.weightLabel.toUpperCase()}`,
    x + w / 2,
    y + h * 0.862,
    h * 0.0024,
  );

  ctx.restore();
}

function paintSideArt(
  ctx: CanvasRenderingContext2D,
  rect: PixelRect,
  flip: boolean,
): void {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.translate(x, y);
  if (flip) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }

  // Ondas verticales suaves en la zona media
  waveStroke(ctx, 0, 0, w, h * 0.46, h * 0.035, 1.1, 0.4, PALETTE.sage, Math.max(2, w * 0.05));
  waveStroke(ctx, 0, 0, w, h * 0.53, h * 0.028, 1.4, 2.2, PALETTE.leaf, Math.max(2, w * 0.035));

  leaf(ctx, w * 0.5, h * 0.4, w * 0.75, -1.0, PALETTE.sage, 0.75);
  leaf(ctx, w * 0.55, h * 0.44, w * 0.6, -2.2, PALETTE.sage, 0.6);

  ctx.fillStyle = PALETTE.coral;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.5, w * 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function paintCornerArt(
  ctx: CanvasRenderingContext2D,
  rect: PixelRect,
  flip: boolean,
): void {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.translate(x, y);
  if (flip) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  waveStroke(ctx, 0, 0, w, h * 0.45, h * 0.03, 0.9, 0.8, PALETTE.sage, Math.max(2, w * 0.03));
  waveStroke(ctx, 0, 0, w, h * 0.52, h * 0.024, 1.2, 2.6, PALETTE.leaf, Math.max(2, w * 0.022));
  ctx.restore();
}

function paintTopArt(ctx: CanvasRenderingContext2D): void {
  const { x, y, w, h } = R.TOP;
  fillRect(ctx, R.TOP, PALETTE.ivory);
  ctx.fillStyle = PALETTE.forest;
  ctx.fillRect(x, y, w, h * 0.46);
  ctx.fillStyle = PALETTE.sage;
  ctx.fillRect(x, y + h * 0.46, w, h * 0.2);
  ctx.fillStyle = PALETTE.coral;
  ctx.fillRect(x, y + h * 0.66, w, h * 0.08);
  ctx.strokeStyle = PALETTE.ivory;
  ctx.lineWidth = Math.max(2, h * 0.03);
  for (let i = 0; i < 30; i++) {
    const px = x + (i / 29) * w;
    ctx.beginPath();
    ctx.moveTo(px, y + h * 0.76);
    ctx.lineTo(px + w * 0.012, y + h);
    ctx.stroke();
  }
}

function paintBottomArt(ctx: CanvasRenderingContext2D): void {
  const { x, y, w, h } = R.BOTTOM;
  fillRect(ctx, R.BOTTOM, PALETTE.ivory);
  waveBand(ctx, x, y, w, h, y + h * 0.3, h * 0.14, 2.2, 0.4, PALETTE.sage);
  waveBand(ctx, x, y, w, h, y + h * 0.55, h * 0.11, 2.8, 2.6, PALETTE.leaf);
  ctx.fillStyle = PALETTE.forest;
  ctx.fillRect(x, y + h * 0.84, w, h * 0.16);
}

/** Pinta el atlas completo de la bolsa RENOVA. */
export function paintRenovaAtlas(
  ctx: CanvasRenderingContext2D,
  options: AtlasOptions = DEFAULT_ATLAS_OPTIONS,
): void {
  ctx.clearRect(0, 0, ATLAS_WIDTH, ATLAS_HEIGHT);
  ctx.fillStyle = PALETTE.ivory;
  ctx.fillRect(0, 0, ATLAS_WIDTH, ATLAS_HEIGHT);

  // ---- Panorama continuo: bandas de onda que cruzan todo el perimetro ----
  const H = PANORAMA_H;

  // Banda superior (sellado) verde oscuro
  ctx.fillStyle = PALETTE.forest;
  ctx.fillRect(0, 0, PANORAMA_W, H * 0.07);
  ctx.fillStyle = PALETTE.coral;
  ctx.fillRect(0, H * 0.07, PANORAMA_W, Math.max(3, H * 0.0035));

  // Ondas superiores
  waveBand(ctx, 0, H * 0.07, PANORAMA_W, H * 0.09, H * 0.12, H * 0.022, 3.1, 0.4, PALETTE.sage);
  waveBand(ctx, 0, H * 0.07, PANORAMA_W, H * 0.09, H * 0.145, H * 0.018, 3.8, 2.2, PALETTE.leaf);
  waveBand(ctx, 0, H * 0.07, PANORAMA_W, H * 0.09, H * 0.168, H * 0.013, 4.6, 4.1, PALETTE.forest);

  // Ondas inferiores
  waveBand(ctx, 0, H * 0.88, PANORAMA_W, H * 0.12, H * 0.9, H * 0.016, 3.4, 1.1, PALETTE.sage);
  waveBand(ctx, 0, H * 0.88, PANORAMA_W, H * 0.12, H * 0.925, H * 0.013, 4.1, 3.3, PALETTE.leaf);
  ctx.fillStyle = PALETTE.forest;
  ctx.fillRect(0, H * 0.955, PANORAMA_W, H * 0.045);

  ctx.fillStyle = PALETTE.ivory;
  setFont(ctx, H * 0.0115, 600, FONT_SANS);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  trackedText(ctx, options.productCode, R.FRONT.x + R.FRONT.w / 2, H * 0.978, H * 0.0022);
  trackedText(ctx, options.productCode, R.BACK.x + R.BACK.w / 2, H * 0.978, H * 0.0022);

  // ---- Contenido por region ----
  paintSideArt(ctx, R.RIGHT, false);
  paintSideArt(ctx, R.LEFT, true);
  paintCornerArt(ctx, R.CORNER_FR, false);
  paintCornerArt(ctx, R.CORNER_FL, true);
  paintCornerArt(ctx, R.CORNER_BR, false);
  paintCornerArt(ctx, R.CORNER_BL, true);

  paintFrontArt(ctx, options);
  paintBackArt(ctx, options);

  // ---- Tapas ----
  paintTopArt(ctx);
  paintBottomArt(ctx);
}
