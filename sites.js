/*
 * Catálogo de motores de búsqueda / agregadores / distribuidores de
 * componentes electrónicos, organizados por región.
 *
 * Cada entrada tiene:
 *   name    -> Nombre comercial
 *   country -> País / sede principal
 *   tier    -> "franquiciado" (autorizado por fabricante)
 *              "broker"       (mercado abierto / independiente)
 *              "agregador"    (solo compara, no vende)
 *   url     -> Plantilla de URL de búsqueda. {PN} se reemplaza por el Part Number.
 *
 * NOTA: los formatos de URL pueden cambiar. Si un enlace falla, ajústalo aquí.
 */

const SITES = {
  global: {
    label: "🌐 Globales (Agregadores)",
    sites: [
      { name: "Octopart",       country: "EE. UU.",  tier: "agregador",    url: "https://octopart.com/search?q={PN}" },
      { name: "Findchips",       country: "EE. UU.",  tier: "agregador",    url: "https://www.findchips.com/search/{PN}" },
      { name: "OEMsTrade",       country: "Global",   tier: "agregador",    url: "https://www.oemstrade.com/search/{PN}" },
      { name: "Trusted Parts",   country: "Global",   tier: "agregador",    url: "https://www.trustedparts.com/en/search/{PN}" },
      { name: "Digipart",        country: "Global",   tier: "agregador",    url: "https://www.digipart.com/search/{PN}" },
      { name: "NetComponents",   country: "Global",   tier: "agregador",    url: "https://www.netcomponents.com/en/Search?Keyword={PN}" },
      { name: "Sourcengine",     country: "Global",   tier: "agregador",    url: "https://www.sourcengine.com/search?q={PN}" },
      { name: "PartStack",       country: "Global",   tier: "agregador",    url: "https://partstack.com/search?q={PN}" },
      { name: "Datasheets.com",  country: "Global",   tier: "agregador",    url: "https://www.datasheets.com/en/search?searchText={PN}" },
      { name: "Z2Data",          country: "Global",   tier: "agregador",    url: "https://www.z2data.com/search?q={PN}" },
    ],
  },

  america: {
    label: "🌎 América",
    sites: [
      { name: "Digi-Key",            country: "EE. UU.",  tier: "franquiciado", url: "https://www.digikey.com/en/products/result?keywords={PN}" },
      { name: "Mouser Electronics",  country: "EE. UU.",  tier: "franquiciado", url: "https://www.mouser.com/c/?q={PN}" },
      { name: "Arrow Electronics",   country: "EE. UU.",  tier: "franquiciado", url: "https://www.arrow.com/en/products/search?q={PN}" },
      { name: "Avnet",               country: "EE. UU.",  tier: "franquiciado", url: "https://www.avnet.com/shop/us/search/{PN}" },
      { name: "Newark / element14",  country: "EE. UU.",  tier: "franquiciado", url: "https://www.newark.com/search?st={PN}" },
      { name: "TTI Inc.",            country: "EE. UU.",  tier: "franquiciado", url: "https://www.tti.com/content/ttiinc/en/search.html?q={PN}" },
      { name: "Master Electronics",  country: "EE. UU.",  tier: "franquiciado", url: "https://www.masterelectronics.com/en/search?searchTerm={PN}" },
      { name: "Symmetry Electronics",country: "EE. UU.",  tier: "franquiciado", url: "https://www.symmetryelectronics.com/search/?q={PN}" },
      { name: "Quest Components",    country: "EE. UU.",  tier: "broker",       url: "https://www.questcomp.com/parts/search?searchTerm={PN}" },
      { name: "SparkFun",            country: "EE. UU.",  tier: "franquiciado", url: "https://www.sparkfun.com/search/results?term={PN}" },
    ],
  },

  europe: {
    label: "🌍 Europa",
    sites: [
      { name: "RS Components",       country: "Reino Unido", tier: "franquiciado", url: "https://uk.rs-online.com/web/c/?searchTerm={PN}" },
      { name: "Farnell / element14", country: "Reino Unido", tier: "franquiciado", url: "https://www.farnell.com/search?st={PN}" },
      { name: "TME",                 country: "Polonia",     tier: "franquiciado", url: "https://www.tme.eu/en/katalog/?search={PN}" },
      { name: "Mouser Europe",       country: "Alemania",    tier: "franquiciado", url: "https://eu.mouser.com/c/?q={PN}" },
      { name: "Conrad Electronic",   country: "Alemania",    tier: "franquiciado", url: "https://www.conrad.com/en/search.html?search={PN}" },
      { name: "Distrelec",           country: "Suiza",       tier: "franquiciado", url: "https://www.distrelec.com/en/search?q={PN}" },
      { name: "Rutronik",            country: "Alemania",    tier: "franquiciado", url: "https://www.rutronik24.com/search?q={PN}" },
      { name: "Reichelt",            country: "Alemania",    tier: "franquiciado", url: "https://www.reichelt.com/index.html?ACTION=446&SEARCH={PN}" },
      { name: "Codico",              country: "Austria",     tier: "franquiciado", url: "https://www.codico.com/en/search?q={PN}" },
      { name: "Comutel (Mengonline)",country: "España",      tier: "broker",       url: "https://www.mengonline.com/es/buscar?controller=search&s={PN}" },
    ],
  },

  asia: {
    label: "🌏 Asia / Pacífico",
    sites: [
      { name: "LCSC Electronics",    country: "China",       tier: "franquiciado", url: "https://www.lcsc.com/search?q={PN}" },
      { name: "Chip1Stop",           country: "Japón",       tier: "franquiciado", url: "https://www.chip1stop.com/sp/products/search?keyword={PN}" },
      { name: "Oneyac",              country: "China",       tier: "franquiciado", url: "https://www.oneyac.com/search?keyword={PN}" },
      { name: "Element14 (APAC)",    country: "Singapur",    tier: "franquiciado", url: "https://sg.element14.com/search?st={PN}" },
      { name: "Future Electronics",  country: "Global/APAC", tier: "franquiciado", url: "https://www.futureelectronics.com/search/?searchterm={PN}" },
      { name: "Utsource",            country: "China",       tier: "broker",       url: "https://www.utsource.net/sch/{PN}" },
      { name: "WIN SOURCE",          country: "China",       tier: "broker",       url: "https://www.win-source.net/search/?keyword={PN}" },
      { name: "ICgoo",               country: "China",       tier: "broker",       url: "https://www.icgoo.net/search.html?keyword={PN}" },
      { name: "HQ Online (HQChip)",  country: "China",       tier: "broker",       url: "https://www.hqchip.com/app/search?keyword={PN}" },
      { name: "Verical (Arrow)",     country: "Global",      tier: "broker",       url: "https://www.verical.com/search/{PN}" },
    ],
  },
};

if (typeof module !== "undefined") module.exports = SITES;
