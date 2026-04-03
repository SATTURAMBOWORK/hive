import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  superAdminSignupKey: process.env.SUPER_ADMIN_SIGNUP_KEY || "",
  emailUser: process.env.EMAIL_USER || "",
  emailPass: process.env.EMAIL_PASS || "",
  emailFrom: process.env.EMAIL_FROM || "",
};

if (!env.mongoUri) {
  throw new Error("MONGO_URI is required in backend/.env");
}

if (!env.jwtSecret) {
  throw new Error("JWT_SECRET is required in backend/.env");
}
