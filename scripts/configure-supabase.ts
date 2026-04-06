import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function configureSupabase() {
  console.log("Configurando Supabase...");
  console.log("URL:", supabaseUrl);

  // Test connection
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Erro ao conectar:", error);
    return;
  }

  console.log("Conexão OK! Usuários encontrados:", data.users.length);

  // Create a test user to verify email settings
  const testEmail = "test-confirmation@example.com";
  
  console.log("\n=== INSTRUÇÕES PARA CONFIGURAR NO PAINEL DO SUPABASE ===\n");
  console.log("1. Acesse: https://supabase.com/dashboard/project/gqevrvvqgeedtebmgbzk/auth/url-configuration");
  console.log("\n2. Em 'Redirect URLs', adicione:");
  console.log("   https://dudia-finance-v2-red.vercel.app/auth/callback");
  console.log("\n3. Acesse: https://supabase.com/dashboard/project/gqevrvvqgeedtebmgbzk/auth/providers");
  console.log("\n4. Ative 'Email' provider com:");
  console.log("   - Enable email confirmations: ON");
  console.log("   - Secure email change: ON");
  console.log("\n5. Acesse: https://supabase.com/dashboard/project/gqevrvvqgeedtebmgbzk/auth/templates");
  console.log("\n6. No template 'Confirm signup', configure o redirect:");
  console.log("   {{ .ConfirmationURL }}&email={{ .User.Email }}");
  console.log("\n===================================================\n");

  console.log("Configuração concluída!");
}

configureSupabase().catch(console.error);