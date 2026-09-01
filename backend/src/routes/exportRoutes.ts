import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { exportLogs, getExportStatus } from '../controllers/exportController';

const router = Router();

router.use(requireAuth);
router.post('/logs', exportLogs);
router.get('/logs/:jobId', getExportStatus);

export default router;
