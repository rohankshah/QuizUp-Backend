const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const socketHandler = require("../socket/socketHandler");
const { SocketEvents } = require("../contants/constants");
const { setUserObject } = require("../socket/state/userObjects");
const { createAdapter } = require("@socket.io/redis-adapter");

function initializeServer(app, pubClient, subClient) {
  const server = http.createServer(app);

  // Connect socket.io
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
    adapter: createAdapter(pubClient, subClient),
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on(SocketEvents.CONNECTION, (socket) => {
    const userId = socket.user.id;
    setUserObject(userId, socket.user);
    socketHandler(io, socket);
  });

  return server;
}

module.exports = { initializeServer };
