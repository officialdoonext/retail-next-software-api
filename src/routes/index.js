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
import salesRoutes from './sales.routes.js';
import vendorsRoutes from './vendors.routes.js';
import purchasesRoutes from './purchases.routes.js';
import expensesRoutes from './expenses.routes.js';
import employeesRoutes from './employees.routes.js';
import storeRacksRoutes from './storeRacks.routes.js';
import godownSlotsRoutes from './godownSlots.routes.js';

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
router.use('/sales', salesRoutes);
router.use('/vendors', vendorsRoutes);
router.use('/purchases', purchasesRoutes);
router.use('/expenses', expensesRoutes);
router.use('/investments', expensesRoutes);
router.use('/employees', employeesRoutes);
router.use('/store-racks', storeRacksRoutes);
router.use('/godown-slots', godownSlotsRoutes);

export default router;
