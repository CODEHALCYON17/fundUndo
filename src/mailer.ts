import nodemailer from "nodemailer";

export async function sendDigestEmail(subject: string, html: string, text: string): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, DIGEST_TO, DIGEST_FROM } =
    process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !DIGEST_TO) {
    throw new Error(
      "Missing SMTP config. Set SMTP_HOST, SMTP_USER, SMTP_PASS, DIGEST_TO in .env (see .env.example)."
    );
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: SMTP_SECURE !== "false",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: DIGEST_FROM || SMTP_USER,
    to: DIGEST_TO,
    subject,
    html,
    text,
  });
}
