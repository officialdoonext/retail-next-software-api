import express from 'express';
import {
  getBusinesses,
  createBusiness,
  activateBusiness,
  verifyBusinessAccess
} from '../controllers/businesses.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);
router.get('/', getBusinesses);
router.post('/', createBusiness);
router.post('/:id/activate', activateBusiness);
router.get('/:id/verify', verifyBusinessAccess);

export default router;
