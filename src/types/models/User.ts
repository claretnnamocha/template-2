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
  token?: string;
  totp?: {
    secret: string;
    uri: string;
    qr: string;
  };
  loginValidFrom?: string;
  validatePassword?: Function;
  validateTotp?: Function;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserSchema extends Model<User>, User {}
