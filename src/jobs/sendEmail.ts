import { jobs, mail } from "../helpers";
import { EmailQueue } from "./queues";

export const sendEmail = async ({ to, text, subject, html }) => {
  const queueName = "sendEmail";

  await jobs.add({
    queue: EmailQueue,
    options: {
      attempts: 10,
      backoff: 30 * 1000,
    },
    queueName,
    data: null,
  });

  await jobs.process({
    queueName,
    queue: EmailQueue,
    callback: async () => {
      const sent = await mail.pepipost.send({
        to,
        text,
        subject,
        html,
      });
      if (!sent) throw new Error("Email not sent");
    },
  });
};
