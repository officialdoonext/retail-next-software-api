import express from 'express';
import {
  getPurchases,
  createPurchase,
  updatePurchase,
  deletePurchase
} from '../controllers/purchases.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireActiveBusiness } from '../middlewares/businessGuard.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(requireActiveBusiness);

router.get('/', getPurchases);
router.post('/', createPurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);

export default router;
