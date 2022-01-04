import fetch from "node-fetch";
import { v4 as uuid } from "uuid";
const {
  MONNIFY_API_KEY,
  MONNIFY_SECERET,
  MONNIFY_CONTRACT_CODE,
  MONNIFY_WALLET_ACCOUNT_NUMBER,
} = process.env;
const baseURL = "https://sandbox.monnify.com/api";

const auth = async () => {
  let response: any = await fetch(`${baseURL}/v1/auth/login`, {
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${MONNIFY_API_KEY}:${MONNIFY_SECERET}`
      ).toString("base64")}`,
      "content-type": "application/json",
    },
    method: "post",
  });

  response = await response.json();

  return response;
};

const request = async ({ url, body = {}, method = "get" }) => {
  try {
    const r = await auth();

    const { requestSuccessful } = r;

    if (requestSuccessful) {
      const {
        responseBody: { accessToken },
      } = r;

      let response: any = await fetch(`${baseURL}/${url}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: Object.keys(body).length ? JSON.stringify(body) : null,
      });

      response = await response.json();

      response.status = response.requestSuccessful;
      response.data = response.responseBody;
      response.message = response.responseMessage;
      delete response.responseBody;
      delete response.responseMessage;
      delete response.requestSuccessful;
      delete response.responseCode;

      return response;
    }
    return { status: false, message: "Monnify request failed" };
  } catch (error) {
    return { status: false, message: "An error occured calling monnify" };
  }
};

export const reserveAccount = async ({ name, email }) => {
  return await request({
    url: "v2/bank-transfer/reserved-accounts",
    body: {
      accountReference: uuid(),
      accountName: `${name}'s Account`,
      currencyCode: "NGN",
      contractCode: MONNIFY_CONTRACT_CODE,
      customerEmail: email,
      customerName: name,
      getAllAvailableBanks: true,
    },
    method: "post",
  });
};

export const deallocateAccount = async ({ reference }) =>
  await request({
    url: `v1/bank-transfer/reserved-accounts/reference/${reference}`,
    method: "delete",
  });

export const getBanks = async () => await request({ url: "v1/banks" });

export const resolveBank = async ({ account_number, bank_code }) =>
  await request({
    url: `v1/disbursements/account/validate?accountNumber=${account_number}&bankCode=${bank_code}`,
  });

export const transfer = async ({
  account_number: destinationAccountNumber,
  bank_code: destinationBankCode,
  amount,
  reason: narration,
}) =>
  await request({
    url: `v2/disbursements/single`,
    body: {
      amount,
      reference: uuid(),
      narration,
      destinationBankCode,
      destinationAccountNumber,
      currency: "NGN",
      sourceAccountNumber: MONNIFY_WALLET_ACCOUNT_NUMBER,
    },
    method: "post",
  });
