import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

/**
 * Centralised helper – extracts the internal UUID from the Clerk session.
 * Includes a fallback to sync the user if the webhook hasn't processed yet.
 */
export async function getUserId(): Promise<string | null> {
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

    if (email) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
        columns: { id: true }
      });

      if (existingUser) {
        // Tenta atualizar, mas não trava o fluxo se falhar (ex: concorrência)
        try {
          await db.update(users)
            .set({ clerkId, updatedAt: new Date() })
            .where(eq(users.id, existingUser.id));
          console.log(`[Auth] Sincronizado Clerk ID para usuário: ${email}`);
        } catch (updateErr) {
          console.warn("[Auth] Erro não-crítico ao atualizar clerkId:", updateErr);
        }
        
        return existingUser.id;
      }
    }

    return null;
  } catch (error) {
    console.error("[Auth] Erro crítico em getUserId:", error);
    return null;
  }
}
