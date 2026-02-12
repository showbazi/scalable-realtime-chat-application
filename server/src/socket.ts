import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { MessageService } from './services/message.service';
import jwt from 'jsonwebtoken';

// Map to store: userId -> socketId
const onlineUsers = new Map<string, string>();

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const decodeToken = (token: string) => {
  try {
    // Verify ensures the token is valid and not expired
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    console.error('Invalid socket token:', error);
    return null;
  }
};

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // FOR DEMO AND DEVELOPMENT ONLY - RESTRICT IN PRODUCTION
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Extract the token passed from the frontend's useSocket hook
    const token = socket.handshake.auth.token;
    const decoded = token ? decodeToken(token) : null;
    if (decoded) {
      const userId = decoded.userId;

      // Update with the latest connection
      onlineUsers.set(userId, socket.id);

      // Force an immediate broadcast so everyone sees the new connection
      io.emit('get_online_users', Array.from(onlineUsers.keys()));

      //  notifies JUST you about who is already here
      socket.on('request_online_users', () => {
        socket.emit('get_online_users', Array.from(onlineUsers.keys()));
      });

      socket.on('disconnect', () => {
        // We wait 1 second before removing the user
        // If they refreshed, the NEW socket is already in the map, so we don't delete it
        setTimeout(() => {
          if (onlineUsers.get(userId) === socket.id) {
            onlineUsers.delete(userId);
            io.emit('get_online_users', Array.from(onlineUsers.keys()));
          }
        }, 1000);
      });
    }

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    });

    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, senderId } = data;

        // 1. Save to Database
        const savedMessage = await MessageService.saveMessage(senderId, conversationId, content);

        // 2. IMPORTANT: Broadcast to EVERYONE in the room (including you)
        // io.to() ensures that both participants receive the live update
        io.to(conversationId).emit('new_message', savedMessage);
      } catch (error) {
        console.error('Message error:', error);
      }
    });
  });

  return io;
};
