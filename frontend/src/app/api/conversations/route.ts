import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserId, isValidInternalAuth, verifyDeviceOwnership } from "@/lib/auth-helpers";

// GET /api/conversations
// Retrieves a list of all conversations for a specific device or user
export async function GET(request: Request) {
  try {
    const isInternal = isValidInternalAuth(request);
    const userId = await getAuthUserId();

    if (!userId && !isInternal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");

    const whereClause: any = {};

    if (deviceId) {
      // If user is logged in, verify device belongs to them
      if (userId && !isInternal) {
        const device = await verifyDeviceOwnership(deviceId, userId);
        if (!device) {
          return NextResponse.json({ error: "Unauthorized device access" }, { status: 403 });
        }
      }
      whereClause.deviceId = deviceId;
    } else if (userId && !isInternal) {
      // No deviceId specified: return conversations for all user's devices
      whereClause.device = { userId };
    }
    // If internal, no filter (return all)

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
    const isInternal = isValidInternalAuth(request);
    if (!isInternal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { deviceJid, customerJid, customerName, leadStatus, message, targetUserId } = body;

    if (!deviceJid || !customerJid || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Find the device
    let device = await prisma.device.findUnique({
      where: { jid: deviceJid },
    });

    if (!device && targetUserId) {
      console.warn(`Device not found for JID: ${deviceJid}. Attempting to fallback by targetUserId: ${targetUserId}`);
      device = await prisma.device.findFirst({
        where: { userId: targetUserId }
      });
    }

    if (!device) {
      return NextResponse.json({ error: `Device not found (JID: ${deviceJid}) and no fallback available for targetUserId: ${targetUserId || 'none'}` }, { status: 404 });
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
