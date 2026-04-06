import "dotenv/config";

const projectId = "gqevrvvqgeedtebmgbzk";
const supabaseUrl = `https://${projectId}.supabase.co`;
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxZXZydnZxZ2VlZHRlYm1nYnprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ3ODExMSwiZXhwIjoyMDkxMDU0MTExfQ.TNHUFvh3mnYpartg0ZkY7VHwvKAr2QbN5yB9KF0vTBA";

async function configureWithGoTrue() {
  console.log("Configurando Supabase Auth via GoTrue API...\n");

  // Try to update config using GoTrue admin API
  const goutineConfigUrl = `${supabaseUrl}/auth/v1/admin/config`;

  // Get current config first
  console.log("1. Obtendo configuração atual...");
  const getConfigResponse = await fetch(goutineConfigUrl, {
    method: "GET",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
    },
  });

  console.log("Status:", getConfigResponse.status);
  if (getConfigResponse.ok) {
    const currentConfig = await getConfigResponse.json();
    console.log("Config atual:", JSON.stringify(currentConfig, null, 2));
  } else {
    console.log("Erro:", await getConfigResponse.text());
  }

  // Update config
  console.log("\n2. Atualizando configuração...");
  const updateResponse = await fetch(goutineConfigUrl, {
    method: "PUT",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify({
      site_url: "https://dudia-finance-v2-red.vercel.app",
      uri_allow_list: [
        "https://dudia-finance-v2-red.vercel.app/auth/callback",
        "https://dudia-finance-v2-red.vercel.app",
      ].join(","),
    }),
  });

  console.log("Status:", updateResponse.status);
  if (updateResponse.ok) {
    const newConfig = await updateResponse.json();
    console.log("✅ Config atualizada:", JSON.stringify(newConfig, null, 2));
  } else {
    const error = await updateResponse.text();
    console.log("Erro ao atualizar:", error);
  }
}

configureWithGoTrue().catch(console.error);