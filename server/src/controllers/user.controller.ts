import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.userId;

    // Fetch all users except the current one
    const users = await prisma.user.findMany({
      where: {
        NOT: { id: currentUserId },
      },
      select: {
        id: true,
        username: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
