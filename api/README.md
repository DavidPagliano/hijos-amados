# Importación de eventos desde Excel

El service `src/services/event.service.js` exporta operaciones para crear (`createEvent`),
listar (`getEvents`), consultar por ID (`getEventById`), modificar (`updateEvent`),
actualizar la presencia (`updateAttendance`), registrar pagos (`updatePayment`) y
eliminar (`deleteEvent`) eventos.

Para importar, `importEventsFromExcel(buffer)` recibe el `buffer` del archivo `.xlsx`
(por ejemplo, `req.file.buffer` con Multer), delega el análisis a
`src/utils/eventExcel.util.js`, valida todas las filas y las guarda en MongoDB.

El color de relleno de la celda `Pagos` determina el método: verde es
`transferencia` y rojo es `efectivo`, independientemente del texto de esa celda.
Por eso valores como `EFECTIVO - SIL` quedan almacenados simplemente como
`efectivo`. Un color no reconocido o una fila inválida genera un error antes
de insertar eventos.

El campo `paidAmount` registra cuánto abonó la persona y comienza en cero. El
service rechaza montos negativos o superiores a `totalPayment`.

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