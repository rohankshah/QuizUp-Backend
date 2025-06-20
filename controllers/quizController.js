const { quiz_categories } = require("../questions/index");

function getQuizCategories(_, res) {
  const quizCategoryNames = quiz_categories.map((category) => {
    const categoryObj = { id: category?.id, name: category?.name };
    return categoryObj;
  });
  res.json(quizCategoryNames);
}

module.exports = { getQuizCategories };
