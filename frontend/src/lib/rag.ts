import { Pinecone } from '@pinecone-database/pinecone';
import prisma from '@/lib/prisma';

export async function processAndUploadRAG(
  sourceId: string, 
  buffer: Buffer, 
  mimeType: string,
  urlContext?: string
) {
  try {
    const user = await prisma.user.findFirst();
    if (!user?.openrouterApiKey || !user?.openrouterEmbedModel) {
      console.warn("Skipping RAG: OpenRouter API Key or Embed Model not configured in Settings");
      return;
    }
    
    const OPENROUTER_API_KEY = user.openrouterApiKey;
    const EMBED_MODEL = user.openrouterEmbedModel;

    if (!process.env.PINECONE_API_KEY) {
      console.warn("Skipping RAG: PINECONE_API_KEY not set");
      return;
    }

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    const indexName = process.env.PINECONE_INDEX || 'whatsapp-bot';
    
    let textContent = '';

    // 1. Extract Text
    if (mimeType === 'application/pdf') {
      const pdfParseModule: any = await import('pdf-parse');
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const pdfData = await pdfParse(buffer);
      textContent = pdfData.text;
    } else {
      textContent = buffer.toString('utf-8');
    }

    if (!textContent || textContent.trim() === '') {
      console.warn("No text extracted for RAG processing.");
      return;
    }

    // 2. Chunking
    const chunks = chunkText(textContent, 800, 200);

    // 3. Embed and Push to Pinecone
    const index = pinecone.index(indexName);
    
    // Batch process to avoid hitting rate limits easily
    const batchSize = 100;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batchChunks = chunks.slice(i, i + batchSize);
      
      const embeddingsRes = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: EMBED_MODEL,
          input: batchChunks
        })
      });

      const embeddingsData = await embeddingsRes.json();
      if (!embeddingsRes.ok) {
        throw new Error(`OpenRouter Embedding failed: ${JSON.stringify(embeddingsData)}`);
      }

      const vectors = (embeddingsData.data || []).map((emb: any, idx: number) => ({
        id: `${sourceId}-chunk-${i + idx}`,
        values: emb.embedding,
        metadata: {
          sourceId,
          text: batchChunks[idx],
          url: urlContext || ''
        }
      })).filter((v: any) => v.values && v.values.length > 0);

      if (vectors.length === 0) {
        console.warn(`OpenRouter returned 0 vectors for batch ${i}. Response:`, JSON.stringify(embeddingsData).substring(0, 500));
      } else {
        await index.upsert({ records: vectors });
      }
    }

    console.log(`Successfully uploaded ${chunks.length} chunks to Pinecone for source ${sourceId}`);
  } catch (error) {
    console.error("Error in processAndUploadRAG:", error);
  }
}

// Basic text chunker
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    let chunk = text.slice(i, end);
    
    // Try to end at a period or newline if possible, but keep it simple for now
    chunks.push(chunk);
    
    i += (chunkSize - overlap);
  }
  return chunks;
}

// Function to delete a source from Pinecone
export async function deleteRAGSource(sourceId: string) {
  try {
    if (!process.env.PINECONE_API_KEY) {
      console.warn("Skipping Pinecone delete: PINECONE_API_KEY not set");
      return;
    }

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    const indexName = process.env.PINECONE_INDEX || 'whatsapp-bot';
    const index = pinecone.index(indexName);

    // Delete all vectors that have metadata.sourceId = sourceId
    await index.deleteMany({ filter: { sourceId } });
    console.log(`Successfully deleted RAG data for source ${sourceId}`);
  } catch (error) {
    console.error("Error deleting from Pinecone:", error);
  }
}
