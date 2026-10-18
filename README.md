# Mi Trading — Diario de operaciones

App móvil (React Native / Expo) + API REST (Node.js + Express + PostgreSQL/Supabase) para llevar el control de tu capital y tus operaciones de trading.

## Funciones

- **Operaciones (trades)**: activo/par, LONG o SHORT, capital invertido, apalancamiento, precio de entrada y salida, comisiones, fecha de entrada/salida, estrategia y notas.
- **Resultado automático**: calcula la ganancia o pérdida en dinero ($) y en porcentaje sobre tu capital.
  - LONG: `(salida - entrada) / entrada * (capital * apalancamiento) - comisiones`
  - SHORT: `(entrada - salida) / entrada * (capital * apalancamiento) - comisiones`
  - Si no registras precios, puedes escribir el resultado manualmente.
- **Aportes y retiros**: registra el dinero que metes o sacas para que la rentabilidad sea real.
- **Resumen (dashboard)**:
  - Capital actual (equity), aportado, retirado y capital neto.
  - P&L total en $ y %, curva de capital (gráfico de línea).
  - Ganancia/pérdida por día, semana o mes (gráfico de barras).
  - % de aciertos, profit factor, ganancia media, pérdida media.
  - Comparativa LONG vs SHORT y mejor/peor operación.
- **Filtros**: por resultado (ganadas/perdidas), dirección (LONG/SHORT), activo y rango de fechas.
- **Cuenta**: registro, login con JWT, edición de perfil y borrado lógico de cuenta.

## Estructura

```
trading/
├── backend/                 API REST (Express + PostgreSQL)
│   ├── src/
│   │   ├── config/db.js     Pool de conexión + creación del esquema
│   │   ├── controllers/     auth, user, trade, deposit, stats
│   │   ├── lib/             formato y cálculos de resultado
│   │   ├── middleware/      autenticación JWT y manejo de errores
│   │   ├── routes/          rutas de la API
│   │   └── server.js        punto de entrada
│   ├── test-api.ps1         pruebas automáticas de la API
│   └── .env.example
├── mobile/                  App Expo
│   ├── App.js
│   ├── src/
│   │   ├── api/client.js    cliente HTTP (con reintento y timeout largo)
│   │   ├── components/      botones, inputs, tarjetas, gráficos SVG
│   │   ├── context/         sesión (JWT + AsyncStorage)
│   │   ├── navigation/      pestañas y pilas de navegación
│   │   ├── screens/         auth, dashboard, trades, deposits, profile
│   │   └── lib/             formato y cálculo de resultados
│   └── app.json, eas.json
└── render.yaml              despliegue del backend en Render
```

## Backend (local)

```powershell
cd backend
npm install
Copy-Item .env.example .env    # coloca tu DATABASE_URL de Supabase
npm start                      # http://localhost:4000
powershell -ExecutionPolicy Bypass -File test-api.ps1
```

Variables de entorno:

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto del servidor (4000 por defecto) |
| `DATABASE_URL` | Cadena de conexión PostgreSQL (Supabase - session pooler) |
| `JWT_SECRET` | Secreto para firmar los tokens |
| `JWT_EXPIRES_IN` | Duración del token (por defecto `7d`) |

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Estado del servicio |
| POST | `/api/auth/register` | Crear cuenta |
| POST | `/api/auth/login` | Iniciar sesión |
| GET/PUT/DELETE | `/api/users/me` | Ver, editar o eliminar la cuenta |
| GET/POST | `/api/trades` | Listar (con filtros) o crear operaciones |
| GET/PUT/DELETE | `/api/trades/:id` | Ver, actualizar (incluye cerrar) o eliminar |
| GET/POST | `/api/deposits` | Listar (con totales) o crear aportes/retiros |
| PUT/DELETE | `/api/deposits/:id` | Actualizar o eliminar un movimiento |
| GET | `/api/stats/summary` | Resumen: capital, P&L, aciertos, profit factor, LONG vs SHORT |
| GET | `/api/stats/equity` | Curva de capital por evento |
| GET | `/api/stats/pnl?groupBy=day\|week\|month` | P&L por período |

Filtros de operaciones: `?symbol=&direction=LONG|SHORT&result=win|loss&status=OPEN|CLOSED&from=YYYY-MM-DD&to=YYYY-MM-DD`

## App móvil

```powershell
cd mobile
npm install
npx expo start
```

Para compilar el APK instalable:

```powershell
cd mobile
npx eas-cli build --platform android --profile preview
```

La URL del backend se configura en `mobile/src/api/client.js` (`PROD_API_URL`).

## Despliegue

1. **GitHub**: subir el repositorio.
2. **Supabase**: crear un proyecto y copiar la cadena *Session pooler* como `DATABASE_URL`.
3. **Render**: crear el servicio desde el repositorio (`render.yaml`) o manualmente con
   `rootDir: backend`, `build: npm install`, `start: npm start`, y la variable `DATABASE_URL`.
4. **APK**: compilar con EAS apuntando a la URL pública del backend.
