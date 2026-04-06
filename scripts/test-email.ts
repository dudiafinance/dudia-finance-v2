import nodemailer from "nodemailer";

async function testEmail() {
  console.log("=== Teste de configuração Brevo SMTP ===\n");
  
  console.log("Configurações:");
  console.log("Host:", process.env.BREVO_SMTP_HOST);
  console.log("Port:", process.env.BREVO_SMTP_PORT);
  console.log("User:", process.env.BREVO_SMTP_USER);
  console.log("Pass:", process.env.BREVO_SMTP_PASS ? "***configurado***" : "NÃO CONFIGURADO");
  console.log("From:", process.env.FROM_EMAIL);
  console.log("\n");

  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: parseInt(process.env.BREVO_SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
    logger: true,
    debug: true,
  });

  console.log("Verificando conexão SMTP...");
  
  try {
    await transporter.verify();
    console.log("✅ Conexão SMTP verificada com sucesso!\n");
  } catch (error) {
    console.error("❌ Erro na verificação SMTP:", error);
    return;
  }

  console.log("Enviando e-mail de teste para igorpminacio1@gmail.com...");
  
  try {
    const result = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: "igorpminacio1@gmail.com",
      subject: "Teste de Email - DUD.IA Finance",
      html: `
        <h1>Teste de Email</h1>
        <p>Este é um e-mail de teste enviado em ${new Date().toISOString()}</p>
        <p>Se você recebeu este e-mail, a configuração está funcionando!</p>
      `,
    });
    
    console.log("✅ E-mail enviado com sucesso!");
    console.log("Message ID:", result.messageId);
    console.log("Response:", result.response);
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
  }
}

import { config } from "dotenv";
config({ path: ".env.local" });

testEmail().catch(console.error);