import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function main() {
  try {
    const buffer = Buffer.from("Hello world", "utf-8");
    const filename = "test.txt";
    
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
    console.log("Upload URL:", uploadUrl);
    if (!uploadUrl) {
       console.log("Error initRes:", await initRes.text());
       return;
    }

    // 2. Upload the bytes
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Length': buffer.length.toString(),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize'
      },
      body: buffer
    });
    
    const fileData = await uploadRes.json();
    console.log("Response:", fileData);
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
