import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isValidInternalAuth } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    if (!isValidInternalAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: {
        mayarApiKey: {
          not: null,
          notIn: ["", "your_mayar_api_key_here"]
        }
      },
      select: {
        id: true,
        mayarApiKey: true
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
