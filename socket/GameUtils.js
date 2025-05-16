const { getSocketId } = require("./state/activeUsers");

function getSocketIdByPlayerId(io, playerId) {
  const socket = io.sockets.sockets.get(getSocketId(playerId));
  return socket;
}

module.exports = { getSocketIdByPlayerId };
