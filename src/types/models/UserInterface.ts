import { Model } from "sequelize/types";

interface UserInterface {
  id?: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  gender?: string;
  location?: string;
  dob?: Date;
  deleted?: boolean;
  verifiedemail?: boolean;
  verifiedphone?: boolean;
  active?: boolean;
  createdAt?: Date;
  loginValidFrom?: string;
  transform?: Function;
  validatePassword?: Function;
  updatedAt?: Date;
}

export interface UserSchema extends Model<UserInterface>, UserInterface {}
