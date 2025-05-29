const { getSocketId } = require("./state/activeUsers");

function getSocketIdByPlayerId(io, playerId) {
  const socket = io.sockets.sockets.get(getSocketId(playerId));
  return socket;
}

function delay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

module.exports = { getSocketIdByPlayerId, delay };
