/* ComponentSource AI — lógica de la app (sin dependencias, 100% cliente) */

const COLUMNS = ["Part Number", "Mfr", "DC", "Description", "COO",
  "Stock / Qty.", "Tariff Cost", "Supplier Name", "Price", "Currency"];

/* ---------- utilidades ---------- */
function parsePartNumbers(raw) {
  return raw
    .split(/[\s,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
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
  const pn = pns[0] || ""; // los chips usan el primer PN
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
      const typeClass = site.type === "Agregador" ? "type-agg" : "type-dist";
      a.innerHTML = `
        <span class="name">${site.name}</span>
        <span class="meta"><span class="${typeClass}">${site.type}</span> · ${site.country}</span>`;
      chips.appendChild(a);
    });

    groupEl.appendChild(chips);
    container.appendChild(groupEl);
  });
}

/* ---------- tabla de resultados ---------- */
function addRow(data = {}) {
  const body = document.getElementById("resultsBody");
  const empty = body.querySelector(".empty-row");
  if (empty) empty.remove();

  const tr = document.createElement("tr");
  COLUMNS.forEach((col) => {
    const td = document.createElement("td");
    td.contentEditable = "true";
    td.textContent = data[col] || "";
    td.dataset.col = col;
    tr.appendChild(td);
  });

  // columna View
  const viewTd = document.createElement("td");
  const link = data["View"] || "";
  viewTd.innerHTML = link
    ? `<a class="view-btn" href="${link}" target="_blank" rel="noopener">View</a>`
    : `<button class="row-del" title="Eliminar fila">✕</button>`;
  if (link) {
    const del = document.createElement("button");
    del.className = "row-del";
    del.title = "Eliminar fila";
    del.textContent = "✕";
    viewTd.appendChild(del);
  }
  tr.appendChild(viewTd);

  viewTd.querySelector(".row-del").addEventListener("click", () => {
    tr.remove();
    if (!body.children.length) renderEmpty();
  });

  body.appendChild(tr);
}

function renderEmpty() {
  const body = document.getElementById("resultsBody");
  body.innerHTML = `<tr class="empty-row"><td colspan="11">
    Aún no hay resultados. Usa “Buscar” para abrir las plataformas y captura aquí lo que encuentres,
    o pulsa “+ Fila manual”.</td></tr>`;
}

function exportCSV() {
  const rows = [...document.querySelectorAll("#resultsBody tr")].filter((r) => !r.classList.contains("empty-row"));
  if (!rows.length) { alert("No hay filas para exportar."); return; }

  const header = [...COLUMNS, "View"];
  const lines = [header.join(",")];
  rows.forEach((tr) => {
    const cells = [...tr.querySelectorAll("td")];
    const vals = COLUMNS.map((_, i) => csvCell(cells[i].textContent));
    const viewLink = cells[COLUMNS.length].querySelector("a");
    vals.push(csvCell(viewLink ? viewLink.href : ""));
    lines.push(vals.join(","));
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
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
      tag.className = "copied";
      tag.textContent = "✓ copiado";
      li.appendChild(tag);
      setTimeout(() => tag.remove(), 1200);
      // abrir Google directamente
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
    const pns = parsePartNumbers(document.getElementById("partInput").value);
    const pn = pns[0];
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
  document.getElementById("partInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  });
  document.getElementById("partInput").addEventListener("input", () => {
    renderLinks();
    renderDorks();
  });
  document.querySelectorAll(".region-filter").forEach((c) =>
    c.addEventListener("change", renderLinks)
  );
  document.getElementById("addRowBtn").addEventListener("click", () => addRow());
  document.getElementById("exportBtn").addEventListener("click", exportCSV);
});
