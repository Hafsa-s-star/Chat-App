# Gather chat

A real-time, one-to-one chat app built with React, Express, Socket.IO, and MongoDB.

## Run locally

1. Install dependencies:

   ```powershell
   cd Backend
   npm install
   cd ..\Frontend
   npm install
   ```

2. Configure the backend:

   ```powershell
   cd ..\Backend
   Copy-Item .env.example .env
   ```

   Set `MONGODB_URI` to a local MongoDB instance or your MongoDB Atlas connection string. Replace `JWT_SECRET` with a long, random secret. The backend exits with an explicit error if either required value is missing.

3. Start the backend in one terminal:

   ```powershell
   npm run dev
   ```

4. Start the frontend in another terminal:

   ```powershell
   cd Frontend
   npm run dev
   ```

   You can also start the frontend from the project root with `npm run dev`. The root `npm run backend` command starts the backend.

5. Create accounts in two browser sessions to send messages between users.

The backend defaults to `http://localhost:3000`, and Vite defaults to `http://localhost:5173`. Configure `FRONTEND_ORIGIN` in `Backend/.env` if you use another frontend origin. Set `VITE_API_URL` in the frontend environment if the API runs somewhere other than `http://localhost:3000`.

## API

- `POST /api/auth/register` — create an account
- `POST /api/auth/login` — sign in with username or email
- `GET /api/auth/me` — get the current account
- `POST /api/auth/logout` — clear the session
- `GET /api/chat/users` — list people
- `GET /api/chat/messages/:userId` — load the latest messages
- `POST /api/chat/messages/:userId` — send a message
- `GET /api/health` — health check

Authentication uses an HTTP-only cookie. New messages are saved to MongoDB and delivered to both participants over Socket.IO.
