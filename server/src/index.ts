import express, { Application, Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import userRoutes from './routes/user.routes';
import { errorHandler } from './middleware/error.middleware';
import { initSocket } from './socket';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// 1. Middleware Stack
app.use(helmet()); // Security headers
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(morgan('dev')); // Request logging
app.use(express.json()); // JSON body parsing
app.use(errorHandler); // Centralized error handling

const server = http.createServer(app);

initSocket(server);

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);

// 2. Base Health Check Route
app.get('/health', (_: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

// 3. Start the Server
server.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});

export { app, server };
