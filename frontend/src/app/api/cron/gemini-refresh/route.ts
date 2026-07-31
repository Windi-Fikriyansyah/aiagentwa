import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import path from "path";
import fs from "fs";

// Helper function to get mime type from extension
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.csv') return 'text/csv';
  if (ext === '.json') return 'application/json';
  if (ext === '.md') return 'text/markdown';
  return 'text/plain';
}

export async function GET(request: Request) {
  try {
    const internalKey = request.headers.get("x-internal-auth");
    if (internalKey !== "true") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "No Gemini API Key" }, { status: 500 });
    }

    // Threshold: 40 hours ago
    const thresholdDate = new Date(Date.now() - 40 * 60 * 60 * 1000);

    const sources = await prisma.knowledgeSource.findMany({
      where: {
        status: "Synced",
        geminiFileUri: { not: null },
        updatedAt: { lt: thresholdDate }
      }
    });

    let successCount = 0;
    let failCount = 0;

    for (const source of sources) {
      if (!source.filePath) continue;

      const absolutePath = path.join(process.cwd(), "public", source.filePath);
      
      if (!fs.existsSync(absolutePath)) {
        console.error(`File not found for source ${source.id}: ${absolutePath}`);
        failCount++;
        continue;
      }

      const buffer = fs.readFileSync(absolutePath);
      const mimeType = getMimeType(absolutePath);
      const filename = path.basename(absolutePath);

      try {
        // 1. Start Resumable Upload
        const initRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=resumable&key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'X-Goog-Upload-Protocol': 'resumable',
            'X-Goog-Upload-Command': 'start',
            'X-Goog-Upload-Header-Content-Length': buffer.length.toString(),
            'X-Goog-Upload-Header-Content-Type': mimeType,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ file: { display_name: filename } })
        });
        
        const uploadUrl = initRes.headers.get('x-goog-upload-url');
        if (!uploadUrl) {
          throw new Error("No upload URL returned");
        }

        // 2. Upload the bytes
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'X-Goog-Upload-Offset': '0',
            'X-Goog-Upload-Command': 'upload, finalize'
          },
          body: buffer
        });
        
        const fileData = await uploadRes.json();
        if (fileData.file && fileData.file.uri) {
          // Update DB with new URI and new updatedAt
          await prisma.knowledgeSource.update({
            where: { id: source.id },
            data: { geminiFileUri: fileData.file.uri }
          });
          successCount++;
        } else {
          throw new Error("Upload failed");
        }
      } catch (uploadErr) {
        console.error(`Failed to refresh Gemini file for source ${source.id}:`, uploadErr);
        failCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: sources.length,
      successCount,
      failCount
    });
  } catch (error: any) {
    console.error("Gemini refresh cron failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
