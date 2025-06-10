const {
  number_of_players,
  room_ttl,
  SocketEvents,
} = require("../contants/constants");
const { tryMatchUsers, runQuizLoop } = require("./GameLogic");
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
    })
    .expire(roomKey, room_ttl)
    .hSet(userKey, "currentRoom", roomId)
    .exec();

  // Join room
  socket.join(roomId);

  socket.emit(SocketEvents.ROOM_JOINED, { roomId });
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

async function handleDisconnect(socket) {
  const userId = socket.user.id;
  if (!userId) return;

  removeActiveUser(userId);
  removeFromQueue(userId);
  const roomId = await redisClient.hGet(`user:${userId}`, "currentRoom");

  if (roomId) {
    // Remove from room's player list before deleting user => room mapping
    await redisClient.del(`user:${userId}`);
  }
  const userObj = getUserObject(userId);
  console.log(`${userObj.username} disconnected`);
}

module.exports = {
  handleJoinQueue,
  handleCreateRoom,
  handleClientReady,
  handleDisconnect,
};
