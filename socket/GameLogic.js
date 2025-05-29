const { SocketEvents } = require("../contants/constants");
const questions = require("../questions");
const { getSocketIdByPlayerId, delay } = require("./GameUtils");
const { setMatchReadiness } = require("./state/matchReadiness");
const { hasPair, dequeuePair } = require("./state/queue");
const { getUserObject } = require("./state/userObjects");

function tryMatchUsers(io) {
  while (hasPair()) {
    const [player1, player2] = dequeuePair();

    const socket1 = getSocketIdByPlayerId(io, player1);
    const socket2 = getSocketIdByPlayerId(io, player2);

    const matchId = `${player1}_${player2}_${Date.now()}`;

    socket1.emit(SocketEvents.MATCHED, {
      opponentObj: getUserObject(player2),
      matchId: matchId,
    });
    socket2.emit(SocketEvents.MATCHED, {
      opponentObj: getUserObject(player1),
      matchId: matchId,
    });

    io.to(socket1.id).emit(SocketEvents.START_QUIZ, { matchId });
    io.to(socket2.id).emit(SocketEvents.START_QUIZ, { matchId });

    console.log(`Match started: ${player1} vs ${player2}`);

    setMatchReadiness(matchId, {
      ready: new Set(),
      players: [player1, player2],
    });
  }
}

async function waitForAnswers(
  socket1,
  socket2,
  player1,
  player2,
  questionIndex
) {
  return new Promise((resolve) => {
    let resolved = false;
    let answers = {};

    function checkAndResolve() {
      if (
        !resolved &&
        answers[player1] !== undefined &&
        answers[player2] !== undefined
      ) {
        resolved = true;
        cleanUp();
        resolve(answers);
      }
    }

    function answer1(data) {
      if (data.questionIndex === questionIndex) {
        answers[player1] = data.answer;
        checkAndResolve();
      }
    }

    function answer2(data) {
      if (data.questionIndex === questionIndex) {
        answers[player2] = data.answer;
        checkAndResolve();
      }
    }

    socket1.on(SocketEvents.QUIZ_ANSWER_RECEIVE_EVENT, answer1);
    socket2.on(SocketEvents.QUIZ_ANSWER_RECEIVE_EVENT, answer2);

    function cleanUp() {
      socket1.off(SocketEvents.QUIZ_ANSWER_RECEIVE_EVENT, answer1);
      socket2.off(SocketEvents.QUIZ_ANSWER_RECEIVE_EVENT, answer2);
    }

    setTimeout(() => {
      resolved = true;
      cleanUp();
      resolve(answers);
    }, 10000);
  });
}

async function runQuizLoop(io, player1, player2) {
  const scoreMap = new Map(); // userId -> score
  const socket1 = getSocketIdByPlayerId(io, player1);
  const socket2 = getSocketIdByPlayerId(io, player2);

  for (let i = 0; i <= 9; i++) {
    const questionObj = questions[i];
    const correctAnswer = questionObj.correctAnswer;

    // console.log(`Question ${i + 1} sent`);

    socket1.emit(SocketEvents.QUIZ_QUESTION_SEND_EVENT, {
      question: questionObj.question,
      options: questionObj.options,
      questionIndex: i,
    });
    socket2.emit(SocketEvents.QUIZ_QUESTION_SEND_EVENT, {
      question: questionObj.question,
      options: questionObj.options,
      questionIndex: i,
    });

    const answers = await waitForAnswers(socket1, socket2, player1, player2, i);

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

      console.log("playersBySelectedOption", playersBySelectedOption);

      // Update score
      if (isCorrect) {
        const oldValue = scoreMap.get(playerId) || 0;
        scoreMap.set(playerId, oldValue + 1);
      }
    }

    // Emit correct/incorrect to each player
    for (const playerId of Object.keys(answers)) {
      const socket = getSocketIdByPlayerId(io, playerId);
      const { isCorrect, selectedAnswer } = answerResults[playerId];

      socket.emit(SocketEvents.QUIZ_ANSWER_RESULT_EVENT, {
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

  console.log("scoreMap", scoreMap);
}

module.exports = { tryMatchUsers, runQuizLoop };
