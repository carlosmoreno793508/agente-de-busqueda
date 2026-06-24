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
  franquiciado: { cls: "tier-franquiciado", text: "✅ Franquiciado" },
  broker:       { cls: "tier-broker",       text: "⚠️ Broker" },
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
      const tierTxt = site.tier === "franquiciado" ? "✅ Franquiciado"
        : site.tier === "broker" ? "⚠️ Broker" : "🔁 Agregador";
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
function tierCellHtml(supplierName) {
  if (!supplierName || !supplierName.trim()) return '<span class="tier-badge tier-none">—</span>';
  const c = classifySupplier(supplierName);
  const m = TIER_META[c.tier];
  return `<span class="tier-badge ${m.cls}" title="${c.risk}">${m.text}</span>`;
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
      td.innerHTML = tierCellHtml(data["Supplier Name"]);
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
  body.innerHTML = `<tr class="empty-row"><td colspan="${COL_COUNT}">
    Aún no hay resultados. Pulsa “⚡ Datos en vivo” para traer ofertas reales, “+ Fila manual” para capturar,
    o “Buscar” para abrir las plataformas.</td></tr>`;
}

function exportCSV() {
  const rows = [...document.querySelectorAll("#resultsBody tr")].filter((r) => !r.classList.contains("empty-row"));
  if (!rows.length) { alert("No hay filas para exportar."); return; }

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

async function fetchLive() {
  const cfg = document.getElementById("liveConfig");
  const backend = document.getElementById("backendUrl").value.trim();
  if (!backend) {
    cfg.hidden = false;
    setLiveStatus("Pega la URL del backend y vuelve a pulsar “Datos en vivo”.", "warn");
    return;
  }
  const pns = parsePartNumbers(document.getElementById("partInput").value);
  if (!pns.length) { setLiveStatus("Escribe al menos un Part Number.", "warn"); return; }

  setLiveStatus("Consultando ofertas en vivo…", "loading");
  try {
    const url = backend.replace(/\/$/, "") + "/api/search?q=" + encodeURIComponent(pns.join(","));
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const offers = data.offers || [];
    if (!offers.length) { setLiveStatus("Sin ofertas para ese(os) Part Number.", "warn"); return; }

    document.getElementById("resultsBody").innerHTML = "";
    offers.forEach((o) => addRow({
      "Part Number":  o.partNumber || "",
      "Mfr":          o.mfr || "",
      "DC":           o.dateCode || "",
      "Description":  o.description || "",
      "COO":          o.coo || "",
      "Stock / Qty.": o.stock != null ? String(o.stock) : "",
      "Tariff Cost":  o.tariffCost || "",
      "Supplier Name":o.supplier || "",
      "Price":        o.price != null ? String(o.price) : "",
      "Currency":     o.currency || "",
      "View":         o.url || "",
    }));
    setLiveStatus(`${offers.length} ofertas cargadas.`, "ok");
  } catch (err) {
    setLiveStatus("Error al consultar el backend: " + err.message +
      ". Verifica que el proxy esté corriendo y la URL sea correcta.", "warn");
  }
}

/* ---------- Google Dorks ---------- */
function renderDorks() {
  const pns = parsePartNumbers(document.getElementById("partInput").value);
  const pn = pns[0] || "[PART_NUMBER]";
  const q = `"${pn}"`;
  const dorks = [
    { label: "Distribuidores con stock", text: `${q} (stock OR inventory OR "in stock") (buy OR price OR quote)` },
    { label: "Excedentes / obsoletos", text: `${q} (surplus OR excess OR "obsolete" OR "end of life")` },
    { label: "Asia (China/HK)", text: `${q} (stock OR price) (site:.cn OR site:.hk OR lcsc.com OR utsource.net)` },
    { label: "Europa", text: `${q} (stock OR price OR lager OR prix) (site:.de OR site:.uk OR site:.eu)` },
    { label: "América", text: `${q} (stock OR price OR quote) (site:.com OR site:.mx OR site:.ca)` },
    { label: "Hoja de datos (PDF)", text: `${q} datasheet filetype:pdf` },
    { label: "Listas de excedentes (Excel)", text: `${q} (stock OR inventory) (filetype:xls OR filetype:xlsx OR filetype:csv)` },
  ];
  const list = document.getElementById("dorksList");
  list.innerHTML = "";
  dorks.forEach((d) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong style="font-family:sans-serif;font-size:12px;color:var(--muted)">${d.label}:</strong> ${d.text}`;
    li.addEventListener("click", () => {
      navigator.clipboard?.writeText(d.text);
      const tag = document.createElement("span");
      tag.className = "copied"; tag.textContent = "✓ copiado";
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
    if (opened >= 12) {
      alert("Se abrieron las primeras 12 plataformas (límite para no saturar el navegador). Usa los botones para abrir el resto.");
    }
  }
}

/* ---------- init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderEmpty();
  renderLinks();
  renderDorks();

  document.getElementById("searchBtn").addEventListener("click", doSearch);
  document.getElementById("partInput").addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
  document.getElementById("partInput").addEventListener("input", () => { renderLinks(); renderDorks(); });
  document.querySelectorAll(".region-filter").forEach((c) => c.addEventListener("change", renderLinks));
  document.getElementById("addRowBtn").addEventListener("click", () => addRow());
  document.getElementById("exportBtn").addEventListener("click", exportCSV);
  document.getElementById("fetchLiveBtn").addEventListener("click", fetchLive);
});
