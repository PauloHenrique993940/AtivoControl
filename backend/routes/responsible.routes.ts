import { Router } from 'express';
import { ResponsibleController } from '../controllers/responsible.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', ResponsibleController.list);
router.post('/', ResponsibleController.create);

export default router;