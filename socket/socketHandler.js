const { SocketEvents } = require("../contants/constants");
const {
  handleJoinQueue,
  handleClientReady,
  handleDisconnect,
  handleCreateRoom,
  handleJoinRoom,
  handleGetRoomInformation,
  handleGameStart,
  handleCategoryChange,
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

  socket.on(SocketEvents.JOIN_ROOM, (data) => {
    handleJoinRoom(io, socket, pubClient, data.roomId);
  });

  socket.on(SocketEvents.GET_ROOM_INFO_BY_ID, (data, callback) => {
    handleGetRoomInformation(io, socket, pubClient, data.roomId, callback);
  });

  socket.on(SocketEvents.CATEGORY_CHANGE, (data) => {
    handleCategoryChange(io, socket, pubClient, data.roomId, data.categoryId);
  });

  socket.on(SocketEvents.ROOM_START_QUIZ, (data) => {
    handleGameStart(io, socket, pubClient, data.roomId);
  });

  socket.on(SocketEvents.CLIENT_READY, (matchId) =>
    handleClientReady(io, matchId, socket)
  );

  socket.on(SocketEvents.DISCONNECT, () => handleDisconnect(socket, pubClient));
}

module.exports = socketHandler;
