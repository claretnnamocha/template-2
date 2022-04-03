import Joi from "joi";
import passwordComplexity from "joi-password-complexity";
const JoiPhone = Joi.extend(require("joi-phone-number"));

export const signIn = {
  user: Joi.string().required(),
  password: Joi.string().required(),
};

export const signUp = {
  firstname: Joi.string(),
  lastname: Joi.string(),
  phone: JoiPhone.string().phoneNumber({ format: "e164" }),
  email: Joi.string().email().required(),
  password: passwordComplexity(),
};

export const verify = {
  token: Joi.string(),
  email: Joi.string().required(),
  resend: Joi.boolean(),
};

export const initiateReset = {
  email: Joi.string().email().required(),
};

export const verifyReset = {
  token: Joi.string().required(),
};

export const updateReset = {
  token: Joi.string().required(),
  password: Joi.string(),
};
