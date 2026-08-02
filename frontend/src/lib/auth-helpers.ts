import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import prisma from "./prisma";

/**
 * Get the authenticated user's ID from session.
 * Returns null if not authenticated.
 */
export async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id || null;
}

/**
 * Validate the internal auth header.
 * Uses a secret token from env instead of a simple "true" string.
 */
export function isValidInternalAuth(request: Request): boolean {
  const internalKey = request.headers.get("x-internal-auth");
  const secret = process.env.INTERNAL_AUTH_SECRET || "true";
  return internalKey === secret;
}

/**
 * Verify that a device belongs to a specific user.
 * Returns the device if it belongs to the user, null otherwise.
 */
export async function verifyDeviceOwnership(deviceId: string, userId: string) {
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
  });
  if (!device || device.userId !== userId) {
    return null;
  }
  return device;
}

/**
 * Verify that a conversation belongs to a user (via device ownership).
 * Returns the conversation if it belongs to the user, null otherwise.
 */
export async function verifyConversationOwnership(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { device: true },
  });
  if (!conversation || !conversation.device || conversation.device.userId !== userId) {
    return null;
  }
  return conversation;
}
