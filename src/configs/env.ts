import { config } from "dotenv";
import Joi from "joi";

config();

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test", "provision")
    .default("development"),
  PORT: Joi.number().required(),
  TOTP_WINDOW: Joi.number().default(1),
  JWT_SECRET: Joi.string().required(),
  DB_URL: Joi.string().required().description("Database connection URL"),
  DB_SECURE: Joi.boolean().default(false),
  CLEAR_DB: Joi.boolean().default(false),
  DEBUG: Joi.boolean().default(false),
})
  .unknown()
  .required();

const { error, value } = schema.validate(process.env);

if (error) throw error;

export const env = value.NODE_ENV;
export const port = value.PORT;
export const dbURL = value.DB_URL;
export const totpWindow = value.TOTP_WINDOW;
export const jwtSecret = value.JWT_SECRET;
export const dbSecure = value.DB_SECURE;
export const clearDb = value.CLEAR_DB;
export const debug = env === "development" || value.DEBUG;
