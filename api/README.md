# API · Hijos Amados

Backend REST del 2º Congreso Jóvenes "Hijos Amados". Gestiona los inscriptos
(colección `events`): datos personales, presencia y pagos, e importación masiva desde Excel.

**Stack:** Node.js · Express 5 · MongoDB (Mongoose) · Multer · ExcelJS · Helmet · express-rate-limit

## Puesta en marcha

```bash
cd api
npm install
npm run dev        # http://localhost:3000
```

Al iniciar, la API se conecta a MongoDB, crea las colecciones que falten (`events`, `users`)
y muestra en consola una tabla con la cantidad de registros de cada una. Recién después
empieza a escuchar solicitudes.

### Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia con recarga automática (nodemon) |
| `npm start` | Inicia en modo normal (producción) |
| `npm test` | Ejecuta los tests con el runner nativo de Node (`node --test`) |

## Variables de entorno (`api/.env`)

| Variable | Obligatoria | Default | Descripción |
| --- | --- | --- | --- |
| `MONGODB_URI` | ✅ | — | Cadena de conexión a MongoDB |
| `JWT_SECRET` | ✅ | — | Clave secreta, **mínimo 32 caracteres** |
| `PORT` | | `3000` | Puerto de la API |
| `NODE_ENV` | | `development` | `development` o `production` |
| `FRONTEND_URL` | | `http://localhost:5173` | Origen de la web en desarrollo (CORS) |
| `FRONTEND_PREVIEW_URL` | | `https://localhost:4173` | Origen de `vite preview` (CORS) |
| `FRONTEND_PRODUCTION_URL` | | `https://localhost:4173` | Origen de la web en producción (CORS) |
| `TRUST_PROXY` | | `1` en producción, `false` en desarrollo | Valor para `app.set('trust proxy')` |
| `RL_GLOBAL_WINDOW_MS` | | `900000` (15 min) | Ventana del rate limit global |
| `RL_GLOBAL_LIMIT` | | `10000` | Solicitudes permitidas por ventana |

Ejemplo:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster/hijos-amados
JWT_SECRET=una-clave-secreta-de-al-menos-32-caracteres
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

> Si falta `MONGODB_URI` o `JWT_SECRET`, o `JWT_SECRET` es más corto de 32 caracteres,
> la API termina con un error al arrancar.

## Estructura

```
api/src
├── index.js                 # App Express, middlewares, rutas y manejo de errores
├── config/
│   ├── config.js            # Lectura y validación de variables de entorno
│   └── db.js                # Conexión a MongoDB e inicialización de colecciones
├── models/
│   ├── Event.js             # Esquema de inscripto
│   └── user.js
├── routes/event.routes.js   # Rutas /api/events
├── controllers/event.controller.js
├── services/event.service.js
└── utils/eventExcel.util.js # Lectura del Excel de inscriptos
```

## Modelo `Event`

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `nameAndLastName` | `String` | Obligatorio |
| `isAssisted` | `Boolean` | Obligatorio (presente / ausente) |
| `methodPayment` | `String` | Obligatorio: `efectivo` o `transferencia` |
| `totalPayment` | `Number` | Obligatorio, `>= 0` |
| `paidAmount` | `Number` | Default `0`, entre `0` y `totalPayment` |
| `creado` / `actualizado` | `Date` | Automáticos (timestamps) |

## API de eventos

