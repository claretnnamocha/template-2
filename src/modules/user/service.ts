import { Op } from "sequelize";
import * as twofactor from "node-2fa";
import { debug } from "../../configs/env";
import { jwt, sms } from "../../helpers";
import { User } from "../../models";
import { UserSchema } from "../../types/models";
import {
  auth as authTypes,
  others,
  user as userTypes,
} from "../../types/services";
import { generateToken } from "../auth/service";
import * as msg from "../message-templates";
import { displayName } from "../../../package.json";

/**
 * Get user profile
 * @param {others.LoggedIn} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getProfile = async (
  params: others.LoggedIn,
): Promise<others.Response> => {
  try {
    const { userId } = params;

    const data: UserSchema = await User.findByPk(userId);

    if (!data) {
      return {
        payload: { status: false, message: "Profile does not exist" },
        code: 404,
      };
    }

    return { status: true, message: "Profile", data };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to get profile".concat(
          debug ? `: ${error}` : "",
        ),
      },
      code: 500,
    };
  }
};

/**
 * Verify user phone
 * @param {authTypes.VerifyRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const verifyPhone = async (
  params: authTypes.VerifyRequest,
): Promise<others.Response> => {
  try {
    const { token, userId } = params;

    let user: UserSchema = await User.findByPk(userId);

    if (!token) {
      const generatedToken: string = await generateToken({
        userId,
        length: 6,
        charset: "numeric",
      });

      const status = await sms.africastalking.send({
        to: user.phone,
        body: msg.verifyPhone({ token: generatedToken, username: user.email }),
      });

      if (status) await user.update({ verifiedphone: true });

      return {
        status,
        message: status ? "OTP sent" : "Could not send, try again later",
        code: status ? 200 : 502,
      };
    }

    user = await User.findOne({
      where: {
        token: { [Op.like]: `${token}_verify_%` },
        id: userId,
      },
    });

    if (!user) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }
    const { token: dbToken } = user;
    await user.update({ token: "" });

    const [theToken, tokenType, expiry] = dbToken.split("_");

    if (tokenType !== "verify" || token !== theToken) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    if (parseInt(expiry, 10) < Date.now()) {
      return {
        payload: { status: false, message: "Token expired" },
        code: 410,
      };
    }

    await user.update({ verifiedphone: true });

    return {
      payload: { status: true, message: "Account verified" },
      code: 202,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to verify account".concat(
          debug ? `: ${error}` : "",
        ),
      },
      code: 500,
    };
  }
};

/**
 * Update user profile
 * @param {userTypes.UpdateRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const updateProfile = async (
  params: userTypes.UpdateRequest,
): Promise<others.Response> => {
  try {
    const { userId } = params;

    const user: UserSchema = await User.findOne({
      where: { id: userId, isDeleted: false },
    });

    await user.update(params);

    return {
      status: true,
      message: "Profile updated",
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to update profile".concat(
          debug ? `: ${error}` : "",
        ),
      },
      code: 500,
    };
  }
};

/**
 * Update user password
 * @param {userTypes.UpdatePasswordRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const updatePassword = async (
  params: userTypes.UpdatePasswordRequest,
): Promise<others.Response> => {
  try {
    const {
      userId, newPassword, password, logOtherDevicesOut,
    } = params;

    const user: UserSchema = await User.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user.validatePassword(password)) return { status: false, message: "Old password is Invalid" };

    const update: any = { password: newPassword };
    if (logOtherDevicesOut) update.loginValidFrom = Date.now();

    await user.update(update);

    return {
      status: true,
      message: "Password updated",
      data: logOtherDevicesOut
        ? jwt.generate({
          payload: {
            payload: user.id,
            loginValidFrom: user.loginValidFrom,
          },
        })
        : null,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to updating password".concat(
          debug ? `: ${error}` : "",
        ),
      },
      code: 500,
    };
  }
};

/**
 * Log other devices out
 * @param {others.LoggedIn} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const logOtherDevicesOut = async (
  params: others.LoggedIn,
): Promise<others.Response> => {
  try {
    const { userId } = params;

    const user: UserSchema = await User.findByPk(userId);
    await user.update({ loginValidFrom: Date.now().toString() });

    const data: any = jwt.generate({
      payload: { payload: user.id, loginValidFrom: user.loginValidFrom },
    });

    return {
      status: true,
      message: "Other Devices have been logged out",
      data,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to log other devices out".concat(
          debug ? `: ${error}` : "",
        ),
      },
      code: 500,
    };
  }
};

/**
 * Log out
 * @param {others.LoggedIn} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const signOut = async (
  params: others.LoggedIn,
): Promise<others.Response> => {
  try {
    const { userId } = params;

    await User.update(
      { loginValidFrom: Date.now().toString() },
      { where: { id: userId } },
    );

    return { status: true, message: "Signed out" };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to sign out".concat(debug ? `: ${error}` : ""),
      },
      code: 500,
    };
  }
};

/**
 * Get all users' profile
 * @param {userTypes.GetAll} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getAllUsers = async (
  params: userTypes.GetAll,
): Promise<others.Response> => {
  try {
    const {
      name,
      email,
      verifiedemail,
      verifiedphone,
      active,
      isDeleted,
      gender,
      dob,
      phone,
      permissions,
      role,
      page,
      pageSize,
    } = params;

    let where = {};

    if (name) where = { ...where, name: { [Op.like]: `%${name}%` } };
    if (email) where = { ...where, email: { [Op.like]: `%${email}%` } };

    if (phone) where = { ...where, phone: { [Op.like]: `%${phone}%` } };

    if (gender) where = { ...where, gender };
    if (role) where = { ...where, role };
    if (dob) where = { ...where, dob };

    if (permissions) where = { ...where, permissions: { [Op.in]: permissions } };

    if ("verifiedemail" in params) where = { ...where, verifiedemail };
    if ("verifiedphone" in params) where = { ...where, verifiedphone };
    if ("active" in params) where = { ...where, active };
    if ("isDeleted" in params) where = { ...where, isDeleted };

    const data: Array<UserSchema> = await User.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: pageSize,
      offset: pageSize * (page - 1),
    });

    const total: number = await User.count({ where });

    return {
      status: true,
      message: "Users",
      data,
      metadata: { page, pageSize, total },
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to get all users".concat(
          debug ? `: ${error}` : "",
        ),
      },
      code: 500,
    };
  }
};

/**
 * Get user TOTP QRCode
 * @param {userTypes.UpdateRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getTotpQrCode = async (
  params: userTypes.UpdateRequest,
): Promise<others.Response> => {
  try {
    const { userId } = params;

    const {
      totp: { qr: data },
    }: UserSchema = await User.findOne({
      where: { id: userId, isDeleted: false },
    });

    return {
      status: true,
      message: "TOTP",
      data,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to get totp qr code".concat(
          debug ? `: ${error}` : "",
        ),
      },
      code: 500,
    };
  }
};
/**
 * Validate user totp
 * @param {userTypes.ValidateTotp} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const validateTotp = async (
  params: userTypes.ValidateTotp,
): Promise<others.Response> => {
  try {
    const { userId, token } = params;

    const user: UserSchema = await User.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user.validateTotp(token)) {
      return {
        payload: {
          status: false,
          message: "Invalid TOTP",
        },
        code: 401,
      };
    }

    return {
      status: true,
      message: "Valid TOTP",
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to validate totp".concat(
          debug ? `: ${error}` : "",
        ),
      },
      code: 500,
    };
  }
};

/**
 * Get user TOTP QRCode
 * @param {userTypes.UpdateRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const regenerateTotpSecret = async (
  params: userTypes.UpdateRequest,
): Promise<others.Response> => {
  try {
    const { userId } = params;

    const user: UserSchema = await User.findByPk(userId);

    const totp = twofactor.generateSecret({
      name: displayName,
      account: user.email,
    });
    await user.update({ totp });

    return {
      status: true,
      message: "TOTP Secret regenerated",
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to regenerate totp secret".concat(
          debug ? `: ${error}` : "",
        ),
      },
      code: 500,
    };
  }
};
