function emitToMultipleSockets(io, sockets, event, payload) {
  sockets.forEach((socket) => {
    io.to(socket.id).emit(event, payload);
  });
}

function emitToRoom(io, roomId, event, payload) {
  io.to(roomId).emit(event, payload);
}

function emitToSingleSocket(socket, event, payload) {
  socket.emit(event, payload);
}

module.exports = { emitToMultipleSockets, emitToSingleSocket, emitToRoom };
