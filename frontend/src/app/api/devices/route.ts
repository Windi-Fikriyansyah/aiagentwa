import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isValidInternalAuth } from "@/lib/auth-helpers";

// GET /api/devices - Get all devices
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    
    const isInternal = isValidInternalAuth(request);

    if (!userId && !isInternal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jid = searchParams.get("jid");
    const id = searchParams.get("id");

    const whereClause: any = {};
    if (jid) whereClause.jid = jid;
    if (id) whereClause.id = id;
    if (userId && !isInternal) whereClause.userId = userId;

    const devices = await prisma.device.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(devices);
  } catch (error) {
    console.error("Failed to fetch devices:", error);
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 });
  }
}

// POST /api/devices - Create or update a device
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    
    const isInternal = isValidInternalAuth(request);

    if (!userId && !isInternal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jid, phoneNumber, name, status, systemPrompt } = body;

    const defaultSystemPrompt = `Anda adalah Customer Service Virtual WhatsApp yang profesional, ramah, dan solutif.

Instruksi:
- Langsung jawab ke inti pertanyaan atau permintaan pengguna (to the point). Jangan selalu mengulang sapaan seperti "Halo" di setiap balasan.
- Berikan informasi yang akurat, singkat, dan berfokus pada solusi kebutuhan pelanggan.
- Gunakan format teks yang mudah dibaca polos (plain text) tanpa menggunakan tanda bintang untuk cetak tebal (contoh: jangan gunakan *teks* atau **teks**).
- Gunakan emoji yang relevan secukupnya.
- Selalu perhitungkan riwayat percakapan agar pelanggan tidak perlu mengulang informasi.
- Jika ada hal yang belum jelas, tanyakan detailnya secara sopan sebelum memberikan rekomendasi.`;

    const device = await prisma.device.upsert({
      where: { jid: jid || "" },
      update: {
        phoneNumber,
        name: name || "WhatsApp Device",
        status: status || "connected",
        systemPrompt: systemPrompt !== undefined ? systemPrompt : undefined,
        connectedAt: status === "connected" || status === "ready" ? new Date() : undefined,
        lastSeenAt: new Date(),
        userId: userId, // Ensure userId is attached if created via UI
      },
      create: {
        jid,
        phoneNumber,
        name: name || "WhatsApp Device",
        status: status || "connected",
        systemPrompt: systemPrompt !== undefined ? systemPrompt : defaultSystemPrompt,
        connectedAt: new Date(),
        lastSeenAt: new Date(),
        userId: userId,
      },
    });

    return NextResponse.json(device);
  } catch (error) {
    console.error("Failed to save device:", error);
    return NextResponse.json({ error: "Failed to save device" }, { status: 500 });
  }
}

// DELETE /api/devices - Delete all devices when disconnected
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    
    const isInternal = isValidInternalAuth(request);

    if (!userId && !isInternal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isInternal) {
      // Internal call from backend: delete all devices
      await prisma.device.deleteMany({});
    } else {
      // User call: delete only their devices
      await prisma.device.deleteMany({
        where: { userId }
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete devices:", error);
    return NextResponse.json({ error: "Failed to delete devices" }, { status: 500 });
  }
}
