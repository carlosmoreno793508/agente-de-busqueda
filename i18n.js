/* Internacionalización ES / EN. Default: español. Persiste en localStorage. */

const I18N = {
  es: {
    tagline: "Buscador global de componentes electrónicos · Sourcing Manager",
    search_label: "Part Number(s)",
    search_hint: 'Escribe uno o varios números de parte separados por coma, espacio o salto de línea (ej: <code>CM5104032, NE555, STM32F103C8T6</code>).',
    search_ph: "Ingresa el Part Number…",
    btn_search: "Buscar",
    f_global: "Globales", f_america: "América", f_europe: "Europa", f_asia: "Asia/Pacífico",
    f_openall: "Abrir todos en pestañas nuevas",
    results_title: "Resultados de inventario",
    btn_live: "⚡ Datos en vivo (Nexar)",
    btn_addrow: "+ Fila manual",
    btn_export: "⬇ Exportar CSV",
    legend_franq: "✅ Franquiciado", legend_franq_desc: "autorizado por el fabricante · trazabilidad y garantía",
    legend_broker: "⚠️ Broker", legend_broker_desc: "mercado abierto / excedente · verifica autenticidad",
    results_hint: 'Esta tabla es tu <strong>hoja de sourcing</strong>. La columna <strong>Tipo</strong> marca automáticamente si el proveedor es <strong>Franquiciado</strong> o <strong>Broker</strong> (igual que la separación “In-Stock” vs “Brokered” de NetComponents). Captura manualmente, pulsa “Datos en vivo” para traer ofertas reales vía la API de Nexar/Octopart, o usa “Buscar” para abrir las plataformas.',
    live_ph: "URL del backend (ej: http://localhost:8787)",
    live_hint: 'Levanta el proxy en <code>server/</code> (ver README) y pega su URL aquí.',
    th_tipo: "Tipo",
    links_title: "Enlaces de búsqueda directa por continente",
    links_hint: "Cada botón abre la búsqueda del Part Number en esa plataforma. Marca/desmarca regiones arriba.",
    dorks_title: "Estrategia de búsqueda avanzada (Google Dorks)",
    dorks_hint: "Comandos para rastrear distribuidores independientes y excedentes. Click para copiar y abrir.",
    footer: "ComponentSource AI · Herramienta de abastecimiento. Verifica siempre stock, fechas (DC) y origen (COO) directamente con el proveedor antes de comprar.",
    guide_title: "📖 Guía de uso rápida",
    guide_html: `
      <ol>
        <li><strong>Escribe el Part Number</strong> en el buscador (puedes poner varios separados por coma) y pulsa <strong>Buscar</strong>.</li>
        <li><strong>Enlaces por continente:</strong> abajo aparecen botones por región. Cada uno abre la búsqueda de esa pieza en esa plataforma. Filtra regiones con las casillas.</li>
        <li><strong>Tabla de sourcing:</strong> captura lo que encuentres (o usa <em>Datos en vivo</em>). La columna <strong>Tipo</strong> marca sola si el proveedor es ✅ <strong>Franquiciado</strong> (autorizado, seguro) o ⚠️ <strong>Broker</strong> (mercado abierto, verifica antes de comprar).</li>
        <li><strong>Exporta a CSV</strong> para compartir o cotizar.</li>
        <li><strong>Google Dorks:</strong> haz click en un comando para buscar excedentes y distribuidores independientes en Google.</li>
      </ol>
      <p class="guide-note">⚠️ Regla de oro: ante la duda, un <strong>Broker</strong> requiere inspección antifalsificación. Verifica siempre stock, Date Code (DC) y origen (COO) con el proveedor antes de comprar.</p>`,
    tier_franquiciado: "✅ Franquiciado", tier_broker: "⚠️ Broker", tier_agregador: "🔁 Agregador",
    empty_row: "Aún no hay resultados. Pulsa “⚡ Datos en vivo” para traer ofertas reales, “+ Fila manual” para capturar, o “Buscar” para abrir las plataformas.",
    dork_stock: "Distribuidores con stock", dork_excess: "Excedentes / obsoletos",
    dork_asia: "Asia (China/HK)", dork_europe: "Europa", dork_america: "América",
    dork_datasheet: "Hoja de datos (PDF)", dork_excel: "Listas de excedentes (Excel)",
    copied: "✓ copiado",
    st_need_backend: "Pega la URL del backend y vuelve a pulsar “Datos en vivo”.",
    st_need_pn: "Escribe al menos un Part Number.",
    st_loading: "Consultando ofertas en vivo…",
    st_none: "Sin ofertas para ese(os) Part Number.",
    st_loaded: "{n} ofertas cargadas.",
    st_error: "Error al consultar el backend: ",
    st_error_tail: ". Verifica que el proxy esté corriendo y la URL sea correcta.",
    alert_openall: "Se abrieron las primeras 12 plataformas (límite para no saturar el navegador). Usa los botones para abrir el resto.",
    alert_noexport: "No hay filas para exportar.",
  },

  en: {
    tagline: "Global electronic component search · Sourcing Manager",
    search_label: "Part Number(s)",
    search_hint: 'Type one or more part numbers separated by comma, space or new line (e.g. <code>CM5104032, NE555, STM32F103C8T6</code>).',
    search_ph: "Enter the Part Number…",
    btn_search: "Search",
    f_global: "Global", f_america: "Americas", f_europe: "Europe", f_asia: "Asia/Pacific",
    f_openall: "Open all in new tabs",
    results_title: "Inventory results",
    btn_live: "⚡ Live data (Nexar)",
    btn_addrow: "+ Manual row",
    btn_export: "⬇ Export CSV",
    legend_franq: "✅ Franchised", legend_franq_desc: "manufacturer-authorized · traceability & warranty",
    legend_broker: "⚠️ Broker", legend_broker_desc: "open market / excess · verify authenticity",
    results_hint: 'This table is your <strong>sourcing sheet</strong>. The <strong>Type</strong> column automatically flags whether the supplier is <strong>Franchised</strong> or <strong>Broker</strong> (just like NetComponents’ “In-Stock” vs “Brokered” split). Capture manually, hit “Live data” to pull real offers via the Nexar/Octopart API, or use “Search” to open the platforms.',
    live_ph: "Backend URL (e.g. http://localhost:8787)",
    live_hint: 'Run the proxy in <code>server/</code> (see README) and paste its URL here.',
    th_tipo: "Type",
    links_title: "Direct search links by continent",
    links_hint: "Each button opens the part number search on that platform. Toggle regions above.",
    dorks_title: "Advanced search strategy (Google Dorks)",
    dorks_hint: "Commands to track independent distributors and excess stock. Click to copy and open.",
    footer: "ComponentSource AI · Sourcing tool. Always verify stock, date code (DC) and origin (COO) directly with the supplier before buying.",
    guide_title: "📖 Quick start guide",
    guide_html: `
      <ol>
        <li><strong>Type the Part Number</strong> in the search box (you can enter several, comma-separated) and hit <strong>Search</strong>.</li>
        <li><strong>Links by continent:</strong> region buttons appear below. Each opens that part’s search on that platform. Filter regions with the checkboxes.</li>
        <li><strong>Sourcing table:</strong> capture what you find (or use <em>Live data</em>). The <strong>Type</strong> column auto-flags whether the supplier is ✅ <strong>Franchised</strong> (authorized, safe) or ⚠️ <strong>Broker</strong> (open market, verify before buying).</li>
        <li><strong>Export to CSV</strong> to share or quote.</li>
        <li><strong>Google Dorks:</strong> click a command to search excess stock and independent distributors on Google.</li>
      </ol>
      <p class="guide-note">⚠️ Rule of thumb: when in doubt, a <strong>Broker</strong> requires anti-counterfeit inspection. Always verify stock, Date Code (DC) and origin (COO) with the supplier before buying.</p>`,
    tier_franquiciado: "✅ Franchised", tier_broker: "⚠️ Broker", tier_agregador: "🔁 Aggregator",
    empty_row: "No results yet. Hit “⚡ Live data” to pull real offers, “+ Manual row” to capture, or “Search” to open the platforms.",
    dork_stock: "Distributors with stock", dork_excess: "Excess / obsolete",
    dork_asia: "Asia (China/HK)", dork_europe: "Europe", dork_america: "Americas",
    dork_datasheet: "Datasheet (PDF)", dork_excel: "Excess lists (Excel)",
    copied: "✓ copied",
    st_need_backend: "Paste the backend URL and hit “Live data” again.",
    st_need_pn: "Type at least one Part Number.",
    st_loading: "Querying live offers…",
    st_none: "No offers for that Part Number(s).",
    st_loaded: "{n} offers loaded.",
    st_error: "Backend request failed: ",
    st_error_tail: ". Check the proxy is running and the URL is correct.",
    alert_openall: "Opened the first 12 platforms (limit to avoid flooding the browser). Use the buttons to open the rest.",
    alert_noexport: "No rows to export.",
  },
};

let LANG = (typeof localStorage !== "undefined" && localStorage.getItem("cs_lang")) || "es";

function t(key) {
  return (I18N[LANG] && I18N[LANG][key]) || I18N.es[key] || key;
}

function applyI18n() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === LANG));
}

function setLang(l) {
  LANG = l;
  try { localStorage.setItem("cs_lang", l); } catch (e) {}
  applyI18n();
  if (typeof window !== "undefined" && window.onLangChange) window.onLangChange();
}
