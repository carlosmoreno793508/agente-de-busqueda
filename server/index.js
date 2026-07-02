/*
 * ComponentSource AI — Proxy backend para datos en vivo.
 *
 * Expone un endpoint que el frontend consume:
 *   GET /api/search?q=NE555,STM32F103C8T6
 *
 * Soporta DOS proveedores de datos (elige automáticamente según las
 * credenciales que configures en variables de entorno):
 *
 *   1) NEXAR (Octopart)  -> stock/precio multi-distribuidor. Marca cada
 *      proveedor con el campo oficial `isAuthorized` (franquiciado vs broker).
 *      Variables: NEXAR_CLIENT_ID, NEXAR_CLIENT_SECRET   (crea app en nexar.com)
 *
 *   2) MOUSER            -> stock/precio del propio Mouser (franquiciado).
 *      Más fácil: key gratis e instantánea en mouser.com/api-hub.
 *      Variable: MOUSER_API_KEY
 *
 * Si hay credenciales de Nexar se usa Nexar; si no, se usa Mouser.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { classifySupplier } = require("../distributors.js");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8787;
const NEXAR_ID = process.env.NEXAR_CLIENT_ID;
const NEXAR_SECRET = process.env.NEXAR_CLIENT_SECRET;
const MOUSER_KEY = process.env.MOUSER_API_KEY;
const OEM_KEY = process.env.OEMSECRETS_API_KEY;

// Prioridad: OEMsecrets (agregador gratis) > Nexar > Mouser.
function provider() {
  if (OEM_KEY) return "oemsecrets";
  if (NEXAR_ID && NEXAR_SECRET) return "nexar";
  if (MOUSER_KEY) return "mouser";
  return null;
}

/* ============================ NEXAR (Octopart) ============================ */
const TOKEN_URL = "https://identity.nexar.com/connect/token";
const GRAPHQL_URL = "https://api.nexar.com/graphql";
let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60_000) return cachedToken;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: NEXAR_ID,
    client_secret: NEXAR_SECRET,
    scope: "supply.domain",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Token Nexar falló: HTTP " + res.status);
  const json = await res.json();
  cachedToken = json.access_token;
  tokenExpiry = Date.now() + (json.expires_in || 3600) * 1000;
  return cachedToken;
}

const SEARCH_QUERY = `
  query Search($q: String!, $limit: Int!) {
    supSearchMpn(q: $q, limit: $limit) {
      results {
        part {
          mpn
          manufacturer { name }
          shortDescription
          specs { attribute { shortname } value units siValue siUnits }
          sellers {
            company { name }
            isAuthorized
            country
            offers { inventoryLevel moq clickUrl prices { quantity price currency } }
          }
        }
      }
    }
  }
`;

async function searchNexar(parts) {
  const token = await getToken();
  let all = [];
  for (const p of parts) {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ query: SEARCH_QUERY, variables: { q: p, limit: 10 } }),
    });
    if (!res.ok) throw new Error("GraphQL Nexar falló: HTTP " + res.status);
    const json = await res.json();
    if (json.errors) throw new Error("GraphQL: " + JSON.stringify(json.errors));
    const results = json.data?.supSearchMpn?.results || [];
    for (const r of results) {
      const part = r.part || {};
      const mfr = part.manufacturer?.name || "";
      // Peso unitario: spec "weight"; usamos el valor SI (kg) si viene así.
      let weightKg = null;
      const wspec = (part.specs || []).find((s) => s.attribute?.shortname === "weight");
      if (wspec) {
        if (wspec.siUnits === "kg" && wspec.siValue) weightKg = parseFloat(wspec.siValue);
        else if (wspec.units === "g" && wspec.value) weightKg = parseFloat(wspec.value) / 1000;
        else if (wspec.units === "mg" && wspec.value) weightKg = parseFloat(wspec.value) / 1e6;
      }
      if (!(weightKg > 0)) weightKg = null;
      for (const seller of part.sellers || []) {
        const supplierName = seller.company?.name || "";
        const tier = seller.isAuthorized ? "franquiciado" : classifySupplier(supplierName).tier;
        for (const offer of seller.offers || []) {
          const lowest = (offer.prices || []).reduce(
            (min, pr) => (min == null || pr.price < min.price ? pr : min), null);
          all.push({
            partNumber: part.mpn || "",
            mfr,
            dateCode: "",
            description: part.shortDescription || "",
            coo: seller.country || "",
            stock: offer.inventoryLevel ?? null,
            tariffCost: "",
            supplier: supplierName,
            tier,
            authorized: !!seller.isAuthorized,
            weightKg,
            price: lowest ? lowest.price : null,
            currency: lowest ? lowest.currency : "",
            url: offer.clickUrl || "",
          });
        }
      }
    }
  }
  return all;
}

