import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Retail Next API is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

export default router;
