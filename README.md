# Threadbase - Live Chat with Socket.io

Add a real-time chat feature to Threadbase using Socket.io: wrap the HTTP server,
authenticate sockets with JWT, use a room to scope the thread's messages, and wire a
React `useSocket` hook. Two windows on the same thread should see each other's messages
instantly.

## Setup

```bash
# Terminal 1 - the Express + Socket.io server
cd server && cp .env.example .env && npm install && npm start

# Terminal 2 - the React app
cd client && cp .env.development.example .env.development && npm install && npm run dev
```

The Socket.io server and client dependencies are included in their respective package
manifests. Copy the example environment files before starting either application.

## What is implemented

- The existing Express login and protected API continue to use JWT authentication.
- Socket.io authenticates each connection from its handshake token.
- Authenticated clients join rooms and exchange validated messages only within those rooms.
- The React `useSocket` hook connects with the current JWT and cleans up its listener and
  connection when the room or authentication changes.

## Testing your work

- Open the app, log in as **Ada**. Open a second browser window (or incognito), log in as **Linus**.
- Type in one window and press Send. The message should appear in **both** windows in well under a second.
- Log in credentials: `ada@threadbase.dev` / `password` and `linus@threadbase.dev` / `password`.

The existing login page, auth context, `/auth/login` endpoint, and `/api/me` route remain
in place.
