import { v4 as uuid } from "uuid";
const { FRONTEND_BASEURL } = process.env;

export const registration = ({ token, username, email }) => {
  const link = `${FRONTEND_BASEURL}/verify/auth?token=${token}`;

  return {
    text: `Dear ${username}, Your registration on TemplateProject is successful. your token is ${token}`,
    html: `
      <p>
        Dear ${username},
        <span style="display: none !important">${uuid()}</span>
      </p>
      Your registration on TemplateProject is successful.<br>
      <span style="display: none !important">${uuid()}</span>
      <p>
        To verify to your email click here <a href="${link}">${link}</a>
        <span style="display: none !important">${uuid()}</span>
      </p>
      <p>
        Clicking this link will securely verify your account on ${FRONTEND_BASEURL} using ${email}
        <span style="display: none !important">${uuid()}</span>
      </p>
      <span style="display: none !important">${uuid()}</span>
    `,
  };
};

export const verifyEmail = ({ token, username, email }) => {
  const link = `${FRONTEND_BASEURL}/verify/auth?token=${token}`;

  return {
    text: `Dear ${username}, You requested to verify your email on TemplateProject. To verify to your email click here ${link}. Clicking this link will securely verify your account on ${FRONTEND_BASEURL} using ${email}`,
    html: `
      <p>
        Dear ${username},
        <span style="display: none !important">${uuid()}</span>
      </p>
        You requested to verify your email on TemplateProject.<br>
      <p>
        To verify to your email click here <a href="${link}">${link}</a>
        <span style="display: none !important">${uuid()}</span>
      </p>
      <p>
        Clicking this link will securely verify your account on ${FRONTEND_BASEURL} using ${email}
        <span style="display: none !important">${uuid()}</span>
      </p>
      <span style="display: none !important">${uuid()}</span>
    `,
  };
};

export const verifyPhone = ({ token, username }) =>
  `Dear ${username}, Your TemplateProject verification code is ${token}`;

export const resetPassword = ({ token, username }) => {
  const link = `${FRONTEND_BASEURL}/forgot-password?token=${token}`;

  return {
    text: `Dear ${username}, You requested to reset your password on TemplateProject. To reset to your password click here ${link}`,
    html: `
    <p>
      Dear ${username},
      <span style="display: none !important">${uuid()}</span>
    </p>
      You requested to reset your password on TemplateProject.<br>
    <p>
      To reset to your password, click here <a href="${link}">${link}</a>
      <span style="display: none !important">${uuid()}</span>
    </p>
    <span style="display: none !important">${uuid()}</span>
    `,
  };
};
