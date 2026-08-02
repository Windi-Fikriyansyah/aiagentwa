import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserId, isValidInternalAuth, verifyConversationOwnership } from "@/lib/auth-helpers";

// GET /api/conversations/[id]/messages
// Retrieves all messages for a specific conversation ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isInternal = isValidInternalAuth(request);
    const userId = await getAuthUserId();

    if (!userId && !isInternal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // Verify user has access to this conversation (via device ownership)
    if (userId && !isInternal) {
      const conversation = await verifyConversationOwnership(conversationId, userId);
      if (!conversation) {
        return NextResponse.json({ error: "Unauthorized conversation access" }, { status: 403 });
      }
    }

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

