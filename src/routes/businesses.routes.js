import express from 'express';
import {
  getBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  activateBusiness,
  verifyBusinessAccess
} from '../controllers/businesses.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getBusinesses);
router.get('/:id', getBusinessById);
router.post('/', createBusiness);
router.put('/:id', updateBusiness);
router.post('/:id/activate', activateBusiness);
router.get('/:id/access', verifyBusinessAccess);

export default router;
