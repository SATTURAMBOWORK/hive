import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  },
});

export async function sendOtpEmail({ to, otp, purpose = "verification" }) {
  const isLogin = purpose === "login";
  const subject = isLogin ? "Your SocietyHub sign-in code" : "Verify your SocietyHub account";
  const heading = isLogin ? "Your sign-in code" : "Verify your email";
  const context = isLogin
    ? "Use the code below to complete your sign in."
    : "Use the code below to verify your email and activate your account.";

  await transporter.sendMail({
    from: env.emailFrom,
    to,
    subject,
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
        <div style="margin-bottom:24px;">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#059669;border-radius:12px;">
            <span style="color:#ffffff;font-size:24px;">🏢</span>
          </div>
          <span style="margin-left:10px;font-size:18px;font-weight:800;color:#0f172a;vertical-align:middle;">SocietyHub</span>
        </div>
        <h2 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 8px;">${heading}</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 24px;">${context}</p>
        <div style="background:#f1f5f9;border-radius:12px;padding:20px;text-align:center;letter-spacing:0.4em;font-size:32px;font-weight:800;color:#0f172a;margin-bottom:24px;">
          ${otp}
        </div>
        <p style="font-size:12px;color:#94a3b8;margin:0;">This code expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}
