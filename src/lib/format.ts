export function formatCop(value: number, fractionDigits = 0): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/** COP compacto para tarjetas: 12,4 M / 850 k */
export function formatCopShort(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(safe);
  if (abs >= 1_000_000_000) return `$${(safe / 1_000_000_000).toFixed(1)} MM`;
  if (abs >= 1_000_000) return `$${(safe / 1_000_000).toFixed(1)} M`;
  if (abs >= 1_000) return `$${(safe / 1_000).toFixed(0)} k`;
  return `$${Math.round(safe).toLocaleString("es-CO")}`;
}

export function formatNumber(value: number, fractionDigits = 0): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("es-CO", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatPercent(value: number, fractionDigits = 1): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${(safe * 100).toFixed(fractionDigits)}%`;
}

export function formatKg(value: number): string {
  return `${formatNumber(value, 3).replace(/,?0+$/, "")} kg`;
}
