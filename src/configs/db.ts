import { Sequelize, SequelizeScopeError } from "sequelize";
import { v4 as uuid } from "uuid";
import { dbSecure, dbURL } from "./env";

export const db = new Sequelize(dbURL, {
  dialectOptions: !dbSecure
    ? {}
    : { ssl: { require: true, rejectUnauthorized: false } },
  logging: false,
});

const seed = async (models: any) => {
  console.log("DB cleared");

  await models.User.create({
    id: uuid(),
    email: "devclareo@gmail.com",
    firstname: "Claret",
    lastname: "Nnamocha",
    password: "Password123!",
    roles: "super-admin",
    verifiedemail: true,
  });

  // todo: plant other db seeds 😎

  console.log("Seeded");
};

export const authenticate = ({ clear = false }) => {
  db.authenticate()
    .then(async () => {
      console.log("Connection to Database has been established successfully.");
      const models = require("../models");
      const opts = clear ? { force: true } : { alter: true };
      for (const schema in models) await models[schema].sync(opts);
      if (clear) await seed(models);
      console.log("Migrated");
    })
    .catch((error: SequelizeScopeError) => console.error(`Unable to connect to the database: ${error.message}`));
};
