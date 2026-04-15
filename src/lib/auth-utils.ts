import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { users } from "./db/schema";
import { eq, or, sql } from "drizzle-orm";
import { headers } from "next/headers";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function findUserByClerkIdOrEmail(clerkId: string, email?: string) {
  if (email) {
    const normalizedEmail = normalizeEmail(email);
    return db.query.users.findFirst({
      where: or(
        eq(users.clerkId, clerkId),
        eq(users.email, normalizedEmail),
        sql`lower(${users.email}) = ${normalizedEmail}`
      ),
      columns: { id: true, clerkId: true }
    });
  }

  return db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
    columns: { id: true, clerkId: true }
  });
}

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
  const user = await findUserByClerkIdOrEmail(clerkId);

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

    const normalizedEmail = normalizeEmail(email);
    const userByEmailOriginal = await findUserByClerkIdOrEmail(clerkId, normalizedEmail);

    if (userByEmailOriginal) {
      // Atualiza clerkId quando ausente ou divergente
      if (!userByEmailOriginal.clerkId || userByEmailOriginal.clerkId !== clerkId) {
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
        email: normalizedEmail,
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

      // Corrida entre requests: se outro processo criou no intervalo, relê e retorna
      const recoveredUser = await findUserByClerkIdOrEmail(clerkId, normalizedEmail);
      if (recoveredUser) {
        return recoveredUser.id;
      }
    }
  } catch (error) {
    console.error("[Auth] Erro no fallback de autenticação:", error);
  }

  return null;
}
