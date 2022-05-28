import { Model } from "sequelize/types";

export interface User {
  id?: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  location?: string;
  deleted?: boolean;
  verifiedemail?: boolean;
  verifiedphone?: boolean;
  active?: boolean;
  createdAt?: Date;
  loginValidFrom?: string;
  totp?: any;
  validatePassword?: Function;
  validateTotp?: Function;
  updatedAt?: Date;
  verifyToken?: string;
  resetToken?: string;
  updateToken?: string;
  tokenExpires?: string;
}

export interface UserSchema extends Model<User>, User {}
