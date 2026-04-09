import { handlers } from "@/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const originalPOST = handlers.POST;

export const POST = async (req: NextRequest) => {
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  
  if (!rl.success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 }
    );
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (originalPOST as any)(req);
};

export const { GET } = handlers;
