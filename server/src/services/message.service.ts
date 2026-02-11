import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class MessageService {
  // Saves the message to Postgres
  static async saveMessage(senderId: string, conversationId: string, content: string) {
    return prisma.message.create({
      data: { content, senderId, conversationId },
      include: { sender: { select: { id: true, username: true } } },
    });
  }

  // Fetches history for the frontend
  static async getHistory(conversationId: string) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }, // Ensure correct sequence
      take: 50,
    });
  }
}
