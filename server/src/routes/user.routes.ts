import { Router } from 'express';
import { getAllUsers } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/users - Returns list of potential chat partners
router.get('/', authenticate, getAllUsers);

export default router;
