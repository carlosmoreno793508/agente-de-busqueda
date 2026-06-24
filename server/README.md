# Backend — Proxy de datos en vivo (Nexar / Octopart)

Pequeño proxy en Node/Express que trae stock y precios **reales** desde la
[API de Nexar](https://nexar.com/api) (la API oficial de Octopart) y los entrega
a la app ya normalizados, con cada proveedor clasificado como **Franquiciado** o
**Broker** (usando el campo oficial `isAuthorized` de Nexar).

## ¿Por qué un backend?

La app es estática y el navegador no puede llamar a Nexar directamente (CORS +
las credenciales no deben exponerse en el cliente). Este proxy guarda el token
en el servidor y expone un endpoint simple y seguro.

## Puesta en marcha

```bash
cd server
cp .env.example .env        # pega tus credenciales de Nexar
npm install
npm start                   # arranca en http://localhost:8787
```

Luego, en la app web: pulsa **“⚡ Datos en vivo”**, pega `http://localhost:8787`
en el campo de backend y vuelve a pulsar. La tabla se llenará con ofertas reales.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/search?q=NE555,STM32F103C8T6` | Ofertas normalizadas (varios PN separados por coma). |
| `GET` | `/health` | Estado y si hay credenciales cargadas. |

### Respuesta de `/api/search`

```json
{
  "count": 12,
  "offers": [
    {
      "partNumber": "NE555P",
      "mfr": "Texas Instruments",
      "description": "IC OSC SINGLE TIMER 100KHZ 8-DIP",
      "coo": "US",
      "stock": 25966,
      "supplier": "Digi-Key",
      "tier": "franquiciado",
      "authorized": true,
      "price": 0.47,
      "currency": "USD",
      "url": "https://www.digikey.com/...",
      "dateCode": "", "tariffCost": ""
    }
  ]
}
```

> `dateCode`, `coo` y `tariffCost` no siempre vienen de los distribuidores
> autorizados (son típicos de listados de brokers); quedan en blanco para
> capturarse manualmente cuando aplique.

## Despliegue

Cualquier host de Node sirve (Render, Railway, Fly.io, Cloud Run, etc.).
Configura las variables `NEXAR_CLIENT_ID` y `NEXAR_CLIENT_SECRET` en el panel del
host y usa la URL pública resultante en el campo de backend de la app.
