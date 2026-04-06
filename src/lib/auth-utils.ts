import { auth } from "@/auth";

/**
 * Centralised helper – extracts the user ID from the session.
 * Returns `null` when there is no authenticated user.
 */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
