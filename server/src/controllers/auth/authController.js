const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../../models/models.js");
const { Op } = require("sequelize");

const saltRounds = 10;

exports.register = async (req, res) => {
  try {
    const { login, password, email } = req.body;

    if (!login || login.length < 5) {
      return res.status(400).send("Login error");
    }

    if (!password || password.length < 6) {
      return res.status(400).send("Password error");
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).send("Email error");
    }

    const candidate = await User.findOne({
      where: {
        [Op.or]: [{ login }, { email }],
      },
    });

    if (candidate) {
      return res.status(400).send("Email or login not unique");
    }

    const hash_password = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      login,
      password: hash_password,
      email,
    });

    const jwt_secret_key = process.env.JWT_SECRET_KEY || "default_secret";
    const token = jwt.sign(
      { id: newUser.id, login: newUser.login, email: newUser.email },
      jwt_secret_key,
      { expiresIn: "1d" },
    );

    res.status(200).send({ token });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).send("Internal server error");
  }
};

exports.login = async (req, res) => {
  const { login, password } = req.body;

  if (!login || login.length < 5) {
    return res.status(400).send("Login error");
  }

  if (!password || password.length < 6) {
    return res.status(400).send("Password error");
  }

  try {
    const candidate = await User.findOne({ where: { login } });

    if (!candidate) {
      return res.status(400).send("User not found");
    }

    const is_pass_valid = await bcrypt.compare(password, candidate.password);

    if (!is_pass_valid) {
      return res.status(400).send("Invalid password");
    }

    const jwt_secret_key = process.env.JWT_SECRET_KEY;

    const token = jwt.sign(
      { id: candidate.id, login: candidate.login, email: candidate.email },
      jwt_secret_key,
      { expiresIn: "1d" },
    );

    res.status(200).send({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
};
