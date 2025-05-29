const SocketEvents = {
  CONNECTION: "connection",
  JOIN_QUEUE: "join-queue",
  MATCHED: "matched",
  START_QUIZ: "start-quiz",
  CLIENT_READY: "client-ready",
  QUIZ_QUESTION_SEND_EVENT: "quiz-question-send-event",
  QUIZ_ANSWER_RECEIVE_EVENT: "quiz-answer-receive-event",
  QUIZ_CORRECT_ANSWER_EVENT: "quiz-correct-answer-event",
  QUIZ_INCORRECT_ANSWER_EVENT: "quiz-incorrect-answer-event",
  QUIZ_ANSWER_RESULT_EVENT: "quiz-answer-result-event",
  DISCONNECT: "disconnect",
};

module.exports = { SocketEvents };
