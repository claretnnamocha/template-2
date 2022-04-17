import bcrypt from "bcryptjs";
import { DataTypes } from "sequelize";
import { db } from "../configs/db";

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
    loginValidFrom: {
      type: DataTypes.STRING,
      defaultValue: Date.now(),
      allowNull: false,
    },
    verifyToken: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    resetToken: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    updateToken: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    tokenExpires: {
      type: DataTypes.STRING,
      defaultValue: "0",
    },
  },
  { timestamps: true, tableName: "user" },
);

User.prototype.toJSON = function () {
  const data = this.dataValues;

  delete data.password;
  delete data.verifyToken;
  delete data.resetToken;
  delete data.updateToken;
  delete data.tokenExpires;
  delete data.loginValidFrom;
  delete data.role;
  delete data.permissions;
  delete data.active;
  delete data.isDeleted;
  delete data.id;
  return data;
};

User.prototype.validatePassword = function (val: string) {
  return bcrypt.compareSync(val, this.getDataValue("password"));
};

export { User };
