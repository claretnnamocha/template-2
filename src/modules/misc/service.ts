import { devEnv } from "../../configs/env";
import { others } from "../../types/services";

/**
 * Ping server
 * @param {others.Ping} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const ping = async (params: others.Ping): Promise<others.Response> => {
  try {
    const { message } = params;
    return { status: true, message };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to ping server".concat(
          devEnv ? `: ${error}` : ""
        ),
      },
      code: 500,
    };
  }
};
