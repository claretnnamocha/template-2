import { Router } from "express";
import { controller, validate } from "../../middlewares";
import * as service from "./service";
import * as validator from "./validators";

const routes = Router();

routes.get(
  "/ping/:message",
  validate(validator.ping),
  controller(service.ping),
);

export default routes;