/* ================================ MOUSER ================================== */
async function searchMouser(parts) {
  let all = [];
  for (const p of parts) {
    // Búsqueda por palabra clave (más tolerante que partnumber exacto).
    const res = await fetch(
      "https://api.mouser.com/api/v1/search/keyword?apiKey=" + encodeURIComponent(MOUSER_KEY),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ SearchByKeywordRequest: { keyword: p, records: 8, startingRecord: 0 } }),
      }
    );
    if (!res.ok) throw new Error("Mouser API falló: HTTP " + res.status);
    const json = await res.json();
    const items = json?.SearchResults?.Parts || [];
    for (const it of items) {
      const lowest = (it.PriceBreaks || []).reduce((min, pb) => {
        const val = parseFloat(String(pb.Price).replace(/[^0-9.]/g, ""));
        return (min == null || val < min.val) ? { val, currency: pb.Currency } : min;
      }, null);
      // Stock: AvailabilityInStock es el número limpio; si no, parseamos
      // Availability ("100 In Stock") o FactoryStock como respaldo.
      const stockRaw = it.AvailabilityInStock || it.Availability || it.FactoryStock || "";
      const stockNum = parseInt(String(stockRaw).replace(/[^0-9]/g, ""), 10);
      // Peso unitario en kg (Mouser lo expone directo en UnitWeightKg.UnitWeight).
      const wRaw = it.UnitWeightKg?.UnitWeight ?? it.UnitWeightKg ?? null;
      const weightKg = (wRaw != null && parseFloat(wRaw) > 0) ? parseFloat(wRaw) : null;
      all.push({
        partNumber: it.ManufacturerPartNumber || p,
        mfr: it.Manufacturer || it.ActualMfrName || "",
        dateCode: "",
        description: it.Description || "",
        coo: "",
        stock: Number.isFinite(stockNum) ? stockNum : null,
        tariffCost: "",
        supplier: "Mouser Electronics",
        tier: "franquiciado",
        authorized: true,
        leadTime: it.LeadTime || "",
        lifecycle: it.LifecycleStatus || "",
        weightKg,
        price: lowest ? lowest.val : null,
        currency: lowest ? lowest.currency : "",
        url: it.ProductDetailUrl || "",
      });
    }
  }
  return all;
}

/* ============================== OEMSECRETS ================================ */
// Agregador gratuito (150+ distribuidores). Mapeo defensivo: probamos varios
// nombres de campo porque la respuesta puede variar; se afina con una key real.
async function searchOemsecrets(parts) {
  let all = [];
  for (const p of parts) {
    const url = "https://oemsecretsapi.com/partsearch?apiKey=" + encodeURIComponent(OEM_KEY) +
      "&searchTerm=" + encodeURIComponent(p) + "&currency=USD";
    const res = await fetch(url);
    if (!res.ok) throw new Error("OEMsecrets API falló: HTTP " + res.status);
    const json = await res.json();
    const items = json.stock || json.response || json.data || json.results || [];
    for (const it of items) {
      const supplierName =
        it.distributor?.distributor_name || it.distributor_name || it.distributor || "";
      // Precios: puede venir como {USD:[{unit_price}]} o como arreglo.
      let breaks = [], currency = "USD";
      const pr = it.prices || it.price || {};
      if (Array.isArray(pr)) breaks = pr;
      else if (pr && typeof pr === "object") {
        currency = pr.USD ? "USD" : (Object.keys(pr)[0] || "USD");
        breaks = pr[currency] || [];
      }
      let price = null;
      if (Array.isArray(breaks) && breaks.length) {
        price = breaks.reduce((min, b) => {
          const v = parseFloat(String(b.unit_price ?? b.price ?? b.unitPrice).replace(/[^0-9.]/g, ""));
          return (min == null || (Number.isFinite(v) && v < min)) ? v : min;
        }, null);
      }
      const stockRaw = it.stock ?? it.quantity_in_stock ?? it.total_avl ?? it.availability ?? null;
      const stockNum = stockRaw != null ? parseInt(String(stockRaw).replace(/[^0-9]/g, ""), 10) : null;
      const tier = classifySupplier(supplierName).tier;
      all.push({
        partNumber: it.part_number || it.manufacturer_part_number || p,
        mfr: it.manufacturer || "",
        dateCode: "",
        description: it.description || "",
        coo: "",
        stock: Number.isFinite(stockNum) ? stockNum : null,
        tariffCost: "",
        supplier: supplierName,
        tier,
        authorized: tier === "franquiciado",
        price,
        currency: currency || it.currency || "USD",
        url: it.buy_now_url || it.url || it.distributor?.url || "",
      });
    }
  }
  return all;
}

/* ================================ API ==================================== */
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").toString().trim();
  if (!q) return res.status(400).json({ error: "Falta el parámetro q (Part Number)." });
  const p = provider();
  if (!p) return res.status(503).json({ error: "Sin credenciales: configura OEMSECRETS_API_KEY, NEXAR_CLIENT_ID/SECRET o MOUSER_API_KEY." });
  try {
    const parts = q.split(",").map((s) => s.trim()).filter(Boolean);
    const offers =
      p === "oemsecrets" ? await searchOemsecrets(parts) :
      p === "nexar" ? await searchNexar(parts) :
      await searchMouser(parts);
    // Autorizados primero, luego por mayor stock.
    offers.sort((a, b) => (b.authorized - a.authorized) || ((b.stock || 0) - (a.stock || 0)));
    // Limitamos a las más relevantes para una tabla manejable.
    const top = offers.slice(0, 60);
    res.json({ provider: p, count: top.length, total: offers.length, offers: top });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get("/health", (_req, res) =>
  res.json({ ok: true, provider: provider(), hasCreds: !!provider() }));

app.listen(PORT, () => {
  console.log(`ComponentSource proxy escuchando en http://localhost:${PORT}`);
  const p = provider();
  if (p) console.log(`Proveedor de datos activo: ${p.toUpperCase()}`);
  else console.warn("⚠️  Sin credenciales: copia .env.example a .env y agrega Nexar o Mouser.");
});
