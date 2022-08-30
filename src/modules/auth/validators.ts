import Joi from "joi";
import passwordComplexity from "joi-password-complexity";

const JoiPhone = Joi.extend(require("joi-phone-number"));

export const signIn = {
  user: Joi.string().required(),
  password: Joi.string().required(),
};

export const signUp = {
  firstName: Joi.string(),
  lastName: Joi.string(),
  phone: JoiPhone.string().phoneNumber({
    defaultCountry: "NG",
    format: "e164",
  }),
  email: Joi.string().email().lowercase().required(),
  password: passwordComplexity(),
};

export const verify = {
  token: Joi.string(),
  email: Joi.string().email().lowercase().required(),
  resend: Joi.boolean(),
};

export const initiateReset = {
  email: Joi.string().email().lowercase().required(),
};

export const verifyReset = {
  token: Joi.string().required(),
  email: Joi.string().email().lowercase().required(),
};

export const updateReset = {
  email: Joi.string().email().lowercase().required(),
  token: Joi.string().required(),
  password: Joi.string(),
};
