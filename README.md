# Scalable Realtime Chat Application

A full-stack real-time chat application built to demonstrate **scalable architecture patterns** using Node.js, Socket.io, and React. It features a hybrid data layer that switches between in-memory storage for development and a Redis-ready structure for horizontal scaling.

## **Live Demo:** [https://scalable-realtime-chat-application.vercel.app/](https://scalable-realtime-chat-application.vercel.app/)

## 🚀 Features

- **Real-time Messaging:** Instant bi-directional communication using WebSockets.
- **Scalable Architecture:** Designed with a Pub/Sub pattern to support multiple server instances.
- **Hybrid Presence System:**
  - **Dev/MVP Mode:** Uses in-memory `Set` for zero-dependency local development.
  - **Production/Scale Mode:** Architecture ready to hot-swap to **Redis** for global state management.
- **Persistent Data:** User profiles and chat history stored in **PostgreSQL** (Neon DB).
- **Security:** JWT-based authentication with secure password hashing (Bcrypt).

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Axios, Socket.io Client
- **Backend:** Node.js, Express, Socket.io
- **Database:** PostgreSQL (Managed by Neon), Prisma ORM
- **Infra/DevOps:**
  - **Redis:** (Implemented via Adapter pattern for Pub/Sub scaling)
  - **Hosting:** Render (Backend), Vercel (Frontend)

---

## How to Run Locally

### Prerequisites

- Node.js (v18+)
- PostgreSQL (Local or Cloud URL)
- Redis (Optional - only if running in Scalable Mode)

### 1. Clone the Repo

```bash
git clone [https://github.com/showbazi/scalable-realtime-chat-application](https://github.com/showbazi/scalable-realtime-chat-application)
cd scalable-realtime-chat-application
```

### 2. Start Infrastructure (DB + Redis)

```bash
docker-compose up -d
```

### 3. Backend Setup

```bash
cd server
npm install

# Create .env file
# Update DATABASE_URL="postgresql://user:password@localhost:5432/chat_db"
# Update REDIS_URL="redis://localhost:6379"

# Run Migrations
npx prisma migrate dev

# Start Server
npm run dev
```

### 4. Frontend Setup

```bash
cd client
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:4000" > .env

# Start Client
npm run dev
```

---

## High-Level Architecture

The system follows a Event-Driven Architecture:

1. Client Layer: React app establishes a persistent WebSocket connection to the backend.

2. API Layer: Express handles REST endpoints (Auth, History) while Socket.io handles live events (Typing, New Message).

3. Data Layer:
   - PostgreSQL: Stores relational data (Users, Groups, Messages).

   - State Store (Hybrid): Used for ephemeral data like "Who is Online".
     - Single Node: Uses local memory.

     - Multi Node: Uses Redis Pub/Sub to sync state across instances.

---

## Key Design Decisions

**1. Hybrid State Management (The "Adapter Pattern")**
Instead of hardcoding Redis, I implemented an abstract interface for the OnlineUserManager.

Why: This allows the app to run on a free tier (single instance) without paying for Redis, but allows us to "flip a switch" (USE_REDIS=true) to enable horizontal scaling immediately.

**2. HTTP vs. WebSockets**
**Auth**: Handled via HTTP (REST) to leverage standard security headers and stateless JWT validation.

**Chat**: Handled via WebSockets for low latency. The socket connection is only established after successful HTTP authentication.

**3. Separation of Concerns**
The codebase is a Monorepo structure (client/ and server/ folders). This mimics a production environment where frontend and backend might be deployed to different infrastructure providers (Vercel vs. Render).

---

## Trade-offs & Future Improvements

#### Trade-offs Taken

- **In-Memory Presence (MVP):** For the demo, I used local memory (`Map`) for the "Online Users" list.
  - **Con:** If the server restarts, we lose the online list instantly.

  - **Pro:** Zero cost and zero latency for the demo.

- **Long Polling Fallback:** Socket.io automatically falls back to HTTP Long Polling if WebSockets fail. This increases server load but guarantees connectivity.

#### Future Improvements

**1. Connection Pooling (PgBouncer):**
As WebSocket connections scale to 100k+, opening a new database connection for every query will exhaust PostgreSQL's limits. I would implement PgBouncer to maintain a pool of reusable connections, reducing overhead on the database.

**2. NoSQL Migration:**
Storing millions of chat messages in a relational DB (PostgreSQL) eventually slows down writes. I would migrate the `Messages` table to a write-heavy NoSQL database like Cassandra or MongoDB (Sharded).

**3. Optimized Pagination:**
Currently, the API uses standard `offset` pagination. For large chat histories, I would switch to Cursor-based Pagination (using the last message ID) to make fetching old messages instantly fast, regardless of how far back you scroll.

**4. Thundering Herd Protection:**
If a server restarts, thousands of clients try to reconnect at the exact same millisecond. I would implement Randomized Jitter (Backoff) in the client-side reconnection logic to spread out the load and prevent CPU spikes.
