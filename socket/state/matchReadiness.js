const matchReadiness = new Map(); // matchId -> { ready: Set of userIds, players: [player1, player2] }

module.exports = {
  setMatchReadiness: (matchId, data) => matchReadiness.set(matchId, data),
  getMatchReadiness: (matchId) => matchReadiness.get(matchId),
  deleteMatchReadiness: (matchId) => matchReadiness.delete(matchId),
};
