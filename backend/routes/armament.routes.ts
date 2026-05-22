import { Router } from 'express';
import { ArmamentController } from '../controllers/armament.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Define as rotas:
router.get('/', ArmamentController.list);
router.post('/', ArmamentController.create);
router.put('/:id', ArmamentController.update);
router.delete('/:id', ArmamentController.delete);

export default router;