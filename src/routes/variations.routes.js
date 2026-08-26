import express from 'express';
import { getVariations, createVariation, deleteVariation } from '../controllers/variations.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireActiveBusiness } from '../middlewares/businessGuard.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(requireActiveBusiness);

router.get('/', getVariations);
router.post('/', createVariation);
router.delete('/:id', deleteVariation);

export default router;
