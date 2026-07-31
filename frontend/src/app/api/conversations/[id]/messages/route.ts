import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/conversations/[id]/messages
// Retrieves all messages for a specific conversation ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    
    // In a real app, verify the user has access to this conversation
    // via session checking.

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
