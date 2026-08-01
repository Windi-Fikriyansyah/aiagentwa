import { Pinecone } from '@pinecone-database/pinecone';
import { logger } from './logger';

export async function retrieveRelevantContext(query: string, topK: number = 3): Promise<string> {
  try {
    // Fetch AI config from Next.js backend
    const settingsRes = await fetch('http://localhost:3000/api/settings', {
      headers: { "x-internal-auth": "true" }
    });
    const user: any = await settingsRes.json();

    if (!user?.openrouterApiKey || !user?.openrouterEmbedModel || !process.env['PINECONE_API_KEY']) {
      logger.warn('RAG retrieval skipped: Missing OpenRouter config or PINECONE_API_KEY');
      return '';
    }

    const OPENROUTER_API_KEY = user.openrouterApiKey;
    const EMBED_MODEL = user.openrouterEmbedModel;

    const pinecone = new Pinecone({
      apiKey: process.env['PINECONE_API_KEY'] as string,
    });
    const indexName = process.env['PINECONE_INDEX'] || 'whatsapp-bot';
    const index = pinecone.index(indexName);

    // Embed the query
    const embeddingsRes = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: EMBED_MODEL,
        input: query
      })
    });

    const embeddingsData: any = await embeddingsRes.json();
    if (!embeddingsRes.ok) {
      throw new Error(`OpenRouter Embedding failed: ${JSON.stringify(embeddingsData)}`);
    }

    const queryEmbedding = embeddingsData.data[0].embedding;

    // Search Pinecone
    const searchRes = await index.query({
      topK,
      vector: queryEmbedding,
      includeMetadata: true
    });

    if (!searchRes.matches || searchRes.matches.length === 0) {
      logger.info('RAG retrieval returned 0 matches from Pinecone.');
      return '';
    }

    logger.info(`RAG retrieval found ${searchRes.matches.length} matches from Pinecone.`);

    // Combine retrieved texts
    let contextStr = "--- CONTEXT KNOWLEDGE BASE ---\n";
    for (const match of searchRes.matches) {
      if (match.metadata && match.metadata['text']) {
        contextStr += match.metadata['text'] + "\n\n";
      }
    }
    contextStr += "--------------------------------\n";
    
    return contextStr;
  } catch (error: any) {
    logger.error('Error retrieving RAG context', { error: error.message || String(error), stack: error.stack });
    return '';
  }
}
