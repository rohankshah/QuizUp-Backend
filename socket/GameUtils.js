const { SocketEvents } = require("../contants/constants");
const { quiz_categories } = require("../questions/index");
const { getSocketId } = require("./state/activeUsers");
const { getUserObject } = require("./state/userObjects");

function getSocketIdByPlayerId(io, playerId) {
  const socket = io.sockets.sockets.get(getSocketId(playerId));
  return socket;
}

async function removePlayerFromRoom(socket, pubClient, userId) {
  const roomId = await pubClient.hGet(`user:${userId}`, "currentRoom");

  if (!roomId) {
    return;
  }

  const roomKey = `room:${roomId}`;
  const userKey = `user:${userId}`;

  await pubClient.del(userKey);

  const roomExists = await pubClient.exists(roomKey);
  if (!roomExists) {
    return;
  }

  const hostId = await pubClient.hGet(roomKey, "hostId");

  // If host, delete the whole room
  if (hostId && hostId === userId) {
    await pubClient.del(roomKey);
    return;
  }

  // If not host, remove user from players array and update
  const roomData = await pubClient.hGet(roomKey, "players");
  let players = [];
  try {
    players = JSON.parse(roomData);
  } catch (err) {
    players = [];
  }

  if (players.includes(userId)) {
    players = players.filter((player) => player !== userId);
    await pubClient.hSet(roomKey, "players", JSON.stringify(players));
  }

  // Emit to remaining room sockets that player has been removed
  const userObj = getUserObject(userId);
  socket.to(roomId).emit(SocketEvents.PLAYER_LEFT, userObj);
}

function delay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

function createScoreArray(scoreMap) {
  return Array.from(scoreMap)
    .map(([userId, score]) => ({
      user: {
        username: getUserObject(userId).username,
        userId: userId,
      },
      score: score,
    }))
    .sort((a, b) => b.score - a.score);
}

function processAnswers(answers, correctAnswer, scoreMap) {
  const answerResults = {};
  const playersBySelectedOption = new Map(); // option -> players who select option Array

  for (const [playerId, selectedAnswer] of Object.entries(answers)) {
    const isCorrect = selectedAnswer === correctAnswer;
    answerResults[playerId] = { isCorrect, selectedAnswer };

    const oldSelectedOptionsArr =
      playersBySelectedOption.get(selectedAnswer) || [];
    playersBySelectedOption.set(selectedAnswer, [
      ...oldSelectedOptionsArr,
      getUserObject(playerId).username,
    ]);

    const points = isCorrect ? 1 : 0;
    const oldValue = scoreMap.get(playerId) || 0;
    scoreMap.set(playerId, oldValue + points);
  }

  return { answerResults, playersBySelectedOption };
}

function getRandomQuestionsByCategoryId(categoryId, numberOfQuestions) {
  const category = quiz_categories.find(
    (category) => category?.id === categoryId
  );
  const allQuestions = category?.questions;
  const randomQuestions = getRandomElements(allQuestions, numberOfQuestions);
  return randomQuestions;
}

function getRandomElements(arr, n) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.slice(0, n);
}

module.exports = {
  getSocketIdByPlayerId,
  removePlayerFromRoom,
  delay,
  createScoreArray,
  processAnswers,
  getRandomQuestionsByCategoryId,
};
