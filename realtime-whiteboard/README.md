# 🎨 Real-Time Collaborative Whiteboard

> Midterm project — Web Programming & Applications  
> Topic 4: Real-Time Web: WebSockets & Server-Sent Events

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Real-time (bi-directional) | Socket.io (WebSocket) |
| Real-time (one-way push) | Server-Sent Events (SSE) |
| Database | MongoDB + Mongoose |
| AI Integration | Google Gemini API  |

## Features

- 🖊️ Real-time collaborative drawing (WebSocket)
- 👆 Live cursor tracking for all users
- 💬 Chat room with real-time messaging
- 🤖 AI drawing assistant (`/ai draw a cat`)
- 🔔 User join/leave notifications (SSE)
- 🏠 Multiple isolated rooms
- 💾 Persistent canvas state (MongoDB)
- ↩️ Undo support

## Setup Instructions

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- Anthropic API key

### 1. Clone & install

```bash
git clone <your-repo-url>
cd realtime-whiteboard

# Backend
cd backend
cp .env.example .env
# Edit .env with your values
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment variables (backend/.env)

```
PORT=3001
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/whiteboard
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

### Test credentials

- Enter any name and room ID to join
- Use the same room ID on two browser windows to test real-time sync
- Type `/ai draw a circle` in chat to test AI drawing

## Architecture

See system architecture diagram in the project report.

## Team Members

| Name | Student ID | Role |
|---|---|---|
| Member 1 | ... | Backend + Socket.io |
| Member 2 | ... | Frontend + UI/UX |
