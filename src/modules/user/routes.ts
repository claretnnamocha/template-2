import { Router } from "express";
import { controller, validate } from "../../middlewares";
import * as user from "./service";
import * as validator from "./validators";

const routes = Router();

routes.get("/", controller(user.getProfile));

routes.get(
  "/verify-phone",
  validate(validator.verifyPhone),
  controller(user.verifyPhone)
);

routes.put(
  "/update-password",
  validate(validator.updatePassword),
  controller(user.updatePassword)
);

routes.put(
  "/update-profile",
  validate(validator.updateProfile),
  controller(user.updateProfile)
);

routes.get(
  "/all-users",
  validate(validator.getAllUsers),
  controller(user.getAllUsers)
);

routes.post("/log-other-devices-out", controller(user.logOtherDevicesOut));

routes.post("/sign-out", controller(user.signOut));

export default routes;
