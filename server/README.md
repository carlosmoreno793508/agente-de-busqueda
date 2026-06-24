# Backend — Proxy de datos en vivo (stock y precio reales)

Proxy en Node/Express que trae **stock y precios reales** y los entrega a la app
ya normalizados, con cada proveedor clasificado **Franquiciado** o **Broker**.

Soporta dos fuentes de datos (elige según la credencial que configures):

| Proveedor | Cobertura | Dificultad | Variables |
|---|---|---|---|
| **Nexar (Octopart)** | Stock/precio de **muchos distribuidores** + `isAuthorized` oficial | Crear app en nexar.com | `NEXAR_CLIENT_ID`, `NEXAR_CLIENT_SECRET` |
| **Mouser** | Stock/precio **solo de Mouser** (franquiciado) | Key gratis e instantánea | `MOUSER_API_KEY` |

> Si configuras Nexar se usa Nexar; si no, se usa Mouser.

## Despliegue en 1 clic (recomendado)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/carlosmoreno793508/agente-de-busqueda)

1. Pulsa el botón (usa el blueprint [`render.yaml`](../render.yaml)).
2. En Render, define **una** credencial: Nexar (`NEXAR_CLIENT_ID` + `NEXAR_CLIENT_SECRET`) **o** `MOUSER_API_KEY`.
3. Render te da una URL pública `https://...onrender.com`.
4. Pégala en el campo **“URL del backend”** de la app. ¡Listo! La tabla se llena sola tras cada búsqueda.

> El plan gratuito de Render “duerme” tras inactividad; la primera consulta puede tardar ~30 s en despertar.

## Puesta en marcha local

```bash
cd server
cp .env.example .env        # pega tu credencial (Nexar o Mouser)
npm install
npm start                   # http://localhost:8787
```

Luego en la app: pega `http://localhost:8787` en **“URL del backend”**.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/search?q=NE555,STM32F103C8T6` | Ofertas normalizadas (varios PN por coma). |
| `GET` | `/health` | Estado y proveedor activo. |

### Respuesta de `/api/search`

```json
{
  "provider": "nexar",
  "count": 12,
  "offers": [
    {
      "partNumber": "NE555P", "mfr": "Texas Instruments",
      "description": "IC OSC SINGLE TIMER 100KHZ 8-DIP", "coo": "US",
      "stock": 25966, "supplier": "Digi-Key", "tier": "franquiciado",
      "authorized": true, "price": 0.47, "currency": "USD",
      "url": "https://www.digikey.com/...", "dateCode": "", "tariffCost": ""
    }
  ]
}
```

> `dateCode`, `coo` y `tariffCost` no siempre vienen de los distribuidores
> autorizados (son típicos de listados de brokers); quedan en blanco para
> capturarse manualmente cuando aplique.
