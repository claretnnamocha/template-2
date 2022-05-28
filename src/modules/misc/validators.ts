import Joi from "joi";

export const ping = {
  message: Joi.string().required(),
};
