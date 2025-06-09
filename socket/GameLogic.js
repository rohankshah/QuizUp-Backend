const { SocketEvents } = require("../contants/constants");
const questions = require("../questions");
const {
  getSocketIdByPlayerId,
  delay,
  createScoreArray,
  processAnswers,
} = require("./GameUtils");
const { emitToMultipleSockets, emitToSingleSocket } = require("./SocketUtils");
const { setMatchReadiness } = require("./state/matchReadiness");
const { hasGroup, dequeueGroup } = require("./state/queue");
const { getUserObject } = require("./state/userObjects");

function tryMatchUsers(io, number_of_players = 3) {
  while (hasGroup(number_of_players)) {
    const players = dequeueGroup(number_of_players);

    const sockets = players.map((playerId) =>
      getSocketIdByPlayerId(io, playerId)
    );

    const matchId = `${players.join("_")}_${Date.now()}`;

    players.forEach((playerId, index) => {
      const socket = sockets[index];
      const opponents = players.filter((id) => id !== playerId);

      emitToSingleSocket(socket, SocketEvents.MATCHED, {
        opponentObjs: opponents.map((opponentId) => getUserObject(opponentId)),
        matchId: matchId,
        totalPlayers: number_of_players,
      });
    });

    emitToMultipleSockets(io, sockets, SocketEvents.START_QUIZ, { matchId });

    console.log(
      `Match started: ${players.join(" vs ")} (${number_of_players} players)`
    );

    setMatchReadiness(matchId, {
      ready: new Set(),
      players: players,
    });
  }
}

async function waitForAnswers(sockets, players, questionIndex) {
  return new Promise((resolve) => {
    let resolved = false;
    let answers = {};
    const answerHandlers = [];

    function checkAndResolve() {
      if (
        !resolved &&
        players.every((playerId) => answers[playerId] !== undefined)
      ) {
        resolved = true;
        cleanUp();
        resolve(answers);
      }
    }

    function createAnswerHandler(playerId) {
      return function (data) {
        if (data.questionIndex === questionIndex) {
          answers[playerId] = data.answer;
          checkAndResolve();
        }
      };
    }

    // Create answer handlers for each player and attach to their sockets
    players.forEach((playerId, index) => {
      const socket = sockets[index];
      const answerHandler = createAnswerHandler(playerId);
      answerHandlers.push({ socket, handler: answerHandler });
      socket.on(SocketEvents.QUIZ_ANSWER_RECEIVE_EVENT, answerHandler);
    });

    function cleanUp() {
      answerHandlers.forEach(({ socket, handler }) => {
        socket.off(SocketEvents.QUIZ_ANSWER_RECEIVE_EVENT, handler);
      });
    }

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanUp();
        resolve(answers);
      }
    }, 10000);
  });
}

async function handleQuizResults(io, sockets, scoreObj) {
  emitToMultipleSockets(io, sockets, SocketEvents.QUIZ_HANDLE_RESULTS_EVENT, {
    scoreObj,
  });
}

async function runQuizLoop(io, players) {
  const scoreMap = new Map(); // userId -> score
  const sockets = players.map((playerId) =>
    getSocketIdByPlayerId(io, playerId)
  );

  for (let i = 0; i <= 1; i++) {
    const questionObj = questions[i];
    const correctAnswer = questionObj.correctAnswer;

    // console.log(`Question ${i + 1} sent`);

    emitToMultipleSockets(io, sockets, SocketEvents.QUIZ_QUESTION_SEND_EVENT, {
      question: questionObj.question,
      options: questionObj.options,
      questionIndex: i,
    });

    const answers = await waitForAnswers(sockets, players, i);

    const { answerResults, playersBySelectedOption } = processAnswers(
      answers,
      correctAnswer,
      scoreMap
    );

    // Emit correct/incorrect to each player
    for (const playerId of Object.keys(answers)) {
      const socket = getSocketIdByPlayerId(io, playerId);
      const { isCorrect, selectedAnswer } = answerResults[playerId];

      emitToSingleSocket(socket, SocketEvents.QUIZ_ANSWER_RESULT_EVENT, {
        isCorrect,
        correctAnswer,
        selectedAnswer,
        playersBySelectedOption: playersBySelectedOption
          ? Object.fromEntries(playersBySelectedOption)
          : {},
      });
    }

    await delay(3);
  }

  const finalScore = createScoreArray(scoreMap);

  handleQuizResults(io, sockets, finalScore);
}

module.exports = { tryMatchUsers, runQuizLoop };
