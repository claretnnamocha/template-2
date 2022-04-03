import { Model } from "sequelize/types";

interface User {
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
  transform?: Function;
  validatePassword?: Function;
  updatedAt?: Date;
  verifyToken?: string;
  resetToken?: string;
  updateToken?: string;
  tokenExpires?: string;
}

export interface UserSchema extends Model<User>, User {}
