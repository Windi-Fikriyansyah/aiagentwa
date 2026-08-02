import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserId, isValidInternalAuth } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  const isInternal = isValidInternalAuth(request);
  const sessionUserId = await getAuthUserId();

  if (!isInternal && !sessionUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // For internal calls, accept userId as query param (e.g., from backend AI service)
    let targetUserId = sessionUserId;
    if (isInternal) {
      const { searchParams } = new URL(request.url);
      const paramUserId = searchParams.get("userId");
      if (paramUserId) {
        targetUserId = paramUserId;
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "userId is required for internal requests" }, { status: 400 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    return NextResponse.json(profile || {});
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

