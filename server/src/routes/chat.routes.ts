import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createOneOnOneChat, getChatMessages, getMyChats } from '../controllers/chat.controller';

const router = Router();

router.post('/', authenticate, createOneOnOneChat);
router.get('/', authenticate, getMyChats);
router.get('/:conversationId/messages', authenticate, getChatMessages);

export default router;
