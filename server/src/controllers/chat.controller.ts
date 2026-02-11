import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { ChatService } from '../services/chat.service';
import { MessageService } from '../services/message.service';

interface CreateChatRequest {
  partnerId: string;
}

const prisma = new PrismaClient();

export const createOneOnOneChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { partnerId } = req.body as CreateChatRequest;
    const currentUserId = req.user?.userId;

    if (!currentUserId || !partnerId) {
      return res.status(400).json({ status: 'fail', message: 'Partner ID is required' });
    }

    // Check if a chat already exists between these two users
    const existingChat = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId: partnerId } } },
        ],
      },
    });

    if (existingChat) {
      return res.status(200).json({ status: 'success', data: existingChat });
    }

    // Create a simple shared room
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: currentUserId }, { userId: partnerId }],
        },
      },
    });

    res.status(201).json({ status: 'success', data: conversation });
  } catch (error) {
    next(error);
  }
};

export const getMyChats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ status: 'fail', message: 'Unauthorized' });

    const chats = await ChatService.getUserConversations(userId);

    res.status(200).json({
      status: 'success',
      data: chats,
    });
  } catch (error) {
    next(error);
  }
};

export const getChatMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params; // Get ID from URL

    // Fetch the last 50 messages using our service
    const messages = await MessageService.getHistory(conversationId as string);

    res.status(200).json({
      status: 'success',
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};
