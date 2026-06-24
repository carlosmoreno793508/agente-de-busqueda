/*
 * Catálogo de motores de búsqueda / agregadores / distribuidores de
 * componentes electrónicos, organizados por región.
 *
 * Cada entrada tiene:
 *   name    -> Nombre comercial
 *   country -> País / sede principal
 *   type    -> "Agregador" (compara varios proveedores) o "Distribuidor"
 *   url     -> Plantilla de URL de búsqueda. El token {PN} se reemplaza
 *              por el Part Number (codificado para URL).
 *
 * NOTA: los formatos de URL de búsqueda pueden cambiar con el tiempo.
 * Si un enlace deja de funcionar, ajusta la plantilla aquí.
 */

const SITES = {
  global: {
    label: "🌐 Globales (Agregadores principales)",
    sites: [
      { name: "Octopart",       country: "EE. UU.",  type: "Agregador",    url: "https://octopart.com/search?q={PN}" },
      { name: "Findchips",       country: "EE. UU.",  type: "Agregador",    url: "https://www.findchips.com/search/{PN}" },
      { name: "OEMsTrade",       country: "Global",   type: "Agregador",    url: "https://www.oemstrade.com/search/{PN}" },
      { name: "Trusted Parts",   country: "Global",   type: "Agregador",    url: "https://www.trustedparts.com/en/search/{PN}" },
      { name: "Digipart",        country: "Global",   type: "Agregador",    url: "https://www.digipart.com/search/{PN}" },
      { name: "NetComponents",   country: "Global",   type: "Agregador",    url: "https://www.netcomponents.com/en/Search?Keyword={PN}" },
      { name: "Sourcengine",     country: "Global",   type: "Agregador",    url: "https://www.sourcengine.com/search?q={PN}" },
      { name: "PartStack",       country: "Global",   type: "Agregador",    url: "https://partstack.com/search?q={PN}" },
      { name: "Datasheets.com",  country: "Global",   type: "Agregador",    url: "https://www.datasheets.com/en/search?searchText={PN}" },
      { name: "Z2Data",          country: "Global",   type: "Agregador",    url: "https://www.z2data.com/search?q={PN}" },
    ],
  },

  america: {
    label: "🌎 América",
    sites: [
      { name: "Digi-Key",            country: "EE. UU.",  type: "Distribuidor", url: "https://www.digikey.com/en/products/result?keywords={PN}" },
      { name: "Mouser Electronics",  country: "EE. UU.",  type: "Distribuidor", url: "https://www.mouser.com/c/?q={PN}" },
      { name: "Arrow Electronics",   country: "EE. UU.",  type: "Distribuidor", url: "https://www.arrow.com/en/products/search?q={PN}" },
      { name: "Avnet",               country: "EE. UU.",  type: "Distribuidor", url: "https://www.avnet.com/shop/us/search/{PN}" },
      { name: "Newark / element14",  country: "EE. UU.",  type: "Distribuidor", url: "https://www.newark.com/search?st={PN}" },
      { name: "TTI Inc.",            country: "EE. UU.",  type: "Distribuidor", url: "https://www.tti.com/content/ttiinc/en/search.html?q={PN}" },
      { name: "SparkFun",            country: "EE. UU.",  type: "Distribuidor", url: "https://www.sparkfun.com/search/results?term={PN}" },
      { name: "Master Electronics",  country: "EE. UU.",  type: "Distribuidor", url: "https://www.masterelectronics.com/en/search?searchTerm={PN}" },
      { name: "Quest Components",    country: "EE. UU.",  type: "Distribuidor", url: "https://www.questcomp.com/parts/search?searchTerm={PN}" },
      { name: "Symmetry Electronics",country: "EE. UU.",  type: "Distribuidor", url: "https://www.symmetryelectronics.com/search/?q={PN}" },
    ],
  },

  europe: {
    label: "🌍 Europa",
    sites: [
      { name: "RS Components",       country: "Reino Unido", type: "Distribuidor", url: "https://uk.rs-online.com/web/c/?searchTerm={PN}" },
      { name: "Farnell / element14", country: "Reino Unido", type: "Distribuidor", url: "https://www.farnell.com/search?st={PN}" },
      { name: "TME",                 country: "Polonia",     type: "Distribuidor", url: "https://www.tme.eu/en/katalog/?search={PN}" },
      { name: "Mouser Europe",       country: "Alemania",    type: "Distribuidor", url: "https://eu.mouser.com/c/?q={PN}" },
      { name: "Conrad Electronic",   country: "Alemania",    type: "Distribuidor", url: "https://www.conrad.com/en/search.html?search={PN}" },
      { name: "Distrelec",           country: "Suiza",       type: "Distribuidor", url: "https://www.distrelec.com/en/search?q={PN}" },
      { name: "Rutronik",            country: "Alemania",    type: "Distribuidor", url: "https://www.rutronik24.com/search?q={PN}" },
      { name: "Reichelt",            country: "Alemania",    type: "Distribuidor", url: "https://www.reichelt.com/index.html?ACTION=446&SEARCH={PN}" },
      { name: "Mengonline (Comutel)",country: "España",      type: "Distribuidor", url: "https://www.mengonline.com/es/buscar?controller=search&s={PN}" },
      { name: "Codico",              country: "Austria",     type: "Distribuidor", url: "https://www.codico.com/en/search?q={PN}" },
    ],
  },

  asia: {
    label: "🌏 Asia / Pacífico",
    sites: [
      { name: "LCSC Electronics",    country: "China",       type: "Distribuidor", url: "https://www.lcsc.com/search?q={PN}" },
      { name: "Chip1Stop",           country: "Japón",       type: "Distribuidor", url: "https://www.chip1stop.com/sp/products/search?keyword={PN}" },
      { name: "Oneyac",              country: "China",       type: "Distribuidor", url: "https://www.oneyac.com/search?keyword={PN}" },
      { name: "Utsource",            country: "China",       type: "Agregador",    url: "https://www.utsource.net/sch/{PN}" },
      { name: "WIN SOURCE",          country: "China",       type: "Distribuidor", url: "https://www.win-source.net/search/?keyword={PN}" },
      { name: "ICgoo",               country: "China",       type: "Distribuidor", url: "https://www.icgoo.net/search.html?keyword={PN}" },
      { name: "HQ Online (HQTS)",    country: "China",       type: "Distribuidor", url: "https://www.hqchip.com/app/search?keyword={PN}" },
      { name: "Element14 (APAC)",    country: "Singapur",    type: "Distribuidor", url: "https://sg.element14.com/search?st={PN}" },
      { name: "Future Electronics",  country: "Global/APAC", type: "Distribuidor", url: "https://www.futureelectronics.com/search/?searchterm={PN}" },
      { name: "Verical (Arrow)",     country: "Global",      type: "Agregador",    url: "https://www.verical.com/search/{PN}" },
    ],
  },
};

if (typeof module !== "undefined") module.exports = SITES;
