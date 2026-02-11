import { Router } from 'express';
import {
  startChat,
  createGroup,
  getConversations,
  getMessages,
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', startChat); // Start 1:1
router.post('/group', createGroup); // Start Group
router.get('/', getConversations); // List all
router.get('/:chatId/messages', getMessages); // Get history

export default router;
