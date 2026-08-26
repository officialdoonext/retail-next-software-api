import { Router } from 'express';
import healthRoutes from './health.routes.js';
import productsRoutes from './products.routes.js';
import categoriesRoutes from './categories.routes.js';
import customersRoutes from './customers.routes.js';
import ordersRoutes from './orders.routes.js';
import uploadRoutes from './upload.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/customers', customersRoutes);
router.use('/orders', ordersRoutes);
router.use('/upload', uploadRoutes);

export default router;
