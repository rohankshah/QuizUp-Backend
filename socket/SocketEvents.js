const { number_of_players } = require("../contants/constants");
const { tryMatchUsers, runQuizLoop } = require("./GameLogic");
const { removeActiveUser } = require("./state/activeUsers");
const {
  getMatchReadiness,
  deleteMatchReadiness,
} = require("./state/matchReadiness");
const { isInQueue, enqueue, removeFromQueue } = require("./state/queue");
const { getUserObject } = require("./state/userObjects");

function handleJoinQueue(io, userId) {
  if (!isInQueue(userId)) {
    enqueue(userId);
    const userObj = getUserObject(userId);
    console.log(`${userObj.username} joined the queue`);
  }
  tryMatchUsers(io);
}

function handleCreateRoom(io, userId) {
  // Check if user isn't in any other room??
  // Generate roomId
  // Store roomId on redis (add ttl so room automatically expires after a while)
  // Emit roomId to user
}

function handleClientReady(io, matchId, userId) {
  const match = getMatchReadiness(matchId);
  if (!match) return;

  match.ready.add(userId);

  if (match.ready.size === number_of_players) {
    runQuizLoop(io, match.players);
    deleteMatchReadiness(matchId);
  }
}

function handleDisconnect(userId) {
  removeActiveUser(userId);
  removeFromQueue(userId);
  const userObj = getUserObject(userId);
  console.log(`${userObj.username} disconnected`);
}

module.exports = {
  handleJoinQueue,
  handleCreateRoom,
  handleClientReady,
  handleDisconnect,
};
