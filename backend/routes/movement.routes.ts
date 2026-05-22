import { Router } from 'express';
import { MovementController } from '../controllers/movement.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', MovementController.list);
router.post('/', MovementController.create);

export default router;