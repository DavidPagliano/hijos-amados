# hijos-amados

Sistema del **2º Congreso Jóvenes "Hijos Amados"** (23/24 de octubre de 2026).

El repositorio tiene dos proyectos independientes:

| Carpeta | Qué es | Tecnología | Puerto por defecto |
| --- | --- | --- | --- |
| [`api/`](./api) | Backend (API REST de eventos/inscriptos) | Node.js + Express + MongoDB | `3000` |
| [`web/`](./web) | Frontend | React + Vite + MUI | `5173` |

## Requisitos

- [Node.js](https://nodejs.org/) 20 o superior (incluye `npm`)
- Una base de datos MongoDB (local o [MongoDB Atlas](https://www.mongodb.com/atlas))

## 1. Instalar dependencias (solo la primera vez)

Desde la raíz del repositorio:

```bash
cd api
npm install
cd ../web
npm install
```

## 2. Variables de entorno

### `api/.env`

Crear el archivo `api/.env` con al menos:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster/hijos-amados
JWT_SECRET=una-clave-secreta-de-al-menos-32-caracteres
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

> `MONGODB_URI` y `JWT_SECRET` son obligatorias. `JWT_SECRET` debe tener **32 caracteres o más**, si no la API no arranca.

### `web/.env` (opcional)

Copiar `web/.env.example` a `web/.env`. Solo hace falta si la API no corre en `http://localhost:3000`:

```env
VITE_API_URL=http://localhost:3000/api
```

## 3. Levantar el proyecto (dos terminales)

La API y la web se ejecutan **al mismo tiempo**, cada una en su propia terminal.

### Terminal 1: API

```bash
cd api
npm run dev
```

Debería mostrar `Server running on port 3000`.
Comprobar en el navegador: <http://localhost:3000/health>

### Terminal 2: Web

```bash
cd web
npm run dev
```

Abrir <http://localhost:5173>

> **En VS Code:** abrir la terminal con `` Ctrl + ` ``, levantar la API y después
> crear una segunda terminal con el botón **+** (o `` Ctrl + Shift + ` ``) para la web.
> También se puede usar **Split Terminal** (`Ctrl + Shift + 5`) para ver las dos lado a lado.

> [!IMPORTANT]
> La web tiene que correr en el puerto **5173**: es el origen que la API permite por CORS
> (`FRONTEND_URL`). Si Vite avisa `Port 5173 is in use` y usa otro puerto, cerrar la otra
> instancia o actualizar `FRONTEND_URL` en `api/.env`.

## Scripts disponibles

| Carpeta | Comando | Descripción |
| --- | --- | --- |
| `api` | `npm run dev` | Inicia la API con recarga automática (nodemon) |
| `api` | `npm start` | Inicia la API en modo normal |
| `api` | `npm test` | Ejecuta los tests |
| `web` | `npm run dev` | Inicia el servidor de desarrollo de Vite |
| `web` | `npm run build` | Genera el build de producción en `web/dist` |
| `web` | `npm run preview` | Sirve el build de producción (puerto 4173) |
| `web` | `npm run lint` | Revisa el código con ESLint |

## Más información

- Endpoints y lógica de importación desde Excel: [`api/README.md`](./api/README.md)