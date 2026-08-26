import express from 'express';
import { getUploadAuth, uploadFile } from '../controllers/upload.controller.js';

const router = express.Router();

router.get('/auth', getUploadAuth);
router.post('/', uploadFile);

export default router;
