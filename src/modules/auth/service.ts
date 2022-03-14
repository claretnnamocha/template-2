import bcrypt from "bcryptjs";
import randomstring from "randomstring";
import { Op } from "sequelize";
import { v4 as uuid } from "uuid";
import { devEnv } from "../../configs/env";
import { jwt, mail } from "../../helpers";
import { Token, User } from "../../models";
import { TokenSchema, UserSchema } from "../../types/models";
import { auth, others } from "../../types/services";
import * as msg from "../message-templates";

/**
 * Creates user account
 * @param {auth.SignUpRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const signUp = async (
  params: auth.SignUpRequest
): Promise<others.Response> => {
  try {
    const { email } = params;

    for (const param of ["email", "phone", "username"]) {
      if (params[param]) {
        const where: any = { [param]: params[param] };
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
    mail.pepipost.send({
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
          devEnv ? ": " + error : ""
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
  params: auth.SignInRequest
): Promise<others.Response> => {
  try {
    const { user, password } = params;

    const _user: UserSchema = await User.findOne({
      where: {
        [Op.or]: [{ username: user }, { email: user }, { phone: user }],
      },
    });

    if (!_user || !bcrypt.compareSync(password, _user.password)) {
      return {
        payload: { status: false, message: "Invalid username or password" },
        code: 401,
      };
    }

    if (!_user.active) {
      return {
        payload: { status: false, message: "Account is banned contact admin" },
        code: 403,
      };
    }

    if (!_user.verifiedemail) {
      const token: string = await generateToken({
        userId: _user.id,
        length: 10,
      });

      const { text, html } = msg.verifyEmail({
        token,
        username: _user.email,
        email: _user.email,
      });
      mail.pepipost.send({
        to: _user.email,
        subject: "Verify your email",
        text,
        html,
      });

      return {
        payload: { status: false, message: "Please verify your email" },
        code: 499,
      };
    }

    const data: any = _user.toJSON();
    data.token = jwt.generate({
      payload: _user.id,
      loginValidFrom: _user.loginValidFrom,
    });

    return { status: true, message: "Login successful", data };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to login".concat(devEnv ? ": " + error : ""),
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
  params: auth.VerifyRequest
): Promise<others.Response> => {
  try {
    const { token, email } = params;

    if (email) {
      const user: UserSchema = await User.findOne({
        where: { email },
      });

      if (!user)
        return {
          payload: { status: false, message: "Profile does not exist" },
          code: 404,
        };

      if (user.verifiedemail)
        return {
          payload: { status: false, message: "Profile is already verified" },
          code: 400,
        };

      const token: string = await generateToken({
        userId: user.id,
        length: 10,
      });

      const { text, html } = msg.verifyEmail({
        token,
        username: user.email,
        email: user.email,
      });
      mail.pepipost.send({
        to: user.email,
        subject: "Verify your email",
        text,
        html,
      });

      return { status: true, message: "Check your email" };
    }

    const _token: TokenSchema = await Token.findOne({
      where: { token, tokenType: "verify", active: true },
    });

    if (!_token) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    await _token.update({ active: false });

    if (parseInt(_token.expires) < Date.now()) {
      return {
        payload: { status: false, message: "Token expired" },
        code: 410,
      };
    }

    const user: UserSchema = await User.findByPk(_token.UserId);

    if (!user) {
      return {
        payload: { status: false, message: "User not found" },
        code: 404,
      };
    }

    await user.update({ verifiedemail: true });

    return {
      payload: { status: true, message: "Account verified" },
      code: 202,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to verify account".concat(
          devEnv ? ": " + error : ""
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
  params: auth.InitiateResetRequest
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
    mail.pepipost.send({
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
          devEnv ? ": " + error : ""
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
  params: auth.VerifyRequest
): Promise<others.Response> => {
  try {
    const { token } = params;

    const _token: TokenSchema = await Token.findOne({
      where: { token, tokenType: "reset", active: true },
    });

    if (!_token) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    await _token.update({ active: false });

    if (parseInt(_token.expires) < Date.now()) {
      return {
        payload: { status: false, message: "Token expired" },
        code: 410,
      };
    }

    const user: UserSchema = await User.findByPk(_token.UserId);

    if (!user) {
      return {
        payload: { status: false, message: "Profile does not exist" },
        code: 404,
      };
    }

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
        message: "Error trying to login".concat(devEnv ? ": " + error : ""),
      },
      code: 500,
    };
  }
};

/**
 * Resend Verification code for user account
 * @param {auth.ResendVerifyRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const resendVerificationAccount = async (
  params: auth.ResendVerifyRequest
): Promise<others.Response> => {
  try {
    const { email } = params;

    const user: UserSchema = await User.findOne({
      where: { email, active: true },
    });

    if (!user) {
      return { status: false, message: "Invalid user" };
    }

    if (user.verifiedemail) {
      return { status: false, message: "You are already verified" };
    }

    const token = await generateToken({ userId: user.id });
    await mail.sendgrid.send({
      to: user.email,
      subject: "Verify Email",
      text: `Verify email: ${token}`,
      html: `Verify email: ${token}`,
    });
    return { status: true, message: "Verification token resent" };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to resend verification".concat(
          devEnv ? ": " + error : ""
        ),
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
  params: auth.ResetPasswordRequest
): Promise<others.Response> => {
  try {
    const { token, password, logOtherDevicesOut } = params;

    const _token: TokenSchema = await Token.findOne({
      where: { token, tokenType: "update", active: true },
    });

    if (!_token) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    await _token.update({ active: false });

    if (parseInt(_token.expires) < Date.now()) {
      return {
        payload: { status: false, message: "Token expired" },
        code: 410,
      };
    }

    const user: UserSchema = await User.findByPk(_token.UserId);

    if (!user) {
      return {
        payload: { status: false, message: "Profile does not exist" },
        code: 404,
      };
    }

    let update: any = { password };
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
          devEnv ? ": " + error : ""
        ),
      },
      code: 500,
    };
  }
};

export const generateToken = async ({
  userId,
  tokenType = "verify",
  medium = "any",
  expiresMins = 5,
  charset = "alphanumeric",
  length = 5,
}) => {
  await Token.update(
    { active: false },
    { where: { UserId: userId, tokenType, active: true } }
  );

  const token = randomstring.generate({
    charset,
    length,
    capitalization: "uppercase",
  });

  await Token.create({
    id: uuid(),
    tokenType,
    token,
    UserId: userId,
    medium,
    expires: Date.now() + 60 * 1000 * expiresMins,
  });

  return token;
};
