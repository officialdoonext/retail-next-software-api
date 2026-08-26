import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logging & Parsing
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Retail Next Software API',
    version: '1.0.0',
    status: 'online',
    docs: `${config.apiPrefix}/health`
  });
});

// Mount API Routes
app.use(config.apiPrefix, apiRouter);

// 404 and Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
