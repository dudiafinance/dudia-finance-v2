import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
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

  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) return null;

    // 1. Tenta buscar pelo vínculo direto de ID (Rápido)
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
      columns: { id: true }
    });

    if (user) return user.id;

    // 2. Fallback: Se não encontrou o ID, tenta sincronizar pelo e-mail da sessão atual
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    const firstName = clerkUser?.firstName;
    const lastName = clerkUser?.lastName;
    const imageUrl = clerkUser?.imageUrl;

    if (email) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
        columns: { id: true, clerkId: true }
      });

      if (existingUser) {
        // Atualiza o clerkId se não estiver definido
        if (!existingUser.clerkId) {
          try {
            await db.update(users)
              .set({ clerkId, updatedAt: new Date() })
              .where(eq(users.id, existingUser.id));
            console.log(`[Auth] Sincronizado Clerk ID para usuário: ${email}`);
          } catch (updateErr) {
            console.warn("[Auth] Erro não-crítico ao atualizar clerkId:", updateErr);
          }
        }
        return existingUser.id;
      }

      // 3. CRÍTICO: Se o usuário não existe no DB mas está autenticado no Clerk,
      // cria o usuário automaticamente. Isso resolve casos onde o webhook falhou
      // ou ainda não foi processado.
      try {
        const [newUser] = await db.insert(users).values({
          email,
          clerkId,
          name: `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Usuário',
          avatar: imageUrl ?? null,
        }).returning({ id: users.id });
        
        console.log(`[Auth] Criado novo usuário via fallback: ${email}`);
        return newUser.id;
      } catch (createErr) {
        console.error("[Auth] Erro ao criar usuário via fallback:", createErr);
        console.error("[Auth] clerkId:", clerkId);
        console.error("[Auth] email:", email);
        console.error("[Auth] firstName:", firstName);
        console.error("[Auth] lastName:", lastName);
      }
    }

    return null;
  } catch (error) {
    console.error("[Auth] Erro crítico em getUserId:", error);
    return null;
  }
}
