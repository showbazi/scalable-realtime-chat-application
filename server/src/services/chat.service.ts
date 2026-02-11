import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ChatService = {
  // 1. Fetch all conversations for a user
  getUserConversations: async (userId: string) => {
    return await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  },

  // 2. Create or Find a 1:1 Chat
  startOneOnOneChat: async (userId: string, partnerId: string) => {
    // Check for existing 1:1 chat
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: partnerId } } },
        ],
      },
      include: {
        participants: { include: { user: true } },
      },
    });

    if (existing) return existing;

    // Create new
    return await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId }, { userId: partnerId }],
        },
      },
      include: {
        participants: { include: { user: true } },
      },
    });
  },

  // 3. Create a Group Chat
  createGroupChat: async (creatorId: string, name: string, memberIds: string[]) => {
    const allUserIds = [...new Set([...memberIds, creatorId])];

    return await prisma.conversation.create({
      data: {
        name,
        isGroup: true,
        participants: {
          create: allUserIds.map((id) => ({ userId: id })),
        },
      },
      include: {
        participants: { include: { user: true } },
      },
    });
  },
};
