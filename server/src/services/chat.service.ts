import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ChatService {
  /**
   * Creates a private 1:1 conversation
   * Logic: Links exactly two users to a single Conversation record.
   */
  static async createConversation(userIds: string[]) {
    return prisma.conversation.create({
      data: {
        participants: {
          // Creates the links in the ConversationParticipant join table
          create: userIds.map((id) => ({ userId: id })),
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
      },
    });
  }

  /**
   * Finds all conversations for a specific user
   */
  static async getUserConversations(userId: string) {
    return prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
        // Fetches the most recent message to show in the chat list
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' }, // Orders by most recently active chat
    });
  }
}
