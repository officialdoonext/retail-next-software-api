import express from 'express';
import {
  getStoreRacks,
  createStoreRack,
  bulkCreateStoreRacks,
  updateStoreRack,
  deleteStoreRack,
  moveRackItem
} from '../controllers/storeRacks.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireActiveBusiness } from '../middlewares/businessGuard.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(requireActiveBusiness);

router.get('/', getStoreRacks);
router.post('/', createStoreRack);
router.post('/bulk', bulkCreateStoreRacks);
router.post('/move', moveRackItem);
router.put('/:id', updateStoreRack);
router.delete('/:id', deleteStoreRack);

export default router;
