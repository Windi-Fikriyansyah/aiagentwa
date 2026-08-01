import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const internalKey = request.headers.get("x-internal-auth");
  if (internalKey !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.user.findFirst();
  return NextResponse.json(profile || {});
}
