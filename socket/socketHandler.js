const { SocketEvents } = require("../contants/constants");
const {
  handleJoinQueue,
  handleClientReady,
  handleDisconnect,
  handleCreateRoom,
} = require("./SocketEvents");
const { addActiveUser } = require("./state/activeUsers");

// Client added to active users when connected
// Client added to queue on receiving "join-queue" event
// Two players from top of queue are matched. Each client sent => {matchId, opponentId}
// Both players added to matchReadiness object
// "start-quiz" event emitted
// Listen for "client-ready" event. Once both clients send event (track using set in the matchReadiness object), questions are sent

function socketHandler(io, socket, pubClient) {
  const userId = socket.user.id;
  addActiveUser(userId, socket.id);

  socket.on(SocketEvents.JOIN_QUEUE, () => handleJoinQueue(io, socket));

  socket.on(SocketEvents.CREATE_ROOM, () =>
    handleCreateRoom(io, socket, pubClient)
  );

  socket.on(SocketEvents.CLIENT_READY, (matchId) =>
    handleClientReady(io, matchId, socket)
  );

  socket.on(SocketEvents.DISCONNECT, () => handleDisconnect(socket));
}

module.exports = socketHandler;
