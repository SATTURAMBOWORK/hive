import { isRedisEnabled } from "../config/redis.js";
import { logger } from "../config/logger.js";
import { sendOtpEmail } from "../utils/mailer.js";
import { dequeueJob, enqueueJob } from "./redis-features.service.js";

const EMAIL_QUEUE = "email";
let workerStarted = false;

export async function enqueueOtpEmail({ to, otp, purpose = "verification" }) {
  if (!isRedisEnabled()) {
    await sendOtpEmail({ to, otp, purpose });
    return { queued: false };
  }

  await enqueueJob(EMAIL_QUEUE, {
    type: "otp",
    to,
    otp,
    purpose,
  });

  return { queued: true };
}

export function startEmailQueueWorker() {
  if (workerStarted || !isRedisEnabled()) return;
  workerStarted = true;

  logger.info("Redis email queue worker started");

  const loop = async () => {
    while (true) {
      try {
        const job = await dequeueJob(EMAIL_QUEUE, { timeoutSeconds: 5 });
        if (!job) continue;

        const payload = job.payload || job;
        if (payload.type === "otp") {
          await sendOtpEmail({
            to: payload.to,
            otp: payload.otp,
            purpose: payload.purpose || "verification",
          });
          continue;
        }

        logger.warn(`Unknown email queue job type: ${payload.type}`);
      } catch (error) {
        logger.error(`Email queue worker error: ${error.message}`);
      }
    }
  };

  loop();
}
