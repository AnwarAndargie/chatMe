<div align="center">

# chatMe

**Real-time one-to-one messaging for the web: live delivery, presence, edits and unread counts.**

[Live demo](https://chat-me-1.vercel.app) · [Report a bug](https://github.com/AnwarAndargie/chatMe/issues)

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-149ECA?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Pusher](https://img.shields.io/badge/Pusher-300D4F?style=flat-square&logo=pusher&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

</div>

---

## Why

chatMe is a messaging app in the style of WhatsApp Web. It runs on serverless hosting with no socket server to keep alive. Messages are written to Postgres first, then fanned out over Pusher channels, so every client sees the same state within milliseconds and nothing is lost on refresh.

## Features

- **Live messaging:** new, edited and deleted messages appear on both sides instantly.
- **Presence:** online/offline status from a Pusher presence channel, plus an "Online" filter in the sidebar.
- **Unread counts:** a badge per conversation; messages are marked read when you open the chat.
- **Edit and delete:** edited messages are tagged with "edited"; deleted messages are soft-deleted, so history stays consistent.
- **Auth:** email and password, or Google sign-in, through [Better Auth](https://www.better-auth.com/).
- **Profiles:** change your display name and avatar; open another user's profile from the chat.
- **Light and dark themes** and a responsive layout with a collapsible sidebar on mobile.

## Architecture

```mermaid
flowchart LR
    subgraph Browser
        UI[React 19 UI]
        PC[pusher-js client]
    end

    subgraph Next.js 16 on Vercel
        Proxy[proxy.ts<br/>session gate for /chat]
        API[Route handlers<br/>/api/chats · /api/messages · /api/users]
        PA[/api/pusher/auth/]
        BA[Better Auth<br/>/api/auth/*]
    end

    DB[(PostgreSQL<br/>via Prisma)]
    P{{Pusher Channels}}

    UI -- fetch --> API
    UI -- sign in --> BA
    API -- write first --> DB
    API -- then trigger --> P
    PC -- subscribe --> P
    PC -- authorize presence --> PA
    BA --> DB
    Proxy -.-> API
```

**Message flow:** the client sends `POST /api/messages`. The route checks the session, checks that the sender is a participant in the chat, and saves the message. It then triggers `message:new` on `chat-<id>`. Every subscriber appends the message without a refetch. Edits and deletes follow the same path with `message:edited` and `message:deleted`.

**Presence:** clients join the `presence-users` channel. `/api/pusher/auth` signs the subscription with the user's id, name and avatar, and `member_added` / `member_removed` events update the online dots.

## Tech stack

| Layer     | Choice                                                    |
| --------- | --------------------------------------------------------- |
| Framework | Next.js 16 (App Router, route handlers, `proxy.ts`)       |
| UI        | React 19, Tailwind CSS v4, Radix UI, shadcn/ui, Lucide    |
| Auth      | Better Auth (email and password, Google OAuth) + Prisma adapter |
| Data      | PostgreSQL, Prisma 7 with the `pg` driver adapter         |
| Real-time | Pusher Channels (public chat channels + presence channel) |
| Hosting   | Vercel                                                    |

## Data model

```
User ──< Session / Account          (Better Auth)
User >──< ChatSession               (participants, participantIds[])
ChatSession ──< Message             (sender, receiver, isRead, isEdited, isDeleted)
```

Indexes are on `sessionId`, `senderId` and `receiverId`. Chats are sorted by `lastMessageAt`.

## API

| Method   | Route                      | What it does                                      |
| -------- | -------------------------- | ------------------------------------------------- |
| `GET`    | `/api/chats`               | Your conversations, each with its last message and unread count |
| `POST`   | `/api/chats`               | Start or reopen a conversation with a user        |
| `GET`    | `/api/messages?chatId=`    | Message history (participants only)               |
| `POST`   | `/api/messages`            | Send a message and broadcast it                   |
| `PATCH`  | `/api/messages/:id`        | Edit your own message                             |
| `DELETE` | `/api/messages/:id`        | Soft-delete your own message                      |
| `POST`   | `/api/messages/read`       | Mark a conversation as read                       |
| `GET`    | `/api/users`               | People you can message                            |
| `PATCH`  | `/api/users/me`            | Update your name or avatar                        |
| `POST`   | `/api/pusher/auth`         | Sign a presence-channel subscription              |

Every route checks the Better Auth session on the server. `proxy.ts` only redirects signed-out visitors away from `/chat` early.

## Getting started

**Prerequisites:** Node.js 20+, a PostgreSQL database (local, Neon or Supabase), a free [Pusher Channels](https://pusher.com/channels) app, and optionally a Google OAuth client.

```bash
git clone https://github.com/AnwarAndargie/chatMe.git
cd chatMe
npm install
```

Create `.env`:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/chatme"

BETTER_AUTH_SECRET="generate-a-long-random-string"
BETTER_AUTH_URL="http://localhost:3000"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER="mt1"
NEXT_PUBLIC_PUSHER_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER="mt1"
```

Run the migrations, then start the dev server:

```bash
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up in two browsers, or one normal and one private window, to chat with yourself.

## Scripts

| Command         | Does                                  |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start the dev server                  |
| `npm run build` | `prisma generate` + production build  |
| `npm run start` | Serve the production build            |
| `npm run lint`  | ESLint                                |

## Project structure

```
app/
  api/            route handlers (auth, chats, messages, users, pusher)
  chat/           the messaging screen
components/
  chat/           sidebar, conversation, input, message, profile sheets
  providers/      Pusher client provider
lib/              auth, prisma, pusher clients
prisma/           schema and migrations
proxy.ts          session gate for /chat
```

## Roadmap

- [ ] Move chat channels to `private-` channels, authorized per participant
- [ ] Typing indicators and delivered/read ticks
- [ ] Image and file messages
- [ ] Group chats
- [ ] Cursor-based pagination for long histories
