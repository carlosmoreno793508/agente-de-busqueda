# 🔎 ComponentSource AI — Agente de Búsqueda de Componentes Electrónicos

Herramienta de **sourcing global** para localizar inventario, precios y hojas de
datos de cualquier *Part Number* en las principales plataformas del mundo,
organizadas por continente.

Proyecto independiente (separado de Astute y TID).

## ¿Qué hace?

1. **Buscador por Part Number** — escribe uno o varios números de parte.
2. **Enlaces directos por continente** — abre la búsqueda en ~40 plataformas
   (Globales, América, Europa, Asia/Pacífico) con un clic.
3. **Hoja de sourcing** — tabla con exactamente las columnas que necesitas:
   `Part Number · Mfr · DC · Description · COO · Stock/Qty. · Tariff Cost ·
   Supplier Name · Price · Currency · View`. Editable y exportable a CSV.
4. **Google Dorks** — comandos de búsqueda avanzada por continente para rastrear
   distribuidores independientes y excedentes.
5. **Prompt del agente "ComponentSource AI"** corregido y ampliado
   (ver [`agent/ComponentSource-AI.md`](agent/ComponentSource-AI.md)).

## Cómo usarla

Es una app **100% estática** (HTML/CSS/JS, sin backend). Para abrirla:

```bash
# opción 1: abrir el archivo directamente
open index.html        # macOS
xdg-open index.html    # Linux

# opción 2: servidor local
python3 -m http.server 8000   # luego abre http://localhost:8000
```

También puede publicarse gratis en **GitHub Pages** (Settings → Pages → rama).

## Estructura

| Archivo | Descripción |
|---|---|
| `index.html` | Interfaz (buscador, tabla, enlaces, dorks). |
| `styles.css` | Estilos (tema oscuro). |
| `app.js` | Lógica: genera enlaces, maneja la tabla, exporta CSV. |
| `sites.js` | **Catálogo editable** de plataformas por continente. |
| `agent/ComponentSource-AI.md` | Prompt del agente LLM, corregido. |

## Plataformas incluidas (por continente)

- **🌐 Globales (agregadores):** Octopart, Findchips, OEMsTrade, Trusted Parts,
  Digipart, NetComponents, Sourcengine, PartStack, Datasheets.com, Z2Data.
- **🌎 América:** Digi-Key, Mouser, Arrow, Avnet, Newark/element14, TTI, SparkFun,
  Master Electronics, Quest Components, Symmetry.
- **🌍 Europa:** RS Components, Farnell/element14, TME, Mouser EU, Conrad,
  Distrelec, Rutronik, Reichelt, Codico, Comutel.
- **🌏 Asia/Pacífico:** LCSC, Chip1Stop, Oneyac, Utsource, WIN SOURCE, ICgoo,
  HQ Online, element14 APAC, Future Electronics, Verical.

> Para **agregar o quitar** una plataforma, edita `sites.js`. El token `{PN}` se
> reemplaza por el Part Number.

## Correcciones al código original de Gemini

- ✅ **NetComponents**: la URL `https://www.netcomponents.com/search[PART_NUMBER]`
  estaba mal formada (sin separador ni parámetro). Corregida a
  `https://www.netcomponents.com/en/Search?Keyword=[PART_NUMBER]`.
- ✅ Se añadió **codificación de URL** del Part Number (caracteres especiales).
- ✅ Se agregaron **distribuidores y agregadores por continente** (antes solo 6).
- ✅ Se forzó la **tabla de salida** con las columnas exactas solicitadas.
- ✅ Reglas anti-alucinación: el agente **no inventa** stock/precio/DC/COO.

## ⚠️ Sobre datos en vivo (stock y precio reales)

Los agregadores (Octopart, Findchips, etc.) **bloquean el scraping directo desde
el navegador** (CORS / anti-bot). Para llenar la tabla automáticamente con stock
y precio reales hay dos caminos:

1. **API oficial (recomendado):** [Nexar API de Octopart](https://nexar.com/api)
   ofrece precios/stock multi-distribuidor. Requiere token y un pequeño backend
   (proxy) para no exponer credenciales. Es el punto de integración natural de
   esta app — `app.js` ya tiene la tabla lista para recibir esos datos.
2. **Captura manual / semi-manual:** usa los enlaces para abrir cada plataforma y
   registra los hallazgos en la tabla (editable) y expórtalos a CSV.

## Estado

- Repo creado: 2026-06-24
- v1: app de búsqueda + enlaces por continente + tabla de sourcing + dorks +
  prompt del agente corregido.
- Pendiente (opcional): backend proxy para Nexar/Octopart API (datos en vivo).
