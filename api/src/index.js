const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const multer = require('multer');
const mongoose = require('mongoose');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const config = require('./config/config');
const connectDB = require('./config/db');
const eventRoutes = require('./routes/event.routes');

const app = express();

const isDev = config.nodeEnv === 'development';

const buildWhitelist = (...urls) => {
  const set = new Set();
  for (const url of urls) {
    if (!url) continue;
    const cleanUrl = url.trim().replace(/\/+$/, '');
    set.add(cleanUrl);
    if (cleanUrl.startsWith('http://')) set.add(cleanUrl.replace('http://', 'https://'));
    else if (cleanUrl.startsWith('https://')) set.add(cleanUrl.replace('https://', 'http://'));
  }
  return [...set];
};

const whitelist = buildWhitelist(config.url_web_dev, config.url_web_preview, config.url_web_production);

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || (isDev && !origin)) {
      callback(null, true);
    } else {
      const error = new Error('No permitido por CORS. Origen no autorizado.');
      error.status = 403;
      callback(error);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
};

const globalLimiter = rateLimit({
  windowMs: config.rateLimits.global.windowMs,
  limit: config.rateLimits.global.limit,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) return `u:${auth.slice(7)}`;
    return ipKeyGenerator(req.ip);
  },
  message: { message: 'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde.' },
});

app.set('trust proxy', config.trustProxy);
app.use(globalLimiter);
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '500kb' }));


app.use('/api/events', eventRoutes);

app.get('/', (req, res) => {
  // Solo exponer documentación detallada en desarrollo
  if (isDev) {
    return res.status(200).json({
      api_name: 'Event Hijos amados API',
      version: '1.0.0',
      status: 'online',
      description: 'API para la gestión de HIJOS AMADOS 2027',
      endpoints: {
        events: {
          GET: '/api/events',
          GET2: '/api/events/:id',
          POST: '/api/events',
          POST2: '/api/events/import/excel',
          PUT: '/api/events/:id',
          DELETE: '/api/events/:id',
          PATCH: '/api/events/:id/attendance',
          PATCH2: '/api/events/:id/payment',
          PATCH3: '/api/events/:id',

        }
      }
    });
  }

  // En producción, solo status mínimo
  res.status(200).json({
    api_name: 'Event Registration API',
    status: 'online',
  });
});


const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];
app.get('/health', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const dbOk = readyState === 1;

  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    db: DB_STATES[readyState] || 'unknown',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ message: error.message });
  }

  const status = error.status
    || (error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500);

  if (status >= 500) console.error(error);
  return res.status(status).json({
    message: status >= 500 ? 'Error interno del servidor.' : error.message,
  });
});

connectDB().then(() => {
  const server = app.listen(config.port, () =>
    console.log(`Server running on port ${config.port}`),
  );

  // Cierre ordenado: dejar de aceptar peticiones y cerrar MongoDB.
  const shutdown = (signal) => {
    console.log(`\n${signal} recibido. Cerrando servidor...`);
    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB desconectado. Bye.');
        process.exit(0);
      } catch (error) {
        console.error('Error al cerrar MongoDB:', error.message);
        process.exit(1);
      }
    });

    // Fuerza la salida si algo queda colgado.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
});