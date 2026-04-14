import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { users } from "./db/schema";
import { eq, or } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * Centralised helper – extracts the internal UUID from the Clerk session.
 * Includes a fallback to sync the user if the webhook hasn't processed yet.
 */
export async function getUserId(): Promise<string | null> {
  // Debug Bypass for Agentic Testing — ONLY in non-production environments
  const h = await headers();
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.AIOX_DEBUG_TOKEN &&
    h.get("x-debug-bypass") === process.env.AIOX_DEBUG_TOKEN
  ) {
    return "debfc4b5-45eb-45dc-90d3-30a83d4e1064";
  }

  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    console.log("[Auth] No clerkId found in session");
    return null;
  }

  // 1. Tenta buscar pelo vínculo direto de ID (Rápido)
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
    columns: { id: true }
  });

  if (user) return user.id;

  console.log(`[Auth] clerkId ${clerkId} not found in DB, trying fallback...`);

  // 2. Fallback: Se não encontrou o ID, tenta sincronizar pelo e-mail da sessão atual
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      console.error("[Auth] currentUser() returned null even though auth() returned clerkId");
      return null;
    }
    
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    const firstName = clerkUser.firstName;
    const lastName = clerkUser.lastName;
    const imageUrl = clerkUser.imageUrl;

    console.log(`[Auth] Clerk user info: email=${email}, firstName=${firstName}, lastName=${lastName}`);

    if (!email) {
      console.error("[Auth] No email found in Clerk user");
      return null;
    }

    // Tenta encontrar usuário pelo email (case-insensitive seria melhor, mas Postgres é case-sensitive por padrão em text)
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
      columns: { id: true, clerkId: true }
    });

    // Se não encontrou com lowercase, tenta com o email original
    const userByEmailOriginal = existingUser || await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true, clerkId: true }
    });

    if (userByEmailOriginal) {
      // Atualiza o clerkId se não estiver definido
      if (!userByEmailOriginal.clerkId) {
        try {
          await db.update(users)
            .set({ clerkId, updatedAt: new Date() })
            .where(eq(users.id, userByEmailOriginal.id));
          console.log(`[Auth] Sincronizado Clerk ID para usuário: ${email}`);
        } catch (updateErr) {
          console.warn("[Auth] Erro não-crítico ao atualizar clerkId:", updateErr);
        }
      }
      return userByEmailOriginal.id;
    }

    // 3. CRÍTICO: Se o usuário não existe no DB mas está autenticado no Clerk,
    // cria o usuário automaticamente. Isso resolve casos onde o webhook falhou
    // ou ainda não foi processado.
    console.log(`[Auth] Creating new user for email: ${email}`);
    try {
      const [newUser] = await db.insert(users).values({
        email: email.toLowerCase(),
        clerkId,
        name: [firstName, lastName].filter(Boolean).join(' ') || 'Usuário',
        avatar: imageUrl ?? null,
      }).returning({ id: users.id });
      
      console.log(`[Auth] Criado novo usuário via fallback: ${email}, id: ${newUser.id}`);
      return newUser.id;
    } catch (createErr) {
      console.error("[Auth] Erro ao criar usuário via fallback:", createErr);
      console.error("[Auth] clerkId:", clerkId);
      console.error("[Auth] email:", email);
    }
  } catch (error) {
    console.error("[Auth] Erro no fallback de autenticação:", error);
  }

  return null;
}
