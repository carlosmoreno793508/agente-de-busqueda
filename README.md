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
   Supplier Name · Tipo · Price · Currency · View`. Editable y exportable a CSV.
   La columna **Tipo** marca automáticamente cada proveedor como
   ✅ **Franquiciado** (autorizado) o ⚠️ **Broker** (mercado abierto), igual que
   la separación “In-Stock” vs “Brokered” de NetComponents.
4. **Datos en vivo (opcional)** — botón “⚡ Datos en vivo” que trae stock y
   precios reales vía la [API de Nexar/Octopart](server/README.md) y clasifica
   cada proveedor con el campo oficial `isAuthorized`.
5. **Google Dorks** — comandos de búsqueda avanzada por continente para rastrear
   distribuidores independientes y excedentes.
6. **Prompt del agente "ComponentSource AI"** corregido y ampliado
   (ver [`agent/ComponentSource-AI.md`](agent/ComponentSource-AI.md)).

## Franquiciado vs Broker (¿por qué importa?)

| Tipo | Qué es | Riesgo | Ejemplos |
|---|---|---|---|
| ✅ **Franquiciado / Autorizado** | Compra directo al fabricante | Trazabilidad y garantía; falsificación ~nula | Digi-Key, Mouser, Arrow, TTI, Future, RS, Farnell, LCSC |
| ⚠️ **Broker / Independiente** | Mercado abierto, excedentes, spot-buys | Útil para obsoletos/escasez, pero requiere inspección antifalsificación | Chip 1 Exchange, Converge, casas de excedente |
| 🔁 **Agregador** | No vende, solo compara | — | Octopart, Findchips, NetComponents |

La clasificación vive en [`distributors.js`](distributors.js) (lista editable de
distribuidores autorizados; lo que no esté listado se trata como broker por
precaución).

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
| `sites.js` | **Catálogo editable** de plataformas por continente (con tier). |
| `distributors.js` | Clasificador Franquiciado vs Broker. |
| `server/` | Proxy backend para datos en vivo (Nexar/Octopart). |
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

## ⚡ Datos en vivo (stock y precio reales)

Los agregadores bloquean el scraping desde el navegador (CORS/anti-bot), así que
los datos en vivo pasan por el **proxy backend** incluido en [`server/`](server/README.md):

```bash
cd server
cp .env.example .env     # pega tus credenciales de Nexar
npm install && npm start # http://localhost:8787
```

Luego en la app: **“⚡ Datos en vivo”** → pega `http://localhost:8787` → la tabla
se llena con ofertas reales, ya clasificadas Franquiciado/Broker.

Alternativa sin backend: usa los enlaces para abrir cada plataforma y captura
manualmente en la tabla (editable) y exporta a CSV.

## Estado

- Repo creado: 2026-06-24
- v1: app de búsqueda + enlaces por continente + tabla de sourcing + dorks +
  prompt del agente corregido.
- Pendiente (opcional): backend proxy para Nexar/Octopart API (datos en vivo).
