import { NextFunction, Response } from "express";
import Joi from "joi";
import { response } from "../helpers";
import { CustomRequest } from "../types/controllers";

export const validate = (obj: any) => (req: CustomRequest, res: Response, next: NextFunction) => {
  const schema = Joi.object().keys(obj).required().unknown(false);
  const payload = req.method === "GET" ? req.query : req.body;
  const { params } = req;
  const value = { ...params, ...payload };

  const [duplicateField] = Object.keys(payload).filter(
    {}.hasOwnProperty.bind(params),
  );

  if (duplicateField) {
    return response(
      res,
      {
        status: false,
        message: `Duplicate  field '${duplicateField}' present in url params and ${
          req.method === "GET" ? "query" : "body"
        }`,
      },
      422,
    );
  }

  const { error, value: vars } = schema.validate(value);

  if (error) return response(res, { status: false, message: error.message }, 422);

  req.form = req.form || {};
  req.form = { ...req.form, ...vars };

  return next();
};
