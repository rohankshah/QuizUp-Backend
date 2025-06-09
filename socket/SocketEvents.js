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

function handleClientReady(io, matchId, userId) {
  const match = getMatchReadiness(matchId);
  if (!match) return;

  match.ready.add(userId);

  if (match.ready.size === 3) {
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
  handleClientReady,
  handleDisconnect,
};
