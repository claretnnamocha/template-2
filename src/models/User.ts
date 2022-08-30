import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { DataTypes, UUIDV4 } from "sequelize";
import { db } from "../configs/db";
import { totpWindow } from "../configs/env";
import { UserSchema } from "../types/models";

const User = db.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: UUIDV4,
    },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    firstName: { type: DataTypes.STRING },
    lastName: { type: DataTypes.STRING },
    avatar: { type: DataTypes.STRING },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "user",
      values: ["user", "admin"],
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
    phone: { type: DataTypes.STRING },
    location: { type: DataTypes.STRING },
    password: {
      type: DataTypes.STRING,
      set(value: string) {
        const salt = bcrypt.genSaltSync();
        this.setDataValue("password", bcrypt.hashSync(value, salt));
      },
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    verifiedEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    verifiedPhone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    totp: { type: DataTypes.TEXT },
    loginValidFrom: {
      type: DataTypes.STRING,
      defaultValue: Date.now(),
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "user",
    hooks: {
      async afterCreate(attributes) {
        const instance: UserSchema = attributes;
        const totp = authenticator.generateSecret();
        await instance.update({ totp });
      },
      async afterBulkCreate(instances) {
        for (let index = 0; index < instances.length; index += 1) {
          const instance: UserSchema = instances[index];
          const totp = authenticator.generateSecret();

          /* eslint-disable no-await-in-loop */
          await instance.update({ totp });
        }
      },
    },
  },
);

User.prototype.toJSON = function toJSON() {
  const data = this.dataValues;

  delete data.totp;
  delete data.password;
  delete data.token;
  delete data.loginValidFrom;
  delete data.role;
  delete data.permissions;
  delete data.active;
  delete data.isDeleted;
  delete data.id;
  return data;
};

User.prototype.validatePassword = function validatePassword(val: string) {
  return bcrypt.compareSync(val, this.getDataValue("password"));
};

User.prototype.validateTotp = function validateTotp(
  token: string,
  digits: number = 6,
  window: number = totpWindow,
) {
  authenticator.options = { digits, step: window * 60 };
  return authenticator.check(token, this.getDataValue("totp"));
};

User.prototype.generateTotp = function generateTotp(
  digits: number = 6,
  window: number = totpWindow,
) {
  authenticator.options = { digits, step: window * 60 };
  return authenticator.generate(this.getDataValue("totp"));
};

User.prototype.regenerateOtpSecret = function regenerateOtpSecret() {
  this.setDataValue("totp", authenticator.generateSecret());
};

export { User };
