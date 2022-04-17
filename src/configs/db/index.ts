import { Sequelize, SequelizeScopeError } from "sequelize";
import { dbSecure, dbURL } from "../env";
import { seed } from "./seed";

export const db = new Sequelize(dbURL, {
  dialectOptions: !dbSecure
    ? {}
    : { ssl: { require: true, rejectUnauthorized: false } },
  logging: false,
});

export const authenticate = ({ clear = false }) => {
  db.authenticate()
    .then(async () => {
      /* eslint-disable-next-line */
      console.log("Connection to Database has been established successfully.");

      const models = import("../../models");
      const opts = clear ? { force: true } : { alter: true };

      const promises = [];
      const keys = Object.keys(models);
      for (let i = 0; i < keys.length; i += 1) {
        const schema = keys[i];
        promises.push(models[schema].sync(opts));
      }
      await Promise.all(promises);

      if (clear) await seed(models);

      /* eslint-disable-next-line */
      console.log("Database Migrated");
    })

    /* eslint-disable-next-line */
    .catch((error: SequelizeScopeError) => console.error(`Unable to connect to the database: ${error.message}`));
};
