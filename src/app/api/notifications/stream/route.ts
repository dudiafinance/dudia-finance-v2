import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        if (!isClosed) {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        }
      };

      const sendHeartbeat = () => {
        if (!isClosed) {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        }
      };

      const fetchAndSend = async () => {
        try {
          const data = await db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(20);

          sendEvent("notifications", data);
        } catch {
        }
      };

      await fetchAndSend();

      const heartbeatInterval = setInterval(sendHeartbeat, 15000);

      const close = () => {
        isClosed = true;
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch {
        }
      };

      req.signal.addEventListener("abort", close);

      setTimeout(() => {
        close();
      }, 25000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}