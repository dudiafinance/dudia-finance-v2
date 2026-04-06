import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM_EMAIL = "dudiafinance@yahoo.com";
const APP_NAME = "DUD.IA Finance";

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  await sgMail.send({
    to,
    from: FROM_EMAIL,
    subject: `${APP_NAME} — Redefinição de Senha`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10B981; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">DUD.IA Finance</h1>
        </div>
        <div style="background: white; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Olá, ${name}!</h2>
          <p style="color: #475569;">Recebemos uma solicitação para redefinir a senha da sua conta.</p>
          <p style="color: #475569;">Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>1 hora</strong>.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Redefinir Senha
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            Se você não solicitou a redefinição de senha, ignore este e-mail.<br>
            O link expira em 1 hora.
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<void> {
  await sgMail.send({
    to,
    from: FROM_EMAIL,
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
}
