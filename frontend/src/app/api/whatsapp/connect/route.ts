import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// POST /api/whatsapp/connect - Trigger backend to start a WhatsApp session
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backendApiUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8081";
    const res = await fetch(`${backendApiUrl}/api/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-auth': process.env.INTERNAL_AUTH_SECRET || 'true'
      },
      body: JSON.stringify({ deviceId: userId })
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Backend failed to connect" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Connect API error:", error);
    return NextResponse.json({ error: "Failed to connect to backend" }, { status: 500 });
  }
}
