const SocketEvents = {
  CONNECTION: "connection",
  JOIN_QUEUE: "join-queue",
  MATCHED: "matched",
  START_QUIZ: "start-quiz",
  CLIENT_READY: "client-ready",
  QUIZ_QUESTION_SEND_EVENT: "quiz-question-send-event",
  QUIZ_ANSWER_RECEIVE_EVENT: "quiz-answer-receive-event",
  DISCONNECT: "disconnect",
};

module.exports = { SocketEvents };
