import { Router } from "express";
import {
	login,
	register,
	resendRegistrationOtp,
	verifyRegistration
} from "../controllers/auth.controller.js";
import { createRedisRateLimiter } from "../middlewares/redis-rate-limit.middleware.js";

const authRouter = Router();

const registerLimiter = createRedisRateLimiter({
	keyPrefix: "auth:register",
	windowSeconds: 60,
	maxRequests: 12,
	message: "Too many registration attempts. Please wait a minute and try again."
});

const loginLimiter = createRedisRateLimiter({
	keyPrefix: "auth:login",
	windowSeconds: 60,
	maxRequests: 20,
	message: "Too many login attempts. Please wait a minute and try again."
});

const verifyOtpLimiter = createRedisRateLimiter({
	keyPrefix: "auth:verify-otp",
	windowSeconds: 60,
	maxRequests: 15,
	message: "Too many OTP verification attempts. Please wait a minute and try again."
});

const resendOtpLimiter = createRedisRateLimiter({
	keyPrefix: "auth:resend-otp",
	windowSeconds: 60,
	maxRequests: 8,
	message: "Too many OTP resend attempts. Please wait a minute and try again."
});

authRouter.post("/register", registerLimiter, register);
authRouter.post("/login", loginLimiter, login);
authRouter.post("/verify-registration", verifyOtpLimiter, verifyRegistration);
authRouter.post("/resend-registration-otp", resendOtpLimiter, resendRegistrationOtp);

export { authRouter };