Las rutas se montan bajo `/api/events`:

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/events` | Listar eventos |
| `POST` | `/api/events` | Crear un evento con JSON |
| `GET` | `/api/events/:id` | Consultar un evento |
| `PUT` / `PATCH` | `/api/events/:id` | Modificar los datos del evento |
| `PATCH` | `/api/events/:id/attendance` | Cambiar presencia con `{ "isAssisted": true }` |
| `PATCH` | `/api/events/:id/payment` | Registrar `{ "paidAmount": 10000, "methodPayment": "efectivo" }` |
| `DELETE` | `/api/events/:id` | Eliminar un evento |
| `POST` | `/api/events/import/excel` | Importar Excel como `multipart/form-data`, campo `file` |

La importación acepta archivos de hasta 5 MB. La aplicación conecta MongoDB
antes de escuchar solicitudes y expone errores de validación como respuestas
HTTP 400.

### Formato de respuestas

| Caso | Status | Cuerpo |
| --- | --- | --- |
| Éxito (lectura / modificación) | `200` | `{ "data": { ... } }` o `{ "data": [ ... ] }` |
| Creación | `201` | `{ "data": { ... } }` |
| Importación Excel | `201` | `{ "message": "...", "count": 25, "data": [ ... ] }` |
| Eliminación | `204` | Sin cuerpo |
| Cuerpo vacío o no JSON | `400` | `{ "message": "..." }` |
| Validación / ID inválido | `400` | `{ "message": "..." }` |
| No encontrado | `404` | `{ "message": "Evento no encontrado." }` |
| Archivo mayor a 5 MB | `413` | `{ "message": "..." }` |
| Demasiadas solicitudes | `429` | `{ "message": "..." }` |
| Error interno | `500` | `{ "message": "Error interno del servidor." }` |

Ejemplo de creación:

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"nameAndLastName":"Juan Pérez","isAssisted":false,"methodPayment":"transferencia","totalPayment":15000}'
```

### Otras rutas

| Ruta | Descripción |
| --- | --- |
| `GET /` | Info de la API (en desarrollo lista todos los endpoints) |
| `GET /health` | Estado del servidor y de MongoDB (`200` ok / `503` degradado) |

## Importación de eventos desde Excel

El service `src/services/event.service.js` exporta operaciones para crear (`createEvent`),
listar (`getEvents`), consultar por ID (`getEventById`), modificar (`updateEvent`),
actualizar la presencia (`updateAttendance`), registrar pagos (`updatePayment`) y
eliminar (`deleteEvent`) eventos.

Para importar, `importEventsFromExcel(buffer)` recibe el `buffer` del archivo `.xlsx`
(por ejemplo, `req.file.buffer` con Multer), delega el análisis a
`src/utils/eventExcel.util.js`, valida todas las filas y las guarda en MongoDB.

### Formato esperado del archivo

Se usa la **primera hoja** del libro. Se busca la primera fila que contenga estos
encabezados (sin importar mayúsculas ni acentos); las filas siguientes son los inscriptos:

| Encabezado | Campo | Valores aceptados |
| --- | --- | --- |
| `Nombre y Apellido` | `nameAndLastName` | Texto. Las filas sin nombre se ignoran |
| `Presente` | `isAssisted` | `si`, `s`, `x`, `1`, `presente` → `true` · vacío, `no`, `0`, `ausente` → `false` |
| `Pagos` / `Pago` | `methodPayment` | Se toma el **color de la celda** (ver abajo) |
| `Total` | `totalPayment` | Número; acepta formatos como `$ 15.000` o `15000,50` |

El color de relleno de la celda `Pagos` determina el método: verde es
`transferencia` y rojo es `efectivo`, independientemente del texto de esa celda.
Por eso valores como `EFECTIVO - SIL` quedan almacenados simplemente como
`efectivo`. Un color no reconocido o una fila inválida genera un error antes
de insertar eventos.

El campo `paidAmount` registra cuánto abonó la persona y comienza en cero. El
service rechaza montos negativos o superiores a `totalPayment`.

## Seguridad

- **CORS:** solo se aceptan los orígenes de `FRONTEND_URL`, `FRONTEND_PREVIEW_URL` y
  `FRONTEND_PRODUCTION_URL` (se admiten las variantes `http` y `https`). En desarrollo también
  se permiten solicitudes sin origen (Postman, curl).
- **Helmet** para cabeceras de seguridad y **compression** para respuestas comprimidas.
- **Rate limit global** configurable por variables de entorno.
- Cuerpo JSON limitado a 500 KB.
- Cierre ordenado ante `SIGINT`/`SIGTERM`: deja de aceptar solicitudes y cierra MongoDB.