import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET /api/whatsapp/status - Get current WhatsApp status from backend HTTP API
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ status: "backend_offline", qr: null, user: null }, { status: 401 });
    }

    const backendApiUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8081";
    const res = await fetch(`${backendApiUrl}/api/status?deviceId=${userId}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ status: "backend_offline", qr: null, user: null });
    }

    const data = await res.json();
    return NextResponse.json({
      status: data.status || "disconnected",
      qr: data.qr || null,
      user: data.user || null,
    });
  } catch {
    return NextResponse.json({ status: "backend_offline", qr: null, user: null });
  }
}
