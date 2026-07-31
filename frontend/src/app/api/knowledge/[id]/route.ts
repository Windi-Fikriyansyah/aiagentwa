import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

// DELETE /api/knowledge/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const source = await prisma.knowledgeSource.findUnique({
      where: { id },
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
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
