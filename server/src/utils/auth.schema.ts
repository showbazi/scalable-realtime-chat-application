import { z } from 'zod';

export const SignupSchema = z
  .object({
    username: z.string().min(3).max(20).trim(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Values do not match', // Cryptic message for internal validation
    path: ['confirmPassword'],
  });

export const LoginSchema = z.object({
  username: z.string().trim(),
  password: z.string(),
});
