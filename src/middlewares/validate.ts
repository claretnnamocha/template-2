import { NextFunction, Response } from "express";
import Joi from "joi";
import { response } from "../helpers";
import { CustomRequest } from "../types/controllers";

export const validate = (obj: object) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    const schema = Joi.object().keys(obj).required().unknown(false);
    const value = req.method == "GET" ? req.query : req.body;
    const { error, value: vars } = schema.validate(value);

    if (error)
      return response(res, { status: false, message: error.message }, 422);

    req.form = req.form || {};
    req.form = { ...req.form, ...vars };

    next();
  };
};
