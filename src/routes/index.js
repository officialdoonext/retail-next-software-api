import express from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import businessRoutes from './businesses.routes.js';
import productsRoutes from './products.routes.js';
import categoriesRoutes from './categories.routes.js';
import variationsRoutes from './variations.routes.js';
import customersRoutes from './customers.routes.js';
import ordersRoutes from './orders.routes.js';
import uploadRoutes from './upload.routes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/businesses', businessRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/variations', variationsRoutes);
router.use('/customers', customersRoutes);
router.use('/orders', ordersRoutes);
router.use('/upload', uploadRoutes);

export default router;
