const { tryMatchUsers, runQuizLoop } = require("./GameLogic");
const { removeActiveUser } = require("./state/activeUsers");
const {
  getMatchReadiness,
  deleteMatchReadiness,
} = require("./state/matchReadiness");
const { isInQueue, enqueue, removeFromQueue } = require("./state/queue");

function handleJoinQueue(io, userId) {
  if (!isInQueue(userId)) {
    enqueue(userId);
    console.log(`${userId} joined the queue`);
  }
  tryMatchUsers(io);
}

function handleClientReady(io, matchId, userId) {
  const match = getMatchReadiness(matchId);
  if (!match) return;

  match.ready.add(userId);

  if (match.ready.size === 2) {
    runQuizLoop(io, ...match.players);
    deleteMatchReadiness(matchId);
  }
}

function handleDisconnect(userId) {
  removeActiveUser(userId);
  removeFromQueue(userId);
  console.log(`${userId} disconnected`);
}

module.exports = {
  handleJoinQueue,
  handleClientReady,
  handleDisconnect,
};
