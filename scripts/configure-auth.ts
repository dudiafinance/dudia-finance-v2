import "dotenv/config";

const supabaseUrl = "https://gqevrvvqgeedtebmgbzk.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxZXZydnZxZ2VlZHRlYm1nYnprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ3ODExMSwiZXhwIjoyMDkxMDU0MTExfQ.TNHUFvh3mnYpartg0ZkY7VHwvKAr2QbN5yB9KF0vTBA";

async function configureAuth() {
  console.log("Configurando Supabase Auth...\n");

  // 1. Update site URL and redirect URLs
  const configResponse = await fetch(`${supabaseUrl}/auth/v1/admin/config`, {
    method: "PUT",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_url: "https://dudia-finance-v2-red.vercel.app",
      redirect_urls: [
        "https://dudia-finance-v2-red.vercel.app/auth/callback",
        "https://dudia-finance-v2-red.vercel.app",
      ],
    }),
  });

  if (configResponse.ok) {
    const config = await configResponse.json();
    console.log("✅ Redirect URLs configuradas:");
    console.log(JSON.stringify(config, null, 2));
  } else {
    const error = await configResponse.text();
    console.log("⚠️ Não foi possível configurar via API. Configure manualmente:");
    console.log("   Painel: Authentication → URL Configuration");
    console.log("   Redirect URL: https://dudia-finance-v2-red.vercel.app/auth/callback");
  }

  // 2. Update email template
  const templateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/templates/confirmation`, {
    method: "PUT",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: "Confirme seu email - DUD.IA Finance",
      content: `<h2>Bem-vindo ao DUD.IA Finance!</h2>
<p>Clique no botão abaixo para confirmar seu email:</p>
<p><a href="{{ .ConfirmationURL }}&email={{ .User.Email }}" style="background: #10B981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Confirmar Email</a></p>
<p>Se você não solicitou este email, ignore-o.</p>`,
    }),
  });

  if (templateResponse.ok) {
    console.log("\n✅ Template de email configurado!");
  } else {
    console.log("\n⚠️ Configure o template manualmente:");
    console.log("   Painel: Authentication → Email Templates → Confirm signup");
    console.log("   Redirect: {{ .ConfirmationURL }}&email={{ .User.Email }}");
  }
}

configureAuth().catch(console.error);