/*
 * Clasificación de proveedores: FRANQUICIADO (autorizado) vs BROKER (mercado abierto).
 *
 * ¿Por qué importa?
 *  - FRANQUICIADO / AUTORIZADO: compra directo al fabricante. Trazabilidad total,
 *    garantía del fabricante, material nuevo. Riesgo de falsificación ~nulo.
 *    (Ej: Digi-Key, Mouser, Arrow, TTI, Future, RS, Farnell...)
 *  - BROKER / INDEPENDIENTE: mercado abierto, excedentes y spot-buys. Útil para
 *    obsoletos o escasez, PERO requiere inspección/pruebas: mayor riesgo de
 *    falsificación. (Ej: Chip 1 Exchange, Converge, casas de excedente...)
 *  - AGREGADOR: no vende, solo compara (Octopart, Findchips...).
 *
 * `FRANCHISED` es el set de distribuidores autorizados conocidos. Cualquier
 * proveedor que NO esté aquí se clasifica como BROKER por defecto (criterio
 * conservador: ante la duda, trátalo como mercado abierto y verifica).
 */

const FRANCHISED = [
  // América
  "digikey", "digi-key", "mouser", "arrow", "arrow electronics", "avnet",
  "newark", "element14", "farnell", "tti", "future", "future electronics",
  "master electronics", "symmetry", "symmetry electronics", "sager",
  "heilind", "bisco", "richardson rfpd", "onlinecomponents", "allied electronics",
  // Europa
  "rs", "rs components", "rs online", "rs-online", "tme", "conrad", "distrelec",
  "rutronik", "reichelt", "codico", "mevoco", "schukat", "buerklin", "farnell europe",
  // Asia / Pacífico
  "lcsc", "chip1stop", "chip 1 stop", "oneyac", "wpg", "wpi", "macnica",
  "ryosan", "shinko", "element14 apac", "digikey asia", "mouser asia",
];

// Marcas/fabricantes que venden directo (también cuentan como autorizado).
const MANUFACTURER_DIRECT = [
  "diodes incorporated", "diodes inc", "texas instruments", "ti store",
  "stmicroelectronics", "st", "nxp", "microchip", "analog devices", "infineon",
  "onsemi", "on semiconductor", "vishay", "raspberry pi",
];

function normalizeName(name) {
  return (name || "")
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\b(inc|llc|ltd|corp|co|gmbh|sa|srl|technologies|components|electronics|international|global|semiconductor|semi)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clasifica un proveedor por su nombre.
 * @returns {{tier:'franquiciado'|'broker', label:string, badge:string, risk:string}}
 */
function classifySupplier(name) {
  const n = normalizeName(name);
  const raw = (name || "").toLowerCase();

  const isFranchised =
    FRANCHISED.some((f) => raw.includes(f) || n.includes(normalizeName(f))) ||
    MANUFACTURER_DIRECT.some((m) => raw.includes(m));

  if (isFranchised) {
    return {
      tier: "franquiciado",
      label: "Franquiciado",
      badge: "✅",
      risk: "Autorizado por el fabricante · trazabilidad y garantía.",
    };
  }
  return {
    tier: "broker",
    label: "Broker",
    badge: "⚠️",
    risk: "Mercado abierto / excedente · verifica autenticidad y trazabilidad.",
  };
}

if (typeof module !== "undefined") {
  module.exports = { classifySupplier, FRANCHISED, MANUFACTURER_DIRECT, normalizeName };
}
