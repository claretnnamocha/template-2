import { Model } from "sequelize/types";

export interface User {
  id?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  location?: string;
  deleted?: boolean;
  verifiedEmail?: boolean;
  verifiedPhone?: boolean;
  active?: boolean;
  totp?: string;
  loginValidFrom?: string;
  /* eslint-disable-next-line */
  validatePassword?: (password: string) => boolean;
  /* eslint-disable-next-line */
  regenerateOtpSecret?: () => void;
  /* eslint-disable-next-line */
  generateTotp?: (digits?: number, window?: number) => string;
  /* eslint-disable-next-line */
  validateTotp?: (token: string, digits?: number, window?: number) => string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserSchema extends Model<User>, User {}
