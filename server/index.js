/*
 * ComponentSource AI — Proxy backend para datos en vivo.
 *
 * Habla con la API de Nexar (Octopart) usando OAuth2 client-credentials y
 * expone un endpoint simple que el frontend consume:
 *
 *   GET /api/search?q=NE555,STM32F103C8T6
 *
 * Devuelve ofertas normalizadas con las columnas de la app y clasifica cada
 * proveedor como FRANQUICIADO o BROKER usando el campo oficial `isAuthorized`
 * de Nexar (con respaldo en nuestra lista local de distribuidores).
 *
 * Credenciales: crea una app en https://nexar.com/ y pon NEXAR_CLIENT_ID /
 * NEXAR_CLIENT_SECRET en un archivo .env (ver .env.example).
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { classifySupplier } = require("../distributors.js");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8787;
const CLIENT_ID = process.env.NEXAR_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXAR_CLIENT_SECRET;
const TOKEN_URL = "https://identity.nexar.com/connect/token";
const GRAPHQL_URL = "https://api.nexar.com/graphql";

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60_000) return cachedToken;
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Faltan NEXAR_CLIENT_ID / NEXAR_CLIENT_SECRET en el .env");
  }
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
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
          sellers {
            company { name }
            isAuthorized
            country
            offers {
              inventoryLevel
              moq
              clickUrl
              prices { quantity price currency }
            }
          }
        }
      }
    }
  }
`;

async function searchPart(token, q) {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ query: SEARCH_QUERY, variables: { q, limit: 10 } }),
  });
  if (!res.ok) throw new Error("GraphQL Nexar falló: HTTP " + res.status);
  const json = await res.json();
  if (json.errors) throw new Error("GraphQL: " + JSON.stringify(json.errors));
  return json.data?.supSearchMpn?.results || [];
}

// Convierte la respuesta de Nexar en filas con las columnas de la app.
function normalize(results) {
  const offers = [];
  for (const r of results) {
    const part = r.part || {};
    const mfr = part.manufacturer?.name || "";
    for (const seller of part.sellers || []) {
      const supplierName = seller.company?.name || "";
      // Tier: el campo oficial isAuthorized manda; si no, nuestra heurística.
      const tier = seller.isAuthorized ? "franquiciado" : classifySupplier(supplierName).tier;
      for (const offer of seller.offers || []) {
        const lowest = (offer.prices || []).reduce(
          (min, p) => (min == null || p.price < min.price ? p : min), null);
        offers.push({
          partNumber: part.mpn || "",
          mfr,
          dateCode: "",
          description: part.shortDescription || "",
          coo: seller.country || "",
          stock: offer.inventoryLevel ?? null,
          tariffCost: "",
          supplier: supplierName,
          tier,                       // "franquiciado" | "broker"
          authorized: !!seller.isAuthorized,
          price: lowest ? lowest.price : null,
          currency: lowest ? lowest.currency : "",
          url: offer.clickUrl || "",
        });
      }
    }
  }
  // Autorizados primero, luego por mayor stock.
  offers.sort((a, b) =>
    (b.authorized - a.authorized) || ((b.stock || 0) - (a.stock || 0)));
  return offers;
}

app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").toString().trim();
  if (!q) return res.status(400).json({ error: "Falta el parámetro q (Part Number)." });
  try {
    const token = await getToken();
    const parts = q.split(",").map((s) => s.trim()).filter(Boolean);
    let all = [];
    for (const p of parts) {
      const results = await searchPart(token, p);
      all = all.concat(normalize(results));
    }
    res.json({ count: all.length, offers: all });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true, hasCreds: !!(CLIENT_ID && CLIENT_SECRET) }));

app.listen(PORT, () => {
  console.log(`ComponentSource proxy escuchando en http://localhost:${PORT}`);
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn("⚠️  Sin credenciales Nexar: copia .env.example a .env y agrega tus claves.");
  }
});
