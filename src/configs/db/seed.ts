import { v4 as uuid } from "uuid";

export const seed = async (models: any) => {
  /* eslint-disable-next-line */
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

  /* eslint-disable-next-line */
  console.log("Database Seeded");
};
