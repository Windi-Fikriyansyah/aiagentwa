import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/conversations
// Retrieves a list of all conversations for a specific device or user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");
    
    // Require internal auth or valid session in a real app
    const internalKey = request.headers.get("x-internal-auth");
    
    if (!deviceId && internalKey !== "true") {
      return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
    }

    const whereClause = deviceId ? { deviceId } : {};

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        messages: {
          orderBy: { timestamp: "desc" },
          take: 1, // Get latest message for preview
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

// POST /api/conversations
// Used by the backend WhatsApp service to push new messages
export async function POST(request: Request) {
  try {
    // Only allow internal backend requests
    const internalKey = request.headers.get("x-internal-auth");
    if (internalKey !== "true") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { deviceJid, customerJid, customerName, leadStatus, message } = body;

    if (!deviceJid || !customerJid || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Find the device
    let device = await prisma.device.findUnique({
      where: { jid: deviceJid },
    });

    if (!device) {
      console.warn(`Device not found for JID: ${deviceJid}. Falling back to first available device.`);
      device = await prisma.device.findFirst();
      
      if (!device) {
        return NextResponse.json({ error: `Device not found (JID: ${deviceJid}) and no fallback available` }, { status: 404 });
      }
    }

    // 2. Upsert the conversation
    const updateData: any = {
      lastMessageAt: new Date(message.timestamp || Date.now()),
    };
    if (customerName) updateData.name = customerName;
    if (leadStatus) updateData.leadStatus = leadStatus;

    const conversation = await prisma.conversation.upsert({
      where: {
        jid_deviceId: {
          jid: customerJid,
          deviceId: device.id,
        },
      },
      update: updateData,
      create: {
        jid: customerJid,
        name: customerName || "Unknown Contact",
        deviceId: device.id,
        status: "open",
        leadStatus: leadStatus || "cold",
        lastMessageAt: new Date(message.timestamp || Date.now()),
      },
    });

    // 3. Create the message
    const newMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        from: message.from,
        to: message.to,
        content: message.content,
        type: message.type || "text",
        sender: message.sender || "user", // "user" | "ai" | "human"
        status: message.status || "sent",
        timestamp: new Date(message.timestamp || Date.now()),
      },
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error("Failed to save message:", error);
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }
}
