import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/devices - Get all devices
export async function GET() {
  try {
    const devices = await prisma.device.findMany({
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
    const body = await request.json();
    const { jid, phoneNumber, name, status } = body;

    const device = await prisma.device.upsert({
      where: { jid: jid || "" },
      update: {
        phoneNumber,
        name: name || "WhatsApp Device",
        status: status || "connected",
        connectedAt: status === "connected" || status === "ready" ? new Date() : undefined,
        lastSeenAt: new Date(),
      },
      create: {
        jid,
        phoneNumber,
        name: name || "WhatsApp Device",
        status: status || "connected",
        connectedAt: new Date(),
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json(device);
  } catch (error) {
    console.error("Failed to save device:", error);
    return NextResponse.json({ error: "Failed to save device" }, { status: 500 });
  }
}

// DELETE /api/devices - Delete all devices when disconnected
export async function DELETE() {
  try {
    await prisma.device.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete devices:", error);
    return NextResponse.json({ error: "Failed to delete devices" }, { status: 500 });
  }
}

