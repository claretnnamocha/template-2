export const seed = async (models: any) => {
  /* eslint-disable-next-line */
  console.log("DB cleared");

  await models.User.create({
    email: "devclareo@gmail.com",
    firstName: "Claret",
    lastName: "Nnamocha",
    password: "Password123!",
    roles: "super-admin",
    verifiedEmail: true,
  });

  // todo: plant other db seeds 😎

  /* eslint-disable-next-line */
  console.log("Database Seeded");
};
