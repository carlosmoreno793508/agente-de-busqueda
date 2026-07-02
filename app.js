/* ComponentSource AI — lógica de la app (sin dependencias, 100% cliente) */

// Layout de la tabla. type: edit = celda editable, tier = badge auto, view = botón.
const LAYOUT = [
  { key: "Part Number",  type: "edit" },
  { key: "Mfr",          type: "edit" },
  { key: "DC",           type: "edit" },
  { key: "Description",  type: "edit" },
  { key: "COO",          type: "edit" },
  { key: "Stock / Qty.", type: "edit" },
  { key: "Tariff Cost",  type: "edit" },
  { key: "Supplier Name",type: "edit" },
  { key: "Tipo",         type: "tier" },
  { key: "Price",        type: "edit" },
  { key: "Currency",     type: "edit" },
  { key: "Peso unit. (kg)", type: "edit" },
  { key: "View",         type: "view" },
];
const COL_COUNT = LAYOUT.length;
const TIER_META = {
  franquiciado: { cls: "tier-franquiciado", key: "tier_franquiciado" },
  broker:       { cls: "tier-broker",       key: "tier_broker" },
  agregador:    { cls: "tier-agregador",    key: "tier_agregador" },
};

/* ---------- utilidades ---------- */
// Separa múltiples part numbers SOLO por coma, punto y coma o salto de línea.
// (No por espacios, para preservar part numbers que contengan espacios u otros
// caracteres especiales.)
function parsePartNumbers(raw) {
  return raw.split(/[,;\n\r]+/).map((s) => s.trim()).filter(Boolean);
}
// Part numbers de la última búsqueda (para mantener enlaces/dorks tras limpiar
// la caja de búsqueda).
let lastPNs = [];
function pnSource() {
  const fromBox = parsePartNumbers(document.getElementById("partInput").value);
  return fromBox.length ? fromBox : lastPNs;
}
function buildUrl(template, pn) {
  return template.replace("{PN}", encodeURIComponent(pn));
}
function selectedRegions() {
  return [...document.querySelectorAll(".region-filter:checked")].map((c) => c.value);
}

/* ---------- enlaces por continente ---------- */
function renderLinks() {
  const container = document.getElementById("linksContainer");
  const pns = pnSource();
  const pn = pns[0] || "";
  const regions = selectedRegions();
  container.innerHTML = "";

  Object.entries(SITES).forEach(([key, group]) => {
    if (!regions.includes(key)) return;
    const groupEl = document.createElement("div");
    groupEl.className = "region-group";
    groupEl.innerHTML = `<h3>${group.label}</h3>`;
    const chips = document.createElement("div");
    chips.className = "chips";

    group.sites.forEach((site) => {
      const href = pn ? buildUrl(site.url, pn) : "#";
      const a = document.createElement("a");
      a.className = "chip" + (pn ? "" : " disabled");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      const tierTxt = t("tier_" + site.tier);
      a.innerHTML = `
        <span class="name">${site.name}</span>
        <span class="meta"><span class="tier-${site.tier}">${tierTxt}</span></span>
        <span class="meta">${site.country}</span>`;
      chips.appendChild(a);
    });
    groupEl.appendChild(chips);
    container.appendChild(groupEl);
  });
}

/* ---------- tabla de resultados ---------- */
function tierCellHtml(supplierName, explicitTier) {
  const tier = explicitTier ||
    (supplierName && supplierName.trim() ? classifySupplier(supplierName).tier : null);
  if (!tier) return '<span class="tier-badge tier-none">—</span>';
  const m = TIER_META[tier];
  return `<span class="tier-badge ${m.cls}">${t(m.key)}</span>`;
}

