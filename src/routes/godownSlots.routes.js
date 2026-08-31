import express from 'express';
import {
  getGodownSlots,
  createGodownSlot,
  bulkCreateGodownSlots,
  updateGodownSlot,
  deleteGodownSlot,
  moveGodownItem
} from '../controllers/godownSlots.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireActiveBusiness } from '../middlewares/businessGuard.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(requireActiveBusiness);

router.get('/', getGodownSlots);
router.post('/', createGodownSlot);
router.post('/bulk', bulkCreateGodownSlots);
router.post('/move', moveGodownItem);
router.put('/:id', updateGodownSlot);
router.delete('/:id', deleteGodownSlot);

export default router;
