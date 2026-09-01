import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listAlerts, resolveAlert } from '../controllers/alertController';

const router = Router();

router.use(requireAuth);
router.get('/', listAlerts);
router.patch('/:id/resolve', resolveAlert);

export default router;