function addRow(data = {}) {
  const body = document.getElementById("resultsBody");
  const empty = body.querySelector(".empty-row");
  if (empty) empty.remove();

  const tr = document.createElement("tr");
  let supplierCell = null, tierCell = null;

  LAYOUT.forEach((col) => {
    const td = document.createElement("td");
    if (col.type === "edit") {
      td.contentEditable = "true";
      td.textContent = data[col.key] || "";
      td.dataset.col = col.key;
      if (col.key === "Supplier Name") supplierCell = td;
    } else if (col.type === "tier") {
      td.dataset.col = "Tipo";
      td.innerHTML = tierCellHtml(data["Supplier Name"], data["Tier"]);
      tierCell = td;
    } else if (col.type === "view") {
      const link = data["View"] || "";
      if (link) {
        td.innerHTML = `<a class="view-btn" href="${link}" target="_blank" rel="noopener">View</a>`;
      }
      const del = document.createElement("button");
      del.className = "row-del";
      del.title = "Eliminar fila";
      del.textContent = "✕";
      del.addEventListener("click", () => {
        tr.remove();
        if (!body.children.length) renderEmpty();
      });
      td.appendChild(del);
    }
    tr.appendChild(td);
  });

  // Re-clasificar "Tipo" al editar el nombre del proveedor
  if (supplierCell && tierCell) {
    supplierCell.addEventListener("input", () => {
      tierCell.innerHTML = tierCellHtml(supplierCell.textContent);
    });
  }
  body.appendChild(tr);
  return tr;
}

function renderEmpty() {
  const body = document.getElementById("resultsBody");
  body.innerHTML = `<tr class="empty-row"><td colspan="${COL_COUNT}">${t("empty_row")}</td></tr>`;
}

// Llena la tabla con una fila por plataforma (para cada Part Number).
// Part Number, Supplier Name, Tipo y View quedan listos; las columnas de
// stock/precio se completan con "Datos en vivo" o captura manual.
function fillFromPlatforms(pns) {
  const regions = selectedRegions();
  document.getElementById("resultsBody").innerHTML = "";
  let count = 0;
  pns.forEach((pn) => {
    Object.entries(SITES).forEach(([key, group]) => {
      if (!regions.includes(key)) return;
      group.sites.forEach((site) => {
        addRow({
          "Part Number": pn,
          "Supplier Name": site.name,
          "Tier": site.tier,
          "View": buildUrl(site.url, pn),
        });
        count++;
      });
    });
  });
  if (!count) renderEmpty();
}

