# Web · Hijos Amados

Frontend del 2º Congreso Jóvenes "Hijos Amados" (23/24 de octubre de 2026).

**Stack:** React 19 · Vite · Material UI (MUI) · Axios

## Puesta en marcha

```bash
cd web
npm install
npm run dev        # http://localhost:5173
```

> La API (`../api`) tiene que estar corriendo en otra terminal. Ver el
> [README principal](../README.md).

### Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build en <http://localhost:4173> |
| `npm run lint` | Revisa el código con ESLint |

## Variables de entorno

Copiar `.env.example` a `.env` (opcional):

| Variable | Default | Descripción |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000/api` | URL base de la API |

> La web debe correr en el puerto **5173** (o el definido en `FRONTEND_URL` de la API),
> si no la API rechaza las solicitudes por CORS.

## Estructura

```
web/src
├── main.jsx
├── App.jsx                   # Página principal + fondo violeta con ola
├── config/
│   └── theme.js              # Tema MUI: colores, tipografías y overrides
├── components/
│   ├── BrandTitle.jsx        # Título “HIJOS AMADOS” estilo flyer
│   └── EventDate.jsx         # Fecha 23/24 OCTUBRE 2026 estilo flyer
├── services/
│   ├── api.js                # Instancia de axios + manejo de errores
│   └── event.service.js      # Una función por endpoint de /api/events
└── hooks/
    ├── useEvents.js          # Lista de eventos + acciones (CRUD, pagos, Excel)
    └── useEvent.js           # Un evento por id
```

## Identidad visual

Definida en [`src/config/theme.js`](./src/config/theme.js), basada en el flyer del congreso.

### Colores de marca

| Token | Color | Uso |
| --- | --- | --- |
| `brand.white` | `#FFFFFF` | "HIJOS", "23/24" |
| `brand.mauve` | `#B86BC0` | "AMADOS" |
| `brand.cyan` | `#5FD8E4` | "OCTUBRE" |
| `brand.pink` | `#F26BB5` | "2026", comillas |
| `primary` | `#9333EA` | Botones principales (degradé púrpura → rosa) |
| `secondary` | `#00F0FF` | Botones secundarios (cian neón) |

Se usan en cualquier componente MUI: `sx={{ color: 'brand.pink' }}`.

### Tipografías (Google Fonts, cargadas en `index.html`)

| Variante | Fuente | Uso |
| --- | --- | --- |
| `brandTitle` | Unbounded 900 | Títulos de marca |
| `brandDisplay` | Oswald 700 | Fechas y datos destacados |
| resto | Inter | Texto general |

```jsx
<Typography variant="brandTitle">Bienvenidos</Typography>
```

### Componentes de marca

```jsx
import BrandTitle from './components/BrandTitle';
import EventDate from './components/EventDate';

<BrandTitle />                                   // “HIJOS AMADOS”
<BrandTitle first="Nos" second="vemos" quotes={false} stacked={false} />
<EventDate />                                    // 23/24 OCTUBRE 2026
<EventDate scale={0.6} />                        // versión chica
```

| Componente | Props |
| --- | --- |
| `BrandTitle` | `first`, `second`, `quotes`, `stacked`, `size`, `component`, `sx` |
| `EventDate` | `days`, `month`, `year`, `scale`, `sx` |

## Consumo de la API

### Service

[`src/services/event.service.js`](./src/services/event.service.js) devuelve directamente
los datos (sin el envoltorio `{ data }`):

| Función | Endpoint |
| --- | --- |
| `getEvents()` | `GET /events` |
| `getEventById(id)` | `GET /events/:id` |
| `createEvent(event)` | `POST /events` |
| `replaceEvent(id, event)` | `PUT /events/:id` |
| `updateEvent(id, changes)` | `PATCH /events/:id` |
| `updateAttendance(id, isAssisted)` | `PATCH /events/:id/attendance` |
| `updatePayment(id, { paidAmount, methodPayment })` | `PATCH /events/:id/payment` |
| `deleteEvent(id)` | `DELETE /events/:id` |
| `importEventsFromExcel(file, onUploadProgress?)` | `POST /events/import/excel` |

Los errores llegan siempre como `Error` con `message` legible (el que envía la API o
uno genérico si no hay conexión) y `status` HTTP.

### Hooks

**`useEvents()`** — carga la lista al montar y mantiene el estado local sincronizado:

```jsx
import useEvents from './hooks/useEvents';

const {
  events, stats, loading, mutating, error, clearError, refetch,
  createEvent, updateEvent, updatePayment, toggleAttendance, deleteEvent, importFromExcel,
} = useEvents();             // useEvents({ autoFetch: false }) para no cargar al montar

await createEvent({
  nameAndLastName: 'Juan Pérez',
  isAssisted: false,
  methodPayment: 'transferencia',
  totalPayment: 15000,
});
await toggleAttendance(id, true);          // optimista: revierte si falla
await updatePayment(id, { paidAmount: 5000 });
await importFromExcel(file, (e) => console.log(e.loaded / e.total));
```

`stats` incluye: `total`, `present`, `absent`, `totalExpected`, `totalPaid`, `pending`, `fullyPaid`.

**`useEvent(id)`** — un solo evento:

```jsx
const { event, loading, error, refetch, setEvent } = useEvent(id);
```
