const queue = [];

module.exports = {
  enqueue: (userId) => !queue.includes(userId) && queue.push(userId),
  dequeuePair: () => queue.splice(0, 2),
  dequeueGroup: (n) => queue.splice(0, n),
  removeFromQueue: (userId) => {
    const i = queue.indexOf(userId);
    if (i !== -1) queue.splice(i, 1);
  },
  isInQueue: (userId) => queue.includes(userId),
  hasPair: () => queue.length >= 2,
  hasGroup: (n) => queue.length >= n,
};