function exportCSV() {
  const rows = [...document.querySelectorAll("#resultsBody tr")].filter((r) => !r.classList.contains("empty-row"));
  if (!rows.length) { alert(t("alert_noexport")); return; }

  const header = LAYOUT.map((c) => c.key);
  const lines = [header.join(",")];
  rows.forEach((tr) => {
    const cells = [...tr.querySelectorAll("td")];
    const vals = LAYOUT.map((col, i) => {
      if (col.type === "view") {
        const a = cells[i].querySelector("a");
        return csvCell(a ? a.href : "");
      }
      if (col.type === "tier") {
        return csvCell(cells[i].textContent.replace(/[✅⚠️]/g, "").trim());
      }
      return csvCell(cells[i].textContent);
    });
    lines.push(vals.join(","));
  });

  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "componentsource_sourcing.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
function csvCell(v) {
  v = (v || "").trim();
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/* ---------- datos en vivo (backend Nexar/Octopart) ---------- */
function setLiveStatus(msg, kind) {
  const el = document.getElementById("liveStatus");
  el.hidden = false;
  el.className = "live-status " + (kind || "");
  el.textContent = msg;
}

async function fetchLive(auto) {
  const cfg = document.getElementById("liveConfig");
  const backend = document.getElementById("backendUrl").value.trim();
  if (!backend) {
    if (auto) return;                 // en modo automático no molestamos
    cfg.hidden = false;
    setLiveStatus(t("st_need_backend"), "warn");
    return;
  }
  const pns = parsePartNumbers(document.getElementById("partInput").value);
  if (!pns.length) { if (!auto) setLiveStatus(t("st_need_pn"), "warn"); return; }

  setLiveStatus(t("st_loading"), "loading");
  try {
    const url = backend.replace(/\/$/, "") + "/api/search?q=" + encodeURIComponent(pns.join(","));
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const offers = data.offers || [];

    // Con datos en vivo, mostramos directo las ofertas reales (ordenadas por el
    // backend: autorizados primero, luego por stock), en vez de las filas de
    // plataformas. Para navegar a los agregadores está la sección de enlaces.
    const body = document.getElementById("resultsBody");
    body.innerHTML = "";
    offers.forEach((o) => {
      const tr = addRow(offerToData(o));
      tr.classList.add("live-filled");
    });

    // Marca como "No encontrado" cada Part Number buscado que no tuvo ninguna
    // oferta (p. ej. por un espacio/carácter de más). Compara ignorando
    // espacios y símbolos.
    const norm = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const foundNorm = offers.map((o) => norm(o.partNumber));
    const notFound = pns.filter((pn) => {
      const n = norm(pn);
      return n && !foundNorm.some((f) => f && (f.includes(n) || n.includes(f)));
    });
    notFound.forEach(addNotFoundRow);
    if (!body.children.length) renderEmpty();

    const prov = data.provider ? " (" + data.provider + ")" : "";
    if (offers.length) {
      setLiveStatus(t("st_loaded").replace("{n}", offers.length) + prov +
        (notFound.length ? " · " + t("st_notfound_n").replace("{n}", notFound.length) : ""), "ok");
    } else {
      setLiveStatus(t("st_none"), "warn");
    }
  } catch (err) {
    setLiveStatus(t("st_error") + err.message + t("st_error_tail"), "warn");
  }
}

// Fila roja "No encontrado" para un Part Number sin resultados.
function addNotFoundRow(pn) {
  const tr = addRow({ "Part Number": pn, "Description": t("not_found_hint"), "Supplier Name": "—" });
  tr.classList.add("not-found");
  const tipo = tr.querySelector('td[data-col="Tipo"]');
  if (tipo) tipo.innerHTML = '<span class="tier-badge tier-error">' + t("not_found") + "</span>";
  return tr;
}

function offerToData(o) {
  return {
    "Part Number": o.partNumber || "", "Mfr": o.mfr || "", "DC": o.dateCode || "",
    "Description": o.description || "", "COO": o.coo || "",
    "Stock / Qty.": o.stock != null ? String(o.stock) : "",
    "Tariff Cost": o.tariffCost || "", "Supplier Name": o.supplier || "",
    "Tier": o.tier, "Price": o.price != null ? String(o.price) : "",
    "Currency": o.currency || "",
    "Peso unit. (kg)": o.weightKg != null ? String(o.weightKg) : "",
    "View": o.url || "",
  };
}

/* ---------- Google Dorks ---------- */
function renderDorks() {
  const pns = pnSource();
  const pn = pns[0] || "[PART_NUMBER]";
  const q = `"${pn}"`;
  const dorks = [
    { label: t("dork_stock"), text: `${q} (stock OR inventory OR "in stock") (buy OR price OR quote)` },
    { label: t("dork_excess"), text: `${q} (surplus OR excess OR "obsolete" OR "end of life")` },
    { label: t("dork_asia"), text: `${q} (stock OR price) (site:.cn OR site:.hk OR lcsc.com OR utsource.net)` },
    { label: t("dork_europe"), text: `${q} (stock OR price OR lager OR prix) (site:.de OR site:.uk OR site:.eu)` },
    { label: t("dork_america"), text: `${q} (stock OR price OR quote) (site:.com OR site:.mx OR site:.ca)` },
    { label: t("dork_datasheet"), text: `${q} datasheet filetype:pdf` },
    { label: t("dork_excel"), text: `${q} (stock OR inventory) (filetype:xls OR filetype:xlsx OR filetype:csv)` },
  ];
  const list = document.getElementById("dorksList");
  list.innerHTML = "";
  dorks.forEach((d) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong style="font-family:sans-serif;font-size:12px;color:var(--muted)">${d.label}:</strong> ${d.text}`;
    li.addEventListener("click", () => {
      navigator.clipboard?.writeText(d.text);
      const tag = document.createElement("span");
      tag.className = "copied"; tag.textContent = t("copied");
      li.appendChild(tag);
      setTimeout(() => tag.remove(), 1200);
      window.open("https://www.google.com/search?q=" + encodeURIComponent(d.text), "_blank", "noopener");
    });
    list.appendChild(li);
  });
}

/* ---------- subida de archivos ---------- */
// Extrae part numbers de texto: una línea = un PN; si la línea es CSV/TSV toma
// la primera columna; ignora encabezados comunes.
function extractPNsFromText(text) {
  const out = [];
  String(text || "").split(/\r?\n/).forEach((line) => {
    const first = line.split(/[,;\t]/)[0].trim().replace(/^["']|["']$/g, "");
    if (!first) return;
    if (/^(part\s*number|part\s*no\.?|mpn|number|p\/n|sku)$/i.test(first)) return;
    out.push(first);
  });
  return out;
}
function handleFiles(files) {
  const list = [...files];
  if (!list.length) return;
  let pending = list.length;
  const all = [];
  const done = () => {
    if (--pending > 0) return;
    const uniq = [...new Set(all)];
    if (!uniq.length) { setLiveStatus(t("st_file_none"), "warn"); return; }
    document.getElementById("partInput").value = uniq.join(", ");
    doSearch();
  };
  list.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => { all.push(...extractPNsFromText(reader.result)); done(); };
    reader.onerror = done;
    reader.readAsText(file);
  });
}

/* ---------- búsqueda ---------- */
function doSearch() {
  const pns = parsePartNumbers(document.getElementById("partInput").value);
  if (!pns.length) { renderLinks(); renderDorks(); return; }
  lastPNs = pns;                       // recordar para enlaces/dorks tras limpiar
  renderLinks();
  renderDorks();

  fillFromPlatforms(pns);
  // Si hay backend configurado, superpone stock/precio reales automáticamente.
  // (fetchLive lee los part numbers de forma síncrona antes de limpiar la caja.)
  if (document.getElementById("backendUrl").value.trim()) fetchLive(true);
  else setLiveStatus(t("connect_hint"), "info");

  if (document.getElementById("openAll").checked) {
    const pn = pns[0];
    const regions = selectedRegions();
    let opened = 0;
    Object.entries(SITES).forEach(([key, group]) => {
      if (!regions.includes(key)) return;
      group.sites.forEach((site) => {
        if (opened < 12) { window.open(buildUrl(site.url, pn), "_blank", "noopener"); opened++; }
      });
    });
    if (opened >= 12) { alert(t("alert_openall")); }
  }

  // Limpiar la caja de búsqueda (los enlaces/dorks/tabla ya quedaron con el valor).
  document.getElementById("partInput").value = "";
}

/* ---------- herramientas: convertidores ---------- */
function fmtNum(n) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(LANG === "en" ? "en-US" : "es-MX",
    { maximumFractionDigits: 6, minimumFractionDigits: 0 });
}

function convertWeight() {
  const v = parseFloat(document.getElementById("wIn").value);
  const from = parseFloat(document.getElementById("wFrom").value);
  const to = parseFloat(document.getElementById("wTo").value);
  const out = document.getElementById("wResult");
  if (!isFinite(v)) { out.textContent = "—"; return; }
  const grams = v * from;
  const res = grams / to;
  const uFrom = document.getElementById("wFrom").selectedOptions[0].textContent;
  const uTo = document.getElementById("wTo").selectedOptions[0].textContent;
  out.textContent = `${fmtNum(v)} ${uFrom} = ${fmtNum(res)} ${uTo}`;
}

// Tipo de cambio: base USD desde frankfurter.app (gratis, sin key, CORS ok).
let FX = null;
async function loadFX() {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=MXN,EUR,GBP,CNY,JPY");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    FX = Object.assign({ USD: 1 }, data.rates || {});
    FX._date = data.date || "";
  } catch (e) {
    FX = null;
  }
  convertCurrency();
}
function convertCurrency() {
  const v = parseFloat(document.getElementById("cIn").value);
  const from = document.getElementById("cFrom").value;
  const to = document.getElementById("cTo").value;
  const out = document.getElementById("cResult");
  const rateEl = document.getElementById("cRate");
  if (!FX) { out.textContent = "—"; rateEl.textContent = t("conv_rate_fail"); return; }
  if (!isFinite(v) || !FX[from] || !FX[to]) { out.textContent = "—"; return; }
  const usd = v / FX[from];
  const res = usd * FX[to];
  out.textContent = `${fmtNum(v)} ${from} = ${fmtNum(res)} ${to}`;
  const oneRate = FX[to] / FX[from];
  rateEl.textContent = `1 ${from} = ${fmtNum(oneRate)} ${to} · ${t("conv_rate_note")}${FX._date ? " " + FX._date : ""}`;
}

/* ---------- peso unitario masivo ---------- */
function parseWtLines(text) {
  return String(text || "").split(/\r?\n/).map((l) => {
    const parts = l.split(/[,;\t]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return null;
    return { mpn: parts[0], mfr: parts[1] || "" };
  }).filter(Boolean).filter((x) => !/^(part\s*number|mpn|number)$/i.test(x.mpn));
}
function setWtStatus(msg, kind) {
  const el = document.getElementById("wtStatus");
  el.hidden = false;
  el.className = "live-status " + (kind || "");
  el.textContent = msg;
}
function addWtRow(pn, mfr, w) {
  const tr = document.createElement("tr");
  [pn, mfr || "—", w != null ? String(w) : "—"].forEach((c) => {
    const td = document.createElement("td");
    td.textContent = c;
    tr.appendChild(td);
  });
  const st = document.createElement("td");
  if (w != null) st.innerHTML = '<span class="tier-badge tier-franquiciado">' + t("wt_found") + "</span>";
  else { st.innerHTML = '<span class="tier-badge tier-error">' + t("wt_nodata") + "</span>"; tr.classList.add("not-found"); }
  tr.appendChild(st);
  document.getElementById("wtBody").appendChild(tr);
}
async function doWeightSearch() {
  const backend = document.getElementById("backendUrl").value.trim();
  if (!backend) { setWtStatus(t("wt_need_backend"), "warn"); return; }
  const lines = parseWtLines(document.getElementById("wtInput").value);
  if (!lines.length) { setWtStatus(t("wt_empty"), "warn"); return; }
  setWtStatus(t("wt_loading"), "loading");
  try {
    const mpns = [...new Set(lines.map((l) => l.mpn))];
    const url = backend.replace(/\/$/, "") + "/api/search?q=" + encodeURIComponent(mpns.join(","));
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const offers = data.offers || [];
    const norm = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    document.getElementById("wtBody").innerHTML = "";
    let found = 0;
    lines.forEach((line) => {
      const n = norm(line.mpn), nm = norm(line.mfr);
      const matches = offers.filter((o) => {
        const on = norm(o.partNumber);
        return on && (on.includes(n) || n.includes(on));
      });
      let pick = null;
      if (nm) pick = matches.find((o) => o.weightKg != null && norm(o.mfr).includes(nm)) ||
                     matches.find((o) => norm(o.mfr).includes(nm));
      if (!pick) pick = matches.find((o) => o.weightKg != null) || matches[0] || null;
      const w = pick && pick.weightKg != null ? pick.weightKg : null;
      if (w != null) found++;
      addWtRow(line.mpn, (pick && pick.mfr) || line.mfr || "", w);
    });
    setWtStatus(t("wt_done").replace("{n}", found).replace("{t}", lines.length), found ? "ok" : "warn");
  } catch (err) {
    setWtStatus(t("st_error") + err.message, "warn");
  }
}
function exportWt() {
  const rows = [...document.querySelectorAll("#wtBody tr")];
  if (!rows.length) { alert(t("alert_noexport")); return; }
  const lines = ["Part Number,Mfr,Peso unit. (kg)"];
  rows.forEach((tr) => {
    const c = [...tr.querySelectorAll("td")];
    lines.push([c[0], c[1], c[2]].map((x) => csvCell(x.textContent)).join(","));
  });
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "pesos_unitarios.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- Pegar HTML (Mouser) — extracción sin API ---------- */
function weightStrToKg(str) {
  const s = String(str || "").toLowerCase();
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  if (!isFinite(n) || n <= 0) return null;
  if (s.includes("kg")) return n;
  if (s.includes("mg")) return n / 1e6;
  if (s.includes("oz")) return n * 0.0283495;
  if (s.includes("lb")) return n * 0.453592;
  if (s.includes("g")) return n / 1000;
  return null;
}
function parseMouserHtml(html) {
  const raw = String(html || "");
  const o = {
    partNumber: "", mfr: "", description: "", coo: "", stock: null,
    tariffCost: "", price: null, currency: "", weightKg: null,
    supplier: "Mouser Electronics", tier: "franquiciado", authorized: true, url: "",
  };
  // 1) JSON-LD Product (lo más confiable) vía DOMParser.
  try {
    const doc = new DOMParser().parseFromString(raw, "text/html");
    doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      try {
        const j = JSON.parse(s.textContent.trim());
        if (j && j["@type"] === "Product") {
          o.partNumber = j.mpn || o.partNumber;
          o.mfr = j.brand || o.mfr;
          o.description = j.description || o.description;
          const of = j.offers || {};
          if (of.price != null) o.price = parseFloat(of.price);
          if (of.priceCurrency) o.currency = of.priceCurrency;
          if (of.inventoryLevel != null) o.stock = parseInt(String(of.inventoryLevel).replace(/[^0-9]/g, ""), 10);
          if (of.url) o.url = of.url;
        }
      } catch (e) {}
    });
    const dsc = doc.querySelector("#spnDescription"); if (dsc) o.description = dsc.textContent.trim();
    const mp = doc.querySelector("#spnManufacturerPartNumber"); if (mp && !o.partNumber) o.partNumber = mp.textContent.trim();
    doc.querySelectorAll(".specs-table tr, table.specs-table tr").forEach((tr) => {
      const tds = tr.querySelectorAll("td");
      if (tds.length < 2) return;
      if ((tds[0].textContent || "").trim().toLowerCase().indexOf("unit weight") > -1) {
        const w = weightStrToKg(tds[1].textContent); if (w) o.weightKg = w;
      }
    });
  } catch (e) {}
  // 2) Respaldos por regex (si pegaron texto plano o faltó algo).
  const m = (re) => { const x = raw.match(re); return x ? x[1] : null; };
  if (!o.partNumber) o.partNumber = (m(/"mpn"\s*:\s*"([^"]+)"/) || "").trim();
  if (!o.mfr) o.mfr = (m(/"brand"\s*:\s*"([^"]+)"/) || "").trim();
  if (o.price == null) { const p = m(/"price"\s*:\s*"?([\d.]+)"?/); if (p) o.price = parseFloat(p); }
  if (!o.currency) o.currency = m(/"priceCurrency"\s*:\s*"([^"]+)"/) || "USD";
  if (o.stock == null) { const s = m(/"inventoryLevel"\s*:\s*"?([\d,]+)"?/) || m(/In Stock:\s*([\d,]+)/i); if (s) o.stock = parseInt(s.replace(/[^0-9]/g, ""), 10); }
  if (o.weightKg == null) { const w = m(/unit weight[\s\S]{0,120}?([0-9.]+\s*(?:oz|mg|kg|lb|g))/i); if (w) o.weightKg = weightStrToKg(w); }
  if (!o.coo) { const c = m(/country of origin[\s\S]{0,300}?<dd[^>]*>\s*([^<]+?)\s*<\/dd>/i); if (c) o.coo = c.trim(); }
  return (o.partNumber || o.price != null || o.weightKg != null) ? o : null;
}
function doPasteHtml() {
  const el = document.getElementById("htmlStatus");
  const set = (msg, k) => { el.hidden = false; el.className = "live-status " + (k || ""); el.textContent = msg; };
  const html = document.getElementById("htmlInput").value;
  if (!html.trim()) { set(t("ph_fail"), "warn"); return; }
  const o = parseMouserHtml(html);
  if (!o) { set(t("ph_fail"), "warn"); return; }
  const tr = addRow(offerToData(o));
  tr.classList.add("live-filled");
  set(t("ph_ok"), "ok");
  document.getElementById("htmlInput").value = "";
}

/* ---------- init ---------- */
// Re-render del contenido dinámico cuando cambia el idioma.
window.onLangChange = () => {
  renderLinks();
  renderDorks();
  if (document.querySelector("#resultsBody .empty-row")) renderEmpty();
  if (typeof convertWeight === "function") { convertWeight(); convertCurrency(); }
};

document.addEventListener("DOMContentLoaded", () => {
  applyI18n();
  renderEmpty();
  renderLinks();
  renderDorks();

  document.querySelectorAll(".lang-btn").forEach((b) =>
    b.addEventListener("click", () => setLang(b.dataset.lang)));
  document.getElementById("searchBtn").addEventListener("click", doSearch);
  document.getElementById("partInput").addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
  document.getElementById("partInput").addEventListener("input", () => { renderLinks(); renderDorks(); });
  document.querySelectorAll(".region-filter").forEach((c) => c.addEventListener("change", renderLinks));
  document.getElementById("addRowBtn").addEventListener("click", () => addRow());
  document.getElementById("exportBtn").addEventListener("click", exportCSV);
  document.getElementById("fetchLiveBtn").addEventListener("click", () => fetchLive(false));

  // Pegar HTML (Mouser) — extracción sin API.
  document.getElementById("htmlBtn").addEventListener("click", doPasteHtml);

  // Subir archivo(s) con part numbers.
  const fileInput = document.getElementById("fileInput");
  document.getElementById("fileBtn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
    fileInput.value = ""; // permite re-seleccionar el mismo archivo
  });

  // Backend de datos en vivo: recordar la URL entre sesiones.
  const backendInput = document.getElementById("backendUrl");
  const liveConfig = document.getElementById("liveConfig");
  liveConfig.hidden = false; // visible siempre para que se pueda pegar la URL
  try {
    const saved = localStorage.getItem("cs_backend");
    if (saved) backendInput.value = saved;
  } catch (e) {}
  backendInput.addEventListener("input", () => {
    try { localStorage.setItem("cs_backend", backendInput.value.trim()); } catch (e) {}
  });
  // Aviso inicial si aún no hay fuente de datos conectada.
  if (!backendInput.value.trim()) setLiveStatus(t("connect_hint"), "info");

  // Convertidores.
  ["wIn", "wFrom", "wTo"].forEach((id) =>
    document.getElementById(id).addEventListener("input", convertWeight));
  ["cIn", "cFrom", "cTo"].forEach((id) =>
    document.getElementById(id).addEventListener("input", convertCurrency));
  convertWeight();
  loadFX();

  // Peso unitario masivo.
  document.getElementById("wtBtn").addEventListener("click", doWeightSearch);
  document.getElementById("wtExport").addEventListener("click", exportWt);
});
