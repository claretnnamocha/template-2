import Joi from "joi";
import passwordComplexity from "joi-password-complexity";

export const updateProfile = {
  firstname: Joi.string(),
  lastname: Joi.string(),
  location: Joi.string(),
  avatar: Joi.string().uri(),
};

export const updatePassword = {
  password: Joi.string(),
  newPassword: passwordComplexity(),
  logOtherDevicesOut: Joi.boolean().default(false),
};

export const verifyPhone = {
  token: Joi.string(),
};

export const getAllUsers = {
  name: Joi.string(),
  email: Joi.string().email().lowercase(),
  verifiedemail: Joi.boolean(),
  verifiedphone: Joi.boolean(),
  active: Joi.boolean(),
  isDeleted: Joi.boolean(),
  dob: Joi.date(),
  phone: Joi.string(),
  permissions: Joi.array().items(Joi.string().required()).unique(),
  role: Joi.string().valid("admin", "user"),
  page: Joi.number().default(1),
  pageSize: Joi.number().default(10),
};
