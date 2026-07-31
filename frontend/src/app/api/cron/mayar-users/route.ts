import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const internalKey = request.headers.get("x-internal-auth");
    
    // Simple protection for internal API
    if (internalKey !== "true") {
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
