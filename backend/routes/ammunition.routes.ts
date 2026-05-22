import { Router } from 'express';
import { AmmunitionController } from '../controllers/ammunition.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', AmmunitionController.list);
router.post('/', AmmunitionController.create);

export default router;