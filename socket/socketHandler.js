const questions = require("../questions");


// Client added to active users when connected
// Client added to queue on receiving "join-queue" event
// Two players from top of queue are matched. Each client sent => {matchId, opponentId}
// Both players added to matchReadiness object
// "start-quiz" event emitted
// Listen for "client-ready" event. Once both clients send event (track using set in the matchReadiness object), questions are sent

const activeUsers = new Map(); // userId -> socketId
const matchReadiness = new Map(); // matchId -> { ready: Set of userIds, players: [player1, player2] }
const queue = [];

function socketHandler(io, socket, userObjects) {
  const userId = socket.user.id;
  activeUsers.set(userId, socket.id);

  socket.on("join-queue", () => {
    if (!queue.includes(userId)) {
      queue.push(userId);
      console.log(`${userId} joined the queue`);
    }
    tryMatchUsers(io, userObjects);
  });

  socket.on("client-ready", (matchId) => {
    const match = matchReadiness.get(matchId);
    if (!match) return;

    match.ready.add(userId);

    if (match.ready.size === 2) {
      runQuizLogic(io, ...match.players);
      matchReadiness.delete(matchId);
    }
  });

  socket.on("disconnect", () => {
    activeUsers.delete(userId);
    const index = queue.indexOf(userId);
    if (index !== -1) queue.splice(index, 1);
    console.log(`${userId} disconnected`);
  });
}

function tryMatchUsers(io, userObjects) {
  while (queue.length >= 2) {
    const [player1, player2] = queue.splice(0, 2);

    const socket1 = getSocketIdByPlayerId(io, activeUsers, player1);
    const socket2 = getSocketIdByPlayerId(io, activeUsers, player2);

    const matchId = `${player1}_${player2}_${Date.now()}`;

    socket1.emit("matched", {
      opponentObj: userObjects.get(player2),
      matchId: matchId,
    });
    socket2.emit("matched", {
      opponentObj: userObjects.get(player1),
      matchId: matchId,
    });

    io.to(socket1.id).emit("start-quiz", { matchId });
    io.to(socket2.id).emit("start-quiz", { matchId });

    console.log(`Match started: ${player1} vs ${player2}`);

    matchReadiness.set(matchId, {
      ready: new Set(),
      players: [player1, player2],
    });
  }
}

function runQuizLogic(io, player1, player2) {
  console.log("running logic");
  // let count = 10;
  // while (count > 0) {
  //   let questionObj = questions[count - 1];
  //   console.log(questionObj);
  //   count -= 1;
  // }
  // console.log('done')
}

function getSocketIdByPlayerId(io, activeUsers, playerId) {
  const socket = io.sockets.sockets.get(activeUsers.get(playerId));
  return socket;
}

module.exports = socketHandler;
