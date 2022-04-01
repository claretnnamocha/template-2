import { jobs } from "../helpers";

export const EmailQueue = jobs.create({ queueName: "email" });
