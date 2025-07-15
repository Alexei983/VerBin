const express = require("express");
const authRoute = require("./routes/auth/authRoute.js");
const pastesRoute = require("./routes/pastes/pastesRoute.js");
const sequelize = require("./db/index.js");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use("/auth", authRoute);
app.use("/pastes", pastesRoute);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    console.log("DB connection has been established successfully.");

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
}

startServer();
