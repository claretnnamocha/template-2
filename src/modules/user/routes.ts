import { Router } from "express";
import { authenticate, validate } from "../../middlewares";
import * as user from "./controller";
import * as validator from "./validators";

const routes = Router();
routes.use(authenticate);

routes.get("", user.getProfile);

routes.put(
  "/change-password",
  validate(validator.changePassword),
  user.changePassword
);

routes.put("/edit-profile", validate(validator.editProfile), user.editProfile);

export default routes;
