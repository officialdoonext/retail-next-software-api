import { Router } from 'express';
import { getUploadAuth } from '../controllers/upload.controller.js';

const router = Router();

// GET /api/v1/upload/auth - For client-side image uploading to ImageKit
router.get('/auth', getUploadAuth);

export default router;
