const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getQuizCategories } = require("../controllers/quizController");

const router = express.Router();

router.get("/categories", authMiddleware, getQuizCategories);

module.exports = router;
