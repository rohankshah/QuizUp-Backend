const userObjects = new Map(); // userId -> userObject

module.exports = {
  setUserObject: (userId, userObject) => userObjects.set(userId, userObject),
  getUserObject: (userId) => userObjects.get(userId),
  deleteUserObject: (userId) => userObjects.delete(userId),
};
