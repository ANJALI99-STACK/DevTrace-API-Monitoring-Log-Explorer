import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { searchLogs } from '../controllers/logController';

const router = Router();

router.use(requireAuth);
router.get('/', searchLogs);

export default router;
