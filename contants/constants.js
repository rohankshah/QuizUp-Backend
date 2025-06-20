const SocketEvents = {
  CONNECTION: "connection",
  JOIN_QUEUE: "join-queue",
  CREATE_ROOM: "create-room",
  ROOM_JOINED: "room-joined",
  JOIN_ROOM: "join-room",
  PLAYER_JOINED: "player-joined",
  MATCHED: "matched",
  START_QUIZ: "start-quiz",
  CLIENT_READY: "client-ready",
  QUIZ_QUESTION_SEND_EVENT: "quiz-question-send-event",
  QUIZ_ANSWER_RECEIVE_EVENT: "quiz-answer-receive-event",
  QUIZ_ANSWER_RESULT_EVENT: "quiz-answer-result-event",
  QUIZ_HANDLE_RESULTS_EVENT: "quiz-handle-results-event",
  DISCONNECT: "disconnect",

  GET_ROOM_INFO_BY_ID: "get-room-info-by-id",
  PLAYER_LEFT: "player-left",

  ROOM_START_QUIZ: "room-start-quiz",
  ROOM_QUIZ_STARTED: "room-quiz-started"
};

const number_of_players = 2;

const room_ttl = 7200; // 2 hours

module.exports = { SocketEvents, number_of_players, room_ttl };
