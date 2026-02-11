import { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SignupSchema, LoginSchema } from '../utils/auth.schema';

const prisma = new PrismaClient();

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = SignupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });

    if (existingUser) {
      return res.status(409).json({
        status: 'fail',
        message: 'User already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    const user = await prisma.user.create({
      data: { username: validatedData.username, password: hashedPassword },
      select: { id: true, username: true },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '24h',
    });

    // 201 Created: Standard for successful resource creation
    res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { username: validatedData.username } });

    if (!user || !(await bcrypt.compare(validatedData.password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication failed',
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '24h',
    });

    res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    next(error);
  }
};
