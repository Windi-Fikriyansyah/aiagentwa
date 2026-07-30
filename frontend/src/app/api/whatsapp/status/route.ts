import { NextResponse } from "next/server";

// GET /api/whatsapp/status - Get current WhatsApp status from backend HTTP API
export async function GET() {
  try {
    const res = await fetch("http://127.0.0.1:8081/api/status", {
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
