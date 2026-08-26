import express from 'express';
import { getSales, createSale, getDrafts, deleteDraft } from '../controllers/sales.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireActiveBusiness } from '../middlewares/businessGuard.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(requireActiveBusiness);

router.get('/', getSales);
router.post('/', createSale);
router.get('/drafts', getDrafts);
router.delete('/drafts/:id', deleteDraft);

export default router;
