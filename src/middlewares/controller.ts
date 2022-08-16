import { Response } from "express";
import { debug } from "../configs/env";
import { response } from "../helpers";
import { CustomRequest } from "../types/controllers";

export const controller = (fn: Function) => async (req: CustomRequest, res: Response) => {
  try {
    const data = await fn(req.form);

    if (data.code) {
      const { code, payload } = data;
      return response(res, payload, code, debug);
    }

    const code = data.status ? 200 : 400;
    return response(res, data, code, debug);
  } catch (error) {
    return response(
      res,
      { status: false, message: "Internal server error", error },
      500,
      debug,
    );
  }
};
