import { config } from "dotenv";
config({ path: ".env.local" });

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: parseInt(process.env.BREVO_SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

const FromEmail = process.env.FROM_EMAIL || "noreply@dudiafinance.com";
const APP_NAME = "DUD.IA Finance";

async function sendWelcomeEmail(to: string, name: string) {
  console.log(`Enviando e-mail para ${to}...`);
  console.log(`SMTP Host: ${process.env.BREVO_SMTP_HOST}`);
  console.log(`SMTP User: ${process.env.BREVO_SMTP_USER}`);
  console.log(`From: ${FromEmail}`);

  const result = await transporter.sendMail({
    to,
    from: FromEmail,
    subject: `Bem-vindo ao ${APP_NAME}! 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10B981; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">DUD.IA Finance</h1>
        </div>
        <div style="background: white; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Olá, ${name}! 👋</h2>
          <p style="color: #475569;">Sua conta foi criada com sucesso. Bem-vindo ao DUD.IA Finance, seu sistema de controle financeiro pessoal com IA.</p>
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Acessar Dashboard
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            Em caso de dúvidas, responda este e-mail.
          </p>
        </div>
      </div>
    `,
  });

  console.log("E-mail enviado com sucesso!");
  console.log("Message ID:", result.messageId);
  console.log("Response:", result.response);
}

sendWelcomeEmail("igorpminacio1@gmail.com", "Igor")
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Erro ao enviar e-mail:", err);
    process.exit(1);
  });