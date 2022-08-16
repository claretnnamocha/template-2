import bcrypt from "bcryptjs";
import ejs from "ejs";
import path from "path";
import { Op } from "sequelize";
import { v4 as uuid } from "uuid";
import { debug } from "../../configs/env";
import { jwt } from "../../helpers";
import { sendEmail } from "../../jobs";
import { User } from "../../models";
import { UserSchema } from "../../types/models";
import { auth, others } from "../../types/services";

const { FRONTEND_BASEURL } = process.env;

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

    const user: UserSchema = await User.create({
      ...params,
    });

    const token: string = user.generateTotp();

    const html = await ejs.renderFile(
      path.resolve(
        __dirname,
        "..",
        "..",
        "configs",
        "mail-templates",
        "auth",
        "welcome.html",
      ),
      {
        link: `${FRONTEND_BASEURL}/auth/verify?token=${token}&email=${email}`,
        username: email,
        email,
        uuid: uuid(),
        FRONTEND_BASEURL,
      },
    );

    sendEmail({
      to: email,
      subject: "Welcome",
      text: "",
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
          debug ? `: ${error}` : "",
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
      const token: string = user.generateTotp();

      const html = await ejs.renderFile(
        path.resolve(
          __dirname,
          "..",
          "..",
          "configs",
          "mail-templates",
          "auth",
          "verify.html",
        ),
        {
          token,
          link: `${FRONTEND_BASEURL}/auth/verify?token=${token}&email=${user.email}`,
          username: user.email,
          email: user.email,
          uuid: uuid(),
          FRONTEND_BASEURL,
        },
      );

      sendEmail({
        to: user.email,
        subject: "Verify your email",
        text: "",
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
        message: "Error trying to login".concat(debug ? `: ${error}` : ""),
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

      const generatedToken: string = user.generateTotp();

      const html = await ejs.renderFile(
        path.resolve(
          __dirname,
          "..",
          "..",
          "configs",
          "mail-templates",
          "auth",
          "verify.html",
        ),
        {
          token: generatedToken,
          link: `${FRONTEND_BASEURL}/auth/verify?token=${token}&email=${user.email}`,
          username: user.email,
          email: user.email,
          uuid: uuid(),
          FRONTEND_BASEURL,
        },
      );

      sendEmail({
        to: user.email,
        subject: "Verify your email",
        text: "",
        html,
      });

      return { status: true, message: "Check your email" };
    }

    if (!user.validateTotp(token)) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
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
          debug ? `: ${error}` : "",
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

    const token = user.generateTotp();

    const html = await ejs.renderFile(
      path.resolve(
        __dirname,
        "..",
        "..",
        "configs",
        "mail-templates",
        "auth",
        "reset.html",
      ),
      {
        token,
        link: `${FRONTEND_BASEURL}/auth/verify-reset?token=${token}`,
        uuid: uuid(),
      },
    );

    sendEmail({
      to: user.email,
      subject: "Reset Password",
      text: "",
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
          debug ? `: ${error}` : "",
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
      where: { token: { [Op.like]: `${token}_reset_%` } },
    });

    if (!user) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    if (!user.validateTotp(token)) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    const data: string = user.generateTotp();

    return {
      payload: { status: true, message: "Valid token", data },
      code: 202,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to login".concat(debug ? `: ${error}` : ""),
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
      where: { token: { [Op.like]: `${token}_update_%` } },
    });

    if (!user) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    if (!user.validateTotp(token)) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    const update: any = { password };
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
          debug ? `: ${error}` : "",
        ),
      },
      code: 500,
    };
  }
};
