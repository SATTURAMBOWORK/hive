import { Router } from "express";
import {
	login,
	register,
	resendRegistrationOtp,
	verifyRegistration
} from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/verify-registration", verifyRegistration);
authRouter.post("/resend-registration-otp", resendRegistrationOtp);

export { authRouter };
