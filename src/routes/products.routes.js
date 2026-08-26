import express from 'express';
import {
  getProducts,
  createProduct,
  bulkCreateProducts,
  updateProduct,
  deleteProduct
} from '../controllers/products.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireActiveBusiness } from '../middlewares/businessGuard.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(requireActiveBusiness);

router.get('/', getProducts);
router.post('/', createProduct);
router.post('/bulk', bulkCreateProducts);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
