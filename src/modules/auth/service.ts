import bcrypt from "bcryptjs";
import randomstring from "randomstring";
import { Op } from "sequelize";
import { v4 as uuid } from "uuid";
import { devEnv } from "../../configs/env";
import { jwt } from "../../helpers";
import { sendEmail } from "../../jobs";
import { User } from "../../models";
import { UserSchema } from "../../types/models";
import { auth, others } from "../../types/services";
import * as msg from "../message-templates";

export const generateToken = async ({
  userId,
  tokenType = "verify",
  expiresMins = 5,
  charset = "alphanumeric",
  length = 5,
}) => {
  const user = await User.findByPk(userId);

  let token: string;
  let exists: UserSchema;
  do {
    token = randomstring.generate({
      charset,
      length,
      capitalization: "uppercase",
    });

    /* eslint-disable-next-line no-await-in-loop */
    exists = await User.findOne({
      where: {
        [`${tokenType}Token`]: token,
      },
    });
  } while (exists);

  await user.update({
    [`${tokenType}Token`]: token,
    tokenExpires: Date.now() + 60 * 1000 * expiresMins,
  });

  return token;
};

/**
 * Creates user account
 * @param {auth.SignUpRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const signUp = async (
  params: auth.SignUpRequest,
): Promise<others.Response> => {
  try {
    const { email } = params;

    const fields = ["email", "phone"];
    for (let i = 0; i < fields.length; i += 1) {
      const param = fields[i];
      if (params[param]) {
        const where: any = { [param]: params[param] };

        /* eslint-disable-next-line no-await-in-loop */
        const duplicate: UserSchema = await User.findOne({ where });
        if (duplicate) {
          return {
            payload: {
              status: false,
              message: `This ${param} has been used to open an account on this platform`,
            },
            code: 409,
          };
        }
      }
    }

    const id = uuid();

    await User.create({
      id,
      ...params,
    });

    const token: string = await generateToken({
      userId: id,
      length: 10,
    });

    const { text, html } = msg.registration({ token, username: email, email });

    sendEmail({
      to: email,
      subject: "Registration Complete",
      text,
      html,
    });

    return {
      payload: { status: true, message: "Registration Successful" },
      code: 201,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to create account".concat(
          devEnv ? `: ${error}` : "",
        ),
      },
      code: 500,
    };
  }
};

/**
 * Login
 * @param {auth.SignInRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const signIn = async (
  params: auth.SignInRequest,
): Promise<others.Response> => {
  try {
    const { user: identifier, password } = params;

    const user: UserSchema = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return {
        payload: { status: false, message: "Invalid username or password" },
        code: 401,
      };
    }

    if (!user.active) {
      return {
        payload: { status: false, message: "Account is banned contact admin" },
        code: 403,
      };
    }

    if (!user.verifiedemail) {
      const token: string = await generateToken({
        userId: user.id,
        length: 10,
      });

      const { text, html } = msg.verifyEmail({
        token,
        username: user.email,
        email: user.email,
      });

      sendEmail({
        to: user.email,
        subject: "Verify your email",
        text,
        html,
      });

      return {
        payload: { status: false, message: "Please verify your email" },
        code: 499,
      };
    }

    const { id, loginValidFrom } = user;
    const data: any = user.toJSON();

    data.token = jwt.generate({
      payload: {
        payload: id,
        loginValidFrom,
      },
    });

    return { status: true, message: "Login successful", data };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to login".concat(devEnv ? `: ${error}` : ""),
      },
      code: 500,
    };
  }
};

/**
 * Verify user account
 * @param {auth.VerifyRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const verifyAccount = async (
  params: auth.VerifyRequest,
): Promise<others.Response> => {
  try {
    const { token, email, resend } = params;

    const user: UserSchema = await User.findOne({
      where: { email },
    });

    if (!user) {
      return {
        payload: { status: false, message: "User not found" },
        code: 404,
      };
    }

    if (resend) {
      if (user.verifiedemail) {
        return {
          payload: { status: false, message: "Profile is already verified" },
          code: 400,
        };
      }

      const generatedToken: string = await generateToken({
        userId: user.id,
        length: 10,
      });

      const { text, html } = msg.verifyEmail({
        token: generatedToken,
        username: user.email,
        email: user.email,
      });

      sendEmail({
        to: user.email,
        subject: "Verify your email",
        text,
        html,
      });

      return { status: true, message: "Check your email" };
    }

    if (!user.verifyToken || user.verifyToken !== token) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    await user.update({ verifyToken: "" });

    if (parseInt(user.tokenExpires, 10) < Date.now()) {
      return {
        payload: { status: false, message: "Token expired" },
        code: 410,
      };
    }

    await user.update({ verifiedemail: true, tokenExpires: "0" });

    return {
      payload: { status: true, message: "Account verified" },
      code: 202,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to verify account".concat(
          devEnv ? `: ${error}` : "",
        ),
      },
      code: 500,
    };
  }
};

/**
 * Reset user account password
 * @param {auth.InitiateResetRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const initiateReset = async (
  params: auth.InitiateResetRequest,
): Promise<others.Response> => {
  try {
    const { email } = params;

    const user: UserSchema = await User.findOne({
      where: { email, isDeleted: false },
    });
    if (!user) {
      return {
        status: true,
        message:
          "If we found an account associated with that email, we've sent password reset instructions to that email address on the account",
      };
    }

    const token = await generateToken({
      userId: user.id,
      tokenType: "reset",
      length: 15,
    });

    const { text, html } = msg.resetPassword({
      token,
      username: user.email,
    });

    sendEmail({
      to: user.email,
      subject: "Reset Password",
      text,
      html,
    });

    return {
      status: true,
      message:
        "If we found an account associated with that email, we've sent password reset instructions to that email address on the account",
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to initiate reset".concat(
          devEnv ? `: ${error}` : "",
        ),
      },
      code: 500,
    };
  }
};

/**
 * Verify user reset token
 * @param {auth.VerifyRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const verifyReset = async (
  params: auth.VerifyRequest,
): Promise<others.Response> => {
  try {
    const { token } = params;

    const user: UserSchema = await User.findOne({
      where: { resetToken: token, isDeleted: false, active: true },
    });

    if (!user) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    await user.update({ resetToken: "" });

    if (parseInt(user.tokenExpires, 10) < Date.now()) {
      return {
        payload: { status: false, message: "Token expired" },
        code: 410,
      };
    }

    await user.update({ tokenExpires: "0" });

    const data: string = await generateToken({
      userId: user.id,
      length: 12,
      tokenType: "update",
    });

    return {
      payload: { status: true, message: "Valid token", data },
      code: 202,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to login".concat(devEnv ? `: ${error}` : ""),
      },
      code: 500,
    };
  }
};

/**
 * Reset user password
 * @param {auth.ResetPasswordRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const resetPassword = async (
  params: auth.ResetPasswordRequest,
): Promise<others.Response> => {
  try {
    const { token, password, logOtherDevicesOut } = params;

    const user: UserSchema = await User.findOne({
      where: { updateToken: token, isDeleted: false, active: true },
    });

    if (!user) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    await user.update({ updateToken: "" });

    if (parseInt(user.tokenExpires, 10) < Date.now()) {
      return {
        payload: { status: false, message: "Token expired" },
        code: 410,
      };
    }

    const update: any = { password, tokenExpires: "0" };
    if (logOtherDevicesOut) update.loginValidFrom = Date.now();

    await user.update(update);

    return {
      payload: { status: true, message: "Password updated" },
      code: 202,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to reset password".concat(
          devEnv ? `: ${error}` : "",
        ),
      },
      code: 500,
    };
  }
};
