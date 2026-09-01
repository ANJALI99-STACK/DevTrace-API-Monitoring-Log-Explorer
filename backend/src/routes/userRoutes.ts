import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getProfile, updatePassword } from '../controllers/userController';

const router = Router();

router.use(requireAuth);
router.get('/profile', getProfile);
router.put('/password', updatePassword);

export default router;
