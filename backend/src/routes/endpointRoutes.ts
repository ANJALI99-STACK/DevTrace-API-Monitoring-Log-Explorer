import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listEndpoints,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  toggleEndpoint,
} from '../controllers/endpointController';

const router = Router();

router.use(requireAuth);
router.get('/', listEndpoints);
router.post('/', createEndpoint);
router.put('/:id', updateEndpoint);
router.delete('/:id', deleteEndpoint);
router.patch('/:id/toggle', toggleEndpoint);

export default router;
