const activeUsers = new Map(); // userId -> socketId

module.exports = {
  addActiveUser: (userId, socketId) => activeUsers.set(userId, socketId),
  removeActiveUser: (userId) => activeUsers.delete(userId),
  getSocketId: (userId) => activeUsers.get(userId),
};
