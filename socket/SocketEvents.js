const {
  number_of_players,
  room_ttl,
  SocketEvents,
} = require("../contants/constants");
const {
  tryMatchUsers,
  runQuizLoop,
  runQuizLoopForRoom,
} = require("./GameLogic");
const { removePlayerFromRoom, delay } = require("./GameUtils");
const { emitToRoom } = require("./SocketUtils");
const { removeActiveUser } = require("./state/activeUsers");
const {
  getMatchReadiness,
  deleteMatchReadiness,
} = require("./state/matchReadiness");
const { isInQueue, enqueue, removeFromQueue } = require("./state/queue");
const { getUserObject } = require("./state/userObjects");
const { v4: uuidv4 } = require("uuid");

function handleJoinQueue(io, socket) {
  const userId = socket.user.id;
  if (!userId) return;

  if (!isInQueue(userId)) {
    enqueue(userId);
    const userObj = getUserObject(userId);
    console.log(`${userObj.username} joined the queue`);
  }
  tryMatchUsers(io);
}

async function handleCreateRoom(io, socket, pubClient) {
  const userId = socket.user.id;
  if (!userId) return;

  // Check if user isn't in any other room??
  const existingRoom = await pubClient.hGet(`user:${userId}`, "currentRoom");
  if (existingRoom) {
    socket.emit("error", {
      message: `You are already in a room: ${existingRoom}`,
    });
    return;
  }

  // Generate roomId
  const roomId = uuidv4();

  // Add room/user to redis
  const roomKey = `room:${roomId}`;
  const userKey = `user:${userId}`;

  const players = JSON.stringify([userId]);

  await pubClient
    .multi()
    .hSet(roomKey, {
      hostId: userId,
      players: players,
      createdAt: new Date().toISOString(),
      categoryId: "1"
    })
    .expire(roomKey, room_ttl)
    .hSet(userKey, "currentRoom", roomId)
    .expire(userKey, room_ttl)
    .exec();

  // Join room
  socket.join(roomId);

  socket.emit(SocketEvents.ROOM_JOINED, { roomId });
}

async function handleJoinRoom(io, socket, pubClient, roomId) {
  const userId = socket.user.id;
  if (!userId) return;

  // Check if user is already in a room
  const existingRoom = await pubClient.hGet(`user:${userId}`, "currentRoom");
  if (existingRoom) {
    socket.emit("error", {
      message: `You are already in a room: ${existingRoom}`,
    });
    return;
  }

  const roomKey = `room:${roomId}`;
  const userKey = `user:${userId}`;

  const roomExists = await pubClient.exists(roomKey);
  if (!roomExists) {
    socket.emit("error", {
      message: `Room ${roomId} does not exist.`,
    });
    return;
  }

  const roomData = await pubClient.hGet(roomKey, "players");
  let players = [];
  try {
    players = JSON.parse(roomData);
  } catch (err) {
    players = [];
  }

  if (!players.includes(userId)) {
    players.push(userId);
    await pubClient
      .multi()
      .hSet(roomKey, "players", JSON.stringify(players))
      .hSet(userKey, "currentRoom", roomId)
      .expire(userKey, room_ttl)
      .exec();
  }

  socket.join(roomId);

  socket.emit(SocketEvents.ROOM_JOINED, { roomId });

  socket.to(roomId).emit(SocketEvents.PLAYER_JOINED, getUserObject(userId));
}

async function handleGetRoomInformation(
  io,
  socket,
  pubClient,
  roomId,
  callback
) {
  const userId = socket.user.id;
  if (!userId) return;

  const roomKey = `room:${roomId}`;
  const userKey = `user:${userId}`;

  const roomExists = await pubClient.exists(roomKey);
  if (!roomExists) {
    socket.emit("error", {
      message: `Room ${roomId} does not exist.`,
    });
    return;
  }

  const roomData = await pubClient.hGetAll(roomKey);

  let parsedRoomData;
  try {
    const playerIds = JSON.parse(roomData.players ?? "[]");

    const playersWithDetails = await Promise.all(
      playerIds.map(async (playerId) => {
        return await getUserObject(playerId);
      })
    );

    parsedRoomData = {
      ...roomData,
      players: playersWithDetails,
    };
  } catch (err) {
    parsedRoomData = {
      ...roomData,
      players: [],
    };
  }

  callback({ roomData: parsedRoomData });
}

async function handleCategoryChange(io, socket, pubClient, roomId, categoryId) {
  const userId = socket.user.id;
  if (!userId) return;

  const roomKey = `room:${roomId}`;

  const roomExists = await pubClient.exists(roomKey);
  if (!roomExists) {
    socket.emit("error", {
      message: `Room ${roomId} does not exist.`,
    });
    return;
  }

  await pubClient.hSet(roomKey, "categoryId", categoryId);


  emitToRoom(io, roomId, SocketEvents.CATEGORY_CHANGE, {
    roomId: roomId,
    categoryId: categoryId,
  });
}

async function handleGameStart(
  io,
  socket,
  pubClient,
  roomId,
  numberOfQuestions = 5
) {
  emitToRoom(io, roomId, SocketEvents.ROOM_QUIZ_STARTED);
  await delay(3);
  runQuizLoopForRoom(io, pubClient, roomId, numberOfQuestions);
}

function handleClientReady(io, matchId, socket) {
  const userId = socket.user.id;
  if (!userId) return;

  const match = getMatchReadiness(matchId);
  if (!match) return;

  match.ready.add(userId);

  if (match.ready.size === number_of_players) {
    runQuizLoop(io, match.players);
    deleteMatchReadiness(matchId);
  }
}

async function handleDisconnect(socket, pubClient) {
  const userId = socket.user.id;
  if (!userId) return;

  removeActiveUser(userId);
  removeFromQueue(userId);

  await removePlayerFromRoom(socket, pubClient, userId);

  const userObj = getUserObject(userId);
  console.log(`${userObj.username} disconnected`);
}

module.exports = {
  handleJoinQueue,
  handleCreateRoom,
  handleJoinRoom,
  handleGetRoomInformation,
  handleCategoryChange,
  handleGameStart,
  handleClientReady,
  handleDisconnect,
};
