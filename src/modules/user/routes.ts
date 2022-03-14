import { Router } from "express";
import { controller, validate } from "../../middlewares";
import * as user from "./service";
import * as validator from "./validators";

const routes = Router();

routes.get("", controller(user.getProfile));

routes.put(
  "/change-password",
  validate(validator.changePassword),
  controller(user.updatePassword)
);

routes.put(
  "/edit-profile",
  validate(validator.editProfile),
  controller(user.updateProfile)
);

export default routes;
