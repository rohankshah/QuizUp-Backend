require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const socketHandler = require("./socket/socketHandler");
const { SocketEvents } = require("./contants/constants");
const { setUserObject } = require("./socket/state/userObjects");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
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

const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
  }
};

connectMongo();

const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.listen(PORT, () =>
  console.log(`Server + Socket.IO running on port ${PORT}`)
);
