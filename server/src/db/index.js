const { Sequelize } = require("@sequelize/core");
const { PostgresDialect } = require("@sequelize/postgres");

const sequelize = new Sequelize({
  dialect: PostgresDialect,
  database: "",
  user: "",
  password: "",
  host: "",
  port: 5432,
  ssl: false,
});

module.exports = sequelize;
