const { getSocketId } = require("./state/activeUsers");
const { getUserObject } = require("./state/userObjects");

function getSocketIdByPlayerId(io, playerId) {
  const socket = io.sockets.sockets.get(getSocketId(playerId));
  return socket;
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

module.exports = {
  getSocketIdByPlayerId,
  delay,
  createScoreArray,
  processAnswers,
};
