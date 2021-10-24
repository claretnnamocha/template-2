import fetch from "node-fetch";

const { NETCORE_API, EMAIL_FROM, EMAIL_NAME } = process.env;

export const send = async (
  to: string,
  subject: string,
  text: string,
  html: string = null,
  from: string = EMAIL_FROM,
  fromName: string = EMAIL_NAME
) => {
  try {
    const options = {
      method: "POST",
      headers: { api_key: NETCORE_API, "content-type": "application/json" },
      body: JSON.stringify({
        from: { email: from, name: fromName },
        subject,
        content: [{ type: "html", value: html }],
        personalizations: [{ to: [{ email: to }] }],
      }),
    };

    await fetch("https://api.pepipost.com/v5.1/mail/send", options);

    return true;
  } catch (e) {
    return false;
  }
};
