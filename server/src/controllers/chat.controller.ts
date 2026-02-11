import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// 1. Start 1:1 Chat (Find existing or Create new)
export const startChat = async (req: AuthRequest, res: Response) => {
  const { partnerId } = req.body;
  const userId = req.user!.userId;

  try {
    // Check if 1:1 chat already exists
    // Logic: Find a chat that is NOT a group AND contains BOTH users
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: userId } } },
          { participants: { some: { userId: partnerId } } },
        ],
      },
      include: {
        participants: { include: { user: true } },
      },
    });

    if (existing) {
      return res.json({ data: existing });
    }

    // Create new 1:1 Chat
    const newChat = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId: userId }, { userId: partnerId }],
        },
      },
      include: {
        participants: { include: { user: true } },
      },
    });

    res.json({ data: newChat });
  } catch (error) {
    console.error('Start chat error:', error);
    res.status(500).json({ error: 'Failed to start chat' });
  }
};

// 2. Create a Group Chat
export const createGroup = async (req: AuthRequest, res: Response) => {
  const { name, memberIds } = req.body;
  const creatorId = req.user!.userId;

  // Combine creator + selected members
  // We use a Set to ensure unique IDs
  const allUserIds = [...new Set([...memberIds, creatorId])];

  try {
    const group = await prisma.conversation.create({
      data: {
        name,
        isGroup: true,
        // Explicitly create entries in the join table
        participants: {
          create: allUserIds.map((id) => ({
            userId: id as string,
          })),
        },
      },
      include: {
        participants: {
          include: { user: true },
        },
      },
    });
    res.json({ data: group });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

// 3. Fetch All Chats (1:1 + Groups)
export const getConversations = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: userId }, // Check the join table for my ID
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true }, // Only need names for UI
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Optional: for "Last message" preview
        },
      },
    });
    res.json({ data: conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

// 4. Get Messages for a specific Chat
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        conversationId: chatId as string, // <--- FIX: Add 'as string' here
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    res.status(200).json({
      status: 'success',
      data: messages,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};
