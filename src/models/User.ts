import bcrypt from "bcryptjs";
import * as twofactor from "node-2fa";
import { DataTypes } from "sequelize";
import { displayName } from "../../package.json";
import { db } from "../configs/db";
import { totpWindow } from "../configs/env";
import { UserSchema } from "../types/models";

const User = db.define(
  "User",
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    firstname: { type: DataTypes.STRING },
    lastname: { type: DataTypes.STRING },
    othernames: { type: DataTypes.STRING },
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
    verifiedemail: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    verifiedphone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    totp: { type: DataTypes.JSONB },
    token: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
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
        const totp = twofactor.generateSecret({
          name: displayName,
          account: instance.email,
        });

        await instance.update({ totp });
      },
      async afterBulkCreate(instances) {
        for (let index = 0; index < instances.length; index += 1) {
          const instance: UserSchema = instances[index];
          const totp = twofactor.generateSecret({
            name: displayName,
            account: instance.email,
          });

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

User.prototype.validateTotp = function validatePassword(val: string) {
  const valid = twofactor.verifyToken(
    this.getDataValue("totp").secret,
    val,
    totpWindow,
  );
  return valid && valid.delta === 0;
};

export { User };
