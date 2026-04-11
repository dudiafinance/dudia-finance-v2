import { NextResponse } from "next/server";

export async function GET() {
  throw new Error("Sentry Debug Error: Teste de integração DUDIA");
  return NextResponse.json({ message: "Este código nunca será executado" });
}