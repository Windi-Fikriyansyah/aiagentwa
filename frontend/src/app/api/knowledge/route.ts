import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isValidInternalAuth } from "@/lib/auth-helpers";

// GET /api/knowledge - Get all knowledge sources
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    
    const isInternal = isValidInternalAuth(request);

    if (!userId && !isInternal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");
    
    const targetUserId = isInternal ? (searchParams.get("userId") || userId) : userId;
    
    const whereClause: any = {};
    if (deviceId) {
      whereClause.deviceId = deviceId;
      if (!isInternal && targetUserId) {
        // Ensure device belongs to user
        const device = await prisma.device.findUnique({ where: { id: deviceId } });
        if (!device || device.userId !== targetUserId) {
          return NextResponse.json({ error: "Unauthorized device access" }, { status: 403 });
        }
      }
    } else if (targetUserId) {
      // If no deviceId provided, return all knowledge for all devices of the user
      whereClause.device = { userId: targetUserId };
    } else {
      // Internal call with no deviceId and no userId
      return NextResponse.json({ error: "deviceId or userId is required for internal requests" }, { status: 400 });
    }

    const sources = await prisma.knowledgeSource.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sources);
  } catch (error) {
    console.error("Failed to fetch knowledge sources:", error);
    return NextResponse.json({ error: "Failed to fetch sources" }, { status: 500 });
  }
}

// POST /api/knowledge - Add new knowledge source
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const type = formData.get("type") as string;
    const deviceId = formData.get("deviceId") as string | null;

    if (deviceId) {
      const device = await prisma.device.findUnique({ where: { id: deviceId } });
      if (!device || device.userId !== userId) {
        return NextResponse.json({ error: "Unauthorized device access" }, { status: 403 });
      }
    }
    
    const profile = await prisma.user.findUnique({ where: { id: userId } });
    const useOpenRouter = !!(profile?.openrouterApiKey);
    
    if (type === "URL") {
      const url = formData.get("url") as string;
      if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

      try {
        // Fetch HTML content
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        const html = await response.text();

        const cheerio = await import("cheerio");
        const $ = cheerio.load(html);
        
        // Remove scripts and styles
        $('script, style, noscript, iframe').remove();
        
        const title = $('title').text() || url;
        const textContent = $('body').text().replace(/\s+/g, ' ').trim();

        if (!textContent) {
          throw new Error("Could not extract any text content from URL");
        }

        // Create text file from extracted content
        const contentText = `Title: ${title}\nSource: ${url}\n\n${textContent}`;
        const buffer = Buffer.from(contentText, "utf-8");
        
        // Sanitize filename
        const safeTitle = title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
        const filename = `${Date.now()}_${safeTitle}.txt`;
        
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);

        // Upload to Gemini via raw REST API
        let geminiFileUri = null;
        if (!useOpenRouter) {
          try {
            // 1. Start Resumable Upload
            const initRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=resumable&key=${process.env.GEMINI_API_KEY}`, {
              method: 'POST',
              headers: {
                'X-Goog-Upload-Protocol': 'resumable',
                'X-Goog-Upload-Command': 'start',
                'X-Goog-Upload-Header-Content-Length': buffer.length.toString(),
                'X-Goog-Upload-Header-Content-Type': 'text/plain',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ file: { display_name: filename } })
            });
            
            const uploadUrl = initRes.headers.get('x-goog-upload-url');
            if (!uploadUrl) {
              const errText = await initRes.text();
              throw new Error(`No upload URL returned from Gemini. Status: ${initRes.status}, Body: ${errText}`);
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
              geminiFileUri = fileData.file.uri;
            } else {
              throw new Error(`Gemini upload failed: ${JSON.stringify(fileData)}`);
            }
          } catch (uploadErr: any) {
            console.error("Failed to upload to Gemini File API:", uploadErr);
            return NextResponse.json({ error: "Failed to upload to Gemini: " + uploadErr.message }, { status: 500 });
          }
        }

        // Save to database
        const source = await prisma.knowledgeSource.create({
          data: {
            name: title || url,
            type: "URL",
            status: "Synced",
            url: url,
            filePath: `/uploads/${filename}`,
            sizeBytes: buffer.length,
            geminiFileUri,
            deviceId,
          },
        });
        
        // RAG Processing for OpenRouter
        const { processAndUploadRAG } = await import("@/lib/rag");
        // Execute asynchronously so it doesn't block the response
        processAndUploadRAG(source.id, userId, buffer, "text/plain", url).catch(console.error);
        
        return NextResponse.json(source);
      } catch (err: any) {
        console.error("Web scraping failed:", err);
        // Save as error status if scraping failed
        await prisma.knowledgeSource.create({
          data: {
            name: url,
            type: "URL",
            status: "Error",
            url: url,
            deviceId,
          },
        });
        return NextResponse.json({ error: "Gagal memproses URL: " + err.message }, { status: 500 });
      }
    }
    
    if (type === "FILE") {
      const file = formData.get("file") as File;
      if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 });

      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      // ensure dir exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      // Upload to Gemini via raw REST API
      let geminiFileUri = null;
      if (!useOpenRouter) {
        try {
          let mimeType = "application/pdf";
          if (filename.endsWith(".txt")) mimeType = "text/plain";
          else if (filename.endsWith(".docx") || filename.endsWith(".doc")) mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          
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
            const errText = await initRes.text();
            throw new Error(`No upload URL returned. Status: ${initRes.status}, Error: ${errText}`);
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
            geminiFileUri = fileData.file.uri;
          } else {
            throw new Error(`Gemini upload failed: ${JSON.stringify(fileData)}`);
          }
        } catch (uploadErr: any) {
          console.error("Failed to upload to Gemini File API:", uploadErr);
          return NextResponse.json({ error: "Failed to upload to Gemini: " + uploadErr.message }, { status: 500 });
        }
      }

      const source = await prisma.knowledgeSource.create({
        data: {
          name: file.name,
          type: "FILE",
          status: "Synced",
          filePath: `/uploads/${filename}`,
          sizeBytes: file.size,
          geminiFileUri,
          deviceId,
        },
      });

      // RAG Processing for OpenRouter
      const { processAndUploadRAG } = await import("@/lib/rag");
      // Process RAG synchronously to catch errors
      await processAndUploadRAG(source.id, userId, buffer, file.type, "");

      return NextResponse.json(source);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Failed to save knowledge source:", error);
    return NextResponse.json({ error: "Failed to save source" }, { status: 500 });
  }
}
