const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/game");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);

module.exports = app;
