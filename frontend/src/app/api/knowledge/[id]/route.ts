import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { getAuthUserId, isValidInternalAuth } from "@/lib/auth-helpers";

// DELETE /api/knowledge/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isInternal = isValidInternalAuth(request);
    const userId = await getAuthUserId();

    if (!userId && !isInternal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const source = await prisma.knowledgeSource.findUnique({
      where: { id },
      include: { device: true },
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // Verify ownership: the source's device must belong to the user
    if (userId && !isInternal) {
      if (!source.device || source.device.userId !== userId) {
        return NextResponse.json({ error: "Unauthorized knowledge access" }, { status: 403 });
      }
    }

    // If it's a file, delete the physical file first
    if (source.type === "FILE" && source.filePath) {
      const fullPath = path.join(process.cwd(), "public", source.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    // Delete from database
    await prisma.knowledgeSource.delete({
      where: { id },
    });

    // Delete from Pinecone RAG Database
    const { deleteRAGSource } = await import("@/lib/rag");
    await deleteRAGSource(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete knowledge source:", error);
    return NextResponse.json({ error: "Failed to delete source" }, { status: 500 });
  }
}

