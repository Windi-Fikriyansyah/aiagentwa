import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get the conversation to find the JID
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Call the backend API
    const backendApiUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8081";
    const backendRes = await fetch(`${backendApiUrl}/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-auth": "true"
      },
      body: JSON.stringify({
        chatId: conversation.jid,
        message
      })
    });

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json({ error: errorData.error || "Failed to send message via backend" }, { status: backendRes.status });
    }

    const result = await backendRes.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
