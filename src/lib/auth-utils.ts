import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

/**
 * Centralised helper – extracts the internal UUID from the Clerk session.
 * Returns `null` when there is no authenticated user.
 */
export async function getUserId(): Promise<string | null> {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) return null;

  // Busca o UUID local vinculado a este ID do Clerk
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
    columns: { id: true }
  });

  return user?.id ?? null;
}
