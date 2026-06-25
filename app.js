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
  { key: "View",         type: "view" },
];
const COL_COUNT = LAYOUT.length;
const TIER_META = {
  franquiciado: { cls: "tier-franquiciado", key: "tier_franquiciado" },
  broker:       { cls: "tier-broker",       key: "tier_broker" },
  agregador:    { cls: "tier-agregador",    key: "tier_agregador" },
};

/* ---------- utilidades ---------- */
function parsePartNumbers(raw) {
  return raw.split(/[\s,;\n]+/).map((s) => s.trim()).filter(Boolean);
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
  const pns = parsePartNumbers(document.getElementById("partInput").value);
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
    if (!offers.length) { setLiveStatus(t("st_none"), "warn"); return; }

    // Con datos en vivo, mostramos directo las ofertas reales (ordenadas por el
    // backend: autorizados primero, luego por stock), en vez de las filas de
    // plataformas. Para navegar a los agregadores está la sección de enlaces.
    const body = document.getElementById("resultsBody");
    body.innerHTML = "";
    offers.forEach((o) => {
      const tr = addRow(offerToData(o));
      tr.classList.add("live-filled");
    });
    const prov = data.provider ? " (" + data.provider + ")" : "";
    setLiveStatus(t("st_loaded").replace("{n}", offers.length) + prov, "ok");
  } catch (err) {
    setLiveStatus(t("st_error") + err.message + t("st_error_tail"), "warn");
  }
}

function offerToData(o) {
  return {
    "Part Number": o.partNumber || "", "Mfr": o.mfr || "", "DC": o.dateCode || "",
    "Description": o.description || "", "COO": o.coo || "",
    "Stock / Qty.": o.stock != null ? String(o.stock) : "",
    "Tariff Cost": o.tariffCost || "", "Supplier Name": o.supplier || "",
    "Tier": o.tier, "Price": o.price != null ? String(o.price) : "",
    "Currency": o.currency || "", "View": o.url || "",
  };
}

/* ---------- Google Dorks ---------- */
function renderDorks() {
  const pns = parsePartNumbers(document.getElementById("partInput").value);
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

/* ---------- búsqueda ---------- */
function doSearch() {
  renderLinks();
  renderDorks();
  const pns = parsePartNumbers(document.getElementById("partInput").value);
  if (pns.length) {
    fillFromPlatforms(pns);
    // Si hay backend configurado, superpone stock/precio reales automáticamente.
    if (document.getElementById("backendUrl").value.trim()) fetchLive(true);
    else setLiveStatus(t("connect_hint"), "info");
  }
  if (document.getElementById("openAll").checked) {
    const pn = parsePartNumbers(document.getElementById("partInput").value)[0];
    if (!pn) return;
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
}

/* ---------- init ---------- */
// Re-render del contenido dinámico cuando cambia el idioma.
window.onLangChange = () => {
  renderLinks();
  renderDorks();
  if (document.querySelector("#resultsBody .empty-row")) renderEmpty();
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
});
